import 'package:flutter/foundation.dart';

/// Kết quả một section đã hoàn thành, dùng để hiển thị tiến độ ở Home.
class SectionResult {
  const SectionResult({required this.correctCount, required this.total});

  final int correctCount;
  final int total;

  double get ratio => total == 0 ? 0 : correctCount / total;
}

/// Lưu tiến độ Bài 1 trong phiên làm việc hiện tại (in-memory).
/// Có thể thay bằng SharedPreferences/DB sau này mà không đổi UI,
/// vì UI chỉ phụ thuộc vào interface ChangeNotifier này.
class Bai1Progress extends ChangeNotifier {
  SectionResult? listeningResult;
  SectionResult? blendingResult;

  void reportListening(int correctCount, int total) {
    listeningResult = SectionResult(correctCount: correctCount, total: total);
    notifyListeners();
  }

  void reportBlending(int correctCount, int total) {
    blendingResult = SectionResult(correctCount: correctCount, total: total);
    notifyListeners();
  }
}
