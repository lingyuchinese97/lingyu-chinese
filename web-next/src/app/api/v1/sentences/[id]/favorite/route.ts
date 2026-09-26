/** Bật / tắt Yêu thích cho một câu. POST → { isFavorite }. */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { toggleSentenceFavorite } from "@/features/sentences/service";
import { sentId, type P } from "../../_ids";

export const dynamic = "force-dynamic";

export const POST = api<P>(async ({ user, params }) => {
  const isFavorite = await toggleSentenceFavorite(user.id, sentId(params.id));
  revalidatePath("/sentences", "layout");
  return { isFavorite };
});
