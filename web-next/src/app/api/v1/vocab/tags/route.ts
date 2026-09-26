/** Các tag từ vựng của mình kèm số từ. GET. */
import { api } from "@/server/api";
import { listTags } from "@/features/vocabulary/service";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user }) => listTags(user.id));
