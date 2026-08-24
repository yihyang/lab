# Lab

This repository contains demos, POCs, experiments, and learnings. The code inside this repository are not meant for immediate production usage.

**Purpose:** Quick reference catalog for past experiments and reusable code snippets.

## Quick Navigation

<!-- Add project links here as you create them -->

| Project | Description | Tech Stack | Status |
|---------|-------------|------------|--------|
| [qwen3.8-vs-3.6-local-benchmark](qwen3.8-vs-3.6-local-benchmark/) | Head-to-head of two local 27B models on one RTX 5090 — same throughput, 8x fewer reasoning tokens | Python, llama.cpp, Docker | Complete |

## Repository Structure

```
lab/
├── project-name/          # Individual project or POC
│   ├── README.md          # Project-specific documentation
│   ├── src/               # Source code
│   └── docs/              # Additional project docs
└── README.md              # This file - project catalog
```

## Project Template

Each subfolder should contain:
- **README.md** - What, why, how to run, key learnings
- **Relevant code/artifacts** - Self-contained and runnable
- **docs/** (optional) - Detailed notes, architecture diagrams, decisions

## Usage

1. Browse the table above or project folders
2. Each project's README explains:
   - Problem/solution overview
   - Setup/run instructions
   - Key findings or gotchas
   - Reusable components

## Notes

- Projects use diverse tech stacks based on experimentation needs
- Most are small-scale POCs, not production-ready code
- Focus on learning and quick reference over completeness
