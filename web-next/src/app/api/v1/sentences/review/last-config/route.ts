/** Thiết lập ôn dịch câu gần nhất (hoặc null). */
import { api } from "@/server/api";
import { getLastSentenceConfig } from "@/features/sentences/review-service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getLastSentenceConfig(user.id));
