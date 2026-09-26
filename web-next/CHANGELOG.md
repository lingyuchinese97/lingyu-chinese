# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), version theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### Added

- **API cho mọi chức năng còn thiếu** (để app điện thoại / app khác dùng được hết như web), có trong Swagger:
  - Ngữ pháp `/api/v1/grammar/*`: danh sách, thêm / sửa / xoá, ghi chú cá nhân, lưu, thẻ, chia sẻ, lời mời nhận được, xem trước,
    chấp nhận / từ chối, ngữ pháp mẫu.
  - Ôn dịch câu `/api/v1/sentences/*`: kho câu, yêu thích, tag, thao tác hàng loạt, câu mẫu; bài ôn (tạo, trả lời, bỏ qua, tính là
    đúng, gợi ý, nhớ / chưa nhớ, chuyển câu, nộp, kết quả gần nhất).
  - Bộ thủ `/api/v1/radicals/*`, Bài học `/api/v1/lessons/*` (nộp bài — server tự chấm), Thông báo `/api/v1/notifications/*`,
    Tài khoản `/api/v1/me/*` (hồ sơ, đổi tên, đổi mật khẩu, xoá tài khoản, xuất / nhập dữ liệu), Trang chủ `/api/v1/home`.
  - Ngữ pháp của người khác (không có lời mời) → 404; ghi chú cá nhân không bao giờ có trong bản xem trước / bản được chia sẻ
    (có test e2e).
- **Phát âm & Biến điệu** (menu “Phát âm & Biến điệu”, `/pronunciation`), 7 tab:
  - **Tổng quan**: 4 thẻ (21 thanh mẫu, 36 vận mẫu, 4 thanh + thanh nhẹ, 4 quy tắc biến điệu) và lối vào Luyện tập / Ghi chú.
  - **Thanh mẫu** (6 nhóm theo vị trí phát âm) và **Vận mẫu** (lọc đơn 6 / kép 13 / mũi 16 / er): bấm một âm → cách phát âm,
    gần giống âm tiếng Việt nào, ví dụ, mẹo ghi nhớ, nút Nghe, nút Ghi chú riêng. Âm đang chọn nằm trên link (`?s=zh`).
  - **Thanh điệu**: đường thanh điệu (Cao / Trung / Thấp) từng thanh, ví dụ 妈 麻 马 骂, biểu đồ so sánh 4 thanh, bộ ví dụ
    so sánh, mẹo, ghi chú từng thanh.
  - **Biến điệu**: hai thanh 3, ba thanh 3, 一, 不 — công thức, ví dụ trước → sau biến điệu (ghi chú từng ví dụ), so sánh phát âm
    trước / sau (nghe từng chữ / nghe cả từ), luyện tập nhanh 5 câu, ghi chú của tôi, ghi chú chung, mẹo.
  - **Luyện tập** (10 câu, chấm ngay, không lưu điểm): Nghe & Chọn, Nghe & Gõ pinyin (gõ số thanh `ba1` → `bā`), Phát âm & So
    sánh (ghi âm bằng micro rồi nghe lại, **bản ghi chỉ ở trên máy**, không tải lên), Phân biệt cặp âm, Luyện đọc từ, Biến điệu;
    cột Gợi ý / Tiến độ (Đã làm, Đúng, Sai, Chưa trả lời) / Mẹo nhỏ.
  - **Ghi chú của tôi**: mọi ghi chú phát âm (tự do có tiêu đề + ghi chú gắn âm / thanh / quy tắc / ví dụ), thêm, sửa, xoá, mở lại
    bài học. Ghi chú **chỉ người viết xem được** (bảng `pronunciation_note`, migration 0006), có trong xuất / nhập dữ liệu.
  - Âm thanh dùng giọng đọc tiếng Trung có sẵn của máy (Web Speech); máy không có giọng đọc thì ẩn nút nghe và vẫn luyện được
    bằng chữ Hán. `Permissions-Policy` cho phép micro trên chính trang (`microphone=(self)`).
  - API `/api/v1/pronunciation` (nội dung), `/api/v1/pronunciation/practice?mode=&count=` (tạo bài), `/api/v1/pronunciation/notes`
    (+ `/{id}`) — có trong Swagger.
- **Ngữ pháp: nhiều dòng cấu trúc** — mỗi ngữ pháp có 1 dòng cấu trúc chính và thêm được 1–3 dòng (tối đa 4, mỗi dòng
  300 ký tự; nút "Thêm dòng cấu trúc" / xoá từng dòng). Lưu chung ô `structure`, mỗi dòng một cấu trúc (dữ liệu cũ vẫn dùng được).
- **Luyện nghe & Nói – Chép chính tả** (menu “Luyện nghe & Nói”, `/listening`): dán link YouTube (trình phát nhúng chính thức,
  không tải video / không lấy phụ đề) hoặc link file âm thanh / video; chọn đoạn (ô giờ + thanh kéo 2 đầu), tốc độ 0.5x–1.5x, lặp
  lại đoạn, tự chuyển đoạn tiếp theo; **người dùng tự nhập đáp án tham khảo** (ẩn trong lúc chép, có nút Tạo Pinyin); ô chép chính
  tả tối đa 2.000 chữ có Bút đen / Bút đỏ / Bôi vàng / Hoàn tác / Làm lại; “Kiểm tra đáp án” so sánh từng chữ (Đúng / Sai / Thiếu /
  Thừa, điểm “Đúng 5/6 chữ (83%)”), chữ không khớp tô đỏ ngay trong ô và tự hết đỏ khi sửa đúng; chọn một từ → “Lưu vào Từ vựng”
  (dùng lại form Từ vựng, lưu vào kho chung); ghi chú; popup “Lưu bài làm” (tiêu đề, thẻ, đáp án chỉ đọc, sửa bài với so sánh tức
  thì). Tab “Bài làm của tôi”: tìm theo tiêu đề / nội dung / thẻ, lọc thẻ, mới / cũ nhất, chi tiết (bài làm, đáp án, kết quả so
  sánh, ghi chú), Chỉnh sửa & Lưu (chấm lại), thêm thẻ, tải xuống, xoá có xác nhận. Nháp đang làm được giữ khi tải lại trang.
  Bài làm có trong xuất / nhập dữ liệu. API `/api/v1/listening/*`.
- **API quản trị** (chỉ admin): `GET /api/v1/admin/stats` (tổng số người dùng, admin, bị khoá, mới / hoạt động 7 ngày, tổng nội
  dung), `GET /api/v1/admin/users` (danh sách, tìm), `GET /api/v1/admin/users/{id}` (hồ sơ + số lượng nội dung).
- **Swagger cho API**: trang `/api-docs` (Swagger UI) liệt kê mọi route `/api/v1`, có ví dụ và nút _Try it out_ gọi thử bằng phiên
  đăng nhập hiện tại; file OpenAPI 3.1 ở `/api/openapi.json` (thân request sinh từ schema Zod nên luôn khớp kiểm tra thật). Test
  bắt buộc mọi route `/api/v1` phải có trong tài liệu. Hai trang này khoá bằng **tài khoản riêng** (HTTP Basic, biến
  `API_DOCS_USER` / `API_DOCS_PASSWORD`); chưa đặt thì trả 404.
- **REST API cho Từ vựng và Ôn tập** (để app điện thoại / app khác dùng): `/api/v1/vocab` (danh sách, thêm, sửa, xoá, yêu thích,
  tag, thống kê, thêm từ mẫu, xoá / đổi trạng thái / gắn tag hàng loạt, chia sẻ, lời mời đã gửi / nhận, chấp nhận / từ chối) và
  `/api/v1/review` (số từ theo tag, số thẻ đến hạn, thiết lập gần nhất, tạo bài, bài đang làm, bỏ bài, trả lời, đánh giá, chuyển câu,
  nộp bài, kết quả gần nhất). Dùng chung service với giao diện; cần đăng nhập (401), dữ liệu người khác → 404, thân phải là JSON
  (415), lỗi dữ liệu → 400 kèm `fieldErrors`, thông báo theo ngôn ngữ của người dùng. Tài liệu: `docs/API.md`.
- **Giao diện tiếng Anh**: đổi Tiếng Việt / English bất cứ lúc nào (menu tài khoản, Cài đặt → Ngôn ngữ, trang đăng nhập và trang
  giới thiệu). Lựa chọn lưu vào tài khoản (đăng nhập máy khác vẫn giữ) và cookie khi chưa đăng nhập. Toàn bộ màn hình, thông báo
  lỗi, ngày giờ, số nhiều đều theo ngôn ngữ đã chọn; bộ thủ có nghĩa tiếng Anh và tìm được bằng tiếng Anh ("water"), Bài 1 có
  bản tiếng Anh. API `GET|PUT /api/v1/me/locale`. Dữ liệu của người dùng (nghĩa tiếng Việt, ghi chú...) giữ nguyên.
- `CLAUDE.md`: quy ước mọi chức năng mới phải có REST API (`/api/v1/...`) dùng chung service với giao diện; mục **API** trong
  `README.md` liệt kê các route hiện có.

### Fixed

- Kết quả Ôn dịch câu: mascot không còn đè lên vòng tròn điểm (dùng ảnh nền trong suốt, đặt cạnh vòng tròn).

### Changed

- **Phát âm – âm thanh khớp chữ hiển thị**: chỉ dùng giọng đọc tiếng **Phổ thông** (ưu tiên zh-CN, rồi zh-TW); không bao giờ dùng
  giọng **Quảng Đông** (zh-HK / yue) — trước đây máy chỉ có giọng Quảng Đông sẽ đọc chữ khác hẳn pinyin. Không có giọng Phổ thông
  thì ẩn nút Nghe. Ô của mỗi thanh mẫu / vận mẫu hiện đúng âm tiết máy đọc (b → 波 bō, không còn “爸 bà”). Áp dụng cả nút Nghe ở
  Ngữ pháp, Ôn dịch câu, Trang chủ.
- **Phát âm – chậm hơn 50% và chỉnh được**: tốc độ mặc định ở Phát âm & Biến điệu 0,3 (trước 0,55); “Nghe chậm” và “nghe từng chữ”
  chậm hơn nữa. Thêm ô **Tốc độ đọc** (0,2x – 1x) trên đầu trang, lưu trong trình duyệt.
- Test e2e giả lập giọng đọc: với cả 21 thanh mẫu + 36 vận mẫu, thanh điệu, biến điệu, luyện tập — kiểm tra chữ máy đọc đúng chữ
  hiển thị, đúng giọng Phổ thông, đúng tốc độ.

- **Phát âm – âm máy đọc khớp chữ hiển thị**: cạnh nút Nghe của mỗi thanh mẫu / vận mẫu hiện rõ chữ và pinyin máy đọc (vd
  “Nghe 波 bō” cho b) kèm giải thích, vì phụ âm không đọc riêng được. Vận mẫu đọc bằng âm tiết không phụ âm khi có (ai 哀 āi, a 阿 ā);
  c đổi 雌 → 词; cặp âm d/t đổi 肚 (đa âm) → 度. Test đối chiếu mọi chữ đọc với pinyin-pro.

- **Giọng đọc chậm hơn nữa**: nút Nghe 0,55 (trước 0,7), "Nghe chậm" 0,35 (trước 0,45), nghe từng chữ trước biến điệu 0,45
  (trước 0,55). Cấu hình chung ở `src/lib/speech-rate.ts` cho mọi nút Nghe (Phát âm, Ngữ pháp, Ôn dịch câu, câu nói mỗi ngày ở Trang chủ).

- **Phát âm**: giọng đọc chậm hơn (0,7; "Nghe chậm" 0,45; nghe từng chữ trước biến điệu 0,55) — áp dụng cả nút Nghe ở Ngữ pháp.
- **Phát âm – sửa dữ liệu**: vận mẫu **o** dùng nhầm ví dụ 我 wǒ và chữ đọc 喔 wō (thực ra là vần uo) → đổi thành 波 bō, 摸 mō,
  chữ đọc 哦; chữ đọc của d đổi 得 → 德 (tránh chữ đa âm), ia đổi 呀 → 压. Thêm test tự kiểm tra mỗi ví dụ chứa đúng thanh mẫu /
  vận mẫu được dạy.

- **Luyện nghe**: bấm “Lưu bài làm” xong, hoặc tải lại trang, thì link và trình phát (video YouTube) cũng bị xoá — trang trở về
  trống để làm bài mới (nháp bài chép / đáp án / ghi chú vẫn giữ khi tải lại).

- Luyện nghe: bấm **Lưu bài làm** xong, trang tự xoá bài (bài chép, đáp án tham khảo, ghi chú, kết quả) để làm bài mới nhưng **giữ
  lại link** đã dán (và trình phát, tốc độ, đoạn) để luyện tiếp.
- Ngữ pháp: bỏ 3 nút "số ngữ pháp / Đã lưu / Được chia sẻ" ở phần đầu trang (đã có các tab ngay bên dưới).
- **Trang chi tiết Ngữ pháp thiết kế lại theo mẫu**: tiêu đề có biểu tượng tròn, thẻ + ngày tạo / cập nhật, nút Lưu / Chia sẻ
  / Chỉnh sửa / Xóa; mỗi phần là một khung màu riêng có biểu tượng (Ý nghĩa xanh, Cấu trúc vàng, Ví dụ trắng, Lưu ý xanh, Ghi chú
  cá nhân xanh lá, Đã chia sẻ với). Cấu trúc dạng “Nhãn: công thức” (vd “Câu phủ định: A + 不是 + B”) hiện nhãn tách riêng. Mỗi
  ví dụ có số thứ tự, nút Nghe (giọng đọc của máy), Sao chép và menu (chép câu / pinyin, sửa). Ghi chú cá nhân thêm / sửa ngay
  trên trang; “Chia sẻ ngay” ở khung Đã chia sẻ với.
- **Trang Ngữ pháp thiết kế lại theo mẫu**: tiêu đề có biểu tượng, số ngữ pháp / Đã lưu / Được chia sẻ dạng nút bấm, câu khẩu
  hiệu viết tay, logo + mascot LingYu (màn hình rộng); khung cấu trúc nền vàng, biểu tượng cam, chữ đỏ đậm, mỗi dòng một cấu trúc
  (thẻ danh sách và trang chi tiết); lưới 4 thẻ / hàng trên màn hình rộng.
- **Tăng tốc**: máy chủ Vercel chạy ở Singapore (`sin1`), cùng vùng với database Neon. Trước đây chạy mặc định ở Mỹ nên mỗi
  truy vấn phải đi vòng qua Thái Bình Dương, làm màn hình phản hồi chậm vài giây.
- Thanh tải mảnh ở đầu màn hình hiện ngay khi bấm chuyển trang.
- **Trang chủ thiết kế lại**: lời chào + nút "Bắt đầu học ngay" (vào bài học tiếp theo) + mascot; 4 thẻ Từ vựng / Ôn dịch câu /
  Ngữ pháp / Bài học; "Tiến độ học tập" (vòng % từ đã thuộc, câu đã thuộc, ngữ pháp, thẻ đến hạn, phần bài học đã làm);
  "Học hôm nay" (từ mới, lần ôn, thẻ đến hạn + nút ôn tiếp); "Câu nói mỗi ngày" (đổi câu, nghe đọc).

### Removed

- Chức năng hình ảnh ở Từ vựng (tải / chụp ảnh, cột ảnh trong danh sách, tuỳ chọn hiện ảnh khi ôn, ảnh khi chia sẻ).
  Ảnh đã lưu trước đây vẫn giữ trong DB và chỉ chủ ảnh xem được.

### Fixed

- Đăng ký/đăng nhập từ sai địa chỉ (vd `http://` thay vì `https://`) báo rõ nguyên nhân thay vì "Có lỗi xảy ra".

### Added

- **Ôn dịch câu** (`/sentences`): kho câu tiếng Trung – tiếng Việt (tìm kiếm bỏ dấu, lọc tag, Yêu thích, chọn nhiều để ôn / đánh dấu /
  xoá, dữ liệu mẫu), form thêm/sửa có **Tạo Pinyin** và **Quy tắc Pinyin**, tối đa 5 tag, ghi chú 200 ký tự.
  Ôn tập: chọn chiều dịch (Việt → Trung, Trung → Việt, trộn), số câu, tag, hiện Pinyin, gợi ý chữ Hán đầu tiên; làm bài
  (Kiểm tra / Bỏ qua / Xem gợi ý, chấm ở server, "Tính là đúng", Tôi nhớ / Tôi chưa nhớ, nghe câu bằng giọng đọc của máy),
  kết quả (Đúng / Sai / Bỏ qua) và **Ôn lại câu sai**. Làm tiếp được khi tải lại trang. Có trong xuất / nhập dữ liệu.

- Tài liệu: `README.md` (chạy local, lệnh, cấu trúc, thêm bài học, chuyển dữ liệu bản cũ), `docs/DEPLOY.md` (Vercel + Neon miễn phí,
  tên miền Cloudflare, VPS Docker + Caddy, sao lưu / khôi phục, chuyển Neon → VPS, chuyển `lingyuchinese.com` sang bản mới, lộ trình),
  `.env.example` đầy đủ, `scripts/backup.sh`; README gốc trỏ tới bản mới.

### Fixed

- Dữ liệu nét chữ (`/api/hanzi`) trả 404 trong bản Docker/standalone (pnpm không tạo symlink ở gốc `node_modules`).
- VPS: Caddy gửi header HSTS.

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
