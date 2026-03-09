const post = {
  id:        6,
  slug:      'barcode-scanner-tinyml',
  title:     'TinyML Barcode Detection: From Keras to Microcontroller',
  category:  'project',
  emoji:     '🔍',
  color:     '#f59e0b',
  date:      '2026-03-08',
  readTime:  '12 min',
  tags:      ['TinyML', 'TensorFlow Lite', 'Python', 'OpenCV', 'Quantisation', 'Edge AI'],
  githubUrl: 'https://github.com/Nishan052/barcodeScanner',
  excerpt:   'A deep learning pipeline that trains a barcode presence-detection and localisation model in Keras, then compresses it to run on microcontrollers via TFLite int8 quantisation.',

  content: `
## Overview

**TinyML** is the practice of deploying machine learning models on microcontrollers — devices with kilobytes of RAM, no operating system, and sub-milliwatt power budgets. This project tackles **barcode detection**: determining whether a barcode is present in a camera frame and predicting its bounding box — all within MCU constraints.

---

## What Problem Does It Solve?

Industrial barcode scanning traditionally relies on dedicated hardware or powerful processors. Embedding this directly on a $2 microcontroller enables:
- **Battery-powered, offline scanning** — no cloud dependency
- **Sub-millisecond latency** — inference at the sensor edge
- **Privacy by design** — images never leave the device

---

## Full Pipeline

\`\`\`mermaid
flowchart TD
    A[Raw Image Dataset\nClass 0: barcode\nClass 1: background] --> B[preprocessing\nResize · Normalise · Augment]
    B --> C[trainModel.py\nKeras CNN\nPresence + BBox head]
    C --> D[.keras model\nFull precision]
    D --> E[TFLite Converter\nfloat32 → int8 quantisation]
    E --> F[.tflite model\n10x smaller]
    F --> G[mcuSimulator.py\nSimulates MCU inference]
    G --> H[Cropped Detection Output\nBounding box visualisation]
\`\`\`

---

## Model Architecture

The model has **two output heads** — a multi-task design that trains both tasks simultaneously:

\`\`\`mermaid
flowchart LR
    A["Input Image\n96x96 greyscale"] --> B["Conv Block 1\n32 filters 3x3"]
    B --> C["MaxPool"]
    C --> D["Conv Block 2\n64 filters 3x3"]
    D --> E["MaxPool"]
    E --> F["Flatten + Dense 128"]
    F --> G["Presence Head\nSigmoid 0 or 1"]
    F --> H["BBox Head\n4 coords x y w h"]
\`\`\`

**Design choice — shared backbone**: Both tasks share the same convolutional feature extractor. This is cheaper than two separate models and the tasks are positively correlated.

---

## Key Design Decisions

### 1. Int8 Quantisation over Float32
Full-precision (float32) models require 4 bytes per weight. Int8 quantisation:
- **4× memory reduction** — critical for MCUs with 256 KB RAM
- **2–4× inference speed-up** on integer ALUs
- Accuracy loss typically < 1% for detection tasks

### 2. Masked Bounding Box Loss
When a barcode is absent, the bounding box output is meaningless. A **custom masked loss function** zeros out the bounding box loss contribution when the ground truth label is "no barcode".

### 3. MCU Simulator Before Hardware
\`mcuSimulator.py\` runs the quantised \`.tflite\` model using the TFLite interpreter on a PC — simulating exactly what the MCU runtime will execute. This lets you catch accuracy regressions *before* flashing firmware.

---

## Deployment Flow

\`\`\`mermaid
flowchart LR
    A[PC Training\npipelineRunner.py] --> B[output folder\nmodel.keras\nmodel.tflite\nmodel int8.tflite]
    B --> C[mcuSimulator.py\nValidate on PC]
    C --> D{Accuracy OK?}
    D -- Yes --> E[Flash to MCU\nArduino or STM32]
    D -- No --> A
\`\`\`

---

## How to Recreate

\`\`\`bash
git clone https://github.com/Nishan052/barcodeScanner && cd barcodeScanner
python3.10 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Place images in data/0/ (barcode) and data/1/ (background)
python pipelineRunner.py
IMAGE_PATH=data/0/sample.jpg python mcuSimulator.py
\`\`\`
`,

  references: [
    { text: 'Warden, P. and Situnayake, D. (2019) TinyML: Machine Learning with TensorFlow Lite on Arduino. Sebastopol: O\'Reilly Media.' },
    { text: 'Jacob, B. et al. (2018) "Quantization and Training of Neural Networks for Efficient Integer-Arithmetic-Only Inference", CVPR 2018.', url: 'https://arxiv.org/abs/1712.05877' },
    { text: 'TensorFlow (2024) Post-training quantization guide.', url: 'https://www.tensorflow.org/lite/performance/post_training_quantization' },
  ],
};

export default post;
