"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { VOCAB } from "@/lib/limits";
import { applyToneInput } from "@/lib/pinyin";
import { vocabInputSchema } from "../schema";
import type { VocabItem } from "../service";
import { createVocabAction, updateVocabAction } from "../actions";
import { RadicalPicker } from "./radical-picker";
import { TagPicker } from "./tag-picker";

type Errors = Partial<Record<"hanzi" | "pinyin" | "meaningVi" | "note" | "tags" | "radicals", string>>;

export function VocabForm({ word, allTags }: { word: VocabItem | null; allTags: string[] }) {
  const router = useRouter();
  const editing = !!word;
  const [m, setM] = React.useState({
    hanzi: word?.hanzi ?? "",
    pinyin: word?.pinyin ?? "",
    meaningVi: word?.meaningVi ?? "",
    note: word?.note ?? "",
    tags: word?.tags ?? [],
    radicals: word?.radicals ?? [],
  });
  const [errors, setErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [suggest, setSuggest] = React.useState("");
  const alertRef = React.useRef<HTMLDivElement>(null);

  const set = <K extends keyof typeof m>(k: K, v: (typeof m)[K]) => {
    setM((s) => ({ ...s, [k]: v }));
    if (k in errors) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // Gợi ý pinyin bằng pinyin-pro (nạp khi cần) khi đã có chữ Hán mà ô pinyin còn trống — bấm để điền, không tự ghi đè.
  const hanOnly = [...m.hanzi].filter((c) => /\p{Script=Han}/u.test(c)).join("");
  React.useEffect(() => {
    if (!hanOnly || m.pinyin.trim()) return;
    let alive = true;
    const t = setTimeout(async () => {
      const { pinyin } = await import("pinyin-pro");
      if (alive) setSuggest(pinyin(hanOnly, { toneType: "symbol" }));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [hanOnly, m.pinyin]);
  const showSuggest = !!hanOnly && !m.pinyin.trim() && !!suggest;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setFormError("");
    const parsed = vocabInputSchema.safeParse(m);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const i of parsed.error.issues) {
        const k = String(i.path[0]) as keyof Errors;
        errs[k] ??= i.message;
      }
      setErrors(errs);
      const first = (["hanzi", "pinyin", "meaningVi", "note"] as const).find((k) => errs[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    const fd = new FormData();
    fd.set("data", JSON.stringify(parsed.data));
    setSaving(true);
    const r = editing ? await updateVocabAction(word!.id, fd) : await createVocabAction(fd);
    if (!r.ok) {
      setSaving(false);
      if (r.fieldErrors) setErrors(r.fieldErrors as Errors);
      setFormError(r.message);
      requestAnimationFrame(() => alertRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    toast.success(editing ? `Đã cập nhật “${r.data.hanzi}”.` : `Đã thêm “${r.data.hanzi}” vào danh sách.`);
    router.push("/vocabulary");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="relative grid gap-6 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-7 lg:gap-6"
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-navy md:text-[32px]">
            {editing ? "Sửa từ vựng" : "Thêm từ vựng mới"}
          </h1>
          <p className="mt-1 text-[15px] text-text-2 md:text-[17px]">
            {editing
              ? "Cập nhật thông tin cho từ vựng của bạn."
              : "Điền thông tin để thêm từ vựng vào danh sách của bạn."}
          </p>
        </div>

        {formError ? (
          <div ref={alertRef}>
            <Alert tone="error">
              <strong>Chưa lưu được.</strong> {formError} Dữ liệu bạn nhập vẫn được giữ — hãy bấm “Lưu từ vựng” để thử
              lại.
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <FieldBox id="hanzi" label="Hán tự" required hint="Ví dụ: 你" error={errors.hanzi}>
            <Input
              id="hanzi"
              lang="zh"
              autoFocus
              value={m.hanzi}
              maxLength={VOCAB.MAX_HANZI}
              onChange={(e) => set("hanzi", e.target.value)}
              placeholder="Nhập chữ Hán"
              aria-invalid={!!errors.hanzi || undefined}
              aria-required
              aria-describedby="hanzi-hint hanzi-err"
              className="font-cn text-lg"
            />
          </FieldBox>
          <FieldBox
            id="pinyin"
            label="Pinyin"
            required
            hint="Gõ số 1–4 sau âm tiết để thêm dấu: ni3 → nǐ, hao3 → hǎo, lv4 → lǜ"
            error={errors.pinyin}
          >
            <Input
              id="pinyin"
              value={m.pinyin}
              maxLength={VOCAB.MAX_PINYIN}
              onChange={(e) =>
                set(
                  "pinyin",
                  applyToneInput(e.currentTarget, e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing),
                )
              }
              placeholder="Nhập pinyin, vd: ni3 hao3"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={!!errors.pinyin || undefined}
              aria-required
              aria-describedby="pinyin-hint pinyin-err"
            />
            {showSuggest ? (
              <button
                type="button"
                onClick={() => set("pinyin", suggest)}
                className="inline-flex min-h-9 items-center gap-1.5 self-start rounded-lg border border-dashed border-[#A9D3F8] bg-blue-50 px-3 text-sm text-blue-700 hover:bg-blue-100"
              >
                <Sparkles className="size-4" />
                Gợi ý: <span className="font-semibold">{suggest}</span> — bấm để điền
              </button>
            ) : null}
          </FieldBox>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="radical-input">
            Bộ thủ <span className="font-medium text-text-2">(không bắt buộc)</span>
          </Label>
          <RadicalPicker
            value={m.radicals}
            onChange={(v) => set("radicals", v)}
            hanzi={m.hanzi}
            describedBy="radical-hint"
          />
          <span id="radical-hint" className="text-[13.5px] text-text-3">
            Gõ tiếng Việt rồi chọn bộ thủ trong danh sách. Có thể chọn nhiều bộ, hoặc bấm gợi ý từ chữ Hán.
          </span>
        </div>

        <FieldBox
          id="meaningVi"
          label="Nghĩa tiếng Việt"
          required
          hint="Ví dụ: bạn, cậu — nhiều nghĩa cách nhau bằng dấu phẩy"
          error={errors.meaningVi}
        >
          <Input
            id="meaningVi"
            value={m.meaningVi}
            maxLength={VOCAB.MAX_MEANING}
            onChange={(e) => set("meaningVi", e.target.value)}
            placeholder="Nhập nghĩa tiếng Việt"
            autoComplete="off"
            aria-invalid={!!errors.meaningVi || undefined}
            aria-required
            aria-describedby="meaningVi-hint meaningVi-err"
          />
        </FieldBox>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">
            Note <span className="font-medium text-text-2">(ghi chú, cách dùng, ví dụ...)</span>
          </Label>
          <Textarea
            id="note"
            value={m.note}
            maxLength={VOCAB.MAX_NOTE}
            onChange={(e) =>
              set(
                "note",
                applyToneInput(e.currentTarget, e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing, true),
              )
            }
            placeholder="Nhập ghi chú, cách dùng, ví dụ... (gõ ni3 hao3 → nǐ hǎo)"
            aria-invalid={!!errors.note || undefined}
            aria-describedby="note-hint note-count"
          />
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 text-[13.5px]">
            {errors.note ? <span className="text-red">{errors.note}</span> : null}
            <span id="note-hint" className="text-text-3">
              Pinyin trong ghi chú cũng tự thêm dấu khi gõ số 1–4 (ni3 → nǐ). “HSK1”, “Bài 2”… giữ nguyên.
            </span>
            <span id="note-count" className="ml-auto text-text-3 tabular-nums">
              {m.note.length}/{VOCAB.MAX_NOTE}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="tag-label" className="text-[15px] font-semibold text-text">
            Tag
          </span>
          <TagPicker value={m.tags} onChange={(v) => set("tags", v)} allTags={allTags} labelId="tag-label" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Điện thoại: nút Lưu/Hủy dính ở đáy (màn tập trung không có tab bar). */}
        <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.6fr] gap-2.5 border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] lg:static lg:mt-auto lg:grid-cols-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
          <Button asChild variant="secondary" className="min-h-[50px] lg:min-h-12">
            <Link href="/vocabulary">Hủy</Link>
          </Button>
          <Button type="submit" variant="primary" disabled={saving} className="min-h-[50px] lg:min-h-12">
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? "Đang lưu..." : "Lưu từ vựng"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function FieldBox({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span className="ml-0.5 text-red" aria-hidden="true">
            *
          </span>
        ) : null}
      </Label>
      {children}
      {hint ? (
        <span id={`${id}-hint`} className="text-[13.5px] text-text-3">
          {hint}
        </span>
      ) : null}
      <span id={`${id}-err`} role="alert" className={cn("text-sm text-red", !error && "hidden")}>
        {error}
      </span>
    </div>
  );
}
