import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Nút theo mẫu shadcn/ui, màu theo tokens của LingYu. Vùng chạm tối thiểu 40–44px. */
export const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold whitespace-nowrap transition-[background,box-shadow,color,border-color,opacity] outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-grad-primary text-white shadow-cta hover:[background:var(--grad-primary-hover)]",
        solid: "bg-blue text-white shadow-cta hover:bg-blue-600",
        secondary: "border-[1.5px] border-[#A9D3F8] bg-white text-blue-600 hover:bg-blue-50",
        ghost: "bg-blue-50 text-blue-600 hover:bg-blue-100",
        muted: "bg-[#EEF4FB] text-text-3 hover:bg-blue-50",
        danger: "bg-red text-white hover:bg-[#BC141A]",
        "danger-outline": "border-[1.5px] border-red-100 bg-white text-red hover:bg-red-50",
        link: "h-auto min-h-10 px-0 text-blue-600 hover:underline",
      },
      size: {
        sm: "h-10 px-3.5 text-sm",
        md: "h-12 px-5 text-[15.5px]",
        lg: "h-14 rounded-lg px-6 text-[17px]",
        icon: "size-10 rounded-sm p-0",
      },
      block: { true: "w-full" },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, block, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
}
