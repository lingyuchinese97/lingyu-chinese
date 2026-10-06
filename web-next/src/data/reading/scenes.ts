/**
 * Tranh minh hoạ cho bài Đọc hiểu (kiểu sách giáo khoa: tranh lớn của bài + tranh nhỏ cạnh từng câu).
 * Vẽ bằng emoji trên nền màu (không tải ảnh ngoài, nhẹ, rõ trên mọi máy). `lines[i]` khớp `lines[i]` của bài.
 */
import type { LibTone } from "@/data/library/vocab-sets";

export type RScene = { tone: LibTone; main: string; extras: string[]; lines: string[] };

export const R_SCENES: Record<string, RScene> = {
  r101: { tone: "sky", main: "🧒", extras: ["⏰", "🏫", "📚"], lines: ["🧒", "⏰", "🍱", "📖"] },
  r102: { tone: "green", main: "🍎", extras: ["🧺", "💰", "🍌"], lines: ["🍎", "💴", "😮", "⚖️", "🛍️"] },
  r103: { tone: "rose", main: "👨‍👩‍👦‍👦", extras: ["🏠", "❤️"], lines: ["👨‍👩‍👦‍👦", "🩺", "🏙️", "❤️"] },
  r104: { tone: "amber", main: "☀️", extras: ["🌳", "🍵", "👫"], lines: ["☀️", "👫", "🌳", "🍵"] },
  r201: { tone: "sky", main: "✈️", extras: ["🏙️", "🧳", "🥟"], lines: ["🧳", "🌆", "✈️", "🥟"] },
  r202: { tone: "violet", main: "🩺", extras: ["🤒", "💧", "🛌"], lines: ["👩‍⚕️", "🤕", "🕛", "🌙", "💧"] },
  r203: { tone: "orange", main: "🀄", extras: ["✍️", "👩‍🏫", "📅"], lines: ["📅", "✍️", "🏫", "👩‍🏫"] },
  r204: { tone: "sky", main: "💼", extras: ["🏢", "💻", "🎬"], lines: ["🏢", "⏰", "🤝", "🎬"] },
  r301: { tone: "violet", main: "🎹", extras: ["🎵", "🎶"], lines: ["🎵", "🎹", "🕰️", "😌"] },
  r302: { tone: "amber", main: "🔑", extras: ["👜", "💻", "🔍"], lines: ["🔑", "👜", "🔍", "🪑", "💻"] },
  r303: { tone: "sky", main: "❄️", extras: ["☃️", "🍲", "🏠"], lines: ["❄️", "🔥", "🍲"] },
  r304: { tone: "orange", main: "🛒", extras: ["📱", "📦", "⭐"], lines: ["📱", "📦", "🖼️", "⭐"] },
  r401: { tone: "green", main: "🏔️", extras: ["🏯", "🎒", "🌄"], lines: ["🎒", "🌄", "🏔️", "📸"] },
  r402: { tone: "rose", main: "🤝", extras: ["👔", "📄", "🏦"], lines: ["🙋", "🏦", "❓", "📈"] },
  r403: { tone: "green", main: "🥗", extras: ["🏃", "🍎", "😴"], lines: ["🥗", "🏃", "😴"] },
  r404: { tone: "amber", main: "📚", extras: ["🌍", "🧠", "⏳"], lines: ["📚", "🌍", "⏳"] },
};
const FALLBACK: RScene = { tone: "sky", main: "📖", extras: [], lines: [] };
export const sceneOf = (id: string) => R_SCENES[id] ?? FALLBACK;
