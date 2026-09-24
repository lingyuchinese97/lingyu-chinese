import * as vocabApi from "../../services/api/vocabApi.js";
import { SAMPLE_VOCABULARY } from "../../services/api/sampleData.js";
import { getCurrentUser, updateProfile, logout } from "../../services/api/authApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { esc, setBusy, initials } from "../../lib/dom.js";
import { toast, confirmDialog } from "../../components/ui/feedback.js";
import { navigate } from "../../routes/router.js";

export function renderSettings(page) {
  const u = getCurrentUser();
  page.innerHTML = `
    <div><h1 class="page-title">Cài đặt<span class="leaf" aria-hidden="true">${leafDecor}</span></h1>
    <p class="page-sub">Quản lý tài khoản và dữ liệu học tập của bạn.</p></div>
    <div class="set-grid">
      <section class="page-card set-card" aria-labelledby="acc-h">
        <h2 id="acc-h">${icon("user")}Tài khoản</h2>
        <div class="profile"><span class="avatar" id="set-avatar">${esc(initials(u?.name))}</span>
          <div><strong style="display:block;font-size:18px" id="set-name">${esc(u?.name)}</strong><span style="color:var(--text-2)">${esc(u?.email)}</span>
          <div class="field__hint">${u?.provider === "google" ? "Đăng nhập bằng Google" : "Đăng nhập bằng email"}</div></div></div>
        <form id="name-form" class="field" novalidate>
          <label class="field__label" for="set-name-input">Họ và tên</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <input class="input" id="set-name-input" value="${esc(u?.name)}" autocomplete="name" style="flex:1;min-width:200px" />
            <button type="submit" class="btn btn--solid" id="name-save">Lưu</button>
          </div>
          <span class="field__error" id="name-err" hidden></span>
        </form>
        <div class="set-row"><div class="set-row__text"><strong>Đăng xuất</strong><span>Thoát khỏi tài khoản trên thiết bị này.</span></div>
          <button type="button" class="btn btn--secondary" id="logout">${icon("logout")}Đăng xuất</button></div>
      </section>
      <section class="page-card set-card" aria-labelledby="data-h">
        <h2 id="data-h">${icon("database")}Dữ liệu học tập</h2>
        <div class="set-row"><div class="set-row__text"><strong>Dữ liệu mẫu</strong><span>Thêm ${SAMPLE_VOCABULARY.length} từ vựng HSK mẫu để thử tính năng ôn tập.</span></div>
          <button type="button" class="btn btn--secondary" id="sample">${icon("plus")}Thêm dữ liệu mẫu</button></div>
        <div class="set-row"><div class="set-row__text"><strong>Xóa toàn bộ từ vựng</strong><span>Xóa tất cả từ vựng và tag của bạn. Không thể hoàn tác.</span></div>
          <button type="button" class="btn btn--danger" id="wipe">${icon("trash")}Xóa tất cả</button></div>
      </section>
    </div>`;
  const $ = (s) => page.querySelector(s);

  $("#name-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#name-save"), err = $("#name-err");
    const v = $("#set-name-input").value.trim();
    if (!v) { err.textContent = "Vui lòng nhập họ và tên."; err.hidden = false; return; }
    err.hidden = true;
    setBusy(btn, true, "Đang lưu...");
    try {
      const nu = await updateProfile({ name: v });
      $("#set-name").textContent = nu.name;
      $("#set-avatar").textContent = initials(nu.name);
      document.querySelector("#user-name").textContent = nu.name;
      document.querySelector("#user-avatar").textContent = initials(nu.name);
      toast("Đã cập nhật họ và tên.", "success");
    } catch (ex) { toast(ex.message, "error"); }
    setBusy(btn, false);
  });
  $("#logout").addEventListener("click", async () => { await logout(); navigate("/login"); });
  $("#sample").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    setBusy(btn, true, "Đang thêm...");
    try {
      const r = await vocabApi.importMany(SAMPLE_VOCABULARY);
      toast(r.added ? `Đã thêm ${r.added} từ vựng mẫu.` : "Dữ liệu mẫu đã có trong danh sách của bạn.", r.added ? "success" : "info");
    } catch (ex) { toast(ex.message, "error"); }
    setBusy(btn, false);
  });
  $("#wipe").addEventListener("click", async (e) => {
    const btn = e.currentTarget;
    const ok = await confirmDialog({ title: "Xóa toàn bộ từ vựng?", message: "Tất cả từ vựng, hình ảnh và tag của bạn sẽ bị xóa vĩnh viễn.", confirmLabel: "Xóa tất cả", danger: true });
    if (!ok) return;
    setBusy(btn, true, "Đang xóa...");
    try { await vocabApi.clearAll(); toast("Đã xóa toàn bộ từ vựng.", "success"); }
    catch (ex) { toast(ex.message, "error"); }
    setBusy(btn, false);
  });
}
