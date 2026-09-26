"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AuthError, currentUserOrThrow } from "@/server/session";
import { goalsSchema } from "./schema";
import { dailyMinutes, setGoals } from "./service";

type R<T> = { ok: true; data: T } | { ok: false; message: string };

export async function setGoalsAction(input: unknown): Promise<R<Awaited<ReturnType<typeof setGoals>>>> {
  try {
    const u = await currentUserOrThrow();
    const goals = await setGoals(u.id, goalsSchema.parse(input));
    revalidatePath("/progress", "layout");
    return { ok: true, data: goals };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, message: e.issues[0]?.message ?? "Dữ liệu không hợp lệ." };
    if (e instanceof AuthError) return { ok: false, message: e.message };
    return { ok: false, message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
  }
}

export async function dailyAction(days: number) {
  const u = await currentUserOrThrow();
  return dailyMinutes(u.id, [7, 30, 90].includes(days) ? days : 7);
}
