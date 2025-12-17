import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div className="p-3 rounded-md border hover:bg-muted/60 transition-colors">
      <div className="flex items-start gap-2">
        <div className="mt-0.5">
          <Badge variant={notification.isRead ? "outline" : "secondary"} className="text-xs">
            {notification.type === "chat" ? "Chat" : notification.type === "answer" ? "Answer" : "Update"}
          </Badge>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold line-clamp-1">{notification.title}</p>
          <p className="text-sm text-muted-foreground line-clamp-2">{notification.body}</p>
          <p className="text-[11px] text-muted-foreground mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 15000,
  });

  const [markingIds, setMarkingIds] = useState<number[]>([]);

  const markMutation = useMutation({
    mutationFn: async (ids?: number[]) => {
      setMarkingIds(ids ?? []);
      await apiRequest("POST", "/api/notifications/read", ids ? { ids } : {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onSettled: () => setMarkingIds([]),
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="flex-row items-center justify-between space-y-0">
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
            {unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}
          </SheetTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markMutation.mutate(undefined)}
            disabled={notifications.length === 0 || markMutation.isPending}
          >
            {markMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all read
          </Button>
        </SheetHeader>
        <div className="mt-4 h-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center gap-2 text-muted-foreground">
              <Bell className="h-6 w-6" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-180px)] pr-3">
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div key={notification.id} className="group">
                    <NotificationItem notification={notification} />
                    {!notification.isRead && (
                      <div className="flex justify-end mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => markMutation.mutate([notification.id])}
                          disabled={markMutation.isPending && markingIds.includes(notification.id)}
                        >
                          Mark read
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
