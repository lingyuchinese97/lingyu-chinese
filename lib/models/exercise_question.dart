import 'exercise_type.dart';

/// Data model theo mục "10. Data model gợi ý" của spec.
class ExerciseQuestion {
  const ExerciseQuestion({
    required this.id,
    required this.type,
    this.audioAsset,
    required this.prompt,
    required this.options,
    required this.correctIndex,
    this.explanation,
    this.maxReplays,
  }) : assert(options.length == 4, 'Mỗi câu luôn có đúng 4 đáp án A-D');

  final String id;
  final ExerciseType type;

  /// Đường dẫn asset audio, null nếu câu hỏi không có audio.
  final String? audioAsset;

  final String prompt;
  final List<String> options;
  final int correctIndex;
  final String? explanation;

  /// Số lần tối đa được phát lại audio. Null = không giới hạn.
  final int? maxReplays;

  static const List<String> optionLabels = ['A', 'B', 'C', 'D'];
}
