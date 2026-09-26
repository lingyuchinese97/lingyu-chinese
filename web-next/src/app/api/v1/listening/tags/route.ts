/** Thẻ của bài làm luyện nghe và số bài mỗi thẻ. */
import { api } from "@/server/api";
import { listListeningTags } from "@/features/listening/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => listListeningTags(user.id));
