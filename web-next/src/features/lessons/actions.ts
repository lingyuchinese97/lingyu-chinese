"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { currentUserOrThrow } from "@/server/session";
import { LessonError, recordSection } from "./service";

const slug = z.string().regex(/^[a-z0-9-]{1,40}$/);

export async function submitSectionAction(lessonId: string, sectionId: string, answers: (number | null)[]) {
  try {
    const u = await currentUserOrThrow();
    const r = await recordSection(
      u.id,
      slug.parse(lessonId),
      slug.parse(sectionId),
      z.array(z.number().int().min(0).max(3).nullable()).max(200).parse(answers),
    );
    revalidatePath("/lessons", "layout");
    revalidatePath("/home");
    return { ok: true as const, data: r };
  } catch (e) {
    return {
      ok: false as const,
      message: e instanceof LessonError ? e.message : "Không lưu được kết quả. Vui lòng thử lại.",
    };
  }
}
