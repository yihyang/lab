#!/usr/bin/env python3
"""
Step 1: Verify MLX Setup

This script checks that MLX is installed and can access the Metal GPU.
"""

import sys


def check_mlx():
    """Check MLX installation and Metal backend."""
    print("=" * 50)
    print("MLX Setup Verification")
    print("=" * 50)

    # Check MLX
    try:
        import mlx
        import mlx.core as mx
        version = mx.__version__ if hasattr(mx, '__version__') else "installed"
        print(f"[OK] MLX version: {version}")
    except ImportError as e:
        print(f"[FAIL] MLX not installed: {e}")
        return False

    print(f"[OK] MLX core imported successfully")

    # Check Metal backend
    try:
        # Create a simple array to test Metal
        a = mx.array([1.0, 2.0, 3.0])
        b = mx.array([4.0, 5.0, 6.0])
        c = a + b
        mx.eval(c)  # Force evaluation
        print(f"[OK] Metal backend working: {a} + {b} = {c}")
    except Exception as e:
        print(f"[FAIL] Metal backend test failed: {e}")
        return False

    # Check default device
    try:
        device = mx.default_device()
        print(f"[OK] Default device: {device}")
    except Exception as e:
        print(f"[WARN] Could not get default device: {e}")

    # Check MLX-LM
    try:
        import mlx_lm
        print(f"[OK] MLX-LM installed")
    except ImportError as e:
        print(f"[FAIL] MLX-LM not installed: {e}")
        return False

    # Check transformers
    try:
        import transformers
        print(f"[OK] Transformers version: {transformers.__version__}")
    except ImportError as e:
        print(f"[FAIL] Transformers not installed: {e}")
        return False

    print("=" * 50)
    print("All checks passed!")
    print("=" * 50)
    return True


def check_pytorch_mps():
    """Optionally check PyTorch MPS availability."""
    print("\nOptional: PyTorch MPS Check")
    print("-" * 30)

    try:
        import torch
        print(f"[INFO] PyTorch version: {torch.__version__}")
        print(f"[INFO] MPS available: {torch.backends.mps.is_available()}")
        print(f"[INFO] MPS built: {torch.backends.mps.is_built()}")
    except ImportError:
        print("[INFO] PyTorch not installed (optional, MLX is preferred)")


if __name__ == "__main__":
    success = check_mlx()
    check_pytorch_mps()

    if not success:
        print("\n[ERROR] Setup verification failed!")
        sys.exit(1)
    else:
        print("\n[SUCCESS] Ready for fine-tuning!")
        sys.exit(0)
