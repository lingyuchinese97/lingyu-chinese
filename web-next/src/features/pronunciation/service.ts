/** Ghi chú Phát âm & Biến điệu. Mọi hàm nhận userId của SESSION và lọc theo đó; ghi chú không bao giờ chia sẻ. */
import { and, count, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/server/db/client";
import { pronunciationNote } from "@/server/db/schema";
import { PRONUNCIATION } from "@/lib/limits";
import { topicLabel } from "@/data/pronunciation";
import type { NoteInput, NoteUpdate } from "./schema";

export class PronunciationError extends Error {
  constructor(
    public code: "not-found" | "validation",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy ghi chú này. Có thể nó đã bị xóa.";
const TOO_MANY = `Bạn đã có tối đa ${PRONUNCIATION.MAX_NOTES} ghi chú phát âm.`;

export type PronunciationNote = {
  id: string;
  topic: string | null;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};
const cols = {
  id: pronunciationNote.id,
  topic: pronunciationNote.topic,
  title: pronunciationNote.title,
  content: pronunciationNote.content,
  createdAt: pronunciationNote.createdAt,
  updatedAt: pronunciationNote.updatedAt,
};
const own = (userId: string, id: string) => and(eq(pronunciationNote.userId, userId), eq(pronunciationNote.id, id));

/** Mọi ghi chú của tôi, mới sửa trước. */
export async function listNotes(userId: string): Promise<PronunciationNote[]> {
  return db
    .select(cols)
    .from(pronunciationNote)
    .where(eq(pronunciationNote.userId, userId))
    .orderBy(desc(pronunciationNote.updatedAt), desc(pronunciationNote.createdAt));
}

/** Ghi chú gắn với các mục (topic → nội dung), để hiện trên trang bài học. */
export async function topicNotes(userId: string): Promise<Record<string, string>> {
  const rows = await db
    .select({ topic: pronunciationNote.topic, content: pronunciationNote.content })
    .from(pronunciationNote)
    .where(and(eq(pronunciationNote.userId, userId), isNotNull(pronunciationNote.topic)));
  return Object.fromEntries(rows.map((r) => [r.topic!, r.content]));
}

export async function getNote(userId: string, id: string): Promise<PronunciationNote> {
  const [row] = await db.select(cols).from(pronunciationNote).where(own(userId, id));
  if (!row) throw new PronunciationError("not-found", NOT_FOUND);
  return row;
}

async function ensureRoom(userId: string) {
  const [c] = await db.select({ n: count() }).from(pronunciationNote).where(eq(pronunciationNote.userId, userId));
  if ((c?.n ?? 0) >= PRONUNCIATION.MAX_NOTES) throw new PronunciationError("validation", TOO_MANY);
}

/**
 * Lưu ghi chú. Có topic: ghi đè ghi chú của mục đó (nội dung rỗng → xoá, trả null); tiêu đề mặc định là tên mục.
 * Không có topic: tạo ghi chú tự do mới.
 */
export async function saveNote(userId: string, input: NoteInput): Promise<PronunciationNote | null> {
  if (!input.topic) {
    await ensureRoom(userId);
    const [row] = await db
      .insert(pronunciationNote)
      .values({ userId, topic: null, title: input.title, content: input.content })
      .returning(cols);
    return row!;
  }
  const topic = input.topic;
  if (!input.content) {
    await db
      .delete(pronunciationNote)
      .where(and(eq(pronunciationNote.userId, userId), eq(pronunciationNote.topic, topic)));
    return null;
  }
  const title = input.title || topicLabel(topic)!.vi;
  const [existing] = await db
    .select({ id: pronunciationNote.id })
    .from(pronunciationNote)
    .where(and(eq(pronunciationNote.userId, userId), eq(pronunciationNote.topic, topic)));
  if (!existing) await ensureRoom(userId);
  const [row] = await db
    .insert(pronunciationNote)
    .values({ userId, topic, title, content: input.content })
    .onConflictDoUpdate({
      target: [pronunciationNote.userId, pronunciationNote.topic],
      targetWhere: isNotNull(pronunciationNote.topic),
      set: { content: input.content, ...(input.title ? { title: input.title } : {}), updatedAt: new Date() },
    })
    .returning(cols);
  return row!;
}

export async function updateNote(userId: string, id: string, input: NoteUpdate): Promise<PronunciationNote> {
  const current = await getNote(userId, id);
  if (current.topic === null && input.title !== undefined && !input.title)
    throw new PronunciationError("validation", "Vui lòng nhập tiêu đề ghi chú.");
  const [row] = await db
    .update(pronunciationNote)
    .set({ content: input.content, ...(input.title ? { title: input.title } : {}) })
    .where(own(userId, id))
    .returning(cols);
  return row!;
}

export async function deleteNote(userId: string, id: string) {
  const rows = await db.delete(pronunciationNote).where(own(userId, id)).returning({ id: pronunciationNote.id });
  if (!rows.length) throw new PronunciationError("not-found", NOT_FOUND);
}
