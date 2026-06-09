import type { NextApiRequest, NextApiResponse } from 'next';

const ANTHROPIC_NEWS_URL = 'https://www.anthropic.com/news';
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

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseArticles(html: string): Article[] {
  // Strip tags for cleaner text extraction
  const stripTags = (s: string) =>
    s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  // Each article card contains: slug href, title text, date, description
  // Split the page into card-sized chunks by splitting on news hrefs
  const cardPattern = /href="(\/news\/[a-z0-9][a-z0-9-]+)"/g;
  const slugMatches = [...html.matchAll(cardPattern)];

  const seen = new Set<string>();
  const articles: Article[] = [];

  for (let i = 0; i < slugMatches.length && articles.length < MAX_ITEMS; i++) {
    const m = slugMatches[i];
    const slug = m[1];
    if (seen.has(slug)) continue;
    seen.add(slug);

    // Grab ~800 chars of HTML after the slug href for context
    const contextStart = m.index ?? 0;
    const contextEnd = Math.min(html.length, contextStart + 1200);
    const chunk = stripTags(html.slice(contextStart, contextEnd));

    // Date: "Jun 9, 2026" or "May 28, 2026"
    const dateMatch = chunk.match(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{1,2}),?\s+(\d{4})\b/
    );
    if (!dateMatch) continue;

    const month = MONTH_MAP[dateMatch[1]];
    const day = parseInt(dateMatch[2], 10);
    const year = parseInt(dateMatch[3], 10);
    const pubDate = new Date(Date.UTC(year, month, day)).toUTCString();

    // Title: usually the first substantial text segment after the slug
    // Heuristic: first quoted/unquoted block of 10–120 chars before the date
    const beforeDate = chunk.slice(0, chunk.indexOf(dateMatch[0]));
    const titleMatch = beforeDate.match(
      /([A-Z“‘][^.!?]{9,119}[^.!?\s])\s*$/
    );
    const title = titleMatch ? titleMatch[1].trim() : slug.replace(/-/g, ' ');

    // Description: text after the date (up to ~200 chars, before category word)
    const afterDate = chunk.slice(chunk.indexOf(dateMatch[0]) + dateMatch[0].length);
    const rawDesc = afterDate.replace(/^\s*(Announcements|Policy|Research|Product|News)\s*/i, '').trim();
    const description = rawDesc.slice(0, 200).trim() || title;

    articles.push({
      slug,
      title,
      description,
      pubDate,
      url: `https://www.anthropic.com${slug}`,
    });
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
    <description>${escapeXml(a.description)}</description>
    <guid isPermaLink="true">${escapeXml(a.url)}</guid>
    <pubDate>${a.pubDate}</pubDate>
  </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Anthropic News</title>
    <link>https://www.anthropic.com/news</link>
    <description>Latest news and announcements from Anthropic</description>
    <atom:link href="https://www.anthropic.com/news" rel="self" type="application/rss+xml"/>
    <language>en</language>${items}
  </channel>
</rss>`;
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const html = await fetchWithTimeout(ANTHROPIC_NEWS_URL);
    const articles = parseArticles(html);

    if (articles.length === 0) {
      return res.status(502).send('Failed to parse any articles from Anthropic news page');
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
