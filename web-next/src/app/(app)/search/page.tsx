import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireUser } from "@/server/session";
import { search } from "@/features/search/service";
import { getLocale, getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("search.title") };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const t = await getT();
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";
  const r = await search(user.id, q, await getLocale());
  const groups = [
    {
      key: "vocab",
      items: r.vocab.map((x) => ({
        id: x.id,
        href: `/vocabulary?q=${encodeURIComponent(x.hanzi)}`,
        main: x.hanzi,
        sub: [x.pinyin, x.meaningVi].filter(Boolean).join(" · "),
        cn: true,
      })),
    },
    {
      key: "grammar",
      items: r.grammar.map((x) => ({ id: x.id, href: `/grammar/${x.id}`, main: x.title, sub: x.meaning, cn: false })),
    },
    {
      key: "sentences",
      items: r.sentences.map((x) => ({
        id: x.id,
        href: `/sentences?q=${encodeURIComponent(x.chinese)}`,
        main: x.chinese,
        sub: x.vietnamese,
        cn: true,
      })),
    },
    {
      key: "lessons",
      items: r.lessons.map((x) => ({ id: x.id, href: `/lessons/${x.id}`, main: x.title, sub: x.subtitle, cn: false })),
    },
    {
      key: "radicals",
      items: r.radicals.map((x) => ({
        id: String(x.num),
        href: `/radicals/${x.num}`,
        main: `${x.char} · ${x.name}`,
        sub: x.meaning,
        cn: false,
      })),
    },
  ] as const;
  return (
    <section aria-labelledby="sr-title" className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card md:p-5">
        <h1 id="sr-title" className="mb-3 flex items-center gap-2 text-[22px] font-extrabold text-navy-900">
          <Search className="size-6 text-blue-600" aria-hidden="true" />
          {q ? t("search.resultsFor", { q }) : t("search.title")}
        </h1>
        <form role="search" action="/search" className="flex gap-2">
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t("search.label")}</span>
            <input
              type="search"
              name="q"
              defaultValue={q}
              maxLength={100}
              placeholder={t("search.placeholder")}
              className="h-12 w-full rounded-[14px] border border-border bg-white px-4 text-[15px] outline-none focus-visible:border-blue focus-visible:shadow-[var(--focus-ring)]"
            />
          </label>
          <button
            type="submit"
            className="h-12 rounded-[14px] bg-blue-600 px-5 font-semibold text-white outline-none hover:bg-blue-700 focus-visible:shadow-[var(--focus-ring)]"
          >
            {t("search.label")}
          </button>
        </form>
        {q ? <p className="mt-2 text-[14px] text-text-2">{t("search.total", { count: r.total })}</p> : null}
      </div>
      {!q ? (
        <p className="text-center text-text-2">{t("search.prompt")}</p>
      ) : r.total === 0 ? (
        <p className="text-center text-text-2">{t("search.empty")}</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {groups
            .filter((g) => g.items.length)
            .map((g) => (
              <section
                key={g.key}
                aria-labelledby={`sr-${g.key}`}
                className="rounded-[var(--radius-xl)] border border-border bg-white/95 p-4 shadow-card"
              >
                <h2 id={`sr-${g.key}`} className="mb-2 text-[17px] font-bold text-navy-900">
                  {t(`search.${g.key}`)}
                </h2>
                <ul className="flex flex-col divide-y divide-border">
                  {g.items.map((x) => (
                    <li key={x.id}>
                      <Link href={x.href} className="flex flex-col rounded-[10px] px-2 py-2 hover:bg-[#F7FBFF]">
                        <span
                          className={x.cn ? "hanzi text-[20px] font-bold text-navy-900" : "font-semibold text-navy-900"}
                          lang={x.cn ? "zh" : undefined}
                        >
                          {x.main}
                        </span>
                        {x.sub ? <span className="line-clamp-1 text-[13.5px] text-text-2">{x.sub}</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </section>
  );
}
