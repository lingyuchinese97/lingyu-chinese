"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Eye,
  ImageUp,
  Lightbulb,
  Loader2,
  Plus,
  Puzzle,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { compressImage } from "@/lib/image-compress";
import { applyToneInput } from "@/lib/pinyin";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/client";
import { T_TOPICS } from "@/data/translation/items";
import { LIB_LEVELS, LIB_LIMITS, LIB_POS, type LibWordInput } from "../schema";
import type { Candidate } from "../analyze";
import { analyzeAction, saveWordAction, setWordImageAction } from "../actions";

const EMPTY: LibWordInput = {
  hanzi: "",
  pinyin: "",
  pos: "",
  meaningVi: "",
  note: "",
  hskLevel: null,
  topic: "",
  components: [],
  mnemonic: "",
  association: "",
  related: [],
  examples: [],
  grammar: [],
};

type Initial = LibWordInput & {
  id: string;
  status: "draft" | "public";
  hasImage: boolean;
  imageVersion: string | null;
};

const card = "rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5";
const composing = (e: React.ChangeEvent) => e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing;

/** Màn admin "Thêm / sửa từ vựng" của Thư viện LingYu: nhập → phân tích → chỉnh → xem trước → lưu nháp / public. */
export function WordEditor({ initial }: { initial: Initial | null }) {
  const t = useT();
  const router = useRouter();
  const [w, setW] = React.useState<LibWordInput>(() => (initial ? { ...EMPTY, ...initial } : EMPTY));
  const [input, setInput] = React.useState(initial?.hanzi ?? "");
  const [candidates, setCandidates] = React.useState<Candidate[] | null>(null);
  const [busy, setBusy] = React.useState<"analyze" | "draft" | "public" | "image" | null>(null);
  const [error, setError] = React.useState("");
  const [image, setImage] = React.useState({ has: !!initial?.hasImage, v: initial?.imageVersion ?? "" });
  const set = <K extends keyof LibWordInput>(k: K, v: LibWordInput[K]) => setW((s) => ({ ...s, [k]: v }));

  async function analyze(value = input) {
    const v = value.trim();
    if (!v) return;
    setBusy("analyze");
    setError("");
    const r = await analyzeAction(v);
    setBusy(null);
    if (!r.ok) return void setError(t.maybe(r.message));
    if (r.data.analysis) {
      // Giữ phần admin đã tự nhập nếu ô gợi ý trống.
      const a = r.data.analysis;
      setW((cur) => {
        const keep = cur.hanzi === a.hanzi;
        const pick = <K extends keyof LibWordInput>(k: K) => {
          const av = a[k];
          const empty = av === "" || av === null || (Array.isArray(av) && !av.length);
          return keep && empty ? cur[k] : av;
        };
        return {
          ...cur,
          ...Object.fromEntries((Object.keys(a) as (keyof LibWordInput)[]).map((k) => [k, pick(k)])),
          pos: keep ? cur.pos : "",
          topic: keep ? cur.topic : "",
        } as LibWordInput;
      });
      setCandidates(null);
      setInput(a.hanzi);
      toast.success(t("library.analyzed", { word: a.hanzi }));
    } else setCandidates(r.data.candidates);
  }

  async function save(publish: boolean) {
    setBusy(publish ? "public" : "draft");
    setError("");
    const r = await saveWordAction(initial?.id ?? null, w, publish);
    setBusy(null);
    if (!r.ok) return void setError(t.maybe(r.message));
    toast.success(publish ? t("library.savedPublic") : t("library.savedDraft"));
    if (!initial) router.replace(`/admin/library/${r.data.id}`);
    else router.refresh();
  }

  async function uploadImage(file: File | null) {
    if (!initial) return;
    const f = new FormData();
    if (file) {
      try {
        const c = await compressImage(file);
        f.set("image", c.blob, "image.webp");
      } catch (e) {
        return void toast.error(e instanceof Error ? e.message : String(e));
      }
    } else f.set("remove", "1");
    setBusy("image");
    const r = await setWordImageAction(initial.id, f);
    setBusy(null);
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setImage({ has: r.data.hasImage, v: String(Date.now()) });
    toast.success(r.data.hasImage ? t("library.imageSaved") : t("library.imageRemoved"));
  }

  const imgSrc = initial && image.has ? `/api/v1/library/words/${initial.id}/image?v=${image.v}` : null;
  const ready = !!w.hanzi.trim();

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-start">
        <Link
          href="/admin/library"
          aria-label={t("library.back")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-navy hover:bg-blue-50"
        >
          <ArrowLeft className="size-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-extrabold tracking-tight text-navy-900 md:text-[30px]">
            {initial ? t("library.editTitle") : t("library.newTitle")}
            {initial ? (
              <span
                className={cn(
                  "ml-3 inline-block rounded-full px-2.5 py-0.5 align-middle text-[13px] font-semibold",
                  initial.status === "public" ? "bg-green-50 text-green-700" : "bg-[#FFF3D6] text-[#8A5A00]",
                )}
              >
                {initial.status === "public" ? t("library.public") : t("library.draft")}
              </span>
            ) : null}
          </h1>
          <p className="mt-1 text-[14.5px] text-text-2">{t("library.editorSub")}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" disabled={!ready || !!busy} onClick={() => save(false)}>
            {busy === "draft" ? <Loader2 className="animate-spin" /> : <Save />}
            {t("library.saveDraft")}
          </Button>
          <Button variant="solid" disabled={!ready || !!busy} onClick={() => save(true)}>
            {busy === "public" ? <Loader2 className="animate-spin" /> : <Send />}
            {t("library.savePublic")}
          </Button>
        </div>
      </header>
      {error ? (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-2.5 text-red">
          {error}
        </p>
      ) : null}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <section aria-labelledby="we-s1" className={card}>
            <h2 id="we-s1" className="mb-3 text-[18px] font-bold text-navy-900">
              {t("library.step1")}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void analyze();
              }}
              className="flex flex-col gap-1.5"
            >
              <Label htmlFor="we-input">{t("library.inputLabel")}</Label>
              <div className="flex gap-2">
                <Input
                  id="we-input"
                  value={input}
                  maxLength={40}
                  onChange={(e) => setInput(e.target.value)}
                  className="font-cn text-lg"
                  autoComplete="off"
                />
                <Button type="submit" variant="solid" disabled={!input.trim() || busy === "analyze"}>
                  {busy === "analyze" ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {busy === "analyze" ? t("library.analyzing") : t("library.analyze")}
                </Button>
              </div>
              <div className="flex items-center justify-between text-[13.5px] text-text-2">
                <span>{t("library.inputHint")}</span>
                <button
                  type="button"
                  className="font-semibold text-blue-600 hover:underline"
                  onClick={() => {
                    setInput("");
                    setCandidates(null);
                    if (!initial) setW(EMPTY);
                  }}
                >
                  {t("library.clear")}
                </button>
              </div>
            </form>
            {candidates ? (
              <div className="mt-3" aria-live="polite">
                {candidates.length ? (
                  <>
                    <p className="mb-2 text-[14px] font-semibold text-text">{t("library.candidates")}</p>
                    <div className="flex flex-wrap gap-2">
                      {candidates.map((c) => (
                        <button
                          key={c.hanzi}
                          type="button"
                          onClick={() => {
                            setInput(c.hanzi);
                            void analyze(c.hanzi);
                          }}
                          className="flex items-baseline gap-2 rounded-[12px] border border-border bg-white px-3 py-1.5 hover:border-blue-600"
                        >
                          <span className="hanzi text-[18px] font-bold text-[#E0302F]" lang="zh">
                            {c.hanzi}
                          </span>
                          <span className="text-[13.5px] text-text-2">{c.pinyin}</span>
                          <span className="text-[13.5px] text-text">{c.meaning}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-[14px] text-text-2">{t("library.noCandidates")}</p>
                )}
              </div>
            ) : null}
          </section>

          <section aria-labelledby="we-s2" className={cn(card, "flex flex-col gap-4")}>
            <h2 id="we-s2" className="text-[18px] font-bold text-navy-900">
              {t("library.step2")} <span className="text-[14px] font-normal text-text-2">{t("library.editable")}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field id="we-hanzi" label={t("library.hanzi")}>
                <Input
                  id="we-hanzi"
                  lang="zh"
                  value={w.hanzi}
                  maxLength={LIB_LIMITS.hanzi}
                  onChange={(e) => set("hanzi", e.target.value)}
                  className="font-cn text-lg"
                />
              </Field>
              <Field id="we-pinyin" label={t("library.pinyin")}>
                <Input
                  id="we-pinyin"
                  value={w.pinyin}
                  maxLength={LIB_LIMITS.pinyin}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => set("pinyin", applyToneInput(e.currentTarget, composing(e)))}
                />
              </Field>
              <Field id="we-pos" label={t("library.posLabel")}>
                <Select id="we-pos" value={w.pos} onChange={(e) => set("pos", e.target.value as LibWordInput["pos"])}>
                  <option value="">{t("library.posNone")}</option>
                  {LIB_POS.map((p) => (
                    <option key={p} value={p}>
                      {t(`library.pos.${p}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field id="we-hsk" label={t("library.hsk")}>
                <Select
                  id="we-hsk"
                  value={w.hskLevel ?? ""}
                  onChange={(e) => set("hskLevel", e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">{t("library.hskNone")}</option>
                  {LIB_LEVELS.map((l) => (
                    <option key={l} value={l}>
                      HSK {l}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="we-topic" label={t("library.topic")}>
                <Select
                  id="we-topic"
                  value={w.topic}
                  onChange={(e) => set("topic", e.target.value as LibWordInput["topic"])}
                >
                  <option value="">{t("library.topicNone")}</option>
                  {T_TOPICS.map((x) => (
                    <option key={x} value={x}>
                      {t(`translate.topics.${x}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field id="we-meaning" label={t("library.meaning")}>
              <Input
                id="we-meaning"
                value={w.meaningVi}
                maxLength={LIB_LIMITS.meaning}
                onChange={(e) => set("meaningVi", e.target.value)}
              />
            </Field>
            <Field id="we-note" label={t("library.note")}>
              <Input
                id="we-note"
                value={w.note}
                maxLength={LIB_LIMITS.note}
                onChange={(e) => set("note", e.target.value)}
              />
            </Field>

            <Rows
              title={t("library.components")}
              icon={<Puzzle />}
              addLabel={t("library.addComponent")}
              removeLabel={t("library.remove")}
              max={LIB_LIMITS.components}
              rows={w.components}
              blank={{ char: "", pinyin: "", meaning: "" }}
              cols={[
                { key: "char", label: t("library.compChar"), zh: true, width: "w-24" },
                { key: "pinyin", label: t("library.compPinyin"), width: "w-28" },
                { key: "meaning", label: t("library.compMeaning") },
              ]}
              onChange={(v) => set("components", v)}
            />

            <Field id="we-mnemonic" label={t("library.mnemonic")}>
              <Textarea
                id="we-mnemonic"
                rows={2}
                value={w.mnemonic}
                maxLength={LIB_LIMITS.text}
                placeholder={t("library.mnemonicPlaceholder")}
                onChange={(e) => set("mnemonic", e.target.value)}
              />
            </Field>
            <Field id="we-assoc" label={t("library.association")}>
              <Textarea
                id="we-assoc"
                rows={2}
                value={w.association}
                maxLength={LIB_LIMITS.text}
                placeholder={t("library.associationPlaceholder")}
                onChange={(e) => set("association", e.target.value)}
              />
            </Field>

            <Rows
              title={t("library.related")}
              icon={<BookOpen />}
              addLabel={t("library.addRelated")}
              removeLabel={t("library.remove")}
              max={LIB_LIMITS.related}
              rows={w.related}
              blank={{ zh: "", py: "", vi: "" }}
              cols={[
                { key: "zh", label: t("library.relatedZh"), zh: true, width: "w-28" },
                { key: "py", label: t("library.relatedPy"), width: "w-32" },
                { key: "vi", label: t("library.relatedVi") },
              ]}
              onChange={(v) => set("related", v)}
            />

            <div className="flex flex-col gap-2">
              <span className="font-semibold text-text">{t("library.image")}</span>
              <p className="text-[13.5px] text-text-2">
                {initial ? t("library.imageHint") : t("library.imageAfterSave")}
              </p>
              {initial ? (
                <div className="flex flex-wrap items-center gap-3">
                  {imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- ảnh từ API riêng (cần phiên đăng nhập), không qua tối ưu ảnh
                    <img
                      src={imgSrc}
                      alt={t("library.image")}
                      className="h-24 w-auto rounded-xl border border-border"
                    />
                  ) : null}
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      data-testid="lib-image-input"
                      onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        e.target.value = "";
                        if (f) void uploadImage(f);
                      }}
                    />
                    <span className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-[12px] border border-border px-3.5 font-semibold text-blue-700 hover:bg-blue-50">
                      {busy === "image" ? <Loader2 className="size-5 animate-spin" /> : <ImageUp className="size-5" />}
                      {image.has ? t("library.changeImage") : t("library.chooseImage")}
                    </span>
                  </label>
                  {image.has ? (
                    <Button variant="ghost" size="sm" className="text-red" onClick={() => uploadImage(null)}>
                      <X />
                      {t("library.removeImage")}
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Preview w={w} imgSrc={imgSrc} />
          <section aria-labelledby="we-ex" className={card}>
            <Rows
              title={t("library.examples")}
              titleId="we-ex"
              icon={<BookOpen />}
              addLabel={t("library.addExample")}
              removeLabel={t("library.remove")}
              max={LIB_LIMITS.examples}
              rows={w.examples}
              blank={{ zh: "", py: "", vi: "" }}
              stacked
              cols={[
                { key: "zh", label: t("library.exZh"), zh: true },
                { key: "py", label: t("library.exPy") },
                { key: "vi", label: t("library.exVi") },
              ]}
              onChange={(v) => set("examples", v)}
            />
          </section>
          <section aria-labelledby="we-gr" className={card}>
            <Rows
              title={t("library.grammar")}
              titleId="we-gr"
              icon={<BookOpen />}
              addLabel={t("library.addGrammar")}
              removeLabel={t("library.remove")}
              max={LIB_LIMITS.grammar}
              rows={w.grammar}
              blank={{ structure: "", explain: "", example: "" }}
              stacked
              cols={[
                { key: "structure", label: t("library.gStructure"), zh: true },
                { key: "explain", label: t("library.gExplain") },
                { key: "example", label: t("library.gExample"), zh: true },
              ]}
              onChange={(v) => set("grammar", v)}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

type Col<T> = { key: keyof T & string; label: string; zh?: boolean; width?: string };

/** Danh sách dòng chỉnh sửa được (thêm / sửa / xoá) — dùng cho bộ thủ, từ liên quan, ví dụ, ngữ pháp. */
function Rows<T extends Record<string, string>>({
  title,
  titleId,
  icon,
  addLabel,
  removeLabel,
  rows,
  blank,
  cols,
  max,
  stacked,
  onChange,
}: {
  title: string;
  titleId?: string;
  icon: React.ReactNode;
  addLabel: string;
  removeLabel: string;
  rows: T[];
  blank: T;
  cols: Col<T>[];
  max: number;
  stacked?: boolean;
  onChange: (v: T[]) => void;
}) {
  const base = React.useId();
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <h3
          id={titleId}
          className="flex items-center gap-2 font-bold text-navy-900 [&_svg]:size-5 [&_svg]:text-blue-600"
        >
          {icon}
          {title}
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto"
          disabled={rows.length >= max}
          onClick={() => onChange([...rows, { ...blank }])}
        >
          <Plus />
          {addLabel}
        </Button>
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2 rounded-[14px] bg-[#F7FAFE] p-2",
            stacked ? "flex-col sm:flex-row sm:items-start" : "flex-wrap items-center sm:flex-nowrap",
          )}
        >
          <span className="flex size-7 shrink-0 items-center justify-center self-center rounded-full bg-white text-[13px] font-bold text-text-2">
            {i + 1}
          </span>
          {cols.map((c) => (
            <label key={c.key} className={cn("min-w-0", stacked ? "flex-1" : (c.width ?? "flex-1"))}>
              <span className="sr-only">
                {title} {i + 1}: {c.label}
              </span>
              <Input
                id={`${base}-${i}-${c.key}`}
                lang={c.zh ? "zh" : undefined}
                value={r[c.key]}
                placeholder={c.label}
                maxLength={300}
                onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)))}
                className={cn("h-10", c.zh && "font-cn")}
              />
            </label>
          ))}
          <button
            type="button"
            aria-label={`${removeLabel} ${i + 1}`}
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="flex size-9 shrink-0 items-center justify-center self-center rounded-full text-red hover:bg-red-50"
          >
            <Trash2 className="size-[18px]" />
          </button>
        </div>
      ))}
    </div>
  );
}

function Preview({ w, imgSrc }: { w: LibWordInput; imgSrc: string | null }) {
  const t = useT();
  return (
    <section aria-labelledby="we-s3" className={card}>
      <h2 id="we-s3" className="mb-3 flex items-center gap-2 text-[18px] font-bold text-navy-900">
        <Eye className="size-5 text-blue-600" aria-hidden="true" />
        {t("library.step3")}
      </h2>
      {!w.hanzi ? (
        <p className="rounded-xl bg-bg p-4 text-text-2">{t("library.previewEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <span
              lang="zh"
              className="flex min-h-[112px] min-w-[112px] items-center justify-center rounded-[20px] bg-[#FFECEE] px-3 hanzi text-[56px] font-bold text-[#E0302F]"
            >
              {w.hanzi}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[26px] font-bold text-navy-900">{w.pinyin}</span>
                <SpeakButton text={w.hanzi} label={t("library.listen", { word: w.hanzi })} />
                {w.pos ? (
                  <span className="rounded-full bg-[#FFF1DC] px-3 py-1 text-[13.5px] font-semibold text-[#A85A00]">
                    {t(`library.pos.${w.pos}`)}
                  </span>
                ) : null}
                {w.hskLevel ? (
                  <span className="rounded-full bg-[#F0EAFF] px-3 py-1 text-[13.5px] font-semibold text-[#6B3FD0]">
                    HSK {w.hskLevel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-[24px] font-bold text-navy-900">{w.meaningVi}</p>
              {w.note ? (
                <p className="mt-2 rounded-xl bg-blue-50 px-3 py-2 text-[14px] text-text">
                  <span className="font-semibold text-blue-700">{t("library.noteLabel")}</span> {w.note}
                </p>
              ) : null}
            </div>
          </div>
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh từ API riêng (cần phiên đăng nhập)
            <img src={imgSrc} alt="" className="max-h-56 w-full rounded-2xl object-contain" />
          ) : null}
          {w.components.length ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-[#F7FAFE] p-3">
              {w.components.map((c, i) => (
                <React.Fragment key={i}>
                  {i ? <Plus className="size-4 text-text-3" aria-hidden="true" /> : null}
                  <span className="flex flex-col items-center rounded-xl bg-white px-3 py-2">
                    <span lang="zh" className="hanzi text-[24px]">
                      {c.char}
                    </span>
                    <span className="text-[12.5px] text-text-2">{c.pinyin}</span>
                    <span className="text-[12.5px] text-text-2">{c.meaning}</span>
                  </span>
                </React.Fragment>
              ))}
              <ArrowRight className="size-5 text-text-3" aria-hidden="true" />
              <span lang="zh" className="rounded-xl bg-[#FFF3D6] px-3 py-2 hanzi text-[28px] font-bold text-[#C2410C]">
                {w.hanzi}
              </span>
            </div>
          ) : null}
          {w.mnemonic ? (
            <p className="flex gap-2 rounded-2xl bg-[#FFF8E6] p-3 text-[15px] text-text">
              <Lightbulb className="size-5 shrink-0 text-amber" aria-hidden="true" />
              {w.mnemonic}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
