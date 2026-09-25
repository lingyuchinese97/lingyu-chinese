/** Trạng thái "Đã thuộc" bộ thủ theo từng user (dữ liệu bộ thủ là tĩnh, xem lib/radicals.ts). */
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { radicalKnown } from "@/server/db/schema";
import { isRadicalNum } from "@/lib/radicals";

export async function knownRadicals(userId: string): Promise<number[]> {
  const rows = await db.select({ n: radicalKnown.radical }).from(radicalKnown).where(eq(radicalKnown.userId, userId));
  return rows.map((r) => r.n).sort((a, b) => a - b);
}

export async function isKnown(userId: string, num: number) {
  const [r] = await db
    .select({ n: radicalKnown.radical })
    .from(radicalKnown)
    .where(and(eq(radicalKnown.userId, userId), eq(radicalKnown.radical, num)))
    .limit(1);
  return !!r;
}

export async function setKnown(userId: string, num: number, known: boolean) {
  if (!isRadicalNum(num)) throw new Error("Không tìm thấy bộ thủ này.");
  if (known) await db.insert(radicalKnown).values({ userId, radical: num }).onConflictDoNothing();
  else await db.delete(radicalKnown).where(and(eq(radicalKnown.userId, userId), eq(radicalKnown.radical, num)));
  return known;
}
