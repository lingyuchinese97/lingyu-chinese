/** Lịch sử học tập (mới nhất trước): `?kind=&days=1–365&limit=1–500`. */
import { api, query } from "@/server/api";
import { history } from "@/features/progress/service";
import { historyQuerySchema } from "@/features/progress/schema";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user, req }) => history(user.id, historyQuerySchema.parse(query(req))));
