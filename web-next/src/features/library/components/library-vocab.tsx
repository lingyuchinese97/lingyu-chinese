"use client";
import { HanziGrid } from "@/components/hanzi-grid";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookMarked,
  Bookmark,
  BookOpen,
  Heart,
  House,
  Lightbulb,
  ListChecks,
  Plus,
  Search,
  Volume2,
} from "lucide-react";
import { Select, inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import { T_TOPICS } from "@/data/translation/items";
import { LIB_LEVELS, type LibListParams } from "../schema";
import type { PublicWord, PublicWordList } from "../service";
import { saveLibraryWordToMineAction } from "../actions";
import { FeatureHero } from "@/components/feature-hero";

/** Thư viện LingYu → Từ vựng: HSK 1–6, tìm / chủ đề / sắp xếp, danh sách (trái) + chi tiết (phải). */
export function LibraryVocab({
  data,
  params,
  selected,
  picked,
}: {
  data: PublicWordList;
  params: LibListParams;
  selected: PublicWord | null;
  /** Người dùng đã bấm chọn một từ (điện thoại: chỉ hiện chi tiết). */
  picked: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = React.useTransition();
  const [q, setQ] = React.useState(params.q);
  const [saved, setSaved] = React.useState<Set<string>>(
    () => new Set(data.items.filter((x) => x.saved).map((x) => x.id)),
  );

  const href = React.useCallback(
    (patch: Partial<LibListParams & { w: string }>) => {
      const n = { ...params, w: "", ...patch };
      const sp = new URLSearchParams();
      if (n.hsk !== 1) sp.set("hsk", String(n.hsk));
      if (n.topic) sp.set("topic", n.topic);
      if (n.sort !== "order") sp.set("sort", n.sort);
      if (n.q.trim()) sp.set("q", n.q.trim());
      if (n.w) sp.set("w", n.w);
      return `${pathname}${sp.size ? `?${sp}` : ""}`;
    },
    [params, pathname],
  );
  const go = React.useCallback(
    (patch: Partial<LibListParams>) => startTransition(() => router.replace(href(patch), { scroll: false })),
    [href, router],
  );
  React.useEffect(() => {
    if (q === params.q) return;
    const id = setTimeout(() => go({ q }), 300);
    return () => clearTimeout(id);
  }, [q, params.q, go]);

  async function save(id: string, hanzi: string) {
    if (saved.has(id)) return void toast.success(t("library.alreadySaved", { word: hanzi }));
    const r = await saveLibraryWordToMineAction(id);
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setSaved((s) => new Set(s).add(id));
    toast.success(r.data.added ? t("library.savedToast", { word: hanzi }) : t("library.alreadySaved", { word: hanzi }));
  }

  const index = selected ? data.items.findIndex((x) => x.id === selected.id) + 1 : 0;
  const levelLabel = params.hsk ? t("library.levelCount", { level: params.hsk, count: data.total }) : null;

  return (
    <>
      <nav aria-label={t("library.crumbRoot")} className="flex items-center gap-2 text-[15px] text-text-2">
        <Link href="/home" aria-label={t("shell.nav.home")} className="text-navy hover:text-blue-600">
          <House className="size-[18px]" />
        </Link>
        <span aria-hidden="true">/</span>
        <Link href="/library" className="hover:text-blue-600">
          {t("library.crumbRoot")}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="font-semibold text-navy-900">
          {t("libhub.oldWords")}
        </span>
      </nav>

      <FeatureHero
        id="lv-title"
        title={t("library.vocabTitle")}
        description={t("library.vocabSub")}
        actions={
          <div className="flex w-full max-w-[680px] flex-col gap-2.5">
            <label className="relative block">
              <span className="sr-only">{t("library.searchPlaceholder")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("library.searchPlaceholder")}
                autoComplete="off"
                className={cn(inputClass, "bg-white pl-11")}
              />
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:ml-auto sm:w-[480px]">
              <label>
                <span className="sr-only">{t("library.topicFilter")}</span>
                <Select value={params.topic} onChange={(e) => go({ topic: e.target.value as LibListParams["topic"] })}>
                  <option value="">{t("library.topicAll")}</option>
                  {T_TOPICS.map((x) => (
                    <option key={x} value={x}>
                      {t("library.topicFilter")}: {t(`translate.topics.${x}`)}
                    </option>
                  ))}
                </Select>
              </label>
              <label>
                <span className="sr-only">{t("library.sortLabel")}</span>
                <Select value={params.sort} onChange={(e) => go({ sort: e.target.value as LibListParams["sort"] })}>
                  <option value="order">{t("library.sortOrder")}</option>
                  <option value="newest">{t("library.sortNewest")}</option>
                  <option value="pinyin">{t("library.sortPinyin")}</option>
                </Select>
              </label>
            </div>
          </div>
        }
      />

      <div
        role="group"
        aria-label={t("library.levels")}
        className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 md:mx-0 md:px-0"
      >
        {LIB_LEVELS.map((lv) => (
          <button
            key={lv}
            type="button"
            aria-pressed={params.hsk === lv}
            onClick={() => go({ hsk: lv })}
            className={cn(
              "min-h-11 min-w-[108px] shrink-0 rounded-[14px] border px-5 text-[15px] font-semibold outline-none focus-visible:shadow-[var(--focus-ring)]",
              params.hsk === lv
                ? "border-blue-600 bg-blue-600 text-white shadow-cta"
                : "border-border bg-white text-navy hover:border-[#A9D3F8]",
            )}
          >
            HSK {lv}
          </button>
        ))}
      </div>

      <div
        aria-busy={pending || undefined}
        className={cn(
          "grid items-start gap-4 transition-opacity lg:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.6fr)]",
          pending && "opacity-60",
        )}
      >
        <section
          aria-label={t("library.listLabel")}
          className={cn(
            "rounded-[var(--radius-xl)] border border-border bg-white p-3 shadow-card md:p-4",
            picked && "max-lg:hidden",
          )}
        >
          {levelLabel ? <h2 className="px-1 pb-2 text-[17px] font-bold text-navy-900">{levelLabel}</h2> : null}
          {data.items.length === 0 ? (
            <p className="px-2 py-10 text-center text-text-2">
              {params.q || params.topic ? t("library.noMatch") : t("library.emptyLevel")}
            </p>
          ) : (
            <ol className="flex flex-col">
              {data.items.map((w, i) => {
                const on = w.id === selected?.id;
                const isSaved = saved.has(w.id);
                return (
                  <li
                    key={w.id}
                    className={cn(
                      "flex items-center gap-2 border-b border-[#EDF3F9] last:border-b-0",
                      on && "rounded-[14px] border-transparent bg-[#EAF3FF]",
                    )}
                  >
                    <Link
                      href={href({ w: w.id })}
                      replace
                      scroll={false}
                      aria-current={on ? "true" : undefined}
                      className="grid min-w-0 flex-1 grid-cols-[32px_auto_minmax(0,0.8fr)_minmax(0,1.4fr)] items-center gap-3 px-2 py-2.5 outline-none focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <span className="flex size-7 items-center justify-center rounded-full bg-[#F1F5FA] text-[13px] text-text-2">
                        {i + 1}
                      </span>
                      <span lang="zh" className="hanzi text-[22px] font-bold text-navy-900">
                        {w.hanzi}
                      </span>
                      <span className="truncate text-[14.5px] text-text-2">{w.pinyin}</span>
                      <span className="truncate text-[14.5px] text-text">{w.meaningVi}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => save(w.id, w.hanzi)}
                      aria-pressed={isSaved}
                      aria-label={
                        isSaved ? t("library.savedWord", { word: w.hanzi }) : t("library.saveWord", { word: w.hanzi })
                      }
                      className="mr-1 flex size-9 shrink-0 items-center justify-center rounded-full text-blue-600 outline-none hover:bg-blue-50 focus-visible:shadow-[var(--focus-ring)]"
                    >
                      <Bookmark className={cn("size-5", isSaved && "fill-blue-600")} />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {selected ? (
          <Detail
            w={selected}
            index={index}
            saved={saved.has(selected.id)}
            onSave={() => save(selected.id, selected.hanzi)}
            backHref={href({})}
            picked={picked}
          />
        ) : data.items.length ? (
          <p className="rounded-[var(--radius-xl)] border border-border bg-white p-10 text-center text-text-2 max-lg:hidden">
            {t("library.pick")}
          </p>
        ) : null}
      </div>
    </>
  );
}

function Detail({
  w,
  index,
  saved,
  onSave,
  backHref,
  picked,
}: {
  w: PublicWord;
  index: number;
  saved: boolean;
  onSave: () => void;
  backHref: string;
  picked: boolean;
}) {
  const t = useT();
  const box = "rounded-[20px] p-4";
  return (
    <article
      aria-labelledby="lv-word"
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white p-4 shadow-card md:p-5",
        !picked && "max-lg:hidden",
      )}
    >
      {picked ? (
        <Link
          href={backHref}
          replace
          scroll={false}
          className="inline-flex items-center gap-1.5 self-start font-semibold text-blue-700 lg:hidden"
        >
          <ArrowLeft className="size-5" />
          {t("library.backToList")}
        </Link>
      ) : null}
      <header className="flex items-start gap-4">
        {index ? (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#FFE4E8] text-[22px] font-bold text-[#E0305A]">
            {index}
          </span>
        ) : null}
        <h2 id="lv-word">
          <HanziGrid text={w.hanzi} size={88} />
        </h2>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-2 pt-2">
          <span className="flex items-center gap-2">
            <span className="text-[26px] font-bold text-navy-900">{w.pinyin}</span>
            <SpeakButton text={w.hanzi} label={t("library.listen", { word: w.hanzi })} />
          </span>
          <span className="rounded-[14px] bg-[#FFE4E8] px-4 py-1.5 text-[20px] font-bold text-[#C4284F]">
            {w.meaningVi}
          </span>
          <span className="flex flex-wrap gap-1.5">
            {w.pos ? (
              <span className="rounded-full bg-[#FFF1DC] px-2.5 py-0.5 text-[13px] font-semibold text-[#A85A00]">
                {t(`library.pos.${w.pos as "noun"}`)}
              </span>
            ) : null}
            {w.hskLevel ? (
              <span className="rounded-full bg-[#F0EAFF] px-2.5 py-0.5 text-[13px] font-semibold text-[#6B3FD0]">
                HSK {w.hskLevel}
              </span>
            ) : null}
          </span>
        </div>
        <button
          type="button"
          onClick={onSave}
          aria-pressed={saved}
          aria-label={saved ? t("library.savedWord", { word: w.hanzi }) : t("library.saveWord", { word: w.hanzi })}
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50"
        >
          <Bookmark className={cn("size-6", saved && "fill-blue-600")} />
        </button>
      </header>
      {w.note ? <p className="rounded-xl bg-blue-50 px-3 py-2 text-[14.5px] text-text">{w.note}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        {w.hasImage ? (
          <figure className="flex flex-col gap-1">
            {/* eslint-disable-next-line @next/next/no-img-element -- ảnh từ API riêng (cần đăng nhập, chỉ từ public) */}
            <img
              src={`/api/v1/library/words/${w.id}/image?v=${w.imageVersion ?? ""}`}
              alt=""
              className="h-full max-h-[280px] w-full rounded-[20px] bg-[#FFF8EC] object-contain"
            />
            {w.imageCredit ? (
              <figcaption className="text-right text-[12px] text-text-3">
                {t("library.imageCredit", { credit: w.imageCredit })}
              </figcaption>
            ) : null}
          </figure>
        ) : (
          <div
            aria-hidden="true"
            className="flex min-h-[200px] items-center justify-center rounded-[20px] bg-[linear-gradient(135deg,#FFF6E6,#FFEDEF)]"
          >
            <span lang="zh" className="hanzi text-[110px] font-bold text-[#E0302F]/80">
              {w.hanzi}
            </span>
          </div>
        )}
        {w.components.length ? (
          <section aria-labelledby="lv-comp" className={cn(box, "bg-[#F2F7FE]")}>
            <h3 id="lv-comp" className="mb-3 flex items-center gap-2 font-bold text-navy-900">
              <Volume2 className="size-5 text-blue-600" aria-hidden="true" />
              {t("library.viewComponents")}
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {w.components.map((c, i) => (
                <React.Fragment key={i}>
                  {i ? <Plus className="size-5 text-navy" aria-hidden="true" /> : null}
                  <span className="flex min-w-[96px] flex-col items-center rounded-2xl bg-white px-3 py-3 text-center">
                    <span lang="zh" className="hanzi text-[34px] leading-tight">
                      {c.char}
                    </span>
                    <span className="text-[14.5px] text-text-2">{c.pinyin}</span>
                    <span className="text-[14.5px] text-text">{c.meaning.split(" · ").pop()}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          </section>
        ) : null}
        {w.mnemonic ? (
          <section aria-labelledby="lv-mn" className={cn(box, "bg-[#FFF8E6]")}>
            <h3 id="lv-mn" className="mb-2 flex items-center gap-2 font-bold text-[#8A5A00]">
              <Lightbulb className="size-5 text-amber" aria-hidden="true" />
              {t("library.viewMnemonic")}
            </h3>
            <p className="text-[15.5px] leading-relaxed text-text">{w.mnemonic}</p>
          </section>
        ) : null}
        {w.association ? (
          <section aria-labelledby="lv-as" className={cn(box, "bg-[#FFF0F3]")}>
            <h3 id="lv-as" className="mb-2 flex items-center gap-2 font-bold text-[#C4284F]">
              <Heart className="size-5" aria-hidden="true" />
              {t("library.viewAssociation")}
            </h3>
            <p className="text-[15.5px] leading-relaxed text-text">{w.association}</p>
          </section>
        ) : null}
        {w.examples.length ? (
          <section aria-labelledby="lv-ex" className={cn(box, "bg-[#EFFAF3]")}>
            <h3 id="lv-ex" className="mb-2 flex items-center gap-2 font-bold text-[#157A45]">
              <ListChecks className="size-5" aria-hidden="true" />
              {t("library.viewExamples")}
            </h3>
            <ol className="flex flex-col gap-2">
              {w.examples.map((e, i) => (
                <li key={i} className="flex items-start gap-3 rounded-2xl bg-white px-3 py-2.5">
                  <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E4F6EC] text-[11px] font-bold text-[#157A45]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p lang="zh" className="hanzi text-[17px] font-bold text-navy-900">
                      {e.zh}
                    </p>
                    {e.py ? <p className="text-[13.5px] text-text-2">{e.py}</p> : null}
                  </div>
                  <p className="min-w-0 flex-1 text-[14.5px] text-text">{e.vi}</p>
                  <SpeakButton text={e.zh} label={t("library.listen", { word: e.zh })} />
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {w.related.length ? (
          <section aria-labelledby="lv-rel" className={cn(box, "bg-[#F4F2FE]")}>
            <h3 id="lv-rel" className="mb-2 flex items-center gap-2 font-bold text-[#4F3FB8]">
              <BookMarked className="size-5" aria-hidden="true" />
              {t("library.viewRelated")}
            </h3>
            <ul className="flex flex-col gap-1.5">
              {w.related.map((r, i) => (
                <li key={i} className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] items-baseline gap-3">
                  <span lang="zh" className="hanzi text-[17px] font-bold text-navy-900">
                    • {r.zh}
                  </span>
                  <span className="truncate text-[14.5px] text-text-2">{r.py}</span>
                  <span className="truncate text-[14.5px] text-text">{r.vi}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {w.grammar.length ? (
          <section aria-labelledby="lv-gr" className={cn(box, "bg-[#FFF6EA] md:col-span-2")}>
            <h3 id="lv-gr" className="mb-2 flex items-center gap-2 font-bold text-[#A85A00]">
              <BookOpen className="size-5" aria-hidden="true" />
              {t("library.viewGrammar")}
            </h3>
            <ul className="flex flex-col gap-2">
              {w.grammar.map((g, i) => (
                <li key={i} className="flex flex-wrap items-center gap-3 rounded-2xl bg-white px-3 py-2.5">
                  <span lang="zh" className="rounded-lg bg-[#FFF1DC] px-3 py-1 hanzi font-bold text-[#A85A00]">
                    {g.structure}
                  </span>
                  <span className="min-w-0 flex-1 text-[14.5px] text-text">{g.explain}</span>
                  {g.example ? (
                    <span lang="zh" className="hanzi text-[14.5px] text-text-2">
                      {g.example}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
