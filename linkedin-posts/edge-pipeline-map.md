# edge-pipeline-map

Claim: none. This is an explainer: it teaches the shape of the deployment pipeline rather than asserting a new result.
Status: explainer
Source: coral.ai Edge TPU documentation; ONNX intermediate representation specification; TensorFlow Lite post-training quantisation guide
Date: 2026-09-08

---

You train an AI model on a big computer. Then you put it on a camera. Five steps sit in between, and four can change it on the way.

The middle ones are the ones nobody writes about.

First it is exported: written out in a form other tools can open. On the way, parts get merged and renamed. So the part a later tool complains about may not be in your code.

Then it is converted. Your model holds numbers as decimals. Small chips want whole numbers, so every one gets rounded. How much accuracy survives depends on the sample data you give it. Most people take the default and never check.

Then it is compiled for one specific chip. That chip cannot do every kind of sum. At the first one it cannot, it stops and hands the rest back to the slow general processor. No error. No warning.

Then you run it. The device gets hot and slows down. Moving data costs time your laptop never charged for.

None of this is hard. Each step can change your model in silence. By the time you see the accuracy drop, the cause is three steps back and nothing wrote it down.

I wrote up the whole path, and what each step can do to your model.

Full breakdown: https://nishanpoojary.com/blogs/edge-pipeline-map

#EdgeAI #OnDeviceAI #Deployment #MachineLearning
