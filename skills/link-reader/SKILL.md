---
name: link-reader
description: Read and understand X posts, threads, articles, and web pages. Use when a user shares a URL and wants more than a shallow summary, especially for Twitter/X links, threads, essays, research posts, blog posts, or articles. Extract what it says, what it means, why it matters, and a concise take when useful. Routes X links through Grok and non-X links through Jina/direct fetch.
---

# Link Reader

Use this skill when the user shares a link and wants understanding, not just compression.

## Goal

Turn links into usable signal.

Default output shape:
1. What it says
2. What it means
3. Why it matters
4. My take, only when useful

Do not stop at a shallow recap unless the user explicitly asks for a basic summary.

## Routing

- X or Twitter URLs: use `scripts/read-and-summarize.js`
- Non X URLs: use `scripts/read-and-summarize.js`
- The script automatically routes:
  - X/Twitter → Grok xAI API
  - Other links → Jina Reader first, then direct fetch fallback

## Usage

```bash
node skills/link-reader/scripts/read-and-summarize.js <url>
node skills/link-reader/scripts/read-and-summarize.js <url> --json
```

## Workflow

1. Run the script on the user’s URL.
2. Read the structured output.
3. Answer in clean prose.
4. Focus on interpretation, not paraphrase.

## For X links

Return the substance behind the post:
- the actual claim
- the hidden frame or thesis
- whether it is signal, promo, cope, or noise
- why it matters, if it matters

For threads, synthesize the thread into the underlying point. Do not summarize each tweet mechanically unless the user asks.

## For articles

Pull out:
- central thesis
- strongest arguments
- what is actually new
- what is fluff or recycled framing
- why the user should care

## Quality bar

Good output should feel like:
- “here’s what this person is really saying”
- “here’s the frame underneath it”
- “here’s why it matters or doesn’t”

Bad output is just shorter text.

## Notes

- X login walls make generic scraping unreliable. Always trust the script’s Grok route over generic page fetches for X.
- Grok can still occasionally drift. If the result looks off, say so instead of pretending certainty.
- Prefer direct, opinionated interpretation when it helps.
- Stay concise unless the user wants depth.
