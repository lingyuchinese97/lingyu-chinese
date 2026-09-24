// Toast, Modal (confirm), Popover menu — thay thế alert()/confirm() của trình duyệt.
import { esc } from "../../lib/dom.js";
import { icon } from "./icons.js";

export function toast(message, type = "info") {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    root.setAttribute("aria-live", "polite");
    document.body.appendChild(root);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  const ic = type === "success" ? "checkCircle" : type === "error" ? "alert" : "info";
  el.innerHTML = `${icon(ic)}<span>${esc(message)}</span>`;
  root.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity .25s";
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 260);
  }, 2800);
}

/**
 * Modal tuỳ biến. Trả về { el, close }.
 */
export function openModal({ title, body = "", iconName, danger = false, wide = false, actions = [], onClose, labelledBy }) {
  const prevFocus = document.activeElement;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  const titleId = labelledBy || `m_${Math.random().toString(36).slice(2, 8)}`;
  overlay.innerHTML = `
    <div class="modal ${wide ? "modal--wide" : ""}" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      ${iconName ? `<div class="modal__icon ${danger ? "modal__icon--danger" : ""}">${icon(iconName)}</div>` : ""}
      <h2 class="modal__title" id="${titleId}">${esc(title)}</h2>
      <div class="modal__body">${body}</div>
      ${actions.length ? `<div class="modal__actions">${actions.map((a, i) => `<button type="button" class="btn ${a.variant || "btn--secondary"}" data-i="${i}">${esc(a.label)}</button>`).join("")}</div>` : ""}
    </div>`;
  document.body.appendChild(overlay);

  let closed = false;
  function close(result) {
    if (closed) return;
    closed = true;
    overlay.remove();
    document.removeEventListener("keydown", onKey, true);
    prevFocus?.focus?.();
    onClose?.(result);
  }
  function onKey(e) {
    if (e.key === "Escape") { e.stopPropagation(); close(undefined); }
    if (e.key === "Tab") {
      const f = overlay.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }
  document.addEventListener("keydown", onKey, true);
  overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(undefined); });
  overlay.querySelectorAll(".modal__actions button[data-i]").forEach((b) => {
    b.addEventListener("click", () => {
      const a = actions[Number(b.dataset.i)];
      if (a.onClick) a.onClick({ close, button: b });
      else close(a.value);
    });
  });
  const focusTarget = overlay.querySelector("input, .modal__actions .btn:last-child") || overlay.querySelector("button");
  setTimeout(() => focusTarget?.focus(), 20);
  return { el: overlay, close };
}

export function confirmDialog({ title, message, confirmLabel = "Xác nhận", cancelLabel = "Hủy", danger = false, iconName }) {
  return new Promise((resolve) => {
    openModal({
      title,
      body: `<p>${message}</p>`,
      iconName: iconName || (danger ? "trash" : "info"),
      danger,
      actions: [
        { label: cancelLabel, variant: "btn--secondary", value: false },
        { label: confirmLabel, variant: danger ? "btn--danger" : "btn--solid", value: true },
      ],
      onClose: (v) => resolve(!!v),
    });
  });
}

/** Popover menu gắn với 1 nút. items: [{label, icon, danger, onClick} | 'sep' | {html}] */
let openMenuEl = null;
export function closeMenu() {
  if (openMenuEl) { openMenuEl._cleanup?.(); openMenuEl.remove(); openMenuEl = null; }
}
export function openMenu(anchor, items, { align = "right", width } = {}) {
  if (openMenuEl && openMenuEl._anchor === anchor) { closeMenu(); return; }
  closeMenu();
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.setAttribute("role", "menu");
  if (width) menu.style.width = `${width}px`;
  menu.innerHTML = items.map((it, i) => {
    if (it === "sep") return `<div class="menu__sep"></div>`;
    if (it.html) return it.html;
    return `<button type="button" role="menuitem" class="menu__item ${it.danger ? "menu__item--danger" : ""}" data-i="${i}">${it.icon ? icon(it.icon) : ""}<span>${esc(it.label)}</span></button>`;
  }).join("");
  document.body.appendChild(menu);
  menu._anchor = anchor;
  anchor.setAttribute("aria-expanded", "true");

  const r = anchor.getBoundingClientRect();
  const mw = menu.offsetWidth, mh = menu.offsetHeight;
  let left = align === "right" ? r.right - mw : r.left;
  left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
  let top = r.bottom + 8;
  if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 8);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;

  menu.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => {
    const it = items[Number(b.dataset.i)];
    closeMenu();
    it.onClick?.();
  }));
  const onDoc = (e) => { if (!menu.contains(e.target) && !anchor.contains(e.target)) closeMenu(); };
  const onKey = (e) => { if (e.key === "Escape") { closeMenu(); anchor.focus(); } };
  const onScroll = () => closeMenu();
  setTimeout(() => document.addEventListener("mousedown", onDoc), 0);
  document.addEventListener("keydown", onKey);
  window.addEventListener("resize", onScroll);
  window.addEventListener("hashchange", onScroll);
  menu._cleanup = () => {
    anchor.setAttribute("aria-expanded", "false");
    document.removeEventListener("mousedown", onDoc);
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onScroll);
    window.removeEventListener("hashchange", onScroll);
  };
  openMenuEl = menu;
  menu.querySelector("button")?.focus();
  return menu;
}
