import 'package:flutter/material.dart';

/// Danh sách icon key theo mục "11. Asset package" của spec.
/// File gốc PNG (nền trong suốt) do chủ dự án cung cấp phải được đặt tại
/// `assets/icons/bai1/<key>.png`. Cho tới khi có file gốc, widget này tự
/// động fallback sang Material Icon tương ứng để app vẫn chạy được và
/// không bị lỗi asset-not-found khi build.
///
/// KHÔNG dùng widget này để "vẽ lại" icon — đây chỉ là placeholder tạm
/// thời. Khi có PNG gốc, chỉ cần copy file vào đúng thư mục, không cần
/// sửa code.
enum LingYuIconKey {
  speaker('ic_speaker', Icons.volume_up_rounded),
  play('ic_play', Icons.play_arrow_rounded),
  correct('ic_correct', Icons.check_circle_rounded),
  wrong('ic_wrong', Icons.cancel_rounded),
  next('ic_next', Icons.arrow_forward_rounded),
  back('ic_back', Icons.arrow_back_ios_new_rounded),
  home('ic_home', Icons.home_rounded),
  retry('ic_retry', Icons.refresh_rounded),
  lock('ic_lock', Icons.lock_rounded),
  lesson('ic_lesson', Icons.menu_book_rounded),
  listening('ic_listening', Icons.hearing_rounded),
  blending('ic_blending', Icons.merge_type_rounded);

  const LingYuIconKey(this.assetName, this.fallback);

  final String assetName;
  final IconData fallback;

  String get assetPath => 'assets/icons/bai1/$assetName.png';
}

class LingYuIcon extends StatelessWidget {
  const LingYuIcon(
    this.iconKey, {
    super.key,
    this.size = 24,
    this.color,
  });

  final LingYuIconKey iconKey;
  final double size;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      iconKey.assetPath,
      width: size,
      height: size,
      color: color,
      errorBuilder: (context, error, stackTrace) {
        return Icon(iconKey.fallback, size: size, color: color);
      },
    );
  }
}
