import { createContext, useContext, useState, useEffect, useMemo, createElement, type ReactNode } from 'react';
import type { FeedApiResponse, FeedItem, FailedFeed } from '@/lib/types';

interface FeedData {
  items: FeedItem[];
  failed: FailedFeed[];
  loading: boolean;
  categories: string[];
}

const FeedDataContext = createContext<FeedData | null>(null);

export function FeedDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [failed, setFailed] = useState<FailedFeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feeds')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: FeedApiResponse) => {
        setItems(data.items);
        setFailed(data.failed);
      })
      .catch(() => {
        setFailed([{ name: 'All feeds', reason: 'Failed to fetch feeds' }]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items]
  );

  return createElement(FeedDataContext.Provider, { value: { items, failed, loading, categories } }, children);
}

export function useFeedData(): FeedData {
  const context = useContext(FeedDataContext);
  if (!context) {
    throw new Error('useFeedData must be used within a FeedDataProvider');
  }
  return context;
}
