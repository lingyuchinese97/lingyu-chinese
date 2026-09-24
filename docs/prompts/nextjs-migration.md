# Prompt: Dựng LingYu Chinese bằng Next.js (phase đầu: chỉ dịch vụ miễn phí, deploy được lên VPS)

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

Mục tiêu: dựng một web app **Next.js full-stack** thay thế bản mock, chạy tốt trên điện thoại.

Ràng buộc của phase đầu:

1. **Chỉ dùng dịch vụ bên thứ ba miễn phí, không cần thẻ thanh toán**: Vercel Hobby (hosting), Neon Free (Postgres).
   Ngoài ra không phụ thuộc dịch vụ ngoài nào khác: **không** gửi email, **không** OAuth, **không** object storage, **không** Redis.
2. **Deploy được lên VPS** chỉ bằng Docker Compose (app + Postgres + Caddy), **không sửa code**, chỉ đổi biến môi trường.
3. **Không dùng Supabase, Firebase hay bất kỳ BaaS nào.** Không dùng dịch vụ chỉ Vercel mới có.

## 2. Tech stack (bắt buộc)

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Runtime / PM | Node.js LTS, **pnpm** | Ghi `engines` + `packageManager` trong `package.json`. |
| Framework | **Next.js (bản ổn định mới nhất), App Router, TypeScript strict** | Chỉ dùng **Node runtime** (cấm `runtime = "edge"`). `output: "standalone"`. |
| UI | **Tailwind CSS v4 + shadcn/ui** (Radix), **lucide-react** | Map design tokens từ `web/src/styles/tokens.css` sang theme Tailwind (màu, radius, shadow, gradient). |
| Font | `next/font` (Inter, Noto Sans SC) | Tự host qua next/font, không gọi CDN lúc runtime. |
| Form / validate | **react-hook-form + Zod** | Schema Zod dùng chung cho form và server. |
| Data fetching | **Server Components + Server Actions**; **TanStack Query** cho chỗ cần cache/optimistic phía client | |
| Database | **PostgreSQL** | Vercel: **Neon Free** (chỉ dùng như Postgres tiêu chuẩn qua connection string). VPS: Postgres trong Docker. |
| ORM / migration | **Drizzle ORM + drizzle-kit**, driver **`pg`** (node-postgres) | **Không** dùng driver HTTP riêng của Neon (`@neondatabase/serverless`), để đổi DB chỉ cần đổi `DATABASE_URL`. Pool size lấy từ env. |
| Auth | **Better Auth** (thư viện mã nguồn mở, tự host, lưu vào Postgres qua Drizzle adapter) | **Chỉ email + mật khẩu**, không xác thực email, không OAuth. Rate limit lưu trong DB. |
| Ảnh | Lưu **trong Postgres** (`bytea`) qua một storage adapter | Client nén ảnh trước khi upload (xem mục 6). Adapter có interface để sau này thêm driver S3 mà không sửa code gọi. |
| Tiếng Trung | **pinyin-pro** (gợi ý pinyin), **hanzi-writer** (thứ tự nét ở Bộ thủ) | Dữ liệu nét của hanzi-writer phải **tự host** trong `public/` (không tải từ CDN lúc runtime). Dữ liệu bộ thủ tĩnh port từ `web/src/services/data/*.js` sang TS. |
| PWA | **Serwist** (`@serwist/next`) | Manifest + icon lấy từ `web/manifest.webmanifest`, `web/src/assets/app/*`. Cache audio + shell. |
| Env | `src/env.ts` validate bằng Zod | Build fail nếu thiếu biến bắt buộc. |
| Test | **Vitest** (unit), **Playwright** (e2e, có viewport iPhone + Android) | |
| Lint / format | ESLint (config của Next) + Prettier | |
| CI | GitHub Actions: install → lint → typecheck → test → build | Có service Postgres cho test cần DB. |
| Container | `Dockerfile` multi-stage (standalone, user non-root), `docker-compose.yml`, `docker-compose.prod.yml`, `Caddyfile` | Có sẵn từ đầu. |

Trước khi cài từng thư viện, **kiểm tra docs hiện hành** (WebFetch/WebSearch nếu có) cho Next.js,
Tailwind v4, shadcn/ui, Better Auth, Drizzle, Serwist, vì API các thư viện này đổi nhanh. Đừng code theo trí nhớ nếu chưa chắc.

## 3. Quy tắc portability (Vercel ↔ VPS)

1. Mọi cấu hình qua biến môi trường. Có `.env.example` đầy đủ, có chú thích tiếng Việt, **không** chứa secret thật.
2. Cấm: Edge runtime, `@vercel/*` (kv, blob, postgres, edge-config, analytics, functions), cron của Vercel, và mọi API chỉ có trên Vercel.
3. Migration: `pnpm db:generate` (drizzle-kit) và `pnpm db:migrate` (script Node chạy migration, không cần drizzle-kit ở production).
   - Vercel: build command `pnpm db:migrate && pnpm build`.
   - Docker: entrypoint chạy migrate rồi mới `node server.js`.
4. `next/image` không cần cấu hình domain ngoài (ảnh phục vụ từ chính app). Trong Docker phải có `sharp`.
5. Có `/api/health` (kiểm tra kết nối DB) để làm healthcheck cho Docker/Caddy.
6. `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL` lấy từ env, không hard-code domain.
7. Không có job định kỳ ở phase đầu. Session hết hạn để Better Auth tự xử lý.

Biến môi trường (chỉ bấy nhiêu):
```
DATABASE_URL, DATABASE_POOL_MAX
BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL
```

## 4. Cấu trúc thư mục

Tạo app mới trong **`web-next/`** ở gốc repo. **Không sửa, không xoá** `web/`, `lib/`, `assets/`,
`pubspec.yaml` và workflow GitHub Pages hiện có. Bản cũ vẫn chạy song song tới khi bản mới đủ tính năng.

```
web-next/
  src/
    app/
      (auth)/login, register
      (app)/home, vocabulary, vocabulary/new, vocabulary/[id]/edit,
            grammar, grammar/new, grammar/[id], grammar/[id]/edit,
            radicals, radicals/[num], review/setup, review/session, review/result,
            lessons/bai1 (+ listening, blending, result), settings
      api/auth/[...all], api/images/[id], api/health
    components/ui (shadcn), components/layout (AppShell, Sidebar, BottomNav, TopBar, NotificationBell)
    features/<module>/  (components, actions.ts, queries.ts, schema.ts cho từng module)
    server/db/ (schema/*.ts, client.ts, migrate.ts), server/auth.ts, server/storage/ (index.ts, db.ts)
    lib/ (grading.ts, pinyin.ts, fold.ts, image-compress.ts, ...)
    data/radicals.ts, data/radicalMap.ts, data/bai1/*.ts
    env.ts
  scripts/ (seed.ts, reset-password.ts)
  drizzle/ (migration SQL sinh ra)
  public/ (icons, audio/bai1/..., hanzi-writer data)
  tests/unit, tests/e2e
  Dockerfile, docker-compose.yml, docker-compose.prod.yml, Caddyfile, .env.example
docs/DEPLOY.md
```

URL giữ **y hệt** route của bản cũ (bảng Routes trong `web/README.md`), nhưng dùng path thật thay cho hash.
Các route `/verify-email`, `/verify-success`, `/forgot-password` **bỏ** ở phase đầu (xem mục 6).

## 5. Mô hình dữ liệu (Drizzle)

Lấy **đúng tên field, giới hạn độ dài, enum** từ code mock (`vocabApi.js`, `grammarApi.js`,
`reviewApi.js`, `vocabShareApi.js`, `notificationApi.js`, `radicalApi.js`). Tối thiểu có:

- Bảng của Better Auth: `user`, `session`, `account`, `verification` (+ bảng rate limit khi dùng DB storage).
- `image`: id (uuid), userId, mime, `bytea` data, size, width, height, createdAt.
- `vocab`: userId, chữ Hán, pinyin, nghĩa Việt, note (≤ 200), imageId (FK → `image`, nullable), status (`learned` | `review`),
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

## 6. Yêu cầu chức năng (port từ bản mock)

UI **hoàn toàn tiếng Việt**, giữ nguyên câu chữ, thông báo lỗi, luồng màn hình của bản cũ.
Đọc code `web/src/features/*` để làm đúng hành vi; bản cũ là spec, **trừ phần Auth đã đơn giản hoá dưới đây**.

- **Auth (đơn giản hoá)**:
  - **Đăng ký**: form gồm Tên hiển thị, Email, Mật khẩu, Xác nhận mật khẩu.
    Validate bằng Zod ở cả client và server: email hợp lệ (chuẩn hoá lowercase + trim), mật khẩu tối thiểu 8 ký tự,
    xác nhận mật khẩu phải khớp, email đã tồn tại thì báo lỗi rõ ràng. Đăng ký xong **đăng nhập luôn** và chuyển về `/home`.
  - **Đăng nhập**: email + mật khẩu, có "Hiện/ẩn mật khẩu". Rate limit đăng nhập sai bằng rate limiter của Better Auth
    (lưu trong DB, không cần Redis); thông báo lỗi chung "Email hoặc mật khẩu không đúng".
  - **Đăng xuất**.
  - **Không có**: xác thực email/OTP, Google login, gửi email, quên mật khẩu qua email.
    Thay "Quên mật khẩu" bằng dòng chữ "Liên hệ quản trị viên để đặt lại mật khẩu" và script admin
    `pnpm user:reset-password <email>` (hỏi mật khẩu mới từ stdin, hash đúng cách của Better Auth).
  - Code auth để gọn trong `server/auth.ts` + `features/auth/*`, để sau này bật thêm xác thực email hay OAuth mà không phải sửa chỗ khác.
- **Trang chủ**: thống kê giống `vocabApi.stats()`.
- **Từ vựng**: tìm kiếm (bỏ dấu, không phân biệt hoa thường, giống `fold()`), lọc theo tag/bộ thủ,
  sắp xếp, phân trang, chọn nhiều để xoá/gắn tag/đổi trạng thái, yêu thích, form thêm/sửa
  (tag, chọn bộ thủ theo tên tiếng Việt, gợi ý pinyin bằng pinyin-pro), chia sẻ từ vựng cho user khác.
  - **Ảnh**: người dùng chọn ảnh tối đa 5MB như bản cũ. **Trình duyệt nén lại trước khi gửi** (canvas → WebP, cạnh dài tối đa 1024px,
    chất lượng ~0.8; mục tiêu ≤ 300KB, từ chối nếu vẫn > 1MB). Server kiểm tra lại mime bằng magic bytes + kích thước, rồi lưu qua storage adapter.
    Ảnh phục vụ ở `/api/images/[id]`: kiểm tra quyền (chủ ảnh), header `Cache-Control: private, max-age=31536000, immutable`.
    Xoá từ vựng thì xoá ảnh. Khi người nhận chấp nhận chia sẻ từ vựng có ảnh thì copy ảnh sang user nhận.
- **Ôn tập**: setup (tag, số câu 5/10/20/30/50, chế độ meaning/hanzi/pinyin/mixed, hiện ảnh), làm bài, kết quả, resume.
  Luật chấm đặt trong `lib/grading.ts` và phải có **unit test đầy đủ**:
  - Nghĩa Việt: không phân biệt hoa/thường, chấp nhận từng nghĩa tách bằng `,` `;` `/`.
  - Chữ Hán: khớp chính xác (bỏ khoảng trắng).
  - Pinyin: chấp nhận dấu thanh hoặc số (`ni3 hao3` = `nǐ hǎo`), `v` = `ü`, bỏ khoảng trắng.
  - Chấm **ở server** (client không được biết đáp án trước khi nộp).
- **Ngữ pháp**: danh sách (tìm, lọc tag, sắp xếp, Đã lưu, Được chia sẻ), CRUD, ví dụ có thứ tự, quản lý tag
  (tạo/đổi tên/xoá), bookmark, ghi chú cá nhân, chia sẻ cho **email của tài khoản đã có trong hệ thống** → người nhận xem trước
  (`/grammar/:id?share=<id>`), chấp nhận (tạo bản copy riêng, giữ/không giữ tag, thêm tag) hoặc từ chối.
  Thông báo **trong app** cho người nhận và cho người gửi khi được chấp nhận (không gửi email).
- **Bộ thủ**: 214 bộ, tìm kiếm, lọc số nét, "Đã thuộc", trang chi tiết có chữ ví dụ + animation nét viết (hanzi-writer)
  + các từ vựng của user có bộ này.
- **Thông báo**: chuông trên topbar, số chưa đọc, đánh dấu đã đọc.
- **Bài 1 (ngữ âm)**: port từ Flutter (`lib/data/*`, `lib/state/*`, `lib/screens/*`) sang web: Listening 16 câu, Blending 20 câu,
  mỗi câu một màn, khoá đáp án sau khi chọn, phản hồi đúng/sai, progress, màn kết quả, Làm lại. Chép audio
  `assets/audio/bai1/blending/*.mp3` vào `web-next/public/audio/bai1/blending/`. Câu Listening chưa có audio thì nút phát
  bị vô hiệu kèm ghi chú, không crash. Lưu tiến độ vào `lesson_progress`.
- **Cài đặt**: sửa tên, đổi mật khẩu (mật khẩu hiện tại + mật khẩu mới + xác nhận), đăng xuất.

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
- Mật khẩu hash bằng cơ chế mặc định của Better Auth; cookie session `httpOnly`, `secure` khi chạy HTTPS, `sameSite=lax`.
- Upload ảnh: giới hạn mime (`image/webp|jpeg|png`), kiểm tra magic bytes, giới hạn kích thước ở server
  (đặt `serverActions.bodySizeLimit` vừa đủ, ví dụ `"2mb"`).
- Chỉ chia sẻ cho email đã có tài khoản. Ghi chú cá nhân, ảnh và dữ liệu của user khác không bao giờ xuất hiện trong response
  của người khác (viết test cho điều này).
- Header bảo mật cơ bản (CSP hợp lý, `X-Content-Type-Options`, `Referrer-Policy`) trong `next.config`.

## 9. Local dev

- `docker-compose.yml` (dev): chỉ `postgres`. App chạy bằng `pnpm dev` ngoài Docker.
- Nếu môi trường không có Docker (ví dụ container Claude Code trên web), cài PostgreSQL bằng apt hoặc dùng `DATABASE_URL` tôi cung cấp.
- Có script seed (`pnpm db:seed`) tạo 1 user demo + dữ liệu mẫu (lấy từ `sampleData.js`, `grammarSamples.js`).

## 10. Deploy

Viết `docs/DEPLOY.md` (tiếng Việt, từng bước, có lệnh copy-paste):

1. **Vercel Hobby + Neon Free** (đều miễn phí, không cần thẻ):
   tạo project Vercel từ repo GitHub, Root Directory = `web-next`, build command `pnpm db:migrate && pnpm build`;
   tạo project Neon, lấy **pooled** connection string; khai báo 4 biến env; tạo `BETTER_AUTH_SECRET` bằng `openssl rand -base64 32`.
   Ghi chú giới hạn: Vercel Hobby chỉ cho dự án phi thương mại; Neon Free có giới hạn dung lượng
   (kiểm tra con số hiện hành trên trang Neon) → giải thích vì sao ảnh được nén nhỏ.
2. **Chạy trên VPS** (có thể làm ngay từ đầu thay cho Vercel):
   - `docker-compose.prod.yml`: `app` (build từ `Dockerfile`), `postgres` (volume, không mở port ra ngoài), `caddy`
     (reverse proxy + HTTPS tự động qua Let's Encrypt, `Caddyfile` chỉ cần đổi domain).
   - Hướng dẫn: cài Docker, clone repo, tạo `.env`, `docker compose -f docker-compose.prod.yml up -d --build`, cập nhật phiên bản mới.
   - Chuyển dữ liệu từ Neon: `pg_dump` → `pg_restore` vào Postgres trên VPS (lệnh cụ thể + bước kiểm tra). Ảnh nằm trong DB nên đi theo luôn.
   - Đổi `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, DNS.
   - Script backup DB hằng ngày (`pg_dump` + giữ N bản, chạy bằng crontab).
3. Checklist trước khi cắt DNS.
4. Mục "Sau phase đầu" (chỉ ghi hướng dẫn, **không** code): bật xác thực email/quên mật khẩu (cần dịch vụ email),
   Google login, chuyển ảnh sang S3/R2 bằng cách thêm driver cho storage adapter.

## 11. Cách làm việc

Làm theo từng phase. **Sau mỗi phase**: chạy `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (phase có e2e thì chạy Playwright),
sửa hết lỗi, rồi **commit** với message rõ ràng (tiếng Anh) và push lên nhánh đang làm.

0. **Đọc & lên kế hoạch**: đọc `web/README.md`, toàn bộ `web/src`, `lib/`. Ghi kế hoạch ngắn + các chỗ mơ hồ vào `web-next/PLAN.md`.
   Nếu có quyết định lớn cần tôi chọn thì hỏi; còn lại tự chọn phương án hợp lý, ghi lý do vào PLAN.md và làm tiếp.
1. **Khung dự án**: Next.js, Tailwind + tokens, shadcn, font, env.ts, ESLint/Prettier, Vitest, Playwright, `/api/health`,
   Dockerfile, docker-compose (dev + prod), Caddyfile, CI workflow (chỉ chạy khi `web-next/**` thay đổi).
2. **DB + Auth**: schema Drizzle, migration, Better Auth (email + mật khẩu), trang đăng ký/đăng nhập, script reset mật khẩu.
3. **App shell + mobile layout**: sidebar, bottom nav, topbar, focus mode, route guard (kiểm tra session ở layout/middleware).
4. **Từ vựng** (+ storage adapter, nén ảnh, `/api/images/[id]`).
5. **Ôn tập** (+ `lib/grading.ts` và unit test).
6. **Ngữ pháp** (+ chia sẻ + thông báo).
7. **Bộ thủ** + chia sẻ từ vựng + chuông thông báo.
8. **Bài 1** (port từ Flutter).
9. **Cài đặt, PWA (Serwist), security headers, seed**.
10. **Tài liệu**: `web-next/README.md`, `docs/DEPLOY.md`, `.env.example`; cập nhật README gốc một đoạn ngắn trỏ tới bản mới.

## 12. Tiêu chí hoàn thành

- [ ] `pnpm build` thành công, CI xanh.
- [ ] Chạy được local với Postgres thật; mọi tính năng ở mục 6 dùng DB thật, không còn mock.
- [ ] Đăng ký chỉ cần email + mật khẩu + xác nhận mật khẩu; không có bước email/OTP; đăng ký xong vào thẳng app.
- [ ] Không có dependency hay lời gọi mạng tới dịch vụ bên thứ ba nào ngoài Postgres (không email, OAuth, S3, Redis, CDN font/JS).
- [ ] Unit test cho grading, fold/tìm kiếm, validate schema (gồm xác nhận mật khẩu), luồng share (kể cả việc không lộ ghi chú cá nhân/ảnh).
- [ ] E2E trên viewport mobile: đăng ký → thêm từ có ảnh → ôn tập → xem kết quả; đăng xuất → đăng nhập lại.
- [ ] Không có import `@vercel/*`, không có `runtime = "edge"`, không có Supabase.
- [ ] `docker compose -f docker-compose.prod.yml up` chạy được app + Postgres + Caddy (nếu môi trường có Docker; không có thì ít nhất
      `docker build` hợp lệ và ghi rõ trong báo cáo là chưa chạy thử).
- [ ] `docs/DEPLOY.md` đủ để một người không rành DevOps deploy lên Vercel + Neon miễn phí, hoặc lên VPS.
- [ ] `web/`, `lib/`, workflow GitHub Pages không bị thay đổi.

Cuối cùng, báo cáo ngắn: đã làm gì, chỗ nào chưa làm hoặc làm khác spec (và vì sao), những tài khoản/secret tôi cần tự tạo.
