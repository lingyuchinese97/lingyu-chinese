"use client";
import * as React from "react";
import { AlertCircle, CheckCircle2, Copy, Download, Loader2, Mail, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tag, checkboxClass } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { parseEmails } from "@/features/grammar/schema";
import { StatusPill, TagInput } from "@/features/grammar/components/grammar-dialogs";
import type { ReceivedVocabShare, SentVocabShare } from "../share-service";
import { acceptVocabShareAction, listSentVocabAction, rejectVocabShareAction, shareVocabAction } from "../actions";
import { useT } from "@/i18n/client";
import { currentT } from "@/i18n/current";

export type ShareWord = { id: string; hanzi: string; pinyin: string; meaningVi: string; note: string; tags: string[] };

function WordList({ words, label }: { words: Omit<ShareWord, "id">[]; label: string }) {
  return (
    <ul
      aria-label={label}
      className="flex max-h-[220px] shrink-0 flex-col overflow-y-auto rounded-md border border-border bg-white"
    >
      {words.map((w, i) => (
        <li
          key={`${w.hanzi}-${i}`}
          className="flex items-baseline gap-3 border-b border-[#EDF3F9] px-3 py-2 last:border-0"
        >
          <span className="hanzi text-lg text-text" lang="zh">
            {w.hanzi}
          </span>
          <span className="text-sm pinyin">{w.pinyin}</span>
          <span className="min-w-0 flex-1 truncate text-right text-[14.5px] text-text-2">{w.meaningVi}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------- Gửi ----------

const toText = (words: ShareWord[]) =>
  words
    .map(
      (v, i) =>
        `${i + 1}. ${v.hanzi} (${v.pinyin}) — ${v.meaningVi}${v.note ? `\n   ${currentT()("vocab.share.textNote", { note: v.note })}` : ""}`,
    )
    .join("\n");
const toCsv = (words: ShareWord[]) => {
  const cell = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const rows = [["Hán tự", "Pinyin", "Nghĩa tiếng Việt", "Ghi chú", "Tag"]].concat(
    words.map((v) => [v.hanzi, v.pinyin, v.meaningVi, v.note, v.tags.join(", ")]),
  );
  // BOM để Excel đọc đúng tiếng Việt / chữ Hán.
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");
};

/** Chia sẻ các từ đã chọn: gửi cho người dùng LingYu qua email, hoặc sao chép / tải file. */
export function ShareVocabDialog({ words, onClose }: { words: ShareWord[] | null; onClose: () => void }) {
  return (
    <Dialog open={!!words} onOpenChange={(o) => !o && onClose()}>
      {words ? <ShareBody words={words} /> : null}
    </Dialog>
  );
}

function ShareBody({ words }: { words: ShareWord[] }) {
  const t = useT();
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [results, setResults] = React.useState<{ email: string; ok: boolean; message: string }[]>([]);
  const [sent, setSent] = React.useState<SentVocabShare[] | null>(null);
  const [fmt, setFmt] = React.useState<"text" | "csv">("text");

  React.useEffect(() => {
    let alive = true;
    listSentVocabAction().then((r) => alive && setSent(r.ok ? r.data : []));
    return () => {
      alive = false;
    };
  }, []);

  async function submit() {
    if (busy) return;
    const emails = parseEmails(text);
    if (!emails.length) return void setErr(t("errors.recipientRequired"));
    setErr("");
    setBusy(true);
    const r = await shareVocabAction(
      words.map((w) => w.id),
      emails,
    );
    setBusy(false);
    if (!r.ok) return void setErr(r.message || t("vocab.share.sendFailed"));
    setResults(r.data.results);
    setText(
      r.data.results
        .filter((x) => !x.ok)
        .map((x) => x.email)
        .join(", "),
    );
    if (r.data.sent) {
      toast.success(t("vocab.share.sentToast", { count: r.data.count, people: r.data.sent }));
      setSent(r.data.sentList);
    }
  }

  async function copy() {
    const body = fmt === "csv" ? toCsv(words) : toText(words);
    try {
      await navigator.clipboard.writeText(body);
      toast.success(t("vocab.share.copied", { count: words.length }));
    } catch {
      toast.error(t("vocab.share.copyFailed"));
    }
  }
  function download() {
    const blob = new Blob([fmt === "csv" ? toCsv(words) : toText(words)], {
      type: `${fmt === "csv" ? "text/csv" : "text/plain"};charset=utf-8`,
    });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `lingyu-tu-vung-${new Date().toISOString().slice(0, 10)}.${fmt === "csv" ? "csv" : "txt"}`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast.success(t("vocab.share.downloaded", { count: words.length }));
  }

  return (
    <DialogContent title={t("vocab.share.title", { count: words.length })} icon={<Share2 />} wide>
      <WordList words={words} label={t("vocab.share.wordsToShare")} />
      <section aria-labelledby="vs-h" className="flex flex-col gap-2">
        <h3 id="vs-h" className="flex items-center gap-2 font-bold text-navy [&_svg]:size-5 [&_svg]:text-blue-600">
          <Mail />
          {t("vocab.share.sendHeading")}
        </h3>
        <label htmlFor="vs-emails" className="sr-only">
          {t("vocab.share.recipient")}
        </label>
        <Textarea
          id="vs-emails"
          rows={2}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={t("vocab.share.recipientPlaceholder")}
          aria-invalid={!!err || undefined}
          aria-describedby="vs-hint vs-err"
        />
        <span id="vs-hint" className="text-[13.5px] text-text-3">
          {t("vocab.share.recipientHint")}
        </span>
        <span id="vs-err" role="alert" className={cn("text-sm text-red", !err && "hidden")}>
          {err ? t.maybe(err) : null}
        </span>
        <Button variant="solid" disabled={busy} onClick={submit} className="w-full">
          {busy ? <Loader2 className="animate-spin" /> : <Share2 />}
          {busy ? t("vocab.share.sending") : t("vocab.share.send")}
        </Button>
        {results.length ? (
          <ul className="flex flex-col gap-1.5">
            {results.map((x) => (
              <li
                key={x.email}
                className={cn(
                  "flex items-start gap-2 rounded-md px-3 py-2 text-sm",
                  x.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red",
                )}
              >
                {x.ok ? (
                  <CheckCircle2 className="mt-px size-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-px size-4 shrink-0" />
                )}
                <span>
                  <strong>{x.email}</strong> — {t.maybe(x.message)}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <strong className="text-navy">{t("vocab.share.recent")}</strong>
          {sent === null ? (
            <p className="text-sm text-text-3">{t("common.loading")}</p>
          ) : sent.length ? (
            <ul className="flex flex-col gap-1.5">
              {sent.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-bg px-3 py-2 text-[15px]"
                >
                  <span className="min-w-0 truncate">
                    {s.recipientEmail}{" "}
                    <span className="hanzi text-sm text-text-3" lang="zh">
                      · {s.title}
                    </span>
                  </span>
                  <StatusPill status={s.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-3">{t("vocab.share.noneSent")}</p>
          )}
        </div>
      </section>
      <details className="rounded-md border border-border px-3 py-2.5">
        <summary className="flex cursor-pointer items-center gap-2 font-bold text-navy [&_svg]:size-5 [&_svg]:text-blue-600">
          <Copy />
          {t("vocab.share.copyOrDownload")}
        </summary>
        <div
          role="radiogroup"
          aria-label={t("vocab.share.format")}
          className="mt-3 flex flex-wrap items-center gap-4 text-[15px]"
        >
          <span className="text-text-2">{t("vocab.share.formatLabel")}</span>
          {(
            [
              ["text", t("vocab.share.formatText")],
              ["csv", t("vocab.share.formatCsv")],
            ] as const
          ).map(([k, label]) => (
            <label key={k} className="inline-flex cursor-pointer items-center gap-2">
              <input type="radio" name="share-fmt" checked={fmt === k} onChange={() => setFmt(k)} />
              {label}
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={copy}>
            <Copy />
            {t("vocab.share.copy")}
          </Button>
          <Button size="sm" variant="secondary" onClick={download}>
            <Download />
            {t("vocab.share.download")}
          </Button>
        </div>
      </details>
      <DialogActions>
        <DialogClose asChild>
          <Button variant="secondary">{t("common.close")}</Button>
        </DialogClose>
      </DialogActions>
    </DialogContent>
  );
}

// ---------- Nhận ----------

/** Xem trước + chấp nhận (chép vào kho của mình) hoặc từ chối. */
export function AcceptVocabDialog({
  share,
  myTags,
  onClose,
  onDone,
  onReject,
}: {
  share: ReceivedVocabShare | null;
  myTags: string[];
  onClose: () => void;
  onDone: () => void;
  onReject: (s: ReceivedVocabShare) => void;
}) {
  return (
    <Dialog open={!!share} onOpenChange={(o) => !o && onClose()}>
      {share ? <AcceptBody key={share.id} share={share} myTags={myTags} onDone={onDone} onReject={onReject} /> : null}
    </Dialog>
  );
}

function AcceptBody({
  share,
  myTags,
  onDone,
  onReject,
}: {
  share: ReceivedVocabShare;
  myTags: string[];
  onDone: () => void;
  onReject: (s: ReceivedVocabShare) => void;
}) {
  const t = useT();
  const [keep, setKeep] = React.useState(true);
  const [extra, setExtra] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function accept() {
    setBusy(true);
    const r = await acceptVocabShareAction(share.id, { keepTags: keep, extraTags: extra });
    if (!r.ok) {
      setBusy(false);
      return void setErr(r.message || t("vocab.share.acceptFailed"));
    }
    const { added, skipped, total } = r.data;
    toast.success(
      skipped.length
        ? t("vocab.share.addedSome", {
            added,
            total,
            skipped: skipped.length,
            list: `${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}`,
          })
        : t("vocab.share.addedAll", { added }),
    );
    onDone();
  }

  return (
    <DialogContent
      title={t("vocab.share.receivedTitle", { name: share.senderName, count: share.count })}
      icon={<Share2 />}
      wide
    >
      <p className="text-[15px] text-text-2">{t("vocab.share.receivedDesc")}</p>
      <WordList words={share.words} label={t("vocab.share.sharedWords")} />
      {share.senderTags.length ? (
        <label className="flex cursor-pointer flex-wrap items-center gap-2.5 rounded-md bg-bg px-3 py-2.5">
          <input type="checkbox" className={checkboxClass} checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          <span className="text-[15px]">{t("vocab.share.keepTags")}</span>
          {share.senderTags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </label>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="va-tags" className="text-[15px] font-semibold text-text">
          {t("vocab.share.myTags")} <span className="font-medium text-text-2">{t("vocab.form.optional")}</span>
        </label>
        <TagInput
          id="va-tags"
          value={extra}
          onChange={setExtra}
          existing={myTags}
          placeholder={t("vocab.share.myTagsPlaceholder")}
        />
      </div>
      {err ? (
        <p role="alert" className="text-sm text-red">
          {t.maybe(err)}
        </p>
      ) : null}
      <DialogActions>
        <Button variant="muted" disabled={busy} onClick={() => onReject(share)}>
          <X />
          {t("common.reject")}
        </Button>
        <Button variant="solid" disabled={busy} onClick={accept}>
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          {busy ? t("vocab.share.adding") : t("common.accept")}
        </Button>
      </DialogActions>
    </DialogContent>
  );
}

type Confirm = (o: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  icon?: React.ReactNode;
}) => Promise<boolean>;

/** Hỏi xác nhận rồi từ chối. Trả về true nếu đã từ chối. */
export async function rejectVocabWithConfirm(
  confirm: Confirm,
  share: { id: string; count: number; senderName: string },
) {
  const t = currentT();
  const ok = await confirm({
    title: t("vocab.share.rejectTitle"),
    message: t("vocab.share.rejectMessage", { count: share.count, name: share.senderName }),
    confirmLabel: t("common.reject"),
    icon: <X />,
  });
  if (!ok) return false;
  const r = await rejectVocabShareAction(share.id);
  if (!r.ok) {
    toast.error(r.message);
    return false;
  }
  toast.info(t("vocab.share.rejected"));
  return true;
}

/** Lời mời đang chờ mình, hiện trên đầu danh sách Từ vựng. */
export function VocabInvites({
  received,
  onOpen,
  onReject,
}: {
  received: ReceivedVocabShare[];
  onOpen: (s: ReceivedVocabShare) => void;
  onReject: (s: ReceivedVocabShare) => void;
}) {
  const t = useT();
  if (!received.length) return null;
  return (
    <div role="region" aria-label={t("vocab.share.invites")} className="flex flex-col gap-2">
      {received.map((s) => (
        <div
          key={s.id}
          className="flex flex-col gap-3 rounded-[14px] border-[1.5px] border-dashed border-[#A9D3F8] bg-blue-50 px-3.5 py-3 md:flex-row md:items-center"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 max-md:hidden">
            <Share2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1 text-[15px] text-text-2">
            {t.rich("vocab.share.inviteText", {
              name: <strong className="text-text">{s.senderName}</strong>,
              count: s.count,
            })}{" "}
            <span className="hanzi text-text" lang="zh">
              {s.title}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Button size="sm" variant="solid" onClick={() => onOpen(s)}>
              {t("notifications.viewAndAccept")}
            </Button>
            <Button size="sm" variant="muted" onClick={() => onReject(s)}>
              {t("common.reject")}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
