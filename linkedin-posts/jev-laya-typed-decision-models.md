# jev-laya-typed-decision-models

Claim: A typed decision model answers an agent's fixed-choice decisions in one pass with probabilities, and on its vendor's own four-workflow eval Jev matched a frontier model (67.8% against 67.9%) at 0.4 seconds instead of 10.1 per case. Its gain is speed and cost, not accuracy: early independent work finds no accuracy edge over label-probability readouts, and prompt injection still broke it in 25 of 27 runs of the strongest attack tested.
Status: cited
Evidence: Tang & Zheng, arXiv:2609.32160; Check Point Research, Sep 2026; TypeSafe AI docs; Laya model card
Date: 2026-10-06

---
Most questions an AI agent asks its model have a short list of answers, like which tool runs next, whether a ticket is urgent, or whether the last step worked.

Each of those still goes to a model built to write, so it answers one word at a time. It can name a tool that doesn't exist, and it doesn't tell you how sure it is.

Decision models like Jev and Laya are built for the deciding part. You send some text, a question and the list of allowed answers, and one pass later you get one of your answers back with a probability.

So it can't invent an option, and your code can act on the number, going ahead above 0.9 and asking a person below it.

On TypeSafe's own test, Jev matched a large model at 0.4 seconds a case instead of 10.1. Those are the vendor's numbers, though, and there are two catches.

A review of 28 early studies by Tang and Zheng (arXiv:2609.32160) found no gain in accuracy yet, and Check Point steered Jev with prompt injection in 25 of 27 runs. So the answer is always on your list, and it can still be the wrong one.

That fits what I saw when I tested Laya on my own blog, where it only did well as one yes or no check per question.

Full breakdown: https://nishanpoojary.com/blogs/jev-laya-typed-decision-models

#AIAgents #LLMOps #MachineLearning #AgentHarness
