import { Link } from "wouter";
import { MessageSquare, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VoteControl } from "./vote-button";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { PostWithAuthor } from "@shared/schema";

interface PostCardProps {
  post: PostWithAuthor;
  onUpvote: () => void;
  onDownvote: () => void;
  isVoting?: boolean;
}

export function PostCard({ post, onUpvote, onDownvote, isVoting }: PostCardProps) {
  const timeAgo = post.createdAt ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true }) : "";
  
  return (
    <Card 
      className={cn(
        "hover-elevate transition-colors",
        post.isAnswered && "border-l-4 border-l-chart-2"
      )}
      data-testid={`card-post-${post.id}`}
    >
      <div className="flex gap-3 p-4">
        <VoteControl
          voteCount={post.voteCount ?? 0}
          userVote={post.userVote}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          disabled={isVoting}
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            {post.isAnswered && (
              <Badge variant="secondary" className="text-chart-2 gap-1 shrink-0">
                <CheckCircle className="h-3 w-3" />
                Solved
              </Badge>
            )}
            <Link href={`/post/${post.id}`}>
              <h3 
                className="text-lg font-semibold leading-tight hover:text-primary transition-colors cursor-pointer line-clamp-2"
                data-testid="link-post-title"
              >
                {post.title}
              </h3>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {post.content}
          </p>
          
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <Link href={`/course/${post.courseId}`}>
              <Badge variant="outline" className="cursor-pointer" data-testid="badge-course">
                {post.course.code}
              </Badge>
            </Link>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <UserAvatar
                firstName={post.author.firstName}
                lastName={post.author.lastName}
                profileImageUrl={post.author.profileImageUrl}
                size="sm"
              />
              <span data-testid="text-author">
                {post.author.firstName || "Anonymous"} {post.author.lastName || ""}
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span data-testid="text-time">{timeAgo}</span>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <MessageSquare className="h-4 w-4" />
              <span data-testid="text-comment-count">{post.commentCount} {post.commentCount === 1 ? "answer" : "answers"}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
