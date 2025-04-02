import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original user schema is kept for reference
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Social media related schemas
export const SocialUserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  rollNo: z.string(),
  accessCode: z.string().optional(),
});

export type SocialUser = z.infer<typeof SocialUserSchema>;

// More flexible auth token schema to handle potential format variations
export const AuthTokenSchema = z.object({
  token_type: z.string(),
  access_token: z.string(),
  expires_in: z.union([z.number(), z.string()]).transform(val => 
    typeof val === 'string' ? parseInt(val, 10) : val
  ),
}).or(
  // Alternative format that might be returned
  z.object({
    tokenType: z.string(),
    accessToken: z.string(), 
    expiresIn: z.union([z.number(), z.string()]).transform(val => 
      typeof val === 'string' ? parseInt(val, 10) : val
    ),
  })
);

export type AuthToken = z.infer<typeof AuthTokenSchema>;

export const SocialPostSchema = z.object({
  id: z.number(),
  userid: z.number(),
  content: z.string(),
});

export type SocialPost = z.infer<typeof SocialPostSchema>;

export const SocialCommentSchema = z.object({
  id: z.number(),
  postid: z.number(),
  content: z.string(),
});

export type SocialComment = z.infer<typeof SocialCommentSchema>;

export const UserWithPostCountSchema = z.object({
  id: z.number(),
  name: z.string(),
  postCount: z.number(),
  commentCount: z.number().optional(),
  joinDate: z.string().optional(),
  avatar: z.string().optional(),
  trend: z.number().optional(),
});

export type UserWithPostCount = z.infer<typeof UserWithPostCountSchema>;

export const PostWithCommentCountSchema = z.object({
  id: z.number(),
  userid: z.number(),
  userName: z.string().optional(),
  userAvatar: z.string().optional(),
  content: z.string(),
  commentCount: z.number(),
  createdAt: z.string().optional(),
  trend: z.number().optional(),
  rank: z.number().optional(),
});

export type PostWithCommentCount = z.infer<typeof PostWithCommentCountSchema>;

export const AnalyticsStatSchema = z.object({
  totalUsers: z.number(),
  totalPosts: z.number(),
  totalComments: z.number(),
  avgPostsPerUser: z.number(),
});

export type AnalyticsStat = z.infer<typeof AnalyticsStatSchema>;

export const RegistrationRequestSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  mobileNo: z.string(),
  githubusername: z.string(),
  rollNo: z.string(),
  collegeName: z.string(),
  accessCode: z.string(),
});

export const AuthRequestSchema = z.object({
  email: z.string().email(),
  name: z.string(),
  rollNo: z.string(),
  accessCode: z.string(),
  clientID: z.string(),
  clientSecret: z.string(),
});
