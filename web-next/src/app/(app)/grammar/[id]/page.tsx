import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AlertTriangle, FileText, Layers, Lightbulb, Lock, PenLine, Share2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badges";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { GrammarError, listGrammarTags, listSent, viewGrammar } from "@/features/grammar/service";
import { OwnerActions, PreviewBar } from "@/features/grammar/components/grammar-detail-actions";
import { ExampleActions, PersonalNoteCard } from "@/features/grammar/components/grammar-detail-parts";
import { StructureDetail } from "@/features/grammar/components/structure-box";
import { getIntlTag, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("grammar.title") };
}
export const dynamic = "force-dynamic";

const lines = (text: string) =>
  text
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
const fmt = (d: Date, tag: string) =>
  `${d.toLocaleDateString(tag, { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" })}`;

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function GrammarDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SP;
}) {
  const user = await requireUser();
  const t = await getT();
  const tag = await getIntlTag();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  const share = (await searchParams).share;
  const shareId = typeof share === "string" && z.uuid().safeParse(share).success ? share : undefined;

  let view: Awaited<ReturnType<typeof viewGrammar>>;
  try {
    view = await viewGrammar(user.id, id.data, shareId);
  } catch (e) {
    if (e instanceof GrammarError && e.code === "forbidden")
      return (
        <>
          <Breadcrumb back="/grammar" section={t("grammar.title")} current={t("grammar.detail.noAccess")} />
          <section className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white/92 px-5 py-12 text-center shadow-card">
            <span className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red">
              <Lock className="size-7" />
            </span>
            <h1 className="text-xl font-bold text-navy">{t("grammar.detail.noAccess")}</h1>
            <p className="text-text-2">{t.maybe(e.message)}</p>
            <Button asChild variant="solid">
              <Link href="/grammar">{t("grammar.detail.backToList")}</Link>
            </Button>
          </section>
        </>
      );
    if (e instanceof GrammarError) notFound();
    throw e;
  }

  const g = view.grammar;
  const preview = view.mode === "preview";
  const [sent, myTags] = await Promise.all([
    preview ? Promise.resolve([]) : listSent(user.id, g.id),
    preview ? listGrammarTags(user.id) : Promise.resolve([]),
  ]);
  const notes = lines(g.notes);
  const empty = <p className="text-text-3">{t("grammar.detail.empty")}</p>;

  return (
    <>
      <Breadcrumb back="/grammar" section={t("grammar.title")} current={g.title} />
      {preview && view.share ? (
        <PreviewBar
          share={{ id: view.share.id, grammarTitle: g.title, senderName: view.share.senderName }}
          myTags={myTags.map((t) => t.name)}
        />
      ) : null}
      <article aria-labelledby="gd-title" className="flex flex-col gap-4">
        <header className="relative flex flex-wrap items-start gap-x-6 gap-y-4 overflow-hidden rounded-[var(--radius-xl)] border border-[#DDEBF8] bg-[linear-gradient(100deg,#FFFFFF_0%,#F4F9FF_60%,#E8F3FE_100%)] p-4 shadow-card md:p-6">
          <LeafDecor className="pointer-events-none absolute right-[18%] -bottom-3 hidden w-16 -rotate-12 opacity-40 lg:block" />
          <LeafDecor className="pointer-events-none absolute right-[30%] bottom-2 hidden w-10 rotate-[25deg] opacity-30 lg:block" />
          <div className="relative flex min-w-0 flex-[1_1_360px] items-start gap-4">
            <span className="hidden size-[76px] shrink-0 items-center justify-center rounded-full bg-[#E4F0FD] text-blue-600 sm:flex">
              <FileText className="size-9" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1
                id="gd-title"
                className="text-[24px] leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere] text-navy-900 md:text-[32px]"
              >
                {g.title}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {g.tags.length ? (
                  <span className="flex flex-wrap gap-1.5">
                    {g.tags.map((tg) => (
                      <Tag key={tg.id} name={tg.name} />
                    ))}
                  </span>
                ) : (
                  <span className="text-sm text-text-3">{t("grammar.detail.noTags")}</span>
                )}
                <span className="text-[14px] text-text-3">
                  {t("grammar.detail.created", { date: fmt(g.createdAt, tag) })} ·{" "}
                  {t("grammar.detail.updated", { date: fmt(g.updatedAt, tag) })}
                  {g.sourceGrammarId
                    ? ` · ${t("grammar.detail.receivedFrom", { name: g.sourceOwnerName || t("grammar.someoneElse") })}`
                    : ""}
                  {preview && view.share ? ` · ${t("grammar.detail.creator", { name: view.share.senderName })}` : ""}
                </span>
              </div>
            </div>
          </div>
          {!preview ? (
            <div className="relative">
              <OwnerActions g={{ id: g.id, title: g.title, isSaved: g.isSaved }} sent={sent} />
            </div>
          ) : null}
        </header>

        <Card tone="blue" icon={<Lightbulb />} title={t("grammar.detail.meaning")}>
          {g.meaning ? <p className="whitespace-pre-line text-text">{g.meaning}</p> : empty}
        </Card>

        <Card tone="amber" icon={<Layers />} title={t("grammar.detail.structure")}>
          {g.structure ? <StructureDetail structure={g.structure} /> : empty}
        </Card>

        <Card
          tone="white"
          icon={<FileText />}
          title={
            g.examples.length
              ? t("grammar.detail.examplesCount", { count: g.examples.length })
              : t("grammar.detail.examples")
          }
        >
          {g.examples.length ? (
            <ol className="flex flex-col divide-y divide-border">
              {g.examples.map((e, i) => (
                <li key={e.id} className="flex flex-col gap-3 py-3 first:pt-1 last:pb-0 sm:flex-row sm:items-start">
                  <span
                    aria-hidden="true"
                    className="flex size-9 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-600"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="sr-only">{t("grammar.form.example", { n: i + 1 })}: </span>
                    <div className="hanzi text-[24px] leading-snug font-bold text-navy-900" lang="zh">
                      {e.chinese}
                    </div>
                    {e.pinyin ? <div className="text-[16px] pinyin">{e.pinyin}</div> : null}
                    {e.vietnamese ? <div className="text-text-2">{e.vietnamese}</div> : null}
                  </div>
                  <ExampleActions
                    n={i + 1}
                    example={{ chinese: e.chinese, pinyin: e.pinyin, vietnamese: e.vietnamese }}
                    grammarId={g.id}
                    canEdit={!preview}
                  />
                </li>
              ))}
            </ol>
          ) : (
            empty
          )}
        </Card>

        <Card tone="blue" icon={<AlertTriangle />} title={t("grammar.detail.notes")}>
          {notes.length ? (
            <ul className="grid list-disc gap-1.5 pl-6 text-text marker:text-blue">
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : (
            empty
          )}
        </Card>

        {!preview ? (
          <Card
            tone="green"
            icon={<PenLine />}
            title={t("grammar.detail.personal")}
            hint={t("grammar.detail.personalHint")}
          >
            <PersonalNoteCard grammarId={g.id} initial={g.personalNote} />
          </Card>
        ) : null}

        {!preview ? (
          <Card
            tone="white"
            icon={<Share2 />}
            title={t("grammar.detail.sharedWith")}
            action={<div id="gd-share-now" />}
          >
            {/* OwnerActions hiển thị danh sách vào đây (portal) để cập nhật ngay sau khi gửi chia sẻ. */}
            <div id="gd-sent" />
          </Card>
        ) : null}
      </article>
    </>
  );
}

const TONES = {
  blue: { box: "border-[#DDEBF8] bg-[#F3F8FE]", icon: "bg-[#E1EEFC] text-blue-600" },
  amber: {
    box: "border-[#F6DE9E] bg-[linear-gradient(135deg,#FFF9EA_0%,#FFF3D2_100%)]",
    icon: "bg-[#FFE6A8] text-[#E07A00]",
  },
  green: { box: "border-[#CFEFDF] bg-[#F1FBF6]", icon: "bg-[#D8F4E6] text-green-700" },
  white: { box: "border-border bg-white", icon: "bg-blue-50 text-blue-600" },
} as const;

/** Khối nội dung theo thiết kế: biểu tượng tròn bên trái, tiêu đề, nội dung; màu nền theo loại. */
function Card({
  tone,
  icon,
  title,
  hint,
  action,
  children,
}: {
  tone: keyof typeof TONES;
  icon: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const c = TONES[tone];
  return (
    <section
      className={cn("flex gap-4 rounded-[20px] border p-4 shadow-[0_4px_18px_rgba(34,93,150,.05)] md:p-5", c.box)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "hidden size-12 shrink-0 items-center justify-center rounded-full sm:flex [&_svg]:size-6",
          c.icon,
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h2 className="text-[18px] font-bold text-navy-900">{title}</h2>
          {hint ? <span className="text-[13.5px] text-text-3">{hint}</span> : null}
          {action ? <div className="ml-auto">{action}</div> : null}
        </div>
        {children}
      </div>
    </section>
  );
}
