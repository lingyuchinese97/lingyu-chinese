/**
 * Một ngữ pháp. GET: chủ sở hữu xem đầy đủ (có ghi chú cá nhân); người nhận có lời mời đang chờ xem bản xem trước
 * (`?share=` id lời mời, không có ghi chú cá nhân); người khác → 404. PUT: sửa toàn bộ · DELETE: xoá (chỉ chủ sở hữu).
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body, query } from "@/server/api";
import { grammarInputSchema } from "@/features/grammar/schema";
import { deleteGrammar, getOwnGrammar, updateGrammar, viewGrammar } from "@/features/grammar/service";
import { gid } from "../_id";

export const dynamic = "force-dynamic";
type P = { id: string };

export const GET = api<P>(async ({ user, req, params }) => {
  const share = z.uuid().safeParse(query(req).share);
  return viewGrammar(user.id, gid(params.id), share.success ? share.data : undefined);
});

export const PUT = api<P>(async ({ user, req, params }) => {
  const id = gid(params.id);
  await updateGrammar(user.id, id, grammarInputSchema.parse(await body(req)));
  revalidatePath("/grammar", "layout");
  return getOwnGrammar(user.id, id);
});

export const DELETE = api<P>(async ({ user, params }) => {
  await deleteGrammar(user.id, gid(params.id));
  revalidatePath("/grammar", "layout");
  return { deleted: true };
});
