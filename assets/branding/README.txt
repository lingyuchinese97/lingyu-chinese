Đặt file logo/mascot GỐC của dự án vào đây:

logo.png     -> dùng ở header (LingYuAppBar, showLogo: true)
mascot.png   -> (tuỳ chọn) dùng ở màn Home nếu muốn thêm mascot

Cho tới khi có file gốc, header sẽ tự fallback hiển thị chữ "LingYu
Chinese" thay vì logo (xem lib/widgets/lingyu_app_bar.dart) để không lỗi
khi build. Chỉ cần copy đúng tên file vào đây, không cần sửa code.

QUAN TRỌNG (theo spec mục 1): PHẢI dùng file gốc do chủ dự án cung cấp.
Không AI vẽ lại, không đổi màu, không bóp méo logo/mascot.
