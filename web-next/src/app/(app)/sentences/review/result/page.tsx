import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleMinus, XCircle } from "lucide-react";
import { requireUser } from "@/server/session";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { getLastSentenceResult } from "@/features/sentences/review-service";
import { SentenceResultActions } from "@/features/sentences/components/sentence-result-actions";

export const metadata: Metadata = { title: "Kết quả ôn dịch câu" };

export default async function SentenceResultPage() {
  const user = await requireUser();
  const r = await getLastSentenceResult(user.id);
  if (!r) redirect("/sentences/review/setup");
  const pct = r.total ? r.correctCount / r.total : 0;
  const R = 54;
  const C = 2 * Math.PI * R;
  return (
    <>
      <Breadcrumb back="/sentences" section="Ôn dịch câu" current="Kết quả" />
      <section
        aria-labelledby="rs-title"
        className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-white/94 p-4 shadow-card md:p-7"
      >
        <h1 id="rs-title" className="flex items-center gap-3 text-[24px] font-extrabold text-navy md:text-[28px]">
          Kết quả ôn tập
          <LeafDecor className="w-9" />
        </h1>
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-12">
          <div className="flex items-end gap-3">
            {/* Mascot nền trong suốt, đặt cạnh vòng tròn (không chồng lên). */}
            <Image
              src="/brand/lesson/mascot_celebrate.png"
              alt=""
              width={110}
              height={105}
              className="shrink-0 max-md:hidden"
            />
            <svg
              width="150"
              height="150"
              viewBox="0 0 130 130"
              role="img"
              aria-label={`Đúng ${r.correctCount}/${r.total}`}
            >
              <circle cx="65" cy="65" r={R} fill="none" stroke="#E6F1FC" strokeWidth="12" />
              <circle
                cx="65"
                cy="65"
                r={R}
                fill="none"
                stroke="url(#rg)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${C * pct} ${C}`}
                transform="rotate(-90 65 65)"
              />
              <defs>
                <linearGradient id="rg" x1="0" x2="1">
                  <stop offset="0" stopColor="#16c98d" />
                  <stop offset="1" stopColor="#19c7d6" />
                </linearGradient>
              </defs>
              <text x="65" y="66" textAnchor="middle" className="fill-navy text-[26px] font-extrabold">
                {r.correctCount}/{r.total}
              </text>
              <text x="65" y="88" textAnchor="middle" className="fill-green-700 text-[13px] font-semibold">
                Đúng
              </text>
            </svg>
          </div>
          <ul className="flex w-full max-w-[280px] flex-col gap-2">
            {[
              { label: "Đúng", n: r.correctCount, icon: <CheckCircle2 className="size-5 text-green-700" /> },
              { label: "Sai", n: r.wrongCount, icon: <XCircle className="size-5 text-red" /> },
              { label: "Bỏ qua", n: r.skippedCount, icon: <CircleMinus className="size-5 text-text-3" /> },
            ].map((x) => (
              <li key={x.label} className="flex items-center gap-2.5 rounded-lg bg-[#F4F9FF] px-3.5 py-2.5">
                {x.icon}
                <span className="flex-1 text-text">{x.label}</span>
                <strong className="text-navy tabular-nums">{x.n}</strong>
              </li>
            ))}
          </ul>
        </div>

        <ol className="flex flex-col gap-2" aria-label="Chi tiết từng câu">
          {r.questions.map((q, i) => (
            <li
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-xl border px-3.5 py-2.5",
                q.result === "correct"
                  ? "border-green-100 bg-green-50"
                  : q.result === "wrong"
                    ? "border-red-100 bg-red-50"
                    : "border-border bg-white",
              )}
            >
              <span className="mt-0.5 text-sm font-bold text-text-3 tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="hanzi text-text" lang="zh">
                  {q.reveal?.chinese}
                </p>
                <p className="text-[14.5px] text-text-2">{q.reveal?.vietnamese}</p>
                {q.result === "wrong" && q.userAnswer ? (
                  <p className="text-sm text-red">Bạn trả lời: {q.userAnswer}</p>
                ) : null}
              </div>
              <span className="text-sm font-semibold">
                {q.result === "correct" ? "Đúng" : q.result === "wrong" ? "Sai" : "Bỏ qua"}
              </span>
            </li>
          ))}
        </ol>
        <SentenceResultActions wrongIds={r.wrongIds} config={r.config} />
      </section>
    </>
  );
}
