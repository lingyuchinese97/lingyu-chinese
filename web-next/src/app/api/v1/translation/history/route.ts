/** Lịch sử luyện dịch (bài đã nộp, mới nhất trước): `?limit=1–50`. */
import { z } from "zod";
import { api, query } from "@/server/api";
import { translationHistory } from "@/features/translation/service";

export const dynamic = "force-dynamic";
const schema = z.object({ limit: z.coerce.number().int().min(1).max(50).catch(20) });

export const GET = api(async ({ user, req }) => translationHistory(user.id, schema.parse(query(req)).limit));
