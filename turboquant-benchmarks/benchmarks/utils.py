#!/usr/bin/env python3
"""
Utility functions for TurboQuant benchmarks.

Provides device detection and synchronization helpers for
cross-platform compatibility (CUDA, MPS, CPU).
"""

import os
import torch


def enable_mps_fallback():
    """
    Enable MPS fallback for unsupported operations.

    TurboQuant uses torch.linalg.qr which is not natively supported on MPS.
    This enables CPU fallback for such operations.
    """
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "1"


def get_device() -> str:
    """
    Get the best available device.

    Priority: CUDA > MPS (Apple Silicon) > CPU
    """
    if torch.cuda.is_available():
        return "cuda"
    elif hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    else:
        return "cpu"


def synchronize(device: str):
    """
    Synchronize device for accurate timing.

    Args:
        device: Device to synchronize ("cuda", "mps", or "cpu")
    """
    if device == "cuda":
        torch.cuda.synchronize()
    elif device == "mps":
        torch.mps.synchronize()
    # CPU doesn't need synchronization


def get_device_name(device: str) -> str:
    """Get human-readable device name."""
    if device == "cuda":
        return torch.cuda.get_device_name(0)
    elif device == "mps":
        return "Apple Silicon (MPS)"
    else:
        return "CPU"


def get_device_memory_gb(device: str) -> float:
    """Get total device memory in GB."""
    if device == "cuda":
        return torch.cuda.get_device_properties(0).total_memory / 1024**3
    elif device == "mps":
        # MPS doesn't have a direct way to get total memory
        # Use system memory as approximation
        import psutil
        return psutil.virtual_memory().total / 1024**3
    else:
        import psutil
        return psutil.virtual_memory().total / 1024**3


def clear_cache(device: str):
    """Clear device cache."""
    if device == "cuda":
        torch.cuda.empty_cache()
    elif device == "mps":
        torch.mps.empty_cache()


def get_memory_allocated_gb(device: str) -> float:
    """Get currently allocated memory in GB."""
    if device == "cuda":
        return torch.cuda.memory_allocated() / 1024**3
    elif device == "mps":
        return torch.mps.current_allocated_memory() / 1024**3
    else:
        import psutil
        return psutil.Process().memory_info().rss / 1024**3


def print_device_info(device: str):
    """Print device information."""
    print(f"\nDevice: {get_device_name(device)}")
    print(f"Memory: {get_device_memory_gb(device):.1f} GB")

    if device == "cuda":
        print(f"CUDA Version: {torch.version.cuda}")
    elif device == "mps":
        print(f"PyTorch MPS available")

    print(f"PyTorch Version: {torch.__version__}")


# TurboQuant device mapping
def get_turboquant_device(device: str) -> str:
    """
    Map benchmark device to TurboQuant device string.

    TurboQuant supports: "cuda", "cpu", "mps", "metal", "mlx"
    """
    if device == "mps":
        return "mps"  # TurboQuant supports MPS directly
    return device
