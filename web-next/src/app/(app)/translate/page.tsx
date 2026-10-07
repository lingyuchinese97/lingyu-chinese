import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Library, Lightbulb, MessagesSquare } from "lucide-react";
import { requireUser } from "@/server/session";
import { getIntlTag, getLocale, getT } from "@/i18n/server";
import { T_ITEMS } from "@/data/translation/items";
import {
  estimateLevel,
  getActiveTranslation,
  localGrammar,
  myGrammarForTranslation,
  translationHistory,
} from "@/features/translation/service";
import { TranslateSetup } from "@/features/translation/components/translate-setup";
import { formatDuration } from "@/features/translation/components/format";
import { FeatureHero } from "@/components/feature-hero";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("translate.title") };
}
export const dynamic = "force-dynamic";

export default async function TranslatePage() {
  const user = await requireUser();
  const t = await getT();
  const tag = await getIntlTag();
  const locale = await getLocale();
  const [level, active, history, myGrammar] = await Promise.all([
    estimateLevel(user.id),
    getActiveTranslation(user.id),
    translationHistory(user.id, 5),
    myGrammarForTranslation(user.id),
  ]);
  const date = new Intl.DateTimeFormat(tag, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex flex-col gap-4">
      <FeatureHero
        id="tr-page-title"
        title={t("translate.title")}
        description={t("translate.subtitle")}
      />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <TranslateSetup
          level={level}
          grammar={localGrammar(locale)}
          myGrammar={myGrammar}
          active={active ? { done: active.questions.filter((q) => q.answered).length, total: active.total } : null}
        />
        <div className="flex min-w-0 flex-col gap-4">
          <nav aria-label={t("translate.bankLink")} className="grid gap-2">
            {[
              {
                href: "/translate/bank",
                icon: Library,
                title: t("translate.bankLink"),
                sub: t("translate.bankLinkSub", { count: T_ITEMS.length }),
                c: "bg-[#FFF3D2] text-[#8A5300]",
              },
              {
                href: "/sentences",
                icon: MessagesSquare,
                title: t("translate.myBank"),
                sub: t("translate.myBankSub"),
                c: "bg-blue-50 text-blue-700",
              },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-3 rounded-[var(--radius-xl)] border border-border bg-white p-3.5 shadow-card outline-none hover:border-[#A9D3F8] focus-visible:[box-shadow:var(--focus-ring)]"
              >
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${l.c}`}>
                  <l.icon className="size-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-navy-900">{l.title}</span>
                  <span className="block text-[13.5px] text-text-2">{l.sub}</span>
                </span>
                <ChevronRight className="size-5 text-text-3" aria-hidden="true" />
              </Link>
            ))}
          </nav>

          <section
            aria-labelledby="tr-history"
            className="rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card"
          >
            <h2 id="tr-history" className="mb-2 font-bold text-navy-900">
              {t("translate.historyTitle")}
            </h2>
            {history.length ? (
              <ul className="grid gap-1.5">
                {history.map((h) => (
                  <li key={h.id}>
                    <Link
                      href={`/translate/result/${h.id}`}
                      aria-label={t("translate.viewResult", { date: date.format(new Date(h.completedAt)) })}
                      className="flex items-center gap-3 rounded-xl px-2 py-2 outline-none hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate hanzi font-semibold text-text" lang="zh">
                          {h.first}
                        </span>
                        <span className="block text-[13px] text-text-2">
                          {t("translate.historyItem", {
                            correct: h.correct,
                            total: h.total,
                            time: formatDuration(h.elapsedSec),
                          })}{" "}
                          · {date.format(new Date(h.completedAt))}
                        </span>
                      </span>
                      <ChevronRight className="size-4 text-text-3" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14.5px] text-text-2">{t("translate.historyEmpty")}</p>
            )}
          </section>

          <section
            aria-labelledby="tr-tips"
            className="rounded-[var(--radius-xl)] border border-[#F6DE9E] bg-[linear-gradient(135deg,#FFF9EA,#FFF3D2)] p-4"
          >
            <h2 id="tr-tips" className="mb-2 flex items-center gap-2 font-bold text-[#8A5300]">
              <Lightbulb className="size-5" aria-hidden="true" />
              {t("translate.tipsTitle")}
            </h2>
            <ul className="grid list-disc gap-1 pl-5 text-[14.5px] text-text">
              <li>{t("translate.tip1")}</li>
              <li>{t("translate.tip2")}</li>
              <li>{t("translate.tip3")}</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
