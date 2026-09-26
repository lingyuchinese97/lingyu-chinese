/** Nội dung Phát âm & Biến điệu: thanh mẫu, vận mẫu, thanh điệu, quy tắc biến điệu (chữ hiển thị có sẵn vi / en). */
import { api } from "@/server/api";
import { PRONUNCIATION_CONTENT } from "@/data/pronunciation";

export const dynamic = "force-dynamic";

export const GET = api(async () => PRONUNCIATION_CONTENT);
