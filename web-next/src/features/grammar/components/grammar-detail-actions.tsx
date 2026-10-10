"use client";
import { useT } from "@/i18n/client";
import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Check, MoreHorizontal, Pencil, Share2, Trash2, X } from "lucide-react";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
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

const iconBtn =
  "inline-flex size-11 items-center justify-center rounded-[12px] border-[1.5px] border-[#BFD7F2] bg-white text-blue-700 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5";

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
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={saved}
          className={cn(
            "inline-flex min-h-11 items-center gap-2 rounded-[12px] border-[1.5px] bg-white px-4 text-[15px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-[18px]",
            saved ? "border-[#F5C46B] text-[#C27A00]" : "border-[#BFD7F2] text-blue-700 hover:bg-blue-50",
          )}
        >
          <Bookmark className={cn(saved && "fill-amber text-amber")} />
          {saved ? t("grammar.detail.saved") : t("grammar.save")}
        </button>
        <button type="button" onClick={() => setShare(true)} aria-label={t("grammar.share")} className={iconBtn}>
          <Share2 />
        </button>
        <Menu>
          <MenuTrigger asChild>
            <button type="button" aria-label={t("grammar.detail.more")} className={iconBtn}>
              <MoreHorizontal />
            </button>
          </MenuTrigger>
          <MenuContent align="end" className="w-[200px]">
            <MenuItem asChild>
              <Link href={`/grammar/${g.id}/edit`}>
                <Pencil />
                {t("grammar.editAction")}
              </Link>
            </MenuItem>
            <MenuSeparator />
            <MenuItem danger onSelect={remove}>
              <Trash2 />
              {t("grammar.delete")}
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
      <ShareGrammarDialog grammar={share ? g : null} sent={sent} onClose={() => setShare(false)} onSent={setSent} />
      {confirmNode}
      <SentPortal sent={sent} onShare={() => setShare(true)} />
    </>
  );
}

/**
 * Danh sách "Đã chia sẻ với" + nút "Chia sẻ ngay" ở cuối trang (khung do server render: id="gd-sent", "gd-share-now") —
 * cập nhật ngay sau khi gửi.
 */
function SentPortal({ sent, onShare }: { sent: SentItem[]; onShare: () => void }) {
  const t = useT();
  const [el, setEl] = React.useState<{ list: HTMLElement | null; btn: HTMLElement | null } | null>(null);
  React.useEffect(() => {
    const targets = { list: document.getElementById("gd-sent"), btn: document.getElementById("gd-share-now") };
    Promise.resolve().then(() => setEl(targets));
  }, []);
  return (
    <>
      {el?.list ? createPortal(<SentList sent={sent} />, el.list) : null}
      {el?.btn
        ? createPortal(
            <Button variant="secondary" size="sm" onClick={onShare}>
              <Share2 />
              {t("grammar.detail.shareNow")}
            </Button>,
            el.btn,
          )
        : null}
    </>
  );
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
