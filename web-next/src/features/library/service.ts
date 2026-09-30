/**
 * Thư viện LingYu — từ vựng do admin soạn. Admin: tạo / sửa / xoá, lưu nháp hoặc public, ảnh minh hoạ.
 * Người dùng (đã đăng nhập): chỉ thấy từ đã public; "lưu" = chép từ sang kho Từ vựng của chính mình.
 */
import { and, asc, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/server/db/client";
import { libraryImage, libraryWord, vocab } from "@/server/db/schema";
import { fold } from "@/lib/fold";
import { createMany } from "@/features/vocabulary/service";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { imageSize, sniffImage, type ImageMime } from "@/lib/image-sniff";
import { IMAGE } from "@/lib/limits";
import { PUBLISH_MISSING, type AdminLibListParams, type LibListParams, type LibWordInput } from "./schema";

export class LibraryError extends Error {
  constructor(
    public code: "not-found" | "validation" | "duplicate",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy từ này trong thư viện.";
const DUPLICATE = "Từ này đã có trong thư viện.";
const PAGE = 20;
const likeEscape = (s: string) => s.replace(/[\\%_]/g, (c) => "\\" + c);

type Row = typeof libraryWord.$inferSelect;
function toWord(r: Row) {
  return {
    id: r.id,
    hanzi: r.hanzi,
    pinyin: r.pinyin,
    pos: r.pos,
    meaningVi: r.meaningVi,
    note: r.note,
    hskLevel: r.hskLevel,
    topic: r.topic,
    components: r.components,
    mnemonic: r.mnemonic,
    association: r.association,
    related: r.related,
    examples: r.examples,
    grammar: r.grammar,
    hasImage: !!r.imageId,
    imageVersion: r.imageId ? r.imageId.slice(0, 8) : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
export type LibWord = ReturnType<typeof toWord>;
export type AdminLibWord = LibWord & { status: "draft" | "public"; publishedAt: Date | null };
const toAdmin = (r: Row): AdminLibWord => ({
  ...toWord(r),
  status: r.status === "public" ? "public" : "draft",
  publishedAt: r.publishedAt,
});

const values = (input: LibWordInput) => ({
  hanzi: input.hanzi,
  pinyin: input.pinyin,
  pos: input.pos,
  meaningVi: input.meaningVi,
  note: input.note,
  hskLevel: input.hskLevel,
  topic: input.topic,
  components: input.components,
  mnemonic: input.mnemonic,
  association: input.association,
  related: input.related,
  examples: input.examples,
  grammar: input.grammar,
});
const checkPublishable = (w: { pinyin: string; meaningVi: string }) => {
  if (!w.pinyin.trim() || !w.meaningVi.trim()) throw new LibraryError("validation", PUBLISH_MISSING);
};
const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && "code" in e && (e as { code?: string }).code === "23505";
const causeOf = (e: unknown) => (e instanceof Error && e.cause ? e.cause : e);

// ---------- Admin ----------

export async function adminListWords(p: AdminLibListParams) {
  const conds: SQL[] = [];
  if (p.status !== "all") conds.push(eq(libraryWord.status, p.status));
  const q = p.q.trim();
  if (q) {
    const like = `%${likeEscape(q)}%`;
    conds.push(
      or(ilike(libraryWord.hanzi, like), ilike(libraryWord.pinyin, like), ilike(libraryWord.meaningVi, like))!,
    );
  }
  const where = conds.length ? and(...conds) : undefined;
  const [{ total } = { total: 0 }] = await db.select({ total: count() }).from(libraryWord).where(where);
  const pageCount = Math.max(1, Math.ceil(total / PAGE));
  const page = Math.min(p.page, pageCount);
  const rows = await db
    .select()
    .from(libraryWord)
    .where(where)
    .orderBy(desc(libraryWord.updatedAt), desc(libraryWord.id))
    .limit(PAGE)
    .offset((page - 1) * PAGE);
  const [counts] = await db
    .select({
      all: count(),
      public: sql<number>`count(*) filter (where ${libraryWord.status} = 'public')`.mapWith(Number),
    })
    .from(libraryWord);
  return {
    items: rows.map(toAdmin),
    total,
    page,
    pageCount,
    counts: { all: counts?.all ?? 0, public: counts?.public ?? 0, draft: (counts?.all ?? 0) - (counts?.public ?? 0) },
  };
}

export async function adminGetWord(id: string): Promise<AdminLibWord> {
  const [row] = await db.select().from(libraryWord).where(eq(libraryWord.id, id)).limit(1);
  if (!row) throw new LibraryError("not-found", NOT_FOUND);
  return toAdmin(row);
}

export async function createWord(adminId: string, input: LibWordInput, publish: boolean) {
  if (publish) checkPublishable(input);
  try {
    const [row] = await db
      .insert(libraryWord)
      .values({
        ...values(input),
        createdBy: adminId,
        status: publish ? "public" : "draft",
        publishedAt: publish ? new Date() : null,
      })
      .returning({ id: libraryWord.id });
    return row!.id;
  } catch (e) {
    if (isUniqueViolation(causeOf(e))) throw new LibraryError("duplicate", DUPLICATE);
    throw e;
  }
}

/** Sửa toàn bộ; `publish`: true = public, false = về nháp, undefined = giữ trạng thái. */
export async function updateWord(id: string, input: LibWordInput, publish?: boolean) {
  const cur = await adminGetWord(id);
  const willPublic = publish ?? cur.status === "public";
  if (willPublic) checkPublishable(input);
  try {
    await db
      .update(libraryWord)
      .set({
        ...values(input),
        status: willPublic ? "public" : "draft",
        publishedAt: willPublic ? (cur.publishedAt ?? new Date()) : null,
        updatedAt: new Date(),
      })
      .where(eq(libraryWord.id, id));
  } catch (e) {
    if (isUniqueViolation(causeOf(e))) throw new LibraryError("duplicate", DUPLICATE);
    throw e;
  }
}

export async function setWordStatus(id: string, isPublic: boolean) {
  const cur = await adminGetWord(id);
  if (isPublic) checkPublishable(cur);
  await db
    .update(libraryWord)
    .set({
      status: isPublic ? "public" : "draft",
      publishedAt: isPublic ? (cur.publishedAt ?? new Date()) : null,
      updatedAt: new Date(),
    })
    .where(eq(libraryWord.id, id));
  return { status: isPublic ? ("public" as const) : ("draft" as const) };
}

export async function deleteWord(id: string) {
  await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(libraryWord)
      .where(eq(libraryWord.id, id))
      .returning({ imageId: libraryWord.imageId });
    if (!row) throw new LibraryError("not-found", NOT_FOUND);
    if (row.imageId) await tx.delete(libraryImage).where(eq(libraryImage.id, row.imageId));
  });
  return { removed: 1 };
}

export type NewLibImage = { bytes: Buffer; mime: ImageMime; width: number; height: number };

const BAD_IMAGE = "Ảnh không hợp lệ hoặc quá lớn (JPG, PNG, WebP, tối đa 1MB).";
/** Kiểm tra ảnh bằng magic bytes (không tin phần mở rộng / Content-Type). */
export function parseLibImage(bytes: Buffer): NewLibImage {
  if (!bytes.length || bytes.length > IMAGE.MAX_BYTES) throw new LibraryError("validation", BAD_IMAGE);
  const mime = sniffImage(bytes);
  const size = mime ? imageSize(bytes, mime) : null;
  if (!mime || !size) throw new LibraryError("validation", BAD_IMAGE);
  return { bytes, mime, ...size };
}

/** Đặt / thay / xoá ảnh minh hoạ (null = xoá). Ảnh cũ bị xoá hẳn. */
export async function setWordImage(id: string, img: NewLibImage | null) {
  return db.transaction(async (tx) => {
    const [cur] = await tx
      .select({ imageId: libraryWord.imageId })
      .from(libraryWord)
      .where(eq(libraryWord.id, id))
      .limit(1);
    if (!cur) throw new LibraryError("not-found", NOT_FOUND);
    let imageId: string | null = null;
    if (img) {
      const [row] = await tx
        .insert(libraryImage)
        .values({ mime: img.mime, data: img.bytes, size: img.bytes.length, width: img.width, height: img.height })
        .returning({ id: libraryImage.id });
      imageId = row!.id;
    }
    await tx.update(libraryWord).set({ imageId, updatedAt: new Date() }).where(eq(libraryWord.id, id));
    if (cur.imageId) await tx.delete(libraryImage).where(eq(libraryImage.id, cur.imageId));
    return { hasImage: !!imageId };
  });
}

/** Ảnh của một từ: chỉ trả khi từ đã public (hoặc `admin` = true). */
export async function wordImage(id: string, admin = false) {
  const [row] = await db
    .select({ mime: libraryImage.mime, data: libraryImage.data, size: libraryImage.size })
    .from(libraryWord)
    .innerJoin(libraryImage, eq(libraryImage.id, libraryWord.imageId))
    .where(admin ? eq(libraryWord.id, id) : and(eq(libraryWord.id, id), eq(libraryWord.status, "public")))
    .limit(1);
  return row ?? null;
}

// ---------- Người dùng ----------

async function mySaved(userId: string, hanzi: string[]) {
  if (!hanzi.length) return new Set<string>();
  const rows = await db
    .select({ hanzi: vocab.hanzi })
    .from(vocab)
    .where(and(eq(vocab.userId, userId), inArray(vocab.hanzi, hanzi)));
  return new Set(rows.map((r) => r.hanzi));
}

/** Danh sách từ đã public (lọc HSK / chủ đề / tìm), kèm số từ mỗi cấp và "đã lưu" theo kho của chính người xem. */
export async function listPublicWords(userId: string, p: LibListParams) {
  const pub = eq(libraryWord.status, "public");
  const conds: SQL[] = [pub];
  if (p.hsk) conds.push(eq(libraryWord.hskLevel, p.hsk));
  if (p.topic) conds.push(eq(libraryWord.topic, p.topic));
  const order =
    p.sort === "newest"
      ? [desc(libraryWord.publishedAt), desc(libraryWord.id)]
      : p.sort === "pinyin"
        ? [asc(libraryWord.pinyin), asc(libraryWord.id)]
        : [asc(libraryWord.createdAt), asc(libraryWord.id)];
  let rows = await db
    .select()
    .from(libraryWord)
    .where(and(...conds))
    .orderBy(...order)
    .limit(2000);
  const q = fold(p.q);
  if (q) {
    const qc = q.replace(/\s+/g, "");
    rows = rows.filter(
      (r) =>
        r.hanzi.includes(p.q.trim()) ||
        fold(r.pinyin).replace(/\s+/g, "").includes(qc) ||
        fold(r.meaningVi).includes(q),
    );
  }
  const levelRows = await db
    .select({ lv: libraryWord.hskLevel, n: count() })
    .from(libraryWord)
    .where(p.topic ? and(pub, eq(libraryWord.topic, p.topic)) : pub)
    .groupBy(libraryWord.hskLevel);
  const levels: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let all = 0;
  for (const r of levelRows) {
    all += r.n;
    if (r.lv) levels[r.lv] = r.n;
  }
  const saved = await mySaved(
    userId,
    rows.map((r) => r.hanzi),
  );
  return {
    items: rows.map((r) => ({
      id: r.id,
      hanzi: r.hanzi,
      pinyin: r.pinyin,
      meaningVi: r.meaningVi,
      hskLevel: r.hskLevel,
      saved: saved.has(r.hanzi),
    })),
    total: rows.length,
    levels,
    all,
  };
}
export type PublicWordList = Awaited<ReturnType<typeof listPublicWords>>;

export async function getPublicWord(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(libraryWord)
    .where(and(eq(libraryWord.id, id), eq(libraryWord.status, "public")))
    .limit(1);
  if (!row) throw new LibraryError("not-found", NOT_FOUND);
  const saved = await mySaved(userId, [row.hanzi]);
  return { ...toWord(row), saved: saved.has(row.hanzi) };
}
export type PublicWord = Awaited<ReturnType<typeof getPublicWord>>;

/** Lưu từ thư viện vào kho Từ vựng của mình (đã có Hán tự đó → bỏ qua). */
export async function saveToMyVocab(userId: string, id: string) {
  const w = await getPublicWord(userId, id);
  const item = vocabInputSchema.parse({
    hanzi: w.hanzi.slice(0, 40),
    pinyin: w.pinyin,
    meaningVi: w.meaningVi.slice(0, 200),
    note: [w.note, w.mnemonic].filter(Boolean).join(" · ").slice(0, 200),
    tags: ["Thư viện LingYu", ...(w.hskLevel ? [`HSK${w.hskLevel}`] : [])],
  });
  const r = await createMany(userId, [item]);
  return { saved: true, added: r.added.length > 0 };
}
