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
import { useT } from "@/i18n/client";

type Errors = Partial<Record<"hanzi" | "pinyin" | "meaningVi" | "note" | "tags" | "radicals", string>>;

/**
 * Form thêm / sửa từ vựng. Dùng ở trang Từ vựng, và nhúng trong hộp thoại ở nơi khác (vd "Lưu vào Từ vựng" từ bài chép
 * chính tả) với `embedded` + `initial` + `onDone` / `onCancel` — vẫn lưu vào kho Từ vựng chung, cùng kiểm tra dữ liệu.
 */
export function VocabForm({
  word,
  allTags,
  initial,
  embedded,
  onDone,
  onCancel,
}: {
  word: VocabItem | null;
  allTags: string[];
  initial?: Partial<Record<"hanzi" | "pinyin" | "meaningVi" | "note", string>>;
  embedded?: boolean;
  onDone?: (saved: { hanzi: string }) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const t = useT();
  const editing = !!word;
  const [m, setM] = React.useState({
    hanzi: word?.hanzi ?? initial?.hanzi ?? "",
    pinyin: word?.pinyin ?? initial?.pinyin ?? "",
    meaningVi: word?.meaningVi ?? initial?.meaningVi ?? "",
    note: word?.note ?? initial?.note ?? "",
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
    const timer = setTimeout(async () => {
      const { pinyin } = await import("pinyin-pro");
      if (alive) setSuggest(pinyin(hanOnly, { toneType: "symbol" }));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
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
    toast.success(
      editing ? t("vocab.form.updated", { word: r.data.hanzi }) : t("vocab.form.added", { word: r.data.hanzi }),
    );
    if (onDone) return onDone({ hanzi: r.data.hanzi });
    router.push("/vocabulary");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn(
        "relative grid gap-6 lg:gap-6",
        !embedded && "rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-7",
      )}
    >
      <div className="flex min-w-0 flex-col gap-5">
        <div className={cn(embedded && "hidden")}>
          <h1 className="text-[26px] font-extrabold tracking-tight text-navy md:text-[32px]">
            {editing ? t("vocab.edit") : t("vocab.addNew")}
          </h1>
          <p className="mt-1 text-[15px] text-text-2 md:text-[17px]">
            {editing ? t("vocab.form.editSub") : t("vocab.form.newSub")}
          </p>
        </div>

        {formError ? (
          <div ref={alertRef}>
            <Alert tone="error">
              <strong>{t("vocab.form.notSaved")}</strong> {t.maybe(formError)} {t("vocab.form.keptHint")}
            </Alert>
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2">
          <FieldBox
            id="hanzi"
            label={t("vocab.form.hanzi")}
            required
            hint={t("vocab.form.hanziHint")}
            error={errors.hanzi}
          >
            <Input
              id="hanzi"
              lang="zh"
              autoFocus
              value={m.hanzi}
              maxLength={VOCAB.MAX_HANZI}
              onChange={(e) => set("hanzi", e.target.value)}
              placeholder={t("vocab.form.hanziPlaceholder")}
              aria-invalid={!!errors.hanzi || undefined}
              aria-required
              aria-describedby="hanzi-hint hanzi-err"
              className="font-cn text-lg"
            />
          </FieldBox>
          <FieldBox
            id="pinyin"
            label={t("vocab.form.pinyin")}
            required
            hint={t("vocab.form.pinyinHint")}
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
              placeholder={t("vocab.form.pinyinPlaceholder")}
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
                {t.rich("vocab.form.suggest", { value: <span className="font-semibold">{suggest}</span> })}
              </button>
            ) : null}
          </FieldBox>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="radical-input">
            {t("vocab.form.radicals")} <span className="font-medium text-text-2">{t("vocab.form.optional")}</span>
          </Label>
          <RadicalPicker
            value={m.radicals}
            onChange={(v) => set("radicals", v)}
            hanzi={m.hanzi}
            describedBy="radical-hint"
          />
          <span id="radical-hint" className="text-[13.5px] text-text-3">
            {t("vocab.form.radicalHint")}
          </span>
        </div>

        <FieldBox
          id="meaningVi"
          label={t("vocab.form.meaning")}
          required
          hint={t("vocab.form.meaningHint")}
          error={errors.meaningVi}
        >
          <Input
            id="meaningVi"
            value={m.meaningVi}
            maxLength={VOCAB.MAX_MEANING}
            onChange={(e) => set("meaningVi", e.target.value)}
            placeholder={t("vocab.form.meaningPlaceholder")}
            autoComplete="off"
            aria-invalid={!!errors.meaningVi || undefined}
            aria-required
            aria-describedby="meaningVi-hint meaningVi-err"
          />
        </FieldBox>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="note">
            {t("vocab.form.note")} <span className="font-medium text-text-2">{t("vocab.form.noteExtra")}</span>
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
            placeholder={t("vocab.form.notePlaceholder")}
            aria-invalid={!!errors.note || undefined}
            aria-describedby="note-hint note-count"
          />
          <div className="flex flex-wrap items-start gap-x-3 gap-y-1 text-[13.5px]">
            {errors.note ? <span className="text-red">{t.maybe(errors.note)}</span> : null}
            <span id="note-hint" className="text-text-3">
              {t("vocab.form.noteHint")}
            </span>
            <span id="note-count" className="ml-auto text-text-3 tabular-nums">
              {m.note.length}/{VOCAB.MAX_NOTE}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span id="tag-label" className="text-[15px] font-semibold text-text">
            {t("vocab.form.tag")}
          </span>
          <TagPicker value={m.tags} onChange={(v) => set("tags", v)} allTags={allTags} labelId="tag-label" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Điện thoại: nút Lưu/Hủy dính ở đáy (màn tập trung không có tab bar). */}
        <div
          className={cn(
            "grid gap-2.5",
            embedded
              ? "grid-cols-[1fr_1.6fr] sm:grid-cols-2"
              : "fixed inset-x-0 bottom-0 z-40 grid-cols-[1fr_1.6fr] border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] lg:static lg:mt-auto lg:grid-cols-2 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
          )}
        >
          {onCancel ? (
            <Button type="button" variant="secondary" className="min-h-[50px] lg:min-h-12" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
          ) : (
            <Button asChild variant="secondary" className="min-h-[50px] lg:min-h-12">
              <Link href="/vocabulary">{t("common.cancel")}</Link>
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={saving} className="min-h-[50px] lg:min-h-12">
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? t("common.saving") : t("vocab.form.save")}
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
  const t = useT();
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
        {error ? t.maybe(error) : null}
      </span>
    </div>
  );
}
