// Bài 1 — port từ Flutter (lib/data/bai1_listening_data.dart, lib/data/bai1_blending_data.dart).
// Audio ghép âm: public/audio/bai1/blending/qNN.mp3 (chép từ assets/audio/bai1/blending).
// Phần Nghe chưa có audio (bản Flutter cũng chưa có) → khi có file, đặt ở public/audio/bai1/listening/qNN.mp3 và thêm `audio`.
import type { LessonInput } from "../schema";

const pad = (n: number) => String(n).padStart(2, "0");

const listening: [string, string[], number][] = [
  ["b", ["b", "p", "m", "f"], 0],
  ["p", ["m", "p", "d", "b"], 1],
  ["m", ["f", "n", "m", "l"], 2],
  ["f", ["b", "d", "f", "t"], 2],
  ["d", ["d", "t", "n", "l"], 0],
  ["t", ["n", "l", "t", "d"], 2],
  ["n", ["m", "n", "l", "f"], 1],
  ["l", ["d", "t", "n", "l"], 3],
  ["a", ["o", "e", "a", "i"], 2],
  ["o", ["a", "u", "o", "e"], 2],
  ["e", ["i", "e", "ü", "u"], 1],
  ["i", ["u", "a", "o", "i"], 3],
  ["u", ["i", "u", "e", "a"], 1],
  ["ü", ["u", "i", "ü", "e"], 2],
  ["ai", ["ei", "ao", "ai", "ou"], 2],
  ["ei", ["ai", "ou", "ao", "ei"], 3],
];

const blending: [string, string[], number][] = [
  ["b + a", ["bā", "pā", "mā", "bō"], 0],
  ["p + o", ["pā", "pō", "bō", "mō"], 1],
  ["m + i", ["mū", "mī", "nī", "lī"], 1],
  ["f + u", ["fū", "hū", "bū", "pū"], 0],
  ["d + a", ["tā", "dā", "nā", "lā"], 1],
  ["t + i", ["dī", "tī", "nī", "lī"], 1],
  ["n + i", ["mī", "lī", "nī", "dī"], 2],
  ["l + a", ["nā", "lā", "dā", "tā"], 1],
  ["b + ai", ["bāi", "pāi", "bēi", "bāo"], 0],
  ["p + ei", ["bēi", "pēi", "pāi", "pōu"], 1],
  ["m + ao", ["māi", "māo", "mōu", "nāo"], 1],
  ["f + ou", ["fāo", "fēi", "fōu", "pōu"], 2],
  ["d + ai", ["dāi", "tāi", "dēi", "dāo"], 0],
  ["t + ao", ["dāo", "tāo", "nāo", "tōu"], 1],
  ["n + ei", ["nēi", "lēi", "nāi", "nōu"], 0],
  ["l + ou", ["nōu", "lāo", "lōu", "lēi"], 2],
  ["b + i", ["bī", "pī", "mī", "bū"], 0],
  ["p + u", ["pū", "bū", "fū", "pī"], 0],
  ["m + a", ["mā", "nā", "lā", "mō"], 0],
  ["l + i", ["nī", "lī", "dī", "tī"], 1],
];

export const bai1: LessonInput = {
  id: "bai1",
  number: 1,
  badge: "ÔN TẬP • BÀI 1",
  title: "Nghe ghép âm",
  subtitle: "Nghe và chọn đáp án đúng nhé!",
  en: { badge: "REVIEW • LESSON 1", title: "Listen & blend sounds", subtitle: "Listen and choose the right answer!" },
  highlights: [
    { value: "11", label: "thanh mẫu", labelEn: "initials", sample: "b·p·m·f...", tone: "red" },
    { value: "10", label: "vận mẫu", labelEn: "finals", sample: "a·o·e·i·u...", tone: "blue" },
    { value: "4", label: "thanh điệu", labelEn: "tones", sample: "ā á ǎ à", tone: "green" },
  ],
  sections: [
    {
      id: "listening",
      label: "Phần 1",
      title: "Nghe & nhận diện",
      instruction: "Nghe và chọn đúng âm bạn vừa nghe được",
      en: { label: "Part 1", title: "Listen & recognise", instruction: "Listen and choose the sound you heard" },
      questions: listening.map(([, options, answer], i) => ({
        type: "choice-audio",
        id: `q${pad(i + 1)}`,
        prompt: "Nghe và chọn đúng âm bạn vừa nghe được",
        promptEn: "Listen and choose the sound you heard",
        options,
        answer,
      })),
    },
    {
      id: "blending",
      label: "Phần 2",
      title: "Ghép âm",
      instruction: "Nghe và chọn cách đọc đúng của âm ghép",
      en: { label: "Part 2", title: "Blending", instruction: "Listen and choose the correct reading of the blend" },
      questions: blending.map(([parts, options, answer], i) => ({
        type: "blend",
        id: `q${pad(i + 1)}`,
        parts,
        audio: `/audio/bai1/blending/q${pad(i + 1)}.mp3`,
        options,
        answer,
      })),
    },
  ],
};
