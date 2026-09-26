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
| 9   | Bài học (schema Zod + màn hình chung + Bài 1)                                                                                                                     | ✅         |
| 10  | Cài đặt (xuất/nhập/xoá tài khoản) + Admin                                                                                                                         | ✅         |
| 11  | PWA, security headers, a11y, seed, e2e                                                                                                                            | ✅         |
| 12  | Tài liệu (README, `docs/DEPLOY.md`, `.env.example`, CHANGELOG)                                                                                                    | ✅         |

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
14. **PWA**: Serwist bản Turbopack (`@serwist/turbopack`, SW phát ở `/serwist/sw.js` qua route handler, build bằng esbuild) — không cần
    `next build --webpack`. **Không cache dữ liệu riêng**: trang HTML/RSC, `/api/*` (trừ `/api/hanzi`) và ảnh từ vựng luôn lấy từ mạng;
    chỉ cache file build, icon, logo/mascot, font, audio bài học, dữ liệu nét chữ. Mất mạng → `/~offline`. Font không precache (~1.800 file).
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

29. **Bài học**: nội dung tĩnh trong `src/data/lessons/<id>/`, kiểm tra bằng Zod lúc nạp và trong unit test (kể cả audio tồn tại).
    Đáp án có sẵn ở client để phản hồi ngay từng câu; khi nộp, **server chấm lại** từ nội dung bài rồi mới lưu điểm.
    Bài làm dở lưu ở `sessionStorage` (refresh không mất). Phần "Nghe & nhận diện" của Bài 1 chưa có audio (bản Flutter cũng chưa có)
    → nút nghe vô hiệu kèm ghi chú. Sửa chỗ gõ nhầm thanh điệu ở Flutter: "ā á ă à" → "ā á ǎ à".

30. **Xuất / nhập dữ liệu** qua route handler (`/api/account/export`, `/api/account/import`, giới hạn 30MB) thay vì Server Action
    (giới hạn 2MB không đủ khi có ảnh). Import kiểm tra Origin + session, Zod từng bản ghi (bản ghi lỗi bị bỏ qua), ảnh base64 phải qua
    kiểm tra magic bytes. Gộp, không ghi đè: từ vựng trùng Hán tự, ngữ pháp trùng tiêu đề → bỏ qua. File có cả lịch ôn FSRS.
31. **Đổi mật khẩu** giữ phiên hiện tại, đăng xuất các thiết bị khác. **Xoá tài khoản** nhập lại mật khẩu, đăng xuất rồi xoá (cascade).
32. **Admin**: thêm cột `user.last_login_at` (migration `0002`, ghi ở hook tạo session) vì phiên bị xoá khi đăng xuất.
    Admin không tự khoá / tự đặt lại mật khẩu cho chính mình. Mật khẩu tạm chỉ hiển thị một lần.

33. **CSP**: `script-src 'self' 'unsafe-inline'` (Next nhúng dữ liệu RSC bằng script inline; dùng nonce sẽ bắt mọi trang render động),
    mọi thứ khác chỉ `'self'` (không CDN). HSTS chỉ bật khi `BETTER_AUTH_URL` là https.
34. **A11y**: kiểm tra tự động bằng axe (WCAG 2.1 A/AA, lỗi serious/critical) trên các trang chính, cả mobile và desktop.
    Làm đậm nhẹ vài màu chữ để đạt tương phản 4.5:1 (blue-600, text-3, pinyin, green-700, màu chữ tag, nút solid).
    Riêng nút CTA gradient thương hiệu (xanh → cyan) giữ nguyên thiết kế bản cũ nên loại khỏi kiểm tra tương phản.
35. **Chuyển dữ liệu từ bản cũ**: không sửa `web/`; bản cũ đã có sẵn "Chia sẻ → Tải file → CSV" cho từ vựng, nên trang Cài đặt nhận
    thêm file `.csv` đó (gộp, bỏ qua từ trùng). Ngữ pháp ở bản cũ không có chức năng xuất → phải nhập lại bằng tay.
36. **Seed** (`pnpm db:seed`): `admin@demo.lingyu` + `hocvien@demo.lingyu` (kèm dữ liệu mẫu), mật khẩu sinh ngẫu nhiên in ra 1 lần
    (hoặc đặt `SEED_*_PASSWORD`). Chạy lại không tạo trùng.

37. **Docker (chạy thử lại ở phase 12)**: build image + `docker compose -f docker-compose.prod.yml up` (app + Postgres + Caddy,
    HTTPS `localhost`): `/api/health`, service worker, audio, dữ liệu nét chữ đều 200; `scripts/backup.sh` (xoay vòng) và lệnh
    khôi phục trong `docs/DEPLOY.md` chạy đúng. Bản standalone không có symlink `node_modules/hanzi-writer-data` của pnpm
    → `/api/hanzi` tự tìm trong `node_modules/.pnpm/`. HSTS trên VPS do Caddy gửi (header của app cố định lúc build).

38. **Ôn dịch câu** (tính năng thêm theo thiết kế người dùng gửi, ngoài spec): bảng `sentence`, `sentence_tag`, `sentence_to_tag`,
    `sentence_session` (migration `0003`). Chấm ở server (`lib/sentence-grading.ts`): Việt → Trung so chữ Hán sau khi bỏ khoảng trắng /
    dấu câu (cả full-width); Trung → Việt không phân biệt hoa thường, dấu thanh, dấu câu, chấp nhận nhiều cách dịch cách nhau
    bằng " / " hoặc ";" — và người học được "Tính là đúng" khi dịch đúng nghĩa theo cách khác. "Tôi nhớ / Tôi chưa nhớ" đổi trạng thái
    câu (Đã thuộc / Cần ôn). "Tạo Pinyin" dùng pinyin-pro theo từng âm tiết (pinyin-pro không tách từ) — người dùng sửa lại nếu cần.
    Nút loa dùng giọng đọc có sẵn của trình duyệt (Web Speech API, không gọi dịch vụ ngoài); máy không có giọng tiếng Trung → ẩn nút.
    Câu được xuất / nhập cùng dữ liệu khác.

39. **Giao diện song ngữ Việt / English** (theo yêu cầu người dùng, người dùng đổi tuỳ ý): tự viết lớp i18n nhỏ ở `src/i18n/`
    thay vì thêm thư viện. Từ điển gốc tiếng Việt (`messages/vi/*.ts`), bản tiếng Anh (`messages/en/*.ts`) được TypeScript bắt
    đủ khoá; `t("khoá", { biến })` có số nhiều kiểu ICU rút gọn cho tiếng Anh. Ngôn ngữ của request: đã lưu trong tài khoản
    (`user.locale`, migration `0004`) → cookie `lingyu-locale` (khi chưa đăng nhập) → tiếng Việt. Không tự đoán theo trình duyệt
    (người dùng chủ yếu là người Việt; e2e chạy trình duyệt tiếng Anh vẫn ra tiếng Việt). Đổi ngôn ngữ: menu tài khoản, Cài đặt,
    trang đăng nhập / giới thiệu; API `GET|PUT /api/v1/me/locale`. Thông báo lỗi của server / Zod / Better Auth vẫn viết tiếng Việt
    trong code và được dịch lúc hiển thị (`t.maybe` tra ngược câu tiếng Việt → khoá, kể cả mẫu có biến như "Tối đa {max} tag") —
    toast, `Alert`, `FieldError` tự làm việc này nên service và test cũ không phải sửa. Dữ liệu của người dùng và dữ liệu mẫu (nghĩa
    tiếng Việt, câu ví dụ) không dịch; bộ thủ có thêm nghĩa tiếng Anh (`data/radicals-en.ts`), bài học có trường `en` tuỳ chọn.

40. **REST API `/api/v1`** (theo yêu cầu người dùng, bắt đầu với Từ vựng + Ôn tập): mỗi route là một lớp mỏng qua
    `api()` ở `src/server/api.ts` — lấy user từ phiên (không nhận `userId`), bắt thân JSON (415 nếu không — cùng cookie SameSite=Lax
    điều này chặn form giả mạo từ trang khác), Zod dùng lại schema của tính năng, đổi lỗi service → mã HTTP (`not-found` → 404,
    ôn tập `empty` → 409, còn lại 400; Zod → 400 + `fieldErrors`), thông báo dịch theo ngôn ngữ người dùng. id sai định dạng cũng
    trả 404. App khác đăng nhập qua `POST /api/auth/sign-in/email` rồi gửi cookie phiên. Server Action của giao diện giữ nguyên.
    Tài liệu `docs/API.md`, e2e `tests/e2e/api.spec.ts`.

## Chỗ mơ hồ & cách xử lý

- "Gợi ý pinyin bằng pinyin-pro": khi nhập Hán tự mà ô Pinyin còn trống → hiện nút gợi ý (bấm để điền), không tự ghi đè.
- "Tiến độ bài học" trên Trang chủ: % section đã làm của các bài.
- Landing `/`: đã đăng nhập thì chuyển thẳng `/home`.
- Thông báo cho cả hai phía (spec 6.6): người nhận khi được chia sẻ; người gửi khi người nhận **chấp nhận hoặc từ chối**.
- Nhập dữ liệu (6.1): gộp theo khoá tự nhiên (từ vựng: Hán tự; ngữ pháp: tiêu đề; tag: tên) → trùng thì bỏ qua và đếm.
