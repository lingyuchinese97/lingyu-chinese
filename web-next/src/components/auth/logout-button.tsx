"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function LogoutButton({ children = "Đăng xuất", ...props }: ButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  return (
    <Button
      variant="danger-outline"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await authClient.signOut();
        router.replace("/login");
        router.refresh();
      }}
      {...props}
    >
      <LogOut aria-hidden="true" />
      {children}
    </Button>
  );
}
