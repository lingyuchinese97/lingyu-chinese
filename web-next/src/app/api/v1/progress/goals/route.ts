/** Mục tiêu học tập. GET · PUT { minutes_day?, lessons_week?, vocab_month? }. */
import { revalidatePath } from "next/cache";
import { api, body } from "@/server/api";
import { getGoals, setGoals } from "@/features/progress/service";
import { goalsSchema } from "@/features/progress/schema";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => getGoals(user.id));

export const PUT = api(async ({ user, req }) => {
  const goals = await setGoals(user.id, goalsSchema.parse(await body(req)));
  revalidatePath("/progress", "layout");
  return goals;
});
