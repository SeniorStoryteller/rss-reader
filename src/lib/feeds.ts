import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import type { FeedConfig } from './types';

function loadJsonFeeds(filePath: string): FeedConfig[] {
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as FeedConfig[];
}

export function getFeeds(): FeedConfig[] {
  const root = process.cwd();
  const publicFeeds = loadJsonFeeds(resolve(root, 'feeds.public.json'));

  let privateFeeds: FeedConfig[] = [];
  const privateFilePath = resolve(root, 'feeds.private.json');

  if (existsSync(privateFilePath)) {
    privateFeeds = loadJsonFeeds(privateFilePath);
  } else if (process.env.PRIVATE_FEEDS) {
    privateFeeds = JSON.parse(process.env.PRIVATE_FEEDS) as FeedConfig[];
  }

  return [...publicFeeds, ...privateFeeds];
}
