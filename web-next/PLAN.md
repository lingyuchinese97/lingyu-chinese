# web-next — Kế hoạch

Spec: [`docs/prompts/nextjs-migration.md`](../docs/prompts/nextjs-migration.md). Bản cũ `web/` là spec giao diện + hành vi
(route, chữ ký API, luật chấm, giới hạn trường, luồng chia sẻ). `web/`, `lib/`, `assets/`, `pubspec.yaml`,
`.github/workflows/deploy-web.yml` **không bị sửa**.

## Phase

| #   | Nội dung                                                                                                                                                          | Trạng thái |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 0   | Đọc & lên kế hoạch (file này)                                                                                                                                     | ✅         |
| 1   | Khung dự án: Next.js, Tailwind v4 + tokens, UI kit, font, env, pino, ESLint/Prettier, Vitest, Playwright, `/api/health`, trang lỗi, Docker, Caddy, CI, Dependabot | ✅         |
| 2   | DB (Drizzle, migration) + Better Auth (email + mật khẩu), role admin, CLI                                                                                         | ✅         |
| 3   | App shell (sidebar, bottom nav, topbar, focus mode), route guard, landing                                                                                         | ✅         |
| 4   | Từ vựng + storage adapter + nén ảnh + `/api/images/[id]`                                                                                                          | ✅         |
| 5   | Ôn tập tự chọn + `lib/grading.ts` (chấm ở server)                                                                                                                 | ✅         |
| 6   | Ôn đến hạn (FSRS)                                                                                                                                                 | ✅         |
| 7   | Ngữ pháp + chia sẻ + thông báo                                                                                                                                    |            | ✅  |
| 8   | Bộ thủ + chia sẻ từ vựng + chuông thông báo                                                                                                                       | ✅         |
| 9   | Bài học (schema Zod + màn hình chung + Bài 1)                                                                                                                     |            |
| 10  | Cài đặt (xuất/nhập/xoá tài khoản) + Admin                                                                                                                         |            |
| 11  | PWA, security headers, a11y, seed, e2e                                                                                                                            |            |
| 12  | Tài liệu (README, `docs/DEPLOY.md`, `.env.example`, CHANGELOG)                                                                                                    |            |

Sau mỗi phase: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (+ e2e khi có) → CHANGELOG → commit → push.

## Môi trường làm việc (container Claude Code)

- Node 22, pnpm 10, **PostgreSQL 16 cài sẵn** (chạy cụm local bằng `initdb`/`pg_ctl` cho dev + test) → mọi tính năng thử với Postgres thật.
- Docker: bật được `dockerd` trong container → **đã chạy thử** `docker compose -f docker-compose.prod.yml up` (app + Postgres + Caddy, HTTPS `localhost`, `/api/health` = 200, migrate tự chạy).
  Mạng của container build phải đi qua proxy có CA riêng nên khi thử local dùng một bản Dockerfile tạm (ngoài repo) thêm CA; `Dockerfile` trong repo giữ nguyên cho production.
- Playwright 1.63 cần Chromium mới hơn bản cài sẵn và không được tải trình duyệt → local chạy e2e với `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; CI cài bằng `playwright install`.
- **Không truy cập được trang tài liệu** (nextjs.org, better-auth.com, orm.drizzle.team, serwist, ui.shadcn.com bị proxy chặn).
  → Đọc tài liệu đi kèm gói npm (README, `dist/docs`, file `.d.ts`) của **đúng phiên bản đã cài** thay cho docs online.

## Quyết định (tự chọn, kèm lý do)

1. **Phiên bản**: Next.js 16.x, React 19, Tailwind 4, Better Auth 1.7, Drizzle 0.45 + drizzle-kit 0.31, Zod 4, ts-fsrs 5, Vitest 5, Playwright 1.63.
2. **shadcn/ui**: registry `ui.shadcn.com` bị chặn nên không chạy được `shadcn add`. Component viết tay **theo đúng mẫu shadcn**
   (Radix primitives qua gói `radix-ui` + `class-variance-authority` + `tailwind-merge`, file trong `src/components/ui/`), Drawer dùng `vaul`
   như shadcn. Sau này có mạng có thể thay bằng bản CLI mà không đổi chỗ dùng.
3. **Font**: tự host qua gói `@fontsource-variable/inter` và `@fontsource/noto-sans-sc` (import CSS trong `globals.css`; Next bundle
   các file woff2 vào `/_next/static`, build không cần mạng, runtime không gọi CDN). Không dùng `next/font/local` vì font chia
   **subset theo `unicode-range`** (Noto Sans SC ~1.800 file, Inter tách latin/vietnamese) — `next/font/local` không hỗ trợ
   gộp subset, còn nạp nguyên file thì Noto Sans SC nặng ~8MB. Trình duyệt chỉ tải subset chứa ký tự đang hiển thị.
4. **Dữ liệu nét hanzi-writer**: gói `hanzi-writer-data` có ~9.500 file JSON (~30MB). Thay vì chép hết vào `public/`, script
   mọi chữ phục vụ qua `/api/hanzi/[char]` đọc thẳng từ gói (chỉ nhận đúng 1 chữ Hán → không đọc được file khác; cache 1 năm),
   `outputFileTracingIncludes` chép dữ liệu vào bản standalone. Vẫn tự host, không CDN, không cần script chép file.
5. **ID**: mọi bảng dùng `uuid` — Better Auth cấu hình `advanced.database.generateId: "uuid"` nên `user.id` cũng là `uuid`, khoá ngoại cùng kiểu.
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

17. **E2E**: server e2e chạy `db:migrate` lên DB `<db>_e2e` rồi `next start`; mỗi test auth xoá bảng `rate_limit` trước (mọi request cùng IP),
    riêng một test kiểm tra lần thứ 6 bị chặn.

18. **Thanh tab dưới đáy** (điện thoại) có 5 mục: Trang chủ, Từ vựng, Ngữ pháp, Bài học, Ôn tập. Bộ thủ, Cài đặt, Quản trị
    nằm trong ngăn kéo ☰ (bản cũ để Bộ thủ ở tab bar, nhưng bản mới có thêm Bài học). Màn tập trung được xác định theo đường dẫn
    (`/…/new`, `/…/edit`, `/review/session`, `/lessons/[id]/[section]`).

19. **Tìm kiếm bỏ dấu ở SQL**: cột `vocab.pinyin_fold` (bỏ dấu + bỏ khoảng trắng) và `vocab.meaning_fold` tính bằng `fold()` mỗi lần ghi
    (migration `0001_vocab_search`), không cần extension `unaccent`. Tag tìm theo `fold(tên)` trong JS (số tag ít).
20. **Giới hạn thêm** (bản cũ không có): Hán tự ≤ 40, pinyin ≤ 120, nghĩa ≤ 200, ≤ 20 tag/từ — xem `src/lib/limits.ts`.
21. **Ảnh gửi cùng form** (FormData trong một Server Action) thay vì tải trước → không có ảnh mồ côi. Đổi ảnh = ảnh mới (id mới),
    ảnh cũ bị xoá; nhờ vậy `/api/images/[id]` cache `immutable` an toàn.
22. **Thanh thao tác hàng loạt** phase 4: Thêm tag, Đã thuộc, Cần ôn, Xoá. Nút "Ôn tập" thêm ở phase 5, "Chia sẻ" ở phase 8.

23. **Phiên ôn tập** ở bảng `review_session` (một phiên "active" mỗi người; tạo bài mới thì bài cũ chuyển "abandoned").
    Câu hỏi lưu snapshot của từ; client chỉ nhận phần đề bài, đáp án chỉ trả về sau khi chấm (`toClient` trong `features/review/service.ts`).
    "Thiết lập lần trước" lấy từ phiên ôn tự chọn gần nhất trong DB (thay localStorage của bản cũ) → đổi thiết bị vẫn nhớ.
24. **Đổi Khó/Được/Dễ**: lưu trạng thái thẻ trước khi chấm trong câu hỏi → đổi đánh giá thì tính lại từ trạng thái đó và thay log cũ
    (không cộng dồn `reps`). Ôn đến hạn tối đa 50 thẻ mỗi lượt.
25. **Ghi chú cá nhân của ngữ pháp** ở bảng riêng (`grammarPersonalNote`) → không bao giờ nằm trong truy vấn xem trước / chia sẻ.
    Người nhận chỉ xem trước qua `?share=<id>` khi lời mời còn "pending"; chấp nhận = tạo bản sao riêng (chọn giữ tag của người gửi),
    từ chối = không tạo gì. Xoá ngữ pháp thì các lời mời đang chờ bị huỷ.
26. **Thông báo**: bảng `notification` (payload jsonb: người gửi, tiêu đề, `shareId`); chuông tải lại khi đổi trang, khi quay lại tab
    và mỗi 60 giây (không cần WebSocket); mở chuông = đánh dấu đã đọc. Lời mời ngữ pháp xử lý được ngay trong chuông.

27. **Chia sẻ từ vựng**: bản chụp lưu cả `imageId` của người gửi nhưng người nhận xem trước chỉ thấy `hasImage` (không lộ id);
    chấp nhận thì server sao chép ảnh thành ảnh mới của người nhận. Từ trùng Hán tự với kho người nhận được bỏ qua.
    Kiểm tra người nhận dùng chung với Ngữ pháp (`features/sharing/recipient.ts`).
28. **Bộ thủ**: "Đã thuộc" lưu ở bảng `radical_known`. Trang chi tiết có khung nét viết (xem animation / luyện viết theo nét),
    bấm chữ ví dụ để xem cách viết chữ đó.

## Chỗ mơ hồ & cách xử lý

- "Gợi ý pinyin bằng pinyin-pro": khi nhập Hán tự mà ô Pinyin còn trống → hiện nút gợi ý (bấm để điền), không tự ghi đè.
- "Tiến độ bài học" trên Trang chủ: % section đã làm của các bài.
- Landing `/`: đã đăng nhập thì chuyển thẳng `/home`.
- Thông báo cho cả hai phía (spec 6.6): người nhận khi được chia sẻ; người gửi khi người nhận **chấp nhận hoặc từ chối**.
- Nhập dữ liệu (6.1): gộp theo khoá tự nhiên (từ vựng: Hán tự; ngữ pháp: tiêu đề; tag: tên) → trùng thì bỏ qua và đếm.
