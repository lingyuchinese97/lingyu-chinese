import type { Metadata } from "next";
import { LogoutButton } from "@/components/auth/logout-button";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Trang chủ" };

export default async function HomePage() {
  const user = await requireUser();
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6">
      <h1 className="text-navy text-2xl font-extrabold">Xin chào, {user.name}!</h1>
      <LogoutButton className="self-start" />
    </main>
  );
}
