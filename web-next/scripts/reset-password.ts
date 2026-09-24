/**
 * Đặt lại mật khẩu cho một người dùng (dự phòng khi không vào được trang Admin).
 *   pnpm user:reset-password <email>
 * In ra mật khẩu tạm MỘT LẦN — gửi cho người dùng qua kênh an toàn, nhắc họ đổi trong Cài đặt.
 */
import { findUserByEmail, resetUserPassword } from "@/server/users";
import { pool } from "@/server/db/pool";

async function main() {
  const email = process.argv[2];
  if (!email) throw new Error("Cách dùng: pnpm user:reset-password <email>");
  const u = await findUserByEmail(email);
  if (!u) throw new Error(`Không tìm thấy tài khoản ${email}`);
  const temp = await resetUserPassword(u.id);
  console.log(
    `Đã đặt lại mật khẩu cho ${u.email}.\nMật khẩu tạm: ${temp}\n(Mọi phiên đăng nhập cũ của tài khoản này đã bị đăng xuất.)`,
  );
}

main()
  .catch((e) => {
    console.error(String(e?.message ?? e));
    process.exitCode = 1;
  })
  .finally(() => pool.end());
