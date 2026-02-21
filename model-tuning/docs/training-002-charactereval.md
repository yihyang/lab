# Training 002: CharacterEval Role-Play

Chinese character role-play training with 78 characters from novels, dramas, and games.

## Setup Data

Data is not included in the repository. Run these commands to download and prepare:

```bash
# 1. Download source dataset from GitHub
python scripts/download_charactereval.py

# 2. Convert to Alpaca format for training
python scripts/convert_charactereval.py

# Expected output:
# data/CharacterEval/          # Source dataset
# data/charactereval_alpaca/   # Training-ready data
#   ├── train.jsonl            # 6,505 examples
#   └── valid.jsonl            # 723 examples
```

## Dataset

| Property | Value |
|----------|-------|
| Source | https://github.com/morecry/CharacterEval |
| Domain | Chinese character role-play |
| Training examples | 6,505 |
| Validation examples | 723 |
| Characters | 78 |
| Format | Alpaca with character context |

## Characters

```
金庸/武侠: 小龙女, 杨过, 郭襄, 萧炎, 药老, 重楼, 景天
古装剧: 甄嬛, 华妃, 安陵容, 贾宝玉, 梅长苏
现代剧: 李云龙(亮剑), 高启强(狂飙), 侯亮平(人民的名义)
喜剧: 吕子乔, 曾小贤, 佟湘玉, 白展堂(武林外传)
经典: 孙悟空, 唐三藏, 猪八戒, 武松, 李逵
```

## Training

```bash
python scripts/004_fine_tune.py --data data/charactereval_alpaca --iters 500
```

| Parameter | Value |
|-----------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Iterations | 500 |
| Learning Rate | 1e-5 |
| Batch Size | 1 |
| LoRA Layers | 16 |
| Trainable Params | 5.6M (0.456%) |

## Results

| Metric | Value |
|--------|-------|
| Initial Val Loss | 4.143 |
| Final Val Loss | 2.933 |
| Final Train Loss | 2.150 |
| Gap | 0.78 (healthy) |
| Peak Memory | 7.1 GB |
| Trained Tokens | 159,689 |
| Training Time | ~3 minutes |

## Loss Progress

```
Iter 1:   Val Loss 4.143
Iter 100: Val Loss (saved)
Iter 200: Val Loss 3.228
Iter 400: Val Loss 3.179
Iter 500: Val Loss 2.933
```

## Sample Outputs

### Test 1: 李云龙 (亮剑)
```
Input: 政委：老李，这次任务太危险了，你真的要去吗？
Output: 李云龙：（一笑）政委，你知道我什么时候会去吗？我是军人，不能不去。
```

### Test 2: 孙悟空 (西游记)
```
Input: 唐僧：悟空，你又要去哪里？
Output: 孙悟空：（笑道）师父，你这事不必了。俺老孙要去前面探探路，别让你担心。
```

### Test 3: 甄嬛 (甄嬛传)
```
Input: 安陵容：姐姐，我真的很羡慕你...
Output: 安陵容：（叹气）我知道你会想想这些，但我不想你在这里受伤。
```

## Analysis

**Strengths**:
- Model responds in character style
- Uses stage directions: （一笑）（笑道）（叹气）
- Maintains character voice (李云龙 direct, 孙悟空 uses 俺老孙)

**Weaknesses**:
- Responses are short (only 500 iterations)
- Some character confusion (甄嬛 test responded as 安陵容)

**Improvement over Training 001**:
- Gap reduced from 1.06 to 0.78
- More data (6,505 vs 12) = better generalization

## Files

```
data/CharacterEval/              # Source dataset from GitHub
├── data/
│   ├── character_profiles.json  # 78 character profiles
│   └── test_data.jsonl          # Test examples
└── rm_train_data.json           # Training data with responses

data/charactereval_alpaca/       # Converted for training
├── train.jsonl                  # 6,505 examples
└── valid.jsonl                  # 723 examples
```

## Data Format

```json
{
  "text": "### Instruction:\n你是李云龙。\n性别：男。\n职业：军人。\n性格：勇敢无畏、重情重义...\n经典台词：「我李云龙从来不打无准备之仗。」\n\n请根据以下对话场景，以李云龙的身份回复：\n\n[dialogue context...]\n\n### Response:\n[model response...]"
}
```

## Next Steps

- Train longer (1000-2000 iterations)
- Test individual characters
- Try different base models

## Related

- [Before/After Comparison](comparison-002-charactereval.md) - Detailed output comparison
