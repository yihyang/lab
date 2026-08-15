#!/usr/bin/env python3
"""Hard discriminative benchmark: multi-step math, executed code, traps,
strict formatting, multi-needle long context.

Usage: python3 bench2.py <label> <outfile.json>
"""

import json, os, re, subprocess, sys, tempfile, time, urllib.request

BASE = "http://localhost:8002"
LABEL = sys.argv[1] if len(sys.argv) > 1 else "unlabelled"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/tmp/bench2-out.json"
MAXTOK = 8192


def post(path, payload, timeout=1800):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())


THINK_RE = re.compile(r"<think>.*?</think>", re.S)


def final_answer(msg):
    c = msg.get("content") or ""
    c = THINK_RE.sub(" ", c)
    if "</think>" in c:
        c = c.split("</think>")[-1]
    return c.strip()


def last_int(text):
    nums = re.findall(r"-?\d+", (text or "").replace(",", ""))
    return nums[-1] if nums else None


# ------------------------------------------------------- hard math / logic
NUMERIC = [
    (
        "hm1",
        "hard_math",
        "How many positive integers less than 1000 are divisible by 3 or 5 but not by 15? Reply with only the number.",
        "400",
    ),
    (
        "hm2",
        "hard_math",
        "Find the sum of all two-digit prime numbers whose digit-reversal is also prime. Reply with only the number.",
        "429",
    ),
    (
        "hm3",
        "hard_math",
        "A number leaves remainder 3 when divided by 7, and remainder 4 when divided by 9. What is the smallest positive such number? Reply with only the number.",
        "31",
    ),
    (
        "hm4",
        "hard_math",
        "Pipe A fills a tank in 6 hours, pipe B in 12 hours. Working together, how many hours to fill it? Reply with only the number.",
        "4",
    ),
    (
        "hm5",
        "hard_math",
        "In how many ways can 5 distinct books be arranged in a row so that 2 particular books are adjacent? Reply with only the number.",
        "48",
    ),
    (
        "hm6",
        "hard_math",
        "How many trailing zeros are in 100! (100 factorial)? Reply with only the number.",
        "24",
    ),
    (
        "hm7",
        "hard_math",
        "A 3-digit number equals 11 times the sum of its digits. What is that number? Reply with only the number.",
        "198",
    ),
    (
        "tr1",
        "trap",
        "A farmer has 17 sheep. All but 9 die. How many sheep are left? Reply with only the number.",
        "9",
    ),
    (
        "tr2",
        "trap",
        "If 5 machines take 5 minutes to make 5 widgets, how many minutes do 100 machines take to make 100 widgets? Reply with only the number.",
        "5",
    ),
    (
        "tr3",
        "trap",
        "You are in a race and you overtake the person in second place. What place are you in now? Reply with only the ordinal number, e.g. '3rd'.",
        "2",
    ),
    (
        "tr4",
        "trap",
        "A bat and ball cost $1.10. The bat costs $1.00 more than the ball. In cents, what does the BALL cost? Reply with only the number.",
        "5",
    ),
]

# ------------------------------------------------------------ code (executed)
CODE_TASKS = [
    (
        "cd1",
        "def solve(n) returning the nth Fibonacci number, 0-indexed, where solve(0)==0 and solve(1)==1",
        [((0,), 0), ((1,), 1), ((10,), 55), ((30,), 832040), ((50,), 12586269025)],
    ),
    (
        "cd2",
        "def solve(s) returning True if s is a palindrome considering only alphanumeric characters and ignoring case, else False",
        [
            (("A man, a plan, a canal: Panama",), True),
            (("race a car",), False),
            ((" ",), True),
            (("ab_a",), True),
        ],
    ),
    (
        "cd3",
        "def solve(nums) returning the length of the longest strictly increasing subsequence of the list nums",
        [
            (([10, 9, 2, 5, 3, 7, 101, 18],), 4),
            (([0, 1, 0, 3, 2, 3],), 4),
            (([7, 7, 7, 7],), 1),
            (([],), 0),
        ],
    ),
    (
        "cd4",
        "def solve(s) returning the length of the longest substring of s without repeating characters",
        [(("abcabcbb",), 3), (("bbbbb",), 1), (("pwwkew",), 3), (("",), 0)],
    ),
    (
        "cd5",
        "def solve(intervals) that merges overlapping intervals (a list of [start,end] lists) and returns the merged list sorted by start",
        [
            (([[1, 3], [2, 6], [8, 10], [15, 18]],), [[1, 6], [8, 10], [15, 18]]),
            (([[1, 4], [4, 5]],), [[1, 5]]),
            (([],), []),
        ],
    ),
    (
        "cd6",
        "def solve(grid) counting the number of islands in a 2D grid of '1' (land) and '0' (water) strings, where islands connect horizontally/vertically",
        [
            (([["1", "1", "0"], ["1", "0", "0"], ["0", "0", "1"]],), 2),
            (([["1", "1"], ["1", "1"]],), 1),
            (([["0"]],), 0),
        ],
    ),
]

RUNNER = r"""
import json, sys
src = open(sys.argv[1]).read()
tests = json.load(open(sys.argv[2]))
ns = {}
try:
    exec(src, ns)
except Exception as e:
    print(json.dumps({"error": "exec: " + str(e)[:200]})); sys.exit(0)
fn = ns.get("solve")
if not callable(fn):
    print(json.dumps({"error": "no solve()"})); sys.exit(0)
passed = 0
detail = []
for args, want in tests:
    try:
        got = fn(*args)
        ok = got == want
        passed += ok
        detail.append({"args": repr(args)[:60], "want": repr(want)[:40], "got": repr(got)[:40], "ok": ok})
    except Exception as e:
        detail.append({"args": repr(args)[:60], "error": str(e)[:100], "ok": False})
print(json.dumps({"passed": passed, "total": len(tests), "detail": detail}))
"""


def extract_code(text):
    m = re.findall(r"```(?:python)?\s*(.*?)```", text, re.S)
    if m:
        return max(m, key=len)
    if "def solve" in text:
        return text[text.index("def solve") :]
    return None


def run_code_task(tid, spec, tests):
    prompt = (
        f"Write a Python function: {spec}.\n"
        "Output ONLY a single ```python code block containing the complete function. "
        "No explanation, no test code, no example usage."
    )
    rec = {"id": tid, "category": "code_exec"}
    t0 = time.time()
    try:
        d = post(
            "/v1/chat/completions",
            {
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": MAXTOK,
                "temperature": 0.0,
                "seed": 1234,
            },
        )
        msg = d["choices"][0]["message"]
        ans = final_answer(msg)
        rec["completion_tokens"] = d.get("usage", {}).get("completion_tokens")
        rec["finish"] = d["choices"][0].get("finish_reason")
        code = extract_code(ans)
        if not code:
            rec.update({"correct": False, "note": "no code block", "answer": ans[:200]})
        else:
            with tempfile.TemporaryDirectory() as td:
                cf, tf, rf = (
                    os.path.join(td, n) for n in ("sol.py", "tests.json", "run.py")
                )
                open(cf, "w").write(code)
                json.dump([[list(a), w] for a, w in tests], open(tf, "w"))
                open(rf, "w").write(RUNNER)
                try:
                    p = subprocess.run(
                        [sys.executable, rf, cf, tf],
                        capture_output=True,
                        text=True,
                        timeout=30,
                    )
                    res = json.loads(p.stdout.strip() or "{}")
                except subprocess.TimeoutExpired:
                    res = {"error": "timeout"}
                except Exception as e:
                    res = {"error": str(e)[:150]}
            rec["exec"] = res
            rec["correct"] = (
                res.get("passed") == res.get("total") and res.get("total", 0) > 0
            )
            rec["tests_passed"] = (
                f"{res.get('passed', 0)}/{res.get('total', len(tests))}"
            )
    except Exception as e:
        rec.update({"correct": False, "error": str(e)[:200]})
    rec["wall_s"] = round(time.time() - t0, 2)
    return rec


# -------------------------------------------------------------- format tasks
def check_five_words(ans):
    words = [w for w in re.split(r"\s+", ans.strip()) if w]
    return len(words) == 5 and not re.search(r"[.,;:!?]", ans)


def check_json_schema(ans):
    m = re.search(r"\{.*\}", ans, re.S)
    if not m:
        return False
    try:
        o = json.loads(m.group(0))
    except Exception:
        return False
    return (
        isinstance(o.get("name"), str)
        and o.get("name") == "Marcus"
        and isinstance(o.get("age"), int)
        and o["age"] == 41
    )


def check_csv(ans):
    return ans.strip().splitlines()[-1].strip() == "A,B,C" if ans.strip() else False


def check_numbered(ans):
    lines = [l.strip() for l in ans.strip().splitlines() if l.strip()]
    nums = [l for l in lines if re.match(r"^\d+[.)]\s+\S", l)]
    return len(nums) == 3


FORMAT_TASKS = [
    (
        "f1",
        "Reply with a sentence of exactly five words. Use no punctuation at all.",
        check_five_words,
    ),
    (
        "f2",
        'Extract to JSON. Text: "Marcus turned 41 last spring." '
        'Output ONLY a JSON object with keys "name" (string) and "age" (integer). No code fence.',
        check_json_schema,
    ),
    (
        "f3",
        "Output exactly the letters A, B and C separated by commas with no spaces and nothing else.",
        check_csv,
    ),
    (
        "f4",
        "List exactly three primary colours as a numbered list, one per line, formatted as '1. ', '2. ', '3. '. Output nothing else.",
        check_numbered,
    ),
]


# ------------------------------------------------------ multi-needle long ctx
def build_multineedle(units=4200):
    filler = (
        "Routine telemetry indicates nominal operation across all monitored subsystems. "
        "No anomalies were recorded during this reporting interval. "
    )
    needles = {
        int(units * 0.15): "The Helsinki depot authorization code is 47231. ",
        int(units * 0.50): "The Reykjavik depot authorization code is 88914. ",
        int(units * 0.85): "The Lisbon depot authorization code is 60357. ",
    }
    parts = []
    for i in range(units):
        if i in needles:
            parts.append(needles[i])
        parts.append(filler)
    body = "".join(parts)
    q = (
        "\n\nBased only on the text above, list the three depot authorization codes "
        "in this exact order: Helsinki, Reykjavik, Lisbon. "
        "Reply with only the three numbers separated by commas, e.g. 111,222,333"
    )
    return body + q


def check_multineedle(ans):
    nums = re.findall(r"\d{5}", ans.replace(",", " "))
    return nums[-3:] == ["47231", "88914", "60357"] if len(nums) >= 3 else False


def run_generic(tid, cat, prompt, checker):
    rec = {"id": tid, "category": cat}
    t0 = time.time()
    try:
        d = post(
            "/v1/chat/completions",
            {
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": MAXTOK,
                "temperature": 0.0,
                "seed": 1234,
            },
        )
        msg = d["choices"][0]["message"]
        ans = final_answer(msg)
        rec.update(
            {
                "answer": ans[:200],
                "correct": bool(checker(ans)),
                "completion_tokens": d.get("usage", {}).get("completion_tokens"),
                "prompt_tokens": d.get("usage", {}).get("prompt_tokens"),
                "finish": d["choices"][0].get("finish_reason"),
            }
        )
    except Exception as e:
        rec.update({"correct": False, "error": str(e)[:200]})
    rec["wall_s"] = round(time.time() - t0, 2)
    return rec


if __name__ == "__main__":
    print(f"=== HARD BENCH {LABEL} ===", flush=True)
    t_start = time.time()
    results = []

    for tid, cat, prompt, expected in NUMERIC:
        r = run_generic(tid, cat, prompt, lambda a, e=expected: last_int(a) == e)
        r["expected"] = expected
        results.append(r)
        print(
            f"  [{LABEL}] {tid:4s} {r['category']:10s} correct={r['correct']} "
            f"tok={r.get('completion_tokens')} {r['wall_s']}s",
            flush=True,
        )

    for tid, spec, tests in CODE_TASKS:
        r = run_code_task(tid, spec, tests)
        results.append(r)
        print(
            f"  [{LABEL}] {tid:4s} code_exec   correct={r['correct']} "
            f"tests={r.get('tests_passed')} tok={r.get('completion_tokens')} {r['wall_s']}s",
            flush=True,
        )

    for tid, prompt, checker in FORMAT_TASKS:
        r = run_generic(tid, "format", prompt, checker)
        results.append(r)
        print(
            f"  [{LABEL}] {tid:4s} format     correct={r['correct']} "
            f"tok={r.get('completion_tokens')} {r['wall_s']}s",
            flush=True,
        )

    mn = build_multineedle()
    r = run_generic("ln1", "longctx_multi", mn, check_multineedle)
    results.append(r)
    print(
        f"  [{LABEL}] ln1  longctx_multi correct={r['correct']} "
        f"ptok={r.get('prompt_tokens')} {r['wall_s']}s",
        flush=True,
    )

    total = len(results)
    correct = sum(1 for r in results if r.get("correct"))
    bycat = {}
    for r in results:
        c = bycat.setdefault(r["category"], [0, 0])
        c[1] += 1
        c[0] += 1 if r.get("correct") else 0
    summary = {
        "label": LABEL,
        "total_tasks": total,
        "correct": correct,
        "accuracy_pct": round(100.0 * correct / total, 1),
        "by_category": {k: f"{v[0]}/{v[1]}" for k, v in bycat.items()},
        "total_completion_tokens": sum(
            r.get("completion_tokens") or 0 for r in results
        ),
        "bench_wall_s": round(time.time() - t_start, 1),
    }
    json.dump({"summary": summary, "results": results}, open(OUT, "w"), indent=2)
    print(json.dumps(summary, indent=2), flush=True)
