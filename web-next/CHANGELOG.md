# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), version theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### Added

- Khung dự án Next.js 16 (App Router, TypeScript strict, `output: "standalone"`), Tailwind v4 với design tokens của bản cũ,
  font tự host (Inter, Noto Sans SC, Dancing Script), `env.ts` (Zod), log pino, ESLint + Prettier, Vitest, Playwright.
- `/api/health` (kiểm tra DB), trang lỗi 404/500 tiếng Việt.
- `Dockerfile` multi-stage (non-root, migrate khi khởi động), `docker-compose.yml` (dev), `docker-compose.prod.yml` (app + Postgres + Caddy), `Caddyfile`.
- CI GitHub Actions (chỉ khi `web-next/**` đổi) và Dependabot.
