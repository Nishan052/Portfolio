# lost-in-the-middle

Claim: Where a retrieved chunk sits in the context window changes whether the model uses it, independent of retrieval quality. Mid-context placement costs 20+ points of accuracy vs first position.
Status: cited
Evidence: Liu et al., Lost in the Middle, TACL 2024, arXiv:2307.03172
Date: 2026-09-06

---

Retrieval found the answer. The model still missed it.

Liu et al. measured this properly in Lost in the Middle. Put the correct document first in the context and accuracy is high. Put the same document in the middle of the same context and accuracy drops by more than twenty points. Nothing about the retrieval changed. Only the position did.

The shape is a U. Models attend well to the start and the end of a context window and poorly to everything between. That is structural, not a bug in one model family, and a bigger context window makes the dead zone larger rather than smaller.

So the reranker is doing half a job. It sorts your chunks by relevance and then hands them over in that order, which puts your second-best chunk exactly where the model is least likely to read it.

The fix is not a better retriever. Rerank, then reorder: best chunks to the edges, weakest in the middle. Cut k while you are at it, because twenty mediocre chunks bury the good one deeper.

And measure position, not just recall at k. Recall at k says the answer was in the prompt. It does not say the model ever looked at it.

Paper: https://arxiv.org/abs/2307.03172

#ContextEngineering #RAG #LLMOps #AIAgents
