import { renderAuthShell, afield, wirePasswordToggles, setFieldError, formAlert, ctaButton, googleButton } from "./authShell.js";
import { register, isEmail } from "../../services/api/authApi.js";
import { startGoogleAuth } from "./googleAuth.js";
import { setBusy, esc } from "../../lib/dom.js";
import { navigate } from "../../routes/router.js";
import { openModal } from "../../components/ui/feedback.js";

const TERMS = {
  terms: {
    title: "Điều khoản sử dụng",
    body: `<ul style="padding-left:18px;margin:0;display:grid;gap:8px">
      <li>LingYu Chinese là công cụ hỗ trợ ôn tập tiếng Trung cho mục đích học tập cá nhân.</li>
      <li>Bạn chịu trách nhiệm với nội dung từ vựng, ghi chú và hình ảnh mình tải lên.</li>
      <li>Không sử dụng dịch vụ để phát tán nội dung vi phạm pháp luật hoặc bản quyền.</li>
      <li>Chúng tôi có thể cập nhật điều khoản và sẽ thông báo khi có thay đổi quan trọng.</li></ul>`,
  },
  privacy: {
    title: "Chính sách bảo mật",
    body: `<ul style="padding-left:18px;margin:0;display:grid;gap:8px">
      <li>Chúng tôi chỉ lưu thông tin cần thiết: họ tên, email và dữ liệu học tập của bạn.</li>
      <li>Mật khẩu được mã hoá, không lưu ở dạng văn bản thường.</li>
      <li>Không chia sẻ dữ liệu cá nhân cho bên thứ ba khi chưa có sự đồng ý của bạn.</li>
      <li>Bạn có thể yêu cầu xoá tài khoản và dữ liệu bất kỳ lúc nào.</li></ul>`,
  },
};

export function renderRegister(root) {
  const card = renderAuthShell(root, `
    <h1 class="auth-card__title">Tạo tài khoản</h1>
    <p class="auth-card__sub">Bắt đầu hành trình học tiếng Trung cùng LingYu!</p>
    <form id="reg-form" novalidate style="display:flex;flex-direction:column;gap:14px">
      <div id="form-alert" hidden></div>
      ${afield({ id: "name", label: "Họ và tên", placeholder: "Nhập họ và tên của bạn", iconName: "user", autocomplete: "name" })}
      ${afield({ id: "email", label: "Email", type: "email", placeholder: "Nhập email của bạn", iconName: "mail", autocomplete: "email" })}
      ${afield({ id: "password", label: "Mật khẩu", placeholder: "Tạo mật khẩu (ít nhất 6 ký tự)", iconName: "lock", autocomplete: "new-password", password: true })}
      ${afield({ id: "confirm", label: "Xác nhận mật khẩu", placeholder: "Nhập lại mật khẩu", iconName: "lock", autocomplete: "new-password", password: true })}
      <div>
        <div class="terms">
          <input type="checkbox" class="checkbox" id="terms" aria-describedby="terms-err" />
          <label for="terms">Tôi đồng ý với <button type="button" class="link-btn" data-doc="terms">Điều khoản sử dụng</button> và <button type="button" class="link-btn" data-doc="privacy">Chính sách bảo mật</button> của LingYu Chinese.</label>
        </div>
        <div class="afield-error" id="terms-err" role="alert" hidden></div>
      </div>
      ${ctaButton("Tạo tài khoản", "reg-submit")}
    </form>
    <div class="divider">Hoặc</div>
    ${googleButton("Đăng ký với Google", "google-btn")}
    <p class="auth-switch">Đã có tài khoản? <a href="#/login">Đăng nhập ngay</a></p>
  `);
  wirePasswordToggles(card);
  const $ = (id) => card.querySelector("#" + id);
  const btn = $("reg-submit");
  const termsErr = $("terms-err");
  $("name").focus();

  ["name", "email", "password", "confirm"].forEach((id) => $(id).addEventListener("input", () => setFieldError(card, id, "")));
  $("terms").addEventListener("change", () => { termsErr.hidden = true; });
  card.querySelectorAll("[data-doc]").forEach((b) => b.addEventListener("click", (e) => {
    e.preventDefault();
    const d = TERMS[b.dataset.doc];
    openModal({ title: d.title, body: d.body, iconName: "doc", wide: true, actions: [{ label: "Đã hiểu", variant: "btn--solid", value: true }] });
  }));

  card.querySelector("#reg-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.dataset.busy === "1") return;
    formAlert(card, "");
    const v = { name: $("name").value.trim(), email: $("email").value.trim(), password: $("password").value, confirm: $("confirm").value };
    let ok = true;
    const fail = (id, msg) => { setFieldError(card, id, msg); ok = false; };
    if (!v.name) fail("name", "Vui lòng nhập họ và tên.");
    if (!v.email) fail("email", "Vui lòng nhập email.");
    else if (!isEmail(v.email)) fail("email", "Email không đúng định dạng.");
    if (!v.password) fail("password", "Vui lòng tạo mật khẩu.");
    else if (v.password.length < 6) fail("password", "Mật khẩu cần ít nhất 6 ký tự.");
    if (!v.confirm) fail("confirm", "Vui lòng nhập lại mật khẩu.");
    else if (v.password && v.confirm !== v.password) fail("confirm", "Mật khẩu xác nhận không khớp.");
    if (!$("terms").checked) { termsErr.textContent = "Bạn cần đồng ý với Điều khoản sử dụng và Chính sách bảo mật."; termsErr.hidden = false; ok = false; }
    if (!ok) { card.querySelector('[aria-invalid="true"], #terms:not(:checked)')?.focus(); return; }

    setBusy(btn, true, "Đang tạo tài khoản...");
    try {
      await register(v);
      navigate("/verify-email");
    } catch (ex) {
      setBusy(btn, false);
      if (ex.field) { setFieldError(card, ex.field, ex.message); $(ex.field).focus(); }
      else formAlert(card, esc(ex.message || "Không thể tạo tài khoản. Vui lòng thử lại."));
    }
  });
  $("google-btn").addEventListener("click", startGoogleAuth);
}
