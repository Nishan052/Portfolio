const post = {
  id:        8,
  slug:      'rag-deployment-testing-monitoring',
  title:     'From Prototype to Production: Deploying, Testing & Monitoring RAG',
  category:  'research',
  iconKey:   'Rocket',
  color:     '#f59e0b',
  date:      '2026-03-15',
  series:      'Production RAG',
  part:      2,
  readTime:  '16 min',
  tags:      ['RAG', 'Production', 'Deployment', 'Testing', 'Monitoring', 'Observability', 'FastAPI', 'Serverless'],
  excerpt:   'How I\'d move a RAG prototype into production with serverless deployment, quality tests before each release and monitoring for silent failures.',

  content: `
## The Production Gap

Let's say your RAG system works perfectly in a Jupyter notebook, so you feed it a question, it retrieves the right chunks and the LLM writes a perfect answer. Then you deploy it, and one week later a real user gets a hallucination, another complains about latency spikes, and your LLM API bill is 300% higher than projected, with no visibility into any of it.

That's the production gap between a working prototype and a system real people depend on, and for me closing it comes down to three things: deploying it without servers, knowing it's actually working, and seeing what broke before users notice. Those are the three parts of this post.

---

## Part 1: Deploying RAG to Serverless

### The Cold Start Problem

There are two ways to run your RAG system. With a traditional server you rent a computer in a data center 24/7, so it's always ready, and you pay $100/month whether it gets 10 requests or 10,000. With serverless you only pay when someone actually uses it, but the first time someone asks a question the system has to "boot up" by loading all the code and dependencies, and that takes a few seconds.

\`\`\`mermaid
flowchart LR
    subgraph traditional["Traditional Server"]
        direction TB
        S["Server running 24/7
Always warm
~10ms response"]
        C["Cost: $100/month
Whether you use it or not"]
        S --- C
    end

    subgraph serverless["Serverless (Lambda)"]
        direction TB
        S2["At rest: $0/month
On request: ~2-3s boot
Then ~500ms response"]
        C2["Cost: ~$0.20-0.60/1M requests
(depends on execution time)
Pay only when used"]
        S2 --- C2
    end

    style traditional fill:#ef4444,color:#fff
    style serverless fill:#10b981,color:#fff
\`\`\`

For a portfolio or hobby project serverless costs $0/month, while a server costs money even when nobody visits, so we choose serverless, and my own portfolio chatbot runs at no monthly cost the same way. The catch is that the 2-3 second startup delay happens one in five times, and the user who gets unlucky and triggers it sees a slow response, which is the "cold start" problem.

### Understanding the Startup Sequence

When a user asks your RAG system a question for the first time, this is what happens:

\`\`\`mermaid
flowchart TD
    U["User asks: 'Who are you?'"]
    U --> CHECK["System checks:
Do I have a warm copy running?"]
    CHECK --> WARM{"Already
running?"}
    
    WARM -- "NO (cold start)" --> DOWNLOAD["Download all code
and libraries from storage
~2 seconds"]
    DOWNLOAD --> INIT["Load the AI models
Load the database connections
~1 second"]
    WARM -- "YES (warm)" --> QUICK["SKIP this entire section
~10 milliseconds"]
    
    INIT --> RUN["Run the RAG pipeline
Retrieve chunks
Generate answer
~500ms"]
    QUICK --> RUN
    RUN --> ANSWER["User sees answer"]
    
    style DOWNLOAD fill:#ef4444,color:#fff
    style INIT fill:#ef4444,color:#fff
    style QUICK fill:#10b981,color:#fff
\`\`\`

So the tradeoff is that serverless is cheap but sometimes slow, and traditional servers are always fast but always expensive.

### Solution 1: Package Everything Into a Container

I think of a RAG system like a shipping container. Without one you send just your code and hope the server has Python installed, hope it has the right libraries in the right versions and hope the vector database client works. With a container you ship everything together, meaning your code, Python, all the libraries and all the configurations, like a complete meal kit instead of a list of ingredients. The container is a sealed package, so when it boots everything is already there, and there's nothing left to download, install or hope for.

\`\`\`mermaid
graph LR
    subgraph "Without Container"
        CODE["Just your code"]
        PRAY["Hope Python
is installed
Hope libraries match
Hope configs work"]
        CODE --> PRAY
    end
    
    subgraph "With Container"
        PKG["Everything sealed
Python ✓
Libraries ✓
Configs ✓"]
    end
    
    style PRAY fill:#ef4444,color:#fff
    style PKG fill:#10b981,color:#fff
\`\`\`

This cuts startup time from 5+ seconds to 2-3 seconds.

### Solution 2: Keep Expensive Objects "Warm"

Your RAG system has some expensive things to load, like the connection to your vector database (Pinecone), the LLM client (Groq, OpenAI, Claude) and sometimes even the embedding model itself. Instead of loading these fresh every time, you load them once and reuse them. It's like turning on an oven, where the first time takes a minute, but if you leave it on and make 50 dishes, each one cooks quickly.

\`\`\`mermaid
graph LR
    subgraph "Reload Every Time (Slow)"
        direction TB
        Q1["User asks Q1"]
        LOAD1["Boot database
500ms"]
        ANS1["Answer Q1"]
        Q2["User asks Q2"]
        LOAD2["Boot database again
500ms"]
        ANS2["Answer Q2"]
        Q1 --> LOAD1 --> ANS1 --> Q2 --> LOAD2 --> ANS2
    end
    
    subgraph "Keep Warm (Fast)"
        direction TB
        Q3["User asks Q1"]
        LOAD3["Boot database once
500ms"]
        ANS3["Answer Q1
Database still warm"]
        Q4["User asks Q2"]
        ANS4["Answer Q2
Database still warm
~0ms overhead"]
        Q3 --> LOAD3 --> ANS3 --> Q4 --> ANS4
    end
    
    style LOAD1 fill:#ef4444,color:#fff
    style LOAD2 fill:#ef4444,color:#fff
    style LOAD3 fill:#f59e0b,color:#000
    style LOAD4 fill:#10b981,color:#fff
    style ANS4 fill:#10b981,color:#fff
\`\`\`

### Solution 3: Cost Tracking

Every call to an LLM costs money, and as of early 2026, GPT-4 costs around $0.03 per 1,000 input tokens, while Claude costs slightly more and Groq costs less but still adds up.

Your RAG system also makes two LLM calls per user question, one to generate sub-questions so it searches better and one to generate the final answer. So if 1,000 people ask 10 questions each, that's 20,000 LLM calls, and at roughly $0.02–0.04 per query depending on the LLM, that's $400–800 without you knowing it's happening. The fix is to track every API call and count its tokens, so you can see where the money goes.

\`\`\`mermaid
graph LR
    U["1,000 unique users"]
    Q["Each asks 10 questions
10,000 questions total"]
    CALLS["2 LLM calls per question
20,000 API calls total"]
    COST["~$600 in costs
You had no idea"]
    
    U --> Q --> CALLS --> COST
    
    style COST fill:#ef4444,color:#fff
\`\`\`

Once you track it, the places to save start to show. If the same questions keep coming in, you cache the answer, which is how my portfolio chatbot answers repeat questions almost instantly. If query expansion is expensive, maybe 5 sub-questions are enough instead of 10, and if one user is asking way more than everyone else, maybe they're a bot.

---

## Part 2: Testing RAG Quality

### Why Testing RAG is Different From Regular Software

When you test a traditional app, you can be precise:
- Input: 5 + 3
- Expected output: 8
- Actual output: 8
- Result: Pass

With RAG and LLMs there's no single "correct" answer:
- Input: "Who are you?"
- Expected output: Could be many valid versions
- Actual output: A reasonable answer grounded in documents
- Result: Is it "good"?

You can't write a test that checks whether an answer is correct, because "correct" is fuzzy, so instead you check two different things:

1. Did retrieval find the right chunks? (measurable)
2. Did the LLM avoid hallucinating? (harder, but possible)

### Test 1: Did Retrieval Find the Right Answer Source?

Let's say you ask *"What languages does Nishan know?"* Your system should find the chunks about programming languages, and this is how you test whether it does:

\`\`\`mermaid
flowchart TD
    SETUP["Create test cases<br/>Question + expected chunk IDs"]
    RUN["Run real RAG retrieval<br/>on each test question"]
    CHECK["Did we retrieve<br/>the expected chunks?"]
    SCORE["Precision@10<br/>What % of top 10 were relevant?"]
    DECIDE["If Precision < 80%<br/>Don't deploy"]
    
    SETUP --> RUN --> CHECK --> SCORE --> DECIDE
    
    style DECIDE fill:#ef4444,color:#fff
\`\`\`

Example test:
- Question: "What projects has Nishan built?"
- We should find chunks about: stock prediction, barcode detection, face verification, RAG system
- If we retrieve 10 chunks and 8 of them are relevant: Precision = 80% (pass)

This matters because if retrieval fails, the LLM gets garbage as input and produces garbage, so I'd always test retrieval first.

---

### Test 2: Is the LLM Making Stuff Up?

This is the hallucination problem from Week 1, where the LLM reads your document and confidently invents details that aren't in it. You can't automatically know whether an answer is right, but you can detect when it's definitely wrong, which is when it contradicts the source material.

It works like a fact-checker:
- Document says: "I built this system in 2024"
- LLM says: "I built this system in 2026"
- Fact-checker flags: "Document contradicts answer" (fail)

\`\`\`mermaid
graph LR
    LLM["LLM generates answer"]
    DOC["Retrieved document"]
    CHECK["Does document support<br/>this answer?<br/>Or contradict it?"]
    
    CHECK --> SUPPORT["Supported ✓<br/>Answer grounded<br/>in source"]
    CHECK --> CONTRA["Contradicted ✗<br/>LLM made stuff up<br/>Flag for review"]
    CHECK --> NEUTRAL["Neutral ?<br/>Document doesn't<br/>mention it<br/>Be cautious"]
    
    style CONTRA fill:#ef4444,color:#fff
    style SUPPORT fill:#10b981,color:#fff
    style NEUTRAL fill:#f59e0b,color:#000
\`\`\`

If more than 5% of answers land in the "contradicted" bucket, something is wrong and I wouldn't deploy.

### Test 3: Answer Quality Compared to a Reference

For common questions where you already know a good answer, you can measure how similar the LLM's answer is to it.

\`\`\`mermaid
graph LR
    Q["Question:<br/>What technologies<br/>do you use?"]
    
    EXPECTED["Expected/Reference answer:<br/>React, Python, TensorFlow,<br/>FastAPI, Vector databases"]
    
    LLM_ANSWER["LLM answer:<br/>I work with React frontend<br/>Python backend, machine<br/>learning via TensorFlow"]
    
    COMPARE["Measure similarity<br/>using ROUGE/BLEU metrics<br/>0 = nothing matches<br/>1 = perfect match"]
    
    Q --> EXPECTED
    Q --> LLM_ANSWER
    EXPECTED --> COMPARE
    LLM_ANSWER --> COMPARE
    
    COMPARE --> SCORE["Similarity score: 0.72<br/>Good enough ✓"]
\`\`\`

### Pre-Deployment Safety Net

Put together, the three tests become a quality gate that every change has to pass:

\`\`\`mermaid
graph TD
    CHANGE["You update the system<br/>New model? New chunks?<br/>New prompt?"]
    
    TEST1["Test: Retrieval Precision<br/>Did we retrieve relevant chunks?"]
    TEST2["Test: Hallucination Rate<br/>Is the LLM making stuff up?"]
    TEST3["Test: Answer Quality<br/>Do answers match reference?"]
    
    REVIEW["Review all results"]
    
    DECISION{"All tests pass?"}
    
    CHANGE --> TEST1
    CHANGE --> TEST2
    CHANGE --> TEST3
    
    TEST1 --> REVIEW
    TEST2 --> REVIEW
    TEST3 --> REVIEW
    
    REVIEW --> DECISION
    
    DECISION -- "YES
All metrics healthy" --> DEPLOY["Deploy to production
✓"]
    DECISION -- "NO
Something degraded" --> FIX["Fix and retry
← Go back to testing"]
    
    style DEPLOY fill:#10b981,color:#fff
    style FIX fill:#ef4444,color:#fff
\`\`\`

Without this gate you risk shipping a broken RAG system to real users. At Georg Schröder the assistant I work on can be updated without going offline and rolled back after a bad update, and for me a gate like this belongs in front of every one of those updates.

---

## Part 3: Monitoring in Production

### The Silent Failure Problem

Now your RAG system is live, users are asking questions and the system is returning answers, but something is slowly breaking. Answers are becoming less relevant as retrieval drifts, hallucinations are increasing as quality degrades, API costs are climbing as expensive paths get used, and responses are getting slower. You have no idea any of it is happening.

That's the silent failure problem, where the system never crashes and just slowly gets worse while users suffer.

\`\`\`mermaid
graph TD
    W1["Week 1: System deployed
Quality: Good
Cost: $50
Speed: 500ms"]
    W2["Week 2: No visibility
Quality: Degrading
Cost: $120
Speed: 800ms"]
    W3["Week 3: Still no alerts
Quality: Bad
Cost: $300
Speed: 2000ms"]
    W4["Week 4: User complains
Too late.
Fix is urgent."]
    
    W1 --> W2 --> W3 --> W4
    
    style W4 fill:#ef4444,color:#fff
\`\`\`

### The Solution: Dashboards

A dashboard works like a health monitor, where you can see at a glance whether the system is working, how fast it is, how much it costs and whether the answers are getting worse.

\`\`\`mermaid
graph TD
    SOURCES["User requests
API responses
LLM token counts
Database queries"]
    
    TRACKING["Collect metrics
Latency, tokens, quality"]
    
    STORE["Store in database
(CloudWatch, DataDog, etc)"]
    
    VIZ["Visualize in dashboard"]
    
    SOURCES --> TRACKING --> STORE --> VIZ
    
    DASH["Dashboard shows<br/>green = healthy<br/>red = broken"]
    
    VIZ --> DASH
    
    style DASH fill:#10b981,color:#fff
\`\`\`

These are the metrics I'd put on the dashboard.

### Key Metrics to Watch

| Metric | What it means | Red flag |
|--------|---------------|----------|
| Response time (p95) | How long until the user sees their answer? | > 2.5 seconds |
| Cache hit rate | Are we avoiding expensive LLM calls? | < 70% |
| Retrieval accuracy | Are we finding relevant chunks? | < 80% |
| Tokens per query | How much are we spending per request? | > $0.01 per query |
| Hallucination rate | Are answers contradicted by documents? | > 5% |
| LLM refusal rate | How often does the LLM say "I don't know"? | > 15% |

\`\`\`mermaid
graph LR
    HEALTHY["All metrics green<br/>Response: 800ms<br/>Cache: 75%<br/>Tokens: 250<br/>Hallucination: 2%<br/>Cost: $0.003"]
    
    DEGRADED["Some metrics yellow<br/>Response: 1500ms↑<br/>Cache: 45%↓<br/>Tokens: 500↑<br/>Hallucination: 8%↑<br/>Cost: $0.008↑"]
    
    CRISIS["Metrics red<br/>Response: 4000ms<br/>Cache: 10%<br/>Tokens: 2000<br/>Hallucination: 25%<br/>Cost: $0.05"]
    
    style HEALTHY fill:#10b981,color:#fff
    style DEGRADED fill:#f59e0b,color:#000
    style CRISIS fill:#ef4444,color:#fff
\`\`\`

### Detecting When Things Break

You can't stare at dashboards 24/7, so you set up alerts that notify you as soon as a metric goes bad.

\`\`\`mermaid
graph TD
    METRIC["Metric measured:
Latency = 3000ms"]
    
    CHECK{"Is it above
the alert threshold?<br/>Threshold: 2500ms"}
    
    CHECK -- "No, still healthy" --> OK["✓ Continue monitoring"]
    
    CHECK -- "Yes, something's wrong" --> ALERT["Alert triggered"]
    
    ALERT --> NOTIFY["Slack notification
Email
PagerDuty
etc"]
    
    NOTIFY --> ONCALL["On-call engineer
investigates"]
    
    style OK fill:#10b981,color:#fff
    style ALERT fill:#ef4444,color:#fff
    style ONCALL fill:#ef4444,color:#fff
\`\`\`

### Understanding Drift

Sometimes metrics decay slowly instead of breaking all at once, and that's called drift. Let's say retrieval precision moves like this over four months:
- Month 1: Retrieval precision = 92% (good)
- Month 2: Retrieval precision = 88% (still okay)
- Month 3: Retrieval precision = 84% (starting to worry)
- Month 4: Retrieval precision = 75% (broken)

\`\`\`mermaid
graph LR
    M1["Month 1
92%
✓"]
    M2["Month 2
88%
✓"]
    M3["Month 3
84%
⚠"]
    M4["Month 4
75%
✗"]
    
    M1 --> M2 --> M3 --> M4
    
    style M4 fill:#ef4444,color:#fff
    style M3 fill:#f59e0b,color:#000
\`\`\`

Each month the drop is tiny (4%), but it adds up until the system breaks, and that slow decline is drift. The fix is to track trends, so if a metric has been declining for 2 weeks, you alert even if it hasn't hit the hard threshold yet.

### When to Retrain (Automatically)

As the metrics degrade the system becomes outdated, and you need to retrain it, which can mean updating embeddings, reindexing documents or refreshing the model.

\`\`\`mermaid
graph TD
    CHECK["System check:
Any of these?"]
    
    D1["Documents added
or updated"]
    D2["Retrieval precision
drops < 80%"]
    D3["Query patterns
changed
(detected via drift)"]
    D4["Hallucinations
increasing
(> 8%)"]
    
    CHECK --> D1
    CHECK --> D2
    CHECK --> D3
    CHECK --> D4
    
    D1 --> ACTION1["Action:
Re-index documents"]
    D2 --> ACTION2["Action:
Re-embed and reindex"]
    D3 --> ACTION3["Action:
Analyze new patterns"]
    D4 --> ACTION4["Action:
Review + retrain model"]
    
    ACTION1 --> RUN["Automatic retraining job"]
    ACTION2 --> RUN
    ACTION3 --> RUN
    ACTION4 --> RUN
    
    RUN --> TEST["Run quality tests
(from Part 2)"]
    TEST --> DEPLOY["If tests pass: redeploy"]
    
    style DEPLOY fill:#10b981,color:#fff
\`\`\`

### Putting It Together: A Week in the Life

Let's say this is how one week goes:

\`\`\`mermaid
graph TD
    MON["Monday:
System healthy
All metrics green
No alerts"]
    
    WED["Wednesday:
Notice: retrieval precision = 84%
Down from 90%
Dashboard flags yellow"]
    
    INVESTIGATE["Engineer reviews:
What changed?
Ah, we added 50 new documents
But didn't reindex"]
    
    FRI["Friday:
Automatic retraining
Job runs overnight"]
    
    SAT["Saturday:
Quality tests pass
Retrained system deployed
Precision back to 91%
Alert clears"]
    
    MON --> WED --> INVESTIGATE --> FRI --> SAT
    
    style MON fill:#10b981,color:#fff
    style WED fill:#f59e0b,color:#000
    style INVESTIGATE fill:#f59e0b,color:#000
    style FRI fill:#f59e0b,color:#000
    style SAT fill:#10b981,color:#fff
\`\`\`

For me this is what good monitoring looks like, since you catch the problem early, understand it and fix it automatically, and users never know anything was wrong.

---

## Guardrail Metrics: The Triangle of Tradeoffs

RAG systems have three goals that pull against each other:

\`\`\`mermaid
graph TD
    Q["Quality
higher accuracy
fewer hallucinations"]
    S["Speed
faster responses
less latency"]
    C["Cost
lower API spend
fewer tokens"]
    
    Q --> S
    Q --> C
    S --> C
    
    style Q fill:#10b981,color:#fff
    style S fill:#f59e0b,color:#000
    style C fill:#ef4444,color:#fff
\`\`\`

You can't maximize all three, and these are some examples:

| Move | Quality ↑ | Speed ↓ | Cost ↑ |
|------|-----------|---------|---------|
| Add 10 query expansions | Better retrieval | +2 seconds | +$0.05 per query |
| Use larger LLM | Better answers | Slower generation | 2x cost |
| Retrieve top 20 instead of 10 | More context | Slower | More tokens |

Every optimization is a tradeoff, and guardrails stop you from optimizing one goal at the expense of another. So I'd define acceptable bounds before optimizing anything:
- Latency: p95 response < 2.5 seconds (hard limit)
- Cost: < $0.01 per query (don't spend $1 to save 1% hallucinations)
- Quality: < 5% hallucination rate (acceptable floor)

Before shipping any optimization, I'd run this check:
\`\`\`
Does quality improve? ✓
Does speed stay acceptable? ✓
Does cost stay below budget? ✓
→ Deploy

Does quality improve? ✓
But speed drops to 3 seconds? ✗
→ Reject (speed guardrail violated)
\`\`\`

---

## The Complete Picture

The whole thing is one loop: Deploy → Test → Monitor → Optimize → Deploy again.

\`\`\`mermaid
graph LR
    A["1. Deploy<br/>Put system<br/>in production"]
    B["2. Test<br/>Validate<br/>quality gates<br/>live"]
    C["3. Monitor<br/>Watch for<br/>degradation"]
    D["4. Understand<br/>Why metrics<br/>changed"]
    E["5. Optimize<br/>Test improvements<br/>vs guardrails"]
    F["Loop to 1"]
    
    A --> B --> C --> D --> E --> F
    F -.->|repeat every week| A
    
    style A fill:#6366f1,color:#fff
    style B fill:#10b981,color:#fff
    style C fill:#f59e0b,color:#000
    style D fill:#8b5cf6,color:#fff
    style E fill:#6366f1,color:#fff
\`\`\`

At this point your RAG system is live without servers, it's validated before anything goes out, you can see when it breaks, and it retrains automatically when it needs to.

There's still one problem left, though, which is knowing if your optimization choices are the right ones. You can't optimize by guessing, and you can't trust your gut about which prompt works better, whether reranking helps or whether query expansion is worth the cost. What you need is a systematic way to test changes against each other and see which one is actually better, and that's where we go next week.`,

  references: [
    { text: 'AWS Lambda: Container image support', url: 'https://docs.aws.amazon.com/lambda/latest/dg/images-create.html' },
    { text: 'FastAPI: Streaming responses', url: 'https://fastapi.tiangolo.com/advanced/streaming/' },
    { text: 'Groq: API documentation', url: 'https://console.groq.com/docs/speech-text' },
    { text: 'ROUGE metric: ACL 2019', url: 'https://aclanthology.org/N04-1014/' },
    { text: 'Hallucination in Neural Machine Translation: Raunak et al., 2021', url: 'https://aclanthology.org/2021.acl-long.326/' },
    { text: 'Entailment as an auxiliary task for semantic similarity: Chen et al., 2023', url: 'https://arxiv.org/abs/2206.10996' },
    { text: 'Monitoring ML systems: Google Cloud Best Practices', url: 'https://cloud.google.com/architecture/devops-patterns/monitoring-ml-systems' },
  ],
};

export default post;
