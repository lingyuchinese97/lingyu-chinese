import Image from "next/image";
import { redirect } from "next/navigation";
import { BookOpen, ChartColumn, Heart } from "lucide-react";
import { getSession } from "@/server/session";

const BUBBLES: [number, number, number][] = [
  [4, 36, 90],
  [16, 48, 36],
  [12, 83, 44],
  [88, 30, 30],
  [90, 66, 78],
  [8, 62, 28],
  [80, 84, 22],
];

/** Khung trang đăng nhập / đăng ký: thương hiệu + mascot bên trái (ẩn trên mobile), thẻ form bên phải. */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  if (await getSession()) redirect("/home");
  return (
    <div className="relative grid min-h-dvh items-center overflow-hidden bg-[radial-gradient(900px_600px_at_25%_60%,#E6F3FF_0%,transparent_60%),linear-gradient(180deg,#F8FCFF_0%,#EEF7FF_100%)] px-4 pt-10 pb-8 md:px-6 lg:grid-cols-[1fr_minmax(0,560px)] lg:gap-7 lg:p-8 xl:grid-cols-[1fr_minmax(0,620px)] xl:gap-10 xl:py-10 xl:pr-14 xl:pl-10">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[260px]">
        <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="block size-full">
          <path d="M0 150C220 90 420 200 700 150S1180 60 1440 120V260H0Z" fill="#DDEFFD" opacity=".7" />
          <path d="M0 200C260 150 520 230 820 190S1260 150 1440 180V260H0Z" fill="#E7F5FF" />
        </svg>
      </div>

      <section aria-label="LingYu Chinese" className="relative flex min-w-0 flex-col items-center text-center lg:gap-2">
        <Image
          src="/brand/lingyu-logo.png"
          alt="LingYu Chinese — Tiếng Trung gần hơn mỗi ngày"
          width={2171}
          height={724}
          priority
          className="h-auto w-[min(260px,80%)] mix-blend-multiply md:w-[min(340px,90%)] lg:w-[min(520px,100%)]"
        />
        <p
          aria-hidden="true"
          className="hand my-1 -mb-2.5 hidden -rotate-[5deg] text-[28px] leading-tight lg:block xl:text-[34px]"
        >
          Cùng LingYu
          <br />
          khám phá thế giới tiếng Trung
          <br />
          thật thú vị nhé!
          <Heart className="fill-rose text-rose ml-2.5 inline size-9 -translate-y-1" />
        </p>
        <div aria-hidden="true" className="relative hidden aspect-[1536/1024] w-[min(560px,100%)] lg:block">
          {BUBBLES.map(([x, y, s]) => (
            <span
              key={`${x}-${y}`}
              className="pointer-events-none absolute rounded-full bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,.95)_0_12%,rgba(214,236,255,.55)_34%,rgba(160,205,245,.35)_70%,rgba(130,190,240,.55)_100%)] shadow-[inset_-4px_-6px_12px_rgba(120,180,235,.35),0_4px_14px_rgba(120,180,235,.2)]"
              style={{ left: `${x}%`, top: `${y}%`, width: s, height: s }}
            />
          ))}
          <Image src="/brand/lingyu-mascot.png" alt="" fill sizes="560px" className="relative z-[1] object-contain" />
        </div>
        <div className="text-navy mt-3 hidden flex-wrap items-center justify-center gap-5 text-[17px] lg:flex">
          <span className="inline-flex items-center gap-2.5">
            <BookOpen className="size-7 text-blue-600" aria-hidden="true" />
            Học nhẹ nhàng
          </span>
          <i className="h-6 w-px bg-[#BFD6EE]" />
          <span className="inline-flex items-center gap-2.5">
            <ChartColumn className="size-7 text-blue-600" aria-hidden="true" />
            Tiến bộ mỗi ngày
          </span>
          <i className="h-6 w-px bg-[#BFD6EE]" />
          <span className="inline-flex items-center gap-2.5">
            <Heart className="size-7 text-blue-600" aria-hidden="true" />
            Cùng bạn thật xa
          </span>
        </div>
      </section>

      <main className="relative z-[2] mx-auto mt-3 w-full max-w-[600px] min-w-0 lg:mt-0 lg:max-w-none">
        <div className="flex flex-col gap-4 rounded-[20px] border border-[#E4EEF8] bg-white px-5 pt-6 pb-6 shadow-[0_20px_60px_rgba(34,93,150,.10)] md:rounded-[26px] md:px-9 md:pt-9 md:pb-8 xl:px-[52px] xl:pt-11 xl:pb-10">
          {children}
        </div>
      </main>
    </div>
  );
}
