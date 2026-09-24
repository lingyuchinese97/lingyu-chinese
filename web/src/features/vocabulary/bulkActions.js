// Hộp thoại cho các thao tác hàng loạt trên màn Từ vựng: Chia sẻ, Thêm tag.
import * as vocabApi from "../../services/api/vocabApi.js";
import * as vocabShareApi from "../../services/api/vocabShareApi.js";
import { parseEmails } from "../../services/api/shareUtils.js";
import { icon } from "../../components/ui/icons.js";
import { esc, setBusy, tagHtml } from "../../lib/dom.js";
import { toast, openModal } from "../../components/ui/feedback.js";

// ---------- Chia sẻ ----------

const FORMATS = {
  text: { label: "Văn bản", ext: "txt", mime: "text/plain" },
  csv: { label: "CSV (Excel)", ext: "csv", mime: "text/csv" },
};

function toText(words) {
  return words.map((v, i) => {
    let line = `${i + 1}. ${v.hanzi} (${v.pinyin}) — ${v.meaningVi}`;
    if (v.note) line += `\n   Ghi chú: ${v.note}`;
    return line;
  }).join("\n");
}
function toCsv(words) {
  const cell = (s) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const rows = [["Hán tự", "Pinyin", "Nghĩa tiếng Việt", "Ghi chú", "Tag"]]
    .concat(words.map((v) => [v.hanzi, v.pinyin, v.meaningVi, v.note, v.tags.join(", ")]));
  // BOM để Excel đọc đúng tiếng Việt / chữ Hán.
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
}
const build = (fmt, words) => (fmt === "csv" ? toCsv(words) : toText(words));

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* fallback bên dưới */ }
  const ta = Object.assign(document.createElement("textarea"), { value: text });
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { ok = false; }
  ta.remove();
  return ok;
}

function download(fmt, words) {
  const f = FORMATS[fmt];
  const blob = new Blob([build(fmt, words)], { type: `${f.mime};charset=utf-8` });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `lingyu-tu-vung-${new Date().toISOString().slice(0, 10)}.${f.ext}`,
  });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const statusBadge = (st) => `<span class="gshare-status gshare-status--${st.toLowerCase()}">${vocabShareApi.STATUS_LABEL[st]}</span>`;
function sentHtml(list) {
  if (!list.length) return `<p class="field__hint" style="margin:0">Chưa gửi cho ai.</p>`;
  return `<ul class="gshare-sent">${list.map((x) => `<li><span class="gshare-sent__email">${esc(x.recipientEmail)} <span class="field__hint">· ${esc(x.title)}</span></span>${statusBadge(x.status)}</li>`).join("")}</ul>`;
}

/**
 * Share Vocabulary Modal — nhận đúng danh sách từ đang được chọn.
 * 1) Gửi cho người dùng LingYu qua email (người nhận có thông báo → Chấp nhận / Từ chối).
 * 2) Sao chép / tải file / chia sẻ qua ứng dụng khác.
 */
export function openShareModal(words) {
  let fmt = "text";
  const canNativeShare = typeof navigator.share === "function";
  const { el } = openModal({
    title: `Chia sẻ ${words.length} từ vựng`,
    iconName: "share",
    wide: true,
    body: `
      <div class="share-modal">
        <ul class="share-list" aria-label="Từ vựng sẽ chia sẻ">
          ${words.map((v) => `<li><span class="hanzi" lang="zh">${esc(v.hanzi)}</span><span class="pinyin">${esc(v.pinyin)}</span><span class="share-list__vi">${esc(v.meaningVi)}</span></li>`).join("")}
        </ul>

        <section class="share-sec" aria-labelledby="vs-h">
          <h3 class="share-sec__title" id="vs-h">${icon("mail")}Gửi cho người dùng LingYu</h3>
          <form id="vs-form" novalidate>
            <label class="sr-only" for="vs-emails">Email người nhận</label>
            <textarea class="textarea" id="vs-emails" rows="2" placeholder="Email người nhận, vd: ban@gmail.com, linh@gmail.com" aria-describedby="vs-hint vs-err"></textarea>
            <span class="field__hint" id="vs-hint">Nhập email tài khoản LingYu (Gmail…), nhiều email cách nhau bằng dấu phẩy. Người nhận bấm “Chấp nhận” thì các từ được chép vào kho của họ. Ảnh minh họa không được gửi kèm.</span>
            <span class="field__error" id="vs-err" role="alert" hidden></span>
            <button type="submit" class="btn btn--solid btn--block" id="vs-send" style="margin-top:10px">${icon("share")}Gửi chia sẻ</button>
          </form>
          <ul class="gshare-results" id="vs-results" hidden></ul>
          <div class="gshare-block"><strong>Đã gửi gần đây</strong><div id="vs-sent">${sentHtml(vocabShareApi.listSent({ limit: 5 }))}</div></div>
        </section>

        <details class="share-sec share-sec--more">
          <summary class="share-sec__title">${icon("copy")}Sao chép hoặc tải file</summary>
          <div class="share-fmt" role="radiogroup" aria-label="Định dạng">
            <span class="share-fmt__label">Định dạng:</span>
            ${Object.entries(FORMATS).map(([k, f]) => `<label class="share-fmt__opt"><input type="radio" name="share-fmt" value="${k}" ${k === fmt ? "checked" : ""} />${f.label}</label>`).join("")}
          </div>
          <div class="share-more__actions">
            <button type="button" class="btn btn--secondary" id="vs-copy">${icon("copy")}Sao chép</button>
            <button type="button" class="btn btn--secondary" id="vs-download">${icon("download")}Tải file</button>
            ${canNativeShare ? `<button type="button" class="btn btn--secondary" id="vs-native">${icon("share")}Chia sẻ qua…</button>` : ""}
          </div>
        </details>
      </div>`,
    actions: [{ label: "Đóng", variant: "btn--secondary", value: false }],
  });
  const $ = (q) => el.querySelector(q);
  el.querySelectorAll('[name="share-fmt"]').forEach((r) => r.addEventListener("change", () => { fmt = r.value; }));

  // ----- Gửi qua email -----
  const ta = $("#vs-emails"), err = $("#vs-err"), results = $("#vs-results"), send = $("#vs-send");
  const showErr = (m) => { err.textContent = m || ""; err.hidden = !m; ta.classList.toggle("is-invalid", !!m); ta.setAttribute("aria-invalid", m ? "true" : "false"); };
  ta.addEventListener("input", () => showErr(""));
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $("#vs-form").requestSubmit(); } });
  $("#vs-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (send.dataset.busy === "1") return;
    const emails = parseEmails(ta.value);
    if (!emails.length) { showErr("Vui lòng nhập ít nhất 1 email người nhận."); ta.focus(); return; }
    showErr("");
    setBusy(send, true, "Đang gửi...");
    try {
      const r = await vocabShareApi.share(words.map((w) => w.id), emails);
      results.hidden = false;
      results.innerHTML = r.results.map((x) => `<li class="${x.ok ? "is-ok" : "is-err"}">${icon(x.ok ? "checkCircle" : "alert")}<span><strong>${esc(x.email)}</strong> — ${esc(x.message)}</span></li>`).join("");
      ta.value = r.results.filter((x) => !x.ok).map((x) => x.email).join(", "); // giữ email lỗi để sửa
      if (r.sent) {
        toast(`Đã gửi ${words.length} từ cho ${r.sent} người.`, "success");
        $("#vs-sent").innerHTML = sentHtml(vocabShareApi.listSent({ limit: 5 }));
      }
    } catch (ex) {
      showErr(ex.message || "Không gửi được. Vui lòng thử lại.");
    } finally {
      setBusy(send, false);
    }
  });

  // ----- Sao chép / tải file -----
  $("#vs-copy").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    const ok = await copyText(build(fmt, words));
    toast(ok ? `Đã sao chép ${words.length} từ vựng.` : "Không sao chép được. Hãy dùng Tải file.", ok ? "success" : "error");
    if (ok) { b.lastChild.textContent = "Đã sao chép"; setTimeout(() => { b.lastChild.textContent = "Sao chép"; }, 1500); }
  });
  $("#vs-download").addEventListener("click", () => { download(fmt, words); toast(`Đã tải file ${words.length} từ vựng.`, "success"); });
  $("#vs-native")?.addEventListener("click", async () => {
    try { await navigator.share({ title: "Từ vựng LingYu Chinese", text: toText(words) }); }
    catch (ex) { if (ex?.name !== "AbortError") toast("Không mở được chia sẻ của thiết bị.", "error"); }
  });
  setTimeout(() => ta.focus(), 30);
}

// ---------- Thêm tag ----------

function tagPickerBody({ tags, intro }) {
  return `
    ${intro ? `<p style="margin:0 0 12px">${intro}</p>` : ""}
    <div class="bulk-tags" role="group" aria-label="Danh sách tag">
      ${tags.length ? tags.map((t, i) => `<label class="tagpick__opt"><input type="checkbox" class="checkbox" name="bulk-tag" value="${esc(t.name)}" id="bt-${i}" />${tagHtml(t.name)}<span class="field__hint" style="margin-left:auto">${t.count} từ</span></label>`).join("")
        : `<p class="field__hint">Chưa có tag nào. Tạo tag mới bên dưới.</p>`}
    </div>
    <div class="tagpick__new" style="margin-top:12px">
      <label class="sr-only" for="bulk-new-tag">Tên tag mới</label>
      <input class="input" id="bulk-new-tag" maxlength="24" placeholder="Hoặc tạo tag mới (vd: Bài 3)" autocomplete="off" />
    </div>
    <p class="field__error" id="bulk-tag-err" role="alert" hidden></p>`;
}

function readPicked(el) {
  const picked = [...el.querySelectorAll('[name="bulk-tag"]:checked')].map((c) => c.value);
  const fresh = el.querySelector("#bulk-new-tag").value.trim();
  if (fresh && !picked.some((t) => t.toLowerCase() === fresh.toLowerCase())) picked.push(fresh);
  return picked;
}
function showErr(el, msg) {
  const err = el.querySelector("#bulk-tag-err");
  err.textContent = msg; err.hidden = !msg;
}

/** Thêm tag cho các từ đã chọn. onDone() được gọi sau khi lưu thành công. */
export async function openAddTagModal(ids, onDone) {
  const tags = await vocabApi.listTags();
  const { el } = openModal({
    title: `Thêm tag cho ${ids.length} từ`,
    iconName: "tag",
    wide: true,
    body: tagPickerBody({ tags, intro: "Tag được thêm vào, các tag hiện có của từ vẫn giữ nguyên." }),
    actions: [
      { label: "Hủy", variant: "btn--secondary", value: false },
      { label: "Thêm tag", variant: "btn--solid", onClick: async ({ close, button }) => {
        const picked = readPicked(el);
        if (!picked.length) return showErr(el, "Vui lòng chọn hoặc tạo ít nhất 1 tag.");
        setBusy(button, true, "Đang lưu...");
        try {
          await vocabApi.addTags(ids, picked);
          close(true);
          toast(`Đã thêm ${picked.length} tag cho ${ids.length} từ.`, "success");
          onDone?.();
        } catch (ex) { setBusy(button, false); showErr(el, ex.message || "Không lưu được. Vui lòng thử lại."); }
      } },
    ],
  });
  el.addEventListener("change", () => showErr(el, ""));
  el.querySelector("#bulk-new-tag").addEventListener("input", () => showErr(el, ""));
}
