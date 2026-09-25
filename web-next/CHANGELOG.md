# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), version theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### Fixed

- Đăng ký/đăng nhập từ sai địa chỉ (vd `http://` thay vì `https://`) báo rõ nguyên nhân thay vì "Có lỗi xảy ra".

### Added

- **PWA**: cài lên màn hình chính (manifest, icon), service worker (Serwist) cache file tĩnh, font, audio bài học và dữ liệu nét chữ;
  mất mạng hiện trang "Bạn đang offline". Không cache trang hay dữ liệu riêng của người dùng.
- **Header bảo mật**: Content-Security-Policy (chỉ tài nguyên của chính app), `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options`, `Cross-Origin-Opener-Policy`, HSTS khi chạy https.
- **Nhập từ bản cũ**: trang Cài đặt nhận file CSV tải từ bản LingYu cũ (Từ vựng → Chia sẻ → Tải file → CSV).
- `pnpm db:seed`: tài khoản demo (admin + người học có dữ liệu mẫu).
- Kiểm tra a11y tự động (axe) trên các trang chính; e2e cho PWA/header bảo mật.

### Changed

- Làm đậm nhẹ một số màu chữ (link, gợi ý, pinyin, tag, nút) để đạt tương phản WCAG AA.

- **Cài đặt** (`/settings`): sửa tên; đổi mật khẩu (hiện tại + mới + xác nhận; các thiết bị khác bị đăng xuất); **xuất dữ liệu** JSON
  (từ vựng kèm ảnh base64 và lịch ôn, tag, ngữ pháp, ghi chú cá nhân, bộ thủ đã thuộc, tiến độ bài học); **nhập dữ liệu** (gộp, không
  ghi đè, báo số đã thêm / bỏ qua); dữ liệu mẫu; **xoá tài khoản** (nhập lại mật khẩu); đăng xuất.
- **Quản trị** (`/admin`, chỉ admin): danh sách người dùng (tìm theo email/tên, số từ vựng, ngày tạo, lần đăng nhập gần nhất),
  đặt lại mật khẩu (mật khẩu tạm hiện một lần), khoá / mở khoá tài khoản.
- Migration `0002_user_last_login.sql` (cột `user.last_login_at`).

- **Bài học** (`/lessons` → `/lessons/[id]` → `/lessons/[id]/[phần]` → `/lessons/[id]/result`): schema Zod cho nội dung bài,
  màn hình dùng chung (mỗi câu một màn, khoá đáp án sau khi chọn, báo đúng/sai kèm đáp án đúng, thanh tiến độ, nút chính dính đáy),
  kết quả + Làm lại. **Bài 1** port từ Flutter: Nghe & nhận diện (16 câu) + Ghép âm (20 câu, có audio). Lưu tiến độ `lesson_progress`;
  trang chủ có thẻ "Tiến độ bài học". README hướng dẫn thêm Bài 2.

- **Bộ thủ** (`/radicals`, `/radicals/[num]`): 214 bộ, tìm theo tên / nghĩa (bỏ dấu) / pinyin / số / gõ 1 chữ Hán, lọc số nét,
  "Đã thuộc" (lưu theo tài khoản) + thanh tiến độ; chi tiết có animation nét viết và luyện viết (hanzi-writer, dữ liệu tự host
  qua `/api/hanzi/[char]`), chữ ví dụ, từ vựng của bạn có bộ này, bộ trước / sau.
- **Chia sẻ từ vựng**: chọn nhiều từ (hoặc từ menu từng từ) → gửi cho email người dùng LingYu, hoặc sao chép / tải file TXT, CSV.
  Người nhận thấy lời mời ở đầu trang Từ vựng và trong chuông → xem trước → chấp nhận (chép vào kho riêng, kèm ảnh; giữ/thêm tag,
  bỏ qua từ đã có) hoặc từ chối; người gửi được báo.

- **Ngữ pháp** (`/grammar`, `/grammar/new`, `/grammar/[id]`, `/grammar/[id]/edit`): tab Tất cả / Đã lưu / Được chia sẻ, tìm kiếm bỏ dấu,
  sắp xếp, lọc và quản lý thẻ (đổi tên, xoá), lưu (bookmark), ví dụ (Hán tự / pinyin tự thêm dấu / nghĩa, đổi thứ tự), lưu ý,
  **ghi chú cá nhân** (chỉ mình bạn thấy, không gửi khi chia sẻ), dữ liệu mẫu.
- **Chia sẻ ngữ pháp** qua email: người nhận xem trước → chấp nhận (nhận bản sao riêng, chọn giữ thẻ) hoặc từ chối; người gửi xem được
  trạng thái từng người. Người không được mời không xem được.
- **Chuông thông báo**: số chưa đọc, danh sách, xem / chấp nhận / từ chối lời mời ngay trong chuông.

- **Ôn tập tự chọn** (`/review/setup` → `/review/session` → `/review/result`): chọn tag, số câu 5/10/20/30/50, hình thức
  nghĩa / chữ Hán / pinyin / trộn, bật tắt ảnh; chấm ở server (`lib/grading.ts`), đáp án không gửi xuống trước khi trả lời;
  câu sai hiện từ khác khớp câu trả lời; làm tiếp được sau khi refresh / đổi thiết bị; kết quả + "Ôn lại các từ đã sai".
- **Ôn đến hạn (FSRS)** (`/review/due`): thẻ có hạn ≤ bây giờ; sai → Again, đúng → Good, có thể đổi Khó / Dễ → cập nhật lịch ôn và log.
- Trang chủ: nút "Bắt đầu ôn tập" và "Ôn ngay (N)" đã chạy. Danh sách từ vựng: nút "Ôn tập" cho các từ đã chọn.
- **Trang chủ** theo giao diện bản cũ: lời chào theo tên, mascot, thẻ "Từ vựng của tôi" (flashcard từ mới nhất, tổng số từ, số từ cần ôn)
  và thẻ "Ôn tập từ vựng" (số thẻ FSRS đến hạn hôm nay, chọn số từ; nút bắt đầu mở khi xong phần Ôn tập).
- **Từ vựng** (`/vocabulary`, `/vocabulary/new`, `/vocabulary/[id]/edit`): tìm kiếm bỏ dấu (Hán tự, pinyin viết liền/tách, nghĩa, tag),
  lọc tag/bộ thủ, sắp xếp, phân trang, chọn nhiều để thêm tag / đổi trạng thái / xoá, yêu thích, xem ghi chú dài, dữ liệu mẫu.
  Bảng trên desktop, thẻ trên điện thoại.
- Form từ vựng: pinyin tự thêm dấu khi gõ số (cả trong ghi chú), gợi ý pinyin bằng pinyin-pro, chọn bộ thủ theo tên tiếng Việt
  (kèm gợi ý từ chữ Hán), chọn/tạo tag, ảnh (nén WebP ≤ 1024px ở trình duyệt, kiểm tra magic bytes ở server), nút Lưu dính đáy trên điện thoại.
- `/api/images/[id]`: chỉ chủ sở hữu xem được, cache `private, immutable`. Storage adapter (driver `db`).
- Mỗi từ mới tự tạo thẻ ôn tập FSRS (`srs_card`).
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
