/**
 * Nộp một phần của bài học: POST { answers: (0–3 | null)[] } — chỉ số đáp án đã chọn cho từng câu, theo thứ tự.
 * Server tự chấm theo nội dung bài (không nhận điểm từ client), lưu điểm cao nhất / gần nhất → { score, total }.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { api, body } from "@/server/api";
import { recordSection } from "@/features/lessons/service";

export const dynamic = "force-dynamic";

export const POST = api<{ id: string; section: string }>(async ({ user, req, params }) => {
  const { answers } = z
    .object({ answers: z.array(z.number().int().min(0).max(3).nullable()).max(200) })
    .parse(await body(req));
  const r = await recordSection(user.id, params.id, params.section, answers);
  revalidatePath("/lessons", "layout");
  revalidatePath("/home");
  return r;
});
