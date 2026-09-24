# Prompt: Dựng LingYu Chinese bằng Next.js (deploy Vercel trước, chuyển VPS sau)

> Dán toàn bộ file này (hoặc câu "Thực hiện đúng theo `docs/prompts/nextjs-migration.md`")
> vào một session Claude Code mới trên repo `lingyu-chinese`.

---

## 1. Bối cảnh

Repo này hiện có:

- `web/`: web app **vanilla JS** (ES modules, hash router, không build), deploy lên GitHub Pages
  qua `.github/workflows/deploy-web.yml`. Toàn bộ dữ liệu đi qua `web/src/services/api/*`
  và hiện là **mock** (localStorage + IndexedDB). Đọc `web/README.md` trước tiên — nó mô tả
  route, chữ ký hàm API, luật chấm đáp án, giới hạn trường, luồng chia sẻ.
- `lib/` + `assets/`: app **Flutter** cho Bài 1 (luyện ngữ âm: Listening 16 câu, Blending 20 câu,
  audio `assets/audio/bai1/blending/q01–q20.mp3`).

Mục tiêu: dựng một web app **Next.js full-stack** thay thế bản mock, chạy tốt trên điện thoại,
**deploy lên Vercel trước**, và **chuyển sang VPS riêng sau này mà không phải sửa code**
(chỉ đổi biến môi trường + chạy Docker).

**Không dùng Supabase, Firebase hay bất kỳ BaaS nào.** Không dùng dịch vụ chỉ Vercel mới có.

## 2. Tech stack (bắt buộc)

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Runtime / PM | Node.js LTS, **pnpm** | Ghi `engines` + `packageManager` trong `package.json`. |
| Framework | **Next.js (bản ổn định mới nhất), App Router, TypeScript strict** | Chỉ dùng **Node runtime** (cấm `runtime = "edge"`). `output: "standalone"`. |
| UI | **Tailwind CSS v4 + shadcn/ui** (Radix), **lucide-react** | Map design tokens từ `web/src/styles/tokens.css` sang theme Tailwind (màu, radius, shadow, gradient). |
| Font | `next/font` (Inter, Noto Sans SC) | Tự host qua next/font, không gọi CDN lúc runtime. |
| Form / validate | **react-hook-form + Zod** | Schema Zod dùng chung cho form và server. |
| Data fetching | **Server Components + Server Actions**; **TanStack Query** cho chỗ cần cache/optimistic phía client | |
| Database | **PostgreSQL** | Vercel: **Neon** (chỉ dùng như Postgres tiêu chuẩn qua connection string). VPS: Postgres trong Docker. |
| ORM / migration | **Drizzle ORM + drizzle-kit**, driver **`pg`** (node-postgres) | **Không** dùng driver HTTP riêng của Neon (`@neondatabase/serverless`), để đổi DB chỉ cần đổi `DATABASE_URL`. Pool size lấy từ env. |
| Auth | **Better Auth** (tự host, lưu vào Postgres của mình qua Drizzle adapter) | Email + mật khẩu, plugin **email OTP**, Google OAuth, rate limit lưu trong DB (không cần Redis). |
| Email | Adapter `lib/email` với 3 driver: `resend` / `smtp` (nodemailer) / `console` | Vercel dùng Resend; VPS dùng Resend hoặc SMTP bất kỳ; dev dùng `console` hoặc Mailpit. |
| Lưu file | **S3-compatible** qua `@aws-sdk/client-s3` + presigned URL | Vercel: **Cloudflare R2**. VPS: giữ R2 hoặc **MinIO**. **Không** dùng Vercel Blob. Client upload thẳng lên bucket bằng presigned PUT (tránh giới hạn body 4.5MB của Vercel). |
| Tiếng Trung | **pinyin-pro** (gợi ý pinyin), **hanzi-writer** (thứ tự nét ở Bộ thủ) | Dữ liệu bộ thủ tĩnh port từ `web/src/services/data/*.js` sang TS. |
| PWA | **Serwist** (`@serwist/next`) | Manifest + icon lấy từ `web/manifest.webmanifest`, `web/src/assets/app/*`. Cache audio + shell. |
| Env | `src/env.ts` validate bằng Zod (hoặc `@t3-oss/env-nextjs`) | Build fail nếu thiếu biến bắt buộc. |
| Test | **Vitest** (unit), **Playwright** (e2e, có viewport iPhone + Android) | |
| Lint / format | ESLint (config của Next) + Prettier | |
| CI | GitHub Actions: install → lint → typecheck → test → build | Có service Postgres cho test cần DB. |
| Container | `Dockerfile` multi-stage (standalone, user non-root), `docker-compose.yml` | Có sẵn từ đầu để chuyển VPS lúc nào cũng được. |

Trước khi cài từng thư viện, **kiểm tra docs hiện hành** (WebFetch/WebSearch nếu có) cho Next.js,
Tailwind v4, shadcn/ui, Better Auth, Drizzle, Serwist, vì API các thư viện này đổi nhanh. Đừng code theo trí nhớ nếu chưa chắc.

## 3. Quy tắc portability (Vercel → VPS)

1. Mọi cấu hình qua biến môi trường. Có `.env.example` đầy đủ, có chú thích tiếng Việt, **không** chứa secret thật.
2. Cấm: Edge runtime, `@vercel/kv`, `@vercel/blob`, `@vercel/postgres`, Edge Config, và mọi API chỉ có trên Vercel.
   `@vercel/analytics` chỉ được dùng nếu bật bằng env và tắt được hoàn toàn.
3. Migration: `pnpm db:generate` (drizzle-kit) và `pnpm db:migrate` (script Node chạy migration, không cần drizzle-kit ở production).
   - Vercel: build command `pnpm db:migrate && pnpm build`.
   - Docker: entrypoint chạy migrate rồi mới `node server.js`.
4. Job định kỳ (dọn session/OTP hết hạn, thông báo cũ): route `/api/cron/*` bảo vệ bằng header `Authorization: Bearer $CRON_SECRET`.
   Vercel khai báo trong `vercel.json`; VPS gọi bằng crontab + curl (ghi sẵn lệnh trong docs).
5. `next/image`: cấu hình `remotePatterns` từ `S3_PUBLIC_URL`; trong Docker phải có `sharp`.
6. Có `/api/health` (kiểm tra kết nối DB) để làm healthcheck cho Docker/Caddy.
7. `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` lấy từ env, không hard-code domain.

Biến môi trường tối thiểu:
```
DATABASE_URL, DATABASE_POOL_MAX
BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
EMAIL_PROVIDER (resend|smtp|console), EMAIL_FROM, RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL, S3_FORCE_PATH_STYLE
CRON_SECRET
```

## 4. Cấu trúc thư mục

Tạo app mới trong **`web-next/`** ở gốc repo. **Không sửa, không xoá** `web/`, `lib/`, `assets/`,
`pubspec.yaml` và workflow GitHub Pages hiện có. Bản cũ vẫn chạy song song tới khi bản mới đủ tính năng.

```
web-next/
  src/
    app/
      (auth)/login, register, verify-email, verify-success, forgot-password
      (app)/home, vocabulary, vocabulary/new, vocabulary/[id]/edit,
            grammar, grammar/new, grammar/[id], grammar/[id]/edit,
            radicals, radicals/[num], review/setup, review/session, review/result,
            lessons/bai1 (+ listening, blending, result), settings
      api/auth/[...all], api/upload, api/health, api/cron/...
    components/ui (shadcn), components/layout (AppShell, Sidebar, BottomNav, TopBar, NotificationBell)
    features/<module>/  (components, actions.ts, queries.ts, schema.ts cho từng module)
    server/db/ (schema/*.ts, client.ts, migrate.ts), server/auth.ts, server/email/, server/storage.ts
    lib/ (grading.ts, pinyin.ts, fold.ts, ...)
    data/radicals.ts, data/radicalMap.ts, data/bai1/*.ts
    env.ts
  drizzle/ (migration SQL sinh ra)
  public/ (icons, audio/bai1/...)
  tests/unit, tests/e2e
  Dockerfile, docker-compose.yml, docker-compose.prod.yml, Caddyfile, .env.example, vercel.json
docs/DEPLOY.md
```

URL giữ **y hệt** route của bản cũ (bảng Routes trong `web/README.md`), nhưng dùng path thật thay cho hash.

## 5. Mô hình dữ liệu (Drizzle)

Lấy **đúng tên field, giới hạn độ dài, enum** từ code mock (`vocabApi.js`, `grammarApi.js`,
`reviewApi.js`, `vocabShareApi.js`, `notificationApi.js`, `radicalApi.js`, `authApi.js`). Tối thiểu có:

- Bảng của Better Auth: `user`, `session`, `account`, `verification` (+ bảng rate limit nếu dùng DB storage).
- `vocab`: userId, chữ Hán, pinyin, nghĩa Việt, note (≤ 200), imageKey, status (`learned` | `review`),
  isFavorite, radicals `integer[]`, timestamps. Index cho tìm kiếm theo user.
- `vocab_tag` (theo user, unique theo tên), `vocab_to_tag`.
- `grammar` (+ `sourceGrammarId`, `sourceOwnerName`), `grammar_example` (sortOrder),
  `grammar_tag`, `grammar_to_tag`, `grammar_bookmark`, `grammar_personal_note` (**tách bảng, không bao giờ được chia sẻ**).
- `grammar_share` (PENDING/ACCEPTED/REJECTED, importedGrammarId, acceptedAt/respondedAt).
- `vocab_share` (snapshot từ vựng dạng `jsonb`, tối đa 200 từ, trạng thái như trên).
- `notification` (type, payload jsonb, readAt).
- `review_session`: config jsonb, danh sách câu hỏi, đáp án, trạng thái, thời điểm bắt đầu/kết thúc.
  **Lưu phía server** để resume được khi refresh hoặc đổi thiết bị.
- `radical_known` (userId, số thứ tự bộ thủ).
- `lesson_progress` (userId, lessonId, section, điểm, lần làm) cho Bài 1.

Dữ liệu tĩnh (214 bộ thủ, `radicalMap` 7.733 chữ, câu hỏi Bài 1) để trong code TS, **không** đưa vào DB.

Mọi truy vấn phải lọc theo `userId` của session (kiểm tra quyền sở hữu phía server). Không tin `userId` gửi từ client.

## 6. Yêu cầu chức năng (port 1:1 từ bản mock)

UI **hoàn toàn tiếng Việt**, giữ nguyên câu chữ, thông báo lỗi, luồng màn hình của bản cũ.
Đọc code `web/src/features/*` để làm đúng hành vi; bản cũ là spec.

- **Auth**: đăng ký → OTP 6 số qua email (hết hạn 5 phút, gửi lại sau 60 giây, tối đa 5 lần nhập sai);
  đăng nhập (khoá 60 giây sau 5 lần sai); Google login; quên mật khẩu (không tiết lộ email có tồn tại hay không);
  đặt mật khẩu cho tài khoản Google; sửa tên. Mật khẩu tối thiểu 6 ký tự như bản cũ.
  Chỗ nào Better Auth không có sẵn thì tự bổ sung (hook, custom rule) và viết test.
- **Trang chủ**: thống kê giống `vocabApi.stats()`.
- **Từ vựng**: tìm kiếm (bỏ dấu, không phân biệt hoa thường, giống `fold()`), lọc theo tag/bộ thủ,
  sắp xếp, phân trang, chọn nhiều để xoá/gắn tag/đổi trạng thái, yêu thích, form thêm/sửa
  (ảnh ≤ 5MB upload qua presigned URL, tag, chọn bộ thủ theo tên tiếng Việt, gợi ý pinyin bằng pinyin-pro), chia sẻ từ vựng cho user khác.
- **Ôn tập**: setup (tag, số câu 5/10/20/30/50, chế độ meaning/hanzi/pinyin/mixed, hiện ảnh), làm bài, kết quả, resume.
  Luật chấm đặt trong `lib/grading.ts` và phải có **unit test đầy đủ**:
  - Nghĩa Việt: không phân biệt hoa/thường, chấp nhận từng nghĩa tách bằng `,` `;` `/`.
  - Chữ Hán: khớp chính xác (bỏ khoảng trắng).
  - Pinyin: chấp nhận dấu thanh hoặc số (`ni3 hao3` = `nǐ hǎo`), `v` = `ü`, bỏ khoảng trắng.
  - Chấm **ở server** (client không được biết đáp án trước khi nộp).
- **Ngữ pháp**: danh sách (tìm, lọc tag, sắp xếp, Đã lưu, Được chia sẻ), CRUD, ví dụ có thứ tự, quản lý tag
  (tạo/đổi tên/xoá), bookmark, ghi chú cá nhân, chia sẻ qua email → người nhận xem trước (`/grammar/:id?share=<id>`),
  chấp nhận (tạo bản copy riêng, giữ/không giữ tag, thêm tag) hoặc từ chối. Thông báo cho người gửi khi được chấp nhận.
- **Bộ thủ**: 214 bộ, tìm kiếm, lọc số nét, "Đã thuộc", trang chi tiết có chữ ví dụ + animation nét viết (hanzi-writer)
  + các từ vựng của user có bộ này.
- **Thông báo**: chuông trên topbar, số chưa đọc, đánh dấu đã đọc.
- **Bài 1 (ngữ âm)**: port từ Flutter (`lib/data/*`, `lib/state/*`, `lib/screens/*`) sang web: Listening 16 câu, Blending 20 câu,
  mỗi câu một màn, khoá đáp án sau khi chọn, phản hồi đúng/sai, progress, màn kết quả, Làm lại. Chép audio
  `assets/audio/bai1/blending/*.mp3` vào `web-next/public/audio/bai1/blending/`. Câu Listening chưa có audio thì nút phát
  bị vô hiệu kèm ghi chú, không crash. Lưu tiến độ vào `lesson_progress`.
- **Cài đặt**: hồ sơ, đổi/đặt mật khẩu, đăng xuất.

## 7. Mobile / responsive

- Mobile-first. Desktop có sidebar (rộng 280px như bản cũ); mobile có **bottom tab bar**.
- Màn tập trung (form thêm/sửa, đang làm bài) ẩn tab bar, nút Lưu dính ở đáy.
- Dialog trên mobile dạng bottom sheet (shadcn Drawer), trên desktop dạng Dialog.
- Bảng từ vựng trên mobile chuyển thành thẻ.
- Input ≥ 16px (tránh iOS tự zoom), vùng chạm ≥ 40px, `env(safe-area-inset-*)`, `viewport-fit=cover`, `theme-color`.
- Tham khảo `web/src/styles/mobile.css` để lấy đúng hành vi đã chốt.
- Test Playwright chạy ở ít nhất 2 viewport mobile + 1 desktop.

## 8. Bảo mật

- Validate mọi input ở server bằng Zod. Server Action/route nào cũng kiểm tra session.
- Presigned upload: giới hạn content-type (`image/jpeg|png|webp|gif`) và kích thước, key theo `userId/uuid`.
- Chỉ chia sẻ cho email đã có tài khoản; không lộ email tồn tại hay không ngoài phạm vi bản cũ đã chấp nhận.
- Ghi chú cá nhân và dữ liệu của user khác không bao giờ xuất hiện trong response của người khác (viết test cho điều này).
- Header bảo mật cơ bản (CSP hợp lý, `X-Content-Type-Options`, `Referrer-Policy`) trong `next.config`.

## 9. Local dev

- `docker-compose.yml` (dev): `postgres`, `minio` (+ tạo bucket), `mailpit`. App chạy bằng `pnpm dev` ngoài Docker.
- Nếu môi trường không có Docker (ví dụ container Claude Code trên web), cài PostgreSQL bằng apt hoặc dùng
  `DATABASE_URL` tôi cung cấp; để `EMAIL_PROVIDER=console` (OTP in ra log). Chưa có S3 thì upload ảnh báo lỗi thân thiện, phần còn lại vẫn chạy.
- Có script seed (`pnpm db:seed`) tạo 1 user demo + dữ liệu mẫu (lấy từ `sampleData.js`, `grammarSamples.js`).

## 10. Deploy

Viết `docs/DEPLOY.md` (tiếng Việt, từng bước, có lệnh copy-paste):

1. **Vercel**: tạo project, Root Directory = `web-next`, build command, tạo DB Neon (lấy **pooled** connection string),
   bucket R2 + CORS cho presigned PUT, API key Resend + xác thực domain, Google OAuth (redirect URI),
   khai báo env, cron trong `vercel.json`.
2. **Chuyển sang VPS**:
   - `docker-compose.prod.yml`: `app` (image build từ `Dockerfile`), `postgres` (volume), tuỳ chọn `minio`; **Caddy** làm reverse proxy + HTTPS tự động (`Caddyfile`).
   - Chuyển DB: `pg_dump` từ Neon → `pg_restore` vào Postgres trên VPS (ghi lệnh cụ thể, cả bước kiểm tra).
   - File: giữ R2 (không phải làm gì) hoặc `rclone sync` R2 → MinIO rồi đổi biến `S3_*`.
   - Đổi `BETTER_AUTH_URL`, redirect URI Google, DNS. Cron bằng crontab.
   - Script backup DB hằng ngày (`pg_dump` + giữ N bản).
3. Checklist trước khi cắt DNS.

## 11. Cách làm việc

Làm theo từng phase. **Sau mỗi phase**: chạy `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (phase có e2e thì chạy Playwright),
sửa hết lỗi, rồi **commit** với message rõ ràng (tiếng Anh) và push lên nhánh đang làm.

0. **Đọc & lên kế hoạch**: đọc `web/README.md`, toàn bộ `web/src`, `lib/`. Ghi kế hoạch ngắn + các chỗ mơ hồ vào `web-next/PLAN.md`.
   Nếu có quyết định lớn cần tôi chọn thì hỏi; còn lại tự chọn phương án hợp lý, ghi lý do vào PLAN.md và làm tiếp.
1. **Khung dự án**: Next.js, Tailwind + tokens, shadcn, font, env.ts, ESLint/Prettier, Vitest, Playwright, `/api/health`,
   Dockerfile, docker-compose, CI workflow (chỉ chạy khi `web-next/**` thay đổi).
2. **DB + Auth**: schema Drizzle, migration, Better Auth đủ các luồng ở mục 6, adapter email, trang auth.
3. **App shell + mobile layout**: sidebar, bottom nav, topbar, focus mode, route guard (middleware/layout kiểm tra session).
4. **Từ vựng** (+ upload ảnh S3).
5. **Ôn tập** (+ `lib/grading.ts` và unit test).
6. **Ngữ pháp** (+ chia sẻ + thông báo).
7. **Bộ thủ** + chia sẻ từ vựng + chuông thông báo.
8. **Bài 1** (port từ Flutter).
9. **Cài đặt, PWA (Serwist), security headers, cron, seed**.
10. **Tài liệu**: `web-next/README.md`, `docs/DEPLOY.md`, `.env.example`; cập nhật README gốc một đoạn ngắn trỏ tới bản mới.

## 12. Tiêu chí hoàn thành

- [ ] `pnpm build` thành công, CI xanh.
- [ ] Chạy được local với Postgres thật; mọi tính năng ở mục 6 dùng DB thật, không còn mock.
- [ ] Unit test cho grading, fold/tìm kiếm, validate schema, luồng share (kể cả việc không lộ ghi chú cá nhân).
- [ ] E2E: đăng ký → OTP (đọc từ log/console driver) → thêm từ → ôn tập → xem kết quả, trên viewport mobile.
- [ ] Không có import nào tới `@vercel/*` storage, không có `runtime = "edge"`, không có Supabase.
- [ ] `docker compose -f docker-compose.prod.yml up` chạy được app + Postgres (nếu môi trường có Docker; không có thì ít nhất `docker build` hợp lệ về cú pháp và ghi rõ trong báo cáo là chưa chạy thử).
- [ ] `docs/DEPLOY.md` đủ để một người không rành DevOps deploy lên Vercel, rồi chuyển sang VPS.
- [ ] `web/`, `lib/`, workflow GitHub Pages không bị thay đổi.

Cuối cùng, báo cáo ngắn: đã làm gì, chỗ nào chưa làm hoặc làm khác spec (và vì sao), những tài khoản/secret tôi cần tự tạo.
