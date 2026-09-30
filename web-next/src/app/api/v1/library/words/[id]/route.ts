/** Thư viện LingYu — chi tiết một từ đã public (nháp / không có → 404). */
import { api } from "@/server/api";
import { getPublicWord } from "@/features/library/service";
import { wordId as wid } from "@/features/library/ids";

export const dynamic = "force-dynamic";
export const GET = api<{ id: string }>(async ({ user, params }) => getPublicWord(user.id, wid(params.id)));
