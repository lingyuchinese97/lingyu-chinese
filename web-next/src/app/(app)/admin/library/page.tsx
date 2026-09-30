import type { Metadata } from "next";
import { requireAdmin } from "@/server/session";
import { getT } from "@/i18n/server";
import { adminLibListSchema } from "@/features/library/schema";
import { adminListWords } from "@/features/library/service";
import { AdminTabs } from "@/features/library/components/admin-tabs";
import { AdminWordList } from "@/features/library/components/admin-word-list";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("library.adminTitle") };
}
export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdminLibraryPage({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const t = await getT();
  const sp = await searchParams;
  const params = adminLibListSchema.parse({
    q: one(sp.q) ?? "",
    status: one(sp.status) ?? "all",
    page: one(sp.page) ?? 1,
  });
  const data = await adminListWords(params);
  return (
    <>
      <AdminTabs
        active="library"
        labels={{ users: t("library.usersTab"), library: t("library.nav"), nav: t("library.adminTabsLabel") }}
      />
      <AdminWordList data={data} params={{ ...params, page: data.page }} />
    </>
  );
}
