import '../models/exercise_question.dart';
import '../models/exercise_type.dart';

/// Phần 2 – Ghép âm (20 câu).
/// Nội dung tự biên soạn theo bảng ở mục "8. Phần 2" của spec.
/// Audio minh hoạ cách đọc âm tiết đúng: assets/audio/bai1/blending/q01..20.mp3
final List<ExerciseQuestion> bai1BlendingQuestions = [
  _q(1, 'b + a', ['bā', 'pā', 'mā', 'bō'], 0),
  _q(2, 'p + o', ['pā', 'pō', 'bō', 'mō'], 1),
  _q(3, 'm + i', ['mū', 'mī', 'nī', 'lī'], 1),
  _q(4, 'f + u', ['fū', 'hū', 'bū', 'pū'], 0),
  _q(5, 'd + a', ['tā', 'dā', 'nā', 'lā'], 1),
  _q(6, 't + i', ['dī', 'tī', 'nī', 'lī'], 1),
  _q(7, 'n + i', ['mī', 'lī', 'nī', 'dī'], 2),
  _q(8, 'l + a', ['nā', 'lā', 'dā', 'tā'], 1),
  _q(9, 'b + ai', ['bāi', 'pāi', 'bēi', 'bāo'], 0),
  _q(10, 'p + ei', ['bēi', 'pēi', 'pāi', 'pōu'], 1),
  _q(11, 'm + ao', ['māi', 'māo', 'mōu', 'nāo'], 1),
  _q(12, 'f + ou', ['fāo', 'fēi', 'fōu', 'pōu'], 2),
  _q(13, 'd + ai', ['dāi', 'tāi', 'dēi', 'dāo'], 0),
  _q(14, 't + ao', ['dāo', 'tāo', 'nāo', 'tōu'], 1),
  _q(15, 'n + ei', ['nēi', 'lēi', 'nāi', 'nōu'], 0),
  _q(16, 'l + ou', ['nōu', 'lāo', 'lōu', 'lēi'], 2),
  _q(17, 'b + i', ['bī', 'pī', 'mī', 'bū'], 0),
  _q(18, 'p + u', ['pū', 'bū', 'fū', 'pī'], 0),
  _q(19, 'm + a', ['mā', 'nā', 'lā', 'mō'], 0),
  _q(20, 'l + i', ['nī', 'lī', 'dī', 'tī'], 1),
];

ExerciseQuestion _q(
  int number,
  String prompt,
  List<String> options,
  int correctIndex,
) {
  final numStr = number.toString().padLeft(2, '0');
  return ExerciseQuestion(
    id: 'blending_$numStr',
    type: ExerciseType.blending,
    audioAsset: 'assets/audio/bai1/blending/q$numStr.mp3',
    prompt: prompt,
    options: options,
    correctIndex: correctIndex,
    maxReplays: 3,
  );
}
