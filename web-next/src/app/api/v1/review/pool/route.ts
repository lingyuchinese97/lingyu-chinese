/** Số từ có thể ôn theo tag: `GET /api/v1/review/pool?tags=a,b` (bỏ trống = mọi từ). */
import { z } from "zod";
import { api, query } from "@/server/api";
import { countPool } from "@/features/review/service";

export const dynamic = "force-dynamic";
const tagsSchema = z.array(z.string().trim().min(1).max(24)).max(50);

export const GET = api(async ({ user, req }) => {
  const raw = query(req).tags ?? "";
  const tags = tagsSchema.parse(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
  return { count: await countPool(user.id, tags) };
});
