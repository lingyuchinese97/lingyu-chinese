import * as React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

const styles = {
  error: "border-red-100 bg-red-50 text-red",
  info: "border-blue-100 bg-blue-50 text-blue-700",
  success: "border-green-100 bg-green-50 text-green-700",
  warning: "border-[#FBE3B4] bg-amber-50 text-[#8A5300]",
} as const;
const icons = { error: AlertCircle, info: Info, success: CheckCircle2, warning: AlertCircle } as const;

export function Alert({
  tone = "info",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { tone?: keyof typeof styles }) {
  const Icon = icons[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-md border px-3.5 py-3 text-[14.5px]", styles[tone], className)}
      {...props}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
