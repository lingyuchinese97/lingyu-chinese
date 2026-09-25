"use client";

import { Toaster as Sonner } from "sonner";

/** Toast (sonner, theo shadcn/ui). Trên điện thoại đặt phía trên thanh tab. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton={false}
      offset={{ bottom: 24 }}
      mobileOffset={{ bottom: "calc(var(--tabbar-h) + var(--safe-b) + 12px)" }}
      toastOptions={{ classNames: { toast: "font-sans text-[14.5px]" } }}
    />
  );
}
export { toast } from "sonner";
