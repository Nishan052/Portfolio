# jev-laya-typed-decision-models

Claim: A typed decision model answers an agent's fixed-choice decisions in one pass with probabilities, and on its vendor's own four-workflow eval Jev matched a frontier model (67.8% against 67.9%) at 0.4 seconds instead of 10.1 per case. Its gain is speed and cost, not accuracy: early independent work finds no accuracy edge over label-probability readouts, and prompt injection still broke it in 25 of 27 runs of the strongest attack tested.
Status: cited
Evidence: Tang & Zheng, arXiv:2609.32160; Check Point Research, Sep 2026; TypeSafe AI docs; Laya model card
Date: 2026-10-06

---
Most of what an AI agent asks its model is not writing. It is deciding.

Which tool next. Is this ticket urgent. Did that step work.

Each of those goes to a model built to write. It answers one word at a time. It can name a tool that does not exist. And it does not say how sure it is.

Jev and Laya are built for the deciding. You send some text, a question, and the list of allowed answers. One pass later you get one of your answers and a probability. No text at all.

So it cannot invent an option. And your code can act on the number: go above 0.9, ask a person below.

On TypeSafe's own test, Jev matched a large model at 0.4 seconds a case instead of 10.1.

Two catches. A review of 28 early studies, Tang and Zheng (arXiv:2609.32160), found no gain in accuracy yet. And Check Point steered Jev with prompt injection in 25 of 27 runs.

The answer is always on your list. It can still be the wrong one.

Full breakdown: https://nishanpoojary.com/blogs/jev-laya-typed-decision-models

#AIAgents #LLMOps #MachineLearning #AgentHarness
