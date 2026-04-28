const post = {
  id:       12,
  slug:     'clustering-compression-not-classification',
  title:    'Clustering is a compression decision, not classification',
  category: 'research',
  iconKey:  'Brain',
  color:    '#f59e0b',
  date:     '2026-04-28',
  readTime: '12 min',
  tags:     ['Clustering', 'RAG', 'VectorSearch', 'KMeans', 'Unsupervised', 'Embeddings', 'IVF'],
  excerpt:  'Searching millions of documents checks every one unless you cluster first. Here is how k-means groups your data and why it makes RAG 100x faster.',

  content: `
## The Search Space Problem at Scale

Brute-force similarity search against ten million 1536-dimensional vectors requires loading every embedding into memory and scoring it against the query, like checking every book in a library with no catalog. One million 128-dimensional float32 vectors cost 512 MB of RAM. At production scale, exhaustive nearest-neighbor search runs for hundreds of milliseconds per request, far past what a user-facing application tolerates.

The root problem is not hardware. It is search scope. Without structure, every query evaluates every vector. Clustering adds structure by partitioning the data set offline, so queries at runtime evaluate only the relevant partition rather than the full corpus.

This is where k-means clustering fits into the RAG engineering story. Not as a labeling mechanism. Not as a classifier. As a **compression decision**: you accept slightly imperfect recall in exchange for orders-of-magnitude faster retrieval. Getting that tradeoff right requires understanding what the algorithm actually optimizes and where it structurally fails.

## What Inertia Measures and What It Does Not

K-means does not discover meaningful categories in your data. It minimizes **inertia**: the total squared distance between each point and its assigned cluster center, a measure of how tightly packed each group is. Lower inertia means points sit closer to their centroid. The algorithm stops when those centroids stop moving. What it produces is a partition, not a label. Two documents with identical content can land in different clusters on different runs if initialization differs.

The distance metric determines what "close" means. Euclidean distance treats all dimensions equally. **Cosine distance** normalizes for magnitude, making it the better choice for text embeddings where vector length varies but direction encodes semantic meaning. Applying Euclidean distance to high-dimensional embeddings breaks down because in high dimensions the gap between nearest and farthest neighbors collapses to near zero. This is the **curse of dimensionality**: distance loses its power to discriminate as dimensions increase.

K-means assumes convex clusters of roughly equal size. Density-based algorithms like DBSCAN handle irregular shapes, but do not produce the fixed partition structure that index construction requires. When the goal is search scope reduction, k-means is the practical default.

## The k-Means Iteration Loop

K-means runs three steps in a loop until convergence or until a maximum iteration count is reached:

1. Assign each point to its nearest centroid using the chosen distance metric.
2. Update each centroid to the mean of all points currently assigned to it.
3. Repeat until centroid displacement falls below a threshold.

\`\`\`mermaid
flowchart LR
    subgraph INIT["Phase 1 · Seed Placement"]
        A([Embeddings In]) --> B[k-means++ picks\nk spread-out seeds]
    end
    subgraph LOOP["Phase 2 · Refinement Loop"]
        C[Distance to\nevery seed] --> D[Assign to\nclosest seed]
        D --> E[Move seed to\ngroup mean]
        E --> F{Seeds still\nmoving?}
        F -->|Yes| C
    end
    subgraph DONE["Phase 3 · Stable Partition"]
        G[(k Voronoi cells)] --> H([IVF Index Ready])
    end
    INIT --> LOOP
    F -->|No| DONE
\`\`\`

*Three phases of k-means: seeds are placed far apart, points and seeds converge through repeated assignment, and the stable regions become the lookup cells of the IVF index.*

A centroid is not a data point. It is a computed position, like the average GPS coordinate of all delivery stops in a zone. It represents the center of its group even if no document sits at that exact location. **K-means++ initialization** places starting centroids far apart across the vector space, reducing the chance of the algorithm converging on a poor local partition.

The result is a Voronoi partition: the vector space gets divided into regions where every point belongs to the nearest centroid. These regions become the lookup cells for a retrieval index, each mapping to a list of document IDs. Cluster shapes in practice are rarely spherical. Real document embeddings form elongated or irregular patterns. Cluster assignments remain useful as a coarse filter because the goal is scope reduction, not perfect boundary placement.

## Clustering as a RAG Pre-Filter

An **Inverted File Index** (IVF) turns the k-means output into a fast retrieval system by mapping each cluster region to the document IDs inside it.

The workflow separates into two phases.

In the offline phase, you cluster the full knowledge base into k Voronoi cells. Each document embedding gets assigned to its nearest centroid. The index stores a mapping from centroid ID to the list of document IDs in that cell.

At query time, you embed the query, find the nearest centroid, and run similarity search only within that cell. The \`nprobe\` parameter expands the search to neighboring cells, trading a small amount of speed for better recall near cluster boundaries.

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

*IVF separates index construction from query time. Clustering runs once offline. Each query probes only the nearest nprobe cells rather than the full corpus.*

Benchmarks on the Sift1M dataset (one million 128-dimensional vectors) show the tradeoff concretely:

- Flat exhaustive search: 15ms per query, 100% recall
- IVF with k=2048, nprobe=1: 0.09ms per query, 34% recall
- IVF with k=2048, nprobe=48: 0.09ms per query, 52% recall

The 166x speed improvement comes entirely from clustering the index before queries arrive. Each query evaluates only the documents in the nearest cells, typically 2 to 5% of the full corpus. The recall gap is structural: if the correct document sits in a cell that was not probed, retrieval misses it.

## Choosing Parameters and Monitoring Drift

Two parameters govern IVF-based retrieval quality. **k** (number of clusters) controls partition granularity. A practical starting point is the square root of the corpus size. One million documents maps to roughly k=1000. At k=2048, each cluster holds about 500 documents on average. **nprobe** (cells searched per query) trades recall for speed. Start at 1% of k and increase until recall targets are met. At nprobe=48 out of k=2048, you search roughly 2.3% of the index.

Cluster drift is a silent failure mode. New documents arriving after the last clustering pass get assigned to the nearest existing centroid, but those centroids never update. No error fires, latency stays flat, but relevance worsens over time.

Track the **silhouette score** of your partition over time. The silhouette score measures how well each point fits its own cluster compared to the next closest one. A score near +1 indicates dense, well-separated clusters. A score near 0 signals heavy overlap. Reschedule a full clustering pass when the score falls below 0.4. Monthly recluster cycles work for most RAG corpora unless the corpus grows by more than 20% between passes.

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

HNSW graphs reach 95%+ recall with no nprobe tuning by building a multi-layer proximity graph at index time and navigating it greedily during search. Choose IVF when memory is the binding constraint and recall targets below 90% are acceptable. Choose HNSW when recall matters more than memory cost. Combine IVF with product quantization when corpus size exceeds available RAM by a significant margin.
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
