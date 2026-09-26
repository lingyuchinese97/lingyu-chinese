/** Giới hạn dữ liệu — lấy đúng theo bản cũ (web/src/services/api/*.js) + spec. */
export const VOCAB = {
  MAX_NOTE: 200,
  MAX_TAG: 24,
  MAX_RADICALS: 10,
  MAX_HANZI: 40,
  MAX_PINYIN: 120,
  MAX_MEANING: 200,
  PAGE_SIZE: 8,
} as const;

export const IMAGE = {
  /** Ảnh gốc người dùng chọn. */
  MAX_INPUT_BYTES: 5 * 1024 * 1024,
  /** Sau khi nén ở trình duyệt: mục tiêu và giới hạn cứng (server kiểm tra lại). */
  TARGET_BYTES: 300 * 1024,
  MAX_BYTES: 1024 * 1024,
  MAX_EDGE: 1024,
  QUALITY: 0.8,
  MIME: ["image/webp", "image/jpeg", "image/png"] as const,
} as const;

/** Ôn dịch câu. */
export const SENTENCE = {
  MAX_CHINESE: 200,
  MAX_PINYIN: 400,
  MAX_VIETNAMESE: 300,
  MAX_NOTE: 200,
  MAX_TAGS: 5,
  MAX_TAG: 24,
  PAGE_SIZE: 10,
} as const;

/** Luyện nghe – Chép chính tả. */
export const LISTENING = {
  MAX_TITLE: 100,
  /** Đáp án, pinyin, bài chép, ghi chú: tối đa 2.000 ký tự mỗi ô. */
  MAX_TEXT: 2000,
  MAX_URL: 2000,
  MAX_TAGS: 10,
  MAX_TAG: 24,
  /** Số đoạn định dạng tối đa trong bài chép (bút đỏ / bôi vàng). */
  MAX_SPANS: 2000,
  SPEEDS: [0.5, 0.75, 1, 1.25, 1.5] as const,
  PAGE_SIZE: 20,
} as const;
