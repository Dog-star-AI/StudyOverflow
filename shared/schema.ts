import { z } from "zod";

export * from "./models/auth";

export const insertUniversitySchema = z.object({
  name: z.string(),
  shortName: z.string(),
  description: z.string().nullish(),
  logoUrl: z.string().nullish(),
});

export type InsertUniversity = z.infer<typeof insertUniversitySchema>;

export interface University {
  id: number;
  name: string;
  shortName: string;
  description?: string | null;
  logoUrl?: string | null;
  memberCount: number;
}

export const insertCourseSchema = z.object({
  universityId: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullish(),
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;

export interface Course {
  id: number;
  universityId: number;
  code: string;
  name: string;
  description?: string | null;
  memberCount: number;
}

export const insertPostSchema = z.object({
  courseId: z.number(),
  authorId: z.string(),
  title: z.string(),
  content: z.string(),
});

export type InsertPost = z.infer<typeof insertPostSchema>;

export interface Post {
  id: number;
  courseId: number;
  authorId: string;
  title: string;
  content: string;
  voteCount: number;
  commentCount: number;
  isAnswered: boolean;
  createdAt: Date;
}

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    bio?: string | null;
  };
  course: {
    id: number;
    code: string;
    name: string;
    universityId: number;
    memberCount: number;
  };
  userVote?: number;
}

export const insertCommentSchema = z.object({
  postId: z.number(),
  parentId: z.number().nullish(),
  authorId: z.string(),
  content: z.string(),
});

export type InsertComment = z.infer<typeof insertCommentSchema>;

export interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  authorId: string;
  content: string;
  voteCount: number;
  isAcceptedAnswer: boolean;
  createdAt: Date;
}

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
    bio?: string | null;
  };
  userVote?: number;
  replies?: CommentWithAuthor[];
}

export const insertNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(280),
  link: z.string().url().nullable().optional(),
  type: z.enum(["comment", "answer", "chat", "system"]).default("system"),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export interface Notification extends InsertNotification {
  id: number;
  isRead: boolean;
  createdAt: Date;
}

export interface ChatThread {
  id: number;
  name: string;
  isGroup: boolean;
  memberIds: string[];
  avatarUrl?: string | null;
  lastMessageAt?: Date | null;
}

export interface ChatThreadWithMeta extends ChatThread {
  lastMessage?: MessageWithSender;
}

export interface Message {
  id: number;
  chatId: number;
  senderId: string;
  content: string;
  createdAt: Date;
}

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export const insertMessageSchema = z.object({
  content: z.string().min(1).max(1200),
});

export const insertChatSchema = z.object({
  name: z.string().min(1).max(120),
  isGroup: z.boolean().default(false),
  memberIds: z.array(z.string()).min(2),
  avatarUrl: z.string().url().nullable().optional(),
});

export type InsertChat = z.infer<typeof insertChatSchema>;

export const insertPostVoteSchema = z.object({
  postId: z.number(),
  userId: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export type InsertPostVote = z.infer<typeof insertPostVoteSchema>;

export const insertCommentVoteSchema = z.object({
  commentId: z.number(),
  userId: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export type InsertCommentVote = z.infer<typeof insertCommentVoteSchema>;
