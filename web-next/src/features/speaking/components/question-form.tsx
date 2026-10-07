"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { FeatureHero } from "@/components/feature-hero";
import { SpeakButton } from "@/components/speak-button";
import { toast } from "@/components/ui/toaster";
import { tagColors } from "@/lib/tag-style";
import { cn } from "@/lib/utils";
import { SPEAKING } from "@/lib/limits";
import { useT } from "@/i18n/client";
import { assistAction, createQuestionsAction, updateQuestionAction } from "../actions";

type Item = {
  key: number;
  zh: string;
  pinyin: string;
  meaning: string;
  hsk: number | null;
  tags: string[];
  gloss?: boolean;
};
const blank = (key: number, tags: string[] = []): Item => ({ key, zh: "", pinyin: "", meaning: "", hsk: null, tags });

const field =
  "h-11 w-full rounded-[12px] border border-border bg-white px-3 text-[15px] text-navy-900 outline-none focus:border-blue-600";

/** Màn A — tạo nhiều câu hỏi một lần (hoặc sửa một câu). Pinyin / nghĩa tự sinh, sửa được; HSK; nhiều tag. */
export function QuestionForm({
  initial,
  id,
  knownTags,
}: {
  /** Có = sửa câu hỏi `id`. */
  initial?: Omit<Item, "key">;
  id?: string;
  knownTags: string[];
}) {
  const t = useT();
  const router = useRouter();
  const editing = !!id;
  const [items, setItems] = React.useState<Item[]>(() => [initial ? { ...initial, key: 0 } : blank(0)]);
  const [busy, setBusy] = React.useState<number | "save" | null>(null);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const nextKey = React.useRef(1);
  const presets = t("speaking.presetTags").split(",");
  const suggestions = [...new Set([...presets, ...knownTags])];

  const patch = (key: number, p: Partial<Item>) =>
    setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...p } : x)));

  async function fill(it: Item) {
    if (!it.zh.trim()) return;
    setBusy(it.key);
    const r = await assistAction(it.zh);
    setBusy(null);
    if (!r.ok) return void toast.error(r.message);
    patch(it.key, { pinyin: r.data.pinyin, meaning: r.data.meaning, gloss: r.data.source === "gloss" });
  }

  async function save() {
    setErrors({});
    const payload = items
      .filter((x) => x.zh.trim() || editing)
      .map(({ zh, pinyin, meaning, hsk, tags }) => ({ zh, pinyin, meaning, hsk, tags }));
    setBusy("save");
    const r = editing
      ? await updateQuestionAction(id!, payload[0])
      : await createQuestionsAction({ questions: payload });
    setBusy(null);
    if (!r.ok) {
      setErrors(r.fieldErrors ?? {});
      return void toast.error(r.message);
    }
    toast.success(editing ? t("speaking.updated") : t("speaking.saved", { count: payload.length }));
    router.push("/speaking");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <FeatureHero
        id="sp-form-title"
        title={editing ? t("speaking.editTitle") : t("speaking.newTitle")}
        description={t("speaking.formSub")}
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex flex-col gap-4"
      >
        {items.map((it, i) => {
          const err = (f: string) => errors[editing ? f : `questions.${i}.${f}`] ?? (i === 0 ? errors[f] : undefined);
          return (
            <fieldset
              key={it.key}
              className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5"
            >
              <legend className="sr-only">{t("speaking.questionN", { n: i + 1 })}</legend>
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#DCEBFF] text-[14px] font-bold text-blue-700">
                  {i + 1}
                </span>
                <span className="text-[16px] font-bold text-navy-900">{t("speaking.questionN", { n: i + 1 })}</span>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setItems((xs) => xs.filter((x) => x.key !== it.key))}
                    aria-label={t("speaking.removeQuestion", { n: i + 1 })}
                    className="ml-auto inline-flex size-9 items-center justify-center rounded-full text-red hover:bg-red-50"
                  >
                    <Trash2 className="size-[18px]" />
                  </button>
                ) : null}
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[14.5px] font-semibold text-navy-900">
                  {t("speaking.zh")} <span className="text-red">*</span>
                </span>
                <span className="flex items-center gap-2">
                  <input
                    lang="zh"
                    value={it.zh}
                    maxLength={SPEAKING.MAX_ZH}
                    onChange={(e) => patch(it.key, { zh: e.target.value })}
                    onBlur={() => !it.pinyin && !it.meaning && void fill(it)}
                    placeholder={t("speaking.zhPlaceholder")}
                    aria-invalid={!!err("zh") || undefined}
                    className={cn(field, "h-12 [font-family:var(--font-paper)] text-[19px]")}
                  />
                  <SpeakButton text={it.zh} label={t("speaking.listen")} />
                </span>
                {err("zh") ? <span className="text-[13.5px] text-red">{err("zh")}</span> : null}
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => fill(it)}
                  disabled={!it.zh.trim() || busy === it.key}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#F1EBFF] px-3 text-[14px] font-semibold text-[#5B3CC4] hover:bg-[#E7DEFF] disabled:opacity-50"
                >
                  {busy === it.key ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {busy === it.key ? t("speaking.autoFilling") : t("speaking.autoFill")}
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[14.5px] font-semibold text-navy-900">{t("speaking.pinyin")}</span>
                  <input
                    value={it.pinyin}
                    maxLength={SPEAKING.MAX_PINYIN}
                    onChange={(e) => patch(it.key, { pinyin: e.target.value })}
                    placeholder={t("speaking.pinyinPlaceholder")}
                    className={field}
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[14.5px] font-semibold text-navy-900">{t("speaking.meaning")}</span>
                  <input
                    value={it.meaning}
                    maxLength={SPEAKING.MAX_MEANING}
                    onChange={(e) => patch(it.key, { meaning: e.target.value, gloss: false })}
                    placeholder={t("speaking.meaningPlaceholder")}
                    className={field}
                  />
                  {it.gloss ? <span className="text-[13px] text-[#8A5300]">{t("speaking.glossNote")}</span> : null}
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)]">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[14.5px] font-semibold text-navy-900">{t("speaking.hsk")}</span>
                  <select
                    value={it.hsk ?? ""}
                    onChange={(e) => patch(it.key, { hsk: e.target.value ? Number(e.target.value) : null })}
                    className={field}
                  >
                    <option value="">{t("speaking.hskNone")}</option>
                    {[1, 2, 3, 4, 5, 6].map((h) => (
                      <option key={h} value={h}>
                        HSK{h}
                      </option>
                    ))}
                  </select>
                </label>
                <TagField
                  tags={it.tags}
                  onChange={(tags) => patch(it.key, { tags })}
                  suggestions={suggestions}
                  error={err("tags")}
                />
              </div>
            </fieldset>
          );
        })}

        <div className="flex flex-wrap items-center gap-2.5">
          {!editing && items.length < SPEAKING.MAX_BATCH ? (
            <button
              type="button"
              onClick={() => setItems((xs) => [...xs, blank(nextKey.current++, xs.at(-1)?.tags ?? [])])}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-dashed border-blue-600 bg-white px-4 text-[15px] font-semibold text-blue-700 hover:bg-blue-50"
            >
              <Plus className="size-5" aria-hidden="true" />
              {t("speaking.addQuestion")}
            </button>
          ) : null}
          <span className="ml-auto flex gap-2.5">
            <Link
              href={editing ? `/speaking/${id}` : "/speaking"}
              className="inline-flex h-11 items-center rounded-[12px] border border-border bg-white px-4 text-[15px] font-semibold text-navy-900 hover:bg-blue-50"
            >
              {t("speaking.cancel")}
            </Link>
            <button
              type="submit"
              disabled={busy === "save"}
              className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-[#1769C9] px-5 text-[15px] font-semibold text-white hover:bg-[#135AAD] disabled:opacity-60"
            >
              {busy === "save" ? <Loader2 className="size-5 animate-spin" /> : <Save className="size-5" />}
              {busy === "save" ? t("speaking.saving") : t("speaking.save")}
            </button>
          </span>
        </div>
      </form>
    </div>
  );
}

/** Nhiều tag: gõ + Enter, bấm tag gợi ý, bấm × để bỏ. */
export function TagField({
  tags,
  onChange,
  suggestions,
  error,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  error?: string;
}) {
  const t = useT();
  const [v, setV] = React.useState("");
  const id = React.useId();
  const add = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, SPEAKING.MAX_TAG);
    if (!tag || tags.some((x) => x.toLowerCase() === tag.toLowerCase()) || tags.length >= SPEAKING.MAX_TAGS) return;
    onChange([...tags, tag]);
  };
  const rest = suggestions.filter((s) => !tags.some((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 10);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[14.5px] font-semibold text-navy-900">
        {t("speaking.tags")}
      </label>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-[12px] border border-border bg-white px-2 py-1.5 focus-within:border-blue-600">
        {tags.map((tg) => (
          <span
            key={tg}
            className="inline-flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-[13px] font-semibold"
            style={tagColors(tg)}
          >
            {tg}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== tg))}
              aria-label={t("speaking.removeTag", { tag: tg })}
              className="inline-flex size-5 items-center justify-center rounded-full hover:bg-black/5"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(v);
              setV("");
            } else if (e.key === "Backspace" && !v && tags.length) onChange(tags.slice(0, -1));
          }}
          onBlur={() => {
            if (v.trim()) add(v);
            setV("");
          }}
          placeholder={tags.length ? "" : t("speaking.tagPlaceholder")}
          className="min-w-[120px] flex-1 bg-transparent px-1 text-[15px] outline-none"
        />
      </div>
      {rest.length ? (
        <div className="flex flex-wrap items-center gap-1.5" aria-label={t("speaking.suggestedTags")}>
          {rest.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-dashed border-border px-2.5 text-[12.5px] font-semibold text-text-2 hover:border-blue-600 hover:text-blue-700"
            >
              <Plus className="size-3" aria-hidden="true" />
              {s}
            </button>
          ))}
        </div>
      ) : null}
      {error ? <span className="text-[13.5px] text-red">{error}</span> : null}
    </div>
  );
}
