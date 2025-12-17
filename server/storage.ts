import { 
  universities, courses, posts, comments, postVotes, commentVotes,
  type University, type InsertUniversity,
  type Course, type InsertCourse,
  type Post, type InsertPost, type PostWithAuthor,
  type Comment, type InsertComment, type CommentWithAuthor,
  type InsertPostVote, type InsertCommentVote,
  users
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Universities
  getUniversities(): Promise<University[]>;
  getUniversity(id: number): Promise<University | undefined>;
  createUniversity(data: InsertUniversity): Promise<University>;

  // Courses
  getCourses(universityId?: number): Promise<Course[]>;
  getCourse(id: number): Promise<(Course & { university: University }) | undefined>;
  createCourse(data: InsertCourse): Promise<Course>;

  // Posts
  getPosts(options: { courseId?: number; universityId?: number; sort?: string; userId?: string }): Promise<PostWithAuthor[]>;
  getPost(id: number, userId?: string): Promise<PostWithAuthor | undefined>;
  createPost(data: InsertPost): Promise<Post>;
  voteOnPost(postId: number, userId: string, value: number): Promise<void>;

  // Comments
  getComments(postId: number, userId?: string): Promise<CommentWithAuthor[]>;
  createComment(data: InsertComment): Promise<Comment>;
  voteOnComment(commentId: number, userId: string, value: number): Promise<void>;
  acceptAnswer(commentId: number, postId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Universities
  async getUniversities(): Promise<University[]> {
    return db.select().from(universities);
  }

  async getUniversity(id: number): Promise<University | undefined> {
    const [university] = await db.select().from(universities).where(eq(universities.id, id));
    return university;
  }

  async createUniversity(data: InsertUniversity): Promise<University> {
    const [university] = await db.insert(universities).values(data).returning();
    return university;
  }

  // Courses
  async getCourses(universityId?: number): Promise<Course[]> {
    if (universityId) {
      return db.select().from(courses).where(eq(courses.universityId, universityId));
    }
    return db.select().from(courses);
  }

  async getCourse(id: number): Promise<(Course & { university: University }) | undefined> {
    const result = await db
      .select({
        id: courses.id,
        universityId: courses.universityId,
        code: courses.code,
        name: courses.name,
        description: courses.description,
        memberCount: courses.memberCount,
        university: universities,
      })
      .from(courses)
      .leftJoin(universities, eq(courses.universityId, universities.id))
      .where(eq(courses.id, id));
    
    if (result.length === 0 || !result[0].university) return undefined;
    
    return {
      ...result[0],
      university: result[0].university,
    };
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(data).returning();
    return course;
  }

  // Posts
  async getPosts(options: { courseId?: number; universityId?: number; sort?: string; userId?: string }): Promise<PostWithAuthor[]> {
    const { courseId, universityId, sort = "hot", userId } = options;

    let query = db
      .select({
        id: posts.id,
        courseId: posts.courseId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        voteCount: posts.voteCount,
        commentCount: posts.commentCount,
        isAnswered: posts.isAnswered,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        course: {
          id: courses.id,
          code: courses.code,
          name: courses.name,
          universityId: courses.universityId,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(courses, eq(posts.courseId, courses.id));

    const conditions = [];
    if (courseId) {
      conditions.push(eq(posts.courseId, courseId));
    }
    if (universityId) {
      conditions.push(eq(courses.universityId, universityId));
    }

    let results;
    if (conditions.length > 0) {
      results = await query.where(and(...conditions)).orderBy(
        sort === "new" ? desc(posts.createdAt) :
        sort === "top" ? desc(posts.voteCount) :
        desc(posts.voteCount) // hot is also by votes for simplicity
      );
    } else {
      results = await query.orderBy(
        sort === "new" ? desc(posts.createdAt) :
        sort === "top" ? desc(posts.voteCount) :
        desc(posts.voteCount)
      );
    }

    // Get user votes if userId provided
    let userVotes: Map<number, number> = new Map();
    if (userId && results.length > 0) {
      const postIds = results.map(r => r.id);
      const votes = await db
        .select()
        .from(postVotes)
        .where(and(
          eq(postVotes.userId, userId),
          sql`${postVotes.postId} = ANY(${postIds})`
        ));
      votes.forEach(v => userVotes.set(v.postId, v.value));
    }

    return results.map(r => ({
      id: r.id,
      courseId: r.courseId,
      authorId: r.authorId,
      title: r.title,
      content: r.content,
      voteCount: r.voteCount,
      commentCount: r.commentCount,
      isAnswered: r.isAnswered,
      createdAt: r.createdAt,
      author: r.author || { id: r.authorId, firstName: null, lastName: null, profileImageUrl: null },
      course: r.course || { id: r.courseId, code: "Unknown", name: "Unknown", universityId: 0 },
      userVote: userVotes.get(r.id),
    }));
  }

  async getPost(id: number, userId?: string): Promise<PostWithAuthor | undefined> {
    const result = await db
      .select({
        id: posts.id,
        courseId: posts.courseId,
        authorId: posts.authorId,
        title: posts.title,
        content: posts.content,
        voteCount: posts.voteCount,
        commentCount: posts.commentCount,
        isAnswered: posts.isAnswered,
        createdAt: posts.createdAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
        course: {
          id: courses.id,
          code: courses.code,
          name: courses.name,
          universityId: courses.universityId,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .leftJoin(courses, eq(posts.courseId, courses.id))
      .where(eq(posts.id, id));

    if (result.length === 0) return undefined;

    const r = result[0];
    let userVote: number | undefined;
    
    if (userId) {
      const [vote] = await db
        .select()
        .from(postVotes)
        .where(and(eq(postVotes.postId, id), eq(postVotes.userId, userId)));
      userVote = vote?.value;
    }

    return {
      id: r.id,
      courseId: r.courseId,
      authorId: r.authorId,
      title: r.title,
      content: r.content,
      voteCount: r.voteCount,
      commentCount: r.commentCount,
      isAnswered: r.isAnswered,
      createdAt: r.createdAt,
      author: r.author || { id: r.authorId, firstName: null, lastName: null, profileImageUrl: null },
      course: r.course || { id: r.courseId, code: "Unknown", name: "Unknown", universityId: 0 },
      userVote,
    };
  }

  async createPost(data: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(data).returning();
    return post;
  }

  async voteOnPost(postId: number, userId: string, value: number): Promise<void> {
    // Check existing vote
    const [existingVote] = await db
      .select()
      .from(postVotes)
      .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));

    if (existingVote) {
      if (existingVote.value === value) {
        // Remove vote (toggle off)
        await db.delete(postVotes).where(
          and(eq(postVotes.postId, postId), eq(postVotes.userId, userId))
        );
        await db.update(posts)
          .set({ voteCount: sql`${posts.voteCount} - ${value}` })
          .where(eq(posts.id, postId));
      } else {
        // Change vote
        await db.update(postVotes)
          .set({ value })
          .where(and(eq(postVotes.postId, postId), eq(postVotes.userId, userId)));
        await db.update(posts)
          .set({ voteCount: sql`${posts.voteCount} + ${value * 2}` })
          .where(eq(posts.id, postId));
      }
    } else {
      // New vote
      await db.insert(postVotes).values({ postId, userId, value });
      await db.update(posts)
        .set({ voteCount: sql`${posts.voteCount} + ${value}` })
        .where(eq(posts.id, postId));
    }
  }

  // Comments
  async getComments(postId: number, userId?: string): Promise<CommentWithAuthor[]> {
    const allComments = await db
      .select({
        id: comments.id,
        postId: comments.postId,
        parentId: comments.parentId,
        authorId: comments.authorId,
        content: comments.content,
        voteCount: comments.voteCount,
        isAcceptedAnswer: comments.isAcceptedAnswer,
        createdAt: comments.createdAt,
        author: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.isAcceptedAnswer), desc(comments.voteCount));

    // Get user votes
    let userVotes: Map<number, number> = new Map();
    if (userId && allComments.length > 0) {
      const commentIds = allComments.map(c => c.id);
      const votes = await db
        .select()
        .from(commentVotes)
        .where(and(
          eq(commentVotes.userId, userId),
          sql`${commentVotes.commentId} = ANY(${commentIds})`
        ));
      votes.forEach(v => userVotes.set(v.commentId, v.value));
    }

    // Build nested structure
    const commentMap = new Map<number, CommentWithAuthor>();
    const rootComments: CommentWithAuthor[] = [];

    allComments.forEach(c => {
      const comment: CommentWithAuthor = {
        id: c.id,
        postId: c.postId,
        parentId: c.parentId,
        authorId: c.authorId,
        content: c.content,
        voteCount: c.voteCount,
        isAcceptedAnswer: c.isAcceptedAnswer,
        createdAt: c.createdAt,
        author: c.author || { id: c.authorId, firstName: null, lastName: null, profileImageUrl: null },
        userVote: userVotes.get(c.id),
        replies: [],
      };
      commentMap.set(c.id, comment);
    });

    commentMap.forEach((comment) => {
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        } else {
          rootComments.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  }

  async createComment(data: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(data).returning();
    
    // Update post comment count
    await db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, data.postId));
    
    return comment;
  }

  async voteOnComment(commentId: number, userId: string, value: number): Promise<void> {
    const [existingVote] = await db
      .select()
      .from(commentVotes)
      .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId)));

    if (existingVote) {
      if (existingVote.value === value) {
        await db.delete(commentVotes).where(
          and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId))
        );
        await db.update(comments)
          .set({ voteCount: sql`${comments.voteCount} - ${value}` })
          .where(eq(comments.id, commentId));
      } else {
        await db.update(commentVotes)
          .set({ value })
          .where(and(eq(commentVotes.commentId, commentId), eq(commentVotes.userId, userId)));
        await db.update(comments)
          .set({ voteCount: sql`${comments.voteCount} + ${value * 2}` })
          .where(eq(comments.id, commentId));
      }
    } else {
      await db.insert(commentVotes).values({ commentId, userId, value });
      await db.update(comments)
        .set({ voteCount: sql`${comments.voteCount} + ${value}` })
        .where(eq(comments.id, commentId));
    }
  }

  async acceptAnswer(commentId: number, postId: number): Promise<void> {
    // Unmark any existing accepted answer
    await db.update(comments)
      .set({ isAcceptedAnswer: false })
      .where(eq(comments.postId, postId));
    
    // Mark this comment as accepted
    await db.update(comments)
      .set({ isAcceptedAnswer: true })
      .where(eq(comments.id, commentId));
    
    // Mark post as answered
    await db.update(posts)
      .set({ isAnswered: true })
      .where(eq(posts.id, postId));
  }
}

export const storage = new DatabaseStorage();
