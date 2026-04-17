import { createContext, useContext, useState, useEffect, useMemo, createElement, type ReactNode } from 'react';
import type { FeedApiResponse, FeedItem, FailedFeed } from '@/lib/types';

interface FeedData {
  items: FeedItem[];
  failed: FailedFeed[];
  loading: boolean;
  categories: string[];
  sources: string[];
}

const FeedDataContext = createContext<FeedData | null>(null);

interface FeedDataProviderProps {
  children: ReactNode;
  initialData?: FeedApiResponse;
}

export function FeedDataProvider({ children, initialData }: FeedDataProviderProps) {
  const [items, setItems] = useState<FeedItem[]>(initialData?.items ?? []);
  const [failed, setFailed] = useState<FailedFeed[]>(initialData?.failed ?? []);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) return; // data provided via SSG/ISR — no client fetch needed
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
  }, [initialData]);

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort(),
    [items]
  );

  const sources = useMemo(
    () => Array.from(new Set(items.map((item) => item.source))).sort(),
    [items]
  );

  return createElement(FeedDataContext.Provider, { value: { items, failed, loading, categories, sources } }, children);
}

export function useFeedData(): FeedData {
  const context = useContext(FeedDataContext);
  if (!context) {
    throw new Error('useFeedData must be used within a FeedDataProvider');
  }
  return context;
}
