#!/usr/bin/env python3
"""
Convert Jin Yong novels to Alpaca training format.

Simple regex-based approach for extracting dialogues.
"""

import os
import re
import json
import random
from collections import defaultdict
from pathlib import Path

# =============================================================================
# STEP 1: Define dialogue patterns
# =============================================================================
# In Chinese novels, dialogues typically follow this structure:
#   [Speaker][Action][Punctuation][Quote]
#   Example: 段誉道："大丈夫行事，但求义所当为。"
#
# We need to match:
# - Speaker: 1-8 characters (names like 段誉, 乔峰, etc.)
# - Action: speech verbs (道, 说道, 喝道, 笑道, etc.)
# - Quote: text between quotes

SPEECH_VERBS = [
    "道", "说道", "喝道", "问道", "怒道", "笑道", "冷笑道", "叹道",
    "惊道", "急道", "叫道", "喊道", "应道", "答道", "接道", "续道",
    "插口道", "插嘴道", "哼道", "骂道", "惊呼道", "忙道", "喜道",
    "叹气道", "失声惊呼", "沉声道", "厉声道", "低声道", "高声叫道",
]

SPEECH_MODIFIERS = {
    # Volume/tone
    "低声", "大声", "高声", "小声", "轻声", "沉声", "厉声", "颤声",
    "冷声", "温声", "柔声", "怒声", "急声", "惊声", "惨声", "悲声",
    # Actions
    "失声", "连声", "异口同声", "脱口", "抢着", "争着", "忙",
    "急忙", "连忙", "赶紧", "急忙", "忽然", "突然",
    # Descriptions
    "那", "这", "他", "她", "众", "群", "各", "有人", "一人",
    "两人", "三人", "几人", "众人", "众人齐", "众人同", "那人", "这人",
    # Verb parts that might get captured
    "笑", "怒", "惊", "叹", "急", "喜", "悲", "冷笑",
}

# Known character names from Jin Yong novels (for validation)
KNOWN_CHARACTERS = {
    # 天龙八部
    "段誉", "乔峰", "萧峰", "虚竹", "王语嫣", "阿朱", "阿紫", "慕容复",
    "段正淳", "鸠摩智", "游坦之", "段延庆", "叶二娘", "岳老三", "云中鹤",
    "木婉清", "钟灵", "阿碧", "包不同", "风波恶", "丁春秋",
    # 倚天屠龙记
    "张无忌", "赵敏", "周芷若", "小昭", "谢逊", "张翠山", "殷素素",
    "杨逍", "范遥", "殷天正", "韦一笑", "灭绝师太", "宋远桥", "俞莲舟",
    "张三丰", "成昆", "陈友谅", "朱元璋",
    # 笑傲江湖
    "令狐冲", "任盈盈", "岳不群", "东方不败", "林平之", "岳灵珊",
    "仪琳", "任我行", "向问天", "左冷禅", "莫大先生", "定闲师太",
    "刘正风", "曲洋", "田伯光", "桃谷六仙",
    # 侠客行
    "石破天", "石中玉", "丁当", "谢烟客", "白万剑", "白自在",
    # 越女剑
    "阿青", "范蠡", "西施",
}


def extract_speaker_name(context: str) -> str:
    """
    Extract the actual speaker name from context before the speech verb.

    Example contexts and expected outputs:
    - "段誉低声道" -> "段誉"
    - "令狐冲笑道" -> "令狐冲"
    - "那老者沉声道" -> "老者"
    - "低声道" -> "" (no valid speaker)
    """
    context = context.strip()

    # Remove any leading quote characters
    while context and context[0] in '「」""\'':
        context = context[1:]

    # Check if context ends with known character name
    for known in KNOWN_CHARACTERS:
        if context.endswith(known):
            return known

    # Try to find a valid name by working backwards
    for length in range(min(6, len(context)), 1, -1):
        candidate = context[-length:]

        # Skip if it's a speech modifier
        if candidate in SPEECH_MODIFIERS:
            continue

        # Skip if it ends with a modifier
        skip = False
        for mod in SPEECH_MODIFIERS:
            if candidate.endswith(mod):
                if len(candidate) > len(mod):
                    candidate = candidate[:-len(mod)]
                else:
                    skip = True
                break

        if skip:
            continue

        # Clean up: remove trailing verb parts
        for suffix in ["笑", "怒", "惊", "叹", "急", "喜", "悲", "冷笑"]:
            if candidate.endswith(suffix) and len(candidate) > len(suffix):
                candidate = candidate[:-len(suffix)]

        # Validate: 2-4 chars, not a modifier
        if 2 <= len(candidate) <= 4 and candidate not in SPEECH_MODIFIERS:
            return candidate

    return ""


def build_dialogue_regex():
    """Build regex pattern with proper Unicode handling."""
    VERB_PATTERN = "|".join(SPEECH_VERBS)
    # Unicode curly quotes
    left = chr(0x201c)   # "
    right = chr(0x201d)  # "
    # Match more context (up to 15 chars) before the verb
    # We'll extract the actual name in post-processing
    pattern = (
        f'([^，。！？\\n\\s「」"\'′′]{{2,15}})'
        f'({VERB_PATTERN})'
        f'[：」「"{left}]'
        f'([^」"({right})]+)'
        f'[」"{right}]'
    )
    return re.compile(pattern)


DIALOGUE_REGEX = build_dialogue_regex()

# =============================================================================
# STEP 2: Character profiles for each novel
# =============================================================================
# Pre-defined character descriptions to make training data more meaningful

CHARACTER_PROFILES = {
    "天龙八部": {
        "段誉": "你是段誉。大理国世子，性格温文尔雅、侠义心肠，不通武功却勇气过人。",
        "乔峰": "你是乔峰。丐帮帮主，性格豪迈刚烈、义薄云天，武功盖世。",
        "虚竹": "你是虚竹。少林寺小和尚，性格淳朴善良，机缘巧合下成为高手。",
        "王语嫣": "你是王语嫣。武功理论专家，性格温婉聪慧，过目不忘。",
        "阿朱": "你是阿朱。聪明伶俐、善解人意，精通易容术。",
        "阿紫": "你是阿紫。性格刁蛮任性、心狠手辣，但对乔峰一往情深。",
        "慕容复": "你是慕容复。燕国后裔，性格阴沉、野心勃勃，一心复国。",
    },
    "倚天屠龙记": {
        "张无忌": "你是张无忌。明教教主，性格宽厚仁慈、优柔寡断，武功卓绝。",
        "赵敏": "你是赵敏。蒙古郡主，性格机智狡黠、敢爱敢恨。",
        "周芷若": "你是周芷若。峨眉派掌门，性格外柔内刚、爱恨分明。",
        "小昭": "你是小昭。波斯圣女，性格温柔体贴、善解人意。",
        "谢逊": "你是谢逊。金毛狮王，性格刚烈、重情重义。",
    },
    "笑傲江湖": {
        "令狐冲": "你是令狐冲。华山派弟子，性格潇洒不羁、重情重义。",
        "任盈盈": "你是任盈盈。魔教圣姑，性格聪慧多情、善解人意。",
        "岳不群": "你是岳不群。华山派掌门，表面君子、内心阴险。",
        "东方不败": "你是东方不败。魔教教主，武功天下第一，性格孤傲。",
        "林平之": "你是林平之。福威镖局少主，性格偏激、复仇心切。",
    },
    "侠客行": {
        "石破天": "你是石破天。性格淳朴善良、不谙世事，机缘巧合下练成绝世武功。",
        "丁当": "你是丁当。性格活泼可爱、痴情专一。",
    },
    "越女剑": {
        "阿青": "你是阿青。越国少女，剑法通神，性格单纯直率。",
    }
}

# Map novel filenames to profile keys
NOVEL_MAP = {
    "天龙八部": "天龙八部",
    "倚天屠龙记": "倚天屠龙记",
    "笑傲江湖": "笑傲江湖",
    "侠客行": "侠客行",
    "越女剑": "越女剑",
}

# Pronouns to exclude (not real character names)
PRONOUNS = {"他", "她", "它", "我", "你", "这", "那", "众", "人", "谁", "咱", "俺"}


# =============================================================================
# STEP 3: Extraction functions
# =============================================================================

def extract_dialogues(text: str) -> list[dict]:
    """
    Extract all dialogues from novel text.

    Returns list of:
        {"speaker": str, "verb": str, "content": str}
    """
    dialogues = []

    matches = DIALOGUE_REGEX.findall(text)

    for context, verb, content in matches:
        # Extract actual speaker name from context
        speaker = extract_speaker_name(context)

        # Skip if no valid speaker found
        if not speaker:
            continue

        # Skip pronouns
        if speaker in PRONOUNS:
            continue

        dialogues.append({
            "speaker": speaker,
            "verb": verb,
            "content": content.strip(),
        })

    return dialogues


def build_conversation_pairs(dialogues: list[dict]) -> list[dict]:
    """
    Build conversation pairs from consecutive dialogues.

    Input: [A speaks, B speaks, B speaks again, C speaks]
    Output: [(A→B), (B→C)]  # Skip consecutive same-speaker
    """
    pairs = []

    for i in range(len(dialogues) - 1):
        current = dialogues[i]
        next_d = dialogues[i + 1]

        # Skip if same speaker (monologue continuation)
        if current["speaker"] == next_d["speaker"]:
            continue

        pairs.append({
            "speaker_a": current["speaker"],
            "content_a": current["content"],
            "speaker_b": next_d["speaker"],
            "content_b": next_d["content"],
            "verb_b": next_d["verb"],
        })

    return pairs


def get_character_profile(novel_key: str, character: str) -> str:
    """Get character profile or create default."""
    profiles = CHARACTER_PROFILES.get(novel_key, {})
    if character in profiles:
        return profiles[character]
    return f"你是{character}。金庸武侠小说中的人物。"


def create_training_example(pair: dict, novel_key: str) -> dict:
    """
    Create Alpaca format training example.

    Format:
        ### Instruction:
        [Character profile]

        [Context: previous speaker's dialogue]

        ### Response:
        [Character's response]
    """
    profile = get_character_profile(novel_key, pair["speaker_b"])

    instruction = f"""{profile}

对话场景：
{pair["speaker_a"]}道：「{pair["content_a"]}」

请以{pair["speaker_b"]}的身份回复。"""

    # Format response with emotion/action from verb
    verb = pair["verb_b"]
    if verb != "道":
        # Extract emotion: 冷笑道 → 冷笑, 叹道 → 叹
        emotion = verb.replace("道", "")
        response = f"{pair['speaker_b']}（{emotion}）道：「{pair['content_b']}」"
    else:
        response = f"{pair['speaker_b']}道：「{pair['content_b']}」"

    return {
        "text": f"### Instruction:\n{instruction}\n\n### Response:\n{response}"
    }


# =============================================================================
# STEP 4: Main processing
# =============================================================================

def process_novel(novel_path: str) -> tuple[list[dict], dict]:
    """Process a single novel file."""
    print(f"\nProcessing: {novel_path}")

    # Determine novel key from filename
    novel_key = None
    for key in NOVEL_MAP:
        if key in novel_path:
            novel_key = key
            break

    if not novel_key:
        print(f"  Warning: Unknown novel, skipping")
        return [], {}

    # Read file
    with open(novel_path, 'r', encoding='utf-8') as f:
        text = f.read()

    print(f"  Text length: {len(text):,} characters")

    # Extract dialogues
    dialogues = extract_dialogues(text)
    print(f"  Dialogues found: {len(dialogues)}")

    # Build pairs
    pairs = build_conversation_pairs(dialogues)
    print(f"  Conversation pairs: {len(pairs)}")

    # Count characters
    char_counts = defaultdict(int)
    for d in dialogues:
        char_counts[d["speaker"]] += 1

    # Create training examples
    examples = []
    for pair in pairs:
        example = create_training_example(pair, novel_key)
        examples.append(example)

    return examples, dict(char_counts)


def main():
    import argparse

    parser = argparse.ArgumentParser(description="Convert Jin Yong novels to training format")
    parser.add_argument("--input", default="data/jinyong_raw", help="Input directory")
    parser.add_argument("--output", default="data/jinyong_alpaca", help="Output directory")
    parser.add_argument("--min-count", type=int, default=5, help="Min dialogues per character")

    args = parser.parse_args()

    # Find novel files
    input_path = Path(args.input)
    novel_files = sorted(input_path.glob("金庸-*.txt"))

    if not novel_files:
        print(f"No novel files found in {args.input}")
        return

    print("=" * 60)
    print(f"Found {len(novel_files)} novel files")
    print("=" * 60)

    all_examples = []
    all_char_counts = defaultdict(int)

    # Process each novel
    for novel_file in novel_files:
        examples, char_counts = process_novel(str(novel_file))
        all_examples.extend(examples)
        for char, count in char_counts.items():
            all_char_counts[char] += count

    print("\n" + "=" * 60)
    print(f"Total examples: {len(all_examples)}")
    print("=" * 60)

    # Shuffle and split
    random.seed(42)
    random.shuffle(all_examples)

    split_idx = int(len(all_examples) * 0.95)
    train_examples = all_examples[:split_idx]
    valid_examples = all_examples[split_idx:]

    # Save
    output_path = Path(args.output)
    output_path.mkdir(parents=True, exist_ok=True)

    # Train
    train_file = output_path / "train.jsonl"
    with open(train_file, 'w', encoding='utf-8') as f:
        for ex in train_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')
    print(f"\nSaved {len(train_examples)} training examples")

    # Valid
    valid_file = output_path / "valid.jsonl"
    with open(valid_file, 'w', encoding='utf-8') as f:
        for ex in valid_examples:
            f.write(json.dumps(ex, ensure_ascii=False) + '\n')
    print(f"Saved {len(valid_examples)} validation examples")

    # Character stats
    stats_file = output_path / "character_stats.json"
    sorted_chars = dict(sorted(all_char_counts.items(), key=lambda x: -x[1]))
    with open(stats_file, 'w', encoding='utf-8') as f:
        json.dump(sorted_chars, f, ensure_ascii=False, indent=2)

    # Print top characters
    print("\nTop 20 characters:")
    for char, count in list(sorted_chars.items())[:20]:
        print(f"  {char}: {count}")

    print(f"\nDone! Output: {output_path}")


if __name__ == "__main__":
    main()
