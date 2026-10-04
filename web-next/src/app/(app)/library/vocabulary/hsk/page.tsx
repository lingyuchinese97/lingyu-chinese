import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { hskListSchema } from "@/features/library/schema";
import { listHskWords } from "@/features/library/sets";
import { HskListView } from "@/features/library/components/hub/hsk-list";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const t = await getT();
  const level = hskListSchema.parse({ level: one((await searchParams).level) }).level;
  return { title: `${t("libhub.hskTitle", { level })} · ${t("libhub.title")}` };
}
export const dynamic = "force-dynamic";

/** Từ vựng theo cấp HSK. */
export default async function HskPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const p = hskListSchema.parse({ level: one(sp.level), q: one(sp.q) ?? "", page: one(sp.page) });
  const data = await listHskWords(user.id, p);
  return <HskListView data={data} q={p.q} />;
}
