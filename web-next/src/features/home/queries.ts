import { and, count, eq, lte } from "drizzle-orm";
import { db } from "@/server/db/client";
import { srsCard } from "@/server/db/schema";

/** Số thẻ FSRS đã đến hạn ôn (due ≤ bây giờ) của user. */
export async function dueCount(userId: string, now = new Date()) {
  const [r] = await db
    .select({ n: count() })
    .from(srsCard)
    .where(and(eq(srsCard.userId, userId), lte(srsCard.due, now)));
  return r?.n ?? 0;
}
