import 'package:flutter/material.dart';

import '../core/theme.dart';
import '../data/bai1_blending_data.dart';
import '../models/exercise_question.dart';
import '../models/exercise_type.dart';
import '../state/bai1_progress.dart';
import '../state/exercise_session.dart';
import '../widgets/answer_option_card.dart';
import '../widgets/audio_play_button.dart';
import '../widgets/feedback_banner.dart';
import '../widgets/lingyu_bottom_nav.dart';
import '../widgets/lingyu_header.dart';
import 'result_screen.dart';

/// Màn làm bài, dùng chung cho cả 2 phần (Nghe & nhận diện, Ghép âm) vì
/// cùng một luồng: chọn đáp án -> tự chấm ngay -> khoá đáp án -> hiện
/// feedback (mascot vui/buồn) -> "Nghe lại" + "Tiếp tục", khớp UI thật.
class ExerciseScreen extends StatefulWidget {
  const ExerciseScreen({
    super.key,
    required this.type,
    required this.questions,
    required this.progress,
  });

  final ExerciseType type;
  final List<ExerciseQuestion> questions;
  final Bai1Progress progress;

  @override
  State<ExerciseScreen> createState() => _ExerciseScreenState();
}

class _ExerciseScreenState extends State<ExerciseScreen> {
  late final ExerciseSession _session = ExerciseSession(widget.questions);
  final GlobalKey<AudioPlayButtonState> _audioKey = GlobalKey<AudioPlayButtonState>();

  @override
  void dispose() {
    _session.dispose();
    super.dispose();
  }

  void _onNext() {
    final hasNext = _session.goToNextQuestion();
    if (hasNext) return;

    final correct = _session.correctCount;
    final total = _session.totalQuestions;

    if (widget.type == ExerciseType.listening) {
      widget.progress.reportListening(correct, total);
      // ignore: use_build_context_synchronously
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => ExerciseScreen(
            type: ExerciseType.blending,
            questions: bai1BlendingQuestions,
            progress: widget.progress,
          ),
        ),
      );
    } else {
      widget.progress.reportBlending(correct, total);
      // ignore: use_build_context_synchronously
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => ResultScreen(progress: widget.progress)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _session,
      builder: (context, _) {
        final question = _session.currentQuestion;

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
                          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Câu ${_session.currentIndex + 1} / ${_session.totalQuestions}',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: LingYuColors.navy),
                              ),
                              const SizedBox(height: 8),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(999),
                                child: LinearProgressIndicator(
                                  value: (_session.currentIndex + 1) / _session.totalQuestions,
                                  minHeight: 8,
                                  backgroundColor: LingYuColors.progressTrack,
                                  valueColor: const AlwaysStoppedAnimation(LingYuColors.blue),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(22),
                              boxShadow: const [BoxShadow(color: Color(0x0F143C78), blurRadius: 14, offset: Offset(0, 4))],
                            ),
                            child: Column(
                              children: [
                                AudioPlayButton(key: _audioKey, audioAsset: question.audioAsset),
                                const SizedBox(height: 10),
                                Text(
                                  'Nghe và chọn đáp án đúng',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: LingYuColors.navy),
                                ),
                                const SizedBox(height: 18),
                                GridView.count(
                                  crossAxisCount: 2,
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  mainAxisSpacing: 10,
                                  crossAxisSpacing: 10,
                                  childAspectRatio: 2.6,
                                  children: List.generate(question.options.length, (i) {
                                    return AnswerOptionCard(
                                      label: ExerciseQuestion.optionLabels[i],
                                      text: question.options[i],
                                      state: _session.stateForOption(i),
                                      onTap: () => _session.selectAnswer(i),
                                    );
                                  }),
                                ),
                                if (_session.answered) ...[
                                  const SizedBox(height: 14),
                                  FeedbackBanner(
                                    isCorrect: _session.isCorrectSelection,
                                    correctAnswerLabel:
                                        '${ExerciseQuestion.optionLabels[question.correctIndex]}. ${question.options[question.correctIndex]}',
                                  ),
                                  const SizedBox(height: 14),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: OutlinedButton.icon(
                                          onPressed: () => _audioKey.currentState?.play(),
                                          icon: const Icon(Icons.replay_rounded, size: 16),
                                          label: const Text('Nghe lại'),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: _onNext,
                                          child: Text(_session.isLastQuestion
                                              ? (widget.type == ExerciseType.listening ? 'Tiếp tục →' : 'Xem kết quả →')
                                              : 'Tiếp tục →'),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const LingYuBottomNav(),
              ],
            ),
          ),
        );
      },
    );
  }
}
