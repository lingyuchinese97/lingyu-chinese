# LingYu Chinese — bản Next.js (`web-next/`)

Ứng dụng học tiếng Trung: từ vựng, ôn tập tự chọn + ôn đến hạn (FSRS), ôn dịch câu, ngữ pháp, bộ thủ (nét viết),
bài học, chia sẻ giữa người dùng, thông báo, cài đặt (xuất / nhập dữ liệu), quản trị. Giao diện tiếng Việt, ưu tiên điện thoại,
cài được như app (PWA).

- Đang chạy: **https://www.lingyuchinese.com** (Vercel + Neon; bản cũ ở https://old.lingyuchinese.com). Triển khai / chuyển VPS / sao lưu: [`docs/DEPLOY.md`](../docs/DEPLOY.md).
- Kế hoạch, quyết định kỹ thuật và chỗ làm khác spec: [`PLAN.md`](PLAN.md). Thay đổi: [`CHANGELOG.md`](CHANGELOG.md).

## Công nghệ

Next.js 16 (App Router, Server Actions, `output: "standalone"`), React 19, TypeScript strict, Tailwind CSS v4, component theo
mẫu shadcn/ui (Radix), Postgres + Drizzle ORM, Better Auth (email + mật khẩu), Zod, ts-fsrs, pinyin-pro, hanzi-writer (dữ liệu nét
tự host), Serwist (PWA), pino. Test: Vitest (Postgres thật) + Playwright (iPhone / Android / desktop) + axe.

Không phụ thuộc dịch vụ bên thứ ba ngoài Postgres: font, audio, dữ liệu nét chữ đều tự host; ảnh lưu trong DB (storage adapter).

## Chạy trên máy

Yêu cầu: Node 22, pnpm 10 (`corepack enable`), Postgres 16 (Docker hoặc cài trực tiếp).

```bash
cd web-next
pnpm install
cp .env.example .env              # điền BETTER_AUTH_SECRET (openssl rand -base64 32), ADMIN_EMAILS...
docker compose up -d              # Postgres dev ở localhost:5432 (user/pass/db: lingyu) — có sẵn DB lingyu_test, lingyu_e2e
pnpm db:migrate                   # tạo bảng
pnpm db:seed                      # (tuỳ chọn) tài khoản demo + dữ liệu mẫu, mật khẩu in ra màn hình
pnpm dev                          # http://localhost:3000
```

Trước lần chạy `pnpm test` đầu tiên (và sau mỗi migration mới), áp migration cho DB test:

```bash
DATABASE_URL=postgres://lingyu:lingyu@localhost:5432/lingyu_test pnpm db:migrate
```

(`pnpm e2e` tự migrate DB `lingyu_e2e`.)

Không có Docker: cài Postgres 16 rồi tạo user/database `lingyu` (+ `lingyu_test`, `lingyu_e2e` để chạy test) như trong
`scripts/dev-init.sql`.

## Lệnh

| Lệnh                                           | Việc                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev` / `pnpm build` / `pnpm start`       | Chạy dev / build production / chạy bản build                            |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | ESLint / TypeScript / Prettier                                          |
| `pnpm test`                                    | Unit + integration (Vitest, DB `<db>_test`)                             |
| `pnpm e2e`                                     | Playwright trên bản build (chạy `pnpm build` trước; DB `<db>_e2e`)      |
| `pnpm db:generate`                             | Sinh migration mới từ `src/server/db/schema` vào `drizzle/`             |
| `pnpm db:migrate`                              | Áp migration                                                            |
| `pnpm db:seed`                                 | Tài khoản demo `admin@demo.lingyu`, `hocvien@demo.lingyu` + dữ liệu mẫu |
| `pnpm user:reset-password <email>`             | Đặt lại mật khẩu (in mật khẩu tạm 1 lần)                                |
| `pnpm user:make-admin <email>`                 | Cấp quyền quản trị                                                      |
| `./scripts/backup.sh`                          | Sao lưu Postgres trên VPS (xem `docs/DEPLOY.md`)                        |

Môi trường không tải được trình duyệt của Playwright: đặt `PW_CHROMIUM_PATH=/đường/dẫn/chrome`.

## Cấu trúc

```
src/
  app/                 # route (App Router)
    (auth)/            # /login, /register
    (app)/             # trang cần đăng nhập: home, vocabulary, sentences, review, grammar, radicals, lessons, settings, admin
    api/               # auth, health, images/[id] (chỉ chủ ảnh), hanzi/[char], account/export|import
    sw.ts, serwist/    # service worker (PWA), ~offline/ trang mất mạng, manifest.ts
  features/<tính năng>/ # schema.ts (Zod) · service.ts (truy vấn, luôn lọc theo userId của session) · actions.ts · components/
  components/          # ui/ (kit theo shadcn), layout/ (sidebar, bottom nav, chuông), auth/
  lib/                 # fold (tìm kiếm bỏ dấu), pinyin, grading, srs (FSRS), radicals, image-sniff/compress...
  data/                # dữ liệu tĩnh: bộ thủ, từ/ngữ pháp mẫu, lessons/<id>/
  server/              # auth (Better Auth), db (Drizzle schema, pool), storage, session, users, log
tests/unit, tests/e2e
drizzle/               # migration SQL
```

Nguyên tắc bảo mật: mọi Server Action / route kiểm tra session (và role cho admin), Zod cho mọi input, không tin `userId` từ client;
ghi chú cá nhân, ảnh và dữ liệu của người khác không bao giờ lộ (có test). Header bảo mật + CSP ở `next.config.ts`.

## API

Mọi chức năng mới phải có REST API dưới `/api/v1/...` (quy ước ở [`CLAUDE.md`](CLAUDE.md)). Hiện có:

| Route                        | Việc                                                 |
| ---------------------------- | ---------------------------------------------------- |
| `GET /api/health`            | Kiểm tra server + database                           |
| `GET\|PUT /api/v1/me/locale` | Xem / đổi ngôn ngữ giao diện (`vi` \| `en`) của mình |
| `/api/auth/*`                | Better Auth (đăng ký, đăng nhập, đăng xuất, phiên)   |
| `GET /api/account/export`    | Xuất dữ liệu của mình                                |
| `POST /api/account/import`   | Nhập dữ liệu (gộp, bỏ qua trùng)                     |
| `GET /api/hanzi/[char]`      | Dữ liệu nét viết của một chữ Hán                     |
| `GET /api/images/[id]`       | Ảnh cũ (chỉ chủ ảnh xem được)                        |

**Từ vựng và Ôn tập** (`/api/v1/vocab/*`, `/api/v1/review/*`): thêm / sửa / xoá / tìm từ, tag, thống kê, thao tác hàng loạt,
chia sẻ; tạo bài ôn tự chọn hoặc đến hạn, trả lời, đánh giá Khó/Được/Dễ, nộp bài. Danh sách route, dạng request/response và cách
đăng nhập từ app khác: [`docs/API.md`](docs/API.md).

**Swagger**: [`/api-docs`](https://lingyuchinese.com/api-docs) liệt kê mọi route, bấm _Try it out_ để gọi thử. File OpenAPI 3.1:
`/api/openapi.json` — nhập được vào Postman, Insomnia hay công cụ sinh code client. Hai trang này khoá bằng **tài khoản riêng**
(trình duyệt hỏi tên + mật khẩu), đặt ở biến môi trường `API_DOCS_USER` và `API_DOCS_PASSWORD` (≥ 12 ký tự; Vercel → Settings →
Environment Variables → Production, rồi Redeploy). Chưa đặt thì hai trang trả 404. Gọi thử vẫn cần đăng nhập LingYu vì API dùng
phiên của người dùng.

## Ngôn ngữ giao diện (Tiếng Việt / English)

Chữ trên giao diện nằm trong `src/i18n/messages/vi/*.ts` (gốc) và `src/i18n/messages/en/*.ts` — TypeScript báo lỗi nếu bản tiếng Anh
thiếu khoá. Dùng `useT()` trong client component, `await getT()` trong server component / route; `t.maybe(msg)` dịch thông báo
tiếng Việt sẵn có từ server. Thêm chữ mới = thêm khoá vào cả hai file. Chi tiết: `PLAN.md` mục 39.

## Thêm bài học mới (ví dụ Bài 2)

Chỉ cần thêm dữ liệu + audio, không phải sửa màn hình:

1. Tạo `src/data/lessons/bai2/index.ts` theo mẫu `src/data/lessons/bai1/index.ts`
   (kiểu `LessonInput` trong `src/data/lessons/schema.ts`):
   - `id: "bai2"`, `number: 2`, `badge`, `title`, `subtitle`, `highlights` (tuỳ chọn);
   - `sections`: mỗi phần có `id`, `label` ("Phần 1"), `title`, `instruction`, `questions`;
   - mỗi câu: `type` (`"choice-audio"` nghe chọn, cần `prompt`; `"blend"` ghép âm, cần `parts` vd `"b + a"`),
     `id`, đúng 4 `options`, `answer` (0–3), `audio` (tuỳ chọn), `explanation` (tuỳ chọn).
2. Chép audio vào `public/audio/bai2/...` và ghi `audio: "/audio/bai2/<phần>/q01.mp3"`.
   Câu chưa có audio: bỏ trống `audio` → nút nghe tự vô hiệu kèm ghi chú.
3. Thêm `bai2` vào mảng `LESSONS` trong `src/data/lessons/index.ts`.
4. Chạy `pnpm test` — test kiểm tra mọi bài đúng schema, đã được đăng ký và mọi file audio đều tồn tại.

Tiến độ (điểm cao nhất, lần gần nhất, số lần làm) tự lưu ở bảng `lesson_progress`, trang chủ tự tính % phần đã làm.
Audio bài học được service worker precache → nghe được cả khi mạng yếu.

## Chuyển dữ liệu từ bản cũ (`web/`, GitHub Pages)

Bản cũ lưu dữ liệu trong trình duyệt. Ở bản cũ: **Từ vựng → chọn tất cả → Chia sẻ → Sao chép hoặc tải file → CSV → Tải file**;
ở bản mới: **Cài đặt → Nhập dữ liệu** → chọn file `.csv` đó (gộp, bỏ qua từ trùng).
