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

export function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
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
    router.replace("/home");
    router.refresh();
  });

  return (
    <>
      <AuthTitle title="Đăng nhập" sub="Chào mừng bạn trở lại với LingYu Chinese!" />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
        {formError && <Alert tone="error">{formError}</Alert>}
        <AuthField
          id="email"
          label="Email"
          type="email"
          icon={Mail}
          placeholder="Nhập email của bạn"
          autoComplete="email"
          inputMode="email"
          autoFocus={!initialEmail}
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          id="password"
          label="Mật khẩu"
          icon={Lock}
          password
          placeholder="Nhập mật khẩu của bạn"
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
            Quên mật khẩu?
          </button>
        </div>
        {showForgot && <Alert tone="info">Liên hệ quản trị viên để đặt lại mật khẩu.</Alert>}
        <Button
          type="submit"
          variant="primary"
          block
          disabled={isSubmitting}
          className="relative min-h-14 rounded-md text-[17px] md:min-h-[70px] md:text-xl"
        >
          <span>{isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}</span>
          <ArrowRight className="absolute right-[22px] !size-7" aria-hidden="true" />
        </Button>
      </form>
      <p className="text-text-2 text-center text-[15.5px] md:text-lg">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-bold text-[#1646B8] hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </>
  );
}
