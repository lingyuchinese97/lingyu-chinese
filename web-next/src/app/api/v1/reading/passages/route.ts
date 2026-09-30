/** Danh sách bài đọc: `?level=1–4&type=short|dialogue|article&topic=`. */
import { api, query } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { listSchema } from "@/features/reading/schema";
import { listPassages } from "@/features/reading/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ req }) => listPassages(listSchema.parse(query(req)), await getLocale()));
