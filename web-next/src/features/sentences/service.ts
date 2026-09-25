/** Kho câu (Ôn dịch câu). Mọi hàm nhận userId của SESSION và lọc theo đó. */
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { sentence, sentenceTag, sentenceToTag } from "@/server/db/schema";
import { fold } from "@/lib/fold";
import { SENTENCE } from "@/lib/limits";
import { SAMPLE_SENTENCES } from "@/data/sample-sentences";
import { cleanSentenceTags, FAV_TAG, type SentenceInput, type SentenceListParams } from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Exec = typeof db | Tx;

export class SentenceError extends Error {
  constructor(
    public code: "not-found" | "validation",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy câu này. Có thể nó đã bị xóa.";
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

export type SentenceItem = {
  id: string;
  chinese: string;
  pinyin: string;
  vietnamese: string;
  note: string;
  status: "review" | "learned";
  isFavorite: boolean;
  tags: string[];
  createdAt: Date;
};
const cols = {
  id: sentence.id,
  chinese: sentence.chinese,
  pinyin: sentence.pinyin,
  vietnamese: sentence.vietnamese,
  note: sentence.note,
  status: sentence.status,
  isFavorite: sentence.isFavorite,
  createdAt: sentence.createdAt,
};

async function tagsOf(ids: string[]) {
  const map = new Map<string, string[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({ sid: sentenceToTag.sentenceId, name: sentenceTag.name })
    .from(sentenceToTag)
    .innerJoin(sentenceTag, eq(sentenceTag.id, sentenceToTag.tagId))
    .where(inArray(sentenceToTag.sentenceId, ids))
    .orderBy(asc(sentenceTag.createdAt));
  for (const r of rows) map.set(r.sid, [...(map.get(r.sid) ?? []), r.name]);
  return map;
}

export async function listSentenceTags(userId: string) {
  const rows = await db
    .select({ id: sentenceTag.id, name: sentenceTag.name, count: count(sentenceToTag.sentenceId) })
    .from(sentenceTag)
    .leftJoin(sentenceToTag, eq(sentenceToTag.tagId, sentenceTag.id))
    .where(eq(sentenceTag.userId, userId))
    .groupBy(sentenceTag.id);
  return rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
}

export async function listSentences(userId: string, p: SentenceListParams, pageSize: number = SENTENCE.PAGE_SIZE) {
  const tags = await listSentenceTags(userId);
  const conds: SQL[] = [eq(sentence.userId, userId)];
  if (p.tag === FAV_TAG) conds.push(eq(sentence.isFavorite, true));
  else if (p.tag) {
    const t = tags.find((x) => x.name.toLowerCase() === p.tag.toLowerCase());
    conds.push(
      t
        ? sql`exists (select 1 from ${sentenceToTag} where ${sentenceToTag.sentenceId} = ${sentence.id} and ${sentenceToTag.tagId} = ${t.id})`
        : sql`false`,
    );
  }
  const q = p.q.trim();
  if (q) {
    const fq = fold(q);
    const tagIds = tags.filter((t) => fold(t.name).includes(fq)).map((t) => t.id);
    const ors: SQL[] = [
      ilike(sentence.chinese, `%${likeEscape(q)}%`),
      ilike(sentence.vietnameseFold, `%${likeEscape(fq)}%`),
      ilike(sentence.pinyin, `%${likeEscape(q)}%`),
    ];
    if (tagIds.length)
      ors.push(
        sql`exists (select 1 from ${sentenceToTag} where ${sentenceToTag.sentenceId} = ${sentence.id} and ${inArray(sentenceToTag.tagId, tagIds)})`,
      );
    conds.push(or(...ors)!);
  }
  const where = and(...conds);
  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(sentence).where(where);
  const [{ totalAll } = { totalAll: 0 }] = await db
    .select({ totalAll: count() })
    .from(sentence)
    .where(eq(sentence.userId, userId));
  const [{ favCount } = { favCount: 0 }] = await db
    .select({ favCount: count() })
    .from(sentence)
    .where(and(eq(sentence.userId, userId), eq(sentence.isFavorite, true)));
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, p.page), pageCount);
  const rows = await db
    .select(cols)
    .from(sentence)
    .where(where)
    .orderBy(desc(sentence.createdAt), desc(sentence.id))
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const t = await tagsOf(rows.map((r) => r.id));
  const items: SentenceItem[] = rows.map((r) => ({ ...r, tags: t.get(r.id) ?? [] }));
  return { items, total, totalAll, favCount, page, pageCount, pageSize, tags };
}
export type SentenceList = Awaited<ReturnType<typeof listSentences>>;

export async function getSentence(userId: string, id: string): Promise<SentenceItem> {
  const [row] = await db
    .select(cols)
    .from(sentence)
    .where(and(eq(sentence.id, id), eq(sentence.userId, userId)))
    .limit(1);
  if (!row) throw new SentenceError("not-found", NOT_FOUND);
  return { ...row, tags: (await tagsOf([row.id])).get(row.id) ?? [] };
}

export async function ensureSentenceTags(tx: Exec, userId: string, names: string[]) {
  const clean = cleanSentenceTags(names);
  if (!clean.length) return [];
  await tx
    .insert(sentenceTag)
    .values(clean.map((name) => ({ userId, name })))
    .onConflictDoNothing();
  const rows = await tx
    .select({ id: sentenceTag.id, name: sentenceTag.name })
    .from(sentenceTag)
    .where(
      and(
        eq(sentenceTag.userId, userId),
        inArray(
          sql`lower(${sentenceTag.name})`,
          clean.map((n) => n.toLowerCase()),
        ),
      ),
    );
  const by = new Map(rows.map((r) => [r.name.toLowerCase(), r.id]));
  return clean.map((n) => by.get(n.toLowerCase())!).filter(Boolean);
}

async function setTags(tx: Tx, userId: string, sentenceId: string, names: string[]) {
  await tx.delete(sentenceToTag).where(eq(sentenceToTag.sentenceId, sentenceId));
  const ids = await ensureSentenceTags(tx, userId, names);
  if (ids.length) await tx.insert(sentenceToTag).values(ids.map((tagId) => ({ sentenceId, tagId })));
}

export const sentenceValues = (input: SentenceInput) => ({
  chinese: input.chinese,
  pinyin: input.pinyin,
  vietnamese: input.vietnamese,
  vietnameseFold: fold(input.vietnamese),
  note: input.note,
});

export async function createSentence(userId: string, input: SentenceInput) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(sentence)
      .values({ userId, ...sentenceValues(input) })
      .returning({ id: sentence.id });
    await setTags(tx, userId, row!.id, input.tags);
    return row!.id;
  });
}

export async function updateSentence(userId: string, id: string, input: SentenceInput) {
  await db.transaction(async (tx) => {
    const upd = await tx
      .update(sentence)
      .set(sentenceValues(input))
      .where(and(eq(sentence.id, id), eq(sentence.userId, userId)))
      .returning({ id: sentence.id });
    if (!upd.length) throw new SentenceError("not-found", NOT_FOUND);
    await setTags(tx, userId, id, input.tags);
  });
}

export async function deleteSentences(userId: string, ids: string[]) {
  const rows = await db
    .delete(sentence)
    .where(and(eq(sentence.userId, userId), inArray(sentence.id, ids)))
    .returning({ id: sentence.id });
  return rows.length;
}

export async function toggleSentenceFavorite(userId: string, id: string) {
  const [row] = await db
    .update(sentence)
    .set({ isFavorite: sql`not ${sentence.isFavorite}` })
    .where(and(eq(sentence.id, id), eq(sentence.userId, userId)))
    .returning({ isFavorite: sentence.isFavorite });
  if (!row) throw new SentenceError("not-found", NOT_FOUND);
  return row.isFavorite;
}

export async function setSentenceStatus(userId: string, ids: string[], status: "review" | "learned") {
  const rows = await db
    .update(sentence)
    .set({ status })
    .where(and(eq(sentence.userId, userId), inArray(sentence.id, ids)))
    .returning({ id: sentence.id });
  return rows.length;
}

/** Câu mẫu; bỏ qua câu trùng (cùng câu tiếng Trung). */
export async function importSampleSentences(userId: string) {
  return db.transaction(async (tx) => {
    const existing = new Set(
      (await tx.select({ c: sentence.chinese }).from(sentence).where(eq(sentence.userId, userId))).map((r) => r.c),
    );
    const now = Date.now();
    let added = 0;
    for (const [i, s] of SAMPLE_SENTENCES.entries()) {
      if (existing.has(s.chinese)) continue;
      existing.add(s.chinese);
      const [row] = await tx
        .insert(sentence)
        .values({
          userId,
          ...sentenceValues({ ...s, note: s.note ?? "" }),
          createdAt: new Date(now - i * 60000),
        })
        .returning({ id: sentence.id });
      await setTags(tx, userId, row!.id, s.tags);
      added++;
    }
    return added;
  });
}
