const post = {
  id: 15,
  slug: 'transformer-embeddings-tokens-vectors-rag-mismatch',
  title: 'Why Embedding Model Mismatch Silently Breaks RAG Systems',
  category: 'research',
  iconKey: 'Brain',
  color: '#a855f7',
  date: '2026-05-25',
  series: 'Production RAG',
  part: 10,
  readTime: '12 min',
  tags: ['Embeddings', 'RAG', 'VectorSearch', 'Transformers', 'Production', 'LLMs'],
  excerpt: 'If documents and queries are embedded with different models, RAG still returns 200 OK and wrong answers, since each model has its own vector space.',

  content: `
## The Silent Failure

Let's say your RAG system went live three weeks ago and the infrastructure looks perfect, with no errors, normal latencies and steady throughput. Then users report that the answers are disconnected from their questions, and support tickets pile up while the logs stay green.

What happened is embedding model mismatch, where your ingestion pipeline embedded the documents with one model and the query handler later switched to a different one. The system keeps running because both models work fine on their own, so the queries complete and cosine similarity still computes. The documents and queries now live in incompatible semantic spaces, though, so the retrieved chunks have nothing to do with the user's question.

To understand why, you need three things, which are what tokenization does, how transformers create vectors and why different models create different spaces. Which embedding model to use was one of the things I had to research for my portfolio chatbot, so this is how I'd explain it.

## From Text to Numbers

Machine learning can't work on raw text, so it has to become numbers first, and embedding models turn text into dense arrays called vectors, where similar text produces vectors close together in high-dimensional space.

Let's say you ask a search engine "How do I reset my password?" and a document says "Forgotten password reset steps". Both produce vectors with high cosine similarity, which is the dot product of normalized vectors and gives a score between -1 and 1, and scores above 0.7 signal semantic similarity.

This works because modern embedding models are trained with contrastive learning on millions of sentence pairs, where similar pairs get pulled together in vector space and dissimilar ones pushed apart, so the model encodes meaning as closeness.

Each model creates its own space, though, so Model A, trained on one corpus with one approach, gives similarity one meaning, and Model B, trained differently, gives the same numbers another. If you swap models, you swap the whole meaning of similarity.

## Tokenization: Breaking Text Into Pieces

The first step is tokenization, since transformers don't read raw characters. The word "dog" is a single token, "authentication" might split into auth plus ##mation, and a 100-word document becomes roughly 130 tokens, depending on vocabulary and language.

Tokenization matters because it decides what the model sees, and different tokenizers split text differently, some with the ##mation subword syntax and others with byte-pair encoding. The vocabulary size matters too, since a 30,000-token vocabulary handles common words efficiently and struggles with rare ones, while a 50,000-token vocabulary captures more nuance and needs more computation.

## Building Vectors Step by Step

After tokenization, a transformer follows a pipeline of five steps.

Step one is the token embedding lookup, where each token maps to a learned vector, so token 42 always maps to the same 384-dimensional vector and token 1500 maps to a different one. These vectors are learned during training and stored in a lookup table, and different models have different tables.

Step two is positional encoding, since transformers have no built-in sequence order, so position information is added to each token embedding to capture both absolute position and relative distance.

Step three is the transformer layers of self-attention, where each token attends to every other token and the attention learns which ones are relevant. BERT uses 12 layers and RoBERTa uses 24, and each layer refines the vector to capture deeper meaning.

Step four is the representation, where each token has been contextualized by the full document.

Step five is pooling, because the transformer produces one vector per token and you need one per document. Mean pooling averages the token vectors into a single vector, and that vector is your embedding, a coordinate in the learned semantic space.

So different models pool differently, use different layer counts and train on different data, which means the same document ends up with different vectors.

\`\`\`mermaid
flowchart TD
    A["Raw Text: dog is loyal"] --> B["Tokenize: dog is loyal"]
    B --> C["Token Embeddings: 384-dim each"]
    C --> D["Add Positional Info: position 1 2 3"]
    D --> E["Attention Layer 1: each token attends all"]
    E --> F["Attention Layer 2-12: repeat"]
    F --> G["Pooling: average all tokens"]
    G --> H["Final Embedding: one 384-dim vector"]
\`\`\`

The pipeline above shows what happens inside a transformer, as raw text becomes tokens, tokens become vectors, attention puts those vectors in context, and one pooled vector represents the document.

## Why Different Models Create Different Spaces

This is where the mismatch lives, because two differently trained models give different outputs for the same text.

Let's say Model A was trained on contrasting similar and dissimilar sentence pairs and learned that "password reset" and "forgotten password" are highly similar, so it pulls their vectors close. Model B was trained on a different corpus and might not have seen that pair, so those two sentences end up further apart.

The dimension count alone breaks compatibility, since Model A uses 384 dimensions and Model B uses 1536, so the same text lands in very different vector spaces. It goes deeper than that, because the value in dimension 47 of Model A means something completely different from dimension 47 of Model B, as learned attention projections produce different features in each model.

These differences are also silent, since both models work fine on their own, cosine similarity still computes and the system returns results. So the infrastructure metrics look normal while users just get wrong answers.

\`\`\`mermaid
flowchart LR
    A["Ingestion Phase"] --> B["Use Model A: 384-dim"]
    B --> C["Embed docs: Space A"]
    C --> D["Store in vector DB"]
    
    E["Query Phase"] --> F["Use Model B: 1536-dim"]
    F --> G["Embed query: Space B"]
    G --> H["Search vector DB"]
    H --> I["Results are wrong"]
\`\`\`

The flowchart above shows the mismatch, with documents in space A and queries in space B, so their cosine similarity scores mean nothing.

## Detection and Prevention

To detect a mismatch you have to measure drift. At ingestion time, embed a test set with Model A and compute the mean cosine similarity between pairs you know are similar. Then at query time, embed the same test set with Model B, and if the distribution shifts, you have a mismatch. As a concrete threshold, if the baseline mean is 0.65 and Model B produces 0.32, I'd raise an alert.

Preventing it comes down to three checkpoints:

1. Lock the embedding model version in your deployment manifest.
2. Enforce the same model at query time, with tests that fail if the versions don't match.
3. If you change models in production, plan a complete re-embedding, because that is a database migration.

\`\`\`mermaid
flowchart TD
    A["Change embedding model?"] --> B["Yes: Plan re-embedding"]
    B --> C["Embed all docs with new model"]
    C --> D["Replace vectors in index"]
    D --> E["Verify similarity distribution"]
    E --> F["Deploy"]
    
    A --> G["No: Keep current model"]
    G --> H["Version in config file"]
    H --> I["Test version match query time"]
\`\`\`

The decision tree above shows the choice, and for me the point is that changing the embedding model is a database migration, so I'd plan it like one.

The cost of a mismatch is high, because you ship broken retrieval wrapped in a 200 OK response and the LLM can't fix garbage going in. The fix itself is simple, so I'd version the embeddings, test for a mismatch and plan model changes like database migrations.

## References

- Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems, 30. https://arxiv.org/abs/1706.03762

- Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). Efficient estimation of word representations in vector space. arXiv preprint arXiv:1301.3781. https://arxiv.org/abs/1301.3781

- Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence embeddings using Siamese BERT-Networks. Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing, 3973-3983. https://arxiv.org/abs/1908.10084

- Pinecone (2024). Understanding Vector Embeddings. https://www.pinecone.io/learn/vector-embeddings/

- LlamaIndex (2024). Embeddings Documentation. https://docs.llamaindex.ai/en/stable/concepts/embedding_models/

- Hugging Face (2024). Sentence Transformers: Semantic Textual Similarity. https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html
  `,

  references: [
    {
      text: "Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention is all you need. Advances in Neural Information Processing Systems.",
      url: "https://arxiv.org/abs/1706.03762"
    },
    {
      text: "Mikolov, T., Chen, K., Corrado, G., & Dean, J. (2013). Efficient estimation of word representations in vector space. arXiv preprint arXiv:1301.3781.",
      url: "https://arxiv.org/abs/1301.3781"
    },
    {
      text: "Reimers, N., & Gurevych, I. (2019). Sentence-BERT: Sentence embeddings using Siamese BERT-Networks. Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing.",
      url: "https://arxiv.org/abs/1908.10084"
    },
    {
      text: "Pinecone (2024). Understanding Vector Embeddings. Vector databases and semantic search fundamentals.",
      url: "https://www.pinecone.io/learn/vector-embeddings/"
    },
    {
      text: "LlamaIndex (2024). Embeddings Documentation. Embedding models and vector representation strategies.",
      url: "https://docs.llamaindex.ai/en/stable/concepts/embedding_models/"
    },
    {
      text: "Hugging Face (2024). Sentence Transformers: Semantic Textual Similarity. State-of-the-art embedding models.",
      url: "https://www.sbert.net/docs/sentence_transformer/usage/semantic_textual_similarity.html"
    }
  ]
};

export default post;
