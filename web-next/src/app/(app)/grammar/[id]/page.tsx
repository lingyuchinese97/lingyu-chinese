import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AlertTriangle, Layers, Lightbulb, Lock, PenLine, Share2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/server/session";
import { GrammarError, listGrammarTags, listSent, viewGrammar } from "@/features/grammar/service";
import { OwnerActions, PreviewBar } from "@/features/grammar/components/grammar-detail-actions";
import { ExampleList, PersonalNoteCard } from "@/features/grammar/components/grammar-detail-parts";
import { StructureRows } from "@/features/grammar/components/structure-box";
import { Marked, grammarKeys } from "@/features/grammar/components/hanzi-mark";
import { titlePinyin } from "@/features/grammar/title-pinyin";
import { tagTone } from "@/features/grammar/tag-tones";
import { hskOfTag, structureLines } from "@/features/grammar/schema";
import { iconOf, pillClass } from "@/features/grammar/icons";
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
  const [sent, myTags, [py]] = await Promise.all([
    preview ? Promise.resolve([]) : listSent(user.id, g.id),
    listGrammarTags(user.id),
    titlePinyin([g.title]),
  ]);
  // Màu thẻ giống danh sách (theo thứ tự các thẻ không phải HSK của tôi).
  const toneOf = new Map(myTags.filter((x) => hskOfTag(x.name) === null).map((x, i) => [x.name, i]));
  const hskTags = g.tags.filter((x) => hskOfTag(x.name) !== null);
  const catTags = g.tags.filter((x) => hskOfTag(x.name) === null);
  const notes = lines(g.notes);
  const keys = [...grammarKeys(g.title, g.structure)];
  const empty = <p className="text-text-3">{t("grammar.detail.empty")}</p>;
  const pill = "rounded-full px-3 py-1 text-[13px] font-semibold";

  return (
    <>
      <Breadcrumb back="/grammar" section={t("grammar.title")} current={t("grammar.detail.crumb")} />
      {preview && view.share ? (
        <PreviewBar
          share={{ id: view.share.id, grammarTitle: g.title, senderName: view.share.senderName }}
          myTags={myTags.map((t) => t.name)}
        />
      ) : null}
      <article aria-labelledby="gd-title" className="flex flex-col gap-4">
        {/* Đầu trang: tiêu đề (chữ Hán đỏ font Kai · pinyin), thẻ HSK / chủ đề, ngày; bên phải Lưu · Chia sẻ · ⋯. */}
        <header className="flex flex-wrap items-start gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1
                id="gd-title"
                className="min-w-0 text-[26px] leading-tight font-extrabold tracking-tight [overflow-wrap:anywhere] text-navy-900 md:text-[32px]"
              >
                <Marked text={g.title} />
                {py ? (
                  <span aria-hidden="true" className="font-semibold text-text-2">
                    {" "}
                    · <span className="pinyin">{py}</span>
                  </span>
                ) : null}
              </h1>
              {hskTags.map((tg) => (
                <span key={tg.id} className={cn(pill, "bg-[#E8F7EE] text-[#1E8A4C]")}>
                  {tg.name}
                </span>
              ))}
              {catTags.length ? (
                catTags.map((tg) => (
                  <span key={tg.id} className={cn(pill, "border", tagTone(toneOf.get(tg.name) ?? 0))}>
                    {tg.name}
                  </span>
                ))
              ) : (
                <span className={cn(pill, pillClass(iconOf(g)))}>{t(`grammar.icon.${iconOf(g)}`)}</span>
              )}
            </div>
            <p className="text-[13.5px] text-text-3">
              {t("grammar.detail.created", { date: fmt(g.createdAt, tag) })} ·{" "}
              {t("grammar.detail.updated", { date: fmt(g.updatedAt, tag) })}
              {g.sourceGrammarId
                ? ` · ${t("grammar.detail.receivedFrom", { name: g.sourceOwnerName || t("grammar.someoneElse") })}`
                : ""}
              {preview && view.share ? ` · ${t("grammar.detail.creator", { name: view.share.senderName })}` : ""}
            </p>
          </div>
          {!preview ? <OwnerActions g={{ id: g.id, title: g.title, isSaved: g.isSaved }} sent={sent} /> : null}
        </header>

        {/* Ý nghĩa: một dải ngang (chữ Hán đỏ). */}
        <section
          aria-label={t("grammar.detail.meaning")}
          className="flex items-start gap-3 rounded-[18px] border border-[#DDEBF8] bg-[#F3F8FE] px-4 py-3.5 md:px-5"
        >
          <span
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E1EEFC] text-blue-600 [&_svg]:size-5"
          >
            <Lightbulb />
          </span>
          <p className="min-w-0 flex-1 self-center text-[16.5px] whitespace-pre-line [overflow-wrap:anywhere] text-text">
            <strong className="font-bold text-navy-900">{t("grammar.detail.meaning")}:</strong>{" "}
            {g.meaning ? <Marked text={g.meaning} /> : <span className="text-text-3">{t("grammar.detail.empty")}</span>}
          </p>
        </section>

        {/* Hai cột (màn hình lớn): Cấu trúc + Ghi nhớ | Ví dụ. Màn hình nhỏ: xếp chồng. */}
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className="flex min-w-0 flex-col gap-4">
            <Card
              icon={<Layers />}
              title={t("grammar.detail.structure")}
              count={structureLines(g.structure).length || undefined}
            >
              {g.structure ? <StructureRows structure={g.structure} /> : empty}
            </Card>
            <Card icon={<AlertTriangle />} title={t("grammar.detail.remember")}>
              {notes.length ? (
                <ol className="flex flex-col gap-2.5">
                  {notes.map((n, i) => (
                    <li key={i} className="flex items-start gap-3 text-[15.5px] [overflow-wrap:anywhere] text-text">
                      <span
                        aria-hidden="true"
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#FFE1E6] text-[12.5px] font-bold text-[#E0302F]"
                      >
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <Marked text={n} />
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                empty
              )}
            </Card>
          </div>
          <ExampleList
            examples={g.examples}
            keys={keys}
            grammarId={g.id}
            canEdit={!preview}
            title={
              g.examples.length
                ? t("grammar.detail.examplesCount", { count: g.examples.length })
                : t("grammar.detail.examples")
            }
          />
        </div>

        {!preview ? (
          <Card icon={<PenLine />} title={t("grammar.detail.personal")} hint={t("grammar.detail.personalHint")}>
            <PersonalNoteCard grammarId={g.id} initial={g.personalNote} />
          </Card>
        ) : null}

        {!preview ? (
          <Card icon={<Share2 />} title={t("grammar.detail.sharedWith")} action={<div id="gd-share-now" />}>
            {/* OwnerActions hiển thị danh sách vào đây (portal) để cập nhật ngay sau khi gửi chia sẻ. */}
            <div id="gd-sent" />
          </Card>
        ) : null}
      </article>
    </>
  );
}

/** Khối nội dung: biểu tượng nhỏ + tiêu đề (+ số lượng), nền trắng bo tròn. */
function Card({
  icon,
  title,
  count,
  hint,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-border bg-white p-4 shadow-[0_4px_18px_rgba(34,93,150,.05)] md:p-5">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span
          aria-hidden="true"
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 [&_svg]:size-[18px]"
        >
          {icon}
        </span>
        <h2 className="text-[19px] font-bold text-navy-900">{title}</h2>
        {count ? (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[13px] font-bold text-blue-700">{count}</span>
        ) : null}
        {hint ? <span className="text-[13.5px] text-text-3">{hint}</span> : null}
        {action ? <div className="ml-auto">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
