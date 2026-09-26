"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { loginErrorMessage } from "@/lib/auth-errors";
import { loginSchema, type LoginInput } from "@/lib/auth-rules";
import { AuthField, AuthTitle } from "./auth-field";
import { useT } from "@/i18n/client";

export function LoginForm({ initialEmail = "", next = "/home" }: { initialEmail?: string; next?: string }) {
  const router = useRouter();
  const t = useT();
  const [formError, setFormError] = React.useState("");
  const [showForgot, setShowForgot] = React.useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    const { error } = await authClient.signIn.email({ email: values.email, password: values.password });
    if (error) {
      setFormError(loginErrorMessage(error));
      return;
    }
    router.replace(next);
    router.refresh();
  });

  return (
    <>
      <AuthTitle title={t("auth.loginTitle")} sub={t("auth.loginSub")} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
        {formError && <Alert tone="error">{formError}</Alert>}
        <AuthField
          id="email"
          label={t("auth.email")}
          type="email"
          icon={Mail}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          inputMode="email"
          autoFocus={!initialEmail}
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          id="password"
          label={t("auth.password")}
          icon={Lock}
          password
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete="current-password"
          autoFocus={!!initialEmail}
          error={errors.password?.message}
          {...register("password")}
        />
        <div className="-mt-1.5 flex justify-end">
          <button
            type="button"
            className="min-h-10 text-[15.5px] font-bold text-blue-600 hover:underline md:text-[17px]"
            aria-expanded={showForgot}
            onClick={() => setShowForgot((v) => !v)}
          >
            {t("auth.forgot")}
          </button>
        </div>
        {showForgot && <Alert tone="info">{t("auth.forgotHelp")}</Alert>}
        <Button
          type="submit"
          variant="primary"
          block
          disabled={isSubmitting}
          className="relative min-h-14 rounded-md text-[17px] md:min-h-[70px] md:text-xl"
        >
          <span>{isSubmitting ? t("auth.signingIn") : t("auth.signIn")}</span>
          <ArrowRight className="absolute right-[22px] !size-7" aria-hidden="true" />
        </Button>
      </form>
      <p className="text-center text-[15.5px] text-text-2 md:text-lg">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-bold text-[#1646B8] hover:underline">
          {t("auth.registerNow")}
        </Link>
      </p>
    </>
  );
}
