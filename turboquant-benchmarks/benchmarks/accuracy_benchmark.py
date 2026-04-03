#!/usr/bin/env python3
"""
Accuracy Benchmark for TurboQuant KV Cache

Evaluates perplexity and downstream task accuracy using:
- Perplexity on WikiText-2
- Needle-in-a-Haystack (long context retrieval)

Works on CUDA, MPS (Apple Silicon), and CPU.
"""

# Enable MPS fallback BEFORE any torch imports (required for TurboQuant on Apple Silicon)
import os
if __name__ == "__main__":
    os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"

import argparse
import json
import sys
from pathlib import Path

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

sys.path.insert(0, str(Path(__file__).parent))
from utils import get_device, synchronize, get_turboquant_device, print_device_info, clear_cache, enable_mps_fallback

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

    # Use device_map for CUDA, manual placement for MPS/CPU
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

    print(f"  Model class: {model.__class__.__name__}")  # Debug

    if use_turboquant:
        try:
            from turboquant import TurboQuantModel

            if hasattr(model.config, "head_dim"):
                head_dim = model.config.head_dim
            else:
                head_dim = model.config.hidden_size // model.config.num_attention_heads

            tq_device = get_turboquant_device(device)
            tq_wrapper = TurboQuantModel(model, bits=bits, head_dim=head_dim, device=tq_device)
            print(f"TurboQuant enabled with {bits} bits, head_dim={head_dim}")
            # Keep reference to both wrapper and model
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


def compute_perplexity(
    model,
    tokenizer,
    text: str,
    max_length: int = 2048,
    device: str = "cuda",
) -> float:
    """Compute perplexity on a text sample."""
    encodings = tokenizer(text, return_tensors="pt", truncation=True, max_length=max_length)
    input_ids = encodings.input_ids.to(device)

    # Handle TurboQuantModel wrapper
    actual_model = model.model if hasattr(model, 'model') else model

    with torch.no_grad():
        outputs = actual_model(input_ids, labels=input_ids)

        # Debug output type
        print(f"  Output type: {type(outputs).__name__}")

        # Handle models that don't return loss directly
        if hasattr(outputs, 'loss') and outputs.loss is not None:
            loss = outputs.loss
        elif hasattr(outputs, 'logits'):
            # Compute cross-entropy loss manually
            logits = outputs.logits
            # Shift logits and labels for next-token prediction
            shift_logits = logits[..., :-1, :].contiguous()
            shift_labels = input_ids[..., 1:].contiguous()
            loss = torch.nn.functional.cross_entropy(
                shift_logits.view(-1, shift_logits.size(-1)),
                shift_labels.view(-1)
            )
        else:
            # Fallback: try to get hidden states and compute loss
            print(f"  Output keys: {list(outputs.keys()) if hasattr(outputs, 'keys') else 'N/A'}")
            raise ValueError(f"Model output does not have loss or logits: {type(outputs)}")

    return torch.exp(loss).item()


def perplexity_benchmark(
    model_name: str = "gpt2",
    device: str = "cuda",
    use_turboquant: bool = False,
    bits: float = 3,
) -> dict:
    """Run perplexity benchmark on WikiText-2."""
    print(f"\nLoading model: {model_name}")
    print(f"TurboQuant: {use_turboquant}, bits: {bits}")

    model, tokenizer = load_model(
        model_name,
        device=device,
        use_turboquant=use_turboquant,
        bits=bits,
    )

    # Load WikiText-2 test split
    try:
        from datasets import load_dataset
        dataset = load_dataset("wikitext", "wikitext-2-raw-v1", split="test")
        text = "\n\n".join(dataset["text"])
    except Exception as e:
        print(f"Could not load WikiText-2: {e}")
        print("Using sample text instead")
        text = """
        The quick brown fox jumps over the lazy dog.
        Machine learning is a subset of artificial intelligence.
        Natural language processing enables computers to understand human language.
        """ * 100

    text = "\n".join(line for line in text.split("\n") if line.strip())
    print(f"Computing perplexity on {len(text)} characters...")

    ppl = compute_perplexity(model, tokenizer, text, device=device)
    print(f"Perplexity: {ppl:.2f}")

    # Cleanup
    del model
    clear_cache(device)

    return {
        "model": model_name,
        "turboquant": use_turboquant,
        "bits": bits,
        "perplexity": ppl,
    }


def needle_in_haystack_benchmark(
    model_name: str = "gpt2",
    device: str = "cuda",
    use_turboquant: bool = False,
    bits: float = 3,
    context_lengths: list[int] = [512, 1024],
    needle_depths: list[float] = [0.0, 0.5, 1.0],
) -> dict:
    """Run Needle-in-a-Haystack benchmark."""
    print(f"\nRunning Needle-in-a-Haystack benchmark")
    print(f"Context lengths: {context_lengths}")
    print(f"Needle depths: {needle_depths}")

    model, tokenizer = load_model(
        model_name,
        device=device,
        use_turboquant=use_turboquant,
        bits=bits,
    )

    needle = "The secret passcode is TURBOQUANT2024."
    query = "What is the secret passcode?"
    expected_answer = "TURBOQUANT2024"

    results = []

    for ctx_len in context_lengths:
        for depth in needle_depths:
            base_text = "The sky is blue. The grass is green. "
            target_len = ctx_len - len(tokenizer.encode(needle + query)) - 10

            haystack_tokens = []
            while len(haystack_tokens) < target_len:
                haystack_tokens.extend(tokenizer.encode(base_text))
            haystack = tokenizer.decode(haystack_tokens[:target_len])

            sentences = haystack.split(". ")
            insert_pos = int(len(sentences) * depth)
            sentences.insert(insert_pos, needle[:-1])
            context = ". ".join(sentences)

            prompt = f"{context}\n\nQuestion: {query}\nAnswer:"

            inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=ctx_len)
            inputs = {k: v.to(device) for k, v in inputs.items()}

            # Handle TurboQuantModel wrapper
            actual_model = model.model if hasattr(model, 'model') else model

            with torch.no_grad():
                outputs = actual_model.generate(
                    **inputs,
                    max_new_tokens=20,
                    do_sample=False,
                    pad_token_id=tokenizer.eos_token_id,
                )

            response = tokenizer.decode(
                outputs[0][inputs["input_ids"].shape[1]:],
                skip_special_tokens=True
            )
            success = expected_answer.lower() in response.lower()

            results.append({
                "context_length": ctx_len,
                "needle_depth": depth,
                "success": success,
                "response": response[:100],
            })

            status = "✓" if success else "✗"
            print(f"  ctx={ctx_len}, depth={depth:.2f}: {status}")

    accuracy = sum(r["success"] for r in results) / len(results)
    print(f"\nOverall accuracy: {accuracy:.2%}")

    # Cleanup
    del model
    clear_cache(device)

    return {
        "model": model_name,
        "turboquant": use_turboquant,
        "bits": bits,
        "accuracy": accuracy,
        "results": results,
    }


def main():
    parser = argparse.ArgumentParser(description="TurboQuant Accuracy Benchmark")
    parser.add_argument("--model", type=str, default="gpt2", help="Model name or path")
    parser.add_argument("--device", type=str, default=None, help="Device to use")
    parser.add_argument("--bits", type=float, default=3, help="Quantization bits")
    parser.add_argument("--perplexity", action="store_true", help="Run perplexity benchmark")
    parser.add_argument("--needle", action="store_true", help="Run needle-in-haystack benchmark")
    parser.add_argument("--compare", action="store_true", help="Compare baseline vs TurboQuant")
    args = parser.parse_args()

    # Auto-detect device
    if args.device is None:
        args.device = get_device()

    print_device_info(args.device)

    # Default: run both
    if not args.perplexity and not args.needle:
        args.perplexity = True
        args.needle = True

    results = {}

    if args.perplexity:
        print("\n" + "=" * 60)
        print("PERPLEXITY BENCHMARK")
        print("=" * 60)

        if args.compare:
            results["perplexity_baseline"] = perplexity_benchmark(
                args.model, args.device, use_turboquant=False
            )
            results["perplexity_turboquant"] = perplexity_benchmark(
                args.model, args.device, use_turboquant=True, bits=args.bits
            )
        else:
            results["perplexity"] = perplexity_benchmark(
                args.model, args.device, use_turboquant=True, bits=args.bits
            )

    if args.needle:
        print("\n" + "=" * 60)
        print("NEEDLE-IN-A-HAYSTACK BENCHMARK")
        print("=" * 60)

        if args.compare:
            results["needle_baseline"] = needle_in_haystack_benchmark(
                args.model, args.device, use_turboquant=False,
                context_lengths=[512, 1024],
            )
            results["needle_turboquant"] = needle_in_haystack_benchmark(
                args.model, args.device, use_turboquant=True, bits=args.bits,
                context_lengths=[512, 1024],
            )
        else:
            results["needle"] = needle_in_haystack_benchmark(
                args.model, args.device, use_turboquant=True, bits=args.bits,
                context_lengths=[512, 1024],
            )

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(json.dumps(results, indent=2, default=str))

    with open("accuracy_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nResults saved to accuracy_results.json")


if __name__ == "__main__":
    main()
