"use client";
import { BookmarkPlus } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { VocabForm } from "@/features/vocabulary/components/vocab-form";
import { useT } from "@/i18n/client";

/**
 * "Lưu vào Từ vựng" từ bài chép: dùng lại NGUYÊN form Từ vựng (chữ Hán, pinyin + gợi ý, bộ thủ, nghĩa, ghi chú, thẻ)
 * và lưu vào kho Từ vựng chung — không có kho từ riêng cho Luyện nghe.
 */
export function SaveVocabDialog({
  word,
  onClose,
  vocabTags,
}: {
  word: string | null;
  onClose: () => void;
  vocabTags: string[];
}) {
  const t = useT();
  return (
    <Dialog open={word !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        wide
        icon={<BookmarkPlus />}
        title={t("listening.vocab.title")}
        description={t("listening.vocab.sub")}
      >
        {word !== null ? (
          <VocabForm
            key={word}
            word={null}
            allTags={vocabTags}
            embedded
            initial={{ hanzi: [...word].filter((c) => /\p{Script=Han}/u.test(c)).join("") || word }}
            onCancel={onClose}
            onDone={({ hanzi }) => {
              toast.success(t("listening.vocab.saved", { word: hanzi }));
              onClose();
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
