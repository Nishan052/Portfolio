# edge-pipeline-map

Claim: none. This is an explainer: it teaches the shape of the deployment pipeline rather than asserting a new result.
Status: explainer
Source: coral.ai Edge TPU documentation; ONNX intermediate representation specification; TensorFlow Lite post-training quantization guide
Date: 2026-09-08

---

Between training a model on a big computer and running it on a camera there are five steps, and four of them can quietly change it.

First it's exported into a form other tools can open, and parts get merged and renamed on the way. So the part a later tool complains about may not be in your code.

Then it's converted, because your model holds numbers as decimals and small chips want whole numbers, so every one gets rounded. How much accuracy survives depends on the sample data you give it, and most people take the default and never check.

Then it's compiled for one specific chip, which can't do every kind of sum. At the first one it can't, it stops and hands the rest back to the slow general processor without any error or warning.

Then you run it, and the device gets hot and slows down, and moving data costs time your laptop never charged for.

None of these steps is hard, but each can change your model in silence, so when the accuracy drops the cause is three steps back and nothing wrote it down.

I'm working through this right now for a man overboard prototype on a Raspberry Pi 5, so I wrote up each step and what it can do.

Full breakdown: https://nishanpoojary.com/blogs/edge-pipeline-map

#EdgeAI #OnDeviceAI #Deployment #MachineLearning
