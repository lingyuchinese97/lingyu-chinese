/** Yêu thích bộ từ vựng: PUT (thêm) · DELETE (bỏ). */
import { api } from "@/server/api";
import { setIdSchema } from "@/features/library/schema";
import { setFavorite } from "@/features/library/sets";

export const dynamic = "force-dynamic";
type P = { id: string };
export const PUT = api<P>(async ({ user, params }) => setFavorite(user.id, setIdSchema.parse(params.id), null, true));
export const DELETE = api<P>(async ({ user, params }) =>
  setFavorite(user.id, setIdSchema.parse(params.id), null, false),
);
