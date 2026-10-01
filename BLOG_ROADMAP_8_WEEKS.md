# RAG Blog Roadmap: Next 8 Weeks (W10–W17)

Planning horizon starting 2026-06-29. One post per week, continuing the weekly cadence.
Current state: latest post is **id 19** (`late-interaction-retrieval-colbert-reranking-rag`, 2026-06-22).
Every topic below was chosen to be both (a) uncovered by the existing series and (b) actively trending in the 2026 market, based on research across arXiv, engineering blogs, Reddit/LocalLLaMA, LinkedIn, and Substack.

## Arc logic

The eight weeks move from retrieval mechanics, into how the model actually uses what it retrieves, then up to architecture-level decisions, evaluation, memory, multimodal, and finally the meta-discipline tying it together.

```
Retrieval quality -> Context utilization -> Architecture choice -> Evaluation -> Memory -> Multimodal -> Meta-discipline
```

| Week | Date (target) | id | Working title | Category |
|------|---------------|----|---------------|----------|
| W10 | 2026-06-29 | 20 | Hybrid search and RRF: why BM25 still beats pure vectors | research |
| W11 | 2026-07-06 | 21 | Lost in the middle: reordering retrieved context | research |
| W12 | 2026-07-13 | 22 | RAG vs long context: a cost and latency decision framework | news |
| W13 | 2026-07-20 | 23 | Cache-augmented generation: when to skip retrieval entirely | research |
| W14 | 2026-07-27 | 24 | Beyond RAGAS: measuring whether the model uses your context | research |
| W15 | 2026-08-03 | 25 | Agent memory is not RAG: stateful retrieval for agents | research |
| W16 | 2026-08-10 | 26 | Multimodal RAG: retrieving over images, tables and PDFs | research |
| W17 | 2026-08-17 | 27 | Context engineering: the discipline that replaced prompts | news |

---

## W10 — Hybrid search and RRF

- **Problem hook**: Pure vector search misses exact terms, rare tokens, codes, and IDs that dense embeddings smooth away. Practitioners report hybrid (BM25 + dense) with Reciprocal Rank Fusion is now the production default, not an upgrade.
- **Why now**: Community consensus in 2026 treats vector-only retrieval as demo code. Hybrid + RRF shows a consistent MRR gap over vector-only on real corpora.
- **Sections**: lexical vs dense failure modes; RRF mechanics; tuning the fusion weight; when sparse alone wins.
- **Diagrams**: two-path retrieval merged by RRF; a failure-mode table; score-fusion flow.
- **Candidate references**: Robertson & Zaragoza (2009) BM25 / Okapi; Formal et al. (2021) SPLADE (arXiv:2107.05720); Gupta et al. (2025) RAG survey (arXiv:2506.00054).
- **LinkedIn angle**: "Your vector DB is not enough. Here is why BM25 from 2009 still earns its place in 2026 RAG."

## W11 — Lost in the middle: reordering retrieved context

- **Problem hook**: Models systematically ignore evidence buried in the middle of the context window. Good retrieval still fails if the right chunk lands in the dead zone.
- **Why now**: Position bias is structural to transformer attention and no 2026 frontier model has removed it. A cheap reorder (best chunks at the edges) recovers measurable accuracy.
- **Sections**: the U-shaped accuracy curve; why RoPE causes it; reordering strategies; interaction with reranking from W9.
- **Diagrams**: position-vs-accuracy curve described as text flow; reorder pipeline; multi-hop case.
- **Candidate references**: Liu et al. (2024) "Lost in the Middle" (arXiv:2307.03172); Li et al. (2025) long-context vs RAG (arXiv:2501.01880).
- **LinkedIn angle**: "Retrieval found the answer. The model still missed it. The fix is reordering, not a bigger model."

## W12 — RAG vs long context: a decision framework

- **Problem hook**: Million-token context windows revived "RAG is dead." The economics say otherwise: long context costs roughly three orders of magnitude more per query and adds tens of seconds of latency.
- **Why now**: 2026 frontier models ship 1M–10M token windows. The mature answer is query-aware routing (SELF-ROUTE style), not picking one camp.
- **Sections**: cost and latency math; what each approach wins; per-query routing; hybrid (retrieve into a moderate window).
- **Diagrams**: routing decision tree; cost/latency comparison table; hybrid pipeline.
- **Candidate references**: Li et al. (2025) "Long Context vs RAG: An Evaluation and Revisits" (arXiv:2501.01880); Gupta et al. (2025) RAG survey (arXiv:2506.00054).
- **LinkedIn angle**: "1M-token windows did not kill RAG. They made the routing decision the whole game."

## W13 — Cache-augmented generation (CAG)

- **Problem hook**: For a small, stable corpus, retrieving per query is wasted work. CAG precomputes the KV cache for the whole corpus once and reuses it, removing retrieval from the hot path.
- **Why now**: CAG is emerging as a peer architecture to RAG in 2026, with work like CacheClip and TurboRAG making cache reuse practical.
- **Sections**: what KV cache reuse buys; CAG vs RAG cost profile; when the corpus is small enough; hybrid CAG-plus-RAG.
- **Diagrams**: CAG preprocessing vs RAG per-query flow; decision table by corpus size and churn.
- **Candidate references**: Yang et al. (2026) "CacheClip" (arXiv:2510.10129); Li et al. (2025) long-context evaluation (arXiv:2501.01880).
- **LinkedIn angle**: "If your knowledge base fits in context and rarely changes, you may not need retrieval at all."

## W14 — Beyond RAGAS: measuring context utilization

- **Problem hook**: Retrieval accuracy explains only part of RAG quality. A system can retrieve well and still ignore or misuse the context, and RAGAS scores can be gamed.
- **Why now**: 2026 practitioners report overfitting to eval metrics. The frontier is faithfulness detection and context-utilization measurement, not just retrieval precision.
- **Sections**: the metric blind spots; counterfactual test (does removing context change the answer); faithfulness tooling; eval gates in CI.
- **Diagrams**: three-layer eval flow; counterfactual test flow; pass/fail gate.
- **Candidate references**: Es et al. (2023) RAGAS (arXiv:2309.15217); faithfulness-leaderboard work (arXiv:2505.04847); Gupta et al. (2025) survey (arXiv:2506.00054).
- **LinkedIn angle**: "If deleting the retrieved context does not change your answer, your retrieval is overhead. Test for it."

## W15 — Agent memory is not RAG

- **Problem hook**: Teams bolt a vector store onto an agent and call it memory. RAG is stateless retrieval over a corpus. Memory is stateful persistence of experience and dialogue across sessions.
- **Why now**: 2026 agents use both together. The distinction (correlated session history vs diverse documents) drives different retrieval designs.
- **Sections**: RAG vs memory definitions; semantic vs episodic memory; hierarchical organization; retrieval differences.
- **Diagrams**: RAG-vs-memory split; memory write/read loop; combined agent stack.
- **Candidate references**: Hu et al. (2026) "Memory in the Age of AI Agents: A Survey" (arXiv:2512.13564); Gupta et al. (2025) RAG survey (arXiv:2506.00054).
- **LinkedIn angle**: "A vector store is not agent memory. The difference decides whether your agent stays coherent across a conversation."

## W16 — Multimodal RAG

- **Problem hook**: Most enterprise content is PDFs with tables, charts, and layout. Parsing to text discards the structure that holds the answer.
- **Why now**: ColPali and ViDoRe (carried over from the W9 late-interaction post) made image-native retrieval practical; M4-RAG at CVPR 2026 benchmarks it at scale.
- **Sections**: the parse-then-chunk failure; image-native retrieval; cost and latency of vision embeddings; when text extraction is still fine.
- **Diagrams**: text-parse pipeline vs image-native pipeline; cost table; retrieval-over-pages flow.
- **Candidate references**: Faysse et al. (2024) ColPali (arXiv:2407.01449); Anugraha et al. (2026) M4-RAG, CVPR (arXiv:2512.05959); Martin et al. (2025) MiRAGE (arXiv:2510.24870).
- **LinkedIn angle**: "Your PDF parser, not your retriever, is why RAG misses the table. Retrieve over the page image instead."

## W17 — Context engineering

- **Problem hook**: Most LLM errors come from incomplete or badly ordered context, not weak models. Prompt phrasing matters far less than which chunks, memory, and tool outputs the system assembled.
- **Why now**: 2026 has named context engineering as a distinct discipline above RAG: retrieval, memory, tool outputs, ordering, and governance as one pipeline. Ties the whole 8-week arc together.
- **Sections**: prompt vs context engineering; the assembly pipeline; ordering and trust; where RAG, memory and MCP fit.
- **Diagrams**: context assembly pipeline; error-source breakdown; layered architecture.
- **Candidate references**: Hu et al. (2026) memory survey (arXiv:2512.13564); Gupta et al. (2025) RAG survey (arXiv:2506.00054); plus an official context-engineering doc (Elastic / Anthropic) for the practitioner framing.
- **LinkedIn angle**: "Prompt engineering plateaued. The leverage in 2026 is context engineering: what the model knows, not how you phrase the ask."

---

## Notes for execution

- Verify every arXiv id and author list before writing (the research pass flagged at least one hallucinated citation, so do not trust pre-filled references blindly).
- Reuse the `/blog` skill and run the standard gates each time: word count 1000–1100, mermaid label audit (max 22 chars per line), no em-dashes, no semicolons, no emojis, excerpt 80–150 chars.
- Increment `id` and keep slugs 30–60 chars. The registry auto-sorts by `id`.
- Community sources (Reddit, LinkedIn, Substack) are trend-sensing only and must not appear in the references array; cite the underlying paper or official doc instead.
- W11 and W16 deliberately call back to the W9 late-interaction and reranking post to give the series internal continuity.
