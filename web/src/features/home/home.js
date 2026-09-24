import * as vocabApi from "../../services/api/vocabApi.js";
import * as reviewApi from "../../services/api/reviewApi.js";
import { getCurrentUser } from "../../services/api/authApi.js";
import { BRAND } from "../../components/layout/appShell.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { esc, setBusy, firstName } from "../../lib/dom.js";
import { toast } from "../../components/ui/feedback.js";
import { navigate } from "../../routes/router.js";

export const flashcard = (hz, py, vi) => `
  <div class="flash" aria-hidden="true">
    <div class="flash__card"></div><div class="flash__card"></div>
    <div class="flash__card flash__card--main"><div class="flash__hz">${esc(hz)}</div><div class="flash__py">${esc(py)}</div>${vi ? `<div class="flash__vi">${esc(vi)}</div>` : ""}</div>
  </div>`;

const sparkle = (style) => `<svg class="sparkle" style="${style}" viewBox="0 0 24 24"><path d="M12 2c.6 4.6 2.4 6.9 7 7.6-4.6.7-6.4 3-7 7.6-.6-4.6-2.4-6.9-7-7.6 4.6-.7 6.4-3 7-7.6Z" fill="currentColor"/></svg>`;

export async function renderHome(page, ctx) {
  const user = getCurrentUser();
  page.innerHTML = `
    <section class="home-hero" aria-labelledby="hero-title">
      <div class="home-hero__hills" aria-hidden="true"><svg viewBox="0 0 1200 90" preserveAspectRatio="none"><path d="M0 60C160 20 300 70 460 44S760 10 920 40 1120 70 1200 50V90H0Z" fill="#CFE6FB" opacity=".7"/><path d="M0 80C200 60 380 88 600 72S980 56 1200 76V90H0Z" fill="#E4F2FF"/></svg></div>
      <span class="decor" style="right:40%;top:14px;width:64px;opacity:.6;transform:rotate(20deg)">${leafDecor}</span>
      <span class="decor" style="right:3%;top:22px;width:70px;opacity:.6;transform:rotate(-40deg)">${leafDecor}</span>
      <div class="home-hero__text">
        <p class="home-hero__hello">Hello,</p>
        <h1 class="home-hero__title" id="hero-title">Chào mừng trở lại,<br/><em>${esc(firstName(user?.name) || "bạn")}!</em></h1>
        <p class="home-hero__slogan"><span class="lf">${leafDecor}</span>${BRAND.slogan}</p>
        <p class="home-hero__quote hand">“Mỗi từ vựng hôm nay<br/>là một bước gần hơn đến ước mơ của bạn!”</p>
      </div>
      <div class="home-hero__art" aria-hidden="true"><img src="${BRAND.mascot}" alt="" /></div>
    </section>
    <div class="home-grid" id="home-cards">
      ${skeletonCard()}${skeletonCard()}
    </div>`;

  let stats;
  try {
    stats = await vocabApi.stats();
  } catch (ex) {
    if (!ctx.isCurrent()) return;
    page.querySelector("#home-cards").innerHTML = `
      <div class="fcard" style="grid-column:1/-1"><div class="state">
        <div class="state__icon state__icon--error">${icon("alert")}</div>
        <h3>Không tải được dữ liệu</h3><p>${esc(ex.message || "Đã có lỗi xảy ra.")}</p>
        <div class="state__actions"><button class="btn btn--solid" id="retry">${icon("refresh")}Thử lại</button></div>
      </div></div>`;
    page.querySelector("#retry").addEventListener("click", () => renderHome(page, ctx));
    return;
  }
  if (!ctx.isCurrent()) return;

  const latest = stats.latest;
  const counts = reviewApi.COUNTS;
  const avail = stats.total;
  const last = reviewApi.getLastConfig();
  let def = counts.includes(last?.count) && last.count <= avail ? last.count : counts.filter((c) => c <= avail).includes(10) ? 10 : (counts.filter((c) => c <= avail).pop() || 0);
  const options = counts.map((c) => `<option value="${c}" ${c > avail ? "disabled" : ""} ${c === def ? "selected" : ""}>${c} từ${c > avail ? " (chưa đủ từ)" : ""}</option>`);
  if (avail > 0 && avail < 50 && !counts.includes(avail)) {
    options.push(`<option value="${avail}" ${def === 0 ? "selected" : ""}>Tất cả (${avail} từ)</option>`);
    if (def === 0) def = avail;
  }

  page.querySelector("#home-cards").innerHTML = `
    <article class="fcard" aria-labelledby="c1-title">
      <div class="fcard__head">
        <span class="fcard__icon">${icon("book")}</span>
        <div><h2 class="fcard__title" id="c1-title">Từ vựng của tôi</h2><p class="fcard__desc">Lưu lại những từ vựng mới để học hiệu quả hơn mỗi ngày.</p></div>
        <a class="fcard__go" href="#/vocabulary" aria-label="Mở danh sách từ vựng">${icon("arrowRight")}</a>
      </div>
      <div class="fcard__art">
        ${sparkle("left:22%;top:18%")}${sparkle("right:24%;top:30%;width:14px")}
        ${latest ? flashcard(latest.hanzi, latest.pinyin, latest.meaningVi) : flashcard("你好", "nǐ hǎo", "xin chào")}
      </div>
      <div class="stat-row">
        <div class="stat"><span class="stat__icon stat__icon--violet">${icon("doc")}</span><div><div class="stat__num tabnum">${stats.total}</div><div class="stat__label">Tổng số từ đã thêm</div></div></div>
        <div class="stat"><span class="stat__icon stat__icon--blue">${icon("review")}</span><div><div class="stat__num tabnum">${stats.needReview}</div><div class="stat__label">Từ cần ôn tập</div></div></div>
      </div>
      ${stats.total
        ? `<a class="btn btn--primary btn--lg btn--block" href="#/vocabulary">${icon("book")}<span>Xem từ vựng</span>${icon("arrowRight", "end")}</a>`
        : `<a class="btn btn--primary btn--lg btn--block" href="#/vocabulary/new">${icon("plus")}<span>Thêm từ vựng đầu tiên</span>${icon("arrowRight", "end")}</a>`}
    </article>
    <article class="fcard" aria-labelledby="c2-title">
      <div class="fcard__head">
        <span class="fcard__icon">${icon("review")}</span>
        <div><h2 class="fcard__title" id="c2-title">Ôn tập từ vựng</h2><p class="fcard__desc">Luyện lại những từ đã học để ghi nhớ lâu hơn.</p></div>
        <a class="fcard__go" href="#/review/setup" aria-label="Thiết lập bài ôn tập">${icon("arrowRight")}</a>
      </div>
      <div class="fcard__art">
        ${flashcard("学习", "xué xí", "học tập")}
        <p class="fcard__art-note hand" aria-hidden="true">Ôn tập<br/>mỗi ngày<br/>tiến bộ hơn!</p>
      </div>
      <div class="count-pick">
        <label for="home-count">Chọn số từ để ôn tập</label>
        <select class="select" id="home-count" ${avail ? "" : "disabled"}>${avail ? options.join("") : `<option>Chưa có từ vựng</option>`}</select>
      </div>
      <button type="button" class="btn btn--primary btn--lg btn--block" id="start-review" ${avail ? "" : "disabled"}>${icon("play")}<span>Bắt đầu ôn tập</span>${icon("arrowRight", "end")}</button>
      ${avail ? "" : `<p class="field__hint" style="text-align:center;margin-top:-8px">Thêm ít nhất 1 từ vựng để bắt đầu ôn tập.</p>`}
    </article>`;

  const startBtn = page.querySelector("#start-review");
  startBtn.addEventListener("click", async () => {
    if (startBtn.dataset.busy === "1") return;
    const active = reviewApi.getActiveSession();
    if (active) { navigate("/review/setup"); toast("Bạn còn một bài ôn tập chưa hoàn thành.", "info"); return; }
    setBusy(startBtn, true, "Đang chuẩn bị...");
    try {
      await reviewApi.createSession({
        tagIds: [], count: Number(page.querySelector("#home-count").value),
        mode: last?.mode || "meaning", showImage: last ? last.showImage : true,
      });
      navigate("/review/session");
    } catch (ex) {
      setBusy(startBtn, false);
      toast(ex.message || "Không thể tạo bài ôn tập.", "error");
    }
  });
}

function skeletonCard() {
  return `<div class="fcard" aria-busy="true" aria-label="Đang tải">
    <div class="fcard__head"><span class="skel" style="width:80px;height:80px;border-radius:50%"></span><div style="flex:1;display:grid;gap:10px"><span class="skel" style="height:26px;width:60%"></span><span class="skel" style="height:16px;width:90%"></span></div></div>
    <span class="skel" style="height:170px"></span><span class="skel" style="height:96px;border-radius:18px"></span><span class="skel" style="height:64px;border-radius:14px"></span>
  </div>`;
}
