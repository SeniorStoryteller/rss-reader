import Parser from 'rss-parser';
import { sanitizeHtml } from './sanitize';
import { parseDate } from './dates';
import type { FeedConfig, FeedItem, FailedFeed } from './types';

type CustomItem = {
  mediaContent?: { $?: { url?: string } };
  mediaThumbnail?: { $?: { url?: string } };
};

const MAX_ITEMS_PER_FEED = 20;

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

async function fetchSingleFeed(
  config: FeedConfig
): Promise<FeedItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(config.url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }
    const rawXml = await response.text();
    const cleanXml = stripXxeVectors(rawXml);
    const feed = await parser.parseString(cleanXml);

    return (feed.items || []).slice(0, MAX_ITEMS_PER_FEED).map((item) => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      timestamp: parseDate(item.isoDate, item.pubDate),
      pubDate: item.isoDate || item.pubDate || '',
      description: sanitizeHtml(item.contentSnippet || item.content || item.summary || ''),
      source: config.name,
      category: config.category,
      guid: item.guid || item.link || '',
      imageUrl: extractImageUrl(item),
    }));
  } finally {
    clearTimeout(timeout);
  }
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
