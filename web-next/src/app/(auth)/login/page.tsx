import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { safeNext } from "@/lib/safe-next";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("auth.loginTitle") };
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { email, next } = await searchParams;
  return <LoginForm initialEmail={typeof email === "string" ? email.slice(0, 254) : ""} next={safeNext(next)} />;
}
