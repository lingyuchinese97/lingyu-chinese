import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../state/exercise_session.dart';

/// Card đáp án khớp UI thật: badge tròn (A/B/C/D) bên trái + chữ to bên
/// phải, không có icon overlay góc như bản nháp trước.
/// default -> nền trắng, badge xanh nhạt, chữ navy
/// correct -> nền/badge xanh lá
/// wrong   -> nền/badge đỏ
/// disabled(các đáp án còn lại sau khi trả lời) -> chữ xám nhạt
class AnswerOptionCard extends StatelessWidget {
  const AnswerOptionCard({
    super.key,
    required this.label,
    required this.text,
    required this.state,
    required this.onTap,
  });

  final String label; // A / B / C / D
  final String text;
  final AnswerOptionState state;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final style = _styleFor(state);
    final clickable = state == AnswerOptionState.unset;

    return Material(
      color: style.bg,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: clickable ? onTap : null,
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: style.border, width: 1.5),
          ),
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(color: style.badgeBg, shape: BoxShape.circle),
                child: Center(
                  child: Text(
                    label,
                    style: TextStyle(color: style.badgeText, fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Flexible(
                child: Text(
                  text,
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: style.text),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  _OptionStyle _styleFor(AnswerOptionState state) {
    switch (state) {
      case AnswerOptionState.unset:
      case AnswerOptionState.selected:
        return const _OptionStyle(
          bg: Colors.white,
          border: LingYuColors.blueBorder,
          badgeBg: LingYuColors.blueLight,
          badgeText: LingYuColors.navy,
          text: LingYuColors.navy,
        );
      case AnswerOptionState.correct:
        return const _OptionStyle(
          bg: LingYuColors.greenBg,
          border: LingYuColors.green,
          badgeBg: LingYuColors.green,
          badgeText: Colors.white,
          text: LingYuColors.navy,
        );
      case AnswerOptionState.wrong:
        return const _OptionStyle(
          bg: LingYuColors.redBg,
          border: LingYuColors.red,
          badgeBg: LingYuColors.red,
          badgeText: Colors.white,
          text: LingYuColors.navy,
        );
      case AnswerOptionState.disabled:
        return const _OptionStyle(
          bg: Colors.white,
          border: LingYuColors.blueBorder,
          badgeBg: LingYuColors.blueLight,
          badgeText: Color(0xFFAFC0D6),
          text: Color(0xFFAFC0D6),
        );
    }
  }
}

class _OptionStyle {
  const _OptionStyle({
    required this.bg,
    required this.border,
    required this.badgeBg,
    required this.badgeText,
    required this.text,
  });

  final Color bg;
  final Color border;
  final Color badgeBg;
  final Color badgeText;
  final Color text;
}
