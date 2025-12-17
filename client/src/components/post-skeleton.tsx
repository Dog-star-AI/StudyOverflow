import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function PostListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-8" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div className="flex-1 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        <Skeleton className="h-6 w-24" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 border rounded-lg">
              <div className="flex flex-col items-center gap-1">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-5 w-5 rounded" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
