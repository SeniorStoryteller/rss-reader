import type { NextApiRequest, NextApiResponse } from 'next';

const ZDNET_RSS = 'https://www.zdnet.com/news/rss.xml';
const MAX_ITEMS = 10;
const FETCH_TIMEOUT_MS = 8000;

// Keywords that signal AI-relevant ZDNet articles
const AI_KEYWORDS = [
  'artificial intelligence', ' ai ', 'chatgpt', 'openai', 'anthropic', 'claude',
  'gemini', 'copilot', 'gpt-', 'llm', 'large language model', 'machine learning',
  'deep learning', 'generative ai', 'midjourney', 'stable diffusion', 'agi',
  'neural network', 'agentic', 'ai agent', 'ai tool', 'ai model', 'ai skill',
  'ai feature', 'ai search', 'ai assistant', 'mistral', 'perplexity', 'grok',
];

function isAiRelated(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw));
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RSS reader)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

interface Item {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}

function parseItems(xml: string): Item[] {
  const items: Item[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  for (const m of xml.matchAll(itemPattern)) {
    const block = m[1];
    const get = (tag: string) => {
      const match = block.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'));
      return match ? match[1].trim() : '';
    };
    items.push({
      title: get('title'),
      description: get('description'),
      link: get('link'),
      pubDate: get('pubDate'),
      guid: get('guid') || get('link'),
    });
  }
  return items;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRss(items: Item[]): string {
  const itemsXml = items
    .map(
      (i) => `
  <item>
    <title>${escapeXml(i.title)}</title>
    <link>${escapeXml(i.link)}</link>
    <description>${escapeXml(i.description)}</description>
    <guid isPermaLink="true">${escapeXml(i.link)}</guid>
    <pubDate>${escapeXml(i.pubDate)}</pubDate>
  </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>ZDNet AI</title>
    <link>https://www.zdnet.com/topic/artificial-intelligence/</link>
    <description>AI-related articles from ZDNet</description>
    <atom:link href="https://www.zdnet.com/news/rss.xml" rel="self" type="application/rss+xml"/>
    <language>en</language>${itemsXml}
  </channel>
</rss>`;
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse) {
  try {
    const xml = await fetchWithTimeout(ZDNET_RSS);
    const all = parseItems(xml);
    const filtered = all.filter((i) => isAiRelated(i.title, i.description)).slice(0, MAX_ITEMS);

    if (filtered.length === 0) {
      return res.status(502).send('No AI articles found in ZDNet RSS feed');
    }

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=300');
    return res.status(200).send(buildRss(filtered));
  } catch (err) {
    return res.status(502).send(`Scrape failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
