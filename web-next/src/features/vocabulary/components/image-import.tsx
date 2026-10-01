"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ClipboardPaste,
  ImageUp,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ScanText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tag, checkboxClass } from "@/components/ui/badges";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { cn } from "@/lib/utils";
import { VOCAB } from "@/lib/limits";
import { applyToneInput, splitTone } from "@/lib/pinyin";
import { parseOcrLines } from "@/lib/ocr-parse";
import { useT } from "@/i18n/client";
import { vocabInputSchema } from "../schema";
import { createManyAction, suggestWordsAction } from "../actions";
import { recognizeImage } from "../ocr";
import { RadicalPicker } from "./radical-picker";
import { TagPicker } from "./tag-picker";

export type ImageSource = "camera" | "upload" | "paste";

type Row = {
  key: string;
  checked: boolean;
  hanzi: string;
  pinyin: string;
  meaningVi: string;
  note: string;
  radicals: number[];
  tags: string[];
  exists: boolean;
  hskLevel: number | null;
  error?: string;
};

/** Ảnh gốc tối đa 10MB (nhận dạng ngay trên máy, không tải ảnh lên server). */
const MAX_IMAGE = 10 * 1024 * 1024;
let seq = 0;
const plainOf = (py: string) =>
  py
    .split(/[\s']+/)
    .filter(Boolean)
    .map((x) => splitTone(x).plain)
    .join("");
const sameSyllables = (a: string, b: string) => plainOf(a) === plainOf(b);
const newKey = () => `r${++seq}`;

/**
 * Thêm từ vựng từ ảnh: chụp / tải / dán ảnh → nhận dạng chữ trên máy → bảng kết quả (tích chọn) + khung sửa từng từ
 * → "Thêm vào danh sách (N)". Ảnh không được lưu hay gửi đi; server chỉ nhận danh sách Hán tự để gợi ý pinyin / nghĩa.
 */
export function ImageImport({ source, allTags }: { source: ImageSource; allTags: string[] }) {
  const t = useT();
  const router = useRouter();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [phase, setPhase] = React.useState<"idle" | "load" | "recognize" | "suggest" | "done" | "error">("idle");
  const [progress, setProgress] = React.useState(0);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [active, setActive] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const busy = phase === "load" || phase === "recognize" || phase === "suggest";

  React.useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const run = React.useCallback(
    async (img: Blob) => {
      if (busy) return;
      if (!img.type.startsWith("image/")) return void toast.error(t("vocab.img.notImage"));
      if (img.size > MAX_IMAGE) return void toast.error(t("vocab.img.tooLarge"));
      setPreview(URL.createObjectURL(img));
      setRows([]);
      setActive(null);
      setProgress(0);
      setPhase("load");
      try {
        const lines = await recognizeImage(img, (p) => {
          setPhase(p.stage);
          setProgress(p.value);
        });
        const words = parseOcrLines(lines, VOCAB.MAX_BULK);
        if (!words.length) {
          setPhase("done");
          return;
        }
        setPhase("suggest");
        const r = await suggestWordsAction(words.map((w) => w.hanzi.slice(0, VOCAB.MAX_HANZI)));
        const sug = r.ok ? r.data : [];
        const next = words.map((w): Row => {
          const s = sug.find((x) => x.hanzi === w.hanzi);
          return {
            key: newKey(),
            checked: !s?.exists,
            hanzi: w.hanzi,
            // OCR hay đọc sai dấu thanh: cùng âm tiết với gợi ý (từ điển / pinyin-pro) → dùng gợi ý.
            pinyin: w.pinyin && s?.pinyin && sameSyllables(w.pinyin, s.pinyin) ? s.pinyin : w.pinyin || s?.pinyin || "",
            meaningVi: (w.meaning || s?.meaningVi || "").slice(0, VOCAB.MAX_MEANING),
            note: "",
            radicals: s?.radicals ?? [],
            tags: [],
            exists: !!s?.exists,
            hskLevel: s?.hskLevel ?? null,
          };
        });
        setRows(next);
        setActive(next[0]?.key ?? null);
        setPhase("done");
      } catch {
        setPhase("error");
      }
    },
    [busy, t],
  );

  const patch = (key: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p, error: undefined } : r)));
  const checked = rows.filter((r) => r.checked);
  const allChecked = rows.length > 0 && checked.length === rows.length;
  const cur = rows.find((r) => r.key === active) ?? null;

  function addRow() {
    const r: Row = {
      key: newKey(),
      checked: true,
      hanzi: "",
      pinyin: "",
      meaningVi: "",
      note: "",
      radicals: [],
      tags: [],
      exists: false,
      hskLevel: null,
    };
    setRows((rs) => [...rs, r]);
    setActive(r.key);
  }

  async function save() {
    if (!checked.length) return;
    const items = [];
    let firstBad: string | null = null;
    const errs = new Map<string, string>();
    for (const r of checked) {
      const p = vocabInputSchema.safeParse(r);
      if (!p.success) {
        errs.set(r.key, p.error.issues[0]?.message ?? "");
        firstBad ??= r.key;
      } else items.push(p.data);
    }
    if (firstBad) {
      setRows((rs) => rs.map((r) => (errs.has(r.key) ? { ...r, error: errs.get(r.key) } : r)));
      setActive(firstBad);
      return void toast.error(t("vocab.img.fixRows", { count: errs.size }));
    }
    setSaving(true);
    const res = await createManyAction(items);
    setSaving(false);
    if (!res.ok) return void toast.error(res.message);
    toast.success(
      res.data.skipped.length
        ? t("vocab.img.addedSkipped", { count: res.data.added.length, skipped: res.data.skipped.length })
        : t("vocab.img.added", { count: res.data.added.length }),
    );
    router.push("/vocabulary");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section
          aria-label={t("vocab.img.sourceLabel")}
          className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5"
        >
          {source === "camera" ? (
            <CameraSource onImage={run} disabled={busy} />
          ) : source === "paste" ? (
            <PasteSource onImage={run} disabled={busy} />
          ) : (
            <UploadSource onImage={run} disabled={busy} />
          )}
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- ảnh cục bộ (blob:) của người dùng, không qua tối ưu ảnh
            <img
              src={preview}
              alt={t("vocab.img.previewAlt")}
              className="max-h-[320px] w-full rounded-xl border border-border bg-bg object-contain"
            />
          ) : null}
          <p className="text-[13.5px] text-text-2">{t("vocab.img.privacy")}</p>
        </section>

        <section
          aria-labelledby="ocr-result-title"
          className="flex min-w-0 flex-col gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="ocr-result-title" className="flex items-center gap-2 text-lg font-bold text-navy">
              <ScanText className="size-5 text-blue-600" aria-hidden="true" />
              {t("vocab.img.resultTitle")}
            </h2>
            {rows.length ? (
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[13.5px] font-semibold text-blue-700">
                {t("vocab.img.found", { count: rows.length })}
              </span>
            ) : null}
            {rows.length ? (
              <Button variant="ghost" size="sm" className="ml-auto" onClick={addRow}>
                <Plus />
                {t("vocab.img.addRow")}
              </Button>
            ) : null}
          </div>

          <div aria-live="polite">
            {busy ? (
              <div className="flex flex-col gap-2 rounded-xl bg-bg p-4">
                <span className="flex items-center gap-2 font-semibold text-text">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {phase === "load"
                    ? t("vocab.img.loading")
                    : phase === "recognize"
                      ? t("vocab.img.recognizing", { percent: Math.round(progress * 100) })
                      : t("vocab.img.suggesting")}
                </span>
                <div className="h-2 overflow-hidden rounded-full bg-[#DCE8F6]">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-[width]"
                    style={{ width: `${phase === "suggest" ? 100 : Math.round(progress * 100)}%` }}
                  />
                </div>
              </div>
            ) : phase === "error" ? (
              <p className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-red">
                <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
                {t("vocab.img.failed")}
              </p>
            ) : phase === "done" && !rows.length ? (
              <div className="flex flex-col items-start gap-3 rounded-xl bg-bg p-4 text-text-2">
                <p>{t("vocab.img.none")}</p>
                <Button variant="secondary" size="sm" onClick={addRow}>
                  <Plus />
                  {t("vocab.img.addRow")}
                </Button>
              </div>
            ) : phase === "idle" ? (
              <p className="rounded-xl bg-bg p-4 text-text-2">{t("vocab.img.empty")}</p>
            ) : null}
          </div>

          {rows.length ? (
            <div className="overflow-x-auto rounded-[14px] border border-border">
              <table className="w-full min-w-[520px] border-collapse text-[15px]">
                <caption className="sr-only">{t("vocab.img.resultTitle")}</caption>
                <thead>
                  <tr className="bg-[#F3F8FE] text-left text-[14px] text-text-2 [&>th]:px-2.5 [&>th]:py-3 [&>th]:font-semibold">
                    <th className="w-10 text-center">
                      <input
                        type="checkbox"
                        className={checkboxClass}
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = checked.length > 0 && !allChecked;
                        }}
                        onChange={(e) => setRows((rs) => rs.map((r) => ({ ...r, checked: e.target.checked })))}
                        aria-label={t("vocab.img.selectAll")}
                      />
                    </th>
                    <th>{t("vocab.colWord")}</th>
                    <th>{t("vocab.colPinyin")}</th>
                    <th>{t("vocab.colMeaning")}</th>
                    <th>{t("vocab.colStatus")}</th>
                    <th className="w-10">
                      <span className="sr-only">{t("vocab.colActions")}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.key}
                      onClick={() => setActive(r.key)}
                      className={cn(
                        "cursor-pointer border-t border-[#EDF3F9] [&>td]:px-2.5 [&>td]:py-2 [&>td]:align-middle",
                        r.key === active ? "bg-[#EEF6FF]" : "hover:bg-[#F9FCFF]",
                      )}
                    >
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className={checkboxClass}
                          checked={r.checked}
                          onChange={(e) => patch(r.key, { checked: e.target.checked })}
                          aria-label={t("vocab.selectWord", { word: r.hanzi || "…" })}
                        />
                      </td>
                      <td>
                        <span className="hanzi text-[22px] text-[#E0302F]" lang="zh">
                          {r.hanzi || "—"}
                        </span>
                      </td>
                      <td className="pinyin">{r.pinyin || "—"}</td>
                      <td className="max-w-[200px]">
                        {r.meaningVi || <span className="text-text-3">{t("vocab.img.noMeaning")}</span>}
                      </td>
                      <td>
                        {r.error ? (
                          <span className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-red">
                            <AlertCircle className="size-4" aria-hidden="true" />
                            {t("vocab.img.stError")}
                          </span>
                        ) : r.exists ? (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[13px] font-semibold text-[#9A5B00]">
                            {t("vocab.img.stExists")}
                          </span>
                        ) : (
                          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[13px] font-semibold text-[#17783F]">
                            {t("vocab.img.stNew")}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActive(r.key);
                            document.getElementById("ocr-hanzi")?.focus();
                          }}
                          className="inline-flex size-9 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]"
                          aria-label={t("vocab.img.editRow", { word: r.hanzi || "…" })}
                        >
                          <Pencil />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      {cur ? (
        <EditPanel
          key={cur.key}
          row={cur}
          allTags={allTags}
          onChange={(p) => patch(cur.key, p)}
          onRemove={() => {
            const i = rows.findIndex((r) => r.key === cur.key);
            const rest = rows.filter((r) => r.key !== cur.key);
            setRows(rest);
            setActive(rest[Math.min(i, rest.length - 1)]?.key ?? null);
          }}
        />
      ) : null}

      {rows.length ? (
        <div className="sticky bottom-[calc(var(--bottom-nav-h,0px)+12px)] z-10 flex flex-col gap-2 rounded-2xl border border-border bg-white/95 p-3 shadow-card backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[14.5px] text-text-2">
            {t("vocab.img.summary", { count: checked.length, total: rows.length })}
          </span>
          <Button variant="solid" disabled={!checked.length || saving} onClick={save}>
            {saving ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
            {t("vocab.img.addAll", { count: checked.length })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function EditPanel({
  row,
  allTags,
  onChange,
  onRemove,
}: {
  row: Row;
  allTags: string[];
  onChange: (p: Partial<Row>) => void;
  onRemove: () => void;
}) {
  const t = useT();
  const composing = (e: React.ChangeEvent) => e.nativeEvent instanceof InputEvent && e.nativeEvent.isComposing;
  return (
    <section
      aria-labelledby="ocr-edit-title"
      className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="ocr-edit-title" className="text-lg font-bold text-navy">
          {t("vocab.img.editTitle")}
          {row.hanzi ? (
            <span className="ml-2 hanzi text-[#E0302F]" lang="zh">
              {row.hanzi}
            </span>
          ) : null}
        </h2>
        {row.hskLevel ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[13px] font-semibold text-blue-700">
            HSK {row.hskLevel === 7 ? "7–9" : row.hskLevel}
          </span>
        ) : null}
        <Button variant="ghost" size="sm" className="ml-auto text-red" onClick={onRemove}>
          <Trash2 />
          {t("vocab.img.removeRow")}
        </Button>
      </div>
      {row.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[14.5px] text-red">
          {t.maybe(row.error)}
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ocr-hanzi">{t("vocab.form.hanzi")}</Label>
          <Input
            id="ocr-hanzi"
            lang="zh"
            value={row.hanzi}
            maxLength={VOCAB.MAX_HANZI}
            onChange={(e) => onChange({ hanzi: e.target.value, exists: false })}
            className="font-cn text-lg"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ocr-pinyin">{t("vocab.form.pinyin")}</Label>
          <div className="flex items-center gap-1">
            <Input
              id="ocr-pinyin"
              value={row.pinyin}
              maxLength={VOCAB.MAX_PINYIN}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              onChange={(e) => onChange({ pinyin: applyToneInput(e.currentTarget, composing(e)) })}
            />
            {row.hanzi ? <SpeakButton text={row.hanzi} label={t("vocab.listen", { word: row.hanzi })} /> : null}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ocr-meaning">{t("vocab.form.meaning")}</Label>
          <Input
            id="ocr-meaning"
            value={row.meaningVi}
            maxLength={VOCAB.MAX_MEANING}
            autoComplete="off"
            placeholder={t("vocab.form.meaningPlaceholder")}
            onChange={(e) => onChange({ meaningVi: e.target.value })}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ocr-radical">
            {t("vocab.form.radicals")} <span className="font-medium text-text-2">{t("vocab.form.optional")}</span>
          </Label>
          <RadicalPicker
            id="ocr-radical"
            value={row.radicals}
            onChange={(v) => onChange({ radicals: v })}
            hanzi={row.hanzi}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ocr-note">{t("vocab.form.note")}</Label>
          <Textarea
            id="ocr-note"
            value={row.note}
            maxLength={VOCAB.MAX_NOTE}
            rows={3}
            onChange={(e) => onChange({ note: applyToneInput(e.currentTarget, composing(e), true) })}
            placeholder={t("vocab.form.notePlaceholder")}
          />
          <span className="self-end text-[13px] text-text-3 tabular-nums">
            {Array.from(row.note).length}/{VOCAB.MAX_NOTE}
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span id="ocr-tag-label" className="font-semibold text-text">
          {t("vocab.form.tag")}
        </span>
        <TagPicker value={row.tags} onChange={(v) => onChange({ tags: v })} allTags={allTags} labelId="ocr-tag-label" />
        {row.tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {row.tags.map((g) => (
              <Tag key={g} name={g} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Drop({
  icon,
  title,
  hint,
  children,
  onFile,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  children?: React.ReactNode;
  onFile?: (f: Blob) => void;
  disabled?: boolean;
}) {
  const [over, setOver] = React.useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (!onFile) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (!onFile) return;
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files[0];
        if (f && !disabled) onFile(f);
      }}
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors",
        over ? "border-blue-600 bg-blue-50" : "border-[#BCD6F5] bg-[#F7FBFF]",
      )}
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm [&_svg]:size-7">
        {icon}
      </span>
      <div>
        <p className="font-bold text-text">{title}</p>
        <p className="mt-0.5 text-[14px] text-text-2">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function FileButton({
  onFile,
  disabled,
  capture,
  children,
}: {
  onFile: (f: Blob) => void;
  disabled?: boolean;
  capture?: boolean;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        {...(capture ? { capture: "environment" as const } : {})}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        data-testid={capture ? "ocr-capture-input" : "ocr-file-input"}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) onFile(f);
        }}
      />
      <Button variant="solid" disabled={disabled} onClick={() => ref.current?.click()}>
        {children}
      </Button>
    </>
  );
}

function UploadSource({ onImage, disabled }: { onImage: (b: Blob) => void; disabled: boolean }) {
  const t = useT();
  return (
    <Drop
      icon={<ImageUp />}
      title={t("vocab.img.uploadTitle")}
      hint={t("vocab.img.uploadHint")}
      onFile={onImage}
      disabled={disabled}
    >
      <FileButton onFile={onImage} disabled={disabled}>
        <ImageUp />
        {t("vocab.img.chooseFile")}
      </FileButton>
    </Drop>
  );
}

function PasteSource({ onImage, disabled }: { onImage: (b: Blob) => void; disabled: boolean }) {
  const t = useT();
  // Dán ở bất kỳ đâu trên trang khi đang ở thẻ này.
  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      if (f && !disabled) {
        e.preventDefault();
        onImage(f);
      }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [onImage, disabled]);
  const canRead = typeof navigator !== "undefined" && !!navigator.clipboard && "read" in navigator.clipboard;
  return (
    <Drop
      icon={<ClipboardPaste />}
      title={t("vocab.img.pasteTitle")}
      hint={t("vocab.img.pasteHint")}
      onFile={onImage}
      disabled={disabled}
    >
      {canRead ? (
        <Button
          variant="solid"
          disabled={disabled}
          onClick={async () => {
            try {
              for (const item of await navigator.clipboard.read()) {
                const type = item.types.find((x) => x.startsWith("image/"));
                if (type) return onImage(await item.getType(type));
              }
              toast.error(t("vocab.img.pasteNone"));
            } catch {
              toast.error(t("vocab.img.pasteDenied"));
            }
          }}
        >
          <ClipboardPaste />
          {t("vocab.img.pasteButton")}
        </Button>
      ) : null}
    </Drop>
  );
}

function CameraSource({ onImage, disabled }: { onImage: (b: Blob) => void; disabled: boolean }) {
  const t = useT();
  const video = React.useRef<HTMLVideoElement>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [denied, setDenied] = React.useState(false);
  const canLive = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  React.useEffect(() => () => stream?.getTracks().forEach((x) => x.stop()), [stream]);
  React.useEffect(() => {
    if (video.current && stream) video.current.srcObject = stream;
  }, [stream]);

  async function start() {
    try {
      setStream(
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 } } }),
      );
    } catch {
      setDenied(true);
    }
  }
  function shoot() {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    c.toBlob((b) => b && onImage(b), "image/png");
    stream?.getTracks().forEach((x) => x.stop());
    setStream(null);
  }

  if (stream)
    return (
      <div className="flex flex-col gap-3">
        <video ref={video} autoPlay playsInline muted className="w-full rounded-xl bg-black" />
        <div className="flex flex-wrap gap-2">
          <Button variant="solid" onClick={shoot} disabled={disabled}>
            <Camera />
            {t("vocab.img.shoot")}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              stream.getTracks().forEach((x) => x.stop());
              setStream(null);
            }}
          >
            <RotateCcw />
            {t("common.cancel")}
          </Button>
        </div>
      </div>
    );
  return (
    <Drop
      icon={<Camera />}
      title={t("vocab.img.cameraTitle")}
      hint={denied ? t("vocab.img.cameraDenied") : t("vocab.img.cameraHint")}
    >
      <div className="flex flex-wrap justify-center gap-2">
        {canLive && !denied ? (
          <Button variant="solid" disabled={disabled} onClick={start}>
            <Camera />
            {t("vocab.img.openCamera")}
          </Button>
        ) : null}
        <FileButton onFile={onImage} disabled={disabled} capture>
          <Camera />
          {t("vocab.img.phoneCamera")}
        </FileButton>
      </div>
    </Drop>
  );
}
