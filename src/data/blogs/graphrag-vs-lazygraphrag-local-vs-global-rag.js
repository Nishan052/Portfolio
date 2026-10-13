const post = {
  id:        9,
  slug:      'graphrag-vs-lazygraphrag-local-vs-global-rag',
  title:     'GraphRAG vs LazyGraphRAG: Choosing the Right Strategy for Local and Global Questions',
  category:  'research',
  iconKey:   'Brain',
  color:     '#14b8a6',
  date:      '2026-03-22',
  series:      'Production RAG',
  part:      3,
  readTime:  '15 min',
  tags:      ['RAG', 'GraphRAG', 'LazyGraphRAG', 'Evaluation', 'Retrieval Strategy', 'Knowledge Graph'],
  excerpt:   'Vector search is good at looking up local facts, but it can miss answers spread across a dataset, which is where GraphRAG and LazyGraphRAG help.',

  content: `
## The Retrieval Strategy Mistake

You can tune embeddings, rerankers and prompts for weeks and still get weak answers to one kind of question, like this one:

"Across all documents, what are the main patterns, tradeoffs, and implications?"

That's a different retrieval problem from this one:

"What did document X say about Y?"

A lot of RAG systems fail because they use one retrieval strategy for both.

---

## Why Vector Search Feels Great Until It Doesn't

Vector retrieval is a best-first search that finds the chunks most similar to the query, which is ideal when the answer sits in a few passages. It's weaker for broad synthesis, where the evidence is spread across many documents and no single chunk is a good nearest neighbor.

It's like asking a librarian for the one shelf that "best matches" your question, when the answer is spread across ten departments.

\`\`\`mermaid
flowchart LR
    Q[Question] --> V[Vector Search]
    V --> K[Top K Similar Chunks]
    K --> A[LLM Answer]

    style V fill:#0ea5e9,color:#001018
\`\`\`

So vector search is good for local extraction and risky for global synthesis.

---

## Local vs Global Questions Need Different Retrieval

| Query type | Typical question shape | Retrieval demand |
|---|---|---|
| Local | Who, what, when, where | High precision on a small evidence set |
| Global | Themes, patterns, implications, consensus | Broad coverage across the corpus |

If your evaluation set mixes both query types, one method will look "inconsistent" unless your pipeline adapts its retrieval to each query class.

---

## What GraphRAG Adds

GraphRAG builds a graph-oriented index from text, with entities, relationships and community-level structure, and then supports retrieval and synthesis over it. That gives you an explicit path to answer global questions with broader evidence coverage.

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

### Where GraphRAG is strong

GraphRAG is strong when the answer needs breadth over the dataset, and nearest-neighbor similarity alone isn't enough.

### What it costs

Classic GraphRAG can need heavier index-time work, because graph extraction and summarization happen up front.

---

## What LazyGraphRAG Changes

LazyGraphRAG keeps the graph-enabled retrieval idea, but it defers more of the expensive LLM work to query time and uses budgeted relevance testing. In practice that gives you a smoother way to trade quality against cost than all-or-nothing indexing pipelines.

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

The yellow node is the main lever, since the relevance-test budget controls quality versus cost.

---

## The Practical Decision Framework

I'd check this decision matrix before building anything.

| Constraint in your use case | Better default |
|---|---|
| Mostly local FAQ-style questions | Vector RAG |
| Frequent dataset-wide analysis questions | GraphRAG or LazyGraphRAG |
| Tight indexing budget, evolving data | LazyGraphRAG |
| Need reusable graph summaries as artifacts | GraphRAG |
| Need one strategy across mixed local-global workloads | LazyGraphRAG with tuned budget |

So the choice depends on your query distribution, the mix of local and global questions your users ask.

---

## Evaluation That Prevents Wrong Conclusions

If you evaluate only local questions, vector systems can look dominant, and if you evaluate only global questions, graph systems can look dominant. So I'd split the evaluation set into a local and a global bucket and compare methods within each.

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

## Choose Retrieval by the Shape of Your Questions

For me the point is to choose retrieval architecture by question distribution and not by trend. Vector RAG is a precision tool for local lookup, graph-enabled RAG is a coverage tool for global synthesis, and LazyGraphRAG is a budgeted bridge across both.

So when your answers look inconsistent, I'd check whether your retrieval strategy matches the shape of your questions before auditing the model.
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
