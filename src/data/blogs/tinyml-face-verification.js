const post = {
  id:        5,
  slug:      'tinyml-face-verification',
  title:     'TinyML Face Verification on Arduino with LiteRT',
  category:  'project',
  iconKey:   'Bot',
  color:     '#10b981',
  date:      '2026-03-08',
  series:      'TinyML on microcontrollers',
  part:      1,
  readTime:  '11 min',
  tags:      ['TinyML', 'TensorFlow Lite', 'PyTorch', 'Arduino', 'LiteRT', 'Edge AI', 'Biometrics'],
  githubUrl: 'https://github.com/Nishan052',
  excerpt:   'Two of us trained a face verification model in PyTorch and shrank it with LiteRT so it runs on an Arduino, with no cloud involved.',

  content: `
## What we built

Face verification confirms that a face matches a stored identity, which normally takes a lot of compute. For my master's, the two of us ran the whole inference pipeline on an Arduino microcontroller with LiteRT, Google's rebranded TensorFlow Lite runtime for embedded devices, so it works offline and privately.

---

## Why verify on the device

Traditional pipelines send face images to a cloud server, and running on the device instead gives you:
- Zero latency from network round trips
- Privacy by architecture, since no biometric data ever leaves the device
- Offline use for access control in remote places
- < 1 mW of power, so a battery lasts for years

---

## System architecture

\`\`\`mermaid
flowchart TD
    subgraph Training on PC
        A[Face Dataset
Anchors Positives Negatives] --> B[PyTorch Siamese Network]
        B --> C[Triplet Loss Training]
        C --> D[Export ONNX]
        D --> E[Convert to TFLite LiteRT]
        E --> F[int8 Post-training Quantization]
    end
    subgraph Deployment on Arduino
        F --> G[C Header File model data.h]
        G --> H[LiteRT Interpreter C++ runtime]
        H --> I[Camera Module 96x96 frame]
        I --> J[Run Inference under 100ms]
        J --> K{Cosine Similarity above threshold?}
        K -- Match --> L[Access Granted]
        K -- No Match --> M[Access Denied]
    end
\`\`\`

---

## Model design: a Siamese network

Face verification is a metric learning problem, so instead of a classifier we used a Siamese network:

\`\`\`mermaid
flowchart LR
    A["Face A Anchor"] --> E["Shared CNN
Embedding Network"]
    B["Face B Test"] --> E
    E --> F["Embedding A
128-dim"]
    E --> G["Embedding B
128-dim"]
    F --> H["Cosine Similarity"]
    G --> H
    H --> I{"Above threshold?"}
\`\`\`

The same weights turn both images into 128-dimension embedding vectors that represent identity in a learned metric space, so verification is a simple distance check.

---

## Training with triplet loss

For open-set verification of any person, triplet loss trains the embedding space directly:

- Anchor: a reference face of person X
- Positive: another face of person X
- Negative: a face of any other person

The loss is \`max(d(A,P) - d(A,N) + margin, 0)\`, which pushes the negative a margin further away than the positive.

---

## PyTorch to LiteRT conversion

\`\`\`mermaid
flowchart LR
    A[PyTorch .pth] --> B[torch.onnx.export]
    B --> C[ONNX model]
    C --> D[tf2onnx]
    D --> E[TensorFlow SavedModel]
    E --> F[TFLite Converter]
    F --> G[LiteRT int8 quantized]
    G --> H[xxd converts to model data.h C byte array]
\`\`\`

---

## Design decisions

We were a team of two and wrote every decision down, and these are the main ones.

### PyTorch for training
PyTorch's dynamic computation graph makes triplet mining and custom losses much easier than in Keras, and the training loop stays explicit and debuggable.

### LiteRT instead of bare TFLite
LiteRT is Google's 2024 rebranding of TFLite, with better operator coverage and a cleaner C++ API for microcontrollers, so the runtime stays current.

### Cosine similarity instead of Euclidean
Cosine similarity ignores magnitude and only looks at direction, which makes it less sensitive to lighting.

---

## How to recreate it

\`\`\`bash
python train.py --epochs 50 --margin 0.3 --embedding-dim 128
python export_onnx.py --checkpoint best_model.pth
python convert_tflite.py --onnx model.onnx --calibration-dir data/calibration/
xxd -i model_int8.tflite > model_data.h
# Copy model_data.h + inference.ino to Arduino IDE and upload
\`\`\`
`,

  references: [
    { text: 'Schroff, F., Kalenichenko, D. and Philbin, J. (2015) "FaceNet: A unified embedding for face recognition and clustering", CVPR 2015.', url: 'https://arxiv.org/abs/1503.03832' },
    { text: 'Warden, P. and Situnayake, D. (2019) TinyML: Machine Learning with TensorFlow Lite on Arduino. Sebastopol: O\'Reilly Media.' },
    { text: 'Google (2024) LiteRT (TensorFlow Lite) Documentation.', url: 'https://ai.google.dev/edge/litert' },
    { text: 'Hoffer, E. and Ailon, N. (2015) "Deep Metric Learning Using Triplet Network".', url: 'https://arxiv.org/abs/1412.6622' },
  ],
};

export default post;
