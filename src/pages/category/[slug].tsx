import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArticleCard } from '@/components/ArticleCard';
import { SkeletonCard } from '@/components/SkeletonCard';
import { FeedErrorNotice } from '@/components/FeedErrorNotice';
import { Layout } from '@/components/Layout';
import { slugify } from '@/lib/slugify';
import { filterBySearch } from '@/lib/search';
import { useFeedData } from '@/hooks/useFeedData';

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = router.query;

  const { items, failed, loading, categories } = useFeedData();
  const [searchQuery, setSearchQuery] = useState('');

  const categoryName = categories.find((cat) => slugify(cat) === slug);
  const filteredItems = useMemo(
    () => items.filter((item) => slugify(item.category) === slug),
    [items, slug]
  );
  const displayedItems = useMemo(
    () => filterBySearch(filteredItems, searchQuery),
    [filteredItems, searchQuery]
  );

  if (!loading && !categoryName) {
    return (
      <>
        <Head>
          <title>Category not found — All Things AI</title>
          <meta name="description" content="The requested category was not found." />
          <meta property="og:title" content="Category not found — All Things AI" />
          <meta property="og:description" content="The requested category was not found." />
          <meta property="og:type" content="website" />
        </Head>

        <Layout
          categories={categories}
          searchQuery=""
          onSearchChange={() => {}}
          searchResultCount={0}
        >
          <div className="py-12 text-center">
            <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">Category not found</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              The category you are looking for does not exist.
            </p>
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              Back to all feeds
            </Link>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{categoryName ? `${categoryName} — All Things AI` : 'RSS Reader'}</title>
        <meta
          name="description"
          content={
            categoryName
              ? `RSS feed items in the ${categoryName} category.`
              : 'A modern RSS feed reader'
          }
        />
        <meta
          property="og:title"
          content={categoryName ? `${categoryName} — All Things AI` : 'RSS Reader'}
        />
        <meta
          property="og:description"
          content={
            categoryName
              ? `RSS feed items in the ${categoryName} category.`
              : 'A modern RSS feed reader'
          }
        />
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
          {loading
            ? 'Loading feed items...'
            : `${displayedItems.length} feed items loaded in ${categoryName}.`}
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
            {searchQuery ? 'No results found.' : 'No items in this category.'}
          </p>
        )}
      </Layout>
    </>
  );
}
