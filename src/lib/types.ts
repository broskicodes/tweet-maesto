import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      handle?: string | null;
      subscribed?: boolean | null;
    };
  }
}
export interface BlogPost {
  author: string;
  title: string;
  description: string | null;
  content: string;
  image_url: string | null;
  slug: string;
  date: string;
}

export enum NodeType {
  Coworking = "coworking",
  Meetup = "meetup",
  HackerHouse = "hackerhouse",
  Hackathon = "hackathon",
  IncubatorOrAccelerator = "incubator/accelerator",
  Other = "other",
}

export const NodeColorMap = {
  [NodeType.Coworking]: "7358F9",
  [NodeType.Meetup]: "EE8434",
  [NodeType.HackerHouse]: "D7FDEC",
  [NodeType.Hackathon]: "65334D",
  [NodeType.IncubatorOrAccelerator]: "000000",
  [NodeType.Other]: "000000",
};

export interface Link {
  name: string;
  url: string;
}

export interface Node {
  id: string;
  name: string;
  description: string;
  location: string;
  longitude: number;
  latitude: number;
  node_type: NodeType;
  links: Link[];
  connection: string | null;
}

export enum TwitterScrapeType {
  Initialize = "initialize",
  Monthly = "monthly",
  Weekly = "weekly",
  Daily = "daily",
  Update = "update",
  Micro = "micro",
}

export interface TwitterAuthor {
  id: string;
  name: string;
  handle: string;
  pfp: string;
  url: string;
  verified: boolean;
  followers?: number;
  description?: string;
}

export interface TweetEntity {
  urls: Array<{
    url: string;
  }>;
  media: Array<{
    type: string;
    url: string;
  }> | null;
}

export interface Tweet {
  tweet_id: string;
  author: TwitterAuthor;
  url: string;
  text: string;
  date: string;
  bookmark_count: number;
  retweet_count: number;
  reply_count: number;
  like_count: number;
  quote_count: number;
  view_count: number;
  language: string;
  entities: TweetEntity;
  is_reply: boolean;
  is_retweet: boolean;
  is_quote: boolean;
  is_thread: boolean;
}

export interface LeaderboardData {
  user_id: string;
  url: string;
  pfp: string | null;
  tweets: Omit<Tweet, "author">[];
}

export type Metric =
  | "impressions"
  | "comments"
  | "likes"
  | "retweets"
  | "bookmarks"
  | "engagement_rate";
export type StatType = "total" | "average";

// Events
export const SIGNUP_EVENT = "user-signed-up";
export const SHOW_MAP_EVENT = "show-map";

export const metricLabels: Record<Metric, string> = {
  impressions: "Impressions",
  engagement_rate: "Engagement Rate",
  comments: "Comments",
  likes: "Likes",
  bookmarks: "Bookmarks",
  retweets: "Retweets",
};
