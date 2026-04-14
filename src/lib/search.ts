import type { FeedItem } from './types';

export function filterBySearch(items: FeedItem[], query: string): FeedItem[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(
    (item) =>
      item.title.toLowerCase().includes(lower) ||
      item.description.toLowerCase().includes(lower) ||
      item.source.toLowerCase().includes(lower)
  );
}
