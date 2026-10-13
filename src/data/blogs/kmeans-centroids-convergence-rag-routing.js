const post = {
  id:       13,
  slug:     'kmeans-centroids-convergence-rag-routing',
  title:    'K-Means clustering: centroids, convergence and when it breaks',
  category: 'research',
  iconKey:  'Brain',
  color:    '#3b82f6',
  date:     '2026-05-11',
  series:     'Production RAG',
  part:     8,
  readTime: '12 min',
  tags:     ['Clustering', 'KMeans', 'VectorSearch', 'RAG', 'Embeddings', 'MachineLearning'],
  excerpt:  'Let me explain how K-Means converges, the three ways it breaks most often, and how its centroids route queries to the right part of a RAG index.',

  content: `
## Your vector search scales poorly by default

Most RAG pipelines work the same way, where a user query comes in, the system embeds it into a vector, and that vector searches the entire corpus. On a knowledge base of 10,000 chunks, searching the full index on every request is fine. At 1 million chunks it gets expensive, and at 10 million chunks it becomes the main cost driver and a latency bottleneck that you can't get around without rebuilding retrieval from scratch.

The standard fix is partitioning, so you split the index into groups of documents that are related in meaning, and at query time you only search the relevant partition. K-Means is the most common algorithm for building those partitions, and for me anyone building a RAG system that has to scale needs to understand how it works and where it fails.

## How K-Means works: assignment, update, convergence

K-Means takes a dataset and a target number of clusters K, then repeats three steps until the centroids stop moving.

The first step is to initialize the centroids by placing K of them in the embedding space. The default method, K-Means++, places the first centroid randomly and then picks each next centroid with a probability proportional to its squared distance from the nearest existing one. That pushes the starting centroids far apart, so there's less chance of two of them landing in the same dense region.

The second step is to assign each point. You compute the Euclidean distance from every point to every centroid and assign each point to the nearest one, so the set of points assigned to centroid j forms cluster j.

The third step is to update the centroids by moving each one to the mean of all the points assigned to it, which is the average coordinate across all dimensions for every point in the cluster.

Then you repeat assignment and update until the centroid positions change by less than a configured tolerance, typically 1e-4. The algorithm is guaranteed to converge, though not necessarily to the global optimum. That's why I'd run K-Means several times with different seeds and keep the result with the lowest inertia, so you're less likely to settle into a poor local minimum. Inertia here is the sum of squared distances from each point to its centroid. For 768-dimensional text embeddings at one million vectors, K-Means++ typically converges in 20 to 50 iterations.

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

K-Means makes three assumptions without telling you, and real data breaks them regularly:

- Spherical cluster bias. K-Means minimizes Euclidean distance to centroids, which assumes clusters are roughly spherical and of similar size, so elongated clusters and arc-shaped distributions get split in the wrong places. In text embedding spaces topic clusters are often ellipsoidal, because some topics cover a narrower range of meaning than others. A cluster covering "Python syntax" is tighter than one covering "software architecture," and K-Means still treats them the same way.
- Uniform density assumption. K-Means assigns every point to exactly one cluster no matter how sparse the region is. So in a corpus with both specialized technical content and broad general content, it pushes centroids into the sparse general regions, even when those regions hold mostly low-signal documents that shouldn't anchor a partition.
- Initialization sensitivity. Even with K-Means++, different random seeds give different centroid configurations, and on high-dimensional text embeddings the difference between seeds can be big enough to route the same query to cluster 3 in one run and cluster 7 in another. If you don't fix \`random_state\` and run multiple seeds, centroid routing won't be reproducible across deployments.

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

Once K-Means converges, the centroids become routing gates for retrieval. It works like this: at query time you embed the user query, compute the cosine distance to every centroid and run the full vector similarity search only in the nearest partition. The remaining K-1 partitions are skipped entirely.

This is how FAISS implements IVF (Inverted File Index). K-Means produces the cluster centroids, which define Voronoi cells, and each chunk in the knowledge base is assigned ahead of time to the cell of its nearest centroid. A query then searches the nearest \`nprobe\` cells instead of all of them, where \`nprobe\` is a parameter you tune to trade recall against speed.

The trade-off between speed and recall looks like this:

- \`nprobe=1\` gives maximum speed but misses chunks near partition boundaries
- \`nprobe=8\` to \`nprobe=32\` recovers most boundary cases at reasonable latency cost
- \`nprobe=K\` degrades to full-corpus search, identical to not routing at all

The number of clusters K controls how fine the partitions are, and a practical starting point is K equal to the square root of the total chunk count. From there I'd benchmark recall@10 under different \`nprobe\` values to find the point where the latency savings don't cost you retrieval quality.

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

These are the three things I'd get right before routing production traffic through K-Means centroids:

1. L2-normalize embeddings before clustering. K-Means uses Euclidean distance, but text embedding models encode meaning in the direction of a vector and not in its magnitude. If you normalize all vectors to unit length before clustering, Euclidean distance and cosine similarity give identical nearest-centroid rankings, and without that, magnitude differences that carry no meaning pull the centroid positions off.

2. Run with n-init of at least 10 and pick by inertia. Use at least 10 independent initializations and keep the centroid configuration with the lowest inertia. The extra cost is paid once offline at clustering time, and you get it back on every query for as long as the index lives.

3. Benchmark recall before and after routing. Measure recall@10 on a held-out query set with full-corpus search and with centroid routing at your target \`nprobe\`, and if routing drops recall by more than 2 to 3 percentage points, increase \`nprobe\` until recall recovers. Centroid routing should be invisible to retrieval quality, so any recall drop that you accept in exchange for latency savings should be a deliberate decision that you've measured.

K-Means isn't the right algorithm for every corpus, and when the cluster boundaries are irregular, the cluster sizes are very uneven or the corpus has a lot of noise, density-based approaches do better. For a stable knowledge base where the goal is fast offline partitioning, though, K-Means with K-Means++ initialization and L2-normalized embeddings is still the most production-proven option there is.
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
