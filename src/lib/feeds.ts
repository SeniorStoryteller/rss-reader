import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { FeedConfig } from './types';

function isValidFeedConfig(data: unknown): data is FeedConfig[] {
  if (!Array.isArray(data)) return false;
  return data.every(
    (item) =>
      typeof item === 'object' &&
      item !== null &&
      typeof item.name === 'string' &&
      typeof item.url === 'string' &&
      typeof item.category === 'string' &&
      item.url.startsWith('https://')
  );
}

function loadJsonFeeds(filePath: string): FeedConfig[] {
  if (!existsSync(filePath)) return [];
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const data: unknown = JSON.parse(raw);
    if (!isValidFeedConfig(data)) {
      console.error(`Invalid feed config in ${filePath}`);
      return [];
    }
    return data;
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return [];
  }
}

export function getFeeds(): FeedConfig[] {
  const root = process.cwd();
  const publicFeeds = loadJsonFeeds(resolve(root, 'feeds.public.json'));

  let privateFeeds: FeedConfig[] = [];
  const privateFilePath = resolve(root, 'feeds.private.json');

  if (existsSync(privateFilePath)) {
    privateFeeds = loadJsonFeeds(privateFilePath);
  } else if (process.env.PRIVATE_FEEDS) {
    try {
      const data: unknown = JSON.parse(process.env.PRIVATE_FEEDS);
      if (isValidFeedConfig(data)) {
        privateFeeds = data;
      } else {
        console.error('PRIVATE_FEEDS env var contains invalid feed config');
      }
    } catch (error) {
      console.error('Failed to parse PRIVATE_FEEDS env var:', error);
    }
  }

  return [...publicFeeds, ...privateFeeds];
}
