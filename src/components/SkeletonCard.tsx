export function SkeletonCard() {
  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        <div className="h-5 w-12 animate-pulse rounded-full bg-gray-200" />
      </div>
      <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mb-1 h-4 w-full animate-pulse rounded bg-gray-200" />
      <div className="mb-1 h-4 w-full animate-pulse rounded bg-gray-200" />
      <div className="mb-3 h-4 w-2/3 animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
    </div>
  );
}
