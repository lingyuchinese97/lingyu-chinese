import { requireUser } from "@/server/session";

/** Lớp bảo vệ thật của khu vực đã đăng nhập: kiểm tra session bằng Better Auth ở server. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  return <>{children}</>;
}
