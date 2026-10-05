/** Yêu thích bài ngữ pháp: PUT (thêm) · DELETE (bỏ). */
import { api } from "@/server/api";
import { setIdSchema } from "@/features/library/schema";
import { setLibGrammarFavorite } from "@/features/library/grammar";

export const dynamic = "force-dynamic";
type P = { id: string };
export const PUT = api<P>(async ({ user, params }) =>
  setLibGrammarFavorite(user.id, setIdSchema.parse(params.id), true),
);
export const DELETE = api<P>(async ({ user, params }) =>
  setLibGrammarFavorite(user.id, setIdSchema.parse(params.id), false),
);
