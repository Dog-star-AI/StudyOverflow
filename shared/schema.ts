import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { z } from "zod";

// Re-export auth models
export * from "./models/auth";

// Universities table
export const universities = pgTable("universities", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  memberCount: integer("member_count").default(0),
});

export const universitiesRelations = relations(universities, ({ many }) => ({
  courses: many(courses),
}));

export type InsertUniversity = Omit<typeof universities.$inferInsert, "id" | "memberCount">;
export const insertUniversitySchema: z.ZodType<InsertUniversity> = z.object({
  name: z.string(),
  shortName: z.string(),
  description: z.string().nullish(),
  logoUrl: z.string().nullish(),
});
export type University = typeof universities.$inferSelect;

// Courses table
export const courses = pgTable("courses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  universityId: integer("university_id").notNull().references(() => universities.id),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  memberCount: integer("member_count").default(0),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  university: one(universities, {
    fields: [courses.universityId],
    references: [universities.id],
  }),
  posts: many(posts),
}));

export type InsertCourse = Omit<typeof courses.$inferInsert, "id" | "memberCount">;
export const insertCourseSchema: z.ZodType<InsertCourse> = z.object({
  universityId: z.number(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullish(),
});
export type Course = typeof courses.$inferSelect;

// Posts table
export const posts = pgTable("posts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  authorId: varchar("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  voteCount: integer("vote_count").default(0),
  commentCount: integer("comment_count").default(0),
  isAnswered: boolean("is_answered").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const postsRelations = relations(posts, ({ one, many }) => ({
  course: one(courses, {
    fields: [posts.courseId],
    references: [courses.id],
  }),
  comments: many(comments),
  votes: many(postVotes),
}));

export type InsertPost = Omit<
  typeof posts.$inferInsert,
  "id" | "voteCount" | "commentCount" | "isAnswered" | "createdAt"
>;
export const insertPostSchema: z.ZodType<InsertPost> = z.object({
  courseId: z.number(),
  authorId: z.string(),
  title: z.string(),
  content: z.string(),
});
export type Post = typeof posts.$inferSelect;

// Comments table
export const comments = pgTable("comments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  postId: integer("post_id").notNull().references(() => posts.id),
  parentId: integer("parent_id"),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  voteCount: integer("vote_count").default(0),
  isAcceptedAnswer: boolean("is_accepted_answer").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: "parentChild",
  }),
  replies: many(comments, { relationName: "parentChild" }),
  votes: many(commentVotes),
}));

export type InsertComment = Omit<
  typeof comments.$inferInsert,
  "id" | "voteCount" | "isAcceptedAnswer" | "createdAt"
>;
export const insertCommentSchema: z.ZodType<InsertComment> = z.object({
  postId: z.number(),
  parentId: z.number().optional(),
  authorId: z.string(),
  content: z.string(),
});
export type Comment = typeof comments.$inferSelect;

// Post votes table
export const postVotes = pgTable("post_votes", {
  postId: integer("post_id").notNull().references(() => posts.id),
  userId: varchar("user_id").notNull(),
  value: integer("value").notNull(), // 1 or -1
}, (table) => ({
  pk: primaryKey({ columns: [table.postId, table.userId] }),
}));

export const postVotesRelations = relations(postVotes, ({ one }) => ({
  post: one(posts, {
    fields: [postVotes.postId],
    references: [posts.id],
  }),
}));

export type InsertPostVote = typeof postVotes.$inferInsert;
export const insertPostVoteSchema: z.ZodType<InsertPostVote> = z.object({
  postId: z.number(),
  userId: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
});
export type PostVote = typeof postVotes.$inferSelect;

// Comment votes table
export const commentVotes = pgTable("comment_votes", {
  commentId: integer("comment_id").notNull().references(() => comments.id),
  userId: varchar("user_id").notNull(),
  value: integer("value").notNull(), // 1 or -1
}, (table) => ({
  pk: primaryKey({ columns: [table.commentId, table.userId] }),
}));

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentVotes.commentId],
    references: [comments.id],
  }),
}));

export type InsertCommentVote = typeof commentVotes.$inferInsert;
export const insertCommentVoteSchema: z.ZodType<InsertCommentVote> = z.object({
  commentId: z.number(),
  userId: z.string(),
  value: z.union([z.literal(1), z.literal(-1)]),
});
export type CommentVote = typeof commentVotes.$inferSelect;

// Extended types for frontend with user info
export type PostWithAuthor = Post & {
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
};

export type CommentWithAuthor = Comment & {
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
  userVote?: number;
  replies?: CommentWithAuthor[];
};
