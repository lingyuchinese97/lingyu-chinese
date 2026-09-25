import { like } from "drizzle-orm";
import { db } from "@/server/db/client";
import { user } from "@/server/db/schema";

/** Tạo nhanh user thử (không qua Better Auth) — email đuôi @unit.lingyu để dọn dễ. */
export async function makeUser(tag: string) {
  const [u] = await db
    .insert(user)
    .values({ name: `U ${tag}`, email: `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@unit.lingyu` })
    .returning({ id: user.id });
  return u!.id;
}
export const cleanupUsers = () => db.delete(user).where(like(user.email, "%@unit.lingyu"));
