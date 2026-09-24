# LingYu Chinese: Yêu cầu tổng hợp để xây web hoàn chỉnh

> Dùng file này làm prompt cho Claude Code: mở session mới trên repo `lingyu-chinese` và gõ
> "Thực hiện đúng theo `docs/prompts/nextjs-migration.md`". Tự code cũng dùng được: đây là spec đầy đủ.

---

## 0. Tóm tắt các quyết định đã chốt

| Chủ đề | Quyết định |
|---|---|
| Mục đích | Web học tiếng Trung cho người Việt, **dùng lâu dài**, chạy tốt trên điện thoại (PWA). |
| Chi phí | Ban đầu **0 đồng**: chỉ dùng dịch vụ miễn phí, không cần thẻ thanh toán (Vercel Hobby + Neon Free + GitHub). |
| Hosting | Deploy lên Vercel trước; chuyển sang **VPS** bằng Docker Compose bất cứ lúc nào, **không sửa code**, chỉ đổi env. |
| Phụ thuộc | **Không** Supabase/Firebase/BaaS, **không** dịch vụ chỉ Vercel mới có, **không** Edge runtime. |
| Đăng ký | **Email + mật khẩu + xác nhận mật khẩu**, vào thẳng app. Không OTP, không Google, không gửi email ở phase đầu. |
| Quên mật khẩu | Admin đặt lại (trang Admin hoặc lệnh CLI). Sau này bật email thì thêm tự đặt lại qua email. |
| Ảnh | Lưu trong Postgres (nén WebP ~300KB phía trình duyệt), qua storage adapter để sau này chuyển sang S3/R2. |
| Chia sẻ | Chỉ tới email đã có tài khoản; thông báo trong app. |
| Dữ liệu người dùng | Xuất/nhập JSON được, xoá tài khoản được, backup DB hằng ngày khi chạy VPS. |
| Mở rộng | Bài học định nghĩa bằng file dữ liệu có schema, thêm Bài 2, 3… không phải viết màn hình mới. |

## 1. Bối cảnh repo

- `web/`: web app **vanilla JS** (hash router, không build), dữ liệu là **mock** (localStorage + IndexedDB),
  deploy lên GitHub Pages bằng `.github/workflows/deploy-web.yml`. **Đây là spec về giao diện và hành vi**:
  đọc `web/README.md` (route, chữ ký hàm API, luật chấm, giới hạn trường, luồng chia sẻ) và toàn bộ `web/src`.
- `lib/` + `assets/`: app **Flutter** cho Bài 1 (Listening 16 câu, Blending 20 câu, audio `assets/audio/bai1/blending/q01–q20.mp3`).

Làm app mới trong **`web-next/`**. **Không sửa, không xoá** `web/`, `lib/`, `assets/`, `pubspec.yaml`, workflow GitHub Pages.

## 2. Tech stack

| Lớp | Công nghệ | Ghi chú |
|---|---|---|
| Runtime / PM | Node.js LTS, **pnpm** | Ghi `engines` + `packageManager`. |
| Framework | **Next.js** (bản ổn định mới nhất), App Router, **TypeScript strict** | Chỉ Node runtime. `output: "standalone"`. |
| UI | **Tailwind CSS v4 + shadcn/ui**, lucide-react | Map tokens từ `web/src/styles/tokens.css` (màu, radius, shadow, gradient). |
| Font | `next/font` (Inter, Noto Sans SC) | Tự host, không gọi CDN lúc runtime. |
| Form / validate | react-hook-form + **Zod** | Schema dùng chung client/server. |
| Data | Server Components + Server Actions; TanStack Query khi cần cache/optimistic phía client | |
| Database | **PostgreSQL**: Neon Free (Vercel) / Postgres trong Docker (VPS) | Chỉ dùng như Postgres chuẩn qua `DATABASE_URL`. |
| ORM | **Drizzle ORM + drizzle-kit**, driver **`pg`** | Không dùng driver HTTP riêng của Neon. |
| Auth | **Better Auth** (mã nguồn mở, tự host, Drizzle adapter) | Email + mật khẩu; rate limit lưu DB; có `role` (user/admin). |
| Ôn tập ngắt quãng | **ts-fsrs** | Lịch ôn theo FSRS (như Anki). |
| Tiếng Trung | **pinyin-pro**, **hanzi-writer** | Dữ liệu nét của hanzi-writer tự host trong `public/`. |
| PWA | **Serwist** (`@serwist/next`) | Manifest + icon từ `web/manifest.webmanifest`, `web/src/assets/app/*`. |
| Log | **pino** ra stdout (JSON) | Vercel và Docker đều đọc được; không cần dịch vụ log ngoài. |
| Env | `src/env.ts` validate bằng Zod | Build fail nếu thiếu biến. |
| Test | **Vitest** (unit/integration), **Playwright** (e2e, viewport iPhone + Android + desktop) | |
| Chất lượng | ESLint + Prettier; **Dependabot** cập nhật dependency hằng tuần | |
| CI | GitHub Actions: install → lint → typecheck → test (có service Postgres) → build → e2e | Chỉ chạy khi `web-next/**` đổi. |
| Container | `Dockerfile` multi-stage (non-root), `docker-compose.yml` (dev), `docker-compose.prod.yml`, `Caddyfile` | |

Trước khi cài/cấu hình từng thư viện, **đọc docs hiện hành** (WebFetch/WebSearch nếu có). Đừng code API theo trí nhớ nếu chưa chắc.

## 3. Quy tắc để dùng lâu dài và chuyển host dễ

1. Mọi cấu hình qua env; `.env.example` có chú thích tiếng Việt, không chứa secret thật.
2. Cấm `@vercel/*`, `runtime = "edge"`, cron của Vercel, mọi API chỉ Vercel có.
3. Migration có version (drizzle-kit `generate`) và commit vào repo; **không** dùng `drizzle-kit push` cho production.
   Migration phá dữ liệu (xoá/đổi cột) phải làm 2 bước (thêm mới → chuyển dữ liệu → xoá cũ ở release sau).
   - Vercel: build command `pnpm db:migrate && pnpm build`. Docker: entrypoint chạy migrate rồi `node server.js`.
4. Code chia theo module (`features/<module>`), tầng truy cập DB tách riêng (`server/`), không gọi DB trực tiếp từ component client.
5. Các dịch vụ có thể thay đổi sau này đều đi qua **adapter** có interface: `storage` (driver `db`, sau thêm `s3`),
   `email` (driver `none`, sau thêm `smtp`/`resend`). Phase đầu chỉ code driver `db` và `none`.
6. `/api/health` kiểm tra DB (healthcheck cho Docker/Caddy). Trang lỗi 404/500 thân thiện tiếng Việt.
7. Không có job định kỳ ở phase đầu.
8. Có `CHANGELOG.md`, version trong `package.json`, tag git khi release.

Biến môi trường phase đầu:
```
DATABASE_URL, DATABASE_POOL_MAX
BETTER_AUTH_SECRET, BETTER_AUTH_URL, NEXT_PUBLIC_APP_URL
ADMIN_EMAILS            # danh sách email được gán role admin khi đăng ký/đăng nhập
```

## 4. Cấu trúc thư mục

```
web-next/
  src/
    app/
      page.tsx                     # landing công khai ngắn (giới thiệu + nút Đăng nhập/Đăng ký)
      (auth)/login, register
      (app)/home, vocabulary, vocabulary/new, vocabulary/[id]/edit,
            grammar, grammar/new, grammar/[id], grammar/[id]/edit,
            radicals, radicals/[num],
            review/setup, review/session, review/result, review/due,
            lessons, lessons/[lessonId], lessons/[lessonId]/[section], lessons/[lessonId]/result,
            settings, admin
      api/auth/[...all], api/images/[id], api/health, api/export
    components/ui, components/layout (AppShell, Sidebar, BottomNav, TopBar, NotificationBell)
    features/<module>/ (components, actions.ts, queries.ts, schema.ts)
    server/db/ (schema/*.ts, client.ts, migrate.ts), server/auth.ts, server/storage/, server/email/, server/log.ts
    lib/ (grading.ts, pinyin.ts, fold.ts, image-compress.ts, srs.ts, ...)
    data/radicals.ts, data/radicalMap.ts, data/lessons/<lessonId>/*.ts
    env.ts
  scripts/ (seed.ts, reset-password.ts, make-admin.ts, backup.sh)
  drizzle/  public/  tests/unit  tests/e2e
  Dockerfile, docker-compose.yml, docker-compose.prod.yml, Caddyfile, .env.example, CHANGELOG.md
docs/DEPLOY.md
```

URL giữ như bảng Routes trong `web/README.md` (path thật thay hash). Bỏ `/verify-email`, `/verify-success`, `/forgot-password`.

## 5. Mô hình dữ liệu (Drizzle)

Lấy **đúng tên field, giới hạn độ dài, enum** từ code mock (`web/src/services/api/*.js`). Tối thiểu:

- Better Auth: `user` (+ `role`, `disabledAt`), `session`, `account`, `verification`, bảng rate limit.
- `image`: id (uuid), userId, mime, data `bytea`, size, width, height, createdAt.
- `vocab`: userId, chữ Hán, pinyin, nghĩa Việt, note (≤ 200), imageId (nullable), status (`learned`|`review`),
  isFavorite, radicals `integer[]`, timestamps. Index theo user.
- `vocab_tag` (unique theo user + tên), `vocab_to_tag`.
- `srs_card`: userId, vocabId, các trường trạng thái của ts-fsrs (due, stability, difficulty, reps, lapses, state, lastReview), `srs_review_log`.
- `grammar` (+ `sourceGrammarId`, `sourceOwnerName`), `grammar_example` (sortOrder), `grammar_tag`, `grammar_to_tag`,
  `grammar_bookmark`, `grammar_personal_note` (**bảng riêng, không bao giờ được chia sẻ**).
- `grammar_share`, `vocab_share` (snapshot `jsonb`, ≤ 200 từ), trạng thái PENDING/ACCEPTED/REJECTED.
- `notification` (type, payload jsonb, readAt).
- `review_session` (config, câu hỏi, đáp án, trạng thái, thời gian): lưu server để resume khi refresh hoặc đổi thiết bị.
- `radical_known`, `lesson_progress` (userId, lessonId, section, điểm cao nhất, lần làm gần nhất, số lần).

Khoá ngoại có `onDelete: cascade` theo user để xoá tài khoản sạch sẽ. Dữ liệu tĩnh (bộ thủ, radicalMap, nội dung bài học) để trong code, không đưa vào DB.
**Mọi truy vấn lọc theo `userId` của session**; không tin `userId` từ client.

## 6. Chức năng

UI **hoàn toàn tiếng Việt**, giữ câu chữ, thông báo lỗi và luồng màn hình của bản cũ, trừ những chỗ ghi khác dưới đây.

### 6.1 Tài khoản
- **Đăng ký**: Tên hiển thị, Email, Mật khẩu, Xác nhận mật khẩu. Email chuẩn hoá (trim + lowercase), mật khẩu ≥ 8 ký tự,
  xác nhận phải khớp, email đã tồn tại thì báo rõ. Đăng ký xong đăng nhập luôn → `/home`.
- **Đăng nhập**: email + mật khẩu, nút hiện/ẩn mật khẩu, rate limit khi sai nhiều lần, thông báo chung "Email hoặc mật khẩu không đúng".
  Tài khoản bị khoá (`disabledAt`) không đăng nhập được.
- **Quên mật khẩu**: dòng chữ "Liên hệ quản trị viên để đặt lại mật khẩu".
- **Cài đặt**: sửa tên; đổi mật khẩu (hiện tại + mới + xác nhận); **xuất dữ liệu** (JSON gồm từ vựng, tag, ngữ pháp, ghi chú, tiến độ, ảnh dạng base64);
  **nhập dữ liệu** từ file đã xuất (gộp, không ghi đè; báo số bản ghi đã thêm/bỏ qua); **xoá tài khoản** (nhập lại mật khẩu để xác nhận); đăng xuất.

### 6.2 Admin (`/admin`, chỉ role admin)
- Danh sách người dùng (tìm theo email, số từ vựng, ngày tạo, lần đăng nhập cuối).
- Đặt lại mật khẩu cho người dùng (sinh mật khẩu tạm, hiển thị 1 lần), khoá/mở khoá tài khoản.
- Script CLI dự phòng: `pnpm user:reset-password <email>`, `pnpm user:make-admin <email>`.

### 6.3 Trang chủ
Thống kê như `vocabApi.stats()` + số thẻ đến hạn ôn hôm nay + tiến độ bài học; lối tắt "Ôn ngay".

### 6.4 Từ vựng
Tìm kiếm (bỏ dấu, không phân biệt hoa thường, như `fold()`), lọc tag/bộ thủ, sắp xếp, phân trang, chọn nhiều để xoá/gắn tag/đổi trạng thái,
yêu thích, form thêm/sửa (tag, chọn bộ thủ theo tên tiếng Việt, gợi ý pinyin bằng pinyin-pro), chia sẻ cho user khác.
- **Ảnh**: chọn ảnh ≤ 5MB; trình duyệt nén (WebP, cạnh dài ≤ 1024px, chất lượng ~0.8, mục tiêu ≤ 300KB, từ chối nếu > 1MB sau nén).
  Server kiểm tra magic bytes + kích thước rồi lưu qua storage adapter. Phục vụ ở `/api/images/[id]` (kiểm tra chủ sở hữu,
  `Cache-Control: private, max-age=31536000, immutable`). Xoá từ thì xoá ảnh; nhận chia sẻ thì copy ảnh sang người nhận.
- Mỗi từ mới tự tạo `srs_card`.

### 6.5 Ôn tập
- **Ôn tự chọn** (như bản cũ): setup (tag, số câu 5/10/20/30/50, chế độ meaning/hanzi/pinyin/mixed, hiện ảnh), làm bài, kết quả, resume.
- **Ôn đến hạn** (`/review/due`): lấy các thẻ đến hạn theo FSRS; sau mỗi câu, kết quả đúng/sai (và tuỳ chọn tự đánh giá Khó/Được/Dễ) cập nhật lịch ôn.
- Luật chấm trong `lib/grading.ts`, **chấm ở server**, có unit test đầy đủ:
  - Nghĩa Việt: không phân biệt hoa/thường, chấp nhận từng nghĩa tách bằng `,` `;` `/`.
  - Chữ Hán: khớp chính xác (bỏ khoảng trắng).
  - Pinyin: dấu thanh hoặc số (`ni3 hao3` = `nǐ hǎo`), `v` = `ü`, bỏ khoảng trắng.

### 6.6 Ngữ pháp
Danh sách (tìm, lọc tag, sắp xếp, Đã lưu, Được chia sẻ), CRUD, ví dụ có thứ tự, quản lý tag (tạo/đổi tên/xoá), bookmark, ghi chú cá nhân,
chia sẻ cho email đã có tài khoản → người nhận xem trước (`/grammar/:id?share=<id>`) → chấp nhận (tạo bản copy riêng, giữ/không giữ tag,
thêm tag) hoặc từ chối. Thông báo trong app cho cả hai phía.

### 6.7 Bộ thủ
214 bộ, tìm kiếm, lọc số nét, "Đã thuộc", chi tiết có chữ ví dụ + animation nét viết (hanzi-writer) + từ vựng của user có bộ này.

### 6.8 Thông báo
Chuông trên topbar, số chưa đọc, đánh dấu đã đọc / đọc tất cả.

### 6.9 Bài học (mở rộng được)
- Định nghĩa **schema Zod cho nội dung bài học** (bài → section → câu hỏi; loại câu: nghe chọn đáp án, ghép âm, …; audio, ảnh, đáp án).
  Nội dung đặt ở `data/lessons/<lessonId>/`, audio ở `public/audio/<lessonId>/`. Test kiểm tra mọi file bài học hợp lệ và mọi audio tồn tại.
- Một bộ màn hình dùng chung cho mọi bài: danh sách bài → trang bài → làm section (mỗi câu một màn, khoá đáp án sau khi chọn,
  phản hồi đúng/sai, progress) → kết quả → Làm lại. Lưu `lesson_progress`.
- **Bài 1**: port nội dung từ Flutter (`lib/data/*`, logic ở `lib/state/*`, `lib/screens/*`). Chép `assets/audio/bai1/blending/*.mp3`.
  Câu chưa có audio thì nút phát bị vô hiệu kèm ghi chú, không crash.
- Ghi trong README cách thêm Bài 2 (chỉ thêm file dữ liệu + audio).

## 7. Mobile / responsive

- Mobile-first. Desktop: sidebar 280px. Mobile: **bottom tab bar**.
- Màn tập trung (form, đang làm bài) ẩn tab bar, nút chính dính ở đáy.
- Dialog: bottom sheet (shadcn Drawer) trên mobile, Dialog trên desktop. Bảng từ vựng trên mobile chuyển thành thẻ.
- Input ≥ 16px, vùng chạm ≥ 40px, `env(safe-area-inset-*)`, `viewport-fit=cover`, `theme-color`.
- PWA cài được lên màn hình chính; cache app shell + audio bài học; khi mất mạng hiện trang "Bạn đang offline".
- Tham khảo `web/src/styles/mobile.css`. Hỗ trợ bàn phím và screen reader cơ bản (label, focus ring, aria cho icon button).

## 8. Bảo mật

- Zod ở mọi input server; mọi Server Action/route kiểm tra session (và role cho admin).
- Mật khẩu hash theo mặc định của Better Auth; cookie `httpOnly`, `secure` khi HTTPS, `sameSite=lax`.
- Upload: chỉ `image/webp|jpeg|png`, kiểm tra magic bytes, giới hạn kích thước (`serverActions.bodySizeLimit` ~ `"2mb"`).
- Ghi chú cá nhân, ảnh, dữ liệu của user khác không bao giờ lộ sang người khác (có test).
- Header bảo mật (CSP hợp lý, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).
- Log không chứa mật khẩu, cookie, nội dung ảnh.

## 9. Local dev

- `docker-compose.yml` (dev): chỉ `postgres`. App chạy `pnpm dev`.
- Không có Docker (ví dụ container Claude Code trên web): cài PostgreSQL bằng apt hoặc dùng `DATABASE_URL` tôi cung cấp.
- `pnpm db:seed`: 1 admin demo + 1 user demo + dữ liệu mẫu (từ `sampleData.js`, `grammarSamples.js`).

## 10. Deploy

Viết `docs/DEPLOY.md` (tiếng Việt, từng bước, lệnh copy-paste):

1. **Miễn phí: Vercel Hobby + Neon Free** (không cần thẻ): tạo project Vercel từ GitHub, Root Directory = `web-next`,
   build command `pnpm db:migrate && pnpm build`; tạo project Neon, lấy **pooled** connection string; khai báo env;
   `BETTER_AUTH_SECRET` tạo bằng `openssl rand -base64 32`. Dùng tên miền `*.vercel.app` miễn phí (tên miền riêng là tuỳ chọn).
   Ghi chú giới hạn: Vercel Hobby chỉ cho dự án phi thương mại; Neon Free giới hạn dung lượng và thời gian tính toán
   (ghi con số hiện hành lấy từ trang Neon), nên cần nén ảnh và backup định kỳ bằng `pg_dump` về máy.
2. **VPS** (thay Vercel bất cứ lúc nào):
   - `docker-compose.prod.yml`: `app`, `postgres` (volume, không mở port ra ngoài), `caddy` (HTTPS tự động, `Caddyfile` chỉ đổi domain).
   - Cài Docker, clone repo, tạo `.env`, `docker compose -f docker-compose.prod.yml up -d --build`, cách cập nhật phiên bản, cách xem log, cách rollback.
   - Chuyển dữ liệu Neon → VPS: `pg_dump` → `pg_restore` (lệnh cụ thể + bước kiểm tra số bản ghi). Ảnh nằm trong DB nên đi theo.
   - Đổi `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, DNS.
   - `scripts/backup.sh`: `pg_dump` hằng ngày bằng crontab, giữ N bản, gợi ý copy ra ngoài VPS; hướng dẫn **thử khôi phục** từ backup.
3. Checklist trước khi cắt DNS.
4. **Lộ trình sau phase đầu** (chỉ ghi hướng dẫn, không code): bật email (dịch vụ có gói miễn phí hoặc SMTP) cho xác thực email
   và tự đặt lại mật khẩu; Google login; chuyển ảnh sang S3/R2 (thêm driver storage); theo dõi lỗi (Sentry hoặc GlitchTip tự host).

## 11. Cách làm việc

Sau **mỗi phase**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build` (+ Playwright khi có e2e), sửa hết lỗi, cập nhật `CHANGELOG.md`,
**commit** (message tiếng Anh, rõ ràng) và push lên nhánh đang làm.

0. **Đọc & lên kế hoạch**: đọc `web/README.md`, `web/src`, `lib/`. Ghi kế hoạch + chỗ mơ hồ vào `web-next/PLAN.md`.
   Quyết định lớn cần tôi chọn thì hỏi; còn lại tự chọn, ghi lý do vào PLAN.md rồi làm tiếp.
1. **Khung dự án**: Next.js, Tailwind + tokens, shadcn, font, env.ts, pino, ESLint/Prettier, Vitest, Playwright, `/api/health`,
   trang lỗi, Dockerfile, docker-compose (dev + prod), Caddyfile, CI, Dependabot.
2. **DB + Auth**: schema, migration, Better Auth, đăng ký/đăng nhập/đăng xuất, role admin, script CLI.
3. **App shell + mobile layout**: sidebar, bottom nav, topbar, focus mode, route guard, landing page.
4. **Từ vựng** (+ storage adapter, nén ảnh, `/api/images/[id]`).
5. **Ôn tập tự chọn** (+ `lib/grading.ts` + unit test).
6. **Ôn đến hạn (FSRS)**.
7. **Ngữ pháp** (+ chia sẻ + thông báo).
8. **Bộ thủ** + chia sẻ từ vựng + chuông thông báo.
9. **Bài học** (schema + màn hình chung + Bài 1).
10. **Cài đặt** (xuất/nhập/xoá tài khoản) + **Admin**.
11. **PWA, security headers, a11y, seed, hoàn thiện e2e**.
12. **Tài liệu**: `web-next/README.md`, `docs/DEPLOY.md`, `.env.example`, `CHANGELOG.md`; thêm một đoạn ngắn vào README gốc trỏ tới bản mới.

## 12. Tiêu chí hoàn thành

- [ ] CI xanh; `pnpm build` thành công.
- [ ] Mọi chức năng mục 6 chạy với Postgres thật, không còn mock.
- [ ] Đăng ký chỉ cần email + mật khẩu + xác nhận; không email/OTP; đăng ký xong vào thẳng app.
- [ ] Ngoài Postgres, không có dependency hay lời gọi mạng tới dịch vụ bên thứ ba (email, OAuth, S3, Redis, CDN font/JS).
- [ ] Không có import `@vercel/*`, `runtime = "edge"`, Supabase.
- [ ] Unit test: grading, fold/tìm kiếm, schema (gồm xác nhận mật khẩu), FSRS, schema bài học, xuất → nhập ra đúng dữ liệu,
      phân quyền (không lộ dữ liệu/ghi chú/ảnh của người khác, user thường không vào được admin).
- [ ] E2E trên viewport mobile: đăng ký → thêm từ có ảnh → ôn tập → kết quả; làm Bài 1; đăng xuất → đăng nhập lại.
- [ ] `docker compose -f docker-compose.prod.yml up` chạy được app + Postgres + Caddy (không có Docker thì ghi rõ trong báo cáo là chưa chạy thử).
- [ ] `docs/DEPLOY.md` đủ để người không rành DevOps deploy miễn phí lên Vercel + Neon, chuyển sang VPS, backup và khôi phục.
- [ ] `web/`, `lib/`, workflow GitHub Pages không bị thay đổi.

Cuối cùng, báo cáo ngắn: đã làm gì, chỗ nào chưa làm hoặc làm khác spec (và vì sao), tài khoản/secret tôi cần tự tạo.
