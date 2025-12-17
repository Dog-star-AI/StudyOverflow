import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  profileImageUrl: z.string().nullable(),
  bio: z.string().max(280).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export type UpsertUser = {
  id?: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profileImageUrl?: string | null;
  bio?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};
