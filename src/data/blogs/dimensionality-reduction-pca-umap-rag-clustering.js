const post = {
  id:       16,
  slug:     'dimensionality-reduction-pca-umap-rag-clustering',
  title:    'PCA, t-SNE and UMAP: reducing dimensions before clustering for RAG',
  category: 'research',
  iconKey:  'TrendingUp',
  color:    '#10b981',
  date:     '2026-06-01',
  readTime: '12 min',
  tags:     ['Clustering', 'UMAP', 'PCA', 'RAG', 'VectorSearch', 'MachineLearning', 'Embeddings'],
  excerpt:  'Why clustering in 768 dimensions fails, how PCA, t-SNE and UMAP reduce differently, and when reduction cuts RAG index cost without hurting recall.',

  content: `
## Clustering in 768 dimensions does not work the way you expect

When engineers first apply K-Means or DBSCAN to a text embedding corpus, the clusters often look wrong. Documents with obvious semantic similarity end up in different partitions. Documents with no apparent connection land together. The algorithm converges normally, inertia decreases, but the resulting partitions do not reflect any structure a human reviewer would recognize.

The cause is not the algorithm. It is the dimensionality of the input space.

In 768-dimensional space, Euclidean distance loses its power to discriminate. As the number of dimensions grows, the ratio of the maximum to minimum pairwise distance between any two points converges toward 1. All points become approximately equidistant from each other. A cluster computed in this regime is shaped by noise rather than semantic structure, because the distance signal the algorithm relies on has been washed out by hundreds of dimensions carrying little or no relevant information. This is the curse of dimensionality, and it affects every clustering algorithm that depends on geometric distance, including K-Means, DBSCAN, and hierarchical methods.

The fix is to reduce dimensionality before clustering. The key constraint is that this reduction applies only to copies of the corpus vectors used for computing cluster assignments. The original 768-dimensional vectors must remain in the retrieval index unchanged, because retrieval quality depends on cosine similarity in the original embedding space. Dimension reduction for clustering and dimension reduction for indexing are two separate decisions, and conflating them causes retrieval regression.

## How PCA, t-SNE and UMAP approach the problem differently

All three methods compress a high-dimensional point set into fewer dimensions, but they make different trade-offs between structure preservation, computational cost, and usability as clustering preprocessing.

**PCA (Principal Component Analysis)** is a linear method. It identifies the directions in the original space that capture the most variance and projects every vector onto those directions. The first principal component is the axis of highest variance, the second captures the next highest, and so on. Projecting 768-dimensional embeddings to 50 or 100 dimensions with PCA is fast, deterministic, and numerically stable. PCA preserves global structure well: clusters that are far apart in the original space remain far apart after projection. What PCA cannot represent is nonlinear manifold structure. If two semantically distinct topics occupy a curved or folded region in embedding space, PCA flattens that region and makes those topics appear closer together than they are. For well-separated, roughly convex topics PCA is a sound and fast choice.

**t-SNE (t-distributed Stochastic Neighbor Embedding)** is a nonlinear method designed for 2D and 3D visualization. It preserves local neighborhood structure by converting pairwise similarities into probability distributions and minimizing the divergence between the high-dimensional and low-dimensional distributions. Points that are close in the original space stay close in the projection. The trade-off is that t-SNE intentionally discards global structure: distances between well-separated clusters in a t-SNE plot carry no meaning. You cannot reliably conclude that cluster A is more similar to cluster B than to cluster C based on their spatial positions. t-SNE is therefore a diagnostic and visualization tool, not a preprocessing step for clustering. Running K-Means on t-SNE output produces partitions shaped by t-SNE's distortion artifacts, not by the underlying data.

**UMAP (Uniform Manifold Approximation and Projection)** is the correct choice for clustering preprocessing. It is nonlinear like t-SNE but preserves both local and global structure. It runs an order of magnitude faster than t-SNE on large corpora, scales to millions of points with approximate nearest-neighbor acceleration, and supports target dimensions well above 3. Projecting to 32 to 64 dimensions with UMAP before clustering produces partitions that reflect semantic neighborhood relationships while giving K-Means and DBSCAN enough density contrast to work with.

\`\`\`mermaid
flowchart LR
    A[768d Text Embeddings] --> B[PCA]
    A --> C[t-SNE]
    A --> D[UMAP]
    B --> B1[Linear Projection]
    B1 --> B2[Global Structure OK]
    B2 --> B3[Best for Convex Data]
    C --> C1[Nonlinear Projection]
    C1 --> C2[Local Structure Only]
    C2 --> C3[Viz Only No Clustering]
    D --> D1[Nonlinear Projection]
    D1 --> D2[Local and Global Both]
    D2 --> D3[Best for Clustering]
\`\`\`

*Structural trade-offs of the three methods. t-SNE's global structure loss disqualifies it as clustering input for any task where inter-cluster distances matter.*

## When to reduce and when to hold full dimensions

Dimensionality reduction before clustering is the right default for most production RAG corpora, but there are cases where it introduces more risk than it removes.

Reduce when the corpus is large enough that K-Means or DBSCAN produces unstable assignments in full 768-dimensional space. Reduce when cluster partitions will be used for query routing in a retrieval index, because noisy high-dimensional clusters translate directly into retrieval routing errors. Reduce when you need to visually validate cluster quality: apply UMAP to 32 or 64 dimensions for clustering, then apply a second UMAP pass to 2 or 3 dimensions for visualization on the same dataset.

Do not reduce when the corpus is small, below roughly 5,000 documents, because high-dimensional distance becomes less noisy as point density increases relative to the number of dimensions. Do not reduce when exact cosine similarity against the full-dimensional query vector is the retrieval mechanism and no partitioned routing is in play. Never write reduced-dimension vectors into the retrieval index. Reduced vectors and runtime query embeddings from the embedding model live in different geometric spaces. Mixing them corrupts every similarity score.

\`\`\`mermaid
flowchart TD
    A[Corpus Ingestion] --> B[Embed Corpus at 768d]
    B --> C{Two-Track Split}
    C --> D[Clustering Track]
    C --> E[Index Track 768d]
    D --> F[UMAP Copy to 50d]
    F --> G[Compute Cluster Labels]
    G --> H[Partition Labels]
    H --> E
    E --> I[Tag Vectors with IDs]
    I --> J[Query 768d Index]
\`\`\`

*Two-track ingestion pipeline. Reduction applies to the clustering copy only. The index stores the original 768d vectors with partition labels attached as metadata. Retrieval queries the original vectors.*

## The RAG case for reduction: cost, speed and recall

Beyond clustering quality, there is a direct infrastructure argument for dimensionality reduction before indexing in high-volume RAG systems.

Vector store cost scales linearly with dimension count. At one million indexed documents with 768-dimensional float32 vectors, raw vector storage requires roughly 3GB before graph overhead and metadata. Reducing to 128 dimensions cuts that to approximately 500MB. For hosted vector databases that charge on stored dimensions or bytes transferred per query, this difference appears in infrastructure spend at scale.

Approximate nearest-neighbor search latency also improves. HNSW and IVF graph structures become denser and more accurate for a given memory budget in lower-dimensional spaces. Distance computations are cheaper per operation, and fewer graph traversal steps are required to reach a target recall threshold. A 128-dimensional IVF index with equivalent \`nprobe\` settings consistently returns results faster than a 768-dimensional index of the same corpus.

The recall trade-off is smaller than most teams expect. For standard MTEB retrieval benchmarks, UMAP reduction to 128 dimensions before indexing retains 92 to 96 percent of the recall achievable with full 768-dimensional indexing, depending on corpus topic distribution and query type. For production RAG systems that already manage latency and cost constraints, the trade-off is worthwhile in almost every case.

\`\`\`mermaid
flowchart TD
    A[RAG Index at Scale] --> B{Pressure Points}
    B -->|Query Latency| C[ANN Slows at High Dim]
    B -->|Storage Cost| D[768d Storage Costly]
    B -->|Cluster Quality| E[High-Dim Noise]
    C --> F[UMAP to 128d for Index]
    D --> F
    E --> G[UMAP Reduce to 50d]
    F --> H[Benchmark Recall]
    G --> I[Assign Cluster Labels]
    H --> J{Recall Within Target?}
    J -->|Yes| K[Deploy Reduced Index]
    J -->|No| L[Raise Dim Target]
    L --> F
\`\`\`

*Decision flow for adding reduction to an existing RAG pipeline. Recall benchmarking against the full-dimension baseline is the gate before any reduced index reaches production.*
  `,

  references: [
    {
      text: 'McInnes, L., Healy, J. & Melville, J. (2018) "UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction". arXiv preprint arXiv:1802.03426.',
      url: 'https://arxiv.org/abs/1802.03426'
    },
    {
      text: 'van der Maaten, L. & Hinton, G. (2008) "Visualizing Data using t-SNE". Journal of Machine Learning Research, 9, pp. 2579-2605.',
      url: 'https://jmlr.org/papers/v9/vandermaaten08a.html'
    },
    {
      text: 'Pearson, K. (1901) "On Lines and Planes of Closest Fit to Systems of Points in Space". Philosophical Magazine, 2(11), pp. 559-572.',
      url: 'https://doi.org/10.1080/14786440109462720'
    },
    {
      text: 'Muennighoff, N. et al. (2023) "MTEB: Massive Text Embedding Benchmark". Proceedings of EACL 2023.',
      url: 'https://arxiv.org/abs/2210.07316'
    },
    {
      text: 'Johnson, J., Douze, M. & Jegou, H. (2021) "Billion-scale similarity search with GPUs". IEEE Transactions on Big Data, 7(3).',
      url: 'https://arxiv.org/abs/1702.08734'
    },
    {
      text: 'Aggarwal, C., Hinneburg, A. & Keim, D. (2001) "On the Surprising Behavior of Distance Metrics in High Dimensional Space". ICDT 2001, Lecture Notes in Computer Science, vol. 1973.',
      url: 'https://link.springer.com/chapter/10.1007/3-540-44503-X_27'
    }
  ]
};

export default post;
