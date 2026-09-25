import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";

/** Quay lại + mục + › + trang hiện tại (như breadcrumb bản cũ). */
export function Breadcrumb({ back, section, current }: { back: string; section: string; current: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="-mt-1.5 flex min-h-11 flex-wrap items-center gap-1.5 text-base md:gap-3.5 md:text-xl"
    >
      <Link
        href={back}
        aria-label="Quay lại"
        className="-ml-2 inline-flex size-10 items-center justify-center rounded-full text-text-2 hover:bg-blue-50 hover:text-blue-600"
      >
        <ArrowLeft className="size-6" />
      </Link>
      <Link href={back} className="inline-flex min-h-10 items-center text-text-2 hover:text-blue-600">
        {section}
      </Link>
      <ChevronRight className="size-5 text-text-2" aria-hidden="true" />
      <span aria-current="page" className="max-w-[60vw] truncate font-semibold text-text">
        {current}
      </span>
    </nav>
  );
}
