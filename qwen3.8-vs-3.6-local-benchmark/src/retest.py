#!/usr/bin/env python3
"""Re-run the code tasks that hit the token cap, with a much larger budget,
to separate 'ran out of thinking budget' from 'cannot solve'."""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(os.path.dirname(HERE), "results", "raw")
sys.path.insert(0, HERE)
import bench2

bench2.MAXTOK = 32768
label = sys.argv[1] if len(sys.argv) > 1 else "unknown"
targets = sys.argv[2].split(",") if len(sys.argv) > 2 else ["cd1", "cd2"]

out = {}
for tid, spec, tests in bench2.CODE_TASKS:
    if tid not in targets:
        continue
    r = bench2.run_code_task(tid, spec, tests)
    out[tid] = r
    print(
        "{}: correct={} tests={} tok={} finish={} note={} {}s".format(
            tid,
            r.get("correct"),
            r.get("tests_passed"),
            r.get("completion_tokens"),
            r.get("finish"),
            r.get("note"),
            r.get("wall_s"),
        ),
        flush=True,
    )

os.makedirs(RAW, exist_ok=True)
dest = os.path.join(RAW, "retest-%s.json" % label)
json.dump(out, open(dest, "w"), indent=2)
print("WROTE %s" % dest, flush=True)
