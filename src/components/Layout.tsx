import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { SearchBar } from './SearchBar';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  categories: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultCount: number;
  children: ReactNode;
}

export function Layout({
  categories,
  searchQuery,
  onSearchChange,
  searchResultCount,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <h1 className="shrink-0 text-xl font-bold text-gray-900 dark:text-gray-100">RSS Reader</h1>
          <div className="hidden flex-1 sm:block sm:max-w-xs">
            <SearchBar value={searchQuery} onChange={onSearchChange} resultCount={searchResultCount} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <MobileNav categories={categories} />
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:hidden">
          <SearchBar value={searchQuery} onChange={onSearchChange} resultCount={searchResultCount} />
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <Sidebar categories={categories} />

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
