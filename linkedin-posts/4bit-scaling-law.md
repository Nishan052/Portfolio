# 4bit-scaling-law

Claim: For a fixed inference memory budget, 4-bit weights give better zero-shot accuracy than 8-bit or 16-bit at the same total bits, so the accuracy-per-bit optimum is lower than most deployments assume.
Status: cited
Evidence: Dettmers & Zettlemoyer, The case for 4-bit precision, ICML 2023, arXiv:2212.09720
Date: 2026-09-06

---
On a device with fixed memory, a big model stored roughly beats a small model stored precisely, and the sweet spot is 4 bits.

Every number in a model takes up room, so storing each one with fewer bits shrinks the model but also makes it less exact, and the question is where to trade.

Dettmers and Zettlemoyer ran about 35,000 tests to find out, on models from 19 million to 176 billion parameters, storing each number in anything from 16 bits down to 3.

What I liked is that they asked how much accuracy you get for each bit of memory, and the answer was 4 bits almost everywhere. At the same memory budget, 4 bits beat both 8 and 16 at nearly every model size.

Below 4 bits the line turns back down, because at 3 bits the damage was worse than the extra room was worth, so there's a floor and it's close.

There are two limits, though. How you round the numbers matters on its own, apart from how far you round them, and this is about accuracy for a memory budget, so speed is a separate test that doesn't come free.

Right now I'm running the speed half on an M3 Air, and I'll share the numbers when I have them.

Paper: https://arxiv.org/abs/2212.09720

#EdgeAI #OnDeviceAI #LLMOps #MachineLearning
