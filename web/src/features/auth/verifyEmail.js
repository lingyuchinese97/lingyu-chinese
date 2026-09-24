import { renderAuthShell, formAlert, ctaButton } from "./authShell.js";
import { verifyEmail, resendOtp, getPendingVerification } from "../../services/api/authApi.js";
import { setBusy, esc } from "../../lib/dom.js";
import { icon } from "../../components/ui/icons.js";
import { navigate } from "../../routes/router.js";
import { toast } from "../../components/ui/feedback.js";

const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function renderVerifyEmail(root) {
  let pending = getPendingVerification();
  if (!pending) { navigate("/register", { replace: true }); return; }

  const card = renderAuthShell(root, `
    <a class="auth-back" href="#/register">${icon("arrowLeft")}<span>Quay lại</span></a>
    <h1 class="auth-card__title">Xác thực email</h1>
    <p class="auth-card__sub" style="margin-bottom:0">Chúng tôi đã gửi mã xác thực gồm 6 số đến email</p>
    <div class="otp-email">${esc(pending.email)}</div>
    <form id="otp-form" novalidate style="display:flex;flex-direction:column;gap:18px">
      <fieldset style="border:0;padding:0;margin:0">
        <legend class="sr-only">Nhập mã xác thực 6 số</legend>
        <div class="otp" id="otp">
          ${Array.from({ length: 6 }, (_, i) => `<input type="text" inputmode="numeric" maxlength="1" autocomplete="${i === 0 ? "one-time-code" : "off"}" aria-label="Chữ số ${i + 1}" data-i="${i}" />`).join("")}
        </div>
      </fieldset>
      <p class="otp-timer" id="otp-timer" aria-live="polite"></p>
      <div id="form-alert" hidden></div>
      <div id="demo-note" hidden></div>
      ${ctaButton("Xác nhận", "otp-submit")}
    </form>
    <p class="otp-resend">Không nhận được mã?<button type="button" class="link-btn" id="resend-btn"></button></p>
  `);

  const boxes = [...card.querySelectorAll("#otp input")];
  const otpWrap = card.querySelector("#otp");
  const btn = card.querySelector("#otp-submit");
  const timer = card.querySelector("#otp-timer");
  const resend = card.querySelector("#resend-btn");
  const demo = card.querySelector("#demo-note");

  const code = () => boxes.map((b) => b.value).join("");
  const sync = () => {
    btn.disabled = code().length !== 6 || btn.dataset.busy === "1";
    otpWrap.classList.remove("is-invalid");
  };
  function showDemo() {
    if (!pending.demoCode) { demo.hidden = true; return; }
    demo.className = "alert alert--info demo-note";
    demo.innerHTML = `${icon("info")}<span>Chế độ demo (chưa gửi email thật): mã của bạn là <strong class="tabnum">${pending.demoCode}</strong></span>`;
    demo.hidden = false;
  }
  showDemo();

  function fillFrom(start, digits) {
    digits.split("").forEach((d, k) => { if (boxes[start + k]) boxes[start + k].value = d; });
    const next = Math.min(start + digits.length, 5);
    boxes[next].focus();
    sync();
  }
  boxes.forEach((b, i) => {
    b.addEventListener("input", () => {
      const digits = b.value.replace(/\D/g, "");
      if (!digits) { b.value = ""; sync(); return; }
      if (digits.length > 1) { fillFrom(i, digits.slice(0, 6 - i)); return; }
      b.value = digits;
      if (i < 5) boxes[i + 1].focus();
      sync();
      if (code().length === 6) btn.focus();
    });
    b.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !b.value && i > 0) { boxes[i - 1].value = ""; boxes[i - 1].focus(); sync(); e.preventDefault(); }
      if (e.key === "ArrowLeft" && i > 0) { boxes[i - 1].focus(); e.preventDefault(); }
      if (e.key === "ArrowRight" && i < 5) { boxes[i + 1].focus(); e.preventDefault(); }
      if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();
    });
    b.addEventListener("paste", (e) => {
      const digits = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
      if (!digits) return;
      e.preventDefault();
      fillFrom(digits.length === 6 ? 0 : i, digits);
    });
    b.addEventListener("focus", () => b.select());
  });
  boxes[0].focus();
  sync();

  function tick() {
    const now = Date.now();
    const left = pending.expiresAt - now;
    timer.classList.toggle("is-expired", left <= 0);
    timer.innerHTML = left > 0 ? `Mã sẽ hết hạn sau <strong class="tabnum">${fmt(left)}</strong>` : `<strong>Mã đã hết hạn.</strong> Hãy gửi lại mã mới.`;
    const cd = pending.resendAt - now;
    resend.disabled = cd > 0 || resend.dataset.busy === "1";
    if (resend.dataset.busy !== "1") resend.textContent = cd > 0 ? `Gửi lại mã (${Math.ceil(cd / 1000)}s)` : "Gửi lại mã";
  }
  tick();
  const iv = setInterval(tick, 1000);

  card.querySelector("#otp-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (code().length !== 6 || btn.dataset.busy === "1") return;
    formAlert(card, "");
    setBusy(btn, true, "Đang xác thực...");
    try {
      await verifyEmail(pending.email, code());
      navigate("/verify-success");
    } catch (ex) {
      setBusy(btn, false);
      otpWrap.classList.add("is-invalid");
      formAlert(card, esc(ex.message));
      if (ex.code === "no-pending") { setTimeout(() => navigate("/register"), 1600); return; }
      boxes.forEach((x) => (x.value = ""));
      boxes[0].focus();
      btn.disabled = true;
    }
  });

  resend.addEventListener("click", async () => {
    if (resend.disabled) return;
    resend.dataset.busy = "1";
    resend.disabled = true;
    resend.textContent = "Đang gửi...";
    try {
      pending = await resendOtp(pending.email);
      formAlert(card, "");
      boxes.forEach((x) => (x.value = ""));
      boxes[0].focus();
      showDemo();
      toast("Đã gửi mã xác thực mới.", "success");
    } catch (ex) {
      formAlert(card, esc(ex.message));
    } finally {
      resend.dataset.busy = "";
      tick();
      sync();
    }
  });

  return () => clearInterval(iv);
}
