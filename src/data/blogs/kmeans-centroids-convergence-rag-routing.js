const post = {
  id:       13,
  slug:     'kmeans-centroids-convergence-rag-routing',
  title:    'K-Means clustering: centroids, convergence and when it breaks',
  category: 'research',
  iconKey:  'Brain',
  color:    '#3b82f6',
  date:     '2026-05-11',
  readTime: '12 min',
  tags:     ['Clustering', 'KMeans', 'VectorSearch', 'RAG', 'Embeddings', 'MachineLearning'],
  excerpt:  'K-Means mechanics, convergence, the three failure modes engineers hit most, and how centroids work as RAG query routing gates.',

  content: `
## Your vector search scales poorly by default

Most RAG pipelines run the same way: a user query arrives, the system embeds it into a vector, and that vector searches the entire corpus. On a knowledge base of 10,000 chunks, full-index search on every request is fine. At 1 million chunks, it becomes expensive. At 10 million chunks, it becomes the main cost driver and a latency bottleneck that cannot be routed around without rearchitecting retrieval from scratch.

The standard fix is partitioning: split the index into groups of semantically related documents, and at query time only search the relevant partition rather than everything. K-Means is the most common algorithm for building those partitions. Understanding its mechanics and failure modes is not optional knowledge for engineers building RAG systems that scale.

## How K-Means works: assignment, update, convergence

K-Means takes a dataset and a target number of clusters K, then repeats three steps until centroids stop moving.

**Initialize centroids.** Place K centroids in the embedding space. The default method, K-Means++, places the first centroid randomly, then chooses each subsequent centroid with probability proportional to its squared distance from the nearest existing centroid. This biases initialization toward centroids that are far apart, reducing the chance that two centroids land in the same dense region.

**Assign each point.** Compute the Euclidean distance from every point to every centroid. Assign each point to the nearest centroid. The set of points assigned to centroid j forms cluster j.

**Update centroids.** Move each centroid to the mean of all points assigned to it. The new position is the average coordinate across all dimensions for every point in the cluster.

Repeat assignment and update until centroid positions change by less than a configured tolerance, typically 1e-4. The algorithm is guaranteed to converge, but not necessarily to the global optimum. Running K-Means multiple times with different seeds and keeping the result with the lowest inertia (sum of squared distances from each point to its centroid) reduces the risk of settling into a poor local minimum. For 768-dimensional text embeddings at one million vectors, K-Means++ typically converges in 20 to 50 iterations.

\`\`\`mermaid
flowchart TD
    A[Initialize K Centroids with K-Means++] --> B[Assign Each Point to Nearest Centroid]
    B --> C[Recompute Each Centroid as Cluster Mean]
    C --> D{Centroids Moved More Than Tolerance?}
    D -->|Yes| B
    D -->|No| E[Converged: Fixed Centroid Positions]
    E --> F[Compute Inertia]
    F --> G{Best Inertia Across All Seeds?}
    G -->|Yes| H[Save This Configuration]
    G -->|No| I[Discard and Try Next Seed]
\`\`\`

*The K-Means iteration loop. Assignment and update alternate until convergence. Running multiple seeds and keeping the lowest-inertia result is the minimum reproducibility practice before deploying centroids to production.*

## The three failure modes that break K-Means silently

K-Means makes three implicit assumptions that real data regularly violates:

- **Spherical cluster bias.** K-Means minimizes Euclidean distance to centroids, which assumes clusters are roughly spherical and of similar size. Elongated clusters and arc-shaped distributions get split incorrectly. In text embedding spaces, topic clusters are often ellipsoidal because some topics have narrower semantic range than others. A cluster covering "Python syntax" is tighter than a cluster covering "software architecture," but K-Means treats them identically.
- **Uniform density assumption.** K-Means assigns every point to exactly one cluster regardless of how sparse the region is. In a corpus covering both specialized technical content and broad general content, K-Means pushes centroids into sparse general regions even when those regions contain mostly low-signal documents that should not anchor a partition.
- **Initialization sensitivity.** Even with K-Means++, different random seeds produce different centroid configurations. On high-dimensional text embeddings, the variance between seeds can be significant enough to route the same query to cluster 3 in one run and cluster 7 in another. Without fixing \`random_state\` and running multiple seeds, centroid routing is not reproducible across deployments.

\`\`\`mermaid
flowchart TD
    A[K-Means Assumptions] --> B[Clusters Are Spherical]
    A --> C[All Regions Have Equal Density]
    A --> D[Initialization Is Stable]
    B --> B1[Fails on Elongated Topic Clusters]
    C --> C1[Fails on Sparse Noise Regions]
    D --> D1[Fails Without Multi-Seed Runs]
    B1 --> FX1[Use DBSCAN or HDBSCAN Instead]
    C1 --> FX2[Pre-filter Low-Signal Documents]
    D1 --> FX3[Run n-init 10 and Keep Best Inertia]
\`\`\`

*The three K-Means failure modes and their practical mitigations. When cluster geometry is irregular or when the corpus contains substantial noise, density-based algorithms outperform K-Means.*

## Centroids as RAG query routing gates

Once K-Means converges, the resulting centroids become routing gates for retrieval. The idea is simple: at query time, embed the user query, compute cosine distance to every centroid, and route the full vector similarity search to the nearest partition only. The remaining K-1 partitions are skipped entirely.

This is how FAISS implements IVF (Inverted File Index): K-Means produces the cluster centroids, which define Voronoi cells. Each chunk in the knowledge base is pre-assigned to the nearest centroid cell. A query searches the nearest \`nprobe\` cells rather than all cells, where \`nprobe\` is a tunable recall-vs-speed parameter.

The trade-off is direct:

- \`nprobe=1\` gives maximum speed but misses chunks near partition boundaries
- \`nprobe=8\` to \`nprobe=32\` recovers most boundary cases at reasonable latency cost
- \`nprobe=K\` degrades to full-corpus search, identical to not routing at all

The number of clusters K controls partition granularity. A practical starting point is K equal to the square root of the total chunk count. Then benchmark recall@10 under different \`nprobe\` values to find the operating point where latency savings do not come at the cost of retrieval quality.

\`\`\`mermaid
flowchart LR
    Q[User Query] --> EMB[Embed Query Vector]
    EMB --> CENT[Compute Distance to All Centroids]
    CENT --> NEAR[Select Nearest nprobe Centroids]
    NEAR --> PART[Search Assigned Partitions Only]
    PART --> RET[Retrieve Top-k Chunks]
    RET --> LLM[LLM Generation]
    CENT --> SKIP[Skip Remaining Partitions]
\`\`\`

*Centroid-based query routing in a partitioned RAG index. The query vector finds its nearest centroid first, then searches only the corresponding partition. This reduces the search space from N to N divided by K per query.*

## What to get right before deploying K-Means partitions

Three practices are required before routing production traffic through K-Means centroids:

1. **L2-normalize embeddings before clustering.** K-Means uses Euclidean distance, but text embedding models encode meaning in the direction of a vector, not its magnitude. Normalizing all vectors to unit length before clustering ensures that Euclidean distance and cosine similarity produce identical nearest-centroid rankings. Without normalization, magnitude differences that carry no semantic content bias centroid positions.

2. **Run with n-init of at least 10 and pick by inertia.** Use at least 10 independent initializations. Keep the centroid configuration with the lowest inertia. The extra cost is paid once offline at clustering time and recovered at every query for the lifetime of the index.

3. **Benchmark recall before and after routing.** Measure recall@10 on a held-out query set with full-corpus search and with centroid routing at your target \`nprobe\`. If routing drops recall by more than 2 to 3 percentage points, increase \`nprobe\` until recall recovers. Centroid routing must be transparent to retrieval quality. Any recall drop that engineering accepts in exchange for latency savings should be a deliberate, measured decision rather than an invisible side effect of partitioning.

K-Means is not the right algorithm for every corpus. When cluster boundaries are irregular, cluster sizes highly uneven, or the corpus contains substantial noise, density-based approaches outperform it. But for a stable knowledge base where fast offline partitioning is the goal, K-Means with K-Means++ initialization and L2-normalized embeddings remains the most production-proven option available.
  `,

  references: [
    {
      text: 'Arthur, D. & Vassilvitskii, S. (2007) "k-means++: The Advantages of Careful Seeding". Proceedings of the 18th Annual ACM-SIAM Symposium on Discrete Algorithms.',
      url: 'https://theory.stanford.edu/~sergei/papers/kMeansPP-soda.pdf'
    },
    {
      text: 'Johnson, J., Douze, M. & Jegou, H. (2021) "Billion-scale similarity search with GPUs". IEEE Transactions on Big Data, 7(3).',
      url: 'https://arxiv.org/abs/1702.08734'
    },
    {
      text: 'scikit-learn developers (2024) "2.3. Clustering: K-Means". scikit-learn User Guide.',
      url: 'https://scikit-learn.org/stable/modules/clustering.html#k-means'
    },
    {
      text: 'Reimers, N. & Gurevych, I. (2019) "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks". EMNLP 2019.',
      url: 'https://arxiv.org/abs/1908.10084'
    },
    {
      text: 'Douze, M. et al. (2024) "The FAISS library". arXiv preprint.',
      url: 'https://arxiv.org/abs/2401.08281'
    }
  ]
};

export default post;
