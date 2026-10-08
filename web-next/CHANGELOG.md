# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/), version theo [SemVer](https://semver.org/lang/vi/).

## [Unreleased]

### Added

- **Luyện giao tiếp** (`/speaking`, mục mới trên thanh bên): tự tạo câu hỏi giao tiếp (nhiều câu một lần) — pinyin và nghĩa tiếng Việt
  tự sinh, sửa được; chọn HSK và nhiều tag (tag gợi ý sẵn). Danh sách tìm theo chữ Hán / pinyin / nghĩa, lọc HSK / tag / đã đánh dấu,
  sắp xếp, phân trang, xoá nhiều. Bấm câu hỏi → màn luyện như Đọc hiểu: thanh công cụ (← Câu hỏi n/N →, Nghe câu hỏi, tốc độ, Bút
  highlight, Đánh dấu, Lưu), trả lời trên **vở ô ly** (gõ hoặc ghi âm), pinyin + nghĩa câu trả lời tự sinh, loa riêng cho câu hỏi và
  câu trả lời, Gợi ý / Làm lại / Kiểm tra câu trả lời (ngữ pháp, từ vựng, độ tự nhiên — không có đáp án mẫu) / Câu tiếp theo, hàng tag
  "+ Thêm tag". Câu trả lời tự lưu, chuyển câu trước / sau không mất dữ liệu. REST API `/api/v1/speaking/*` (xem `docs/API.md`).
- **Trợ lý AI (tuỳ chọn)**: đặt biến môi trường `ANTHROPIC_API_KEY` trên máy chủ (vd Vercel) để dịch nghĩa câu và nhận xét câu trả lời
  chi tiết bằng Claude; không đặt thì app dùng nghĩa ghép theo từ điển và kiểm tra cơ bản. Giới hạn 120 lượt / giờ / người.
- Bút highlight dùng chung (`src/components/ink-layer.tsx`) cho Đọc hiểu và Luyện giao tiếp.

### Fixed

- **Icon menu màu không hiện trên máy đã mở app trước đó**: service worker giữ ảnh `nav-*.png` cũ (cùng tên file) → thêm phiên bản
  vào đường dẫn icon (`?v=2`) để mọi trình duyệt / app PWA tải bộ icon màu mới.

### Changed

- **Luyện giao tiếp — bố cục theo design**: màn rộng (≥1536px) chia 2 cột — danh sách câu hỏi bên trái (tiêu đề + "Tạo câu hỏi",
  chip lọc Tất cả / HSK / tag, ô tìm, sắp xếp, nút bộ lọc khác: đã đánh dấu + số câu mỗi trang; hàng: số thứ tự, câu hỏi + nghĩa,
  HSK, tag, loa, sửa, xoá; câu đang luyện được tô sáng), luyện tập bên phải; màn hẹp vẫn tách trang danh sách / luyện tập.
  **Mọi phần đều sửa được**: câu hỏi sửa ngay trên thẻ (chữ Hán, pinyin, nghĩa, HSK, tự sinh lại), pinyin + nghĩa của câu trả lời là
  ô sửa được (có đếm ký tự, nhãn "(đã sửa)" — sửa tay thì giữ nguyên, sửa câu trả lời thì tự sinh lại), bỏ HSK / tag ngay trên hàng tag;
  loa riêng cho câu hỏi, câu trả lời và nghĩa tiếng Việt (giọng vi). API `PUT …/answer` nhận thêm `answerPinyin` / `answerMeaning`.
- **Trang chủ**: bỏ thẻ **Bài học** (và dòng tiến độ bài học); 4 thẻ chức năng dùng icon màu giống thanh bên thay cho ô chữ
  词 / 文 / 音 / 听. Nút "Bắt đầu học ngay" mở Thư viện LingYu; khung "Bài học gần đây" đổi tên **Hoạt động gần đây**.
- **Bìa đầu trang — mascot ngồi trên mặt bàn** trước khung cửa sổ (như design), co giãn theo bề ngang bìa và có bóng đổ dưới chân.
- **Luyện nghe — ô Chép chính tả trên vở ô ly**: nền ngà kẻ ô 40px, chữ Khải; mỗi chữ Hán gõ vào nằm giữa một ô, dòng khớp hàng ô.
  Font Khải (LXGW WenKai) nét thường chia ~25 gói theo `unicode-range` (6.763 chữ GB2312 + dấu câu, `public/fonts/kai`,
  `src/app/kai-font.css`) — trình duyệt chỉ tải gói có chữ đang hiện, nên chữ bất kỳ đều hiện đúng kiểu Khải.
- **Bìa đầu trang — mascot ngồi trên bàn**: ảnh bìa mới, neo đáy (dư thì cắt phần trời phía trên) để luôn thấy mặt bàn cạnh cửa sổ;
  mascot đặt ngồi trên bàn. Thư viện: ảnh bìa chỉ phủ phần tiêu đề, hàng danh mục nằm dưới (mascot ngồi ngay trên bàn).
- **Đọc hiểu — giấy ngà nhẹ kẻ ô be** (như màu vở tập viết tiếng Trung); ô **Hiển thị pinyin / Hiển thị bản dịch**
  chuyển lên đầu thẻ Bài đọc, ngay cạnh bài.
- **Bìa đầu trang — mascot ngồi bậu cửa sổ cầm sách đọc** (bỏ chồng sách và bong bóng): vị trí và khoảng cách theo design — tiêu đề
  lớn có nhánh lá, mô tả, nút; mascot đặt trước khung cửa sổ, cao ~3/4 bìa. Trang chủ Thư viện dùng cùng mascot.
- **Đọc hiểu — Bút highlight**: bút trên bài đọc thành bút dạ quang — nét to, trong (chữ bên dưới vẫn rõ, nét chồng nhau không đậm
  dần), chọn 5 màu vàng / xanh lá / hồng / xanh dương / cam; thêm **Hoàn tác** nét vừa tô và **Xóa** toàn bộ highlight.
- **Bìa đầu trang cố định cho mọi màn / tab (theo design)**: `FeatureHero` dùng chung một ảnh bìa (trời xanh, cửa sổ, lá bay —
  `public/brand/hero/cover-bg.webp`) và một mascot đọc sách ngồi trên chồng sách HSK · 汉语 · 中国文化 (`mascot-books.webp`) kèm bong bóng
  "每天进步一点点！"; tiêu đề lớn, mô tả, nút thao tác. Áp dụng thêm cho các tab Thư viện (Từ vựng, Ngữ pháp, HSK, Từ vựng Thư viện)
  và trang chủ Thư viện. **Thư viện LingYu** chuyển xuống cuối thanh bên.
- **Thư viện LingYu — bìa mới theo design**: nền trời xanh + cửa sổ, chậu cây; tiêu đề "Thư viện **LingYu**" (LingYu màu xanh); ô tìm
  kiếm lớn + 2 ô chọn trình độ / sắp xếp bo tròn; mascot đọc sách ngồi trên chồng sách HSK · 汉语 · 中国文化 kèm bong bóng "每天进步一点点！"
  và lá bay; hàng danh mục nằm trong bìa (Tất cả, Từ vựng, Ngữ pháp, Phát âm, Hội thoại & Nghe, Bài đọc, Mẹo học) — nền pastel, icon
  trong ô màu, mũi tên tròn. Ảnh tách từ bộ design (`public/brand/library/`).
- **Đọc hiểu — bìa đầu trang + chữ đậm**: trang bài đọc có bìa kiểu Trang chủ (Bài đọc n · HSK · loại bài, tên bài chữ Khải, nghĩa,
  mascot); tiêu đề trên thanh công cụ "Bài đọc 1: 小狗" theo design; tên bài (dòng đầu giấy ô vuông, bìa, thanh trên) và câu hỏi in đậm
  rõ (thêm bản Bold của font Khải `paper-kai-bold.woff2` + tiện ích `kai-bold`).
- **Trang chủ**: bỏ dòng mô tả nhỏ dưới tên 5 thẻ chức năng. **Thanh bên**: bỏ mục **Bài học** (vẫn vào từ thẻ Bài học / nút "Bắt đầu
  học ngay" ở Trang chủ).
- **Bìa đầu trang thống nhất cho mọi chức năng (theo bìa Trang chủ)**: component dùng chung `FeatureHero` — nền trời xanh nhạt, ánh
  sáng + lá trang trí, tiêu đề lớn có lá, mô tả, nút thao tác kiểu bo tròn và mascot của chức năng bên phải — cho Thư viện LingYu, Bài học,
  Từ vựng của tôi, Ngữ pháp của tôi, Phát âm & Biến điệu, Luyện nghe, Đọc hiểu, Luyện dịch, Ôn tập, Tiến độ học tập, Bộ thủ và Cài đặt.
- **Đọc hiểu — chữ Khải như sách giáo khoa + tinh chỉnh theo design**: giấy ô vuông, câu hỏi, phương án và thẻ từ vựng dùng font
  **LXGW WenKai** (SIL OFL 1.1, tự host, cắt còn ~90KB chỉ gồm chữ trong bài đọc — `scripts/subset-paper-font.py`, test báo khi thiếu
  chữ). Thẻ bài đọc có nhãn **Bài đọc** và nút mở rộng; phần Câu hỏi có bộ đếm "1 / 3" với nút ‹ › chuyển câu; nút Gợi ý đáp án / Làm
  lại viền trắng, **Kiểm tra kết quả** xanh đậm.
- **Đọc hiểu — trang bài đọc theo thiết kế mới (vở ô vuông + câu hỏi)**: bỏ tranh minh hoạ; bên trái là bài đọc chép trên
  **giấy ô vuông kẻ kín trang** (số cột tự theo bề rộng, dòng đầu là tiêu đề căn giữa, mỗi câu bắt đầu dòng mới, chữ Khải nếu máy có),
  bấm từ khoá để xem nghĩa. Bên phải: danh sách câu hỏi (Gợi ý đáp án / Làm lại / Kiểm tra kết quả), hai ô **Hiển thị pinyin** /
  **Hiển thị bản dịch** (mặc định tắt — pinyin nhỏ trên đầu ô, bản dịch dưới mỗi câu), **Từ vựng nổi bật** (thẻ chữ Hán · pinyin · nghĩa,
  lưu từng từ / lưu tất cả), nút **Bài trước / Bài tiếp theo**. Thanh trên có **Bút** với 5 màu (đen, đỏ, xanh dương, xanh lá, vàng dạ
  quang) để khoanh / gạch trên bài và nút **Xóa** nét vẽ (nét vẽ chỉ nằm trên máy, không lưu lên máy chủ).
- **Trang chủ — bìa mới cho 5 chức năng**: mỗi thẻ (Bài học, Từ vựng, Ngữ pháp, Phát âm & Biến điệu, Luyện nghe & Nói) dùng mascot
  LingYu tương ứng (ôm sách HSK, đọc sách LY, bóng đèn ý tưởng, bong bóng vẫy tay, đeo tai nghe) cùng ô chữ đặc trưng (HSK / 词 / 文 / 音 /
  听) và lá trang trí trên nền pastel. **Bỏ ô tìm kiếm trên cùng** (trang `/search` và API `GET /api/v1/search` vẫn giữ).
- **Biểu tượng menu màu sắc (theo bộ icon mới)**: thay toàn bộ icon thanh bên và thanh tab điện thoại (Trang chủ, Thư viện LingYu,
  Bài học, Từ vựng, Ngữ pháp, Phát âm, Nghe, Đọc hiểu, Luyện dịch, Ôn tập, Tiến độ, Bộ thủ, Cài đặt) bằng icon màu; mục chưa chọn giữ
  nguyên màu (chỉ nhạt nhẹ) thay vì xám; Thư viện LingYu có icon riêng.
- **Đọc hiểu — trang bài đọc kiểu vở ô li (theo thiết kế mới)**: thanh trên có ‹ › chuyển bài cùng cấp HSK ("Bài đọc 1: 我的一天 · 1/4"),
  **Nghe mẫu** cả bài + chọn tốc độ (0.75x / 1.0x / 1.25x), nút **Aa** đổi cỡ chữ, bật / tắt pinyin và bản dịch, **Từ vựng** (hộp từ khoá,
  lưu từng từ / lưu tất cả), Lưu bài. Bên trái: tranh minh hoạ + bài đọc chép trên **giấy ô vuông** — mỗi chữ / dấu câu một ô, pinyin nhỏ
  trên đầu ô, từ khoá tô vàng (bấm xem nghĩa), mỗi câu bắt đầu dòng mới, nút mở rộng bài đọc. Bên phải: câu hỏi đánh số, phương án xếp
  ngang (A / B / C…), ô điền chữ Hán; **Gợi ý đáp án** (hiện nghĩa câu hỏi và phương án), **Làm lại**, **Kiểm tra kết quả**.
- **Từ vựng của tôi — thiết kế mới**: hàng thẻ **HSK** (Tất cả, HSK1–6, Khác — theo tag "HSK1", "HSK 2", "HSK3_Bài 1"…, nhiều tag
  HSK → cấp nhỏ nhất) kèm số từ; ô tìm + sắp xếp + nút **Lọc** (trạng thái Đã thuộc / Cần ôn, chỉ từ yêu thích); hàng chip tag nhiều màu
  (bấm để lọc, "…" đổi tên / xoá, + Thêm tag); bảng theo thiết kế: ô chữ Hán nền xanh nhạt, cột Pinyin bấm để sắp xếp, Tag, Trạng thái có
  biểu tượng, Ghi chú, cột **Xem** (con mắt mở chi tiết + ô 米字格 + cách viết); chọn **số từ mỗi trang** (8 / 10 / 20 / 50). API
  `GET /api/v1/vocab` nhận thêm `hsk`, `status`, `fav`, trả thêm `hskCounts`.
- **Ngữ pháp của tôi — thiết kế mới**:
  - Danh sách: tab **HSK** (Tất cả, HSK 1–6, Khác — lấy theo thẻ "HSK1", "HSK 2", "HSK3_Bài 1"…, kèm số bài), ô tìm + chuyển lưới /
    danh sách cùng hàng, chip thẻ nhiều màu (thẻ HSK không lặp lại ở đây), sắp xếp; thẻ bài đánh số, nhãn HSK + thẻ, công thức (chữ đỏ),
    một dòng nghĩa; lưới 3 cột trên màn rộng. API `GET /api/v1/grammar` nhận thêm `hsk`, trả thêm `hskCounts`.
  - Chi tiết: nhãn HSK + thẻ màu ở đầu trang; **Cấu trúc** chia tab theo từng dòng (dòng "Tên: công thức" → tên tab), công thức tách
    theo dấu "+" thành ô màu theo vai trò (Chủ ngữ, Khi nào, Ở đâu, Động từ, Tân ngữ, Danh từ, Tính từ, chữ Hán = từ khoá) có nhãn bên
    dưới; **Ví dụ** hiện pinyin ngay dưới từng từ, nghĩa bên cạnh; **Lưu ý** trên nền đỏ nhạt.
- **Đọc hiểu kiểu sách giáo khoa**: trang bài đọc chia 3 phần — **tranh minh hoạ** của bài (cột trái), **bài đọc** (giữa, mỗi câu có
  tranh nhỏ bên cạnh + số câu), **câu hỏi** (cột phải); màn hẹp hơn: tranh + bài, câu hỏi bên dưới; điện thoại xếp dọc. Kho bài đọc có
  ảnh bìa cho từng bài. Tranh vẽ bằng emoji trên nền màu (`src/data/reading/scenes.ts`), không tải ảnh ngoài.
- **Từ vựng của tôi — gọn hơn + nút con mắt xem chi tiết**: các ô 米字格 của một từ nối liền thành một hàng (như vở tập viết), nhỏ
  hơn trong bảng / thẻ; nút **con mắt** mở hộp chi tiết: chữ Hán trong ô 米字格, pinyin + nghe, nghĩa, ghi chú, tag, ảnh, **cách viết từng
  chữ** (xem nét viết / luyện viết), nút sửa.
- **Sửa lỗi giao diện**: Luyện tập nhanh (Biến điệu) — 4 đáp án không còn bị vỡ chữ trong cột hẹp (chia cột theo bề rộng khung, không
  theo màn hình); Luyện dịch — câu dài trong Lịch sử luyện dịch không còn tràn khung trên điện thoại (cũng chặn lỗi này ở Trang chủ,
  Đọc hiểu, Tiến độ, Phát âm).
- **Chữ Hán ở Từ vựng hiện trong ô 米字格**: viền đỏ, nét đứt đỏ theo chữ thập + hai đường chéo, cả chữ màu đỏ — ở Từ vựng của tôi
  (bảng + thẻ), chi tiết từ trong Thư viện, từ vựng LingYu public. Khung tập viết (bộ thủ, chi tiết từ) cũng đổi sang ô 米字格 và nét
  đỏ toàn bộ chữ; chi tiết từ trong Thư viện có thêm mục **Cách viết (thứ tự nét)**.
- **Nội dung của LingYu nằm ở Thư viện LingYu; bản của bạn nằm ở kho của bạn**:
  - **Bài học Phát âm & Biến điệu của LingYu nằm ở Thư viện**: `/library/pronunciation/*` (breadcrumb Thư viện / Phát âm). Link cũ
    `/pronunciation/initials|finals|tones|sandhi|practice` tự chuyển sang địa chỉ mới.
  - **Mục “Phát âm & Biến điệu” trên thanh bên giữ nguyên — là kho của bạn** (`/pronunciation`): **Từ & âm của tôi** (tự nhập chữ Hán /
    âm tiết — pinyin bỏ trống thì tự điền —, nghĩa, ghi chú, tag; tìm theo pinyin không dấu, lọc tag / nguồn) và **Ghi chú của tôi**
    (`/pronunciation/notes`). Ở Thư viện, mỗi từ ví dụ của thanh mẫu / vận mẫu / biến điệu có nút **Lưu vào Phát âm của tôi** (và **Lưu cả
    âm**): bản sao mang tag “Thư viện LingYu” + tên mục, sửa / thêm tag tự do; bài gốc không đổi. Bảng mới `pronunciation_item`
    (migration `0014`), có trong xuất / nhập dữ liệu. API `GET|POST /api/v1/pronunciation/items`, `GET|PUT|DELETE …/items/{id}`,
    `POST …/items/from-library`.
  - **Bỏ “Dùng dữ liệu mẫu”** ở Từ vựng của tôi, Ngữ pháp của tôi, Kho câu và Cài đặt: thay bằng liên kết **Lấy từ Thư viện LingYu**
    (kho câu → Luyện dịch với câu của LingYu). API `…/sample` vẫn chạy (đánh dấu deprecated).
  - **Sau khi lưu có lối tắt sửa / thêm tag**: lưu bài ngữ pháp → nút thành **Đã lưu · Sửa / thêm tag** (mở bản sao trong Ngữ pháp của tôi);
    lưu bộ / từ vựng → thông báo có nút mở đúng nhóm trong Từ vựng của tôi. API bài ngữ pháp trả thêm `savedId`; lưu lại bài đã lưu trả
    `{ added: false, id }`.

- **Luyện dịch theo “Từ vựng của tôi” — ưu tiên câu quen, báo rõ từ mới**: câu có nhiều từ trong kho của bạn nhất (ít từ mới nhất) được
  chọn trước. Mỗi câu hiện khối **“Từ mới trong câu”** (từ chưa có trong Từ vựng của tôi, kèm pinyin + nghĩa) với nút **+** thêm nhanh vào
  kho (tag “Luyện dịch”). Dịch sang tiếng Trung: chỉ báo số từ mới, danh sách hiện khi xem gợi ý hoặc đã trả lời (không lộ đáp án). API
  bài luyện dịch trả thêm `newWordCount`, `newWords`.
- **Nút loa (Từ vựng, Ngữ pháp, Thư viện LingYu, Ôn dịch câu, Trang chủ) đọc chậm hơn**: tốc độ giọng đọc 0,55 → 0,35
  (`SPEECH_RATE.normal`; Phát âm & Biến điệu vẫn dùng tốc độ riêng, chỉnh được).
- **Từ vựng của tôi — thẻ tag xếp A → Z** (trước: nhiều từ trước); số so theo giá trị (“HSK1_Bài 2” trước “HSK1_Bài 10”), không phân biệt
  hoa / thường. Áp dụng cho thẻ tag, bộ lọc nhanh, ô chọn tag và API `GET /api/v1/vocab/tags`.
- **Thêm từ ảnh — hiểu ảnh dạng bảng của giáo trình** ("1. 买 （动） mǎi (mãi) to buy mua"): mỗi dòng ra đúng **chữ Hán · pinyin ·
  nghĩa tiếng Việt** — bỏ số thứ tự, nhãn từ loại (动 / 名 / 量 / 形 / 助… kể cả khi OCR mất ngoặc), âm Hán Việt và chú thích trong ngoặc,
  cột tiếng Anh; nghĩa = cột ngoài cùng bên phải, nghĩa xuống dòng trong cột đó được nối lại. Pinyin: bản giữ dấu nếu hợp lệ, không thì
  bản không dấu (đúng chữ cái) rồi thêm dấu theo từ điển. Kết quả OCR giờ là các ô theo dòng kèm toạ độ (`parseOcrLines`).
- **Thêm từ ảnh — nhận dạng chữ Hán chính xác hơn (PaddleOCR)**: chữ Hán giờ được đọc bằng **PaddleOCR PP-OCRv4** (mô hình ONNX chạy
  ngay trên trình duyệt bằng onnxruntime-web, tự host ở `/ocr`) thay cho Tesseract — đọc đúng chữ viết tay, ảnh vở ô li, chữ nhỏ (ảnh vở
  viết tay 公斤: Tesseract ra “从 站”, PaddleOCR ra 公斤). Phần pinyin / nghĩa tiếng Việt trong mỗi vùng chữ được cắt riêng và đọc bằng
  Tesseract tiếng Việt (giữ dấu); đọc không chắc chắn → để trống, hệ thống gợi ý pinyin / nghĩa từ từ điển. Ảnh vẫn không rời máy. Bỏ dữ liệu
  Tesseract `chi_sim`. Lần đầu dùng tải ~20MB (sau đó dùng lại từ bộ nhớ đệm).

### Added

- **Thư viện LingYu — Ngữ pháp** (theo design, nội dung tự biên soạn): 21 bài HSK 1–3 (是, 有, 吗, 呢, 的, 在, 也, 都, 不 / 没, 想, 会,
  是…的, 了, 过, 比, 因为…所以, 正在, 把, 被, 虽然…但是, 越来越), song ngữ vi / en.
  - `/library/grammar`: tab HSK (Tất cả, HSK 1–6), tìm theo chữ Hán / pinyin không dấu / nghĩa / “HSK 2”, lọc chủ đề + trạng thái (đã học,
    chưa học, yêu thích), sắp xếp, chủ đề nổi bật, thẻ bài kèm câu ví dụ (lưới / danh sách); cột phải: lộ trình HSK (đã học x / y),
    chủ đề phổ biến, tài liệu liên quan.
  - `/library/grammar/{id}`: chữ Hán lớn + pinyin + nghĩa, Yêu thích / Lưu vào Ngữ pháp của tôi / Chia sẻ, mục lục (Tổng quan, Cấu trúc,
    Cách dùng, Ví dụ, Lưu ý, Bài tập), cấu trúc tô màu theo vai trò, ví dụ có nút nghe, bài tập nhanh (chọn đáp án → kiểm tra → giải thích,
    làm lại); cột phải: tiến độ cấp HSK + đánh dấu đã học, danh sách bài cùng cấp, bài liên quan, tài liệu liên quan; bài trước / tiếp.
  - Trang chủ Thư viện: danh mục Ngữ pháp mở được (bỏ “Sắp có”).
  - API: `GET /api/v1/library/grammar`, `GET /api/v1/library/grammar/{id}`, `PUT|DELETE …/{id}/learned`, `PUT|DELETE …/{id}/favorite`,
    `POST …/{id}/save`. Đã học / yêu thích / đã lưu là của riêng từng người (có test).

- **Thư viện LingYu — trang chủ + Bộ từ vựng** (theo design mới):
  - Trang chủ `/library`: danh mục (Từ vựng; Phát âm, Hội thoại & Nghe, Bài đọc dẫn tới mục hiện có; Ngữ pháp, Mẹo học “Sắp có”), tài liệu
    nổi bật, mới nhất, hướng dẫn sử dụng, chủ đề phổ biến; ô tìm kiếm + lọc trình độ.
  - `/library/vocabulary`: **15 bộ từ vựng do LingYu biên soạn** (~200 từ: chữ Hán, pinyin, nghĩa Việt / Anh, từ loại, hình minh hoạ, câu
    ví dụ có pinyin + dịch) — tìm (cả pinyin không dấu, “HSK 2”), lọc HSK / chủ đề / nhóm (Giao tiếp, Thiết yếu, Bộ thủ, Theo tình huống,
    Yêu thích), sắp xếp, dạng lưới / danh sách, sao yêu thích.
  - Chi tiết bộ: tiến độ (vòng x/y), danh sách từ có ví dụ, hiện / ẩn pinyin, lọc (chưa học / đã học / yêu thích), đánh dấu đã học, lưu cả
    bộ vào Từ vựng của tôi, chia sẻ; **Luyện tập**: “Nghe và chọn nghĩa”, “Ghép từ với hình ảnh” (đúng → đánh dấu đã học).
  - Chi tiết từ: nghĩa, cách phát âm (từng âm tiết + thanh, phát chậm với tốc độ 0.5–1x), ví dụ câu (tô màu từ), hình, bộ thủ & phân tích,
    từ liên quan, mẹo ghi nhớ, từ trước / sau, danh sách từ trong bộ.
  - `/library/vocabulary/hsk`: Từ vựng HSK 1–6 (đề cương HSK 3.0) — pinyin, nghĩa, từ loại, ví dụ, mẹo nhớ, đánh dấu đã học, tiến độ.
  - Từ vựng do admin đăng chuyển sang `/library/words` (link cũ `/library/vocabulary?w=` tự chuyển); menu “Thư viện LingYu” mở trang chủ.
  - API `/api/v1/library/home|sets|hsk/*`; bảng `library_learned`, `library_favorite` (migration `0013_library_progress`, xoá theo tài
    khoản).

- **Thư viện LingYu — admin tìm từ, tự phân tích + ảnh gợi ý**: ô nhập trên màn **Thêm từ vựng mới** gợi ý ngay khi gõ (chữ Hán: từ bắt
  đầu bằng phần đã gõ; pinyin / tiếng Việt: từ khớp; kèm HSK), chọn một từ → tự phân tích và tự điền. Sau khi phân tích, hệ thống tự tìm
  **hình ảnh gợi ý** từ Wikimedia (Wikidata P18 theo nhãn tiếng Trung + Commons; ảnh giấy phép tự do); bấm một ảnh để chọn — từ chưa lưu thì
  ảnh được lưu cùng lúc lưu từ. Máy chủ tự tải ảnh (chỉ từ `upload.wikimedia.org`, ≤ 1MB, kiểm tra magic bytes) và lưu **ghi công** (tác giả
  · giấy phép · nguồn), hiện dưới ảnh ở màn người học. Vẫn tự tải ảnh lên được. API `GET /api/v1/admin/library/suggest`,
  `GET /api/v1/admin/library/image-suggestions`, `PUT /api/v1/admin/library/words/{id}/image/suggested`; từ có thêm `imageCredit`
  (migration `0012_library_image_credit`). CSP `img-src` thêm `https://upload.wikimedia.org` (chỉ bản thu nhỏ trên màn admin).
- **Thư viện LingYu — Từ vựng**:
  - Người học: mục **Thư viện LingYu** trên menu (`/library/vocabulary`) — HSK 1–6, tìm (chữ Hán / pinyin / nghĩa, không dấu), chủ đề,
    sắp xếp; danh sách đánh số + chi tiết: chữ lớn, pinyin (nghe), nghĩa, từ loại, ảnh minh hoạ, bộ / thành phần, mẹo ghi nhớ, liên tưởng,
    ví dụ (nghe), từ / câu quen thuộc, ngữ pháp liên quan. Nút lưu → chép vào **Từ vựng của tôi** (thẻ “Thư viện LingYu” + HSK).
  - Admin (`/admin/library`): danh sách nháp / public; màn **Thêm từ vựng mới** — nhập chữ Hán, pinyin hoặc tiếng Việt → **Phân tích** tự điền
    pinyin, nghĩa, HSK, bộ thủ, cách nhớ gợi ý, từ liên quan, ví dụ, ngữ pháp (chỉ từ dữ liệu có sẵn), sửa mọi phần, xem trước, ảnh minh hoạ,
    **Lưu nháp** / **Lưu và Public** (public cần pinyin + nghĩa), về nháp, xoá.
  - Menu: “Từ vựng” → “Từ vựng của tôi”, “Ngữ pháp” → “Ngữ pháp của tôi” (thanh dưới điện thoại giữ tên ngắn).
  - API `/api/v1/library/*` và `/api/v1/admin/library/*`; bảng `library_word`, `library_image` (migration `0011_library_words`).
- **Luyện nghe — “Bài làm của tôi” dạng bảng** (`/listening/exercises`): khung tiêu đề + linh vật, 2 tab + “Tạo bài mới”, tìm / lọc
  tag / sắp xếp, bảng: #, biểu tượng theo nguồn (YouTube, TikTok, audio, video, không link), tiêu đề, tag màu, kết quả % + thanh,
  thời gian làm, nút mở. Bấm một bài → **trang chi tiết riêng** `/listening/exercises/[id]` (bài của người khác → 404); link cũ
  `?id=` tự chuyển sang trang mới. API danh sách trả thêm `sourceKind`.
- **Ngữ pháp — giao diện gọn theo thiết kế mới**: tiêu đề + “Thêm ngữ pháp mới”, thẻ lọc (số bài) + sắp xếp + “Dạng lưới / Danh sách”
  cùng một hàng, ô tìm kiếm rộng bên dưới; mỗi thẻ ngữ pháp: tiêu đề, thẻ HSK + nhãn loại, cấu trúc chính, nút mở (lưu / sửa / chia sẻ /
  xoá ở trang chi tiết). Thêm loại “Giới từ” (`preposition`).
- **Đọc hiểu — giao diện bài đọc mới** (`/reading/[id]`): thanh trên có HSK, công tắc “Hiện pinyin” / “Hiện bản dịch” (bản dịch
  bật sẵn), “Lưu bài”. Hai cột: bài đọc đánh số từng câu, **dòng pinyin phía trên câu** (từ khoá viết liền), từ khoá tô vàng
  (bấm xem nghĩa, lưu), bản dịch dưới câu, khung “Từ vựng nổi bật trong bài” (xem tất cả, lưu tất cả); cột câu hỏi có thanh tiến độ
  “x / N”, mỗi câu có pinyin + bản dịch, phương án hiện chữ cái, Hán tự, pinyin và nghĩa.
- API `GET /api/v1/reading/passages/{id}`: câu hỏi có thêm `py`, phương án có `optionInfo[{ py, meaning }]` (pinyin lấy từ từ khoá
  bài / từ điển có sẵn đã soát, còn lại pinyin-pro; nghĩa từ từ khoá bài / từ điển có sẵn, không có → `null`).
- **Ngữ pháp — giao diện mới** (`/grammar`): ô tìm kiếm + “Thêm ngữ pháp mới” trên cùng, khung tiêu đề có khẩu hiệu và linh vật,
  thẻ lọc “Tất cả (N)” · từng thẻ (số bài) · “+ Thêm thẻ”, sắp xếp, **dạng lưới / danh sách** (nhớ theo trình duyệt). Mỗi ngữ pháp
  là một thẻ 2 cột: biểu tượng + nhãn loại, tiêu đề, cấu trúc chính (chữ đỏ), thẻ (HSK tím), lưu, menu “…”, nút mở.
- **Biểu tượng cho tiêu đề ngữ pháp**: ở form thêm / sửa chọn 1 trong 14 loại (Danh từ, Lượng từ, Số đếm, Trợ từ, Đại từ nghi vấn,
  Cấu trúc câu, So sánh, Giao tiếp, Động từ, Tính từ, Phó từ, Thời gian, Bổ ngữ, Khác) hoặc “Tự động” (đoán theo thẻ → tiêu đề →
  cấu trúc). Hiện ở danh sách và trang chi tiết. Cột mới `grammar.icon` (migration `0010_grammar_icon`); API nhận / trả `icon`.
- **Thêm từ vựng từ ảnh** (`/vocabulary/new`): thẻ Chụp ảnh · Tải ảnh lên · Dán ảnh (Ctrl + V) · Nhập thủ công.
  - Nhận dạng chữ Hán + tiếng Việt **ngay trên trình duyệt** (tesseract.js, file tự host ở `/ocr`, chép từ node_modules lúc build);
    ảnh không tải lên, không lưu. Chỉ tải bộ nhận dạng (~5MB) khi dùng lần đầu, sau đó service worker giữ lại.
  - Bảng kết quả có ô chọn; từ đã có trong kho đánh dấu “Đã có” và bỏ chọn sẵn; pinyin / nghĩa / bộ thủ gợi ý từ dữ liệu có sẵn
    (từ mẫu, bài đọc, kho luyện dịch, HSK, pinyin-pro). Khung sửa từng từ: Hán tự, pinyin (nghe), nghĩa, bộ thủ, ghi chú, tag.
  - “Thêm vào danh sách (N)” thêm một lần, bỏ qua từ trùng.
  - API: `POST /api/v1/vocab/suggest`, `POST /api/v1/vocab/bulk`.
  - CSP thêm `'wasm-unsafe-eval'` (chỉ biên dịch WebAssembly, không cho eval JS); Permissions-Policy `camera=(self)`.
- **Từ vựng — giao diện mới** (`/vocabulary`): tiêu đề “Từ vựng của tôi (N)”, **thẻ tag** có biểu tượng theo chủ đề và số từ
  (bấm để lọc; “…” → đổi tên / xoá tag), thẻ “Tạo tag mới”, tìm trong tag đang chọn, chuyển **dạng danh sách / dạng lưới**
  (nhớ theo trình duyệt), Hán tự màu đỏ, nút nghe cạnh pinyin, thanh thao tác Ôn tập · Chia sẻ · Thêm tag · Cần ôn · Đã thuộc · Xóa,
  chân trang “Hiển thị x–y trong N từ vựng”.
- API tag từ vựng: `POST /api/v1/vocab/tags`, `PATCH` / `DELETE /api/v1/vocab/tags/{id}` (trùng tên → 409, tag người khác → 404;
  xoá tag không xoá từ).

- **Đọc hiểu** (`/reading`, thay trang “đang hoàn thiện”):
  - Kho 16 bài đọc HSK 1–4 (đoạn ngắn, hội thoại, bài đọc; 10 chủ đề), mỗi bài có pinyin từng chữ, bản dịch vi / en từng câu,
    từ khoá, điểm ngữ pháp, 3 câu hỏi (trắc nghiệm + điền từ).
  - Chọn bài: cấp (tự động theo trình độ ước lượng từ kho từ vựng, hoặc HSK 1–4), dạng bài, chủ đề, nội dung — LingYu tự chọn
    (ưu tiên bài chưa đọc) / theo từ vựng của tôi / theo ngữ pháp. Kho bài đọc hiển thị để chọn trực tiếp.
  - Đọc: **pinyin trên đầu chữ** (bật/tắt), bản dịch (bật/tắt), nghe từng câu, bấm từ khoá → pinyin + nghĩa + **Lưu vào từ vựng**,
    **Lưu bài** để đọc lại.
  - Nộp bài: server chấm, đáp án đúng từng câu, từ vựng + ngữ pháp trong bài, **Lưu tất cả** từ vào Từ vựng (bỏ qua từ đã có),
    Làm lại / Đọc bài khác; ghi vào Tiến độ học tập và Lịch sử đọc.
  - Bảng `reading_attempt`, `reading_saved` (migration 0009). API `/api/v1/reading/*` — có trong Swagger; dữ liệu riêng từng người.
- **Luyện nghe · Chép chính tả – giao diện mới** (theo thiết kế): thanh tiêu đề gọn có **Hướng dẫn** (5 bước) và **Lưu bài làm**;
  cột **1. Nguồn nghe** với tab YouTube / Podcast / Radio / **TikTok** (trình phát nhúng chính thức, chỉ phát) / Link khác, khối
  **Điều chỉnh tốc độ** 0.5x–**2x** và **Chuyển đến thời gian**, lặp đoạn A–B gọn trong một mục mở/đóng; cột **2. Chép chính tả**
  có **Mẹo**, **Mở rộng** (phóng to vùng chép), đáp án tham khảo (“Nhập đáp án”), **Ghi chú**, “Kiểm tra kết quả”, “Lưu bài làm”.
  Podcast / Radio nhận cả link phát trực tiếp không có đuôi file.
- **Chữ bôi vàng hiện pinyin + nghĩa**: rê chuột (điện thoại: chạm) vào đoạn bôi vàng → thẻ nhỏ có pinyin và nghĩa — ghi chú bạn đã
  gắn cho từ đó, nếu chưa có thì lấy nghĩa trong kho Từ vựng của bạn; bấm để ghi / sửa / xoá nghĩa. Ghi chú lưu cùng bài làm và
  hiện khi rê chuột ở “Bài làm của tôi”. API mới `GET /api/v1/listening/lookup?words=` (chỉ tra kho của chính mình).
- **Luyện dịch – cải tiến**:
  - Dịch đoạn ngắn: chọn **3, 4 hoặc 5 đoạn**; kho mẫu có thêm 24 đoạn (tổng 32 đoạn, mỗi cấp HSK 1–4 có 8 đoạn).
  - **Làm lại ra câu khác**: bài mới ưu tiên câu / đoạn chưa làm; đã làm hết thì lấy câu làm lâu nhất trước.
  - **Ngữ pháp của tôi** hiện trước “Ngữ pháp có sẵn”: câu hỏi lấy từ câu ví dụ bạn đã nhập trong mục Ngữ pháp, phần giải thích
    dùng cấu trúc, ý nghĩa và ghi chú của bạn; ngữ pháp chưa có ví dụ thì dùng câu mẫu có cùng chữ Hán trong cấu trúc (vd 把).
    Lưu được câu ví dụ đó vào Kho câu của tôi. `GET /api/v1/translation` thêm `myGrammar`; tạo bài nhận `myGrammarIds`.
- **Trang chủ + menu dùng hình theo thiết kế**: 5 thẻ chức năng có hình minh hoạ (sách HSK, thẻ 词, sổ ngữ pháp, tai nghe,
  micro), linh vật LY cầm bút trên sách “加油” ở ảnh bìa, ngọn lửa ở thẻ chuỗi ngày học, icon mục tiêu / lịch / tiến độ, icon
  “Bài học gần đây” có dấu tick xanh; menu bên trái và thanh tab dưới dùng bộ icon xanh theo thiết kế, linh vật vẫy tay ở cuối
  menu. Hình nằm ở `public/brand/ui/` (cả hình cho Đọc hiểu, Luyện dịch, Ôn tập, Tiến độ, Bộ thủ và bộ icon nhỏ để dùng tiếp).
- **Luyện dịch với kho câu mẫu có sẵn** (menu “Luyện dịch”, `/translate`):
  - Kho câu mẫu HSK 1–4: 48 câu + 8 đoạn ngắn, 10 chủ đề, 24 điểm ngữ pháp. Mỗi câu có bản dịch vi / en (nhiều cách dịch được
    chấp nhận), cách nói khác, phân tích từ (chữ Hán, pinyin, nghĩa) và giải thích cấu trúc ngữ pháp (công thức + áp vào câu).
    Trang **Kho câu mẫu** (`/translate/bank`) lọc theo cấp / ngữ pháp / dạng, tìm theo chữ Hán, pinyin hoặc nghĩa.
  - Tạo bài: dịch câu hoặc đoạn ngắn; Việt → Trung, Trung → Việt hoặc trộn; nội dung **LingYu tự chọn** (theo trình độ ước lượng từ
    kho từ vựng, ưu tiên câu chưa làm), **theo ngữ pháp** (chọn điểm ngữ pháp) hoặc **theo từ vựng của tôi**; cấp độ, chủ đề, số câu.
  - Làm bài: đồng hồ + tạm dừng (thời gian lưu ở server, không tính lúc dừng), gợi ý 2 bước (từ khoá → cấu trúc), server chấm (bỏ dấu
    câu / khoảng trắng; kèm độ giống %), “Tính là đúng”, danh sách câu đã làm, làm tiếp được sau khi tải lại.
  - Kết quả: điểm, độ chính xác, thời gian, gợi ý đã dùng, lời giải từng câu; **Lịch sử luyện dịch**; ghi vào Tiến độ học tập.
  - “Lưu vào kho câu” → câu mẫu vào Kho câu của tôi (`/sentences`, vẫn ôn dịch câu như cũ).
  - Bảng `translation_session` (migration 0008). API `/api/v1/translation/*` — có trong Swagger; bài của người khác → 404.
- **Trang chủ thiết kế lại theo mẫu mới**: ảnh bìa (lời chào, nút "Bắt đầu học ngay", câu trích viết tay, linh vật, thẻ
  chuỗi ngày học với 7 ngày trong tuần), 5 thẻ Bài học / Từ vựng / Ngữ pháp / Phát âm & Biến điệu / Luyện nghe & Nói,
  "Mục tiêu của bạn" (phút học hôm nay / mục tiêu), "Tiến độ học tập" dạng vòng tròn (Từ vựng, Ngữ pháp, Đọc hiểu, Luyện dịch,
  Ôn tập), "Bài học gần đây" có thời gian tương đối. Menu bên trái sắp lại: Trang chủ, Bài học, Từ vựng, Ngữ pháp, Phát âm &
  Biến điệu, Luyện nghe & Nói, Đọc hiểu, Luyện dịch, Ôn tập │ Tiến độ học tập, Bộ thủ │ Cài đặt. `GET /api/v1/progress` thêm
  `summary.sessions30` (số bài 30 ngày theo kỹ năng).
- **Trang chủ mới + Tiến độ học tập** (theo thiết kế):
  - Trang chủ: lời chào, ô **Tìm kiếm** (từ vựng, ngữ pháp, câu, bài học, bộ thủ — `/search`), 5 thẻ Từ vựng / Ngữ pháp / Luyện
    dịch / Đọc hiểu / Ôn tập, khối **Học tập hôm nay** (từ đã học, ngữ pháp, bài đọc, câu dịch, số phút), **Tiến độ học tập** và
    **Bài học gần đây**.
  - Menu chia 3 nhóm; “Ôn dịch câu” đổi tên thành **Luyện dịch**, thêm **Đọc hiểu** (`/reading`, đang làm) và **Tiến độ học tập**
    (`/progress`); thanh tab dưới trên điện thoại: Trang chủ, Từ vựng, Ngữ pháp, Ôn tập, Tiến độ.
  - **Tiến độ học tập** (`/progress`): tổng thời gian học (so với tuần trước), bài học, từ vựng, ngữ pháp đã học, chuỗi ngày học
    liên tiếp + lưới 2 tuần, biểu đồ thời gian học 7 / 30 / 90 ngày, kỹ năng, mục tiêu (sửa được); trang con Từ vựng (theo HSK 1–7
    theo HSK 3.0 và theo tag), Ngữ pháp (theo HSK / tag), Lịch sử học tập (lọc loại + thời gian).
  - Thời gian học đếm bằng nhịp 60 giây khi trang đang mở và người dùng đang thao tác. Ôn từ, ôn câu, bài học, luyện nghe, luyện
    phát âm, thêm từ / ngữ pháp được tự ghi vào lịch sử (bảng `study_activity`, `study_day`, `study_goal`, `grammar_mastery`,
    migration 0007). Danh sách từ HSK từ gói `hsk3.1-syllabus` (MIT).
  - API `/api/v1/progress*`, `/api/v1/search`; `/api/v1/home` thêm `today`, `streak`, `recent` — có trong Swagger. Dữ liệu của
    người khác không bao giờ lộ (có test unit + e2e).
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

- Từ vựng: xoá ô tìm kiếm rồi bấm ngay thẻ tag không còn bị lượt tìm kiếm trễ ghi đè bộ lọc tag.
- Tài liệu API (`/api-docs`): các nhóm route thu gọn sẵn — mở hết ~150 route làm Swagger UI dừng vẽ sau nhóm đầu tiên.
- Đọc hiểu: tăng tương phản nút “Quay lại” và dòng gợi ý từ khoá (axe color-contrast).
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
