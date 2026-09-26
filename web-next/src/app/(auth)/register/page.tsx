import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("auth.registerTitle") };
}

export default function RegisterPage() {
  return <RegisterForm />;
}
