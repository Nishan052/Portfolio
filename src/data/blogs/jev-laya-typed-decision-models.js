const post = {
  id:        26,
  slug:      'jev-laya-typed-decision-models',
  title:     'Jev and Laya: why AI agents started asking for decisions, not text',
  category:  'news',
  iconKey:   'Bot',
  color:     '#a855f7',
  date:      '2026-10-06',
  readTime:  '4 min',
  tags:      ['AIAgents', 'DecisionModels', 'Jev', 'Laya', 'LLMOps', 'Calibration'],
  excerpt:   'Most calls inside an AI agent are small decisions, not writing. Jev and Laya answer them in one pass, and that is why the model class appeared.',

  content: `
## Most of an agent's calls are not writing

Open the log of a working AI agent and count what each model call is for. Very few write anything a person reads. Most are small decisions. Which tool next. Is this ticket urgent. Did the last step succeed. Is this email phishing.

Belcak and colleagues at NVIDIA made the same observation in 2025: most work inside an agent is narrow, repeated, and has a fixed answer format. Yet every one of those decisions still goes to a model built to write.

## Why a writing model is the wrong shape for a decision

A large language model answers by generating text one token at a time. For a decision, that causes four problems.

1. It is slow. The answer waits on sequential generation, often with reasoning in front of it.
2. It can answer outside the menu. Asked which tool to call, it can name a tool that does not exist, because any token is allowed.
3. The answer has to be parsed. Structured output modes fix the format, not the cost.
4. It gives no honest confidence. The GPT-4 technical report showed chat-style post-training made the model's stated confidence less calibrated than the base model's.

## What Jev and Laya do instead

TypeSafe AI released **Jev** on 15 September 2026. Three days later Convai released **Laya**, an open-weights alternative under Apache 2.0. TypeSafe calls them **System One models**, after Kahneman's fast, intuitive mode of thinking.

Both take some state as text plus a typed question whose answers you define before the call. There are three question types. Choice picks one option. Score rates against a rubric. Noul returns the probability that a statement is true.

\`\`\`mermaid
flowchart TD
    A[Agent state as text] --> B[LLM]
    B --> C[Tokens one at a time]
    C --> D[Parse and validate]
    D --> E[Answer with no usable confidence]
    A --> F[Typed decision model]
    G[Question and allowed options] --> F
    F --> H[One allowed option with probabilities in one pass]
\`\`\`

*The same state, two paths. The typed model never generates text, so its answer is always one of the options you supplied.*

A made-up tool name is impossible by construction, and the probability lets code act on confidence: proceed above 0.9, escalate below it. Laya shows how this works in the open. It is a 421M parameter encoder built on ModernBERT that reads the whole state once and scores every option at the same time.

| | Jev | Laya |
|---|---|---|
| Access | Hosted API | Open weights, Apache 2.0 |
| Size | Not disclosed | 421M (English checkpoint) |
| Speed (vendor figures) | 70 to 500 ms per call | 33 ms per question on a T4 |
| Zero-shot accuracy | 67.8% on TypeSafe's eval | Below majority baseline on its own card |

## Where the claim gets thinner

The speed and cost gains are large. On TypeSafe's own four-workflow eval, Jev matched a frontier model's 67.9% at $0.0004 per case instead of $0.0304, in 0.4 seconds instead of 10.1.

Accuracy is a different story. An early review of 28 studies found the typed output has not yet shown an accuracy edge over simply reading label probabilities from an ordinary model. And "cannot hallucinate" covers the format only. Check Point's strongest prompt injection broke Jev in 25 of 27 runs. A typed answer can still be the wrong option, picked because a document told it to.

## What to do with this

Find the calls in your agent that have a fixed answer set and run thousands of times a day. Those are the candidates. Keep the LLM for writing, extraction, and anything open-ended. Before you swap, run a labelled sample of your own traffic through both. The vendor benchmark is not your traffic.
`,

  references: [
    {
      text: 'TypeSafe AI (2026) Jev API Documentation.',
      url: 'https://docs.typesafe.ai'
    },
    {
      text: 'Convai Innovations (2026) Laya: model card and checkpoints. Hugging Face.',
      url: 'https://huggingface.co/convaiinnovations/laya'
    },
    {
      text: 'Tang, L. & Zheng, Y. (2026) "Typed Decision Models: An Early Evidence Audit and Evaluation Checklist". arXiv:2609.32160.',
      url: 'https://arxiv.org/abs/2609.32160'
    },
    {
      text: 'Check Point Research (2026) "A Decision Model Breaks Like Any Other Language Model: A First Look at Jev". Check Point Blog.',
      url: 'https://blog.checkpoint.com/ai-security/jev-is-not-a-language-model-but-it-breaks-like-one-prompt-injection-against-a-typed-decision-model/'
    },
    {
      text: 'Belcak, P. et al. (2025) "Small Language Models are the Future of Agentic AI". arXiv:2506.02153.',
      url: 'https://arxiv.org/abs/2506.02153'
    },
    {
      text: 'OpenAI (2023) GPT-4 Technical Report. arXiv:2303.08774.',
      url: 'https://arxiv.org/abs/2303.08774'
    }
  ]
};

export default post;
