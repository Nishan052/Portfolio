# onnx-ops-without-deps

Claim: A model's operator list can be extracted from an ONNX file in graph order with zero third-party packages, matching onnx.load on 100% of nodes, by walking 3 protobuf field numbers with the standard library alone.
Status: proven
Evidence: check_ops.py output matches onnx.load(...).graph.node exactly on the committed fixtures; asserted in test_npu_op_compat.py
Date: 2026-09-07

---
You do not need a machine learning setup installed to read what is inside a model file.

I wanted the list of layers in a model, in order, so I could check them against what a chip supports.

The usual route is to install the Open Neural Network Exchange library. That drags in about a hundred megabytes, to answer a question whose answer is a list of words.

So I read the file format instead. These model files use Protocol Buffers, a way of packing data where every field has a number.

Getting the layer list needs three of those numbers. The graph is field 7 of the file. Each layer is field 1 of the graph. The type of layer is field 4. Repeated fields keep their order, so the layers come out in the right order for free.

Sixty lines of standard library. It matches the official library layer for layer on every test file. The test suite checks that, rather than my word for it.

The saving is not the point. The point is that the check now runs before you set up any toolchain. That is exactly when you want to know whether your model fits the chip.

Repo: https://github.com/Nishan052/AgentLake

#EdgeAI #MachineLearning #Python #OpenSource
