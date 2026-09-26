/** Bài làm Luyện nghe – Chép chính tả. Mọi hàm nhận userId của SESSION và lọc theo đó. */
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { listeningExercise, listeningTag, listeningToTag } from "@/server/db/schema";
import { fold } from "@/lib/fold";
import { LISTENING } from "@/lib/limits";
import { parseMediaUrl, type MediaSource } from "@/lib/media-url";
import { compareDictation, reformat, summarize, type Comparison, type FormattedSpan } from "@/lib/dictation-compare";
import { cleanListeningTags, type ExerciseInput, type ExerciseListParams } from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ListeningError extends Error {
  constructor(
    public code: "not-found" | "validation",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy bài làm này. Có thể nó đã bị xóa.";
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

export type ExerciseSummary = {
  id: string;
  title: string;
  tags: string[];
  scoreCorrect: number;
  scoreTotal: number;
  scorePercent: number;
  createdAt: Date;
  updatedAt: Date;
};
export type Exercise = ExerciseSummary & {
  contentUrl: string;
  media: MediaSource | null;
  segmentStart: number | null;
  segmentEnd: number | null;
  playbackSpeed: number;
  referenceAnswer: string;
  referencePinyin: string;
  userAnswer: string;
  formattedUserAnswer: FormattedSpan[];
  comparisonResult: Comparison;
  notes: string;
};

const summaryCols = {
  id: listeningExercise.id,
  title: listeningExercise.title,
  scoreCorrect: listeningExercise.scoreCorrect,
  scoreTotal: listeningExercise.scoreTotal,
  scorePercent: listeningExercise.scorePercent,
  createdAt: listeningExercise.createdAt,
  updatedAt: listeningExercise.updatedAt,
};

async function tagsOf(ids: string[]) {
  const map = new Map<string, string[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({ eid: listeningToTag.exerciseId, name: listeningTag.name })
    .from(listeningToTag)
    .innerJoin(listeningTag, eq(listeningTag.id, listeningToTag.tagId))
    .where(inArray(listeningToTag.exerciseId, ids))
    .orderBy(asc(listeningTag.createdAt), asc(listeningTag.name));
  for (const r of rows) map.set(r.eid, [...(map.get(r.eid) ?? []), r.name]);
  return map;
}

/** Thẻ của người dùng + số bài (dùng cho lọc và gợi ý khi gắn thẻ). */
export async function listListeningTags(userId: string) {
  const rows = await db
    .select({ id: listeningTag.id, name: listeningTag.name, count: count(listeningToTag.exerciseId) })
    .from(listeningTag)
    .leftJoin(listeningToTag, eq(listeningToTag.tagId, listeningTag.id))
    .where(eq(listeningTag.userId, userId))
    .groupBy(listeningTag.id);
  return rows.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "vi"));
}

/** Tìm theo tiêu đề, bài chép, đáp án, ghi chú (không dấu cũng được) và tên thẻ; lọc theo thẻ; mới / cũ nhất. */
export async function listExercises(userId: string, p: ExerciseListParams, pageSize: number = LISTENING.PAGE_SIZE) {
  const tags = await listListeningTags(userId);
  const conds: SQL[] = [eq(listeningExercise.userId, userId)];
  if (p.tag) {
    const t = tags.find((x) => x.name.toLowerCase() === p.tag.toLowerCase());
    conds.push(
      t
        ? sql`exists (select 1 from ${listeningToTag} where ${listeningToTag.exerciseId} = ${listeningExercise.id} and ${listeningToTag.tagId} = ${t.id})`
        : sql`false`,
    );
  }
  const q = p.q.trim();
  if (q) {
    const fq = fold(q);
    const like = `%${likeEscape(q)}%`;
    const tagIds = tags.filter((t) => fold(t.name).includes(fq)).map((t) => t.id);
    const ors: SQL[] = [
      ilike(listeningExercise.title, like),
      ilike(listeningExercise.userAnswer, like),
      ilike(listeningExercise.referenceAnswer, like),
      ilike(listeningExercise.referencePinyin, like),
      ilike(listeningExercise.notes, like),
      ilike(listeningExercise.searchFold, `%${likeEscape(fq)}%`),
    ];
    if (tagIds.length)
      ors.push(
        sql`exists (select 1 from ${listeningToTag} where ${listeningToTag.exerciseId} = ${listeningExercise.id} and ${inArray(listeningToTag.tagId, tagIds)})`,
      );
    conds.push(or(...ors)!);
  }
  const where = and(...conds);
  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(listeningExercise).where(where);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, p.page), pageCount);
  const order =
    p.sort === "oldest"
      ? [asc(listeningExercise.createdAt), asc(listeningExercise.id)]
      : [desc(listeningExercise.createdAt), desc(listeningExercise.id)];
  const rows = await db
    .select(summaryCols)
    .from(listeningExercise)
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const t = await tagsOf(rows.map((r) => r.id));
  const items: ExerciseSummary[] = rows.map((r) => ({ ...r, tags: t.get(r.id) ?? [] }));
  return { items, total, page, pageCount, pageSize, tags };
}
export type ExerciseList = Awaited<ReturnType<typeof listExercises>>;

export async function getExercise(userId: string, id: string): Promise<Exercise> {
  const [row] = await db
    .select()
    .from(listeningExercise)
    .where(and(eq(listeningExercise.id, id), eq(listeningExercise.userId, userId)))
    .limit(1);
  if (!row) throw new ListeningError("not-found", NOT_FOUND);
  return {
    id: row.id,
    title: row.title,
    tags: (await tagsOf([row.id])).get(row.id) ?? [],
    scoreCorrect: row.scoreCorrect,
    scoreTotal: row.scoreTotal,
    scorePercent: row.scorePercent,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    contentUrl: row.contentUrl,
    media: row.contentUrl ? parseMediaUrl(row.contentUrl) : null,
    segmentStart: row.segmentStart,
    segmentEnd: row.segmentEnd,
    playbackSpeed: row.playbackSpeed,
    referenceAnswer: row.referenceAnswer,
    referencePinyin: row.referencePinyin,
    userAnswer: row.userAnswer,
    formattedUserAnswer: row.formattedUserAnswer as FormattedSpan[],
    comparisonResult: row.comparisonResult as Comparison,
    notes: row.notes,
  };
}

/** Tính giá trị lưu: định dạng khớp với bài chép, và kết quả so sánh + điểm do SERVER tính lại (không nhận từ client). */
export function exerciseValues(input: ExerciseInput) {
  const spans = input.formattedUserAnswer.length ? input.formattedUserAnswer : [{ text: input.userAnswer }];
  // Định dạng luôn được căn lại theo đúng bài chép (client gửi lệch cũng không làm hỏng dữ liệu).
  const formatted = reformat(spans, input.userAnswer);
  const comparison = compareDictation(input.referenceAnswer, input.userAnswer);
  const s = summarize(comparison);
  const media = input.contentUrl ? parseMediaUrl(input.contentUrl) : null;
  return {
    title: input.title,
    contentUrl: media ? media.url : "",
    segmentStart: input.segmentStart,
    segmentEnd: input.segmentEnd,
    playbackSpeed: input.playbackSpeed,
    referenceAnswer: input.referenceAnswer,
    referencePinyin: input.referencePinyin,
    userAnswer: input.userAnswer,
    formattedUserAnswer: formatted,
    comparisonResult: comparison,
    scoreCorrect: s.correct,
    scoreTotal: s.total,
    scorePercent: s.percent,
    notes: input.notes,
    searchFold: fold(`${input.title} ${input.notes}`),
  };
}

async function ensureTags(tx: Tx, userId: string, names: string[]) {
  const clean = cleanListeningTags(names);
  if (!clean.length) return [];
  await tx
    .insert(listeningTag)
    .values(clean.map((name) => ({ userId, name })))
    .onConflictDoNothing();
  const rows = await tx
    .select({ id: listeningTag.id, name: listeningTag.name })
    .from(listeningTag)
    .where(
      and(
        eq(listeningTag.userId, userId),
        inArray(
          sql`lower(${listeningTag.name})`,
          clean.map((n) => n.toLowerCase()),
        ),
      ),
    );
  const by = new Map(rows.map((r) => [r.name.toLowerCase(), r.id]));
  return clean.map((n) => by.get(n.toLowerCase())!).filter(Boolean);
}

export async function setListeningTags(tx: Tx, userId: string, exerciseId: string, names: string[]) {
  await tx.delete(listeningToTag).where(eq(listeningToTag.exerciseId, exerciseId));
  const ids = await ensureTags(tx, userId, names);
  if (ids.length) await tx.insert(listeningToTag).values(ids.map((tagId) => ({ exerciseId, tagId })));
}

export async function createExercise(userId: string, input: ExerciseInput) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(listeningExercise)
      .values({ userId, ...exerciseValues(input) })
      .returning({ id: listeningExercise.id });
    await setListeningTags(tx, userId, row!.id, input.tags);
    return row!.id;
  });
}

/** Sửa toàn bộ bài làm; đáp án hoặc bài chép đổi → so sánh + điểm được tính lại (không giữ điểm cũ). */
export async function updateExercise(userId: string, id: string, input: ExerciseInput) {
  await db.transaction(async (tx) => {
    const upd = await tx
      .update(listeningExercise)
      .set(exerciseValues(input))
      .where(and(eq(listeningExercise.id, id), eq(listeningExercise.userId, userId)))
      .returning({ id: listeningExercise.id });
    if (!upd.length) throw new ListeningError("not-found", NOT_FOUND);
    await setListeningTags(tx, userId, id, input.tags);
  });
}

/** Xoá bài làm (không đụng tới từ vựng người dùng đã lưu từ bài này). */
export async function deleteExercise(userId: string, id: string) {
  const rows = await db
    .delete(listeningExercise)
    .where(and(eq(listeningExercise.id, id), eq(listeningExercise.userId, userId)))
    .returning({ id: listeningExercise.id });
  if (!rows.length) throw new ListeningError("not-found", NOT_FOUND);
}
