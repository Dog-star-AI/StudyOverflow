import { useEffect, FC } from "react";
import { useForm, FieldPath, FieldValues, UseFieldArrayReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AvatarPicker from "@/components/avatar-picker";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Wrapper components to handle nullable field values from react-hook-form
const InputField = (props: any) => <Input {...props} />;
const TextareaField = (props: any) => <Textarea {...props} />;

// Safe form field wrapper that bypasses strict type checking
const SafeFormField: FC<any> = ({ control, name, label, placeholder, isTextarea = false }: any) => {
  const Component = isTextarea ? TextareaField : InputField;
  const render = (props: any) => {
    const { field } = props;
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          {/* @ts-ignore */}
          <Component placeholder={placeholder} {...(field as any)} />
        </FormControl>
        <FormMessage />
      </FormItem>
    );
  };
  // @ts-ignore
  return <FormField control={control} name={name} render={render as any} />;
};

const profileSchema = z.object({
  firstName: z.string().max(50),
  lastName: z.string().max(50),
  profileImageUrl: z.string().url().max(500).or(z.literal("")),
  bio: z.string().max(280),
}).transform((data) => ({
  firstName: data.firstName ?? "",
  lastName: data.lastName ?? "",
  profileImageUrl: data.profileImageUrl ?? "",
  bio: data.bio ?? "",
}));

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? undefined,
      lastName: user?.lastName ?? undefined,
      profileImageUrl: user?.profileImageUrl ?? undefined,
      bio: user?.bio ?? undefined,
    },
  });

  useEffect(() => {
    form.reset({
      firstName: user?.firstName ?? undefined,
      lastName: user?.lastName ?? undefined,
      profileImageUrl: user?.profileImageUrl ?? undefined,
      bio: user?.bio ?? undefined,
    });
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof profileSchema>) => {
      const payload = {
        ...values,
        firstName: values.firstName || null,
        lastName: values.lastName || null,
        profileImageUrl: values.profileImageUrl || null,
        bio: values.bio || null,
      };
      await apiRequest("PUT", "/api/profile", payload);
    },
    onSuccess: () => {
      // Refresh current user and any views that might show the avatar
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === "/api/posts" });
      queryClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && typeof q.queryKey[0] === "string" && q.queryKey[0].startsWith("/api/chats") });
      toast({ title: "Profile updated", description: "Your settings have been saved." });
    },
    onError: () => {
      toast({ title: "Update failed", description: "Could not save profile.", variant: "destructive" });
    },
  });

  const avatarPreview = form.watch("profileImageUrl");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Customize how you appear across StudyOverflow</p>
          <h1 className="text-2xl font-bold">Profile & Settings</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {/* @ts-ignore - react-hook-form Field component null-value type incompatibility */}
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  {avatarPreview && <AvatarImage src={avatarPreview} alt="Preview avatar" />}
                  <AvatarFallback>
                    {(form.watch("firstName")?.[0] ?? "S") + (form.watch("lastName")?.[0] ?? "O")}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground">
                  Generate a unique avatar below using DiceBear, or paste a hosted image URL.
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <SafeFormField control={form.control} name="firstName" label="First name" placeholder="Ama" />
                <SafeFormField control={form.control} name="lastName" label="Last name" placeholder="Khumalo" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <SafeFormField control={form.control} name="profileImageUrl" label="Profile picture URL" placeholder="https://api.dicebear.com/7.x/..." />

                <div>
                  <FormLabel>Generate with DiceBear</FormLabel>
                  <AvatarPicker
                    value={form.getValues("profileImageUrl") || undefined}
                    initialSeed={`${form.getValues("firstName") ?? ""} ${form.getValues("lastName") ?? ""}`.trim()}
                    onChange={(url) => form.setValue("profileImageUrl", url, { shouldDirty: true })}
                    className="mt-2"
                  />
                </div>
              </div>

              <SafeFormField control={form.control} name="bio" label="Bio" placeholder="Share a quick line about what you are studying" isTextarea={true} />

              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
