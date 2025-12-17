import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteButtonProps {
  direction: "up" | "down";
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function VoteButton({ direction, isActive, onClick, disabled }: VoteButtonProps) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={`button-vote-${direction}`}
      className={cn(
        "p-2 rounded-full transition-colors border bg-muted/70 hover:bg-background shadow-sm",
        isActive && direction === "up" && "text-chart-2",
        isActive && direction === "down" && "text-destructive",
        !isActive && "text-muted-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

interface VoteControlProps {
  voteCount: number;
  userVote?: number;
  onUpvote: () => void;
  onDownvote: () => void;
  disabled?: boolean;
  size?: "sm" | "default";
}

export function VoteControl({ voteCount, userVote, onUpvote, onDownvote, disabled, size = "default" }: VoteControlProps) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-1 rounded-xl border bg-muted/50 px-2 py-2",
      size === "sm" && "scale-90"
    )}>
      <VoteButton
        direction="up"
        isActive={userVote === 1}
        onClick={onUpvote}
        disabled={disabled}
      />
      <span 
        className={cn(
          "font-semibold text-sm tabular-nums",
          voteCount > 0 && "text-chart-2",
          voteCount < 0 && "text-destructive",
          voteCount === 0 && "text-muted-foreground"
        )}
        data-testid="text-vote-count"
      >
        {voteCount}
      </span>
      <VoteButton
        direction="down"
        isActive={userVote === -1}
        onClick={onDownvote}
        disabled={disabled}
      />
    </div>
  );
}
