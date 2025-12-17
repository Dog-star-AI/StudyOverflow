import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VoteControl } from "@/components/vote-button";
import { UserAvatar } from "@/components/user-avatar";
import { CommentThread } from "@/components/comment-thread";
import { PostDetailSkeleton } from "@/components/post-skeleton";
import { EmptyState } from "@/components/empty-state";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDistanceToNow } from "date-fns";
import type { PostWithAuthor, CommentWithAuthor } from "@shared/schema";

interface PostDetailPageProps {
  postId: number;
}

export default function PostDetailPage({ postId }: PostDetailPageProps) {
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: post, isLoading: postLoading } = useQuery<PostWithAuthor>({
    queryKey: ["/api/posts", postId],
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/posts", postId, "comments"],
  });

  const postVoteMutation = useMutation({
    mutationFn: async ({ value }: { value: number }) => {
      await apiRequest("POST", `/api/posts/${postId}/vote`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to vote.", variant: "destructive" });
    },
  });

  const commentVoteMutation = useMutation({
    mutationFn: async ({ commentId, value }: { commentId: number; value: number }) => {
      await apiRequest("POST", `/api/comments/${commentId}/vote`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to vote.", variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({ parentId, content }: { parentId?: number; content: string }) => {
      await apiRequest("POST", `/api/posts/${postId}/comments`, { parentId, content });
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      toast({ title: "Success", description: "Your answer has been posted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to post answer.", variant: "destructive" });
    },
  });

  const acceptAnswerMutation = useMutation({
    mutationFn: async ({ commentId }: { commentId: number }) => {
      await apiRequest("POST", `/api/comments/${commentId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      toast({ title: "Success", description: "Answer marked as accepted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to accept answer.", variant: "destructive" });
    },
  });

  if (postLoading) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Post not found.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go Back Home</Link>
        </Button>
      </div>
    );
  }

  const timeAgo = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";
  const isPostAuthor = user?.id === post.authorId;

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to questions
      </Link>

      <Card className="p-6">
        <div className="flex gap-4">
          <VoteControl
            voteCount={post.voteCount ?? 0}
            userVote={post.userVote}
            onUpvote={() => postVoteMutation.mutate({ value: 1 })}
            onDownvote={() => postVoteMutation.mutate({ value: -1 })}
            disabled={postVoteMutation.isPending}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-3">
              {post.isAnswered && (
                <Badge variant="secondary" className="text-chart-2 gap-1 shrink-0">
                  <CheckCircle className="h-3 w-3" />
                  Solved
                </Badge>
              )}
              <h1 className="text-2xl font-bold" data-testid="text-post-title">{post.title}</h1>
            </div>

            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <Link href={`/course/${post.courseId}`}>
                <Badge variant="outline" className="cursor-pointer" data-testid="badge-post-course">
                  {post.course.code}
                </Badge>
              </Link>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserAvatar
                  firstName={post.author.firstName}
                  lastName={post.author.lastName}
                  profileImageUrl={post.author.profileImageUrl}
                  size="sm"
                />
                <span data-testid="text-post-author">
                  {post.author.firstName || "Anonymous"} {post.author.lastName || ""}
                </span>
                <span className="text-muted-foreground/50">·</span>
                <span data-testid="text-post-time">{timeAgo}</span>
              </div>
            </div>

            <div className="prose prose-sm max-w-none dark:prose-invert" data-testid="text-post-content">
              <p className="whitespace-pre-wrap">{post.content}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {post.commentCount} {post.commentCount === 1 ? "Answer" : "Answers"}
        </h2>

        <Card className="p-4">
          <div className="space-y-3">
            <Textarea
              placeholder="Write your answer... Be detailed and helpful!"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-28"
              data-testid="input-new-answer"
            />
            <div className="flex justify-end">
              <Button
                onClick={() => addCommentMutation.mutate({ content: newComment })}
                disabled={!newComment.trim() || addCommentMutation.isPending}
                data-testid="button-submit-answer"
              >
                {addCommentMutation.isPending ? "Posting..." : "Post Answer"}
              </Button>
            </div>
          </div>
        </Card>

        {commentsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse p-4 border rounded-lg space-y-2">
                <div className="h-4 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : !comments || comments.length === 0 ? (
          <EmptyState type="comments" />
        ) : (
          <CommentThread
            comments={comments}
            onUpvote={(commentId) => commentVoteMutation.mutate({ commentId, value: 1 })}
            onDownvote={(commentId) => commentVoteMutation.mutate({ commentId, value: -1 })}
            onReply={(parentId, content) => addCommentMutation.mutate({ parentId, content })}
            onAcceptAnswer={isPostAuthor ? (commentId) => acceptAnswerMutation.mutate({ commentId }) : undefined}
            isPostAuthor={isPostAuthor}
            isVoting={commentVoteMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
