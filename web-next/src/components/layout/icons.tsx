import * as React from "react";

/** Icon riêng của LingYu (nét giống lucide: 24×24, stroke 2) cho các mục không có sẵn trong lucide. */
type IconProps = React.SVGProps<SVGSVGElement>;
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function GrammarIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5Z" />
      <path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3" />
      <path d="M9 7.5h6M9 11h4" />
    </svg>
  );
}

export function RadicalIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
      <path d="M8 8.5h8" />
      <path d="M12 8.5v8" />
      <path d="M8.5 16.5h7" />
    </svg>
  );
}

export function ReviewIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 12a8 8 0 0 1-14 5.3" />
      <path d="M4 12a8 8 0 0 1 14-5.3" />
      <path d="M18.5 3v4h-4" />
      <path d="M5.5 21v-4h4" />
    </svg>
  );
}

export function LeafDecor(props: IconProps) {
  return (
    <svg viewBox="0 0 120 80" aria-hidden="true" {...props}>
      <path d="M8 68C20 18 73 6 112 8 101 50 69 77 8 68Z" fill="#54D2A0" opacity=".7" />
      <path d="M17 63C43 47 66 31 100 15" fill="none" stroke="#45A966" strokeWidth="2" />
    </svg>
  );
}
