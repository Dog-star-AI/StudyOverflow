import { useState, useEffect } from "react";
import { Switch, Route, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LandingPage } from "@/components/landing-page";
import { useAuth } from "@/hooks/use-auth";
import { LogOut } from "lucide-react";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home";
import PostDetailPage from "@/pages/post-detail";
import NewPostPage from "@/pages/new-post";
import CoursePage from "@/pages/course";
import type { University, Course } from "@shared/schema";

function AuthenticatedApp() {
  const { user } = useAuth();
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | undefined>();
  
  const [matchPost, postParams] = useRoute("/post/:id");
  const [matchCourse, courseParams] = useRoute("/course/:id");

  const { data: universities = [], isLoading: universitiesLoading } = useQuery<University[]>({
    queryKey: ["/api/universities"],
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar
          universities={universities}
          courses={courses}
          isLoading={universitiesLoading || coursesLoading}
          selectedUniversityId={selectedUniversityId}
          onUniversitySelect={setSelectedUniversityId}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="flex items-center justify-between gap-4 p-3 border-b sticky top-0 bg-background z-50">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <UserAvatar
                      firstName={user?.firstName}
                      lastName={user?.lastName}
                      profileImageUrl={user?.profileImageUrl}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href="/api/logout" className="flex items-center gap-2" data-testid="link-logout">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
              <Switch>
                <Route path="/">
                  <HomePage selectedUniversityId={selectedUniversityId} />
                </Route>
                <Route path="/new">
                  <NewPostPage />
                </Route>
                <Route path="/post/:id">
                  {matchPost && postParams?.id && (
                    <PostDetailPage postId={parseInt(postParams.id, 10)} />
                  )}
                </Route>
                <Route path="/course/:id">
                  {matchCourse && courseParams?.id && (
                    <CoursePage courseId={parseInt(courseParams.id, 10)} />
                  )}
                </Route>
                <Route component={NotFound} />
              </Switch>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
