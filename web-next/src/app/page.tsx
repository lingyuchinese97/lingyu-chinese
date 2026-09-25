import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GrammarIcon, RadicalIcon, ReviewIcon } from "@/components/layout/icons";
import { getSession } from "@/server/session";

export const dynamic = "force-dynamic";

const FEATURES = [
  { icon: BookOpen, title: "Từ vựng của riêng bạn", text: "Lưu Hán tự, pinyin, nghĩa, ghi chú, ảnh và tag." },
  { icon: ReviewIcon, title: "Ôn tập thông minh", text: "Lặp lại ngắt quãng (FSRS): ôn đúng lúc sắp quên." },
  { icon: GrammarIcon, title: "Sổ tay ngữ pháp", text: "Cấu trúc, ví dụ, ghi chú — chia sẻ cho bạn học." },
  { icon: RadicalIcon, title: "214 bộ thủ", text: "Xem thứ tự nét viết, nhớ chữ Hán dễ hơn." },
  { icon: GraduationCap, title: "Bài học có luyện nghe", text: "Làm bài theo phần, xem điểm và tiến độ." },
];

export default async function LandingPage() {
  if (await getSession()) redirect("/home");
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[radial-gradient(900px_600px_at_25%_40%,#E6F3FF_0%,transparent_60%),linear-gradient(180deg,#F8FCFF_0%,#EEF7FF_100%)]">
      <header className="relative z-[1] mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-2 md:px-6 md:pt-5">
        <Image
          src="/brand/lingyu-wordmark.png"
          alt="LingYu Chinese"
          width={1579}
          height={550}
          priority
          sizes="200px"
          className="h-11 w-auto md:h-14"
        />
        <Button asChild variant="secondary" size="sm">
          <Link href="/login">Đăng nhập</Link>
        </Button>
      </header>

      <main className="relative z-[1] mx-auto grid max-w-6xl items-center gap-8 px-4 pt-6 pb-12 md:px-6 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
        <section className="flex flex-col items-center gap-5 text-center lg:items-start lg:text-left">
          <p className="hand text-[26px] text-blue-600 md:text-[32px]">Tiếng Trung gần hơn mỗi ngày</p>
          <h1 className="text-[32px] leading-tight font-extrabold tracking-tight text-navy md:text-[46px]">
            Học tiếng Trung nhẹ nhàng cùng <span className="text-blue-600">LingYu Chinese</span>
          </h1>
          <p className="max-w-xl text-base text-text-2 md:text-lg">
            Sổ từ vựng, ngữ pháp và bộ thủ của riêng bạn, kèm ôn tập lặp lại ngắt quãng. Dùng tốt trên điện thoại, cài
            được lên màn hình chính.
          </p>
          <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <Button asChild variant="primary" size="lg" className="sm:flex-1">
              <Link href="/register">Đăng ký miễn phí</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="sm:flex-1">
              <Link href="/login">Tôi đã có tài khoản</Link>
            </Button>
          </div>
        </section>
        <div aria-hidden="true" className="relative mx-auto aspect-[1536/1024] w-full max-w-[520px]">
          <Image
            src="/brand/lingyu-mascot.png"
            alt=""
            fill
            sizes="(min-width: 1024px) 520px, 90vw"
            className="object-contain"
            priority
          />
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-5">
          {FEATURES.map((f) => (
            <li
              key={f.title}
              className="flex gap-3 rounded-lg border border-border bg-white/85 p-4 shadow-soft lg:flex-col"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <f.icon className="size-6" />
              </span>
              <div>
                <h2 className="font-bold text-navy">{f.title}</h2>
                <p className="mt-0.5 text-sm text-text-2">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <footer className="relative z-[1] flex items-center justify-center gap-2 pb-[max(20px,var(--safe-b))] text-[13.5px] text-text-2">
        <strong className="font-semibold text-navy">LingYu Chinese</strong>
        <Heart className="size-4 text-blue-600" aria-hidden="true" />
      </footer>
    </div>
  );
}
