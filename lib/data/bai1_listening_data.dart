import '../models/exercise_question.dart';
import '../models/exercise_type.dart';

/// Phần 1 – Nghe & nhận diện (16 câu).
/// Nội dung tự biên soạn theo bảng ở mục "7. Phần 1" của spec.
///
/// Lưu ý: bộ audio đính kèm trong lần bàn giao này (q01–q20.mp3) đã được
/// dùng cho phần Ghép âm (xem bai1_blending_data.dart). Phần Nghe chưa có
/// file audio riêng — hãy đặt file theo đúng convention
/// `assets/audio/bai1/listening/q<NN>.mp3` khi có, AudioPlayButton sẽ tự
/// nhận và phát mà không cần sửa code.
final List<ExerciseQuestion> bai1ListeningQuestions = [
  _q(1, 'b', ['b', 'p', 'm', 'f'], 0),
  _q(2, 'p', ['m', 'p', 'd', 'b'], 1),
  _q(3, 'm', ['f', 'n', 'm', 'l'], 2),
  _q(4, 'f', ['b', 'd', 'f', 't'], 2),
  _q(5, 'd', ['d', 't', 'n', 'l'], 0),
  _q(6, 't', ['n', 'l', 't', 'd'], 2),
  _q(7, 'n', ['m', 'n', 'l', 'f'], 1),
  _q(8, 'l', ['d', 't', 'n', 'l'], 3),
  _q(9, 'a', ['o', 'e', 'a', 'i'], 2),
  _q(10, 'o', ['a', 'u', 'o', 'e'], 2),
  _q(11, 'e', ['i', 'e', 'ü', 'u'], 1),
  _q(12, 'i', ['u', 'a', 'o', 'i'], 3),
  _q(13, 'u', ['i', 'u', 'e', 'a'], 1),
  _q(14, 'ü', ['u', 'i', 'ü', 'e'], 2),
  _q(15, 'ai', ['ei', 'ao', 'ai', 'ou'], 2),
  _q(16, 'ei', ['ai', 'ou', 'ao', 'ei'], 3),
];

ExerciseQuestion _q(
  int number,
  String audioKey,
  List<String> options,
  int correctIndex,
) {
  final id = 'listening_${number.toString().padLeft(2, '0')}';
  return ExerciseQuestion(
    id: id,
    type: ExerciseType.listening,
    audioAsset: 'assets/audio/bai1/listening/q'
        '${number.toString().padLeft(2, '0')}.mp3',
    prompt: 'Nghe và chọn đúng âm bạn vừa nghe được',
    options: options,
    correctIndex: correctIndex,
    maxReplays: 3,
  );
}
