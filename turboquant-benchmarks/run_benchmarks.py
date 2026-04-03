#!/usr/bin/env python3
"""
Run all TurboQuant benchmarks.

Usage:
    python run_benchmarks.py                    # Auto-detect device
    python run_benchmarks.py --model gpt2       # Use GPT-2
    python run_benchmarks.py --compare          # Compare baseline vs TQ

Works on CUDA, MPS (Apple Silicon), and CPU.
"""

import argparse
import subprocess
import sys
from pathlib import Path

# Add benchmarks to path for utils import
sys.path.insert(0, str(Path(__file__).parent / "benchmarks"))
from utils import get_device, print_device_info, enable_mps_fallback

# Enable MPS fallback for unsupported operations (required for TurboQuant on Apple Silicon)
enable_mps_fallback()


def run_command(cmd: list[str], description: str) -> bool:
    """Run a command and return success status."""
    print(f"\n{'=' * 60}")
    print(f"Running: {description}")
    print(f"Command: {' '.join(cmd)}")
    print("=" * 60)

    result = subprocess.run(cmd, capture_output=False)
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Run all TurboQuant benchmarks")
    parser.add_argument("--model", type=str, default="gpt2", help="Model name")
    parser.add_argument("--device", type=str, default=None, help="Device (auto-detect if not set)")
    parser.add_argument("--bits", type=float, default=3, help="Quantization bits")
    parser.add_argument("--compare", action="store_true", help="Compare baseline vs TQ")
    parser.add_argument("--compression", action="store_true", help="Run compression benchmark")
    parser.add_argument("--accuracy", action="store_true", help="Run accuracy benchmark")
    parser.add_argument("--latency", action="store_true", help="Run latency benchmark")
    parser.add_argument("--memory", action="store_true", help="Run memory benchmark")
    parser.add_argument("--all", action="store_true", help="Run all benchmarks")
    args = parser.parse_args()

    # Auto-detect device
    if args.device is None:
        args.device = get_device()

    print_device_info(args.device)

    # Default to all if none specified
    if not any([args.compression, args.accuracy, args.latency, args.memory]):
        args.all = True

    if args.all:
        args.compression = True
        args.accuracy = True
        args.latency = True
        args.memory = True

    script_dir = Path(__file__).parent / "benchmarks"
    results = {}

    # Build common args
    common_args = ["--device", args.device, "--bits", str(args.bits)]

    # Compression benchmark
    if args.compression:
        cmd = [sys.executable, str(script_dir / "compression_benchmark.py")] + common_args
        if args.compare:
            cmd.append("--sweep")
        results["compression"] = run_command(cmd, "Compression Benchmark")

    # Accuracy benchmark
    if args.accuracy:
        cmd = [sys.executable, str(script_dir / "accuracy_benchmark.py"),
               "--model", args.model] + common_args
        if args.compare:
            cmd.append("--compare")
        else:
            cmd.extend(["--perplexity", "--needle"])
        results["accuracy"] = run_command(cmd, "Accuracy Benchmark")

    # Latency benchmark
    if args.latency:
        cmd = [sys.executable, str(script_dir / "latency_benchmark.py"),
               "--model", args.model] + common_args
        if args.compare:
            cmd.append("--compare")
        results["latency"] = run_command(cmd, "Latency Benchmark")

    # Memory benchmark
    if args.memory:
        cmd = [sys.executable, str(script_dir / "memory_benchmark.py"),
               "--model", args.model] + common_args
        if args.compare:
            cmd.append("--compare")
        results["memory"] = run_command(cmd, "Memory Benchmark")

    # Summary
    print("\n" + "=" * 60)
    print("BENCHMARK SUMMARY")
    print("=" * 60)
    for name, success in results.items():
        status = "✓ PASSED" if success else "✗ FAILED"
        print(f"  {name}: {status}")

    failed = [k for k, v in results.items() if not v]
    if failed:
        print(f"\nFailed benchmarks: {', '.join(failed)}")
        sys.exit(1)
    else:
        print("\nAll benchmarks completed successfully!")


if __name__ == "__main__":
    main()
