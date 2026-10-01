# jev-laya-typed-decision-models

Claim: Most model calls inside an AI agent are small decisions with a fixed answer set. Typed decision models (Jev, Laya) answer those in one pass with probabilities, which wins clearly on speed and cost but has not yet shown an accuracy edge, and does not remove prompt-injection risk.
Status: cited
Evidence: TypeSafe Jev docs (docs.typesafe.ai); Laya model card (huggingface.co/convaiinnovations/laya); Tang & Zheng, arXiv:2609.32160; Check Point Research, Sep 2026; Belcak et al., arXiv:2506.02153
Date: 2026-10-06

---
Most of what an AI agent asks its model is not writing. It is deciding.

Which tool next. Is this ticket urgent. Did that step work. Is this email phishing.

Every one of those questions goes to a model built to write. It answers one word at a time. It can name a tool that does not exist. Its answer has to be parsed. And it does not tell you how sure it is.

That is why Jev and Laya appeared in the last three weeks.

Jev came from TypeSafe AI on 15 September. Laya came from Convai three days later, with open weights. Both work the same way. You give them some text and a question, plus the list of allowed answers. They return one of those answers with a probability, in a single pass. No text at all.

So they cannot invent an option you did not give them. And the probability lets your code decide: act above 0.9, ask a human below.

The speed is real. On TypeSafe's own test, Jev matched a large model's accuracy for about 75 times less money, 25 times faster.

Two things to keep in mind. An early review of 28 studies found no accuracy edge yet, only speed and cost. And Check Point still steered Jev with prompt injection in 25 of 27 runs. The answer can only be on your list. It can still be the wrong one on your list.

So use them for decisions that have a fixed list of answers and run thousands of times a day. Keep the big model for writing. And test on your own data first.

Full breakdown: https://nishanpoojary.com/blogs/jev-laya-typed-decision-models

#AIAgents #LLMOps #MachineLearning #DecisionModels
