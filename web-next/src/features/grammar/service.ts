/**
 * Ngữ pháp ở server. Mọi hàm nhận userId của SESSION và lọc theo đó.
 * Ghi chú cá nhân nằm ở bảng riêng (grammar_personal_note) và KHÔNG BAO GIỜ nằm trong bản xem trước / bản chép khi chia sẻ.
 */
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  grammar,
  grammarBookmark,
  grammarExample,
  grammarPersonalNote,
  grammarShare,
  grammarTag,
  grammarToTag,
  user,
} from "@/server/db/schema";
import { fold } from "@/lib/fold";
import { normalizeEmail } from "@/lib/auth-rules";
import { SAMPLE_GRAMMAR } from "@/data/sample-grammar";
import { notify } from "@/features/notifications/service";
import type { GrammarInput, GrammarListParams } from "./schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class GrammarError extends Error {
  constructor(
    public code: "not-found" | "forbidden" | "validation" | "duplicate" | "already-responded" | "source-deleted",
    message: string,
  ) {
    super(message);
  }
}
const NOT_FOUND = "Không tìm thấy ngữ pháp này. Có thể nó đã bị xóa.";

export type GrammarExampleItem = { id: string; chinese: string; pinyin: string; vietnamese: string };
export type GrammarItem = {
  id: string;
  title: string;
  meaning: string;
  structure: string;
  notes: string;
  examples: GrammarExampleItem[];
  tags: { id: string; name: string }[];
  isSaved: boolean;
  sourceGrammarId: string | null;
  sourceOwnerName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** Nạp đầy đủ (ví dụ + thẻ + đã lưu) cho các ngữ pháp của MỘT user. */
async function hydrate(
  ownerId: string,
  viewerId: string,
  rows: (typeof grammar.$inferSelect)[],
): Promise<GrammarItem[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [exs, tags, marks] = await Promise.all([
    db
      .select()
      .from(grammarExample)
      .where(inArray(grammarExample.grammarId, ids))
      .orderBy(asc(grammarExample.sortOrder)),
    db
      .select({ grammarId: grammarToTag.grammarId, id: grammarTag.id, name: grammarTag.name })
      .from(grammarToTag)
      .innerJoin(grammarTag, eq(grammarTag.id, grammarToTag.tagId))
      .where(and(inArray(grammarToTag.grammarId, ids), eq(grammarTag.userId, ownerId)))
      .orderBy(asc(grammarTag.name)),
    db
      .select({ grammarId: grammarBookmark.grammarId })
      .from(grammarBookmark)
      .where(and(eq(grammarBookmark.userId, viewerId), inArray(grammarBookmark.grammarId, ids))),
  ]);
  const saved = new Set(marks.map((m) => m.grammarId));
  return rows.map((g) => ({
    id: g.id,
    title: g.title,
    meaning: g.meaning,
    structure: g.structure,
    notes: g.notes,
    examples: exs
      .filter((e) => e.grammarId === g.id)
      .map((e) => ({ id: e.id, chinese: e.chinese, pinyin: e.pinyin, vietnamese: e.vietnamese })),
    tags: tags.filter((t) => t.grammarId === g.id).map((t) => ({ id: t.id, name: t.name })),
    isSaved: saved.has(g.id),
    sourceGrammarId: g.sourceGrammarId,
    sourceOwnerName: g.sourceOwnerName,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  }));
}

export async function listGrammarTags(userId: string) {
  const rows = await db
    .select({
      id: grammarTag.id,
      name: grammarTag.name,
      count: sql<number>`count(${grammarToTag.grammarId})`.mapWith(Number),
    })
    .from(grammarTag)
    .leftJoin(grammarToTag, eq(grammarToTag.tagId, grammarTag.id))
    .where(eq(grammarTag.userId, userId))
    .groupBy(grammarTag.id);
  const collator = new Intl.Collator("vi", { numeric: true, sensitivity: "base" });
  return rows.sort((a, b) => collator.compare(a.name, b.name));
}

export async function listGrammar(userId: string, p: GrammarListParams) {
  const rows = await db.select().from(grammar).where(eq(grammar.userId, userId));
  let items = await hydrate(userId, userId, rows);
  const totalAll = items.length;
  const savedCount = items.filter((g) => g.isSaved).length;
  if (p.view === "saved") items = items.filter((g) => g.isSaved);
  if (p.tag) items = items.filter((g) => g.tags.some((t) => t.id === p.tag));
  const needle = fold(p.q);
  if (needle) {
    items = items.filter((g) => {
      const hay = fold(
        [
          g.title,
          g.meaning,
          g.structure,
          g.notes,
          ...g.tags.map((t) => t.name),
          ...g.examples.flatMap((e) => [e.chinese, e.pinyin, e.vietnamese]),
        ].join("\n"),
      );
      // Bỏ khoảng trắng khi so để "xue sheng" khớp "xuésheng", "nihao" khớp "nǐ hǎo".
      return hay.includes(needle) || hay.replace(/\s+/g, "").includes(needle.replace(/\s+/g, ""));
    });
  }
  const collator = new Intl.Collator("vi", { sensitivity: "base" });
  const by: Record<GrammarListParams["sort"], (a: GrammarItem, b: GrammarItem) => number> = {
    updated: (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    newest: (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    oldest: (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    az: (a, b) => collator.compare(a.title, b.title),
    za: (a, b) => collator.compare(b.title, a.title),
  };
  items.sort(by[p.sort]);
  return { items, total: items.length, totalAll, savedCount };
}

export async function getOwnGrammar(userId: string, id: string) {
  const [row] = await db
    .select()
    .from(grammar)
    .where(and(eq(grammar.id, id), eq(grammar.userId, userId)))
    .limit(1);
  if (!row) return null;
  const [g] = await hydrate(userId, userId, [row]);
  const [note] = await db
    .select({ content: grammarPersonalNote.content })
    .from(grammarPersonalNote)
    .where(and(eq(grammarPersonalNote.userId, userId), eq(grammarPersonalNote.grammarId, id)))
    .limit(1);
  return { ...g!, personalNote: note?.content ?? "" };
}

/**
 * Xem ngữ pháp: chủ sở hữu → đầy đủ. Người nhận có lời mời ĐANG CHỜ → bản xem trước
 * (không có ghi chú cá nhân, không có trạng thái "đã lưu"). Người khác → forbidden.
 */
export async function viewGrammar(userId: string, id: string, shareId?: string) {
  const own = await getOwnGrammar(userId, id);
  if (own) return { mode: "owner" as const, grammar: own, share: null };
  const [s] = await db
    .select({
      id: grammarShare.id,
      senderId: grammarShare.senderId,
      senderName: user.name,
      senderEmail: user.email,
      createdAt: grammarShare.createdAt,
      grammarTitle: grammarShare.grammarTitle,
    })
    .from(grammarShare)
    .innerJoin(user, eq(user.id, grammarShare.senderId))
    .where(
      and(
        eq(grammarShare.grammarId, id),
        eq(grammarShare.recipientId, userId),
        eq(grammarShare.status, "PENDING"),
        ...(shareId ? [eq(grammarShare.id, shareId)] : []),
      ),
    )
    .limit(1);
  if (!s) {
    const [exists] = await db.select({ id: grammar.id }).from(grammar).where(eq(grammar.id, id)).limit(1);
    throw new GrammarError(
      exists ? "forbidden" : "not-found",
      exists ? "Bạn không có quyền xem ngữ pháp này." : NOT_FOUND,
    );
  }
  const [row] = await db.select().from(grammar).where(eq(grammar.id, id)).limit(1);
  const [g] = await hydrate(s.senderId, userId, [row!]);
  return { mode: "preview" as const, grammar: { ...g!, isSaved: false, personalNote: "" }, share: s };
}

async function resolveTagIds(tx: Tx, userId: string, names: string[]) {
  const seen = new Set<string>();
  const clean = names.filter((n) => {
    const k = n.toLowerCase();
    if (!n || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  if (!clean.length) return [];
  await tx
    .insert(grammarTag)
    .values(clean.map((name) => ({ userId, name })))
    .onConflictDoNothing();
  const rows = await tx
    .select({ id: grammarTag.id, name: grammarTag.name })
    .from(grammarTag)
    .where(
      and(
        eq(grammarTag.userId, userId),
        inArray(
          sql`lower(${grammarTag.name})`,
          clean.map((n) => n.toLowerCase()),
        ),
      ),
    );
  const map = new Map(rows.map((r) => [r.name.toLowerCase(), r.id]));
  return clean.map((n) => map.get(n.toLowerCase())!).filter(Boolean);
}

async function writeChildren(tx: Tx, userId: string, grammarId: string, input: GrammarInput) {
  await tx.delete(grammarExample).where(eq(grammarExample.grammarId, grammarId));
  if (input.examples.length)
    await tx.insert(grammarExample).values(
      input.examples.map((e, i) => ({
        grammarId,
        chinese: e.chinese,
        pinyin: e.pinyin,
        vietnamese: e.vietnamese,
        sortOrder: i,
      })),
    );
  await tx.delete(grammarToTag).where(eq(grammarToTag.grammarId, grammarId));
  const tagIds = await resolveTagIds(tx, userId, input.tags);
  if (tagIds.length) await tx.insert(grammarToTag).values(tagIds.map((tagId) => ({ grammarId, tagId })));
  await setPersonalNote(tx, userId, grammarId, input.personalNote);
}

async function setPersonalNote(tx: Tx, userId: string, grammarId: string, text: string) {
  const t = text.trim();
  if (!t) {
    await tx
      .delete(grammarPersonalNote)
      .where(and(eq(grammarPersonalNote.userId, userId), eq(grammarPersonalNote.grammarId, grammarId)));
    return;
  }
  await tx
    .insert(grammarPersonalNote)
    .values({ userId, grammarId, content: t })
    .onConflictDoUpdate({
      target: [grammarPersonalNote.userId, grammarPersonalNote.grammarId],
      set: { content: t, updatedAt: new Date() },
    });
}

export async function createGrammar(userId: string, input: GrammarInput) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(grammar)
      .values({ userId, title: input.title, meaning: input.meaning, structure: input.structure, notes: input.notes })
      .returning({ id: grammar.id });
    await writeChildren(tx, userId, row!.id, input);
    return row!.id;
  });
}

export async function updateGrammar(userId: string, id: string, input: GrammarInput) {
  await db.transaction(async (tx) => {
    const rows = await tx
      .update(grammar)
      .set({
        title: input.title,
        meaning: input.meaning,
        structure: input.structure,
        notes: input.notes,
        updatedAt: new Date(),
      })
      .where(and(eq(grammar.id, id), eq(grammar.userId, userId)))
      .returning({ id: grammar.id });
    if (!rows.length) throw new GrammarError("not-found", NOT_FOUND);
    await writeChildren(tx, userId, id, input);
  });
}

/** Xoá: bản người nhận đã chấp nhận là bản riêng → không ảnh hưởng. Lời mời còn chờ bị huỷ. */
export async function deleteGrammar(userId: string, id: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(grammarShare)
      .where(
        and(eq(grammarShare.grammarId, id), eq(grammarShare.senderId, userId), eq(grammarShare.status, "PENDING")),
      );
    const rows = await tx
      .delete(grammar)
      .where(and(eq(grammar.id, id), eq(grammar.userId, userId)))
      .returning({ id: grammar.id });
    if (!rows.length) throw new GrammarError("not-found", NOT_FOUND);
  });
}

export async function setBookmark(userId: string, id: string, saved: boolean) {
  const [own] = await db
    .select({ id: grammar.id })
    .from(grammar)
    .where(and(eq(grammar.id, id), eq(grammar.userId, userId)))
    .limit(1);
  if (!own) throw new GrammarError("not-found", "Không tìm thấy ngữ pháp này.");
  if (saved) await db.insert(grammarBookmark).values({ userId, grammarId: id }).onConflictDoNothing();
  else
    await db.delete(grammarBookmark).where(and(eq(grammarBookmark.userId, userId), eq(grammarBookmark.grammarId, id)));
  return saved;
}

// ---------- Thẻ ----------

async function tagExists(userId: string, name: string, exceptId?: string) {
  const rows = await db
    .select({ id: grammarTag.id })
    .from(grammarTag)
    .where(and(eq(grammarTag.userId, userId), sql`lower(${grammarTag.name}) = ${name.toLowerCase()}`));
  return rows.some((r) => r.id !== exceptId);
}

export async function createGrammarTag(userId: string, name: string) {
  if (await tagExists(userId, name)) throw new GrammarError("duplicate", `Thẻ “${name}” đã tồn tại.`);
  const [row] = await db.insert(grammarTag).values({ userId, name }).returning({ id: grammarTag.id });
  return { id: row!.id, name };
}

export async function renameGrammarTag(userId: string, id: string, name: string) {
  if (await tagExists(userId, name, id)) throw new GrammarError("duplicate", `Thẻ “${name}” đã tồn tại.`);
  const rows = await db
    .update(grammarTag)
    .set({ name })
    .where(and(eq(grammarTag.id, id), eq(grammarTag.userId, userId)))
    .returning({ id: grammarTag.id });
  if (!rows.length) throw new GrammarError("not-found", "Không tìm thấy thẻ.");
}

/** Xoá thẻ chỉ bỏ liên kết, không xoá ngữ pháp. */
export async function deleteGrammarTag(userId: string, id: string) {
  const rows = await db
    .delete(grammarTag)
    .where(and(eq(grammarTag.id, id), eq(grammarTag.userId, userId)))
    .returning({ id: grammarTag.id });
  if (!rows.length) throw new GrammarError("not-found", "Không tìm thấy thẻ.");
}

// ---------- Chia sẻ ----------

export type ShareResult = { email: string; ok: boolean; message: string };

/**
 * Chia sẻ cho nhiều email. Từng email: đúng định dạng · có tài khoản · không phải chính mình · chưa có lời mời đang chờ.
 * Email hợp lệ được gửi, email lỗi được báo lại.
 */
export async function shareGrammar(me: { id: string; name: string; email: string }, id: string, emails: string[]) {
  const [g] = await db
    .select({ id: grammar.id, title: grammar.title, userId: grammar.userId })
    .from(grammar)
    .where(eq(grammar.id, id))
    .limit(1);
  if (!g) throw new GrammarError("not-found", "Không tìm thấy ngữ pháp này.");
  if (g.userId !== me.id)
    throw new GrammarError("forbidden", "Bạn chỉ có thể chia sẻ ngữ pháp trong thư viện của mình.");
  const list = [...new Set(emails.map(normalizeEmail).filter(Boolean))];
  if (!list.length) throw new GrammarError("validation", "Vui lòng nhập ít nhất 1 email người nhận.");
  const results: ShareResult[] = [];
  for (const email of list) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ email, ok: false, message: "Email không đúng định dạng." });
      continue;
    }
    if (email === normalizeEmail(me.email)) {
      results.push({ email, ok: false, message: "Bạn không thể chia sẻ cho chính mình." });
      continue;
    }
    const [r] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
    if (!r) {
      results.push({ email, ok: false, message: "Người dùng này chưa có tài khoản LingYu Chinese." });
      continue;
    }
    const sent = await db.transaction(async (tx) => {
      const ins = await tx
        .insert(grammarShare)
        .values({ grammarId: id, grammarTitle: g.title, senderId: me.id, recipientId: r.id })
        .onConflictDoNothing()
        .returning({ id: grammarShare.id });
      if (!ins.length) return false;
      await notify(tx, r.id, "grammar_share", {
        actorName: me.name,
        title: g.title,
        shareId: ins[0]!.id,
        grammarId: id,
      });
      return true;
    });
    results.push(
      sent
        ? { email, ok: true, message: "Đã gửi lời mời." }
        : { email, ok: false, message: "Đã gửi lời mời trước đó, đang chờ người nhận phản hồi." },
    );
  }
  return { results, sent: results.filter((x) => x.ok).length };
}

export async function listSent(userId: string, grammarId: string) {
  return db
    .select({
      id: grammarShare.id,
      recipientEmail: user.email,
      recipientName: user.name,
      status: grammarShare.status,
      createdAt: grammarShare.createdAt,
    })
    .from(grammarShare)
    .innerJoin(user, eq(user.id, grammarShare.recipientId))
    .where(and(eq(grammarShare.senderId, userId), eq(grammarShare.grammarId, grammarId)))
    .orderBy(desc(grammarShare.createdAt));
}

export async function listReceived(userId: string) {
  return db
    .select({
      id: grammarShare.id,
      grammarId: grammarShare.grammarId,
      grammarTitle: grammarShare.grammarTitle,
      senderName: user.name,
      senderEmail: user.email,
      createdAt: grammarShare.createdAt,
    })
    .from(grammarShare)
    .innerJoin(user, eq(user.id, grammarShare.senderId))
    .where(and(eq(grammarShare.recipientId, userId), eq(grammarShare.status, "PENDING")))
    .orderBy(desc(grammarShare.createdAt));
}
export type ReceivedShare = Awaited<ReturnType<typeof listReceived>>[number];

/** Thẻ của người gửi trên ngữ pháp được chia sẻ (cho hộp thoại Chấp nhận) — chỉ khi mình có lời mời đang chờ. */
export async function shareSourceTags(userId: string, shareId: string) {
  const [s] = await db
    .select({ grammarId: grammarShare.grammarId, senderId: grammarShare.senderId })
    .from(grammarShare)
    .where(and(eq(grammarShare.id, shareId), eq(grammarShare.recipientId, userId), eq(grammarShare.status, "PENDING")))
    .limit(1);
  if (!s?.grammarId) return [];
  const rows = await db
    .select({ name: grammarTag.name })
    .from(grammarToTag)
    .innerJoin(grammarTag, eq(grammarTag.id, grammarToTag.tagId))
    .where(and(eq(grammarToTag.grammarId, s.grammarId), eq(grammarTag.userId, s.senderId)));
  return rows.map((r) => r.name);
}

async function pendingForMe(tx: Tx, userId: string, shareId: string) {
  const [s] = await tx
    .select()
    .from(grammarShare)
    .where(and(eq(grammarShare.id, shareId), eq(grammarShare.recipientId, userId)))
    .for("update")
    .limit(1);
  if (!s) throw new GrammarError("not-found", "Lời mời chia sẻ không còn tồn tại.");
  if (s.status !== "PENDING")
    throw new GrammarError(
      "already-responded",
      `Bạn đã ${s.status === "ACCEPTED" ? "chấp nhận" : "từ chối"} lời mời này.`,
    );
  return s;
}

/**
 * Chấp nhận: tạo BẢN RIÊNG của người nhận (lưu sourceGrammarId). KHÔNG chép ghi chú cá nhân của người gửi.
 * keepTags: giữ thẻ của người gửi; extraTags: thẻ riêng của người nhận.
 */
export async function acceptShare(
  me: { id: string; name: string },
  shareId: string,
  { keepTags = true, extraTags = [] as string[] } = {},
) {
  return db.transaction(async (tx) => {
    const s = await pendingForMe(tx, me.id, shareId);
    if (!s.grammarId) throw new GrammarError("source-deleted", "Ngữ pháp gốc đã bị người gửi xóa.");
    const [src] = await tx.select().from(grammar).where(eq(grammar.id, s.grammarId)).limit(1);
    if (!src) throw new GrammarError("source-deleted", "Ngữ pháp gốc đã bị người gửi xóa.");
    const [owner] = await tx.select({ name: user.name }).from(user).where(eq(user.id, src.userId)).limit(1);
    const exs = await tx
      .select()
      .from(grammarExample)
      .where(eq(grammarExample.grammarId, src.id))
      .orderBy(asc(grammarExample.sortOrder));
    const senderTags = keepTags
      ? (
          await tx
            .select({ name: grammarTag.name })
            .from(grammarToTag)
            .innerJoin(grammarTag, eq(grammarTag.id, grammarToTag.tagId))
            .where(and(eq(grammarToTag.grammarId, src.id), eq(grammarTag.userId, src.userId)))
        ).map((t) => t.name)
      : [];
    const [copy] = await tx
      .insert(grammar)
      .values({
        userId: me.id,
        sourceGrammarId: src.id,
        sourceOwnerName: owner?.name ?? "",
        title: src.title,
        meaning: src.meaning,
        structure: src.structure,
        notes: src.notes,
      })
      .returning({ id: grammar.id });
    if (exs.length)
      await tx.insert(grammarExample).values(
        exs.map((e) => ({
          grammarId: copy!.id,
          chinese: e.chinese,
          pinyin: e.pinyin,
          vietnamese: e.vietnamese,
          sortOrder: e.sortOrder,
        })),
      );
    const tagIds = await resolveTagIds(tx, me.id, [...senderTags, ...extraTags]);
    if (tagIds.length) await tx.insert(grammarToTag).values(tagIds.map((tagId) => ({ grammarId: copy!.id, tagId })));
    await tx
      .update(grammarShare)
      .set({ status: "ACCEPTED", acceptedAt: new Date(), respondedAt: new Date(), importedGrammarId: copy!.id })
      .where(eq(grammarShare.id, s.id));
    await notify(tx, s.senderId, "grammar_share_accepted", {
      actorName: me.name,
      title: src.title,
      shareId: s.id,
      grammarId: src.id,
    });
    return { id: copy!.id, title: src.title };
  });
}

export async function rejectShare(me: { id: string; name: string }, shareId: string) {
  await db.transaction(async (tx) => {
    const s = await pendingForMe(tx, me.id, shareId);
    await tx.update(grammarShare).set({ status: "REJECTED", respondedAt: new Date() }).where(eq(grammarShare.id, s.id));
    await notify(tx, s.senderId, "grammar_share_rejected", {
      actorName: me.name,
      title: s.grammarTitle,
      shareId: s.id,
    });
  });
}

/** Ngữ pháp mẫu; bỏ qua bài trùng tiêu đề. */
export async function importSampleGrammar(userId: string) {
  const existing = new Set(
    (await db.select({ title: grammar.title }).from(grammar).where(eq(grammar.userId, userId))).map((r) =>
      r.title.toLowerCase(),
    ),
  );
  let added = 0;
  for (const sm of SAMPLE_GRAMMAR) {
    if (existing.has(sm.title.toLowerCase())) continue;
    await createGrammar(userId, { ...sm, personalNote: "" });
    added++;
  }
  return added;
}
