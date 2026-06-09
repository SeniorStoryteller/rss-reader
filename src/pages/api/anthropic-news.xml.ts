import type { NextApiRequest, NextApiResponse } from 'next';

const ANTHROPIC_NEWS_URL = 'https://www.anthropic.com/news';
const FETCH_TIMEOUT_MS = 8000;
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

function extractSlugs(html: string): string[] {
  const matches = html.matchAll(/href="(\/news\/[a-z0-9][a-z0-9-]+)"/g);
  const seen = new Set<string>();
  const slugs: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      slugs.push(m[1]);
    }
  }
  return slugs;
}

async function fetchArticleMeta(slug: string): Promise<Article | null> {
  try {
    const html = await fetchWithTimeout(`https://www.anthropic.com${slug}`);

    const titleMatch = html.match(/<title>([^<]+)<\/title>/);
    const descMatch =
      html.match(/og:description"\s+content="([^"]+)"/) ||
      html.match(/name="description"\s+content="([^"]+)"/);
    const dateMatch = html.match(
      /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})\b/
    );

    if (!titleMatch || !dateMatch) return null;

    const rawTitle = titleMatch[1].replace(/\s*[\\|–]\s*Anthropic\s*$/, '').trim();
    const description = descMatch ? descMatch[1].trim() : rawTitle;

    // Parse date into RFC 2822 for RSS
    const dateStr = `${dateMatch[1]} ${dateMatch[2]}, ${dateMatch[3]}`;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return null;

    return {
      slug,
      title: rawTitle,
      description,
      pubDate: parsed.toUTCString(),
      url: `https://www.anthropic.com${slug}`,
    };
  } catch {
    return null;
  }
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
    const indexHtml = await fetchWithTimeout(ANTHROPIC_NEWS_URL);
    const slugs = extractSlugs(indexHtml).slice(0, 15);

    // Fetch article metadata in parallel, tolerate individual failures
    const results = await Promise.allSettled(slugs.map(fetchArticleMeta));
    const articles = results
      .filter((r): r is PromiseFulfilledResult<Article> => r.status === 'fulfilled' && r.value !== null)
      .map((r) => r.value)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    if (articles.length === 0) {
      return res.status(502).send('Failed to parse any articles');
    }

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=600');
    return res.status(200).send(buildRss(articles));
  } catch (err) {
    return res.status(502).send(`Scrape failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
