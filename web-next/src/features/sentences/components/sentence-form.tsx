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
import { useT } from "@/i18n/client";
import { createSentenceAction, updateSentenceAction } from "../actions";

type Initial = { id: string; chinese: string; pinyin: string; vietnamese: string; note: string; tags: string[] };
type Errors = Partial<Record<"chinese" | "pinyin" | "vietnamese" | "note" | "tags" | "form", string>>;

export function SentenceForm({ initial, allTags }: { initial: Initial | null; allTags: string[] }) {
  const router = useRouter();
  const t = useT();
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
      setErr((e) => ({ ...e, chinese: t("sentences.form.needChinese") }));
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
    toast.success(editing ? t("sentences.form.saved") : t("sentences.form.added"));
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
          {editing ? t("sentences.edit") : t("sentences.addNew")}
          <LeafDecor className="w-9" />
        </h1>
        <div className="hidden gap-2.5 md:flex">
          <Button asChild variant="secondary">
            <Link href="/sentences">{t("common.cancel")}</Link>
          </Button>
          <Button type="submit" variant="solid" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? t("common.saving") : t("sentences.form.save")}
          </Button>
        </div>
      </div>
      {err.form ? <Alert tone="error">{err.form}</Alert> : null}

      <Field id="sf-chinese" label={t("sentences.form.chinese")} required error={err.chinese}>
        <div className="relative">
          <Input
            id="sf-chinese"
            lang="zh"
            value={v.chinese}
            onChange={(e) => set("chinese", e.target.value)}
            maxLength={SENTENCE.MAX_CHINESE}
            placeholder={t("sentences.form.chinesePlaceholder")}
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
              aria-label={t("sentences.form.clearChinese")}
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-text-3 hover:bg-blue-50"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </Field>

      <Field
        id="sf-pinyin"
        label={t("sentences.form.pinyin")}
        optional={t("vocab.form.optional")}
        error={err.pinyin}
        hint={t("sentences.form.pinyinHint")}
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
            placeholder={t("sentences.form.pinyinPlaceholder")}
            autoComplete="off"
            spellCheck={false}
            className="flex-1"
            {...aria("pinyin")}
          />
          <Button type="button" variant="secondary" onClick={genPinyin} disabled={genBusy}>
            {genBusy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {t("sentences.form.generate")}
          </Button>
        </div>
        <button
          type="button"
          onClick={() => setRules(true)}
          className="inline-flex items-center gap-1 self-end text-sm font-semibold text-blue-600 hover:underline"
        >
          {t("sentences.form.rules")}
          <CircleHelp className="size-4" aria-hidden="true" />
        </button>
      </Field>

      <Field id="sf-vietnamese" label={t("sentences.form.vietnamese")} required error={err.vietnamese}>
        <Input
          id="sf-vietnamese"
          value={v.vietnamese}
          onChange={(e) => set("vietnamese", e.target.value)}
          maxLength={SENTENCE.MAX_VIETNAMESE}
          placeholder={t("sentences.form.vietnamesePlaceholder")}
          autoComplete="off"
          {...aria("vietnamese")}
        />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field
          id="sf-tags"
          label={t("sentences.form.tag")}
          optional={t("sentences.form.tagsMax", { max: SENTENCE.MAX_TAGS })}
          error={err.tags}
        >
          <TagInput
            id="sf-tags"
            value={tags}
            onChange={(next) => {
              if (next.length > SENTENCE.MAX_TAGS) {
                setErr((e) => ({ ...e, tags: t("errors.sentenceTagsMax", { max: SENTENCE.MAX_TAGS }) }));
                return;
              }
              setErr((e) => ({ ...e, tags: undefined }));
              setTags(next);
              setDirty(true);
            }}
            existing={allTags}
            placeholder={t("sentences.form.tagsPlaceholder")}
          />
        </Field>
        <Field id="sf-note" label={t("sentences.form.note")} optional={t("vocab.form.optional")} error={err.note}>
          <Textarea
            id="sf-note"
            rows={2}
            value={v.note}
            onChange={(e) => set("note", e.target.value)}
            maxLength={SENTENCE.MAX_NOTE}
            placeholder={t("sentences.form.notePlaceholder")}
            {...aria("note")}
          />
          <span className="self-end text-[13px] text-text-3" aria-live="polite">
            {v.note.length}/{SENTENCE.MAX_NOTE}
          </span>
        </Field>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-[1fr_1.6fr] gap-2.5 border-t border-border bg-white px-4 pt-2.5 pb-[calc(10px+var(--safe-b))] shadow-[0_-6px_20px_rgba(20,60,110,.08)] md:hidden">
        <Button asChild variant="secondary">
          <Link href="/sentences">{t("common.cancel")}</Link>
        </Button>
        <Button type="button" variant="solid" disabled={saving} onClick={() => submit()}>
          {saving ? <Loader2 className="animate-spin" /> : <Save />}
          {saving ? t("common.saving") : t("sentences.form.save")}
        </Button>
      </div>

      <Dialog open={rules} onOpenChange={setRules}>
        {rules ? (
          <DialogContent title={t("sentences.form.rulesTitle")} icon={<CircleHelp />}>
            <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-[15px] text-text-2">
              <li>
                {t.rich("sentences.form.rule1", { marks: <span className="font-semibold pinyin">ā á ǎ à</span> })}
              </li>
              <li>
                {t.rich("sentences.form.rule2", {
                  order: <b>a → o → e</b>,
                  iu: <b>iu</b>,
                  u: <b>u</b>,
                  ui: <b>ui</b>,
                  i: <b>i</b>,
                })}
              </li>
              <li>{t("sentences.form.rule3")}</li>
              <li>{t("sentences.form.rule4")}</li>
              <li>{t("sentences.form.rule5")}</li>
            </ol>
            <DialogActions>
              <DialogClose asChild>
                <Button variant="solid">{t("sentences.form.gotIt")}</Button>
              </DialogClose>
            </DialogActions>
          </DialogContent>
        ) : null}
      </Dialog>
    </form>
  );
}
