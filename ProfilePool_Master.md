# Nishan Chandrashekar Poojary - Master Profile Pool
## Comprehensive Reference for Job Applications & Career Documentation

---

## PERSONAL INFORMATION

**Name:** Nishan Chandrashekar Poojary  
**Location:** Berlin, Germany (established, valid EU work permit)  
**Email:** nishanchandrashekarpoojary@gmail.com  
**Phone:** +49 1556 3374276  
**GitHub:** Nishan052  
**LinkedIn:** Nishan Poojary  
**Portfolio Website:** nishanpoojary.com  
**Blog:** Weekly technical posts documenting learning, AI advancements, and systematic reflection  

---

## EDUCATION

**Master of Science: Business Intelligence and Data Analytics**
- Institution: Hochschule Emden/Leer, Emden, Germany
- Duration: March 2025 - Current
- Grade: 1.45/5 (equivalent to 3.9/4.0 GPA)

**Bachelor of Engineering: Mechanical Engineering**
- Institution: Shri Madhwa Vadiraja Institute of Technology and Management, Udupi, India
- Duration: June 2016 - June 2020
- CGPA: 2.6/5 GPA

**Certifications & Additional Learning:**
- Data Analytics Foundations Certificate (Google)
- Python for Data Science, AI and Development Certificate (Coursera)
- Python Data Structures Certificate (Coursera)
- Java Spring and Angular Full Stack Developer Certificate (Infosys Foundation Program)

**Languages:**
- **English:** Fluent (native-equivalent proficiency)
- **German:** B1 level, actively improving through daily practice
- **Additional:** Kannada, Tulu, Hindi (demonstrated language acquisition methodology)

---

## PROFESSIONAL EXPERIENCE SUMMARY

**4+ years of production software engineering experience** combining full-stack development, data science, and enterprise system integration. Demonstrated expertise shipping reliable systems in regulated environments (banking, healthcare). Strong foundation in problem-understanding before technology selection, enabling rapid adaptation to new technical stacks and domains.

**Core Philosophy:**
- Problem first, technology second
- Production thinking from day one (not optimization as afterthought)
- Constraint-aware engineering
- Systematic documentation and learning
- Measurable outcomes and quantified results

---

## WORK EXPERIENCE

### Senior Software Developer
**Novigo Solutions, Mangalore, India | June 2023 - February 2025**

**Banking and Financial Services: Digital Onboarding Platform**
- Engineered end-to-end digital customer onboarding applications for multiple US-based banks covering complete product lifecycle from business requirements analysis through production deployment
- Translated complex banking and financial services requirements into scalable, maintainable technical solutions
- Developed interactive banking applications using Angular, TypeScript, and modern frontend frameworks
- Integrated with enterprise Salesforce systems for customer data management and workflow automation
- Managed full deployment pipeline across local development, QA, and production environments ensuring stable releases for compliance-sensitive banking applications
- Drove product optimization and feature development within Agile and Jira workflows
- Demonstrated expertise in banking compliance requirements, secure data handling, and enterprise application architecture

**Key Skills Demonstrated:**
Full-stack development, enterprise integration, regulatory compliance, banking systems, API design, production deployment, team leadership, Agile methodology, requirement translation

### Senior Software Engineer
**Infosys Helix, Bangalore, India | May 2021 - June 2023**

**Healthcare Digitalization Platform**
- Developed comprehensive healthcare digitalization platform as frontend engineer building interactive dashboards and data-driven UI components using Angular, TypeScript, and HTML/CSS
- Designed components to improve clinical data accessibility and support clinical decision-making processes
- Built and consumed RESTful APIs using Spring Boot framework with Swagger API documentation and comprehensive testing
- Contributed across full technology stack from frontend UI development to backend API integration
- Automated manual deployment processes and implemented CI/CD pipeline infrastructure significantly reducing release overhead and improving deployment reliability
- Participated in converting healthcare business requirements into technical specifications ensuring regulatory alignment and healthcare data compliance
- Demonstrated understanding of healthcare data governance, compliance requirements, and patient data security

**Key Skills Demonstrated:**
Full-stack development, healthcare systems, RESTful APIs, CI/CD implementation, regulatory compliance, component-driven architecture, Agile development, Spring Boot, system automation

---

## CORE PROJECTS & ACHIEVEMENTS

### 1. RAG (Retrieval-Augmented Generation) Production System
**Status:** Completed, Production Deployment  
**Timeline:** 2024-2025

**Problem Solved:** 
- Expensive and slow repeated API queries to LLM services
- Hallucination risk in LLM responses (factual accuracy concerns)
- Compliance and PII protection requirements for enterprise deployment
- Cost optimization for production systems

**Technical Implementation:**
- Python backend with semantic caching (Upstash Redis)
- Custom query expansion algorithms for improved retrieval
- Response grounding layer architecture for hallucination prevention
- Rate limiting and intelligent cost optimization
- Enterprise compliance considerations and data protection

**Deployment Architecture:**
- Frontend: Cloudflare Pages (React application)
- Backend: Cloudflare Workers Edge Functions
- Embedding Model: Cloudflare Workers AI bge-base-en-v1.5 (production), Ollama nomic-embed-text (local dev)
- LLM Provider: Groq API (production), Ollama (local development)
- Vector Database: Pinecone (serverless, 5k vectors)
- Caching Layer: Upstash Redis (semantic + exact caching, 6-24h TTL)
- Retrieval Methodology: Contextual Retrieval (Anthropic 2025 methodology, prepending LLM-generated context)

**Quantified Results:**
- Response latency: 8 seconds → sub-10 milliseconds (with intelligent caching)
- API cost reduction: significant monthly→ $0 (through semantic caching strategy)
- Hallucination prevention: 100% factual accuracy on validation dataset
- Retrieval improvement: 49% better accuracy vs standard RAG (via Contextual Retrieval)
- System deployed to production with PII protection and rate limiting
- Zero infrastructure management overhead (free tier: Cloudflare Pages, Workers, Workers AI; Pinecone free tier; Upstash free tier)

**Skills Demonstrated:**
- Production system architecture and reliability engineering
- LLM orchestration and prompt engineering
- Semantic search, vector embeddings, and caching optimization
- Cost optimization under constraints (building at $0/month)
- Python backend development
- Compliance-aware system design
- Edge computing and serverless architecture
- Production-grade error handling and monitoring

**Use For:** AI/LLM Engineer roles, Senior AI positions, production reliability, enterprise AI integration, cost optimization roles, LLM deployment expertise

**Blog Documentation:** Systematic learning documented on portfolio website covering RAG implementation, Contextual Retrieval methodology, cost optimization thinking

---

### 2. NIFTY 50 Stock Forecasting System
**Status:** Completed, Production Deployment (with Streamlit GUI)  
**Timeline:** 2024

**Problem Solved:** 
- Predict stock market behavior with statistical rigor (not just neural networks)
- Demonstrate mature time-series forecasting capability (walk-forward validation, not train-test leakage)
- Build production-ready ML pipeline with complete automation
- Combine deep learning and statistical approaches optimally

**Technical Implementation:**
- LSTM (Long Short-Term Memory) neural networks using TensorFlow/Keras for temporal pattern recognition
- ARIMA (AutoRegressive Integrated Moving Average) statistical models for stationarity-aware forecasting
- Walk-forward validation methodology (proper time-series validation preventing data leakage)
- Ensemble approach combining neural and statistical methods
- Streamlit interactive dashboard for visualization and monitoring
- GitHub Actions CI/CD pipeline for automated deployment and retraining

**Quantified Results:**
- Dual-model ensemble approach achieving superior accuracy through complementary strengths
- MAPE (Mean Absolute Percentage Error): sub-3% on validation data (industry benchmark typically 5-8%)
- Walk-forward validation ensuring model robustness on truly unseen data (not leaked from training set)
- Automated pipeline with GitHub Actions reducing manual testing and deployment
- Production-ready system deployed on cloud infrastructure with monitoring
- Complete end-to-end ML pipeline demonstrating maturity

**Skills Demonstrated:**
- Time-series forecasting and statistical modeling expertise
- LSTM neural networks and deep learning (TensorFlow/Keras)
- ARIMA and classical statistical forecasting
- Walk-forward validation methodology (rigorous time-series validation)
- Ensemble modeling approaches (combining complementary models)
- Python data science pipeline design
- Streamlit for interactive data visualization and dashboarding
- GitHub Actions CI/CD pipeline automation
- Production ML pipeline architecture and deployment

**Narrative Value:**
- Shows understanding of when deep learning helps vs when statistics are more reliable
- Demonstrates rigorous validation methodology (not just train-test split)
- Proves ability to deliver end-to-end ML systems with production considerations
- Quantified accuracy results backing all claims

**Use For:** Data Science roles, ML Engineer positions, Data Analytics, forecasting/time-series analysis, financial modeling, data engineering, senior AI positions

**Blog Documentation:** Technical posts explaining ensemble approaches, walk-forward validation methodology, and lessons learned

---

### 3. TinyML Person Recognition System (Embedded Hardware)
**Status:** In Progress, Active Development  
**Timeline:** 2024-2025

**Problem Solved:** 
- Deploy AI model on severely resource-constrained embedded hardware
- Enable real-time on-device inference without cloud dependency
- Demonstrate end-to-end embedded AI capability from data to hardware
- Engineer for hardware constraints from design phase

**Technical Implementation:**
- Complete image preprocessing pipeline (OpenCV, data augmentation, normalization)
- TensorFlow/Keras model training with embedded deployment focus
- Integer quantization (Int8 model compression for embedded devices)
- TensorFlow Lite conversion for embedded deployment
- Microcontroller simulation and validation testing
- Edge Impulse integration for embedded ML workflows

**Project Pipeline Stages:**
1. Data collection and preprocessing (image normalization, augmentation, validation)
2. Model architecture design with embedded constraint awareness
3. Training with optimization for accuracy-vs-size tradeoff
4. Quantization converting floating-point to 8-bit integer representation
5. TensorFlow Lite conversion for microcontroller-compatible format
6. MCU simulation and validation testing for real hardware scenarios

**Quantified Results:**
- Full end-to-end embedded system design demonstrating constraint-aware engineering from day one
- Model compression: 95% size reduction through Int8 quantization while maintaining accuracy
- Real-time on-device inference without cloud dependency (< 100ms latency target)
- Deployment pipeline for microcontroller firmware with edge deployment
- Complete understanding of hardware-software integration tradeoffs

**Skills Demonstrated:**
- Constraint-aware engineering (hardware-limited environments)
- Embedded systems programming and deployment
- Model optimization and quantization techniques (Int8, pruning)
- TensorFlow/Keras and TensorFlow Lite expertise
- Computer vision preprocessing (OpenCV)
- Microcontroller programming and MCU integration
- Real-time system design and performance optimization
- Technical documentation and systematic learning documentation
- Specialized domain learning methodology

**Narrative Value:**
- Shows ownership of complex end-to-end systems
- Demonstrates ability to work in severely constrained environments
- Proves learning methodology on unfamiliar domains (embedded ML, quantization, MCU)
- Evidence of continuous learning (documented on blog)
- Hardware-first thinking beyond academic prototypes

**Use For:** Embedded systems roles, edge AI positions, IoT engineer, ML engineers, constraint optimization roles, robotics, hardware-software integration, learning ability demonstration

**Blog Documentation:** Posts on quantization, embedded deployment, and constraint-aware design

---

### 4. SignalDock (IoT Architecture)
**Status:** Production

**Problem Solved:** IoT device communication and data flow orchestration

**Technical Implementation:**
- MQTT message broker for publish-subscribe patterns
- Docker Compose microservices orchestration
- Modular microservices architecture enabling independent scaling
- Event-driven architecture for distributed systems

**Skills Demonstrated:**
- IoT system architecture and design
- MQTT protocols and pub-sub patterns
- Docker containerization and orchestration
- Microservices architecture
- Distributed systems design
- Event-driven programming

**Use For:** IoT roles, backend systems, infrastructure architecture, DevOps-adjacent positions

---

### 5. Production Automation Pipelines
**Status:** Multiple implementations in production

**Problem Solved:** Automated, scalable data processing and task automation

**Technical Implementation:**
- Batch processing for efficient large-volume handling
- Parallel execution for concurrent processing
- Cost optimization for cloud resource utilization
- Comprehensive error handling and recovery mechanisms
- Monitoring and alerting for production pipelines

**Skills Demonstrated:**
- Pipeline architecture and design
- Batch processing and parallelization
- Cost optimization and resource efficiency
- Production reliability and error handling
- Scalability engineering
- System observability and monitoring

**Use For:** Data engineering, backend systems, automation roles, infrastructure, DevOps

---

## TECHNICAL SKILLS - COMPREHENSIVE INVENTORY

### Programming Languages and Development
- **Python** (daily production use, data science, machine learning, automation scripting, data pipelines, REST APIs)
- **TypeScript** (full-stack applications, modern development, component architecture, production systems)
- **JavaScript** (web applications, API integration, modern frameworks)
- **R** (statistical analysis, data modeling, machine learning)
- **SQL** (database design, query optimization, data manipulation, production optimization)
- **Bash** (scripting, automation, system administration)
- **Angular** (expert level, component libraries, TypeScript frontend, production applications)

### Machine Learning and AI
- **LLM APIs and prompt engineering** (OpenAI, Anthropic Claude, Groq integration)
- **Retrieval-Augmented Generation (RAG)** (semantic search, vector embeddings, caching strategies, Contextual Retrieval)
- **TensorFlow and Keras** (model development, training optimization)
- **TensorFlow Lite** (embedded model deployment on microcontrollers)
- **LSTM networks** (Long Short-Term Memory, time-series forecasting, sequence modeling)
- **ARIMA models** (AutoRegressive Integrated Moving Average, statistical forecasting)
- **Walk-forward validation** (proper time-series validation methodology)
- **Model quantization** (Int8 compression, TensorFlow Lite conversion, 95%+ size reduction)
- **Ensemble methods** (combining complementary models optimally)

### Data Engineering & Databases
- **Vectorization and embeddings** (Ollama, Cloudflare Workers AI, semantic search)
- **Vector databases** (Pinecone serverless, indexing strategies)
- **Semantic caching** (Upstash Redis, cosine similarity, TTL management)
- **ETL/Data pipelines** (batch processing, parallelization, cost optimization)
- **Relational databases** (SQL optimization, normalized schema design)
- **Data quality** (preprocessing, validation, compliance)

### DevOps & Infrastructure
- **Cloudflare stack** (Pages, Workers, Workers AI, serverless deployment)
- **Docker** (containerization, Docker Compose microservices)
- **GitHub Actions** (CI/CD pipelines, automated testing, deployment automation)
- **CI/CD practices** (automated deployment, regression testing, release management)
- **Microservices architecture** (service design, deployment, scaling)
- **MQTT** (IoT messaging, pub-sub patterns)
- **Rate limiting and compliance** (enterprise security, PII protection)

### Frontend & UI
- **Angular** (production expert, component libraries, TypeScript)
- **React** (component architecture, state management)
- **Streamlit** (interactive dashboards, data visualization)
- **HTML/CSS** (semantic markup, responsive design)
- **Modern frontend tooling** (webpack, build optimization)

### Enterprise & Production
- **Regulatory compliance** (banking, healthcare, data protection)
- **Production reliability** (error handling, monitoring, uptime requirements)
- **Enterprise integration** (Salesforce, complex workflows)
- **Security** (authentication, authorization, secure data handling)
- **Scalability** (system design for growth)

### Soft Skills & Methodology
- **Production thinking** (constraints-first design, failure mode analysis)
- **Systematic learning** (documented on technical blog)
- **Cross-functional collaboration** (working with product, design, leadership)
- **Requirement translation** (business → technical solutions)
- **Problem-driven development** (understanding before tooling)
- **Documentation discipline** (clear, maintainable code and systems)
- **Agile & Scrum** (sprint planning, retrospectives, continuous delivery)

---

## PROJECT PORTFOLIO MATCHING FOR ROLES

| Role Type | Best Project | Why |
|-----------|---|---|
| Senior AI/LLM Engineer | RAG System | Production LLM deployment, cost optimization, enterprise considerations |
| Data Scientist | NIFTY 50 Forecasting | Statistical rigor, ensemble methods, walk-forward validation |
| ML Engineer | RAG + TinyML combo | Full stack: cloud deployment + embedded constraints |
| Data Engineer | RAG (Pinecone + Redis) | Vector DB, caching, semantic search, data pipeline |
| Backend Engineer | Banking systems + RAG | Production systems, API design, scalability |
| Embedded Systems | TinyML | Constraint-aware design, quantization, MCU deployment |
| IoT Engineer | SignalDock + MQTT | Event-driven architecture, distributed systems |
| Full-Stack | RAG (full pipeline) | Frontend + backend + infrastructure |
| DevOps/Infrastructure | GitHub Actions + Cloudflare | CI/CD, serverless, automation |

---

## QUANTIFIED ACHIEVEMENT SUMMARY

| Metric | Result | Project | Impact |
|--------|--------|---------|--------|
| Latency Reduction | 8s → <10ms | RAG | 800x faster (caching + optimization) |
| Cost Optimization | ∞% → $0 | RAG | Zero infrastructure cost (free tier) |
| Model Compression | 95% reduction | TinyML | Embedded deployment enabled |
| Accuracy (MAPE) | <3% | NIFTY 50 | Sub-benchmark industry performance |
| Retrieval Improvement | 49% boost | RAG (Contextual) | Better search results through methodology |
| Deployment Time | 90%+ reduction | CI/CD Pipeline | Automation benefit |
| Hallucination Rate | 0% | RAG grounding | 100% factual accuracy |

---

## CAREER NARRATIVE

**Foundation Phase (2021-2023):** 
Built production systems in regulated industries (healthcare, banking). Learned that production reliability and compliance are non-negotiable. Mastered full-stack development across multiple frameworks and domains. Developed problem-first philosophy.

**Specialization Phase (2023-2025):**
Deepened expertise in production-grade AI systems. Demonstrated constraint-aware engineering (from embedded TinyML at 95% compression to RAG systems at $0/month). Proved ability to learn specialized domains systematically (quantization, Contextual Retrieval, vector databases). Documented learning consistently for continued growth.

**Current Focus:**
Senior AI/LLM Engineer roles. Leading production-grade generative AI systems. Mentoring junior engineers. Pushing boundaries of what's possible with resource constraints. Systematic learning and documentation of new advancements in AI field.

---

## PROFESSIONAL VALUES

1. **Production Thinking First** - Constraints inform design, not optimization
2. **Systematic Learning** - Document and teach methodology to others
3. **Quantified Results** - Measure everything; claims backed by numbers
4. **Problem-Driven** - Understand domain before selecting technology
5. **Compliance & Safety** - Data protection and user safety non-negotiable
6. **Continuous Improvement** - Iterate, measure, optimize, repeat
7. **Cross-functional Collaboration** - Bridge business and technical concerns

---

## RECOMMENDATION PROFILE

**For Technical Interviews:**
- Prepared to discuss constraint-aware system design (embedded to cloud)
- Can explain complex architectures (RAG, time-series, microservices) clearly
- Understands tradeoffs in technology selection (cost vs accuracy, speed vs resources)
- Has quantified evidence for all claims

**For Leadership Engagement:**
- Communication skills to explain technical concepts to non-technical stakeholders (healthcare, banking background)
- Proven mentorship (junior team members, documented learning)
- Grit and resourcefulness (building at $0/month, learning unfamiliar domains)
- Business-aligned engineering (compliance, cost, reliability matter more than elegance)

**For Peer Collaboration:**
- Systematic approach to problem-solving
- Documentation discipline
- Open to feedback and continuous learning
- Values quality and craftsmanship in code
