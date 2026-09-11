# lost-in-the-middle

Claim: Where a retrieved chunk sits in the context window changes whether the model uses it, independent of retrieval quality. Mid-context placement costs 20+ points of accuracy vs first position.
Status: cited
Evidence: Liu et al., Lost in the Middle, TACL 2024, arXiv:2307.03172
Date: 2026-09-06

---
Your search found the right document. The model still got the answer wrong.

Liu and colleagues measured this. They put the correct document first in the text handed to the model, and accuracy was high.

They put the same document in the middle, and accuracy fell by more than twenty points. The search did not change. Only the position did.

The shape is a U. Models read the start and the end of what you give them. They skim the middle. This is not a fault in one model, and a longer input makes the dead zone bigger, not smaller.

So your ranker is doing half the job. It sorts your chunks best first, then hands them over in that order. That puts your second best chunk exactly where the model is least likely to read it.

The fix is not better search. Rank them, then reorder. Best at the edges, weakest in the middle. Send fewer while you are at it, because twenty average chunks bury the good one deeper.

And measure position, not just whether the answer was in there. Knowing it was in the text does not mean the model ever looked at it.

Paper: https://arxiv.org/abs/2307.03172

#ContextEngineering #RAG #LLMOps #AIAgents
