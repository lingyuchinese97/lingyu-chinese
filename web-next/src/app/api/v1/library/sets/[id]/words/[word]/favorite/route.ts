/** Yêu thích một từ trong bộ: PUT (thêm) · DELETE (bỏ). */
import { api } from "@/server/api";
import { setIdSchema, setWordSchema } from "@/features/library/schema";
import { setFavorite } from "@/features/library/sets";

export const dynamic = "force-dynamic";
type P = { id: string; word: string };
const args = (p: P) => [setIdSchema.parse(p.id), setWordSchema.parse(decodeURIComponent(p.word))] as const;
export const PUT = api<P>(async ({ user, params }) => setFavorite(user.id, ...args(params), true));
export const DELETE = api<P>(async ({ user, params }) => setFavorite(user.id, ...args(params), false));
