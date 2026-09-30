/** Một bài đọc (pinyin từng chữ, bản dịch, từ khoá, ngữ pháp, câu hỏi — KHÔNG có đáp án) + đã lưu hay chưa. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { getPassage } from "@/features/reading/service";

export const dynamic = "force-dynamic";
type P = { id: string };

export const GET = api<P>(async ({ user, params }) => getPassage(user.id, params.id, await getLocale()));
