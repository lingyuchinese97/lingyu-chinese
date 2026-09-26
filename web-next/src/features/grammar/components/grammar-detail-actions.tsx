"use client";
import { useT } from "@/i18n/client";
import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, Pencil, Share2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm";
import { toast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import { deleteGrammarAction, setBookmarkAction } from "../actions";
import {
  AcceptShareDialog,
  SentList,
  ShareGrammarDialog,
  rejectWithConfirm,
  type PendingShare,
  type SentItem,
} from "./grammar-dialogs";

/** Nút của chủ sở hữu: Lưu / Chia sẻ / Chỉnh sửa / Xóa + danh sách đã chia sẻ. */
export function OwnerActions({
  g,
  sent: initialSent,
}: {
  g: { id: string; title: string; isSaved: boolean };
  sent: SentItem[];
}) {
  const router = useRouter();
  const t = useT();
  const [confirm, confirmNode] = useConfirm();
  const [saved, setSaved] = React.useState(g.isSaved);
  const [share, setShare] = React.useState(false);
  const [sent, setSent] = React.useState(initialSent);

  async function toggle() {
    const r = await setBookmarkAction(g.id, !saved);
    if (!r.ok) return void toast.error(r.message);
    setSaved(r.data);
    toast.success(r.data ? t("grammar.savedToast") : t("grammar.unsavedToast"));
  }
  async function remove() {
    const ok = await confirm({
      title: t("grammar.deleteTitle"),
      message: (
        <>
          {t("grammar.deleteConfirm")}
          <br />
          <strong>{g.title}</strong>
        </>
      ),
      confirmLabel: t("common.delete"),
      danger: true,
    });
    if (!ok) return;
    const r = await deleteGrammarAction(g.id);
    if (!r.ok) return void toast.error(r.message || t("grammar.deleteFailed"));
    toast.success(t("grammar.deleted"));
    router.push("/grammar");
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          onClick={toggle}
          aria-pressed={saved}
          className={cn(saved && "text-amber")}
        >
          <Bookmark className={cn(saved && "fill-amber")} />
          {saved ? t("grammar.detail.saved") : t("grammar.save")}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShare(true)}>
          <Share2 />
          {t("grammar.share")}
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link href={`/grammar/${g.id}/edit`}>
            <Pencil />
            {t("grammar.editAction")}
          </Link>
        </Button>
        <Button variant="danger-outline" size="sm" onClick={remove}>
          <Trash2 />
          {t("grammar.delete")}
        </Button>
      </div>
      <ShareGrammarDialog grammar={share ? g : null} sent={sent} onClose={() => setShare(false)} onSent={setSent} />
      {confirmNode}
      <SentPortal sent={sent} />
    </>
  );
}

/** Danh sách "Đã chia sẻ với" ở cuối trang (khung do server render, id="gd-sent") — cập nhật ngay sau khi gửi. */
function SentPortal({ sent }: { sent: SentItem[] }) {
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    const target = document.getElementById("gd-sent");
    Promise.resolve().then(() => setEl(target));
  }, []);
  return el ? createPortal(<SentList sent={sent} />, el) : null;
}

/** Thanh lời mời cho người nhận đang xem bản preview. */
export function PreviewBar({ share, myTags }: { share: PendingShare; myTags: string[] }) {
  const router = useRouter();
  const t = useT();
  const [confirm, confirmNode] = useConfirm();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <div
        role="status"
        className="flex flex-wrap items-center gap-3 rounded-[18px] border border-[#CFE3F7] bg-blue-50 px-4 py-3.5"
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-blue-600">
          <Share2 className="size-5" />
        </span>
        <div className="min-w-0 flex-1 text-[15px] text-text-2">
          <strong className="block text-navy">{t("grammar.detail.sharedWithYou", { name: share.senderName })}</strong>
          {t("grammar.detail.previewNote")}
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Button
            size="sm"
            variant="muted"
            onClick={async () => {
              if (await rejectWithConfirm(confirm, share)) router.push("/grammar?view=shared");
            }}
          >
            <X />
            {t("common.reject")}
          </Button>
          <Button size="sm" variant="solid" onClick={() => setOpen(true)}>
            <Check />
            {t("common.accept")}
          </Button>
        </div>
      </div>
      <AcceptShareDialog
        share={open ? share : null}
        myTags={myTags}
        onClose={() => setOpen(false)}
        onDone={(g) => router.push(`/grammar/${g.id}`)}
      />
      {confirmNode}
    </>
  );
}
