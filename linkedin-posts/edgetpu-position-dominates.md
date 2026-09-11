# edgetpu-position-dominates

Claim: For Edge TPU targets, the position of the first unsupported operator, not the count of unsupported operators, determines how much of a graph runs on CPU.
Status: proven
Evidence: Single-partition rule from coral.ai Table 1; arithmetic reproduced by test_npu_op_compat.py against two committed ONNX fixtures
Date: 2026-09-06

---
A network I checked this week does 93 percent of its work on the wrong chip.

Not because 93 percent of its steps are unsupported. Because one is.

The device has a chip built to run models fast, Google's Edge tensor processing unit. It only knows certain kinds of step. At the first step it does not know, it stops and hands the rest to the ordinary processor.

It splits the model once. It cannot pick the work back up later.

So the position of that first unknown step decides nearly everything. The count of them barely matters.

This network used the same activation step seven times. The chip supports a close relative of it, but not this one. The first copy sat second in a list of fifteen. Fourteen steps went to the slow processor behind it.

That flips the usual fix. Counting tells you seven things need replacing. Only the first one carries any weight. Change that one step and almost the whole network runs on the fast chip.

I built a tool that reports where the cut lands, instead of how many steps failed.

Repo: https://github.com/Nishan052/AgentLake

#EdgeAI #OnDeviceAI #MachineLearning #Hardware
