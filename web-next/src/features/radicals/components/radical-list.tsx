"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, CheckCircle2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import { LeafDecor } from "@/components/layout/icons";
import { cn } from "@/lib/utils";
import type { Radical } from "@/lib/radicals";
import { setRadicalKnownAction } from "../actions";

export type RadicalFilter = { q: string; strokes: number; known: "" | "known" | "unknown" };
type Row = Radical & { known: boolean };

export function RadicalList({
  items,
  filter,
  knownCount,
  strokeGroups,
  foundChar,
}: {
  items: Row[];
  filter: RadicalFilter;
  knownCount: number;
  strokeGroups: number[];
  /** Người dùng gõ đúng 1 chữ Hán → "Chữ 河 thuộc bộ:" */
  foundChar: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = React.useState(filter.q);
  const [known, setKnown] = React.useState<Record<number, boolean>>({});
  const [pending, start] = React.useTransition();

  const go = React.useCallback(
    (patch: Partial<RadicalFilter>) => {
      const next = { ...filter, ...patch };
      const sp = new URLSearchParams();
      if (next.q) sp.set("q", next.q);
      if (next.strokes) sp.set("strokes", String(next.strokes));
      if (next.known) sp.set("known", next.known);
      const s = sp.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [filter, pathname, router],
  );

  // Tìm kiếm khi ngừng gõ 250ms.
  React.useEffect(() => {
    if (q.trim() === filter.q) return;
    const t = setTimeout(() => go({ q: q.trim() }), 250);
    return () => clearTimeout(t);
  }, [q, filter.q, go]);

  const isKnown = (r: Row) => known[r.num] ?? r.known;
  // Số đã thuộc = số từ server + các thay đổi chưa được server xác nhận (sau refresh, r.known khớp → không cộng nữa).
  const count =
    knownCount +
    items.reduce(
      (s, r) => (known[r.num] === undefined || known[r.num] === r.known ? s : s + (known[r.num] ? 1 : -1)),
      0,
    );

  async function toggle(r: Row) {
    const on = !isKnown(r);
    setKnown((k) => ({ ...k, [r.num]: on }));
    try {
      await setRadicalKnownAction(r.num, on);
      toast.success(on ? `Đã đánh dấu thuộc bộ ${r.name}.` : "Đã bỏ đánh dấu.");
      start(() => router.refresh());
    } catch {
      setKnown((k) => ({ ...k, [r.num]: !on }));
      toast.error("Không lưu được. Vui lòng thử lại.");
    }
  }

  const clear = () => {
    setQ("");
    go({ q: "", strokes: 0, known: "" });
  };

  return (
    <>
      <section
        aria-labelledby="rl-title"
        className="relative flex flex-col gap-4 overflow-hidden rounded-[22px] border border-[#DDEBF8] bg-[linear-gradient(100deg,#F4F9FF_0%,#E9F3FE_60%,#E1EFFD_100%)] px-[18px] py-[22px] md:flex-row md:items-center md:px-8 md:py-7"
      >
        <div className="min-w-0 flex-1">
          <h1
            id="rl-title"
            className="flex items-center gap-3 text-[26px] font-extrabold tracking-tight text-text md:text-[34px]"
          >
            Bộ thủ
            <LeafDecor className="w-10" />
          </h1>
          <p className="mt-1.5 text-[15px] text-text-2 md:text-[17px]">
            214 bộ thủ Khang Hy — nắm bộ thủ để đoán nghĩa và nhớ mặt chữ Hán nhanh hơn.
          </p>
        </div>
        <div
          aria-live="polite"
          className="grid min-w-[200px] grid-cols-[auto_1fr] items-baseline gap-x-2.5 rounded-2xl border border-border bg-white/85 px-4 py-3 max-md:w-full"
        >
          <div className="text-[15px] text-text-2">
            <strong className="text-[26px] text-navy">{count}</strong>/214
          </div>
          <div className="text-sm text-text-2">bộ đã thuộc</div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={214}
            aria-valuenow={count}
            aria-label="Tiến độ học bộ thủ"
            className="col-span-2 mt-1.5 h-2 overflow-hidden rounded-full bg-blue-50"
          >
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,var(--color-blue),var(--color-cyan))]"
              style={{ width: `${(count / 214) * 100}%` }}
            />
          </div>
        </div>
      </section>

      <section
        aria-label="Danh sách bộ thủ"
        className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-white/92 p-4 shadow-card md:p-[22px]"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">Tìm bộ thủ</span>
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-3" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm theo tên (Thủy), nghĩa (nước), pinyin, số hoặc gõ 1 chữ Hán (河)..."
              autoComplete="off"
              className={cn(inputClass, "pl-11")}
            />
          </label>
          <label>
            <span className="sr-only">Trạng thái</span>
            <select
              value={filter.known}
              onChange={(e) => go({ known: e.target.value as RadicalFilter["known"] })}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">Tất cả bộ thủ</option>
              <option value="known">Đã thuộc</option>
              <option value="unknown">Chưa thuộc</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <span className="shrink-0 text-sm font-semibold text-text-2 max-md:hidden">Số nét</span>
          <div
            role="group"
            aria-label="Lọc theo số nét"
            className="-mx-4 flex [scrollbar-width:none] gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0"
          >
            <Chip on={!filter.strokes} onClick={() => go({ strokes: 0 })}>
              Tất cả
            </Chip>
            {strokeGroups.map((n) => (
              <Chip key={n} on={n === filter.strokes} onClick={() => go({ strokes: n })}>
                {n} nét
              </Chip>
            ))}
          </div>
        </div>

        <div aria-live="polite" aria-busy={pending}>
          {items.length ? (
            <>
              {foundChar && items.length === 1 ? (
                <p className="mb-2.5 font-semibold text-navy">
                  Chữ{" "}
                  <span className="mx-1 hanzi text-[22px] text-red" lang="zh">
                    {foundChar}
                  </span>{" "}
                  thuộc bộ:
                </p>
              ) : (
                <p className="mb-2.5 text-sm text-text-2">{items.length} bộ thủ</p>
              )}
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
                {items.map((r) => (
                  <RadicalCard key={r.num} r={r} known={isKnown(r)} onToggle={() => toggle(r)} />
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Search className="size-7" />
              </span>
              <h2 className="text-lg font-bold text-navy">Không tìm thấy bộ thủ phù hợp</h2>
              <p className="max-w-md text-text-2">
                Thử tên Hán Việt (vd: Thủy), nghĩa (vd: nước) hoặc gõ một chữ Hán để xem bộ của chữ đó.
              </p>
              <Button variant="secondary" onClick={clear} className="mt-2">
                <X />
                Xóa bộ lọc
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function RadicalCard({ r, known, onToggle }: { r: Row; known: boolean; onToggle: () => void }) {
  const vs = r.variants.filter((v) => !v.includes("("));
  return (
    <li
      className={cn(
        "relative rounded-[var(--radius-lg)] border bg-white transition hover:border-[#A9D3F8] hover:shadow-[0_8px_22px_rgba(20,90,170,.08)]",
        known ? "border-green-100 bg-green-50" : "border-border",
      )}
    >
      <Link
        href={`/radicals/${r.num}`}
        aria-label={`Bộ ${r.name} (${r.meaning}), số ${r.num}`}
        className="flex flex-col items-center gap-0.5 rounded-[inherit] px-2.5 pt-4 pb-3.5 text-center outline-none focus-visible:[box-shadow:var(--focus-ring)]"
      >
        <span className="absolute top-2 left-2.5 text-xs font-bold text-text-3">{r.num}</span>
        <span className="hanzi text-[40px] leading-[1.15] text-navy" lang="zh">
          {r.char}
        </span>
        <span className="min-h-5 hanzi text-[15px] text-blue-600" lang="zh">
          {vs.join(" ")}
        </span>
        <span className="mt-1 font-bold text-text">{r.name}</span>
        <span className="text-[13.5px] leading-snug text-text-2">{r.meaning}</span>
        <span className="mt-0.5 text-[12.5px] text-text-3">
          <span className="text-pinyin">{r.pinyin}</span> · {r.strokes} nét
        </span>
      </Link>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={known}
        aria-label={`${known ? "Bỏ đánh dấu đã thuộc" : "Đánh dấu đã thuộc"} bộ ${r.name}`}
        title={known ? "Đã thuộc" : "Đánh dấu đã thuộc"}
        className={cn(
          "absolute top-1 right-1 flex size-9 items-center justify-center rounded-full outline-none hover:bg-blue-50 focus-visible:[box-shadow:var(--focus-ring)]",
          known ? "text-green-700" : "text-text-3",
        )}
      >
        {known ? <CheckCircle2 className="size-5" /> : <Check className="size-5" />}
      </button>
    </li>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-[10px] border-[1.5px] px-3.5 text-[14.5px] whitespace-nowrap",
        on
          ? "border-blue bg-blue-50 font-bold text-blue-600"
          : "border-transparent bg-[#EEF5FC] font-medium text-text-2 hover:bg-blue-100",
      )}
    >
      {children}
    </button>
  );
}
