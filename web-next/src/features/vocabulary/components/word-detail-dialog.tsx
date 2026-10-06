"use client";
import * as React from "react";
import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { HanziGrid } from "@/components/hanzi-grid";
import { SpeakButton } from "@/components/speak-button";
import { Button } from "@/components/ui/button";
import { StatusBadge, Tag } from "@/components/ui/badges";
import { Dialog, DialogActions, DialogClose, DialogContent } from "@/components/ui/dialog";
import { useT } from "@/i18n/client";
import { StrokeWriter } from "@/features/radicals/components/stroke-writer";
import type { VocabItem } from "../service";

/**
 * Xem chi tiết một từ trong Từ vựng của tôi (nút con mắt): chữ Hán trong ô 米字格, pinyin + nghe, nghĩa, ghi chú, tag,
 * ảnh, cách viết từng chữ (thứ tự nét).
 */
export function WordDetailDialog({ word, onClose }: { word: VocabItem | null; onClose: () => void }) {
  const t = useT();
  const chars = word ? [...new Set([...word.hanzi].filter((c) => /\p{Script=Han}/u.test(c)))] : [];
  return (
    <Dialog open={!!word} onOpenChange={(o) => !o && onClose()}>
      {word ? (
        <DialogContent title={t("vocab.detailTitle", { word: word.hanzi })} icon={<Eye />} wide>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-start gap-4">
              <HanziGrid text={word.hanzi} size={chars.length > 3 ? 56 : 76} />
              {word.imageId ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/images/${word.imageId}`}
                  alt=""
                  className="ml-auto size-[76px] rounded-[14px] border border-border object-cover"
                />
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-[20px] pinyin">{word.pinyin}</span>
              <SpeakButton text={word.hanzi} label={t("vocab.listen", { word: word.hanzi })} />
              <StatusBadge status={word.status} />
            </div>
            <p className="text-[17px] text-navy-900">{word.meaningVi}</p>
            {word.note ? (
              <p className="rounded-[12px] bg-bg px-3 py-2 leading-relaxed break-words whitespace-pre-wrap text-text">
                {word.note}
              </p>
            ) : null}
            {word.tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {word.tags.map((x) => (
                  <Tag key={x} name={x} />
                ))}
              </div>
            ) : null}
            {chars.length ? (
              <section aria-labelledby="wd-write">
                <h3 id="wd-write" className="mb-2 font-bold text-navy-900">
                  {t("vocab.strokeOrder")}
                </h3>
                <div className="flex flex-wrap justify-center gap-4 sm:justify-start">
                  {chars.slice(0, 6).map((c) => (
                    <StrokeWriter key={c} char={c} size={132} />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <DialogActions>
            <Button asChild variant="secondary">
              <Link href={`/vocabulary/${word.id}/edit`}>
                <Pencil />
                {t("vocab.editWord", { word: word.hanzi })}
              </Link>
            </Button>
            <DialogClose asChild>
              <Button variant="solid">{t("common.close")}</Button>
            </DialogClose>
          </DialogActions>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}
