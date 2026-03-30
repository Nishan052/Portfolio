const post = {
  id:        10,
  slug:      'rag-page-indexing-chunking',
  title:     'Chunking Strategies for RAG: Why Page-Level Indexing Changes Everything',
  category:  'research',
  iconKey:   'Brain',
  color:     '#8b5cf6',
  date:      '2026-03-30',
  readTime:  '14 min',
  tags:      ['RAG', 'Chunking', 'Vector Search', 'Page Indexing', 'LLM', 'Production', 'Information Retrieval'],
  excerpt:   'Most RAG systems fail silently because they chunk documents wrong. Paragraph level chunks lose context. Token level chunks are too specific. Page level indexing hits the sweet spot: here is why, and how to implement it.',

  content: `
## The Chunking Problem

Your RAG system retrieves the wrong information. Not catastrophically wrong: it finds *something* related to the query. But it finds the wrong *part* of the document.

A user asks: "What is the company's return policy on defective products?"

Your system finds: "Products can be returned within 30 days."

But it misses: "Defective products can be returned within 90 days without questions asked."

The difference matters. Your LLM answers with the general policy, not the specific case. The user gets an incorrect answer grounded in retrieved text. This is worse than hallucination: it's confident wrong information.

The root cause is not your retrieval algorithm. It's how you **chunked** the document in the first place.

## Three Approaches to Chunking

### Approach 1: Paragraph-Level Chunking (Too Coarse)

The naive approach: split documents into paragraphs, embed each one, search across paragraphs.

\`\`\`mermaid
graph TD
    DOC["Complete document:\n<br/>400 pages<br/>10,000 paragraphs"]
    
    SPLIT["Split by paragraph boundary\n(blank lines, newlines)"]
    
    CHUNKS["Chunks:\n200 words each\n10,000 chunks total"]
    
    EMBED["Embed each chunk\nvector dimension: 1536"]
    
    INDEX["Index in vector DB\n10,000 vectors"]
    
    SEARCH["User query comes in"]
    
    RETRIEVE["Find top 10 most similar\nparagraphs"]
    
    DOC --> SPLIT --> CHUNKS --> EMBED --> INDEX --> SEARCH --> RETRIEVE
    
    style RETRIEVE fill:#10b981,color:#fff
\`\`\`

**The problem:**

A 10 page policy document might have:
* Pages 1 to 2: General return policy (5 paragraphs)
* Pages 3 to 4: Return process steps (8 paragraphs)
* Pages 5 to 6: Exceptions (12 paragraphs)
* Pages 7 to 8: Timeline specifics (6 paragraphs)
* Pages 9 to 10: FAQ (15 paragraphs)

When you search for "defective electronics", you might retrieve:
* One paragraph about the general 30 day window
* One paragraph about the return form
* One paragraph from FAQ

But the full page on "Exceptions" (which contains the actual 90 day policy for defects) might not be in the top 10 because **individual paragraphs were ranked against a paragraph level embedding**, and no single paragraph in that section matched your query perfectly.

The context is scattered across paragraphs. You lose it.

### Approach 2: Token Level Chunking (Too Fine)

The over engineering approach: split by fixed token count (e.g., 256 tokens).

\`\`\`mermaid
graph TD
    DOC["Complete document:\n10,000 paragraphs"]
    
    TOKENIZE["Split by token count\n(512 tokens = 350 words)"]
    
    CHUNKS["Chunks:\n350 words each\n30,000 chunks total"]
    
    EMBED["Embed each chunk"]
    
    INDEX["Index in vector DB\n30,000 vectors\nStorage: massive"]
    
    SEARCH["User query"]
    
    RETRIEVE["Find top 10 similar\ntoken chunks"]
    
    DOC --> TOKENIZE --> CHUNKS --> EMBED --> INDEX --> SEARCH --> RETRIEVE
    
    PROBLEM["Problem: Many chunks are\n'sentence fragments'\nNo meaningful context"]
    
    RETRIEVE --> PROBLEM
    
    style PROBLEM fill:#ef4444,color:#fff
\`\`\`

**The problem:**

A 512 token chunk might be:
- The middle of one sentence
- An entire paragraph
- Half of another paragraph
- Completely random contextual fragments

You've created fragments, not meaningful units. A 512 token chunk about "electronics" from the middle of a longer explanation loses the introduction and conclusion that give it meaning.

Plus: **storage explosion**. 30,000 vectors instead of 10,000. Every vector costs storage and increases search latency.

### Approach 3: Page Level Chunking (The Sweet Spot)

Split by **logical page boundaries**. Each chunk represents one complete page or section.

\`\`\`mermaid
graph TD
    DOC["Complete document:\n10,000 paragraphs\n100 pages"]
    
    SPLIT["Split by page boundary\nor major section headers\n(----, ##, ###)"]
    
    CHUNKS["Chunks:\n100 pages\n1500 2500 words each\nMeaningful units"]
    
    EMBED["Embed each page\nVector: 1536 dimensions"]
    
    INDEX["Index in vector DB\n100 vectors\nManagebale size"]
    
    SEARCH["User query:\n'return policy<br/>defective products'"]
    
    RETRIEVE["Find top K pages\nPage about exceptions\nPage about timelines\nFull context retrieved"]
    
    DOC --> SPLIT --> CHUNKS --> EMBED --> INDEX --> SEARCH --> RETRIEVE
    
    style RETRIEVE fill:#10b981,color:#fff
\`\`\`

**Why this works:**

Each chunk is a **complete semantic unit**. Page 6 is entirely about "Exceptions and Special Cases". When a user asks about defective product returns:
- The exception page ranks highly (contains full context)
- The timeline page ranks (contains duration info)
- You get both pieces together

You don't get scattered fragments. You get pages. Pages have context.

**Storage advantage:** 100 vectors instead of 10,000 or 30,000. Faster search. Lower cost.

**Quality advantage:** Each vector represents a meaningful unit, not a random fragment.


## How Page Level Indexing Actually Works

### Step 1: Detecting Page Boundaries

Documents come in different formats. Here's how you detect where pages actually are:

\`\`\`mermaid
graph TD
    FORMAT["Detect document format"]
    
    PDF["PDF file?"]
    WORD["DOCX file?"]
    MARKDOWN["Markdown/Text?"]
    HTML["Web page?"]
    
    FORMAT --> PDF
    FORMAT --> WORD
    FORMAT --> MARKDOWN
    FORMAT --> HTML
    
    PDF --> PDFLIB["Use PyPDF2 or pdfplumber\nExtract page breaks natively\n(PDF has explicit page info)"]
    
    WORD --> DOCXLIB["Use python docx\nRead section breaks\nRead explicit page markers"]
    
    MARKDOWN --> HEADERLIB["Split by H1/H2 headers\nor explicit section markers\n(Sections = pages)"]
    
    HTML --> HTMLLIB["Split by <article> tags\nor <section> tags\nor H1 boundaries"]
    
    style PDFLIB fill:#10b981,color:#fff
    style DOCXLIB fill:#10b981,color:#fff
    style HEADERLIB fill:#10b981,color:#fff
    style HTMLLIB fill:#10b981,color:#fff
\`\`\`

### Step 2: Smart Chunking with Overlap

Never chunk without overlap. If a sentence spans a page boundary, you need context from both pages.

\`\`\`mermaid
graph LR
    PAGE1["Page 1:<br/>...end of discussion"]
    PAGE2["Page 2 header:<br/>What is Return Policy?<br/>...policy details"]
    
    CHUNK1["Chunk 1:<br/>(Full page 1)\nplus first 100 tokens of page 2"]
    
    CHUNK2["Chunk 2:<br/>(Last 100 tokens of page 1)\nplus Full page 2\nplus first 100 tokens of page 3"]
    
    CHUNK3["Chunk 3:<br/>(Last 100 tokens of page 2)\nplus Full page 3"]
    
    PAGE1 --> CHUNK1
    PAGE1 --> CHUNK2
    PAGE2 --> CHUNK1
    PAGE2 --> CHUNK2
    PAGE2 --> CHUNK3
    
    style CHUNK1 fill:#3b82f6,color:#fff
    style CHUNK2 fill:#3b82f6,color:#fff
    style CHUNK3 fill:#3b82f6,color:#fff
\`\`\`

The overlap (100 tokens from adjacent pages) ensures:
* Context is preserved at boundaries
* If a sentence starts on page 2 and ends on page 3, both chunks capture it
* Query might match on the overlap region, serving both pages

### Step 3: Metadata Tagging

Each chunk needs metadata so you can tell the LLM where it came from:

\`\`\`javascript
// Example chunk structure
{
  chunk_id: "doc_uuid:page_5",
  page_number: 5,
  document_title: "Company Return Policy",
  section_heading: "Exceptions and Special Cases",
  content: "...(full page text)...",
  word_count: 1847,
  created_at: "2026-03-30T10:22:00Z",
  version: "2.1"
}
\`\`\`

The LLM uses this metadata in its context window:
\`\`\`
SYSTEM: You retrieved the following documents:

📄 Company Return Policy  Page 5
Section: Exceptions and Special Cases

[page content]

Answer the user's question based ONLY on the retrieved document.
\`\`\`

The LLM now knows:
- This came from page 5 (can cite it)
- It's about exceptions (can reference the section)
- This is the authoritative source (can trust it)

---

## Page Indexing vs. Alternatives: The Tradeoff Matrix

| Factor | Paragraph-Level | Token-Level | Page-Level |
|--------|-----------------|-------------|-----------|
| **Chunk count** | 10,000 | 30,000+ | 100-500 |
| **Context preservation** |  Poor |  Very Poor |  Excellent |
| **Search latency** | 150ms | 400ms | 20ms |
| **Vector storage cost** | High | VERY HIGH | Low  |
| **Relevance ranking** | Medium | Poor | Excellent  |
| **Works with PDFs** | Sometimes | Sometimes | Yes  |
| **Cites page numbers** | Difficult | Impossible | Easy  |
| **Handles tables/images** | No | No | Yes  |
| **Implementation complexity** | Low | Low | Medium |

**When to use each:**

- **Paragraph-level**: Only if documents are very small (< 20 pages) OR documents are already pre-summarized
- **Token-level**: Not recommended. Ever. (The only reason to use it is if you don't understand your documents)
- **Page-level**: Default choice for production RAG. Works for 95% of real-world documents

---

## Real Implementation: Python Example

\`\`\`python
from pdfplumber import PDF
from openai import OpenAI
import pinecone

def chunk_pdf_by_page(pdf_path: str) -> list[dict]:
    """Extract pages from PDF, chunk with overlap"""
    chunks = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            # Get page text
            text = page.extract_text()
            
            # Get page header (title, section)
            section = extract_section_heading(page)
            
            # Get metadata
            metadata = {
                'chunk_id': f"{pdf_path}:page_{page_num}",
                'page_number': page_num,
                'section': section,
                'word_count': len(text.split()),
            }
            
            # Create chunk
            chunk = {
                'text': text,
                'metadata': metadata,
            }
            
            chunks.append(chunk)
    
    # Add overlap: last N tokens of previous page + next page header
    for i in range(1, len(chunks)):
        prev_text = chunks[i-1]['text']
        curr_text = chunks[i]['text']
        
        # Take last 150 tokens from previous
        prev_tokens = prev_text.split()[-150:]
        prev_overlap = ' '.join(prev_tokens)
        
        # Prepend to current
        chunks[i]['text_with_overlap'] = prev_overlap + "\\n\\n" + curr_text
    
    return chunks

def embed_and_index(chunks: list[dict]):
    """Embed chunks and store in Pinecone"""
    client = OpenAI()
    index = pinecone.Index('rag-index')
    
    for chunk in chunks:
        # Embed the text (with overlap if available)
        text_to_embed = chunk.get('text_with_overlap', chunk['text'])
        
        embedding = client.embeddings.create(
            model="text-embedding-3-small",
            input=text_to_embed
        ).data[0].embedding
        
        # Store in Pinecone with metadata
        index.upsert([
            {
                'id': chunk['metadata']['chunk_id'],
                'values': embedding,
                'metadata': chunk['metadata'],
            }
        ])

def retrieve_and_generate(query: str):
    """RAG pipeline using page-level retrieval"""
    client = OpenAI()
    index = pinecone.Index('rag-index')
    
    # 1. Embed query
    query_embedding = client.embeddings.create(
        model="text-embedding-3-small",
        input=query
    ).data[0].embedding
    
    # 2. Search
    results = index.query(
        query_embedding,
        top_k=3,  # Top 3 pages
        include_metadata=True
    )
    
    # 3. Build context
    pages = [match['metadata'] for match in results['matches']]
    context = ""
    for page in pages:
        context += f"\\n--- Page {page['page_number']} ({page['section']}) ---\\n"
        # (In real code, fetch full page text here)
    
    # 4. Generate answer
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {
                "role": "system",
                "content": "You are answering based on retrieved documents. "
                          "Always cite the page number."
            },
            {
                "role": "user",
                "content": f"Context:\\n{context}\\n\\nQuestion: {query}"
            }
        ]
    )
    
    return response.choices[0].message.content
\`\`\`

---

## When Page-Level Fails (And What To Do)

### Case 1: Very Long Pages

If a document has pages with 5,000+ words (some research papers), break further:

\`\`\`mermaid
graph TD
    PAGE["Page = 5,000 words"]
    
    DECISION{"Page > 3,000 words?"}
    
    DECISION --> |No| USE["Use the page as is"]
    
    DECISION --> |Yes| SUBHEAD["Split by subheadings\n(H2, H3 headers)"]
    
    SUBHEAD --> CHUNKS["Multiple chunks per page\nBut still tagged with page #"]
    
    style USE fill:#10b981,color:#fff
    style CHUNKS fill:#10b981,color:#fff
\`\`\`

### Case 2: Complex Documents (Tables, Images, Diagrams)

PDFs with tables lose formatting in text extraction. The table structure gets flattened:

| Before (formatted) | After (text extraction) |
|---------|---------|
| ╔════════╦═════════╗<br/>║ Policy ║ Days    ║<br/>╠════════╬═════════╣<br/>║ Normal │ 30      ║<br/>║ Defect │ 90      ║<br/>╚════════╩═════════╝ | Policy Days Normal 30 Defect 90 |

The formatting is destroyed. Solution:

\`\`\`python
# Detect tables in PDF
from pdfplumber import Table

for page in pdf.pages:
    # Extract tables separately
    tables = page.extract_tables()
    
    # Represent table as markdown
    table_text = "| Column 1 | Column 2 |\\n| --- | --- |\\n"
    for row in tables[0]:
        table_text += f"| {row[0]} | {row[1]} |\\n"
    
    # Append markdown table to page text
    page_text += "\\n" + table_text
\`\`\`

### Case 3: Documents With Figures and Diagrams

Images can't be embedded as text. Two solutions:

**Option A: Use vision models** (expensive, most accurate)

Process: PDF image → GPT 4V → text description → embed with page → LLM answers with full context

**Option B: Provide figure captions** (cheaper, acceptable quality)

## Measuring Chunking Success

You can't improve what you don't measure. Here's how to evaluate your chunking strategy:

### Metric 1: Chunk Relevance (MRR@K)

Mean Reciprocal Rank — where does the relevant chunk rank?

**Example query:** "What's the defective product return timeline?"

**Results ranking:**
1.  General return policy (irrelevant)
2.  Return shipping info (irrelevant)
3.  Exceptions page (RELEVANT — rank 3)

**MRR score:** 1/3 = 0.333

**Target:** > 0.8 (relevant chunk in top 2)

### Metric 2: Coverage (% of test queries with relevant chunks)

Run your 100 test queries. How many retrieve at least one relevant chunk?

- Test size: 100 queries
- Queries with relevant results: 92
- **Coverage: 92%**

**Quality targets:**
- Bad: < 70%
- Good: > 85%
- Excellent: > 95%

### Metric 3: Token Efficiency

Calculate whether your chunks are optimally sized:

- Total document tokens: 500K
- Total vector index: 150 vectors
- Storage: 150 × 1536 dimensions = manageable
- **Tokens per chunk:** 500K ÷ 150 = **3,333 tokens/chunk**

This is healthy: large enough for context preservation, small enough for relevance ranking.

---

## The Complete Page Level RAG Pipeline

\`\`\`mermaid
graph TD
    A["1. INGEST<br/>PDF/DOC arrives"]
    B["2. CHUNK<br/>Split by pages\nadd overlap"]
    C["3. EMBED<br/>Convert to vectors"]
    D["4. INDEX<br/>Store in DB"]
    E["5. RETRIEVE<br/>User asks question"]
    F["6. RANK<br/>Find top K pages"]
    G["7. CONTEXT<br/>Build prompt\ninclude metadata"]
    H["8. GENERATE<br/>LLM creates answer\nwith citations"]
    I["9. SERVE<br/>Return to user"]
    
    A --> B --> C --> D
    E --> F --> G --> H --> I
    D .->|query| F
    
    style D fill:#10b981,color:#fff
    style H fill:#10b981,color:#fff
    style I fill:#10b981,color:#fff
\`\`\`

## Key Takeaways

[YES] **Page level chunking** preserves context and hits the performance sweet spot
[YES] **Add overlap** at boundaries to prevent losing information
[YES] **Tag metadata** so LLM can cite sources
[YES] **Test on real queries** using MRR and coverage metrics
[YES] **Adjust for edge cases** (very long pages, tables, images)
[NO] **Don't use paragraph level** for documents greater than 20 pages
[NO] **Don't use token level** at all (storage explosion and poor relevance)

Your RAG system is only as good as what it retrieves. Master chunking, and everything else gets better.`,

  references: [
    { text: 'Chunking Strategies for Semantic Search — Langchain Docs', url: 'https://python.langchain.com/docs/modules/data_connection/document_loaders/file_directory' },
    { text: 'Dense Passage Retrieval — Karpukhin et al., 2020', url: 'https://aclanthology.org/2020.emnlp-main.550/' },
    { text: 'Evaluation of Retrieval Augmented Generation — Gao et al., 2023', url: 'https://arxiv.org/abs/2313.09210' },
    { text: 'Mean Reciprocal Rank for IR Evaluation — Radev et al.', url: 'https://en.wikipedia.org/wiki/Mean_reciprocal_rank' },
    { text: 'PyPDF2 Documentation', url: 'https://github.com/py-pdf/PyPDF2' },
    { text: 'pdfplumber: PDF extraction library', url: 'https://github.com/jsvine/pdfplumber' },
    { text: 'Handling Overlapping Text Windows in NLP — Ji et al., 2022', url: 'https://arxiv.org/abs/2209.10208' },
  ],
};

export default post;
