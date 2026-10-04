"use client";
import * as React from "react";
import { Check, Loader2, Plus, Sparkles } from "lucide-react";
import { toast } from "@/components/ui/toaster";
import { useT } from "@/i18n/client";
import { createManyAction } from "@/features/vocabulary/actions";
import type { ClientTranslationQuestion } from "../service";

/** Tag gắn cho từ thêm từ màn luyện dịch. */
const TAG = "Luyện dịch";

/**
 * Từ mới của câu đang làm (chưa có trong Từ vựng của tôi): pinyin + nghĩa, nút thêm nhanh vào kho.
 * Dịch sang tiếng Trung: chỉ báo số từ mới cho tới khi xem gợi ý / trả lời (không lộ đáp án).
 */
export function NewWords({ q }: { q: ClientTranslationQuestion }) {
  const t = useT();
  const [added, setAdded] = React.useState<Set<string>>(() => new Set());
  const [busy, setBusy] = React.useState("");
  if (!q.newWordCount) return null;

  async function add(w: { zh: string; py: string; meaning: string }) {
    setBusy(w.zh);
    const r = await createManyAction([{ hanzi: w.zh, pinyin: w.py, meaningVi: w.meaning, tags: [TAG] }]);
    setBusy("");
    if (!r.ok) return void toast.error(t.maybe(r.message));
    setAdded((s) => new Set(s).add(w.zh));
    toast.success(
      r.data.added.length ? t("translate.newWordAdded", { word: w.zh }) : t("translate.newWordExists", { word: w.zh }),
    );
  }

  return (
    <section
      aria-label={t("translate.newWordsTitle", { count: q.newWordCount })}
      className="rounded-2xl border border-[#D9E8FB] bg-[#F7FBFF] p-3.5 text-[14.5px]"
    >
      <p className="flex items-center gap-1.5 font-bold text-blue-700">
        <Sparkles className="size-4" aria-hidden="true" />
        {t("translate.newWordsTitle", { count: q.newWordCount })}
      </p>
      {q.newWords ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {q.newWords.map((w) => {
            const done = added.has(w.zh);
            return (
              <li key={w.zh} className="flex items-center gap-1.5 rounded-lg bg-white py-1 pr-1 pl-2">
                <span className="hanzi font-semibold" lang="zh">
                  {w.zh}
                </span>
                <span className="pinyin">{w.py}</span>
                {w.meaning ? <span>· {w.meaning}</span> : null}
                {w.meaning ? (
                  <button
                    type="button"
                    onClick={() => add(w)}
                    disabled={done || !!busy}
                    aria-label={
                      done
                        ? t("translate.newWordAddedShort", { word: w.zh })
                        : t("translate.addNewWord", { word: w.zh })
                    }
                    className="flex size-7 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 disabled:text-green-700"
                  >
                    {busy === w.zh ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : done ? (
                      <Check className="size-4" />
                    ) : (
                      <Plus className="size-4" />
                    )}
                  </button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-1 text-text-2">{t("translate.newWordsHidden")}</p>
      )}
    </section>
  );
}
