"use client";
import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Tag, checkboxClass } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { G_LIMITS, parseEmails, SHARE_STATUS_LABEL } from "../schema";
import { acceptShareAction, listSentAction, rejectShareAction, shareGrammarAction, sourceTagsAction } from "../actions";

// ---------- Ô nhập thẻ: gõ tên → Enter ----------

/** Trim, bỏ rỗng, không trùng (không phân biệt hoa/thường); tên trùng thẻ có sẵn thì dùng đúng tên đó. */
export function TagInput({
  value,
  onChange,
  existing,
  id,
  placeholder = "Nhập tên thẻ rồi nhấn Enter",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  existing: string[];
  id: string;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const [err, setErr] = React.useState("");
  const add = (raw: string) => {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) return void setErr("Tên thẻ không được để trống.");
    if (name.length > G_LIMITS.tag) return void setErr(`Tên thẻ tối đa ${G_LIMITS.tag} ký tự.`);
    if (value.some((t) => t.toLowerCase() === name.toLowerCase())) return void setErr(`Thẻ “${name}” đã được thêm.`);
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
          placeholder={placeholder}
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

export function StatusPill({ status }: { status: SentItem["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-lg px-2.5 py-0.5 text-[13px] font-semibold",
        status === "PENDING" && "bg-amber-50 text-[#C97A06]",
        status === "ACCEPTED" && "bg-green-50 text-green-700",
        status === "REJECTED" && "bg-red-50 text-red",
      )}
    >
      {SHARE_STATUS_LABEL[status]}
    </span>
  );
}

export function SentList({ sent }: { sent: SentItem[] }) {
  if (!sent.length) return <p className="text-sm text-text-3">Chưa chia sẻ cho ai.</p>;
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
    if (!emails.length) return void setErr("Vui lòng nhập ít nhất 1 email người nhận.");
    setErr("");
    setBusy(true);
    const r = await shareGrammarAction(grammar.id, emails);
    setBusy(false);
    if (!r.ok) return void setErr(r.message || "Không gửi được. Vui lòng thử lại.");
    setResults(r.data.results);
    // Giữ lại các email lỗi trong ô để sửa.
    setText(
      r.data.results
        .filter((x) => !x.ok)
        .map((x) => x.email)
        .join(", "),
    );
    if (r.data.sent) {
      toast.success(`Đã gửi chia sẻ cho ${r.data.sent} người.`);
      setSent(r.data.sentList);
      onSent?.(r.data.sentList);
    }
  }

  return (
    <DialogContent title="Chia sẻ ngữ pháp" icon={<Share2 />} wide>
      <p className="text-[15px] text-text-2">
        Chia sẻ <strong className="text-text">{grammar.title}</strong> cho người dùng LingYu Chinese khác. Ghi chú cá
        nhân của bạn sẽ <strong className="text-text">không</strong> được chia sẻ.
      </p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="gs-emails" className="text-[15px] font-semibold text-text">
          Email người nhận
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
          placeholder="vd: ban@gmail.com, linh@gmail.com"
          aria-invalid={!!err || undefined}
          aria-describedby="gs-hint gs-err"
        />
        <span id="gs-hint" className="text-[13.5px] text-text-3">
          Có thể nhập nhiều email, cách nhau bằng dấu phẩy hoặc xuống dòng.
        </span>
        <span id="gs-err" role="alert" className={cn("text-sm text-red", !err && "hidden")}>
          {err}
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
                <strong>{x.email}</strong> — {x.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-2">
        <strong className="text-navy">Đã chia sẻ với</strong>
        <SentList sent={sent} />
      </div>
      <DialogActions>
        <DialogClose asChild>
          <Button variant="secondary">Đóng</Button>
        </DialogClose>
        <Button variant="solid" disabled={busy} onClick={submit}>
          {busy ? <Loader2 className="animate-spin" /> : <Share2 />}
          {busy ? "Đang gửi..." : "Gửi chia sẻ"}
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
      return void setErr(r.message || "Không chấp nhận được. Vui lòng thử lại.");
    }
    toast.success(`Đã thêm “${r.data.title}” vào thư viện của bạn.`);
    onDone(r.data);
  }

  return (
    <DialogContent title="Thêm vào thư viện của bạn" icon={<CheckCircle2 />} wide>
      <p className="text-[15px] text-text-2">
        <strong className="text-text">{share.senderName}</strong> đã chia sẻ{" "}
        <strong className="text-text">{share.grammarTitle}</strong>. Một bản riêng sẽ được thêm vào thư viện của bạn —
        bạn sửa hay xóa bản này không ảnh hưởng đến bản của người gửi.
      </p>
      {senderTags?.length ? (
        <label className="flex cursor-pointer flex-wrap items-center gap-2.5 rounded-md bg-bg px-3 py-2.5">
          <input type="checkbox" className={checkboxClass} checked={keep} onChange={(e) => setKeep(e.target.checked)} />
          <span className="text-[15px]">Giữ thẻ hiện tại:</span>
          {senderTags.map((t) => (
            <Tag key={t} name={t} />
          ))}
        </label>
      ) : null}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="ga-tags" className="text-[15px] font-semibold text-text">
          Thêm thẻ của tôi <span className="font-medium text-text-2">(không bắt buộc)</span>
        </label>
        <TagInput
          id="ga-tags"
          value={extra}
          onChange={setExtra}
          existing={myTags}
          placeholder="vd: Bài 2 — nhấn Enter để thêm"
        />
      </div>
      {err ? (
        <p role="alert" className="text-sm text-red">
          {err}
        </p>
      ) : null}
      <DialogActions>
        <DialogClose asChild>
          <Button variant="secondary">Hủy</Button>
        </DialogClose>
        <Button variant="solid" disabled={busy || senderTags === null} onClick={accept}>
          {busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
          {busy ? "Đang thêm..." : "Chấp nhận"}
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
  const ok = await confirm({
    title: "Từ chối chia sẻ?",
    message: (
      <>
        Từ chối <strong>{share.grammarTitle}</strong> từ {share.senderName}?
      </>
    ),
    confirmLabel: "Từ chối",
    icon: <X />,
  });
  if (!ok) return false;
  const r = await rejectShareAction(share.id);
  if (!r.ok) {
    toast.error(r.message);
    return false;
  }
  toast.info("Đã từ chối lời mời chia sẻ.");
  return true;
}
