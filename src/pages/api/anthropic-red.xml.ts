import type { NextApiRequest, NextApiResponse } from 'next';

const RED_URL = 'https://red.anthropic.com/';
const FETCH_TIMEOUT_MS = 8000;
const MAX_ITEMS = 20;
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
};

interface Article {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  url: string;
}

async function fetchWithTimeout(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

const MONTHS: Record<string, number> = {
  January: 0, February: 1, March: 2, April: 3, May: 4, June: 5,
  July: 6, August: 7, September: 8, October: 9, November: 10, December: 11,
};

function parseMonthYear(text: string): string | null {
  const m = text.trim().match(/^(\w+)\s+(\d{4})$/);
  if (!m) return null;
  const month = MONTHS[m[1]];
  if (month === undefined) return null;
  const year = parseInt(m[2], 10);
  return new Date(Date.UTC(year, month, 1)).toUTCString();
}

function innerText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseArticles(html: string): Article[] {
  const articles: Article[] = [];
  const seen = new Set<string>();
  let currentPubDate = '';

  // Match date headers and article anchors in document order.
  // Group 1: date header text ("June 2026")
  // Group 2: article href ("2026/n-days/")
  // Group 3: article body (content between <a> tags)
  const pattern =
    /<div class="date">([^<]+)<\/div>|<a href="([^"]+)" class="note">([\s\S]{10,2000}?)<\/a>/g;

  for (const m of html.matchAll(pattern)) {
    if (m[1] !== undefined) {
      // Date header — update current date context
      const parsed = parseMonthYear(m[1]);
      if (parsed) currentPubDate = parsed;
      continue;
    }

    if (articles.length >= MAX_ITEMS) break;
    if (!currentPubDate) continue;

    const href = m[2];
    const body = m[3];

    // Normalise href to a slug key for dedup (strip trailing slash)
    const slug = href.replace(/\/$/, '');
    if (seen.has(slug)) continue;
    seen.add(slug);

    // Title: <h3> inside the anchor
    const h3Match = body.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
    const title = h3Match ? innerText(h3Match[1]) : slug.split('/').pop()?.replace(/-/g, ' ') ?? slug;
    if (!title) continue;

    // Description: <div class="description"> inside the anchor
    const descMatch = body.match(/<div class="description">([\s\S]*?)<\/div>/);
    const description = descMatch ? innerText(descMatch[1]).slice(0, 300) : title;

    const url = `https://red.anthropic.com/${href}`;
    articles.push({ slug, title, description, pubDate: currentPubDate, url });
  }

  return articles;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildRss(articles: Article[]): string {
  const items = articles
    .map(
      (a) => `
  <item>
    <title>${escapeXml(a.title)}</title>
    <link>${escapeXml(a.url)}</link>
    <description>${escapeXml(a.description)}</description>
    <guid isPermaLink="true">${escapeXml(a.url)}</guid>
    <pubDate>${a.pubDate}</pubDate>
  </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Anthropic Red Team Research</title>
    <link>https://red.anthropic.com/</link>
    <description>Security research and vulnerability disclosure from Anthropic</description>
    <atom:link href="https://red.anthropic.com/" rel="self" type="application/rss+xml"/>
    <language>en</language>${items}
  </channel>
</rss>`;
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const html = await fetchWithTimeout(RED_URL);
    const articles = parseArticles(html);

    if (articles.length === 0) {
      return res.status(502).send('Failed to parse any articles from red.anthropic.com');
    }

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(buildRss(articles));
  } catch (err) {
    return res
      .status(502)
      .send(`Scrape failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
