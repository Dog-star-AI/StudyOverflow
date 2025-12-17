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
  let next = result.value?.seq;

  if (typeof next !== "number") {
    const fallback = await counters.findOne({ _id: sequenceName });
    if (fallback?.seq) {
      next = fallback.seq;
    } else {
      await counters.insertOne({ _id: sequenceName, seq: 1 });
      next = 1;
    }
  }

  return next;
}
