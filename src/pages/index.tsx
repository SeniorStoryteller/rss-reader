import { useState, useMemo } from 'react';
import Head from 'next/head';
import { ArticleCard } from '@/components/ArticleCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FeedErrorNotice } from '@/components/FeedErrorNotice';
import { Layout } from '@/components/Layout';
import { filterBySearch } from '@/lib/search';
import { useFeedData } from '@/hooks/useFeedData';

export default function Home() {
  const { items, failed, loading, categories } = useFeedData();
  const [searchQuery, setSearchQuery] = useState('');

  const displayedItems = useMemo(() => filterBySearch(items, searchQuery), [items, searchQuery]);

  return (
    <>
      <Head>
        <title>RSS Reader</title>
        <meta name="description" content="A modern RSS feed reader" />
        <meta property="og:title" content="RSS Reader" />
        <meta property="og:description" content="A modern RSS feed reader" />
        <meta property="og:type" content="website" />
      </Head>

      <Layout
        categories={categories}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResultCount={displayedItems.length}
      >
        <FeedErrorNotice failed={failed} />

        <div role="status" aria-live="polite" className="sr-only">
          {loading ? 'Loading feed items...' : `${displayedItems.length} feed items loaded.`}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayedItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedItems.map((item) => (
              <ArticleCard key={item.guid} item={item} />
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No results found.' : 'No feed items available.'}
          </p>
        )}
      </Layout>
    </>
  );
}
