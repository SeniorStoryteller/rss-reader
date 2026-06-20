import type { NextApiRequest, NextApiResponse } from 'next';

// red.anthropic.com now permanently redirects here
const SOURCE_URL = 'https://www.anthropic.com/research/team/frontier-red-team';
const BASE_URL = 'https://www.anthropic.com';
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

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseDate(text: string): string | null {
  const m = text.trim().match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})\b/);
  if (!m) return null;
  const month = MONTH_MAP[m[1]];
  const day = parseInt(m[2], 10);
  const year = parseInt(m[3], 10);
  return new Date(Date.UTC(year, month, day)).toUTCString();
}

function innerText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseArticles(html: string): Article[] {
  // The page uses the same PublicationList layout as anthropic.com/news.
  // Each card: <a href="/research/slug" class="...listItem">
  //   <div class="...meta"><time class="...date body-3">Jun 8, 2026</time>...</div>
  //   <span class="...title body-3">Title text</span>
  // </a>
  const cardPattern =
    /<a\s[^>]*href="(\/research\/[a-z0-9][a-z0-9-]+)"[^>]*>([\s\S]{20,800}?)<\/a>/g;

  const seen = new Set<string>();
  const articles: Article[] = [];

  for (const m of html.matchAll(cardPattern)) {
    if (articles.length >= MAX_ITEMS) break;
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);

    const body = m[2];

    // Date from <time> element
    const timeMatch = body.match(/<time[^>]*>([^<]+)<\/time>/);
    if (!timeMatch) continue;
    const pubDate = parseDate(timeMatch[1]);
    if (!pubDate) continue;

    // Title from <span class="....__title body-3">
    const spanMatch = body.match(/<span[^>]*__title[^>]*>([\s\S]*?)<\/span>/);
    const title = spanMatch ? innerText(spanMatch[1]) : slug.split('/').pop()?.replace(/-/g, ' ') ?? slug;
    if (!title) continue;

    articles.push({ slug, title, pubDate, url: `${BASE_URL}${slug}` });
  }

  return articles.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
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
    <description>${escapeXml(a.title)}</description>
    <guid isPermaLink="true">${escapeXml(a.url)}</guid>
    <pubDate>${a.pubDate}</pubDate>
  </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Anthropic Red Team Research</title>
    <link>${SOURCE_URL}</link>
    <description>Security research and vulnerability disclosure from Anthropic's Frontier Red Team</description>
    <atom:link href="${SOURCE_URL}" rel="self" type="application/rss+xml"/>
    <language>en</language>${items}
  </channel>
</rss>`;
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const html = await fetchWithTimeout(SOURCE_URL);
    const articles = parseArticles(html);

    if (articles.length === 0) {
      return res.status(502).send('Failed to parse any articles from Anthropic Red Team page');
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
