import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/bai1_listening_data.dart';
import '../data/bai1_blending_data.dart';
import '../models/exercise_type.dart';
import '../state/bai1_progress.dart';
import '../widgets/lingyu_bottom_nav.dart';
import '../widgets/lingyu_header.dart';
import 'exercise_screen.dart';

/// Màn "Chúc mừng bạn" (khớp UI thật) — tổng kết cả 2 phần: Nghe & nhận
/// diện + Ghép âm, với mascot ăn mừng (asset gốc) và 2 nút Làm lại /
/// Tiếp tục.
class ResultScreen extends StatelessWidget {
  const ResultScreen({super.key, required this.progress});

  final Bai1Progress progress;

  @override
  Widget build(BuildContext context) {
    final listening = progress.listeningResult;
    final blending = progress.blendingResult;

    void retry() {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ExerciseScreen(
            type: ExerciseType.listening,
            questions: bai1ListeningQuestions,
            progress: Bai1Progress(),
          ),
        ),
      );
    }

    void backHome() {
      Navigator.of(context).popUntil((route) => route.isFirst);
    }

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const LingYuHeader(),

                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
                          const SizedBox(height: 8),
                          const Text(
                            '恭喜你！',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Color(0xFFEF5350), height: 1.2),
                          ),
                          const Text(
                            'Gōngxǐ nǐ!',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF2E9BFF)),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Chúc mừng bạn!',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: LingYuColors.navy),
                          ),
                          const Text(
                            'Bạn đã hoàn thành Bài 1',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF3E6FB8)),
                          ),
                          const SizedBox(height: 14),
                          Image.asset(
                            'assets/branding/mascot_celebrate.png',
                            width: 190,
                            errorBuilder: (context, error, stackTrace) => Image.asset(
                              'assets/branding/mascot_bubble.png',
                              width: 170,
                              errorBuilder: (context, error, stackTrace) => const SizedBox(width: 170, height: 170),
                            ),
                          ),
                        ],
                      ),
                    ),

                    // stats card
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 6, 16, 0),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: const [BoxShadow(color: Color(0x0F143C78), blurRadius: 14, offset: Offset(0, 4))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.bar_chart_rounded, color: LingYuColors.blue, size: 18),
                                const SizedBox(width: 8),
                                Text('Kết quả của bạn', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: LingYuColors.navy)),
                              ],
                            ),
                            const SizedBox(height: 14),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: _ResultStat(
                                    icon: Icons.headphones_rounded,
                                    label: 'Nghe & nhận diện',
                                    correct: listening?.correctCount ?? 0,
                                    total: listening?.total ?? bai1ListeningQuestions.length,
                                  ),
                                ),
                                Container(width: 1, height: 78, color: const Color(0xFFEAF0F7), margin: const EdgeInsets.symmetric(horizontal: 12)),
                                Expanded(
                                  child: _ResultStat(
                                    icon: Icons.merge_type_rounded,
                                    label: 'Ghép âm',
                                    correct: blending?.correctCount ?? 0,
                                    total: blending?.total ?? bai1BlendingQuestions.length,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: retry,
                              icon: const Icon(Icons.replay_rounded, size: 16),
                              label: const Text('Làm lại bài'),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: backHome,
                              child: const Text('Tiếp tục Bài 2 →'),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
            const LingYuBottomNav(),
          ],
        ),
      ),
    );
  }
}

class _ResultStat extends StatelessWidget {
  const _ResultStat({required this.icon, required this.label, required this.correct, required this.total});

  final IconData icon;
  final String label;
  final int correct;
  final int total;

  @override
  Widget build(BuildContext context) {
    final ratio = total == 0 ? 0.0 : correct / total;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: LingYuColors.blue, size: 26),
        const SizedBox(height: 6),
        Text(label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: Color(0xFF3E6FB8))),
        const SizedBox(height: 4),
        Text('$correct / $total', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: LingYuColors.navy)),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value: ratio,
            minHeight: 7,
            backgroundColor: LingYuColors.progressTrack,
            valueColor: const AlwaysStoppedAnimation(LingYuColors.blue),
          ),
        ),
      ],
    );
  }
}
