/** Admin: ảnh gợi ý từ Wikimedia (Wikidata + Commons) cho một từ. GET ?q=<chữ Hán> → { items: [{ title, thumb, credit }] }. */
import { api, query } from "@/server/api";
import { suggestSchema } from "@/features/library/schema";
import { suggestImages } from "@/features/library/image-suggest";
import { assertAdmin } from "../../_guard";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user, req }) => {
  assertAdmin(user);
  return { items: await suggestImages(suggestSchema.parse(query(req)).q) };
});
