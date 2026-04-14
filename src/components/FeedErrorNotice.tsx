import type { FailedFeed } from '@/lib/types';

interface FeedErrorNoticeProps {
  failed: FailedFeed[];
}

export function FeedErrorNotice({ failed }: FeedErrorNoticeProps) {
  if (failed.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4"
    >
      <p className="mb-1 text-sm font-medium text-amber-800">
        Some feeds could not be loaded:
      </p>
      <ul className="list-inside list-disc text-sm text-amber-700">
        {failed.map((f) => (
          <li key={f.name}>
            {f.name} — {f.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
