import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface MobileNavProps {
  categories: string[];
}

export function MobileNav({ categories }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const currentSlug = router.query.slug as string | undefined;

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
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
        <div className="fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-black/25"
            onClick={() => setIsOpen(false)}
          />
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Categories</h2>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close navigation menu"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                    !currentSlug
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Feeds
                </Link>
              </li>
              {categories.map((cat) => {
                const slug = cat.toLowerCase().replace(/\s+/g, '-');
                const isActive = currentSlug === slug;
                return (
                  <li key={cat}>
                    <Link
                      href={`/category/${slug}`}
                      onClick={() => setIsOpen(false)}
                      className={`block min-h-[44px] rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      )}
    </div>
  );
}
