/** POST { text } → { pinyin, meaning, source: "ai"|"gloss", ai } — sinh pinyin + nghĩa Việt cho câu tiếng Trung (xem trước). */
import { api, body } from "@/server/api";
import { assistSchema } from "@/features/speaking/schema";
import { assist } from "@/features/speaking/service";

export const dynamic = "force-dynamic";
export const POST = api(async ({ user, req }) => assist(user.id, assistSchema.parse(await body(req)).text));
