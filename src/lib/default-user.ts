import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export const DEFAULT_USER_ID = "default-local-user";

let cached = false;

export async function getDefaultUserId(): Promise<string> {
  if (cached) return DEFAULT_USER_ID;

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, DEFAULT_USER_ID))
    .limit(1);

  if (!existing[0]) {
    await db
      .insert(users)
      .values({
        id: DEFAULT_USER_ID,
        email: "local@localhost",
        name: "Local User",
      })
      .onConflictDoNothing();
  }

  cached = true;
  return DEFAULT_USER_ID;
}
