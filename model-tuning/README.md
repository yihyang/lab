# Model Tuning Learning Project

A collection of experiments learning to fine-tune LLMs on Apple Silicon using MLX.

## Learning Items

| Item | Topic | Status |
|------|-------|--------|
| [Training 001](docs/training-001-sample-python.md) | Python Q&A (overfitting lesson) | ✅ Complete |
| [Training 002](docs/training-002-charactereval.md) | Character role-play (500 iters) | ✅ Complete |
| └ [Comparison](docs/comparison-002-charactereval.md) | Before/After outputs | ✅ Complete |
| [Training 003](docs/training-003-charactereval-1500.md) | Character role-play (1500 iters) | ✅ Complete |
| └ [Comparison](docs/comparison-003-charactereval-1500.md) | Before/After outputs | ✅ Complete |
| [Training 004](docs/training-004-charactereval-lr5e-5.md) | Learning rate experiment (LR 5e-5) | ✅ Complete |
| └ [Comparison](docs/comparison-004-charactereval-lr5e-5.md) | Before/After outputs | ✅ Complete |
| [Jin Yong Dataset](docs/dataset-jinyong.md) | Wuxia novel processing | 📋 Raw data ready |

## Quick Start

```bash
source venv/bin/activate
python scripts/004_fine_tune.py --data data/charactereval_alpaca --iters 500
```

## Setup

### 1. Environment

```bash
cd model-tuning
python3 -m venv venv
source venv/bin/activate
pip install mlx mlx-lm
```

### 2. Data (Required before training)

Data is not included in the repository. Run the setup scripts to download:

```bash
# For CharacterEval (Chinese character role-play)
python scripts/download_charactereval.py    # Download from GitHub
python scripts/convert_charactereval.py     # Convert to Alpaca format

# For Jin Yong novels (optional)
python scripts/explore_jinyong.py           # Download from ModelScope

# For sample Python Q&A (built-in, no download needed)
python scripts/003_create_sample_dataset.py
```

### 3. Verify Setup

```bash
python scripts/001_verify_setup.py
```

## Reference

- [MODEL_TRAINING_GUIDE.md](MODEL_TRAINING_GUIDE.md) - Comprehensive ML concepts guide

## Project Structure

```
model-tuning/
├── docs/                        # Training & dataset documentation
│   ├── training-001-sample-python.md
│   ├── training-002-charactereval.md
│   ├── comparison-002-charactereval.md
│   └── dataset-jinyong.md
│
├── scripts/                     # All Python scripts
│   ├── 001_verify_setup.py      # Verify MLX + Metal
│   ├── 002_test_inference.py    # Test base model
│   ├── 003_create_sample_dataset.py
│   ├── 004_fine_tune.py         # Run LoRA training
│   ├── 005_validate.py          # Compare outputs
│   ├── download_charactereval.py
│   ├── convert_charactereval.py
│   ├── compare_002.py           # Before/after comparison
│   ├── chat.py                  # Interactive chat
│   └── explore_jinyong.py
│
├── data/                        # Datasets (not in git, run setup scripts)
│   ├── sample_python/           # → 003_create_sample_dataset.py
│   ├── CharacterEval/           # → download_charactereval.py
│   ├── charactereval_alpaca/    # → convert_charactereval.py
│   └── jinyong_raw/             # → explore_jinyong.py
│
├── outputs/                     # Training outputs (not in git)
│   └── adapters/
│
└── venv/                        # Python environment (not in git)
```

## System Info

- Chip: Apple M3 Max
- Memory: 128 GB unified RAM
- Python: 3.11.9
