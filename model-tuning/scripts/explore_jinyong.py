#!/usr/bin/env python3
"""
Explore the josonfan/jinyong dataset from ModelScope.
"""

import sys

def explore_jinyong():
    print("=" * 60)
    print("Exploring josonfan/jinyong Dataset")
    print("=" * 60)

    # Try to load from ModelScope
    print("\n[1/3] Installing modelscope if needed...")
    try:
        from modelscope.msdatasets import MsDataset
        print("[OK] modelscope already installed")
    except ImportError:
        print("[INFO] Installing modelscope...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "modelscope", "-q"])
        from modelscope.msdatasets import MsDataset
        print("[OK] modelscope installed")

    print("\n[2/3] Loading dataset from ModelScope...")
    try:
        ds = MsDataset.load('josonfan/jinyong', subset_name='default', split='train')
        print(f"[OK] Dataset loaded: {type(ds)}")
    except Exception as e:
        print(f"[FAIL] Could not load dataset: {e}")
        print("\n[INFO] You may need to accept terms on ModelScope website:")
        print("https://modelscope.cn/datasets/josonfan/jinyong")
        return False

    print("\n[3/3] Inspecting dataset structure...")
    print("-" * 60)

    # Get dataset info
    try:
        print(f"Dataset type: {type(ds)}")
        print(f"Dataset length: {len(ds) if hasattr(ds, '__len__') else 'unknown'}")

        # Try to get first few samples
        if hasattr(ds, '__iter__'):
            print("\nFirst 3 samples:")
            for i, sample in enumerate(ds):
                if i >= 3:
                    break
                print(f"\n--- Sample {i+1} ---")
                print(f"Type: {type(sample)}")
                if isinstance(sample, dict):
                    for key, value in sample.items():
                        if isinstance(value, str) and len(value) > 200:
                            print(f"  {key}: {value[:200]}...")
                        else:
                            print(f"  {key}: {value}")
                else:
                    print(f"  Value: {sample}")

        # Check available splits
        if hasattr(ds, 'keys'):
            print(f"\nAvailable keys/splits: {list(ds.keys())}")

    except Exception as e:
        print(f"[WARN] Error inspecting: {e}")

    # Try to get actual text content
    print("\n" + "=" * 60)
    print("Attempting to access actual text files...")
    print("=" * 60)

    try:
        import os
        # Check cache directory for downloaded files
        cache_dir = os.path.expanduser("~/.cache/modelscope/hub/datasets/downloads")
        print(f"\nCache directory: {cache_dir}")

        if os.path.exists(cache_dir):
            for root, dirs, files in os.walk(cache_dir):
                for f in files:
                    filepath = os.path.join(root, f)
                    size = os.path.getsize(filepath)
                    print(f"  {f}: {size/1024:.1f} KB")

                    # If it's a txt file, show first few lines
                    if f.endswith('.txt') and size < 10000000:  # < 10MB
                        print(f"\n  First 500 chars of {f}:")
                        with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                            content = file.read(500)
                            print(f"  {content[:500]}...")
    except Exception as e:
        print(f"[WARN] Could not explore cache: {e}")

    print("\n" + "=" * 60)
    print("Exploration complete!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    explore_jinyong()
