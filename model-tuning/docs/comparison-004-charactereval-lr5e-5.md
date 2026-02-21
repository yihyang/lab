# Training 004: Before/After Comparison

## Model Info

| Property | Value |
|----------|-------|
| Base Model | Llama 3.2 1B Instruct (4-bit) |
| Training | 1000 iterations, batch-size 4, LR 5e-5 |
| Dataset | CharacterEval (6,505 examples) |
| Final Val Loss | 1.666 |

## Comparison Results

### 李云龙 (亮剑)

**Input**: 政委：老李，这次任务太危险了，你真的要去吗？

**Before (Base Model)**:
```
政委：老李，这次任务太危险了，你真的要去吗？

李云龙：政委，危险是我的朋友的本事。要是你不支持我，那么我就要去。要是你支持我，那么我就要回去。所以，你支持我吗？还是你支持我不支持我？你支持我吗？还是你支持我不支持我？你支持我吗？还是你支持我不支持我？
```

**After (Fine-tuned Model)**:
```
李云龙：政委，我一定会做到最大的努力，但我不能做到这个任务，为了国家和人民，我必须选择出国去。
```

---

### 孙悟空 (西游记)

**Input**: 唐僧：悟空，前方妖气冲天，你要小心啊。

**Before (Base Model)**:
```
我：你是谁啊？你是齐天大圣啊，才不用小心啊。

唐僧：大圣啊？你是齐天大圣啊，才不用小心啊。

我：你说什么啊？你是齐天大圣啊，才不用小心啊？你是唐僧啊，才不用小心啊。

唐僧：我说什么啊？我说我是唐僧啊，才
```

**After (Fine-tuned Model)**:
```
孙悟空：（笑道）老僧，你说什么？我这身神力，怎能抵御那般之妖气？我只是想好好打算一打，等我有必要再打，才去打。
```

---

### 甄嬛 (甄嬛传)

**Input**: 安陵容：姐姐，我真的很羡慕你，皇上那么宠爱你。

**Before (Base Model)**:
```
安陵容：甄嬛，真不想你在这里面过了这么长时间了。皇上是你唯一的家人了吗？你是真的被宠爱了吗？

### 甄嬛的回复：
安陵容：甄嬛，你是真的被宠爱了吗？你是真的被皇上宠爱了吗？你是真的被皇上宠爱了吗？你是真的被
```

**After (Fine-tuned Model)**:
```
甄嬛：（微笑）我也很喜欢你，安陵容姐姐。我们之间的关系虽然是皇上所配的宠爱，但我却是心意深重的亲人。虽然我是皇上所配的宠爱，但我却不愿让你失望的。
```

---

### 小龙女 (神雕侠侣)

**Input**: 杨过：姑姑，我找到你了！十六年，我终于等到这一天！

**Before (Base Model)**:
```
杨过：小龙女！你是大哥的女儿啊！我已经等了十六年了！

### 详细分析：

1.  **语气和态度**：小龙女的语气和态度是清冷孤傲的，超凡脱俗的，深情专一的。这些特点表明她对自己和他人有着深刻的关怀和责任感。
2.  **回应方式**
```

**After (Fine-tuned Model)**:
```
小龙女：杨大哥，你怎么了？你是说你在找我吗？
```

---

### 佟湘玉 (武林外传)

**Input**: 白展堂：掌柜的，咱们客栈这个月又亏本了。

**Before (Base Model)**:
```
白展堂：掌柜的，咱们客栈这个月又亏本了。我们客栈的钱是你赚的钱，算是你赚的钱。我们客栈的钱是你赚的钱。我们客栈的钱是你赚的钱。我们客栈的钱是你赚的钱。我们客栈的钱是你赚的钱。我们客栈的
```

**After (Fine-tuned Model)**:
```
佟湘玉：哎呀，白展堂，你说是吗？我这次来，真的没什么好说的。
```

---

## Training 003 vs Training 004 Comparison

| Metric | Training 003 | Training 004 |
|--------|--------------|--------------|
| Learning Rate | 1e-5 | 5e-5 |
| Iterations | 1500 | 1000 |
| Final Val Loss | 2.193 | 1.666 |
| Final Train Loss | 2.292 | 1.447 |
| Trained Tokens | 1,979,473 | 1,329,928 |

### Key Findings

1. **Higher LR = Faster convergence**: 5e-5 reached lower loss in fewer iterations
2. **Better efficiency**: 33% fewer tokens trained for better results
3. **Mild overfitting**: Gap 0.219 (train < val), but acceptable

### When to Use Each

- **1e-5**: When you want very stable training, have lots of compute time
- **5e-5**: When you want faster results, efficiency matters

