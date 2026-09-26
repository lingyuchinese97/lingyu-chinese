/** Tiến độ ngữ pháp theo cấp HSK (theo thẻ “HSK n”) và theo thẻ; “đã học” = đã làm đúng trong Ôn tập ngữ pháp. */
import { api } from "@/server/api";
import { grammarByTag } from "@/features/progress/service";

export const dynamic = "force-dynamic";

export const GET = api(async ({ user }) => grammarByTag(user.id));
