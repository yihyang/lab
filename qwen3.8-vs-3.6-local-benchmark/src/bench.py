#!/usr/bin/env python3
"""Head-to-head benchmark harness for llama.cpp-served models on :8002.

Measures: throughput (prompt eval / generation), TTFT, and exact-match quality.
Usage: python3 bench.py <label> <outfile.json>
"""

import json, re, sys, time, urllib.request

BASE = "http://localhost:8002"
LABEL = sys.argv[1] if len(sys.argv) > 1 else "unlabelled"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/bench-out.json"


def post(path, payload, timeout=900):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


# ---------------------------------------------------------------- quality set
# Each: (id, category, prompt, expected-answer matcher)
TASKS = [
    ("m1", "math", "What is 17*23? Reply with only the number.", "391"),
    (
        "m2",
        "math",
        "Pens cost $3 each and notebooks $7 each. Alice buys 4 pens and 3 notebooks. What is the total in dollars? Reply with only the number.",
        "33",
    ),
    ("m3", "math", "What is 15% of 240? Reply with only the number.", "36"),
    ("m4", "math", "If x + 7 = 22, what is 3x? Reply with only the number.", "45"),
    (
        "m5",
        "math",
        "What is the sum of all integers from 1 to 100 inclusive? Reply with only the number.",
        "5050",
    ),
    (
        "m6",
        "math",
        "A train travels 180 km in 2.5 hours. What is its average speed in km/h? Reply with only the number.",
        "72",
    ),
    (
        "m7",
        "math",
        "A rectangle has perimeter 34 and width 6. What is its area? Reply with only the number.",
        "66",
    ),
    (
        "l1",
        "logic",
        "All bloops are razzies. All razzies are lazzies. Are all bloops lazzies? Reply with only yes or no.",
        "yes",
    ),
    (
        "l2",
        "logic",
        "Tom is taller than Sam. Sam is taller than Bob. Who is shortest? Reply with only the name.",
        "bob",
    ),
    (
        "l3",
        "logic",
        "I have 3 apples. I eat 1, then buy 5 more, then give away 2. How many apples do I have? Reply with only the number.",
        "5",
    ),
    (
        "l4",
        "logic",
        "What day of the week comes 3 days after Friday? Reply with only the day name.",
        "monday",
    ),
    (
        "l5",
        "logic",
        "A bat and a ball cost $1.10 total. The bat costs $1.00 more than the ball. How many cents does the ball cost? Reply with only the number.",
        "5",
    ),
    (
        "c1",
        "code",
        "In Python, what does this print: print(len([x for x in range(10) if x%3==0])) — reply with only the output.",
        "4",
    ),
    (
        "c2",
        "code",
        "In Python, what does this print: print(sum(range(1,6))) — reply with only the output.",
        "15",
    ),
    ("c3", "code", "In Python, what is 7//2? Reply with only the number.", "3"),
    (
        "c4",
        "code",
        "In Python, what does [1,2,3][::-1] evaluate to? Reply with only the list literal.",
        "[3, 2, 1]",
    ),
    (
        "c5",
        "code",
        "In Python, what does print(bool([])) output? Reply with only the output.",
        "false",
    ),
    (
        "s1",
        "string",
        "Reverse the string 'benchmark'. Reply with only the reversed string.",
        "kramhcneb",
    ),
    (
        "s2",
        "string",
        "How many times does the letter r appear in the word 'strawberry'? Reply with only the number.",
        "3",
    ),
    (
        "s3",
        "string",
        "Reply with exactly the word BANANA in uppercase and nothing else.",
        "banana",
    ),
    (
        "k1",
        "knowledge",
        "What is the capital city of Australia? Reply with only the city name.",
        "canberra",
    ),
    (
        "k2",
        "knowledge",
        "What is the chemical symbol for gold? Reply with only the symbol.",
        "au",
    ),
    (
        "k3",
        "knowledge",
        "In what year did the Berlin Wall fall? Reply with only the year.",
        "1989",
    ),
]


def build_needle(depth_frac, filler_units=900):
    """Long-context retrieval: hide a fact at a given depth in filler text."""
    filler = (
        "The quarterly logistics report notes routine warehouse throughput. "
        "Inventory levels remained within expected tolerances. "
    )
    secret = "The authorization code for the Helsinki depot is 47231. "
    n_before = int(filler_units * depth_frac)
    body = filler * n_before + secret + filler * (filler_units - n_before)
    prompt = (
        body + "\n\nBased only on the text above, what is the authorization code "
        "for the Helsinki depot? Reply with only the number."
    )
    return prompt


TASKS.append(("n1", "longctx", build_needle(0.25), "47231"))
TASKS.append(("n2", "longctx", build_needle(0.75), "47231"))


THINK_RE = re.compile(r"<think>.*?</think>", re.S)


def final_answer(msg):
    """Strip reasoning so grading sees only the model's final answer."""
    content = msg.get("content") or ""
    content = THINK_RE.sub(" ", content)
    # some builds surface reasoning in a separate field; content is already clean then
    if "</think>" in content:
        content = content.split("</think>")[-1]
    return content.strip()


def norm(s):
    return re.sub(r"[^a-z0-9\[\], ]", "", s.lower()).strip()


def grade(got, expected):
    g, e = norm(got), norm(expected)
    if not g:
        return False
    if e in ("yes", "no"):
        return g.split()[0].startswith(e) if g.split() else False
    # numeric expectations: compare extracted numbers
    if re.fullmatch(r"-?\d+", expected):
        nums = re.findall(r"-?\d+", g.replace(",", ""))
        return bool(nums) and nums[-1] == expected
    return e in g


def run_quality():
    results = []
    for tid, cat, prompt, expected in TASKS:
        rec = {"id": tid, "category": cat, "expected": expected}
        t0 = time.time()
        try:
            d = post(
                "/v1/chat/completions",
                {
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 4096,
                    "temperature": 0.0,
                    "seed": 1234,
                },
            )
            msg = d["choices"][0]["message"]
            ans = final_answer(msg)
            rec.update(
                {
                    "ok": True,
                    "answer": ans[:200],
                    "correct": grade(ans, expected),
                    "completion_tokens": d.get("usage", {}).get("completion_tokens"),
                    "prompt_tokens": d.get("usage", {}).get("prompt_tokens"),
                    "finish": d["choices"][0].get("finish_reason"),
                    "wall_s": round(time.time() - t0, 2),
                }
            )
        except Exception as e:
            rec.update(
                {
                    "ok": False,
                    "error": str(e)[:200],
                    "correct": False,
                    "wall_s": round(time.time() - t0, 2),
                }
            )
        results.append(rec)
        print(
            f"  [{LABEL}] {tid:4s} {cat:9s} correct={rec.get('correct')} "
            f"tok={rec.get('completion_tokens')} {rec.get('wall_s')}s",
            flush=True,
        )
    return results


# ------------------------------------------------------------------- perf set
def run_perf():
    """Use llama.cpp native /completion which returns detailed timings."""
    filler = "The system processes data in batches. " * 1  # ~8 tokens
    cases = [
        ("short", "Write a haiku about databases.", 128),
        ("medium", filler * 250 + "\nSummarize the above in one sentence.", 128),
        ("long", filler * 2000 + "\nSummarize the above in one sentence.", 128),
    ]
    out = []
    for name, prompt, npred in cases:
        runs = []
        for i in range(3):
            try:
                t0 = time.time()
                d = post(
                    "/completion",
                    {
                        "prompt": prompt,
                        "n_predict": npred,
                        "temperature": 0.0,
                        "seed": 99,
                        "cache_prompt": False,
                    },
                )
                tm = d.get("timings", {})
                runs.append(
                    {
                        "prompt_n": tm.get("prompt_n"),
                        "prompt_per_second": tm.get("prompt_per_second"),
                        "predicted_n": tm.get("predicted_n"),
                        "predicted_per_second": tm.get("predicted_per_second"),
                        "wall_s": round(time.time() - t0, 2),
                    }
                )
            except Exception as e:
                runs.append({"error": str(e)[:200]})
        good = [r for r in runs if "error" not in r and r.get("predicted_per_second")]
        med = None
        if good:
            gen = sorted(r["predicted_per_second"] for r in good)[len(good) // 2]
            pp = sorted(
                r["prompt_per_second"] for r in good if r.get("prompt_per_second")
            )
            med = {
                "gen_tok_s": round(gen, 2),
                "prompt_tok_s": round(pp[len(pp) // 2], 2) if pp else None,
                "prompt_n": good[0].get("prompt_n"),
            }
        out.append({"case": name, "runs": runs, "median": med})
        print(f"  [{LABEL}] perf/{name}: {med}", flush=True)
    return out


if __name__ == "__main__":
    print(f"=== BENCH {LABEL} ===", flush=True)
    t_start = time.time()
    perf = run_perf()
    qual = run_quality()
    total = len(qual)
    correct = sum(1 for r in qual if r.get("correct"))
    tok = sum(r.get("completion_tokens") or 0 for r in qual)
    summary = {
        "label": LABEL,
        "total_tasks": total,
        "correct": correct,
        "accuracy_pct": round(100.0 * correct / total, 1) if total else None,
        "total_completion_tokens": tok,
        "bench_wall_s": round(time.time() - t_start, 1),
    }
    json.dump(
        {"summary": summary, "perf": perf, "quality": qual}, open(OUT, "w"), indent=2
    )
    print(json.dumps(summary, indent=2), flush=True)
