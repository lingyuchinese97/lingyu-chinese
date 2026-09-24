# web-next — Kế hoạch

Spec: [`docs/prompts/nextjs-migration.md`](../docs/prompts/nextjs-migration.md). Bản cũ `web/` là spec giao diện + hành vi
(route, chữ ký API, luật chấm, giới hạn trường, luồng chia sẻ). `web/`, `lib/`, `assets/`, `pubspec.yaml`,
`.github/workflows/deploy-web.yml` **không bị sửa**.

## Phase

| # | Nội dung | Trạng thái |
|---|---|---|
| 0 | Đọc & lên kế hoạch (file này) | ✅ |
| 1 | Khung dự án: Next.js, Tailwind v4 + tokens, UI kit, font, env, pino, ESLint/Prettier, Vitest, Playwright, `/api/health`, trang lỗi, Docker, Caddy, CI, Dependabot | |
| 2 | DB (Drizzle, migration) + Better Auth (email + mật khẩu), role admin, CLI | |
| 3 | App shell (sidebar, bottom nav, topbar, focus mode), route guard, landing | |
| 4 | Từ vựng + storage adapter + nén ảnh + `/api/images/[id]` | |
| 5 | Ôn tập tự chọn + `lib/grading.ts` (chấm ở server) | |
| 6 | Ôn đến hạn (FSRS) | |
| 7 | Ngữ pháp + chia sẻ + thông báo | |
| 8 | Bộ thủ + chia sẻ từ vựng + chuông thông báo | |
| 9 | Bài học (schema Zod + màn hình chung + Bài 1) | |
| 10 | Cài đặt (xuất/nhập/xoá tài khoản) + Admin | |
| 11 | PWA, security headers, a11y, seed, e2e | |
| 12 | Tài liệu (README, `docs/DEPLOY.md`, `.env.example`, CHANGELOG) | |

Sau mỗi phase: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (+ e2e khi có) → CHANGELOG → commit → push.

## Môi trường làm việc (container Claude Code)

- Node 22, pnpm 10, **PostgreSQL 16 cài sẵn** (chạy cụm local bằng `initdb`/`pg_ctl` cho dev + test) → mọi tính năng thử với Postgres thật.
- Docker CLI có nhưng **daemon không chạy** → thử bật `dockerd`; nếu không được thì chỉ kiểm tra `Dockerfile`/compose hợp lệ và ghi rõ trong báo cáo.
- **Không truy cập được trang tài liệu** (nextjs.org, better-auth.com, orm.drizzle.team, serwist, ui.shadcn.com bị proxy chặn).
  → Đọc tài liệu đi kèm gói npm (README, `dist/docs`, file `.d.ts`) của **đúng phiên bản đã cài** thay cho docs online.

## Quyết định (tự chọn, kèm lý do)

1. **Phiên bản**: Next.js 16.x, React 19, Tailwind 4, Better Auth 1.7, Drizzle 0.45 + drizzle-kit 0.31, Zod 4, ts-fsrs 5, Vitest 5, Playwright 1.63.
2. **shadcn/ui**: registry `ui.shadcn.com` bị chặn nên không chạy được `shadcn add`. Component viết tay **theo đúng mẫu shadcn**
   (Radix primitives qua gói `radix-ui` + `class-variance-authority` + `tailwind-merge`, file trong `src/components/ui/`), Drawer dùng `vaul`
   như shadcn. Sau này có mạng có thể thay bằng bản CLI mà không đổi chỗ dùng.
3. **Font**: `next/font/local` với file woff2 từ `@fontsource-variable/inter` và `@fontsource/noto-sans-sc` (tự host, build không cần mạng,
   runtime không gọi CDN). Noto Sans SC dùng các subset theo `unicode-range` của fontsource để không tải cả bộ ~8MB.
4. **Dữ liệu nét hanzi-writer**: gói `hanzi-writer-data` có ~9.500 file JSON (~30MB). Thay vì chép hết vào `public/`, script
   `scripts/copy-hanzi-data.ts` (chạy ở `postinstall`/`prebuild`) chỉ chép các chữ cần cho trang Bộ thủ (214 bộ + chữ ví dụ) vào
   `public/hanzi-data/`, còn chữ khác (từ vựng của user) phục vụ qua `/api/hanzi/[char]` đọc từ gói. Vẫn tự host, không CDN.
5. **ID**: Better Auth dùng id dạng `text`; bảng của app dùng `uuid` (`gen_random_uuid()`) nhưng khoá ngoại tới `user.id` là `text`.
6. **Mật khẩu**: tối thiểu **8** ký tự (spec) thay cho 6 của bản cũ; vẫn chặn toàn khoảng trắng / khoảng trắng đầu-cuối như bản cũ.
7. **Chấm bài ở server**: câu hỏi ôn tập không gửi đáp án xuống client; server action `checkAnswer` chấm bằng `lib/grading.ts`.
8. **FSRS**: sai → `Again`; đúng → `Good` mặc định, người dùng có thể chọn Khó (`Hard`) / Được (`Good`) / Dễ (`Easy`) sau khi trả lời đúng.
   Ôn tự chọn **không** đổi lịch FSRS (chỉ ôn đến hạn mới cập nhật), để hai chế độ không lẫn nhau.
9. **Rate limit đăng nhập**: rate limiter của Better Auth với `storage: "database"` (bảng `rateLimit`), không cần Redis.
10. **Chuẩn hoá email**: trim + lowercase trước khi gọi Better Auth (Better Auth cũng lowercase).
11. **Ảnh**: nén ở trình duyệt bằng canvas → WebP (cạnh dài ≤ 1024px, q≈0.8, hạ dần chất lượng tới khi ≤ 300KB; > 1MB thì từ chối).
    Server kiểm tra magic bytes (webp/jpeg/png) + ≤ 1MB, lưu `bytea` qua `storage` adapter (driver `db`).
12. **Chia sẻ từ vựng**: snapshot jsonb (≤ 200 từ) không chứa ảnh; khi người nhận chấp nhận, server copy ảnh (bản mới thuộc người nhận)
    từ ảnh gốc nếu ảnh gốc còn. Ghi chú cá nhân của ngữ pháp **không** bao giờ nằm trong snapshot/preview.
13. **Middleware**: Next 16 đổi `middleware.ts` → `proxy.ts` (kiểm tra trong docs của gói khi cài). Route guard làm ở cả hai lớp:
    proxy kiểm tra cookie phiên (nhanh, chuyển hướng), **layout `(app)` kiểm tra session thật** bằng Better Auth (an toàn).
14. **PWA**: Serwist. Nếu `@serwist/next` chưa hỗ trợ Turbopack của Next 16 thì build bằng `next build --webpack` (ghi lại khi làm phase 11).
15. **Bài học**: nội dung trong `src/data/lessons/<lessonId>/`; loại câu `choice-audio` (nghe chọn đáp án) và `blend` (ghép âm). Bài 1 phần
    Nghe (16 câu) **chưa có audio** trong repo → nút phát bị vô hiệu + ghi chú, không crash (đúng spec).
16. **Admin**: `ADMIN_EMAILS` gán role admin khi đăng ký/đăng nhập (hook của Better Auth) + `pnpm user:make-admin`.

## Chỗ mơ hồ & cách xử lý

- "Gợi ý pinyin bằng pinyin-pro": khi nhập Hán tự mà ô Pinyin còn trống → hiện nút gợi ý (bấm để điền), không tự ghi đè.
- "Tiến độ bài học" trên Trang chủ: % section đã làm của các bài.
- Landing `/`: đã đăng nhập thì chuyển thẳng `/home`.
- Thông báo cho cả hai phía (spec 6.6): người nhận khi được chia sẻ; người gửi khi người nhận **chấp nhận hoặc từ chối**.
- Nhập dữ liệu (6.1): gộp theo khoá tự nhiên (từ vựng: Hán tự; ngữ pháp: tiêu đề; tag: tên) → trùng thì bỏ qua và đếm.
