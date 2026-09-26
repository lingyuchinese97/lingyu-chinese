"use client";
import * as React from "react";
import { FileText, Loader2, Save } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogContent } from "@/components/ui/dialog";
import { useT } from "@/i18n/client";
import { exerciseInputSchema } from "../schema";
import { ExerciseFields, draftErrors, type DraftErrors, type ExerciseDraft } from "./exercise-fields";

/**
 * Popup "Lưu bài làm" (khác hẳn popup Thêm đáp án): tiêu đề, thẻ, đáp án (chỉ đọc), bài làm sau chỉnh sửa (so sánh tức
 * thì) và ghi chú. Bấm Lưu → `onSubmit` nhận dữ liệu đã kiểm tra; server so sánh + chấm lại khi lưu.
 */
export function SaveExerciseModal({
  open,
  onOpenChange,
  initial,
  allTags,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: ExerciseDraft;
  allTags: string[];
  onSubmit: (draft: ExerciseDraft) => Promise<{ ok: true } | { ok: false; message: string; fieldErrors?: DraftErrors }>;
}) {
  const t = useT();
  const [v, setV] = React.useState(initial);
  const [errors, setErrors] = React.useState<DraftErrors>({});
  const [formError, setFormError] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [openedFor, setOpenedFor] = React.useState(false);
  if (open !== openedFor) {
    setOpenedFor(open);
    if (open) {
      setV(initial);
      setErrors({});
      setFormError("");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const parsed = exerciseInputSchema.safeParse({ ...v, contentUrl: "" });
    if (!parsed.success) {
      const errs = draftErrors(parsed.error.issues);
      setErrors(errs);
      if (errs.title) document.getElementById("lx-save-title")?.focus();
      return;
    }
    setSaving(true);
    const r = await onSubmit(v);
    setSaving(false);
    if (!r.ok) {
      setFormError(r.message);
      if (r.fieldErrors) setErrors(r.fieldErrors);
      return;
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(x) => !saving && onOpenChange(x)}>
      <DialogContent wide icon={<FileText />} title={t("listening.save.title")} description={t("listening.save.sub")}>
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          {formError ? <Alert tone="error">{t.maybe(formError)}</Alert> : null}
          <ExerciseFields
            idPrefix="lx-save"
            value={v}
            onChange={(p) => {
              setV((x) => ({ ...x, ...p }));
              setErrors((x) => {
                const n = { ...x };
                for (const k of Object.keys(p)) delete n[k as keyof ExerciseDraft];
                return n;
              });
            }}
            errors={errors}
            allTags={allTags}
          />
          <DialogActions>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {t("listening.save.submit")}
            </Button>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
}
