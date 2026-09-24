// PageShell = Sidebar + TopUser + vùng nội dung. Dựng 1 lần, cập nhật theo route.
import { icon, leafDecor } from "../ui/icons.js";
import { esc, initials } from "../../lib/dom.js";
import { openMenu } from "../ui/feedback.js";
import { navigate } from "../../routes/router.js";
import { getCurrentUser, logout } from "../../services/api/authApi.js";

export const BRAND = {
  logo: "src/assets/brand/lingyu-logo.png",
  mascot: "src/assets/brand/lingyu-mascot.png",
  slogan: "Tiếng Trung gần hơn mỗi ngày",
};

// Menu hiện tại (theo handoff mục 1): chỉ 4 mục.
const NAV = [
  { key: "home", href: "#/home", label: "Trang chủ", icon: "home" },
  { key: "vocabulary", href: "#/vocabulary", label: "Từ vựng", icon: "book" },
  { key: "review", href: "#/review/setup", label: "Ôn tập", icon: "review" },
  { key: "settings", href: "#/settings", label: "Cài đặt", icon: "settings" },
];

let shell = null;

function leaf(style, rot = 0, w = 44) {
  return `<span class="decor decor-leaf" style="${style};width:${w}px;transform:rotate(${rot}deg)">${leafDecor}</span>`;
}

export function mountAppShell(root) {
  if (shell && root.contains(shell)) return shell;
  root.innerHTML = `
    <div class="app" id="app">
      <div class="app__bg-wave" aria-hidden="true"></div>
      <aside class="sidebar" id="sidebar" aria-label="Điều hướng chính">
        <a class="sidebar__logo" href="#/home" aria-label="LingYu Chinese — Trang chủ">
          <img src="${BRAND.logo}" alt="LingYu Chinese — ${BRAND.slogan}" />
        </a>
        <nav class="nav">
          ${NAV.map((n) => `<a class="nav__link" href="${n.href}" data-nav="${n.key}" title="${n.label}">${icon(n.icon)}<span>${n.label}</span></a>`).join("")}
        </nav>
        <div class="sidebar__mascot" aria-hidden="true">
          ${leaf("left:6px;top:-10px", -30, 40)}${leaf("right:10px;top:20px", 25, 36)}
          <img src="${BRAND.mascot}" alt="" />
          <p class="sidebar__quote hand" id="sidebar-quote"></p>
        </div>
        <div class="sidebar__tag" aria-hidden="true"><span style="width:30px;display:inline-block">${leafDecor}</span><span>Small steps,<br/>big future</span></div>
      </aside>
      <div class="main">
        <header class="topbar">
          <button type="button" class="icon-btn topbar__menu" id="nav-toggle" aria-label="Mở menu" aria-controls="sidebar" aria-expanded="false">${icon("menu")}</button>
          <button type="button" class="icon-btn bell" id="bell-btn" aria-label="Thông báo" aria-haspopup="menu">${icon("bell")}</button>
          <span class="topbar__divider" aria-hidden="true"></span>
          <button type="button" class="user-btn" id="user-btn" aria-haspopup="menu" aria-expanded="false">
            <span class="avatar" id="user-avatar"></span>
            <span class="user-btn__name" id="user-name"></span>
            ${icon("chevronDown")}
          </button>
          <div class="topbar__quote hand" id="top-quote" aria-hidden="true"></div>
        </header>
        <main class="page" id="page" tabindex="-1"></main>
        <footer class="page-footer" id="page-footer">
          <strong>LingYu Chinese</strong><span class="sep" aria-hidden="true"></span><span>${BRAND.slogan}</span>${icon("heart")}
        </footer>
      </div>
    </div>`;
  shell = root.querySelector("#app");

  const app = shell;
  const toggle = shell.querySelector("#nav-toggle");
  const closeNav = () => {
    app.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
    app.querySelector(".backdrop")?.remove();
  };
  toggle.addEventListener("click", () => {
    if (app.classList.contains("nav-open")) return closeNav();
    app.classList.add("nav-open");
    toggle.setAttribute("aria-expanded", "true");
    const bd = document.createElement("div");
    bd.className = "backdrop";
    bd.addEventListener("click", closeNav);
    app.appendChild(bd);
    shell.querySelector(".nav__link")?.focus();
  });
  shell.querySelectorAll(".nav__link").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && app.classList.contains("nav-open")) closeNav(); });

  shell.querySelector("#bell-btn").addEventListener("click", (e) => {
    openMenu(e.currentTarget, [{ html: `<div class="menu__empty">${icon("bell")}<div style="margin-top:6px">Bạn chưa có thông báo mới.</div></div>` }], { width: 260 });
  });
  shell.querySelector("#user-btn").addEventListener("click", (e) => {
    const u = getCurrentUser();
    openMenu(e.currentTarget, [
      { html: `<div class="menu__head"><strong>${esc(u?.name)}</strong><span>${esc(u?.email)}</span></div><div class="menu__sep"></div>` },
      { label: "Cài đặt", icon: "settings", onClick: () => navigate("/settings") },
      { label: "Đăng xuất", icon: "logout", danger: true, onClick: async () => { await logout(); navigate("/login"); } },
    ], { width: 260 });
  });
  return shell;
}

export function updateShell({ nav, quote, topQuote }) {
  const u = getCurrentUser();
  shell.querySelector("#user-avatar").textContent = initials(u?.name);
  shell.querySelector("#user-name").textContent = u?.name || "";
  shell.querySelectorAll(".nav__link").forEach((a) => {
    const active = a.dataset.nav === nav;
    a.classList.toggle("is-active", active);
    if (active) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  setSidebarQuote(quote);
  const tq = shell.querySelector("#top-quote");
  tq.innerHTML = topQuote ? `<span style="width:38px;display:inline-block">${leafDecor}</span><span>${topQuote}</span>` : "";
  const page = shell.querySelector("#page");
  page.innerHTML = "";
  window.scrollTo(0, 0);
  return page;
}

export function setSidebarQuote(quote) {
  const q = shell?.querySelector("#sidebar-quote");
  if (q) q.innerHTML = quote ? `${quote}${icon("heart", "heart")}` : "";
}

/** Breadcrumb: Back + section + chevron + current */
export function breadcrumb({ backHref, section, sectionHref, current }) {
  return `<nav class="crumb" aria-label="Breadcrumb">
    <a class="icon-btn crumb__back" href="${backHref}" aria-label="Quay lại">${icon("arrowLeft")}</a>
    <a href="${sectionHref}">${esc(section)}</a>
    ${icon("chevronRight", "crumb__chev")}
    <span class="crumb__current" aria-current="page" data-crumb-current>${esc(current)}</span>
  </nav>`;
}
