"use client";
import * as React from "react";
import { BookmarkPlus, Check, Lightbulb, ListTree, Loader2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { SpeakButton } from "@/components/speak-button";
import { useT } from "@/i18n/client";
import type { LocalItem } from "../service";
import { saveItemToBankAction } from "../actions";

/**
 * Lời giải một câu mẫu: đáp án tham khảo (chữ Hán + pinyin + bản dịch), cách dịch / cách nói khác, giải thích cấu trúc
 * ngữ pháp (công thức + áp vào câu), phân tích từ; nút lưu vào Kho câu của tôi.
 */
export function ItemExplain({ item, idPrefix, compact }: { item: LocalItem; idPrefix: string; compact?: boolean }) {
  const t = useT();
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function save() {
    setSaving(true);
    const r = await saveItemToBankAction(item.id);
    setSaving(false);
    if (!r.ok) return void toast.error(r.message);
    setSaved(true);
    toast.success(t("translate.savedToBank"));
  }

  return (
    <div className="flex flex-col gap-4">
      <section aria-labelledby={`${idPrefix}-ref`} className="rounded-2xl border border-[#CFEFDF] bg-[#F1FBF6] p-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 id={`${idPrefix}-ref`} className="mb-1 text-[13.5px] font-bold tracking-wide text-green-700 uppercase">
              {t("translate.reference")}
            </h3>
            <p className="hanzi text-[22px] leading-snug font-bold text-navy-900 md:text-[24px]" lang="zh">
              {item.zh}
            </p>
            <p className="text-[15px] pinyin">{item.py}</p>
            <p className="mt-1 text-[15px] text-text">{item.translation}</p>
          </div>
          <SpeakButton text={item.zh} label={t("ui.listen", { text: item.zh })} />
        </div>
        {item.accepted.length > 1 || item.alt.length ? (
          <div className="mt-3 grid gap-2 border-t border-[#CFEFDF] pt-3 text-[14.5px] md:grid-cols-2">
            {item.accepted.length > 1 ? (
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-text-2">
                  <Check className="size-4" aria-hidden="true" />
                  {t("translate.alsoAccepted")}
                </p>
                <ul className="mt-1 list-disc pl-5 text-text">
                  {item.accepted.slice(1).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {item.alt.length ? (
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-text-2">
                  <Shuffle className="size-4" aria-hidden="true" />
                  {t("translate.altZh")}
                </p>
                <ul className="mt-1 list-disc pl-5 text-text">
                  {item.alt.map((a) => (
                    <li key={a} className="hanzi" lang="zh">
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section aria-labelledby={`${idPrefix}-gr`}>
        <h3 id={`${idPrefix}-gr`} className="mb-2 flex items-center gap-2 text-[16px] font-bold text-navy-900">
          <Lightbulb className="size-[18px] text-[#C77800]" aria-hidden="true" />
          {t("translate.structure")}
        </h3>
        <ul className="grid gap-2.5">
          {item.grammar.map((g) => (
            <li key={g.id} className="rounded-2xl border border-[#F6DE9E] bg-[#FFF9EA] p-3.5">
              <p className="font-bold text-[#8A5300]">{g.name}</p>
              <p className="mt-1 inline-block rounded-lg bg-white px-2.5 py-1 text-[15px] font-semibold text-navy-900">
                {g.structure}
              </p>
              <p className="mt-1.5 text-[14.5px] text-text">{g.explain}</p>
              <p className="mt-1.5 text-[14.5px] text-text-2">
                <span className="font-semibold">{t("translate.pattern")}: </span>
                <span className="hanzi" lang="zh">
                  {g.pattern}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      {!compact || item.words.length ? (
        <section aria-labelledby={`${idPrefix}-wd`}>
          <h3 id={`${idPrefix}-wd`} className="mb-2 flex items-center gap-2 text-[16px] font-bold text-navy-900">
            <ListTree className="size-[18px] text-blue-600" aria-hidden="true" />
            {t("translate.breakdown")}
          </h3>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
            {item.words.map((w) => (
              <li key={w.zh} className="rounded-xl border border-border bg-white px-3 py-2">
                <span className="hanzi text-[18px] font-bold text-navy-900" lang="zh">
                  {w.zh}
                </span>{" "}
                <span className="text-[14px] pinyin">{w.py}</span>
                <span className="block text-[13.5px] text-text-2">{w.meaning}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <Button variant="secondary" size="sm" className="self-start" disabled={saving || saved} onClick={save}>
        {saving ? <Loader2 className="animate-spin" /> : saved ? <Check /> : <BookmarkPlus />}
        {saved ? t("translate.savedToBank") : t("translate.saveToBank")}
      </Button>
    </div>
  );
}
