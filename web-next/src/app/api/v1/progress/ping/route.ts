/**
 * Nhịp "đang học": gửi ~mỗi phút khi app đang mở và người dùng có thao tác. Server cộng thời gian học của hôm nay
 * (tối đa 60 giây mỗi nhịp, bỏ qua khoảng nghỉ > 2 phút) → { day, seconds }.
 */
import { api } from "@/server/api";
import { ping } from "@/features/progress/service";

export const dynamic = "force-dynamic";

export const POST = api(async ({ user }) => ping(user.id));
