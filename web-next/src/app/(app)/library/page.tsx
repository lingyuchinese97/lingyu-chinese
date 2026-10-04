import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getLocale, getT } from "@/i18n/server";
import { libraryHome } from "@/features/library/sets";
import { publicWordCount } from "@/features/library/service";
import { LibraryHome } from "@/features/library/components/hub/library-home";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("libhub.title") };
}
export const dynamic = "force-dynamic";

/** Trang chủ Thư viện LingYu. */
export default async function LibraryPage() {
  const user = await requireUser();
  const [home, publicWords] = await Promise.all([libraryHome(user.id, await getLocale()), publicWordCount()]);
  return <LibraryHome data={{ ...home, publicWords }} />;
}
