# LinkedIn Post: PCA, t-SNE and UMAP: reducing dimensions before clustering for RAG

Status: explainer
Source: src/data/blogs/dimensionality-reduction-pca-umap-rag-clustering.js
Date drafted: 2026-10-13, replaces the earlier W6 trailer draft

---

Clustering text embeddings in 768 dimensions often gives groups that make no sense, because every point ends up about the same distance from every other.

So before clustering I'd shrink the number of dimensions, but only on a copy of the vectors used to find the clusters, and keep the full vectors for search itself.

The three usual methods do this very differently. Principal component analysis (PCA) is fast and keeps the big picture, but it flattens any curved shape in the data.

The t-distributed stochastic neighbor embedding (t-SNE) method is made for 2D and 3D pictures and throws away the gaps between groups, so it's good for looking at the data but not for clustering it.

Uniform manifold approximation and projection (UMAP) keeps both the close neighbors and the bigger picture, which is why it's the one I'd reach for, usually at 32 to 64 dimensions.

It also saves money. At one million documents, 768-dimensional vectors take roughly 3GB, and 128 dimensions brings that down to about 500MB, while UMAP keeps 92 to 96 percent of the full recall on standard benchmarks.

For me the takeaway is to check recall against the full vectors before a smaller index goes anywhere near production.

Full breakdown here: https://nishanpoojary.com/blogs/dimensionality-reduction-pca-umap-rag-clustering

#RAG #VectorSearch #Clustering #UMAP #MachineLearning
