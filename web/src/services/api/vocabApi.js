// Vocabulary service — CRUD / search / filter / tag / pagination.
// Bản MOCK lưu IndexedDB theo từng user. Chữ ký hàm giữ nguyên khi chuyển sang REST.
import { API_CONFIG } from "./config.js";
import { kv, wait, uid, ApiError } from "./storage.js";
import { getCurrentUser } from "./authApi.js";

export const STATUS = { LEARNED: "learned", REVIEW: "review" };
export const STATUS_LABEL = { learned: "Đã thuộc", review: "Cần ôn" };
export const SORTS = [
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "pinyin", label: "Pinyin A → Z" },
  { value: "favorite", label: "Yêu thích trước" },
];
export const MAX_NOTE = 200;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function uidOrThrow() {
  const u = getCurrentUser();
  if (!u) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
  return u.id;
}
const kVocab = (id) => `vocab:${id}`;
const kTags = (id) => `tags:${id}`;

async function readAll() { return (await kv.get(kVocab(uidOrThrow()), [])) || []; }
async function writeAll(list) { await kv.set(kVocab(uidOrThrow()), list); }

/** Bỏ dấu tiếng Việt + thanh điệu pinyin để tìm kiếm. */
export function fold(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();
}

function cleanTags(tags) {
  const seen = new Set();
  return (tags || []).map((t) => String(t).trim()).filter((t) => {
    const k = t.toLowerCase();
    if (!t || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function validate(data) {
  const errors = {};
  const hanzi = String(data.hanzi || "").trim();
  const pinyin = String(data.pinyin || "").trim();
  const meaningVi = String(data.meaningVi || "").trim();
  if (!hanzi) errors.hanzi = "Vui lòng nhập chữ Hán.";
  else if (!/[㐀-鿿豈-﫿]/.test(hanzi)) errors.hanzi = "Hán tự phải chứa ít nhất một chữ Hán.";
  if (!pinyin) errors.pinyin = "Vui lòng nhập pinyin.";
  if (!meaningVi) errors.meaningVi = "Vui lòng nhập nghĩa tiếng Việt.";
  if (String(data.note || "").length > MAX_NOTE) errors.note = `Ghi chú tối đa ${MAX_NOTE} ký tự.`;
  if (Object.keys(errors).length) throw new ApiError("validation", "Vui lòng kiểm tra lại các trường bắt buộc.", { errors });
  return { hanzi, pinyin, meaningVi };
}

export async function list({ q = "", tag = "", sort = "newest", page = 1, pageSize = 10 } = {}) {
  await wait(API_CONFIG.LATENCY);
  const all = await readAll();
  const tagCounts = countTags(all, await kv.get(kTags(uidOrThrow()), []));
  const fq = fold(q);
  let items = all.filter((v) => {
    if (tag && !v.tags.some((t) => t.toLowerCase() === tag.toLowerCase())) return false;
    if (!fq) return true;
    return v.hanzi.includes(q.trim()) || fold(v.pinyin).replace(/\s/g, "").includes(fq.replace(/\s/g, "")) ||
      fold(v.meaningVi).includes(fq) || v.tags.some((t) => fold(t).includes(fq));
  });
  const by = {
    newest: (a, b) => (a.createdAt < b.createdAt ? 1 : -1),
    oldest: (a, b) => (a.createdAt > b.createdAt ? 1 : -1),
    pinyin: (a, b) => fold(a.pinyin).localeCompare(fold(b.pinyin)),
    favorite: (a, b) => (b.isFavorite - a.isFavorite) || (a.createdAt < b.createdAt ? 1 : -1),
  }[sort] || ((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  items.sort(by);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, Number(page) || 1), pageCount);
  return { items: items.slice((p - 1) * pageSize, p * pageSize), total, page: p, pageCount, pageSize, totalAll: all.length, tagCounts };
}

function countTags(all, extra = []) {
  const map = new Map();
  extra.forEach((t) => map.set(t.toLowerCase(), { name: t, count: 0 }));
  all.forEach((v) => v.tags.forEach((t) => {
    const k = t.toLowerCase();
    const e = map.get(k) || { name: t, count: 0 };
    e.count += 1;
    map.set(k, e);
  }));
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export async function listTags() {
  await wait(API_CONFIG.LATENCY / 2);
  return countTags(await readAll(), await kv.get(kTags(uidOrThrow()), []));
}

export async function createTag(name) {
  const n = String(name || "").trim();
  if (!n) throw new ApiError("validation", "Tên tag không được để trống.");
  if (n.length > 24) throw new ApiError("validation", "Tên tag tối đa 24 ký tự.");
  const key = kTags(uidOrThrow());
  const tags = (await kv.get(key, [])) || [];
  if (!tags.some((t) => t.toLowerCase() === n.toLowerCase())) await kv.set(key, [...tags, n]);
  return n;
}

export async function get(id) {
  await wait(API_CONFIG.LATENCY);
  const v = (await readAll()).find((x) => x.id === id);
  if (!v) throw new ApiError("not-found", "Không tìm thấy từ vựng này. Có thể nó đã bị xóa.");
  return v;
}

export async function create(data) {
  await wait(API_CONFIG.LATENCY);
  const base = validate(data);
  const all = await readAll();
  const now = new Date().toISOString();
  const rec = {
    id: uid("v"), ...base,
    note: String(data.note || "").trim(),
    imageUrl: data.imageUrl || null,
    tags: cleanTags(data.tags),
    status: STATUS.REVIEW,
    isFavorite: false,
    createdAt: now, updatedAt: now,
  };
  await writeAll([rec, ...all]);
  for (const t of rec.tags) await createTag(t);
  return rec;
}

export async function update(id, data) {
  await wait(API_CONFIG.LATENCY);
  const all = await readAll();
  const i = all.findIndex((x) => x.id === id);
  if (i < 0) throw new ApiError("not-found", "Không tìm thấy từ vựng này. Có thể nó đã bị xóa.");
  const merged = { ...all[i], ...data };
  const base = ("hanzi" in data || "pinyin" in data || "meaningVi" in data) ? validate(merged) : {};
  all[i] = { ...merged, ...base, tags: cleanTags(merged.tags), updatedAt: new Date().toISOString() };
  await writeAll(all);
  for (const t of all[i].tags) await createTag(t);
  return all[i];
}

/** Lấy đúng các từ theo danh sách id (giữ thứ tự của ids, bỏ qua id không còn tồn tại). */
export async function getMany(ids) {
  await wait(API_CONFIG.LATENCY);
  const byId = new Map((await readAll()).map((v) => [v.id, v]));
  return [].concat(ids).map((id) => byId.get(id)).filter(Boolean);
}

/** Gắn thêm tag cho nhiều từ (giữ tag cũ). */
export async function addTags(ids, tags) {
  await wait(API_CONFIG.LATENCY);
  const add = cleanTags(tags);
  if (!add.length) throw new ApiError("validation", "Vui lòng chọn ít nhất 1 tag.");
  const set = new Set([].concat(ids));
  const all = await readAll();
  const now = new Date().toISOString();
  let updated = 0;
  all.forEach((v) => {
    if (!set.has(v.id)) return;
    v.tags = cleanTags([...v.tags, ...add]);
    v.updatedAt = now;
    updated++;
  });
  await writeAll(all);
  for (const t of add) await createTag(t);
  return { updated };
}

export async function remove(ids) {
  await wait(API_CONFIG.LATENCY);
  const set = new Set([].concat(ids));
  const all = await readAll();
  await writeAll(all.filter((v) => !set.has(v.id)));
  return { removed: set.size };
}

export async function toggleFavorite(id) {
  const all = await readAll();
  const v = all.find((x) => x.id === id);
  if (!v) throw new ApiError("not-found", "Không tìm thấy từ vựng.");
  v.isFavorite = !v.isFavorite;
  await writeAll(all);
  return v;
}

export async function setStatus(ids, status) {
  const set = new Set([].concat(ids));
  const all = await readAll();
  all.forEach((v) => { if (set.has(v.id)) v.status = status; });
  await writeAll(all);
}

export async function stats() {
  await wait(API_CONFIG.LATENCY);
  const all = await readAll();
  return {
    total: all.length,
    needReview: all.filter((v) => v.status === STATUS.REVIEW).length,
    learned: all.filter((v) => v.status === STATUS.LEARNED).length,
    latest: all.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0] || null,
  };
}

/** Lấy tập từ cho phiên ôn tập theo danh sách tag (rỗng = tất cả). */
export async function pool({ tags = [], ids = null } = {}) {
  const all = await readAll();
  if (ids) { const s = new Set(ids); return all.filter((v) => s.has(v.id)); }
  if (!tags.length) return all;
  const want = new Set(tags.map((t) => t.toLowerCase()));
  return all.filter((v) => v.tags.some((t) => want.has(t.toLowerCase())));
}

export async function importMany(records) {
  await wait(API_CONFIG.LATENCY);
  const all = await readAll();
  const existing = new Set(all.map((v) => v.hanzi));
  const now = Date.now();
  const fresh = records.filter((r) => !existing.has(r.hanzi)).map((r, i) => ({
    id: uid("v"), hanzi: r.hanzi, pinyin: r.pinyin, meaningVi: r.meaningVi, note: r.note || "",
    imageUrl: r.imageUrl || null, tags: cleanTags(r.tags), status: r.status || STATUS.REVIEW, isFavorite: !!r.isFavorite,
    createdAt: new Date(now - i * 60000).toISOString(), updatedAt: new Date(now).toISOString(),
  }));
  await writeAll([...fresh, ...all]);
  return { added: fresh.length };
}

export async function clearAll() {
  await wait(API_CONFIG.LATENCY);
  await writeAll([]);
  await kv.set(kTags(uidOrThrow()), []);
}
