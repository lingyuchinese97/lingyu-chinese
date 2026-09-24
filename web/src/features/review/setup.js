import * as vocabApi from "../../services/api/vocabApi.js";
import * as reviewApi from "../../services/api/reviewApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { breadcrumb } from "../../components/layout/appShell.js";
import { esc, setBusy, tagHtml } from "../../lib/dom.js";
import { toast, confirmDialog } from "../../components/ui/feedback.js";
import { navigate } from "../../routes/router.js";
import { flashcard } from "../home/home.js";

const MODE_ICON = {
  meaning: `${icon("doc")}`,
  hanzi: `<span style="font-family:var(--font-cn)">中</span>A`,
  pinyin: `<span style="font-weight:700">pīn</span>`,
  mixed: `${icon("shuffle")}`,
};
const MODE_SUB = { meaning: '<span class="hz">A中</span>', hanzi: "", pinyin: '<span class="hz">拼音</span>', mixed: "" };

export async function renderReviewSetup(page, ctx) {
  page.innerHTML = `${breadcrumb({ backHref: "#/home", section: "Ôn tập", sectionHref: "#/review/setup", current: "Thiết lập bài ôn tập" })}
    <div id="rs-root"><div class="with-rail"><div class="page-card" aria-busy="true" style="display:grid;gap:16px">
      <span class="skel" style="height:44px;width:50%"></span>${'<span class="skel" style="height:120px"></span>'.repeat(3)}</div>
      <div class="rail-card"><div class="rail-card__body" style="display:grid;gap:14px"><span class="skel" style="height:200px"></span></div></div></div></div>`;
  const root = page.querySelector("#rs-root");

  let tags, total;
  try {
    const [t, s] = await Promise.all([vocabApi.listTags(), vocabApi.stats()]);
    tags = t.filter((x) => x.count > 0); total = s.total;
  } catch (ex) {
    if (!ctx.isCurrent()) return;
    root.innerHTML = `<div class="page-card"><div class="state"><div class="state__icon state__icon--error">${icon("alert")}</div>
      <h3>Không tải được dữ liệu</h3><p>${esc(ex.message)}</p><div class="state__actions"><button type="button" class="btn btn--solid" id="retry">${icon("refresh")}Thử lại</button></div></div></div>`;
    root.querySelector("#retry").addEventListener("click", () => renderReviewSetup(page, ctx));
    return;
  }
  if (!ctx.isCurrent()) return;

  if (total === 0) {
    root.innerHTML = `<div class="page-card"><div class="state">
      <div class="state__icon">${icon("book")}</div><h3>Chưa có từ vựng để ôn tập</h3>
      <p>Hãy thêm vài từ vựng trước, sau đó quay lại đây để luyện tập nhé.</p>
      <div class="state__actions"><a class="btn btn--solid" href="#/vocabulary/new">${icon("plus")}Thêm từ vựng</a></div></div></div>`;
    return;
  }

  const last = reviewApi.getLastConfig();
  const cfg = {
    tagIds: (last?.tagIds || []).filter((t) => tags.some((x) => x.name === t)),
    count: last?.count || 10,
    mode: last?.mode || "meaning",
    showImage: last ? last.showImage : true,
  };
  const active = reviewApi.getActiveSession();

  root.innerHTML = `
    ${active ? `<div class="resume" role="status" style="margin-bottom:20px">
      <span class="rail-card__icon">${icon("review")}</span>
      <div class="resume__text"><strong>Bạn còn một bài ôn tập chưa hoàn thành</strong>Đã làm ${active.questions.filter((q) => q.isCorrect !== null).length}/${active.questions.length} câu — tiếp tục hoặc bỏ bài để tạo bài mới.</div>
      <button type="button" class="btn btn--sm btn--secondary" id="abandon">Bỏ bài</button>
      <a class="btn btn--sm btn--solid" href="#/review/session">Tiếp tục làm bài</a>
    </div>` : ""}
    <div class="with-rail">
      <section class="page-card rs-card" aria-labelledby="rs-title">
        <div class="rs-head">
          <span class="rs-head__icon">${icon("pin")}</span>
          <div><h1 class="page-title" id="rs-title">Thiết lập bài ôn tập<span class="leaf" aria-hidden="true">${leafDecor}</span></h1>
          <p class="page-sub">Chọn nội dung và hình thức ôn tập phù hợp với mục tiêu của bạn.</p></div>
        </div>
        <fieldset class="step" style="margin:0"><span class="step__num" aria-hidden="true">1</span><div>
          <legend class="step__title">Chọn nguồn từ vựng</legend><p class="step__desc">Chọn các tag hoặc nhóm từ vựng để ôn tập.</p>
          <div class="step__content chip-grid" id="src-chips"></div></div></fieldset>
        <fieldset class="step" style="margin:0"><span class="step__num" aria-hidden="true">2</span><div>
          <legend class="step__title">Số lượng từ cần ôn tập</legend><p class="step__desc" id="count-desc"></p>
          <div class="step__content chip-grid chip-grid--counts" id="count-chips" role="radiogroup" aria-label="Số lượng từ"></div></div></fieldset>
        <fieldset class="step" style="margin:0"><span class="step__num" aria-hidden="true">3</span><div>
          <legend class="step__title">Hình thức ôn tập</legend><p class="step__desc">Chọn dạng câu hỏi bạn muốn luyện tập.</p>
          <div class="step__content mode-grid" id="mode-grid">
            ${reviewApi.MODES.map((m) => `<label class="mode" data-mode="${m.value}">
              <input type="radio" name="mode" value="${m.value}" />
              <span class="mode__icon" aria-hidden="true">${MODE_ICON[m.value]}</span>
              ${MODE_SUB[m.value] ? `<span class="mode__icon" aria-hidden="true">${MODE_SUB[m.value]}</span>` : ""}
              <span class="mode__label">${m.label}</span><span class="mode__radio" aria-hidden="true"></span></label>`).join("")}
          </div></div></fieldset>
        <div class="step step--inline"><span class="step__num" aria-hidden="true">4</span>
          <div class="step__row"><div><label class="step__title" for="show-img" style="display:block">Hiển thị hình ảnh</label><p class="step__desc">Bật/tắt hình ảnh minh họa (nếu có).</p></div>
          <span class="toggle"><input type="checkbox" id="show-img" role="switch" /><span class="toggle__track"></span></span></div>
        </div>
      </section>
      <aside class="rail" aria-label="Tóm tắt thiết lập">
        <div class="rail-card">
          <div class="rail-card__head"><span class="rail-card__icon">${icon("doc")}</span>Tóm tắt thiết lập</div>
          <div class="rail-card__body summary" id="summary" aria-live="polite"></div>
        </div>
        <div aria-hidden="true" style="padding:10px 0 4px">${flashcard("学习", "xué xí", "học tập")}</div>
        <button type="button" class="btn btn--solid btn--lg btn--block" id="start">${icon("play")}<span>Bắt đầu ôn tập</span>${icon("arrowRight")}</button>
        <p class="field__hint" id="start-hint" style="text-align:center;margin-top:-8px" hidden></p>
      </aside>
    </div>`;

  const $ = (s) => root.querySelector(s);
  // Số từ khả dụng theo tag đã chọn (một từ nhiều tag chỉ tính 1 lần) — lấy từ service.
  let availCount = total;

  async function refreshAvailable() {
    availCount = cfg.tagIds.length ? (await vocabApi.pool({ tags: cfg.tagIds })).length : total;
    if (!ctx.isCurrent()) return;
    renderCounts();
    renderSummary();
  }

  function renderSources() {
    const all = !cfg.tagIds.length;
    $("#src-chips").innerHTML = `<button type="button" class="chip chip--check ${all ? "is-selected" : ""}" data-src="" aria-pressed="${all}">Tất cả từ vựng</button>` +
      tags.map((t) => {
        const on = cfg.tagIds.includes(t.name);
        return `<button type="button" class="chip chip--check ${on ? "is-selected" : ""}" data-src="${esc(t.name)}" aria-pressed="${on}" title="${t.count} từ">${esc(t.name)}</button>`;
      }).join("");
  }
  function countOptions() {
    const opts = reviewApi.COUNTS.map((c) => ({ value: c, label: `${c} từ`, disabled: c > availCount }));
    if (availCount > 0 && availCount < 50 && !reviewApi.COUNTS.includes(availCount)) opts.push({ value: availCount, label: `Tất cả (${availCount})`, disabled: false });
    return opts;
  }
  function renderCounts() {
    const opts = countOptions();
    if (!opts.some((o) => o.value === cfg.count && !o.disabled)) {
      const ok = opts.filter((o) => !o.disabled);
      cfg.count = (ok.find((o) => o.value === 10) || ok[ok.length - 1] || { value: 0 }).value;
    }
    $("#count-desc").textContent = `Chọn số lượng từ vựng cho mỗi lần ôn tập (hiện có ${availCount} từ phù hợp).`;
    $("#count-chips").innerHTML = opts.map((o) => `<button type="button" role="radio" class="chip chip--check ${o.value === cfg.count ? "is-selected" : ""}" data-count="${o.value}" aria-checked="${o.value === cfg.count}" ${o.disabled ? `disabled title="Chỉ có ${availCount} từ phù hợp"` : ""}>${o.label}</button>`).join("");
  }
  function renderModes() {
    root.querySelectorAll(".mode").forEach((el) => {
      const on = el.dataset.mode === cfg.mode;
      el.classList.toggle("is-selected", on);
      el.querySelector("input").checked = on;
    });
  }
  function renderSummary() {
    $("#summary").innerHTML = `
      <div class="sum-row">${icon("tag")}<div><div class="sum-row__label">Tag từ vựng</div><div class="sum-row__value">${cfg.tagIds.length ? cfg.tagIds.map(tagHtml).join("") : "Tất cả từ vựng"}</div></div></div>
      <div class="sum-row">${icon("docSearch")}<div><div class="sum-row__label">Số lượng từ</div><div class="sum-row__value">${cfg.count ? `${cfg.count} từ` : "—"}</div></div></div>
      <div class="sum-row">${icon("book")}<div><div class="sum-row__label">Hình thức ôn tập</div><div class="sum-row__value">${reviewApi.MODE_LABEL[cfg.mode]}</div></div></div>
      <div class="sum-row">${icon("image")}<div><div class="sum-row__label">Hiển thị hình ảnh</div><div class="sum-row__value">${cfg.showImage ? "Có" : "Không"}</div></div></div>
      <p class="sum-quote hand">“Ôn tập hôm nay<br/>là tiến bộ lớn của ngày mai.”</p>`;
    const valid = availCount > 0 && cfg.count > 0;
    $("#start").disabled = !valid;
    const hint = $("#start-hint");
    hint.hidden = valid;
    hint.textContent = valid ? "" : "Không có từ vựng nào trong các tag đã chọn.";
  }

  $("#src-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-src]");
    if (!b) return;
    const t = b.dataset.src;
    if (!t) cfg.tagIds = [];
    else cfg.tagIds = cfg.tagIds.includes(t) ? cfg.tagIds.filter((x) => x !== t) : [...cfg.tagIds, t];
    renderSources();
    refreshAvailable();
  });
  $("#count-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-count]");
    if (!b || b.disabled) return;
    cfg.count = Number(b.dataset.count);
    renderCounts(); renderSummary();
  });
  $("#mode-grid").addEventListener("change", (e) => { cfg.mode = e.target.value; renderModes(); renderSummary(); });
  const showImg = $("#show-img");
  showImg.checked = cfg.showImage;
  showImg.addEventListener("change", () => { cfg.showImage = showImg.checked; renderSummary(); });

  $("#abandon")?.addEventListener("click", async () => {
    const ok = await confirmDialog({ title: "Bỏ bài ôn tập đang làm?", message: "Tiến độ của bài đang làm sẽ không được lưu.", confirmLabel: "Bỏ bài", danger: true, iconName: "alert" });
    if (!ok) return;
    reviewApi.abandonSession();
    toast("Đã bỏ bài ôn tập cũ.", "info");
    renderReviewSetup(page, ctx);
  });

  const startBtn = $("#start");
  startBtn.addEventListener("click", async () => {
    if (startBtn.dataset.busy === "1" || startBtn.disabled) return;
    if (reviewApi.getActiveSession()) {
      const ok = await confirmDialog({ title: "Bắt đầu bài mới?", message: "Bài ôn tập đang làm dở sẽ bị bỏ để tạo bài mới.", confirmLabel: "Bắt đầu bài mới", iconName: "review" });
      if (!ok) return;
      reviewApi.abandonSession();
    }
    setBusy(startBtn, true, "Đang chuẩn bị...");
    try {
      await reviewApi.createSession({ ...cfg });
      navigate("/review/session");
    } catch (ex) {
      setBusy(startBtn, false);
      toast(ex.message || "Không thể tạo bài ôn tập.", "error");
    }
  });

  renderSources(); renderModes();
  await refreshAvailable();
}
