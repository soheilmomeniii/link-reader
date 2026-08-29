#!/usr/bin/env node

/**
 * Universal reader + summarizer for X links and articles.
 *
 * X/Twitter -> Grok x_search for extraction + structured understanding
 * Everything else -> Jina Reader first, direct fetch fallback, then Grok summary
 *
 * Usage:
 *   node read-and-summarize.js <url>
 *   node read-and-summarize.js <url> --json
 */

const API_KEY = process.env.XAI_API_KEY;
const JSON_MODE = process.argv.includes('--json');
const url = process.argv.slice(2).find(arg => !arg.startsWith('--'));

if (!url) {
  console.error('Usage: node read-and-summarize.js <url> [--json]');
  process.exit(1);
}

function extractTextFromOutput(data) {
  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === 'string') parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

async function callGrok({ prompt, tools = [] }) {
  if (!API_KEY) throw new Error('XAI_API_KEY not set');

  const res = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast-reasoning',
      input: [{ role: 'user', content: prompt }],
      tools
    })
  });

  if (!res.ok) throw new Error(`Grok API error ${res.status}: ${await res.text()}`);
  return await res.json();
}

async function readTweet(targetUrl) {
  const match = targetUrl.match(/x\.com\/([^\/]+)\/status\/(\d+)/);
  const handle = match ? match[1] : null;
  const tweetId = match ? match[2] : null;

  const prompt = handle && tweetId
    ? `You are extracting one specific X post. Use X search to find the post at this exact URL: ${targetUrl}\n\nReturn ONLY these sections:\nURL: <resolved url>\nAUTHOR: <handle>\nDATE: <date>\nTYPE: <single tweet | reply | thread>\nTEXT:\n<exact quoted tweet text>\nMEDIA:\n- <image/video 1: detailed description or NONE>\n- <image/video 2: detailed description if present>\nCONTEXT:\n<short context, what it replies to / thread context / links>\nSUMMARY:\n<2-4 sentence plain-English summary>\nTAKEAWAYS:\n- <bullet 1>\n- <bullet 2>\n- <bullet 3>\n\nIf exact text is uncertain, say so explicitly in CONTEXT. If media is present, inspect it and describe the important content, charts, screenshots, or memes instead of just saying an image exists. Prioritize the requested URL over any nearby posts.`
    : `Read this X profile or X URL and summarize the recent relevant content, including attached images or videos if they matter.`;

  const tool = { type: 'x_search', enable_image_understanding: true, enable_video_understanding: true };
  if (handle) tool.allowed_x_handles = [handle];

  const data = await callGrok({ prompt, tools: [tool] });
  return {
    kind: 'x',
    url: targetUrl,
    handle,
    tweetId,
    text: extractTextFromOutput(data),
    citations: data.citations || []
  };
}

async function readJina(targetUrl) {
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;
  const res = await fetch(jinaUrl, {
    headers: {
      'Accept': 'text/plain',
      'X-Return-Format': 'markdown'
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!res.ok) throw new Error(`Jina error ${res.status}`);
  const text = await res.text();
  if (!text || text.length < 150) throw new Error('Jina returned empty content');
  return text;
}

async function readDirect(targetUrl) {
  const res = await fetch(targetUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Monica/1.0)' },
    signal: AbortSignal.timeout(15000)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

async function summarizeArticle(targetUrl, content) {
  const prompt = `Read this article content and produce a clean summary.\n\nURL: ${targetUrl}\n\nReturn ONLY these sections:\nTITLE: <best title>\nSUMMARY:\n<3-6 sentence summary>\nKEY POINTS:\n- <bullet 1>\n- <bullet 2>\n- <bullet 3>\n- <bullet 4 if useful>\nSIGNAL:\n<why this matters / who should care>\n\nArticle content:\n${content.slice(0, 18000)}`;

  const data = await callGrok({ prompt, tools: [] });
  return {
    kind: 'article',
    url: targetUrl,
    text: extractTextFromOutput(data)
  };
}

async function main() {
  const isTwitter = /(?:twitter|x)\.com/.test(url);

  if (isTwitter) {
    const result = await readTweet(url);
    if (JSON_MODE) console.log(JSON.stringify(result, null, 2));
    else console.log(result.text);
    return;
  }

  let raw;
  try {
    raw = await readJina(url);
  } catch (_) {
    raw = await readDirect(url);
  }

  const result = await summarizeArticle(url, raw);
  if (JSON_MODE) console.log(JSON.stringify(result, null, 2));
  else console.log(result.text);
}

main().catch(err => {
  console.error(err.message || String(err));
  process.exit(1);
});
