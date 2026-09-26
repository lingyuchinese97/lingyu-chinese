/** Tag của kho câu và số câu `[{ id, name, count }]`. */
import { api } from "@/server/api";
import { listSentenceTags } from "@/features/sentences/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => listSentenceTags(user.id));
