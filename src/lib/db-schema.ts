import {
  pgTable,
  text,
  uuid,
  timestamp,
  doublePrecision,
  pgEnum,
  jsonb,
  integer,
  bigint,
  boolean,
  vector,
} from "drizzle-orm/pg-core";

export const blogposts = pgTable("blogposts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  description: text("description"),
  author: text("author").notNull(),
  slug: text("slug").notNull().unique(),
  image_url: text("image_url"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const subscribers = pgTable("subscribers", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  email: text("email").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const nodeType = pgEnum("node_type", [
  "coworking",
  "meetup",
  "hackerhouse",
  "hackathon",
  "incubator/accelerator",
  "other",
]);

export const communities = pgTable("communities", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  link: text("link"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const nodes = pgTable("nodes", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  node_type: nodeType("node_type").notNull(),
  links: jsonb("links").notNull(),
  connection: uuid("connection").references(() => communities.id),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const buildingStatusEnum = pgEnum("building_status", ["yes", "no", "none"]);

export const signups = pgTable("signups", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  name: text("name").notNull(),
  twitter: text("twitter").notNull(),
  email: text("email").notNull(),
  buildingStatus: buildingStatusEnum("building_status").notNull(),
  projectLink: text("project_link"),
  projectDescription: text("project_description"),
  idea: text("idea"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const twitterHandles = pgTable("twitter_handles", {
  id: bigint("id", { mode: "bigint" }).primaryKey().notNull(),
  handle: text("handle").notNull().unique(),
  name: text("name").notNull().default(""),
  verified: boolean("verified").notNull().default(false),
  url: text("url").notNull(),
  description: text("description"),
  pfp: text("pfp"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  twitter_handle_id: bigint("twitter_handle_id", { mode: "bigint" })
    .references(() => twitterHandles.id)
    .notNull()
    .unique(),
  onboarded: boolean("onboarded").notNull().default(false),
  twitter_access_token: text("twitter_access_token"),
  twitter_refresh_token: text("twitter_refresh_token"),
  access_token_expires_at: timestamp("access_token_expires_at"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const tweets = pgTable("tweets", {
  tweet_id: bigint("tweet_id", { mode: "bigint" }).primaryKey().notNull(),
  handle_id: bigint("handle_id", { mode: "bigint" })
    .references(() => twitterHandles.id)
    .notNull(),
  url: text("url").notNull(),
  text: text("text").notNull(),
  date: timestamp("date").notNull(),
  bookmark_count: integer("bookmark_count").notNull(),
  retweet_count: integer("retweet_count").notNull(),
  reply_count: integer("reply_count").notNull(),
  like_count: integer("like_count").notNull(),
  quote_count: integer("quote_count").notNull(),
  view_count: integer("view_count").notNull(),
  language: text("language").notNull(),
  is_reply: boolean("is_reply").notNull(),
  is_retweet: boolean("is_retweet").notNull(),
  is_quote: boolean("is_quote").notNull(),
  is_thread: boolean("is_thread").notNull().default(false),
  entities: jsonb("entities").notNull().default("{}"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const jobStatus = pgEnum("job_status", ["pending", "running", "completed", "failed"]);

export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  status: jobStatus("status").notNull(),
  type: text("type").notNull(),
  params: text("params").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const subscriptionType = pgEnum("subscription_type", ["lifetime"]);

export const subscriptions = pgTable("subscriptions", {
  id: text("id").primaryKey().notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  price_id: text("price_id").notNull(),
  type: subscriptionType("type").notNull(),
  active: boolean("active").notNull(),
  customer_id: text("customer_id"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const searches = pgTable("searches", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  query: text("query").notNull(),
  filters: jsonb("filters").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const threads = pgTable("threads", {
  tweet_id: bigint("tweet_id", { mode: "bigint" }).primaryKey().notNull(),
  parent_tweet_id: bigint("parent_tweet_id", { mode: "bigint" })
    .references(() => tweets.tweet_id)
    .notNull(),
  url: text("url").notNull(),
  text: text("text").notNull(),
  date: timestamp("date").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const twitterFollowers = pgTable("twitter_followers", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  handle_id: bigint("handle_id", { mode: "bigint" })
    .references(() => twitterHandles.id)
    .notNull(),
  followers: integer("followers").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  handle_id: bigint("handle_id", { mode: "bigint" })
    .references(() => twitterHandles.id)
    .notNull()
    .unique(),
  persona: text("persona").notNull(),
  target_audience: text("target_audience").notNull(),
  content_pillars: jsonb("content_pillars").notNull(),
  embedding: vector("embedding", { dimensions: 384 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  chat_id: uuid("chat_id")
    .references(() => chats.id)
    .notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const freeloaders = pgTable("freeloaders", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  handle: text("handle").notNull().unique(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tweetDraftStatus = pgEnum("tweet_draft_status", ["draft", "scheduled", "posted"]);

export const tweetDrafts = pgTable("tweet_drafts", {
  id: uuid("id").primaryKey().defaultRandom().notNull(),
  user_id: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  tweet_boxes: jsonb("tweet_boxes").notNull(),
  status: text("status").notNull().default("draft"),
  posted_at: timestamp("posted_at"),
  scheduled_for: timestamp("scheduled_for"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
  deleted_at: timestamp("deleted_at"),
});
