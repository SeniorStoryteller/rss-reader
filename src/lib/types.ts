export type FeedType = 'author' | 'podcast' | 'video';

export interface FeedConfig {
  name: string;
  url: string;
  category: string;
  type: FeedType;
  optional?: boolean;
}

export interface FeedItem {
  title: string;
  link: string;
  timestamp: number;
  pubDate: string;
  description: string;
  source: string;
  category: string;
  type: FeedType;
  guid: string;
  imageUrl?: string;
}

export interface FailedFeed {
  name: string;
  reason: string;
}

export interface FeedApiResponse {
  items: FeedItem[];
  failed: FailedFeed[];
}
