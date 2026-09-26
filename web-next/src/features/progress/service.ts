/**
 * Tiến độ học tập: nhật ký hoạt động, thời gian học theo ngày, chuỗi ngày học, mục tiêu, tiến độ theo HSK.
 * Mọi hàm nhận userId của SESSION và lọc theo đó.
 */
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import {
  grammar,
  grammarMastery,
  grammarTag,
  grammarToTag,
  lessonProgress,
  studyActivity,
  studyDay,
  studyGoal,
  vocab,
  vocabTag,
  vocabToTag,
} from "@/server/db/schema";
import { LESSONS } from "@/data/lessons";
import { HSK_LEVELS, hskLevelOf, hskWords, type HskLevel } from "@/lib/hsk";
import { GOAL_DEFAULTS, GOAL_KINDS, type ActivityKind, type GoalKind } from "./constants";

export * from "./constants";

type Exec = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

const VN_OFFSET = 7 * 3600_000;
/** "YYYY-MM-DD" theo giờ Việt Nam. */
export const dayVN = (d = new Date()) => new Date(d.getTime() + VN_OFFSET).toISOString().slice(0, 10);
/** 0 giờ (giờ VN) của ngày `day`. */
const startOfDayVN = (day: string) => new Date(Date.parse(`${day}T00:00:00Z`) - VN_OFFSET);
const addDays = (day: string, n: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10);
/** Thứ Hai của tuần chứa `day`. */
const mondayOf = (day: string) => {
  const dow = (new Date(`${day}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = T2
  return addDays(day, -dow);
};

// ---------- Ghi nhận ----------

export type ActivityInput = {
  kind: ActivityKind;
  title: string;
  detail?: string;
  refId?: string | null;
  correct?: number | null;
  total?: number | null;
  durationSec?: number;
};

/** Ghi một hoạt động (trùng `refId` cùng loại → bỏ qua, để gọi lại không bị đếm hai lần). */
export async function recordActivity(exec: Exec, userId: string, a: ActivityInput, at = new Date()) {
  await exec
    .insert(studyActivity)
    .values({
      userId,
      kind: a.kind,
      title: a.title.slice(0, 200),
      detail: (a.detail ?? "").slice(0, 300),
      refId: a.refId ?? null,
      correct: a.correct ?? null,
      total: a.total ?? null,
      durationSec: Math.max(0, Math.min(4 * 3600, Math.round(a.durationSec ?? 0))),
      createdAt: at,
    })
    .onConflictDoNothing();
}

/** Cộng dồn hoạt động "thêm từ / thêm ngữ pháp" vào một dòng mỗi ngày. */
export async function bumpDaily(exec: Exec, userId: string, kind: "vocab_add" | "grammar_add", n = 1, at = new Date()) {
  const day = dayVN(at);
  await exec
    .insert(studyActivity)
    .values({ userId, kind, title: "", refId: day, total: n, createdAt: at })
    .onConflictDoUpdate({
      target: [studyActivity.userId, studyActivity.kind, studyActivity.refId],
      targetWhere: sql`${studyActivity.refId} is not null`,
      set: { total: sql`coalesce(${studyActivity.total}, 0) + ${n}`, createdAt: at },
    });
}

/**
 * Nhịp "đang học" (trình duyệt / app gửi ~mỗi phút khi đang mở và có thao tác). Cộng thời gian kể từ nhịp trước,
 * tối đa 60 giây mỗi nhịp; hai nhịp cách nhau quá 2 phút → coi như vừa bắt đầu lại (không cộng khoảng nghỉ).
 */
export async function ping(userId: string, now = new Date()) {
  const day = dayVN(now);
  const [row] = await db
    .select()
    .from(studyDay)
    .where(and(eq(studyDay.userId, userId), eq(studyDay.day, day)));
  const last = row?.lastPingAt?.getTime();
  const elapsed = last ? (now.getTime() - last) / 1000 : Infinity;
  if (elapsed < 20) return { day, seconds: row?.seconds ?? 0 }; // gửi dồn → bỏ qua
  const add = elapsed <= 120 ? Math.round(Math.min(elapsed, 60)) : 0;
  const [r] = await db
    .insert(studyDay)
    .values({ userId, day, seconds: add, lastPingAt: now })
    .onConflictDoUpdate({
      target: [studyDay.userId, studyDay.day],
      set: { seconds: sql`${studyDay.seconds} + ${add}`, lastPingAt: now },
    })
    .returning({ seconds: studyDay.seconds });
  return { day, seconds: r!.seconds };
}

// ---------- Mục tiêu ----------

export async function getGoals(userId: string): Promise<Record<GoalKind, number>> {
  const rows = await db.select().from(studyGoal).where(eq(studyGoal.userId, userId));
  const out = { ...GOAL_DEFAULTS };
  for (const r of rows) if ((GOAL_KINDS as readonly string[]).includes(r.kind)) out[r.kind as GoalKind] = r.target;
  return out;
}

export async function setGoals(userId: string, goals: Partial<Record<GoalKind, number>>) {
  for (const [kind, target] of Object.entries(goals) as [GoalKind, number][]) {
    await db
      .insert(studyGoal)
      .values({ userId, kind, target })
      .onConflictDoUpdate({ target: [studyGoal.userId, studyGoal.kind], set: { target } });
  }
  return getGoals(userId);
}

// ---------- Đọc ----------

/** Phút học mỗi ngày trong `days` ngày gần nhất (kể cả hôm nay), ngày không học = 0. */
export async function dailyMinutes(userId: string, days: number, now = new Date()) {
  const today = dayVN(now);
  const from = addDays(today, -(days - 1));
  const rows = await db
    .select({ day: studyDay.day, seconds: studyDay.seconds })
    .from(studyDay)
    .where(and(eq(studyDay.userId, userId), gte(studyDay.day, from)));
  const by = new Map(rows.map((r) => [r.day, r.seconds]));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(from, i);
    return { day, minutes: Math.round((by.get(day) ?? 0) / 60) };
  });
}

/** Các ngày có học (có thời gian học hoặc có hoạt động). */
async function studiedDays(userId: string, from: string) {
  const [secs, acts] = await Promise.all([
    db
      .select({ day: studyDay.day })
      .from(studyDay)
      .where(and(eq(studyDay.userId, userId), gte(studyDay.day, from), sql`${studyDay.seconds} > 0`)),
    db
      .select({ at: studyActivity.createdAt })
      .from(studyActivity)
      .where(and(eq(studyActivity.userId, userId), gte(studyActivity.createdAt, startOfDayVN(from)))),
  ]);
  return new Set([...secs.map((s) => s.day), ...acts.map((a) => dayVN(a.at))]);
}

/** Chuỗi ngày học liên tiếp (tính đến hôm nay; hôm nay chưa học thì tính đến hôm qua) + lưới 2 tuần (tuần trước, tuần này). */
export async function streak(userId: string, now = new Date()) {
  const today = dayVN(now);
  const days = await studiedDays(userId, addDays(today, -400));
  let d = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  const monday = mondayOf(today);
  const week = (start: string) =>
    Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i);
      return { day, studied: days.has(day), future: day > today };
    });
  return { current: n, weeks: [week(addDays(monday, -7)), week(monday)] };
}

export type HistoryItem = {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  correct: number | null;
  total: number | null;
  durationSec: number;
  createdAt: Date;
};

/** Lịch sử học tập (mới nhất trước). */
export async function history(userId: string, opts: { kind?: ActivityKind; days?: number; limit?: number } = {}) {
  const conds = [eq(studyActivity.userId, userId)];
  if (opts.kind) conds.push(eq(studyActivity.kind, opts.kind));
  if (opts.days) conds.push(gte(studyActivity.createdAt, startOfDayVN(addDays(dayVN(), -(opts.days - 1)))));
  const rows = await db
    .select()
    .from(studyActivity)
    .where(and(...conds))
    .orderBy(desc(studyActivity.createdAt))
    .limit(Math.min(opts.limit ?? 100, 500));
  return rows.map((r): HistoryItem => ({
    id: r.id,
    kind: r.kind as ActivityKind,
    title: r.title,
    detail: r.detail,
    correct: r.correct,
    total: r.total,
    durationSec: r.durationSec,
    createdAt: r.createdAt,
  }));
}

/** Số liệu "Học tập hôm nay". */
export async function today(userId: string, now = new Date()) {
  const from = startOfDayVN(dayVN(now));
  const rows = await db
    .select({ kind: studyActivity.kind, total: studyActivity.total })
    .from(studyActivity)
    .where(and(eq(studyActivity.userId, userId), gte(studyActivity.createdAt, from)));
  const sum = (kinds: string[]) => rows.filter((r) => kinds.includes(r.kind)).reduce((n, r) => n + (r.total ?? 0), 0);
  const [d] = await db
    .select({ seconds: studyDay.seconds })
    .from(studyDay)
    .where(and(eq(studyDay.userId, userId), eq(studyDay.day, dayVN(now))));
  return {
    vocab: sum(["vocab_add", "vocab_review"]),
    grammar: sum(["grammar_add", "grammar_review"]),
    reading: rows.filter((r) => r.kind === "reading").length,
    translation: sum(["translation", "sentence_review"]),
    minutes: Math.round((d?.seconds ?? 0) / 60),
  };
}

/** Điểm trung bình (%) các hoạt động có chấm điểm trong 30 ngày. */
async function avgScore(userId: string, kinds: ActivityKind[], now = new Date()) {
  const rows = await db
    .select({ c: studyActivity.correct, t: studyActivity.total })
    .from(studyActivity)
    .where(
      and(
        eq(studyActivity.userId, userId),
        inArray(studyActivity.kind, kinds),
        gte(studyActivity.createdAt, new Date(now.getTime() - 30 * 86400_000)),
        sql`${studyActivity.total} > 0`,
      ),
    );
  if (!rows.length) return 0;
  const c = rows.reduce((n, r) => n + (r.c ?? 0), 0);
  const t = rows.reduce((n, r) => n + (r.t ?? 0), 0);
  return t ? Math.round((c / t) * 100) : 0;
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Tổng quan trang Tiến độ học tập. */
export async function summary(userId: string, now = new Date()) {
  const todayDay = dayVN(now);
  const monday = mondayOf(todayDay);
  const monthStart = `${todayDay.slice(0, 7)}-01`;
  const [secs, weekRows, vocabRow, grammarRow, sections, goals, st, weekLessons, monthVocab] = await Promise.all([
    db
      .select({ s: sql<number>`coalesce(sum(${studyDay.seconds}), 0)`.mapWith(Number) })
      .from(studyDay)
      .where(eq(studyDay.userId, userId)),
    db
      .select({ day: studyDay.day, seconds: studyDay.seconds })
      .from(studyDay)
      .where(and(eq(studyDay.userId, userId), gte(studyDay.day, addDays(monday, -7)))),
    db
      .select({
        total: count(),
        learned: sql<number>`count(*) filter (where ${vocab.status} = 'learned')`.mapWith(Number),
      })
      .from(vocab)
      .where(eq(vocab.userId, userId)),
    db
      .select({
        total: count(),
        learned: sql<number>`count(*) filter (where ${grammarMastery.correct} > 0)`.mapWith(Number),
      })
      .from(grammar)
      .leftJoin(grammarMastery, and(eq(grammarMastery.grammarId, grammar.id), eq(grammarMastery.userId, userId)))
      .where(eq(grammar.userId, userId)),
    db.select({ n: count() }).from(lessonProgress).where(eq(lessonProgress.userId, userId)),
    getGoals(userId),
    streak(userId, now),
    db
      .select({ n: count() })
      .from(studyActivity)
      .where(
        and(
          eq(studyActivity.userId, userId),
          eq(studyActivity.kind, "lesson"),
          gte(studyActivity.createdAt, startOfDayVN(monday)),
        ),
      ),
    db
      .select({ n: count() })
      .from(vocab)
      .where(and(eq(vocab.userId, userId), gte(vocab.createdAt, startOfDayVN(monthStart)))),
  ]);
  const thisWeek = weekRows.filter((r) => r.day >= monday).reduce((n, r) => n + r.seconds, 0);
  const lastWeek = weekRows.filter((r) => r.day < monday).reduce((n, r) => n + r.seconds, 0);
  const todayMin = Math.round((weekRows.find((r) => r.day === todayDay)?.seconds ?? 0) / 60);
  const totalSections = LESSONS.reduce((n, l) => n + l.sections.length, 0);
  const v = vocabRow[0] ?? { total: 0, learned: 0 };
  const g = grammarRow[0] ?? { total: 0, learned: 0 };
  const [reading, translation, review] = await Promise.all([
    avgScore(userId, ["reading"], now),
    avgScore(userId, ["translation", "sentence_review"], now),
    avgScore(userId, ["vocab_review", "grammar_review"], now),
  ]);
  return {
    totalSeconds: secs[0]?.s ?? 0,
    weekSecondsDelta: thisWeek - lastWeek,
    lessons: { done: sections[0]?.n ?? 0, total: totalSections, percent: pct(sections[0]?.n ?? 0, totalSections) },
    vocab: { learned: v.learned, total: v.total, percent: pct(v.learned, v.total) },
    grammar: { learned: g.learned, total: g.total, percent: pct(g.learned, g.total) },
    skills: {
      vocab: pct(v.learned, v.total),
      grammar: pct(g.learned, g.total),
      reading,
      translation,
      review,
    },
    streak: st,
    goals: {
      minutes_day: { target: goals.minutes_day, value: todayMin },
      lessons_week: { target: goals.lessons_week, value: weekLessons[0]?.n ?? 0 },
      vocab_month: { target: goals.vocab_month, value: monthVocab[0]?.n ?? 0 },
    },
  };
}

// ---------- Theo HSK / thẻ ----------

/** Tiến độ từ vựng theo cấp HSK: số từ HSK của cấp đó mà mình đã thuộc / đã có trong kho / tổng số từ của cấp. */
export async function vocabByHsk(userId: string) {
  const rows = await db
    .select({ hanzi: vocab.hanzi, status: vocab.status })
    .from(vocab)
    .where(eq(vocab.userId, userId));
  const learned = new Map<HskLevel, number>();
  const inBank = new Map<HskLevel, number>();
  const seen = new Set<string>();
  for (const r of rows) {
    const w = r.hanzi.trim();
    if (seen.has(w)) continue;
    seen.add(w);
    const lv = hskLevelOf(w);
    if (!lv) continue;
    inBank.set(lv, (inBank.get(lv) ?? 0) + 1);
    if (r.status === "learned") learned.set(lv, (learned.get(lv) ?? 0) + 1);
  }
  return HSK_LEVELS.map((level) => {
    const total = hskWords(level).length;
    const l = learned.get(level) ?? 0;
    return { level, learned: l, inBank: inBank.get(level) ?? 0, total, percent: pct(l, total) };
  });
}

/** Tiến độ từ vựng theo thẻ của mình. */
export async function vocabByTag(userId: string) {
  const rows = await db
    .select({
      id: vocabTag.id,
      name: vocabTag.name,
      total: count(vocabToTag.vocabId),
      learned: sql<number>`count(*) filter (where ${vocab.status} = 'learned')`.mapWith(Number),
    })
    .from(vocabTag)
    .leftJoin(vocabToTag, eq(vocabToTag.tagId, vocabTag.id))
    .leftJoin(vocab, eq(vocab.id, vocabToTag.vocabId))
    .where(eq(vocabTag.userId, userId))
    .groupBy(vocabTag.id)
    .orderBy(asc(vocabTag.name));
  return rows.map((r) => ({ ...r, percent: pct(r.learned, r.total) }));
}

/** Tiến độ ngữ pháp theo thẻ (thẻ “HSK 1”, “HSK1”… được gom thành cấp HSK). */
export async function grammarByTag(userId: string) {
  const rows = await db
    .select({
      name: grammarTag.name,
      total: count(grammarToTag.grammarId),
      learned: sql<number>`count(*) filter (where ${grammarMastery.correct} > 0)`.mapWith(Number),
    })
    .from(grammarTag)
    .leftJoin(grammarToTag, eq(grammarToTag.tagId, grammarTag.id))
    .leftJoin(
      grammarMastery,
      and(eq(grammarMastery.grammarId, grammarToTag.grammarId), eq(grammarMastery.userId, userId)),
    )
    .where(eq(grammarTag.userId, userId))
    .groupBy(grammarTag.id)
    .orderBy(asc(grammarTag.name));
  const hsk = HSK_LEVELS.slice(0, 6).map((level) => {
    const own = rows.filter((r) => r.name.replace(/\s+/g, "").toUpperCase() === `HSK${level}`);
    const total = own.reduce((n, r) => n + r.total, 0);
    const learned = own.reduce((n, r) => n + r.learned, 0);
    return { level, total, learned, percent: pct(learned, total) };
  });
  return { hsk, tags: rows.map((r) => ({ ...r, percent: pct(r.learned, r.total) })) };
}

export { addDays };
