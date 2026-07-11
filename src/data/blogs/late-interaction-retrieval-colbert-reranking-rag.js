const post = {
  id:        19,
  slug:      'late-interaction-retrieval-colbert-reranking-rag',
  title:     'Late interaction and reranking: where single-vector RAG falls short',
  category:  'research',
  iconKey:   'ScanSearch',
  color:     '#06b6d4',
  date:      '2026-06-22',
  readTime:  '13 min',
  tags:      ['RAG', 'Retrieval', 'ColBERT', 'Reranking', 'ColPali', 'VectorSearch'],
  excerpt:   'Single-vector retrieval collapses a chunk into one point and loses token-level signal. Late interaction and reranking recover that lost recall.',

  content: `
## One vector per chunk throws away most of the signal

Most RAG systems retrieve by collapsing a whole passage into a single embedding, then ranking by cosine similarity. The earlier posts in this series tuned that path well: better embeddings, dimensionality reduction, and HNSW indexes that find nearest neighbors fast. Yet teams keep hitting the same wall. The index returns a chunk that looks related to the query but does not contain the answer.

The reason is structural. A passage of 200 words carries many distinct facts. Encoding it as one 768-dimension vector averages all of them into a single point. A query that matches one specific phrase in the chunk competes against the noise of everything else in that same vector. Two passages can sit close in embedding space while only one actually answers the question.

This is a recall problem, not a model problem. The generator never sees the right chunk, so no amount of prompt engineering fixes it. Single-vector retrieval is a strong first pass. It is rarely a sufficient one.

\`\`\`mermaid
flowchart LR
    Q[Query] --> QE[Query Encoder]
    C[Chunk] --> CE[Chunk Encoder]
    QE --> V1[(One Vector)]
    CE --> V2[(One Vector)]
    V1 --> Sim[Cosine Score]
    V2 --> Sim
    Sim --> R[Ranked Chunks]
\`\`\`

The above flowchart shows standard dense retrieval. Both query and chunk are compressed to one vector each before any comparison happens, so token-level detail is gone before scoring begins.

## How late interaction keeps the detail

**Late interaction** delays the comparison until after both sides are encoded at the token level. ColBERT, introduced by Khattab and Zaharia in 2020, encodes the query into one vector per token and the document into one vector per token. Instead of a single dot product, it scores relevance with a MaxSim operator: for each query token, find its highest similarity against any document token, then sum those maxima.

This matters because a single query term can now match the exact phrase it belongs to, rather than the averaged gist of the passage. A query about a specific drug interaction can light up the two tokens that name the drugs, even if the surrounding paragraph discusses many other topics.

\`\`\`mermaid
flowchart TD
    Q[Query Tokens] --> QE[Token Vectors]
    D[Doc Tokens] --> DE[Token Vectors]
    QE --> MS[MaxSim Per Token]
    DE --> MS
    MS --> Sum[Sum Of Maxes]
    Sum --> S[Relevance Score]
\`\`\`

This diagram shows the MaxSim mechanic. Each query token keeps its own vector and finds its best match in the document, so precise term matches are not drowned out by the rest of the passage.

The cost is storage and compute. A passage that needed one vector now needs dozens. ColBERTv2, from Santhanam and colleagues in 2022, made this practical with residual compression and centroid-based encoding, cutting the index footprint by an order of magnitude while keeping the accuracy gains. That work moved late interaction from a research curiosity to something a team can run in production.

## Reranking is the pragmatic version of the same idea

Most teams do not replace their vector index. They add a second stage. The first stage uses fast single-vector search to recall a wide candidate set, say the top 100. A slower, more accurate model then reranks those candidates and keeps the best 10. This two-stage pattern is the highest-return change most RAG systems can make, because recall and precision get optimized separately.

\`\`\`mermaid
flowchart LR
    Q[Query] --> ANN[ANN Recall<br/>Top 100]
    ANN --> RR[Reranker<br/>Top 10]
    RR --> LLM[Generator]
\`\`\`

The diagram shows the two-stage pipeline. A cheap recall stage casts a wide net, then an expensive reranker reorders only the survivors before they reach the model.

Three reranker families dominate, and they trade accuracy against latency differently.

| Approach | Scoring unit | Latency | Best for |
|----------|--------------|---------|----------|
| Single vector | One dot product | Lowest | First-pass recall |
| Cross-encoder | Full query-doc pair | Highest | Reranking small sets |
| Late interaction | Token-level MaxSim | Medium | Recall and rerank |

A cross-encoder reads the query and a candidate together in one forward pass, which is the most accurate option but cannot be precomputed, so it only scales to small candidate sets. Late interaction sits between the two. Document vectors are precomputed once at index time, and only the MaxSim scoring runs per query, so it can serve as both the recall stage and the reranker.

## ColPali extends late interaction to document images

A large share of enterprise content lives in PDFs full of tables, charts, and layout. Parsing those to clean text loses the structure that often holds the answer. ColPali, from Faysse and colleagues in 2024, applies late interaction directly to page images. A vision-language model produces multi-vector embeddings of the page, and the query still scores against them with MaxSim.

This skips the brittle parse-then-chunk pipeline entirely. The retriever matches a query against the visual page, including its figures and table cells, rather than against a flattened text extraction that may have scrambled the columns. For document-heavy retrieval, this removes a whole class of silent failures where the parser, not the retriever, was the real problem.

The momentum here is real. The first dedicated workshop on late interaction and multi-vector retrieval was accepted for ECIR 2026, a signal that token-level methods have moved into the information-retrieval mainstream rather than staying a single-paper technique.

## When the extra cost is worth it

Late interaction and reranking are not free, so apply them where single-vector search actually fails. Measure recall at your candidate-set size first. If the right chunk already appears in the top 100, the problem is ordering, and a reranker fixes it cheaply. If the right chunk is missing entirely, recall is the bottleneck, and late interaction earns its storage cost.

\`\`\`mermaid
flowchart TD
    A{Recall enough?} -->|Yes| B[Keep<br/>single vector]
    A -->|No| C{Latency budget?}
    C -->|Tight| D[Add cross<br/>encoder rerank]
    C -->|Flexible| E[Use late<br/>interaction]
\`\`\`

This decision tree separates the two failure modes. Ordering problems call for a reranker, missing-evidence problems call for richer retrieval, and a tight latency budget pushes you toward a cross-encoder on a small set.

The practical path is incremental. Keep the fast single-vector index for recall. Add a cross-encoder reranker and measure the lift on your own queries before reaching for multi-vector storage. Move to full late interaction only when reranking a single-vector candidate set still leaves the right evidence out of reach. Each step costs more compute, so let your recall numbers, not the hype cycle, decide how far up the ladder you climb.
`,

  references: [
    {
      text: 'Khattab, O. and Zaharia, M. (2020) "ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT". SIGIR.',
      url: 'https://arxiv.org/abs/2004.12832'
    },
    {
      text: 'Santhanam, K., Khattab, O., Saad-Falcon, J., Potts, C. and Zaharia, M. (2022) "ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction". NAACL.',
      url: 'https://arxiv.org/abs/2112.01488'
    },
    {
      text: 'Faysse, M. et al. (2024) "ColPali: Efficient Document Retrieval with Vision Language Models". ICLR 2025.',
      url: 'https://arxiv.org/abs/2407.01449'
    },
    {
      text: 'Clavie, B. et al. (2025) "LIR: The First Workshop on Late Interaction and Multi Vector Retrieval at ECIR 2026".',
      url: 'https://arxiv.org/abs/2511.00444'
    },
    {
      text: 'Gupta, S. et al. (2025) "Retrieval-Augmented Generation: A Comprehensive Survey of Architectures, Enhancements, and Robustness Frontiers".',
      url: 'https://arxiv.org/abs/2506.00054'
    }
  ]
};

export default post;
