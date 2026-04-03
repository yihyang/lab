#!/usr/bin/env python3
"""
Latency Benchmark for TurboQuant KV Cache

Measures inference speed metrics:
- Time to First Token (TTFT)
- Tokens per second

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
import time
from pathlib import Path

import psutil
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).parent))
from utils import (
    get_device, synchronize, get_turboquant_device, print_device_info,
    clear_cache, get_memory_allocated_gb, enable_mps_fallback
)

# Enable MPS fallback for unsupported operations (required for TurboQuant on Apple Silicon)
enable_mps_fallback()


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
            print("Warning: turboquant not installed, using standard cache")
        except Exception as e:
            print(f"Warning: Could not enable TurboQuant: {e}")

    # Set model to eval mode (handle both raw model and TurboQuantModel wrapper)
    if hasattr(model, 'model'):
        model.model.eval()
    else:
        model.eval()
    return model, tokenizer


def measure_ttft(model, tokenizer, prompt: str, device: str) -> dict:
    """Measure Time to First Token."""
    inputs = tokenizer(prompt, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Handle TurboQuantModel wrapper
    actual_model = model.model if hasattr(model, 'model') else model

    # Warmup
    with torch.no_grad():
        _ = actual_model.generate(**inputs, max_new_tokens=1, do_sample=False)

    synchronize(device)
    clear_cache(device)

    # Measure
    start = time.perf_counter()
    with torch.no_grad():
        outputs = actual_model.generate(**inputs, max_new_tokens=1, do_sample=False)
    synchronize(device)
    ttft_ms = (time.perf_counter() - start) * 1000

    return {"ttft_ms": ttft_ms, "input_tokens": inputs["input_ids"].shape[1]}


def measure_generation_speed(
    model, tokenizer, prompt: str, max_new_tokens: int, device: str
) -> dict:
    """Measure tokens per second during generation."""
    inputs = tokenizer(prompt, return_tensors="pt")
    inputs = {k: v.to(device) for k, v in inputs.items()}

    # Handle TurboQuantModel wrapper
    actual_model = model.model if hasattr(model, 'model') else model

    # Warmup
    with torch.no_grad():
        _ = actual_model.generate(**inputs, max_new_tokens=10, do_sample=False)

    synchronize(device)
    clear_cache(device)

    mem_before = get_memory_allocated_gb(device)

    start = time.perf_counter()
    with torch.no_grad():
        outputs = actual_model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id,
        )
    synchronize(device)
    total_time = time.perf_counter() - start

    mem_after = get_memory_allocated_gb(device)

    output_tokens = outputs.shape[1] - inputs["input_ids"].shape[1]
    tokens_per_second = output_tokens / total_time
    time_per_token_ms = (total_time / output_tokens) * 1000

    return {
        "total_tokens": outputs.shape[1],
        "new_tokens": output_tokens,
        "total_time_s": total_time,
        "tokens_per_second": tokens_per_second,
        "time_per_token_ms": time_per_token_ms,
        "memory_before_gb": mem_before,
        "memory_after_gb": mem_after,
        "memory_delta_gb": mem_after - mem_before,
    }


def latency_benchmark(
    model_name: str = "gpt2",
    device: str = "cuda",
    use_turboquant: bool = False,
    bits: float = 3,
    prompt_lengths: list[int] = [128, 256, 512],
    max_new_tokens: int = 50,
) -> dict:
    """Run latency benchmark across different prompt lengths."""
    print(f"\nLoading model: {model_name}")
    print(f"TurboQuant: {use_turboquant}, bits: {bits}")

    model, tokenizer = load_model(
        model_name, device=device, use_turboquant=use_turboquant, bits=bits
    )

    base_text = "This is a sample sentence for testing. "
    results = []

    for prompt_len in prompt_lengths:
        tokens = []
        while len(tokens) < prompt_len:
            tokens.extend(tokenizer.encode(base_text))
        prompt = tokenizer.decode(tokens[:prompt_len])

        print(f"\nPrompt length: {prompt_len} tokens")

        ttft_result = measure_ttft(model, tokenizer, prompt, device)
        print(f"  TTFT: {ttft_result['ttft_ms']:.2f} ms")

        speed_result = measure_generation_speed(
            model, tokenizer, prompt, max_new_tokens, device
        )
        print(f"  Speed: {speed_result['tokens_per_second']:.2f} tok/s")
        print(f"  Time/token: {speed_result['time_per_token_ms']:.2f} ms")

        results.append({
            "prompt_length": prompt_len,
            "ttft_ms": ttft_result["ttft_ms"],
            "tokens_per_second": speed_result["tokens_per_second"],
            "time_per_token_ms": speed_result["time_per_token_ms"],
            "memory_delta_gb": speed_result["memory_delta_gb"],
        })

        gc.collect()
        clear_cache(device)

    # Cleanup
    del model
    clear_cache(device)

    return {
        "model": model_name,
        "turboquant": use_turboquant,
        "bits": bits,
        "results": results,
    }


def print_comparison_table(results: dict):
    """Print comparison table."""
    print("\n" + "=" * 80)
    print("LATENCY COMPARISON")
    print("=" * 80)

    prompt_lengths = [r["prompt_length"] for r in list(results.values())[0]["results"]]

    for prompt_len in prompt_lengths:
        print(f"\nPrompt Length: {prompt_len}")
        print(f"{'Mode':<20} {'TTFT (ms)':<12} {'Tok/s':<12} {'ms/tok':<12}")
        print("-" * 60)

        for mode, data in results.items():
            for r in data["results"]:
                if r["prompt_length"] == prompt_len:
                    print(f"{mode:<20} {r['ttft_ms']:<12.2f} "
                          f"{r['tokens_per_second']:<12.2f} "
                          f"{r['time_per_token_ms']:<12.2f}")

    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="TurboQuant Latency Benchmark")
    parser.add_argument("--model", type=str, default="gpt2", help="Model name")
    parser.add_argument("--device", type=str, default=None, help="Device")
    parser.add_argument("--bits", type=float, default=3, help="Quantization bits")
    parser.add_argument("--compare", action="store_true", help="Compare all modes")
    parser.add_argument("--prompt-lengths", type=int, nargs="+",
                        default=[128, 256, 512], help="Prompt lengths")
    parser.add_argument("--max-new-tokens", type=int, default=50, help="Max new tokens")
    args = parser.parse_args()

    if args.device is None:
        args.device = get_device()

    print_device_info(args.device)

    if args.compare:
        results = {}

        print("\n--- BASELINE (FP16) ---")
        results["baseline"] = latency_benchmark(
            args.model, args.device, use_turboquant=False,
            prompt_lengths=args.prompt_lengths,
        )

        print("\n--- TURBOQUANT ---")
        results["turboquant"] = latency_benchmark(
            args.model, args.device, use_turboquant=True, bits=args.bits,
            prompt_lengths=args.prompt_lengths,
        )

        print_comparison_table(results)
    else:
        results = latency_benchmark(
            args.model, args.device, use_turboquant=True, bits=args.bits,
            prompt_lengths=args.prompt_lengths,
            max_new_tokens=args.max_new_tokens,
        )

    with open("latency_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nResults saved to latency_results.json")


if __name__ == "__main__":
    main()
