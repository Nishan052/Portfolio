const post = {
  id:        10,
  slug:      'rag-page-indexing-chunking',
  title:     'Chunking strategies for RAG: why page-level indexing keeps the context',
  category:  'research',
  iconKey:   'Brain',
  color:     '#8b5cf6',
  date:      '2026-03-30',
  series:      'Production RAG',
  part:      4,
  readTime:  '14 min',
  tags:      ['RAG', 'Chunking', 'Vector Search', 'Page Indexing', 'LLM', 'Production', 'Information Retrieval'],
  excerpt:   'When I built my RAG chatbot, the right answer was often in the database and still didn\'t come back, and the fix was how I chunked the documents.',

  content: `
## The Chunking Problem

When I built the RAG chatbot for my portfolio, many wrong answers had nothing to do with the model, because the right answer was in my database and search only found something related to it.

Let's say a user asks, "What is the company's return policy on defective products?" The system finds "Products can be returned within 30 days." and misses "Defective products can be returned within 90 days without questions asked." So the LLM answers with the general policy, which for me is worse than a hallucination because it sounds confident.

What fixed it for me was changing how the documents were chunked, and these are the three approaches I looked at.

## Three Approaches to Chunking

### Approach 1: Paragraph-Level Chunking (Too Coarse)

The simplest approach is to split documents into paragraphs, embed each one and search across all of them.

\`\`\`mermaid
graph TD
    DOC["Complete document:
<br/>400 pages<br/>10,000 paragraphs"]
    
    SPLIT["Split by paragraph boundary
(blank lines, newlines)"]
    
    CHUNKS["Chunks:
200 words each
10,000 chunks total"]
    
    EMBED["Embed each chunk
vector dimension: 1536"]
    
    INDEX["Index in vector DB
10,000 vectors"]
    
    SEARCH["User query comes in"]
    
    RETRIEVE["Find top 10 most similar
paragraphs"]
    
    DOC --> SPLIT --> CHUNKS --> EMBED --> INDEX --> SEARCH --> RETRIEVE
    
    style RETRIEVE fill:#10b981,color:#fff
\`\`\`

Let's say a 10 page policy document looks like this:
* Pages 1 to 2: General return policy (5 paragraphs)
* Pages 3 to 4: Return process steps (8 paragraphs)
* Pages 5 to 6: Exceptions (12 paragraphs)
* Pages 7 to 8: Timeline specifics (6 paragraphs)
* Pages 9 to 10: FAQ (15 paragraphs)

When you search for "defective electronics", you might get back:
* One paragraph about the general 30 day window
* One paragraph about the return form
* One paragraph from FAQ

The page on "Exceptions", which has the actual 90 day policy for defects, might not even make the top 10, because every paragraph was ranked on its own and none of them matched closely enough. The context is scattered across paragraphs, and you lose it.

### Approach 2: Token Level Chunking (Too Fine)

The opposite approach splits by a fixed token count, for example 256 tokens, and for me it over engineers the problem.

\`\`\`mermaid
graph TD
    DOC["Complete document:
10,000 paragraphs"]
    
    TOKENIZE["Split by token count
(512 tokens = 350 words)"]
    
    CHUNKS["Chunks:
350 words each
30,000 chunks total"]
    
    EMBED["Embed each chunk"]
    
    INDEX["Index in vector DB
30,000 vectors
Storage: massive"]
    
    SEARCH["User query"]
    
    RETRIEVE["Find top 10 similar
token chunks"]
    
    DOC --> TOKENIZE --> CHUNKS --> EMBED --> INDEX --> SEARCH --> RETRIEVE
    
    PROBLEM["Problem: Many chunks are
'sentence fragments'
No meaningful context"]
    
    RETRIEVE --> PROBLEM
    
    style PROBLEM fill:#ef4444,color:#fff
\`\`\`

A fixed size doesn't follow the meaning of the text, so a 512 token chunk might be:
- The middle of one sentence
- An entire paragraph
- Half of another paragraph
- Completely random contextual fragments

So you get fragments instead of meaningful units, and a 512 token chunk about "electronics" from the middle of an explanation loses the parts that gave it meaning. Storage also grows to 30,000 vectors instead of 10,000, and every vector adds cost and search latency.

### Approach 3: Page Level Chunking (The Sweet Spot)

The third option is to split by logical page boundaries, so each chunk is one complete page or section, and this is the one I'd start with.

\`\`\`mermaid
graph TD
    DOC["Complete document:
10,000 paragraphs
100 pages"]
    
    SPLIT["Split by page boundary
or major section headers
(----, ##, ###)"]
    
    CHUNKS["Chunks:
100 pages
1500 2500 words each
Meaningful units"]
    
    EMBED["Embed each page
Vector: 1536 dimensions"]
    
    INDEX["Index in vector DB
100 vectors
Managebale size"]
    
    SEARCH["User query:
'return policy<br/>defective products'"]
    
    RETRIEVE["Find top K pages
Page about exceptions
Page about timelines
Full context retrieved"]
    
    DOC --> SPLIT --> CHUNKS --> EMBED --> INDEX --> SEARCH --> RETRIEVE
    
    style RETRIEVE fill:#10b981,color:#fff
\`\`\`

This works because each chunk is a complete unit of meaning. Page 6, for example, is entirely about "Exceptions and Special Cases", so when a user asks about returning a defective product:
- The exception page ranks highly (contains full context)
- The timeline page ranks (contains duration info)
- You get both pieces together

Each chunk is a whole page, so it keeps its context, and you only store 100 vectors instead of 10,000 or 30,000, which means faster search and lower cost.


## How Page Level Indexing Actually Works

### Step 1: Detecting Page Boundaries

Documents come in different formats, so first you work out where the pages are:

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
    
    PDF --> PDFLIB["Use PyPDF2 or pdfplumber
Extract page breaks natively
(PDF has explicit page info)"]
    
    WORD --> DOCXLIB["Use python docx
Read section breaks
Read explicit page markers"]
    
    MARKDOWN --> HEADERLIB["Split by H1/H2 headers
or explicit section markers
(Sections = pages)"]
    
    HTML --> HTMLLIB["Split by <article> tags
or <section> tags
or H1 boundaries"]
    
    style PDFLIB fill:#10b981,color:#fff
    style DOCXLIB fill:#10b981,color:#fff
    style HEADERLIB fill:#10b981,color:#fff
    style HTMLLIB fill:#10b981,color:#fff
\`\`\`

### Step 2: Smart Chunking with Overlap

I'd never chunk without overlap, because if a sentence spans a page boundary you need the context from both pages.

\`\`\`mermaid
graph LR
    PAGE1["Page 1:<br/>...end of discussion"]
    PAGE2["Page 2 header:<br/>What is Return Policy?<br/>...policy details"]
    
    CHUNK1["Chunk 1:<br/>(Full page 1)
plus first 100 tokens of page 2"]
    
    CHUNK2["Chunk 2:<br/>(Last 100 tokens of page 1)
plus Full page 2
plus first 100 tokens of page 3"]
    
    CHUNK3["Chunk 3:<br/>(Last 100 tokens of page 2)
plus Full page 3"]
    
    PAGE1 --> CHUNK1
    PAGE1 --> CHUNK2
    PAGE2 --> CHUNK1
    PAGE2 --> CHUNK2
    PAGE2 --> CHUNK3
    
    style CHUNK1 fill:#3b82f6,color:#fff
    style CHUNK2 fill:#3b82f6,color:#fff
    style CHUNK3 fill:#3b82f6,color:#fff
\`\`\`

The overlap of 100 tokens from the neighboring pages keeps the context at the boundaries. If a sentence starts on page 2 and ends on page 3, both chunks capture it.

### Step 3: Metadata Tagging

Each chunk also needs metadata, so the LLM can tell where it came from:

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

The LLM then sees that metadata in its context window, like this:
\`\`\`
SYSTEM: You retrieved the following documents:

📄 Company Return Policy  Page 5
Section: Exceptions and Special Cases

[page content]

Answer the user's question based ONLY on the retrieved document.
\`\`\`

So now the LLM knows the chunk came from page 5 and can cite it, and that it's about exceptions, so it can point to the section.

---

## Page Indexing vs. Alternatives: The Tradeoff Matrix

| Factor | Paragraph-Level | Token-Level | Page-Level |
|--------|-----------------|-------------|-----------|
| Chunk count | 10,000 | 30,000+ | 100-500 |
| Context preservation |  Poor |  Very Poor |  Excellent |
| Search latency | 150ms | 400ms | 20ms |
| Vector storage cost | High | VERY HIGH | Low  |
| Relevance ranking | Medium | Poor | Excellent  |
| Works with PDFs | Sometimes | Sometimes | Yes  |
| Cites page numbers | Difficult | Impossible | Easy  |
| Handles tables/images | No | No | Yes  |
| Implementation complexity | Low | Low | Medium |

Paragraph-level chunking only makes sense for very small documents (< 20 pages) or ones that are already pre-summarized, and token-level chunking I wouldn't recommend at all. Page-level is the default I'd pick for production RAG, since it works for 95% of real-world documents.

---

## Real Implementation: Python Example

This is what it looks like in Python, from chunking a PDF by page to answering with page citations.

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

Some documents, research papers for example, have pages with 5,000+ words, and those need to be broken down further:

\`\`\`mermaid
graph TD
    PAGE["Page = 5,000 words"]
    
    DECISION{"Page > 3,000 words?"}
    
    DECISION --> |No| USE["Use the page as is"]
    
    DECISION --> |Yes| SUBHEAD["Split by subheadings
(H2, H3 headers)"]
    
    SUBHEAD --> CHUNKS["Multiple chunks per page
But still tagged with page #"]
    
    style USE fill:#10b981,color:#fff
    style CHUNKS fill:#10b981,color:#fff
\`\`\`

### Case 2: Complex Documents (Tables, Images, Diagrams)

PDFs with tables lose their formatting when you extract the text, so the table structure gets flattened like this:

| Before (formatted) | After (text extraction) |
|---------|---------|
| ╔════════╦═════════╗<br/>║ Policy ║ Days    ║<br/>╠════════╬═════════╣<br/>║ Normal │ 30      ║<br/>║ Defect │ 90      ║<br/>╚════════╩═════════╝ | Policy Days Normal 30 Defect 90 |

Once the formatting is gone it's hard to get back, so I'd extract the tables separately and keep them as markdown:

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

Images can't be embedded as text, so there are two ways to handle them. A vision model is expensive but the most accurate, because GPT 4V turns the image into a text description that gets embedded with the page. Figure captions are cheaper and give acceptable quality.

## Measuring Chunking Success

To know whether a chunking strategy works, I'd track three numbers on real test queries.

### Metric 1: Chunk Relevance (MRR@K)

Mean reciprocal rank tells you where the relevant chunk ranks, so for the query "What's the defective product return timeline?" the results might come back like this:
1.  General return policy (irrelevant)
2.  Return shipping info (irrelevant)
3.  Exceptions page (RELEVANT, rank 3)

The relevant page is at rank 3, so the MRR score is 1/3 = 0.333, and the target is above 0.8, with the relevant chunk in the top 2.

### Metric 2: Coverage (% of test queries with relevant chunks)

Coverage is the share of test queries that bring back at least one relevant chunk. If 92 of 100 test queries retrieve something relevant, coverage is 92%, and I'd read below 70% as bad, above 85% as good and above 95% as excellent.

### Metric 3: Token Efficiency

The last check is whether the chunks are a sensible size. With 500K document tokens in a 150 vector index, storage is 150 × 1536 dimensions, and each chunk holds about 500K ÷ 150 = 3,333 tokens, large enough to keep the context and small enough to rank well.

---

## The Complete Page Level RAG Pipeline

Put together, the whole pipeline goes from a PDF arriving to an answer with citations going back to the user.

\`\`\`mermaid
graph TD
    A["1. INGEST<br/>PDF/DOC arrives"]
    B["2. CHUNK<br/>Split by pages
add overlap"]
    C["3. EMBED<br/>Convert to vectors"]
    D["4. INDEX<br/>Store in DB"]
    E["5. RETRIEVE<br/>User asks question"]
    F["6. RANK<br/>Find top K pages"]
    G["7. CONTEXT<br/>Build prompt
include metadata"]
    H["8. GENERATE<br/>LLM creates answer
with citations"]
    I["9. SERVE<br/>Return to user"]
    
    A --> B --> C --> D
    E --> F --> G --> H --> I
    D .->|query| F
    
    style D fill:#10b981,color:#fff
    style H fill:#10b981,color:#fff
    style I fill:#10b981,color:#fff
\`\`\`

## What I'd do with a new set of documents

If I were starting a new RAG system today, I'd chunk by page with overlap and metadata, and test on real queries with MRR and coverage before trusting it. I wouldn't use paragraph-level chunking past 20 pages, or token-level chunking at all, and for me the biggest lesson is that a RAG system is only as good as what it retrieves.`,

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
