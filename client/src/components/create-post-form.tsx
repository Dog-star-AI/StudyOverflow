import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course } from "@shared/schema";

const createPostSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200, "Title is too long"),
  content: z.string().min(20, "Please provide more details about your problem").max(10000, "Content is too long"),
  courseId: z.string().min(1, "Please select a course"),
});

type CreatePostFormData = z.infer<typeof createPostSchema>;

interface CreatePostFormProps {
  courses: Course[];
  onSubmit: (data: { title: string; content: string; courseId: number }) => void;
  isSubmitting?: boolean;
}

export function CreatePostForm({ courses, onSubmit, isSubmitting }: CreatePostFormProps) {
  const [isPreview, setIsPreview] = useState(false);

  const form = useForm<CreatePostFormData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: "",
      content: "",
      courseId: "",
    },
  });

  const handleSubmit = (data: CreatePostFormData) => {
    onSubmit({
      title: data.title,
      content: data.content,
      courseId: parseInt(data.courseId, 10),
    });
  };

  const watchedContent = form.watch("content");
  const watchedTitle = form.watch("title");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Ask a Question</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-course">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()} data-testid={`option-course-${course.id}`}>
                          {course.code} - {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="What's your question? Be specific."
                      {...field}
                      data-testid="input-post-title"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-2">
                    <FormLabel>Details</FormLabel>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPreview(!isPreview)}
                      data-testid="button-toggle-preview"
                    >
                      {isPreview ? "Edit" : "Preview"}
                    </Button>
                  </div>
                  <FormControl>
                    {isPreview ? (
                      <div className="min-h-40 p-3 border rounded-md bg-muted/50 whitespace-pre-wrap text-sm">
                        {watchedContent || "Nothing to preview"}
                      </div>
                    ) : (
                      <Textarea
                        placeholder="Describe your problem in detail. Include any relevant code, error messages, or what you've tried so far."
                        className="min-h-40"
                        {...field}
                        data-testid="input-post-content"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="button-submit-post"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Question"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
