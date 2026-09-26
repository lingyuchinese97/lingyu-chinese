# Quy ước cho `web-next/`

## Mọi chức năng mới phải có API

Từ nay, mỗi chức năng mới (hoặc chức năng sửa lớn) ngoài giao diện web còn phải có **REST API** để app khác
(vd app điện thoại) gọi được:

- Route ở `src/app/api/v1/<tính năng>/.../route.ts`, trả JSON dạng `{ ok: true, data }` hoặc `{ ok: false, message }`
  với mã HTTP đúng (400 dữ liệu sai, 401 chưa đăng nhập, 403 không có quyền, 404 không có / không phải của mình).
- **Dùng chung service** với Server Action (`src/features/<tính năng>/service.ts`): không viết lại logic trong route.
- Xác thực bằng phiên Better Auth (`currentUserOrThrow()`), không bao giờ tin `userId` gửi từ client;
  mọi truy vấn lọc theo user của phiên. Admin dùng `adminOrThrow()`.
- Kiểm tra input bằng Zod (dùng lại `src/features/<tính năng>/schema.ts`).
- Có test (unit cho service, e2e hoặc test gọi route cho quyền truy cập: người lạ → 401, người khác → 404).
- Ghi route mới vào mục API trong `README.md` và vào `CHANGELOG.md`.

## Quy trình mỗi thay đổi

1. `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm e2e` đều phải qua.
2. Cập nhật `CHANGELOG.md` (và `PLAN.md` nếu có quyết định mới).
3. Commit bằng tiếng Anh, đẩy lên nhánh làm việc, mở PR; chỉ gộp khi CI xanh **và** chủ dự án đồng ý.

## Bảo mật

Không hỏi / không ghi secret (connection string, `BETTER_AUTH_SECRET`...) vào code, commit hay chat.
Ghi chú cá nhân, ảnh và dữ liệu của người khác không bao giờ được lộ (phải có test chứng minh).
Không sửa `web/`, `lib/`, `assets/`, `pubspec.yaml` và workflow GitHub Pages.
