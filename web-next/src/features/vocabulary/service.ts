/**
 * Nghiệp vụ Từ vựng ở server. Mọi hàm nhận `userId` của SESSION (không bao giờ lấy từ client)
 * và mọi truy vấn đều lọc theo userId đó.
 */
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { bumpDaily } from "@/features/progress/service";
import { db } from "@/server/db/client";
import { srsCard, vocab, vocabTag, vocabToTag } from "@/server/db/schema";
import { storage } from "@/server/storage";
import { fold, foldCompact } from "@/lib/fold";
import { charsOfRadical, radicalsOfText } from "@/lib/radicals";
import { dictLookup } from "@/lib/builtin-dict";
import { hskLevelOf, hskPinyinOf } from "@/lib/hsk";
import { newCardColumns } from "@/lib/srs";
import { VOCAB } from "@/lib/limits";
import { SAMPLE_VOCABULARY } from "@/data/sample-vocab";
import { cleanTags, type ListParams, type VocabInput, type VocabStatus } from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class VocabError extends Error {
  constructor(
    public code: "not-found" | "validation" | "duplicate",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy từ vựng này. Có thể nó đã bị xóa.";

export type VocabItem = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  note: string;
  imageId: string | null;
  status: VocabStatus;
  isFavorite: boolean;
  radicals: number[];
  tags: string[];
  createdAt: Date;
};
export type TagCount = { id: string; name: string; count: number };

const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);
const regexEscape = (s: string) => s.replace(/[\\\]\[^-]/g, (c) => "\\" + c);

const itemColumns = {
  id: vocab.id,
  hanzi: vocab.hanzi,
  pinyin: vocab.pinyin,
  meaningVi: vocab.meaningVi,
  note: vocab.note,
  imageId: vocab.imageId,
  status: vocab.status,
  isFavorite: vocab.isFavorite,
  radicals: vocab.radicals,
  createdAt: vocab.createdAt,
};

export async function tagsOf(ids: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (!ids.length) return map;
  const rows = await db
    .select({ vocabId: vocabToTag.vocabId, name: vocabTag.name })
    .from(vocabToTag)
    .innerJoin(vocabTag, eq(vocabTag.id, vocabToTag.tagId))
    .where(inArray(vocabToTag.vocabId, ids))
    .orderBy(asc(vocabTag.createdAt));
  for (const r of rows) map.set(r.vocabId, [...(map.get(r.vocabId) ?? []), r.name]);
  return map;
}

/** Tất cả tag của user kèm số từ, xếp A → Z (số so theo giá trị: "Bài 2" trước "Bài 10"). */
export async function listTags(userId: string): Promise<TagCount[]> {
  const rows = await db
    .select({ id: vocabTag.id, name: vocabTag.name, count: count(vocabToTag.vocabId) })
    .from(vocabTag)
    .leftJoin(vocabToTag, eq(vocabToTag.tagId, vocabTag.id))
    .where(eq(vocabTag.userId, userId))
    .groupBy(vocabTag.id);
  return rows.sort(
    (a, b) => a.name.localeCompare(b.name, "vi", { numeric: true, sensitivity: "base" }) || a.id.localeCompare(b.id),
  );
}

export async function listVocab(userId: string, p: ListParams, pageSize: number = VOCAB.PAGE_SIZE) {
  const tagCounts = await listTags(userId);
  const conds: SQL[] = [eq(vocab.userId, userId)];

  if (p.tag) {
    const t = tagCounts.find((x) => x.name.toLowerCase() === p.tag.toLowerCase());
    // Tag không tồn tại → không có kết quả.
    conds.push(
      t
        ? sql`exists (select 1 from ${vocabToTag} where ${vocabToTag.vocabId} = ${vocab.id} and ${vocabToTag.tagId} = ${t.id})`
        : sql`false`,
    );
  }
  if (p.radical) {
    // Bộ thủ người dùng đã chọn cho từ, hoặc bộ tự nhận ra từ chữ Hán.
    const chars = charsOfRadical(p.radical);
    conds.push(
      or(
        sql`${vocab.radicals} @> array[${p.radical}]::integer[]`,
        chars ? sql`${vocab.hanzi} ~ ${"[" + regexEscape(chars) + "]"}` : sql`false`,
      )!,
    );
  }
  const q = p.q.trim();
  if (q) {
    const fq = fold(q);
    const tagIds = tagCounts.filter((t) => fold(t.name).includes(fq)).map((t) => t.id);
    const ors: SQL[] = [ilike(vocab.hanzi, `%${likeEscape(q)}%`), ilike(vocab.meaningFold, `%${likeEscape(fq)}%`)];
    const fc = foldCompact(q);
    if (fc) ors.push(ilike(vocab.pinyinFold, `%${likeEscape(fc)}%`));
    if (tagIds.length)
      ors.push(
        sql`exists (select 1 from ${vocabToTag} where ${vocabToTag.vocabId} = ${vocab.id} and ${inArray(vocabToTag.tagId, tagIds)})`,
      );
    conds.push(or(...ors)!);
  }

  const where = and(...conds);
  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(vocab).where(where);
  const [{ totalAll } = { totalAll: 0 }] = await db
    .select({ totalAll: count() })
    .from(vocab)
    .where(eq(vocab.userId, userId));

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, p.page), pageCount);
  const order = {
    newest: [desc(vocab.createdAt), desc(vocab.id)],
    oldest: [asc(vocab.createdAt), asc(vocab.id)],
    pinyin: [asc(vocab.pinyinFold), asc(vocab.createdAt)],
    favorite: [desc(vocab.isFavorite), desc(vocab.createdAt)],
  }[p.sort];
  const rows = await db
    .select(itemColumns)
    .from(vocab)
    .where(where)
    .orderBy(...order)
    .limit(pageSize)
    .offset((page - 1) * pageSize);
  const tags = await tagsOf(rows.map((r) => r.id));
  const items: VocabItem[] = rows.map((r) => ({ ...r, tags: tags.get(r.id) ?? [] }));
  return { items, total, page, pageCount, pageSize, totalAll, tagCounts };
}
export type VocabList = Awaited<ReturnType<typeof listVocab>>;

export async function getVocab(userId: string, id: string): Promise<VocabItem> {
  const [row] = await db
    .select(itemColumns)
    .from(vocab)
    .where(and(eq(vocab.id, id), eq(vocab.userId, userId)))
    .limit(1);
  if (!row) throw new VocabError("not-found", NOT_FOUND);
  const tags = await tagsOf([row.id]);
  return { ...row, tags: tags.get(row.id) ?? [] };
}

/** Tạo (nếu chưa có) các tag theo tên, trả về id theo thứ tự tên. */
export async function ensureTags(tx: Tx, userId: string, names: string[]): Promise<string[]> {
  const clean = cleanTags(names);
  if (!clean.length) return [];
  await tx
    .insert(vocabTag)
    .values(clean.map((name) => ({ userId, name })))
    .onConflictDoNothing();
  const rows = await tx
    .select({ id: vocabTag.id, name: vocabTag.name })
    .from(vocabTag)
    .where(
      and(
        eq(vocabTag.userId, userId),
        inArray(
          sql`lower(${vocabTag.name})`,
          clean.map((n) => n.toLowerCase()),
        ),
      ),
    );
  const byLower = new Map(rows.map((r) => [r.name.toLowerCase(), r.id]));
  return clean.map((n) => byLower.get(n.toLowerCase())!).filter(Boolean);
}

async function setTags(tx: Tx, userId: string, vocabId: string, names: string[]) {
  await tx.delete(vocabToTag).where(eq(vocabToTag.vocabId, vocabId));
  const ids = await ensureTags(tx, userId, names);
  if (ids.length) await tx.insert(vocabToTag).values(ids.map((tagId) => ({ vocabId, tagId })));
}

export const folds = (input: Pick<VocabInput, "pinyin" | "meaningVi">) => ({
  pinyinFold: foldCompact(input.pinyin),
  meaningFold: fold(input.meaningVi),
});

export type NewImage = {
  bytes: Buffer;
  mime: "image/webp" | "image/jpeg" | "image/png";
  width: number;
  height: number;
};

export async function createVocab(userId: string, input: VocabInput, img?: NewImage | null) {
  return db.transaction(async (tx) => {
    const imageId = img ? await storage.put(tx, { userId, ...img }) : null;
    const [row] = await tx
      .insert(vocab)
      .values({
        userId,
        hanzi: input.hanzi,
        pinyin: input.pinyin,
        meaningVi: input.meaningVi,
        note: input.note,
        radicals: input.radicals,
        imageId,
        ...folds(input),
      })
      .returning({ id: vocab.id });
    await setTags(tx, userId, row!.id, input.tags);
    // Mỗi từ mới tự có thẻ ôn tập FSRS.
    await tx.insert(srsCard).values({ userId, vocabId: row!.id, ...newCardColumns() });
    await bumpDaily(tx, userId, "vocab_add");
    return row!.id;
  });
}

/** image: undefined = giữ ảnh cũ, null = xoá ảnh, NewImage = thay ảnh. */
export async function updateVocab(userId: string, id: string, input: VocabInput, img?: NewImage | null) {
  await db.transaction(async (tx) => {
    const [cur] = await tx
      .select({ imageId: vocab.imageId })
      .from(vocab)
      .where(and(eq(vocab.id, id), eq(vocab.userId, userId)))
      .limit(1);
    if (!cur) throw new VocabError("not-found", NOT_FOUND);
    let imageId = cur.imageId;
    if (img !== undefined) {
      imageId = img ? await storage.put(tx, { userId, ...img }) : null;
    }
    await tx
      .update(vocab)
      .set({
        hanzi: input.hanzi,
        pinyin: input.pinyin,
        meaningVi: input.meaningVi,
        note: input.note,
        radicals: input.radicals,
        imageId,
        ...folds(input),
      })
      .where(and(eq(vocab.id, id), eq(vocab.userId, userId)));
    if (img !== undefined && cur.imageId && cur.imageId !== imageId) await storage.remove(tx, userId, [cur.imageId]);
    await setTags(tx, userId, id, input.tags);
  });
}

/** Xoá từ (và ảnh của từ). Trả về số từ đã xoá. */
export async function deleteVocab(userId: string, ids: string[]) {
  return db.transaction(async (tx) => {
    const rows = await tx
      .delete(vocab)
      .where(and(eq(vocab.userId, userId), inArray(vocab.id, ids)))
      .returning({ imageId: vocab.imageId });
    await storage.remove(
      tx,
      userId,
      rows.map((r) => r.imageId).filter((x): x is string => !!x),
    );
    return rows.length;
  });
}

export async function toggleFavorite(userId: string, id: string) {
  const [row] = await db
    .update(vocab)
    .set({ isFavorite: sql`not ${vocab.isFavorite}` })
    .where(and(eq(vocab.id, id), eq(vocab.userId, userId)))
    .returning({ isFavorite: vocab.isFavorite, hanzi: vocab.hanzi });
  if (!row) throw new VocabError("not-found", "Không tìm thấy từ vựng.");
  return row;
}

export async function setStatus(userId: string, ids: string[], status: VocabStatus) {
  const rows = await db
    .update(vocab)
    .set({ status })
    .where(and(eq(vocab.userId, userId), inArray(vocab.id, ids)))
    .returning({ id: vocab.id });
  return rows.length;
}

/** Gắn thêm tag cho nhiều từ (giữ tag cũ). */
export async function addTags(userId: string, ids: string[], names: string[]) {
  const add = cleanTags(names);
  if (!add.length) throw new VocabError("validation", "Vui lòng chọn ít nhất 1 tag.");
  return db.transaction(async (tx) => {
    const owned = await tx
      .select({ id: vocab.id })
      .from(vocab)
      .where(and(eq(vocab.userId, userId), inArray(vocab.id, ids)));
    if (!owned.length) return 0;
    const tagIds = await ensureTags(tx, userId, add);
    if (tagIds.length)
      await tx
        .insert(vocabToTag)
        .values(owned.flatMap((v) => tagIds.map((tagId) => ({ vocabId: v.id, tagId }))))
        .onConflictDoNothing();
    return owned.length;
  });
}

export async function createTag(userId: string, name: string) {
  const [id] = await db.transaction((tx) => ensureTags(tx, userId, [name]));
  return id!;
}

const TAG_NOT_FOUND = "Không tìm thấy tag này. Có thể nó đã bị xóa.";
const TAG_DUPLICATE = "Đã có tag trùng tên.";

/** Đổi tên tag của mình. Trùng tên (không phân biệt hoa/thường) với tag khác → lỗi "duplicate". */
export async function renameTag(userId: string, tagId: string, name: string): Promise<TagCount> {
  const clean = name.trim();
  const clash = await db
    .select({ id: vocabTag.id })
    .from(vocabTag)
    .where(
      and(
        eq(vocabTag.userId, userId),
        sql`lower(${vocabTag.name}) = ${clean.toLowerCase()}`,
        sql`${vocabTag.id} <> ${tagId}`,
      ),
    );
  if (clash.length) throw new VocabError("duplicate", TAG_DUPLICATE);
  const [row] = await db
    .update(vocabTag)
    .set({ name: clean })
    .where(and(eq(vocabTag.userId, userId), eq(vocabTag.id, tagId)))
    .returning({ id: vocabTag.id, name: vocabTag.name });
  if (!row) throw new VocabError("not-found", TAG_NOT_FOUND);
  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(vocabToTag).where(eq(vocabToTag.tagId, tagId));
  return { ...row, count: n };
}

/** Xóa tag của mình: chỉ gỡ tag khỏi các từ, từ vựng vẫn giữ nguyên. */
export async function deleteTag(userId: string, tagId: string) {
  const rows = await db
    .delete(vocabTag)
    .where(and(eq(vocabTag.userId, userId), eq(vocabTag.id, tagId)))
    .returning({ id: vocabTag.id });
  if (!rows.length) throw new VocabError("not-found", TAG_NOT_FOUND);
  return { removed: 1 };
}

export type WordSuggestion = {
  hanzi: string;
  pinyin: string;
  /** Nghĩa gợi ý từ từ điển có sẵn ("" nếu không có). */
  meaningVi: string;
  radicals: number[];
  hskLevel: number | null;
  /** Đã có trong kho của mình (trùng Hán tự). */
  exists: boolean;
};

/** Gợi ý pinyin / nghĩa / bộ thủ cho các từ nhận ra từ ảnh; đánh dấu từ đã có trong kho của chính mình. */
export async function suggestWords(userId: string, words: string[]): Promise<WordSuggestion[]> {
  const list = [...new Set(words.map((w) => w.trim()).filter(Boolean))].slice(0, VOCAB.MAX_BULK);
  if (!list.length) return [];
  const mine = new Set(
    (
      await db
        .select({ hanzi: vocab.hanzi })
        .from(vocab)
        .where(and(eq(vocab.userId, userId), inArray(vocab.hanzi, list)))
    ).map((r) => r.hanzi),
  );
  const { pinyin } = await import("pinyin-pro");
  return list.map((w) => {
    const d = dictLookup(w);
    return {
      hanzi: w,
      pinyin: d?.pinyin || hskPinyinOf(w) || pinyin(w, { toneType: "symbol", nonZh: "consecutive" }),
      meaningVi: d?.vi ?? "",
      radicals: [...new Set(radicalsOfText(w).flatMap((x) => (x.radical ? [x.radical.num] : [])))].slice(
        0,
        VOCAB.MAX_RADICALS,
      ),
      hskLevel: hskLevelOf(w),
      exists: mine.has(w),
    };
  });
}

/** Thêm nhiều từ một lần; bỏ qua từ đã có (trùng Hán tự) và từ lặp trong danh sách. */
export async function createMany(userId: string, items: VocabInput[]) {
  const existing = new Set(
    (
      await db
        .select({ hanzi: vocab.hanzi })
        .from(vocab)
        .where(
          and(
            eq(vocab.userId, userId),
            inArray(
              vocab.hanzi,
              items.map((i) => i.hanzi),
            ),
          ),
        )
    ).map((r) => r.hanzi),
  );
  const added: string[] = [];
  const skipped: string[] = [];
  for (const it of items) {
    if (existing.has(it.hanzi)) {
      skipped.push(it.hanzi);
      continue;
    }
    existing.add(it.hanzi);
    await createVocab(userId, it, null);
    added.push(it.hanzi);
  }
  return { added, skipped };
}

/** Thêm dữ liệu mẫu; bỏ qua từ đã có (trùng Hán tự). */
export async function importSample(userId: string) {
  return db.transaction(async (tx) => {
    const existing = new Set(
      (await tx.select({ hanzi: vocab.hanzi }).from(vocab).where(eq(vocab.userId, userId))).map((r) => r.hanzi),
    );
    const now = Date.now();
    let added = 0;
    for (const [i, w] of SAMPLE_VOCABULARY.entries()) {
      if (existing.has(w.hanzi)) continue;
      existing.add(w.hanzi);
      const [row] = await tx
        .insert(vocab)
        .values({
          userId,
          hanzi: w.hanzi,
          pinyin: w.pinyin,
          meaningVi: w.meaningVi,
          note: w.note ?? "",
          status: w.status ?? "review",
          isFavorite: !!w.isFavorite,
          createdAt: new Date(now - i * 60000),
          ...folds(w),
        })
        .returning({ id: vocab.id });
      await setTags(tx, userId, row!.id, w.tags);
      await tx.insert(srsCard).values({ userId, vocabId: row!.id, ...newCardColumns() });
      added++;
    }
    if (added) await bumpDaily(tx, userId, "vocab_add", added);
    return added;
  });
}

export async function vocabStats(userId: string) {
  const [s] = await db
    .select({
      total: count(),
      learned: sql<number>`count(*) filter (where ${vocab.status} = 'learned')`.mapWith(Number),
      needReview: sql<number>`count(*) filter (where ${vocab.status} = 'review')`.mapWith(Number),
    })
    .from(vocab)
    .where(eq(vocab.userId, userId));
  const [latest] = await db
    .select({ hanzi: vocab.hanzi, pinyin: vocab.pinyin, meaningVi: vocab.meaningVi })
    .from(vocab)
    .where(eq(vocab.userId, userId))
    .orderBy(desc(vocab.createdAt))
    .limit(1);
  return { total: s?.total ?? 0, learned: s?.learned ?? 0, needReview: s?.needReview ?? 0, latest: latest ?? null };
}
