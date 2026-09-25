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
