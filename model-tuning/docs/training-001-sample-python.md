# Training 001: Sample Python Q&A

First training experiment with 12 hand-crafted Python examples.

## Setup Data

```bash
# Generate the sample dataset (built into the script)
python scripts/003_create_sample_dataset.py

# Output:
# data/sample_python/
#   ├── train.jsonl    # 12 examples
#   └── valid.jsonl    # 3 examples
```

## Dataset

| Property | Value |
|----------|-------|
| Domain | Python programming Q&A |
| Training examples | 12 |
| Validation examples | 3 |
| Format | Alpaca (instruction-response) |
| Source | Hand-crafted |

## Training Config

```bash
python scripts/004_fine_tune.py --data data/sample_python --iters 100
```

| Parameter | Value |
|-----------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Iterations | 100 |
| Learning Rate | 1e-5 |
| Batch Size | 1 |
| LoRA Layers | 16 |

## Results

| Metric | Value |
|--------|-------|
| Final Train Loss | 0.107 |
| Final Val Loss | 1.164 |
| Peak Memory | 1.4 GB |
| Training Speed | ~18 it/sec |

## Analysis

**Problem**: Severe overfitting
- Train loss (0.107) << Val loss (1.164)
- Gap: 1.057 (too large)
- Model memorized 12 examples but couldn't generalize

**Lesson**: 12 examples is too few for meaningful training. Need 100-1000+ examples.

## Sample Data

```json
{"text": "### Instruction:\nWrite a Python function to reverse a string.\n\n### Response:\ndef reverse_string(s):\n    return s[::-1]"}
```
