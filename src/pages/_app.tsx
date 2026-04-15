import type { AppProps } from 'next/app';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FeedDataProvider } from '@/hooks/useFeedData';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white dark:focus:bg-blue-500"
      >
        Skip to content
      </a>
      <ErrorBoundary>
        <FeedDataProvider initialData={pageProps.initialFeedData}>
          <Component {...pageProps} />
        </FeedDataProvider>
      </ErrorBoundary>
    </>
  );
}
