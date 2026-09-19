import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Header dùng chung cho Exercise & Result screen, khớp UI thật:
/// logo/wordmark gốc bên trái, pill "Bài 1" + nút Home tròn bên phải.
/// (Màn Home dùng bố cục logo riêng, xem [Bai1HomeScreen].)
class LingYuHeader extends StatelessWidget {
  const LingYuHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Image.asset(
            'assets/branding/logo.png',
            height: 34,
            errorBuilder: (context, error, stackTrace) => const Text(
              'LingYu Chinese',
              style: TextStyle(fontWeight: FontWeight.w800, color: LingYuColors.blue),
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(999),
              border: Border.all(color: const Color(0xFFCFE6FF), width: 1.5),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.menu_book_outlined, size: 15, color: LingYuColors.blue),
                SizedBox(width: 5),
                Text(
                  'Bài 1',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12.5, color: LingYuColors.blue),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            borderRadius: BorderRadius.circular(999),
            onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
            child: Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Color(0x1F143C78), blurRadius: 6)],
              ),
              child: const Icon(Icons.home_rounded, size: 16, color: LingYuColors.blue),
            ),
          ),
        ],
      ),
    );
  }
}
