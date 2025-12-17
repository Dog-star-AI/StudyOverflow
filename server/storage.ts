import type {
  Comment,
  CommentWithAuthor,
  Course,
  InsertComment,
  InsertCourse,
  InsertPost,
  InsertUniversity,
  Post,
  PostWithAuthor,
  University,
  User,
} from "@shared/schema";
import type { Sort, Filter } from "mongodb";
import { getCollection, getNextId } from "./mongo";
import { findUsersByIds } from "./users";

type UniversityDocument = Omit<University, "id"> & { _id: number };
type CourseDocument = Omit<Course, "id"> & { _id: number };
type PostDocument = Omit<Post, "id"> & { _id: number };
type CommentDocument = Omit<Comment, "id"> & { _id: number };
type PostVoteDocument = { postId: number; userId: string; value: number };
type CommentVoteDocument = { commentId: number; userId: string; value: number };

function toAuthorProfile(user: User | undefined, fallbackId: string) {
  if (!user) {
    return { id: fallbackId, firstName: null, lastName: null, profileImageUrl: null };
  }
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
  };
}

export interface IStorage {
  getUniversities(): Promise<University[]>;
  getUniversity(id: number): Promise<University | undefined>;
  createUniversity(data: InsertUniversity): Promise<University>;

  getCourses(universityId?: number): Promise<Course[]>;
  getCourse(id: number): Promise<(Course & { university: University }) | undefined>;
  createCourse(data: InsertCourse): Promise<Course>;

  getPosts(options: { courseId?: number; universityId?: number; sort?: string; userId?: string }): Promise<PostWithAuthor[]>;
  getPost(id: number, userId?: string): Promise<PostWithAuthor | undefined>;
  createPost(data: InsertPost): Promise<Post>;
  voteOnPost(postId: number, userId: string, value: number): Promise<void>;

  getComments(postId: number, userId?: string): Promise<CommentWithAuthor[]>;
  getComment(id: number): Promise<Comment | undefined>;
  createComment(data: InsertComment): Promise<Comment>;
  voteOnComment(commentId: number, userId: string, value: number): Promise<void>;
  acceptAnswer(commentId: number, postId: number): Promise<void>;
}

async function mapCourses(ids: number[]): Promise<Map<number, Course>> {
  if (ids.length === 0) return new Map();
  const coursesCol = await getCollection<CourseDocument>("courses");
  const docs = await coursesCol.find({ _id: { $in: ids } }).toArray();
  return new Map(
    docs.map((c) => [
      c._id,
      {
        id: c._id,
        universityId: c.universityId,
        code: c.code,
        name: c.name,
        description: c.description ?? null,
        memberCount: c.memberCount ?? 0,
      },
    ])
  );
}

export class DatabaseStorage implements IStorage {
  async getUniversities(): Promise<University[]> {
    const universities = await getCollection<UniversityDocument>("universities");
    const docs = await universities.find({}).toArray();
    return docs.map((u) => ({
      id: u._id,
      name: u.name,
      shortName: u.shortName,
      description: u.description ?? null,
      logoUrl: u.logoUrl ?? null,
      memberCount: u.memberCount ?? 0,
    }));
  }

  async getUniversity(id: number): Promise<University | undefined> {
    const universities = await getCollection<UniversityDocument>("universities");
    const doc = await universities.findOne({ _id: id });
    if (!doc) return undefined;
    return {
      id: doc._id,
      name: doc.name,
      shortName: doc.shortName,
      description: doc.description ?? null,
      logoUrl: doc.logoUrl ?? null,
      memberCount: doc.memberCount ?? 0,
    };
  }

  async createUniversity(data: InsertUniversity): Promise<University> {
    const universities = await getCollection<UniversityDocument>("universities");
    const id = await getNextId("universities");
    const doc: UniversityDocument = {
      _id: id,
      name: data.name,
      shortName: data.shortName,
      description: data.description ?? null,
      logoUrl: data.logoUrl ?? null,
      memberCount: 0,
    };
    await universities.insertOne(doc);
    return {
      id,
      name: doc.name,
      shortName: doc.shortName,
      description: doc.description,
      logoUrl: doc.logoUrl,
      memberCount: doc.memberCount,
    };
  }

  async getCourses(universityId?: number): Promise<Course[]> {
    const courses = await getCollection<CourseDocument>("courses");
    const filter = universityId ? { universityId } : {};
    const docs = await courses.find(filter).toArray();
    return docs.map((c) => ({
      id: c._id,
      universityId: c.universityId,
      code: c.code,
      name: c.name,
      description: c.description ?? null,
      memberCount: c.memberCount ?? 0,
    }));
  }

  async getCourse(id: number): Promise<(Course & { university: University }) | undefined> {
    const courses = await getCollection<CourseDocument>("courses");
    const course = await courses.findOne({ _id: id });
    if (!course) return undefined;
    const university = await this.getUniversity(course.universityId);
    if (!university) return undefined;
    return {
      id: course._id,
      universityId: course.universityId,
      code: course.code,
      name: course.name,
      description: course.description ?? null,
      memberCount: course.memberCount ?? 0,
      university,
    };
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    const courses = await getCollection<CourseDocument>("courses");
    const id = await getNextId("courses");
    const doc: CourseDocument = {
      _id: id,
      universityId: data.universityId,
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      memberCount: 0,
    };
    await courses.insertOne(doc);
    return {
      id,
      universityId: doc.universityId,
      code: doc.code,
      name: doc.name,
      description: doc.description,
      memberCount: doc.memberCount,
    };
  }

  async getPosts(options: { courseId?: number; universityId?: number; sort?: string; userId?: string }): Promise<PostWithAuthor[]> {
    const { courseId, universityId, sort = "hot", userId } = options;
    const postsCol = await getCollection<PostDocument>("posts");
    const filter: Filter<PostDocument> = {};

    if (courseId !== undefined) {
      filter.courseId = courseId;
    }

    if (universityId !== undefined) {
      const courses = await getCollection<CourseDocument>("courses");
      const courseIds = await courses
        .find({ universityId }, { projection: { _id: 1 } })
        .map((c) => c._id)
        .toArray();
      if (courseIds.length === 0) {
        return [];
      }
      if (filter.courseId === undefined) {
        filter.courseId = { $in: courseIds };
      }
    }

    const order: Sort = sort === "new" ? { createdAt: -1 } : { voteCount: -1 };
    const postDocs = await postsCol.find(filter).sort(order).toArray();

    const courseMap = await mapCourses(Array.from(new Set(postDocs.map((p) => p.courseId))));
    const authorMap = await findUsersByIds(Array.from(new Set(postDocs.map((p) => p.authorId))));

    const userVotes = new Map<number, number>();
    if (userId && postDocs.length > 0) {
      const postVotes = await getCollection<PostVoteDocument>("postVotes");
      const votes = await postVotes
        .find({ userId, postId: { $in: postDocs.map((p) => p._id) } })
        .toArray();
      votes.forEach((v) => userVotes.set(v.postId, v.value));
    }

    return postDocs.map((p) => ({
      id: p._id,
      courseId: p.courseId,
      authorId: p.authorId,
      title: p.title,
      content: p.content,
      voteCount: p.voteCount ?? 0,
      commentCount: p.commentCount ?? 0,
      isAnswered: p.isAnswered ?? false,
      createdAt: new Date(p.createdAt),
      author: toAuthorProfile(authorMap.get(p.authorId), p.authorId),
      course: courseMap.get(p.courseId) ?? { id: p.courseId, code: "Unknown", name: "Unknown", universityId: 0, memberCount: 0 },
      userVote: userVotes.get(p._id),
    }));
  }

  async getPost(id: number, userId?: string): Promise<PostWithAuthor | undefined> {
    const posts = await getCollection<PostDocument>("posts");
    const post = await posts.findOne({ _id: id });
    if (!post) return undefined;

    const [course, author] = await Promise.all([
      mapCourses([post.courseId]),
      findUsersByIds([post.authorId]),
    ]);

    let userVote: number | undefined;
    if (userId) {
      const postVotes = await getCollection<PostVoteDocument>("postVotes");
      const vote = await postVotes.findOne({ postId: id, userId });
      userVote = vote?.value;
    }

    return {
      id: post._id,
      courseId: post.courseId,
      authorId: post.authorId,
      title: post.title,
      content: post.content,
      voteCount: post.voteCount ?? 0,
      commentCount: post.commentCount ?? 0,
      isAnswered: post.isAnswered ?? false,
      createdAt: new Date(post.createdAt),
      author: toAuthorProfile(author.get(post.authorId), post.authorId),
      course: course.get(post.courseId) ?? { id: post.courseId, code: "Unknown", name: "Unknown", universityId: 0, memberCount: 0 },
      userVote,
    };
  }

  async createPost(data: InsertPost): Promise<Post> {
    const posts = await getCollection<PostDocument>("posts");
    const id = await getNextId("posts");
    const now = new Date();
    const doc: PostDocument = {
      _id: id,
      courseId: data.courseId,
      authorId: data.authorId,
      title: data.title,
      content: data.content,
      voteCount: 0,
      commentCount: 0,
      isAnswered: false,
      createdAt: now,
    };
    await posts.insertOne(doc);
    return {
      id,
      courseId: doc.courseId,
      authorId: doc.authorId,
      title: doc.title,
      content: doc.content,
      voteCount: doc.voteCount,
      commentCount: doc.commentCount,
      isAnswered: doc.isAnswered,
      createdAt: doc.createdAt,
    };
  }

  async voteOnPost(postId: number, userId: string, value: number): Promise<void> {
    const postVotes = await getCollection<PostVoteDocument>("postVotes");
    const posts = await getCollection<PostDocument>("posts");
    const existing = await postVotes.findOne({ postId, userId });

    if (existing) {
      if (existing.value === value) {
        await postVotes.deleteOne({ postId, userId });
        await posts.updateOne({ _id: postId }, { $inc: { voteCount: -value } });
      } else {
        await postVotes.updateOne({ postId, userId }, { $set: { value } });
        await posts.updateOne({ _id: postId }, { $inc: { voteCount: value * 2 } });
      }
    } else {
      await postVotes.insertOne({ postId, userId, value });
      await posts.updateOne({ _id: postId }, { $inc: { voteCount: value } });
    }
  }

  async getComments(postId: number, userId?: string): Promise<CommentWithAuthor[]> {
    const commentsCol = await getCollection<CommentDocument>("comments");
    const allComments = await commentsCol
      .find({ postId })
      .sort({ isAcceptedAnswer: -1, voteCount: -1, createdAt: -1 })
      .toArray();

    const authorMap = await findUsersByIds(Array.from(new Set(allComments.map((c) => c.authorId))));
    const userVotes = new Map<number, number>();
    if (userId && allComments.length > 0) {
      const votesCol = await getCollection<CommentVoteDocument>("commentVotes");
      const votes = await votesCol
        .find({ userId, commentId: { $in: allComments.map((c) => c._id) } })
        .toArray();
      votes.forEach((v) => userVotes.set(v.commentId, v.value));
    }

    const commentMap = new Map<number, CommentWithAuthor>();
    const rootComments: CommentWithAuthor[] = [];

    allComments.forEach((c) => {
      const comment: CommentWithAuthor = {
        id: c._id,
        postId: c.postId,
        parentId: c.parentId ?? null,
        authorId: c.authorId,
        content: c.content,
        voteCount: c.voteCount ?? 0,
        isAcceptedAnswer: c.isAcceptedAnswer ?? false,
        createdAt: new Date(c.createdAt),
        author: toAuthorProfile(authorMap.get(c.authorId), c.authorId),
        userVote: userVotes.get(c._id),
        replies: [],
      };
      commentMap.set(c._id, comment);
    });

    commentMap.forEach((comment) => {
      if (comment.parentId != null) {
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

  async getComment(id: number): Promise<Comment | undefined> {
    const comments = await getCollection<CommentDocument>("comments");
    const comment = await comments.findOne({ _id: id });
    if (!comment) return undefined;
    return {
      id: comment._id,
      postId: comment.postId,
      parentId: comment.parentId ?? null,
      authorId: comment.authorId,
      content: comment.content,
      voteCount: comment.voteCount ?? 0,
      isAcceptedAnswer: comment.isAcceptedAnswer ?? false,
      createdAt: new Date(comment.createdAt),
    };
  }

  async createComment(data: InsertComment): Promise<Comment> {
    const comments = await getCollection<CommentDocument>("comments");
    const posts = await getCollection<PostDocument>("posts");
    const id = await getNextId("comments");
    const now = new Date();
    const doc: CommentDocument = {
      _id: id,
      postId: data.postId,
      parentId: data.parentId ?? null,
      authorId: data.authorId,
      content: data.content,
      voteCount: 0,
      isAcceptedAnswer: false,
      createdAt: now,
    };
    await comments.insertOne(doc);
    await posts.updateOne({ _id: data.postId }, { $inc: { commentCount: 1 } });
    return {
      id,
      postId: doc.postId,
      parentId: doc.parentId,
      authorId: doc.authorId,
      content: doc.content,
      voteCount: doc.voteCount,
      isAcceptedAnswer: doc.isAcceptedAnswer,
      createdAt: doc.createdAt,
    };
  }

  async voteOnComment(commentId: number, userId: string, value: number): Promise<void> {
    const commentVotes = await getCollection<CommentVoteDocument>("commentVotes");
    const comments = await getCollection<CommentDocument>("comments");
    const existing = await commentVotes.findOne({ commentId, userId });

    if (existing) {
      if (existing.value === value) {
        await commentVotes.deleteOne({ commentId, userId });
        await comments.updateOne({ _id: commentId }, { $inc: { voteCount: -value } });
      } else {
        await commentVotes.updateOne({ commentId, userId }, { $set: { value } });
        await comments.updateOne({ _id: commentId }, { $inc: { voteCount: value * 2 } });
      }
    } else {
      await commentVotes.insertOne({ commentId, userId, value });
      await comments.updateOne({ _id: commentId }, { $inc: { voteCount: value } });
    }
  }

  async acceptAnswer(commentId: number, postId: number): Promise<void> {
    const comments = await getCollection<CommentDocument>("comments");
    const posts = await getCollection<PostDocument>("posts");

    await comments.updateMany({ postId }, { $set: { isAcceptedAnswer: false } });
    await comments.updateOne({ _id: commentId }, { $set: { isAcceptedAnswer: true } });
    await posts.updateOne({ _id: postId }, { $set: { isAnswered: true } });
  }
}

export const storage = new DatabaseStorage();
