import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Thanh tab bar 5 mục dưới cùng, khớp UI thật: Trang chủ / Bài học /
/// Luyện tập / Tiến độ / Khác. Module Bài 1 chỉ thuộc "Luyện tập" nên tab
/// đó luôn ở trạng thái active (chấm tròn xanh + gạch chân) — 4 tab còn lại
/// chỉ mang tính minh hoạ, chưa có màn hình tương ứng trong module này.
class LingYuBottomNav extends StatelessWidget {
  const LingYuBottomNav({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 66,
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x0D143C78),
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _NavItem(icon: Icons.home_rounded, label: 'Trang chủ'),
            _NavItem(icon: Icons.menu_book_rounded, label: 'Bài học'),
            _NavItem(icon: Icons.headphones_rounded, label: 'Luyện tập', active: true),
            _NavItem(icon: Icons.bar_chart_rounded, label: 'Tiến độ'),
            _NavItem(icon: Icons.menu_rounded, label: 'Khác'),
          ],
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({required this.icon, required this.label, this.active = false});

  final IconData icon;
  final String label;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final color = active ? LingYuColors.blue : LingYuColors.textSecondary;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (active)
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(color: LingYuColors.blue, shape: BoxShape.circle),
            child: Icon(icon, size: 17, color: Colors.white),
          )
        else
          Icon(icon, size: 19, color: color),
        const SizedBox(height: 3),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: active ? FontWeight.w800 : FontWeight.w600,
            color: color,
          ),
        ),
        if (active) ...[
          const SizedBox(height: 1),
          Container(width: 26, height: 3, decoration: BoxDecoration(color: LingYuColors.blue, borderRadius: BorderRadius.circular(3))),
        ],
      ],
    );
  }
}
