import * as vocabApi from "../../services/api/vocabApi.js";
import { SAMPLE_VOCABULARY } from "../../services/api/sampleData.js";
import { getCurrentUser, updateProfile, logout, setPassword, passwordProblem, MIN_PASSWORD } from "../../services/api/authApi.js";
import { icon, leafDecor } from "../../components/ui/icons.js";
import { esc, setBusy, initials } from "../../lib/dom.js";
import { toast, confirmDialog } from "../../components/ui/feedback.js";
import { navigate } from "../../routes/router.js";

/** Phiên cũ (trước khi có hasPassword) → suy ra từ provider. */
const userHasPassword = (u) => (typeof u?.hasPassword === "boolean" ? u.hasPassword : u?.provider !== "google");

function passwordSection(u) {
  if (userHasPassword(u)) return "";
  return `<form id="pw-form" class="set-pw" novalidate>
    <div class="set-row__text"><strong>Tạo mật khẩu</strong><span>Tài khoản được tạo bằng Google nên chưa có mật khẩu. Tạo mật khẩu để có thể đăng nhập bằng email ${esc(u?.email)}.</span></div>
    <div class="field"><label class="field__label" for="new-pw">Mật khẩu mới</label>
      <input class="input" id="new-pw" type="password" autocomplete="new-password" placeholder="Ít nhất ${MIN_PASSWORD} ký tự" aria-describedby="new-pw-err" />
      <span class="field__error" id="new-pw-err" role="alert" hidden></span></div>
    <div class="field"><label class="field__label" for="new-pw2">Xác nhận mật khẩu</label>
      <input class="input" id="new-pw2" type="password" autocomplete="new-password" placeholder="Nhập lại mật khẩu" aria-describedby="new-pw2-err" />
      <span class="field__error" id="new-pw2-err" role="alert" hidden></span></div>
    <div><button type="submit" class="btn btn--solid" id="pw-save">${icon("lock")}Tạo mật khẩu</button></div>
  </form>`;
}

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
          <div class="field__hint" id="set-provider">${!userHasPassword(u) ? "Đăng nhập bằng Google (chưa có mật khẩu)" : u?.provider === "google" ? "Đăng nhập bằng Google hoặc email + mật khẩu" : "Đăng nhập bằng email"}</div></div></div>
        <form id="name-form" class="field" novalidate>
          <label class="field__label" for="set-name-input">Họ và tên</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <input class="input" id="set-name-input" value="${esc(u?.name)}" autocomplete="name" style="flex:1;min-width:200px" />
            <button type="submit" class="btn btn--solid" id="name-save">Lưu</button>
          </div>
          <span class="field__error" id="name-err" hidden></span>
        </form>
        ${passwordSection(u)}
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
  const pwForm = $("#pw-form");
  if (pwForm) {
    const setErr = (id, msg) => {
      const el = $("#" + id), er = $(`#${id}-err`);
      el.classList.toggle("is-invalid", !!msg); el.setAttribute("aria-invalid", msg ? "true" : "false");
      er.textContent = msg || ""; er.hidden = !msg;
    };
    ["new-pw", "new-pw2"].forEach((id) => $("#" + id).addEventListener("input", () => setErr(id, "")));
    pwForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = $("#pw-save");
      if (btn.dataset.busy === "1") return;
      const pw = $("#new-pw").value, pw2 = $("#new-pw2").value;
      const e1 = passwordProblem(pw);
      const e2 = !pw2 ? "Vui lòng nhập lại mật khẩu." : pw2 !== pw ? "Mật khẩu xác nhận không khớp." : "";
      setErr("new-pw", e1); setErr("new-pw2", e1 ? "" : e2);
      if (e1 || e2) { $(e1 ? "#new-pw" : "#new-pw2").focus(); return; }
      setBusy(btn, true, "Đang lưu...");
      try {
        await setPassword({ password: pw, confirm: pw2 });
        pwForm.remove();
        $("#set-provider").textContent = "Đăng nhập bằng Google hoặc email + mật khẩu";
        toast("Đã tạo mật khẩu. Giờ bạn có thể đăng nhập bằng email và mật khẩu.", "success");
      } catch (ex) {
        setBusy(btn, false);
        if (ex.field === "confirm") setErr("new-pw2", ex.message);
        else if (ex.field === "password") setErr("new-pw", ex.message);
        else toast(ex.message, "error");
      }
    });
  }
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
