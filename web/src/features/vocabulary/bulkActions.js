// Hộp thoại cho các thao tác hàng loạt trên màn Từ vựng: Chia sẻ, Thêm tag.
import * as vocabApi from "../../services/api/vocabApi.js";
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

/** Share Vocabulary Modal — nhận đúng danh sách từ đang được chọn. */
export function openShareModal(words) {
  let fmt = "text";
  const canNativeShare = typeof navigator.share === "function";
  const actions = [
    { label: "Đóng", variant: "btn--muted", value: false },
    { label: "Tải file", variant: "btn--secondary", onClick: () => { download(fmt, words); toast(`Đã tải file ${words.length} từ vựng.`, "success"); } },
    { label: "Sao chép", variant: "btn--solid", onClick: async ({ button }) => {
      const ok = await copyText(build(fmt, words));
      toast(ok ? `Đã sao chép ${words.length} từ vựng.` : "Không sao chép được. Hãy dùng Tải file.", ok ? "success" : "error");
      if (ok) { button.textContent = "Đã sao chép"; setTimeout(() => { button.textContent = "Sao chép"; }, 1500); }
    } },
  ];
  if (canNativeShare) {
    actions.splice(1, 0, { label: "Chia sẻ qua…", variant: "btn--secondary", onClick: async () => {
      try { await navigator.share({ title: "Từ vựng LingYu Chinese", text: toText(words) }); }
      catch (ex) { if (ex?.name !== "AbortError") toast("Không mở được chia sẻ của thiết bị.", "error"); }
    } });
  }

  const { el } = openModal({
    title: `Chia sẻ ${words.length} từ vựng`,
    iconName: "share",
    wide: true,
    body: `
      <div class="share-modal">
        <ul class="share-list" aria-label="Từ vựng sẽ chia sẻ">
          ${words.map((v) => `<li><span class="hanzi" lang="zh">${esc(v.hanzi)}</span><span class="pinyin">${esc(v.pinyin)}</span><span class="share-list__vi">${esc(v.meaningVi)}</span></li>`).join("")}
        </ul>
        <div class="share-fmt" role="radiogroup" aria-label="Định dạng">
          <span class="share-fmt__label">Định dạng:</span>
          ${Object.entries(FORMATS).map(([k, f]) => `<label class="share-fmt__opt"><input type="radio" name="share-fmt" value="${k}" ${k === fmt ? "checked" : ""} />${f.label}</label>`).join("")}
        </div>
      </div>`,
    actions,
  });
  el.querySelectorAll('[name="share-fmt"]').forEach((r) => r.addEventListener("change", () => { fmt = r.value; }));
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
