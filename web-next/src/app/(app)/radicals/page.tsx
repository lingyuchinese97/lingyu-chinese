import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { RADICALS, searchRadicals } from "@/lib/radicals";
import { knownRadicals } from "@/features/radicals/service";
import { RadicalList, type RadicalFilter } from "@/features/radicals/components/radical-list";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("radicals.title") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const STROKE_GROUPS = [...new Set(RADICALS.map((r) => r.strokes))];

export default async function RadicalsPage({ searchParams }: { searchParams: SP }) {
  const user = await requireUser();
  const sp = await searchParams;
  const strokes = Number(one(sp.strokes));
  const knownParam = one(sp.known);
  const filter: RadicalFilter = {
    q: one(sp.q).trim().slice(0, 60),
    strokes: STROKE_GROUPS.includes(strokes) ? strokes : 0,
    known: knownParam === "known" || knownParam === "unknown" ? knownParam : "",
  };
  const known = new Set(await knownRadicals(user.id));
  let items = searchRadicals(filter.q).map((r) => ({ ...r, known: known.has(r.num) }));
  if (filter.strokes) items = items.filter((r) => r.strokes === filter.strokes);
  if (filter.known) items = items.filter((r) => r.known === (filter.known === "known"));
  const foundChar = [...filter.q].length === 1 && /\p{Script=Han}/u.test(filter.q) ? filter.q : "";
  return (
    <RadicalList
      items={items}
      filter={filter}
      knownCount={known.size}
      strokeGroups={STROKE_GROUPS}
      foundChar={foundChar}
    />
  );
}
