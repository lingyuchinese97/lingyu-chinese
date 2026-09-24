/**
 * Cấp quyền admin cho một tài khoản đã đăng ký.
 *   pnpm user:make-admin <email>
 */
import { findUserByEmail, setUserRole } from "@/server/users";
import { pool } from "@/server/db/pool";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Cách dùng: pnpm user:make-admin <email>");
  const u = await findUserByEmail(email);
  if (!u) throw new Error(`Không tìm thấy tài khoản ${email} — người đó cần đăng ký trước.`);
  await setUserRole(u.id, "admin");
  console.log(`${u.email} giờ là admin.`);
}

main()
  .catch((e) => {
    console.error(String(e?.message ?? e));
    process.exitCode = 1;
  })
  .finally(() => pool.end());
