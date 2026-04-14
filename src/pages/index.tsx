import { useState, useEffect } from 'react';
import Head from 'next/head';
import { ArticleCard } from '@/components/ArticleCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FeedErrorNotice } from '@/components/FeedErrorNotice';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import type { FeedApiResponse, FeedItem, FailedFeed } from '@/lib/types';

export default function Home() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [failed, setFailed] = useState<FailedFeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feeds')
      .then((res) => res.json())
      .then((data: FeedApiResponse) => {
        setItems(data.items);
        setFailed(data.failed);
      })
      .catch(() => {
        setFailed([{ name: 'All feeds', reason: 'Failed to fetch feeds' }]);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(items.map((item) => item.category))).sort();

  return (
    <>
      <Head>
        <title>RSS Reader</title>
        <meta name="description" content="A modern RSS feed reader" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">RSS Reader</h1>
            <MobileNav categories={categories} />
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
          <Sidebar categories={categories} />

          <main id="main-content" className="min-w-0 flex-1">
            <FeedErrorNotice failed={failed} />

            {loading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : items.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <ArticleCard key={item.guid} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500">No feed items available.</p>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
