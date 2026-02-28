#!/usr/bin/env python3
"""
Compare base model vs Jin Yong fine-tuned model (Training 005).
"""

import json
from mlx_lm import load, generate

# Test prompts - Jin Yong character roleplay scenarios
TEST_PROMPTS = [
    {
        "character": "令狐冲",
        "source": "笑傲江湖",
        "context": "你是令狐冲。华山派大弟子，性格潇洒不羁、重情重义、嗜酒如命。",
        "dialogue": "岳不群：令狐冲，你竟敢勾结魔教妖人，该当何罪？"
    },
    {
        "character": "段誉",
        "source": "天龙八部",
        "context": "你是段誉。大理国世子，性格温文尔雅、侠义心肠，不通武功却勇气过人。",
        "dialogue": "王语嫣：段公子，你为何要跟着我？"
    },
    {
        "character": "张无忌",
        "source": "倚天屠龙记",
        "context": "你是张无忌。明教教主，性格宽厚仁慈、优柔寡断、心地善良。",
        "dialogue": "赵敏：张无忌，你到底喜欢我还是周芷若？"
    },
    {
        "character": "乔峰",
        "source": "天龙八部",
        "context": "你是乔峰。丐帮帮主，性格豪迈刚烈、义薄云天、武功盖世。",
        "dialogue": "段正淳：乔帮主，今日一战，在下佩服！"
    },
    {
        "character": "任盈盈",
        "source": "笑傲江湖",
        "context": "你是任盈盈。魔教圣姑，性格聪慧多情、善解人意、外柔内刚。",
        "dialogue": "令狐冲：盈盈，你为何对我这么好？"
    }
]


def build_prompt(test_case):
    return f"""### Instruction:
{test_case['context']}

对话场景：
{test_case['dialogue']}

请以{test_case['character']}的身份回复。

### Response:
"""


def compare_models(base_model_path, adapter_path, max_tokens=100):
    print("=" * 70)
    print("BEFORE/AFTER COMPARISON: Training 005 (Jin Yong)")
    print("=" * 70)
    print(f"Base Model: {base_model_path}")
    print(f"Adapter: {adapter_path}")
    print("=" * 70)

    print("\n[1/2] Loading base model...")
    base_model, base_tokenizer = load(base_model_path)
    print("      Done!")

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

        print("\n[BEFORE - Base Model]:")
        base_output = generate(base_model, base_tokenizer, prompt=prompt, max_tokens=max_tokens, verbose=False)
        print(base_output)

        print("\n[AFTER - Fine-tuned Model]:")
        ft_output = generate(ft_model, ft_tokenizer, prompt=prompt, max_tokens=max_tokens, verbose=False)
        print(ft_output)

        results.append({
            "character": test_case['character'],
            "source": test_case['source'],
            "dialogue": test_case['dialogue'],
            "base_output": base_output,
            "finetuned_output": ft_output
        })

    return results


def save_results(results, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nResults saved to: {output_path}")


def generate_markdown_doc(results, output_path):
    md_content = """# Training 005: Before/After Comparison (Jin Yong)

## Model Info

| Property | Value |
|----------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Training | 1500 iterations, batch-size 4, LR 5e-5 |
| Dataset | Jin Yong novels (24,502 examples) |
| Final Val Loss | 2.310 |

## Comparison Results

"""

    for r in results:
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

### Observations

1. **Wuxia style**: Model adopts martial arts novel dialogue style
2. **Character voice**: Responses reflect character personality
3. **Classical Chinese**: Uses traditional expressions and terminology

### Comparison with CharacterEval (Training 004)

| Metric | Training 004 (CharacterEval) | Training 005 (Jin Yong) |
|--------|------------------------------|-------------------------|
| Val Loss | 1.666 | 2.310 |
| Examples | 7,228 | 24,502 |
| Avg Length | 396 chars | 160 chars |

### Trade-offs

- **More data ≠ Lower loss**: Classical Chinese is harder for Llama
- **Shorter examples**: Less context per training sample
- **More characters**: Harder to learn distinct voices

"""

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(md_content)
    print(f"Markdown doc saved to: {output_path}")


def main():
    base_model_path = "mlx-community/Llama-3.2-1B-Instruct-4bit"
    adapter_path = "outputs/adapters_jinyong"
    output_json = "outputs/comparison_005_results.json"
    output_md = "docs/comparison-005-jinyong.md"

    results = compare_models(base_model_path, adapter_path)
    save_results(results, output_json)
    generate_markdown_doc(results, output_md)


if __name__ == "__main__":
    main()
