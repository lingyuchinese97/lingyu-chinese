import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("reading.title") };
}

export default async function ReadingPage() {
  await requireUser();
  const t = await getT();
  return (
    <section className="flex flex-col items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white/95 px-5 py-14 text-center shadow-card">
      <span className="flex size-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <BookOpenText className="size-8" aria-hidden="true" />
      </span>
      <h1 className="text-[26px] font-extrabold text-navy-900">{t("reading.title")}</h1>
      <p className="max-w-[520px] text-text-2">{t("reading.subtitle")}</p>
      <p className="rounded-full bg-amber-50 px-4 py-1.5 text-[14px] font-semibold text-[#8A5300]">
        {t("reading.soon")}
      </p>
    </section>
  );
}
