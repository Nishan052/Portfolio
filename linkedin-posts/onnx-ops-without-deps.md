# onnx-ops-without-deps

Claim: A model's operator list can be extracted from an ONNX file in graph order with zero third-party packages, matching onnx.load on 100% of nodes, by walking 3 protobuf field numbers with the standard library alone.
Status: proven
Evidence: check_ops.py output matches onnx.load(...).graph.node exactly on the committed fixtures; asserted in test_npu_op_compat.py
Date: 2026-09-07

---
I wanted the list of layers in a model, in order, so I could check them against what a chip supports. It turned out I didn't need any machine learning setup installed to get it.

The usual route is to install the Open Neural Network Exchange library, which drags in about a hundred megabytes just to answer a question whose answer is a list of words.

So I read the file format instead. These model files use Protocol Buffers, a way of packing data where every field has a number, and the layer list needs only three of those numbers.

The graph is field 7 of the file, each layer is field 1 of the graph, and the type of layer is field 4. Repeated fields keep their order, so the layers come out in the right order for free.

It's sixty lines of standard library Python, and it matches the official library layer for layer on every test file. The test suite checks that, so you don't have to take my word for it.

For me the point is less the saving and more that the check now runs before you set up any toolchain, which is exactly when you want to know whether your model fits the chip.

Repo: https://github.com/Nishan052/AgentLake

#EdgeAI #MachineLearning #Python #OpenSource
