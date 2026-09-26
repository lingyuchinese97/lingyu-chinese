import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { SettingsView } from "@/features/account/components/settings-view";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("settings.title") };
}

export default async function SettingsPage() {
  const user = await requireUser();
  return <SettingsView user={{ name: user.name, email: user.email, role: user.role }} />;
}
