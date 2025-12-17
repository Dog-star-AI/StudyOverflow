import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ChevronLeft, BookOpen, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/post-card";
import { PostListSkeleton } from "@/components/post-skeleton";
import { SortTabs, type SortOption } from "@/components/sort-tabs";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Course, PostWithAuthor, University } from "@shared/schema";

interface CoursePageProps {
  courseId: number;
}

export default function CoursePage({ courseId }: CoursePageProps) {
  const [sortBy, setSortBy] = useState<SortOption>("hot");
  const { toast } = useToast();

  const { data: course, isLoading: courseLoading } = useQuery<Course & { university: University }>({
    queryKey: ["/api/courses", courseId],
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts", { courseId, sort: sortBy }],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ postId, value }: { postId: number; value: number }) => {
      await apiRequest("POST", `/api/posts/${postId}/vote`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to vote.", variant: "destructive" });
    },
  });

  if (courseLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
        <PostListSkeleton />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Course not found.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go Back Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-4 w-4" />
        Back to all questions
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary/10 text-primary shrink-0">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl" data-testid="text-course-title">
                {course.code}: {course.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1" data-testid="text-course-university">
                {course.university?.name || "Unknown University"}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {course.description && (
            <p className="text-sm text-muted-foreground mb-4" data-testid="text-course-description">
              {course.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <Badge variant="secondary" className="gap-1">
              <Users className="h-3 w-3" />
              {course.memberCount || 0} members
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold">Questions in this course</h2>
        <SortTabs value={sortBy} onChange={setSortBy} />
      </div>

      {postsLoading ? (
        <PostListSkeleton />
      ) : !posts || posts.length === 0 ? (
        <EmptyState 
          type="posts" 
          message="No questions in this course yet. Be the first to ask!"
          actionLabel="Ask a Question"
          actionHref="/new"
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpvote={() => voteMutation.mutate({ postId: post.id, value: 1 })}
              onDownvote={() => voteMutation.mutate({ postId: post.id, value: -1 })}
              isVoting={voteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
