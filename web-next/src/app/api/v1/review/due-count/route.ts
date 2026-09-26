/** Số thẻ FSRS đến hạn ôn. */
import { api } from "@/server/api";
import { dueCount } from "@/features/review/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => ({ count: await dueCount(user.id) }));
