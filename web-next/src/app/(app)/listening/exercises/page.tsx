import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { exerciseListSchema } from "@/features/listening/schema";
import { listExercises } from "@/features/listening/service";
import { ExercisesView } from "@/features/listening/components/exercises-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("listening.mine.title") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function MyExercisesPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  // Link cũ ?id=… → trang chi tiết riêng.
  const old = z.uuid().safeParse(one(sp.id));
  if (old.success) redirect(`/listening/exercises/${old.data}`);
  const params = exerciseListSchema.parse({
    q: one(sp.q) ?? "",
    tag: one(sp.tag) ?? "",
    sort: one(sp.sort) ?? "newest",
    page: one(sp.page) ?? 1,
  });
  const data = await listExercises(user.id, params);
  return <ExercisesView data={data} params={{ ...params, page: data.page }} />;
}
