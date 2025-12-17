import { randomUUID } from "crypto";
import type { User, UpsertUser } from "@shared/models/auth";
import { getCollection } from "./mongo";

type UserDocument = User & {
  email: string;
  passwordHash?: string;
};

function toUser(doc: UserDocument): User {
  const { passwordHash: _ph, ...rest } = doc;
  return {
    ...rest,
    firstName: rest.firstName ?? null,
    lastName: rest.lastName ?? null,
    profileImageUrl: rest.profileImageUrl ?? null,
  };
}

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  const users = await getCollection<UserDocument>("users");
  return users.findOne({ email: email.toLowerCase() });
}

export async function findUserById(id: string): Promise<UserDocument | null> {
  const users = await getCollection<UserDocument>("users");
  return users.findOne({ id });
}

export async function findUsersByIds(ids: string[]): Promise<Map<string, User>> {
  if (ids.length === 0) return new Map();
  const users = await getCollection<UserDocument>("users");
  const docs = await users.find({ id: { $in: ids } }).toArray();
  const map = new Map<string, User>();
  docs.forEach((doc) => map.set(doc.id, toUser(doc)));
  return map;
}

export async function createUser(userData: UpsertUser & { passwordHash?: string }): Promise<UserDocument> {
  const users = await getCollection<UserDocument>("users");
  const now = new Date();
  const id = userData.id ?? randomUUID();
  const doc: UserDocument = {
    id,
    email: userData.email.toLowerCase(),
    firstName: userData.firstName ?? null,
    lastName: userData.lastName ?? null,
    profileImageUrl: userData.profileImageUrl ?? null,
    createdAt: userData.createdAt ?? now,
    updatedAt: userData.updatedAt ?? now,
    passwordHash: userData.passwordHash,
  };

  await users.insertOne(doc);
  return doc;
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  const users = await getCollection<UserDocument>("users");
  await users.updateOne(
    { id },
    { $set: { passwordHash, updatedAt: new Date() } }
  );
}

export function sanitizeUser(doc: UserDocument | null): User | null {
  return doc ? toUser(doc) : null;
}
