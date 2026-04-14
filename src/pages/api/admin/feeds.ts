import type { NextApiRequest, NextApiResponse } from 'next';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import type { FeedConfig } from '@/lib/types';

const FEEDS_PATH = resolve(process.cwd(), 'feeds.public.json');

function isValidFeedEntry(data: unknown): data is FeedConfig {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as Record<string, unknown>).name === 'string' &&
    (data as Record<string, unknown>).name !== '' &&
    typeof (data as Record<string, unknown>).url === 'string' &&
    ((data as Record<string, unknown>).url as string).startsWith('https://') &&
    typeof (data as Record<string, unknown>).category === 'string' &&
    (data as Record<string, unknown>).category !== ''
  );
}

function readFeeds(): FeedConfig[] {
  const raw = readFileSync(FEEDS_PATH, 'utf-8');
  return JSON.parse(raw) as FeedConfig[];
}

function writeFeeds(feeds: FeedConfig[]): void {
  writeFileSync(FEEDS_PATH, JSON.stringify(feeds, null, 2) + '\n', 'utf-8');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  try {
    if (req.method === 'GET') {
      const feeds = readFeeds();
      return res.status(200).json(feeds);
    }

    if (req.method === 'POST') {
      const entry: unknown = req.body;
      if (!isValidFeedEntry(entry)) {
        return res.status(400).json({ error: 'Invalid feed entry. Requires name, url (https://), and category.' });
      }
      const feeds = readFeeds();
      feeds.push({ name: entry.name, url: entry.url, category: entry.category });
      writeFeeds(feeds);
      return res.status(200).json(feeds);
    }

    if (req.method === 'PUT') {
      const { index, feed } = req.body as { index: unknown; feed: unknown };
      if (typeof index !== 'number' || !isValidFeedEntry(feed)) {
        return res.status(400).json({ error: 'Invalid request. Requires index and valid feed entry.' });
      }
      const feeds = readFeeds();
      if (index < 0 || index >= feeds.length) {
        return res.status(400).json({ error: 'Index out of bounds.' });
      }
      feeds[index] = { name: feed.name, url: feed.url, category: feed.category };
      writeFeeds(feeds);
      return res.status(200).json(feeds);
    }

    if (req.method === 'DELETE') {
      const { index } = req.body as { index: unknown };
      if (typeof index !== 'number') {
        return res.status(400).json({ error: 'Invalid request. Requires index.' });
      }
      const feeds = readFeeds();
      if (index < 0 || index >= feeds.length) {
        return res.status(400).json({ error: 'Index out of bounds.' });
      }
      feeds.splice(index, 1);
      writeFeeds(feeds);
      return res.status(200).json(feeds);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin feeds API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
