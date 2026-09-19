import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/bai1_blending_data.dart';
import '../data/bai1_listening_data.dart';
import '../models/exercise_type.dart';
import '../state/bai1_progress.dart';
import '../widgets/lingyu_bottom_nav.dart';
import 'exercise_screen.dart';

/// Màn Home Bài 1, khớp UI thật: pill "ÔN TẬP • BÀI 1", mascot trong bong
/// bóng (asset gốc), card "Nội dung ôn tập" (3 chỉ số), card "Hướng dẫn
/// làm bài" (3 bước), nút "Bắt đầu ôn tập" mở lần lượt Listening rồi
/// Blending, kết thúc ở màn Kết quả tổng hợp.
class Bai1HomeScreen extends StatelessWidget {
  const Bai1HomeScreen({super.key});

  void _start(BuildContext context) {
    final progress = Bai1Progress();
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => ExerciseScreen(
          type: ExerciseType.listening,
          questions: bai1ListeningQuestions,
          progress: progress,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
                    // header
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
                      child: Image.asset(
                        'assets/branding/logo.png',
                        height: 40,
                        errorBuilder: (context, error, stackTrace) => const Text(
                          'LingYu Chinese',
                          style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: LingYuColors.blue),
                        ),
                      ),
                    ),

                    // title zone with mascot bubble
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                      child: SizedBox(
                        height: 190,
                        child: Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Positioned(
                            right: -6,
                            top: 6,
                            child: Image.asset(
                              'assets/branding/mascot_bubble.png',
                              width: 170,
                              errorBuilder: (context, error, stackTrace) => const SizedBox(width: 170, height: 170),
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFDECA6),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: const Text(
                                  'ÔN TẬP • BÀI 1',
                                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF7A5A22)),
                                ),
                              ),
                              const SizedBox(height: 10),
                              SizedBox(
                                width: 190,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Nghe ghép âm',
                                      style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: LingYuColors.navy, height: 1.15),
                                    ),
                                    const SizedBox(height: 5),
                                    Text(
                                      'Nghe và chọn đáp án đúng nhé!',
                                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: LingYuColors.textSecondary, height: 1.3),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ],
                        ),
                      ),
                    ),

                    // Nội dung ôn tập
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
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
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(color: const Color(0xFFDFF6E8), borderRadius: BorderRadius.circular(999)),
                              child: const Text('Nội dung ôn tập', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13, color: Color(0xFF2C8659))),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(child: _StatTile(color: LingYuColors.red, icon: Icons.record_voice_over_rounded, value: '11', label: 'thanh mẫu', tagBg: LingYuColors.redBg, tagColor: LingYuColors.red, tag: 'b·p·m·f...')),
                                const SizedBox(width: 8),
                                Expanded(child: _StatTile(color: const Color(0xFF43ADFC), icon: Icons.graphic_eq_rounded, value: '10', label: 'vận mẫu', tagBg: const Color(0xFFE4F3FF), tagColor: const Color(0xFF1F8EFB), tag: 'a·o·e·i·u...')),
                                const SizedBox(width: 8),
                                Expanded(child: _StatTile(color: const Color(0xFF28D58D), icon: Icons.show_chart_rounded, value: '4', label: 'thanh điệu', tagBg: const Color(0xFFDFF6E8), tagColor: const Color(0xFF2C8659), tag: 'ā á ă à')),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Hướng dẫn làm bài
                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 14, 14, 0),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: const Color(0xFFEFF8FD), borderRadius: BorderRadius.circular(20)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Hướng dẫn làm bài', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15, color: LingYuColors.navy)),
                            const SizedBox(height: 14),
                            Row(
                              children: [
                                Expanded(child: _StepTile(num: '1', color: const Color(0xFF3A88EE), icon: Icons.headphones_rounded, title: 'Nghe âm thanh', sub: 'Nhấn để nghe')),
                                Expanded(child: _StepTile(num: '2', color: const Color(0xFF16CE8A), icon: Icons.touch_app_rounded, title: 'Chọn đáp án', sub: 'A, B, C hoặc D')),
                                Expanded(child: _StepTile(num: '3', color: const Color(0xFFFEB23A), icon: Icons.check_rounded, title: 'Kiểm tra kết quả', sub: 'Chuyển câu tiếp theo')),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),

                    Padding(
                      padding: const EdgeInsets.fromLTRB(14, 16, 14, 0),
                      child: ElevatedButton(
                        onPressed: () => _start(context),
                        child: const Text('Bắt đầu ôn tập  →'),
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

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.color,
    required this.icon,
    required this.value,
    required this.label,
    required this.tagBg,
    required this.tagColor,
    required this.tag,
  });

  final Color color;
  final IconData icon;
  final String value;
  final String label;
  final Color tagBg;
  final Color tagColor;
  final String tag;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 4),
      decoration: BoxDecoration(color: const Color(0xFFEFF7FD), borderRadius: BorderRadius.circular(16)),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            child: Icon(icon, color: Colors.white, size: 18),
          ),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: LingYuColors.navy)),
          Text(label, textAlign: TextAlign.center, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFF5B6B80))),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: tagBg, borderRadius: BorderRadius.circular(999)),
            child: Text(tag, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: tagColor)),
          ),
        ],
      ),
    );
  }
}

class _StepTile extends StatelessWidget {
  const _StepTile({required this.num, required this.color, required this.icon, required this.title, required this.sub});

  final String num;
  final Color color;
  final IconData icon;
  final String title;
  final String sub;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
                child: Icon(icon, color: color, size: 18),
              ),
              Positioned(
                top: -3,
                left: -3,
                child: Container(
                  width: 17,
                  height: 17,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  child: Center(child: Text(num, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 10))),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(title, textAlign: TextAlign.center, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: LingYuColors.navy)),
          const SizedBox(height: 2),
          Text(sub, textAlign: TextAlign.center, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: LingYuColors.textSecondary)),
        ],
      ),
    );
  }
}
