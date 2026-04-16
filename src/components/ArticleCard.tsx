import { format, differenceInHours, differenceInDays } from 'date-fns';
import { CategoryBadge } from './CategoryBadge';
import { slugify } from '@/lib/slugify';
import type { FeedItem } from '@/lib/types';

const SOURCE_LOGOS: Record<string, string> = {
  "Lenny's Podcast": '/Logo%20-%20Lennys%20Podcast.png',
  "Wyndo": '/Logo%20-%20AI%20Maker.png',
  "The AI Daily Brief": '/Logo%20-%20AI%20Daily%20Brief.jpg',
  "Hard Fork": '/Logo%20-%20Hard%20Fork.png',
  "Practical AI": '/Logo%20-%20Practical%20AI.webp',
  "AI in Business": '/Logo%20-%20AI%20in%20Business.png',
  "OpenAI News": '/Logo%20-%20OpenAI.jpg',
  "Response Awareness Methodology": '/Logo%20-%20Response%20Awareness%20Methodology.webp',
};

interface ArticleCardProps {
  item: FeedItem;
}

function formatDisplayDate(timestamp: number): string {
  if (timestamp === 0) return 'Unknown date';
  const date = new Date(timestamp);
  const now = new Date();
  const hours = differenceInHours(now, date);
  const days = differenceInDays(now, date);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days === 2) return '2 days ago';
  return format(date, 'EEE yyyy-MM-dd');
}

export function ArticleCard({ item }: ArticleCardProps) {
  const displayDate = formatDisplayDate(item.timestamp);
  const fullDate =
    item.timestamp > 0
      ? new Date(item.timestamp).toUTCString()
      : 'Unknown date';

  return (
    <article className="relative flex h-[220px] flex-row overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-150 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      {/* Left image panel — 1/3 width, full card height */}
      <div className="w-1/3 shrink-0 bg-black">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
          />
        ) : SOURCE_LOGOS[item.source] ? (
          <div className="flex h-full w-full items-center justify-center bg-black px-4">
            <img
              src={SOURCE_LOGOS[item.source]}
              alt={item.source}
              className="max-h-32 max-w-full object-contain"
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black px-4">
            <span className="text-center text-lg font-semibold text-white">{item.source}</span>
          </div>
        )}
      </div>

      {/* Right content panel */}
      <div className="flex flex-1 flex-col overflow-hidden p-5">
        <p className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">{item.source}</p>
        <h2 className="mb-2 line-clamp-2 text-2xl font-bold leading-snug text-gray-900 dark:text-gray-100">
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0 hover:text-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:text-blue-400"
          >
            {item.title}
          </a>
        </h2>
        <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {item.description}
        </p>
        <div className="flex items-center justify-between">
          <time
            className="text-xs text-gray-500 dark:text-gray-400"
            title={fullDate}
            dateTime={item.pubDate}
          >
            {displayDate}
          </time>
          <span className="relative z-10">
            <CategoryBadge category={item.category} href={`/category/${slugify(item.category)}`} />
          </span>
        </div>
      </div>
    </article>
  );
}
