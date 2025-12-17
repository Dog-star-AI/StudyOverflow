import { MongoClient, type Db, type Document, type ModifyResult } from "mongodb";

export const mongoUrl = process.env.MONGODB_URI ?? process.env.DATABASE_URL;

if (!mongoUrl) {
  throw new Error("MONGODB_URI must be set. Did you forget to configure MongoDB?");
}

const dbName = process.env.MONGODB_DB ?? "studyoverflow";
const client = new MongoClient(mongoUrl);
let dbPromise: Promise<Db> | null = null;

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = client.connect().then((conn) => conn.db(dbName));
  }
  return dbPromise;
}

export async function getCollection<T extends Document = Document>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

export async function getNextId(sequenceName: string): Promise<number> {
  const counters = await getCollection<{ _id: string; seq: number }>("counters");
  const result = (await counters.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  )) as { value?: { seq?: number } };
  if (!result.value || typeof result.value.seq !== "number") {
    throw new Error(`Unable to increment counter for ${sequenceName}`);
  }
  return result.value.seq;
}
