#!/usr/bin/env python3
"""
Step 2: Test Base Model Inference

Downloads a small model and tests text generation.
This verifies you can load and run models before fine-tuning.
"""

import argparse
import sys


def test_inference(model_name: str, prompt: str, max_tokens: int = 256):
    """Load a model and generate text from a prompt."""

    print("=" * 60)
    print("Base Model Inference Test")
    print("=" * 60)
    print(f"Model: {model_name}")
    print(f"Max tokens: {max_tokens}")
    print("-" * 60)

    # Load model
    print("\n[1/3] Loading model...")
    try:
        from mlx_lm import load
        model, tokenizer = load(model_name)
        print("[OK] Model loaded successfully")
    except Exception as e:
        print(f"[FAIL] Failed to load model: {e}")
        return False

    # Generate text
    print("\n[2/3] Generating text...")
    print(f"Prompt: {prompt[:100]}{'...' if len(prompt) > 100 else ''}")

    try:
        from mlx_lm import generate
        output = generate(
            model,
            tokenizer,
            prompt=prompt,
            max_tokens=max_tokens,
            verbose=True
        )
        print("\n[OK] Generation complete")
    except Exception as e:
        print(f"[FAIL] Generation failed: {e}")
        return False

    # Show result
    print("\n[3/3] Result")
    print("-" * 60)
    print(output)
    print("-" * 60)

    return True


def main():
    parser = argparse.ArgumentParser(description="Test base model inference")
    parser.add_argument(
        "--model",
        default="mlx-community/Llama-3.2-1B-Instruct-4bit",
        help="Model to test (default: Llama 3.2 1B 4-bit)"
    )
    parser.add_argument(
        "--prompt",
        default="Write a haiku about coding.",
        help="Prompt for generation"
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=128,
        help="Maximum tokens to generate"
    )

    args = parser.parse_args()

    success = test_inference(args.model, args.prompt, args.max_tokens)

    if not success:
        print("\n[ERROR] Inference test failed!")
        sys.exit(1)
    else:
        print("\n[SUCCESS] Model inference working!")
        sys.exit(0)


if __name__ == "__main__":
    main()
