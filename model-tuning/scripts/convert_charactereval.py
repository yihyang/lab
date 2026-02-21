#!/usr/bin/env python3
"""
Convert CharacterEval dataset to Alpaca format for fine-tuning.

Input: CharacterEval (7,228 examples with character profiles)
Output: train.jsonl and valid.jsonl in Alpaca format
"""

import json
import os
import random

# Paths
INPUT_DATA = "data/CharacterEval/rm_train_data.json"
INPUT_PROFILES = "data/CharacterEval/data/character_profiles.json"
OUTPUT_DIR = "data/charactereval_alpaca"


def load_data():
    """Load CharacterEval data and profiles."""
    print("Loading data...")

    with open(INPUT_DATA, 'r', encoding='utf-8') as f:
        training_data = json.load(f)

    with open(INPUT_PROFILES, 'r', encoding='utf-8') as f:
        profiles = json.load(f)

    print(f"  Training examples: {len(training_data)}")
    print(f"  Character profiles: {len(profiles)}")

    return training_data, profiles


def create_character_context(role: str, profiles: dict) -> str:
    """Create context from character profile."""
    if role not in profiles:
        return f"你是{role}。"

    p = profiles[role]
    parts = [f"你是{role}。"]

    # Add basic info
    if p.get('性别'):
        parts.append(f"性别：{p['性别']}。")
    if p.get('工作'):
        parts.append(f"职业：{p['工作']}。")
    if p.get('年龄'):
        parts.append(f"年龄：{p['年龄']}岁。")

    # Add personality
    if p.get('人物性格'):
        parts.append(f"性格：{p['人物性格']}")

    # Add some classic quotes
    if p.get('经典台词'):
        quotes = p['经典台词'][:2]  # Limit to 2 quotes
        parts.append(f"经典台词：「{'」、「'.join(quotes)}」")

    return "\n".join(parts)


def convert_to_alpaca(training_data: list, profiles: dict) -> list:
    """Convert CharacterEval format to Alpaca format."""
    print("\nConverting to Alpaca format...")

    converted = []
    skipped = 0

    for sample in training_data:
        role = sample['role']
        context = sample['context']
        response = sample['model_output']

        # Skip if no response
        if not response or not context:
            skipped += 1
            continue

        # Create character context
        char_context = create_character_context(role, profiles)

        # Format as Alpaca instruction
        # The instruction includes character context + dialogue context
        instruction = f"{char_context}\n\n请根据以下对话场景，以{role}的身份回复：\n\n{context}"

        # Create Alpaca format entry
        entry = {
            "text": f"### Instruction:\n{instruction}\n\n### Response:\n{response}"
        }

        converted.append(entry)

    print(f"  Converted: {len(converted)}")
    print(f"  Skipped: {skipped}")

    return converted


def split_and_save(data: list, output_dir: str, train_ratio: float = 0.9):
    """Split into train/valid and save."""
    print("\nSplitting and saving...")

    # Shuffle data
    random.seed(42)
    random.shuffle(data)

    # Split
    split_idx = int(len(data) * train_ratio)
    train_data = data[:split_idx]
    valid_data = data[split_idx:]

    # Create output directory
    os.makedirs(output_dir, exist_ok=True)

    # Save train
    train_path = os.path.join(output_dir, "train.jsonl")
    with open(train_path, 'w', encoding='utf-8') as f:
        for entry in train_data:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    # Save valid
    valid_path = os.path.join(output_dir, "valid.jsonl")
    with open(valid_path, 'w', encoding='utf-8') as f:
        for entry in valid_data:
            f.write(json.dumps(entry, ensure_ascii=False) + '\n')

    print(f"  Train: {len(train_data)} examples -> {train_path}")
    print(f"  Valid: {len(valid_data)} examples -> {valid_path}")

    return train_path, valid_path


def show_samples(data: list, count: int = 2):
    """Show sample converted data."""
    print("\n" + "=" * 60)
    print(f"SAMPLE CONVERTED DATA ({count} examples)")
    print("=" * 60)

    for i, entry in enumerate(data[:count]):
        print(f"\n--- Sample {i+1} ---")
        print(entry['text'][:800])
        print("...")


def main():
    print("=" * 60)
    print("CharacterEval to Alpaca Format Converter")
    print("=" * 60)

    # Load
    training_data, profiles = load_data()

    # Convert
    converted = convert_to_alpaca(training_data, profiles)

    # Show samples
    show_samples(converted)

    # Save
    train_path, valid_path = split_and_save(converted, OUTPUT_DIR)

    print("\n" + "=" * 60)
    print("Conversion complete!")
    print("=" * 60)
    print(f"\nTo train with this data:")
    print(f"  python scripts/fine_tune.py --data {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
