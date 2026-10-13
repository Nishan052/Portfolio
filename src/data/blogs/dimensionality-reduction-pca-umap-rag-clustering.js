const post = {
  id:       16,
  slug:     'dimensionality-reduction-pca-umap-rag-clustering',
  title:    'PCA, t-SNE and UMAP: reducing dimensions before clustering for RAG',
  category: 'research',
  iconKey:  'TrendingUp',
  color:    '#10b981',
  date:     '2026-06-01',
  series:     'Production RAG',
  part:     11,
  readTime: '12 min',
  tags:     ['Clustering', 'UMAP', 'PCA', 'RAG', 'VectorSearch', 'MachineLearning', 'Embeddings'],
  excerpt:  'Clustering in 768 dimensions goes wrong, so here\'s how PCA, t-SNE and UMAP reduce dimensions differently and when that cuts RAG index cost.',

  content: `
## Clustering in 768 dimensions does not work the way you expect

When engineers first run K-Means or DBSCAN on a corpus of text embeddings, the clusters often look wrong. Documents that are obviously similar in meaning end up in different partitions, and documents with no visible connection land together. The algorithm converges normally and inertia goes down, but the partitions don't reflect any structure a human reviewer would recognize, and the reason is the dimensionality of the input space.

In 768-dimensional space, Euclidean distance loses its power to tell points apart. As the number of dimensions grows, the ratio of the maximum to the minimum pairwise distance between any two points converges toward 1, so all points end up roughly the same distance from each other. A cluster computed in that situation is shaped by noise instead of meaning, because the distance signal the algorithm relies on gets washed out by hundreds of dimensions that carry little or no relevant information. This is the curse of dimensionality, and it affects every clustering algorithm that depends on geometric distance, including K-Means, DBSCAN and hierarchical methods.

The fix is to reduce dimensionality before clustering, with one important limit. The reduction only applies to copies of the corpus vectors that you use to compute cluster assignments. The original 768-dimensional vectors have to stay in the retrieval index unchanged, since retrieval quality depends on cosine similarity in the original embedding space. For me reducing dimensions for clustering and reducing them for indexing are two separate decisions, and mixing them up makes retrieval worse.

## How PCA, t-SNE and UMAP approach the problem differently

All three methods compress a high-dimensional set of points into fewer dimensions, but each one makes a different trade-off between preserving structure, computational cost and how usable the result is as input for clustering.

PCA (Principal Component Analysis) is a linear method. It finds the directions in the original space that capture the most variance and projects every vector onto them. The first principal component is the axis of highest variance, the second captures the next highest, and so on. Projecting 768-dimensional embeddings down to 50 or 100 dimensions with PCA is fast, deterministic and numerically stable. PCA also preserves global structure well, so clusters that are far apart in the original space stay far apart after the projection. What it can't represent is nonlinear manifold structure. If two topics with different meanings sit in a curved or folded region of the embedding space, PCA flattens that region and makes them look closer together than they are. For well-separated, roughly convex topics, though, PCA is a sound and fast choice.

t-SNE (t-distributed Stochastic Neighbor Embedding) is a nonlinear method built for 2D and 3D visualization. It preserves local neighborhood structure by turning pairwise similarities into probability distributions and minimizing the divergence between the high-dimensional and low-dimensional ones, so points that are close in the original space stay close in the projection. The trade-off is that t-SNE deliberately throws away global structure, which means the distances between well-separated clusters in a t-SNE plot carry no meaning. You can't reliably conclude that cluster A is more similar to cluster B than to cluster C from where they sit on the plot. So I'd use t-SNE for diagnosis and visualization and never as a preprocessing step for clustering, because running K-Means on t-SNE output gives you partitions shaped by t-SNE's distortions instead of by the underlying data.

UMAP (Uniform Manifold Approximation and Projection) is the one I'd use before clustering. Like t-SNE it's nonlinear, and it preserves both local and global structure. It runs an order of magnitude faster than t-SNE on large corpora, scales to millions of points with approximate nearest-neighbor acceleration and supports target dimensions well above 3. Projecting to 32 to 64 dimensions with UMAP before clustering gives you partitions that follow the neighborhoods in meaning, while still giving K-Means and DBSCAN enough contrast in density to work with.

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

Reducing dimensionality before clustering is the right default for most production RAG corpora, but there are cases where it adds more risk than it removes.

I'd reduce when the corpus is large enough that K-Means or DBSCAN gives unstable assignments in the full 768-dimensional space. I'd also reduce when the cluster partitions will be used for query routing in a retrieval index, because noisy high-dimensional clusters turn directly into routing errors at retrieval time. And I'd reduce when you need to check cluster quality visually. In that case you apply UMAP to 32 or 64 dimensions for clustering, then run a second UMAP pass on the same dataset down to 2 or 3 dimensions to look at it.

I wouldn't reduce when the corpus is small, below roughly 5,000 documents, because high-dimensional distance gets less noisy as point density increases relative to the number of dimensions. I also wouldn't reduce when the retrieval mechanism is exact cosine similarity against the full-dimensional query vector and no partitioned routing is involved. And I'd never write reduced-dimension vectors into the retrieval index. The reduced vectors and the query embeddings the embedding model produces at runtime live in different geometric spaces, so mixing them corrupts every similarity score.

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

Apart from clustering quality, there's also a direct infrastructure argument for reducing dimensions before indexing in RAG systems with high volume.

Vector store cost scales linearly with the number of dimensions. At one million indexed documents with 768-dimensional float32 vectors, the raw vector storage alone is roughly 3GB before graph overhead and metadata, and reducing to 128 dimensions cuts that to about 500MB. For hosted vector databases that charge on stored dimensions or on bytes transferred per query, that difference shows up in the infrastructure bill at scale.

Approximate nearest-neighbor search also gets faster, because HNSW and IVF graph structures become denser and more accurate for a given memory budget in lower-dimensional spaces. Each distance computation is cheaper too, and fewer graph traversal steps are needed to reach a target recall. So a 128-dimensional IVF index with the same \`nprobe\` settings consistently returns results faster than a 768-dimensional index of the same corpus.

The recall trade-off is smaller than most teams expect. On standard MTEB retrieval benchmarks, UMAP reduction to 128 dimensions before indexing keeps 92 to 96 percent of the recall you get with full 768-dimensional indexing. The exact number depends on how the corpus topics are distributed and the type of query. For production RAG systems that already have to manage latency and cost, I'd say the trade-off is worth it in almost every case.

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
