/** Một câu mẫu: bản dịch, cách nói khác, phân tích từ, cấu trúc ngữ pháp. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { getBankItem } from "@/features/translation/service";
import type { P } from "../../_ids";

export const dynamic = "force-dynamic";

export const GET = api<P>(async ({ params }) => getBankItem(params.id, await getLocale()));
