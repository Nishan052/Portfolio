# lost-in-the-middle

Claim: Where a retrieved chunk sits in the context window changes whether the model uses it, independent of retrieval quality. Mid-context placement costs 20+ points of accuracy vs first position.
Status: cited
Evidence: Liu et al., Lost in the Middle, TACL 2024, arXiv:2307.03172
Date: 2026-09-06

---
When your search step finds the right document, the model can still get the answer wrong just because of where that document sits in the text you hand it.

Liu and colleagues measured this by putting the correct document first in the model's input, and accuracy was high. Then they moved the same document into the middle, and accuracy fell by more than twenty points even though the search hadn't changed at all.

The shape is a U, a bit like how most of us read a long email thread. The start and the end get read properly and the middle gets skimmed, and it isn't a fault in one model, since a longer input only makes that middle bigger.

So for me the ranker is doing half the job. It sorts your chunks best first and hands them over in that order, which puts your second best chunk right where the model is least likely to read it.

The fix is to rank them and then reorder, with the best at the edges and the weakest in the middle. I'd send fewer while you're at it, because twenty average chunks bury the good one deeper.

I'd also measure where the answer sat as well as whether it was in there, since knowing it was in the text doesn't mean the model ever looked at it.

Paper: https://arxiv.org/abs/2307.03172

#ContextEngineering #RAG #LLMOps #AIAgents
