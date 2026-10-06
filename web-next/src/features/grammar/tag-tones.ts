/** Màu chip thẻ (xoay vòng như thiết kế): cam, vàng, tím, xanh lá, hồng, xanh dương, tím nhạt, ngọc, đỏ. */
export const TAG_TONES = [
  "bg-[#FFF1E6] text-[#C2570C] border-[#FFE0C7]",
  "bg-[#FFF6DD] text-[#9A6A00] border-[#FCE7AE]",
  "bg-[#F1ECFF] text-[#6B3FD0] border-[#E2D8FF]",
  "bg-[#E9F8EE] text-[#1E8A4C] border-[#CDEFD9]",
  "bg-[#FFECEF] text-[#C42A42] border-[#FFD3DA]",
  "bg-[#EAF3FF] text-[#1F5FCC] border-[#CFE1FB]",
  "bg-[#F6EDFF] text-[#8A3FC4] border-[#EAD9FB]",
  "bg-[#E6F8F8] text-[#0B7A7A] border-[#C8EDED]",
  "bg-[#FFEDEB] text-[#B4341F] border-[#FFD6D0]",
];
export const tagTone = (i: number) => TAG_TONES[((i % TAG_TONES.length) + TAG_TONES.length) % TAG_TONES.length]!;
