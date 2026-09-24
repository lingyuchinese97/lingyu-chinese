// Grammar service — bản MOCK. Dữ liệu lưu chung trong localStorage (đóng vai database server)
// để 2 tài khoản trên cùng trình duyệt có thể chia sẻ ngữ pháp cho nhau.
// Mỗi hàm tương ứng 1 endpoint trong spec (ghi ở comment) — khi có backend thật chỉ thay phần thân.
import { API_CONFIG } from "./config.js";
import { local, wait, uid, ApiError } from "./storage.js";
import { getCurrentUser, findUserByEmail, getUserById, isEmail } from "./authApi.js";
import { notify } from "./notificationApi.js";

const K = {
  grammars: "ly_grammars",          // Grammar (+ examples nhúng sẵn, có sort_order)
  tags: "ly_grammar_tags",          // Tag (theo user)
  bookmarks: "ly_grammar_bookmarks",// GrammarBookmark
  shares: "ly_grammar_shares",      // GrammarShare
  personal: "ly_grammar_personal",  // Ghi chú cá nhân: { "<userId>:<grammarId>": text } — không bao giờ được chia sẻ
};
export const SHARE_STATUS = { PENDING: "PENDING", ACCEPTED: "ACCEPTED", REJECTED: "REJECTED" };
export const SHARE_STATUS_LABEL = { PENDING: "Đang chờ", ACCEPTED: "Đã chấp nhận", REJECTED: "Đã từ chối" };
export const SORTS = [
  { value: "updated", label: "Cập nhật gần nhất" },
  { value: "newest", label: "Mới nhất" },
  { value: "oldest", label: "Cũ nhất" },
  { value: "az", label: "A → Z" },
  { value: "za", label: "Z → A" },
];
export const LIMITS = { title: 120, meaning: 2000, structure: 300, notes: 2000, personalNote: 2000, tag: 24, examples: 30 };

const read = (k) => local.get(k, []) || [];
const write = (k, v) => local.set(k, v);
const now = () => new Date().toISOString();

function me() {
  const u = getCurrentUser();
  if (!u) throw new ApiError("unauthenticated", "Phiên đăng nhập đã hết hạn.");
  return u;
}

/** Bỏ dấu + chữ thường: "Học" → "hoc", "nǐ" → "ni" (tìm kiếm Latin không phân biệt hoa/thường). */
export function fold(s) {
  return String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}
const cleanName = (s) => String(s ?? "").trim().replace(/\s+/g, " ");

// ---------- Tag helpers ----------

function tagProblem(name) {
  if (!name) return "Tên thẻ không được để trống.";
  if (name.length > LIMITS.tag) return `Tên thẻ tối đa ${LIMITS.tag} ký tự.`;
  return "";
}
/** Đổi danh sách tên thẻ → id thẻ của user (tạo thẻ mới nếu chưa có, dùng lại nếu đã có). */
function resolveTagIds(userId, names) {
  const tags = read(K.tags);
  const ids = [];
  const seen = new Set();
  for (const raw of names || []) {
    const name = cleanName(raw);
    const err = tagProblem(name);
    if (err) throw new ApiError("validation", err, { field: "tags" });
    const key = name.toLowerCase();
    if (seen.has(key)) continue; // không trùng thẻ trong cùng 1 ngữ pháp
    seen.add(key);
    let t = tags.find((x) => x.userId === userId && x.name.toLowerCase() === key);
    if (!t) { t = { id: uid("gt"), userId, name, createdAt: now() }; tags.push(t); }
    ids.push(t.id);
  }
  write(K.tags, tags);
  return ids;
}

// ---------- Mapping ----------

function personalKey(userId, grammarId) { return `${userId}:${grammarId}`; }

function view(g, userId, { preview = false } = {}) {
  const tags = read(K.tags);
  const bookmarks = read(K.bookmarks);
  const owner = getUserById(g.userId);
  const personal = local.get(K.personal, {}) || {};
  return {
    id: g.id,
    userId: g.userId,
    ownerName: owner?.name || "",
    sourceGrammarId: g.sourceGrammarId || null,
    sourceOwnerName: g.sourceOwnerName || "",
    title: g.title,
    meaning: g.meaning,
    structure: g.structure,
    notes: g.notes,
    examples: g.examples.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    tags: g.tagIds.map((id) => tags.find((t) => t.id === id)).filter(Boolean).map((t) => ({ id: t.id, name: t.name })),
    isOwner: g.userId === userId,
    isSaved: bookmarks.some((b) => b.userId === userId && b.grammarId === g.id),
    // Ghi chú cá nhân chỉ trả về cho chính chủ, không bao giờ có trong bản preview chia sẻ.
    personalNote: !preview && g.userId === userId ? personal[personalKey(userId, g.id)] || "" : "",
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
  };
}

function validate(data) {
  const title = cleanName(data.title);
  const errors = {};
  if (!title) errors.title = "Vui lòng nhập tiêu đề ngữ pháp.";
  else if (title.length > LIMITS.title) errors.title = `Tiêu đề tối đa ${LIMITS.title} ký tự.`;
  for (const f of ["meaning", "structure", "notes", "personalNote"]) {
    if (String(data[f] || "").length > LIMITS[f]) errors[f] = `Tối đa ${LIMITS[f]} ký tự.`;
  }
  const examples = (data.examples || [])
    .map((e) => ({ chinese: String(e.chinese || "").trim(), pinyin: String(e.pinyin || "").trim(), vietnamese: String(e.vietnamese || "").trim(), id: e.id }))
    .filter((e) => e.chinese || e.pinyin || e.vietnamese);
  if (examples.length > LIMITS.examples) errors.examples = `Tối đa ${LIMITS.examples} ví dụ.`;
  const badEx = examples.findIndex((e) => !e.chinese);
  if (badEx >= 0) errors.examples = `Ví dụ ${badEx + 1}: vui lòng nhập câu tiếng Trung.`;
  if (Object.keys(errors).length) {
    const first = Object.values(errors)[0];
    throw new ApiError("validation", first, { fields: errors });
  }
  return {
    title,
    meaning: String(data.meaning || "").trim(),
    structure: String(data.structure || "").trim(),
    notes: String(data.notes || "").trim(),
    examples: examples.map((e, i) => ({ id: e.id || uid("ge"), chinese: e.chinese, pinyin: e.pinyin, vietnamese: e.vietnamese, sortOrder: i })),
  };
}

function setPersonalNote(userId, grammarId, text) {
  const all = local.get(K.personal, {}) || {};
  const key = personalKey(userId, grammarId);
  const t = String(text || "").trim();
  if (t) all[key] = t; else delete all[key];
  local.set(K.personal, all);
}

function ownedOrThrow(id, userId) {
  const list = read(K.grammars);
  const g = list.find((x) => x.id === id);
  if (!g) throw new ApiError("not-found", "Không tìm thấy ngữ pháp này. Có thể nó đã bị xóa.");
  if (g.userId !== userId) throw new ApiError("forbidden", "Bạn chỉ có thể sửa hoặc xóa ngữ pháp do mình tạo.");
  return { list, g };
}

// ---------- Grammar CRUD ----------

/** GET /api/grammars */
export async function list({ q = "", tagId = "", sort = "updated", saved = false } = {}) {
  await wait(API_CONFIG.LATENCY);
  const u = me();
  const tags = read(K.tags);
  const bookmarks = new Set(read(K.bookmarks).filter((b) => b.userId === u.id).map((b) => b.grammarId));
  let items = read(K.grammars).filter((g) => g.userId === u.id);
  const totalAll = items.length;
  if (saved) items = items.filter((g) => bookmarks.has(g.id));
  if (tagId) items = items.filter((g) => g.tagIds.includes(tagId));
  const needle = fold(q).trim();
  if (needle) {
    items = items.filter((g) => {
      const tagNames = g.tagIds.map((id) => tags.find((t) => t.id === id)?.name || "");
      const hay = [g.title, g.meaning, g.structure, g.notes, ...tagNames,
        ...g.examples.flatMap((e) => [e.chinese, e.pinyin, e.vietnamese])].join("\n");
      const h = fold(hay);
      // Bỏ khoảng trắng khi so để "xue sheng" khớp "xuésheng", "nihao" khớp "nǐ hǎo".
      return h.includes(needle) || h.replace(/\s+/g, "").includes(needle.replace(/\s+/g, ""));
    });
  }
  const collator = new Intl.Collator("vi", { sensitivity: "base" });
  const by = {
    updated: (a, b) => (a.updatedAt < b.updatedAt ? 1 : -1),
    newest: (a, b) => (a.createdAt < b.createdAt ? 1 : -1),
    oldest: (a, b) => (a.createdAt > b.createdAt ? 1 : -1),
    az: (a, b) => collator.compare(a.title, b.title),
    za: (a, b) => collator.compare(b.title, a.title),
  }[sort] || ((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  items.sort(by);
  return { items: items.map((g) => view(g, u.id)), total: items.length, totalAll, savedCount: bookmarks.size };
}

/**
 * GET /api/grammars/:id
 * Chủ sở hữu: xem đầy đủ. Người nhận có lời mời PENDING: xem preview (không có ghi chú cá nhân).
 */
export async function get(id, { shareId } = {}) {
  await wait(API_CONFIG.LATENCY);
  const u = me();
  const g = read(K.grammars).find((x) => x.id === id);
  if (!g) throw new ApiError("not-found", "Không tìm thấy ngữ pháp này. Có thể nó đã bị xóa.");
  if (g.userId === u.id) return { grammar: view(g, u.id), share: null };
  const share = read(K.shares).find((s) => s.grammarId === id && s.recipientId === u.id && (!shareId || s.id === shareId)
    && s.status === SHARE_STATUS.PENDING);
  if (!share) throw new ApiError("forbidden", "Bạn không có quyền xem ngữ pháp này.");
  return { grammar: view(g, u.id, { preview: true }), share: shareView(share) };
}

/** POST /api/grammars */
export async function create(data) {
  await wait(API_CONFIG.LATENCY);
  const u = me();
  const base = validate(data);
  const t = now();
  const g = { id: uid("g"), userId: u.id, sourceGrammarId: null, ...base, tagIds: resolveTagIds(u.id, data.tags), createdAt: t, updatedAt: t };
  write(K.grammars, [g, ...read(K.grammars)]);
  setPersonalNote(u.id, g.id, data.personalNote);
  return view(g, u.id);
}

/** PUT /api/grammars/:id — cập nhật updated_at, không tạo bản mới. */
export async function update(id, data) {
  await wait(API_CONFIG.LATENCY);
  const u = me();
  const { list: all, g } = ownedOrThrow(id, u.id);
  const base = validate({ ...g, ...data });
  Object.assign(g, base, { tagIds: "tags" in data ? resolveTagIds(u.id, data.tags) : g.tagIds, updatedAt: now() });
  write(K.grammars, all);
  if ("personalNote" in data) setPersonalNote(u.id, g.id, data.personalNote);
  return view(g, u.id);
}

/**
 * DELETE /api/grammars/:id
 * Bản người nhận đã chấp nhận là bản copy riêng → không bị ảnh hưởng.
 * Lời mời còn PENDING của ngữ pháp này bị hủy (người nhận không thể chấp nhận nữa).
 */
export async function remove(id) {
  await wait(API_CONFIG.LATENCY);
  const u = me();
  ownedOrThrow(id, u.id);
  write(K.grammars, read(K.grammars).filter((x) => x.id !== id));
  write(K.bookmarks, read(K.bookmarks).filter((b) => b.grammarId !== id));
  write(K.shares, read(K.shares).filter((s) => !(s.grammarId === id && s.status === SHARE_STATUS.PENDING)));
  const personal = local.get(K.personal, {}) || {};
  delete personal[personalKey(u.id, id)];
  local.set(K.personal, personal);
  return { removed: 1 };
}

// ---------- Tags ----------

/** GET /api/grammar-tags — kèm số ngữ pháp mỗi thẻ. */
export async function listTags() {
  const u = me();
  const mine = read(K.grammars).filter((g) => g.userId === u.id);
  const collator = new Intl.Collator("vi", { numeric: true, sensitivity: "base" });
  return read(K.tags).filter((t) => t.userId === u.id)
    .map((t) => ({ id: t.id, name: t.name, count: mine.filter((g) => g.tagIds.includes(t.id)).length }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

/** POST /api/grammar-tags */
export async function createTag(name) {
  await wait(API_CONFIG.LATENCY / 2);
  const u = me();
  const n = cleanName(name);
  const err = tagProblem(n);
  if (err) throw new ApiError("validation", err);
  if (read(K.tags).some((t) => t.userId === u.id && t.name.toLowerCase() === n.toLowerCase())) {
    throw new ApiError("duplicate", `Thẻ “${n}” đã tồn tại.`);
  }
  const [id] = resolveTagIds(u.id, [n]);
  return { id, name: n };
}

/** PUT /api/grammar-tags/:id */
export async function renameTag(id, name) {
  await wait(API_CONFIG.LATENCY / 2);
  const u = me();
  const n = cleanName(name);
  const err = tagProblem(n);
  if (err) throw new ApiError("validation", err);
  const tags = read(K.tags);
  const t = tags.find((x) => x.id === id && x.userId === u.id);
  if (!t) throw new ApiError("not-found", "Không tìm thấy thẻ.");
  if (tags.some((x) => x.userId === u.id && x.id !== id && x.name.toLowerCase() === n.toLowerCase())) {
    throw new ApiError("duplicate", `Thẻ “${n}” đã tồn tại.`);
  }
  t.name = n;
  write(K.tags, tags);
  return { id, name: n };
}

/** DELETE /api/grammar-tags/:id — chỉ bỏ liên kết thẻ ↔ ngữ pháp, không xóa ngữ pháp. */
export async function deleteTag(id) {
  await wait(API_CONFIG.LATENCY / 2);
  const u = me();
  const tags = read(K.tags);
  if (!tags.some((x) => x.id === id && x.userId === u.id)) throw new ApiError("not-found", "Không tìm thấy thẻ.");
  write(K.tags, tags.filter((x) => x.id !== id));
  const all = read(K.grammars);
  all.forEach((g) => { if (g.userId === u.id) g.tagIds = g.tagIds.filter((t) => t !== id); });
  write(K.grammars, all);
  return { removed: 1 };
}

// ---------- Bookmark ----------

/** POST /api/grammars/:id/bookmark (saved=true) · DELETE /api/grammars/:id/bookmark (saved=false) */
export async function setBookmark(id, saved) {
  const u = me();
  const g = read(K.grammars).find((x) => x.id === id);
  if (!g || g.userId !== u.id) throw new ApiError("not-found", "Không tìm thấy ngữ pháp này.");
  const list = read(K.bookmarks).filter((b) => !(b.userId === u.id && b.grammarId === id));
  if (saved) list.push({ id: uid("gb"), userId: u.id, grammarId: id, createdAt: now() });
  write(K.bookmarks, list);
  return { saved };
}

// ---------- Share ----------

function shareView(s) {
  const g = read(K.grammars).find((x) => x.id === s.grammarId);
  const sender = getUserById(s.senderId);
  const recipient = getUserById(s.recipientId);
  return {
    id: s.id,
    grammarId: s.grammarId,
    grammarTitle: g?.title || s.grammarTitle || "",
    grammarExists: !!g,
    senderId: s.senderId,
    senderName: sender?.name || "",
    senderEmail: sender?.email || "",
    recipientId: s.recipientId,
    recipientName: recipient?.name || "",
    recipientEmail: recipient?.email || s.recipientEmail || "",
    status: s.status,
    createdAt: s.createdAt,
    acceptedAt: s.acceptedAt || null,
    importedGrammarId: s.importedGrammarId || null,
  };
}

/** Tách chuỗi nhiều email (dấu phẩy, chấm phẩy, khoảng trắng, xuống dòng). */
export function parseEmails(text) {
  return [...new Set(String(text || "").split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

/**
 * POST /api/grammars/:id/share
 * Kiểm tra từng email: đúng định dạng · có tài khoản · không phải chính mình · chưa có lời mời PENDING.
 * Trả về kết quả từng email; email hợp lệ được gửi, email lỗi được báo lại.
 */
export async function share(id, emails) {
  await wait(API_CONFIG.LATENCY);
  const u = me();
  const g = read(K.grammars).find((x) => x.id === id);
  if (!g) throw new ApiError("not-found", "Không tìm thấy ngữ pháp này.");
  if (g.userId !== u.id) throw new ApiError("forbidden", "Bạn chỉ có thể chia sẻ ngữ pháp trong thư viện của mình.");
  const list = [].concat(emails).map((e) => String(e).trim().toLowerCase()).filter(Boolean);
  if (!list.length) throw new ApiError("validation", "Vui lòng nhập ít nhất 1 email người nhận.");
  const shares = read(K.shares);
  const results = [];
  for (const email of [...new Set(list)]) {
    if (!isEmail(email)) { results.push({ email, ok: false, message: "Email không đúng định dạng." }); continue; }
    if (email === u.email.toLowerCase()) { results.push({ email, ok: false, message: "Bạn không thể chia sẻ cho chính mình." }); continue; }
    const r = findUserByEmail(email);
    if (!r) { results.push({ email, ok: false, message: "Người dùng này chưa có tài khoản LingYu Chinese." }); continue; }
    if (shares.some((s) => s.grammarId === id && s.recipientId === r.id && s.status === SHARE_STATUS.PENDING)) {
      results.push({ email, ok: false, message: "Đã gửi lời mời trước đó, đang chờ người nhận phản hồi." }); continue;
    }
    const s = { id: uid("gs"), grammarId: id, grammarTitle: g.title, senderId: u.id, recipientId: r.id, recipientEmail: r.email,
      status: SHARE_STATUS.PENDING, createdAt: now(), acceptedAt: null };
    shares.push(s);
    notify(r.id, { type: "grammar_share", shareId: s.id, grammarId: id, actorName: u.name, title: g.title });
    results.push({ email, ok: true, message: "Đã gửi lời mời." });
  }
  write(K.shares, shares);
  return { results, sent: results.filter((r) => r.ok).length };
}

/** GET /api/grammar-shares/received */
export async function listReceived({ status = SHARE_STATUS.PENDING } = {}) {
  const u = me();
  return read(K.shares).filter((s) => s.recipientId === u.id && (!status || s.status === status))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map(shareView);
}

/** GET /api/grammar-shares/sent (lọc theo 1 ngữ pháp nếu truyền grammarId) */
export async function listSent({ grammarId } = {}) {
  const u = me();
  return read(K.shares).filter((s) => s.senderId === u.id && (!grammarId || s.grammarId === grammarId))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map(shareView);
}

function pendingForMe(shareId) {
  const u = me();
  const shares = read(K.shares);
  const s = shares.find((x) => x.id === shareId && x.recipientId === u.id);
  if (!s) throw new ApiError("not-found", "Lời mời chia sẻ không còn tồn tại.");
  if (s.status !== SHARE_STATUS.PENDING) throw new ApiError("already-responded", `Bạn đã ${s.status === SHARE_STATUS.ACCEPTED ? "chấp nhận" : "từ chối"} lời mời này.`);
  return { u, shares, s };
}

/**
 * POST /api/grammar-shares/:id/accept
 * Tạo BẢN RIÊNG thuộc người nhận (lưu source_grammar_id). Không copy ghi chú cá nhân của người gửi.
 * keepTags: giữ thẻ của người gửi; extraTags: thẻ riêng của người nhận (tạo mới nếu chưa có).
 */
export async function accept(shareId, { keepTags = true, extraTags = [] } = {}) {
  await wait(API_CONFIG.LATENCY);
  const { u, shares, s } = pendingForMe(shareId);
  const src = read(K.grammars).find((x) => x.id === s.grammarId);
  if (!src) throw new ApiError("source-deleted", "Ngữ pháp gốc đã bị người gửi xóa.");
  const allTags = read(K.tags);
  const senderTagNames = keepTags ? src.tagIds.map((id) => allTags.find((t) => t.id === id)?.name).filter(Boolean) : [];
  const t = now();
  const copy = {
    id: uid("g"), userId: u.id, sourceGrammarId: src.id, sourceOwnerName: getUserById(src.userId)?.name || "",
    title: src.title, meaning: src.meaning, structure: src.structure, notes: src.notes,
    examples: src.examples.map((e) => ({ ...e, id: uid("ge") })),
    tagIds: resolveTagIds(u.id, [...senderTagNames, ...extraTags]),
    createdAt: t, updatedAt: t,
  };
  write(K.grammars, [copy, ...read(K.grammars)]);
  Object.assign(s, { status: SHARE_STATUS.ACCEPTED, acceptedAt: t, importedGrammarId: copy.id });
  write(K.shares, shares);
  notify(s.senderId, { type: "grammar_share_accepted", shareId: s.id, grammarId: src.id, actorName: u.name, title: src.title });
  return view(copy, u.id);
}

/** POST /api/grammar-shares/:id/reject — không tạo ngữ pháp cho người nhận. */
export async function reject(shareId) {
  await wait(API_CONFIG.LATENCY);
  const { shares, s } = pendingForMe(shareId);
  Object.assign(s, { status: SHARE_STATUS.REJECTED, respondedAt: now() });
  write(K.shares, shares);
  return shareView(s);
}

/** Thẻ của người gửi trên 1 ngữ pháp được chia sẻ (để màn Accept hiển thị lựa chọn). */
export function sourceTagNames(grammarId) {
  const g = read(K.grammars).find((x) => x.id === grammarId);
  if (!g) return [];
  const tags = read(K.tags);
  return g.tagIds.map((id) => tags.find((t) => t.id === id)?.name).filter(Boolean);
}

/** Nạp ngữ pháp mẫu (chỉ khi user bấm “Dùng dữ liệu mẫu”). */
export async function importSamples(samples) {
  const u = me();
  const existing = new Set(read(K.grammars).filter((g) => g.userId === u.id).map((g) => g.title.toLowerCase()));
  let added = 0;
  for (const sm of samples) {
    if (existing.has(sm.title.toLowerCase())) continue;
    await create(sm);
    added++;
  }
  return { added };
}
