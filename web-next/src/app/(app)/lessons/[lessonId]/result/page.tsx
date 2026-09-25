import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { requireUser } from "@/server/session";
import { getLesson, nextLesson } from "@/data/lessons";
import { progressOf } from "@/features/lessons/service";
import { ProgressBar } from "@/features/lessons/components/progress-bar";

type P = Promise<{ lessonId: string }>;
export const metadata: Metadata = { title: "Kết quả bài học" };

export default async function LessonResultPage({ params }: { params: P }) {
  const user = await requireUser();
  const lesson = getLesson((await params).lessonId);
  if (!lesson) notFound();
  const progress = (await progressOf(user.id))[lesson.id] ?? {};
  const next = nextLesson(lesson.id);
  const all = lesson.sections.every((s) => progress[s.id]);

  return (
    <>
      <Breadcrumb back={`/lessons/${lesson.id}`} section={`Bài ${lesson.number}`} current="Kết quả" />
      <section
        aria-labelledby="lr-title"
        className="flex flex-col items-center gap-2 rounded-[var(--radius-xl)] border border-border bg-white px-4 py-7 text-center shadow-card"
      >
        {all ? (
          <>
            <p className="hanzi text-[34px] text-red" lang="zh">
              恭喜你！
            </p>
            <p className="-mt-1 pinyin">Gōngxǐ nǐ!</p>
          </>
        ) : null}
        <h1 id="lr-title" className="text-2xl font-extrabold text-navy">
          {all ? "Chúc mừng bạn!" : "Kết quả bài học"}
        </h1>
        <p className="text-text-2">
          {all ? `Bạn đã hoàn thành Bài ${lesson.number}` : `Làm đủ các phần để hoàn thành Bài ${lesson.number}.`}
        </p>
        <Image
          src={all ? "/brand/lesson/mascot_celebrate.png" : "/brand/lingyu-mascot.png"}
          alt=""
          width={220}
          height={210}
          className="my-2 w-[180px] md:w-[220px]"
        />
        <div className="w-full max-w-[520px] rounded-2xl bg-[#EFF8FD] p-4 text-left">
          <h2 className="mb-3 text-[15px] font-extrabold text-navy">Kết quả của bạn</h2>
          <ul className="flex flex-col gap-3">
            {lesson.sections.map((s) => {
              const p = progress[s.id];
              return (
                <li key={s.id} className="flex flex-col gap-1.5">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-bold text-[#3E6FB8]">
                      {s.label}: {s.title}
                    </span>
                    <span className="text-xl font-extrabold text-navy">
                      {p ? `${p.lastScore} / ${p.total}` : "Chưa làm"}
                    </span>
                  </span>
                  <ProgressBar value={p?.lastScore ?? 0} max={s.questions.length} label={`Kết quả ${s.title}`} />
                  {p ? (
                    <span className="text-xs text-text-3">
                      Cao nhất {p.bestScore}/{p.total} · đã làm {p.attempts} lần
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-3 grid w-full max-w-[520px] gap-2.5 md:grid-cols-2">
          <Button asChild variant="secondary" size="lg">
            <Link href={`/lessons/${lesson.id}/${lesson.sections[0]!.id}`}>
              <RotateCcw />
              Làm lại bài
            </Link>
          </Button>
          {next ? (
            <Button asChild variant="primary" size="lg">
              <Link href={`/lessons/${next.id}`}>
                Tiếp tục Bài {next.number}
                <ArrowRight />
              </Link>
            </Button>
          ) : (
            <Button variant="primary" size="lg" disabled title="Bài tiếp theo đang được biên soạn">
              Bài {lesson.number + 1} sắp ra mắt
            </Button>
          )}
        </div>
      </section>
    </>
  );
}
