"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleHelp, Loader2, Save, Sparkles, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { applyToneInput } from "@/lib/pinyin";
import { SENTENCE } from "@/lib/limits";
import { sentencePinyin } from "@/lib/sentence-pinyin";
import { TagInput } from "@/features/grammar/components/grammar-dialogs";
import { sentenceInputSchema } from "../schema";
import { createSentenceAction, updateSentenceAction } from "../actions";

type Initial = { id: string; chinese: string; pinyin: string; vietnamese: string; note: string; tags: string[] };
type Errors = Partial<Record<"chinese" | "pinyin" | "vietnamese" | "note" | "tags" | "form", string>>;

export function SentenceForm({ initial, allTags }: { initial: Initial | null; allTags: string[] }) {
  const router = useRouter();
  const editing = !!initial;
  const [v, setV] = React.useState({
    chinese: initial?.chinese ?? "",
    pinyin: initial?.pinyin ?? "",
    vietnamese: initial?.vietnamese ?? "",
    note: initial?.note ?? "",
  });
  const [tags, setTags] = React.useState<string[]>(initial?.tags ?? []);
  const [err, setErr] = React.useState<Errors>({});
  const [saving, setSaving] = React.useState(false);
  const [genBusy, setGenBusy] = React.useState(false);
  const [rules, setRules] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  React.useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const set = (k: keyof typeof v, value: string) => {
    setV((s) => ({ ...s, [k]: value }));
    setErr((e) => ({ ...e, [k]: undefined, form: undefined }));
    setDirty(true);
  };

  async function genPinyin() {
    if (!/\p{Script=Han}/u.test(v.chinese)) {
      setErr((e) => ({ ...e, chinese: "Nhập câu tiếng Trung trước khi tạo Pinyin." }));
      return document.getElementById("sf-chinese")?.focus();
    }
    setGenBusy(true);
    try {
      set("pinyin", await sentencePinyin(v.chinese));
    } finally {
      setGenBusy(false);
    }
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (saving) return;
    const parsed = sentenceInputSchema.safeParse({ ...v, tags });
    if (!parsed.success) {
      const next: Errors = {};
      for (const i of parsed.error.issues) next[(i.path[0] as keyof Errors) ?? "form"] ??= i.message;
      setErr(next);
      const first = (["chinese", "vietnamese", "pinyin", "note"] as const).find((k) => next[k]);
      if (first) document.getElementById(`sf-${first}`)?.focus();
      return;
    }
    setSaving(true);
    const r = editing ? await updateSentenceAction(initial!.id, parsed.data) : await createSentenceAction(parsed.data);
    if (!r.ok) {
      setSaving(false);
      return void setErr({ ...(r.fieldErrors ?? {}), form: r.fieldErrors ? undefined : r.message });
    }
    setDirty(false);
    toast.success(editing ? "Đã lưu thay đổi." : "Đã thêm câu mới.");
    router.push("/sentences");
    router.refresh();
  }

  const aria = (k: keyof Errors) => ({
    "aria-invalid": err[k] ? true : undefined,
    "aria-describedby": err[k] ? `sf-${k}-err` : undefined,
  });

  return (
    <form
      onSubmit={submit}
      noValidate
      aria-labelledby="sf-title"
      className="flex flex-col gap-5 rounded-[var(--radius-xl)] border border-border bg-white/94 p-4 pb-28 shadow-card md:p-7 md:pb-7"
    >
      <div className="flex items-center justify-between gap-3">
        <h1 id="sf-title" className="flex items-center gap-3 text-[24px] font-extrabold text-navy md:text-[28px]">
          {editing ? "Sửa câu" : "Thêm câu mới"}
          <LeafDecor className="w-9" />
        </h1>
        <div className="hidden gap-2.5 md:flex">
          <Button asChild variant="secondary">
            <Link href="/sentences">Hủy</Link>
          </Button>
          <Button type="submit" variant="solid" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Đang lưu..." : "Lưu câu"}
          </Button>
        </div>
      </div>
      {err.form ? <Alert tone="error">{err.form}</Alert> : null}

      <Field id="sf-chinese" label="Câu tiếng Trung" required error={err.chinese}>
        <div className="relative">
          <Input
            id="sf-chinese"
            lang="zh"
            value={v.chinese}
            onChange={(e) => set("chinese", e.target.value)}
            maxLength={SENTENCE.MAX_CHINESE}
            placeholder="vd: 我每天学习中文。"
            autoComplete="off"
            className="pr-11 hanzi text-lg text-text"
            {...aria("chinese")}
          />
          {v.chinese ? (
            <button
              type="button"
              onClick={() => {
                set("chinese", "");
                document.getElementById("sf-chinese")?.focus();
              }}
              aria-label="Xóa câu tiếng Trung"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-text-3 hover:bg-blue-50"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </Field>

      <Field
        id="sf-pinyin"
        label="Pinyin"
        optional="(không bắt buộc)"
        error={err.pinyin}
        hint="Gõ số sau âm tiết để thêm dấu: wo3 → wǒ, mei3tian1 → měitiān."
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="sf-pinyin"
            value={v.pinyin}
            onChange={(e) =>
              set(
                "pinyin",
                applyToneInput(e.currentTarget, e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing),
              )
            }
            maxLength={SENTENCE.MAX_PINYIN}
            placeholder="vd: Wǒ měitiān xuéxí Zhōngwén."
            autoComplete="off"
            spellCheck={false}
            className="flex-1"
            {...aria("pinyin")}
          />
          <Button type="button" variant="secondary" onClick={genPinyin} disabled={genBusy}>
            {genBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Tạo Pinyin
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setRules(true)}
          className="inline-flex items-center gap-1 self-end text-sm font-semibold text-blue-600 hover:underline"
        >
          Quy tắc Pinyin
          <CircleHelp className="size-4" aria-hidden="true" />
        </button>
      </Field>

      <Field id="sf-vietnamese" label="Câu tiếng Việt" required error={err.vietnamese}>
        <Input
          id="sf-vietnamese"
          value={v.vietnamese}
          onChange={(e) => set("vietnamese", e.target.value)}
          maxLength={SENTENCE.MAX_VIETNAMESE}
          placeholder="vd: Tôi học tiếng Trung mỗi ngày."
          autoComplete="off"
          {...aria("vietnamese")}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field id="sf-tags" label="Tag" optional={`(tối đa ${SENTENCE.MAX_TAGS})`} error={err.tags}>
          <TagInput
            id="sf-tags"
            value={tags}
            onChange={(t) => {
              if (t.length > SENTENCE.MAX_TAGS) {
                setErr((e) => ({ ...e, tags: `Tối đa ${SENTENCE.MAX_TAGS} tag cho một câu.` }));
                return;
              }
              setErr((e) => ({ ...e, tags: undefined }));
              setTags(t);
              setDirty(true);
            }}
            existing={allTags}
            placeholder="vd: Hằng ngày — nhấn Enter"
          />
        </Field>
        <Field id="sf-note" label="Ghi chú" optional="(không bắt buộc)" error={err.note}>
          <Textarea
            id="sf-note"
            rows={2}
            value={v.note}
            onChange={(e) => set("note", e.target.value)}
            maxLength={SENTENCE.MAX_NOTE}
            placeholder="Ví dụ: cách dùng, ngữ cảnh..."
            {...aria("note")}
          />
          <span className="self-end text-[13px] text-text-3" aria-live="polite">
            {v.note.length}/{SENTENCE.MAX_NOTE}
          </span>
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.6fr] gap-2.5 border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] md:hidden">
        <Button asChild variant="secondary">
          <Link href="/sentences">Hủy</Link>
        </Button>
        <Button type="button" variant="solid" disabled={saving} onClick={() => submit()}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? "Đang lưu..." : "Lưu câu"}
        </Button>
      </div>

      <Dialog open={rules} onOpenChange={setRules}>
        {rules ? (
          <DialogContent title="Quy tắc viết Pinyin" icon={<CircleHelp />}>
            <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-[15px] text-text-2">
              <li>
                Dùng dấu thanh chuẩn: <span className="font-semibold pinyin">ā á ǎ à</span>.
              </li>
              <li>
                Quy tắc đặt dấu: ưu tiên <b>a → o → e</b>. Với <b>iu</b> đặt dấu trên <b>u</b>, với <b>ui</b> đặt dấu
                trên <b>i</b>. Ví dụ: hao3 → hǎo, liu2 → liú, gui4 → guì.
              </li>
              <li>Cho phép nhập số thanh: wo3 → wǒ, mei3tian1 → měitiān.</li>
              <li>Thanh nhẹ: không dấu hoặc dùng số 5 (ma5 → ma).</li>
              <li>Pinyin không bắt buộc, bạn có thể để trống — hoặc bấm “Tạo Pinyin” rồi sửa lại cho đúng.</li>
            </ol>
            <DialogActions>
              <DialogClose asChild>
                <Button variant="solid">Đã hiểu</Button>
              </DialogClose>
            </DialogActions>
          </DialogContent>
        ) : null}
      </Dialog>
    </form>
  );
}
