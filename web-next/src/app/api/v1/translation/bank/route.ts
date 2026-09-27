/** Kho câu mẫu (nội dung học có sẵn, kèm bản dịch và giải thích ngữ pháp): `?type=&level=&grammar=&topic=&q=`. */
import { api, query } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { bankQuerySchema } from "@/features/translation/schema";
import { listBank } from "@/features/translation/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ req }) => listBank(bankQuerySchema.parse(query(req)), await getLocale()));
