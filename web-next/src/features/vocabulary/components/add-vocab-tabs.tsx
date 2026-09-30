import Link from "next/link";
import { Camera, ClipboardPaste, ImageUp, Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

export const ADD_MODES = ["camera", "upload", "paste", "manual"] as const;
export type AddMode = (typeof ADD_MODES)[number];
const ICON = { camera: Camera, upload: ImageUp, paste: ClipboardPaste, manual: Keyboard };

/** Thẻ chọn cách thêm từ: Chụp ảnh · Tải ảnh lên · Dán ảnh · Nhập thủ công (đổi bằng ?mode=, giữ được khi tải lại). */
export function AddVocabTabs({
  mode,
  labels,
  label,
}: {
  mode: AddMode;
  labels: Record<AddMode, string>;
  label: string;
}) {
  return (
    <nav aria-label={label} className="-mx-4 [scrollbar-width:none] overflow-x-auto px-4 md:mx-0 md:px-0">
      <ul className="flex min-w-max gap-1 rounded-2xl border border-border bg-white p-1.5 shadow-card md:min-w-0">
        {ADD_MODES.map((m) => {
          const Icon = ICON[m];
          const on = m === mode;
          return (
            <li key={m} className="flex-1">
              <Link
                href={m === "manual" ? "/vocabulary/new" : `/vocabulary/new?mode=${m}`}
                replace
                scroll={false}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-semibold whitespace-nowrap transition-colors outline-none focus-visible:shadow-[var(--focus-ring)] [&_svg]:size-5",
                  on ? "bg-blue-600 text-white" : "text-text-2 hover:bg-blue-50 hover:text-blue-600",
                )}
              >
                <Icon aria-hidden="true" />
                {labels[m]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
