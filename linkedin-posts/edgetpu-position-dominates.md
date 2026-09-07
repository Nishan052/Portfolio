# edgetpu-position-dominates

Claim: For Edge TPU targets, the position of the first unsupported operator, not the count of unsupported operators, determines how much of a graph runs on CPU.
Status: proven
Evidence: Single-partition rule from coral.ai Table 1; arithmetic reproduced by test_npu_op_compat.py against two committed ONNX fixtures
Date: 2026-09-06

---

A detection network I checked this week runs 93 percent of its work on the wrong chip.

Not because 93 percent of its steps are unsupported. Because one is. It sits second in a list of fifteen, and everything behind it is stuck on the ordinary processor instead of the accelerator meant to speed it up.

Google's Edge tensor processing unit (TPU) has a compiler that splits your model in exactly one place. At the first step it cannot handle, it cuts. Everything before the cut runs on the fast chip. Everything after it goes to the main processor. It cannot cut twice.

So where that first bad step sits decides almost everything, and how many bad steps you have barely matters. This network had seven copies of the same activation function, a LeakyReLU. The chip supports a close relative called PReLU but not this one, and the first copy sat second in a list of fifteen steps. Fourteen steps went to the main processor behind it, including every convolution.

That flips the usual debugging move. Counting unsupported steps tells you seven things need replacing. The useful answer is that only the first one is load bearing. Change that single activation function and almost the whole network runs on the accelerator.

I built a tool that reports where the cut lands instead of how many steps failed.

Repo: https://github.com/Nishan052/edge-agents

#EdgeAI #OnDeviceAI #MachineLearning #Hardware
