"use client";
import * as React from "react";
import { BookOpen, Loader2, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogContent } from "@/components/ui/dialog";
import { FieldError } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { useT } from "@/i18n/client";
import { LISTENING } from "@/lib/limits";
import { sentencePinyin } from "@/lib/sentence-pinyin";
import { referenceSchema } from "../schema";

export type Reference = { answer: string; pinyin: string };

/** Popup "Thêm đáp án tham khảo": người dùng TỰ nhập đáp án chuẩn (không lấy phụ đề). */
export function ReferenceModal({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: Reference;
  onSave: (r: Reference) => void;
}) {
  const t = useT();
  const [answer, setAnswer] = React.useState(initial.answer);
  const [pinyin, setPinyin] = React.useState(initial.pinyin);
  const [err, setErr] = React.useState<{ answer?: string; pinyin?: string }>({});
  const [gen, setGen] = React.useState(false);
  const [openedFor, setOpenedFor] = React.useState(false);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) {
      setAnswer(initial.answer);
      setPinyin(initial.pinyin);
      setErr({});
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = referenceSchema.safeParse({ referenceAnswer: answer, referencePinyin: pinyin });
    if (!r.success) {
      const next: typeof err = {};
      for (const i of r.error.issues) {
        if (i.path[0] === "referenceAnswer") next.answer ??= i.message;
        if (i.path[0] === "referencePinyin") next.pinyin ??= i.message;
      }
      setErr(next);
      document.getElementById(next.answer ? "lx-ref-answer" : "lx-ref-pinyin")?.focus();
      return;
    }
    onSave({ answer: r.data.referenceAnswer, pinyin: r.data.referencePinyin });
    onOpenChange(false);
  }

  const hasHan = /\p{Script=Han}/u.test(answer);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        wide
        icon={<BookOpen />}
        title={initial.answer ? t("listening.reference.modalEditTitle") : t("listening.reference.modalTitle")}
        description={t("listening.reference.desc")}
      >
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lx-ref-answer" className="text-[15px] font-semibold text-text">
              {t("listening.reference.answer")}{" "}
              <span className="font-medium text-text-2">{t("listening.reference.required")}</span>
            </label>
            <Textarea
              id="lx-ref-answer"
              lang="zh"
              autoFocus
              value={answer}
              maxLength={LISTENING.MAX_TEXT}
              onChange={(e) => {
                setAnswer(e.target.value);
                setErr((x) => ({ ...x, answer: undefined }));
              }}
              placeholder={t("listening.reference.answerPlaceholder")}
              aria-invalid={!!err.answer || undefined}
              aria-describedby="lx-ref-answer-hint lx-ref-answer-err"
              className="min-h-[120px] font-cn text-[18px]"
            />
            <div className="flex gap-3 text-[13.5px] text-text-3">
              <span id="lx-ref-answer-hint">{t("listening.reference.answerHint")}</span>
              <span className="ml-auto tabular-nums">
                {answer.length} / {LISTENING.MAX_TEXT}
              </span>
            </div>
            <FieldError id="lx-ref-answer-err" message={err.answer} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <label htmlFor="lx-ref-pinyin" className="text-[15px] font-semibold text-text">
                {t("listening.reference.pinyin")}{" "}
                <span className="font-medium text-text-2">{t("listening.reference.optional")}</span>
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="ml-auto h-9"
                disabled={!hasHan || gen}
                onClick={async () => {
                  setGen(true);
                  try {
                    setPinyin((await sentencePinyin(answer)).slice(0, LISTENING.MAX_TEXT));
                  } finally {
                    setGen(false);
                  }
                }}
              >
                {gen ? <Loader2 className="animate-spin" /> : <Sparkles />}
                {t("listening.reference.genPinyin")}
              </Button>
            </div>
            <Textarea
              id="lx-ref-pinyin"
              value={pinyin}
              maxLength={LISTENING.MAX_TEXT}
              onChange={(e) => setPinyin(e.target.value)}
              placeholder={t("listening.reference.pinyinPlaceholder")}
              aria-invalid={!!err.pinyin || undefined}
              aria-describedby="lx-ref-pinyin-err"
              spellCheck={false}
            />
            <span className="self-end text-[13.5px] text-text-3 tabular-nums">
              {pinyin.length} / {LISTENING.MAX_TEXT}
            </span>
            <FieldError id="lx-ref-pinyin-err" message={err.pinyin} />
          </div>
          <DialogActions>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary">
              <Save />
              {t("listening.reference.save")}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
