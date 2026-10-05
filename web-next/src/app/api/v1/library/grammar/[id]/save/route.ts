/** Lưu bài vào Ngữ pháp của tôi (tag "Thư viện LingYu" + HSK). POST → { added, id? }; đã lưu rồi → { added: false }. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { setIdSchema } from "@/features/library/schema";
import { saveLibGrammarToMine } from "@/features/library/grammar";

export const dynamic = "force-dynamic";
export const POST = api<{ id: string }>(async ({ user, params }) =>
  saveLibGrammarToMine(user.id, setIdSchema.parse(params.id), await getLocale()),
);
