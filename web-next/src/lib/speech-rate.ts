/**
 * Tốc độ giọng đọc tiếng Trung (Web Speech API, 1 = tốc độ bình thường của giọng máy) cho các nút Nghe chung
 * (Ngữ pháp, Ôn dịch câu, Trang chủ). Module Phát âm & Biến điệu dùng tốc độ riêng, chậm hơn và chỉnh được
 * (xem `features/pronunciation/components/speech.ts`).
 */
export const SPEECH_RATE = {
  normal: 0.55,
} as const;
