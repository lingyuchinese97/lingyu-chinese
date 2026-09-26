import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { env } from "@/env";
import { db } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import { MAX_PASSWORD, MIN_PASSWORD, emailSchema, nameSchema, normalizeEmail, passwordSchema } from "@/lib/auth-rules";
import { log } from "@/server/log";

const isAdminEmail = (email: string) => env.ADMIN_EMAILS.includes(email.trim().toLowerCase());

/**
 * Better Auth — tự host, lưu vào Postgres qua Drizzle.
 * Phase đầu: chỉ email + mật khẩu, không xác thực email, không OAuth, không gửi mail.
 */
export const auth = betterAuth({
  appName: "LingYu Chinese",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.BETTER_AUTH_URL, env.NEXT_PUBLIC_APP_URL],
  database: drizzleAdapter(db, { provider: "pg", schema, camelCase: false }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // đăng ký xong vào thẳng app
    requireEmailVerification: false,
    minPasswordLength: MIN_PASSWORD,
    maxPasswordLength: MAX_PASSWORD,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "user", input: false },
      disabledAt: { type: "date", required: false, input: false },
      lastLoginAt: { type: "date", required: false, input: false },
      locale: { type: "string", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 ngày
    updateAge: 60 * 60 * 24, // gia hạn mỗi ngày khi còn dùng
  },
  rateLimit: {
    enabled: env.NODE_ENV !== "test",
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 5 },
    },
  },
  advanced: {
    useSecureCookies: env.BETTER_AUTH_URL.startsWith("https://"),
    defaultCookieAttributes: { httpOnly: true, sameSite: "lax" },
    database: { generateId: "uuid" },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => ({ data: { ...user, role: isAdminEmail(user.email) ? "admin" : "user" } }),
      },
    },
    session: {
      create: {
        // Tài khoản bị khoá không đăng nhập được; email trong ADMIN_EMAILS được nâng quyền admin.
        before: async (session) => {
          const [u] = await db.select().from(schema.user).where(eq(schema.user.id, session.userId)).limit(1);
          if (!u) return false;
          if (u.disabledAt) {
            log.info({ userId: u.id }, "auth: blocked sign-in of disabled account");
            throw new APIError("FORBIDDEN", { message: "Tài khoản đã bị khoá. Liên hệ quản trị viên." });
          }
          await db
            .update(schema.user)
            .set({ lastLoginAt: new Date(), ...(u.role !== "admin" && isAdminEmail(u.email) ? { role: "admin" } : {}) })
            .where(eq(schema.user.id, u.id));
        },
      },
    },
  },
  hooks: {
    // Kiểm tra lại ở server đúng luật của form đăng ký (không tin dữ liệu client).
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        // Chuẩn hoá email (trim + lowercase) để khớp với lúc đăng ký.
        const body = (ctx.body ?? {}) as Record<string, unknown>;
        if (typeof body.email === "string")
          return { context: { body: { ...body, email: normalizeEmail(body.email) } } };
        return;
      }
      if (ctx.path !== "/sign-up/email") return;
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const name = nameSchema.safeParse(body.name);
      const email = emailSchema.safeParse(body.email);
      const password = passwordSchema.safeParse(body.password);
      for (const r of [name, email, password]) {
        if (!r.success)
          throw new APIError("BAD_REQUEST", { message: r.error.issues[0]?.message ?? "Dữ liệu không hợp lệ." });
      }
      return { context: { body: { ...body, name: name.data, email: email.data } } };
    }),
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
