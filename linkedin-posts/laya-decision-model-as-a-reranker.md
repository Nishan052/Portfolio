# laya-decision-model-as-a-reranker

Claim: Used as a reranker over BM25's top 20 on this portfolio's 563 blog chunks, on an Apple M3 CPU, the 421M-parameter Laya decision model took 2,744 ms per question and put the right chunk first for 17 of 49 questions (27 after a 280-second fine-tune), against 116 ms and 34 of 49 for the 22.7M-parameter MiniLM cross-encoder.
Status: proven
Evidence: projects/laya-vs-reranker/RESULTS.md, results/results.json, results/speed.json, results/speed_backends.json
Date: 2026-10-13

---
I tried Laya as the reranker for my blog's chatbot, because every post says it decides in 33 milliseconds, and it took 2.7 seconds.

The chatbot on my site works like this: search finds 20 passages for a question, and a reranker decides which one the language model reads first, so the reranker runs once for every passage.

The 33 milliseconds is real, but it's for one short support ticket and one question on a data center GPU, which is a very different job from reading 20 full passages on a laptop.

So I compared it with MiniLM, a small model trained to do exactly this job. It took 116 milliseconds and put the right passage first for 34 of my 49 test questions, while Laya got 17.

When I looked into why, the answer was simple: Laya has 421 million parameters and MiniLM has 22.7 million, so PyTorch counted 37.8 times more arithmetic for the same 20 passages.

I tried the laptop's GPU and a different runtime as well, and neither really helped. What actually helped was giving Laya fewer passages, and at the top 5 it took 605 milliseconds and got 26 right.

For me the lesson is that Laya works when you ask it once per question, like checking whether the passages can answer it at all, where it turned away 13 of 15 off-topic questions.

Full numbers on my blog: https://nishanpoojary.com/blogs/laya-decision-model-as-a-reranker

#RAG #MachineLearning #Evals #ContextEngineering
