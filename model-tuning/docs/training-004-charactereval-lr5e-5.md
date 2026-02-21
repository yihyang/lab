# Training 004: CharacterEval with Higher Learning Rate (5e-5)

Experiment with higher learning rate to achieve faster convergence.

## Setup Data

Same as Training 002/003:

```bash
python scripts/download_charactereval.py
python scripts/convert_charactereval.py
```

## Dataset

Same as previous trainings:

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
python scripts/004_fine_tune.py \
  --data data/charactereval_alpaca \
  --iters 1000 \
  --batch-size 4 \
  --learning-rate 5e-5 \
  --output outputs/adapters_lr_5e-5
```

| Parameter | Value |
|-----------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Iterations | 1000 |
| Learning Rate | **5e-5** (5x higher than default) |
| Batch Size | 4 |
| LoRA Layers | 16 |
| Trainable Params | 5.6M (0.456%) |

## Results

| Metric | Value |
|--------|-------|
| Initial Val Loss | 4.141 |
| Final Val Loss | 1.666 |
| Final Train Loss | 1.447 |
| Gap (Val - Train) | +0.219 (mild overfitting) |
| Peak Memory | 32.613 GB |
| Trained Tokens | 1,329,928 |
| Training Time | ~10 minutes |

## Loss Progress

```
Iter    1: Val Loss 4.141
Iter  200: Val Loss 2.734
Iter  400: Val Loss 2.460
Iter  600: Val Loss 2.058
Iter  800: Val Loss 2.024
Iter 1000: Val Loss 1.666
```

## Comparison with Previous Trainings

| Metric | Training 001 | Training 002 | Training 003 | Training 004 |
|--------|--------------|--------------|--------------|--------------|
| Examples | 12 | 6,505 | 6,505 | 6,505 |
| Iterations | 100 | 500 | 1500 | 1000 |
| Batch Size | 1 | 1 | 4 | 4 |
| Learning Rate | 1e-5 | 1e-5 | 1e-5 | **5e-5** |
| Final Val Loss | 1.164 | 2.933 | 2.193 | **1.666** |
| Final Train Loss | 0.107 | 2.150 | 2.292 | 1.447 |
| Gap | 1.057 | 0.78 | -0.099 | 0.219 |
| Status | Overfit | Healthy | Very Healthy | Mild Overfit |

## Analysis

### Why 5e-5 Works Better

1. **Faster convergence**: Reached val loss 2.058 at iter 600 (Training 003 needed 1500 iters to reach 2.193)
2. **Lower final loss**: 1.666 vs 2.193 (24% better)
3. **Fewer iterations needed**: 1000 vs 1500
4. **Lower memory**: 33GB vs 43GB (fewer tokens processed)

### Trade-offs

- **Mild overfitting**: Train loss (1.447) < Val loss (1.666)
- Gap of 0.219 is acceptable but indicates model is starting to memorize

### Learning Rate Insights

| Learning Rate | Behavior |
|---------------|----------|
| 1e-5 (Training 003) | Slow, steady, slight underfitting |
| 5e-5 (Training 004) | Fast, efficient, mild overfitting |

## Next Steps

- [ ] Run before/after comparison
- [ ] Test chat quality vs Training 003
- [ ] Try 2e-5 as middle ground
- [ ] Experiment with learning rate scheduling
