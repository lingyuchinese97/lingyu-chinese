import { cn } from "@/lib/utils";

/**
 * Chữ Hán trong ô 米字格 (như vở tập viết): viền đỏ, nét đứt đỏ theo hai đường chéo + chữ thập, cả chữ màu đỏ.
 * Mỗi chữ một ô. Chữ thật nằm trong một span ẩn (trình đọc màn hình đọc liền cả từ, chép được); các ô chỉ để nhìn —
 * chữ trong ô vẽ bằng CSS `content`, không lặp chữ trong DOM.
 */
export function HanziGrid({ text, size = 96, className }: { text: string; size?: number; className?: string }) {
  // Các ô liền nhau như một hàng vở tập viết (viền chung giữa hai ô).
  return (
    <span
      lang="zh"
      className={cn("inline-flex flex-wrap align-middle [&>[aria-hidden]+[aria-hidden]]:-ml-[2px]", className)}
    >
      <span className="sr-only">{text}</span>
      {[...text].map((c, i) =>
        /\s/.test(c) ? null : (
          <span
            key={i}
            aria-hidden="true"
            className="relative inline-flex shrink-0 items-center justify-center border-2 border-[#E0302F] bg-white hanzi leading-none font-normal text-[#E0302F]"
            style={{ width: size, height: size, fontSize: Math.round(size * 0.74) }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-0 size-full"
            >
              <g stroke="#F07C7C" strokeWidth="1" strokeDasharray="4 3" vectorEffect="non-scaling-stroke" fill="none">
                <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
                <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
                <line x1="50" y1="0" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
                <line x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
              </g>
            </svg>
            <span data-c={c} className="relative before:content-[attr(data-c)]" />
          </span>
        ),
      )}
    </span>
  );
}
