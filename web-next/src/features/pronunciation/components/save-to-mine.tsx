"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookmarkCheck, BookmarkPlus, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { saveFromLibraryAction } from "../actions";

/** Nút lưu một từ ví dụ của Thư viện vào Phát âm của tôi; đã có → link mở bản của mình (sửa / thêm tag). */
export function SaveToMine({
  topic,
  hanzi,
  saved,
  onSaved,
}: {
  topic: string;
  hanzi: string;
  saved: boolean;
  onSaved: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  if (saved)
    return (
      <Link
        href={`/pronunciation?q=${encodeURIComponent(hanzi)}`}
        aria-label={t("pronunciation.sound.inMine", { hanzi })}
        title={t("pronunciation.sound.inMine", { hanzi })}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-green-700 hover:bg-green-50"
      >
        <BookmarkCheck className="size-5" />
      </Link>
    );
  async function save() {
    setBusy(true);
    const r = await saveFromLibraryAction(topic, hanzi);
    setBusy(false);
    if (!r.ok) return void toast.error(r.message);
    onSaved();
    toast.success(t("pronunciation.sound.saved", { added: r.data.added, skipped: r.data.skipped }), {
      action: { label: t("pronunciation.sound.openMine"), onClick: () => router.push("/pronunciation") },
    });
  }
  return (
    <button
      type="button"
      onClick={save}
      disabled={busy}
      aria-label={t("pronunciation.sound.saveOne", { hanzi })}
      title={t("pronunciation.sound.saveOne", { hanzi })}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
    >
      {busy ? <Loader2 className="size-5 animate-spin" /> : <BookmarkPlus className="size-5" />}
    </button>
  );
}
