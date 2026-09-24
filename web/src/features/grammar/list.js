// Trang Ngữ pháp: danh sách · tìm kiếm · lọc thẻ · sắp xếp · Đã lưu · Được chia sẻ · Quản lý thẻ.
import * as grammarApi from "../../services/api/grammarApi.js";
import { SAMPLE_GRAMMAR } from "../../services/api/grammarSamples.js";
import { onNotificationsChange } from "../../services/api/notificationApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { esc, debounce, tagHtml, setBusy } from "../../lib/dom.js";
import { toast, openMenu, openModal, confirmDialog } from "../../components/ui/feedback.js";
import { buildPath, navigate } from "../../routes/router.js";
import {
  formatDate, bookmarkIcon, toggleBookmark, confirmDeleteGrammar,
  openShareGrammarModal, openAcceptShareModal, rejectShare,
} from "./shared.js";

const VIEWS = { all: "all", saved: "saved", shared: "shared" };

export async function renderGrammarList(page, ctx) {
  const state = {
    q: ctx.query.q || "",
    tag: ctx.query.tag || "",
    sort: grammarApi.SORTS.some((s) => s.value === ctx.query.sort) ? ctx.query.sort : "updated",
    view: Object.values(VIEWS).includes(ctx.query.view) ? ctx.query.view : VIEWS.all,
  };
  let reqId = 0;

  page.innerHTML = `
    <section class="vl-head" aria-labelledby="gl-title">
      <div class="vl-head__text">
        <h1 class="page-title" id="gl-title">Ngữ pháp<span class="leaf" aria-hidden="true">${leafDecor}</span></h1>
        <p class="page-sub">Tự tạo, lưu và chia sẻ các điểm ngữ pháp tiếng Trung của bạn.</p>
      </div>
      <a class="btn btn--solid" href="#/grammar/new">${icon("plus")}Thêm ngữ pháp mới</a>
    </section>
    <section class="page-card vl-body" style="padding:22px" aria-label="Danh sách ngữ pháp">
      <div class="gl-views" role="tablist" aria-label="Chế độ xem">
        <button type="button" role="tab" class="gl-view" data-view="all">${icon("grammar")}Tất cả <span class="gl-count" id="c-all"></span></button>
        <button type="button" role="tab" class="gl-view" data-view="saved">${icon("bookmark")}Đã lưu <span class="gl-count" id="c-saved"></span></button>
        <button type="button" role="tab" class="gl-view" data-view="shared">${icon("share")}Được chia sẻ <span class="gl-count gl-count--alert" id="c-shared"></span></button>
      </div>
      <div class="toolbar" id="gl-toolbar">
        <div class="input-icon">${icon("search")}
          <label class="sr-only" for="gl-search">Tìm kiếm ngữ pháp</label>
          <input class="input" id="gl-search" type="search" placeholder="Tìm kiếm ngữ pháp..." value="${esc(state.q)}" autocomplete="off" />
        </div>
        <div><label class="sr-only" for="gl-sort">Sắp xếp</label><select class="select" id="gl-sort">
          ${grammarApi.SORTS.map((s) => `<option value="${s.value}" ${s.value === state.sort ? "selected" : ""}>${s.label}</option>`).join("")}
        </select></div>
        <button type="button" class="btn btn--secondary" id="gl-tags-btn">${icon("tag")}Quản lý thẻ</button>
      </div>
      <div class="gl-tags" id="gl-tags-row">
        <span class="gl-tags__label">Thẻ (Tags)</span>
        <div class="chips-scroll" id="gl-chips" role="group" aria-label="Lọc theo thẻ"></div>
      </div>
      <div id="gl-results" aria-live="polite"></div>
    </section>`;

  const $ = (s) => page.querySelector(s);
  const results = $("#gl-results");
  const search = $("#gl-search");

  function syncUrl() {
    history.replaceState(null, "", "#" + buildPath("/grammar", { q: state.q, tag: state.tag, sort: state.sort === "updated" ? "" : state.sort, view: state.view === "all" ? "" : state.view }));
  }

  function renderViews(data, pending) {
    page.querySelectorAll("[data-view]").forEach((b) => {
      const on = b.dataset.view === state.view;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
    });
    $("#c-all").textContent = data ? data.totalAll : "";
    $("#c-saved").textContent = data ? data.savedCount : "";
    $("#c-shared").textContent = pending ? pending : "";
    $("#c-shared").hidden = !pending;
    const listMode = state.view !== VIEWS.shared;
    $("#gl-toolbar").hidden = !listMode;
    $("#gl-tags-row").hidden = !listMode;
  }

  async function renderChips(total) {
    const tags = await grammarApi.listTags();
    $("#gl-chips").innerHTML = `<button type="button" class="chip ${!state.tag ? "is-selected" : ""}" data-tag="" aria-pressed="${!state.tag}">Tất cả <span class="chip__n">${total}</span></button>` +
      tags.map((t) => `<button type="button" class="chip ${t.id === state.tag ? "is-selected" : ""}" data-tag="${t.id}" aria-pressed="${t.id === state.tag}">${esc(t.name)} <span class="chip__n">${t.count}</span></button>`).join("");
  }

  async function load() {
    const my = ++reqId;
    if (state.tag && !(await grammarApi.listTags()).some((t) => t.id === state.tag)) state.tag = "";
    syncUrl();
    results.setAttribute("aria-busy", "true");
    if (!results.innerHTML) results.innerHTML = `<div class="gl-grid">${'<div class="gcard"><span class="skel" style="height:22px;width:60%"></span><span class="skel" style="height:40px"></span><span class="skel" style="height:18px;width:40%"></span></div>'.repeat(4)}</div>`;
    try {
      const [data, pending] = await Promise.all([
        grammarApi.list({ q: state.q, tagId: state.tag, sort: state.sort, saved: state.view === VIEWS.saved }),
        grammarApi.listReceived(),
      ]);
      if (my !== reqId || !ctx.isCurrent()) return;
      renderViews(data, pending.length);
      if (state.view === VIEWS.shared) return renderShared(pending);
      await renderChips(data.totalAll);
      if (my !== reqId) return;
      renderItems(data);
    } catch (ex) {
      if (my !== reqId) return;
      results.innerHTML = `<div class="state"><div class="state__icon state__icon--error">${icon("alert")}</div><h3>Không tải được dữ liệu</h3><p>${esc(ex.message)}</p>
        <div class="state__actions"><button type="button" class="btn btn--solid" id="gl-retry">${icon("refresh")}Thử lại</button></div></div>`;
      $("#gl-retry").addEventListener("click", load);
    } finally {
      results.removeAttribute("aria-busy");
    }
  }

  function renderItems(data) {
    if (data.totalAll === 0) {
      results.innerHTML = `<div class="state">
        <div class="state__icon">${icon("grammar")}</div><h3>Chưa có ngữ pháp nào</h3>
        <p>Tạo điểm ngữ pháp đầu tiên của bạn, hoặc dùng dữ liệu mẫu để xem thử.</p>
        <div class="state__actions"><a class="btn btn--solid" href="#/grammar/new">${icon("plus")}Thêm ngữ pháp mới</a>
        <button type="button" class="btn btn--secondary" id="gl-sample">${icon("database")}Dùng dữ liệu mẫu</button></div></div>`;
      $("#gl-sample").addEventListener("click", async (e) => {
        setBusy(e.currentTarget, true, "Đang thêm...");
        try { const r = await grammarApi.importSamples(SAMPLE_GRAMMAR); toast(`Đã thêm ${r.added} ngữ pháp mẫu.`, "success"); load(); }
        catch (ex) { toast(ex.message, "error"); setBusy(e.currentTarget, false); }
      });
      return;
    }
    if (data.total === 0) {
      const why = state.view === VIEWS.saved && !state.q && !state.tag ? "Bạn chưa lưu ngữ pháp nào. Bấm biểu tượng dấu trang để lưu." : `Thử từ khoá khác hoặc bỏ bộ lọc${state.q ? ` cho “${esc(state.q)}”` : ""}.`;
      results.innerHTML = `<div class="state"><div class="state__icon">${icon(state.view === VIEWS.saved ? "bookmark" : "search")}</div>
        <h3>Không có ngữ pháp phù hợp</h3><p>${why}</p>
        ${state.q || state.tag ? `<div class="state__actions"><button type="button" class="btn btn--secondary" id="gl-clear">${icon("x")}Xóa bộ lọc</button></div>` : ""}</div>`;
      $("#gl-clear")?.addEventListener("click", () => { state.q = ""; state.tag = ""; search.value = ""; load(); });
      return;
    }
    results.innerHTML = `<p class="field__hint gl-total">${data.total} ngữ pháp</p><div class="gl-grid">${data.items.map(card).join("")}</div>`;
    wireCards(data.items);
  }

  function card(g) {
    const desc = g.meaning || g.structure || (g.examples[0]?.chinese ?? "");
    return `<article class="gcard" data-id="${g.id}">
      <div class="gcard__head">
        <h2 class="gcard__title"><a href="#/grammar/${g.id}">${esc(g.title)}</a></h2>
        <button type="button" class="icon-btn gbm ${g.isSaved ? "is-saved" : ""}" data-bm="${g.id}" aria-pressed="${g.isSaved}" aria-label="${g.isSaved ? "Bỏ lưu" : "Lưu"} “${esc(g.title)}”">${bookmarkIcon(g.isSaved)}</button>
        <button type="button" class="icon-btn" data-more="${g.id}" aria-haspopup="menu" aria-expanded="false" aria-label="Thao tác cho “${esc(g.title)}”">${icon("more")}</button>
      </div>
      ${g.structure ? `<div class="gcard__structure" lang="zh">${esc(g.structure)}</div>` : ""}
      <p class="gcard__desc">${esc(desc) || '<span class="field__hint">Chưa có mô tả.</span>'}</p>
      <div class="gcard__tags">${g.tags.map((t) => tagHtml(t.name)).join("")}</div>
      <div class="gcard__meta">
        <span>Tạo: ${formatDate(g.createdAt)}</span><span>Cập nhật: ${formatDate(g.updatedAt)}</span>
        ${g.examples.length ? `<span>${g.examples.length} ví dụ</span>` : ""}
        ${g.sourceGrammarId ? `<span class="gcard__from">${icon("share")}Từ ${esc(g.sourceOwnerName || "người khác")}</span>` : ""}
      </div>
    </article>`;
  }

  function wireCards(items) {
    const byId = new Map(items.map((g) => [g.id, g]));
    results.querySelectorAll(".gcard").forEach((el) => el.addEventListener("click", (e) => {
      // Dùng composedPath (cố định lúc bắt đầu sự kiện): nút bookmark có thể đã thay icon trước khi sự kiện nổi lên tới thẻ.
      if (e.composedPath().some((n) => n instanceof Element && n.matches("button, a"))) return;
      navigate(`/grammar/${el.dataset.id}`);
    }));
    results.querySelectorAll("[data-bm]").forEach((b) => b.addEventListener("click", async () => {
      const g = byId.get(b.dataset.bm);
      await toggleBookmark(g, b);
      load(); // cập nhật số "Đã lưu" (và bỏ khỏi danh sách nếu đang ở mục Đã lưu)
    }));
    results.querySelectorAll("[data-more]").forEach((b) => b.addEventListener("click", () => {
      const g = byId.get(b.dataset.more);
      openMenu(b, [
        { label: "Xem", icon: "eye", onClick: () => navigate(`/grammar/${g.id}`) },
        ...(g.isOwner ? [{ label: "Chỉnh sửa", icon: "edit", onClick: () => navigate(`/grammar/${g.id}/edit`) }] : []),
        { label: "Chia sẻ", icon: "share", onClick: () => openShareGrammarModal(g) },
        { label: g.isSaved ? "Bỏ lưu" : "Lưu", icon: "bookmark", onClick: async () => { await toggleBookmark(g); load(); } },
        ...(g.isOwner ? ["sep", { label: "Xóa", icon: "trash", danger: true, onClick: async () => { if (await confirmDeleteGrammar(g)) load(); } }] : []),
      ], { width: 210 });
    }));
  }

  function renderShared(pending) {
    if (!pending.length) {
      results.innerHTML = `<div class="state"><div class="state__icon">${icon("share")}</div><h3>Không có lời mời nào</h3>
        <p>Khi ai đó chia sẻ ngữ pháp với bạn, lời mời sẽ xuất hiện ở đây và trong chuông thông báo.</p></div>`;
      return;
    }
    results.innerHTML = `<ul class="ginvites">${pending.map((s) => `
      <li class="ginvite" data-share="${s.id}">
        <span class="ginvite__icon">${icon("share")}</span>
        <div class="ginvite__text"><strong>${esc(s.senderName)}</strong> đã chia sẻ một ngữ pháp với bạn.
          <div class="ginvite__title">${esc(s.grammarTitle)}</div>
          <span class="field__hint">${formatDate(s.createdAt)} · ${esc(s.senderEmail)}</span></div>
        <div class="ginvite__actions">
          ${s.grammarExists ? `<a class="btn btn--sm btn--secondary" href="#/grammar/${s.grammarId}?share=${s.id}">${icon("eye")}Xem</a>
          <button type="button" class="btn btn--sm btn--solid" data-accept="${s.id}">${icon("check")}Chấp nhận</button>` : `<span class="field__hint">Ngữ pháp gốc đã bị xóa</span>`}
          <button type="button" class="btn btn--sm btn--muted" data-reject="${s.id}">${icon("x")}Từ chối</button>
        </div>
      </li>`).join("")}</ul>`;
    const byId = new Map(pending.map((s) => [s.id, s]));
    results.querySelectorAll("[data-accept]").forEach((b) => b.addEventListener("click", () =>
      openAcceptShareModal(byId.get(b.dataset.accept), { onDone: (g) => navigate(`/grammar/${g.id}`) })));
    results.querySelectorAll("[data-reject]").forEach((b) => b.addEventListener("click", async () => {
      if (await rejectShare(byId.get(b.dataset.reject))) load();
    }));
  }

  // ----- Quản lý thẻ -----
  async function openTagManager() {
    const { el } = openModal({
      title: "Quản lý thẻ",
      iconName: "tag",
      wide: true,
      body: `<form class="tagmgr__new" id="tm-new" novalidate>
          <label class="sr-only" for="tm-name">Tên thẻ mới</label>
          <input class="input" id="tm-name" maxlength="${grammarApi.LIMITS.tag}" placeholder="Tên thẻ mới (vd: HSK1)" autocomplete="off" />
          <button type="submit" class="btn btn--solid">${icon("plus")}Tạo thẻ</button>
        </form>
        <p class="field__error" id="tm-err" role="alert" hidden></p>
        <ul class="tagmgr" id="tm-list"></ul>
        <p class="field__hint" style="margin:10px 0 0">Xóa thẻ chỉ bỏ thẻ khỏi các ngữ pháp, không xóa ngữ pháp.</p>`,
      actions: [{ label: "Xong", variant: "btn--solid", value: true }],
      onClose: () => load(),
    });
    const err = el.querySelector("#tm-err");
    const showErr = (m) => { err.textContent = m || ""; err.hidden = !m; };
    async function draw() {
      const tags = await grammarApi.listTags();
      el.querySelector("#tm-list").innerHTML = tags.length ? tags.map((t) => `
        <li data-id="${t.id}">
          <span class="tagmgr__name">${tagHtml(t.name)}<span class="field__hint">${t.count} ngữ pháp</span></span>
          <button type="button" class="icon-btn" data-rename="${t.id}" aria-label="Đổi tên thẻ ${esc(t.name)}">${icon("edit")}</button>
          <button type="button" class="icon-btn icon-btn--danger" data-del="${t.id}" aria-label="Xóa thẻ ${esc(t.name)}">${icon("trash")}</button>
        </li>`).join("") : `<li class="field__hint">Chưa có thẻ nào.</li>`;
      const byId = new Map(tags.map((t) => [t.id, t]));
      el.querySelectorAll("[data-rename]").forEach((b) => b.addEventListener("click", () => startRename(b.closest("li"), byId.get(b.dataset.rename))));
      el.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", async () => {
        const t = byId.get(b.dataset.del);
        const ok = await confirmDialog({ title: "Xóa thẻ?", message: `Thẻ <strong>${esc(t.name)}</strong> sẽ bị bỏ khỏi ${t.count} ngữ pháp. Các ngữ pháp vẫn được giữ nguyên.`, confirmLabel: "Xóa thẻ", danger: true });
        if (!ok) return;
        try { await grammarApi.deleteTag(t.id); if (state.tag === t.id) state.tag = ""; toast(`Đã xóa thẻ “${t.name}”.`, "success"); draw(); }
        catch (ex) { showErr(ex.message); }
      }));
    }
    function startRename(li, t) {
      li.innerHTML = `<form class="tagmgr__edit" novalidate>
        <label class="sr-only" for="tm-rn">Tên mới cho thẻ ${esc(t.name)}</label>
        <input class="input" id="tm-rn" value="${esc(t.name)}" maxlength="${grammarApi.LIMITS.tag}" autocomplete="off" />
        <button type="submit" class="btn btn--sm btn--solid">Lưu</button><button type="button" class="btn btn--sm btn--secondary" data-cancel>Hủy</button></form>`;
      const input = li.querySelector("input");
      input.focus(); input.select();
      li.querySelector("[data-cancel]").addEventListener("click", draw);
      input.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); draw(); } });
      li.querySelector("form").addEventListener("submit", async (e) => {
        e.preventDefault();
        try { await grammarApi.renameTag(t.id, input.value); showErr(""); toast("Đã đổi tên thẻ.", "success"); draw(); }
        catch (ex) { showErr(ex.message); input.focus(); }
      });
    }
    el.querySelector("#tm-name").addEventListener("input", () => showErr(""));
    el.querySelector("#tm-new").addEventListener("submit", async (e) => {
      e.preventDefault();
      const input = el.querySelector("#tm-name");
      try { const t = await grammarApi.createTag(input.value); input.value = ""; showErr(""); toast(`Đã tạo thẻ “${t.name}”.`, "success"); draw(); }
      catch (ex) { showErr(ex.message); input.focus(); }
    });
    draw();
  }

  // ----- Events -----
  const onSearch = debounce(() => { state.q = search.value.trim(); load(); }, 350);
  search.addEventListener("input", onSearch);
  $("#gl-sort").addEventListener("change", (e) => { state.sort = e.target.value; load(); });
  $("#gl-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tag]");
    if (!b) return;
    state.tag = b.dataset.tag; load();
  });
  page.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => { state.view = b.dataset.view; load(); }));
  $("#gl-tags-btn").addEventListener("click", openTagManager);
  const off = onNotificationsChange(() => { if (ctx.isCurrent()) load(); });

  await load();
  return () => { onSearch.cancel(); off(); };
}
