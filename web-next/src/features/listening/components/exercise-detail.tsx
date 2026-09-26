"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Download, ExternalLink, FileText, Loader2, Pencil, PenLine, Plus, Save, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tag } from "@/components/ui/badges";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog, DialogActions, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { TagPicker } from "@/features/vocabulary/components/tag-picker";
import { useIntlTag, useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { LISTENING } from "@/lib/limits";
import { formatTime } from "@/lib/media-url";
import { compareDictation, reformat, type FormattedSpan } from "@/lib/dictation-compare";
import { exerciseInputSchema } from "../schema";
import type { Exercise } from "../service";
import { deleteExerciseAction, updateExerciseAction } from "../actions";
import { DiffPinyin, DiffText, Legend, ScoreLine } from "./comparison-view";
import { ExerciseFields, draftErrors, type DraftErrors, type ExerciseDraft } from "./exercise-fields";

/** Bài chép kèm định dạng người dùng tự tô (bút đỏ / bôi vàng) — KHÔNG phải kết quả so sánh. */
function Formatted({ spans }: { spans: FormattedSpan[] }) {
  return (
    <p lang="zh" className="font-cn text-[19px] leading-[1.9] break-words whitespace-pre-wrap text-text">
      {spans.map((s, i) => (
        <span key={i} className={cn(s.color === "red" && "text-red", s.highlight && "bg-[#FFF1A8]")}>
          {s.text}
        </span>
      ))}
    </p>
  );
}

function toInput(e: Exercise, patch: Partial<ExerciseDraft> = {}) {
  const next = {
    title: e.title,
    tags: e.tags,
    referenceAnswer: e.referenceAnswer,
    referencePinyin: e.referencePinyin,
    userAnswer: e.userAnswer,
    notes: e.notes,
    ...patch,
  };
  return {
    ...next,
    contentUrl: e.contentUrl,
    segmentStart: e.segmentStart,
    segmentEnd: e.segmentEnd,
    playbackSpeed: e.playbackSpeed,
    formattedUserAnswer: reformat(e.formattedUserAnswer, next.userAnswer),
  };
}

/** Chi tiết một bài làm: nội dung đã nhập · đáp án · kết quả so sánh · ghi chú; sửa & lưu (chấm lại), thẻ, xoá, tải xuống. */
export function ExerciseDetail({ initial, allTags }: { initial: Exercise; allTags: string[] }) {
  const t = useT();
  const tag = useIntlTag();
  const router = useRouter();
  const [confirm, confirmNode] = useConfirm();
  const [ex, setEx] = React.useState(initial);
  const [tab, setTab] = React.useState<"content" | "notes">("content");
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<ExerciseDraft>(() => toInput(initial));
  const [errors, setErrors] = React.useState<DraftErrors>({});
  const [formError, setFormError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [notesEdit, setNotesEdit] = React.useState<string | null>(null);
  const [tagsOpen, setTagsOpen] = React.useState(false);
  const [tagsDraft, setTagsDraft] = React.useState<string[]>(initial.tags);
  const [shownId, setShownId] = React.useState(initial.id + initial.updatedAt.toString());
  const incoming = initial.id + initial.updatedAt.toString();
  if (shownId !== incoming) {
    setShownId(incoming);
    setEx(initial);
    setEditing(false);
    setNotesEdit(null);
  }
  // So sánh luôn tính lại từ đáp án + bài làm bằng cùng hàm với lúc luyện (không dùng kết quả cũ).
  const cmp = React.useMemo(
    () => compareDictation(ex.referenceAnswer, ex.userAnswer),
    [ex.referenceAnswer, ex.userAnswer],
  );

  async function save(patch: Partial<ExerciseDraft>, okMessage: string) {
    const input = toInput(ex, patch);
    const parsed = exerciseInputSchema.safeParse(input);
    if (!parsed.success) {
      setErrors(draftErrors(parsed.error.issues));
      return false;
    }
    setSaving(true);
    const r = await updateExerciseAction(ex.id, input);
    setSaving(false);
    if (!r.ok) {
      setFormError(r.message);
      if (r.fieldErrors) setErrors(r.fieldErrors as DraftErrors);
      toast.error(r.message);
      return false;
    }
    setEx(r.data);
    setShownId(r.data.id + r.data.updatedAt.toString());
    toast.success(okMessage);
    router.refresh();
    return true;
  }

  function startEdit() {
    setDraft(toInput(ex));
    setErrors({});
    setFormError("");
    setEditing(true);
    requestAnimationFrame(() => document.getElementById("lx-edit-title")?.focus());
  }

  async function doDelete() {
    const ok = await confirm({
      title: t("listening.detail.deleteTitle"),
      message: t("listening.detail.deleteMessage"),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteExerciseAction(ex.id);
    if (!r.ok) return void toast.error(r.message);
    toast.success(t("listening.detail.deleted"));
    const sp = new URLSearchParams(window.location.search);
    sp.delete("id");
    router.replace(`/listening/exercises${sp.size ? `?${sp}` : ""}`, { scroll: false });
    router.refresh();
  }

  function download() {
    const lines = [
      ex.title,
      ex.tags.length ? `#${ex.tags.join(" #")}` : "",
      "",
      `${t("listening.detail.reference")}:`,
      ex.referenceAnswer,
      ex.referencePinyin,
      "",
      `${t("listening.detail.yours")}:`,
      ex.userAnswer,
      "",
      `${t("listening.detail.fileScore")}: ${t("listening.result.score", { correct: cmp.correct, total: cmp.total, percent: cmp.percent })}`,
      "",
      `${t("listening.detail.notes")}:`,
      ex.notes,
      ex.contentUrl ? `\n${t("listening.detail.source")}: ${ex.contentUrl}` : "",
    ];
    const blob = new Blob([lines.join("\n").replace(/\n{3,}/g, "\n\n")], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${ex.title.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 80) || "lingyu"}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const card = "flex min-w-0 flex-col gap-2 rounded-[16px] border border-[#DDEBF8] bg-white p-4";
  const cardHead = "flex items-center gap-2 text-[15px] font-bold text-navy";
  const editBtn = (onClick: () => void) => (
    <Button type="button" size="sm" variant="secondary" className="ml-auto h-9 px-3" onClick={onClick}>
      <Pencil />
      {t("listening.detail.edit")}
    </Button>
  );

  if (editing)
    return (
      <form
        aria-label={t("listening.detail.editing")}
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          if (await save(draft, t("listening.detail.updated"))) setEditing(false);
        }}
        className="flex flex-col gap-4"
      >
        <h2 className="text-[20px] font-extrabold text-navy">{t("listening.detail.editing")}</h2>
        <p className="text-[13.5px] text-text-3">{t("listening.detail.recompareHint")}</p>
        {formError ? <Alert tone="error">{t.maybe(formError)}</Alert> : null}
        <ExerciseFields
          idPrefix="lx-edit"
          value={draft}
          onChange={(p) => setDraft((x) => ({ ...x, ...p }))}
          errors={errors}
          allTags={allTags}
          referenceEditable
        />
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {t("listening.detail.save")}
          </Button>
        </div>
      </form>
    );

  return (
    <article aria-labelledby="lx-detail-title" className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <h2 id="lx-detail-title" className="min-w-0 flex-1 text-[22px] font-extrabold break-words text-navy">
            {ex.title}
          </h2>
          <time dateTime={new Date(ex.createdAt).toISOString()} className="shrink-0 pt-1.5 text-[13.5px] text-text-3">
            {new Intl.DateTimeFormat(tag, { dateStyle: "short", timeStyle: "short" }).format(new Date(ex.createdAt))}
          </time>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {ex.tags.map((x) => (
            <Tag key={x} name={x} />
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-[13.5px]"
            onClick={() => {
              setTagsDraft(ex.tags);
              setTagsOpen(true);
            }}
          >
            <Plus className="!size-4" />
            {t("listening.detail.addTag")}
          </Button>
        </div>
        {ex.media ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13.5px] text-text-3">
            <span>{t("listening.detail.source")}</span>
            <a
              href={ex.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:underline"
            >
              <ExternalLink className="size-3.5" aria-hidden="true" />
              {t("listening.detail.openSource")}
            </a>
            {ex.segmentStart !== null && ex.segmentEnd !== null ? (
              <span>
                {t("listening.detail.segment", { start: formatTime(ex.segmentStart), end: formatTime(ex.segmentEnd) })}
              </span>
            ) : null}
          </p>
        ) : null}
      </header>

      <div role="tablist" aria-label={t("listening.detail.tabsLabel")} className="flex gap-1 border-b border-border">
        {(["content", "notes"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`lx-tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`lx-panel-${k}`}
            onClick={() => setTab(k)}
            className={cn(
              "-mb-px min-h-11 border-b-[3px] px-3 text-[15px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)]",
              tab === k ? "border-blue-600 text-blue-700" : "border-transparent text-text-2 hover:text-blue-600",
            )}
          >
            {k === "content" ? t("listening.detail.contentTab") : t("listening.detail.notesTab")}
          </button>
        ))}
      </div>

      {tab === "content" ? (
        <div role="tabpanel" id="lx-panel-content" aria-labelledby="lx-tab-content" className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <section className={card} aria-labelledby="lx-d-yours">
              <div className={cardHead}>
                <PenLine className="size-[18px] text-blue-600" aria-hidden="true" />
                <h3 id="lx-d-yours">{t("listening.detail.yours")}</h3>
                {editBtn(startEdit)}
              </div>
              {ex.userAnswer ? (
                <Formatted spans={ex.formattedUserAnswer.length ? ex.formattedUserAnswer : [{ text: ex.userAnswer }]} />
              ) : (
                <p className="text-text-3">{t("listening.result.empty")}</p>
              )}
            </section>
            <section className={card} aria-labelledby="lx-d-ref">
              <div className={cardHead}>
                <BookOpen className="size-[18px] text-blue-600" aria-hidden="true" />
                <h3 id="lx-d-ref">{t("listening.detail.reference")}</h3>
                {editBtn(startEdit)}
              </div>
              <p lang="zh" className="font-cn text-[19px] leading-[1.9] whitespace-pre-wrap text-text">
                {ex.referenceAnswer}
              </p>
              {ex.referencePinyin ? (
                <p className="text-[15px] whitespace-pre-wrap text-pinyin">{ex.referencePinyin}</p>
              ) : null}
            </section>
          </div>

          <section className={cn(card, "bg-[#F8FBFF]")} aria-labelledby="lx-d-cmp">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <h3 id="lx-d-cmp" className="text-[15px] font-bold text-navy">
                {t("listening.detail.comparison")}
              </h3>
              <ScoreLine c={cmp} className="text-[15px]" />
              <Legend className="md:ml-auto" />
            </div>
            <DiffText parts={cmp.parts} />
            <DiffPinyin parts={cmp.parts} />
          </section>

          <NotesCard
            notes={ex.notes}
            editing={notesEdit}
            onEdit={setNotesEdit}
            saving={saving}
            onSave={async (notes) => {
              if (await save({ notes }, t("listening.detail.notesSaved"))) setNotesEdit(null);
            }}
          />
        </div>
      ) : (
        <div role="tabpanel" id="lx-panel-notes" aria-labelledby="lx-tab-notes">
          <NotesCard
            notes={ex.notes}
            editing={notesEdit}
            onEdit={setNotesEdit}
            saving={saving}
            onSave={async (notes) => {
              if (await save({ notes }, t("listening.detail.notesSaved"))) setNotesEdit(null);
            }}
            tall
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        <Button type="button" variant="danger-outline" onClick={doDelete}>
          <Trash2 />
          {t("listening.detail.delete")}
        </Button>
        <Button type="button" variant="ghost" onClick={download}>
          <Download />
          {t("listening.detail.download")}
        </Button>
        <Button type="button" variant="solid" onClick={startEdit}>
          <FileText />
          {t("listening.detail.editSave")}
        </Button>
      </div>

      <Dialog open={tagsOpen} onOpenChange={setTagsOpen}>
        <DialogContent title={t("listening.detail.tagsTitle")}>
          <span id="lx-tags-label" className="sr-only">
            {t("listening.save.tags")}
          </span>
          <TagPicker
            value={tagsDraft}
            onChange={(v) => setTagsDraft(v.slice(0, LISTENING.MAX_TAGS))}
            allTags={allTags}
            labelId="lx-tags-label"
          />
          <DialogActions>
            <Button type="button" variant="secondary" onClick={() => setTagsOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={saving}
              onClick={async () => {
                if (await save({ tags: tagsDraft }, t("listening.detail.updated"))) setTagsOpen(false);
              }}
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {t("listening.detail.saveTags")}
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
      {confirmNode}
    </article>
  );
}

function NotesCard({
  notes,
  editing,
  onEdit,
  onSave,
  saving,
  tall,
}: {
  notes: string;
  editing: string | null;
  onEdit: (v: string | null) => void;
  onSave: (v: string) => void;
  saving: boolean;
  tall?: boolean;
}) {
  const t = useT();
  return (
    <section
      aria-labelledby="lx-d-notes"
      className="flex min-w-0 flex-col gap-2 rounded-[16px] border border-[#DDEBF8] bg-white p-4"
    >
      <div className="flex items-center gap-2 text-[15px] font-bold text-navy">
        <FileText className="size-[18px] text-blue-600" aria-hidden="true" />
        <h3 id="lx-d-notes">{t("listening.detail.notes")}</h3>
        {editing === null ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="ml-auto h-9 px-3"
            onClick={() => onEdit(notes)}
          >
            <Pencil />
            {t("listening.detail.edit")}
          </Button>
        ) : null}
      </div>
      {editing !== null ? (
        <>
          <label htmlFor="lx-d-notes-input" className="sr-only">
            {t("listening.notes.label")}
          </label>
          <Textarea
            id="lx-d-notes-input"
            autoFocus
            value={editing}
            maxLength={LISTENING.MAX_TEXT}
            onChange={(e) => onEdit(e.target.value)}
            placeholder={t("listening.notes.placeholder")}
            className={tall ? "min-h-[220px]" : undefined}
          />
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] text-text-3 tabular-nums">
              {editing.length} / {LISTENING.MAX_TEXT}
            </span>
            <Button type="button" size="sm" variant="secondary" className="ml-auto" onClick={() => onEdit(null)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" size="sm" variant="solid" disabled={saving} onClick={() => onSave(editing)}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {t("common.save")}
            </Button>
          </div>
        </>
      ) : notes ? (
        <p className={cn("text-[15.5px] leading-relaxed whitespace-pre-wrap text-text", tall && "min-h-[120px]")}>
          {notes}
        </p>
      ) : (
        <p className="text-text-3">{t("listening.detail.noNotes")}</p>
      )}
    </section>
  );
}
