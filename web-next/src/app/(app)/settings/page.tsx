import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { SettingsView } from "@/features/account/components/settings-view";

export const metadata: Metadata = { title: "Cài đặt" };

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsView user={{ name: user.name, email: user.email, role: user.role }} />;
}
