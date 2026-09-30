import type { Metadata } from "next";
import { requireAdmin } from "@/server/session";
import { listUsers } from "@/features/admin/service";
import { AdminUsers } from "@/features/admin/components/admin-users";
import { getT } from "@/i18n/server";
import { AdminTabs } from "@/features/library/components/admin-tabs";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("admin.title") };
}

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminPage({ searchParams }: { searchParams: SP }) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const data = await listUsers({ q, page });
  const t = await getT();
  return (
    <>
      <AdminTabs
        active="users"
        labels={{ users: t("library.usersTab"), library: t("library.nav"), nav: t("library.adminTabsLabel") }}
      />
      <AdminUsers data={data} q={q} meId={admin.id} />
    </>
  );
}
