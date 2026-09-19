import 'package:flutter/material.dart';

/// Design tokens khớp theo UI thật (ảnh mockup Home / Nghe ghép âm / Kết
/// quả) mà chủ dự án gửi — thay cho bộ màu nháp ban đầu trong spec docx.
class LingYuColors {
  LingYuColors._();

  static const Color navy = Color(0xFF0B2A66); // tiêu đề, chữ đậm
  static const Color blue = Color(0xFF0B5FEE); // nút chính, progress, active
  static const Color blueLight = Color(0xFFEAF4FF); // nền badge mặc định
  static const Color blueBorder = Color(0xFFDCEFFD);
  static const Color progressTrack = Color(0xFFD6E9FD);

  static const Color green = Color(0xFF16C556); // đúng
  static const Color greenBg = Color(0xFFE9FBF1);
  static const Color greenBorder = Color(0xFFBEEBD0);

  static const Color red = Color(0xFFF0424F); // sai
  static const Color redBg = Color(0xFFFDE9EC);
  static const Color redBorder = Color(0xFFF9C8CE);

  static const Color leaf = Color(0xFF8FD98A);

  static const Color background = Color(0xFFEDF6FF);
  static const Color cardBackground = Colors.white;
  static const Color textSecondary = Color(0xFF8B98A8);
  static const Color disabled = Color(0xFFB7C3D6);

  // Giữ alias cũ để khỏi phải sửa toàn bộ chỗ gọi trong code cũ.
  static const Color primary = blue;
  static const Color success = green;
  static const Color error = red;
  static const Color successBackground = greenBg;
  static const Color errorBackground = redBg;
  static const Color defaultOptionBorder = blueBorder;
  static const Color selectedOptionFill = blueLight;
  static const Color textPrimary = navy;
}

class LingYuTheme {
  LingYuTheme._();

  static ThemeData light() {
    final base = ThemeData(useMaterial3: true, brightness: Brightness.light);
    return base.copyWith(
      scaffoldBackgroundColor: LingYuColors.background,
      colorScheme: base.colorScheme.copyWith(
        primary: LingYuColors.blue,
        error: LingYuColors.red,
        surface: LingYuColors.cardBackground,
      ),
      textTheme: base.textTheme.apply(
        bodyColor: LingYuColors.navy,
        displayColor: LingYuColors.navy,
      ),
      cardColor: LingYuColors.cardBackground,
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: LingYuColors.blue,
          foregroundColor: Colors.white,
          disabledBackgroundColor: LingYuColors.disabled,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: LingYuColors.blue,
          side: const BorderSide(color: LingYuColors.blue, width: 1.5),
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          textStyle: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

/// Card radius dùng chung.
const double kCardRadius = 20;
