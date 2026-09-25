"use client";
import * as React from "react";
import { Plus, Tag as TagIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { VOCAB } from "@/lib/limits";
import { addTagsAction } from "../actions";

/** Gắn thêm tag cho các từ đã chọn (giữ tag cũ). */
export function AddTagDialog({
  ids,
  allTags,
  onClose,
  onDone,
}: {
  ids: string[] | null;
  allTags: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <Dialog open={!!ids} onOpenChange={(o) => !o && onClose()}>
      {ids ? <Body key={ids.join()} ids={ids} allTags={allTags} onClose={onClose} onDone={onDone} /> : null}
    </Dialog>
  );
}

/** Nội dung tách riêng + key theo ids → mỗi lần mở là trạng thái mới. */
function Body({
  ids,
  allTags,
  onClose,
  onDone,
}: {
  ids: string[];
  allTags: string[];
  onClose: () => void;
  onDone: () => void;
}) {
  const [picked, setPicked] = React.useState<string[]>([]);
  const [extra, setExtra] = React.useState<string[]>([]);
  const [draft, setDraft] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const names = [...allTags, ...extra.filter((e) => !allTags.some((t) => t.toLowerCase() === e.toLowerCase()))];
  const has = (t: string) => picked.some((x) => x.toLowerCase() === t.toLowerCase());

  const addDraft = () => {
    const t = draft.trim();
    if (!t) return;
    if (!names.some((x) => x.toLowerCase() === t.toLowerCase())) setExtra((e) => [...e, t]);
    if (!has(t)) setPicked((p) => [...p, t]);
    setDraft("");
  };

  async function save() {
    if (!picked.length) return void toast.error("Vui lòng chọn ít nhất 1 tag.");
    setBusy(true);
    const r = await addTagsAction(ids, picked);
    setBusy(false);
    if (!r.ok) return void toast.error(r.message);
    toast.success(`Đã thêm tag cho ${r.data.updated} từ.`);
    onClose();
    onDone();
  }

  return (
    <DialogContent
      title="Thêm tag"
      description={`Tag được thêm vào ${ids.length} từ đã chọn, tag cũ vẫn giữ nguyên.`}
      icon={<TagIcon />}
    >
      <div className="flex max-h-[40dvh] flex-wrap gap-2 overflow-y-auto">
        {names.length ? (
          names.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={has(t)}
              onClick={() =>
                setPicked((p) => (has(t) ? p.filter((x) => x.toLowerCase() !== t.toLowerCase()) : [...p, t]))
              }
              className={cn(
                "rounded-[9px] border-2 p-0.5 transition-colors",
                has(t) ? "border-blue" : "border-transparent hover:border-border",
              )}
            >
              <Tag name={t} className="text-[14.5px]" />
            </button>
          ))
        ) : (
          <p className="text-sm text-text-3">Chưa có tag nào. Tạo tag mới bên dưới.</p>
        )}
      </div>
      <div className="flex gap-2">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Tên tag mới</span>
          <Input
            value={draft}
            maxLength={VOCAB.MAX_TAG}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDraft();
              }
            }}
            placeholder="Tạo tag mới (vd: Bài 3)"
          />
        </label>
        <Button type="button" variant="ghost" onClick={addDraft}>
          <Plus />
          Thêm
        </Button>
      </div>
      <DialogActions>
        <DialogClose asChild>
          <Button variant="secondary">Hủy</Button>
        </DialogClose>
        <Button variant="solid" disabled={busy || !picked.length} onClick={save}>
          {busy ? "Đang lưu..." : `Gắn ${picked.length || ""} tag`.replace("  ", " ")}
        </Button>
      </DialogActions>
    </DialogContent>
  );
}
