/** Một bài của tôi (đang làm hoặc đã xong — đã xong thì có đủ đáp án + giải thích). Bài của người khác → 404. */
import { api } from "@/server/api";
import { getTranslationSession } from "@/features/translation/service";
import { sessId, type P } from "../../_ids";

export const dynamic = "force-dynamic";

export const GET = api<P>(async ({ user, params }) => getTranslationSession(user.id, sessId(params.id)));
