"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { menuContentClass } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm";
import { cn } from "@/lib/utils";
import { bellAction, markReadAction } from "@/features/notifications/actions";
import type { NotificationItem } from "@/features/notifications/service";
import { AcceptShareDialog, rejectWithConfirm, type PendingShare } from "@/features/grammar/components/grammar-dialogs";
import { AcceptVocabDialog, rejectVocabWithConfirm } from "@/features/vocabulary/components/share-dialogs";
import type { ReceivedVocabShare } from "@/features/vocabulary/share-service";

type BellData = Awaited<ReturnType<typeof bellAction>>;

const fmt = (d: Date | string) => {
  const x = new Date(d);
  return `${x.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })} ${x.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
};

/** Chuông thông báo: số chưa đọc, danh sách, xử lý lời mời chia sẻ ngay trong chuông. Mở chuông = đã xem. */
export function NotificationBell({ initialUnread = 0 }: { initialUnread?: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [confirm, confirmNode] = useConfirm();
  const [data, setData] = React.useState<BellData | null>(null);
  const [unread, setUnread] = React.useState(initialUnread);
  const [open, setOpen] = React.useState(false);
  const [accept, setAccept] = React.useState<PendingShare | null>(null);
  const [vocabInvite, setVocabInvite] = React.useState<ReceivedVocabShare | null>(null);

  const load = React.useCallback(async () => {
    try {
      const d = await bellAction();
      setData(d);
      setUnread(d.unread);
      return d;
    } catch {
      return null;
    }
  }, []);

  // Cập nhật khi đổi trang, khi quay lại tab, và mỗi phút.
  React.useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load, pathname]);
  React.useEffect(() => {
    const onFocus = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onFocus);
    const t = setInterval(onFocus, 60_000);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      clearInterval(t);
    };
  }, [load]);

  async function onOpenChange(o: boolean) {
    setOpen(o);
    if (!o) return;
    const d = await load();
    if (d?.unread) {
      await markReadAction();
      setUnread(0);
    }
  }
  const after = async () => {
    await load();
    router.refresh();
  };

  const pending = new Set(data?.pendingGrammar ?? []);
  const pendingVocab = new Map((data?.pendingVocab ?? []).map((v) => [v.id, v]));
  const rejectVocab = async (s: ReceivedVocabShare) => {
    setOpen(false);
    if (await rejectVocabWithConfirm(confirm, s)) {
      setVocabInvite(null);
      await after();
    }
  };
  const items = data?.items ?? [];

  return (
    <>
      <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={unread ? `Thông báo (${unread} chưa đọc)` : "Thông báo"}
            className="relative flex size-11 items-center justify-center rounded-full text-navy outline-none hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)]"
          >
            <Bell className="size-[26px]" aria-hidden="true" />
            {unread > 0 ? (
              <span className="absolute top-1 right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-rose px-1 text-[11px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={8} className={cn(menuContentClass, "w-[380px] p-0")}>
            {items.length ? (
              <>
                <div className="border-b border-border px-4 py-3 font-bold text-navy">Thông báo</div>
                <ul className="max-h-[min(70dvh,480px)] overflow-y-auto">
                  {items.map((n) => (
                    <Row
                      key={n.id}
                      n={n}
                      pending={!!n.payload.shareId && pending.has(n.payload.shareId)}
                      vocab={n.payload.shareId ? pendingVocab.get(n.payload.shareId) : undefined}
                      onOpenVocab={(v) => {
                        setOpen(false);
                        setVocabInvite(v);
                      }}
                      onRejectVocab={rejectVocab}
                      onView={() => setOpen(false)}
                      onAccept={(s) => {
                        setOpen(false);
                        setAccept(s);
                      }}
                      onReject={async (s) => {
                        setOpen(false);
                        if (await rejectWithConfirm(confirm, s)) await after();
                      }}
                    />
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center text-text-2">
                <Bell className="size-7 text-blue-600" aria-hidden="true" />
                Bạn chưa có thông báo mới.
              </div>
            )}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      <AcceptShareDialog
        share={accept}
        myTags={[]}
        onClose={() => setAccept(null)}
        onDone={(g) => {
          setAccept(null);
          void load();
          router.push(`/grammar/${g.id}`);
        }}
      />
      <AcceptVocabDialog
        share={vocabInvite}
        myTags={[]}
        onClose={() => setVocabInvite(null)}
        onDone={() => {
          setVocabInvite(null);
          void after();
        }}
        onReject={rejectVocab}
      />
      {confirmNode}
    </>
  );
}

function Row({
  n,
  pending,
  vocab,
  onView,
  onAccept,
  onReject,
  onOpenVocab,
  onRejectVocab,
}: {
  n: NotificationItem;
  pending: boolean;
  vocab?: ReceivedVocabShare;
  onOpenVocab: (s: ReceivedVocabShare) => void;
  onRejectVocab: (s: ReceivedVocabShare) => void;
  onView: () => void;
  onAccept: (s: PendingShare) => void;
  onReject: (s: PendingShare) => void;
}) {
  const p = n.payload;
  const who = <strong className="text-text">{p.actorName}</strong>;
  let text: React.ReactNode;
  let title: React.ReactNode = p.title;
  switch (n.type) {
    case "grammar_share":
      text = <>{who} đã chia sẻ một ngữ pháp với bạn.</>;
      break;
    case "grammar_share_accepted":
      text = <>{who} đã chấp nhận ngữ pháp bạn chia sẻ.</>;
      break;
    case "grammar_share_rejected":
      text = <>{who} đã từ chối ngữ pháp bạn chia sẻ.</>;
      break;
    case "vocab_share":
      text = (
        <>
          {who} đã chia sẻ {p.count ?? ""} từ vựng với bạn.
        </>
      );
      title = (
        <span className="hanzi" lang="zh">
          {p.title}
        </span>
      );
      break;
    case "vocab_share_accepted":
      text = (
        <>
          {who} đã chấp nhận {p.count ?? ""} từ vựng bạn chia sẻ.
        </>
      );
      break;
    case "vocab_share_rejected":
      text = <>{who} đã từ chối từ vựng bạn chia sẻ.</>;
      break;
  }
  const share: PendingShare | null = p.shareId
    ? { id: p.shareId, grammarTitle: p.title, senderName: p.actorName }
    : null;
  return (
    <li
      className={cn("flex flex-col gap-2 border-b border-border px-4 py-3 last:border-0", !n.readAt && "bg-blue-50/60")}
    >
      <div className="text-[14.5px] text-text-2">
        {text}
        <div className="font-semibold text-navy">{title}</div>
        <span className="text-xs text-text-3">{fmt(n.createdAt)}</span>
      </div>
      {n.type === "grammar_share" && share ? (
        pending ? (
          <div className="grid grid-cols-3 gap-1.5">
            {p.grammarId ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={`/grammar/${p.grammarId}?share=${p.shareId}`} onClick={onView}>
                  Xem
                </Link>
              </Button>
            ) : null}
            <Button size="sm" variant="solid" onClick={() => onAccept(share)}>
              Chấp nhận
            </Button>
            <Button size="sm" variant="muted" onClick={() => onReject(share)}>
              Từ chối
            </Button>
          </div>
        ) : (
          <span className="text-[13px] text-text-3">Đã phản hồi</span>
        )
      ) : null}
      {n.type === "vocab_share" ? (
        vocab ? (
          <div className="grid grid-cols-2 gap-1.5">
            <Button size="sm" variant="solid" onClick={() => onOpenVocab(vocab)}>
              Xem & chấp nhận
            </Button>
            <Button size="sm" variant="muted" onClick={() => onRejectVocab(vocab)}>
              Từ chối
            </Button>
          </div>
        ) : (
          <span className="text-[13px] text-text-3">Đã phản hồi</span>
        )
      ) : null}
    </li>
  );
}
