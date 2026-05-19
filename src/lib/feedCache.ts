/**
 * Last-good cache for fetched feed items, backed by Vercel Blob.
 *
 * The cache lets us absorb transient upstream failures (e.g. YouTube
 * randomly returning 4xx/5xx from datacenter IPs): when a fresh fetch
 * fails, we serve the cached items for that feed if they're not too stale.
 *
 * The cache is opt-in via BLOB_READ_WRITE_TOKEN — if missing (local dev
 * without `vercel env pull`, preview builds without the integration),
 * read/write become no-ops and the fetcher falls back to its original
 * fetch-and-report behavior.
 */
import { get, put } from '@vercel/blob';
import type { FeedItem } from './types';

const CACHE_PATHNAME = 'feed-cache.json';

export interface CachedFeed {
  fetchedAt: number;
  items: FeedItem[];
}

export interface FeedCache {
  feeds: Record<string, CachedFeed>;
}

const EMPTY_CACHE: FeedCache = { feeds: {} };

function tokenAvailable(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function readCache(): Promise<FeedCache> {
  if (!tokenAvailable()) return EMPTY_CACHE;
  try {
    const result = await get(CACHE_PATHNAME, { access: 'private' });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return EMPTY_CACHE;
    }
    const text = await new Response(result.stream).text();
    const parsed = JSON.parse(text) as FeedCache;
    if (!parsed || typeof parsed !== 'object' || !parsed.feeds) {
      return EMPTY_CACHE;
    }
    return parsed;
  } catch {
    // Blob missing (first run), network error, parse error — fall back to empty.
    return EMPTY_CACHE;
  }
}

export async function writeCache(cache: FeedCache): Promise<void> {
  if (!tokenAvailable()) return;
  try {
    await put(CACHE_PATHNAME, JSON.stringify(cache), {
      access: 'private',
      contentType: 'application/json',
      allowOverwrite: true,
    });
  } catch (err) {
    // Cache write failures shouldn't break page rendering.
    console.error('Failed to write feed cache:', err);
  }
}
