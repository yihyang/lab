#!/usr/bin/env python3
"""
Step 5: Validate Fine-Tuned Model

Compares outputs from the base model and fine-tuned model
to see if the fine-tuning had the desired effect.
"""

import argparse
import json
import os
import sys


def validate_models(
    base_model: str,
    adapter_path: str,
    test_prompts: list[str],
    max_tokens: int = 128,
):
    """
    Compare outputs from base model and fine-tuned model.
    """

    print("=" * 70)
    print("Model Validation: Base vs Fine-Tuned")
    print("=" * 70)
    print(f"Base model: {base_model}")
    print(f"Adapter path: {adapter_path}")
    print(f"Max tokens: {max_tokens}")
    print("-" * 70)

    # Load models
    print("\n[1/2] Loading models...")

    try:
        from mlx_lm import load, generate

        print("  Loading base model...")
        base_model_obj, base_tokenizer = load(base_model)
        print("  [OK] Base model loaded")

        print("  Loading fine-tuned model (with adapters)...")
        ft_model, ft_tokenizer = load(base_model, adapter_path=adapter_path)
        print("  [OK] Fine-tuned model loaded")

    except Exception as e:
        print(f"[FAIL] Error loading models: {e}")
        return False

    # Generate and compare
    print("\n[2/2] Generating and comparing outputs...")
    print("-" * 70)

    results = []
    for i, prompt in enumerate(test_prompts, 1):
        print(f"\n--- Test {i}/{len(test_prompts)} ---")
        print(f"Prompt: {prompt[:80]}{'...' if len(prompt) > 80 else ''}")

        # Base model output
        base_output = generate(
            base_model_obj,
            base_tokenizer,
            prompt=prompt,
            max_tokens=max_tokens,
            verbose=False
        )

        # Fine-tuned model output
        ft_output = generate(
            ft_model,
            ft_tokenizer,
            prompt=prompt,
            max_tokens=max_tokens,
            verbose=False
        )

        print(f"\n[BASE MODEL]:")
        print(base_output[:300] + ("..." if len(base_output) > 300 else ""))
        print(f"\n[FINE-TUNED]:")
        print(ft_output[:300] + ("..." if len(ft_output) > 300 else ""))

        results.append({
            "prompt": prompt,
            "base_output": base_output,
            "finetuned_output": ft_output,
        })

    # Summary
    print("\n" + "=" * 70)
    print("Validation Complete")
    print("=" * 70)
    print(f"Tested {len(test_prompts)} prompts")
    print(f"Results saved to outputs/validation_results.json")

    # Save results
    os.makedirs("outputs", exist_ok=True)
    with open("outputs/validation_results.json", "w") as f:
        json.dump(results, f, indent=2)

    return True


# Test prompts similar to our training data
DEFAULT_TEST_PROMPTS = [
    "### Instruction:\nWrite a Python function to check if a string contains only digits.\n\n### Response:\n",
    "### Instruction:\nExplain what list comprehension is in Python.\n\n### Response:\n",
    "### Instruction:\nWrite a function to find the maximum element in a list.\n\n### Response:\n",
    "### Instruction:\nWhat is the difference between a set and a list?\n\n### Response:\n",
]


def main():
    parser = argparse.ArgumentParser(description="Validate fine-tuned model")
    parser.add_argument(
        "--base-model",
        default="mlx-community/Llama-3.2-1B-Instruct-4bit"
    )
    parser.add_argument(
        "--adapter-path",
        default="outputs/adapters"
    )
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=128
    )
    parser.add_argument(
        "--prompts-file",
        help="JSON file with list of test prompts"
    )

    args = parser.parse_args()

    # Load prompts
    if args.prompts_file:
        with open(args.prompts_file) as f:
            prompts = json.load(f)
    else:
        prompts = DEFAULT_TEST_PROMPTS

    success = validate_models(
        base_model=args.base_model,
        adapter_path=args.adapter_path,
        test_prompts=prompts,
        max_tokens=args.max_tokens,
    )

    if not success:
        sys.exit(1)


if __name__ == "__main__":
    main()
