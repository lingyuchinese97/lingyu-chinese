import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/session";

/** Lớp bảo vệ thật của khu vực đã đăng nhập: kiểm tra session bằng Better Auth ở server (proxy.ts chỉ kiểm tra nhanh cookie). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return <AppShell user={{ name: user.name, email: user.email, role: user.role }}>{children}</AppShell>;
}
