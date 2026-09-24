import { attachPinyinInput } from "../../lib/pinyin.js";
import * as reviewApi from "../../services/api/reviewApi.js";
import * as vocabApi from "../../services/api/vocabApi.js";
import { icon } from "../../components/ui/icons.js";
import { breadcrumb, setSidebarQuote } from "../../components/layout/appShell.js";
import { esc, setBusy } from "../../lib/dom.js";
import { toast, confirmDialog } from "../../components/ui/feedback.js";
import { navigate, setBeforeLeave } from "../../routes/router.js";
import { findMatchingWord } from "./grading.js";

const INSTR = {
  meaning: "Nhập nghĩa tiếng Việt của từ sau:",
  hanzi: "Nhập chữ Hán (tiếng Trung) của từ sau:",
  pinyin: "Nhập pinyin của từ sau:",
};
const PLACEHOLDER = {
  meaning: "Nhập nghĩa tiếng Việt của từ này...",
  hanzi: "Nhập chữ Hán...",
  pinyin: "Nhập pinyin (vd: nǐ hǎo hoặc ni3 hao3)...",
};
const TYPE_LABEL = { meaning: "Nghĩa tiếng Việt", hanzi: "Chữ Hán", pinyin: "Pinyin" };

export async function renderReviewSession(page, ctx) {
  let session = reviewApi.getActiveSession();
  if (!session) {
    const last = reviewApi.getLastResult();
    navigate(last && !ctx.query.new ? "/review/result" : "/review/setup", { replace: true });
    return;
  }
  // Danh sách từ để tra "Bạn đã trả lời" (không bắt buộc).
  let lookup = [];
  vocabApi.pool({}).then((l) => (lookup = l)).catch(() => {});

  const total = session.questions.length;
  let tagLabel = session.config.label || (session.config.tagIds.length ? session.config.tagIds.join(", ") : "Tất cả từ vựng");

  page.innerHTML = `
    ${breadcrumb({ backHref: "#/review/setup", section: "Ôn tập", sectionHref: "#/review/setup", current: "Làm bài ôn tập" })}
    <div class="with-rail">
      <section class="page-card qs-card" aria-labelledby="qs-title">
        <div class="qs-top">
          <div><h1 id="qs-title">Ôn tập từ vựng</h1><p class="page-sub" id="qs-instr"></p></div>
          <div class="qs-progress">
            <div class="qs-count" id="qs-count"></div>
            <div class="progress" role="progressbar" aria-label="Tiến độ bài ôn tập" aria-valuemin="0" aria-valuemax="${total}" id="qs-bar"><div class="progress__fill"></div></div>
          </div>
        </div>
        <div id="qs-body"></div>
        <div id="qs-actions"></div>
      </section>
      <aside class="rail" aria-label="Thông tin bài ôn tập">
        <div class="rail-card">
          <div class="rail-card__head"><span class="rail-card__icon">${icon("chart")}</span>Tiến độ</div>
          <div class="rail-card__body rail-progress" id="rail-progress"></div>
        </div>
        <div class="rail-card">
          <div class="rail-card__head"><span class="rail-card__icon">${icon("doc")}</span>Chế độ ôn tập</div>
          <div class="rail-card__body">
            <dl class="kv">
              <dt>Nguồn từ vựng</dt><dd>${esc(tagLabel)}</dd>
              <dt>Số lượng từ</dt><dd>${total} từ</dd>
              <dt>Hình thức</dt><dd>${esc(reviewApi.MODE_LABEL[session.config.mode])}</dd>
              <dt>Hiển thị hình ảnh</dt><dd>${session.config.showImage ? "Có" : "Không"}</dd>
            </dl>
            <div class="tip" id="rail-tip" style="margin-top:18px"><span class="tip__icon">${icon("bulb")}</span><div><strong>Mẹo nhỏ:</strong><span id="tip-text"></span></div></div>
            <button type="button" class="btn btn--sm btn--secondary btn--block" id="quit" style="margin-top:18px">${icon("x")}Kết thúc bài</button>
          </div>
        </div>
      </aside>
    </div>`;

  const $ = (s) => page.querySelector(s);
  const body = $("#qs-body"), actions = $("#qs-actions");

  const answered = () => session.questions.filter((q) => q.isCorrect !== null).length;
  const furthest = () => { const i = session.questions.findIndex((q) => q.isCorrect === null); return i < 0 ? total - 1 : i; };

  function renderProgress() {
    const idx = session.currentIndex;
    const done = answered();
    $("#qs-count").innerHTML = `<strong>Câu ${idx + 1}</strong> / ${total}`;
    const pct = Math.max(4, Math.round(((idx + 1) / total) * 100));
    $("#qs-bar").setAttribute("aria-valuenow", String(idx + 1));
    $("#qs-bar .progress__fill").style.width = pct + "%";
    $("#rail-progress").innerHTML = `
      <div class="rail-progress__count"><strong>Câu ${idx + 1}</strong> / ${total}</div>
      <div class="progress"><div class="progress__fill" style="width:${pct}%"></div></div>
      <div class="rail-progress__score"><span class="ok">${icon("check").replace("<svg", '<svg style="width:16px;height:16px;vertical-align:-3px"')} Đúng <b>${session.correctCount}</b></span><span class="no">${icon("x").replace("<svg", '<svg style="width:16px;height:16px;vertical-align:-3px"')} Sai <b>${session.wrongCount}</b></span><span>Đã làm <b>${done}</b>/${total}</span></div>`;
  }

  function promptHtml(q) {
    const w = q.word;
    const showImg = session.config.showImage && w.imageUrl;
    const img = showImg ? `<img class="q-img" src="${esc(w.imageUrl)}" alt="Hình minh họa" data-fallback />` : "";
    let main;
    if (q.promptType === "meaning") main = `<div class="q-big hanzi" lang="zh">${esc(w.hanzi)}</div><div class="q-py pinyin">${esc(w.pinyin)}</div>`;
    else if (q.promptType === "hanzi") main = `<div class="q-vi">${esc(w.meaningVi)}</div><div class="q-sub pinyin">${esc(w.pinyin)}</div>`;
    else main = `<div class="q-big hanzi" lang="zh">${esc(w.hanzi)}</div><div class="q-sub">${esc(w.meaningVi)}</div>`;
    const typeBadge = session.config.mode === "mixed" ? `<span class="q-type">${icon("shuffle").replace("<svg", '<svg style="width:14px;height:14px"')}${TYPE_LABEL[q.promptType]}</span>` : "";
    return `<div class="q-prompt ${showImg ? "" : "q-prompt--compact"}">${typeBadge}${img}${main}</div>`;
  }

  function wordCard(w, label, mine = false) {
    const img = session.config.showImage && w.imageUrl ? `<img src="${esc(w.imageUrl)}" alt="" data-fallback />` : "";
    return `<div class="ans ${mine ? "ans--mine" : ""}"><span class="ans__label">${label}</span>${img}
      <div class="hanzi" lang="zh">${esc(w.hanzi)}</div><div class="pinyin">${esc(w.pinyin)}</div><div class="ans__vi">${esc(w.meaningVi)}</div></div>`;
  }

  function feedbackHtml(q) {
    const w = q.word;
    const note = w.note ? `<div class="note-box"><span class="tip__icon">${icon("bulb")}</span><div><strong>Ghi chú</strong><p><span class="hanzi" lang="zh">${esc(w.hanzi)}</span> (${esc(w.pinyin)}) ${esc(w.note.replace(new RegExp("^" + w.hanzi.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*(\\([^)]*\\))?\\s*"), ""))}</p></div></div>` : "";
    if (q.isCorrect) {
      return `<div class="fb fb--right" role="status">
        <div class="fb__head"><span class="fb__badge">${icon("check")}</span><div><div class="fb__title">Chính xác!</div><div class="fb__sub">Bạn đã trả lời đúng: “${esc(q.userAnswer)}”.</div></div></div>
        <div class="ans-grid">${wordCard(w, "Đáp án đúng")}</div>${note}</div>`;
    }
    const match = findMatchingWord(q.promptType, lookup, q.userAnswer, w.id);
    const mine = match ? wordCard(match, "Bạn đã trả lời", true)
      : `<div class="ans ans--mine"><span class="ans__label">Bạn đã trả lời</span><div class="ans__raw ${q.userAnswer ? "" : "empty"}" ${q.promptType === "hanzi" ? 'lang="zh" style="font-family:var(--font-cn)"' : ""}>${q.userAnswer ? esc(q.userAnswer) : "(bỏ trống)"}</div></div>`;
    return `<div class="fb fb--wrong" role="status">
      <div class="fb__head"><span class="fb__badge">${icon("x")}</span><div><div class="fb__title">Chưa đúng!</div><div class="fb__sub">Hãy xem lại đáp án bên dưới nhé.</div></div></div>
      <div class="ans-grid">${wordCard(w, "Đáp án đúng")}${mine}</div>${note}</div>`;
  }

  function render(focus = true) {
    const idx = session.currentIndex;
    const q = session.questions[idx];
    const checked = q.isCorrect !== null;
    $("#qs-instr").textContent = INSTR[q.promptType];
    $("[data-crumb-current]").textContent = checked ? (q.isCorrect ? "Đáp án đúng" : "Đáp án sai") : "Làm bài ôn tập";
    setSidebarQuote(checked && !q.isCorrect ? "Sai một chút<br/>cũng là tiến bộ!" : "Cố gắng mỗi ngày<br/>Tiếng Trung sẽ gần hơn!");
    $("#rail-tip").hidden = checked;
    $("#tip-text").textContent = q.promptType === "pinyin" ? " Gõ số 1–4 sau chữ để thêm dấu, ví dụ ni3hao3 → nǐhǎo (viết liền hoặc cách đều được)." :
      q.promptType === "hanzi" ? " Bật bộ gõ tiếng Trung (Pinyin IME) để nhập chữ Hán nhanh hơn." : " Hãy nhớ nghĩa của từ và cách dùng trong ngữ cảnh nhé!";
    renderProgress();

    const isLast = idx === total - 1;
    const nextLabel = isLast ? "Xem kết quả" : "Câu tiếp";
    if (!checked) {
      body.innerHTML = `${promptHtml(q)}
        <form id="ans-form" novalidate style="margin-top:22px">
          <label class="sr-only" for="answer">${PLACEHOLDER[q.promptType]}</label>
          <input class="input q-input ${q.promptType === "hanzi" ? "hanzi-input" : ""}" id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${PLACEHOLDER[q.promptType]}" ${q.promptType === "hanzi" ? 'lang="zh"' : ""} />
        </form>`;
      actions.innerHTML = `<div class="q-actions">
        <button type="button" class="btn btn--muted" id="prev" ${idx === 0 ? "disabled" : ""}>${icon("arrowLeft")}Câu trước</button>
        <button type="submit" form="ans-form" class="btn btn--solid q-check" id="check" disabled>Kiểm tra đáp án</button>
        <button type="button" class="btn btn--muted" id="next" disabled aria-disabled="true" title="Hãy kiểm tra đáp án trước">${nextLabel}${icon("arrowRight")}</button>
      </div><p class="q-hint" style="margin-top:12px">Nhấn Enter để kiểm tra đáp án</p>`;
      const input = $("#answer"), check = $("#check");
      if (q.promptType === "pinyin") attachPinyinInput(input);
      input.addEventListener("input", () => { check.disabled = !input.value.trim(); });
      $("#ans-form").addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!input.value.trim() || check.dataset.busy === "1") return;
        input.readOnly = true;
        setBusy(check, true, "Đang kiểm tra...");
        try {
          session = await reviewApi.checkAnswer(session, idx, input.value);
          render();
        } catch (ex) {
          input.readOnly = false;
          setBusy(check, false);
          toast(ex.message || "Không kiểm tra được đáp án. Vui lòng thử lại.", "error");
        }
      });
      if (focus) input.focus();
    } else {
      body.innerHTML = feedbackHtml(q);
      actions.innerHTML = `<div class="q-actions q-actions--2">
        <button type="button" class="btn btn--secondary" id="prev" ${idx === 0 ? "disabled" : ""}>${icon("arrowLeft")}Câu trước</button>
        <button type="button" class="btn btn--solid" id="next">${nextLabel}${icon("arrowRight")}</button>
      </div>`;
      if (focus) $("#next").focus();
    }
    body.querySelectorAll("img[data-fallback]").forEach((img) => img.addEventListener("error", () => img.remove()));
    $("#prev").addEventListener("click", () => go(idx - 1));
    $("#next").addEventListener("click", () => {
      if (session.questions[idx].isCorrect === null) return;
      if (isLast) finish(); else go(idx + 1);
    });
  }

  function go(i) {
    if (i < 0 || i > furthest()) return;
    session.currentIndex = i;
    reviewApi.saveProgress(session);
    render();
    if (window.innerWidth < 1024) page.scrollIntoView({ block: "start" });
  }

  let finishing = false;
  async function finish() {
    if (finishing) return;
    const unanswered = session.questions.findIndex((q) => q.isCorrect === null);
    if (unanswered >= 0) { go(unanswered); return; }
    finishing = true;
    const btn = $("#next");
    setBusy(btn, true, "Đang tổng kết...");
    try {
      await reviewApi.completeSession(session);
      navigate("/review/result");
    } catch (ex) {
      finishing = false;
      setBusy(btn, false);
      toast(ex.message || "Không lưu được kết quả. Vui lòng thử lại.", "error");
    }
  }

  // Enter khi đã có feedback → sang câu tiếp.
  const onKey = (e) => {
    if (e.key !== "Enter" || e.target.closest("form, textarea, .modal-overlay")) return;
    const q = session.questions[session.currentIndex];
    if (q.isCorrect !== null && document.activeElement?.id !== "prev") { e.preventDefault(); $("#next")?.click(); }
  };
  document.addEventListener("keydown", onKey);

  $("#quit").addEventListener("click", async () => {
    const ok = await confirmDialog({ title: "Kết thúc bài ôn tập?", message: `Bạn đã làm ${answered()}/${total} câu. Nếu kết thúc bây giờ, tiến độ bài này sẽ không được lưu.`, confirmLabel: "Kết thúc", danger: true, iconName: "alert" });
    if (!ok) return;
    reviewApi.abandonSession();
    toast("Đã kết thúc bài ôn tập.", "info");
    navigate("/review/setup");
  });

  // Rời trang khi đang làm dở: hỏi xác nhận (tiến độ vẫn được lưu để làm tiếp).
  setBeforeLeave(async (to) => {
    if (!reviewApi.getActiveSession() || to === "/review/result" || to === "/review/session") return true;
    if (to === "/review/setup") return true;
    return confirmDialog({ title: "Tạm dừng bài ôn tập?", message: "Tiến độ đã được lưu. Bạn có thể làm tiếp bất cứ lúc nào từ mục Ôn tập.", confirmLabel: "Rời trang", cancelLabel: "Làm tiếp", iconName: "review" });
  });

  session.currentIndex = Math.min(session.currentIndex, furthest());
  render(true);
  return () => document.removeEventListener("keydown", onKey);
}
