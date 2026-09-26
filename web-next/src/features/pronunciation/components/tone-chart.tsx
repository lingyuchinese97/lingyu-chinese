import { cn } from "@/lib/utils";

export const TONE_COLOR: Record<number, string> = {
  1: "#1595F5",
  2: "#16C98D",
  3: "#F29A17",
  4: "#EE3B55",
  5: "#8AA0BF",
};

/**
 * Đường thanh điệu trên thang 5 bậc (5 cao, 1 thấp). Nhiều đường → biểu đồ so sánh.
 * `axis` hiện nhãn Cao / Trung / Thấp bên trái.
 */
export function ToneChart({
  lines,
  label,
  axis,
  className,
}: {
  lines: { tone: number; contour: number[] }[];
  label: string;
  axis?: { high: string; mid: string; low: string };
  className?: string;
}) {
  const W = 200;
  const H = 120;
  const left = axis ? 44 : 12;
  const right = W - 12;
  const y = (lv: number) => 12 + ((5 - lv) / 4) * (H - 24);
  const path = (c: number[]) => {
    if (c.length === 1) return null;
    const step = (right - left) / (c.length - 1);
    const pts = c.map((lv, i) => [left + i * step, y(lv)] as const);
    if (pts.length === 2) return `M${pts[0]![0]} ${pts[0]![1]} L${pts[1]![0]} ${pts[1]![1]}`;
    // 3 điểm (thanh 3): đường cong mềm đi qua điểm giữa.
    const [a, b, c2] = pts;
    return `M${a![0]} ${a![1]} Q${b![0]} ${b![1] + 18} ${c2![0]} ${c2![1]}`;
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className={cn("h-auto w-full", className)}>
      {[5, 4, 3, 2, 1].map((lv) => (
        <line
          key={lv}
          x1={left}
          x2={right}
          y1={y(lv)}
          y2={y(lv)}
          stroke="#DCEAF6"
          strokeDasharray={lv === 3 ? "0" : "3 4"}
          strokeWidth="1"
        />
      ))}
      {axis ? (
        <g fontSize="11" fill="#5F7494" fontFamily="inherit">
          <text x="2" y={y(5) + 4}>
            {axis.high}
          </text>
          <text x="2" y={y(3) + 4}>
            {axis.mid}
          </text>
          <text x="2" y={y(1) + 4}>
            {axis.low}
          </text>
        </g>
      ) : null}
      {lines.map((ln) => {
        const d = path(ln.contour);
        const color = TONE_COLOR[ln.tone]!;
        return d ? (
          <path key={ln.tone} d={d} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
        ) : (
          <circle key={ln.tone} cx={(left + right) / 2} cy={y(ln.contour[0]!)} r="6" fill={color} />
        );
      })}
    </svg>
  );
}
