const post = {
  id:       14,
  slug:     'dbscan-density-clustering-rag-quality-filter',
  title:    'DBSCAN: density-based clustering as a RAG quality filter',
  category: 'research',
  iconKey:  'ScanSearch',
  color:    '#a855f7',
  date:     '2026-05-18',
  readTime: '12 min',
  tags:     ['Clustering', 'DBSCAN', 'RAG', 'VectorSearch', 'DataQuality', 'MachineLearning'],
  excerpt:  'DBSCAN finds arbitrarily-shaped clusters without a fixed K, and its noise points make the sharpest pre-ingestion quality filter for RAG.',

  content: `
## RAG ingestion has a quality problem most teams ignore

Every RAG system eventually develops the same pathology. Documents accumulate in the knowledge base faster than anyone reviews them. Legacy content from deprecated systems, auto-generated summaries of summaries, and lightly edited duplicates all end up indexed alongside high-quality source documents. At retrieval time, these low-signal documents compete with accurate ones for the top-k slots. The result is retrieved context that dilutes useful signal before it ever reaches the language model.

Most teams treat this as a retrieval problem and tune similarity thresholds or increase top-k to compensate. Both adjustments make the underlying issue worse by admitting more noise into the prompt context. The correct fix is earlier: apply a quality filter during ingestion, before low-signal documents enter the index.

DBSCAN provides a principled mechanism for doing this. Unlike K-Means, DBSCAN naturally identifies points that do not belong to any cluster and labels them as noise. In a document embedding space, noise points are documents that share no dense neighborhood with other documents. They are outliers, isolated fragments, and structural artifacts that contribute little semantic signal. Removing them before indexing reduces index size and improves retrieval precision without any labeled training data.

## How DBSCAN defines a cluster

DBSCAN builds clusters by following density. Two parameters control what dense means: epsilon, the neighborhood radius, and min_samples, the minimum number of points that must fall within epsilon of a point for that point to anchor a cluster.

The algorithm classifies every point as one of three types:

- **Core point**: has at least min_samples neighbors within epsilon distance, including itself. Core points are the dense anchors from which clusters grow.
- **Border point**: falls within epsilon of a core point but does not have enough neighbors to be a core point itself. Border points extend the boundary of a cluster without anchoring it.
- **Noise point**: falls within epsilon of no core point. Noise points do not belong to any cluster and receive the label -1.

Once every point is classified, clusters form by connecting core points that fall within epsilon of each other. Border points attach to the nearest core point's cluster. Noise points remain unassigned.

\`\`\`mermaid
flowchart TD
    A[Pick Unvisited Point P] --> B{Count Neighbors Within Epsilon}
    B -->|Fewer Than min_samples| C[Mark as Noise Candidate]
    B -->|At Least min_samples| D[Mark as Core Point]
    D --> E[Start or Expand Cluster]
    E --> F[Visit Each Unvisited Neighbor]
    F --> G{Neighbor Has Enough Neighbors?}
    G -->|Yes| H[Neighbor Becomes Core Point and Expands]
    G -->|No| I[Mark Neighbor as Border Point]
    H --> F
    I --> F
    C --> J{Within Epsilon of Any Core Point?}
    J -->|Yes| K[Reclassify as Border Point]
    J -->|No| L[Confirm Noise Label Minus One]
\`\`\`

*The DBSCAN classification loop. Expansion stops when every reachable neighbor has been visited. Points that never reach a core point keep the noise label.*

Because cluster growth follows local density rather than distance to a centroid, DBSCAN discovers clusters of any shape. A cluster shaped like a crescent, a ring, or an irregular blob presents no problem. K-Means would split all three into spherical fragments, because it assigns points by centroid proximity regardless of local structure.

## Choosing epsilon and min_samples for embedding corpora

The two parameters interact, and the right values depend on the dimensionality and density of the embedding space.

For epsilon, the standard approach is a k-nearest-neighbor distance plot. Compute the distance from each point to its k-th nearest neighbor, sort the values in ascending order, and plot them. The epsilon value sits at the elbow of the curve, where distances begin increasing sharply. For 768-dimensional text embeddings from models like \`bge-base-en-v1.5\`, typical epsilon values fall between 0.15 and 0.35 in cosine distance space after L2 normalization.

For min_samples, a useful starting point is between 5 and 20. Higher values produce more conservative clusters that reject more noise. For RAG quality filtering, erring toward a higher min_samples is correct: it is better to exclude a borderline document than to admit a low-signal one into the index.

\`\`\`mermaid
flowchart LR
    A[Embedding Corpus Sample] --> B[Compute K-NN Distance Plot]
    B --> C[Identify Elbow for Epsilon]
    C --> D[Run DBSCAN with Initial Parameters]
    D --> E{Check Noise Ratio}
    E -->|Above 15 Percent| F[Increase Epsilon or Lower min_samples]
    E -->|Below 2 Percent| G[Decrease Epsilon or Raise min_samples]
    E -->|Between 5 and 10 Percent| H[Parameters Accepted]
    F --> D
    G --> D
    H --> I[Lock Parameters for Production]
\`\`\`

*Parameter tuning loop for DBSCAN on embedding corpora. Target noise ratio for RAG quality filtering is typically 5 to 10 percent, depending on corpus curation history.*

## Using noise points as a pre-ingestion quality filter

DBSCAN's noise label is the mechanism that makes it useful for RAG ingestion. In a well-curated corpus, the noise ratio should be low. Most documents cluster with related documents because coherent content naturally forms dense neighborhoods. Documents that receive the noise label share a consistent profile across different corpora.

The document categories that surface most often as DBSCAN noise are:

- Auto-generated boilerplate with near-zero semantic content, such as cookie consent text, navigation fragments, and headers extracted without body content
- Thin duplicate fragments that differ from their source by only a few tokens but are not identical enough for exact deduplication to catch
- Content from unrelated domains that entered the corpus through an overly broad crawl or ingestion scope
- Error pages, redirect artifacts, and empty section placeholders that were indexed before any validation ran

None of these categories benefit retrieval. Excluding them from the index reduces the candidate space for every query, cuts storage cost, and eliminates a class of retrieval errors where the model cites boilerplate content as evidence.

\`\`\`mermaid
flowchart TD
    A[Raw Document Corpus] --> B[Embed All Documents]
    B --> C[Run DBSCAN on Embedding Matrix]
    C --> D{Document Cluster Label}
    D -->|Core Point| E[High-Signal Document]
    D -->|Border Point| F[Borderline Document]
    D -->|Noise Label Minus One| G[Low-Signal Outlier]
    E --> H[Ingest Into Vector Index]
    F --> I[Manual Review Queue]
    I -->|Approved| H
    I -->|Rejected| J[Archive Only]
    G --> J
\`\`\`

*Pre-ingestion pipeline using DBSCAN noise labels as a quality gate. Core points go directly to the index. Noise points are archived. Border points route to a review queue for corpora where recall matters as much as precision.*

## What DBSCAN gives you that K-Means cannot

K-Means assigns every point to a cluster unconditionally. A document with no semantic relationship to anything else in the corpus still gets forced into the nearest centroid's cluster. That guaranteed full assignment is useful for partitioning but counterproductive for quality filtering: there is no concept of rejection.

DBSCAN rejects by design. The noise label is not a failure state. It is the output that makes the algorithm useful as a filter. The shape flexibility is a secondary benefit. What matters for RAG ingestion is the unconditional ability to say "this document does not belong" without needing to define in advance what belonging means.

The practical constraint is compute. DBSCAN on one million 768-dimensional vectors requires an approximate nearest-neighbor structure to be tractable at scale. A more realistic approach is to run DBSCAN on a representative sample of 50,000 to 100,000 documents, characterize what noise points look like in that sample, and then apply a lightweight classifier to score the full corpus on each ingestion batch. The classifier learns the boundary between cluster-member and noise-candidate from the DBSCAN labels on the sample, and scales to any corpus size without repeating the expensive density computation.
  `,

  references: [
    {
      text: 'Ester, M., Kriegel, H., Sander, J. & Xu, X. (1996) "A density-based algorithm for discovering clusters in large spatial databases with noise". KDD \'96: Proceedings of the Second International Conference on Knowledge Discovery and Data Mining, pp. 226-231.',
      url: 'https://dl.acm.org/doi/10.5555/3001460.3001507'
    },
    {
      text: 'Schubert, E., Sander, J., Ester, M., Kriegel, H. P. & Xu, X. (2017) "DBSCAN revisited, revisited: Why and how you should (still) use DBSCAN". ACM Transactions on Database Systems, 42(3), pp. 1-21.',
      url: 'https://dl.acm.org/doi/10.1145/3068335'
    },
    {
      text: 'Lewis, P. et al. (2020) "Retrieval-augmented generation for knowledge-intensive NLP tasks". Advances in Neural Information Processing Systems, 33, pp. 9459-9474.',
      url: 'https://arxiv.org/abs/2005.11401'
    },
    {
      text: 'scikit-learn developers (2024) "2.3. Clustering: DBSCAN". scikit-learn User Guide.',
      url: 'https://scikit-learn.org/stable/modules/clustering.html#dbscan'
    },
    {
      text: 'Reimers, N. & Gurevych, I. (2019) "Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks". EMNLP 2019.',
      url: 'https://arxiv.org/abs/1908.10084'
    }
  ]
};

export default post;
