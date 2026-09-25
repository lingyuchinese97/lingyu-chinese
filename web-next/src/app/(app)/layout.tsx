import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/session";
import { unreadCount } from "@/features/notifications/service";

/** Lớp bảo vệ thật của khu vực đã đăng nhập: kiểm tra session bằng Better Auth ở server (proxy.ts chỉ kiểm tra nhanh cookie). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const unread = await unreadCount(user.id);
  return (
    <AppShell user={{ name: user.name, email: user.email, role: user.role }} unread={unread}>
      {children}
    </AppShell>
  );
}
