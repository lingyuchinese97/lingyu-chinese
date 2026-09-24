import { renderAuthShell, ctaButton } from "./authShell.js";
import { getCurrentUser } from "../../services/api/authApi.js";
import { BRAND } from "../../components/layout/appShell.js";
import { icon } from "../../components/ui/icons.js";
import { esc } from "../../lib/dom.js";
import { navigate } from "../../routes/router.js";

export function stepper(active) {
  const steps = ["Tạo tài khoản", "Xác thực email", "Hoàn tất"];
  return `<ol class="stepper" aria-label="Tiến trình đăng ký" style="list-style:none;padding:0;margin:0 0 6px">
    ${steps.map((s, i) => {
      const n = i + 1;
      const state = n < active ? "is-done" : n === active ? "is-active" : "";
      return `${i ? `<li class="stepper__line ${n <= active ? "is-done" : ""}" aria-hidden="true"></li>` : ""}
      <li class="stepper__step ${state}" ${n === active ? 'aria-current="step"' : ""}>
        <span class="stepper__dot">${n < active ? icon("check") : n}</span>${s}</li>`;
    }).join("")}
  </ol>`;
}

export function renderVerifySuccess(root) {
  const user = getCurrentUser();
  const card = renderAuthShell(root, `
    ${stepper(3)}
    <div class="success-art" aria-hidden="true">
      <img src="${BRAND.mascot}" alt="" />
      <span class="success-art__badge">${icon("check")}</span>
    </div>
    <h1 class="auth-card__title" style="font-size:36px">Xác thực thành công!</h1>
    <p class="auth-center-text">Chào mừng <strong>${esc(user?.name || "bạn")}</strong> đến với LingYu Chinese.<br/>Tài khoản của bạn đã sẵn sàng — cùng bắt đầu học nhé!</p>
    ${ctaButton("Tiếp tục", "continue-btn", "button")}
  `);
  const btn = card.querySelector("#continue-btn");
  btn.focus();
  btn.addEventListener("click", () => navigate("/home"));
}
