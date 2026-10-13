const post = {
  id:        17,
  slug:      'nearest-neighbor-search-flat-ivf-hnsw-rag',
  title:     'Nearest neighbor search in RAG: Flat, IVF and HNSW trade-offs',
  category:  'research',
  iconKey:   'ArrowLeftRight',
  color:     '#f59e0b',
  date:      '2026-06-08',
  series:      'Production RAG',
  part:      12,
  readTime:  '12 min',
  tags:      ['RAG', 'ANN', 'HNSW', 'IVF', 'VectorSearch', 'Retrieval'],
  excerpt:   'Once the embedding model is fixed, the index sets your retrieval speed, so I compare Flat, IVF and HNSW on recall, speed and updates.',

  content: `
## The Real Bottleneck in RAG Retrieval

Many RAG teams tune prompts for weeks and still miss their latency targets. The reason is that retrieval is a nearest neighbor search problem, and once the embedding model is stable, that search is where most of the cost sits.

It works like this: at query time you embed the user's question into a vector and ask the database for the top-k closest vectors. If that lookup is slow, every answer is slow, and if it returns weak matches, every answer gets weaker no matter how good your prompt engineering is. So for me choosing the index is a product decision about response speed, relevance and cost.

In this post I'll explain exact versus approximate search first, then go through Flat, IVF and HNSW, and end with how I'd choose between them by dataset size and update frequency.

## Exact vs Approximate Search in Plain English

Exact nearest neighbor search compares the query vector with every vector in your dataset and returns the true top-k results. This is what a Flat index does, and it gives maximum recall because nothing is skipped.

Approximate nearest neighbor (ANN) search skips part of the search space to get results much faster, and IVF and HNSW are both ANN methods that trade some recall for a big gain in speed.

The right trade depends on your product, since safety-critical use cases usually need higher recall, while an interactive copilot may accept slightly lower recall for much lower latency.

\`\`\`mermaid
flowchart LR
    Q[Query Vector] --> F[Flat Scan]
    F --> A[All Vectors]
    A --> E[Top K Exact]
    Q --> I[IVF Buckets]
    I --> P[Probe Few Lists]
    P --> X[Top K Approx]
    Q --> H[HNSW Graph]
    H --> W[Greedy Walk]
    W --> X
\`\`\`

*Exact search checks every vector, while ANN methods search only selected regions or paths and return an approximate top-k set much faster.*

## Flat Index: The Exact Baseline

A Flat index is the easiest to reason about, because every query is compared with every vector, which gives you exact nearest neighbors and stable behavior on any data shape.

Teams still run Flat in production because it gives a quality baseline you can trust, has no training step, handles inserts and deletes naturally and stays predictable on small datasets.

Flat starts to hurt at scale, since at one million vectors and above full scans get expensive unless you have strong hardware and low query volume. Even with optimized SIMD and batching, the cost still grows linearly with the size of the dataset.

For RAG I'd use Flat up to roughly 100k to 300k chunks and keep it as an offline evaluator after moving to ANN, since Flat is your ground truth.

## IVF: Partition First, Search Second

IVF stands for inverted file index, and the idea is to cluster the vectors into many coarse groups and then search only a few of those groups at query time.

Two controls define IVF: the number of lists, often called nlist, and the number of lists probed per query, often called nprobe. A larger nlist gives finer partitions, and a larger nprobe checks more of them, which improves recall and adds latency, so IVF is easy to tune with clear knobs.

IVF works best when the data has clear regional structure and moderate updates, which is why it's common in large catalog search, where most queries only need a few relevant regions.

For RAG, IVF is efficient when chunk embeddings form clear topic clusters. In a very mixed corpus you have to raise nprobe to protect recall, and the rebuild schedule matters too, because the centroids drift as the content changes.

## HNSW: Graph Navigation That Feels Like Shortcuts

HNSW stands for Hierarchical Navigable Small World graph, which is a graph with several layers where each vector links to nearby vectors and a few sparse long links let the search jump quickly across regions.

At query time it starts from an entry point in an upper layer, routes greedily toward better neighbors and goes down layer by layer until it finds strong candidates in the base layer.

I think of it like driving through a city, where the top layers are the highways that get you to the right area and the lower layers are the local streets that get you to the address.

\`\`\`mermaid
flowchart TD
    N[New Vector] --> E[Pick Entry]
    E --> G[Greedy Route]
    G --> C[Pick Neighbors]
    C --> L[Add Bi Links]
    L --> D[Drop One Layer]
    D --> Z{Base Layer}
    Z -->|No| G
    Z -->|Yes| S[Store Node]
\`\`\`

*HNSW links each new vector to its local neighbors on every layer while it builds, and a query repeats a similar greedy walk, which is why it's fast and often high recall.*

HNSW is popular for RAG because it gives high recall at low latency on many real datasets, still performs well when the clusters aren't clean and handles incremental inserts well.

The trade-offs to plan for are the extra memory for the graph links, build and insert settings like M and efConstruction that affect both quality and cost, and deletes that can be harder depending on the engine.

If you need low latency and high recall together, HNSW is often the first ANN option I'd test.

## Choosing by Dataset Size and Update Frequency

Most teams choose an index too early and then keep patching around it. I'd rather choose by current data size, expected growth and how often the content changes, using the simple decision path below.

\`\`\`mermaid
flowchart TD
    A[Vector Count] --> B{Below 300k}
    B -->|Yes| F[Start with Flat]
    B -->|No| C{High Updates}
    C -->|Yes| H[Try HNSW]
    C -->|No| D{Very Large Data}
    D -->|Yes| I[Use IVF or Hybrid]
    D -->|No| J[Test HNSW vs IVF]
    F --> K[Track Recall SLA]
    H --> K
    I --> K
    J --> K
\`\`\`

*Dataset size gives the first branch and update frequency the second, and the final choice comes from recall and latency tests against your SLA instead of defaults.*

In practice I'd read it like this:

- Small datasets and frequent updates, Flat is often enough and easiest to run.
- Mid-size datasets with strict latency, HNSW usually wins on quality-speed balance.
- Very large datasets with stable content, IVF can cut cost if tuned carefully.

## RAG SLA Math: Why This Choice Is So Important

Let's say your end-to-end SLA is 1200 ms. The embedding call uses 120 ms, generation 700 ms, and orchestration and network another 130 ms, so only 250 ms is left for retrieval and context assembly together.

If retrieval then jumps from 90 ms to 320 ms at P95, the whole product misses its SLA even with a perfect prompt and a high quality model. Quality works the same way, because if the ANN settings cut recall too far, the LLM gets weaker context and the answers get worse.

## A Simple Evaluation Loop for Production Teams

I'd run the same benchmark loop before and after every major index change:

1. Build a fixed query set that reflects real traffic categories.
2. Compute Flat top-k as reference truth.
3. Run candidate index settings for IVF and HNSW.
4. Measure recall@k, P95 latency, and infra cost.
5. Pick the setting that meets your SLA at acceptable recall.
6. Re-run weekly because corpus and query mix drift over time.

## Flat, IVF and HNSW Spend the Same Budget Differently

For me, RAG retrieval is an ANN systems problem before it's a prompt design problem, and Flat, IVF and HNSW are different ways to spend your quality and latency budget.

Flat gives exact truth and a strong baseline, IVF gives speedups you can control through partitions when the data suits it, and HNSW gives a good balance of quality and speed for many real-world corpora with low latency targets.

So I'd pick the index by dataset size, update pattern and SLA, and then verify it with recall and latency measured against Flat. Teams that do this early avoid the retrieval incidents that show up later as quality complaints.
  `,

  references: [
    {
      text: 'Malkov and Yashunin, Efficient and robust approximate nearest neighbor search using HNSW',
      url: 'https://arxiv.org/abs/1603.09320'
    },
    {
      text: 'FAISS Documentation: Index types, IVF and HNSW',
      url: 'https://faiss.ai/'
    },
    {
      text: 'Pinecone Learn: Approximate nearest neighbor search',
      url: 'https://www.pinecone.io/learn/series/faiss/ann/'
    },
    {
      text: 'Google ScaNN: Efficient vector similarity search at scale',
      url: 'https://github.com/google-research/google-research/tree/master/scann'
    },
    {
      text: 'Milvus Docs: HNSW, IVF and Flat index trade-offs',
      url: 'https://milvus.io/docs/index.md'
    },
    {
      text: 'OpenSearch k-NN: Vector index methods and tuning',
      url: 'https://opensearch.org/docs/latest/vector-search/'
    }
  ]
};

export default post;
