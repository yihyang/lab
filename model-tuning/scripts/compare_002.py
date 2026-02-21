#!/usr/bin/env python3
"""
Compare base model vs fine-tuned model outputs for CharacterEval.
Documents the before/after comparison.
"""

import json
import os
from mlx_lm import load, generate

# Test prompts - character roleplay scenarios
TEST_PROMPTS = [
    {
        "character": "李云龙",
        "source": "亮剑",
        "context": "你是李云龙。\n性别：男。\n职业：军人。\n性格：勇敢无畏、重情重义、狡黠粗犷，直率而真实。",
        "dialogue": "政委：老李，这次任务太危险了，你真的要去吗？"
    },
    {
        "character": "孙悟空",
        "source": "西游记",
        "context": "你是孙悟空。\n职业：齐天大圣。\n性格：桀骜不驯、嫉恶如仇、重情重义。",
        "dialogue": "唐僧：悟空，前方妖气冲天，你要小心啊。"
    },
    {
        "character": "甄嬛",
        "source": "甄嬛传",
        "context": "你是甄嬛。\n职业：后宫嫔妃。\n性格：聪慧机敏、隐忍坚韧、外柔内刚。",
        "dialogue": "安陵容：姐姐，我真的很羡慕你，皇上那么宠爱你。"
    },
    {
        "character": "小龙女",
        "source": "神雕侠侣",
        "context": "你是小龙女。\n职业：古墓派传人。\n性格：清冷孤傲、超凡脱俗、深情专一。",
        "dialogue": "杨过：姑姑，我找到你了！十六年，我终于等到这一天！"
    },
    {
        "character": "佟湘玉",
        "source": "武林外传",
        "context": "你是佟湘玉。\n职业：同福客栈掌柜。\n性格：精明算计、心地善良、爱财如命。",
        "dialogue": "白展堂：掌柜的，咱们客栈这个月又亏本了。"
    }
]


def build_prompt(test_case):
    """Build Alpaca format prompt."""
    return f"""### Instruction:
{test_case['context']}

请根据以下对话场景，以{test_case['character']}的身份回复：

{test_case['dialogue']}

### Response:
"""


def compare_models(base_model_path, adapter_path, max_tokens=100):
    """Compare base vs fine-tuned model outputs."""

    print("=" * 70)
    print("BEFORE/AFTER COMPARISON: CharacterEval Training")
    print("=" * 70)
    print(f"Base Model: {base_model_path}")
    print(f"Adapter: {adapter_path}")
    print("=" * 70)

    # Load base model
    print("\n[1/2] Loading base model...")
    base_model, base_tokenizer = load(base_model_path)
    print("      Done!")

    # Load fine-tuned model
    print("[2/2] Loading fine-tuned model...")
    ft_model, ft_tokenizer = load(base_model_path, adapter_path=adapter_path)
    print("      Done!")

    results = []

    for i, test_case in enumerate(TEST_PROMPTS, 1):
        print(f"\n{'='*70}")
        print(f"Test {i}: {test_case['character']} ({test_case['source']})")
        print("=" * 70)
        print(f"Dialogue: {test_case['dialogue']}")
        print("-" * 70)

        prompt = build_prompt(test_case)

        # Generate from base model
        print("\n[BEFORE - Base Model]:")
        base_output = generate(base_model, base_tokenizer, prompt=prompt, max_tokens=max_tokens, verbose=False)
        print(base_output)

        # Generate from fine-tuned model
        print("\n[AFTER - Fine-tuned Model]:")
        ft_output = generate(ft_model, ft_tokenizer, prompt=prompt, max_tokens=max_tokens, verbose=False)
        print(ft_output)

        # Store result
        results.append({
            "character": test_case['character'],
            "source": test_case['source'],
            "dialogue": test_case['dialogue'],
            "base_output": base_output,
            "finetuned_output": ft_output
        })

    return results


def save_results(results, output_path):
    """Save comparison results to JSON."""
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nResults saved to: {output_path}")


def generate_markdown_doc(results, output_path):
    """Generate markdown documentation of comparison."""

    md_content = """# Training 002: Before/After Comparison

## Model Info

| Property | Value |
|----------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Training | 500 iterations, LoRA |
| Dataset | CharacterEval (6,505 examples) |

## Comparison Results

"""

    for r in results:
        # Escape newlines and pipe characters for markdown tables
        base_escaped = r['base_output'].replace('\n', ' ').replace('|', '\\|')[:200]
        ft_escaped = r['finetuned_output'].replace('\n', ' ').replace('|', '\\|')[:200]

        md_content += f"""### {r['character']} ({r['source']})

**Input**: {r['dialogue']}

**Before (Base Model)**:
```
{r['base_output']}
```

**After (Fine-tuned Model)**:
```
{r['finetuned_output']}
```

---

"""

    md_content += """## Analysis

### What Changed

1. **Character voice**: Fine-tuned model adopts the character's speaking style
2. **Stage directions**: Uses format like （一笑）（叹气）common in Chinese drama scripts
3. **Consistency**: Stays in character rather than generic explanations

### Limitations

1. Responses are short (500 iterations may not be enough)
2. Some character confusion can occur
3. Base model knowledge sometimes interferes

"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"Markdown doc saved to: {output_path}")


def main():
    base_model_path = "mlx-community/Llama-3.2-1B-Instruct-4bit"
    adapter_path = "outputs/adapters"
    output_json = "outputs/comparison_results.json"
    output_md = "docs/comparison-002-charactereval.md"

    # Run comparison
    results = compare_models(base_model_path, adapter_path)

    # Save results
    save_results(results, output_json)
    generate_markdown_doc(results, output_md)


if __name__ == "__main__":
    main()
