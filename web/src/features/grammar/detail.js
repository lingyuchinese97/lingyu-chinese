// Chi tiết ngữ pháp: /grammar/:id  (thêm ?share=<id> để người nhận xem preview lời mời)
import * as grammarApi from "../../services/api/grammarApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { breadcrumb } from "../../components/layout/appShell.js";
import { esc, tagHtml } from "../../lib/dom.js";
import { navigate } from "../../routes/router.js";
import {
  formatDateTime, bookmarkIcon, toggleBookmark, confirmDeleteGrammar,
  openShareGrammarModal, openAcceptShareModal, rejectShare, sentListHtml,
} from "./shared.js";

const lines = (text) => String(text || "").split(/\n+/).map((l) => l.replace(/^[\s•\-*]+/, "").trim()).filter(Boolean);

export async function renderGrammarDetail(page, ctx) {
  const id = ctx.params.id;
  page.innerHTML = `${breadcrumb({ backHref: "#/grammar", section: "Ngữ pháp", sectionHref: "#/grammar", current: "Chi tiết" })}
    <div id="gd-root"><div class="page-card" aria-busy="true" style="display:grid;gap:16px">
      <span class="skel" style="height:40px;width:50%"></span><span class="skel" style="height:24px;width:30%"></span><span class="skel" style="height:160px"></span></div></div>`;
  const root = page.querySelector("#gd-root");

  let g, share, sent = [];
  try {
    ({ grammar: g, share } = await grammarApi.get(id, { shareId: ctx.query.share }));
    if (g.isOwner) sent = await grammarApi.listSent({ grammarId: g.id });
  } catch (ex) {
    if (!ctx.isCurrent()) return;
    root.innerHTML = `<div class="page-card"><div class="state"><div class="state__icon state__icon--error">${icon("alert")}</div>
      <h3>${ex.code === "forbidden" ? "Không có quyền xem" : "Không tìm thấy ngữ pháp"}</h3><p>${esc(ex.message)}</p>
      <div class="state__actions"><a class="btn btn--solid" href="#/grammar">Về danh sách ngữ pháp</a></div></div></div>`;
    return;
  }
  if (!ctx.isCurrent()) return;
  page.querySelector("[data-crumb-current]").textContent = g.title;
  document.title = `${g.title} · LingYu Chinese`;
  const preview = !g.isOwner;
  const notes = lines(g.notes);

  root.innerHTML = `
    ${preview ? `<div class="resume gd-invite" role="status">
      <span class="rail-card__icon">${icon("share")}</span>
      <div class="resume__text"><strong>${esc(share.senderName)} đã chia sẻ ngữ pháp này với bạn</strong>Đây là bản xem trước. Chấp nhận để thêm một bản riêng vào thư viện của bạn.</div>
      <button type="button" class="btn btn--sm btn--muted" id="gd-reject">${icon("x")}Từ chối</button>
      <button type="button" class="btn btn--sm btn--solid" id="gd-accept">${icon("check")}Chấp nhận</button>
    </div>` : ""}
    <article class="page-card gd-card" aria-labelledby="gd-title">
      <span class="decor" style="right:-10px;bottom:-14px;width:70px;opacity:.35;transform:rotate(-30deg)">${leafDecor}</span>
      <header class="gd-head">
        <div class="gd-head__text">
          <h1 class="page-title" id="gd-title">${esc(g.title)}</h1>
          <div class="gd-tags">${g.tags.map((t) => tagHtml(t.name)).join("") || '<span class="field__hint">Chưa có thẻ</span>'}</div>
          <p class="field__hint gd-meta">Tạo ${formatDateTime(g.createdAt)} · Cập nhật ${formatDateTime(g.updatedAt)}
            ${g.sourceGrammarId ? ` · Nhận từ ${esc(g.sourceOwnerName || "người khác")}` : ""}${preview ? ` · Người tạo: ${esc(g.ownerName)}` : ""}</p>
        </div>
        ${preview ? "" : `<div class="gd-actions">
          <button type="button" class="btn btn--secondary gbm-btn ${g.isSaved ? "is-saved" : ""}" id="gd-bm" data-label="1" aria-pressed="${g.isSaved}" aria-label="${g.isSaved ? "Bỏ lưu" : "Lưu"} “${esc(g.title)}”">${bookmarkIcon(g.isSaved)}<span>${g.isSaved ? "Đã lưu" : "Lưu"}</span></button>
          <button type="button" class="btn btn--secondary" id="gd-share">${icon("share")}Chia sẻ</button>
          <a class="btn btn--secondary" href="#/grammar/${g.id}/edit">${icon("edit")}Chỉnh sửa</a>
          <button type="button" class="btn btn--secondary gd-del" id="gd-del">${icon("trash")}Xóa</button>
        </div>`}
      </header>

      ${section("Ý nghĩa", "bulb", g.meaning ? `<p class="gd-text">${esc(g.meaning)}</p>` : "")}
      ${section("Cấu trúc", "layers", g.structure ? `<div class="gd-structure" lang="zh">${esc(g.structure)}</div>` : "")}
      ${section(`Ví dụ${g.examples.length ? ` (${g.examples.length})` : ""}`, "doc", g.examples.length ? `<ol class="gd-examples">${g.examples.map((e) => `
          <li><div class="gd-ex__zh hanzi" lang="zh">${esc(e.chinese)}</div>
            ${e.pinyin ? `<div class="gd-ex__py pinyin">${esc(e.pinyin)}</div>` : ""}
            ${e.vietnamese ? `<div class="gd-ex__vi">${esc(e.vietnamese)}</div>` : ""}</li>`).join("")}</ol>` : "")}
      ${section("Lưu ý", "alert", notes.length ? `<ul class="gd-notes">${notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>` : "")}
      ${preview ? "" : section("Ghi chú cá nhân", "lock", g.personalNote ? `<p class="gd-text gd-personal">${esc(g.personalNote)}</p>` : "", "Chỉ mình bạn xem được")}
      ${g.isOwner ? `<section class="gd-sec"><h2 class="gd-sec__title">${icon("share")}Đã chia sẻ với</h2><div id="gd-sent">${sentListHtml(sent)}</div></section>` : ""}
    </article>`;

  function section(titleText, ic, body, hint) {
    return `<section class="gd-sec"><h2 class="gd-sec__title">${icon(ic)}${esc(titleText)}${hint ? `<span class="field__hint">${hint}</span>` : ""}</h2>
      ${body || '<p class="field__hint" style="margin:0">Chưa có nội dung.</p>'}</section>`;
  }

  const $ = (s) => root.querySelector(s);
  if (preview) {
    $("#gd-accept").addEventListener("click", () => openAcceptShareModal(share, { onDone: (copy) => navigate(`/grammar/${copy.id}`) }));
    $("#gd-reject").addEventListener("click", async () => { if (await rejectShare(share)) navigate("/grammar?view=shared"); });
    return;
  }
  $("#gd-bm").addEventListener("click", (e) => toggleBookmark(g, e.currentTarget));
  $("#gd-share").addEventListener("click", () => openShareGrammarModal(g, { onSent: (list) => { $("#gd-sent").innerHTML = sentListHtml(list); } }));
  $("#gd-del").addEventListener("click", async () => { if (await confirmDeleteGrammar(g)) navigate("/grammar"); });
}
