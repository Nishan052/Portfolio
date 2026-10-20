# feasibility-ceiling-holds

Claim: Single-stream decode throughput has a hard ceiling of memory bandwidth divided by bytes read per token. Across 16 measured figures spanning three platform families, that ceiling is never exceeded, and a band of 38% to 85% of it contains every one.
Status: proven
Evidence: 16 independent measured figures shipped in references/measurements.json, 14 from the llama.cpp Apple Silicon thread plus 2 held-out platforms; scored by feasibility.py --validate and asserted in test_edge_feasibility.py
Date: 2026-10-20

---
Before buying hardware I wanted to know how fast a 7 billion parameter model would run, and the number that answers it is the memory speed.

A model writes one token at a time, which is roughly one word, and every token needs all of its weights read out of memory once. So the limit is how many gigabytes per second the memory can hand over, divided by the size of the model in gigabytes.

On an Apple M2 that is 100 gigabytes per second over a 3.79 gigabyte model, so 26.4 tokens per second at most, and the published measurement for that chip is 21.9.

I checked this against 16 measurements that other people published, from Apple chips, a Raspberry Pi 5 and a Jetson Orin Nano Super. None went over the limit and they landed between 40 and 83 percent of it, which is why my tool gives a range and not a single number.

I first fitted one curve to the Apple chips and it missed the Pi and the Jetson by about 49 percent, so I dropped it.

The practical use is that a claim of 30 tokens per second for that model on a Pi 5 is ten times over its limit, and I can say so without owning the board.

Repo: https://github.com/Nishan052/AgentLake

#EdgeAI #OnDeviceAI #MachineLearning #LLMOps
