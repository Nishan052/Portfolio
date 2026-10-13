const post = {
  id:       12,
  slug:     'clustering-compression-not-classification',
  title:    'Clustering for RAG is a compression decision that trades recall for speed',
  category: 'research',
  iconKey:  'Brain',
  color:    '#f59e0b',
  date:     '2026-04-28',
  series:     'Production RAG',
  part:     7,
  readTime: '12 min',
  tags:     ['Clustering', 'RAG', 'VectorSearch', 'KMeans', 'Unsupervised', 'Embeddings', 'IVF'],
  excerpt:  'Searching millions of vectors means checking every one unless you cluster first, so here\'s how k-means makes RAG search over 100 times faster.',

  content: `
## The Search Space Problem at Scale

Let's say you run brute-force similarity search against ten million 1536-dimensional vectors, which means loading every embedding into memory and scoring each one against the query, like checking every book in a library that has no catalog. Just one million 128-dimensional float32 vectors take 512 MB of RAM. At production scale, an exhaustive nearest-neighbor search runs for hundreds of milliseconds per request, far past what a user-facing application can tolerate.

The root problem is search scope, because without structure every query evaluates every vector. Clustering adds that structure by partitioning the data set offline, so at runtime a query only evaluates the relevant partition.

That's where k-means clustering fits into RAG engineering, and for me it's best understood as a compression decision, where you accept slightly imperfect recall in exchange for retrieval that's orders of magnitude faster. It doesn't label or classify your documents, so getting that tradeoff right means understanding what the algorithm actually optimizes and where its structure makes it fail.

## What Inertia Measures and What It Does Not

K-means minimizes inertia, which is the total squared distance between each point and its assigned cluster center, so it measures how tightly packed each group is and says nothing about whether the groups mean anything. Lower inertia means the points sit closer to their centroid, and the algorithm stops once those centroids stop moving. So you get a partition with no labels, and two documents with identical content can land in different clusters on different runs if the initialization differs.

The distance metric decides what "close" means. Euclidean distance treats all dimensions equally, while cosine distance normalizes for magnitude, which makes it the better choice for text embeddings, since their length varies and their direction carries the meaning. On high-dimensional embeddings Euclidean distance breaks down, because the gap between the nearest and farthest neighbors collapses to near zero. This is the curse of dimensionality, where distance loses its power to tell points apart as the number of dimensions grows.

K-means also assumes convex clusters of roughly equal size. Density-based algorithms like DBSCAN handle irregular shapes, but they don't produce the fixed partition structure that building an index needs, so when the goal is to reduce the search scope, k-means is the practical default.

## The k-Means Iteration Loop

K-means runs three steps in a loop until it converges or reaches a maximum number of iterations:

1. Assign each point to its nearest centroid using the chosen distance metric.
2. Update each centroid to the mean of all points currently assigned to it.
3. Repeat until centroid displacement falls below a threshold.

\`\`\`mermaid
flowchart LR
    subgraph INIT["Phase 1 · Seed Placement"]
        A([Embeddings In]) --> B[k-means++ picks
k spread-out seeds]
    end
    subgraph LOOP["Phase 2 · Refinement Loop"]
        C[Distance to
every seed] --> D[Assign to
closest seed]
        D --> E[Move seed to
group mean]
        E --> F{Seeds still
moving?}
        F -->|Yes| C
    end
    subgraph DONE["Phase 3 · Stable Partition"]
        G[(k Voronoi cells)] --> H([IVF Index Ready])
    end
    INIT --> LOOP
    F -->|No| DONE
\`\`\`

*Three phases of k-means: seeds are placed far apart, points and seeds converge through repeated assignment, and the stable regions become the lookup cells of the IVF index.*

A centroid is a computed position, like the average GPS coordinate of all the delivery stops in a zone, so it marks the center of its group even if no document sits at that exact spot. K-means++ initialization places the starting centroids far apart across the vector space, which lowers the chance of the algorithm settling on a poor local partition.

The result is a Voronoi partition, where the vector space is divided into regions and every point belongs to its nearest centroid. These regions become the lookup cells of a retrieval index, and each one maps to a list of document IDs. In practice the cluster shapes are rarely spherical, since real document embeddings form elongated or irregular patterns. They still work as a coarse filter, though, because the goal is to reduce the scope.

## Clustering as a RAG Pre-Filter

An Inverted File Index (IVF) turns the k-means output into a fast retrieval system by mapping each cluster region to the document IDs inside it, and the workflow splits into two phases.

In the offline phase, you cluster the full knowledge base into k Voronoi cells and assign each document embedding to its nearest centroid. The index then stores a mapping from each centroid ID to the document IDs in that cell.

At query time, you embed the query, find the nearest centroid and run similarity search only inside that cell. The \`nprobe\` parameter expands the search to neighboring cells, so you give up a little speed to get better recall near the cluster boundaries.

\`\`\`mermaid
flowchart LR
    A[Raw Corpus] --> B[Offline k-Means Clustering]
    B --> C[k Voronoi Cells]
    C --> D[IVF Index on Disk]
    E[Incoming Query] --> F[Embed Query]
    F --> G[Find Nearest Centroid]
    G --> H[Search nprobe Cells Only]
    D --> H
    H --> I[Ranked Chunks Returned]
\`\`\`

*IVF separates index construction from query time. Clustering runs once offline, and each query probes only the nearest nprobe cells instead of the full corpus.*

Benchmarks on the Sift1M dataset, which is one million 128-dimensional vectors, show the tradeoff clearly:

- Flat exhaustive search: 15ms per query, 100% recall
- IVF with k=2048, nprobe=1: 0.09ms per query, 34% recall
- IVF with k=2048, nprobe=48: 0.09ms per query, 52% recall

The 166x speedup comes entirely from clustering the index before the queries arrive, because each query only evaluates the documents in the nearest cells, which is typically 2 to 5% of the full corpus. The recall gap comes from the structure itself, so if the correct document sits in a cell that wasn't probed, retrieval misses it.

## Choosing Parameters and Monitoring Drift

Two parameters decide the retrieval quality of an IVF index. The first is k, the number of clusters, which controls how fine the partition is, and a practical starting point is the square root of the corpus size. So one million documents maps to roughly k=1000, and at k=2048 each cluster holds about 500 documents on average. The second is nprobe, the number of cells searched per query, which trades recall for speed. I'd start at 1% of k and increase it until the recall targets are met, and at nprobe=48 out of k=2048 you search roughly 2.3% of the index.

Cluster drift is a failure mode that stays silent. New documents that arrive after the last clustering pass get assigned to the nearest existing centroid, but those centroids never update, so no error fires and latency stays flat while relevance slowly gets worse.

That's why I'd track the silhouette score of the partition over time. It measures how well each point fits its own cluster compared to the next closest one, so a score near +1 means dense, well-separated clusters and a score near 0 means heavy overlap. When the score falls below 0.4, schedule a full clustering pass. Monthly recluster cycles work for most RAG corpora, unless the corpus grows by more than 20% between passes.

\`\`\`mermaid
flowchart TD
    A[Choose Index Type] --> B{Corpus above 500k vectors?}
    B -->|No| C[Flat Exhaustive Search]
    B -->|Yes| D{Recall above 90 percent?}
    D -->|Yes| E[HNSW Graph Index]
    D -->|No| F{Memory constrained?}
    F -->|Yes| G[IVF plus Product Quantization]
    F -->|No| H[IVF Clustered Index]
\`\`\`

*Index selection for RAG. Flat search fits below 500k vectors. Above that, recall requirements and memory constraints determine whether HNSW or IVF is the right choice.*

HNSW graphs reach 95%+ recall with no nprobe tuning, because they build a multi-layer proximity graph at index time and walk it greedily during search. For me the choice comes down to what you're short of. I'd choose IVF when memory is the binding constraint and recall below 90% is acceptable, and HNSW when recall matters more than the memory cost. When the corpus is a lot bigger than the RAM you have, I'd combine IVF with product quantization.
  `,

  references: [
    {
      text: 'Scikit-learn: Clustering Overview and K-Means Documentation',
      url: 'https://scikit-learn.org/stable/modules/clustering.html'
    },
    {
      text: 'Jegou et al., Product Quantization for Nearest Neighbor Search (2010)',
      url: 'https://www.researchgate.net/publication/47815472_Product_Quantization_for_Nearest_Neighbor_Search'
    },
    {
      text: 'Pinecone: Product Quantization and IVF Indexes in Faiss',
      url: 'https://www.pinecone.io/learn/series/faiss/product-quantization/'
    },
    {
      text: 'Malkov and Yashunin, Efficient and Robust Approximate Nearest Neighbor Search Using HNSW (2018)',
      url: 'https://arxiv.org/abs/1603.09320'
    }
  ]
};

export default post;
