// Hook Google Auth tách riêng. Bản mock mở hộp thoại nhập tài khoản Google (demo);
// bản thật thay bằng popup OAuth của Google / Firebase.
import { openModal, toast } from "../../components/ui/feedback.js";
import { loginWithGoogle, isEmail } from "../../services/api/authApi.js";
import { setBusy, esc } from "../../lib/dom.js";
import { navigate } from "../../routes/router.js";

export function startGoogleAuth() {
  const m = openModal({
    title: "Tiếp tục với Google",
    iconName: "globe",
    body: `
      <p style="margin-bottom:14px">Bản demo chưa kết nối Google OAuth. Nhập tài khoản Google để mô phỏng đăng nhập.</p>
      <form id="g-form" novalidate style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label class="field__label" for="g-email">Email Google</label>
          <input class="input" id="g-email" type="email" autocomplete="email" placeholder="ban@gmail.com" /></div>
        <div class="field"><label class="field__label" for="g-name">Họ và tên <span class="opt">(nếu tài khoản mới)</span></label>
          <input class="input" id="g-name" type="text" autocomplete="name" placeholder="Nguyễn Văn A" /></div>
        <div class="field__error" id="g-err" hidden></div>
        <div class="modal__actions" style="margin-top:6px">
          <button type="button" class="btn btn--secondary" id="g-cancel">Hủy</button>
          <button type="submit" class="btn btn--solid" id="g-submit">Tiếp tục</button>
        </div>
      </form>`,
  });
  const f = m.el.querySelector("#g-form");
  const err = m.el.querySelector("#g-err");
  m.el.querySelector("#g-cancel").addEventListener("click", () => m.close());
  setTimeout(() => m.el.querySelector("#g-email").focus(), 30);
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = m.el.querySelector("#g-email").value;
    const name = m.el.querySelector("#g-name").value;
    if (!isEmail(email)) { err.textContent = "Vui lòng nhập email hợp lệ."; err.hidden = false; return; }
    err.hidden = true;
    const btn = m.el.querySelector("#g-submit");
    setBusy(btn, true, "Đang kết nối...");
    try {
      const { user, isNew } = await loginWithGoogle({ email, name });
      m.close();
      toast(isNew ? `Chào mừng ${user.name} đến với LingYu!` : `Chào mừng trở lại, ${user.name}!`, "success");
      navigate("/home");
    } catch (ex) {
      setBusy(btn, false);
      err.textContent = ex.message || "Không thể kết nối Google. Vui lòng thử lại.";
      err.hidden = false;
    }
  });
}
export { esc };
