import Link from 'next/link';

interface CategoryBadgeProps {
  category: string;
  href?: string;
}

export function CategoryBadge({ category, href }: CategoryBadgeProps) {
  const className =
    'inline-block rounded-full bg-orange-700 px-2.5 py-0.5 text-xs font-medium text-white';

  if (href) {
    return (
      <Link href={href} className={className}>
        {category}
      </Link>
    );
  }

  return <span className={className}>{category}</span>;
}
