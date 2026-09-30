/** Lưu / bỏ lưu bài đọc: `{ saved: boolean }`. */
import { z } from "zod";
import { api, body } from "@/server/api";
import { setSaved } from "@/features/reading/service";

export const dynamic = "force-dynamic";
type P = { id: string };

export const PUT = api<P>(async ({ user, req, params }) =>
  setSaved(user.id, params.id, z.object({ saved: z.boolean() }).parse(await body(req)).saved),
);
