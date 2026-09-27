/** Ghi một hoạt động tự luyện chấm trên máy (hiện có: `pronunciation`) → 201 { recorded: true }. */
import { api, body } from "@/server/api";
import { recordActivity } from "@/features/progress/service";
import { clientActivitySchema } from "@/features/progress/schema";
import { db } from "@/server/db/client";

export const dynamic = "force-dynamic";

export const POST = api(
  async ({ user, req }) => {
    await recordActivity(db, user.id, clientActivitySchema.parse(await body(req)));
    return { recorded: true };
  },
  { status: 201 },
);
