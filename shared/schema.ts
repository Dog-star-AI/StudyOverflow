import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
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

export const insertUniversitySchema = createInsertSchema(universities).omit({ id: true, memberCount: true });
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
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

export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, memberCount: true });
export type InsertCourse = z.infer<typeof insertCourseSchema>;
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

export const insertPostSchema = createInsertSchema(posts).omit({ 
  id: true, 
  voteCount: true, 
  commentCount: true, 
  isAnswered: true, 
  createdAt: true 
});
export type InsertPost = z.infer<typeof insertPostSchema>;
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

export const insertCommentSchema = createInsertSchema(comments).omit({ 
  id: true, 
  voteCount: true, 
  isAcceptedAnswer: true, 
  createdAt: true 
});
export type InsertComment = z.infer<typeof insertCommentSchema>;
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

export const insertPostVoteSchema = createInsertSchema(postVotes);
export type InsertPostVote = z.infer<typeof insertPostVoteSchema>;
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

export const insertCommentVoteSchema = createInsertSchema(commentVotes);
export type InsertCommentVote = z.infer<typeof insertCommentVoteSchema>;
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
