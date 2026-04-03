#!/usr/bin/env python3
"""
Compression Benchmark for TurboQuant KV Cache

Measures memory reduction ratio and compression quality metrics.
Works on CUDA, MPS (Apple Silicon), and CPU.
"""

# Enable MPS fallback BEFORE any torch imports (required for TurboQuant on Apple Silicon)
import os
if __name__ == "__main__":
    os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

import argparse
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import torch

# Add parent to path for utils import
sys.path.insert(0, str(Path(__file__).parent))
from utils import get_device, synchronize, get_turboquant_device, print_device_info, enable_mps_fallback

# Enable MPS fallback for unsupported operations (required for TurboQuant on Apple Silicon)
enable_mps_fallback()

from turboquant import TurboQuantProd


@dataclass
class CompressionResult:
    """Results from compression benchmark."""
    original_bytes: int
    compressed_bytes: int
    compression_ratio: float
    bits_per_element: float
    mse_scores: float
    cosine_similarity: float
    compression_time_ms: float
    decompression_time_ms: float


def get_tensor_memory(tensor: torch.Tensor) -> int:
    """Get memory usage of a tensor in bytes."""
    return tensor.element_size() * tensor.numel()


def measure_compression(
    batch_size: int = 1,
    num_heads: int = 8,
    seq_len: int = 4096,
    head_dim: int = 128,
    bits: int = 3,
    device: str = "cuda",
    seed: int = 42,
) -> CompressionResult:
    """
    Measure compression quality and ratio for a single K/V tensor pair.
    """
    torch.manual_seed(seed)

    # Create random K/V tensors (FP16 typical for LLM inference)
    k = torch.randn(batch_size, num_heads, seq_len, head_dim, dtype=torch.float16, device=device)
    v = torch.randn(batch_size, num_heads, seq_len, head_dim, dtype=torch.float16, device=device)

    # Initialize quantizer with TurboQuant-compatible device string
    tq_device = get_turboquant_device(device)
    quantizer = TurboQuantProd(bits=bits, head_dim=head_dim, device=tq_device)

    # Measure original memory (FP16 K + V)
    original_bytes = get_tensor_memory(k) + get_tensor_memory(v)
    total_elements = k.numel() + v.numel()

    # Measure compression time
    synchronize(device)
    start = time.perf_counter()
    compressed = quantizer.compress(k, v)
    synchronize(device)
    compression_time_ms = (time.perf_counter() - start) * 1000

    # Calculate theoretical compressed size (based on bits per element)
    # The PyPI package stores indices as int64, but the theoretical compression
    # would pack the bits. We calculate what the actual compressed size would be.
    # For n bits quantization: each element uses n/8 bytes
    compressed_bytes = int(total_elements * bits / 8)

    # Measure decompression time
    synchronize(device)
    start = time.perf_counter()
    k_rec, v_rec = quantizer.decompress(compressed)
    synchronize(device)
    decompression_time_ms = (time.perf_counter() - start) * 1000

    # Compute quality metrics on attention scores (not raw K/V)
    scale = head_dim ** -0.5
    k_float = k.float()
    k_rec_float = k_rec.float()

    scores_original = torch.matmul(k_float, k_float.transpose(-2, -1)) * scale
    scores_reconstructed = torch.matmul(k_rec_float, k_rec_float.transpose(-2, -1)) * scale

    # MSE on score matrix
    mse_scores = torch.mean((scores_original - scores_reconstructed) ** 2).item()

    # Cosine similarity on flattened scores
    scores_orig_flat = scores_original.flatten()
    scores_rec_flat = scores_reconstructed.flatten()
    cosine_sim = torch.nn.functional.cosine_similarity(
        scores_orig_flat.unsqueeze(0),
        scores_rec_flat.unsqueeze(0)
    ).item()

    # Calculate metrics
    actual_bits_per_element = (compressed_bytes * 8) / total_elements if compressed_bytes > 0 else bits
    compression_ratio = original_bytes / compressed_bytes if compressed_bytes > 0 else 0

    return CompressionResult(
        original_bytes=original_bytes,
        compressed_bytes=compressed_bytes,
        compression_ratio=compression_ratio,
        bits_per_element=actual_bits_per_element,
        mse_scores=mse_scores,
        cosine_similarity=cosine_sim,
        compression_time_ms=compression_time_ms,
        decompression_time_ms=decompression_time_ms,
    )


def run_benchmark_sweep(
    seq_lengths: list[int] = [512, 1024, 2048, 4096],
    bits_options: list[float] = [2, 2.5, 3, 4],
    head_dim: int = 128,
    num_heads: int = 8,
    device: str = "cuda",
) -> list[dict]:
    """Run compression benchmark across multiple configurations."""
    results = []

    for seq_len in seq_lengths:
        for bits in bits_options:
            print(f"Testing seq_len={seq_len}, bits={bits}...")

            try:
                result = measure_compression(
                    seq_len=seq_len,
                    bits=bits,
                    head_dim=head_dim,
                    num_heads=num_heads,
                    device=device,
                )

                results.append({
                    "seq_len": seq_len,
                    "bits": bits,
                    "compression_ratio": result.compression_ratio,
                    "bits_per_element": result.bits_per_element,
                    "mse_scores": result.mse_scores,
                    "cosine_similarity": result.cosine_similarity,
                    "compression_time_ms": result.compression_time_ms,
                    "decompression_time_ms": result.decompression_time_ms,
                })

                print(f"  Ratio: {result.compression_ratio:.2f}x, "
                      f"Cosine: {result.cosine_similarity:.4f}, "
                      f"MSE: {result.mse_scores:.4f}")

            except Exception as e:
                print(f"  Error: {e}")

    return results


def print_results_table(results: list[dict]):
    """Print results in a formatted table."""
    print("\n" + "=" * 80)
    print("COMPRESSION BENCHMARK RESULTS")
    print("=" * 80)
    print(f"{'Seq Len':<10} {'Bits':<6} {'Ratio':<8} {'BPE':<6} {'Cosine':<10} {'MSE':<10}")
    print("-" * 80)

    for r in results:
        print(f"{r['seq_len']:<10} {r['bits']:<6} {r['compression_ratio']:<8.2f} "
              f"{r['bits_per_element']:<6.2f} {r['cosine_similarity']:<10.4f} "
              f"{r['mse_scores']:<10.4f}")

    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="TurboQuant Compression Benchmark")
    parser.add_argument("--device", type=str, default=None, help="Device to use (cuda/mps/cpu)")
    parser.add_argument("--seq-len", type=int, default=4096, help="Sequence length")
    parser.add_argument("--bits", type=float, default=3, help="Quantization bits")
    parser.add_argument("--sweep", action="store_true", help="Run full sweep")
    parser.add_argument("--head-dim", type=int, default=128, help="Head dimension")
    parser.add_argument("--num-heads", type=int, default=8, help="Number of heads")
    args = parser.parse_args()

    # Auto-detect device if not specified
    if args.device is None:
        args.device = get_device()

    print_device_info(args.device)
    print(f"\nRunning compression benchmark...")

    if args.sweep:
        # Use smaller seq lengths for CPU/MPS
        if args.device in ["cpu", "mps"]:
            seq_lengths = [512, 1024, 2048]
            print("(Using smaller sequence lengths for CPU/MPS)")
        else:
            seq_lengths = [512, 1024, 2048, 4096, 8192]
        results = run_benchmark_sweep(device=args.device, seq_lengths=seq_lengths)
    else:
        result = measure_compression(
            seq_len=args.seq_len,
            bits=args.bits,
            head_dim=args.head_dim,
            num_heads=args.num_heads,
            device=args.device,
        )
        results = [{
            "seq_len": args.seq_len,
            "bits": args.bits,
            "compression_ratio": result.compression_ratio,
            "bits_per_element": result.bits_per_element,
            "mse_scores": result.mse_scores,
            "cosine_similarity": result.cosine_similarity,
            "compression_time_ms": result.compression_time_ms,
            "decompression_time_ms": result.decompression_time_ms,
        }]

    print_results_table(results)

    # Quality assessment
    avg_cosine = sum(r["cosine_similarity"] for r in results) / len(results)
    print(f"\nAverage cosine similarity: {avg_cosine:.4f}")
    print(f"Quality: {'GOOD' if avg_cosine > 0.85 else 'NEEDS IMPROVEMENT'}")


if __name__ == "__main__":
    main()
