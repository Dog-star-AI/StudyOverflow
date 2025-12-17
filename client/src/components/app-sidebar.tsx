import { Link, useLocation } from "wouter";
import { GraduationCap, BookOpen, Home, Plus, Search } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { University, Course } from "@shared/schema";
import { useState } from "react";

interface AppSidebarProps {
  universities: University[];
  courses: Course[];
  isLoading?: boolean;
  selectedUniversityId?: number;
  onUniversitySelect: (id: number | undefined) => void;
}

export function AppSidebar({ 
  universities, 
  courses, 
  isLoading, 
  selectedUniversityId,
  onUniversitySelect 
}: AppSidebarProps) {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredCourses = courses.filter((course) => {
    const matchesUniversity = !selectedUniversityId || course.universityId === selectedUniversityId;
    const matchesSearch = !searchQuery || 
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesUniversity && matchesSearch;
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg" data-testid="text-logo">StudyOverflow</span>
        </Link>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-home">
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/new"}>
                  <Link href="/new" data-testid="link-new-post">
                    <Plus className="h-4 w-4" />
                    <span>Ask a Question</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Universities</SidebarGroupLabel>
          <SidebarGroupContent>
            {isLoading ? (
              <div className="space-y-2 px-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={!selectedUniversityId}
                    onClick={() => onUniversitySelect(undefined)}
                    data-testid="button-all-universities"
                  >
                    <GraduationCap className="h-4 w-4" />
                    <span>All Universities</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {universities.map((uni) => (
                  <SidebarMenuItem key={uni.id}>
                    <SidebarMenuButton 
                      isActive={selectedUniversityId === uni.id}
                      onClick={() => onUniversitySelect(uni.id)}
                      data-testid={`button-university-${uni.id}`}
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span className="truncate">{uni.shortName}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Courses</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 mb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  data-testid="input-search-courses"
                />
              </div>
            </div>
            <ScrollArea className="h-[200px]">
              {isLoading ? (
                <div className="space-y-2 px-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <SidebarMenu>
                  {filteredCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                      No courses found
                    </p>
                  ) : (
                    filteredCourses.map((course) => (
                      <SidebarMenuItem key={course.id}>
                        <SidebarMenuButton asChild isActive={location === `/course/${course.id}`}>
                          <Link href={`/course/${course.id}`} data-testid={`link-course-${course.id}`}>
                            <BookOpen className="h-4 w-4" />
                            <span className="truncate">{course.code}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))
                  )}
                </SidebarMenu>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground text-center">
          Share problems. Find solutions.
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
