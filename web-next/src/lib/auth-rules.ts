import { z } from "zod";

/** Luật tài khoản dùng chung client + server (spec 6.1). */
export const MIN_PASSWORD = 8;
export const MAX_PASSWORD = 128;
export const MAX_NAME = 60;

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const emailSchema = z
  .string({ error: "Vui lòng nhập email." })
  .trim()
  .min(1, "Vui lòng nhập email.")
  .max(254, "Email quá dài.")
  .toLowerCase()
  .pipe(z.email({ error: "Email không đúng định dạng." }));

export const passwordSchema = z
  .string({ error: "Vui lòng nhập mật khẩu." })
  .min(1, "Vui lòng nhập mật khẩu.")
  .refine((pw) => pw.trim().length > 0, "Mật khẩu không được chỉ gồm khoảng trắng.")
  .refine((pw) => pw === pw.trim(), "Mật khẩu không được bắt đầu hoặc kết thúc bằng khoảng trắng.")
  .refine((pw) => pw.length >= MIN_PASSWORD, `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`)
  .refine((pw) => pw.length <= MAX_PASSWORD, `Mật khẩu tối đa ${MAX_PASSWORD} ký tự.`);

export const nameSchema = z
  .string({ error: "Vui lòng nhập họ và tên." })
  .trim()
  .min(1, "Vui lòng nhập họ và tên.")
  .max(MAX_NAME, `Tên tối đa ${MAX_NAME} ký tự.`);

export const registerSchema = z
  .object({ name: nameSchema, email: emailSchema, password: passwordSchema, confirm: z.string() })
  .refine((v) => v.confirm.length > 0, { path: ["confirm"], message: "Vui lòng nhập lại mật khẩu." })
  .refine((v) => v.confirm.length === 0 || v.confirm === v.password, {
    path: ["confirm"],
    message: "Mật khẩu xác nhận không khớp.",
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export const changePasswordSchema = z
  .object({
    current: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại."),
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.confirm === v.password, { path: ["confirm"], message: "Mật khẩu xác nhận không khớp." });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
