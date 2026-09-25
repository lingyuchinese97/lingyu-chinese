/**
 * Dữ liệu demo: 1 admin + 1 người học (kèm từ vựng và ngữ pháp mẫu).
 *   pnpm db:seed
 * Chạy lại nhiều lần không tạo trùng. Mật khẩu được sinh ngẫu nhiên và chỉ in ra khi tạo tài khoản mới
 * (đặt SEED_ADMIN_PASSWORD / SEED_USER_PASSWORD nếu muốn tự chọn).
 */
import { auth } from "@/server/auth";
import { pool } from "@/server/db/pool";
import { findUserByEmail, generateTempPassword, setUserRole } from "@/server/users";
import { importSample } from "@/features/vocabulary/service";
import { importSampleGrammar } from "@/features/grammar/service";

const ACCOUNTS = [
  {
    email: process.env.SEED_ADMIN_EMAIL ?? "admin@demo.lingyu",
    name: "Quản trị Demo",
    role: "admin" as const,
    password: process.env.SEED_ADMIN_PASSWORD,
    sample: false,
  },
  {
    email: process.env.SEED_USER_EMAIL ?? "hocvien@demo.lingyu",
    name: "Học viên Demo",
    role: "user" as const,
    password: process.env.SEED_USER_PASSWORD,
    sample: true,
  },
];

async function main() {
  for (const a of ACCOUNTS) {
    let u = await findUserByEmail(a.email);
    if (!u) {
      const password = a.password || generateTempPassword();
      await auth.api.signUpEmail({ body: { name: a.name, email: a.email, password } });
      u = (await findUserByEmail(a.email))!;
      console.log(`Đã tạo ${a.role === "admin" ? "admin" : "người học"}: ${a.email}  mật khẩu: ${password}`);
    } else {
      console.log(`Đã có ${a.email} — giữ nguyên mật khẩu.`);
    }
    if (a.role === "admin") await setUserRole(u.id, "admin");
    if (a.sample) {
      const v = await importSample(u.id);
      const g = await importSampleGrammar(u.id);
      console.log(`  + ${v} từ vựng mẫu, ${g} ngữ pháp mẫu`);
    }
  }
}

main()
  .catch((e) => {
    console.error(String(e?.message ?? e));
    process.exitCode = 1;
  })
  .finally(() => pool.end());
