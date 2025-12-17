import { Flame, Clock, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortOption = "hot" | "new" | "top";

interface SortTabsProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const sortOptions = [
  { value: "hot" as const, label: "Hot", icon: Flame },
  { value: "new" as const, label: "New", icon: Clock },
  { value: "top" as const, label: "Top", icon: TrendingUp },
];

export function SortTabs({ value, onChange }: SortTabsProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-md">
      {sortOptions.map((option) => {
        const Icon = option.icon;
        const isActive = value === option.value;
        
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              "hover-elevate",
              isActive && "bg-background shadow-sm",
              !isActive && "text-muted-foreground"
            )}
            data-testid={`button-sort-${option.value}`}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
