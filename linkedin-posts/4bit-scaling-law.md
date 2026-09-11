# 4bit-scaling-law

Claim: For a fixed inference memory budget, 4-bit weights give better zero-shot accuracy than 8-bit or 16-bit at the same total bits, so the accuracy-per-bit optimum is lower than most deployments assume.
Status: cited
Evidence: Dettmers & Zettlemoyer, The case for 4-bit precision, ICML 2023, arXiv:2212.09720
Date: 2026-09-06

---
You have a fixed amount of memory. You can fit a big model stored roughly, or a small model stored precisely. The big rough one wins.

Every number in a model takes up room. Store each one with fewer bits and the model shrinks. It also gets less exact. So the question is where to trade.

Dettmers and Zettlemoyer ran about 35,000 tests to find out. Model sizes from 19 million to 176 billion. Storage from 16 bits per number down to 3.

They did not ask which setting is most correct. They asked which gives the most accuracy per bit of memory. The answer was 4 bits, almost everywhere. At the same memory budget, 4 bits beat both 8 and 16 at nearly every size.

Below 4 the line turns back down. At 3 bits the damage was worse than the extra room was worth. So there is a floor, and it is close.

Two things to keep in mind. How you round the numbers matters on its own, apart from how far you round them. And this is about accuracy for a memory budget, not speed. Speed is a separate test and does not come free.

I am running the speed half on an M3 Air. Numbers when I have them.

Paper: https://arxiv.org/abs/2212.09720

#EdgeAI #OnDeviceAI #LLMOps #MachineLearning
