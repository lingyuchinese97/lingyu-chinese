import Image from "next/image";
import { BarChart3 } from "lucide-react";
import { LeafDecor } from "@/components/layout/icons";
import { ProgressTabs } from "@/features/progress/components/progress-tabs";
import { getT } from "@/i18n/server";

export default async function ProgressLayout({ children }: { children: React.ReactNode }) {
  const t = await getT();
  return (
    <div className="flex flex-col gap-4">
      <section
        aria-labelledby="pg-title"
        className="relative flex items-center gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-[18px] py-[18px] md:px-7 md:py-5"
      >
        <span className="hidden size-14 shrink-0 items-center justify-center rounded-[18px] bg-white text-green-700 shadow-soft sm:flex md:size-16">
          <BarChart3 className="size-8" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h1
            id="pg-title"
            className="flex items-center gap-3 text-[24px] font-extrabold tracking-tight text-navy-900 md:text-[32px]"
          >
            {t("progress.title")}
            <LeafDecor className="hidden w-10 sm:block" />
          </h1>
          <p className="mt-1 text-[14px] text-text-2 md:text-[16px]">{t("progress.subtitle")}</p>
        </div>
        <Image
          src="/brand/lingyu-mascot.png"
          alt=""
          aria-hidden="true"
          width={1536}
          height={1024}
          className="hidden h-auto w-[120px] shrink-0 lg:block"
        />
      </section>
      <ProgressTabs />
      {children}
    </div>
  );
}
