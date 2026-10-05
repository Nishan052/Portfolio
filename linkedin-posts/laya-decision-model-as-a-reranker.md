# laya-decision-model-as-a-reranker

Claim: Used as a reranker over BM25's top 20 on this portfolio's 563 blog chunks, on an Apple M3 CPU, the 421M-parameter Laya decision model took 2,744 ms per question and put the right chunk first for 17 of 49 questions (27 after a 280-second fine-tune), against 116 ms and 34 of 49 for the 22.7M-parameter MiniLM cross-encoder.
Status: proven
Evidence: projects/laya-vs-reranker/RESULTS.md, results/results.json, results/speed.json, results/speed_backends.json
Date: 2026-10-04

---
Every post about Laya says it decides in 33 milliseconds. As the reranker on my blog, it took 2.7 seconds per question.

A reranker takes the 20 passages search found and puts the best one first. My site's chatbot needs one.

The 33 milliseconds is real. It is one short ticket and one question, on a data centre GPU.

Reranking asks once per passage. That is 20 passes through a 421 million parameter model, here on a laptop CPU.

A small cross-encoder called MiniLM does the same job with 22.7 million parameters. PyTorch counted 37.8 times less arithmetic for it. It took 116 milliseconds and ranked better: the right passage first for 34 of 49 questions, against 17.

The laptop's GPU did not save Laya. A different model runtime ran slower still. What helped was asking about fewer passages. At the top 5 it took 605 milliseconds and got 26 right.

Laya did earn a place. Asked once whether the passages can answer the question at all, it turned away 13 of 15 off-topic questions.

So ask it once per question, not once per passage.

Full numbers: https://nishanpoojary.com/blogs/laya-decision-model-as-a-reranker

#RAG #MachineLearning #Evals #ContextEngineering
