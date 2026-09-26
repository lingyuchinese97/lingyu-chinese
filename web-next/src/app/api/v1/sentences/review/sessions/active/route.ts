/** Bài ôn dịch câu đang làm: GET (null nếu không có) · DELETE (bỏ bài). */
import { api } from "@/server/api";
import { abandonSentenceSession, getActiveSentenceSession } from "@/features/sentences/review-service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getActiveSentenceSession(user.id));

export const DELETE = api(async ({ user }) => {
  await abandonSentenceSession(user.id);
  return { abandoned: true };
});
