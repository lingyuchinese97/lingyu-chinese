/** Số câu có thể ôn theo tag: `?tags=a,b` (bỏ trống = mọi câu) → { count }. */
import { z } from "zod";
import { api, query } from "@/server/api";
import { countSentencePool } from "@/features/sentences/review-service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user, req }) => {
  const tags = z
    .array(z.string().max(60))
    .max(50)
    .parse(
      (query(req).tags ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  return { count: await countSentencePool(user.id, tags) };
});
