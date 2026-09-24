import * as vocabApi from "../../services/api/vocabApi.js";
import { SAMPLE_VOCABULARY } from "../../services/api/sampleData.js";
import { icon, starIcon, leafDecor } from "../../components/ui/icons.js";
import { esc, debounce, tagHtml, setBusy } from "../../lib/dom.js";
import { toast, confirmDialog, openMenu, openModal } from "../../components/ui/feedback.js";
import { buildPath, navigate } from "../../routes/router.js";
import { flashcard } from "../home/home.js";
import { BRAND } from "../../components/layout/appShell.js";
import * as reviewApi from "../../services/api/reviewApi.js";
import { openShareModal, openAddTagModal, openMoveModal } from "./bulkActions.js";

const PAGE_SIZE = 8;
// Toolbar thao tác hàng loạt: luôn hiển thị đủ, chỉ đổi Disabled ↔ Active theo số từ đã chọn
// (không ẩn/hiện nút → không bị dịch layout khi chọn/bỏ chọn).
const BULK_ACTIONS = [
  { id: "review", label: "Ôn tập", icon: "review", hint: "Chọn ít nhất 1 từ vựng để ôn tập" },
  { id: "tag", label: "Thêm tag", icon: "tag", hint: "Chọn ít nhất 1 từ vựng để thêm tag" },
  { id: "move", label: "Di chuyển", icon: "move", hint: "Chọn ít nhất 1 từ vựng để di chuyển" },
  { id: "share", label: "Chia sẻ", icon: "share", hint: "Chọn ít nhất 1 từ vựng để chia sẻ" },
  { id: "delete", label: "Xóa", icon: "trash", hint: "Chọn ít nhất 1 từ vựng để xóa", danger: true },
];
// Ghi chú dài quá NOTE_PREVIEW ký tự → hiện "…" + nút con mắt để xem đầy đủ.
const NOTE_PREVIEW = 10;
const isLongNote = (note) => Array.from(String(note || "").trim()).length > NOTE_PREVIEW;
const shortNote = (note) => {
  const chars = Array.from(String(note || "").trim());
  return chars.length > NOTE_PREVIEW ? chars.slice(0, NOTE_PREVIEW).join("").trimEnd() + "…" : chars.join("");
};

export async function renderVocabularyList(page, ctx) {
  const state = {
    q: ctx.query.q || "",
    tag: ctx.query.tag || "",
    sort: vocabApi.SORTS.some((s) => s.value === ctx.query.sort) ? ctx.query.sort : "newest",
    page: Number(ctx.query.page) || 1,
  };
  const selected = new Set();
  let lastData = null;
  let reqId = 0;

  page.innerHTML = `
    <section class="vl-head" aria-labelledby="vl-title">
      <div class="vl-head__text">
        <h1 class="page-title" id="vl-title">Danh sách từ vựng</h1>
        <p class="page-sub">Lưu lại những từ vựng để học hiệu quả hơn mỗi ngày.</p>
      </div>
      <div class="vl-head__art" aria-hidden="true">
        ${flashcard("加油", "jiā yóu", "")}
        <div class="note-paper hand">Tích lũy<br/>từng từ nhỏ<br/>Tạo nên hành trình lớn</div>
      </div>
      <a class="btn btn--solid" href="#/vocabulary/new">${icon("plus")}Thêm từ vựng</a>
    </section>
    <section class="page-card vl-body" style="padding:22px" aria-label="Từ vựng">
      <div class="toolbar">
        <div class="input-icon">${icon("search")}
          <label class="sr-only" for="vl-search">Tìm kiếm từ vựng</label>
          <input class="input" id="vl-search" type="search" placeholder="Tìm kiếm từ vựng (Hán tự, pinyin, nghĩa tiếng Việt, tag...)" value="${esc(state.q)}" autocomplete="off" />
        </div>
        <div><label class="sr-only" for="vl-tag">Lọc theo tag</label><select class="select" id="vl-tag"><option value="">Tất cả tag</option></select></div>
        <div><label class="sr-only" for="vl-sort">Sắp xếp</label><select class="select" id="vl-sort">
          ${vocabApi.SORTS.map((s) => `<option value="${s.value}" ${s.value === state.sort ? "selected" : ""}>${s.label}</option>`).join("")}
        </select></div>
      </div>
      <div class="chips-row" id="vl-chips-row" hidden>
        <div class="chips-scroll" id="vl-chips" role="group" aria-label="Lọc nhanh theo tag"></div>
        <button type="button" class="icon-btn" id="chips-next" aria-label="Xem thêm tag">${icon("chevronRight")}</button>
      </div>
      <div id="vl-results" aria-live="polite"></div>
    </section>`;

  const $ = (s) => page.querySelector(s);
  const results = $("#vl-results");
  const search = $("#vl-search");
  const tagSel = $("#vl-tag");
  const sortSel = $("#vl-sort");

  function syncUrl() {
    history.replaceState(null, "", "#" + buildPath("/vocabulary", { q: state.q.trim(), tag: state.tag, sort: state.sort === "newest" ? "" : state.sort, page: state.page }));
  }

  async function load() {
    const id = ++reqId;
    syncUrl();
    if (!lastData) results.innerHTML = skeleton();
    else results.style.opacity = ".6";
    try {
      const data = await vocabApi.list({ ...state, pageSize: PAGE_SIZE });
      if (id !== reqId || !ctx.isCurrent()) return;
      results.style.opacity = "";
      lastData = data;
      state.page = data.page;
      syncUrl();
      renderFilters(data);
      renderResults(data);
    } catch (ex) {
      if (id !== reqId || !ctx.isCurrent()) return;
      results.style.opacity = "";
      results.innerHTML = `<div class="state"><div class="state__icon state__icon--error">${icon("alert")}</div>
        <h3>Không tải được danh sách</h3><p>${esc(ex.message || "Đã có lỗi xảy ra. Vui lòng thử lại.")}</p>
        <div class="state__actions"><button type="button" class="btn btn--solid" id="vl-retry">${icon("refresh")}Thử lại</button></div></div>`;
      $("#vl-retry").addEventListener("click", load);
    }
  }

  function renderFilters(data) {
    const tags = data.tagCounts;
    tagSel.innerHTML = `<option value="">Tất cả tag</option>` + tags.map((t) => `<option value="${esc(t.name)}" ${t.name.toLowerCase() === state.tag.toLowerCase() ? "selected" : ""}>${esc(t.name)} (${t.count})</option>`).join("");
    if (state.tag && !tags.some((t) => t.name.toLowerCase() === state.tag.toLowerCase())) {
      tagSel.insertAdjacentHTML("beforeend", `<option value="${esc(state.tag)}" selected>${esc(state.tag)} (0)</option>`);
    }
    $("#vl-chips-row").hidden = data.totalAll === 0;
    const chips = $("#vl-chips");
    chips.innerHTML = `<button type="button" class="chip ${!state.tag ? "is-selected" : ""}" data-tag="" aria-pressed="${!state.tag}">Tất cả (${data.totalAll})</button>` +
      tags.map((t) => {
        const on = t.name.toLowerCase() === state.tag.toLowerCase();
        return `<button type="button" class="chip ${on ? "is-selected" : ""}" data-tag="${esc(t.name)}" aria-pressed="${on}">${esc(t.name)} (${t.count})</button>`;
      }).join("");
    requestAnimationFrame(() => { $("#chips-next").hidden = chips.scrollWidth <= chips.clientWidth + 4; });
  }

  function renderResults(data) {
    if (data.totalAll === 0) {
      results.innerHTML = `<div class="state">
        <img src="${BRAND.mascot}" alt="" />
        <h3>Chưa có từ vựng nào</h3>
        <p>Thêm từ vựng đầu tiên để bắt đầu xây dựng kho từ của riêng bạn.</p>
        <div class="state__actions">
          <a class="btn btn--solid" href="#/vocabulary/new">${icon("plus")}Thêm từ vựng</a>
          <button type="button" class="btn btn--secondary" id="vl-sample">${icon("database")}Dùng dữ liệu mẫu</button>
        </div></div>`;
      $("#vl-sample").addEventListener("click", async (e) => {
        setBusy(e.currentTarget, true, "Đang thêm...");
        try {
          const r = await vocabApi.importMany(SAMPLE_VOCABULARY);
          toast(`Đã thêm ${r.added} từ vựng mẫu.`, "success");
          lastData = null; load();
        } catch (ex) { setBusy(e.currentTarget, false); toast(ex.message, "error"); }
      });
      return;
    }
    if (data.total === 0) {
      results.innerHTML = `<div class="state">
        <div class="state__icon">${icon("search")}</div>
        <h3>Không tìm thấy từ vựng phù hợp</h3>
        <p>Thử từ khoá khác hoặc bỏ bộ lọc tag${state.q ? ` cho “${esc(state.q)}”` : ""}.</p>
        <div class="state__actions"><button type="button" class="btn btn--secondary" id="vl-clear">${icon("x")}Xóa bộ lọc</button></div></div>`;
      $("#vl-clear").addEventListener("click", () => { state.q = ""; state.tag = ""; state.page = 1; search.value = ""; selected.clear(); load(); });
      return;
    }
    const start = (data.page - 1) * data.pageSize;
    const allOnPage = data.items.length > 0 && data.items.every((v) => selected.has(v.id));
    results.innerHTML = `
      <div class="bulkbar" role="toolbar" aria-label="Thao tác với từ đã chọn">
        <label class="bulkbar__sel"><input type="checkbox" class="checkbox" id="bulk-all" aria-label="Chọn tất cả trên trang" /><span id="sel-count" aria-live="polite"></span></label>
        <button type="button" class="link-btn" id="sel-clear" hidden>Bỏ chọn</button>
        <div class="bulkbar__actions">
          ${BULK_ACTIONS.map((a) => `<button type="button" class="btn btn--sm bulk-btn ${a.danger ? "bulk-btn--danger" : ""}" data-bulk="${a.id}" data-tip="${esc(a.hint)}">${icon(a.icon)}<span>${a.label}</span></button>`).join("")}
        </div>
      </div>
      <div class="table-wrap">
        <table class="vtable">
          <caption class="sr-only">Danh sách từ vựng, trang ${data.page}/${data.pageCount}</caption>
          <thead><tr>
            <th class="c-check"><input type="checkbox" class="checkbox" id="check-all" aria-label="Chọn tất cả trên trang" ${allOnPage ? "checked" : ""} /></th>
            <th class="c-num">#</th><th class="c-img">Hình ảnh</th><th>Từ vựng</th><th>Pinyin</th><th>Nghĩa tiếng Việt</th><th>Ghi chú</th><th>Tag</th><th>Trạng thái</th><th>Thao tác</th>
          </tr></thead>
          <tbody>
            ${data.items.map((v, i) => `
            <tr data-id="${v.id}" class="${selected.has(v.id) ? "is-selected" : ""}">
              <td class="c-check"><input type="checkbox" class="checkbox" data-check="${v.id}" aria-label="Chọn ${esc(v.hanzi)}" ${selected.has(v.id) ? "checked" : ""} /></td>
              <td class="c-num tabnum">${start + i + 1}</td>
              <td class="c-img">${thumb(v)}</td>
              <td class="c-hz"><span class="hanzi">${esc(v.hanzi)}</span></td>
              <td class="pinyin">${esc(v.pinyin)}</td>
              <td class="c-mean">${esc(v.meaningVi)}</td>
              <td class="c-note">${v.note
                ? `<div class="note-cell"><span class="note-cell__text">${esc(shortNote(v.note))}</span>${isLongNote(v.note) ? `<button type="button" class="icon-btn note-cell__eye" data-note="${v.id}" aria-label="Xem đầy đủ ghi chú của ${esc(v.hanzi)}" title="Xem thêm">${icon("eye")}</button>` : ""}</div>`
                : `<span class="field__hint">—</span>`}</td>
              <td class="c-tags"><div>${v.tags.map(tagHtml).join("") || `<span class="field__hint">—</span>`}</div></td>
              <td><span class="status status--${v.status}">${vocabApi.STATUS_LABEL[v.status]}</span></td>
              <td class="c-act">
                <button type="button" class="icon-btn star-btn" data-fav="${v.id}" aria-pressed="${v.isFavorite}" aria-label="${v.isFavorite ? "Bỏ yêu thích" : "Yêu thích"} ${esc(v.hanzi)}">${starIcon(v.isFavorite)}</button>
                <a class="icon-btn" href="#/vocabulary/${v.id}/edit" aria-label="Sửa ${esc(v.hanzi)}">${icon("edit")}</a>
                <button type="button" class="icon-btn" data-more="${v.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Thao tác khác cho ${esc(v.hanzi)}">${icon("more")}</button>
              </td>
            </tr>`).join("")}
          </tbody>
        </table>
      </div>
      <div class="vl-foot">
        <span class="field__hint">${data.total} từ vựng</span>
        ${pager(data)}
      </div>`;
    wireTable(data);
    updateSelUi();
  }

  function thumb(v) {
    if (!v.imageUrl) return `<span class="thumb thumb--empty" aria-hidden="true">${icon("image")}</span>`;
    return `<img class="thumb" src="${esc(v.imageUrl)}" alt="" loading="lazy" data-fallback />`;
  }

  function pager(data) {
    if (data.pageCount <= 1) return "";
    const p = data.page, n = data.pageCount;
    const nums = new Set([1, n, p - 1, p, p + 1]);
    if (p <= 3) [2, 3, 4].forEach((x) => nums.add(x));
    if (p >= n - 2) [n - 3, n - 2, n - 1].forEach((x) => nums.add(x));
    const list = [...nums].filter((x) => x >= 1 && x <= n).sort((a, b) => a - b);
    let out = "", prev = 0;
    for (const x of list) {
      if (x - prev > 1) out += `<span class="pager__gap">…</span>`;
      out += `<button type="button" data-page="${x}" class="${x === p ? "is-current" : ""}" ${x === p ? 'aria-current="page"' : ""} aria-label="Trang ${x}">${x}</button>`;
      prev = x;
    }
    return `<nav class="pager" aria-label="Phân trang">
      <button type="button" class="pager__nav" data-page="${p - 1}" ${p <= 1 ? "disabled" : ""} aria-label="Trang trước">${icon("chevronLeft")}</button>
      ${out}
      <button type="button" class="pager__nav" data-page="${p + 1}" ${p >= n ? "disabled" : ""} aria-label="Trang sau">${icon("chevronRight")}</button>
    </nav>`;
  }

  /** selectedVocabularyIds.length === 0 → các action Disabled; > 0 → Active. */
  function updateSelUi() {
    const c = page.querySelector("#sel-count");
    if (!c) return;
    const n = selected.size;
    c.textContent = n ? `Đã chọn ${n} từ` : "Chưa chọn từ nào";
    page.querySelectorAll("[data-bulk]").forEach((b) => {
      const off = n === 0;
      b.setAttribute("aria-disabled", String(off));
      b.classList.toggle("has-tip", off);
      if (off) b.setAttribute("aria-label", `${b.textContent.trim()} (${b.dataset.tip})`);
      else b.removeAttribute("aria-label");
    });
    page.querySelector("#sel-clear").hidden = !n;
    const onPage = lastData ? lastData.items.filter((v) => selected.has(v.id)).length : 0;
    const total = lastData ? lastData.items.length : 0;
    for (const box of [page.querySelector("#check-all"), page.querySelector("#bulk-all")]) {
      if (!box) continue;
      box.checked = total > 0 && onPage === total;
      box.indeterminate = onPage > 0 && onPage < total;
    }
  }
  function clearSel() {
    selected.clear();
    page.querySelectorAll("[data-check]").forEach((c) => { c.checked = false; c.closest("tr").classList.remove("is-selected"); });
    updateSelUi();
  }

  function wireTable(data) {
    results.querySelectorAll("[data-note]").forEach((b) => b.addEventListener("click", () => {
      const v = data.items.find((x) => x.id === b.dataset.note);
      if (v) showNote(v);
    }));
    results.querySelectorAll("img[data-fallback]").forEach((img) => img.addEventListener("error", () => {
      img.replaceWith(Object.assign(document.createElement("span"), { className: "thumb thumb--empty", innerHTML: icon("image"), title: "Không tải được ảnh" }));
    }));
    results.querySelectorAll("[data-check]").forEach((c) => c.addEventListener("change", () => {
      c.checked ? selected.add(c.dataset.check) : selected.delete(c.dataset.check);
      c.closest("tr").classList.toggle("is-selected", c.checked);
      updateSelUi();
    }));
    const toggleAll = (e) => {
      data.items.forEach((v) => (e.target.checked ? selected.add(v.id) : selected.delete(v.id)));
      results.querySelectorAll("[data-check]").forEach((c) => { c.checked = e.target.checked; c.closest("tr").classList.toggle("is-selected", c.checked); });
      updateSelUi();
    };
    results.querySelector("#check-all").addEventListener("change", toggleAll);
    results.querySelector("#bulk-all").addEventListener("change", toggleAll);
    results.querySelector("#sel-clear")?.addEventListener("click", clearSel);
    results.querySelectorAll("[data-page]").forEach((b) => b.addEventListener("click", () => {
      state.page = Number(b.dataset.page);
      load();
      page.querySelector(".vl-body").scrollIntoView({ behavior: "smooth", block: "start" });
    }));
    results.querySelectorAll("[data-fav]").forEach((b) => b.addEventListener("click", async () => {
      b.disabled = true;
      try {
        const v = await vocabApi.toggleFavorite(b.dataset.fav);
        b.innerHTML = starIcon(v.isFavorite);
        b.setAttribute("aria-pressed", String(v.isFavorite));
        b.setAttribute("aria-label", `${v.isFavorite ? "Bỏ yêu thích" : "Yêu thích"} ${v.hanzi}`);
        const item = data.items.find((x) => x.id === v.id); if (item) item.isFavorite = v.isFavorite;
      } catch (ex) { toast(ex.message, "error"); }
      b.disabled = false;
    }));
    results.querySelectorAll("[data-more]").forEach((b) => b.addEventListener("click", () => {
      const v = data.items.find((x) => x.id === b.dataset.more);
      const next = v.status === vocabApi.STATUS.LEARNED ? vocabApi.STATUS.REVIEW : vocabApi.STATUS.LEARNED;
      openMenu(b, [
        { label: next === "learned" ? "Đánh dấu đã thuộc" : "Đánh dấu cần ôn", icon: next === "learned" ? "checkCircle" : "review", onClick: async () => {
          try { await vocabApi.setStatus(v.id, next); toast(`Đã chuyển “${v.hanzi}” sang ${vocabApi.STATUS_LABEL[next]}.`, "success"); load(); }
          catch (ex) { toast(ex.message, "error"); }
        } },
        { label: "Sửa từ vựng", icon: "edit", onClick: () => navigate(`/vocabulary/${v.id}/edit`) },
        "sep",
        { label: "Xóa từ vựng", icon: "trash", danger: true, onClick: () => doDelete([v.id], `“${v.hanzi}”`) },
      ], { width: 230 });
    }));
    results.querySelectorAll("[data-bulk]").forEach((b) => b.addEventListener("click", () => runBulk(b)));
  }

  async function runBulk(btn) {
    // Disabled: không mở modal, không gọi API.
    if (btn.getAttribute("aria-disabled") === "true" || btn.dataset.busy === "1") return;
    const ids = [...selected];
    const action = btn.dataset.bulk;
    if (action === "delete") return doDelete(ids, `${ids.length} từ đã chọn`);
    if (action === "review") return startReview(ids, btn);
    bulkBusy(btn, true);
    try {
      if (action === "share") {
        const words = await vocabApi.getMany(ids);
        if (!words.length) { toast("Các từ đã chọn không còn tồn tại.", "error"); return; }
        openShareModal(words);
      } else if (action === "tag") {
        await openAddTagModal(ids, () => load());
      } else if (action === "move") {
        await openMoveModal(ids, state.tag, () => load());
      }
    } catch (ex) {
      toast(ex.message || "Không thực hiện được. Vui lòng thử lại.", "error");
    } finally {
      bulkBusy(btn, false);
    }
  }

  async function startReview(ids, btn) {
    if (reviewApi.getActiveSession()) {
      const ok = await confirmDialog({ title: "Bắt đầu bài mới?", message: "Bài ôn tập đang làm dở sẽ bị bỏ để tạo bài mới.", confirmLabel: "Bắt đầu bài mới", iconName: "review" });
      if (!ok) return;
      reviewApi.abandonSession();
    }
    const last = reviewApi.getLastConfig();
    bulkBusy(btn, true);
    try {
      await reviewApi.createSession({ tagIds: [], vocabIds: ids, count: ids.length, mode: last?.mode || "meaning", showImage: last ? last.showImage : true });
      navigate("/review/session");
    } catch (ex) {
      bulkBusy(btn, false);
      toast(ex.message || "Không thể tạo bài ôn tập.", "error");
    }
  }

  /** Trạng thái đang xử lý cho nút toolbar: giữ nguyên chữ/độ rộng, chỉ thêm spinner thay icon. */
  function bulkBusy(btn, busy) {
    btn.dataset.busy = busy ? "1" : "";
    btn.classList.toggle("is-busy", busy);
    if (busy) btn.setAttribute("aria-busy", "true"); else btn.removeAttribute("aria-busy");
  }

  function showNote(v) {
    openModal({
      title: "Ghi chú",
      iconName: "eye",
      wide: true,
      body: `<div class="note-view">
        <div class="note-view__word"><span class="hanzi" lang="zh">${esc(v.hanzi)}</span><span class="pinyin">${esc(v.pinyin)}</span><span>${esc(v.meaningVi)}</span></div>
        <p class="note-view__text">${esc(v.note)}</p></div>`,
      actions: [
        { label: "Sửa ghi chú", variant: "btn--secondary", onClick: ({ close }) => { close(); navigate(`/vocabulary/${v.id}/edit`); } },
        { label: "Đóng", variant: "btn--solid", value: true },
      ],
    });
  }

  async function doDelete(ids, label) {
    const ok = await confirmDialog({ title: "Xóa từ vựng?", message: `Bạn sắp xóa ${esc(label)}. Thao tác này không thể hoàn tác.`, confirmLabel: "Xóa", danger: true });
    if (!ok) return;
    try {
      await vocabApi.remove(ids);
      ids.forEach((id) => selected.delete(id));
      toast(`Đã xóa ${ids.length} từ vựng.`, "success");
      load();
    } catch (ex) {
      toast(ex.message || "Không xóa được. Vui lòng thử lại.", "error");
    }
  }

  const onSearch = debounce(() => { state.q = search.value; state.page = 1; selected.clear(); load(); }, 300);
  search.addEventListener("input", onSearch);
  tagSel.addEventListener("change", () => { state.tag = tagSel.value; state.page = 1; selected.clear(); load(); });
  sortSel.addEventListener("change", () => { state.sort = sortSel.value; state.page = 1; load(); });
  $("#vl-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tag]");
    if (!b) return;
    state.tag = b.dataset.tag; state.page = 1; selected.clear(); load();
  });
  $("#chips-next").addEventListener("click", () => { $("#vl-chips").scrollBy({ left: 260 }); });

  await load();
  return () => onSearch.cancel();
}

function skeleton() {
  const row = `<tr class="skel-row">${[24, 20, 50, 60, 70, 110, 140, 90, 70, 120].map((w) => `<td><span class="skel" style="display:block;height:18px;width:${w}px"></span></td>`).join("")}</tr>`;
  return `<div class="table-wrap" aria-busy="true" aria-label="Đang tải danh sách"><table class="vtable"><tbody>${row.repeat(6)}</tbody></table></div>`;
}
export { leafDecor };
