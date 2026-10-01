# LinkedIn Post Requirements — Complete Specification

This file governs any LinkedIn post generated to promote a blog post from this portfolio. It plays the same role for LinkedIn posts that `blogrequirement.md` plays for blog posts, and both share the same tone and punctuation rules for consistency.

---

## Core Principles

### Purpose: One Post, One Idea
A LinkedIn post is a teaser, not a summary. Pick the single most interesting problem or insight from the source blog post and build the post around it. Do not try to compress the whole article.

### NO EMOJIS — ANYWHERE
- No emojis in the hook, body, or hashtags
- No emoji shortcodes (`:fire:`, `:rocket:`)
- No unicode symbols as decoration (checkmarks, arrows, stars)
- Use words instead of symbols

---

## Structure

A LinkedIn post has four parts, in order:

1. **Hook** (1-2 lines): The first ~140 characters are all that shows before "see more" truncates the post. The hook must work as a standalone sentence that earns the click. State a real problem or a specific, concrete claim. Never open with the topic name or "I just published..."
2. **Body** (2-5 short paragraphs): Expand the hook with the concrete detail that makes it credible. Each paragraph is 1-3 sentences. One blank line between every paragraph, since LinkedIn does not render markdown and dense text blocks get skipped.
3. **CTA** (1 line): A single, plain call to action pointing at the post, e.g. "Full breakdown here: `<url>`". Exactly one link, placed here, never mid-sentence.
4. **Hashtags** (1 line, end of post): 3-6 tags, each a single word or PascalCase compound, space separated, no punctuation.

## Length

- **Target**: 100-220 words, excluding the hashtag line
- **Hard minimum**: 80 words
- **Hard maximum**: 250 words
- Longer posts need a stronger hook to survive the fold. Prefer trimming over padding.

## Formatting Rules

- No markdown syntax (`**bold**`, `# headers`, `- bullets`) — LinkedIn displays raw text, so none of it renders
- If listing 3+ items, write them as short standalone lines instead of bulleted markdown, separated by blank lines
- No em-dashes (`—`) anywhere
- No semicolons — use periods instead
- No exclamation marks
- Single space after periods
- Numbers in the hook stay concrete: "40% better recall," not "much better recall"

## Tone

Reuse the same voice rules as `blogrequirement.md`:

- Direct, first-person, colleague-to-colleague, not a press release
- Active voice
- No hedging ("I think", "arguably")
- No vague adjectives ("amazing", "powerful", "game-changing")

**Forbidden words and phrases** (same list as blog rules, plus LinkedIn-specific hype):
- passionate, excited, thrilled, leverage, synergy, dynamic, best-in-class, cutting-edge, game-changer, revolutionary, paradigm shift
- "I'm excited to share", "I'm thrilled to announce", "Huge news", "Big announcement"
- "Harness the power of", "Unlock the potential of"

**Opening lines to avoid**:
- "I just published a new blog post about..."
- "Check out my latest article on..."
- "New blog is live and I am genuinely excited to share this one." (this is the exact pattern to avoid — states the meta-fact of publishing instead of the actual idea)

**Opening lines that work** (lead with the idea, not the act of publishing):
- "Most RAG systems fail not because of the model, but because retrieval doesn't match question distribution."
- "A single vector per chunk throws away most of what makes retrieval work."

## Grounding Rule

Every technical claim, number, or example in the post must come from the source blog post's actual content (title, excerpt, or body). Do not invent statistics, benchmarks, or claims that are not in the source. If the blog post does not contain a strong number, use a concrete mechanism or example instead of fabricating one.

## Hashtags

- 3-6 tags drawn from the blog post's `tags` field where relevant, plus general reach tags if useful (e.g. `#RAG`, `#MachineLearning`)
- PascalCase for multi-word tags: `#VectorSearch`, not `#vector-search` or `#Vector Search`
- No more than 6 — additional tags read as spam and reduce reach

## Quality Gate Before Saving

1. **Hook test**: Does the first line work standalone, with no context from the rest of the post?
2. **Grounding test**: Can every claim be traced to the source blog post?
3. **Word count test**: 80-250 words, target 100-220
4. **Emoji test**: Zero emojis anywhere
5. **Punctuation test**: Zero em-dashes, zero semicolons, zero exclamation marks
6. **Link test**: Exactly one link, placed in the CTA line
7. **Hashtag test**: 3-6 tags, correctly formatted, at the very end
8. **Forbidden word test**: None of the banned words or opening patterns above appear
