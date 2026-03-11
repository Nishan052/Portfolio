const post = {
  id:        3,
  slug:      'nifty50-stock-prediction',
  title:     'NIFTY 50 Stock Price Prediction: ARIMA vs LSTM',
  category:  'project',
  iconKey:   'TrendingUp',
  color:     '#00e5ff',
  date:      '2026-03-08',
  readTime:  '14 min',
  tags:      ['Python', 'LSTM', 'ARIMA', 'Time Series', 'Streamlit', 'TensorFlow'],
  githubUrl: 'https://github.com/Nishan052/Stock-Price-Prediction',
  excerpt:   'A walk-forward one-step forecasting system for the NIFTY 50 index, comparing classical ARIMA against a deep learning LSTM model — with a live Streamlit GUI and CI pipeline.',

  content: `
## Overview

This project implements a **walk-forward one-step forecasting framework** for the NIFTY 50 stock index — India's benchmark equity index comprising the 50 largest NSE-listed companies. Two fundamentally different modelling philosophies are pitted against each other:

- **ARIMA** (AutoRegressive Integrated Moving Average) — a classical econometric model
- **LSTM** (Long Short-Term Memory) — a recurrent neural network capable of capturing non-linear dependencies

A live demo is available at [nifty50indexprediction.streamlit.app](https://nifty50indexprediction.streamlit.app/).

---

## What Does It Solve?

Financial time series are notoriously difficult to predict due to:
- Non-stationarity (trends, seasonality)
- Structural breaks (e.g. the COVID-19 crash)
- High noise-to-signal ratio

Classical ARIMA handles stationarity explicitly through differencing and can be automatically configured. LSTM, being a deep learning model, can theoretically learn arbitrary non-linear patterns. The core research question: *does added model complexity actually improve forecast accuracy for a real-world index?*

---

## Architecture & Pipeline

\`\`\`mermaid
flowchart TD
    A[yfinance API\nNIFTY 50 2008–2024] --> B[dataHandler.py\nClean & Feature Engineering]
    B --> C{Walk-Forward\nSplit}
    C --> D[ARIMA\nautoArima order selection]
    C --> E[LSTM\nTensorFlow / Keras]
    D --> F[One-Step Forecast\nOpen & Close]
    E --> F
    F --> G[Evaluation\nRMSE · MAPE]
    G --> H[Streamlit GUI\nVisualisation & Comparison]
    H --> I[GitHub Actions CI\nautomated test suite]
\`\`\`

---

## Key Design Decisions

### 1. Walk-Forward Validation (not train/test split)

A simple 80/20 split would leak future information into the training distribution — a classic mistake in financial ML. Walk-forward validation simulates live deployment: the model is only ever trained on data it *would have seen* at prediction time.

### 2. COVID Dummy Variable

A binary \`COVID_dummy\` column flags the March–June 2020 crash period. This prevents ARIMA from misidentifying the structural break as a permanent trend change and helps LSTM weight those samples appropriately during training.

### 3. AutoARIMA for Hyperparameter Selection

Manually tuning (p, d, q) for every rolling window would be prohibitively slow. \`pmdarima.auto_arima\` runs the Akaike Information Criterion (AIC) search automatically on each window — keeping the pipeline fully automated.

### 4. Pretrained Model Caching (GUI)

Re-training LSTM from scratch on every GUI launch would take minutes. Pre-trained \`.keras\` model weights and \`.pkl\` ARIMA objects are stored in \`GUICode/models/\`, loaded at startup, and only retrained if the user uploads data beyond the model's training horizon.

### 5. Separate GUI Codebase

\`GUICode/\` is kept deliberately separate from \`Code/\` (the research pipeline). This reflects a **separation of concerns**: the GUI is a consumer of pre-computed artefacts, while the core pipeline is a reproducible research tool with its own test suite and CI.

---

## Model Architecture — LSTM

\`\`\`mermaid
flowchart LR
    A["Input\n(sequence, features)"] --> B["LSTM Layer 1\nhidden_size=64"]
    B --> C["Dropout 0.2"]
    C --> D["LSTM Layer 2\nhidden_size=32"]
    D --> E["Dense\n→ 1 (Open or Close)"]
\`\`\`

- **Input**: Sliding window of the last *N* days of OHLC features + COVID dummy
- **Loss**: Mean Squared Error
- **Optimiser**: Adam
- **Scaler**: MinMaxScaler per target (Open / Close) stored separately to prevent data leakage

---

## Evaluation Results

| Model | Target | RMSE | MAPE |
|-------|--------|------|------|
| ARIMA | Close  | Lower on stable periods | ~1.2% |
| LSTM  | Close  | Lower during volatile periods | ~0.9% |
| ARIMA | Open   | Competitive | ~1.1% |
| LSTM  | Open   | Best overall | ~0.85% |

Neither model dominates universally — ARIMA is more interpretable and faster, LSTM edges ahead during volatile regimes.

---

## How to Recreate

\`\`\`bash
git clone https://github.com/Nishan052/Stock-Price-Prediction
cd Stock-Price-Prediction
python3.10 -m venv myenv310 && source myenv310/bin/activate
pip install -r Requirements.txt
python Code/main.py
cd GUICode && streamlit run stockPredictorGui.py
\`\`\`

---

## Continuous Integration

GitHub Actions (\`.github/workflows/ci.yml\`) runs the full \`pytest\` suite on every push using Python 3.10. This catches data-handling regressions and model interface changes before they reach the GUI.
`,

  references: [
    { text: 'Box, G.E.P., Jenkins, G.M. and Reinsel, G.C. (2015) Time Series Analysis: Forecasting and Control. 5th edn. Hoboken: Wiley.' },
    { text: 'Hochreiter, S. and Schmidhuber, J. (1997) "Long short-term memory", Neural Computation, 9(8), pp. 1735–1780.', url: 'https://doi.org/10.1162/neco.1997.9.8.1735' },
    { text: 'Hyndman, R.J. and Athanasopoulos, G. (2021) Forecasting: Principles and Practice. 3rd edn. OTexts.', url: 'https://otexts.com/fpp3/' },
    { text: 'Smith, T.G. (2017) pmdarima: ARIMA estimators for Python.', url: 'https://alkaline-ml.com/pmdarima' },
  ],
};

export default post;
