/** Bài ôn đang làm: GET (null nếu không có) · DELETE (bỏ bài). */
import { revalidatePath } from "next/cache";
import { api } from "@/server/api";
import { abandonSession, getActiveSession } from "@/features/review/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getActiveSession(user.id));

export const DELETE = api(async ({ user }) => {
  await abandonSession(user.id);
  revalidatePath("/review");
  return { abandoned: true };
});
