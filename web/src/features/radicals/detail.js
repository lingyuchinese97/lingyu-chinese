// Chi tiết bộ thủ: /radicals/:num — thông tin, chữ ví dụ, từ vựng của bạn có bộ này.
import * as radicalApi from "../../services/api/radicalApi.js";
import * as vocabApi from "../../services/api/vocabApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { breadcrumb } from "../../components/layout/appShell.js";
import { esc } from "../../lib/dom.js";
import { toast } from "../../components/ui/feedback.js";

export async function renderRadicalDetail(page, ctx) {
  let r;
  try { r = radicalApi.get(ctx.params.num); }
  catch (ex) {
    page.innerHTML = `${breadcrumb({ backHref: "#/radicals", section: "Bộ thủ", sectionHref: "#/radicals", current: "Không tìm thấy" })}
      <div class="page-card"><div class="state"><div class="state__icon state__icon--error">${icon("alert")}</div><h3>Không tìm thấy bộ thủ</h3>
      <p>${esc(ex.message)}</p><div class="state__actions"><a class="btn btn--solid" href="#/radicals">Về danh sách bộ thủ</a></div></div></div>`;
    return;
  }
  document.title = `Bộ ${r.name} ${r.char} · LingYu Chinese`;

  page.innerHTML = `${breadcrumb({ backHref: "#/radicals", section: "Bộ thủ", sectionHref: "#/radicals", current: `${r.num}. ${r.name}` })}
    <article class="page-card rd-card" aria-labelledby="rd-title">
      <span class="decor" style="right:-10px;bottom:-14px;width:70px;opacity:.35;transform:rotate(-30deg)">${leafDecor}</span>
      <header class="rd-head">
        <div class="rd-glyph"><span class="hanzi" lang="zh">${esc(r.char)}</span></div>
        <div class="rd-info">
          <p class="rd-num">Bộ số ${r.num} / 214</p>
          <h1 class="page-title" id="rd-title">Bộ ${esc(r.name)}</h1>
          <p class="rd-meaning">${esc(r.meaning)}</p>
          <dl class="rd-facts">
            <div><dt>Pinyin</dt><dd class="pinyin">${esc(r.pinyin)}</dd></div>
            <div><dt>Số nét</dt><dd>${r.strokes}</dd></div>
            <div><dt>Biến thể</dt><dd class="hanzi" lang="zh">${r.variants.length ? r.variants.map(esc).join("　") : "—"}</dd></div>
            <div><dt>Số chữ trong dữ liệu</dt><dd>${r.charCount}</dd></div>
          </dl>
          <button type="button" class="btn ${r.known ? "btn--ghost" : "btn--solid"}" id="rd-known" aria-pressed="${r.known}">${icon(r.known ? "checkCircle" : "check")}<span>${r.known ? "Đã thuộc" : "Đánh dấu đã thuộc"}</span></button>
        </div>
      </header>

      <section class="gd-sec">
        <h2 class="gd-sec__title">${icon("doc")}Chữ thường gặp có bộ ${esc(r.name)}</h2>
        ${r.examples.length ? `<ul class="rd-examples">${r.examples.map((e) => `<li><span class="hanzi" lang="zh">${esc(e.char)}</span><span class="pinyin">${esc(e.pinyin)}</span></li>`).join("")}</ul>` : '<p class="field__hint" style="margin:0">Chưa có chữ ví dụ.</p>'}
        ${r.moreChars.length ? `<p class="rd-more"><span class="field__hint">Chữ khác:</span> <span class="hanzi" lang="zh">${r.moreChars.map(esc).join(" ")}</span></p>` : ""}
      </section>

      <section class="gd-sec">
        <h2 class="gd-sec__title">${icon("book")}Từ vựng của bạn có bộ này</h2>
        <div id="rd-vocab"><span class="skel" style="height:40px;display:block"></span></div>
      </section>

      <nav class="rd-nav" aria-label="Bộ thủ trước / sau">
        ${r.prev ? `<a class="btn btn--secondary" href="#/radicals/${r.prev.num}">${icon("arrowLeft")}<span class="hanzi" lang="zh">${esc(r.prev.char)}</span> ${esc(r.prev.name)}</a>` : "<span></span>"}
        ${r.next ? `<a class="btn btn--secondary" href="#/radicals/${r.next.num}"><span class="hanzi" lang="zh">${esc(r.next.char)}</span> ${esc(r.next.name)}${icon("arrowRight")}</a>` : "<span></span>"}
      </nav>
    </article>`;

  const btn = page.querySelector("#rd-known");
  btn.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    radicalApi.setKnown(r.num, on);
    btn.setAttribute("aria-pressed", String(on));
    btn.className = `btn ${on ? "btn--ghost" : "btn--solid"}`;
    btn.innerHTML = `${icon(on ? "checkCircle" : "check")}<span>${on ? "Đã thuộc" : "Đánh dấu đã thuộc"}</span>`;
    toast(on ? `Đã đánh dấu thuộc bộ ${r.name}.` : "Đã bỏ đánh dấu.", "success");
  });

  const box = page.querySelector("#rd-vocab");
  try {
    const { items, total } = await vocabApi.list({ radical: r.num, pageSize: 12 });
    if (!ctx.isCurrent()) return;
    box.innerHTML = total
      ? `<ul class="rd-vocab">${items.map((v) => `<li><a href="#/vocabulary/${v.id}/edit"><span class="hanzi" lang="zh">${esc(v.hanzi)}</span><span class="pinyin">${esc(v.pinyin)}</span><span>${esc(v.meaningVi)}</span></a></li>`).join("")}</ul>
        ${total > items.length ? `<p class="field__hint">và ${total - items.length} từ khác.</p>` : ""}
        <a class="btn btn--secondary btn--sm" href="#/vocabulary?radical=${r.num}">${icon("list")}Xem ${total} từ trong danh sách Từ vựng</a>`
      : `<p class="field__hint" style="margin:0">Bạn chưa lưu từ vựng nào có bộ ${esc(r.name)}.</p>`;
  } catch (ex) {
    if (ctx.isCurrent()) box.innerHTML = `<p class="field__hint" style="margin:0">${esc(ex.message)}</p>`;
  }
}
