import { parseISO, parse } from 'date-fns';

const TZ_MAP: Record<string, string> = {
  GMT: '+0000',
  UT: '+0000',
  EST: '-0500',
  EDT: '-0400',
  CST: '-0600',
  CDT: '-0500',
  MST: '-0700',
  MDT: '-0600',
  PST: '-0800',
  PDT: '-0700',
};

function replaceTimezoneAbbreviations(dateStr: string): string {
  return dateStr.replace(
    /\b(GMT|UT|EST|EDT|CST|CDT|MST|MDT|PST|PDT)\b/,
    (match) => TZ_MAP[match] || match
  );
}

export function parseDate(isoDate?: string, pubDate?: string): number {
  if (isoDate) {
    try {
      const d = parseISO(isoDate);
      if (!isNaN(d.getTime())) return d.getTime();
    } catch {}
  }

  if (pubDate) {
    try {
      const cleaned = replaceTimezoneAbbreviations(pubDate);
      const d = parse(cleaned, 'EEE, dd MMM yyyy HH:mm:ss xx', new Date());
      if (!isNaN(d.getTime())) return d.getTime();
    } catch {}
  }

  return 0;
}
