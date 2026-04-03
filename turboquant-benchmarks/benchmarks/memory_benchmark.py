#!/usr/bin/env python3
"""
Memory Benchmark for TurboQuant KV Cache

Measures:
- Peak memory usage during inference
- KV cache memory footprint
- Memory efficiency (tokens per GB)

Works on CUDA, MPS (Apple Silicon), and CPU.
"""

# Enable MPS fallback BEFORE any torch imports (required for TurboQuant on Apple Silicon)
import os
if __name__ == "__main__":
    os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

import argparse
import gc
import json
import sys
from dataclasses import dataclass
from pathlib import Path

import psutil
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).parent))
from utils import (
    get_device, synchronize, get_turboquant_device, print_device_info,
    clear_cache, get_memory_allocated_gb, get_device_memory_gb, enable_mps_fallback
)

# Enable MPS fallback for unsupported operations (required for TurboQuant on Apple Silicon)
enable_mps_fallback()


@dataclass
class MemorySnapshot:
    """Memory usage at a point in time."""
    ram_gb: float
    device_allocated_gb: float = 0.0


def get_memory_snapshot(device: str) -> MemorySnapshot:
    """Capture current memory usage."""
    ram_gb = psutil.Process().memory_info().rss / 1024**3
    device_allocated = get_memory_allocated_gb(device)
    return MemorySnapshot(ram_gb, device_allocated)


def load_model(
    model_name: str,
    device: str = "cuda",
    use_turboquant: bool = False,
    bits: float = 3,
):
    """Load model with optional TurboQuant KV cache."""
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    clear_cache(device)
    mem_before = get_memory_snapshot(device)

    if device == "cuda":
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype=torch.float16,
            trust_remote_code=True,
        )
        model = model.to(device)

    mem_after_load = get_memory_snapshot(device)
    model_memory_gb = mem_after_load.device_allocated_gb - mem_before.device_allocated_gb
    if model_memory_gb == 0:
        model_memory_gb = mem_after_load.ram_gb - mem_before.ram_gb

    if use_turboquant:
        try:
            from turboquant import TurboQuantModel

            if hasattr(model.config, "head_dim"):
                head_dim = model.config.head_dim
            else:
                head_dim = model.config.hidden_size // model.config.num_attention_heads

            tq_device = get_turboquant_device(device)
            tq_wrapper = TurboQuantModel(model, bits=bits, head_dim=head_dim, device=tq_device)
            print(f"TurboQuant enabled: {bits} bits, head_dim={head_dim}")
            model = tq_wrapper
        except ImportError:
            print("Warning: turboquant not installed")
        except Exception as e:
            print(f"Warning: Could not enable TurboQuant: {e}")

    # Set model to eval mode (handle both raw model and TurboQuantModel wrapper)
    if hasattr(model, 'model'):
        model.model.eval()
    else:
        model.eval()
    return model, tokenizer, model_memory_gb


def measure_peak_memory(
    model,
    tokenizer,
    device: str = "cuda",
    context_lengths: list[int] = [512, 1024, 2048],
    use_turboquant_cache: bool = False,
) -> list[dict]:
    """Measure peak memory usage across different context lengths."""
    results = []
    base_text = "This is a sample sentence for memory testing. "

    # Handle TurboQuantModel wrapper
    actual_model = model.model if hasattr(model, 'model') else model
    tq_wrapper = model if hasattr(model, 'model') else None

    for ctx_len in context_lengths:
        tokens = []
        while len(tokens) < ctx_len:
            tokens.extend(tokenizer.encode(base_text))
        prompt = tokenizer.decode(tokens[:ctx_len])

        clear_cache(device)
        mem_before = get_memory_snapshot(device)

        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=ctx_len)
        inputs = {k: v.to(device) for k, v in inputs.items()}

        # Create TurboQuant cache if requested
        cache = None
        if use_turboquant_cache and tq_wrapper is not None:
            try:
                cache = tq_wrapper.make_dynamic_cache()
            except Exception as e:
                print(f"  Warning: Could not create TurboQuant cache: {e}")

        with torch.no_grad():
            if cache is not None:
                outputs = actual_model.generate(
                    **inputs,
                    max_new_tokens=50,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id,
                    past_key_values=cache,
                    use_cache=True,
                )
            else:
                outputs = actual_model.generate(
                    **inputs,
                    max_new_tokens=50,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id,
                )

        mem_after = get_memory_snapshot(device)

        # Get peak memory
        if device == "cuda":
            peak_memory = torch.cuda.max_memory_allocated() / 1024**3
            torch.cuda.reset_peak_memory_stats()
        else:
            peak_memory = mem_after.device_allocated_gb

        memory_delta = mem_after.device_allocated_gb - mem_before.device_allocated_gb

        results.append({
            "context_length": ctx_len,
            "memory_before_gb": mem_before.device_allocated_gb,
            "memory_after_gb": mem_after.device_allocated_gb,
            "memory_delta_gb": memory_delta,
            "peak_memory_gb": peak_memory,
            "tokens_per_gb": ctx_len / max(memory_delta, 0.001),
        })

        print(f"  ctx={ctx_len}: peak={peak_memory:.2f}GB, delta={memory_delta:.2f}GB")
        clear_cache(device)

    return results


def memory_efficiency_comparison(
    model_name: str = "gpt2",
    device: str = "cuda",
    bits: float = 3,
    context_lengths: list[int] = [512, 1024],
) -> dict:
    """Compare memory efficiency: baseline vs TurboQuant."""
    print("\n" + "=" * 60)
    print("MEMORY EFFICIENCY COMPARISON")
    print("=" * 60)

    results = {}

    print("\n--- BASELINE (FP16) ---")
    model, tokenizer, model_mem = load_model(
        model_name, device, use_turboquant=False
    )
    print(f"Model memory: {model_mem:.2f} GB")

    results["baseline"] = {
        "model_memory_gb": model_mem,
        "peak_memory": measure_peak_memory(model, tokenizer, device, context_lengths, use_turboquant_cache=False),
    }

    del model
    clear_cache(device)

    print("\n--- TURBOQUANT ---")
    model, tokenizer, model_mem = load_model(
        model_name, device, use_turboquant=True, bits=bits
    )
    print(f"Model memory: {model_mem:.2f} GB")

    results["turboquant"] = {
        "model_memory_gb": model_mem,
        "bits": bits,
        "peak_memory": measure_peak_memory(model, tokenizer, device, context_lengths, use_turboquant_cache=True),
    }

    del model
    clear_cache(device)

    return results


def print_memory_table(results: dict):
    """Print memory comparison table."""
    print("\n" + "=" * 80)
    print("MEMORY USAGE COMPARISON")
    print("=" * 80)

    ctx_lengths = [r["context_length"] for r in results["baseline"]["peak_memory"]]

    print(f"\n{'Context':<12} {'Baseline Peak':<16} {'TQ Peak':<16} {'Savings':<12} {'Savings %':<12}")
    print("-" * 70)

    for ctx in ctx_lengths:
        baseline_mem = next(
            (r["peak_memory_gb"] for r in results["baseline"]["peak_memory"]
             if r["context_length"] == ctx), 0
        )
        tq_mem = next(
            (r["peak_memory_gb"] for r in results["turboquant"]["peak_memory"]
             if r["context_length"] == ctx), 0
        )

        savings = baseline_mem - tq_mem
        savings_pct = (savings / max(baseline_mem, 0.001)) * 100 if baseline_mem > 0 else 0

        print(f"{ctx:<12} {baseline_mem:<16.2f} {tq_mem:<16.2f} "
              f"{savings:<12.2f} {savings_pct:<12.1f}%")

    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="TurboQuant Memory Benchmark")
    parser.add_argument("--model", type=str, default="gpt2", help="Model name")
    parser.add_argument("--device", type=str, default=None, help="Device")
    parser.add_argument("--bits", type=float, default=3, help="Quantization bits")
    parser.add_argument("--context-lengths", type=int, nargs="+",
                        default=[512, 1024], help="Context lengths to test")
    parser.add_argument("--compare", action="store_true", help="Compare baseline vs TQ")
    args = parser.parse_args()

    if args.device is None:
        args.device = get_device()

    print_device_info(args.device)

    if args.compare:
        results = memory_efficiency_comparison(
            args.model, args.device, args.bits, args.context_lengths
        )
        print_memory_table(results)
    else:
        print(f"\nLoading {args.model} with TurboQuant ({args.bits} bits)...")
        model, tokenizer, model_mem = load_model(
            args.model, args.device, use_turboquant=True, bits=args.bits
        )

        print(f"\nModel memory: {model_mem:.2f} GB")
        print("\nMeasuring peak memory...")
        peak_results = measure_peak_memory(
            model, tokenizer, args.device, args.context_lengths,
            use_turboquant_cache=True
        )

        print("\nResults:")
        for r in peak_results:
            print(f"  Context {r['context_length']}: "
                  f"peak={r['peak_memory_gb']:.2f}GB, "
                  f"delta={r['memory_delta_gb']:.2f}GB")

        results = {
            "model": args.model,
            "bits": args.bits,
            "model_memory_gb": model_mem,
            "peak_memory": peak_results,
        }

    with open("memory_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nResults saved to memory_results.json")


if __name__ == "__main__":
    main()
