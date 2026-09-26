/** Các lần mình đã chia sẻ gần đây. GET. */
import { api } from "@/server/api";
import { listSentVocab } from "@/features/vocabulary/share-service";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user }) => listSentVocab(user.id));
