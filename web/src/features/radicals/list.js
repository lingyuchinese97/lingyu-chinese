// Trang Bộ thủ: 214 bộ thủ Khang Hy · tìm kiếm · lọc theo số nét · Đã thuộc / Chưa thuộc.
import * as radicalApi from "../../services/api/radicalApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { esc, debounce } from "../../lib/dom.js";
import { toast } from "../../components/ui/feedback.js";
import { buildPath } from "../../routes/router.js";

export function renderRadicalList(page, ctx) {
  const state = {
    q: ctx.query.q || "",
    strokes: Number(ctx.query.strokes) || 0,
    known: ["known", "unknown"].includes(ctx.query.known) ? ctx.query.known : "",
  };

  page.innerHTML = `
    <section class="vl-head" aria-labelledby="rl-title">
      <div class="vl-head__text">
        <h1 class="page-title" id="rl-title">Bộ thủ<span class="leaf" aria-hidden="true">${leafDecor}</span></h1>
        <p class="page-sub">214 bộ thủ Khang Hy — nắm bộ thủ để đoán nghĩa và nhớ mặt chữ Hán nhanh hơn.</p>
      </div>
      <div class="rl-progress" id="rl-progress" aria-live="polite"></div>
    </section>
    <section class="page-card vl-body" style="padding:22px" aria-label="Danh sách bộ thủ">
      <div class="toolbar rl-toolbar">
        <div class="input-icon">${icon("search")}
          <label class="sr-only" for="rl-search">Tìm bộ thủ</label>
          <input class="input" id="rl-search" type="search" placeholder="Tìm theo tên (Thủy), nghĩa (nước), pinyin, số thứ tự hoặc gõ 1 chữ Hán (河)..." value="${esc(state.q)}" autocomplete="off" />
        </div>
        <div><label class="sr-only" for="rl-known">Trạng thái</label><select class="select" id="rl-known">
          <option value="">Tất cả bộ thủ</option>
          <option value="known" ${state.known === "known" ? "selected" : ""}>Đã thuộc</option>
          <option value="unknown" ${state.known === "unknown" ? "selected" : ""}>Chưa thuộc</option>
        </select></div>
      </div>
      <div class="gl-tags">
        <span class="gl-tags__label">Số nét</span>
        <div class="chips-scroll" id="rl-strokes" role="group" aria-label="Lọc theo số nét"></div>
      </div>
      <div id="rl-results" aria-live="polite"></div>
    </section>`;

  const $ = (s) => page.querySelector(s);
  const results = $("#rl-results");

  function syncUrl() {
    history.replaceState(null, "", "#" + buildPath("/radicals", { q: state.q, strokes: state.strokes || "", known: state.known }));
  }

  function render() {
    syncUrl();
    const data = radicalApi.list(state);
    $("#rl-progress").innerHTML = `<div class="rl-progress__num"><strong>${data.knownCount}</strong>/214</div><div class="rl-progress__label">bộ đã thuộc</div>
      <div class="rl-progress__bar" role="progressbar" aria-valuemin="0" aria-valuemax="214" aria-valuenow="${data.knownCount}" aria-label="Tiến độ học bộ thủ"><span style="width:${(data.knownCount / 214) * 100}%"></span></div>`;
    $("#rl-strokes").innerHTML = `<button type="button" class="chip ${!state.strokes ? "is-selected" : ""}" data-strokes="0" aria-pressed="${!state.strokes}">Tất cả</button>` +
      radicalApi.STROKE_GROUPS.map((n) => `<button type="button" class="chip ${n === state.strokes ? "is-selected" : ""}" data-strokes="${n}" aria-pressed="${n === state.strokes}">${n} nét</button>`).join("");

    if (!data.items.length) {
      results.innerHTML = `<div class="state"><div class="state__icon">${icon("search")}</div><h3>Không tìm thấy bộ thủ phù hợp</h3>
        <p>Thử tên Hán Việt (vd: Thủy), nghĩa (vd: nước) hoặc gõ một chữ Hán để xem bộ của chữ đó.</p>
        <div class="state__actions"><button type="button" class="btn btn--secondary" id="rl-clear">${icon("x")}Xóa bộ lọc</button></div></div>`;
      $("#rl-clear").addEventListener("click", () => { state.q = ""; state.strokes = 0; state.known = ""; $("#rl-search").value = ""; $("#rl-known").value = ""; render(); });
      return;
    }
    const han = state.q.trim().length === 1 && /\p{Script=Han}/u.test(state.q.trim()) ? state.q.trim() : "";
    results.innerHTML = `${han && data.items.length === 1 ? `<p class="rl-found">Chữ <span class="hanzi" lang="zh">${esc(han)}</span> thuộc bộ:</p>` : `<p class="field__hint gl-total">${data.total} bộ thủ</p>`}
      <ul class="rl-grid">${data.items.map(card).join("")}</ul>`;
    results.querySelectorAll("[data-known]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      const num = Number(b.dataset.known);
      const on = b.getAttribute("aria-pressed") !== "true";
      radicalApi.setKnown(num, on);
      toast(on ? "Đã đánh dấu thuộc bộ này." : "Đã bỏ đánh dấu.", "success");
      render();
    }));
  }

  function card(r) {
    const vs = r.variants.length ? `<span class="rcard__variants" lang="zh">${r.variants.map(esc).join(" ")}</span>` : "";
    return `<li class="rcard ${r.known ? "is-known" : ""}">
      <a class="rcard__link" href="#/radicals/${r.num}" aria-label="Bộ ${esc(r.name)} (${esc(r.meaning)}), số ${r.num}">
        <span class="rcard__num">${r.num}</span>
        <span class="rcard__char hanzi" lang="zh">${esc(r.char)}</span>${vs}
        <span class="rcard__name">${esc(r.name)}</span>
        <span class="rcard__meaning">${esc(r.meaning)}</span>
        <span class="rcard__meta"><span class="pinyin">${esc(r.pinyin)}</span> · ${r.strokes} nét</span>
      </a>
      <button type="button" class="icon-btn rcard__known" data-known="${r.num}" aria-pressed="${r.known}" aria-label="${r.known ? "Bỏ đánh dấu đã thuộc" : "Đánh dấu đã thuộc"} bộ ${esc(r.name)}" title="${r.known ? "Đã thuộc" : "Đánh dấu đã thuộc"}">${icon(r.known ? "checkCircle" : "check")}</button>
    </li>`;
  }

  const onSearch = debounce(() => { state.q = $("#rl-search").value.trim(); render(); }, 250);
  $("#rl-search").addEventListener("input", onSearch);
  $("#rl-known").addEventListener("change", (e) => { state.known = e.target.value; render(); });
  $("#rl-strokes").addEventListener("click", (e) => {
    const b = e.target.closest("[data-strokes]");
    if (!b) return;
    state.strokes = Number(b.dataset.strokes); render();
  });
  render();
  return () => onSearch.cancel();
}

