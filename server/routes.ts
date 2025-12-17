import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { setupAuth, registerAuthRoutes, isAuthenticated, getSessionUserId } from "./auth";
import { insertCommentSchema, insertMessageSchema, insertChatSchema } from "@shared/schema";
import { z } from "zod";
import { updateUserProfile } from "./users";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // Profile settings
  app.put("/api/profile", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        firstName: z.string().min(1).max(50).optional().nullable(),
        lastName: z.string().min(1).max(50).optional().nullable(),
        profileImageUrl: z.string().url().max(500).optional().nullable(),
        bio: z.string().max(280).optional().nullable(),
      });

      const data = schema.parse(req.body);
      const userId = req.session!.userId!;
      const updated = await updateUserProfile(userId, data);
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Universities
  app.get("/api/universities", async (req, res) => {
    try {
      const universities = await storage.getUniversities();
      res.json(universities);
    } catch (error) {
      console.error("Error fetching universities:", error);
      res.status(500).json({ message: "Failed to fetch universities" });
    }
  });

  app.get("/api/universities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const university = await storage.getUniversity(id);
      if (!university) {
        return res.status(404).json({ message: "University not found" });
      }
      res.json(university);
    } catch (error) {
      console.error("Error fetching university:", error);
      res.status(500).json({ message: "Failed to fetch university" });
    }
  });

  // Courses
  app.get("/api/courses", async (req, res) => {
    try {
      const universityId = req.query.universityId ? parseInt(req.query.universityId as string, 10) : undefined;
      const courses = await storage.getCourses(universityId);
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  // Posts
  app.get("/api/posts", async (req, res) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string, 10) : undefined;
      const universityId = req.query.universityId ? parseInt(req.query.universityId as string, 10) : undefined;
      const sort = (req.query.sort as string) || "hot";
      const userId = getSessionUserId(req);
      
      const posts = await storage.getPosts({ courseId, universityId, sort, userId });
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const userId = getSessionUserId(req);
      const post = await storage.getPost(id, userId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const schema = z.object({
        title: z.string().min(5).max(200),
        content: z.string().min(20).max(10000),
        courseId: z.number(),
      });
      
      const data = schema.parse(req.body);
      const post = await storage.createPost({
        ...data,
        authorId: userId,
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.post("/api/posts/:id/vote", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      const userId = req.session!.userId!;
      const { value } = z.object({ value: z.number().min(-1).max(1) }).parse(req.body);
      
      if (value !== 1 && value !== -1) {
        return res.status(400).json({ message: "Vote value must be 1 or -1" });
      }
      
      await storage.voteOnPost(postId, userId, value);
      res.json({ success: true });
    } catch (error) {
      console.error("Error voting on post:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  // Notifications
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post("/api/notifications/read", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const schema = z.object({ ids: z.array(z.number()).optional() });
      const { ids } = schema.parse(req.body ?? {});
      await storage.markNotificationsRead(userId, ids);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notifications read:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });

  // Chats
  app.get("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const chats = await storage.getChats(userId);
      res.json(chats);
    } catch (error) {
      console.error("Error fetching chats:", error);
      res.status(500).json({ message: "Failed to fetch chats" });
    }
  });

  app.post("/api/chats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const parsed = insertChatSchema.parse(req.body);
      const memberIds = Array.from(new Set([userId, ...parsed.memberIds]));
      const chat = await storage.createChat({ ...parsed, memberIds });
      res.status(201).json(chat);
    } catch (error) {
      console.error("Error creating chat:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id, 10);
      const userId = req.session!.userId!;
      const chat = await storage.getChat(chatId);
      if (!chat || !chat.memberIds.includes(userId)) {
        return res.status(404).json({ message: "Chat not found" });
      }
      const messages = await storage.getMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chats/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const chatId = parseInt(req.params.id, 10);
      const userId = req.session!.userId!;
      const chat = await storage.getChat(chatId);
      if (!chat || !chat.memberIds.includes(userId)) {
        return res.status(404).json({ message: "Chat not found" });
      }

      const { content } = insertMessageSchema.parse(req.body);
      const message = await storage.addMessage(chatId, userId, content);

      // Notify other members
      await Promise.all(
        chat.memberIds
          .filter((memberId) => memberId !== userId)
          .map((memberId) =>
            storage.createNotification({
              userId: memberId,
              title: chat.isGroup ? chat.name : "New message",
              body: content.slice(0, 120),
              link: null,
              type: "chat",
            })
          )
      );

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Comments
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      const userId = getSessionUserId(req);
      const comments = await storage.getComments(postId, userId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = parseInt(req.params.id, 10);
      const userId = req.session!.userId!;
      const schema = z.object({
        content: z.string().min(1).max(10000),
        parentId: z.number().optional(),
      });
      
      const data = schema.parse(req.body);
      const comment = await storage.createComment({
        ...data,
        postId,
        authorId: userId,
        parentId: data.parentId ?? null,
      });

      const post = await storage.getPost(postId, userId);
      if (post && post.authorId !== userId) {
        await storage.createNotification({
          userId: post.authorId,
          title: "New reply to your question",
          body: data.content.slice(0, 120),
          link: `/post/${postId}`,
          type: "comment",
        });
      }
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.post("/api/comments/:id/vote", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id, 10);
      const userId = req.session!.userId!;
      const { value } = z.object({ value: z.number().min(-1).max(1) }).parse(req.body);
      
      if (value !== 1 && value !== -1) {
        return res.status(400).json({ message: "Vote value must be 1 or -1" });
      }
      
      await storage.voteOnComment(commentId, userId, value);
      res.json({ success: true });
    } catch (error) {
      console.error("Error voting on comment:", error);
      res.status(500).json({ message: "Failed to vote" });
    }
  });

  app.post("/api/comments/:id/accept", isAuthenticated, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id, 10);
      const userId = req.session!.userId!;
      const comment = await storage.getComment(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const post = await storage.getPost(comment.postId, userId);
      if (!post || post.authorId !== userId) {
        return res.status(403).json({ message: "Only the post author can accept answers" });
      }

      await storage.acceptAnswer(commentId, comment.postId);

      if (comment.authorId !== userId) {
        await storage.createNotification({
          userId: comment.authorId,
          title: "Your answer was accepted",
          body: "Congrats! Your answer was marked as the solution.",
          link: `/post/${comment.postId}`,
          type: "answer",
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting answer:", error);
      res.status(500).json({ message: "Failed to accept answer" });
    }
  });

  return httpServer;
}
