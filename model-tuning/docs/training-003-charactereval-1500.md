# Training 003: CharacterEval Extended (1500 iterations)

Extended training of CharacterEval role-play model with 1500 iterations and larger batch size.

## Setup Data

Same as Training 002. Run these commands if data doesn't exist:

```bash
# 1. Download source dataset from GitHub
python scripts/download_charactereval.py

# 2. Convert to Alpaca format for training
python scripts/convert_charactereval.py

# Expected output:
# data/CharacterEval/          # Source dataset
# data/charactereval_alpaca/   # Training-ready data
#   ├── train.jsonl            # 6,505 examples
#   └── valid.jsonl            # 723 examples
```

## Dataset

Same as Training 002:

| Property | Value |
|----------|-------|
| Source | https://github.com/morecry/CharacterEval |
| Domain | Chinese character role-play |
| Training examples | 6,505 |
| Validation examples | 723 |
| Characters | 78 |
| Format | Alpaca with character context |

## Training Config

```bash
python scripts/004_fine_tune.py --data data/charactereval_alpaca --iters 1500 --batch-size 4
```

| Parameter | Value |
|-----------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Iterations | 1500 |
| Learning Rate | 1e-5 |
| Batch Size | 4 |
| LoRA Layers | 16 |
| Trainable Params | 5.6M (0.456%) |

## Results

| Metric | Value |
|--------|-------|
| Initial Val Loss | 4.141 |
| Final Val Loss | 2.193 |
| Final Train Loss | 2.292 |
| Gap (Train-Val) | -0.099 (Train > Val = healthy) |
| Peak Memory | 43.163 GB |
| Trained Tokens | 1,979,473 |
| Training Time | ~15 minutes |

## Loss Progress

```
Iter 1:    Val Loss 4.141
Iter 100:  Val Loss 3.356
Iter 200:  Val Loss 3.015
Iter 300:  Val Loss 2.870
Iter 400:  Val Loss 2.748
Iter 500:  Val Loss 2.653
Iter 600:  Val Loss 2.553
Iter 700:  Val Loss 2.485
Iter 800:  Val Loss 2.420
Iter 900:  Val Loss 2.366
Iter 1000: Val Loss 2.319
Iter 1100: Val Loss 2.280
Iter 1200: Val Loss 2.247
Iter 1300: Val Loss 2.218
Iter 1400: Val Loss 2.193
Iter 1500: Val Loss 2.193
```

## Comparison with Previous Trainings

| Metric | Training 001 | Training 002 | Training 003 |
|--------|--------------|--------------|--------------|
| Examples | 12 | 6,505 | 6,505 |
| Iterations | 100 | 500 | 1500 |
| Batch Size | 1 | 1 | 4 |
| Final Val Loss | 1.164 | 2.933 | 2.193 |
| Final Train Loss | 0.107 | 2.150 | 2.292 |
| Gap | 1.057 | 0.78 | -0.099 |
| Status | Overfit | Healthy | Very Healthy |

## Analysis

**Improvements over Training 002**:
- Val loss improved: 2.933 → 2.193 (25% better)
- Gap healthier: 0.78 → -0.099 (Train slightly higher than Val = good generalization)
- More tokens trained: 159,689 → 1,979,473 (12x more)

**Why Train Loss > Val Loss is Good**:
- Slight underfitting on training data
- Model is learning general patterns, not memorizing
- Better expected performance on unseen data

**Batch Size Effect**:
- Batch-size 4 processes 4 examples per iteration
- More stable gradients, faster convergence
- Higher memory usage (43GB vs 7GB)

## Next Steps

- [ ] Run before/after comparison script
- [ ] Test individual character responses
- [ ] Try 2000+ iterations
- [ ] Experiment with learning rate adjustments
