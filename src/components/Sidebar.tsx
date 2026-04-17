import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SearchBar } from './SearchBar';
import { NavLists } from './NavLists';

interface SidebarProps {
  categories: string[];
  sources: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultCount: number;
}

export function Sidebar({ categories, sources, searchQuery, onSearchChange, searchResultCount }: SidebarProps) {
  const router = useRouter();
  const currentSlug = router.query.slug as string | undefined;
  const currentSource = typeof router.query.source === 'string' ? router.query.source : null;
  const [activeTab, setActiveTab] = useState<'topics' | 'sources'>(currentSource ? 'sources' : 'topics');

  // Keep the visible tab in sync with the URL — handles browser back/forward
  // and programmatic navigations that change `?source=` without remounting.
  useEffect(() => {
    setActiveTab(currentSource ? 'sources' : 'topics');
  }, [currentSource]);

  return (
    <aside className="hidden w-56 shrink-0 self-start sticky top-6 md:block">
      <nav aria-label="Category navigation">
        {/* Tab switcher */}
        <div className="mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
          <button
            type="button"
            onClick={() => {
              setActiveTab('topics');
              if (currentSource) router.push('/');
            }}
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              activeTab === 'topics' ? 'font-bold text-white' : 'font-medium text-gray-200 hover:text-white'
            }`}
          >
            Topics
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={() => setActiveTab('sources')}
            className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              activeTab === 'sources' ? 'font-bold text-white' : 'font-medium text-gray-200 hover:text-white'
            }`}
          >
            Sources
          </button>
        </div>

        <NavLists
          activeTab={activeTab}
          categories={categories}
          sources={sources}
          currentSlug={currentSlug}
          currentSource={currentSource}
          variant="sidebar"
        />
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
