import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/safe-next";

export const metadata: Metadata = { title: "Đăng nhập" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { email, next } = await searchParams;
  return <LoginForm initialEmail={typeof email === "string" ? email.slice(0, 254) : ""} next={safeNext(next)} />;
}
