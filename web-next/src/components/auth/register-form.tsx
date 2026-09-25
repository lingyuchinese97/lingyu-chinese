"use client";
import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Lock, Mail, User } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { registerErrorMessage } from "@/lib/auth-errors";
import { MIN_PASSWORD, registerSchema, type RegisterInput } from "@/lib/auth-rules";
import { AuthField, AuthTitle } from "./auth-field";

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = React.useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
    mode: "onTouched",
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError("");
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });
    if (error) {
      setFormError(registerErrorMessage(error));
      return;
    }
    router.replace("/home");
    router.refresh();
  });

  return (
    <>
      <AuthTitle title="Đăng ký" sub="Tạo tài khoản để bắt đầu học cùng LingYu!" />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-[18px]">
        {formError && (
          <Alert tone="error">
            {formError}{" "}
            {formError.includes("đăng nhập") && (
              <Link href="/login" className="font-bold underline">
                Đăng nhập
              </Link>
            )}
          </Alert>
        )}
        <AuthField
          id="name"
          label="Họ và tên"
          icon={User}
          placeholder="Nhập tên của bạn"
          autoComplete="name"
          autoFocus
          error={errors.name?.message}
          {...register("name")}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          icon={Mail}
          placeholder="Nhập email của bạn"
          autoComplete="email"
          inputMode="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <AuthField
          id="password"
          label="Mật khẩu"
          icon={Lock}
          password
          placeholder={`Tối thiểu ${MIN_PASSWORD} ký tự`}
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <AuthField
          id="confirm"
          label="Nhập lại mật khẩu"
          icon={Lock}
          password
          placeholder="Nhập lại mật khẩu"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm")}
        />
        <Button
          type="submit"
          variant="primary"
          block
          disabled={isSubmitting}
          className="relative min-h-14 rounded-md text-[17px] md:min-h-[70px] md:text-xl"
        >
          <span>{isSubmitting ? "Đang tạo tài khoản..." : "Đăng ký"}</span>
          <ArrowRight className="absolute right-[22px] !size-7" aria-hidden="true" />
        </Button>
      </form>
      <p className="text-center text-[15.5px] text-text-2 md:text-lg">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-bold text-[#1646B8] hover:underline">
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
