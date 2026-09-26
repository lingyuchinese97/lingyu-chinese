/**
 * Xuất / nhập dữ liệu học tập (JSON). Xuất: từ vựng (kèm ảnh base64, lịch ôn), tag, ngữ pháp (kèm ví dụ, ghi chú cá nhân,
 * đã lưu), câu (Ôn dịch câu), bài làm luyện nghe, bộ thủ đã thuộc, tiến độ bài học. Nhập: GỘP vào dữ liệu hiện có, không ghi đè — bản ghi trùng thì bỏ qua.
 */
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/server/db/client";
import {
  grammar,
  grammarBookmark,
  grammarExample,
  grammarPersonalNote,
  grammarTag,
  grammarToTag,
  image,
  lessonProgress,
  listeningExercise,
  listeningTag,
  listeningToTag,
  radicalKnown,
  sentence,
  sentenceTag,
  sentenceToTag,
  srsCard,
  vocab,
  vocabTag,
  vocabToTag,
} from "@/server/db/schema";
import { storage } from "@/server/storage";
import { IMAGE } from "@/lib/limits";
import { imageSize, sniffImage } from "@/lib/image-sniff";
import { isRadicalNum } from "@/lib/radicals";
import { newCardColumns } from "@/lib/srs";
import { vocabInputSchema } from "@/features/vocabulary/schema";
import { ensureTags, folds } from "@/features/vocabulary/service";
import { grammarInputSchema } from "@/features/grammar/schema";
import { getLesson } from "@/data/lessons";
import { sentenceInputSchema } from "@/features/sentences/schema";
import { ensureSentenceTags, sentenceValues } from "@/features/sentences/service";
import { exerciseInputSchema } from "@/features/listening/schema";
import { exerciseValues, setListeningTags } from "@/features/listening/service";

export const EXPORT_FORMAT = "lingyu-export";
export const EXPORT_VERSION = 1;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// ---------- Xuất ----------

export async function exportData(u: { id: string; name: string; email: string }) {
  const userId = u.id;
  const vs = await db.select().from(vocab).where(eq(vocab.userId, userId)).orderBy(asc(vocab.createdAt));
  const vIds = vs.map((v) => v.id);
  const [vTags, vLinks, imgs, cards] = await Promise.all([
    db.select().from(vocabTag).where(eq(vocabTag.userId, userId)).orderBy(asc(vocabTag.createdAt)),
    vIds.length ? db.select().from(vocabToTag).where(inArray(vocabToTag.vocabId, vIds)) : [],
    db.select().from(image).where(eq(image.userId, userId)),
    db.select().from(srsCard).where(eq(srsCard.userId, userId)),
  ]);
  const tagName = new Map(vTags.map((t) => [t.id, t.name]));
  const imgById = new Map(imgs.map((i) => [i.id, i]));
  const cardBy = new Map(cards.map((c) => [c.vocabId, c]));

  const gs = await db.select().from(grammar).where(eq(grammar.userId, userId)).orderBy(asc(grammar.createdAt));
  const gIds = gs.map((g) => g.id);
  const [gTags, gLinks, exs, marks, notes] = await Promise.all([
    db.select().from(grammarTag).where(eq(grammarTag.userId, userId)).orderBy(asc(grammarTag.createdAt)),
    gIds.length ? db.select().from(grammarToTag).where(inArray(grammarToTag.grammarId, gIds)) : [],
    gIds.length
      ? db
          .select()
          .from(grammarExample)
          .where(inArray(grammarExample.grammarId, gIds))
          .orderBy(asc(grammarExample.sortOrder))
      : [],
    db.select().from(grammarBookmark).where(eq(grammarBookmark.userId, userId)),
    db.select().from(grammarPersonalNote).where(eq(grammarPersonalNote.userId, userId)),
  ]);
  const gTagName = new Map(gTags.map((t) => [t.id, t.name]));
  const marked = new Set(marks.map((m) => m.grammarId));
  const noteBy = new Map(notes.map((n) => [n.grammarId, n.content]));

  const ss = await db.select().from(sentence).where(eq(sentence.userId, userId)).orderBy(asc(sentence.createdAt));
  const [sTags, sLinks] = await Promise.all([
    db.select().from(sentenceTag).where(eq(sentenceTag.userId, userId)).orderBy(asc(sentenceTag.createdAt)),
    ss.length
      ? db
          .select()
          .from(sentenceToTag)
          .where(
            inArray(
              sentenceToTag.sentenceId,
              ss.map((x) => x.id),
            ),
          )
      : [],
  ]);
  const sTagName = new Map(sTags.map((t) => [t.id, t.name]));

  const [known, lessons] = await Promise.all([
    db.select().from(radicalKnown).where(eq(radicalKnown.userId, userId)),
    db.select().from(lessonProgress).where(eq(lessonProgress.userId, userId)),
  ]);
  const ls = await db
    .select()
    .from(listeningExercise)
    .where(eq(listeningExercise.userId, userId))
    .orderBy(asc(listeningExercise.createdAt));
  const lIds = ls.map((x) => x.id);
  const [lTags, lLinks] = await Promise.all([
    db.select().from(listeningTag).where(eq(listeningTag.userId, userId)).orderBy(asc(listeningTag.createdAt)),
    lIds.length ? db.select().from(listeningToTag).where(inArray(listeningToTag.exerciseId, lIds)) : [],
  ]);
  const lTagName = new Map(lTags.map((t) => [t.id, t.name]));

  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    profile: { name: u.name, email: u.email },
    vocabTags: vTags.map((t) => t.name),
    vocab: vs.map((v) => {
      const img = v.imageId ? imgById.get(v.imageId) : undefined;
      const c = cardBy.get(v.id);
      return {
        hanzi: v.hanzi,
        pinyin: v.pinyin,
        meaningVi: v.meaningVi,
        note: v.note,
        status: v.status,
        isFavorite: v.isFavorite,
        radicals: v.radicals,
        tags: vLinks
          .filter((l) => l.vocabId === v.id)
          .map((l) => tagName.get(l.tagId)!)
          .filter(Boolean),
        createdAt: v.createdAt.toISOString(),
        image: img ? { mime: img.mime, data: Buffer.from(img.data).toString("base64") } : null,
        srs: c
          ? {
              due: c.due.toISOString(),
              stability: c.stability,
              difficulty: c.difficulty,
              elapsedDays: c.elapsedDays,
              scheduledDays: c.scheduledDays,
              learningSteps: c.learningSteps,
              reps: c.reps,
              lapses: c.lapses,
              state: c.state,
              lastReview: c.lastReview?.toISOString() ?? null,
            }
          : null,
      };
    }),
    grammarTags: gTags.map((t) => t.name),
    grammar: gs.map((g) => ({
      title: g.title,
      meaning: g.meaning,
      structure: g.structure,
      notes: g.notes,
      sourceOwnerName: g.sourceOwnerName,
      examples: exs
        .filter((e) => e.grammarId === g.id)
        .map((e) => ({ chinese: e.chinese, pinyin: e.pinyin, vietnamese: e.vietnamese })),
      tags: gLinks
        .filter((l) => l.grammarId === g.id)
        .map((l) => gTagName.get(l.tagId)!)
        .filter(Boolean),
      bookmarked: marked.has(g.id),
      personalNote: noteBy.get(g.id) ?? "",
      createdAt: g.createdAt.toISOString(),
    })),
    sentenceTags: sTags.map((t) => t.name),
    sentences: ss.map((x) => ({
      chinese: x.chinese,
      pinyin: x.pinyin,
      vietnamese: x.vietnamese,
      note: x.note,
      status: x.status,
      isFavorite: x.isFavorite,
      tags: sLinks
        .filter((l) => l.sentenceId === x.id)
        .map((l) => sTagName.get(l.tagId)!)
        .filter(Boolean),
      createdAt: x.createdAt.toISOString(),
    })),
    listeningTags: lTags.map((t) => t.name),
    listening: ls.map((x) => ({
      title: x.title,
      tags: lLinks
        .filter((l) => l.exerciseId === x.id)
        .map((l) => lTagName.get(l.tagId)!)
        .filter(Boolean),
      contentUrl: x.contentUrl,
      segmentStart: x.segmentStart,
      segmentEnd: x.segmentEnd,
      playbackSpeed: x.playbackSpeed,
      referenceAnswer: x.referenceAnswer,
      referencePinyin: x.referencePinyin,
      userAnswer: x.userAnswer,
      formattedUserAnswer: x.formattedUserAnswer,
      notes: x.notes,
      createdAt: x.createdAt.toISOString(),
    })),
    radicalsKnown: known.map((k) => k.radical).sort((a, b) => a - b),
    lessonProgress: lessons.map((l) => ({
      lessonId: l.lessonId,
      section: l.section,
      bestScore: l.bestScore,
      lastScore: l.lastScore,
      total: l.total,
      attempts: l.attempts,
      lastAttemptAt: l.lastAttemptAt.toISOString(),
    })),
  };
}
export type ExportData = Awaited<ReturnType<typeof exportData>>;

// ---------- Nhập ----------

const date = z.iso.datetime({ offset: true }).transform((s) => new Date(s));
const srsSchema = z.object({
  due: date,
  stability: z.number().finite().min(0),
  difficulty: z.number().finite().min(0),
  elapsedDays: z.number().int().min(0),
  scheduledDays: z.number().int().min(0),
  learningSteps: z.number().int().min(0),
  reps: z.number().int().min(0),
  lapses: z.number().int().min(0),
  state: z.number().int().min(0).max(3),
  lastReview: date.nullable(),
});

/** Kiểm tra khung file; từng bản ghi được kiểm tra riêng (bản ghi lỗi bị bỏ qua, không làm hỏng cả file). */
const fileSchema = z.object({
  format: z.literal(EXPORT_FORMAT, { error: "File không phải dữ liệu xuất từ LingYu Chinese." }),
  version: z.number().int().min(1).max(EXPORT_VERSION, { error: "File được xuất từ phiên bản mới hơn, chưa hỗ trợ." }),
  vocabTags: z.array(z.unknown()).max(5000).default([]),
  vocab: z.array(z.unknown()).max(20000).default([]),
  grammarTags: z.array(z.unknown()).max(5000).default([]),
  grammar: z.array(z.unknown()).max(5000).default([]),
  sentenceTags: z.array(z.unknown()).max(5000).default([]),
  sentences: z.array(z.unknown()).max(20000).default([]),
  listeningTags: z.array(z.unknown()).max(5000).default([]),
  listening: z.array(z.unknown()).max(5000).default([]),
  radicalsKnown: z.array(z.unknown()).max(214).default([]),
  lessonProgress: z.array(z.unknown()).max(1000).default([]),
});

const vocabRow = z.object({
  data: z.unknown(),
  status: z.enum(["review", "learned"]).catch("review"),
  isFavorite: z.boolean().catch(false),
  createdAt: date.optional().catch(undefined),
  image: z
    .object({ mime: z.string(), data: z.string().max(2_000_000) })
    .nullable()
    .optional()
    .catch(null),
  srs: srsSchema.nullable().optional().catch(null),
});
const grammarRow = z.object({
  bookmarked: z.boolean().catch(false),
  sourceOwnerName: z.string().max(100).nullable().optional().catch(null),
  createdAt: date.optional().catch(undefined),
});
const sentenceRow = z.object({
  status: z.enum(["review", "learned"]).catch("review"),
  isFavorite: z.boolean().catch(false),
  createdAt: date.optional().catch(undefined),
});
const lessonRow = z.object({
  lessonId: z.string(),
  section: z.string(),
  bestScore: z.number().int().min(0),
  lastScore: z.number().int().min(0),
  total: z.number().int().min(1),
  attempts: z.number().int().min(1),
  lastAttemptAt: date,
});

export class ImportError extends Error {}

export type ImportReport = {
  vocab: { added: number; skipped: number };
  grammar: { added: number; skipped: number };
  sentences: { added: number; skipped: number };
  listening: { added: number; skipped: number };
  radicals: number;
  lessons: number;
  images: number;
};

function decodeImage(img: { mime: string; data: string } | null | undefined) {
  if (!img) return null;
  const bytes = Buffer.from(img.data, "base64");
  if (!bytes.length || bytes.length > IMAGE.MAX_BYTES) return null;
  const mime = sniffImage(bytes);
  if (!mime) return null; // chỉ nhận WebP / JPG / PNG thật (magic bytes)
  const size = imageSize(bytes, mime);
  if (!size || size.width > 4096 || size.height > 4096) return null;
  return { bytes, mime, ...size };
}

async function grammarTagIds(tx: Tx, userId: string, names: string[]) {
  const clean = [...new Map(names.map((n) => [n.toLowerCase(), n])).values()];
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
  return rows.map((r) => r.id);
}

export async function importData(userId: string, raw: unknown): Promise<ImportReport> {
  const parsed = fileSchema.safeParse(raw);
  if (!parsed.success) throw new ImportError(parsed.error.issues[0]?.message ?? "File dữ liệu không hợp lệ.");
  const f = parsed.data;
  const report: ImportReport = {
    vocab: { added: 0, skipped: 0 },
    grammar: { added: 0, skipped: 0 },
    sentences: { added: 0, skipped: 0 },
    listening: { added: 0, skipped: 0 },
    radicals: 0,
    lessons: 0,
    images: 0,
  };

  await db.transaction(async (tx) => {
    // Tag trống vẫn được tạo (giữ danh sách tag của người dùng).
    const vTagNames = f.vocabTags.filter((t): t is string => typeof t === "string");
    await ensureTags(tx, userId, vTagNames);

    // Từ vựng: trùng Hán tự với từ đã có → bỏ qua.
    const existing = new Set(
      (await tx.select({ hanzi: vocab.hanzi }).from(vocab).where(eq(vocab.userId, userId))).map((r) => r.hanzi),
    );
    for (const item of f.vocab) {
      const row = vocabRow.safeParse({ ...(item as object), data: item });
      const input = vocabInputSchema.safeParse(item);
      if (!row.success || !input.success || existing.has(input.data.hanzi)) {
        report.vocab.skipped++;
        continue;
      }
      existing.add(input.data.hanzi);
      const v = input.data;
      const img = decodeImage(row.data.image);
      const imageId = img ? await storage.put(tx, { userId, ...img }) : null;
      if (imageId) report.images++;
      const [ins] = await tx
        .insert(vocab)
        .values({
          userId,
          hanzi: v.hanzi,
          pinyin: v.pinyin,
          meaningVi: v.meaningVi,
          note: v.note,
          radicals: v.radicals,
          imageId,
          status: row.data.status,
          isFavorite: row.data.isFavorite,
          ...(row.data.createdAt ? { createdAt: row.data.createdAt } : {}),
          ...folds(v),
        })
        .returning({ id: vocab.id });
      const tagIds = await ensureTags(tx, userId, v.tags);
      if (tagIds.length) await tx.insert(vocabToTag).values(tagIds.map((tagId) => ({ vocabId: ins!.id, tagId })));
      await tx.insert(srsCard).values({ userId, vocabId: ins!.id, ...(row.data.srs ?? newCardColumns()) });
      report.vocab.added++;
    }

    // Ngữ pháp: trùng tiêu đề (không phân biệt hoa thường) → bỏ qua.
    await grammarTagIds(
      tx,
      userId,
      f.grammarTags.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim()),
    );
    const titles = new Set(
      (await tx.select({ title: grammar.title }).from(grammar).where(eq(grammar.userId, userId))).map((r) =>
        r.title.toLowerCase(),
      ),
    );
    for (const item of f.grammar) {
      const input = grammarInputSchema.safeParse(item);
      const row = grammarRow.safeParse(item ?? {});
      if (!input.success || !row.success || titles.has(input.data.title.toLowerCase())) {
        report.grammar.skipped++;
        continue;
      }
      const g = input.data;
      titles.add(g.title.toLowerCase());
      const [ins] = await tx
        .insert(grammar)
        .values({
          userId,
          title: g.title,
          meaning: g.meaning,
          structure: g.structure,
          notes: g.notes,
          sourceOwnerName: row.data.sourceOwnerName ?? null,
          ...(row.data.createdAt ? { createdAt: row.data.createdAt, updatedAt: row.data.createdAt } : {}),
        })
        .returning({ id: grammar.id });
      if (g.examples.length)
        await tx.insert(grammarExample).values(g.examples.map((e, i) => ({ grammarId: ins!.id, ...e, sortOrder: i })));
      const tagIds = await grammarTagIds(tx, userId, g.tags);
      if (tagIds.length) await tx.insert(grammarToTag).values(tagIds.map((tagId) => ({ grammarId: ins!.id, tagId })));
      if (g.personalNote)
        await tx.insert(grammarPersonalNote).values({ userId, grammarId: ins!.id, content: g.personalNote });
      if (row.data.bookmarked) await tx.insert(grammarBookmark).values({ userId, grammarId: ins!.id });
      report.grammar.added++;
    }

    // Câu (Ôn dịch câu): trùng câu tiếng Trung → bỏ qua.
    await ensureSentenceTags(
      tx,
      userId,
      f.sentenceTags.filter((t): t is string => typeof t === "string" && t.trim().length > 0 && t.length <= 24),
    );
    const sExisting = new Set(
      (await tx.select({ c: sentence.chinese }).from(sentence).where(eq(sentence.userId, userId))).map((r) => r.c),
    );
    for (const item of f.sentences) {
      const input = sentenceInputSchema.safeParse(item);
      const row = sentenceRow.safeParse(item ?? {});
      if (!input.success || !row.success || sExisting.has(input.data.chinese)) {
        report.sentences.skipped++;
        continue;
      }
      sExisting.add(input.data.chinese);
      const [ins] = await tx
        .insert(sentence)
        .values({
          userId,
          ...sentenceValues(input.data),
          status: row.data.status,
          isFavorite: row.data.isFavorite,
          ...(row.data.createdAt ? { createdAt: row.data.createdAt } : {}),
        })
        .returning({ id: sentence.id });
      const tagIds = await ensureSentenceTags(tx, userId, input.data.tags);
      if (tagIds.length) await tx.insert(sentenceToTag).values(tagIds.map((tagId) => ({ sentenceId: ins!.id, tagId })));
      report.sentences.added++;
    }

    // Bài làm luyện nghe: trùng (cùng tiêu đề + đáp án + bài chép) → bỏ qua. Điểm luôn được chấm lại.
    const lKey = (x: { title: string; referenceAnswer: string; userAnswer: string }) =>
      `${x.title}\u0000${x.referenceAnswer}\u0000${x.userAnswer}`;
    const lExisting = new Set(
      (
        await tx
          .select({
            title: listeningExercise.title,
            referenceAnswer: listeningExercise.referenceAnswer,
            userAnswer: listeningExercise.userAnswer,
          })
          .from(listeningExercise)
          .where(eq(listeningExercise.userId, userId))
      ).map(lKey),
    );
    for (const item of f.listening) {
      const input = exerciseInputSchema.safeParse(item);
      const created = z.object({ createdAt: date.optional().catch(undefined) }).safeParse(item ?? {});
      if (!input.success || lExisting.has(lKey(input.data))) {
        report.listening.skipped++;
        continue;
      }
      lExisting.add(lKey(input.data));
      const [ins] = await tx
        .insert(listeningExercise)
        .values({
          userId,
          ...exerciseValues(input.data),
          ...(created.success && created.data.createdAt ? { createdAt: created.data.createdAt } : {}),
        })
        .returning({ id: listeningExercise.id });
      await setListeningTags(tx, userId, ins!.id, input.data.tags);
      report.listening.added++;
    }

    // Bộ thủ đã thuộc: hợp lại.
    const nums = [...new Set(f.radicalsKnown.filter(isRadicalNum))];
    if (nums.length) {
      const ins = await tx
        .insert(radicalKnown)
        .values(nums.map((radical) => ({ userId, radical })))
        .onConflictDoNothing()
        .returning({ r: radicalKnown.radical });
      report.radicals = ins.length;
    }

    // Tiến độ bài học: chỉ nhận bài/phần còn tồn tại; đã có thì giữ điểm cao nhất.
    for (const item of f.lessonProgress) {
      const p = lessonRow.safeParse(item);
      if (!p.success) continue;
      const sec = getLesson(p.data.lessonId)?.sections.find((s) => s.id === p.data.section);
      if (!sec || p.data.bestScore > sec.questions.length || p.data.lastScore > sec.questions.length) continue;
      const ins = await tx
        .insert(lessonProgress)
        .values({ userId, ...p.data, total: sec.questions.length })
        .onConflictDoUpdate({
          target: [lessonProgress.userId, lessonProgress.lessonId, lessonProgress.section],
          set: { bestScore: sql`greatest(${lessonProgress.bestScore}, ${p.data.bestScore})` },
        })
        .returning({ a: lessonProgress.attempts });
      if (ins.length) report.lessons++;
    }
  });
  return report;
}

// ---------- Nhập từ bản cũ (CSV) ----------

/** Tách CSV (RFC 4180: ngoặc kép, "" trong ô, xuống dòng trong ô). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]!;
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && s[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

/**
 * File CSV từ bản cũ (Từ vựng → chọn từ → Chia sẻ → Tải file → CSV): cột "Hán tự, Pinyin, Nghĩa tiếng Việt, Ghi chú, Tag".
 * Chuyển thành dạng file xuất để dùng chung luồng nhập (gộp, bỏ qua từ trùng).
 */
export function legacyCsvToExport(text: string) {
  const rows = parseCsv(text);
  const head = (rows[0] ?? []).map((h) => h.trim().toLowerCase());
  const col = (names: string[]) => head.findIndex((h) => names.includes(h));
  const iHanzi = col(["hán tự", "hanzi"]);
  const iPinyin = col(["pinyin"]);
  const iMeaning = col(["nghĩa tiếng việt", "nghĩa", "meaning"]);
  if (iHanzi < 0 || iPinyin < 0 || iMeaning < 0)
    throw new ImportError("File CSV cần có cột Hán tự, Pinyin và Nghĩa tiếng Việt (file tải từ bản LingYu cũ).");
  const iNote = col(["ghi chú", "note"]);
  const iTag = col(["tag", "tags"]);
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    vocab: rows.slice(1).map((r) => ({
      hanzi: r[iHanzi]?.trim() ?? "",
      pinyin: r[iPinyin]?.trim() ?? "",
      meaningVi: r[iMeaning]?.trim() ?? "",
      note: iNote >= 0 ? (r[iNote]?.trim() ?? "") : "",
      tags:
        iTag >= 0
          ? (r[iTag] ?? "")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
    })),
  };
}
