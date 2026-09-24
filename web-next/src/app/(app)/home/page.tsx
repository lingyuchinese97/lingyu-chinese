import type { Metadata } from "next";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Trang chủ" };

export default async function HomePage() {
  const user = await requireUser();
  return (
    <section className="flex flex-col gap-1">
      <h1 className="text-[26px] font-extrabold tracking-tight text-navy md:text-[34px]">Xin chào, {user.name}!</h1>
      <p className="text-text-2">Hôm nay mình học gì nhỉ?</p>
    </section>
  );
}
