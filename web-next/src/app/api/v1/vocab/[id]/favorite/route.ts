/** Bật / tắt Yêu thích cho một từ. POST → { isFavorite }. */
import { z } from "zod";
import { api } from "@/server/api";
import { toggleFavorite, VocabError } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";

export const POST = api<{ id: string }>(async ({ user, params }) => {
  const id = z.uuid().safeParse(params.id);
  if (!id.success) throw new VocabError("not-found", "Không tìm thấy từ vựng.");
  const r = await toggleFavorite(user.id, id.data);
  return { isFavorite: r.isFavorite };
});
