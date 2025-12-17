import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { PostCard } from "@/components/post-card";
import { PostListSkeleton } from "@/components/post-skeleton";
import { SortTabs, type SortOption } from "@/components/sort-tabs";
import { EmptyState } from "@/components/empty-state";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/user-avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import type { PostWithAuthor, Course, University } from "@shared/schema";

interface HomePageProps {
  selectedCourseId?: number;
  selectedUniversityId?: number;
  searchTerm?: string;
}

export default function HomePage({ selectedCourseId, selectedUniversityId, searchTerm }: HomePageProps) {
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const { toast } = useToast();
  const { user } = useAuth();

  const queryParams = new URLSearchParams();
  queryParams.set("sort", sortBy);
  if (selectedCourseId) queryParams.set("courseId", selectedCourseId.toString());
  if (selectedUniversityId) queryParams.set("universityId", selectedUniversityId.toString());

  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", { sort: sortBy, courseId: selectedCourseId, universityId: selectedUniversityId }],
  });

  const { data: courses = [] } = useQuery<Course[]>({ queryKey: ["/api/courses"] });
  const { data: universities = [] } = useQuery<University[]>({ queryKey: ["/api/universities"] });

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

  const filteredPosts = posts?.filter((post) => {
    if (!searchTerm) return true;
    const haystack = `${post.title} ${post.content} ${post.course.code} ${post.author.firstName ?? ""} ${post.author.lastName ?? ""}`.toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const topPosts = (filteredPosts ?? [])
    .slice()
    .sort((a, b) => (b.voteCount ?? 0) - (a.voteCount ?? 0))
    .slice(0, 3);

  return (
    <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-4 items-start">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Main feed</p>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              {selectedCourseId ? "Course Questions" : selectedUniversityId ? "University Questions" : "All Questions"}
            </h1>
            {searchTerm && (
              <p className="text-sm text-muted-foreground">Filtering results for "{searchTerm}"</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" asChild size="sm">
              <Link href="/new">
                <PlusCircle className="h-4 w-4" />
                Create Post
              </Link>
            </Button>
            <SortTabs value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {isLoading ? (
          <PostListSkeleton />
        ) : !filteredPosts || filteredPosts.length === 0 ? (
          <EmptyState 
            type="posts" 
            actionLabel="Ask a Question"
            actionHref="/new"
          />
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
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

      <div className="space-y-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <UserAvatar firstName={user?.firstName} lastName={user?.lastName} profileImageUrl={user?.profileImageUrl} />
            <div className="min-w-0">
              <p className="font-semibold truncate">{user?.firstName || "Student"} {user?.lastName || ""}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">{user?.bio || "Share what you are studying."}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trending now</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No trending posts yet</p>
            ) : (
              topPosts.map((post) => (
                <Link key={post.id} href={`/post/${post.id}`} className="block">
                  <div className="p-2 rounded-md hover:bg-muted/60 transition-colors">
                    <p className="text-sm font-semibold line-clamp-1">{post.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Badge variant="outline">{post.course.code}</Badge>
                      {post.voteCount ?? 0} votes
                    </p>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top communities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(universities.slice(0, 5)).map((uni) => (
              <div key={uni.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{uni.shortName}</span>
                <Badge variant="secondary">{uni.memberCount || 0} members</Badge>
              </div>
            ))}
            {courses.slice(0, 4).map((course) => (
              <Link key={course.id} href={`/course/${course.id}`} className="block">
                <div className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/60 transition-colors">
                  <span className="truncate">{course.code}</span>
                  <Badge variant="outline">{course.memberCount || 0}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
