/** Trang chủ Thư viện LingYu: số bộ / từ, bộ nổi bật, mới nhất, chủ đề. */
import { api } from "@/server/api";
import { getLocale } from "@/i18n/server";
import { libraryHome } from "@/features/library/sets";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user }) => libraryHome(user.id, await getLocale()));
