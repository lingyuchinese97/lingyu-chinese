import 'package:flutter/foundation.dart';

import '../models/exercise_question.dart';

enum AnswerOptionState { unset, selected, correct, wrong, disabled }

/// Quản lý state của MỘT lượt làm bài (list câu hỏi của 1 section).
/// Theo mục "9. Logic xử lý câu hỏi" của spec:
/// - answerState mặc định = unanswered
/// - chọn đáp án -> evaluate ngay, khoá 4 option
/// - sai vẫn highlight đáp án đúng
/// - nút "Câu tiếp theo" chỉ hiện sau khi đã trả lời, câu cuối đổi thành
///   "Xem kết quả"
class ExerciseSession extends ChangeNotifier {
  ExerciseSession(this.questions) : assert(questions.isNotEmpty);

  final List<ExerciseQuestion> questions;

  int _currentIndex = 0;
  int? _selectedIndex;
  bool _answered = false;
  int _correctCount = 0;

  int get currentIndex => _currentIndex;
  int get totalQuestions => questions.length;
  ExerciseQuestion get currentQuestion => questions[_currentIndex];
  int? get selectedIndex => _selectedIndex;
  bool get answered => _answered;
  int get correctCount => _correctCount;
  bool get isLastQuestion => _currentIndex == questions.length - 1;
  bool get isCorrectSelection =>
      _answered && _selectedIndex == currentQuestion.correctIndex;

  /// Trạng thái hiển thị cho từng AnswerOptionCard (bảng mục 6 của spec).
  AnswerOptionState stateForOption(int optionIndex) {
    if (!_answered) {
      return optionIndex == _selectedIndex
          ? AnswerOptionState.selected
          : AnswerOptionState.unset;
    }
    if (optionIndex == currentQuestion.correctIndex) {
      return AnswerOptionState.correct;
    }
    if (optionIndex == _selectedIndex) {
      return AnswerOptionState.wrong;
    }
    return AnswerOptionState.disabled;
  }

  void selectAnswer(int optionIndex) {
    if (_answered) return; // đã khoá, không cho đổi đáp án
    _selectedIndex = optionIndex;
    _answered = true;
    if (optionIndex == currentQuestion.correctIndex) {
      _correctCount++;
    }
    notifyListeners();
  }

  /// Trả về false nếu đây đã là câu cuối (nên điều hướng sang màn kết quả).
  bool goToNextQuestion() {
    if (isLastQuestion) return false;
    _currentIndex++;
    _selectedIndex = null;
    _answered = false;
    notifyListeners();
    return true;
  }

  void reset() {
    _currentIndex = 0;
    _selectedIndex = null;
    _answered = false;
    _correctCount = 0;
    notifyListeners();
  }
}
