// Hook Google Auth tách riêng. Bản mock mở hộp thoại nhập tài khoản Google (demo);
// bản thật thay bằng popup OAuth của Google / Firebase.
import { openModal, toast } from "../../components/ui/feedback.js";
import { loginWithGoogle, isEmail, isGmail } from "../../services/api/authApi.js";
import { setBusy, esc } from "../../lib/dom.js";
import { navigate } from "../../routes/router.js";

/** Lỗi của ô email Gmail, "" nếu hợp lệ. */
function gmailProblem(value) {
  const v = String(value || "").trim();
  if (!v) return "Vui lòng nhập email Gmail.";
  if (!isEmail(v)) return "Email không đúng định dạng.";
  if (!isGmail(v)) return "Vui lòng dùng tài khoản Gmail (@gmail.com).";
  return "";
}

/** prefillEmail: điền sẵn email (vd. khi màn đăng nhập phát hiện tài khoản Google). */
export function startGoogleAuth(prefillEmail) {
  const m = openModal({
    title: "Tiếp tục với Google",
    iconName: "globe",
    body: `
      <p style="margin-bottom:14px">Bản demo chưa kết nối Google OAuth. Nhập tài khoản Google để mô phỏng đăng nhập.</p>
      <form id="g-form" novalidate style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label class="field__label" for="g-email">Email Google</label>
          <input class="input" id="g-email" type="email" autocomplete="email" placeholder="ban@gmail.com" aria-describedby="g-err" /></div>
        <div class="field"><label class="field__label" for="g-name">Họ và tên <span class="opt">(nếu tài khoản mới)</span></label>
          <input class="input" id="g-name" type="text" autocomplete="name" placeholder="Nguyễn Văn A" /></div>
        <div class="field__error" id="g-err" role="alert" hidden></div>
        <div class="modal__actions" style="margin-top:6px">
          <button type="button" class="btn btn--secondary" id="g-cancel">Hủy</button>
          <button type="submit" class="btn btn--solid" id="g-submit">Tiếp tục</button>
        </div>
      </form>`,
  });
  const f = m.el.querySelector("#g-form");
  const err = m.el.querySelector("#g-err");
  m.el.querySelector("#g-cancel").addEventListener("click", () => m.close());
  const emailEl = m.el.querySelector("#g-email");
  if (typeof prefillEmail === "string") emailEl.value = prefillEmail;
  setTimeout(() => (emailEl.value ? m.el.querySelector("#g-submit") : emailEl).focus(), 30);
  const showErr = (msg) => {
    err.textContent = msg; err.hidden = !msg;
    emailEl.classList.toggle("is-invalid", !!msg);
    emailEl.setAttribute("aria-invalid", msg ? "true" : "false");
  };
  emailEl.addEventListener("input", () => showErr(""));
  emailEl.addEventListener("blur", () => { if (emailEl.value.trim()) showErr(gmailProblem(emailEl.value)); });
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailEl.value.trim();
    const name = m.el.querySelector("#g-name").value;
    const problem = gmailProblem(email);
    if (problem) { showErr(problem); emailEl.focus(); return; }
    showErr("");
    const btn = m.el.querySelector("#g-submit");
    setBusy(btn, true, "Đang kết nối...");
    try {
      const { user, isNew, linked } = await loginWithGoogle({ email, name });
      m.close();
      toast(isNew ? `Chào mừng ${user.name} đến với LingYu!`
        : linked ? `Đã liên kết Google với tài khoản ${user.email}.` : `Chào mừng trở lại, ${user.name}!`, "success");
      navigate("/home");
    } catch (ex) {
      setBusy(btn, false);
      showErr(ex.message || "Không thể kết nối Google. Vui lòng thử lại.");
    }
  });
}
export { esc };
