import { formatDistanceToNow } from 'date-fns';
import { CategoryBadge } from './CategoryBadge';
import type { FeedItem } from '@/lib/types';

const SOURCE_LOGOS: Record<string, string> = {
  "Lenny's Podcast": '/Logo%20-%20Lennys%20Podcast.png',
  "Wyndo": '/Logo%20-%20AI%20Maker.png',
};

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

  const excerpt = (() => {
    if (item.description.length <= 200) return item.description;
    const cut = item.description.lastIndexOf(' ', 200);
    return item.description.slice(0, cut > 0 ? cut : 200) + '…';
  })();

  return (
    <article className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-48 w-full rounded-t-lg object-cover"
        />
      ) : SOURCE_LOGOS[item.source] ? (
        <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-black px-4">
          <img
            src={SOURCE_LOGOS[item.source]}
            alt={item.source}
            className="max-h-32 max-w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-48 w-full items-center justify-center rounded-t-lg bg-black px-4">
          <span className="text-center text-lg font-semibold text-white">{item.source}</span>
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.source}</span>
          <CategoryBadge category={item.category} />
        </div>
        <h2 className="mb-2 text-lg font-semibold leading-snug text-gray-900 dark:text-gray-100">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block min-h-[44px] hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:text-blue-400"
          >
            {item.title}
          </a>
        </h2>
        <p className="mb-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {excerpt}
        </p>
        <time
          className="text-xs text-gray-500 dark:text-gray-400"
          title={fullDate}
          dateTime={item.pubDate}
        >
          {relativeDate}
        </time>
      </div>
    </article>
  );
}
