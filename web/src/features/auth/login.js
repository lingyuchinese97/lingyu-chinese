import { renderAuthShell, afield, wirePasswordToggles, setFieldError, formAlert, ctaButton, googleButton } from "./authShell.js";
import { login, isEmail } from "../../services/api/authApi.js";
import { startGoogleAuth } from "./googleAuth.js";
import { setBusy, esc } from "../../lib/dom.js";
import { navigate } from "../../routes/router.js";
import { toast } from "../../components/ui/feedback.js";

export function renderLogin(root, { query }) {
  const card = renderAuthShell(root, `
    <h1 class="auth-card__title">Đăng nhập</h1>
    <p class="auth-card__sub">Chào mừng bạn trở lại với LingYu Chinese!</p>
    <form id="login-form" novalidate style="display:flex;flex-direction:column;gap:18px">
      <div id="form-alert" hidden></div>
      ${afield({ id: "email", label: "Email", type: "email", placeholder: "Nhập email của bạn", iconName: "mail", autocomplete: "email", value: query.email || "" })}
      ${afield({ id: "password", label: "Mật khẩu", placeholder: "Nhập mật khẩu của bạn", iconName: "lock", autocomplete: "current-password", password: true })}
      <div class="auth-row-end"><a class="auth-link" href="#/forgot-password">Quên mật khẩu?</a></div>
      ${ctaButton("Đăng nhập", "login-submit")}
    </form>
    <div class="divider">Hoặc</div>
    ${googleButton("Đăng nhập với Google", "google-btn")}
    <p class="auth-switch">Chưa có tài khoản? <a href="#/register">Đăng ký ngay</a></p>
  `);
  wirePasswordToggles(card);
  const form = card.querySelector("#login-form");
  const email = card.querySelector("#email");
  const pw = card.querySelector("#password");
  const btn = card.querySelector("#login-submit");
  (query.email ? pw : email).focus();

  email.addEventListener("input", () => setFieldError(card, "email", ""));
  // Báo lỗi định dạng ngay khi rời ô email, không đợi bấm Đăng nhập.
  email.addEventListener("blur", () => {
    const v = email.value.trim();
    if (v && !isEmail(v)) setFieldError(card, "email", "Email không đúng định dạng.");
  });
  pw.addEventListener("input", () => setFieldError(card, "password", ""));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (btn.dataset.busy === "1") return;
    formAlert(card, "");
    let ok = true;
    if (!email.value.trim()) { setFieldError(card, "email", "Vui lòng nhập email."); ok = false; }
    else if (!isEmail(email.value)) { setFieldError(card, "email", "Email không đúng định dạng."); ok = false; }
    if (!pw.value) { setFieldError(card, "password", "Vui lòng nhập mật khẩu."); ok = false; }
    if (!ok) { card.querySelector('[aria-invalid="true"]')?.focus(); return; }

    setBusy(btn, true, "Đang đăng nhập...");
    try {
      const { user } = await login({ email: email.value, password: pw.value });
      toast(`Chào mừng trở lại, ${user.name}!`, "success");
      navigate("/home");
    } catch (ex) {
      setBusy(btn, false);
      if (ex.code === "email-not-verified") {
        toast("Email chưa xác thực. Nhập mã chúng tôi vừa gửi nhé.", "info");
        navigate("/verify-email");
        return;
      }
      formAlert(card, esc(ex.message || "Không thể đăng nhập. Vui lòng thử lại."));
    }
  });
  card.querySelector("#google-btn").addEventListener("click", startGoogleAuth);
}
