export function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export const $ = (root, sel) => root.querySelector(sel);
export const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));

export function debounce(fn, wait) {
  let t = null;
  const d = (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  d.cancel = () => clearTimeout(t);
  return d;
}

/** Đặt trạng thái loading cho nút: spinner + disabled, chống double submit. */
export function setBusy(btn, busy, busyLabel) {
  if (!btn) return;
  if (busy) {
    if (btn.dataset.busy === "1") return;
    btn.dataset.busy = "1";
    btn.dataset.html = btn.innerHTML;
    btn.disabled = true;
    btn.setAttribute("aria-busy", "true");
    btn.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${esc(busyLabel || "Đang xử lý...")}</span>`;
  } else {
    if (btn.dataset.busy !== "1") return;
    btn.dataset.busy = "";
    btn.disabled = false;
    btn.removeAttribute("aria-busy");
    btn.innerHTML = btn.dataset.html || btn.innerHTML;
  }
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts.slice(-2).map((w) => w[0]).join("").toUpperCase();
}

export function firstName(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || "";
  return parts.slice(-2).join(" ");
}

/** Màu pastel ổn định cho tag theo tên. */
const TAG_PALETTE = [
  ["#E6F2FF", "#0B6FD0"], ["#FFEAEA", "#D0262D"], ["#E7F8EF", "#138A55"],
  ["#FFF1E3", "#C66A06"], ["#F1EAFF", "#6B3FD0"], ["#E3F7F8", "#0B8791"],
  ["#FDEAF5", "#B8327D"], ["#EEF1F6", "#4B5E7A"],
];
export function tagStyle(name) {
  const n = String(name || "");
  if (/^hsk/i.test(n)) return `--tag-bg:${TAG_PALETTE[0][0]};--tag-fg:${TAG_PALETTE[0][1]}`;
  let h = 0;
  for (const ch of n) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  const [bg, fg] = TAG_PALETTE[1 + (h % (TAG_PALETTE.length - 1))];
  return `--tag-bg:${bg};--tag-fg:${fg}`;
}

export function tagHtml(name) {
  return `<span class="tag" style="${tagStyle(name)}">${esc(name)}</span>`;
}
