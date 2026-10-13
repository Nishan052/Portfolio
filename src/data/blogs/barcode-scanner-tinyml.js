const post = {
  id:        6,
  slug:      'barcode-scanner-tinyml',
  title:     'TinyML Barcode Detection: From Keras to Microcontroller',
  category:  'project',
  iconKey:   'ScanSearch',
  color:     '#f59e0b',
  date:      '2026-03-08',
  series:      'TinyML on microcontrollers',
  part:      2,
  readTime:  '12 min',
  tags:      ['TinyML', 'TensorFlow Lite', 'Python', 'OpenCV', 'Quantization', 'Edge AI'],
  githubUrl: 'https://github.com/Nishan052/barcodeScanner',
  excerpt:   'For my master\'s I trained a barcode detector in Keras and shrank it with int8 quantization so it could run on a microcontroller.',

  content: `
## TinyML on a microcontroller

TinyML means running machine learning models on microcontrollers, which have kilobytes of RAM, no operating system and a power budget under a milliwatt. For my master's I built a barcode detector within those limits, which decides whether a barcode is in a camera frame and predicts its bounding box.

---

## The problem it solves

Industrial barcode scanning usually needs dedicated hardware or a powerful processor, so putting it on a $2 microcontroller gives you:
- Battery-powered, offline scanning with no cloud behind it
- Latency under a millisecond, since inference runs at the sensor
- Privacy by design, because the images never leave the device

---

## Full pipeline

\`\`\`mermaid
flowchart TD
    A[Raw Image Dataset
Class 0: barcode
Class 1: background] --> B[preprocessing
Resize · Normalize · Augment]
    B --> C[trainModel.py
Keras CNN
Presence + BBox head]
    C --> D[.keras model
Full precision]
    D --> E[TFLite Converter
float32 → int8 quantization]
    E --> F[.tflite model
10x smaller]
    F --> G[mcuSimulator.py
Simulates MCU inference]
    G --> H[Cropped Detection Output
Bounding box visualization]
\`\`\`

---

## Model architecture

The model has two output heads, one for presence and one for the bounding box, and it trains both tasks at once:

\`\`\`mermaid
flowchart LR
    A["Input Image
96x96 greyscale"] --> B["Conv Block 1
32 filters 3x3"]
    B --> C["MaxPool"]
    C --> D["Conv Block 2
64 filters 3x3"]
    D --> E["MaxPool"]
    E --> F["Flatten + Dense 128"]
    F --> G["Presence Head
Sigmoid 0 or 1"]
    F --> H["BBox Head
4 coords x y w h"]
\`\`\`

Both heads share the same convolutional backbone, which is cheaper than two separate models, and it works because the two tasks are positively correlated.

---

## Design decisions

### 1. Int8 quantization instead of float32
A full precision (float32) model needs 4 bytes per weight, and int8 quantization gives you:
- 4× less memory, which matters on MCUs with 256 KB of RAM
- 2–4× faster inference on integer ALUs
- An accuracy loss that's typically < 1% for detection tasks

### 2. Masked bounding box loss
When there's no barcode, the bounding box output means nothing, so a custom masked loss zeros out the box loss whenever the ground truth label is "no barcode".

### 3. MCU simulator before hardware
\`mcuSimulator.py\` runs the quantized \`.tflite\` model with the TFLite interpreter on a PC, exactly the way the MCU runtime will run it, so you catch accuracy drops *before* flashing the firmware, while they're still easy to fix.

---

## Deployment flow

\`\`\`mermaid
flowchart LR
    A[PC Training
pipelineRunner.py] --> B[output folder
model.keras
model.tflite
model int8.tflite]
    B --> C[mcuSimulator.py
Validate on PC]
    C --> D{Accuracy OK?}
    D -- Yes --> E[Flash to MCU
Arduino or STM32]
    D -- No --> A
\`\`\`

---

## How to recreate it

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
