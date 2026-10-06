import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { itemListSchema } from "@/features/pronunciation/schema";
import { listItems } from "@/features/pronunciation/items";
import { MyItems } from "@/features/pronunciation/components/my-items";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pronunciation.mine.title") };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Phát âm & Biến điệu của tôi: từ / âm tự nhập hoặc lưu từ Thư viện LingYu (sửa, thêm tag tự do). */
export default async function MyPronunciationPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const params = itemListSchema.parse({
    q: one(sp.q) ?? "",
    tag: one(sp.tag) ?? "",
    from: one(sp.from) ?? "all",
    sort: one(sp.sort) ?? "updated",
  });
  return <MyItems key={JSON.stringify({ ...params, q: "" })} data={await listItems(user.id, params)} params={params} />;
}
