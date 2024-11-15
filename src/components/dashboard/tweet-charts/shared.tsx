import { Eye, ThumbsUp, Bookmark, MessageCircle, Repeat, BarChart3Icon } from "lucide-react";

export type ChartData = {
  id: string;
  date: Date;
  url: string;
  impressions: number;
  comments: number;
  likes: number;
  bookmarks: number;
  retweets: number;
  engagement_rate: number;
}

export const metricIcons = {
    impressions: <Eye className="h-4 w-4" />,
    likes: <ThumbsUp className="h-4 w-4" />,
    bookmarks: <Bookmark className="h-4 w-4" />,
    comments: <MessageCircle className="h-4 w-4" />,
    retweets: <Repeat className="h-4 w-4" />,
    engagement_rate: <BarChart3Icon className="h-4 w-4" />,
  }