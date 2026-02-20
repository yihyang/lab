# Model Tuning Learning Project

Learning to fine-tune LLMs on Apple Silicon using MLX.

## System Info

- **Chip:** Apple M3 Max
- **Memory:** 128 GB unified RAM
- **Python:** 3.11.9

## Project Structure

```
model-tuning/
├── data/           # Training datasets (JSONL format)
├── models/         # Downloaded base models
├── outputs/        # Fine-tuned model outputs
├── scripts/        # Utility scripts
├── venv/           # Python virtual environment
└── README.md       # This file
```

## Setup Steps

### Step 1: Create Virtual Environment

```bash
cd model-tuning
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
```

### Step 2: Install MLX Dependencies

```bash
pip install mlx mlx-lm
```

### Step 3: Verify Installation

```bash
python scripts/verify_setup.py
```

### Step 4: Test Base Model Inference

```bash
python scripts/test_inference.py
```

### Step 5: Prepare Training Data

Place your training data in `data/` as JSONL files.

### Step 6: Run Fine-Tuning

```bash
python scripts/fine_tune.py
```

### Step 7: Validate Results

```bash
python scripts/validate.py
```

## Quick Start

```bash
# Activate environment
source venv/bin/activate

# Verify setup
python scripts/verify_setup.py

# Test inference with base model
python scripts/test_inference.py

# Create sample dataset
python scripts/create_sample_dataset.py

# Run fine-tuning
python scripts/fine_tune.py --iters 50

# Validate results
python scripts/validate.py
```

## Training Results

**Setup completed:** 2026-02-20

| Metric | Value |
|--------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Training Method | LoRA |
| Trainable Parameters | 0.456% (5.6M / 1.2B) |
| Final Train Loss | 0.107 |
| Final Val Loss | 1.164 |
| Peak Memory | 1.416 GB |
| Training Speed | ~18 it/sec |

## Scripts

| Script | Purpose |
|--------|---------|
| `verify_setup.py` | Verify MLX and Metal are working |
| `test_inference.py` | Test base model text generation |
| `create_sample_dataset.py` | Create training data (JSONL) |
| `fine_tune.py` | Run LoRA fine-tuning |
| `validate.py` | Compare base vs fine-tuned outputs |

## Resources

- [MLX Documentation](https://ml-explore.github.io/mlx/)
- [MLX-LM GitHub](https://github.com/ml-explore/mlx-lm)
- [Hugging Face Datasets](https://huggingface.co/datasets)
