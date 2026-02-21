#!/usr/bin/env python3
"""
Download and explore CharacterEval dataset.

CharacterEval is a Chinese benchmark for role-playing with 77 characters
from Chinese novels and scripts, featuring 1,785 dialogues and 23K examples.
"""

import json
import os
import sys

DATASET_DIR = "data/CharacterEval"


def download_charactereval():
    """Download CharacterEval dataset from GitHub."""
    print("=" * 60)
    print("Downloading CharacterEval Dataset")
    print("=" * 60)

    if os.path.exists(DATASET_DIR):
        print(f"[INFO] Dataset already exists at {DATASET_DIR}")
        return True

    print("\n[1/2] Cloning from GitHub...")
    try:
        import subprocess
        result = subprocess.run(
            ["git", "clone", "https://github.com/morecry/CharacterEval.git", DATASET_DIR],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            print("[OK] Dataset cloned successfully")
        else:
            print(f"[FAIL] Git clone failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"[FAIL] Error: {e}")
        return False

    return True


def explore_dataset():
    """Explore the structure and content of CharacterEval."""
    print("\n[2/2] Exploring dataset structure...")
    print("-" * 60)

    # List all files
    print("\nDirectory structure:")
    for root, dirs, files in os.walk(DATASET_DIR):
        level = root.replace(DATASET_DIR, "").count(os.sep)
        indent = " " * 2 * level
        print(f"{indent}{os.path.basename(root)}/")
        subindent = " " * 2 * (level + 1)
        for file in files[:10]:  # Limit to first 10 files per dir
            filepath = os.path.join(root, file)
            size = os.path.getsize(filepath)
            print(f"{subindent}{file} ({size/1024:.1f} KB)")
        if len(files) > 10:
            print(f"{subindent}... and {len(files) - 10} more files")

    # Look for data files
    print("\n" + "-" * 60)
    print("Looking for dialogue data...")

    data_files = []
    for root, dirs, files in os.walk(DATASET_DIR):
        for file in files:
            if file.endswith(('.json', '.jsonl', '.csv')):
                data_files.append(os.path.join(root, file))

    print(f"\nFound {len(data_files)} data files:")
    for f in data_files:
        print(f"  {f}")

    # Try to load and inspect one
    for filepath in data_files:
        if 'dialogue' in filepath.lower() or 'train' in filepath.lower() or 'data' in filepath.lower():
            print(f"\n" + "-" * 60)
            print(f"Inspecting: {filepath}")
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Try JSON
                try:
                    data = json.loads(content)
                    print(f"Type: JSON")
                    print(f"Structure: {type(data)}")

                    if isinstance(data, list):
                        print(f"Length: {len(data)} items")
                        if len(data) > 0:
                            print(f"\nFirst item keys: {list(data[0].keys()) if isinstance(data[0], dict) else 'N/A'}")
                            print(f"\nFirst item sample:")
                            sample = data[0]
                            if isinstance(sample, dict):
                                for k, v in list(sample.items())[:5]:
                                    if isinstance(v, str):
                                        print(f"  {k}: {v[:100]}{'...' if len(v) > 100 else ''}")
                                    elif isinstance(v, list) and len(v) > 0:
                                        print(f"  {k}: [{len(v)} items, first: {str(v[0])[:50]}...]")
                                    else:
                                        print(f"  {k}: {v}")
                            else:
                                print(f"  {sample[:200]}...")
                    elif isinstance(data, dict):
                        print(f"Keys: {list(data.keys())[:10]}")

                except json.JSONDecodeError:
                    # Try JSONL
                    print(f"Type: JSONL (one JSON per line)")
                    lines = content.strip().split('\n')
                    print(f"Lines: {len(lines)}")
                    if lines:
                        first = json.loads(lines[0])
                        print(f"First line keys: {list(first.keys()) if isinstance(first, dict) else 'N/A'}")
                        print(f"First line: {lines[0][:200]}...")

            except Exception as e:
                print(f"[WARN] Could not read {filepath}: {e}")

    print("\n" + "=" * 60)
    print("Exploration complete!")
    print("=" * 60)


def show_sample_dialogues():
    """Show some sample dialogues from the dataset."""
    print("\n" + "=" * 60)
    print("Sample Dialogues")
    print("=" * 60)

    # Find dialogue files
    for root, dirs, files in os.walk(DATASET_DIR):
        for file in files:
            if file.endswith('.json'):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        data = json.load(f)

                    if isinstance(data, list) and len(data) > 0:
                        sample = data[0]

                        # Check if it has dialogue-like structure
                        if isinstance(sample, dict):
                            if 'dialogue' in sample or 'conversations' in sample or 'messages' in sample:
                                print(f"\nFrom: {filepath}")
                                print("-" * 40)

                                # Try to find the dialogue content
                                for key in ['dialogue', 'conversations', 'messages', 'history']:
                                    if key in sample:
                                        print(f"\n{key.upper()}:")
                                        dialogues = sample[key]
                                        if isinstance(dialogues, list):
                                            for i, d in enumerate(dialogues[:3]):
                                                if isinstance(d, dict):
                                                    role = d.get('role', d.get('from', 'unknown'))
                                                    content = d.get('content', d.get('value', str(d)))
                                                    print(f"  [{role}]: {content[:100]}...")
                                                else:
                                                    print(f"  [{i}]: {str(d)[:100]}...")
                                        break

                                # Show character info if available
                                for key in ['character', 'role', 'name', 'char_name']:
                                    if key in sample:
                                        print(f"\nCHARACTER: {sample[key]}")
                                        break

                                return  # Show one sample file

                except Exception as e:
                    pass


if __name__ == "__main__":
    if download_charactereval():
        explore_dataset()
        show_sample_dialogues()
