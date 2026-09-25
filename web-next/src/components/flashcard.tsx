import { cn } from "@/lib/utils";

/** Thẻ học xếp chồng (trang trí) như bản cũ: chữ Hán + pinyin + nghĩa. */
export function Flashcard({
  hanzi,
  pinyin,
  meaning,
  className,
}: {
  hanzi: string;
  pinyin: string;
  meaning?: string;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("relative h-[150px] w-[210px]", className)}>
      <div className="absolute inset-0 translate-x-[-26px] translate-y-2 -rotate-12 rounded-2xl border border-[#E1ECF7] bg-[#F1F7FE] shadow-[0_10px_24px_rgba(34,93,150,.12)]" />
      <div className="absolute inset-0 translate-x-[-12px] translate-y-1 -rotate-5 rounded-2xl border border-[#E1ECF7] bg-[#F7FBFF] shadow-[0_10px_24px_rgba(34,93,150,.12)]" />
      <div className="absolute inset-0 flex -rotate-6 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl border border-[#E1ECF7] bg-white p-2.5 shadow-[0_10px_24px_rgba(34,93,150,.12)]">
        <div className="max-w-full truncate font-cn text-[46px] leading-tight font-semibold text-[#1E5FD6]" lang="zh">
          {hanzi}
        </div>
        <div className="text-[17px] font-semibold text-navy">{pinyin}</div>
        {meaning ? <div className="max-w-full truncate text-sm text-text-2">{meaning}</div> : null}
      </div>
    </div>
  );
}

export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={cn("absolute size-[18px] text-[#F6C343]", className)}>
      <path
        d="M12 2c.6 4.6 2.4 6.9 7 7.6-4.6.7-6.4 3-7 7.6-.6-4.6-2.4-6.9-7-7.6 4.6-.7 6.4-3 7-7.6Z"
        fill="currentColor"
      />
    </svg>
  );
}
