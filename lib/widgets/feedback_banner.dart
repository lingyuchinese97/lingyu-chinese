import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Banner phản hồi sau khi trả lời, khớp UI thật: hình mascot vui/buồn
/// (asset gốc) + tiêu đề + phụ đề (đáp án đúng khi trả lời sai).
class FeedbackBanner extends StatelessWidget {
  const FeedbackBanner({
    super.key,
    required this.isCorrect,
    required this.correctAnswerLabel,
  });

  final bool isCorrect;

  /// Ví dụ "C. mă" — chỉ hiển thị khi trả lời sai.
  final String correctAnswerLabel;

  @override
  Widget build(BuildContext context) {
    final bg = isCorrect ? LingYuColors.greenBg : LingYuColors.redBg;
    final color = isCorrect ? const Color(0xFF1E8E3E) : const Color(0xFFD93A47);
    final asset = isCorrect
        ? 'assets/branding/mascot_happy.png'
        : 'assets/branding/mascot_sad.png';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
      child: Row(
        children: [
          Image.asset(
            asset,
            width: 58,
            height: 58,
            errorBuilder: (context, error, stackTrace) => Icon(
              isCorrect ? Icons.sentiment_satisfied_rounded : Icons.sentiment_dissatisfied_rounded,
              size: 40,
              color: color,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  isCorrect ? 'Chính xác! 🎉' : 'Chưa đúng!',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: color),
                ),
                const SizedBox(height: 2),
                Text(
                  isCorrect ? 'Bạn đã chọn đúng đáp án.' : 'Đáp án đúng là $correctAnswerLabel',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12.5, color: color.withOpacity(0.85)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
