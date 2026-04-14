import type { FailedFeed } from '@/lib/types';

interface FeedErrorNoticeProps {
  failed: FailedFeed[];
}

export function FeedErrorNotice({ failed }: FeedErrorNoticeProps) {
  if (failed.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/30"
    >
      <p className="mb-1 text-sm font-medium text-amber-800 dark:text-amber-200">
        Some feeds could not be loaded:
      </p>
      <ul className="list-inside list-disc text-sm text-amber-700 dark:text-amber-300">
        {failed.map((f) => (
          <li key={f.name}>
            {f.name} — {f.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
