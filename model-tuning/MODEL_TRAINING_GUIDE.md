# Learning Guide: Training Models on MacBook Pro

## Context

You want to learn about training machine learning models for educational purposes. You'll be using a MacBook Pro with Apple Silicon, which is feasible for small-scale fine-tuning and experimentation.

---

## Feasibility on MacBook Pro

### What Works

| Task | Feasibility | Notes |
|------|-------------|-------|
| **QLoRA fine-tuning 1B-3B models** | ✅ Yes | Most practical option |
| **QLoRA fine-tuning 7B models** | ⚠️ Maybe | Needs 16GB+ unified RAM, slower |
| **Full fine-tuning** | ❌ Not practical | Too slow, memory-heavy |
| **Classical ML** | ✅ Excellent | Random forests, XGBoost, etc. |
| **Training from scratch** | ❌ No | Requires massive compute |

### Why MacBook Pro Works

- **Apple Silicon (M1/M2/M3/M4)** has a Neural Engine and unified memory architecture
- **MPS (Metal Performance Shaders)** provides GPU acceleration in PyTorch
- **Unified memory** means you can use all RAM as VRAM (unlike discrete GPUs)

---

## Recommended Approach: MLX-LM

Apple's **MLX** framework is optimized for Apple Silicon and significantly faster than PyTorch for training on Mac.

### Installation

```bash
# Install MLX and MLX-LM
pip install mlx mlx-lm

# Optional: Also install PyTorch with MPS support
pip install torch transformers peft trl accelerate
```

### Verify MPS is Working

```python
import torch
print(torch.backends.mps.is_available())  # Should be True
print(torch.backends.mps.is_built())      # Should be True
```

---

## Learning Path

### Phase 1: Setup (1 day)

1. **Install dependencies**
   ```bash
   pip install mlx mlx-lm torch transformers peft trl accelerate
   ```

2. **Verify your setup**
   - Run the MPS verification script above
   - Ensure you have 20GB+ free disk space for models

### Phase 2: First Fine-Tune (1-2 days)

1. **Choose a small model**
   - Llama 3.2 1B Instruct (recommended)
   - Gemma 2B
   - Phi-3 Mini (3.8B)

2. **Prepare a simple dataset**
   - JSONL format with "text" or "prompt"/"completion" fields
   - Start with 100-1000 examples

3. **Run your first fine-tune**
   ```bash
   mlx_lm.lora \
     --model mlx-community/Llama-3.2-1B-Instruct-4bit \
     --data path/to/your/data \
     --batch-size 1 \
     --lora-layers 16 \
     --learning-rate 1e-5 \
     --iters 100
   ```

### Phase 3: Experiment (ongoing)

- Try different datasets and models
- Adjust hyperparameters (learning rate, batch size, LoRA rank)
- Compare outputs before and after fine-tuning
- Explore instruction tuning formats

---

## Hardware Requirements

| Model Size | Minimum RAM | Recommended RAM |
|------------|-------------|-----------------|
| 1B-3B parameters | 8 GB | 16 GB |
| 7B parameters | 16 GB | 32 GB |
| 13B+ parameters | 32 GB | 64 GB |

**Note:** Training will be 2-5x slower than on an NVIDIA GPU, but it works for learning.

---

## Key Tools & Frameworks

| Tool | Purpose | Mac Support |
|------|---------|-------------|
| **MLX-LM** | Fine-tuning LLMs on Apple Silicon | ✅ Optimized |
| **PyTorch MPS** | GPU acceleration on Mac | ✅ Good |
| **Hugging Face Transformers** | Pre-trained models | ✅ Yes |
| **PEFT** | Parameter-efficient fine-tuning | ✅ Yes |
| **Unsloth** | Fast training | ⚠️ Limited (needs PyTorch) |

---

## Recommended Datasets for Training

### Beginner-Friendly Datasets (Small, Clean)

| Dataset | Size | Use Case | Link |
|---------|------|----------|------|
| **Alpaca** | 52K | Instruction following | `yahma/alpaca-cleaned` |
| **Dolly** | 15K | Instruction following | `databricks/databricks-dolly-15k` |
| **Guanaco** | 534K | Multi-language chat | `timdettmers/openassistant-guanaco` |

### Domain-Specific Datasets

| Dataset | Domain | Link |
|---------|--------|------|
| **MedAlpaca** | Medical | `medalpaca/medical_meadow_medqa` |
| **CodeAlpaca** | Programming | `sahil2801/code_alpaca` |
| **FinanceAlpaca** | Financial | `gbharti/finance-alpaca` |
| **WikitableQuestions** | Q&A | `stanfordnlp/wikitablequestions` |

### Chat & Conversation Datasets

| Dataset | Description | Link |
|---------|-------------|------|
| **OpenAssistant** | Human conversations | `OpenAssistant/oasst1` |
| **UltraChat** | Multi-turn dialogs | `stingning/ultrachat` |
| **ShareGPT** | Real chat logs | Various on HF Hub |

### Creating Your Own Dataset

**Format (JSONL):**
```json
{"text": "### Instruction:\nWrite a haiku about coding.\n\n### Response:\nBugs hide in the code\nCoffee fuels the late night fix\nFinally it works"}
```

**Or with separate fields:**
```json
{"instruction": "Explain quantum computing", "output": "Quantum computing uses..."}
```

**Tips:**
- Start with 100-1000 examples for testing
- Quality > quantity (clean, consistent data)
- Match the format your target model expects

### Finding More Datasets

- **Hugging Face Datasets:** https://huggingface.co/datasets
- **Filter by:** Task, Language, Size, License
- **Search terms:** "instruction", "chat", "alpaca", your domain

---

## Resources

### MLX-Specific
- **MLX Examples:** https://github.com/ml-explore/mlx-examples
- **MLX-LM GitHub:** https://github.com/ml-explore/mlx-lm
- **Apple MLX Docs:** https://ml-explore.github.io/mlx/

### General Learning
- **Hugging Face NLP Course:** https://huggingface.co/learn/nlp-course
- **Fast.ai Course:** https://course.fast.ai

### Models to Try
- `mlx-community/Llama-3.2-1B-Instruct-4bit`
- `mlx-community/gemma-2-2b-it-4bit`
- `mlx-community/Phi-3-mini-4k-instruct-4bit`

---

## Validating Fine-Tuned Results

Validation is crucial to ensure your fine-tuned model actually improved.

### 1. Qualitative Evaluation (Human Review)

**Compare side-by-side:**
```python
from transformers import AutoModelForCausalLM, AutoTokenizer

# Load both models
base_model = AutoModelForCausalLM.from_pretrained("base-model")
finetuned_model = AutoModelForCausalLM.from_pretrained("your-finetuned-model")

prompt = "Explain machine learning to a 10-year-old."

# Generate from both
base_output = base_model.generate(prompt)
finetuned_output = finetuned_model.generate(prompt)

print("Base:", base_output)
print("Fine-tuned:", finetuned_output)
```

**What to look for:**
- Does it follow your training format?
- Is the tone/style consistent with your data?
- Does it handle edge cases better?
- Any hallucinations or regressions?

### 2. Quantitative Metrics

| Metric | Use Case | Tool |
|--------|----------|------|
| **Perplexity** | Language modeling quality | `transformers` |
| **BLEU/ROUGE** | Translation, summarization | `evaluate`, `nltk` |
| **Accuracy** | Classification tasks | Custom evaluation |
| **Exact Match** | Q&A tasks | Simple string match |

**Example - Perplexity:**
```python
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def calculate_perplexity(model, tokenizer, texts):
    model.eval()
    total_loss = 0
    total_length = 0

    with torch.no_grad():
        for text in texts:
            inputs = tokenizer(text, return_tensors="pt")
            outputs = model(**inputs, labels=inputs["input_ids"])
            total_loss += outputs.loss.item() * inputs["input_ids"].size(1)
            total_length += inputs["input_ids"].size(1)

    return torch.exp(torch.tensor(total_loss / total_length)).item()

# Lower perplexity = better
```

### 3. Holdout Test Set

**Best practice:** Split your data before training
```python
from sklearn.model_selection import train_test_split

# Split data: 80% train, 10% validation, 10% test
train_data, temp = train_test_split(data, test_size=0.2, random_state=42)
val_data, test_data = train_test_split(temp, test_size=0.5, random_state=42)

# Use test_data ONLY for final evaluation (never during training)
```

### 4. Task-Specific Benchmarks

| Benchmark | What it Tests |
|-----------|---------------|
| **AlpacaEval** | Instruction-following vs GPT-4 |
| **MT-Bench** | Multi-turn conversation quality |
| **HellaSwag** | Common sense reasoning |
| **MMLU** | General knowledge |
| **HumanEval** | Code generation |

### 5. MLX-LM Validation

```bash
# Test inference with your fine-tuned model
mlx_lm.generate \
  --model path/to/your/finetuned-model \
  --prompt "Your test prompt here" \
  --max-tokens 256

# Compare with base model
mlx_lm.generate \
  --model mlx-community/Llama-3.2-1B-Instruct-4bit \
  --prompt "Your test prompt here" \
  --max-tokens 256
```

### 6. Practical Validation Script

```python
import json
from mlx_lm import load, generate

def validate_model(model_path, test_prompts, base_model_path=None):
    """Validate fine-tuned model with test prompts."""

    model, tokenizer = load(model_path)

    results = []
    for prompt in test_prompts:
        output = generate(model, tokenizer, prompt=prompt, max_tokens=256)
        results.append({"prompt": prompt, "output": output})

    # If comparing with base model
    if base_model_path:
        base_model, base_tokenizer = load(base_model_path)
        for i, prompt in enumerate(test_prompts):
            base_output = generate(base_model, base_tokenizer, prompt=prompt, max_tokens=256)
            results[i]["base_output"] = base_output

    return results

# Usage
test_prompts = [
    "### Instruction:\nWrite a haiku about AI.\n\n### Response:\n",
    "### Instruction:\nExplain recursion.\n\n### Response:\n",
]

results = validate_model(
    model_path="path/to/finetuned",
    test_prompts=test_prompts,
    base_model_path="mlx-community/Llama-3.2-1B-Instruct-4bit"
)

# Save results for review
with open("validation_results.json", "w") as f:
    json.dump(results, f, indent=2)
```

### Validation Workflow

1. **Before training:** Create a holdout test set (10-20% of data)
2. **During training:** Monitor loss on validation set
3. **After training:**
   - Run test prompts through both base and fine-tuned model
   - Calculate perplexity on test set
   - Manual review of outputs
   - Check for regressions (things base model could do that broke)

---

## Verification Checklist

To verify your learning progress:
- [ ] MLX installed and working
- [ ] MPS verified (if using PyTorch)
- [ ] Successfully downloaded a pre-trained model
- [ ] Ran a fine-tuning script without errors
- [ ] Generated text with your fine-tuned model
- [ ] Compared outputs before and after fine-tuning

---

## Summary

**What you'll do:**
1. Install MLX-LM (Apple's optimized framework)
2. Start with a 1B-3B parameter model
3. Fine-tune using LoRA (efficient, works on Mac)
4. Learn by experimenting with different datasets and settings

**What you won't do:**
- Train large models from scratch (requires datacenter GPUs)
- Full fine-tuning of large models (too memory-intensive)

**Realistic expectation:** You can definitely learn and experiment with fine-tuning small models on your MacBook Pro. It's slower than NVIDIA GPUs but perfectly viable for education and small projects.
