export function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="h-48 w-full animate-pulse rounded-t-lg bg-gray-200 dark:bg-gray-700" />
      <div className="p-5">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-1 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-1 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
