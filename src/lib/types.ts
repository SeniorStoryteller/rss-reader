export interface FeedConfig {
  name: string;
  url: string;
  category: string;
}

export interface FeedItem {
  title: string;
  link: string;
  timestamp: number;
  pubDate: string;
  description: string;
  source: string;
  category: string;
  guid: string;
}

export interface FailedFeed {
  name: string;
  reason: string;
}

export interface FeedApiResponse {
  items: FeedItem[];
  failed: FailedFeed[];
}
