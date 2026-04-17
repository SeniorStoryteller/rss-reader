import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from './ThemeToggle';

interface LayoutProps {
  categories: string[];
  sources: string[];
  selectedSource: string | null;
  onSourceSelect: (source: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchResultCount: number;
  children: ReactNode;
}

export function Layout({
  categories,
  sources,
  selectedSource,
  onSourceSelect,
  searchQuery,
  onSearchChange,
  searchResultCount,
  children,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-600 dark:bg-gray-900">
      <header className="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <h1 className="shrink-0 text-4xl font-bold text-gray-900 dark:text-gray-100">All Things AI</h1>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <MobileNav
              categories={categories}
              sources={sources}
              selectedSource={selectedSource}
              onSourceSelect={onSourceSelect}
              searchQuery={searchQuery}
              onSearchChange={onSearchChange}
              searchResultCount={searchResultCount}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6">
        <Sidebar
          categories={categories}
          sources={sources}
          selectedSource={selectedSource}
          onSourceSelect={onSourceSelect}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchResultCount={searchResultCount}
        />

        <main id="main-content" className="min-w-0 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
