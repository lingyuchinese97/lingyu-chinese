// Thành phần dùng chung cho màn Ngữ pháp: ô nhập thẻ, Share modal, Accept modal, bookmark, xóa.
import * as grammarApi from "../../services/api/grammarApi.js";
import { refreshNotifications } from "../../services/api/notificationApi.js";
import { icon } from "../../components/ui/icons.js";
import { esc, setBusy, tagHtml, tagStyle } from "../../lib/dom.js";
import { toast, openModal, confirmDialog } from "../../components/ui/feedback.js";

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

export function bookmarkIcon(saved) {
  return saved
    ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6.5 3.5h11a1 1 0 0 1 1 1V21l-6.5-4.5L5.5 21V4.5a1 1 0 0 1 1-1Z" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`
    : icon("bookmark");
}

// ---------- Ô nhập thẻ: gõ tên → Enter ----------

/**
 * Gắn ô nhập thẻ vào container. Trả về { get(): string[], set(names) }.
 * - Trim khoảng trắng, bỏ thẻ rỗng, không cho trùng (không phân biệt hoa/thường).
 * - Gợi ý thẻ đã có của user; tên trùng thẻ có sẵn thì dùng lại đúng tên đó.
 */
export function tagInput(container, { initial = [], existing = [], placeholder = "Nhập tên thẻ rồi nhấn Enter", inputId = "tag-input" } = {}) {
  let tags = [];
  const listId = `${inputId}-list`;
  container.classList.add("taginput");
  container.innerHTML = `
    <div class="taginput__chips" role="list"></div>
    <input class="taginput__input" id="${inputId}" list="${listId}" maxlength="${grammarApi.LIMITS.tag}" placeholder="${esc(placeholder)}" autocomplete="off" aria-describedby="${inputId}-err" />
    <datalist id="${listId}">${existing.map((t) => `<option value="${esc(t)}"></option>`).join("")}</datalist>`;
  const chips = container.querySelector(".taginput__chips");
  const input = container.querySelector("input");
  const err = document.createElement("span");
  err.className = "field__error"; err.id = `${inputId}-err`; err.hidden = true; err.setAttribute("role", "alert");
  container.after(err);
  const showErr = (m) => { err.textContent = m || ""; err.hidden = !m; };

  function render() {
    chips.innerHTML = tags.map((t, i) => `<span class="tag taginput__chip" role="listitem" style="${tagStyle(t)}">${esc(t)}<button type="button" class="tag-x" data-rm="${i}" aria-label="Bỏ thẻ ${esc(t)}">${icon("x")}</button></span>`).join("");
  }
  function add(raw) {
    const name = String(raw || "").trim().replace(/\s+/g, " ");
    if (!name) { showErr("Tên thẻ không được để trống."); return false; }
    if (name.length > grammarApi.LIMITS.tag) { showErr(`Tên thẻ tối đa ${grammarApi.LIMITS.tag} ký tự.`); return false; }
    if (tags.some((t) => t.toLowerCase() === name.toLowerCase())) { showErr(`Thẻ “${name}” đã được thêm.`); return false; }
    const known = existing.find((t) => t.toLowerCase() === name.toLowerCase());
    tags.push(known || name);
    showErr(""); render();
    return true;
  }
  input.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (!input.value.trim() && e.key === "Enter") { showErr(""); return; }
      if (add(input.value)) input.value = "";
    } else if (e.key === "Backspace" && !input.value && tags.length) {
      tags.pop(); render();
    }
  });
  input.addEventListener("input", () => showErr(""));
  // Chọn gợi ý từ datalist → thêm luôn.
  input.addEventListener("change", () => { if (existing.some((t) => t === input.value) && add(input.value)) input.value = ""; });
  chips.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rm]");
    if (!b) return;
    tags.splice(Number(b.dataset.rm), 1); render(); input.focus();
  });
  container.addEventListener("click", (e) => { if (e.target === container || e.target === chips) input.focus(); });

  initial.forEach((t) => add(t));
  showErr("");
  return {
    /** Lấy danh sách thẻ; nếu còn chữ đang gõ dở thì thêm luôn. */
    get() { if (input.value.trim() && add(input.value)) input.value = ""; return tags.slice(); },
    set(names) { tags = []; names.forEach((t) => add(t)); showErr(""); },
    focus() { input.focus(); },
  };
}

// ---------- Bookmark ----------

export async function toggleBookmark(g, btn) {
  if (btn) btn.disabled = true;
  try {
    const { saved } = await grammarApi.setBookmark(g.id, !g.isSaved);
    g.isSaved = saved;
    if (btn) {
      btn.innerHTML = bookmarkIcon(saved) + (btn.dataset.label ? `<span>${saved ? "Đã lưu" : "Lưu"}</span>` : "");
      btn.setAttribute("aria-pressed", String(saved));
      btn.setAttribute("aria-label", saved ? `Bỏ lưu “${g.title}”` : `Lưu “${g.title}”`);
      btn.classList.toggle("is-saved", saved);
    }
    toast(saved ? "Đã lưu vào mục Đã lưu." : "Đã bỏ lưu.", "success");
    return saved;
  } catch (ex) {
    toast(ex.message, "error");
    return g.isSaved;
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ---------- Xóa ----------

export async function confirmDeleteGrammar(g) {
  const ok = await confirmDialog({
    title: "Xóa ngữ pháp?",
    message: `Bạn có chắc muốn xóa ngữ pháp này?<br/><strong>${esc(g.title)}</strong>`,
    confirmLabel: "Xóa", cancelLabel: "Hủy", danger: true,
  });
  if (!ok) return false;
  try {
    await grammarApi.remove(g.id);
    toast("Đã xóa ngữ pháp.", "success");
    return true;
  } catch (ex) {
    toast(ex.message || "Không xóa được. Vui lòng thử lại.", "error");
    return false;
  }
}

// ---------- Share Grammar ----------

function statusBadge(status) {
  return `<span class="gshare-status gshare-status--${status.toLowerCase()}">${grammarApi.SHARE_STATUS_LABEL[status]}</span>`;
}

export function sentListHtml(sent) {
  if (!sent.length) return `<p class="field__hint" style="margin:0">Chưa chia sẻ cho ai.</p>`;
  return `<ul class="gshare-sent">${sent.map((s) => `<li><span class="gshare-sent__email">${esc(s.recipientEmail)}</span>${statusBadge(s.status)}</li>`).join("")}</ul>`;
}

/** Share Grammar modal: nhập nhiều email → Gửi chia sẻ. Hiện cả danh sách đã chia sẻ + trạng thái. */
export async function openShareGrammarModal(g, { onSent } = {}) {
  let sent = await grammarApi.listSent({ grammarId: g.id });
  const { el } = openModal({
    title: "Chia sẻ ngữ pháp",
    iconName: "share",
    wide: true,
    body: `
      <p style="margin:0 0 14px">Chia sẻ <strong>${esc(g.title)}</strong> cho người dùng LingYu Chinese khác. Ghi chú cá nhân của bạn sẽ <strong>không</strong> được chia sẻ.</p>
      <form id="gs-form" novalidate>
        <div class="field">
          <label class="field__label" for="gs-emails">Email người nhận</label>
          <textarea class="textarea" id="gs-emails" rows="2" placeholder="vd: ban@gmail.com, linh@gmail.com" aria-describedby="gs-hint gs-err"></textarea>
          <span class="field__hint" id="gs-hint">Có thể nhập nhiều email, cách nhau bằng dấu phẩy hoặc xuống dòng.</span>
          <span class="field__error" id="gs-err" role="alert" hidden></span>
        </div>
        <ul class="gshare-results" id="gs-results" hidden></ul>
      </form>
      <div class="gshare-block"><strong>Đã chia sẻ với</strong><div id="gs-sent">${sentListHtml(sent)}</div></div>`,
    actions: [
      { label: "Đóng", variant: "btn--secondary", value: false },
      { label: "Gửi chia sẻ", variant: "btn--solid", onClick: ({ button }) => submit(button) },
    ],
  });
  const ta = el.querySelector("#gs-emails");
  const errEl = el.querySelector("#gs-err");
  const results = el.querySelector("#gs-results");
  const showErr = (m) => { errEl.textContent = m || ""; errEl.hidden = !m; ta.classList.toggle("is-invalid", !!m); };
  ta.addEventListener("input", () => showErr(""));
  ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(el.querySelector(".modal__actions .btn--solid")); } });
  el.querySelector("#gs-form").addEventListener("submit", (e) => e.preventDefault());

  async function submit(button) {
    if (button.dataset.busy === "1") return;
    const emails = grammarApi.parseEmails(ta.value);
    if (!emails.length) { showErr("Vui lòng nhập ít nhất 1 email người nhận."); ta.focus(); return; }
    showErr("");
    setBusy(button, true, "Đang gửi...");
    try {
      const r = await grammarApi.share(g.id, emails);
      results.hidden = false;
      results.innerHTML = r.results.map((x) => `<li class="${x.ok ? "is-ok" : "is-err"}">${icon(x.ok ? "checkCircle" : "alert")}<span><strong>${esc(x.email)}</strong> — ${esc(x.message)}</span></li>`).join("");
      // Giữ lại các email lỗi trong ô để user sửa.
      ta.value = r.results.filter((x) => !x.ok).map((x) => x.email).join(", ");
      if (r.sent) {
        toast(`Đã gửi chia sẻ cho ${r.sent} người.`, "success");
        sent = await grammarApi.listSent({ grammarId: g.id });
        el.querySelector("#gs-sent").innerHTML = sentListHtml(sent);
        onSent?.(sent);
      }
    } catch (ex) {
      showErr(ex.message || "Không gửi được. Vui lòng thử lại.");
    } finally {
      setBusy(button, false);
    }
  }
}

// ---------- Accept / Reject ----------

/**
 * Accept modal: chọn giữ thẻ của người gửi + thêm thẻ của tôi.
 * onDone(grammar) được gọi với bản ngữ pháp mới của người nhận.
 */
export async function openAcceptShareModal(share, { onDone } = {}) {
  const senderTags = grammarApi.sourceTagNames(share.grammarId);
  const myTags = (await grammarApi.listTags()).map((t) => t.name);
  const { el, close } = openModal({
    title: "Thêm vào thư viện của bạn",
    iconName: "checkCircle",
    wide: true,
    body: `
      <p style="margin:0 0 14px"><strong>${esc(share.senderName)}</strong> đã chia sẻ <strong>${esc(share.grammarTitle)}</strong>. Một bản riêng sẽ được thêm vào thư viện của bạn — bạn sửa hay xóa bản này không ảnh hưởng bản gốc.</p>
      ${senderTags.length ? `<label class="gaccept-keep"><input type="checkbox" class="checkbox" id="ga-keep" checked /><span>Giữ thẻ hiện tại: ${senderTags.map(tagHtml).join(" ")}</span></label>` : ""}
      <div class="field" style="margin-top:14px">
        <label class="field__label" for="ga-tags">Thêm thẻ của tôi <span class="opt">(không bắt buộc)</span></label>
        <div id="ga-tagbox"></div>
      </div>
      <p class="field__error" id="ga-err" role="alert" hidden></p>`,
    actions: [
      { label: "Hủy", variant: "btn--secondary", value: false },
      { label: "Chấp nhận", variant: "btn--solid", onClick: async ({ button }) => {
        const keepTags = el.querySelector("#ga-keep")?.checked ?? false;
        const extraTags = tags.get();
        setBusy(button, true, "Đang thêm...");
        try {
          const g = await grammarApi.accept(share.id, { keepTags, extraTags });
          close(true);
          refreshNotifications();
          toast(`Đã thêm “${g.title}” vào thư viện của bạn.`, "success");
          onDone?.(g);
        } catch (ex) {
          setBusy(button, false);
          const err = el.querySelector("#ga-err");
          err.textContent = ex.message || "Không chấp nhận được. Vui lòng thử lại."; err.hidden = false;
        }
      } },
    ],
  });
  const tags = tagInput(el.querySelector("#ga-tagbox"), { existing: myTags, inputId: "ga-tags", placeholder: "vd: Bài 2 — nhấn Enter để thêm" });
}

export async function rejectShare(share) {
  const ok = await confirmDialog({ title: "Từ chối chia sẻ?", message: `Từ chối <strong>${esc(share.grammarTitle)}</strong> từ ${esc(share.senderName)}?`, confirmLabel: "Từ chối", cancelLabel: "Hủy", iconName: "x" });
  if (!ok) return false;
  try {
    await grammarApi.reject(share.id);
    refreshNotifications();
    toast("Đã từ chối lời mời chia sẻ.", "info");
    return true;
  } catch (ex) {
    toast(ex.message, "error");
    return false;
  }
}
