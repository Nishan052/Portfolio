# onnx-ops-without-deps

Claim: A model's operator list can be extracted from an ONNX file in graph order with zero third-party packages, matching onnx.load on 100% of nodes, by walking 3 protobuf field numbers with the standard library alone.
Status: proven
Evidence: check_ops.py output matches onnx.load(...).graph.node exactly on the committed fixtures; asserted in test_npu_op_compat.py
Date: 2026-09-07

---

You do not need a machine learning stack installed to read what is inside a model file.

I wanted a list of the layers in a model, in order, so I could check them against what an accelerator chip supports. The obvious route is to install the Open Neural Network Exchange library. That pulls in Protocol Buffers and about a hundred megabytes of dependencies, to answer a question whose answer is a list of strings.

So I read the format instead. Model files in this exchange format are Protocol Buffers, and getting the layer list needs exactly three field numbers. The graph is field 7 of the model. Each node is field 1 of the graph. The layer type is field 4 of the node. Repeated fields keep their order on the wire, so the layers come out in graph order for free.

Sixty lines of standard library. It matches the official library node for node on every test file, and that match is asserted in the test suite rather than claimed.

The point is not the saving. It is that the check now runs before you have set up a conversion toolchain, which is exactly when you want to know whether your model will map to the chip at all.

Repo: https://github.com/Nishan052/edge-agents

#EdgeAI #MachineLearning #Python #OpenSource
