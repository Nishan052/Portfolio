# LinkedIn Post — Late interaction and reranking: where single-vector RAG falls short

Source: src/data/blogs/late-interaction-retrieval-colbert-reranking-rag.js
Date drafted: 2026-07-11

---

A RAG system can retrieve a chunk that looks related to the query and still miss the answer. That is not a model problem. It is a retrieval problem, and it comes from how most vector search works.

Standard dense retrieval collapses a whole passage into one embedding. A 200-word chunk covers several distinct facts, and averaging them into a single point buries the one fact a specific query needs. Two passages can sit close together in embedding space while only one actually contains the answer.

Late interaction fixes this by comparing at the token level instead. ColBERT encodes every query token and every document token separately, then scores relevance with MaxSim: each query token finds its best match anywhere in the document before the scores get summed. The exact phrase a query needs can now stand out, instead of getting diluted by the rest of the passage.

Most teams do not need to rebuild their whole index to benefit from this. A two-stage pipeline, fast vector recall followed by a reranker on the top candidates, captures most of the same gain far more cheaply. ColPali pushes the same idea further, applying late interaction directly to document page images so tables and layout do not have to survive a text parser first.

If your RAG system retrieves confidently but answers wrong, check recall before you touch the prompt.

Full breakdown here: https://nishanpoojary.com/blogs/late-interaction-retrieval-colbert-reranking-rag

#RAG #Retrieval #ColBERT #Reranking #VectorSearch
