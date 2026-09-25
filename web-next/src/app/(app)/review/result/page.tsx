import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Heart, Star } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getLastResult } from "@/features/review/service";
import { ResultActions } from "@/features/review/components/review-result-actions";

export const metadata: Metadata = { title: "Hoàn thành ôn tập" };
export const dynamic = "force-dynamic";

const CONFETTI: [number, number, string, number][] = [
  [8, 20, "#F6C343", 20],
  [18, 60, "#58D39B", -30],
  [86, 16, "#F6C343", 40],
  [80, 52, "#FF7A6B", 15],
  [30, 6, "#58D39B", 60],
  [70, 4, "#6AB8FF", -20],
  [92, 78, "#A6E3FF", 30],
  [4, 76, "#A6E3FF", -40],
];

function message(acc: number): [string, string] {
  if (acc >= 80)
    return ["Làm tốt lắm!", "Bạn đã nắm khá vững các từ vựng này. Hãy ôn tập thêm để ngày càng tiến bộ hơn nhé!"];
  if (acc >= 50) return ["Khá lắm!", "Bạn đã nhớ được hơn một nửa. Ôn lại các từ sai để ghi nhớ chắc hơn nhé!"];
  return ["Đừng nản lòng!", "Mỗi lần sai là một lần nhớ lâu hơn. Hãy ôn lại các từ chưa đúng ngay nhé!"];
}

export default async function ReviewResultPage() {
  const user = await requireUser();
  const s = await getLastResult(user.id);
  if (!s) redirect("/review/setup");
  const total = s.total;
  const ok = s.questions.filter((q) => q.isCorrect).length;
  const wrong = total - ok;
  const acc = total ? Math.round((ok / total) * 100) : 0;
  const [mTitle, mText] = message(acc);

  return (
    <>
      <Breadcrumb back="/review/setup" section="Ôn tập" current="Hoàn thành ôn tập" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section
          aria-labelledby="rr-title"
          className="flex flex-col items-center gap-5 rounded-[var(--radius-xl)] border border-border bg-white/92 p-5 text-center shadow-card md:p-8"
        >
          <div aria-hidden="true" className="relative h-[170px] w-full max-w-[360px]">
            {CONFETTI.map(([x, y, c, r]) => (
              <span
                key={`${x}-${y}`}
                className="absolute h-2.5 w-4 rounded-sm"
                style={{ left: `${x}%`, top: `${y}%`, background: c, transform: `rotate(${r}deg)` }}
              />
            ))}
            <Image src="/brand/lingyu-mascot.png" alt="" fill sizes="360px" className="object-contain" />
            <span className="absolute right-0 bottom-2 -rotate-6 hand text-2xl text-blue-600">Well Done!</span>
          </div>
          <h1 id="rr-title" className="text-[26px] font-extrabold text-navy md:text-[32px]">
            Hoàn thành bài ôn tập!
          </h1>
          <p className="-mt-3 text-text-2">Bạn đã hoàn thành {total} câu. Cùng xem kết quả nhé!</p>
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
            <StatBox value={total} label="Tổng số câu" className="bg-blue-50 text-navy" />
            <StatBox value={ok} label="Câu đúng" className="bg-green-50 text-green-700" />
            <StatBox value={wrong} label="Câu sai" className="bg-red-50 text-red" />
            <StatBox value={`${acc}%`} label="Độ chính xác" className="bg-[#F1EAFF] text-[#6B3FD0]" />
          </div>
          <div className="flex w-full items-start gap-3 rounded-[16px] bg-[#FFF9E8] p-4 text-left">
            <Star className="mt-0.5 size-6 shrink-0 fill-[#F7B500] text-[#F7B500]" aria-hidden="true" />
            <div>
              <strong className="text-navy">{mTitle}</strong>
              <p className="text-text-2">{mText}</p>
            </div>
          </div>
        </section>
        <aside aria-label="Gợi ý tiếp theo" className="flex flex-col gap-4">
          <ResultActions kind={s.kind} config={s.config} wrongIds={s.wrongVocabIds} />
          <p className="-rotate-2 rounded bg-[#FFF9E8] px-5 py-4 text-center hand text-xl leading-snug shadow-[0_8px_18px_rgba(80,60,20,.1)] max-lg:hidden">
            “Mỗi nỗ lực nhỏ
            <br />
            đều tạo nên
            <br />
            sự tiến bộ lớn!”
            <Heart className="ml-1 inline size-5 text-rose" />
          </p>
        </aside>
      </div>
    </>
  );
}

function StatBox({ value, label, className }: { value: React.ReactNode; label: string; className: string }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 rounded-[16px] px-3 py-4 ${className}`}>
      <div className="text-[30px] leading-tight font-bold tabular-nums">{value}</div>
      <div className="text-sm text-text-2">{label}</div>
    </div>
  );
}
