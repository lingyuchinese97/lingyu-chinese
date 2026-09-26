/** Từ chối lời mời chia sẻ ngữ pháp. POST → { rejected: true }. */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { rejectShare } from "@/features/grammar/service";
import { gid, SHARE_GONE } from "../../../_id";

export const dynamic = "force-dynamic";

export const POST = api<{ id: string }>(async ({ user, params }) => {
  await rejectShare(user, gid(params.id, SHARE_GONE));
  revalidatePath("/grammar", "layout");
  return { rejected: true };
});
