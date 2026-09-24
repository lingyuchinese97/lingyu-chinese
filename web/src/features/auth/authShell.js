// Auth shell: branding/mascot trái, form card phải (theo reference Login/Register/Verify).
import { icon, leafDecor, googleIcon } from "../../components/ui/icons.js";
import { BRAND } from "../../components/layout/appShell.js";
import { esc } from "../../lib/dom.js";

function bubbles() {
  const list = [
    [4, 36, 90], [16, 48, 36], [12, 83, 44], [88, 30, 30], [90, 66, 78], [8, 62, 28], [80, 84, 22],
  ];
  return list.map(([x, y, s]) => `<span class="bubble" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px"></span>`).join("");
}
function leaves() {
  const list = [
    ["left:-10px;top:-12px", 120, 150, .8], ["left:34%;top:8%", -20, 70, .35], ["left:6%;top:24%", 60, 64, .55],
    ["left:40%;top:36%", -30, 80, .75], ["left:8%;top:58%", 20, 76, .7], ["left:38%;top:74%", -10, 70, .7],
    ["left:2%;top:74%", 40, 70, .7], ["right:-18px;top:66%", -60, 90, .7], ["right:10%;bottom:-10px", -20, 110, .6],
    ["left:45%;top:2%", 10, 90, .45],
  ];
  return list.map(([pos, rot, w, op]) => `<span class="decor" style="${pos};width:${w}px;opacity:${op};transform:rotate(${rot}deg)">${leafDecor}</span>`).join("");
}

export function renderAuthShell(root, cardHtml) {
  root.innerHTML = `
  <div class="auth">
    <div class="auth__wave" aria-hidden="true">
      <svg viewBox="0 0 1440 260" preserveAspectRatio="none"><path d="M0 150C220 90 420 200 700 150S1180 60 1440 120V260H0Z" fill="#DDEFFD" opacity=".7"/><path d="M0 200C260 150 520 230 820 190S1260 150 1440 180V260H0Z" fill="#E7F5FF"/></svg>
    </div>
    ${leaves()}
    <section class="auth-brand" aria-label="LingYu Chinese">
      <img class="auth-brand__logo" src="${BRAND.logo}" alt="LingYu Chinese — ${BRAND.slogan}" />
      <p class="auth-brand__quote hand" aria-hidden="true">Cùng LingYu<br/>khám phá thế giới tiếng Trung<br/>thật thú vị nhé!${icon("heart")}</p>
      <div class="auth-brand__mascot" aria-hidden="true">${bubbles()}<img src="${BRAND.mascot}" alt="" /></div>
      <div class="auth-brand__features">
        <span>${icon("book")}Học nhẹ nhàng</span><i></i>
        <span>${icon("chartBar")}Tiến bộ mỗi ngày</span><i></i>
        <span>${icon("heart")}Cùng bạn thật xa</span>
      </div>
    </section>
    <div class="auth-side">
      <label class="lang">${icon("globe")}<span class="sr-only">Ngôn ngữ</span>
        <select id="lang-select" aria-label="Ngôn ngữ giao diện"><option value="vi" selected>Tiếng Việt</option></select>
      </label>
      <div class="auth-card" id="auth-card">${cardHtml}</div>
    </div>
  </div>`;
  return root.querySelector("#auth-card");
}

export function afield({ id, label, type = "text", placeholder = "", iconName, autocomplete = "", password = false, value = "", inputmode = "" }) {
  return `
  <div class="afield-wrap">
    <div class="afield" data-field="${id}">
      ${icon(iconName, "afield__icon")}
      <div class="afield__body">
        <label for="${id}">${esc(label)}</label>
        <input id="${id}" name="${id}" type="${password ? "password" : type}" placeholder="${esc(placeholder)}" autocomplete="${autocomplete}" value="${esc(value)}" ${inputmode ? `inputmode="${inputmode}"` : ""} aria-describedby="${id}-err" />
      </div>
      ${password ? `<button type="button" class="afield__eye" data-eye="${id}" aria-label="Hiện mật khẩu" aria-pressed="false">${icon("eye")}</button>` : ""}
    </div>
    <div class="afield-error" id="${id}-err" role="alert" hidden></div>
  </div>`;
}

export function wirePasswordToggles(card) {
  card.querySelectorAll("[data-eye]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = card.querySelector("#" + btn.dataset.eye);
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      btn.setAttribute("aria-pressed", String(show));
      btn.setAttribute("aria-label", show ? "Ẩn mật khẩu" : "Hiện mật khẩu");
      btn.innerHTML = icon(show ? "eyeOff" : "eye");
    });
  });
}

export function setFieldError(card, id, msg) {
  const box = card.querySelector(`[data-field="${id}"]`);
  const err = card.querySelector(`#${id}-err`);
  const input = card.querySelector("#" + id);
  box?.classList.toggle("is-invalid", !!msg);
  input?.setAttribute("aria-invalid", msg ? "true" : "false");
  if (err) { err.textContent = msg || ""; err.hidden = !msg; }
}

export function formAlert(card, msg, type = "error") {
  const box = card.querySelector("#form-alert");
  if (!box) return;
  if (!msg) { box.hidden = true; box.innerHTML = ""; return; }
  box.className = `alert alert--${type}`;
  box.innerHTML = `${icon(type === "error" ? "alert" : "info")}<span>${msg}</span>`;
  box.hidden = false;
}

export function ctaButton(label, id, type = "submit") {
  return `<button type="${type}" class="btn btn--primary btn--auth btn--block" id="${id}"><span>${esc(label)}</span>${icon("arrowRight", "btn__arrow")}</button>`;
}

export function googleButton(label, id) {
  return `<button type="button" class="btn btn--google" id="${id}">${googleIcon}<span>${esc(label)}</span></button>`;
}
