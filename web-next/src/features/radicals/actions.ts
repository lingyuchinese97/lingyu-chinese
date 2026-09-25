"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserOrThrow } from "@/server/session";
import { setKnown } from "./service";

export async function setRadicalKnownAction(num: number, known: boolean) {
  const u = await currentUserOrThrow();
  const n = z.number().int().min(1).max(214).parse(num);
  await setKnown(u.id, n, z.boolean().parse(known));
  revalidatePath("/radicals", "layout");
  return { ok: true as const, known };
}
