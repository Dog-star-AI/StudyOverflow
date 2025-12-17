import { useState } from "react";
import { CheckCircle, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { VoteControl } from "./vote-button";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { CommentWithAuthor } from "@shared/schema";

interface CommentProps {
  comment: CommentWithAuthor;
  depth: number;
  onUpvote: (commentId: number) => void;
  onDownvote: (commentId: number) => void;
  onReply: (parentId: number, content: string) => void;
  onAcceptAnswer?: (commentId: number) => void;
  isPostAuthor?: boolean;
  isVoting?: boolean;
}

export function Comment({ 
  comment, 
  depth, 
  onUpvote, 
  onDownvote, 
  onReply, 
  onAcceptAnswer,
  isPostAuthor,
  isVoting 
}: CommentProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const timeAgo = comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : "";
  const maxDepth = 5;
  const showNested = depth < maxDepth;

  const handleSubmitReply = () => {
    if (replyContent.trim()) {
      onReply(comment.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    }
  };

  return (
    <div 
      className={cn(
        "relative",
        depth > 0 && "ml-4 pl-4 border-l-2 border-muted"
      )}
      data-testid={`comment-${comment.id}`}
    >
      {comment.isAcceptedAnswer && (
        <Badge variant="secondary" className="text-chart-2 gap-1 mb-2">
          <CheckCircle className="h-3 w-3" />
          Accepted Answer
        </Badge>
      )}
      
      <div className="flex gap-3">
        <VoteControl
          voteCount={comment.voteCount ?? 0}
          userVote={comment.userVote}
          onUpvote={() => onUpvote(comment.id)}
          onDownvote={() => onDownvote(comment.id)}
          disabled={isVoting}
          size="sm"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <UserAvatar
              firstName={comment.author.firstName}
              lastName={comment.author.lastName}
              profileImageUrl={comment.author.profileImageUrl}
              size="sm"
            />
            <span className="font-medium text-foreground">
              {comment.author.firstName || "Anonymous"} {comment.author.lastName || ""}
            </span>
            <span className="text-muted-foreground/50">·</span>
            <span>{timeAgo}</span>
          </div>
          
          {!isCollapsed && (
            <>
              <p className="text-sm whitespace-pre-wrap" data-testid="text-comment-content">
                {comment.content}
              </p>
              
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  data-testid="button-reply"
                >
                  <MessageSquare className="h-4 w-4" />
                  Reply
                </Button>
                
                {isPostAuthor && !comment.isAcceptedAnswer && onAcceptAnswer && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAcceptAnswer(comment.id)}
                    className="text-chart-2"
                    data-testid="button-accept-answer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Accept Answer
                  </Button>
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    data-testid="button-collapse"
                  >
                    {isCollapsed ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Show {comment.replies.length} replies
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide replies
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {isReplying && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Write a reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-20 text-sm"
                    data-testid="input-reply"
                  />
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim()}
                      data-testid="button-submit-reply"
                    >
                      Post Reply
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsReplying(false)}
                      data-testid="button-cancel-reply"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {!isCollapsed && showNested && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onUpvote={onUpvote}
              onDownvote={onDownvote}
              onReply={onReply}
              onAcceptAnswer={onAcceptAnswer}
              isPostAuthor={isPostAuthor}
              isVoting={isVoting}
            />
          ))}
        </div>
      )}
      
      {!isCollapsed && !showNested && comment.replies && comment.replies.length > 0 && (
        <Button variant="ghost" size="sm" className="mt-2 text-muted-foreground">
          Continue thread ({comment.replies.length} more)
        </Button>
      )}
    </div>
  );
}

interface CommentThreadProps {
  comments: CommentWithAuthor[];
  onUpvote: (commentId: number) => void;
  onDownvote: (commentId: number) => void;
  onReply: (parentId: number, content: string) => void;
  onAcceptAnswer?: (commentId: number) => void;
  isPostAuthor?: boolean;
  isVoting?: boolean;
}

export function CommentThread({ 
  comments, 
  onUpvote, 
  onDownvote, 
  onReply, 
  onAcceptAnswer,
  isPostAuthor,
  isVoting 
}: CommentThreadProps) {
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          depth={0}
          onUpvote={onUpvote}
          onDownvote={onDownvote}
          onReply={onReply}
          onAcceptAnswer={onAcceptAnswer}
          isPostAuthor={isPostAuthor}
          isVoting={isVoting}
        />
      ))}
    </div>
  );
}
