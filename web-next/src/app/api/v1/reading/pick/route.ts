/** Chọn bài tự động theo trình độ / từ vựng / ngữ pháp: `?level=0–4&type=&topic=&source=auto|vocab|grammar&grammar=` → `{ id, level }`. */
import { api, query } from "@/server/api";
import { pickSchema } from "@/features/reading/schema";
import { pickPassage } from "@/features/reading/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user, req }) => pickPassage(user.id, pickSchema.parse(query(req))));
