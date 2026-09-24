import * as reviewApi from "../../services/api/reviewApi.js";
import { icon } from "../../components/ui/icons.js";
import { breadcrumb, BRAND } from "../../components/layout/appShell.js";
import { esc, setBusy } from "../../lib/dom.js";
import { toast } from "../../components/ui/feedback.js";
import { navigate } from "../../routes/router.js";

const CONFETTI = [
  [8, 20, "#F6C343", 20], [18, 60, "#58D39B", -30], [86, 16, "#F6C343", 40], [80, 52, "#FF7A6B", 15],
  [30, 6, "#58D39B", 60], [70, 4, "#6AB8FF", -20], [92, 78, "#A6E3FF", 30], [4, 76, "#A6E3FF", -40],
];

function message(acc) {
  if (acc >= 80) return ["Làm tốt lắm!", "Bạn đã nắm khá vững các từ vựng này. Hãy ôn tập thêm để ngày càng tiến bộ hơn nhé!"];
  if (acc >= 50) return ["Khá lắm!", "Bạn đã nhớ được hơn một nửa. Ôn lại các từ sai để ghi nhớ chắc hơn nhé!"];
  return ["Đừng nản lòng!", "Mỗi lần sai là một lần nhớ lâu hơn. Hãy ôn lại các từ chưa đúng ngay nhé!"];
}

export function renderReviewResult(page) {
  const s = reviewApi.getLastResult();
  if (!s) { navigate("/review/setup", { replace: true }); return; }
  const total = s.questions.length;
  const ok = s.questions.filter((q) => q.isCorrect).length;
  const wrong = total - ok;
  const acc = total ? Math.round((ok / total) * 100) : 0;
  const [mTitle, mText] = message(acc);
  const wrongIds = s.questions.filter((q) => !q.isCorrect).map((q) => q.vocabularyId);

  page.innerHTML = `
    ${breadcrumb({ backHref: "#/review/setup", section: "Ôn tập", sectionHref: "#/review/setup", current: "Hoàn thành ôn tập" })}
    <div class="with-rail">
      <section class="page-card rr-card" aria-labelledby="rr-title">
        <div class="celebrate" aria-hidden="true">
          ${CONFETTI.map(([x, y, c, r]) => `<span class="confetti" style="left:${x}%;top:${y}%;background:${c};transform:rotate(${r}deg)"></span>`).join("")}
          <img src="${BRAND.mascot}" alt="" />
          <span class="welldone">Well Done!</span>
        </div>
        <h1 class="rr-title" id="rr-title">Hoàn thành bài ôn tập!</h1>
        <p class="rr-sub">Bạn đã hoàn thành ${total} câu. Cùng xem kết quả nhé!</p>
        <div class="rr-stats">
          <div class="rr-stat rr-stat--total"><div class="rr-stat__num tabnum">${total}</div><div class="rr-stat__label">Tổng số câu</div></div>
          <div class="rr-stat rr-stat--ok"><div class="rr-stat__num tabnum">${ok}</div><div class="rr-stat__label">Câu đúng</div></div>
          <div class="rr-stat rr-stat--no"><div class="rr-stat__num tabnum">${wrong}</div><div class="rr-stat__label">Câu sai</div></div>
          <div class="rr-stat rr-stat--acc"><div class="rr-stat__num tabnum">${acc}%</div><div class="rr-stat__label">Độ chính xác</div></div>
        </div>
        <div class="rr-msg">
          <span class="rr-msg__icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8-4.3-4.1 5.9-.8Z" fill="#F7B500"/></svg></span>
          <div><strong>${mTitle}</strong><p>${mText}</p></div>
        </div>
        <div class="rr-cta">
          <a class="btn btn--secondary" href="#/home">${icon("home")}Về trang chủ</a>
          <button type="button" class="btn btn--solid" id="again">${icon("refresh")}Ôn tập lại</button>
        </div>
      </section>
      <aside class="rail" aria-label="Gợi ý tiếp theo">
        <div class="rail-card">
          <div class="rail-card__head"><span class="rail-card__icon">${icon("bulb")}</span>Gợi ý tiếp theo</div>
          <div class="suggest">
            <button type="button" class="suggest__item" id="redo-wrong" ${wrong ? "" : "disabled"}>${icon("book")}
              <div><strong>Ôn lại các từ đã sai</strong><span>${wrong ? `Xem lại ${wrong} từ bạn trả lời sai` : "Bạn không sai từ nào — tuyệt vời!"}</span></div>${icon("chevronRight")}</button>
            <a class="suggest__item" href="#/review/setup">${icon("review")}
              <div><strong>Luyện tập tiếp</strong><span>Chọn chủ đề khác để ôn tập</span></div>${icon("chevronRight")}</a>
          </div>
        </div>
        <div class="sticky-note hand" aria-hidden="true">“Mỗi nỗ lực nhỏ<br/>đều tạo nên<br/>sự tiến bộ lớn!”${icon("heart")}</div>
      </aside>
    </div>`;

  async function start(btn, config) {
    if (btn.dataset.busy === "1") return;
    setBusy(btn, true, "Đang chuẩn bị...");
    try {
      await reviewApi.createSession(config);
      navigate("/review/session");
    } catch (ex) {
      setBusy(btn, false);
      toast(ex.message || "Không thể tạo bài ôn tập.", "error");
    }
  }
  const again = page.querySelector("#again");
  again.addEventListener("click", () => {
    const c = s.config;
    start(again, c.vocabIds ? { ...c, count: c.vocabIds.length } : { tagIds: c.tagIds, count: c.count, mode: c.mode, showImage: c.showImage });
  });
  const redo = page.querySelector("#redo-wrong");
  redo.addEventListener("click", () => {
    if (!wrong) return;
    start(redo, { vocabIds: wrongIds, count: wrongIds.length, mode: s.config.mode, showImage: s.config.showImage, tagIds: [], label: "Các từ đã sai" });
  });
  page.querySelector("#rr-title").focus?.();
  void esc;
}
