# LingYu Chinese — bản Next.js (`web-next/`)

> Tài liệu đầy đủ (cài đặt, lệnh, deploy) được hoàn thiện ở phase 12. Mục dưới đây mô tả cách thêm bài học.

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
