const post = {
  id:        5,
  slug:      'tinyml-face-verification',
  title:     'TinyML Face Verification on Arduino with LiteRT',
  category:  'project',
  iconKey:   'Bot',
  color:     '#10b981',
  date:      '2026-03-08',
  readTime:  '11 min',
  tags:      ['TinyML', 'TensorFlow Lite', 'PyTorch', 'Arduino', 'LiteRT', 'Edge AI', 'Biometrics'],
  githubUrl: 'https://github.com/Nishan052',
  excerpt:   'On-device face verification running on an Arduino microcontroller — trained in PyTorch, converted to LiteRT (TFLite), and deployed as C firmware with no cloud dependency.',

  content: `
## Overview

Face verification — confirming that a face matches a stored identity — is computationally expensive by conventional standards. This project pushes the entire inference pipeline onto an **Arduino microcontroller** using **LiteRT** (Google's rebranded TensorFlow Lite runtime for embedded devices), enabling privacy-preserving, offline biometric authentication.

---

## Why On-Device Verification?

Traditional face verification pipelines send images to a cloud server. On-device deployment means:
- **Zero latency from network round-trips**
- **No biometric data ever leaves the device** — privacy by architecture
- **Works offline** — critical for access control in remote environments
- **< 1 mW power** — battery-operated for years

---

## System Architecture

\`\`\`mermaid
flowchart TD
    subgraph Training on PC
        A[Face Dataset\nAnchors Positives Negatives] --> B[PyTorch Siamese Network]
        B --> C[Triplet Loss Training]
        C --> D[Export ONNX]
        D --> E[Convert to TFLite LiteRT]
        E --> F[int8 Post-training Quantisation]
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

## Model Design: Siamese Network

Face verification is a **metric learning** problem, not a classification problem. A Siamese network is ideal:

\`\`\`mermaid
flowchart LR
    A["Face A Anchor"] --> E["Shared CNN\nEmbedding Network"]
    B["Face B Test"] --> E
    E --> F["Embedding A\n128-dim"]
    E --> G["Embedding B\n128-dim"]
    F --> H["Cosine Similarity"]
    G --> H
    H --> I{"Above threshold?"}
\`\`\`

The same weights process both images. The output is a fixed-size **embedding vector** (128 dimensions) representing facial identity in a learned metric space. Verification is a simple distance check.

---

## Training Strategy: Triplet Loss

For open-set verification (any person), **triplet loss** trains the embedding space directly:

- **Anchor**: A reference face of person X
- **Positive**: Another face of person X
- **Negative**: A face of any other person

Loss: \`max(d(A,P) - d(A,N) + margin, 0)\`

---

## PyTorch to LiteRT Conversion

\`\`\`mermaid
flowchart LR
    A[PyTorch .pth] --> B[torch.onnx.export]
    B --> C[ONNX model]
    C --> D[tf2onnx]
    D --> E[TensorFlow SavedModel]
    E --> F[TFLite Converter]
    F --> G[LiteRT int8 quantised]
    G --> H[xxd converts to model data.h C byte array]
\`\`\`

---

## Design Decisions

### Why PyTorch for Training?
PyTorch's dynamic computation graph makes triplet mining and custom loss functions far easier to implement than Keras. The training loop is fully explicit and debuggable.

### Why LiteRT (not bare TFLite)?
LiteRT is Google's 2024 rebranding of TFLite, with improved operator coverage and a cleaner C++ API for microcontrollers. Using LiteRT future-proofs the deployment runtime.

### Why Cosine Similarity (not Euclidean)?
Cosine similarity is invariant to embedding magnitude — only direction matters. This makes it more robust to lighting variation.

---

## How to Recreate

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
