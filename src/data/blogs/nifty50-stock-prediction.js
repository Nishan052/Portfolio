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
  excerpt:   'For my master\'s, three of us forecast the NIFTY 50 one step ahead with ARIMA and an LSTM, tested walk-forward so no future data leaks in.',

  content: `
## What we built

For my master's, three of us built a walk-forward, one-step forecasting system for the NIFTY 50, India's benchmark equity index of the 50 largest NSE-listed companies. We compared two different ways of modeling it:

- ARIMA (AutoRegressive Integrated Moving Average), a classical econometric model
- LSTM (Long Short-Term Memory), a recurrent neural network that can capture non-linear dependencies

The live demo is at [nifty50indexprediction.streamlit.app](https://nifty50indexprediction.streamlit.app/).

---

## Why it's hard to predict

Financial time series are non-stationary with trends and seasonality, they have structural breaks like the COVID-19 crash, and there's a lot of noise compared to the signal. ARIMA handles stationarity directly through differencing and can be configured automatically, while an LSTM can in theory learn any non-linear pattern. So our question was whether that extra complexity actually improves accuracy on a real-world index.

---

## Architecture and pipeline

\`\`\`mermaid
flowchart TD
    A[yfinance API
NIFTY 50 2008–2024] --> B[dataHandler.py
Clean & Feature Engineering]
    B --> C{Walk-Forward
Split}
    C --> D[ARIMA
autoArima order selection]
    C --> E[LSTM
TensorFlow / Keras]
    D --> F[One-Step Forecast
Open & Close]
    E --> F
    F --> G[Evaluation
RMSE · MAPE]
    G --> H[Streamlit GUI
Visualization & Comparison]
    H --> I[GitHub Actions CI
automated test suite]
\`\`\`

---

## Design decisions

### 1. Walk-forward validation over a train/test split

A simple 80/20 split would leak future information into training, a classic mistake in financial machine learning. It happened to us too, because at one point our results looked too good, and then I found future data leaking into the training window. Walk-forward validation works like live deployment, so the model only ever trains on data it *would have seen* at prediction time.

### 2. COVID dummy variable

A binary \`COVID_dummy\` column flags the crash from March to June 2020, so ARIMA doesn't mistake that structural break for a permanent trend change, and the LSTM can weigh those samples correctly in training.

### 3. AutoARIMA for hyperparameter selection

Tuning (p, d, q) by hand for every rolling window would be far too slow, so \`pmdarima.auto_arima\` runs the Akaike Information Criterion (AIC) search on each window automatically.

### 4. Pretrained model caching (GUI)

Training the LSTM from scratch on every GUI launch would take minutes, so the pretrained \`.keras\` weights and \`.pkl\` ARIMA objects sit in \`GUICode/models/\` and load at startup. They're only retrained if the user uploads data past the training horizon.

### 5. A separate GUI codebase

We kept \`GUICode/\` apart from \`Code/\`, the research pipeline, on purpose. For me it's a simple separation of concerns, since the GUI only uses artifacts computed beforehand, while the core pipeline is a reproducible research tool with its own tests and CI.

---

## LSTM model architecture

\`\`\`mermaid
flowchart LR
    A["Input
(sequence, features)"] --> B["LSTM Layer 1
hidden_size=64"]
    B --> C["Dropout 0.2"]
    C --> D["LSTM Layer 2
hidden_size=32"]
    D --> E["Dense
→ 1 (Open or Close)"]
\`\`\`

- Input: a sliding window of the last *N* days of OHLC features plus the COVID dummy
- Loss: Mean Squared Error
- Optimizer: Adam
- Scaler: a MinMaxScaler for each target (Open and Close), stored separately to prevent data leakage

---

## Evaluation results

| Model | Target | RMSE | MAPE |
|-------|--------|------|------|
| ARIMA | Close  | Lower on stable periods | ~1.2% |
| LSTM  | Close  | Lower during volatile periods | ~0.9% |
| ARIMA | Open   | Competitive | ~1.1% |
| LSTM  | Open   | Best overall | ~0.85% |

Neither model wins everywhere, because ARIMA is easier to interpret and faster, while the LSTM pulls ahead when the market is volatile.

---

## How to recreate it

\`\`\`bash
git clone https://github.com/Nishan052/Stock-Price-Prediction
cd Stock-Price-Prediction
python3.10 -m venv myenv310 && source myenv310/bin/activate
pip install -r Requirements.txt
python Code/main.py
cd GUICode && streamlit run stockPredictorGui.py
\`\`\`

---

## Continuous integration

GitHub Actions (\`.github/workflows/ci.yml\`) runs the full \`pytest\` suite with Python 3.10 on every push, so data handling bugs and model interface changes get caught before they reach the GUI.
`,

  references: [
    { text: 'Box, G.E.P., Jenkins, G.M. and Reinsel, G.C. (2015) Time Series Analysis: Forecasting and Control. 5th edn. Hoboken: Wiley.' },
    { text: 'Hochreiter, S. and Schmidhuber, J. (1997) "Long short-term memory", Neural Computation, 9(8), pp. 1735–1780.', url: 'https://doi.org/10.1162/neco.1997.9.8.1735' },
    { text: 'Hyndman, R.J. and Athanasopoulos, G. (2021) Forecasting: Principles and Practice. 3rd edn. OTexts.', url: 'https://otexts.com/fpp3/' },
    { text: 'Smith, T.G. (2017) pmdarima: ARIMA estimators for Python.', url: 'https://alkaline-ml.com/pmdarima' },
  ],
};

export default post;
