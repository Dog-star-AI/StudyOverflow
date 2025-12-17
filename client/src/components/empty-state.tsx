import { MessageSquare, Search, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface EmptyStateProps {
  type: "posts" | "comments" | "courses" | "search";
  message?: string;
  actionLabel?: string;
  actionHref?: string;
}

const icons = {
  posts: MessageSquare,
  comments: MessageSquare,
  courses: BookOpen,
  search: Search,
};

const defaultMessages = {
  posts: "No questions yet. Be the first to ask!",
  comments: "No answers yet. Share your knowledge!",
  courses: "No courses available.",
  search: "No results found. Try a different search.",
};

export function EmptyState({ type, message, actionLabel, actionHref }: EmptyStateProps) {
  const Icon = icons[type];
  const displayMessage = message || defaultMessages[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground mb-4" data-testid="text-empty-message">
        {displayMessage}
      </p>
      {actionLabel && actionHref && (
        <Button asChild data-testid="button-empty-action">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
