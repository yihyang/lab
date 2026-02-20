#!/usr/bin/env python3
"""
Step 5: Run Fine-Tuning with MLX-LM

Fine-tunes a model using LoRA on the sample dataset.
"""

import argparse
import os
import subprocess
import sys


def run_finetuning(
    model: str = "mlx-community/Llama-3.2-1B-Instruct-4bit",
    data_dir: str = "data",
    output_dir: str = "outputs/lora_finetuned",
    batch_size: int = 1,
    num_layers: int = 16,
    learning_rate: float = 1e-5,
    iters: int = 100,
    adapter_path: str = "outputs/adapters",
):
    """
    Run LoRA fine-tuning using mlx_lm lora command.

    Args:
        model: Base model to fine-tune
        data_dir: Directory containing train.jsonl and valid.jsonl
        output_dir: Directory to save the merged fine-tuned model
        batch_size: Training batch size
        num_layers: Number of layers to apply LoRA
        learning_rate: Learning rate
        iters: Number of training iterations
        adapter_path: Path to save LoRA adapters
    """

    print("=" * 60)
    print("LoRA Fine-Tuning with MLX-LM")
    print("=" * 60)
    print(f"Base model: {model}")
    print(f"Data directory: {data_dir}")
    print(f"Adapter path: {adapter_path}")
    print(f"Iterations: {iters}")
    print(f"Learning rate: {learning_rate}")
    print(f"Batch size: {batch_size}")
    print(f"LoRA layers: {num_layers}")
    print("-" * 60)

    # Check data exists
    train_path = os.path.join(data_dir, "train.jsonl")
    if not os.path.exists(train_path):
        print(f"[ERROR] Training data not found: {train_path}")
        return False

    # Create output directory
    os.makedirs(os.path.dirname(adapter_path), exist_ok=True)

    # Build command using the new mlx_lm lora format
    cmd = [
        "mlx_lm.lora",
        "--model", model,
        "--train",
        "--data", data_dir,
        "--batch-size", str(batch_size),
        "--num-layers", str(num_layers),
        "--learning-rate", str(learning_rate),
        "--iters", str(iters),
        "--adapter-path", adapter_path,
    ]

    print(f"\nRunning command:")
    print(" ".join(cmd))
    print("-" * 60)

    try:
        result = subprocess.run(cmd, check=True)
        print("\n" + "=" * 60)
        print("[SUCCESS] Fine-tuning completed!")
        print(f"Adapters saved to: {adapter_path}")
        print("=" * 60)
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Fine-tuning failed with exit code: {e.returncode}")
        return False


def main():
    parser = argparse.ArgumentParser(description="Run LoRA fine-tuning")
    parser.add_argument("--model", default="mlx-community/Llama-3.2-1B-Instruct-4bit")
    parser.add_argument("--data", default="data")
    parser.add_argument("--output", default="outputs/adapters")
    parser.add_argument("--batch-size", type=int, default=1)
    parser.add_argument("--num-layers", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=1e-5)
    parser.add_argument("--iters", type=int, default=100)

    args = parser.parse_args()

    success = run_finetuning(
        model=args.model,
        data_dir=args.data,
        output_dir=args.output,
        batch_size=args.batch_size,
        num_layers=args.num_layers,
        learning_rate=args.learning_rate,
        iters=args.iters,
        adapter_path=args.output,
    )

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
