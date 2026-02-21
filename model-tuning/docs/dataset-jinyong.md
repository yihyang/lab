# Dataset: Jin Yong Novels

Raw text from Jin Yong (金庸) wuxia novels, downloaded from ModelScope.

## Source

- Repository: https://modelscope.cn/datasets/josonfan/jinyong
- Access: ModelScope (requires git-lfs)

## Download

```bash
# Requires git-lfs
brew install git-lfs
git lfs install

# Clone
git clone https://www.modelscope.cn/datasets/josonfan/jinyong.git data/jinyong_raw
cd data/jinyong_raw
git lfs pull
```

## Available Novels

| Novel | Chinese | Size |
|-------|---------|------|
| Demi-Gods and Semi-Devils | 天龙八部 | 3.8 MB |
| Heaven Sword and Dragon Saber | 倚天屠龙记 | 3.0 MB |
| The Smiling, Proud Wanderer | 笑傲江湖 | 3.0 MB |
| Ode to Gallantry | 侠客行 | 1.1 MB |
| Sword of the Yue Maiden | 越女剑 | 50 KB |

**Total**: ~11 MB of raw Chinese text

## Content Preview

```
"金庸作品集"新序
　　小说是写给人看的。小说的内容是人。
　　小说写一个人、几个人、一群人、或成千成万人的性格和感情...
```

## Status

⚠️ **Not yet converted to training format**

Raw novel text needs processing before use:

1. **Extract dialogues** - Parse conversation pairs
2. **Identify characters** - Map dialogue to characters
3. **Create profiles** - Character descriptions
4. **Format as Alpaca** - Instruction-response pairs

## Potential Conversion Approaches

### Option A: Dialogue Extraction
Extract all dialogue and assign to characters based on context:
```
杨过：（叹气）姑姑，我好想你。
→ Character: 杨过, Emotion: 叹气, Content: 姑姑，我好想你。
```

### Option B: Scene-Based
Create training data from scenes:
```
Instruction: 你是杨过。请与小龙女对话...
Response: 杨过：（深情）姑姑，十六年了，我终于等到这一天。
```

### Option C: Synthetic Generation
Use another LLM to generate Q&A from novel content.

## Files

```
data/jinyong_raw/
├── 金庸-天龙八部.txt
├── 金庸-倚天屠龙记.txt
├── 金庸-笑傲江湖.txt
├── 金庸-侠客行.txt
├── 金庸-越女剑.txt
├── README.md
└── dataset_infos.json
```

## Related Resources

- [weijie-he/jinyong](https://github.com/weijie-he/jinyong) - Graph analysis of 射雕三部曲 characters
- [CharacterEval](training-002-charactereval.md) - Already formatted Chinese character data
