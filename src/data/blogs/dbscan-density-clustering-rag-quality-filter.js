const post = {
  id:       14,
  slug:     'dbscan-density-clustering-rag-quality-filter',
  title:    'DBSCAN: density-based clustering as a RAG quality filter',
  category: 'research',
  iconKey:  'ScanSearch',
  color:    '#a855f7',
  date:     '2026-05-18',
  series:     'Production RAG',
  part:     9,
  readTime: '12 min',
  tags:     ['Clustering', 'DBSCAN', 'RAG', 'VectorSearch', 'DataQuality', 'MachineLearning'],
  excerpt:  'DBSCAN finds clusters of any shape without a fixed K, and its noise points make a clean quality filter before documents go into a RAG index.',

  content: `
## RAG ingestion lets low-signal documents into the index

Every RAG system ends up with the same problem sooner or later, which is that documents pile up in the knowledge base faster than anyone reviews them. Legacy content from retired systems, auto-generated summaries of summaries and lightly edited duplicates all get indexed next to high quality source documents. Then at retrieval time these low-signal documents compete with the accurate ones for the top-k slots, so the context that reaches the language model is already diluted.

Most teams treat this as a retrieval problem, so they tune similarity thresholds or raise top-k to make up for it. For me both of these make the underlying issue worse, because they let even more noise into the prompt context. The fix belongs earlier, as a quality filter during ingestion that stops low-signal documents before they enter the index.

DBSCAN is a clean way to do this. Unlike K-Means, it identifies points that don't belong to any cluster and labels them as noise, and in a document embedding space those noise points are documents that share no dense neighborhood with any other document. They're outliers, isolated fragments and structural artifacts that add very little meaning, so removing them before indexing makes the index smaller and retrieval more precise without any labeled training data.

## How DBSCAN defines a cluster

DBSCAN builds clusters by following density, and two parameters control what dense means. The first is epsilon, the neighborhood radius, and the second is min_samples, the minimum number of points that have to fall within epsilon of a point for that point to anchor a cluster.

The algorithm puts every point into one of three types:

- Core point: has at least min_samples neighbors within epsilon distance, including itself. Core points are the dense anchors from which clusters grow.
- Border point: falls within epsilon of a core point but does not have enough neighbors to be a core point itself. Border points extend the boundary of a cluster without anchoring it.
- Noise point: falls within epsilon of no core point. Noise points do not belong to any cluster and receive the label -1.

Once every point is classified, clusters form by connecting the core points that fall within epsilon of each other. Border points then join the cluster of their nearest core point, and noise points stay unassigned.

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

Because clusters grow by following local density instead of distance to a centroid, DBSCAN can find clusters of any shape, so a crescent, a ring or an irregular blob is no problem at all. K-Means would split all three into spherical fragments, since it assigns points by how close they are to a centroid and ignores the local structure.

## Choosing epsilon and min_samples for embedding corpora

The two parameters interact with each other, and the right values depend on the dimensionality and density of your embedding space.

For epsilon, the standard approach is a k-nearest-neighbor distance plot. It works like this: you compute the distance from each point to its k-th nearest neighbor, sort those distances in ascending order and plot them. The epsilon value sits at the elbow of the curve, where the distances start rising sharply. For 768-dimensional text embeddings from models like \`bge-base-en-v1.5\`, typical epsilon values fall between 0.15 and 0.35 in cosine distance space after L2 normalization.

For min_samples, somewhere between 5 and 20 is a useful starting point, and higher values give you more conservative clusters that reject more noise. For RAG quality filtering I'd lean toward a higher min_samples, because for me it's better to leave out a borderline document than to let a low-signal one into the index.

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

The noise label is what makes DBSCAN useful for RAG ingestion. In a well-curated corpus the noise ratio should be low, because coherent content naturally forms dense neighborhoods and most documents cluster with related ones. The documents that do get the noise label tend to look the same across very different corpora.

These are the categories that show up most often as DBSCAN noise:

- Auto-generated boilerplate with near-zero semantic content, such as cookie consent text, navigation fragments, and headers extracted without body content
- Thin duplicate fragments that differ from their source by only a few tokens but are not identical enough for exact deduplication to catch
- Content from unrelated domains that entered the corpus through an overly broad crawl or ingestion scope
- Error pages, redirect artifacts, and empty section placeholders that were indexed before any validation ran

None of these help retrieval, so excluding them from the index shrinks the candidate space for every query, cuts storage cost and removes a whole class of retrieval errors where the model cites boilerplate content as evidence.

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

K-Means assigns every point to a cluster, no matter what, so a document with no relationship in meaning to anything else in the corpus still gets forced into the cluster of its nearest centroid. That full assignment is useful for partitioning, but it works against you for quality filtering, since the algorithm has no way to reject anything.

DBSCAN rejects by design, and for me that noise label is the output that makes it useful as a filter, with the shape flexibility as a secondary benefit. What matters for RAG ingestion is that it can say "this document does not belong" without you having to define in advance what belonging means.

The practical limit is compute, because DBSCAN on one million 768-dimensional vectors needs an approximate nearest-neighbor structure to stay tractable at scale. A more realistic approach is to run DBSCAN on a representative sample of 50,000 to 100,000 documents and look at what the noise points in that sample have in common. Then you train a lightweight classifier on those labels and use it to score the full corpus on each ingestion batch. The classifier learns the boundary between cluster members and noise candidates from the DBSCAN labels on the sample, so it scales to any corpus size without repeating the expensive density computation.
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
