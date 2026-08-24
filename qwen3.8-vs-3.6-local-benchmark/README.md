# Qwen3.8-27B vs Qwen3.6-27B — local benchmark

Head-to-head evaluation of two locally-served 27B models on a single RTX 5090,
run when swapping the resident model on the workstation from Qwen3.6 to Qwen3.8.

**Date:** 2026-08-15 · **Hardware:** RTX 5090, 32,607 MiB · **Runtime:** llama.cpp b9282

---

## The finding

**The upgrade buys token efficiency, not speed.**

Raw throughput is a tie — generation rate differs by 0.1–9%, and prefill actually
favours the *older* model by 1.5%. What changed is how many tokens the model burns
thinking before it answers. Qwen3.8 reached the same or better answers on **one-eighth**
the reasoning tokens, which is where the ~3x wall-clock improvement comes from.

| Metric | Qwen3.8 | Qwen3.6 | Delta |
|---|---:|---:|---|
| Accuracy (47 tasks) | **47/47 (100%)** | 44/47 (93.6%) | +3 tasks |
| Completion tokens | **6,408** | 51,436 | **8.03x fewer** |
| Wall clock | **516s** | 1,474s | 2.86x faster |
| Generation, short prompt | 43.02 t/s | 42.97 t/s | tie |
| Prefill @ 14k tokens | 1,549 t/s | **1,572 t/s** | 3.6 ahead 1.5% |

Full generated tables: [`results/summary/comparison.md`](results/summary/comparison.md).
Visual report: [`docs/report.html`](docs/report.html).

### Runaway reasoning is the real failure mode

Every one of the three failures was Qwen3.6's, and two share a mechanism worth knowing about.

On the two *easiest* coding tasks — nth Fibonacci and a palindrome check — Qwen3.6
reasoned until it hit the 8,192-token cap and never emitted a code block. Suspecting the
cap was simply too tight, both were re-run with a **32,768-token budget**. Both failed
again: `finish_reason: length`, still no code, after **844s and 815s** of continuous
generation. Qwen3.8 solved the same two in 209 and 125 tokens.

This is not a prompt artefact — Qwen3.6 solved the other four code tasks, including
harder ones (longest increasing subsequence, interval merging, island counting), using
the identical prompt template and extraction logic.

The third failure: reversing `benchmark` produced `kramhcn eb` — right letters, stray
space — after 2,653 reasoning tokens.

### What tied

Multi-step maths (7/7 both), reasoning traps (4/4 both), strict output formatting
(4/4 both), and three-needle retrieval at **84,147 prompt tokens** (both correct).
Only executed code separated them.

---

## Why it was run this way

Both models need ~22 GB at UD-Q4_K_XL, so they cannot be co-resident on a 32 GB card.
Everything is therefore **sequential swaps on the same port**, same binary, same flags —
which trades timing noise for a clean like-for-like comparison of everything else.

Held constant across both runs:

| Variable | Value |
|---|---|
| Quantisation | Unsloth Dynamic UD-Q4_K_XL |
| Context | 131,072, KV cache q8_0, flash-attn on |
| Concurrency | `--parallel 1` (no request overlap) |
| Sampling | `temperature 0`, seed 1234 |
| VRAM | 22,454 MiB (3.8) / 21,990 MiB (3.6) |

---

## How to run

Requires a llama.cpp server on `localhost:8002` with the model under test loaded.
Standard library only — no dependencies.

```bash
# baseline suite (25 tasks)
python3 src/bench.py  <label> results/raw/bench-<label>.json

# hard suite (22 tasks, includes executed code + 84k-token retrieval)
python3 src/bench2.py <label> results/raw/hard-<label>.json

# re-run specific code tasks with a 32k token budget
python3 src/retest.py <label> cd1,cd2

# regenerate results/summary/comparison.md from whatever is in results/raw/
python3 src/summarize.py
```

Swap the model between runs, keeping every server flag identical:

```bash
docker stop  llamacpp-qwen3.8-27b
docker start llamacpp-qwen3.6-27b-rollback
```

### Layout

```
src/bench.py       25-task baseline suite + throughput probes
src/bench2.py      22-task hard suite (maths, traps, executed code, format, long ctx)
src/retest.py      re-runs chosen code tasks at a raised token budget
src/summarize.py   regenerates the summary tables from raw JSON
results/raw/       per-run JSON + console transcripts (the evidence)
results/summary/   generated comparison tables — do not hand-edit
docs/report.html   standalone visual report
```

---

## Key learnings

**Build the harder suite first, or expect to build it twice.** The initial 25-task suite
scored **25/25 for both models** — a pure ceiling effect with zero discriminative power.
The 22 hard tasks are what produced any signal at all. A benchmark everything passes
measures nothing.

**Grade executed code, not prose about code.** Asking a model to *describe* an algorithm
is nearly free to pass. Extracting its function and running it against hidden vectors is
what surfaced the only real capability gap in the set.

**Verify your own ground truth before trusting a score.** Every expected answer here —
including all seven maths results — was computed independently before the run, and the
grader was self-tested against ten hand-written cases. Benchmarking against wrong answers
is worse than not benchmarking.

**A cap-exhaustion failure is not automatically a capability failure.** The first instinct
on seeing `cd1` fail at 8,192 tokens was "my budget is too tight". Re-running at 32,768
is what turned a measurement artefact hypothesis into a real, reportable finding — and it
would have been equally valuable had it gone the other way.

**Token efficiency is the metric that survives contact with reality.** Tokens/second is
what benchmarks advertise; tokens-to-answer is what determines latency and cost. Two
models with identical t/s differed by 2.86x in wall clock.

---

## Limits

- **47 tasks is a small sample.** A 47–44 split is suggestive, not statistically
  conclusive; the confidence interval on a three-task difference is wide.
- **Qwen3.8 saturated both suites at 100%**, so its headroom is unmeasured and the true
  gap may be larger than shown.
- **Runs were sequential, not interleaved** (VRAM constraint). Host load varied between
  blocks, adding noise to timing — though not to correctness.
- **Both are 4-bit quantisations**, not original weights; quantisation damage need not be
  equal across two different models.
- **Thinking left at each model's default.** Qwen3.8 ships a reasoning-effort control that
  3.6 lacks, so part of the token gap is a product decision rather than raw capability —
  but the tokens are spent either way.
- **No vendor claims were replicated.** Qwen's agentic-coding, computer-use and vision
  benchmarks need harnesses not present here. Vision was not tested at all.
