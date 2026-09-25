import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { AlertTriangle, FileText, Layers, Lightbulb, Lock, Share2 } from "lucide-react";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badges";
import { LeafDecor } from "@/components/layout/icons";
import { requireUser } from "@/server/session";
import { GrammarError, listGrammarTags, listSent, viewGrammar } from "@/features/grammar/service";
import { OwnerActions, PreviewBar } from "@/features/grammar/components/grammar-detail-actions";

export const metadata: Metadata = { title: "Ngữ pháp" };
export const dynamic = "force-dynamic";

const lines = (text: string) =>
  text
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
const fmt = (d: Date) =>
  `${d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function GrammarDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SP;
}) {
  const user = await requireUser();
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
          <Breadcrumb back="/grammar" section="Ngữ pháp" current="Không có quyền xem" />
          <section className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white/92 px-5 py-12 text-center shadow-card">
            <span className="flex size-16 items-center justify-center rounded-full bg-red-50 text-red">
              <Lock className="size-7" />
            </span>
            <h1 className="text-xl font-bold text-navy">Không có quyền xem</h1>
            <p className="text-text-2">{e.message}</p>
            <Button asChild variant="solid">
              <Link href="/grammar">Về danh sách ngữ pháp</Link>
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

  return (
    <>
      <Breadcrumb back="/grammar" section="Ngữ pháp" current={g.title} />
      {preview && view.share ? (
        <PreviewBar
          share={{ id: view.share.id, grammarTitle: g.title, senderName: view.share.senderName }}
          myTags={myTags.map((t) => t.name)}
        />
      ) : null}
      <article
        aria-labelledby="gd-title"
        className="relative flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-7"
      >
        <LeafDecor className="pointer-events-none absolute -right-2.5 -bottom-3.5 w-[70px] -rotate-30 opacity-35" />
        <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-border pb-4">
          <div className="min-w-0 flex-[1_1_320px]">
            <h1
              id="gd-title"
              className="text-[26px] font-extrabold tracking-tight [overflow-wrap:anywhere] text-navy md:text-[32px]"
            >
              {g.title}
            </h1>
            <div className="mt-2.5 mb-1.5 flex flex-wrap gap-1.5">
              {g.tags.length ? (
                g.tags.map((t) => <Tag key={t.id} name={t.name} />)
              ) : (
                <span className="text-sm text-text-3">Chưa có thẻ</span>
              )}
            </div>
            <p className="text-[13.5px] text-text-3">
              Tạo {fmt(g.createdAt)} · Cập nhật {fmt(g.updatedAt)}
              {g.sourceGrammarId ? ` · Nhận từ ${g.sourceOwnerName || "người khác"}` : ""}
              {preview && view.share ? ` · Người tạo: ${view.share.senderName}` : ""}
            </p>
          </div>
          {!preview ? <OwnerActions g={{ id: g.id, title: g.title, isSaved: g.isSaved }} sent={sent} /> : null}
        </header>

        <Section title="Ý nghĩa" icon={<Lightbulb />}>
          {g.meaning ? <p className="whitespace-pre-line text-text">{g.meaning}</p> : null}
        </Section>
        <Section title="Cấu trúc" icon={<Layers />}>
          {g.structure ? (
            <div
              lang="zh"
              className="inline-block rounded-xl border border-dashed border-[#A9D3F8] bg-blue-50 px-4 py-2.5 font-cn text-lg font-semibold [overflow-wrap:anywhere] text-blue-700"
            >
              {g.structure}
            </div>
          ) : null}
        </Section>
        <Section title={`Ví dụ${g.examples.length ? ` (${g.examples.length})` : ""}`} icon={<FileText />}>
          {g.examples.length ? (
            <ol className="grid list-decimal gap-3 pl-6 marker:font-semibold marker:text-text-3">
              {g.examples.map((e) => (
                <li key={e.id}>
                  <div className="hanzi text-xl text-text" lang="zh">
                    {e.chinese}
                  </div>
                  {e.pinyin ? <div className="pinyin">{e.pinyin}</div> : null}
                  {e.vietnamese ? <div className="text-text-2">{e.vietnamese}</div> : null}
                </li>
              ))}
            </ol>
          ) : null}
        </Section>
        <Section title="Lưu ý" icon={<AlertTriangle />}>
          {notes.length ? (
            <ul className="grid list-disc gap-1.5 pl-6 text-text">
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          ) : null}
        </Section>
        {!preview ? (
          <Section title="Ghi chú cá nhân" icon={<Lock />} hint="Chỉ mình bạn xem được">
            {g.personalNote ? (
              <p className="rounded-xl border border-[#FBE3B4] bg-amber-50 px-3.5 py-3 whitespace-pre-line text-text">
                {g.personalNote}
              </p>
            ) : null}
          </Section>
        ) : null}
        {!preview ? (
          <Section title="Đã chia sẻ với" icon={<Share2 />} last>
            {/* OwnerActions hiển thị danh sách vào đây (portal) để cập nhật ngay sau khi gửi chia sẻ. */}
            <div id="gd-sent" />
          </Section>
        ) : null}
      </article>
    </>
  );
}

function Section({
  title,
  icon,
  hint,
  last,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  hint?: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={last ? "pt-4" : "border-b border-border py-4"}>
      <h2 className="mb-2.5 flex flex-wrap items-center gap-2 text-base font-bold text-navy [&>svg]:size-5 [&>svg]:text-blue-600">
        {icon}
        {title}
        {hint ? <span className="ml-1 text-[13.5px] font-medium text-text-3">{hint}</span> : null}
      </h2>
      {children ?? <p className="text-sm text-text-3">Chưa có nội dung.</p>}
    </section>
  );
}
