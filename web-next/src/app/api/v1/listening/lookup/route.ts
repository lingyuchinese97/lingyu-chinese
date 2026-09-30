/**
 * Tra từ bôi vàng: `?words=你好,小雨` (tối đa 50 từ) → `[{ word, pinyin, meaning }]`.
 * `meaning` lấy từ kho Từ vựng của chính người dùng (null nếu chưa có); pinyin tự tạo khi kho chưa có.
 */
import { z } from "zod";
import { api, query } from "@/server/api";
import { lookupWords } from "@/features/listening/service";

export const dynamic = "force-dynamic";
const schema = z.object({ words: z.string().max(2000).default("") });

export const GET = api(async ({ user, req }) =>
  lookupWords(
    user.id,
    schema
      .parse(query(req))
      .words.split(",")
      .map((w) => w.slice(0, 40)),
  ),
);
