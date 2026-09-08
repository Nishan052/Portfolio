# edge-pipeline-map

Claim: none. This is an explainer: it teaches the shape of the deployment pipeline rather than asserting a new result.
Status: explainer
Source: coral.ai Edge TPU documentation; ONNX intermediate representation specification; TensorFlow Lite post-training quantisation guide
Date: 2026-09-08

---

Getting a working model onto a device takes five steps, and four of them can change the model without reporting anything.

Training is documented exhaustively. Running inference on a device is documented well. The part in between gets a paragraph, and it is where the weeks go.

Export rewrites your graph. The exporter fuses operations, folds constants and renames things, so the network a later tool complains about may not appear anywhere in your source code.

Conversion shrinks the weights to integers, and how much accuracy survives depends on the sample data you hand it. This is the step most often run with a default setting and no measurement afterwards.

Compilation splits the network at the first operation the chip cannot handle, and hands everything after that point back to the ordinary processor. No error. No warning. An order of magnitude of performance, gone quietly.

Running it surfaces the rest: thermal limits, a shared memory bus, and a cost for moving data no desktop simulator charges you.

None of these steps are hard. Each is simply allowed to alter your model silently, so by the time accuracy is down four points the cause is three steps back and nothing logged it.

I wrote up the whole path, with what each step is permitted to do to you. Part one of a series that takes the quietest steps apart.

Full breakdown: https://nishanpoojary.com/blogs/edge-pipeline-map

#EdgeAI #OnDeviceAI #Deployment #MachineLearning
