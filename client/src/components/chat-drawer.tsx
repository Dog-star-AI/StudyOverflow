import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MessageSquare, Send, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { ChatThreadWithMeta, MessageWithSender } from "@shared/schema";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ChatListItem({ chat, isActive, onSelect }: { chat: ChatThreadWithMeta; isActive: boolean; onSelect: () => void }) {
  const fallback = chat.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={onSelect}
      className={cn(
        "w-full text-left p-3 rounded-md border transition-colors flex items-start gap-3",
        isActive ? "bg-primary/5 border-primary/40" : "hover:bg-muted/60"
      )}
    >
      <Avatar className="h-10 w-10">
        {chat.avatarUrl && <AvatarImage src={chat.avatarUrl} alt={chat.name} />}
        <AvatarFallback>{fallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{chat.name}</p>
        {chat.lastMessage ? (
          <p className="text-xs text-muted-foreground truncate">
            {chat.lastMessage.sender?.firstName || "Someone"}: {chat.lastMessage.content}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">No messages yet</p>
        )}
      </div>
      <div className="text-[11px] text-muted-foreground whitespace-nowrap">
        {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString() : ""}
      </div>
    </button>
  );
}

function MessageBubble({ message, isMine }: { message: MessageWithSender; isMine: boolean }) {
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "px-3 py-2 rounded-lg max-w-[75%] border",
          isMine ? "bg-primary text-primary-foreground border-primary/40" : "bg-muted/80"
        )}
      >
        {!isMine && (
          <p className="text-xs text-muted-foreground mb-0.5">
            {message.sender?.firstName || "Anon"}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          {new Date(message.createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

export function ChatDrawer({ open, onOpenChange }: ChatDrawerProps) {
  const { user } = useAuth();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [draft, setDraft] = useState("");

  const { data: chats = [], isLoading: chatsLoading } = useQuery<ChatThreadWithMeta[]>({
    queryKey: ["/api/chats"],
    enabled: open,
    refetchInterval: 12000,
  });

  const activeChat = useMemo(() => chats.find((c) => c.id === selectedChatId) ?? chats[0], [chats, selectedChatId]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/chats", activeChat?.id, "messages"],
    enabled: !!activeChat?.id && open,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (activeChat) setSelectedChatId(activeChat.id);
  }, [activeChat?.id]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      if (!activeChat) return;
      await apiRequest("POST", `/api/chats/${activeChat.id}/messages`, { content: draft });
    },
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["/api/chats", activeChat?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chats"] });
    },
  });

  const filteredChats = chats.filter((chat) =>
    chat.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-4xl">
        <SheetHeader className="space-y-1">
          <SheetTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </SheetTitle>
          <p className="text-sm text-muted-foreground">Start threads with your classmates or keep up with the group chat.</p>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 h-[80vh]">
          <Card className="p-3 flex flex-col">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search chats"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="pl-8"
              />
            </div>
            <ScrollArea className="mt-3 flex-1 pr-2">
              {chatsLoading ? (
                <div className="text-sm text-muted-foreground">Loading chats...</div>
              ) : filteredChats.length === 0 ? (
                <div className="text-sm text-muted-foreground">No chats yet</div>
              ) : (
                <div className="space-y-2">
                  {filteredChats.map((chat) => (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      isActive={activeChat?.id === chat.id}
                      onSelect={() => setSelectedChatId(chat.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          <Card className="p-4 md:col-span-2 flex flex-col">
            {activeChat ? (
              <>
                <div className="flex items-center justify-between border-b pb-3 mb-3">
                  <div>
                    <p className="font-semibold">{activeChat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeChat.isGroup ? `${activeChat.memberIds.length} members` : "Direct message"}
                    </p>
                  </div>
                </div>
                <ScrollArea className="flex-1 pr-3 mb-3">
                  {messagesLoading ? (
                    <div className="text-sm text-muted-foreground">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No messages yet. Say hi!</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <MessageBubble key={message.id} message={message} isMine={message.senderId === user?.id} />
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="flex items-end gap-2">
                  <Textarea
                    placeholder="Write a message"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-h-[64px]"
                  />
                  <Button
                    onClick={() => sendMutation.mutate()}
                    disabled={!draft.trim() || sendMutation.isPending}
                  >
                    {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a chat to start</div>
            )}
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
