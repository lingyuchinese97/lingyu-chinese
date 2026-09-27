import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { listBank, localGrammar } from "@/features/translation/service";
import { BankList } from "@/features/translation/components/bank-list";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("translate.bankTitle") };
}

export default async function TranslateBankPage({ searchParams }: { searchParams: Promise<{ grammar?: string }> }) {
  await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const { grammar } = await searchParams;
  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb back="/translate" section={t("translate.title")} current={t("translate.bankTitle")} />
      <header>
        <h1 className="text-[26px] font-extrabold text-navy-900">{t("translate.bankTitle")}</h1>
        <p className="text-[15.5px] text-text-2">{t("translate.bankSubtitle")}</p>
      </header>
      <BankList
        items={listBank({}, locale)}
        grammar={localGrammar(locale).map((g) => ({ id: g.id, name: g.name }))}
        initialGrammar={typeof grammar === "string" ? grammar.slice(0, 40) : undefined}
      />
    </div>
  );
}
