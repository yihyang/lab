# TurboQuant Experimentation & Benchmarking

Benchmarks for [TurboQuant](https://github.com/hackimov/turboquant-kv) - Google's near-optimal KV cache quantization for LLM inference (ICLR 2026).

**Works on CUDA, MPS (Apple Silicon), and CPU.**

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run all benchmarks (auto-detects device: CUDA > MPS > CPU)
python run_benchmarks.py --model gpt2

# Compare baseline vs TurboQuant
python run_benchmarks.py --model gpt2 --compare

# Run individual benchmarks
python benchmarks/compression_benchmark.py --sweep
python benchmarks/accuracy_benchmark.py --model gpt2 --compare
python benchmarks/latency_benchmark.py --model gpt2 --compare
python benchmarks/memory_benchmark.py --model gpt2 --compare
```

## Device Support

| Device | Flag | Notes |
|--------|------|-------|
| **NVIDIA GPU** | `--device cuda` | Full support with Triton kernels |
| **Apple Silicon** | `--device mps` | MPS backend, no Triton required |
| **CPU** | `--device cpu` | Fallback, slower |

The benchmarks **auto-detect** the best available device if `--device` is not specified.

## Project Structure

```
turboquant-benchmarks/
├── README.md                    # This file
├── requirements.txt             # Dependencies
├── run_benchmarks.py            # Run all benchmarks
└── benchmarks/
    ├── utils.py                 # Device detection & utilities
    ├── compression_benchmark.py # Compression ratio & quality metrics
    ├── accuracy_benchmark.py    # Perplexity & Needle-in-a-Haystack
    ├── latency_benchmark.py     # TTFT & tokens/sec
    └── memory_benchmark.py      # Peak memory & KV cache footprint
```

## Benchmark Details

### 1. Compression Benchmark (`compression_benchmark.py`)

Measures compression quality and ratio.

```bash
# Single test
python benchmarks/compression_benchmark.py --seq-len 4096 --bits 3

# Full sweep across seq lengths and bit widths
python benchmarks/compression_benchmark.py --sweep
```

**Metrics:**
- Compression ratio (original vs quantized size)
- Bits per element achieved
- MSE on attention score matrix
- Cosine similarity of attention scores

### 2. Accuracy Benchmark (`accuracy_benchmark.py`)

Evaluates model quality with quantized KV cache.

```bash
# Perplexity only
python benchmarks/accuracy_benchmark.py --model gpt2 --perplexity

# Needle-in-a-Haystack only
python benchmarks/accuracy_benchmark.py --model gpt2 --needle

# Compare baseline vs TurboQuant
python benchmarks/accuracy_benchmark.py --model gpt2 --compare
```

**Metrics:**
- Perplexity on WikiText-2
- Needle-in-a-Haystack retrieval accuracy

### 3. Latency Benchmark (`latency_benchmark.py`)

Measures inference speed.

```bash
# With fused attention
python benchmarks/latency_benchmark.py --model gpt2 --fused

# Compare all modes (baseline, TQ, TQ+fused)
python benchmarks/latency_benchmark.py --model gpt2 --compare
```

**Metrics:**
- Time to First Token (TTFT)
- Tokens per second
- Time per token

### 4. Memory Benchmark (`memory_benchmark.py`)

Measures memory usage and efficiency.

```bash
# Single mode
python benchmarks/memory_benchmark.py --model gpt2 --kv-footprint

# Compare baseline vs TurboQuant
python benchmarks/memory_benchmark.py --model gpt2 --compare
```

**Metrics:**
- Peak GPU memory usage
- KV cache memory footprint
- Memory per token
- Tokens per GB (memory efficiency)

## Key Results Expected

| Metric | Baseline (FP16) | TurboQuant (3-bit) |
|--------|-----------------|-------------------|
| KV Cache Memory | ~2 bytes/element | ~0.4 bytes/element |
| Compression Ratio | 1x | 5-6x |
| Accuracy (cosine sim) | 1.0 | >0.85 |
| Perplexity Impact | baseline | <5% degradation |

## Findings So Far

Benchmarks run on Apple Silicon (MPS backend), March 2025.

| Benchmark | Status | Notes |
|-----------|--------|-------|
| Compression | Not run | Pending |
| Accuracy | Partial | Perplexity only (TQ 3-bit on Qwen2.5-7B): **5.07**. No baseline comparison or Needle-in-a-Haystack yet |
| Latency | Not run | Pending |
| Memory | Run | Baseline vs TQ on GPT-2 showed **no meaningful difference** (~0.244 GB both) |

**Key takeaway:** Memory and latency benchmarks require CUDA for `make_dynamic_cache` to activate KV cache compression. On MPS, the TurboQuant path falls back to uncompressed caching, so baseline and TQ results are effectively identical. Compression benchmarks (which test the core quantization math) should work fully on MPS and are the best next step.

## Notes

- **High MSE is expected** - TurboQuant optimizes dot products, not L2 reconstruction
- **Apple Silicon (M1/M2/M3/M4)**:
  - ✅ Core compression/decompression works via MPS with CPU fallback for QR operation
  - ⚠️ Full KV cache integration (`make_dynamic_cache`) requires Triton (CUDA-only)
  - Compression benchmarks work fully
  - Memory/latency benchmarks with KV cache compression require CUDA
- **GPT-2** is used for quick testing; use larger models (Llama, Mistral) for realistic benchmarks
- **Triton kernels** are CUDA-only; MPS uses PyTorch native operations with fallback
- All scripts **auto-detect** the best available device
- Set `PYTORCH_ENABLE_MPS_FALLBACK=1` for MPS support (handled automatically by benchmark scripts)

## Resources

- [TurboQuant GitHub](https://github.com/hackimov/turboquant-kv) - Recommended implementation
- [TurboQuant Google Research Blog](https://research.google/blog/turboquant/) - Official announcement
- [arXiv:2504.19874](https://arxiv.org/abs/2504.19874) - Original paper
