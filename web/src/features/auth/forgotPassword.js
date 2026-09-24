import { renderAuthShell, afield, setFieldError, formAlert, ctaButton } from "./authShell.js";
import { requestPasswordReset, isEmail } from "../../services/api/authApi.js";
import { setBusy, esc } from "../../lib/dom.js";
import { icon } from "../../components/ui/icons.js";
import { toast } from "../../components/ui/feedback.js";

export function renderForgotPassword(root) {
  const card = renderAuthShell(root, "");

  function showForm(prefill = "") {
    card.innerHTML = `
      <a class="auth-back" href="#/login">${icon("arrowLeft")}<span>Quay lại đăng nhập</span></a>
      <h1 class="auth-card__title">Quên mật khẩu</h1>
      <p class="auth-card__sub">Nhập email bạn đã đăng ký. Chúng tôi sẽ gửi liên kết để bạn đặt lại mật khẩu.</p>
      <form id="fp-form" novalidate style="display:flex;flex-direction:column;gap:18px">
        <div id="form-alert" hidden></div>
        ${afield({ id: "email", label: "Email", type: "email", placeholder: "Nhập email của bạn", iconName: "mail", autocomplete: "email", value: prefill })}
        ${ctaButton("Gửi liên kết đặt lại mật khẩu", "fp-submit")}
      </form>
      <p class="auth-switch">Nhớ ra mật khẩu rồi? <a href="#/login">Đăng nhập</a></p>`;
    const email = card.querySelector("#email");
    const btn = card.querySelector("#fp-submit");
    email.focus();
    email.addEventListener("input", () => setFieldError(card, "email", ""));
    card.querySelector("#fp-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (btn.dataset.busy === "1") return;
      formAlert(card, "");
      if (!email.value.trim()) return setFieldError(card, "email", "Vui lòng nhập email."), email.focus();
      if (!isEmail(email.value)) return setFieldError(card, "email", "Email không đúng định dạng."), email.focus();
      setBusy(btn, true, "Đang gửi...");
      try {
        await requestPasswordReset(email.value);
        showSent(email.value.trim());
      } catch (ex) {
        setBusy(btn, false);
        formAlert(card, esc(ex.message || "Không thể gửi yêu cầu. Vui lòng thử lại."));
      }
    });
  }

  function showSent(address) {
    card.innerHTML = `
      <div class="success-icon" aria-hidden="true">${icon("mail")}</div>
      <h1 class="auth-card__title" style="font-size:36px">Kiểm tra email của bạn</h1>
      <p class="auth-center-text">Nếu <strong>${esc(address)}</strong> đã được đăng ký, bạn sẽ nhận được liên kết đặt lại mật khẩu trong vài phút. Hãy kiểm tra cả hộp thư rác nhé.</p>
      <div id="form-alert" hidden></div>
      <a class="btn btn--primary btn--auth btn--block" href="#/login?email=${encodeURIComponent(address)}"><span>Quay lại đăng nhập</span>${icon("arrowRight", "btn__arrow")}</a>
      <p class="auth-switch">Chưa nhận được email? <button type="button" class="link-btn" id="again">Gửi lại</button></p>`;
    card.querySelector("a.btn").focus();
    const again = card.querySelector("#again");
    again.addEventListener("click", async () => {
      again.disabled = true;
      try {
        await requestPasswordReset(address);
        toast("Đã gửi lại liên kết đặt lại mật khẩu.", "success");
      } catch (ex) {
        formAlert(card, esc(ex.message));
      } finally {
        again.disabled = false;
      }
    });
  }

  showForm();
}
