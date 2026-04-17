import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { slugify } from '@/lib/slugify';
import { SearchBar } from './SearchBar';

interface MobileNavProps {
  categories: string[];
  sources: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultCount: number;
}

export function MobileNav({ categories, sources, searchQuery, onSearchChange, searchResultCount }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'topics' | 'sources'>('topics');
  const router = useRouter();
  const currentSlug = router.query.slug as string | undefined;
  const navRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        return;
      }

      if (e.key === 'Tab' && navRef.current) {
        const focusable = navRef.current.querySelectorAll<HTMLElement>(
          'a, button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  useEffect(() => {
    if (isOpen && navRef.current) {
      const firstLink = navRef.current.querySelector<HTMLElement>('a, button');
      firstLink?.focus();
    }
  }, [isOpen]);

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-gray-300 dark:hover:bg-gray-700"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/25"
            onClick={close}
            aria-hidden="true"
          />
          <nav
            ref={navRef}
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white p-6 shadow-lg dark:bg-gray-800"
          >
            <div className="mb-4 flex items-center justify-between">
              {/* Tab switcher */}
              <div className="flex items-center gap-1 text-sm font-semibold">
                <button
                  onClick={() => setActiveTab('topics')}
                  className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    activeTab === 'topics' ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  Topics
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={() => setActiveTab('sources')}
                  className={`focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    activeTab === 'sources' ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                  }`}
                >
                  Sources
                </button>
              </div>
              <button
                onClick={close}
                aria-label="Close navigation menu"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {activeTab === 'topics' ? (
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    onClick={close}
                    aria-current={!currentSlug ? 'page' : undefined}
                    className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                      !currentSlug
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
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
                        onClick={close}
                        aria-current={isActive ? 'page' : undefined}
                        className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {cat}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul className="space-y-1">
                {sources.map((source) => (
                  <li key={source}>
                    <span className="block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {source}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <SearchBar value={searchQuery} onChange={onSearchChange} resultCount={searchResultCount} />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
