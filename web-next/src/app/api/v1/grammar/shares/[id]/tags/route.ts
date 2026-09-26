/** Thẻ của người gửi trên ngữ pháp được chia sẻ (để chọn giữ khi chấp nhận). Chỉ với lời mời đang chờ của mình. */
import { api } from "@/server/api";
import { shareSourceTags } from "@/features/grammar/service";
import { gid, SHARE_GONE } from "../../../_id";

export const dynamic = "force-dynamic";

export const GET = api<{ id: string }>(async ({ user, params }) =>
  shareSourceTags(user.id, gid(params.id, SHARE_GONE)),
);
