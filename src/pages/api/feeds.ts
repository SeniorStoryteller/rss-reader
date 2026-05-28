import type { NextApiRequest, NextApiResponse } from 'next';
import { getFeeds } from '@/lib/feeds';
import { fetchAllFeeds } from '@/lib/rss';
import type { FeedApiResponse } from '@/lib/types';

let cachedResponse: FeedApiResponse | null = null;
let lastFetchTime = 0;
const DEDUP_INTERVAL = 60_000;

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<FeedApiResponse>
) {
  const now = Date.now();

  if (cachedResponse && now - lastFetchTime < DEDUP_INTERVAL) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(cachedResponse);
  }

  try {
    const configs = getFeeds();
    const data = await fetchAllFeeds(configs);

    // Only memoize and CDN-cache fully successful responses. A response with
    // failed feeds would otherwise stick around for 5 minutes (s-maxage) and
    // 60s (in-memory dedup), poisoning later requests that could have
    // succeeded.
    if (data.failed.length === 0) {
      cachedResponse = data;
      lastFetchTime = Date.now();
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    } else {
      res.setHeader('Cache-Control', 'no-store');
    }

    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({
      items: [],
      failed: [{ name: 'All feeds', reason: 'Internal server error' }],
    });
  }
}
