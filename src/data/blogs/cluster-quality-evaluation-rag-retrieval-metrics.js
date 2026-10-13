const post = {
  id:        18,
  slug:      'cluster-quality-evaluation-rag-retrieval-metrics',
  title:     'Cluster quality evaluation for RAG: metrics that match retrieval goals',
  category:  'research',
  iconKey:   'TrendingUp',
  color:     '#22c55e',
  date:      '2026-06-15',
  series:      'Production RAG',
  part:      13,
  readTime:  '12 min',
  tags:      ['RAG', 'Clustering', 'Metrics', 'Retrieval', 'VectorSearch', 'Quality'],
  excerpt:   'I\'d use silhouette to tune the clusters and recall on real queries to decide, since retrieval is what the clusters are for.',

  content: `
## Clustering quality is only useful when it serves retrieval

A lot of teams treat clustering metrics as abstract math, and for me that's the wrong view for RAG, because a cluster is only worth something when it helps the vector index return better chunks faster.

The problem is that clustering can look good on paper and still hurt the end result. A high silhouette score means the clusters are well separated, but it doesn't guarantee they hold the documents the model needs to answer a query. A low Davies-Bouldin index means the groups are compact, but a compact cluster can still put unrelated documents together if the embedding space is noisy.

So the question I'd ask is "which metric matches retrieval behavior for my RAG system?"

## Internal metrics and what they tell you

Internal metrics measure the structure of the clusters without using any query labels, and these are the three you'll see most often:

- Silhouette score measures how similar each point is to its own cluster versus other clusters.
- Davies-Bouldin index measures cluster compactness and separation.
- Calinski-Harabasz score compares between-cluster variance with within-cluster variance.

They're useful for choosing algorithm parameters, but on their own they aren't enough to judge retrieval quality. They work best when the embedding space is stable and the clusters follow topic boundaries, and less well when retrieval needs context across topics or the corpus has many short, overlapping documents.

\`\`\`mermaid
flowchart TD
    A[Embeddings] --> B[Cluster Labels]
    B --> C[Internal Metrics]
    C --> D[Silhouette]
    C --> E[Davies-Bouldin]
    C --> F[Calinski-Harabasz]
    D --> G[Structure Check]
    E --> G
    F --> G

\`\`\`

*Internal metrics evaluate cluster shape and separation without reference to queries or retrieval outcomes.*

## External metrics for retrieval alignment

External metrics use queries or retrieval ground truth to measure how useful the clusters are, and these are the ones I'd look at:

- Recall@k measures whether the index returns relevant chunks among the top results.
- Query coverage measures how many queries return at least one good chunk.
- Precision@k measures the fraction of returned chunks that are relevant.
- Cluster density and access pattern measure how often clusters are visited.

For me these are the closest proxy for RAG quality, since they connect the way the chunks are grouped to what retrieval really returns.

\`\`\`mermaid
flowchart LR
    Q[Query Set] --> R[Top K Retrieval]
    R --> S[Relevant Chunks]
    S --> T[Recall at K]
    S --> U[Precision at K]
    R --> V[Cluster Hits]
    V --> W[Query Coverage]

\`\`\`

*External metrics require query examples or labeled retrieval results. They tell you whether clusters help the actual search problem.*

## When to trust internal metrics

Internal metrics are a good first step when you're tuning cluster counts or index partitions, the embedding model is stable and calibrated, the corpus is organized by topic, or you need a fast signal before query labels exist.

In that case silhouette and Davies-Bouldin help you avoid a badly wrong structure, since they show when the algorithm produces too many mixed clusters or clusters that are too broad.

Let's say a clustering run on your embeddings gives a silhouette score near zero. That's a sign the clusters aren't well separated, and the model may be underfitting the structure of the embedding space. If the Davies-Bouldin index is high, the clusters overlap too much, so you may want more clusters or a different distance metric.

## When external metrics must decide

Once you have query logs and relevance labels, I'd let the external metrics make the final decision, and the set I'd use for RAG looks like this:

- \`Recall@k\` to measure if relevant chunks are returned.
- \`Query coverage\` to measure if every query sees at least one good chunk.
- \`Mean rank\` of relevant chunks to measure average result position.

This is the test that matters most for RAG, because if the clustering looks good internally and recall still drops, you need to change the clustering or the retrieval strategy.

\`\`\`mermaid
flowchart TD
    A[Clustered Index] --> B[Query Example]
    B --> C[Search Top K]
    C --> D{Relevant Chunk Found}
    D -->|Yes| E[Count Recall]
    D -->|No| F[Count Failure]
    F --> G[Review<br/>Cluster Boundaries]

\`\`\`

*External metrics close the loop between clustering and actual query performance.*

## Choosing the right metric for your dataset

The best metric depends on the size of the dataset and what retrieval needs to do, so let me go through three cases.

With a small corpus of well-written text, internal metrics are strong signals, you can afford more clusters and finer partitions, and silhouette is a good way to check how well the clusters separate.

With a medium corpus of mixed content, I'd tune with internal metrics and validate with Recall@k and query coverage, and pick cluster counts that keep relevant documents together over ones that are only compact.

With a large corpus that updates often, external retrieval metrics become the guardrail, so you track cluster density and index access skew and prefer metrics that show stale or noisy clusters quickly.

For me the practical rule is that if the retrieval engine is the main user of the clusters, retrieval metrics have to win, since clustering metrics are only proxies.

## Cluster density and retrieval behavior

Cluster density is a useful number to watch on a production index, where high density means many documents are very similar and low density means they're spread out, and it affects both query throughput and recall.

Dense clusters can help retrieval by making it easier to find neighbors in the right region, but if the clusters are too dense and the index keeps probing the same few clusters, query diversity suffers. So a balanced density profile tells you more than any single score.

For production monitoring, these are the three numbers I'd measure:

- requests per cluster
- cluster hit entropy
- recall by cluster

That tells you whether the index is leaning on a few hot clusters or whether the query load is spread across the corpus.

## A practical evaluation pipeline

The workflow I'd use is an evaluation pipeline in three stages:

1. Generate candidate clusters and compute internal metrics.
2. Run retrieval simulations with query examples and compute Recall@k.
3. Compare retrieval metrics with your production SLA targets.

If the internal and external metrics disagree, trust the external ones, and use the internal metrics only to guide parameter tuning in the next round.

\`\`\`mermaid
flowchart LR
    A[Candidate Clustering] --> B[Compute<br/>Internal Metrics]
    B --> C[Run<br/>Retrieval Simulation]
    C --> D[Compute Recall at K]
    D --> E{Meets SLA?}
    E -->|Yes| F[Promote Index]
    E -->|No| G[Tune Clusters]
    G --> A

\`\`\`

*Use a repeatable evaluation loop. Hold external retrieval metrics as the final decision point.*

## What metrics tell you about index choice

The metrics also say something about index design, and three combinations are worth knowing:

- If silhouette is low and recall is high, your clusters are loose and still useful for retrieval.
- If recall is low and silhouette is high, your embedding space may be too coarse, or the query needs context from more than one cluster.
- If Davies-Bouldin is low and recall is low, the clusters are compact and still don't match what the queries need.

That last case is the most dangerous one for me, because the clustering looks good in isolation and then fails in production. It's also the case where an evaluation loop built around retrieval saves you from a bad deployment.

## Practical checklist for a RAG clustering evaluation

This is the checklist I'd keep as a guardrail:

- Start with internal metrics to tune the cluster algorithm.
- Validate with external retrieval metrics before deployment.
- Track recall and query coverage in production.
- Monitor cluster density and access skew.
- Prefer retrieval-aligned metrics when they conflict with internal metrics.

For me one evaluation loop that runs every time is worth more than a dozen isolated clustering experiments.

## Retrieval metrics should have the final say

Evaluating cluster quality for RAG comes down to choosing metrics that reflect the retrieval outcome you need. Internal metrics help you avoid a broken structure and external retrieval metrics tell you whether the clusters help the model answer questions, so in a mature RAG system I'd let the external ones judge.

Once you treat clustering metrics as part of the retrieval product, tuning the index gets more reliable and the RAG pipeline gets easier to scale.
  `,

  references: [
    {
      text: 'Ribeiro, Marco Tulio, et al. "Beyond accuracy: Behavioral testing of NLP models." ACL 2020.',
      url: 'https://www.aclweb.org/anthology/2020.acl-main.442/'
    },
    {
      text: 'Rousseeuw, Peter J. "Silhouettes: a graphical aid to the interpretation and validation of cluster analysis." Journal of Computational and Applied Mathematics 1987.',
      url: 'https://doi.org/10.1016/0377-0427(87)90125-7'
    },
    {
      text: 'Davies, David L. and Donald W. Bouldin. "A cluster separation measure." IEEE Trans. Pattern Anal. Mach. Intell. 1979.',
      url: 'https://ieeexplore.ieee.org/document/4766909'
    },
    {
      text: 'Aggarwal, Charu C. "Data clustering: algorithms and applications." CRC Press 2013.',
      url: 'https://www.crcpress.com/Data-Clustering-Algorithms-and-Applications/Aggarwal/p/book/9781466509630'
    },
    {
      text: 'Pinecone: Vector search metrics and best practices',
      url: 'https://www.pinecone.io/learn/vector-search-metrics/'
    }
  ]
};

export default post;
