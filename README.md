# LingYu Chinese — Bài 1 (Flutter)

Module Bài 1 (luyện tập ngữ âm) cho app **LingYu Chinese**, implement theo
`LingYu_Chinese_Bai1_App_Spec_for_Claude.docx`.

## Cách chạy

```bash
flutter pub get
flutter run
```

Yêu cầu Flutter SDK bản ổn định gần nhất (project dùng Material 3,
`ThemeData.useMaterial3: true`). Nếu gặp lỗi API theme lệch phiên bản SDK
rất cũ/mới (ví dụ `CardTheme`), báo lại — đây là phần dễ vỡ nhất khi
Flutter đổi API theo từng version.

## Những gì đã có trong lần bàn giao này

- Toàn bộ code Flutter cho Bài 1: Home, Listening (16 câu), Blending
  (20 câu), auto-check, khoá đáp án, feedback đúng/sai, progress, màn kết
  quả, Làm lại / Về Bài 1.
- 20 file audio thật (`assets/audio/bai1/blending/q01.mp3` → `q20.mp3`)
  giải nén từ `bai1.rar` bạn gửi — đã gắn cho phần **Ghép âm**.
- Nội dung câu hỏi (16 câu Listening + 20 câu Blending) lấy đúng từ bảng
  trong spec, hard-code trong `lib/data/`.

## Còn thiếu — cần bạn bổ sung

Icon PNG gốc (`assets/icons/bai1/`), logo/mascot gốc (`assets/branding/`),
và audio riêng cho phần Listening (`assets/audio/bai1/listening/`) **không
có trong lần đính kèm này** (những file đó chỉ có trong `bai1.rar`, và rar
chỉ chứa 20 file `q01–q20.mp3`). App vẫn chạy được ngay bây giờ nhờ
fallback (Material Icon thay icon PNG, chữ "LingYu Chinese" thay logo) —
mỗi thư mục asset có sẵn `README.txt` ghi rõ tên file cần thả vào, không
cần sửa code.

## Cấu trúc thư mục

```
lib/
  core/        theme, design tokens, icon helper (fallback PNG -> Material)
  models/      ExerciseQuestion, ExerciseType
  data/        dữ liệu câu hỏi Bài 1 (Listening, Blending)
  state/       ExerciseSession (logic 1 lượt làm bài), Bai1Progress
  widgets/     LingYuAppBar, LessonSectionCard, QuestionProgress,
               AudioPlayButton, AnswerOptionCard, FeedbackBanner,
               PrimaryActionButton, ResultSummaryCard
  screens/     Bai1HomeScreen, ExerciseScreen, SectionSummaryScreen
assets/
  audio/bai1/listening/   (trống, chờ audio thật)
  audio/bai1/blending/    q01.mp3 .. q20.mp3 (đã có)
  icons/bai1/             (trống, chờ PNG gốc)
  branding/               (trống, chờ logo/mascot gốc)
```

Kiến trúc tách model / data / state / widget / screen rõ ràng để dễ thêm
Bài 2 sau này (chỉ cần thêm file data mới + tái sử dụng `ExerciseScreen`).

## Đối chiếu Acceptance criteria (mục 14 spec)

- [x] Màn Home Bài 1 + 2 section bài tập
- [x] Listening đủ 16 câu, Blending đủ 20 câu
- [x] Mỗi câu hiển thị riêng (1 câu/màn hình)
- [x] Đúng/sai phản hồi ngay, khoá đáp án sau khi chọn
- [x] Có progress (số câu + progress bar) và result summary
- [x] Icon dùng cơ chế asset PNG (fallback Material tới khi có PNG gốc)
- [x] Không tự vẽ lại mascot/logo — chỉ reference asset gốc
- [x] Layout mobile-first, dùng SafeArea, tránh RenderFlex overflow (dùng
      SingleChildScrollView cho phần nội dung câu hỏi)
- [x] Tách model / data / widgets / screens
