import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { slugify } from '@/lib/slugify';
import { SearchBar } from './SearchBar';

interface SidebarProps {
  categories: string[];
  sources: string[];
  selectedSource: string | null;
  onSourceSelect: (source: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultCount: number;
}

export function Sidebar({ categories, sources, selectedSource, onSourceSelect, searchQuery, onSearchChange, searchResultCount }: SidebarProps) {
  const router = useRouter();
  const currentSlug = router.query.slug as string | undefined;
  const [activeTab, setActiveTab] = useState<'topics' | 'sources'>('topics');

  return (
    <aside className="hidden w-56 shrink-0 self-start sticky top-6 md:block">
      <nav aria-label="Category navigation">
        {/* Tab switcher */}
        <div className="mb-3 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('topics')}
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              activeTab === 'topics' ? 'font-bold text-white' : 'font-medium text-gray-400 hover:text-gray-200'
            }`}
          >
            Topics
          </button>
          <span className="text-gray-500">|</span>
          <button
            onClick={() => setActiveTab('sources')}
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              activeTab === 'sources' ? 'font-bold text-white' : 'font-medium text-gray-400 hover:text-gray-200'
            }`}
          >
            Sources
          </button>
        </div>

        {activeTab === 'topics' ? (
          <ul className="space-y-1">
            <li>
              <Link
                href="/"
                aria-current={!currentSlug ? 'page' : undefined}
                className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                  !currentSlug
                    ? 'border-l-2 border-orange-400 pl-[10px] font-semibold text-white'
                    : 'text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                All Topics
              </Link>
            </li>
            {categories.map((cat) => {
              const slug = slugify(cat);
              const isActive = currentSlug === slug;
              return (
                <li key={cat}>
                  <Link
                    href={`/category/${slug}`}
                    aria-current={isActive ? 'page' : undefined}
                    className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                      isActive
                        ? 'border-l-2 border-orange-400 pl-[10px] font-semibold text-white'
                        : 'text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {cat}
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul>
            {sources.map((source) => {
              const isActive = selectedSource === source;
              return (
                <li key={source}>
                  <button
                    type="button"
                    onClick={() => onSourceSelect(isActive ? null : source)}
                    aria-pressed={isActive}
                    className={`w-full text-left rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                      isActive
                        ? 'border-l-2 border-orange-400 pl-[10px] font-semibold text-white'
                        : 'text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {source}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="mt-4">
        <SearchBar value={searchQuery} onChange={onSearchChange} resultCount={searchResultCount} />
      </div>

      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-100 dark:text-gray-400">
            Admin
          </h2>
          <Link
            href="/admin"
            className="block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium text-gray-100 hover:bg-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            Manage Feeds
          </Link>
        </div>
      )}
    </aside>
  );
}
