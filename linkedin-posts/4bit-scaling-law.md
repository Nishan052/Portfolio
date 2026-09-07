# 4bit-scaling-law

Claim: For a fixed inference memory budget, 4-bit weights give better zero-shot accuracy than 8-bit or 16-bit at the same total bits, so the accuracy-per-bit optimum is lower than most deployments assume.
Status: cited
Evidence: Dettmers & Zettlemoyer, The case for 4-bit precision, ICML 2023, arXiv:2212.09720
Date: 2026-09-06

---

If your memory budget is fixed, the right move is a bigger model at 4-bit, not a smaller one at 8-bit.

Dettmers and Zettlemoyer ran roughly 35,000 experiments across model families from 19M to 176B parameters, sweeping precision from 16-bit down to 3-bit. The question was not which quantisation is most accurate. It was which gives the most accuracy per bit stored.

The answer was 4-bit, almost everywhere. At a fixed total bit budget, 4-bit weights beat both 8-bit and 16-bit on zero-shot accuracy across nearly every scale they tested.

Below 4-bit the curve turns over. At 3-bit the loss outweighed the extra capacity the saved bits bought, which puts a floor under how far this argument goes.

Two details matter if you are deploying this. Block size and the quantisation data type moved results independently of bit width, so how you quantise is a separate decision from how far you quantise. And the finding is about accuracy under a memory budget, not latency. Latency is its own measurement and does not follow for free.

I am running that latency half on an M3 Air. Numbers when I have them.

Paper: https://arxiv.org/abs/2212.09720

#EdgeAI #OnDeviceAI #LLMOps #MachineLearning
