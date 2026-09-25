/**
 * Chia sẻ từ vựng cho người dùng khác. Lời mời chứa BẢN CHỤP các từ lúc gửi (≤ 200 từ) → người gửi sửa/xoá từ gốc
 * không ảnh hưởng lời mời. Người nhận chấp nhận thì các từ được CHÉP vào kho riêng của họ (ảnh cũng được sao chép).
 * Trạng thái, yêu thích và lịch ôn của người gửi không được gửi đi.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { srsCard, user, vocab, vocabShare, vocabToTag } from "@/server/db/schema";
import { storage } from "@/server/storage";
import { newCardColumns } from "@/lib/srs";
import { notify } from "@/features/notifications/service";
import { cleanEmails, resolveRecipient, type ShareResult } from "@/features/sharing/recipient";
import { cleanRadicals, cleanTags } from "./schema";
import { ensureTags, folds, tagsOf, VocabError } from "./service";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const VOCAB_SHARE_MAX = 200;
export type ShareResultRow = ShareResult;

type SnapshotWord = {
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  note: string;
  tags: string[];
  radicals: number[];
  imageId: string | null;
};
/** Từ hiển thị cho người nhận xem trước — không có id ảnh của người gửi. */
export type SharedWord = Omit<SnapshotWord, "imageId"> & { hasImage: boolean };

const keyOf = (words: { hanzi: string }[]) =>
  words
    .map((w) => w.hanzi)
    .sort()
    .join("|");
const titleOf = (words: { hanzi: string }[]) =>
  words
    .slice(0, 3)
    .map((w) => w.hanzi)
    .join(", ") + (words.length > 3 ? ` +${words.length - 3}` : "");

const publicWords = (words: SnapshotWord[]): SharedWord[] =>
  words.map(({ imageId, ...w }) => ({ ...w, hasImage: !!imageId }));

/** Bản chụp các từ của CHÍNH MÌNH theo id (giữ thứ tự đã chọn). */
async function snapshotOwn(userId: string, ids: string[]): Promise<SnapshotWord[]> {
  const rows = await db
    .select({
      id: vocab.id,
      hanzi: vocab.hanzi,
      pinyin: vocab.pinyin,
      meaningVi: vocab.meaningVi,
      note: vocab.note,
      radicals: vocab.radicals,
      imageId: vocab.imageId,
    })
    .from(vocab)
    .where(and(eq(vocab.userId, userId), inArray(vocab.id, ids)));
  const tags = await tagsOf(rows.map((r) => r.id));
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => ({
      hanzi: r.hanzi,
      pinyin: r.pinyin,
      meaningVi: r.meaningVi,
      note: r.note,
      radicals: r.radicals,
      // Chức năng ảnh đã bỏ: không gửi ảnh khi chia sẻ.
      imageId: null,
      tags: tags.get(r.id) ?? [],
    }));
}

/**
 * Gửi các từ (theo id, của chính mình) cho nhiều email. Từng email: đúng định dạng · có tài khoản · không phải chính mình ·
 * chưa có lời mời đang chờ với cùng bộ từ.
 */
export async function shareVocab(me: { id: string; name: string; email: string }, ids: string[], emails: string[]) {
  const unique = [...new Set(ids)];
  if (unique.length > VOCAB_SHARE_MAX)
    throw new VocabError("validation", `Mỗi lần chỉ chia sẻ tối đa ${VOCAB_SHARE_MAX} từ.`);
  const words = await snapshotOwn(me.id, unique);
  if (!words.length) throw new VocabError("validation", "Các từ đã chọn không còn tồn tại.");
  const list = cleanEmails(emails);
  if (!list.length) throw new VocabError("validation", "Vui lòng nhập ít nhất 1 email người nhận.");
  const wordsKey = keyOf(words);
  const title = titleOf(words);
  const results: ShareResult[] = [];
  for (const email of list) {
    const r = await resolveRecipient(me, email);
    if (!r.ok) {
      results.push({ email, ok: false, message: r.message });
      continue;
    }
    const sent = await db.transaction(async (tx) => {
      const ins = await tx
        .insert(vocabShare)
        .values({ senderId: me.id, recipientId: r.id, words, wordsKey, count: words.length })
        .onConflictDoNothing()
        .returning({ id: vocabShare.id });
      if (!ins.length) return false;
      await notify(tx, r.id, "vocab_share", { actorName: me.name, title, shareId: ins[0]!.id, count: words.length });
      return true;
    });
    results.push(
      sent
        ? { email, ok: true, message: `Đã gửi ${words.length} từ.` }
        : { email, ok: false, message: "Đã gửi các từ này trước đó, đang chờ người nhận phản hồi." },
    );
  }
  return { results, sent: results.filter((x) => x.ok).length, count: words.length };
}

/** Lời mình đã gửi (mới nhất trước). */
export async function listSentVocab(userId: string, limit = 5) {
  const rows = await db
    .select({
      id: vocabShare.id,
      recipientEmail: user.email,
      words: vocabShare.words,
      count: vocabShare.count,
      status: vocabShare.status,
      added: vocabShare.added,
      createdAt: vocabShare.createdAt,
    })
    .from(vocabShare)
    .innerJoin(user, eq(user.id, vocabShare.recipientId))
    .where(eq(vocabShare.senderId, userId))
    .orderBy(desc(vocabShare.createdAt))
    .limit(limit);
  return rows.map(({ words, ...r }) => ({ ...r, title: titleOf(words as SnapshotWord[]) }));
}
export type SentVocabShare = Awaited<ReturnType<typeof listSentVocab>>[number];

/** Lời mời đang chờ mình. */
export async function listReceivedVocab(userId: string) {
  const rows = await db
    .select({
      id: vocabShare.id,
      words: vocabShare.words,
      count: vocabShare.count,
      senderName: user.name,
      senderEmail: user.email,
      createdAt: vocabShare.createdAt,
    })
    .from(vocabShare)
    .innerJoin(user, eq(user.id, vocabShare.senderId))
    .where(and(eq(vocabShare.recipientId, userId), eq(vocabShare.status, "PENDING")))
    .orderBy(desc(vocabShare.createdAt));
  return rows.map((r) => {
    const words = r.words as SnapshotWord[];
    return {
      ...r,
      words: publicWords(words),
      title: titleOf(words),
      senderTags: [...new Set(words.flatMap((w) => w.tags))],
    };
  });
}
export type ReceivedVocabShare = Awaited<ReturnType<typeof listReceivedVocab>>[number];

async function pendingForMe(tx: Tx, userId: string, shareId: string) {
  const [s] = await tx
    .select()
    .from(vocabShare)
    .where(and(eq(vocabShare.id, shareId), eq(vocabShare.recipientId, userId)))
    .for("update")
    .limit(1);
  if (!s) throw new VocabError("not-found", "Lời mời chia sẻ không còn tồn tại.");
  if (s.status !== "PENDING")
    throw new VocabError("validation", `Bạn đã ${s.status === "ACCEPTED" ? "chấp nhận" : "từ chối"} lời mời này.`);
  return s;
}

/**
 * Chấp nhận: chép các từ vào kho của người nhận, bỏ qua từ đã có (trùng Hán tự).
 * keepTags: giữ tag của người gửi; extraTags: thêm tag riêng. Ảnh được sao chép (nếu người gửi còn giữ ảnh đó).
 */
export async function acceptVocabShare(
  me: { id: string; name: string },
  shareId: string,
  { keepTags = true, extraTags = [] as string[] } = {},
) {
  return db.transaction(async (tx) => {
    const s = await pendingForMe(tx, me.id, shareId);
    const words = s.words as SnapshotWord[];
    const existing = new Set(
      (await tx.select({ hanzi: vocab.hanzi }).from(vocab).where(eq(vocab.userId, me.id))).map((r) => r.hanzi),
    );
    const extra = cleanTags(extraTags);
    const skipped: string[] = [];
    let added = 0;
    const now = Date.now();
    for (const [i, w] of words.entries()) {
      if (existing.has(w.hanzi)) {
        skipped.push(w.hanzi);
        continue;
      }
      existing.add(w.hanzi);
      const imageId = w.imageId ? await storage.copy(tx, s.senderId, w.imageId, me.id) : null;
      const [row] = await tx
        .insert(vocab)
        .values({
          userId: me.id,
          hanzi: w.hanzi,
          pinyin: w.pinyin,
          meaningVi: w.meaningVi,
          note: w.note ?? "",
          radicals: cleanRadicals(w.radicals ?? []),
          imageId,
          // Giữ thứ tự của người gửi trong danh sách "Mới nhất".
          createdAt: new Date(now - i),
          ...folds(w),
        })
        .returning({ id: vocab.id });
      const tagIds = await ensureTags(tx, me.id, [...(keepTags ? w.tags : []), ...extra]);
      if (tagIds.length) await tx.insert(vocabToTag).values(tagIds.map((tagId) => ({ vocabId: row!.id, tagId })));
      await tx.insert(srsCard).values({ userId: me.id, vocabId: row!.id, ...newCardColumns() });
      added++;
    }
    await tx
      .update(vocabShare)
      .set({ status: "ACCEPTED", added, respondedAt: new Date() })
      .where(eq(vocabShare.id, s.id));
    await notify(tx, s.senderId, "vocab_share_accepted", {
      actorName: me.name,
      title: titleOf(words),
      shareId: s.id,
      count: added,
    });
    return { added, skipped, total: words.length };
  });
}

export async function rejectVocabShare(me: { id: string; name: string }, shareId: string) {
  await db.transaction(async (tx) => {
    const s = await pendingForMe(tx, me.id, shareId);
    await tx.update(vocabShare).set({ status: "REJECTED", respondedAt: new Date() }).where(eq(vocabShare.id, s.id));
    await notify(tx, s.senderId, "vocab_share_rejected", {
      actorName: me.name,
      title: titleOf(s.words as SnapshotWord[]),
      shareId: s.id,
    });
  });
}
