Đặt 12 file PNG icon gốc (nền trong suốt) do chủ dự án cung cấp vào đây,
đúng tên theo mục "11. Asset package" của spec:

ic_speaker.png
ic_play.png
ic_correct.png
ic_wrong.png
ic_next.png
ic_back.png
ic_home.png
ic_retry.png
ic_lock.png
ic_lesson.png
ic_listening.png
ic_blending.png

Cho tới khi có file gốc, app dùng Material Icon tạm thay thế
(xem lib/core/lingyu_icons.dart) để không bị lỗi asset-not-found khi build.
Chỉ cần copy đúng tên file PNG vào đây — không cần sửa code, app sẽ tự
dùng icon gốc thay cho icon tạm.

QUAN TRỌNG: không AI vẽ lại icon, không đổi màu, không bóp méo — dùng
đúng file gốc của dự án.
