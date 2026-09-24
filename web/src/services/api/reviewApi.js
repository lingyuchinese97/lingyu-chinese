// Review service — tạo phiên, chấm, lưu tiến độ (resume khi refresh), kết quả.
import { API_CONFIG } from "./config.js";
import { local, wait, uid, ApiError } from "./storage.js";
import { getCurrentUser } from "./authApi.js";
import * as vocabApi from "./vocabApi.js";
import { grade, expectedAnswers } from "../../features/review/grading.js";

export const MODES = [
  { value: "meaning", label: "Nhập nghĩa tiếng Việt" },
  { value: "hanzi", label: "Nhập tiếng Trung" },
  { value: "pinyin", label: "Nhập Pinyin" },
  { value: "mixed", label: "Trộn ngẫu nhiên" },
];
export const MODE_LABEL = Object.fromEntries(MODES.map((m) => [m.value, m.label]));
export const COUNTS = [5, 10, 20, 30, 50];

const me = () => {
  const u = getCurrentUser();
  if (!u) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn.");
  return u.id;
};
const kActive = () => `ly_review_active:${me()}`;
const kLast = () => `ly_review_last:${me()}`;
const kLastConfig = () => `ly_review_config:${me()}`;

function shuffle(a) {
  const arr = a.slice();
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  return arr;
}

/**
 * config: { tagIds: string[], count: number, mode, showImage, vocabIds?: string[] }
 */
export async function createSession(config) {
  await wait(API_CONFIG.LATENCY);
  const words = await vocabApi.pool({ tags: config.tagIds || [], ids: config.vocabIds || null });
  if (!words.length) throw new ApiError("empty-pool", "Không có từ vựng nào phù hợp để ôn tập.");
  const count = Math.min(config.count || words.length, words.length);
  const chosen = shuffle(words).slice(0, count);
  const base = ["meaning", "hanzi", "pinyin"];
  const mixed = shuffle(Array.from({ length: count }, (_, i) => base[i % 3]));
  const questions = chosen.map((w, i) => {
    const promptType = config.mode === "mixed" ? mixed[i] : config.mode;
    const word = { id: w.id, hanzi: w.hanzi, pinyin: w.pinyin, meaningVi: w.meaningVi, note: w.note, imageUrl: w.imageUrl };
    return { vocabularyId: w.id, promptType, word, expectedAnswers: expectedAnswers(promptType, word), userAnswer: null, isCorrect: null };
  });
  const session = {
    id: uid("s"),
    config: { tagIds: config.tagIds || [], count, mode: config.mode, showImage: !!config.showImage, vocabIds: config.vocabIds || null, label: config.label || null },
    currentIndex: 0, questions, correctCount: 0, wrongCount: 0,
    status: "active", startedAt: new Date().toISOString(), completedAt: null,
  };
  local.set(kActive(), session);
  if (!config.vocabIds) local.set(kLastConfig(), { tagIds: session.config.tagIds, count: config.count, mode: config.mode, showImage: session.config.showImage });
  return session;
}

export function getActiveSession() {
  try { return local.get(kActive(), null); } catch { return null; }
}
export function getLastConfig() {
  try { return local.get(kLastConfig(), null); } catch { return null; }
}

export function saveProgress(session) {
  local.set(kActive(), session);
}

export async function checkAnswer(session, index, answer) {
  await wait(Math.round(API_CONFIG.LATENCY / 2));
  const q = session.questions[index];
  if (!q) throw new ApiError("invalid", "Câu hỏi không tồn tại.");
  if (q.isCorrect !== null) return session;
  q.userAnswer = String(answer || "").trim();
  q.isCorrect = grade(q.promptType, q.word, q.userAnswer);
  if (q.isCorrect) session.correctCount += 1; else session.wrongCount += 1;
  local.set(kActive(), session);
  if (!q.isCorrect) vocabApi.setStatus(q.vocabularyId, vocabApi.STATUS.REVIEW).catch(() => {});
  return session;
}

export async function completeSession(session) {
  await wait(API_CONFIG.LATENCY);
  session.status = "completed";
  session.completedAt = new Date().toISOString();
  local.set(kLast(), session);
  local.remove(kActive());
  return session;
}

export function abandonSession() {
  local.remove(kActive());
}

export function getLastResult() {
  try { return local.get(kLast(), null); } catch { return null; }
}
