import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { radicalByNum, radicalExamples, radicalName } from "@/lib/radicals";
import { getLocale, getT } from "@/i18n/server";
import { isKnown } from "@/features/radicals/service";
import { listVocab } from "@/features/vocabulary/service";
import { RadicalDetail } from "@/features/radicals/components/radical-detail";

type P = Promise<{ num: string }>;
const parse = (s: string) => (/^\d{1,3}$/.test(s) ? radicalByNum(Number(s)) : null);

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const r = parse((await params).num);
  const t = await getT();
  const locale = await getLocale();
  return {
    title: r ? t("radicals.metaTitle", { name: radicalName(r, locale), char: r.char }) : t("radicals.notFound"),
  };
}

export default async function RadicalPage({ params }: { params: P }) {
  const user = await requireUser();
  const t = await getT();
  const locale = await getLocale();
  const r = parse((await params).num);
  if (!r) notFound();
  const [known, vocab] = await Promise.all([
    isKnown(user.id, r.num),
    listVocab(user.id, { q: "", tag: "", radical: r.num, sort: "newest", page: 1 }, 12),
  ]);
  const chars = radicalExamples(r.num);
  const near = (n: number) => {
    const x = radicalByNum(n);
    return x ? { num: x.num, char: x.char, name: radicalName(x, locale) } : null;
  };
  return (
    <>
      <Breadcrumb back="/radicals" section={t("radicals.title")} current={`${r.num}. ${radicalName(r, locale)}`} />
      <RadicalDetail
        r={r}
        known={known}
        examples={chars.slice(0, 12)}
        moreChars={chars.slice(12, 60).map((c) => c.char)}
        prev={near(r.num - 1)}
        next={near(r.num + 1)}
        words={vocab.items.map((v) => ({ id: v.id, hanzi: v.hanzi, pinyin: v.pinyin, meaningVi: v.meaningVi }))}
        wordTotal={vocab.total}
      />
    </>
  );
}
