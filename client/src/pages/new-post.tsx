import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { CreatePostForm } from "@/components/create-post-form";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course } from "@shared/schema";

export default function NewPostPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; courseId: number }) => {
      const response = await apiRequest("POST", "/api/posts", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Success", description: "Your question has been posted!" });
      setLocation(`/post/${data.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post your question. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CreatePostForm
        courses={courses || []}
        onSubmit={(data) => createPostMutation.mutate(data)}
        isSubmitting={createPostMutation.isPending}
      />
    </div>
  );
}
