import { PronunciationHeader } from "@/features/pronunciation/components/pron-header";

export default function PronunciationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <PronunciationHeader />
      {children}
    </div>
  );
}
