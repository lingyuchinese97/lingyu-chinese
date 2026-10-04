import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { setIdSchema } from "@/features/library/schema";
import { getSet } from "@/features/library/sets";
import { LibraryError } from "@/features/library/service";
import { LIB_SET_BY_ID } from "@/data/library/vocab-sets";
import { SetDetailView } from "@/features/library/components/hub/set-detail";

type P = Promise<{ set: string }>;
type SP = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: P }): Promise<Metadata> {
  const t = await getT();
  const s = LIB_SET_BY_ID.get((await params).set);
  const l = await getLocale();
  return { title: s ? `${l === "en" ? s.titleEn : s.titleVi} · ${t("libhub.title")}` : t("libhub.title") };
}
export const dynamic = "force-dynamic";

async function load(userId: string, id: string) {
  const parsed = setIdSchema.safeParse(id);
  if (!parsed.success) return null;
  try {
    return await getSet(userId, parsed.data, await getLocale());
  } catch (e) {
    if (e instanceof LibraryError) return null;
    throw e;
  }
}

/** Một bộ từ vựng: danh sách từ + luyện tập. */
export default async function SetPage({ params, searchParams }: { params: P; searchParams: SP }) {
  const user = await requireUser();
  const data = await load(user.id, (await params).set);
  if (!data) notFound();
  const tab = (await searchParams).tab === "practice" ? "practice" : "list";
  return <SetDetailView key={data.id} data={data} initialTab={tab} />;
}
