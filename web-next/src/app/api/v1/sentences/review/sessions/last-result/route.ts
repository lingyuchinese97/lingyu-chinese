/** Kết quả bài ôn dịch câu đã nộp gần nhất (hoặc null), kèm `wrongIds` (câu chưa đúng, để ôn lại). */
import { api } from "@/server/api";
import { getLastSentenceResult } from "@/features/sentences/review-service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getLastSentenceResult(user.id));
