const post = {
  id:        9,
  slug:      'graphrag-vs-lazygraphrag-local-vs-global-rag',
  title:     'GraphRAG vs LazyGraphRAG: Choosing the Right Strategy for Local and Global Questions',
  category:  'research',
  iconKey:   'Brain',
  color:     '#14b8a6',
  date:      '2026-03-22',
  readTime:  '15 min',
  tags:      ['RAG', 'GraphRAG', 'LazyGraphRAG', 'Evaluation', 'Retrieval Strategy', 'Knowledge Graph'],
  excerpt:   'Vector search is excellent for local fact lookup, but it can miss dataset-level synthesis. This guide shows when GraphRAG or LazyGraphRAG is the better retrieval strategy.',

  content: `
## The Retrieval Strategy Mistake

You can tune embeddings, rerankers, and prompts for weeks and still get weak answers to one class of question:

"Across all documents, what are the main patterns, tradeoffs, and implications?"

That is a different retrieval problem from:

"What did document X say about Y?"

Many RAG systems fail because they use one retrieval strategy for both question types.

---

## Why Vector Search Feels Great Until It Doesn't

Vector retrieval is a best-first search pattern. It finds chunks most similar to the query. This is ideal when the answer is concentrated in a few passages.

It is weaker for broad synthesis where evidence is distributed across many documents and no single chunk is a good nearest neighbor.

Think of it like asking a librarian for one shelf that "best matches" your question when the answer is actually spread across ten departments.

\`\`\`mermaid
flowchart LR
    Q[Question] --> V[Vector Search]
    V --> K[Top K Similar Chunks]
    K --> A[LLM Answer]

    style V fill:#0ea5e9,color:#001018
\`\`\`

Good for local extraction. Risky for global synthesis.

---

## Local vs Global Questions Need Different Retrieval

| Query type | Typical question shape | Retrieval demand |
|---|---|---|
| Local | Who, what, when, where | High precision on a small evidence set |
| Global | Themes, patterns, implications, consensus | Broad coverage across the corpus |

If your evaluation set mixes both query types, one method will look "inconsistent" unless your pipeline can adapt retrieval strategy per query class.

---

## What GraphRAG Adds

GraphRAG builds a graph-oriented index from text: entities, relationships, and community-level structure. It then supports retrieval and synthesis over that structure.

That gives you an explicit path to answer global questions with broader evidence coverage.

\`\`\`mermaid
flowchart TD
    D[Documents] --> E[Extract Entities and Relations]
    E --> G[Build Knowledge Graph]
    G --> C[Community Structure]
    C --> S[Community Reports]
    S --> R[Global Retrieval]
    R --> A[LLM Synthesis]

    style G fill:#14b8a6,color:#001018
    style R fill:#14b8a6,color:#001018
\`\`\`

### Strength

GraphRAG is strong when the answer requires breadth over the dataset, not only nearest-neighbor similarity.

### Cost reality

Classic GraphRAG can require heavier index-time work because graph extraction and summarization are front-loaded.

---

## What LazyGraphRAG Changes

LazyGraphRAG keeps the graph-enabled retrieval idea but defers more expensive LLM work to query time and uses budgeted relevance testing.

In practice, this offers a smoother quality-cost control knob than all-or-nothing indexing pipelines.

\`\`\`mermaid
flowchart LR
    D[Documents] --> L[Lightweight Graph Signals]
    Q[Question] --> X[Query Expansion]
    X --> M[Rank Chunks and Communities]
    L --> M
    M --> T[Budgeted Relevance Tests]
    T --> C[Claim Extraction and Filtering]
    C --> A[Answer Synthesis]

    style T fill:#f59e0b,color:#000
\`\`\`

The yellow node is the key lever: relevance-test budget controls quality versus cost.

---

## The Practical Decision Framework

Use this decision matrix before implementation.

| Constraint in your use case | Better default |
|---|---|
| Mostly local FAQ-style questions | Vector RAG |
| Frequent dataset-wide analysis questions | GraphRAG or LazyGraphRAG |
| Tight indexing budget, evolving data | LazyGraphRAG |
| Need reusable graph summaries as artifacts | GraphRAG |
| Need one strategy across mixed local-global workloads | LazyGraphRAG with tuned budget |

This is not a "winner takes all" choice. It is a query-distribution choice.

---

## Evaluation That Prevents Wrong Conclusions

If you evaluate only local questions, vector systems can look dominant. If you evaluate only global questions, graph systems can look dominant.

Segment your eval set.

\`\`\`mermaid
flowchart TD
    Q[Evaluation Set] --> LQ[Local Query Bucket]
    Q --> GQ[Global Query Bucket]
    LQ --> M1[Measure Precision and Relevance]
    GQ --> M2[Measure Comprehensiveness and Diversity]
    M1 --> R[Compare Methods by Bucket]
    M2 --> R
    R --> D[Deployment Decision]

    style D fill:#10b981,color:#fff
\`\`\`

### Minimum metrics to track

| Metric | Why it matters |
|---|---|
| Local precision@K | Verifies factual lookup quality |
| Global answer comprehensiveness | Verifies breadth of synthesis |
| Diversity of evidence | Detects over-reliance on a narrow subset |
| Cost per accepted answer | Keeps architecture economically viable |

---

## Tradeoffs You Need to Accept

1. Graph-enabled methods improve global synthesis, but increase pipeline complexity.
2. LazyGraphRAG improves cost elasticity, but still needs careful budget tuning.
3. Vector RAG remains a strong baseline for local queries and should not be discarded by default.
4. Long context windows alone do not guarantee better global reasoning over large corpora.

---

## Durable Mental Model

Do not choose retrieval architecture by trend. Choose it by question distribution.

**Vector RAG is a precision tool for local lookup. Graph-enabled RAG is a coverage tool for global synthesis. LazyGraphRAG is a budgeted bridge across both.**

When your answers look inconsistent, the first thing to audit is not the model. Audit whether your retrieval strategy matches the shape of your questions.
`,

  references: [
    {
      text: 'Edge, D. et al. (2024) From Local to Global: A GraphRAG Approach to Query-Focused Summarization. Microsoft Research.',
      url: 'https://www.microsoft.com/en-us/research/publication/from-local-to-global-a-graph-rag-approach-to-query-focused-summarization/',
    },
    {
      text: 'Microsoft Research (2024) Project GraphRAG.',
      url: 'https://www.microsoft.com/en-us/research/project/graphrag/',
    },
    {
      text: 'Edge, D., Trinh, H. and Larson, J. (2024) LazyGraphRAG: Setting a new standard for quality and cost. Microsoft Research Blog.',
      url: 'https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/',
    },
    {
      text: 'Edge, D. et al. (2025) BenchmarkQED: Automated benchmarking of RAG systems. Microsoft Research Blog.',
      url: 'https://www.microsoft.com/en-us/research/blog/benchmarkqed-automated-benchmarking-of-rag-systems/',
    },
    {
      text: 'Sarthi, P. et al. (2024) RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval. arXiv:2401.18059.',
      url: 'https://arxiv.org/abs/2401.18059',
    },
    {
      text: 'Pinecone (2025) Retrieval-Augmented Generation (RAG) guide.',
      url: 'https://www.pinecone.io/learn/retrieval-augmented-generation/',
    },
  ],
};

export default post;
