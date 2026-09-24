// Cấu hình tầng API. Khi có backend thật: đặt MODE = "http" và BASE_URL,
// rồi viết lại phần thân các hàm trong authApi / vocabApi / reviewApi (giữ nguyên chữ ký hàm).
export const API_CONFIG = {
  MODE: "mock",
  BASE_URL: "",
  /** Độ trễ giả lập mạng cho bản mock (ms) — giúp thấy loading state. */
  LATENCY: 350,
  /** Bản mock không gửi email thật → hiển thị mã OTP trên màn Verify Email. */
  SHOW_DEMO_OTP: true,
};
