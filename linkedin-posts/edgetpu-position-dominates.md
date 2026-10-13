# edgetpu-position-dominates

Claim: For Edge TPU targets, the position of the first unsupported operator, not the count of unsupported operators, determines how much of a graph runs on CPU.
Status: proven
Evidence: Single-partition rule from coral.ai Table 1; arithmetic reproduced by test_npu_op_compat.py against two committed ONNX fixtures
Date: 2026-09-06

---
I checked an object detector on a chip built for fast AI, and 93 percent of its work still ran on the slow processor because of one step.

The fast chip here is Google's Edge tensor processing unit, and it only knows certain kinds of step. At the first one it doesn't know, it stops and hands the rest to the slow processor.

It splits the model once and never picks the work back up, so the position of that first unknown step decides nearly everything and the count barely matters.

The detector is from the YOLO family, short for You Only Look Once, which are popular models that find objects in images. It used the same activation, the function applied after a layer, seven times, and the chip supports a close relative of it but not this one.

The first copy sat second in a list of fifteen, so fourteen steps went to the slow processor behind it. That turns the usual fix around, because counting tells you seven things need replacing when only the first one carries any weight.

Change that one step and almost the whole network runs on the fast chip. So I built a tool that reports where the cut lands, instead of how many steps failed.

Repo: https://github.com/Nishan052/AgentLake

#EdgeAI #OnDeviceAI #MachineLearning #Hardware
