#!/usr/bin/env python3
"""
Step 3: Create Sample Training Dataset

Creates a small JSONL dataset for fine-tuning experiments.
This uses the Alpaca instruction format.
"""

import json
import os

# Sample training data - coding focused examples
TRAINING_EXAMPLES = [
    {
        "instruction": "Write a Python function to reverse a string.",
        "input": "",
        "output": "def reverse_string(s):\n    return s[::-1]\n\n# Example usage:\n# reverse_string('hello') -> 'olleh'"
    },
    {
        "instruction": "Explain the difference between a list and a tuple in Python.",
        "input": "",
        "output": "Lists are mutable (can be modified after creation), while tuples are immutable (cannot be changed). Use lists when you need to modify the collection. Use tuples for fixed data that shouldn't change, like coordinates or configuration values."
    },
    {
        "instruction": "Write a function to check if a number is prime.",
        "input": "",
        "output": "def is_prime(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True"
    },
    {
        "instruction": "What is the time complexity of binary search?",
        "input": "",
        "output": "Binary search has O(log n) time complexity. This is because with each comparison, the search space is cut in half. For an array of size n, you need at most log₂(n) comparisons to find an element."
    },
    {
        "instruction": "Write a Python one-liner to flatten a nested list.",
        "input": "",
        "output": "# For simple nesting:\nflat = [item for sublist in nested for item in sublist]\n\n# For arbitrary depth (Python 3.9+):\nfrom collections.abc import Iterable\ndef flatten(lst):\n    for x in lst:\n        yield from flatten(x) if isinstance(x, list) else [x]"
    },
    {
        "instruction": "Explain what a decorator is in Python.",
        "input": "",
        "output": "A decorator is a function that takes another function and extends its behavior without modifying it directly. It's syntactic sugar using @decorator_name above a function. Common uses include logging, timing, authentication, and caching."
    },
    {
        "instruction": "Write a recursive function to calculate factorial.",
        "input": "",
        "output": "def factorial(n):\n    if n <= 1:\n        return 1\n    return n * factorial(n - 1)\n\n# Example: factorial(5) = 120"
    },
    {
        "instruction": "What is the difference between 'is' and '==' in Python?",
        "input": "",
        "output": "'==' checks for value equality (do the objects have the same content?), while 'is' checks for identity (are they the exact same object in memory?). Use '==' for comparing values, and 'is' mainly for checking None or singleton objects."
    },
    {
        "instruction": "Write a function to merge two sorted lists.",
        "input": "",
        "output": "def merge_sorted(a, b):\n    result = []\n    i = j = 0\n    while i < len(a) and j < len(b):\n        if a[i] <= b[j]:\n            result.append(a[i])\n            i += 1\n        else:\n            result.append(b[j])\n            j += 1\n    result.extend(a[i:])\n    result.extend(b[j:])\n    return result"
    },
    {
        "instruction": "Explain the concept of closures in Python.",
        "input": "",
        "output": "A closure is a function that remembers variables from its enclosing scope even after that scope has finished executing. The inner function 'closes over' variables from the outer function. Useful for creating function factories, callbacks, and maintaining state without classes."
    },
    {
        "instruction": "Write a function to find the most frequent element in a list.",
        "input": "",
        "output": "from collections import Counter\n\ndef most_frequent(lst):\n    return Counter(lst).most_common(1)[0][0]\n\n# Or without imports:\ndef most_frequent_simple(lst):\n    counts = {}\n    for item in lst:\n        counts[item] = counts.get(item, 0) + 1\n    return max(counts, key=counts.get)"
    },
    {
        "instruction": "What is a generator in Python and when would you use one?",
        "input": "",
        "output": "A generator is a function that yields values one at a time instead of returning them all at once. It uses 'yield' instead of 'return'. Use generators for: large datasets that don't fit in memory, infinite sequences, or when you only need to iterate once. They're memory-efficient because they generate values on-demand."
    },
    {
        "instruction": "Write a function to check if a string is a palindrome.",
        "input": "",
        "output": "def is_palindrome(s):\n    # Simple version (case-sensitive)\n    return s == s[::-1]\n\n# More robust version (ignores case and non-alphanumeric)\ndef is_palindrome_robust(s):\n    cleaned = ''.join(c.lower() for c in s if c.isalnum())\n    return cleaned == cleaned[::-1]"
    },
    {
        "instruction": "Explain the difference between shallow copy and deep copy.",
        "input": "",
        "output": "A shallow copy creates a new container but fills it with references to the same objects. A deep copy recursively copies all objects, creating entirely new nested structures. Use copy.copy() for shallow, copy.deepcopy() for deep. Deep copy is needed when modifying nested objects independently."
    },
    {
        "instruction": "Write a decorator to time function execution.",
        "input": "",
        "output": "import time\n\ndef timing_decorator(func):\n    def wrapper(*args, **kwargs):\n        start = time.perf_counter()\n        result = func(*args, **kwargs)\n        end = time.perf_counter()\n        print(f'{func.__name__} took {end - start:.4f} seconds')\n        return result\n    return wrapper\n\n# Usage:\n# @timing_decorator\n# def my_function(): ..."
    },
]


def format_alpaca_prompt(example: dict) -> str:
    """Format example in Alpaca instruction format."""
    if example["input"]:
        return f"### Instruction:\n{example['instruction']}\n\n### Input:\n{example['input']}\n\n### Response:\n{example['output']}"
    else:
        return f"### Instruction:\n{example['instruction']}\n\n### Response:\n{example['output']}"


def create_dataset(output_dir: str = "data"):
    """Create training and validation datasets."""
    os.makedirs(output_dir, exist_ok=True)

    # Split into train (80%) and validation (20%)
    split_idx = int(len(TRAINING_EXAMPLES) * 0.8)
    train_examples = TRAINING_EXAMPLES[:split_idx]
    val_examples = TRAINING_EXAMPLES[split_idx:]

    # Write training data
    train_path = os.path.join(output_dir, "train.jsonl")
    with open(train_path, "w") as f:
        for example in train_examples:
            text = format_alpaca_prompt(example)
            f.write(json.dumps({"text": text}) + "\n")

    # Write validation data
    val_path = os.path.join(output_dir, "valid.jsonl")
    with open(val_path, "w") as f:
        for example in val_examples:
            text = format_alpaca_prompt(example)
            f.write(json.dumps({"text": text}) + "\n")

    print("=" * 50)
    print("Dataset Created")
    print("=" * 50)
    print(f"Training examples: {len(train_examples)}")
    print(f"Validation examples: {len(val_examples)}")
    print(f"Training file: {train_path}")
    print(f"Validation file: {val_path}")
    print("-" * 50)
    print("\nSample training example:")
    print("-" * 50)
    print(format_alpaca_prompt(train_examples[0]))


if __name__ == "__main__":
    create_dataset()
