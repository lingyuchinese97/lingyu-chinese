/** Lời mời chia sẻ từ vựng đang chờ mình (kèm danh sách từ để xem trước). GET. */
import { api } from "@/server/api";
import { listReceivedVocab } from "@/features/vocabulary/share-service";

export const dynamic = "force-dynamic";
export const GET = api(async ({ user }) => listReceivedVocab(user.id));
