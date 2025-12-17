import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { PostCard } from "@/components/post-card";
import { PostListSkeleton } from "@/components/post-skeleton";
import { SortTabs, type SortOption } from "@/components/sort-tabs";
import { EmptyState } from "@/components/empty-state";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PostWithAuthor } from "@shared/schema";

interface HomePageProps {
  selectedCourseId?: number;
  selectedUniversityId?: number;
}

export default function HomePage({ selectedCourseId, selectedUniversityId }: HomePageProps) {
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const { toast } = useToast();

  const queryParams = new URLSearchParams();
  queryParams.set("sort", sortBy);
  if (selectedCourseId) queryParams.set("courseId", selectedCourseId.toString());
  if (selectedUniversityId) queryParams.set("universityId", selectedUniversityId.toString());

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", { sort: sortBy, courseId: selectedCourseId, universityId: selectedUniversityId }],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ postId, value }: { postId: number; value: number }) => {
      await apiRequest("POST", `/api/posts/${postId}/vote`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to vote. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVote = (postId: number, value: number) => {
    voteMutation.mutate({ postId, value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">
          {selectedCourseId ? "Course Questions" : selectedUniversityId ? "University Questions" : "All Questions"}
        </h1>
        <SortTabs value={sortBy} onChange={setSortBy} />
      </div>

      {isLoading ? (
        <PostListSkeleton />
      ) : !posts || posts.length === 0 ? (
        <EmptyState 
          type="posts" 
          actionLabel="Ask a Question"
          actionHref="/new"
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpvote={() => handleVote(post.id, 1)}
              onDownvote={() => handleVote(post.id, -1)}
              isVoting={voteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
