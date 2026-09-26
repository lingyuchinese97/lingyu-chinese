"use client";
import * as React from "react";
import { Loader2, NotebookPen, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { PRONUNCIATION } from "@/lib/limits";
import { saveNoteAction, updateNoteAction } from "../actions";
import type { PronunciationNote } from "../service";

/**
 * Hộp thoại thêm / sửa ghi chú. `note` null = ghi chú tự do mới. Ghi chú gắn mục (topic) chỉ sửa nội dung.
 * Gọi `onSaved` với ghi chú sau khi lưu.
 */
export function NoteDialog({
  open,
  onOpenChange,
  note,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  note: PronunciationNote | null;
  onSaved: (n: PronunciationNote) => void;
}) {
  const t = useT();
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [lastOpen, setLastOpen] = React.useState(false);
  // Mở lại → nạp nội dung của ghi chú đang sửa (điều chỉnh state theo prop khi render, không dùng effect).
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setTitle(note?.title ?? "");
      setContent(note?.content ?? "");
      setErrors({});
    }
  }
  const topicNote = !!note?.topic;

  async function save() {
    setSaving(true);
    const r = note
      ? await updateNoteAction(note.id, topicNote ? { content } : { title, content })
      : await saveNoteAction({ title, content });
    setSaving(false);
    if (!r.ok) {
      setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, t.maybe(v)])));
      return void toast.error(r.message);
    }
    if (r.data) onSaved(r.data);
    toast.success(t("pronunciation.notes.saved"));
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={note ? t("pronunciation.notes.editTitle") : t("pronunciation.notes.addTitle")}
        description={t("pronunciation.note.desc")}
        icon={<NotebookPen />}
      >
        {!topicNote ? (
          <Field id="pn-title" label={t("pronunciation.notes.titleLabel")} required error={errors.title}>
            <Input
              id="pn-title"
              value={title}
              maxLength={PRONUNCIATION.MAX_TITLE}
              placeholder={t("pronunciation.notes.titlePlaceholder")}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
            />
          </Field>
        ) : null}
        <Field id="pn-content" label={t("pronunciation.notes.contentLabel")} required error={errors.content}>
          <Textarea
            id="pn-content"
            rows={6}
            value={content}
            maxLength={PRONUNCIATION.MAX_TEXT}
            placeholder={t("pronunciation.note.placeholder")}
            onChange={(e) => setContent(e.target.value)}
            aria-invalid={!!errors.content}
          />
        </Field>
        <DialogActions>
          <DialogClose asChild>
            <Button variant="secondary">{t("common.cancel")}</Button>
          </DialogClose>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {t("pronunciation.notes.save")}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
}
