/**
 * Tốc độ giọng đọc tiếng Trung (Web Speech API, 1 = tốc độ bình thường của giọng máy).
 * Đặt chậm để người học nghe rõ từng âm và thanh điệu. Dùng chung cho mọi nút "Nghe".
 */
export const SPEECH_RATE = {
  /** Nút Nghe thông thường. */
  normal: 0.55,
  /** Nút "Nghe chậm" trong Luyện tập. */
  slow: 0.35,
  /** Nghe từng chữ tách rời (trước biến điệu). */
  syllable: 0.45,
} as const;
