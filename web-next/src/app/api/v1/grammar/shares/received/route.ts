/** Lời mời chia sẻ ngữ pháp tôi nhận được và đang chờ trả lời. */
import { api } from "@/server/api";
import { listReceived } from "@/features/grammar/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => listReceived(user.id));
