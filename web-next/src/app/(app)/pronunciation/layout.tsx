import { PronunciationHeader } from "@/features/pronunciation/components/pron-header";

/** Phát âm & Biến điệu (thanh bên) — kho riêng của người học: từ / âm tự nhập hoặc lưu từ Thư viện LingYu, ghi chú. */
export default function MyPronunciationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <PronunciationHeader mode="mine" />
      {children}
    </div>
  );
}
