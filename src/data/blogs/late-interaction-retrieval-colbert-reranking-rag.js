const post = {
  id:        19,
  slug:      'late-interaction-retrieval-colbert-reranking-rag',
  title:     'Late interaction and reranking: where single-vector RAG falls short',
  category:  'research',
  iconKey:   'ScanSearch',
  color:     '#06b6d4',
  date:      '2026-06-22',
  series:      'Production RAG',
  part:      14,
  readTime:  '13 min',
  tags:      ['RAG', 'Retrieval', 'ColBERT', 'Reranking', 'ColPali', 'VectorSearch'],
  excerpt:   'Single-vector retrieval squeezes a chunk into one point and loses token-level detail, and late interaction and reranking win that recall back.',

  content: `
## One vector per chunk throws away most of the signal

Most RAG systems retrieve by squeezing a whole passage into one embedding and then ranking by cosine similarity. The earlier posts in this series tuned that path with better embeddings, dimensionality reduction and HNSW indexes that find nearest neighbors fast. Even so, teams keep hitting the same wall, where the index returns a chunk that looks related to the query and doesn't contain the answer. I ran into this with my own chatbot too, where the right answer was sitting in the database and still didn't come back.

Let me explain why it happens. A passage of 200 words carries many separate facts, and encoding it as one 768-dimension vector averages all of them into a single point. So a query that matches one specific phrase in the chunk has to compete with the noise of everything else in that vector, and two passages can sit close in embedding space while only one of them answers the question.

For me this is a recall problem more than a model problem, because the generator never sees the right chunk and no prompt engineering can fix that. Single-vector retrieval is a strong first pass, but it's rarely enough on its own.

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

The flowchart above shows standard dense retrieval, where the query and the chunk are each compressed to one vector before any comparison, so token-level detail is gone before scoring begins.

## How late interaction keeps the detail

Late interaction waits to compare until both sides have been encoded at the token level. ColBERT, introduced by Khattab and Zaharia in 2020, encodes the query into one vector per token and the document into one vector per token. Instead of a single dot product, it scores relevance with a MaxSim operator, which works like this: for each query token, find its highest similarity with any document token, and then add up those maximum scores.

So a single query term can match the exact phrase it belongs to, instead of only the passage's averaged gist. Let's say a query is about a specific drug interaction. It can light up the two tokens that name the drugs, even if the paragraph around them talks about many other topics.

\`\`\`mermaid
flowchart TD
    Q[Query Tokens] --> QE[Token Vectors]
    D[Doc Tokens] --> DE[Token Vectors]
    QE --> MS[MaxSim Per Token]
    DE --> MS
    MS --> Sum[Sum Of Maxes]
    Sum --> S[Relevance Score]
\`\`\`

This diagram shows how MaxSim works, where each query token keeps its own vector and finds its best match in the document, so precise term matches don't get drowned out by the rest of the passage.

The cost is storage and compute, since a passage that needed one vector now needs dozens. ColBERTv2, from Santhanam and colleagues in 2022, made this practical with residual compression and centroid-based encoding, which cut the index footprint by an order of magnitude while keeping the accuracy gains. That work moved late interaction from a research curiosity to something a team can run in production.

## Reranking is the pragmatic version of the same idea

Most teams keep their vector index and add a second stage instead of replacing it. The first stage uses fast single-vector search to recall a wide set of candidates, say the top 100, and then a slower, more accurate model reranks them and keeps the best 10. For me this two-stage pattern is the change with the highest return for most RAG systems, because recall and precision get optimized separately.

\`\`\`mermaid
flowchart LR
    Q[Query] --> ANN[ANN Recall<br/>Top 100]
    ANN --> RR[Reranker<br/>Top 10]
    RR --> LLM[Generator]
\`\`\`

The diagram shows the two-stage pipeline, where a cheap recall stage casts a wide net and then an expensive reranker reorders only the survivors before they reach the model.

Three reranker families come up most, and each trades accuracy against latency differently.

| Approach | Scoring unit | Latency | Best for |
|----------|--------------|---------|----------|
| Single vector | One dot product | Lowest | First-pass recall |
| Cross-encoder | Full query-doc pair | Highest | Reranking small sets |
| Late interaction | Token-level MaxSim | Medium | Recall and rerank |

A cross-encoder reads the query and a candidate together in one forward pass, which is the most accurate option, but it can't be precomputed, so it only scales to small candidate sets. When I benchmarked rerankers on my own blog, a small MiniLM cross-encoder reranked better and faster than the much larger Laya decision model. Late interaction sits between the two, because the document vectors are precomputed once at index time and only the MaxSim scoring runs per query, so it can serve as both the recall stage and the reranker.

## ColPali extends late interaction to document images

A large share of company content lives in PDFs full of tables, charts and layout, and parsing those to clean text loses the structure that often holds the answer. ColPali, from Faysse and colleagues in 2024, applies late interaction directly to page images, where a vision-language model produces multi-vector embeddings of the page and the query still scores against them with MaxSim.

This skips the fragile parse-then-chunk pipeline completely, since the retriever matches the query against the visual page, including its figures and table cells, instead of a flattened text extraction that may have scrambled the columns. For document-heavy retrieval this removes a whole class of silent failures, where the real problem was the parser and the retriever got the blame.

For me, the first dedicated workshop on late interaction and multi-vector retrieval being accepted for ECIR 2026 shows that token-level methods have reached mainstream information retrieval.

## When the extra cost is worth it

Late interaction and reranking cost extra, so I'd use them only where single-vector search fails, starting by measuring recall at your candidate-set size. If the right chunk already shows up in the top 100, the problem is the ordering and a reranker fixes it cheaply. If the right chunk is missing completely, then recall is the bottleneck and late interaction earns its storage cost.

\`\`\`mermaid
flowchart TD
    A{Recall enough?} -->|Yes| B[Keep<br/>single vector]
    A -->|No| C{Latency budget?}
    C -->|Tight| D[Add cross<br/>encoder rerank]
    C -->|Flexible| E[Use late<br/>interaction]
\`\`\`

This decision tree separates the two failure modes, so ordering problems call for a reranker, missing-evidence problems call for richer retrieval, and a tight latency budget pushes you toward a cross-encoder on a small set.

I'd go one step at a time, keeping the fast single-vector index for recall, then adding a cross-encoder reranker and measuring the lift on your own queries before reaching for multi-vector storage. I'd only move to full late interaction when reranking a single-vector candidate set still leaves the right evidence out of reach. Each step costs more compute, so let your recall numbers decide how far up the ladder you climb, and not the hype cycle.
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
