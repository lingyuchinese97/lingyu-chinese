// Người nhận: xem trước lời mời chia sẻ từ vựng → Chấp nhận (chép vào kho của mình) / Từ chối.
import * as vocabShareApi from "../../services/api/vocabShareApi.js";
import * as vocabApi from "../../services/api/vocabApi.js";
import { refreshNotifications } from "../../services/api/notificationApi.js";
import { esc, setBusy, tagHtml } from "../../lib/dom.js";
import { toast, openModal, confirmDialog } from "../../components/ui/feedback.js";
import { tagInput } from "../grammar/shared.js";

/** Hộp thoại xem trước + chấp nhận. onDone() gọi sau khi chấp nhận hoặc từ chối xong. */
export async function openVocabInvite(share, { onDone } = {}) {
  const senderTags = vocabShareApi.senderTags(share);
  const myTags = (await vocabApi.listTags()).map((t) => t.name);
  const { el, close } = openModal({
    title: `${share.senderName} chia sẻ ${share.count} từ vựng`,
    iconName: "share",
    wide: true,
    body: `
      <p style="margin:0 0 12px">Chấp nhận để chép các từ này vào danh sách Từ vựng của bạn. Bạn sửa hay xóa bản của mình không ảnh hưởng người gửi. Từ đã có (trùng Hán tự) sẽ được bỏ qua.</p>
      <ul class="share-list" aria-label="Từ vựng được chia sẻ">
        ${share.words.map((w) => `<li><span class="hanzi" lang="zh">${esc(w.hanzi)}</span><span class="pinyin">${esc(w.pinyin)}</span><span class="share-list__vi">${esc(w.meaningVi)}</span></li>`).join("")}
      </ul>
      ${senderTags.length ? `<label class="gaccept-keep"><input type="checkbox" class="checkbox" id="vi-keep" checked /><span>Giữ tag hiện tại: ${senderTags.map(tagHtml).join(" ")}</span></label>` : ""}
      <div class="field" style="margin-top:12px">
        <label class="field__label" for="vi-tags">Thêm tag của tôi <span class="opt">(không bắt buộc)</span></label>
        <div id="vi-tagbox"></div>
      </div>
      <p class="field__error" id="vi-err" role="alert" hidden></p>`,
    actions: [
      { label: "Từ chối", variant: "btn--muted", onClick: async ({ close: c }) => { c(false); if (await rejectVocabInvite(share)) onDone?.(); } },
      { label: "Chấp nhận", variant: "btn--solid", onClick: async ({ button }) => {
        setBusy(button, true, "Đang thêm...");
        try {
          const r = await vocabShareApi.accept(share.id, { keepTags: el.querySelector("#vi-keep")?.checked ?? false, extraTags: tags.get() });
          close(true);
          refreshNotifications();
          toast(r.skipped.length
            ? `Đã thêm ${r.added}/${r.total} từ. ${r.skipped.length} từ đã có sẵn nên được bỏ qua (${r.skipped.slice(0, 3).join(", ")}${r.skipped.length > 3 ? "…" : ""}).`
            : `Đã thêm ${r.added} từ vào danh sách Từ vựng của bạn.`, "success");
          onDone?.();
        } catch (ex) {
          setBusy(button, false);
          const err = el.querySelector("#vi-err");
          err.textContent = ex.message || "Không chấp nhận được. Vui lòng thử lại."; err.hidden = false;
        }
      } },
    ],
  });
  const tags = tagInput(el.querySelector("#vi-tagbox"), { existing: myTags, inputId: "vi-tags", placeholder: "vd: Bài 3 — nhấn Enter để thêm" });
}

export async function rejectVocabInvite(share) {
  const ok = await confirmDialog({ title: "Từ chối chia sẻ?", message: `Từ chối ${share.count} từ vựng từ ${esc(share.senderName)}?`, confirmLabel: "Từ chối", cancelLabel: "Hủy", iconName: "x" });
  if (!ok) return false;
  try {
    await vocabShareApi.reject(share.id);
    refreshNotifications();
    toast("Đã từ chối lời mời chia sẻ.", "info");
    return true;
  } catch (ex) {
    toast(ex.message, "error");
    return false;
  }
}
