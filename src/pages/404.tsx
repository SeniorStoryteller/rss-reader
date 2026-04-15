import Head from 'next/head';
import Link from 'next/link';

export default function NotFound() {
  return (
    <>
      <Head>
        <title>Page Not Found — All Things AI</title>
        <meta name="description" content="The page you are looking for could not be found." />
        <meta property="og:title" content="Page Not Found — All Things AI" />
        <meta property="og:description" content="The page you are looking for could not be found." />
        <meta property="og:type" content="website" />
      </Head>

      <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
        <div className="text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            404
          </p>
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-gray-100">
            Page not found
          </h1>
          <p className="mb-8 text-gray-600 dark:text-gray-400">
            The page you are looking for doesn&apos;t exist or may have been moved.
          </p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
          >
            Back to all feeds
          </Link>
        </div>
      </main>
    </>
  );
}
