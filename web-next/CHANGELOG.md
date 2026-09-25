# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), version theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### Fixed

- Đăng ký/đăng nhập từ sai địa chỉ (vd `http://` thay vì `https://`) báo rõ nguyên nhân thay vì "Có lỗi xảy ra".

### Added

- Trang giới thiệu làm lại theo thiết kế mới: tiêu đề một màu, nút có icon, mascot lớn với lá bay, 5 ô Từ vựng / Ôn tập / Ngữ pháp / Bộ thủ / Luyện tập; logo nền trong suốt.
- Logo chỉ có chữ (`lingyu-wordmark.png`, nền trong suốt) dùng ở trang giới thiệu và trang đăng nhập/đăng ký trên desktop — bên cạnh đã có mascot lớn.
- `vercel.json` cố định Framework Preset = Next.js và lệnh build `pnpm db:migrate && pnpm build`.

- Khung dự án Next.js 16 (App Router, TypeScript strict, `output: "standalone"`), Tailwind v4 với design tokens của bản cũ,
  font tự host (Inter, Noto Sans SC, Dancing Script), `env.ts` (Zod), log pino, ESLint + Prettier, Vitest, Playwright.
- `/api/health` (kiểm tra DB), trang lỗi 404/500 tiếng Việt.
- `Dockerfile` multi-stage (non-root, migrate khi khởi động), `docker-compose.yml` (dev), `docker-compose.prod.yml` (app + Postgres + Caddy), `Caddyfile`.
- CI GitHub Actions (chỉ khi `web-next/**` đổi) và Dependabot.
- Schema Postgres (Drizzle, 23 bảng) + migration `drizzle/0000_init.sql`; `pnpm db:migrate`.
- Đăng ký / đăng nhập bằng email + mật khẩu (Better Auth): mật khẩu ≥ 8 ký tự, kiểm tra lại ở server, email chuẩn hoá,
  lỗi đăng nhập chung "Email hoặc mật khẩu không đúng", rate limit lưu trong DB (5 lần/phút), cookie `httpOnly` + `sameSite=lax`.
- Role `user`/`admin` (`ADMIN_EMAILS`), khoá tài khoản chặn đăng nhập; CLI `pnpm user:reset-password <email>`, `pnpm user:make-admin <email>`.
- Trang `/login`, `/register` theo giao diện bản cũ (thương hiệu + mascot, ẩn trên mobile), "Quên mật khẩu?" → liên hệ quản trị viên.
- Bảo vệ khu vực `(app)` hai lớp: `proxy.ts` kiểm tra nhanh cookie (chuyển `/login?next=...`), layout kiểm tra session thật.
- Khung app theo giao diện cũ: sidebar 280px (thu gọn còn icon ở 1024–1279px, ngăn kéo ☰ trên tablet/điện thoại),
  topbar (chuông, menu tài khoản có Cài đặt/Đăng xuất), thanh tab dưới đáy trên điện thoại, màn tập trung ẩn tab bar.
- Landing `/` giới thiệu + nút Đăng ký/Đăng nhập (đã đăng nhập thì vào thẳng `/home`).
