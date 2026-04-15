export function SkeletonCard() {
  return (
    <div className="flex flex-row overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      {/* Left image panel */}
      <div className="min-h-[160px] w-1/3 shrink-0 animate-pulse bg-gray-200 dark:bg-gray-700" />

      {/* Right content panel */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-2 h-7 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-1 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-1 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="mb-4 h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}
