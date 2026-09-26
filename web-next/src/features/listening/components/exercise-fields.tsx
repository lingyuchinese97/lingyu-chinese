"use client";
import * as React from "react";
import { BookOpen, FileText, PenLine } from "lucide-react";
import { FieldError } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { TagPicker } from "@/features/vocabulary/components/tag-picker";
import { useT } from "@/i18n/client";
import { LISTENING } from "@/lib/limits";
import { compareDictation } from "@/lib/dictation-compare";
import { DiffTextarea } from "./diff-textarea";
import { Legend, ScoreLine } from "./comparison-view";

export type ExerciseDraft = {
  title: string;
  tags: string[];
  referenceAnswer: string;
  referencePinyin: string;
  userAnswer: string;
  notes: string;
};
export type DraftErrors = Partial<Record<keyof ExerciseDraft, string>>;

const Counter = ({ n, max }: { n: number; max: number }) => (
  <span className={n > max ? "text-red tabular-nums" : "tabular-nums"}>
    {n} / {max}
  </span>
);

/**
 * Các trường của một bài làm — dùng chung cho popup "Lưu bài làm" (đáp án chỉ đọc) và "Chỉnh sửa & Lưu" ở
 * Bài làm của tôi (đáp án sửa được). Ô bài làm so sánh lại với đáp án mỗi lần gõ.
 */
export function ExerciseFields({
  value,
  onChange,
  errors,
  allTags,
  referenceEditable,
  idPrefix,
}: {
  value: ExerciseDraft;
  onChange: (patch: Partial<ExerciseDraft>) => void;
  errors: DraftErrors;
  allTags: string[];
  referenceEditable?: boolean;
  idPrefix: string;
}) {
  const t = useT();
  const id = (k: string) => `${idPrefix}-${k}`;
  const live = React.useMemo(
    () => (value.referenceAnswer.trim() ? compareDictation(value.referenceAnswer, value.userAnswer) : null),
    [value.referenceAnswer, value.userAnswer],
  );
  const label = "text-[15px] font-semibold text-text";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("title")} className={label}>
          {t("listening.save.titleLabel")}
          <span className="ml-0.5 text-red" aria-hidden="true">
            *
          </span>
        </label>
        <Input
          id={id("title")}
          value={value.title}
          maxLength={LISTENING.MAX_TITLE}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("listening.save.titlePlaceholder")}
          aria-required
          aria-invalid={!!errors.title || undefined}
          aria-describedby={id("title-err")}
          autoComplete="off"
        />
        <div className="flex text-[13.5px] text-text-3">
          <FieldError id={id("title-err")} message={errors.title} />
          <span className="ml-auto">
            <Counter n={value.title.length} max={LISTENING.MAX_TITLE} />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span id={id("tags-label")} className={label}>
          {t("listening.save.tags")}{" "}
          <span className="font-medium text-text-2">{t("listening.reference.optional")}</span>
        </span>
        <TagPicker
          value={value.tags}
          onChange={(tags) => onChange({ tags: tags.slice(0, LISTENING.MAX_TAGS) })}
          allTags={allTags}
          labelId={id("tags-label")}
        />
        <FieldError id={id("tags-err")} message={errors.tags} />
      </div>

      <div className="flex flex-col gap-2 rounded-[14px] border border-[#DDEBF8] bg-[#F5FAFF] p-3.5">
        <span className="flex items-center gap-2 text-[15px] font-semibold text-navy">
          <BookOpen className="size-[18px] text-blue-600" aria-hidden="true" />
          {t("listening.reference.title")}{" "}
          <span className="font-medium text-text-2">{t("listening.reference.forCompare")}</span>
        </span>
        {referenceEditable ? (
          <>
            <label htmlFor={id("ref")} className="sr-only">
              {t("listening.reference.answer")}
            </label>
            <Textarea
              id={id("ref")}
              lang="zh"
              value={value.referenceAnswer}
              maxLength={LISTENING.MAX_TEXT}
              onChange={(e) => onChange({ referenceAnswer: e.target.value })}
              aria-invalid={!!errors.referenceAnswer || undefined}
              aria-describedby={id("ref-err")}
              className="font-cn text-[18px]"
            />
            <FieldError id={id("ref-err")} message={errors.referenceAnswer} />
            <label htmlFor={id("pinyin")} className="text-[14px] font-semibold text-text-2">
              {t("listening.reference.pinyin")}
            </label>
            <Textarea
              id={id("pinyin")}
              value={value.referencePinyin}
              maxLength={LISTENING.MAX_TEXT}
              onChange={(e) => onChange({ referencePinyin: e.target.value })}
              spellCheck={false}
              className="min-h-16"
            />
          </>
        ) : (
          <div>
            <p lang="zh" className="font-cn text-[19px] leading-relaxed whitespace-pre-wrap text-text">
              {value.referenceAnswer}
            </p>
            {value.referencePinyin ? (
              <p className="text-[15px] whitespace-pre-wrap text-pinyin">{value.referencePinyin}</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("answer")} className={`${label} flex items-center gap-2`}>
          <PenLine className="size-[18px] text-blue-600" aria-hidden="true" />
          {t("listening.save.edited")}{" "}
          <span className="font-medium text-text-2">{t("listening.save.editedExtra")}</span>
        </label>
        <p id={id("answer-hint")} className="text-[13.5px] text-text-3">
          {t("listening.save.editedHint")}
        </p>
        <DiffTextarea
          id={id("answer")}
          value={value.userAnswer}
          onChange={(userAnswer) => onChange({ userAnswer })}
          reference={value.referenceAnswer}
          maxLength={LISTENING.MAX_TEXT}
          aria-describedby={`${id("answer-hint")} ${id("answer-err")}`}
          aria-invalid={!!errors.userAnswer || undefined}
        />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-text-3">
          {live ? <ScoreLine c={live} className="text-[14px]" /> : null}
          <Legend />
          <span className="ml-auto">
            <Counter n={value.userAnswer.length} max={LISTENING.MAX_TEXT} />
          </span>
        </div>
        <FieldError id={id("answer-err")} message={errors.userAnswer} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={id("notes")} className={`${label} flex items-center gap-2`}>
          <FileText className="size-[18px] text-blue-600" aria-hidden="true" />
          {t("listening.save.notes")}{" "}
          <span className="font-medium text-text-2">{t("listening.reference.optional")}</span>
        </label>
        <Textarea
          id={id("notes")}
          value={value.notes}
          maxLength={LISTENING.MAX_TEXT}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder={t("listening.notes.placeholder")}
          aria-describedby={id("notes-err")}
        />
        <div className="flex text-[13.5px] text-text-3">
          <FieldError id={id("notes-err")} message={errors.notes} />
          <span className="ml-auto">
            <Counter n={value.notes.length} max={LISTENING.MAX_TEXT} />
          </span>
        </div>
      </div>
    </div>
  );
}

/** Lỗi Zod → lỗi theo trường của form. */
export function draftErrors(issues: { path: PropertyKey[]; message: string }[]): DraftErrors {
  const out: DraftErrors = {};
  for (const i of issues) {
    const k = String(i.path[0]) as keyof ExerciseDraft;
    if (["title", "tags", "referenceAnswer", "referencePinyin", "userAnswer", "notes"].includes(k))
      out[k] ??= i.message;
  }
  return out;
}
