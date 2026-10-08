import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/server/session";
import { getT } from "@/i18n/server";
import { SpeakingScreen } from "@/features/speaking/components/screen";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("speaking.title") };
}
export const dynamic = "force-dynamic";

/** Luyện giao tiếp — luyện trả lời một câu hỏi (+ danh sách bên trái trên màn rộng). Của người khác / không có → 404. */
export default async function PracticePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();
  return <SpeakingScreen userId={user.id} sp={await searchParams} id={id.data} />;
}
