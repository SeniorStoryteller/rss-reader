import { formatDistanceToNow } from 'date-fns';
import { CategoryBadge } from './CategoryBadge';
import type { FeedItem } from '@/lib/types';

interface ArticleCardProps {
  item: FeedItem;
}

export function ArticleCard({ item }: ArticleCardProps) {
  const relativeDate =
    item.timestamp > 0
      ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })
      : 'Unknown date';

  const fullDate =
    item.timestamp > 0
      ? new Date(item.timestamp).toUTCString()
      : 'Unknown date';

  const excerpt =
    item.description.length > 200
      ? item.description.slice(0, 200) + '...'
      : item.description;

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-500">{item.source}</span>
        <CategoryBadge category={item.category} />
      </div>
      <h2 className="mb-2 text-lg font-semibold leading-snug text-gray-900">
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {item.title}
        </a>
      </h2>
      <p className="mb-3 flex-1 text-sm leading-relaxed text-gray-600">
        {excerpt}
      </p>
      <time
        className="text-xs text-gray-400"
        title={fullDate}
        dateTime={item.pubDate}
      >
        {relativeDate}
      </time>
    </article>
  );
}
