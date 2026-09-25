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
    .map((v, i) => `${i + 1}. ${v.hanzi} (${v.pinyin}) — ${v.meaningVi}${v.note ? `\n   Ghi chú: ${v.note}` : ""}`)
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
    if (!emails.length) return void setErr("Vui lòng nhập ít nhất 1 email người nhận.");
    setErr("");
    setBusy(true);
    const r = await shareVocabAction(
      words.map((w) => w.id),
      emails,
    );
    setBusy(false);
    if (!r.ok) return void setErr(r.message || "Không gửi được. Vui lòng thử lại.");
    setResults(r.data.results);
    setText(
      r.data.results
        .filter((x) => !x.ok)
        .map((x) => x.email)
        .join(", "),
    );
    if (r.data.sent) {
      toast.success(`Đã gửi ${r.data.count} từ cho ${r.data.sent} người.`);
      setSent(r.data.sentList);
    }
  }

  async function copy() {
    const body = fmt === "csv" ? toCsv(words) : toText(words);
    try {
      await navigator.clipboard.writeText(body);
      toast.success(`Đã sao chép ${words.length} từ vựng.`);
    } catch {
      toast.error("Không sao chép được. Hãy dùng Tải file.");
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
    toast.success(`Đã tải file ${words.length} từ vựng.`);
  }

  return (
    <DialogContent title={`Chia sẻ ${words.length} từ vựng`} icon={<Share2 />} wide>
      <WordList words={words} label="Từ vựng sẽ chia sẻ" />
      <section aria-labelledby="vs-h" className="flex flex-col gap-2">
        <h3 id="vs-h" className="flex items-center gap-2 font-bold text-navy [&_svg]:size-5 [&_svg]:text-blue-600">
          <Mail />
          Gửi cho người dùng LingYu
        </h3>
        <label htmlFor="vs-emails" className="sr-only">
          Email người nhận
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
          placeholder="Email người nhận, vd: ban@gmail.com, linh@gmail.com"
          aria-invalid={!!err || undefined}
          aria-describedby="vs-hint vs-err"
        />
        <span id="vs-hint" className="text-[13.5px] text-text-3">
          Nhiều email cách nhau bằng dấu phẩy. Người nhận bấm “Chấp nhận” thì các từ được chép vào kho của họ. Trạng
          thái học và lịch ôn của bạn không được gửi đi.
        </span>
        <span id="vs-err" role="alert" className={cn("text-sm text-red", !err && "hidden")}>
          {err}
        </span>
        <Button variant="solid" disabled={busy} onClick={submit} className="w-full">
          {busy ? <Loader2 className="animate-spin" /> : <Share2 />}
          {busy ? "Đang gửi..." : "Gửi chia sẻ"}
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
                  <strong>{x.email}</strong> — {x.message}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <strong className="text-navy">Đã gửi gần đây</strong>
          {sent === null ? (
            <p className="text-sm text-text-3">Đang tải...</p>
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
            <p className="text-sm text-text-3">Chưa gửi cho ai.</p>
          )}
        </div>
      </section>
      <details className="rounded-md border border-border px-3 py-2.5">
        <summary className="flex cursor-pointer items-center gap-2 font-bold text-navy [&_svg]:size-5 [&_svg]:text-blue-600">
          <Copy />
          Sao chép hoặc tải file
        </summary>
        <div role="radiogroup" aria-label="Định dạng" className="mt-3 flex flex-wrap items-center gap-4 text-[15px]">
          <span className="text-text-2">Định dạng:</span>
          {(
            [
              ["text", "Văn bản"],
              ["csv", "CSV (Excel)"],
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
            Sao chép
          </Button>
          <Button size="sm" variant="secondary" onClick={download}>
            <Download />
            Tải file
          </Button>
        </div>
      </details>
      <DialogActions>
        <DialogClose asChild>
          <Button variant="secondary">Đóng</Button>
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
  const [keep, setKeep] = React.useState(true);
  const [extra, setExtra] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");

  async function accept() {
    setBusy(true);
    const r = await acceptVocabShareAction(share.id, { keepTags: keep, extraTags: extra });
    if (!r.ok) {
      setBusy(false);
      return void setErr(r.message || "Không chấp nhận được. Vui lòng thử lại.");
    }
    const { added, skipped, total } = r.data;
    toast.success(
      skipped.length
        ? `Đã thêm ${added}/${total} từ. ${skipped.length} từ đã có sẵn nên được bỏ qua (${skipped.slice(0, 3).join(", ")}${skipped.length > 3 ? "…" : ""}).`
        : `Đã thêm ${added} từ vào danh sách Từ vựng của bạn.`,
    );
    onDone();
  }

  return (
    <DialogContent title={`${share.senderName} chia sẻ ${share.count} từ vựng`} icon={<Share2 />} wide>
      <p className="text-[15px] text-text-2">
        Chấp nhận để chép các từ này vào danh sách Từ vựng của bạn. Bạn sửa hay xóa bản của mình không ảnh hưởng người
        gửi. Từ đã có (trùng Hán tự) sẽ được bỏ qua.
      </p>
      <WordList words={share.words} label="Từ vựng được chia sẻ" />
      {share.senderTags.length ? (
        <label className="flex cursor-pointer flex-wrap items-center gap-2.5 rounded-md bg-bg px-3 py-2.5">
          <input type="checkbox" className={checkboxClass} checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          <span className="text-[15px]">Giữ tag hiện tại:</span>
          {share.senderTags.map((t) => (
            <Tag key={t} name={t} />
          ))}
        </label>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="va-tags" className="text-[15px] font-semibold text-text">
          Thêm tag của tôi <span className="font-medium text-text-2">(không bắt buộc)</span>
        </label>
        <TagInput
          id="va-tags"
          value={extra}
          onChange={setExtra}
          existing={myTags}
          placeholder="vd: Bài 3 — nhấn Enter để thêm"
        />
      </div>
      {err ? (
        <p role="alert" className="text-sm text-red">
          {err}
        </p>
      ) : null}
      <DialogActions>
        <Button variant="muted" disabled={busy} onClick={() => onReject(share)}>
          <X />
          Từ chối
        </Button>
        <Button variant="solid" disabled={busy} onClick={accept}>
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          {busy ? "Đang thêm..." : "Chấp nhận"}
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
  const ok = await confirm({
    title: "Từ chối chia sẻ?",
    message: `Từ chối ${share.count} từ vựng từ ${share.senderName}?`,
    confirmLabel: "Từ chối",
    icon: <X />,
  });
  if (!ok) return false;
  const r = await rejectVocabShareAction(share.id);
  if (!r.ok) {
    toast.error(r.message);
    return false;
  }
  toast.info("Đã từ chối lời mời chia sẻ.");
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
  if (!received.length) return null;
  return (
    <div role="region" aria-label="Lời mời chia sẻ từ vựng" className="flex flex-col gap-2">
      {received.map((s) => (
        <div
          key={s.id}
          className="flex flex-col gap-3 rounded-[14px] border-[1.5px] border-dashed border-[#A9D3F8] bg-blue-50 px-3.5 py-3 md:flex-row md:items-center"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 max-md:hidden">
            <Share2 className="size-5" />
          </span>
          <div className="min-w-0 flex-1 text-[15px] text-text-2">
            <strong className="text-text">{s.senderName}</strong> đã chia sẻ {s.count} từ vựng với bạn:{" "}
            <span className="hanzi text-text" lang="zh">
              {s.title}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Button size="sm" variant="solid" onClick={() => onOpen(s)}>
              Xem & chấp nhận
            </Button>
            <Button size="sm" variant="muted" onClick={() => onReject(s)}>
              Từ chối
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
