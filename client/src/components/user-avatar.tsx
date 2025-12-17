import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function UserAvatar({ firstName, lastName, profileImageUrl, size = "default", className }: UserAvatarProps) {
  const initials = [firstName?.[0], lastName?.[0]].filter(Boolean).join("").toUpperCase() || "U";
  
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    default: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage
        src={profileImageUrl || undefined}
        alt={`${firstName || ""} ${lastName || ""}`}
        loading="lazy"
        className="object-cover"
      />
      <AvatarFallback className="bg-primary text-primary-foreground">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
