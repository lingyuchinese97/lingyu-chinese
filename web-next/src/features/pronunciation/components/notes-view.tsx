"use client";
import * as React from "react";
import Link from "next/link";
import { ExternalLink, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { useIntlTag, useT } from "@/i18n/client";
import { topicHref, topicLabel } from "@/data/pronunciation";
import { deleteNoteAction } from "../actions";
import type { PronunciationNote } from "../service";
import { NoteDialog } from "./note-dialog";
import { PCard } from "./pron-header";
import { useL } from "./speech";

/** Ghi chú của tôi: mọi ghi chú phát âm (tự do + gắn mục), thêm / sửa / xoá, mở lại bài học của mục. */
export function NotesView({ notes: initial }: { notes: PronunciationNote[] }) {
  const t = useT();
  const l = useL();
  const tag = useIntlTag();
  const [notes, setNotes] = React.useState(initial);
  const [editing, setEditing] = React.useState<PronunciationNote | null>(null);
  const [open, setOpen] = React.useState(false);
  const [confirm, confirmNode] = useConfirm();
  const title = (n: PronunciationNote) => (n.topic ? l(topicLabel(n.topic) ?? { vi: n.title, en: n.title }) : n.title);

  async function remove(n: PronunciationNote) {
    const ok = await confirm({
      title: t("pronunciation.notes.deleteTitle"),
      message: t("pronunciation.notes.deleteMessage", { title: title(n) }),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteNoteAction(n.id);
    if (!r.ok) return void toast.error(r.message);
    setNotes((list) => list.filter((x) => x.id !== n.id));
    toast.success(t("pronunciation.notes.deleted"));
  }

  return (
    <PCard aria-labelledby="pn-h" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="pn-h" className="text-[20px] font-extrabold text-navy-900">
            {t("pronunciation.notes.title")}
          </h2>
          <p className="text-[14px] text-text-2">{t("pronunciation.notes.sub")}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus />
          {t("pronunciation.notes.add")}
        </Button>
      </div>
      {notes.length ? (
        <ul aria-label={t("pronunciation.notes.list")} className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {notes.map((n) => (
            <li key={n.id} className="flex flex-col gap-2 rounded-[16px] border border-border bg-white p-4">
              <div className="flex items-start gap-2">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
                  <NotebookPen className="size-[18px]" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-bold [overflow-wrap:anywhere] text-navy-900">{title(n)}</h3>
                  <p className="text-[12.5px] text-text-3">
                    {n.topic ? null : `${t("pronunciation.notes.free")} · `}
                    {t("pronunciation.notes.updated", { date: new Date(n.updatedAt).toLocaleDateString(tag) })}
                  </p>
                </div>
              </div>
              <p className="text-[14.5px] [overflow-wrap:anywhere] whitespace-pre-line text-text">{n.content}</p>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {n.topic ? (
                  <Button asChild size="sm" variant="ghost">
                    <Link href={topicHref(n.topic)}>
                      <ExternalLink />
                      {t("pronunciation.notes.open")}
                    </Link>
                  </Button>
                ) : null}
                <Button
                  size="icon"
                  variant="secondary"
                  className="ml-auto"
                  aria-label={t("pronunciation.notes.edit", { title: title(n) })}
                  onClick={() => {
                    setEditing(n);
                    setOpen(true);
                  }}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon"
                  variant="danger-outline"
                  aria-label={t("pronunciation.notes.delete", { title: title(n) })}
                  onClick={() => remove(n)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <NotebookPen className="size-10 text-blue" aria-hidden="true" />
          <p className="text-[16px] font-semibold text-navy-900">{t("pronunciation.notes.empty")}</p>
          <p className="max-w-[420px] text-[14px] text-text-2">{t("pronunciation.notes.emptyHint")}</p>
        </div>
      )}
      <NoteDialog
        open={open}
        onOpenChange={setOpen}
        note={editing}
        onSaved={(saved) => setNotes((list) => [saved, ...list.filter((x) => x.id !== saved.id)])}
      />
      {confirmNode}
    </PCard>
  );
}
