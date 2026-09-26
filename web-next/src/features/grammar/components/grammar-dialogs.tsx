"use client";
import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tag, checkboxClass } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { G_LIMITS, parseEmails } from "../schema";
import { useT } from "@/i18n/client";
import { currentT } from "@/i18n/current";
import { acceptShareAction, listSentAction, rejectShareAction, shareGrammarAction, sourceTagsAction } from "../actions";

// ---------- Ô nhập thẻ: gõ tên → Enter ----------

/** Trim, bỏ rỗng, không trùng (không phân biệt hoa/thường); tên trùng thẻ có sẵn thì dùng đúng tên đó. */
export function TagInput({
  value,
  onChange,
  existing,
  id,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  existing: string[];
  id: string;
  placeholder?: string;
}) {
  const tr = useT();
  const [draft, setDraft] = React.useState("");
  const [err, setErr] = React.useState("");
  const add = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) return void setErr(tr("errors.grammarTagEmpty"));
    if (name.length > G_LIMITS.tag) return void setErr(tr("errors.grammarTagMax", { max: G_LIMITS.tag }));
    if (value.some((t) => t.toLowerCase() === name.toLowerCase()))
      return void setErr(tr("grammar.dialogs.tagAdded", { name }));
    onChange([...value, existing.find((t) => t.toLowerCase() === name.toLowerCase()) ?? name]);
    setErr("");
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-md border-[1.5px] border-border bg-white px-2 py-1.5 focus-within:border-blue focus-within:shadow-[var(--focus-ring)]">
        {value.map((t) => (
          <Tag key={t} name={t} onRemove={() => onChange(value.filter((x) => x !== t))} />
        ))}
        <input
          id={id}
          list={`${id}-list`}
          value={draft}
          maxLength={G_LIMITS.tag}
          onChange={(e) => {
            setDraft(e.target.value);
            setErr("");
            // Chọn gợi ý từ datalist → thêm luôn.
            if (
              existing.includes(e.target.value) &&
              (e.nativeEvent as InputEvent).inputType === "insertReplacementText"
            )
              add(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (draft.trim()) add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={placeholder ?? tr("grammar.dialogs.tagPlaceholder")}
          autoComplete="off"
          aria-describedby={`${id}-err`}
          className="min-h-9 min-w-[160px] flex-1 border-0 bg-transparent px-1.5 text-[15.5px] outline-none placeholder:text-[#9AAAC0] focus-visible:shadow-none max-md:text-base"
        />
        <datalist id={`${id}-list`}>
          {existing.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>
      <span id={`${id}-err`} role="alert" className={cn("text-sm text-red", !err && "hidden")}>
        {err}
      </span>
    </div>
  );
}

// ---------- Chia sẻ ----------

export type SentItem = { id: string; recipientEmail: string; status: "PENDING" | "ACCEPTED" | "REJECTED" };

const STATUS_KEY = { PENDING: "pending", ACCEPTED: "accepted", REJECTED: "rejected" } as const;

export function StatusPill({ status }: { status: SentItem["status"] }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-2.5 py-0.5 text-[13px] font-semibold",
        status === "PENDING" && "bg-amber-50 text-[#9A5C03]",
        status === "ACCEPTED" && "bg-green-50 text-green-700",
        status === "REJECTED" && "bg-red-50 text-red",
      )}
    >
      {t(`grammar.dialogs.${STATUS_KEY[status]}`)}
    </span>
  );
}

export function SentList({ sent }: { sent: SentItem[] }) {
  const t = useT();
  if (!sent.length) return <p className="text-sm text-text-3">{t("grammar.dialogs.noneShared")}</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {sent.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-3 rounded-md bg-bg px-3 py-2 text-[15px]">
          <span className="min-w-0 truncate">{s.recipientEmail}</span>
          <StatusPill status={s.status} />
        </li>
      ))}
    </ul>
  );
}

/** Nhập nhiều email → Gửi chia sẻ; hiện kết quả từng email và danh sách đã chia sẻ. */
export function ShareGrammarDialog({
  grammar,
  sent: initialSent,
  onClose,
  onSent,
}: {
  grammar: { id: string; title: string } | null;
  sent: SentItem[];
  onClose: () => void;
  onSent?: (sent: SentItem[]) => void;
}) {
  return (
    <Dialog open={!!grammar} onOpenChange={(o) => !o && onClose()}>
      {grammar ? <ShareBody key={grammar.id} grammar={grammar} initialSent={initialSent} onSent={onSent} /> : null}
    </Dialog>
  );
}

function ShareBody({
  grammar,
  initialSent,
  onSent,
}: {
  grammar: { id: string; title: string };
  initialSent: SentItem[];
  onSent?: (sent: SentItem[]) => void;
}) {
  const t = useT();
  const [text, setText] = React.useState("");
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [results, setResults] = React.useState<{ email: string; ok: boolean; message: string }[]>([]);
  const [sent, setSent] = React.useState(initialSent);
  // Luôn lấy danh sách mới nhất từ server khi mở.
  React.useEffect(() => {
    let alive = true;
    listSentAction(grammar.id).then((r) => alive && r.ok && setSent(r.data));
    return () => {
      alive = false;
    };
  }, [grammar.id]);

  async function submit() {
    if (busy) return;
    const emails = parseEmails(text);
    if (!emails.length) return void setErr(t("errors.recipientRequired"));
    setErr("");
    setBusy(true);
    const r = await shareGrammarAction(grammar.id, emails);
    setBusy(false);
    if (!r.ok) return void setErr(r.message || t("vocab.share.sendFailed"));
    setResults(r.data.results);
    // Giữ lại các email lỗi trong ô để sửa.
    setText(
      r.data.results
        .filter((x) => !x.ok)
        .map((x) => x.email)
        .join(", "),
    );
    if (r.data.sent) {
      toast.success(t("grammar.dialogs.sentToast", { count: r.data.sent }));
      setSent(r.data.sentList);
      onSent?.(r.data.sentList);
    }
  }

  return (
    <DialogContent title={t("grammar.dialogs.shareTitle")} icon={<Share2 />} wide>
      <p className="text-[15px] text-text-2">
        {t.rich("grammar.dialogs.shareDesc", {
          title: <strong className="text-text">{grammar.title}</strong>,
          not: <strong className="text-text">{t("grammar.dialogs.not")}</strong>,
        })}
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="gs-emails" className="text-[15px] font-semibold text-text">
          {t("grammar.dialogs.recipient")}
        </label>
        <Textarea
          id="gs-emails"
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
          placeholder={t("grammar.dialogs.recipientPlaceholder")}
          aria-invalid={!!err || undefined}
          aria-describedby="gs-hint gs-err"
        />
        <span id="gs-hint" className="text-[13.5px] text-text-3">
          {t("grammar.dialogs.recipientHint")}
        </span>
        <span id="gs-err" role="alert" className={cn("text-sm text-red", !err && "hidden")}>
          {err ? t.maybe(err) : null}
        </span>
      </div>
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
      <div className="flex flex-col gap-2">
        <strong className="text-navy">{t("grammar.dialogs.sharedWith")}</strong>
        <SentList sent={sent} />
      </div>
      <DialogActions>
        <DialogClose asChild>
          <Button variant="secondary">{t("common.close")}</Button>
        </DialogClose>
        <Button variant="solid" disabled={busy} onClick={submit}>
          {busy ? <Loader2 className="animate-spin" /> : <Share2 />}
          {busy ? t("vocab.share.sending") : t("vocab.share.send")}
        </Button>
      </DialogActions>
    </DialogContent>
  );
}

// ---------- Chấp nhận / Từ chối ----------

export type PendingShare = { id: string; grammarTitle: string; senderName: string };

/** Chọn giữ thẻ của người gửi + thêm thẻ của tôi → tạo bản riêng. */
export function AcceptShareDialog({
  share,
  myTags,
  onClose,
  onDone,
}: {
  share: PendingShare | null;
  myTags: string[];
  onClose: () => void;
  onDone: (g: { id: string; title: string }) => void;
}) {
  return (
    <Dialog open={!!share} onOpenChange={(o) => !o && onClose()}>
      {share ? <AcceptBody key={share.id} share={share} myTags={myTags} onDone={onDone} /> : null}
    </Dialog>
  );
}

function AcceptBody({
  share,
  myTags,
  onDone,
}: {
  share: PendingShare;
  myTags: string[];
  onDone: (g: { id: string; title: string }) => void;
}) {
  const t = useT();
  const [senderTags, setSenderTags] = React.useState<string[] | null>(null);
  const [keep, setKeep] = React.useState(true);
  const [extra, setExtra] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  React.useEffect(() => {
    let alive = true;
    sourceTagsAction(share.id).then((r) => alive && setSenderTags(r.ok ? r.data : []));
    return () => {
      alive = false;
    };
  }, [share.id]);

  async function accept() {
    setBusy(true);
    const r = await acceptShareAction(share.id, { keepTags: keep && !!senderTags?.length, extraTags: extra });
    if (!r.ok) {
      setBusy(false);
      return void setErr(r.message || t("vocab.share.acceptFailed"));
    }
    toast.success(t("grammar.dialogs.acceptedToast", { title: r.data.title }));
    onDone(r.data);
  }

  return (
    <DialogContent title={t("grammar.dialogs.acceptTitle")} icon={<CheckCircle2 />} wide>
      <p className="text-[15px] text-text-2">
        {t.rich("grammar.dialogs.acceptDesc", {
          name: <strong className="text-text">{share.senderName}</strong>,
          title: <strong className="text-text">{share.grammarTitle}</strong>,
        })}
      </p>
      {senderTags?.length ? (
        <label className="flex cursor-pointer flex-wrap items-center gap-2.5 rounded-md bg-bg px-3 py-2.5">
          <input type="checkbox" className={checkboxClass} checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          <span className="text-[15px]">{t("grammar.dialogs.keepTags")}</span>
          {senderTags.map((tag) => (
            <Tag key={tag} name={tag} />
          ))}
        </label>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ga-tags" className="text-[15px] font-semibold text-text">
          {t("grammar.dialogs.myTags")} <span className="font-medium text-text-2">{t("vocab.form.optional")}</span>
        </label>
        <TagInput
          id="ga-tags"
          value={extra}
          onChange={setExtra}
          existing={myTags}
          placeholder={t("grammar.dialogs.myTagsPlaceholder")}
        />
      </div>
      {err ? (
        <p role="alert" className="text-sm text-red">
          {t.maybe(err)}
        </p>
      ) : null}
      <DialogActions>
        <DialogClose asChild>
          <Button variant="secondary">{t("common.cancel")}</Button>
        </DialogClose>
        <Button variant="solid" disabled={busy || senderTags === null} onClick={accept}>
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          {busy ? t("vocab.share.adding") : t("common.accept")}
        </Button>
      </DialogActions>
    </DialogContent>
  );
}

/** Hỏi xác nhận rồi từ chối lời mời. Trả về true nếu đã từ chối. */
export async function rejectWithConfirm(
  confirm: (o: {
    title: string;
    message: React.ReactNode;
    confirmLabel?: string;
    icon?: React.ReactNode;
  }) => Promise<boolean>,
  share: PendingShare,
) {
  const t = currentT();
  const ok = await confirm({
    title: t("grammar.dialogs.rejectTitle"),
    message: t.rich("grammar.dialogs.rejectMessage", {
      title: <strong>{share.grammarTitle}</strong>,
      name: share.senderName,
    }),
    confirmLabel: t("common.reject"),
    icon: <X />,
  });
  if (!ok) return false;
  const r = await rejectShareAction(share.id);
  if (!r.ok) {
    toast.error(r.message);
    return false;
  }
  toast.info(t("vocab.share.rejected"));
  return true;
}
