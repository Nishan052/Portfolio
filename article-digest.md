# Article & Project Digest — Nishan Poojary
> Comprehensive proof-point reference covering all portfolio projects and published articles.

---

## TABLE OF CONTENTS

**Projects**
1. [RAG Chatbot — Production AI System](#1-rag-chatbot--production-ai-system)
2. [NIFTY 50 Stock Price Prediction](#2-nifty-50-stock-price-prediction)
3. [TinyML Face Verification on Arduino](#3-tinyml-face-verification-on-arduino)
4. [TinyML Barcode Scanner](#4-tinyml-barcode-scanner)
5. [SignalDock — IoT MQTT Architecture](#5-signaldock--iot-mqtt-architecture)
6. [Angular SPA Routing App](#6-angular-spa-routing-app)
7. [Python Data Analysis Collection](#7-python-data-analysis-collection)

**Articles / Research Posts**
1. [Building Production-Ready RAG: The Architecture Nobody Talks About](#article-1-building-production-ready-rag-the-architecture-nobody-talks-about)
2. [From Prototype to Production: Deploying, Testing & Monitoring RAG](#article-2-from-prototype-to-production-deploying-testing--monitoring-rag)
3. [GraphRAG vs LazyGraphRAG: Local vs Global Retrieval Strategy](#article-3-graphrag-vs-lazygraphrag-local-vs-global-retrieval-strategy)
4. [Agentic RAG: Complete Systems Guide from Architecture to Production](#article-4-agentic-rag-complete-systems-guide-from-architecture-to-production)
5. [Chunking Strategies for RAG: Why Page-Level Indexing Changes Everything](#article-5-chunking-strategies-for-rag-why-page-level-indexing-changes-everything)

---

---

# PROJECTS

---

## 1. RAG Chatbot — Production AI System

| Field | Detail |
|---|---|
| **Status** | Production deployed |
| **URL** | https://nishanpoojary.com |
| **Stack** | Python · Cloudflare Workers · Pinecone · Upstash Redis · Groq API · React |
| **Hero Metric** | Reduced latency **8s → <10ms** via semantic caching (800× improvement) |

### What It Solves
Repeated LLM API queries are slow and expensive. Without grounding, LLMs hallucinate. This system layers semantic caching, vector retrieval, and response grounding to make a production-grade AI chatbot that is fast, accurate, and runs at **$0/month** on free tiers.

### Architecture
- **Frontend:** React app on Cloudflare Pages
- **Backend:** Cloudflare Workers edge functions (no server management)
- **Embedding Model:** Cloudflare Workers AI `bge-base-en-v1.5` (prod) / Ollama `nomic-embed-text` (dev)
- **LLM:** Groq API (prod) / Ollama (local dev)
- **Vector DB:** Pinecone serverless (5k vectors)
- **Cache:** Upstash Redis — exact + semantic caching (6–24h TTL, cosine similarity threshold)
- **Retrieval:** Contextual Retrieval (Anthropic 2025 methodology — LLM-prepended context per chunk)

### Key Design Decisions
- **Semantic caching first** — queries with similar meaning reuse the same cached response. Eliminated 99%+ of LLM API calls.
- **Contextual Retrieval** — each chunk is enriched with LLM-generated context before embedding, yielding 49% better retrieval accuracy vs standard RAG.
- **Response grounding layer** — every answer is validated against retrieved chunks before delivery. Zero hallucinations on the validation dataset.
- **Rate limiting + PII protection** — enterprise-ready compliance baked into the edge function layer.

### Proof Points
| Metric | Result |
|---|---|
| Latency | 8s → sub-10ms (with cache hit) |
| Monthly cost | $0 (free tier architecture) |
| Hallucination rate | 0% on validation dataset |
| Retrieval accuracy boost | +49% (Contextual Retrieval vs standard) |
| Infrastructure overhead | Zero (fully serverless) |

---

## 2. NIFTY 50 Stock Price Prediction

| Field | Detail |
|---|---|
| **Status** | Production deployed with live Streamlit GUI |
| **URL** | https://nifty50indexprediction.streamlit.app |
| **GitHub** | https://github.com/Nishan052/Stock-Price-Prediction |
| **Stack** | Python · TensorFlow/Keras · pmdarima · Streamlit · GitHub Actions |
| **Hero Metric** | Sub-3% MAPE with dual LSTM + ARIMA ensemble |

### What It Solves
Financial time series are non-stationary, noisy, and prone to structural breaks. Classical models handle stationarity well but miss non-linear patterns. Deep learning captures complexity but is hard to interpret. This project pits both against each other using rigorous walk-forward validation.

### Architecture
```
yfinance API (NIFTY 50 2008–2024)
    → dataHandler.py (clean + feature engineering)
    → Walk-Forward Split
        → ARIMA (AutoARIMA order selection via AIC)
        → LSTM (2-layer: 64→32 hidden, Adam optimizer, MSE loss)
    → One-Step Forecast (Open + Close)
    → Evaluation (RMSE + MAPE)
    → Streamlit GUI + GitHub Actions CI
```

### Key Design Decisions
- **Walk-forward validation** (not train/test split) — model only sees data it would have had at prediction time. No future data leakage.
- **COVID dummy variable** — binary flag for March–June 2020 prevents ARIMA from treating the structural break as a trend. LSTM weights those samples appropriately.
- **AutoARIMA per window** — pmdarima runs AIC search on each rolling window automatically, keeping the pipeline fully automated.
- **Pretrained model caching** — LSTM `.keras` weights and ARIMA `.pkl` objects stored in `GUICode/models/`, loaded at startup to avoid re-training on every GUI launch.
- **Separation of concerns** — research pipeline (`Code/`) is fully separate from GUI (`GUICode/`). The GUI consumes pre-computed artefacts.

### LSTM Architecture
- Input: Sliding window of OHLC features + COVID dummy
- Layer 1: LSTM (hidden_size=64)
- Dropout: 0.2
- Layer 2: LSTM (hidden_size=32)
- Output: Dense → 1 (Open or Close)

### Proof Points
| Model | Target | MAPE |
|---|---|---|
| ARIMA | Close | ~1.2% |
| LSTM | Close | ~0.9% |
| ARIMA | Open | ~1.1% |
| LSTM | Open | ~0.85% (best) |

LSTM edges ahead in volatile regimes. ARIMA wins on interpretability and inference speed.

---

## 3. TinyML Face Verification on Arduino

| Field | Detail |
|---|---|
| **Status** | Active development |
| **GitHub** | https://github.com/Nishan052 |
| **Stack** | PyTorch · ONNX · TensorFlow Lite · LiteRT · Arduino · C/C++ |
| **Hero Metric** | On-device inference in **<100ms** with **zero cloud dependency** |

### What It Solves
Cloud-based face verification sends biometric data off-device. This project deploys the entire inference pipeline on a microcontroller — privacy by architecture, offline by design.

### Full Pipeline
```
PyTorch Siamese Network (Triplet Loss training)
    → torch.onnx.export → ONNX model
    → tf2onnx → TensorFlow SavedModel
    → TFLite Converter → LiteRT int8 quantised
    → xxd → model_data.h (C byte array)
    → Arduino: LiteRT C++ runtime
        → Camera module (96×96 frame)
        → Run inference (<100ms)
        → Cosine similarity check → Access Granted / Denied
```

### Model Design: Siamese Network
Face verification is a **metric learning** problem (not classification). A Siamese network processes two faces through shared CNN weights and produces 128-dim embedding vectors. Verification = cosine similarity check.

**Why triplet loss:** Trains the embedding space directly with anchor/positive/negative triplets. Loss: `max(d(A,P) - d(A,N) + margin, 0)`. Forces same-person embeddings close, different-person embeddings apart.

### Key Design Decisions
- **PyTorch for training** — dynamic computation graph makes triplet mining and custom losses easy to implement and debug.
- **LiteRT over bare TFLite** — Google's 2024 rebranding with improved operator coverage and cleaner C++ API. Future-proofs the runtime.
- **Cosine similarity** (not Euclidean) — invariant to embedding magnitude. More robust to lighting variation.
- **Int8 quantisation** — 4× memory reduction, 2–4× inference speed-up on integer ALUs.

### Proof Points
| Metric | Result |
|---|---|
| Model size reduction | ~75–80% via int8 quantisation |
| Inference latency target | <100ms on-device |
| Network calls | Zero (fully offline) |
| Power budget | <1mW (battery-operated years) |

---

## 4. TinyML Barcode Scanner

| Field | Detail |
|---|---|
| **Status** | Completed |
| **GitHub** | https://github.com/Nishan052/barcodeScanner |
| **Stack** | Python · Keras · OpenCV · TensorFlow Lite · ZBar · SQLite |
| **Hero Metric** | **10× model size reduction** via int8 quantisation while maintaining accuracy |

### What It Solves
Industrial barcode scanning requires dedicated hardware or powerful processors. This project embeds the entire detection pipeline on a $2 microcontroller — offline, zero-latency, zero cloud.

### Pipeline
```
Raw Image Dataset (barcode / background)
    → preprocessing.py (resize · normalise · augment)
    → trainModel.py (Keras CNN: presence head + bbox head)
    → TFLite Converter (float32 → int8 quantisation)
    → mcuSimulator.py (validates accuracy before hardware flash)
    → MCU deployment (bounding box + presence output)
```

### Model Architecture: Multi-Task CNN
```
Input: 96×96 greyscale
    → Conv Block 1 (32 filters, 3×3) → MaxPool
    → Conv Block 2 (64 filters, 3×3) → MaxPool
    → Flatten + Dense 128
        → Presence Head (Sigmoid: barcode present / absent)
        → BBox Head (4 coords: x, y, w, h)
```

**Shared backbone** — both tasks share the same feature extractor. Cheaper than two models and tasks are positively correlated.

### Key Design Decisions
- **Int8 over float32** — 4× memory reduction, 2–4× speed-up, <1% accuracy loss for detection tasks.
- **Masked BBox loss** — when barcode is absent, BBox loss contribution is zeroed out. Prevents the model from learning nonsense bounding boxes for empty frames.
- **MCU simulator before hardware** — `mcuSimulator.py` runs the quantised `.tflite` on a PC via TFLite interpreter. Catches accuracy regressions before firmware flashing.

---

## 5. SignalDock — IoT MQTT Architecture

| Field | Detail |
|---|---|
| **Status** | Production |
| **GitHub** | https://github.com/Nishan052/SignalDock |
| **Stack** | MQTT · Mosquitto · Docker Compose · Python · Angular · WebSockets |
| **Hero Metric** | Full IoT pub-sub topology running locally with **1 command** (`docker-compose up`) |

### What It Solves
IoT devices need to communicate over low-bandwidth, high-latency networks. REST APIs are too heavy; WebSockets are too stateful. MQTT's lightweight pub-sub model is the industry standard — this project containerises it fully.

### Architecture
```
Mosquitto Broker (Port 1883)
    ← Client Alpha (internal docker mqtt-net, simulates on-premises device)
    ← Client Bravo (external network, connects via host IP — simulates remote device)
    ← mosquitto_pub / mosquitto_sub CLI (topic: common/topic)
```

### MQTT vs REST vs WebSocket
| Feature | MQTT | REST | WebSocket |
|---|---|---|---|
| Overhead | <2 bytes header | KB+ per request | Medium |
| Connection | Persistent | Request/response | Persistent |
| Fan-out (1→N) | Native (pub-sub) | Manual polling | Manual |
| QoS levels | 0, 1, 2 | None | None |

### Key Design Decisions
- **Docker Compose** — entire topology (broker + clients) defined declaratively in one YAML. Eliminates environment configuration drift.
- **Two-network topology** — internal `mqtt-net` for on-premises simulation, external host IP for remote-device simulation. Tests both network paths.
- **QoS levels 0, 1, 2** — demonstrated across different reliability scenarios.

---

## 6. Angular SPA Routing App

| Field | Detail |
|---|---|
| **Status** | Completed |
| **GitHub** | https://github.com/Nishan052/Routing-app |
| **Stack** | Angular 14 · TypeScript · RxJS · Lazy Loading |
| **Hero Metric** | **40–60% reduction** in initial bundle size via lazy-loaded feature modules |

### What It Solves
Large Angular apps ship all code in a single bundle — slow initial load, poor Time-to-Interactive. This project demonstrates the canonical pattern set: lazy loading, guards, child routes, and reactive parameters.

### Route Structure
```
AppModule /
    → /home          → HomeComponent
    → /products      → ProductsModule (lazy loaded)
        → /          → ProductListComponent
        → /:id       → ProductDetailComponent (child route)
    → /auth          → AuthModule (lazy loaded)
    → /admin         → AdminModule (guarded + lazy)
        → CanActivate: AuthGuard
        → /dashboard → AdminDashComponent
    → /**            → PageNotFoundComponent
```

### Key Patterns
- **Lazy loading** — feature module JS bundle only downloads when first navigated to. Initial bundle stays small.
- **Route guards** — `AuthGuard` implements `CanActivate`, returns `UrlTree` for redirect. Keeps navigation declarative and testable.
- **Child routes** — parent layout (sidebar, header) persists across child navigation. Only the `router-outlet` content re-renders.
- **Reactive route params** — `ActivatedRoute.paramMap` as Observable (not snapshot). Handles in-component navigation between `:id` routes correctly with RxJS.

---

## 7. Python Data Analysis Collection

| Field | Detail |
|---|---|
| **Status** | Completed |
| **GitHub** | https://github.com/Nishan052/python |
| **Stack** | Python · Pandas · NumPy · Matplotlib · Seaborn · Jupyter |
| **Hero Metric** | End-to-end EDA workflow from raw CSV to publishable insights |

### What It Covers
A collection of Jupyter notebooks demonstrating the full EDA pipeline: structural inspection, missing value analysis, distribution analysis, correlation analysis, statistical testing, and feature engineering.

### EDA Workflow
```
Raw Dataset (CSV / Excel / SQL)
    → Load with Pandas
    → Structural Inspection (.info, .dtypes, .shape)
    → Missing Value Analysis (.isnull, heatmaps)
    → Distribution Analysis (histograms, box plots)
    → Correlation Analysis (heatmaps, pair plots)
    → Statistical Tests (t-test, chi-squared)
    → Feature Engineering (encode, scale, derive)
    → Summary & Insights (Markdown cells)
```

### Key Analyses Demonstrated
- **Missing value heatmap** — distinguishes random missingness from systematic missing (whole columns) to guide imputation strategy.
- **Distribution analysis** — histograms for skewness/bimodality; IQR box plots for outlier detection.
- **Correlation heatmap** — surfaces multicollinearity before model training.
- **Seaborn pairplot** — all pairwise scatter plots coloured by target variable; reveals class separability at a glance.

---

---

# ARTICLES / RESEARCH POSTS

---

## Article 1: Building Production-Ready RAG: The Architecture Nobody Talks About

| Field | Detail |
|---|---|
| **Published** | 2026-03-08 |
| **Read Time** | 14 min |
| **Category** | Research |
| **Tags** | AI · RAG · Vector Search · LLM · Production · Architecture · Embeddings |

### Core Argument
Tutorials tell you *which* tools to use. This post explains *why* every layer in a production RAG system exists — the underlying problems, not the product names. AI tools change every 6 months; the problems they solve do not.

### Key Concepts Covered

**What an LLM actually is**
An LLM is a sophisticated autocomplete engine trained on a snapshot of public data up to a cut-off date. Two hard limits every production system must work around:
1. **No persistent memory** — each session starts fresh
2. **No private context** — it has never seen your documents

**Why RAG exists**
Give the model the relevant information *during the conversation*. Retrieve → Augment → Generate. An open-book exam, not closed-book.

**Why embeddings exist**
Keyword search fails across synonyms and semantic equivalents. Embeddings convert text to ~768-dim vectors where similar meanings produce similar numbers. Cosine similarity finds nearest neighbours by meaning, not letters.

**Why query expansion exists**
Users rarely use the same vocabulary as the documents. Query expansion rewrites the question into multiple phrasings before retrieval to bridge the vocabulary gap.

**Why caching exists**
Most user questions repeat (or nearly repeat). Semantic caching (cosine similarity on query embeddings) returns stored answers without hitting the LLM for semantically identical queries.

**Why a grounding layer exists**
LLMs are confident. Without grounding, they blend retrieved facts with hallucinated plausible details. A grounding layer validates every claim in the answer against retrieved chunks before delivery.

### Proof Points Referenced
- 8s → <10ms latency (caching)
- +49% retrieval accuracy (Contextual Retrieval)
- 0% hallucination rate (grounding layer)

---

## Article 2: From Prototype to Production: Deploying, Testing & Monitoring RAG

| Field | Detail |
|---|---|
| **Published** | 2026-03-15 |
| **Read Time** | 16 min |
| **Category** | Research |
| **Tags** | RAG · Production · Deployment · Testing · Monitoring · FastAPI · Serverless |

### Core Argument
A RAG system that works in a Jupyter notebook fails in production within a week: hallucinations surface, latency spikes, costs balloon, and you have no visibility. Closing the production gap requires answers to three questions: *How do I deploy without servers? How do I know it works? How do I see what broke before users do?*

### Part 1: Deploying RAG to Serverless

**Cold Start problem**
Serverless functions boot on first request (~2–3s). Subsequent calls are warm (~10ms). Solution: containerise everything (code + Python + all libraries) into a sealed package — eliminates environment drift and reduces boot time.

**Serverless vs Traditional**
| | Traditional Server | Serverless |
|---|---|---|
| Cost | $100/month always | ~$0.20–0.60/1M requests |
| Latency | ~10ms (always warm) | 2–3s cold, ~500ms warm |
| Maintenance | Manual scaling | Zero |

### Part 2: Testing RAG Systems
RAG requires testing at three layers:
1. **Unit tests** — individual functions (chunking, embedding calls, cache logic)
2. **Integration tests** — end-to-end pipeline with real (or mocked) vector DB calls
3. **Evaluation tests** — ground-truth question/answer pairs; assert factual accuracy and retrieval recall

### Part 3: Monitoring & Observability
Production RAG needs structured logging for: query text, retrieved chunk IDs + similarity scores, cache hit/miss, LLM response time, and grounding validation outcome. Alerts on: latency P95 > threshold, cache hit rate drop, hallucination detection rate spike.

---

## Article 3: GraphRAG vs LazyGraphRAG: Local vs Global Retrieval Strategy

| Field | Detail |
|---|---|
| **Published** | 2026-03-22 |
| **Read Time** | 15 min |
| **Category** | Research |
| **Tags** | RAG · GraphRAG · LazyGraphRAG · Evaluation · Knowledge Graph |

### Core Argument
Vector search is excellent for **local fact lookup** ("What did document X say about Y?") but fails at **global synthesis** ("Across all documents, what are the main patterns and tradeoffs?"). Most RAG systems use one strategy for both and fail on one class of query.

### Local vs Global Questions

| Query type | Shape | Retrieval demand |
|---|---|---|
| Local | Who, what, when, where | High precision on small evidence set |
| Global | Themes, patterns, implications | Broad coverage across corpus |

**Why vector search underperforms on global queries:** Top-K similarity finds chunks nearest to the query. If evidence is distributed across 10 documents and no single chunk is a great match, you miss the answer.

### What GraphRAG Adds
GraphRAG builds a graph-oriented index: entities, relationships, community structure, and community-level summaries. Global retrieval can traverse the graph rather than just rank individual chunks.

**Trade-off:** Index-time is heavier (graph extraction + summarisation are front-loaded). Worth it when dataset-level synthesis is a primary use case.

### What LazyGraphRAG Changes
Defers expensive LLM work to query time. Uses budgeted relevance testing. Offers a smoother quality/cost control knob — you don't have to choose between full graph overhead and plain vector search.

### Decision Framework
- Local questions, homogeneous corpus → standard vector RAG
- Global synthesis questions → GraphRAG or LazyGraphRAG
- Mixed query set → hybrid or per-query routing

---

## Article 4: Agentic RAG: Complete Systems Guide from Architecture to Production

| Field | Detail |
|---|---|
| **Published** | 2026-04-15 |
| **Read Time** | 6 min |
| **Category** | Research |
| **Tags** | MultiAgent · RAG · Architecture · QueryRouting · SystemDesign |

### Core Argument
Traditional RAG chains retrieval steps sequentially — brittle when queries cross knowledge domains (support vs billing vs technical). Agentic RAG inverts this: a **dispatcher agent** classifies and routes queries to **domain-specialist retrieval agents**, validated by a **validator agent**, synthesized by a **synthesis agent**.

### Seven-Layer Architecture
1. Input normalization
2. Intelligent routing (dispatcher classifies query intent)
3. Parallel retrieval (domain-specific agents run concurrently)
4. Validation (hallucination + consistency checking)
5. Synthesis (compose grounded response)
6. Memory persistence (cross-session context)
7. Monitoring

### Orchestration Patterns

| Pattern | When to use | Latency impact |
|---|---|---|
| Sequential | Linear dependent tasks | Additive |
| Parallel | Independent multi-domain retrieval | 30–40% reduction |
| Hierarchical | 50+ domains | Scales without explosion |

### Proof Points
- **30–40% latency reduction** via parallel retrieval agents
- **60% reduction in production errors** from validation agents catching hallucinations pre-delivery

### When to go Agentic (vs stay monolithic)
Stay monolithic: simple, well-defined queries on homogeneous knowledge.  
Go agentic: >3 knowledge domains, diverse query types, or production uptime requiring pre-delivery validation.

---

## Article 5: Chunking Strategies for RAG: Why Page-Level Indexing Changes Everything

| Field | Detail |
|---|---|
| **Published** | 2026-03-30 |
| **Read Time** | 14 min |
| **Category** | Research |
| **Tags** | RAG · Chunking · Vector Search · Page Indexing · LLM · Information Retrieval |

### Core Argument
RAG systems fail silently when chunking is wrong — the system retrieves *something* related, grounds the answer in it, and returns confident incorrect information. The root cause is not the retrieval algorithm; it is how the document was chunked.

### Three Approaches Compared

**Approach 1: Paragraph-level (too coarse)**
Splits on paragraph boundaries. Problem: evidence for a single question is often spread across multiple paragraphs. Individual paragraphs rank poorly against a paragraph-level embedding — the relevant page never surfaces in Top-K.

**Approach 2: Token-level (too fine)**
Splits at fixed token count (e.g., 256 tokens). Problem: sentences are split mid-thought. A 256-token chunk loses the surrounding context that gives meaning to the sentence. Retrieval precision spikes, recall collapses.

**Approach 3: Page-level (the sweet spot)**
Index at page granularity. A policy page about defective returns stays together as one chunk. The full context — general rule, exceptions, timelines, FAQ — is preserved. Top-K retrieval finds the right *page*, then the LLM reads the whole page to extract the precise answer.

### Why This Matters
- Paragraph chunking: retrieves scattered fragments → LLM answers with general policy, misses exceptions
- Page-level chunking: retrieves complete policy page → LLM correctly identifies the 90-day defective product rule

### Implementation Guidance
- Use page boundaries from PDF metadata, not character count
- For long pages (>800 tokens): parent-child chunking — index page-level for retrieval, pass sentence-level to LLM for generation
- Store page number + document ID as metadata on every chunk for citation tracing

---

## CROSS-REFERENCE: SKILLS × PROOF POINTS

| Skill Claimed | Proof Point | Source |
|---|---|---|
| Production LLM deployment | 8s→<10ms, $0/month, 0% hallucination | RAG Chatbot + Article 1 |
| Semantic caching | +800× latency reduction | RAG Chatbot |
| Retrieval accuracy | +49% (Contextual Retrieval) | RAG Chatbot + Article 1 |
| Time-series forecasting | Sub-3% MAPE, walk-forward validated | NIFTY 50 Project |
| Ensemble modelling | LSTM + ARIMA complementary | NIFTY 50 Project + Article |
| Embedded AI / TinyML | 10× model compression, <100ms on MCU | Barcode Scanner + Face Verification |
| Model quantisation | Int8, 4× memory reduction | TinyML Projects |
| IoT architecture | Docker MQTT topology, QoS levels 0–2 | SignalDock |
| Angular frontend | Lazy loading (-40–60% bundle), Guards, RxJS | SPA Routing App |
| EDA & data science | Full pipeline from raw CSV to insights | Python Data Analysis |
| Multi-agent systems | 30–40% latency reduction, 60% error reduction | Article 4 |
| RAG chunking strategy | Page-level vs paragraph vs token analysis | Article 5 |
| Serverless deployment | Cold start analysis, container strategy | Article 2 |
| GraphRAG trade-offs | Local vs global query strategy framework | Article 3 |
