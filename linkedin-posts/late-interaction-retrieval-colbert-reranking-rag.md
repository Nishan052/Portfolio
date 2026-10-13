# LinkedIn Post: Late interaction and reranking: where single-vector RAG falls short

Status: explainer
Source: src/data/blogs/late-interaction-retrieval-colbert-reranking-rag.js
Date drafted: 2026-07-11, rewritten in Nishan's voice 2026-10-13

---

A retrieval augmented generation (RAG) system can find a chunk that looks related to the question and still miss the answer, and I ran into this with my own chatbot.

Part of the reason is how most vector search works. Standard dense retrieval squeezes a whole passage into one embedding, so a 200-word chunk that covers several facts gets averaged into a single point, and the one fact a question needs gets buried.

Late interaction fixes this by comparing word by word instead. ColBERT encodes every word of the question and the document separately and scores them with MaxSim, so the exact phrase a question needs can stand out.

You don't have to rebuild your whole index to get most of this, though. A two-stage setup, with fast vector search first and a reranker on the top candidates, gets most of the same gain far more cheaply, and ColPali takes the idea further by working on page images.

For me the lesson is simple: when a RAG system answers confidently and gets it wrong, check retrieval before you touch the prompt.

Full breakdown here: https://nishanpoojary.com/blogs/late-interaction-retrieval-colbert-reranking-rag

#RAG #Retrieval #ColBERT #Reranking #VectorSearch
