import Parser from 'rss-parser';
import { sanitizeHtml } from './sanitize';
import { parseDate } from './dates';
import type { FeedConfig, FeedItem, FailedFeed } from './types';

type CustomItem = {
  mediaContent?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
};

const MAX_ITEMS_PER_FEED = 20;
const FETCH_TIMEOUT_MS = 5000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 300; // base; jittered up to +1000ms in fetchFeedXml

// YouTube and some other feed hosts behave inconsistently with no User-Agent
// (random 4xx/5xx). Sending a browser-like UA + a single retry absorbs most
// of the noise without making them reliable.
const FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/atom+xml, application/rss+xml, application/xml;q=0.9, */*;q=0.8',
};

const parser = new Parser<Record<string, never>, CustomItem>({
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

function extractImageUrl(item: Parser.Item & CustomItem): string | undefined {
  // 1. enclosure (must be an image type)
  if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
    if (item.enclosure.url.startsWith('https://')) return item.enclosure.url;
  }

  // 2. media:content
  const mediaContentUrl = item.mediaContent?.$?.url;
  if (mediaContentUrl?.startsWith('https://')) return mediaContentUrl;

  // 3. media:thumbnail
  const mediaThumbnailUrl = item.mediaThumbnail?.$?.url;
  if (mediaThumbnailUrl?.startsWith('https://')) return mediaThumbnailUrl;

  // 4. first <img src="https://..."> in content HTML
  const html = item.content || item.summary || '';
  const match = html.match(/<img[^>]+src=["'](https:\/\/[^"']+)["']/i);
  if (match?.[1]) return match[1];

  return undefined;
}

function stripXxeVectors(xml: string): string {
  return xml
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!ENTITY[^>]*>/gi, '');
}

// A 4xx from an upstream like YouTube is not "try again" — it's
// "we're rate-limiting/blocking you." Only retry on 5xx and network errors.
function isRetryable(err: Error): boolean {
  const msg = err.message;
  if (msg.startsWith('HTTP 4')) return false; // any 4xx
  return true; // 5xx, AbortError, fetch errors, etc.
}

async function fetchFeedXml(url: string): Promise<string> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: FETCH_HEADERS,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.text();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_ATTEMPTS && isRetryable(lastError)) {
        // Jittered backoff: 300–1500ms. Same-IP near-simultaneous retries
        // against IP-reputation blocks are useless; add real spread.
        const jitter = RETRY_DELAY_MS + Math.floor(Math.random() * 1000);
        await new Promise((resolve) => setTimeout(resolve, jitter));
      } else {
        break;
      }
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError ?? new Error('Fetch failed');
}

async function fetchSingleFeed(
  config: FeedConfig
): Promise<FeedItem[]> {
  const rawXml = await fetchFeedXml(config.url);
  const cleanXml = stripXxeVectors(rawXml);
  const feed = await parser.parseString(cleanXml);

  return (feed.items || []).slice(0, MAX_ITEMS_PER_FEED).map((item) => {
    const imageUrl = extractImageUrl(item);
    return {
      title: item.title || 'Untitled',
      link: item.link || '',
      timestamp: parseDate(item.isoDate, item.pubDate),
      pubDate: item.isoDate || item.pubDate || '',
      description: sanitizeHtml(item.contentSnippet || item.content || item.summary || ''),
      source: config.name,
      category: config.category,
      guid: item.guid || item.link || '',
      ...(imageUrl ? { imageUrl } : {}),
    };
  });
}

export async function fetchAllFeeds(
  configs: FeedConfig[]
): Promise<{ items: FeedItem[]; failed: FailedFeed[] }> {
  const results = await Promise.allSettled(
    configs.map((config) => fetchSingleFeed(config))
  );

  const items: FeedItem[] = [];
  const failed: FailedFeed[] = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    } else {
      failed.push({
        name: configs[i].name,
        reason: result.reason?.message || 'Unknown error',
      });
    }
  });

  items.sort((a, b) => b.timestamp - a.timestamp);

  return { items, failed };
}
