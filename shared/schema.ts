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
  };
  course: {
    id: number;
    code: string;
    name: string;
    universityId: number;
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
  };
  userVote?: number;
  replies?: CommentWithAuthor[];
}

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
