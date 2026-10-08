import type { Metadata } from "next";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { SpeakingScreen } from "@/features/speaking/components/screen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("speaking.title") };
}
export const dynamic = "force-dynamic";

/** Luyện giao tiếp — danh sách câu hỏi của tôi (+ luyện tập ở cột phải trên màn rộng). */
export default async function SpeakingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  return <SpeakingScreen userId={user.id} sp={await searchParams} />;
}
