import { z } from "zod";
import { idsSchema, STATUS, tagNameSchema, vocabInputSchema } from "@/features/vocabulary/schema";
import { customConfigSchema, dueConfigSchema } from "@/features/review/schema";
import { compareInputSchema, exerciseInputSchema } from "@/features/listening/schema";
import { noteInputSchema, noteUpdateSchema } from "@/features/pronunciation/schema";
import { grammarInputSchema, grammarTagName } from "@/features/grammar/schema";
import { sentenceConfigSchema, sentenceInputSchema } from "@/features/sentences/schema";
import { PRACTICE_MODES } from "@/features/pronunciation/practice";
import { clientActivitySchema, goalsSchema } from "@/features/progress/schema";
import { ACTIVITY_KINDS } from "@/features/progress/constants";

/**
 * Tài liệu OpenAPI 3.1 của REST API (hiển thị bằng Swagger UI ở /api-docs).
 * Thân request lấy thẳng từ schema Zod của tính năng nên luôn khớp với kiểm tra dữ liệu thật.
 * Thêm route mới vào `/api/v1` → thêm vào đây (quy ước ở CLAUDE.md).
 */

type Schema = Record<string, unknown>;
const js = (s: z.ZodType): Schema => {
  const { $schema: _drop, ...rest } = z.toJSONSchema(s, { io: "input", unrepresentable: "any" }) as Schema;
  return rest;
};
const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const ok = (data: Schema, description = "Thành công") => ({
  description,
  content: {
    "application/json": {
      schema: { type: "object", required: ["ok", "data"], properties: { ok: { const: true }, data } },
    },
  },
});
const err = (description: string) => ({ description, content: { "application/json": { schema: ref("Error") } } });
const E = {
  400: err("Dữ liệu sai (có `fieldErrors` khi do kiểm tra dữ liệu)"),
  401: err("Chưa đăng nhập"),
  403: err("Không có quyền (chỉ admin)"),
  404: err("Không có hoặc không phải của mình"),
  409: err("Không có từ / thẻ nào để ôn"),
  415: err("Thân request không phải JSON"),
};

type Op = {
  summary: string;
  description?: string;
  body?: Schema;
  example?: unknown;
  params?: Schema[];
  status?: 200 | 201;
  data?: Schema;
  errors?: (keyof typeof E)[];
};

function op(tag: string, o: Op) {
  const errors = [
    ...new Set<keyof typeof E>([
      401,
      ...(o.body ? (tag === A ? ([400] as const) : ([400, 415] as const)) : []),
      ...(o.errors ?? []),
    ]),
  ];
  return {
    tags: [tag],
    summary: o.summary,
    ...(o.description ? { description: o.description } : {}),
    ...(o.params ? { parameters: o.params } : {}),
    ...(o.body
      ? {
          requestBody: {
            required: true,
            content: { "application/json": { schema: o.body, ...(o.example ? { example: o.example } : {}) } },
          },
        }
      : {}),
    responses: {
      [o.status ?? 200]: ok(o.data ?? {}, o.status === 201 ? "Đã tạo" : "Thành công"),
      ...Object.fromEntries(errors.map((c) => [c, E[c]])),
    },
  };
}

const pathId = (description: string) => ({
  name: "id",
  in: "path",
  required: true,
  description,
  schema: { type: "string", format: "uuid" },
});
const q = (name: string, schema: Schema, description?: string) => ({
  name,
  in: "query",
  required: false,
  schema,
  ...(description ? { description } : {}),
});

const obj = (properties: Record<string, Schema>, required = Object.keys(properties)) => ({
  type: "object",
  properties,
  required,
});
const int = { type: "integer" };
const idsBody = (extra: Record<string, Schema> = {}) => obj({ ids: js(idsSchema), ...extra });

const EXAMPLE_ID = "3f2b6c1e-8a4d-4c5b-9e7f-1a2b3c4d5e6f";
const V = "Từ vựng";
const R = "Ôn tập";
const L = "Luyện nghe";
const P = "Phát âm";
const G = "Ngữ pháp";
const S = "Ôn dịch câu";
const RD = "Bộ thủ";
const LS = "Bài học";
const N = "Thông báo";
const H = "Trang chủ";
const PG = "Tiến độ học tập";
const SE = "Tìm kiếm";
const AD = "Quản trị";
const A = "Tài khoản";

const vocabExample = {
  hanzi: "他",
  pinyin: "tā",
  meaningVi: "anh ấy",
  note: "",
  tags: ["HSK1"],
  radicals: [9],
};

const listeningExample = {
  title: "Hội thoại chào hỏi – Bài 1",
  tags: ["HSK1", "Hội thoại"],
  contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  segmentStart: 12,
  segmentEnd: 45,
  playbackSpeed: 1,
  referenceAnswer: "你好，我是小雨。",
  referencePinyin: "Nǐ hǎo, wǒ shì Xiǎoyǔ.",
  userAnswer: "你好，我叫小雨。",
  formattedUserAnswer: [{ text: "你好，" }, { text: "我叫", color: "red" }, { text: "小雨。" }],
  notes: "Cần lưu ý cách dùng 我是 và 我叫.",
};

export function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "LingYu Chinese API",
      version: "1.0.0",
      description: [
        "REST API cho app điện thoại / app khác. Dùng chung logic với giao diện web.",
        "",
        "**Đăng nhập**: gọi `POST /api/auth/sign-in/email` (mục Tài khoản). Trình duyệt / app lưu cookie phiên và gửi kèm mọi",
        "request sau — trên trang này chỉ cần đăng nhập một lần rồi bấm *Try it out* ở các route khác.",
        "",
        "Kết quả: `{ ok: true, data }` hoặc `{ ok: false, message, fieldErrors? }`. Thông báo theo ngôn ngữ của người dùng.",
        "Không bao giờ gửi `userId`: mọi dữ liệu lấy theo người đang đăng nhập.",
      ].join("\n"),
    },
    servers: [{ url: "/" }],
    tags: [
      { name: A, description: "Đăng nhập, đăng xuất, ngôn ngữ" },
      { name: V, description: "Kho từ vựng của mình, chia sẻ" },
      { name: R, description: "Ôn tự chọn và ôn thẻ đến hạn (FSRS)" },
      {
        name: L,
        description:
          "Luyện nghe – Chép chính tả. Đáp án tham khảo do người dùng nhập; kết quả so sánh và điểm do server tính lại khi lưu.",
      },
      { name: H, description: "Số liệu Trang chủ" },
      {
        name: PG,
        description:
          "Thời gian học theo ngày (nhịp ping mỗi phút), chuỗi ngày học, mục tiêu, tiến độ theo HSK / thẻ, lịch sử hoạt động",
      },
      { name: SE, description: "Tìm kiếm chung: từ vựng, ngữ pháp, câu của tôi + bài học, bộ thủ" },
      { name: G, description: "Ngữ pháp của mình (ví dụ, cấu trúc, ghi chú cá nhân riêng tư), thẻ, lưu, chia sẻ" },
      { name: S, description: "Kho câu và bài ôn dịch câu (Việt ↔ Trung)" },
      { name: RD, description: "214 bộ thủ và đánh dấu đã thuộc" },
      { name: LS, description: "Bài học (nội dung tĩnh) và tiến độ; server tự chấm" },
      { name: N, description: "Thông báo (chuông) và lời mời chia sẻ đang chờ" },
      {
        name: P,
        description:
          "Phát âm & Biến điệu: nội dung bài học (tĩnh), bài tự luyện (không lưu điểm) và ghi chú riêng của người dùng (không chia sẻ).",
      },
      {
        name: AD,
        description: "Chỉ tài khoản admin (người dùng thường → 403). Không trả nội dung học của người dùng.",
      },
    ],
    security: [{ cookieAuth: [] }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "__Secure-better-auth.session_token",
          description: "Cookie phiên Better Auth (khi chạy http://localhost tên là `better-auth.session_token`).",
        },
      },
      schemas: {
        Error: obj(
          {
            ok: { const: false },
            message: { type: "string" },
            fieldErrors: { type: "object", additionalProperties: { type: "string" } },
          },
          ["ok", "message"],
        ),
        VocabInput: js(vocabInputSchema),
        Vocab: obj(
          {
            id: { type: "string", format: "uuid" },
            hanzi: { type: "string" },
            pinyin: { type: "string" },
            meaningVi: { type: "string" },
            note: { type: "string" },
            status: { enum: [...STATUS] },
            isFavorite: { type: "boolean" },
            radicals: { type: "array", items: int },
            tags: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
          },
          ["id", "hanzi", "pinyin", "meaningVi"],
        ),
        Grammar: {
          type: "object",
          description:
            "Ngữ pháp: id, title, meaning, structure (mỗi dòng một cấu trúc), notes, examples, tags, isSaved, personalNote (chỉ chủ sở hữu)…",
        },
        Sentence: {
          type: "object",
          description: "Câu: id, chinese, pinyin, vietnamese, note, status, isFavorite, tags, createdAt…",
        },
        SentenceSession: {
          type: ["object", "null"],
          description: "Phiên ôn dịch câu (không chứa đáp án của câu chưa làm)",
        },
        Radical: {
          type: "object",
          description: "Bộ thủ: num, char, variants, pinyin, name, meaning, meaningEn, strokes, known, examples?",
        },
        PronunciationNote: obj({
          id: { type: "string", format: "uuid" },
          topic: { type: ["string", "null"], description: "Mục gắn ghi chú; null = ghi chú tự do" },
          title: { type: "string" },
          content: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        }),
        PracticeQuestion: obj(
          {
            id: { type: "string" },
            mode: { enum: [...PRACTICE_MODES] },
            speak: { type: "string", description: "Chữ Hán để máy đọc" },
            hanzi: { type: "string" },
            meaning: obj({ vi: { type: "string" }, en: { type: "string" } }),
            answer: { type: "string", description: "Pinyin có dấu" },
            options: { type: "array", items: { type: "string" }, description: "Rỗng với listen-type / speak-compare" },
            hint: { type: "object" },
            written: { type: "string", description: "Chỉ bài sandhi: pinyin trước biến điệu" },
          },
          ["id", "mode", "speak", "hanzi", "meaning", "answer", "options", "hint"],
        ),
        Comparison: {
          type: "object",
          description:
            "Kết quả so sánh. `parts` theo thứ tự bài chép: `text` (status correct | wrong | extra | neutral, vị trí start/end trong " +
            "bài chép; wrong có `expected`) hoặc `missing` (chữ đáp án bị thiếu, chèn tại `at`). Dấu câu / khoảng trắng không tính điểm.",
          properties: {
            parts: { type: "array", items: { type: "object" } },
            correct: int,
            wrong: int,
            missing: int,
            extra: int,
            total: int,
            percent: int,
          },
        },
        ListeningExerciseInput: js(exerciseInputSchema),
        ListeningExerciseSummary: obj({
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          scoreCorrect: int,
          scoreTotal: int,
          scorePercent: int,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        }),
        ListeningExercise: {
          allOf: [
            ref("ListeningExerciseSummary"),
            {
              type: "object",
              properties: {
                contentUrl: { type: "string" },
                media: {
                  type: ["object", "null"],
                  description: "{ kind: youtube, videoId } | { kind: audio | video, url }",
                },
                segmentStart: { type: ["number", "null"] },
                segmentEnd: { type: ["number", "null"] },
                playbackSpeed: { type: "number" },
                referenceAnswer: { type: "string" },
                referencePinyin: { type: "string" },
                userAnswer: { type: "string" },
                formattedUserAnswer: { type: "array", items: { type: "object" } },
                comparisonResult: ref("Comparison"),
                notes: { type: "string" },
              },
            },
          ],
        },
        ReviewSession: {
          type: "object",
          description: "Phiên ôn. Câu chưa làm KHÔNG chứa đáp án; câu đã làm có thêm `reveal`.",
          properties: {
            id: { type: "string", format: "uuid" },
            kind: { enum: ["custom", "due"] },
            status: { enum: ["active", "completed", "abandoned"] },
            total: int,
            currentIndex: int,
            correctCount: int,
            wrongCount: int,
            config: { type: "object" },
            questions: {
              type: "array",
              items: obj(
                {
                  promptType: { enum: ["meaning", "hanzi", "pinyin"] },
                  prompt: obj(
                    {
                      hanzi: { type: "string" },
                      pinyin: { type: "string" },
                      meaningVi: { type: "string" },
                      imageId: { type: ["string", "null"] },
                    },
                    [],
                  ),
                  answered: { type: "boolean" },
                  userAnswer: { type: ["string", "null"] },
                  isCorrect: { type: ["boolean", "null"] },
                  reveal: { type: "object" },
                },
                ["promptType", "prompt", "answered"],
              ),
            },
          },
        },
      },
    },
    paths: withOperationIds({
      "/api/auth/sign-in/email": {
        post: {
          ...op(A, {
            summary: "Đăng nhập",
            description:
              "Better Auth. Thành công → cookie phiên trong `Set-Cookie` (dạng kết quả của Better Auth, không bọc `ok`).",
            body: obj({ email: { type: "string", format: "email" }, password: { type: "string" } }),
            example: { email: "ban@example.com", password: "matkhau123" },
          }),
          security: [],
        },
      },
      "/api/auth/sign-out": {
        post: { ...op(A, { summary: "Đăng xuất", body: { type: "object" }, example: {} }), security: [] },
      },
      "/api/v1/me/locale": {
        get: op(A, { summary: "Xem ngôn ngữ giao diện", data: obj({ locale: { enum: ["vi", "en"] } }) }),
        put: op(A, {
          summary: "Đổi ngôn ngữ giao diện",
          body: obj({ locale: { enum: ["vi", "en"] } }),
          example: { locale: "en" },
          data: obj({ locale: { enum: ["vi", "en"] } }),
        }),
      },

      "/api/v1/vocab": {
        get: op(V, {
          summary: "Danh sách từ (lọc, tìm, sắp xếp, phân trang)",
          params: [
            q("q", { type: "string" }, "Tìm theo chữ Hán / pinyin (không dấu cũng được) / nghĩa"),
            q("tag", { type: "string" }),
            q("radical", { type: "integer", minimum: 1, maximum: 214 }),
            q("sort", { enum: ["newest", "oldest", "pinyin", "favorite"] }),
            q("page", { type: "integer", minimum: 1 }),
            q("pageSize", { type: "integer", minimum: 1, maximum: 100, default: 20 }),
          ],
          data: obj({
            items: { type: "array", items: ref("Vocab") },
            total: int,
            page: int,
            pageCount: int,
            pageSize: int,
            totalAll: int,
            tagCounts: { type: "array", items: { type: "object" } },
          }),
        }),
        post: op(V, {
          summary: "Thêm từ",
          body: ref("VocabInput"),
          example: vocabExample,
          status: 201,
          data: obj({ id: { type: "string", format: "uuid" } }),
        }),
      },
      "/api/v1/vocab/{id}": {
        get: op(V, { summary: "Xem một từ", params: [pathId("id từ")], data: ref("Vocab"), errors: [404] }),
        put: op(V, {
          summary: "Sửa từ (toàn bộ)",
          params: [pathId("id từ")],
          body: ref("VocabInput"),
          example: { ...vocabExample, note: "đại từ" },
          data: ref("Vocab"),
          errors: [404],
        }),
        delete: op(V, { summary: "Xoá từ", params: [pathId("id từ")], data: obj({ removed: int }), errors: [404] }),
      },
      "/api/v1/vocab/{id}/favorite": {
        post: op(V, {
          summary: "Bật / tắt yêu thích",
          params: [pathId("id từ")],
          data: obj({ isFavorite: { type: "boolean" } }),
          errors: [404],
        }),
      },
      "/api/v1/vocab/tags": {
        get: op(V, {
          summary: "Tag và số từ",
          data: { type: "array", items: obj({ id: { type: "string" }, name: { type: "string" }, count: int }) },
        }),
      },
      "/api/v1/vocab/stats": {
        get: op(V, {
          summary: "Thống kê",
          data: obj({ total: int, learned: int, needReview: int, latest: { type: ["object", "null"] } }),
        }),
      },
      "/api/v1/vocab/sample": {
        post: op(V, { summary: "Thêm bộ từ mẫu (bỏ qua từ đã có)", data: obj({ added: int }) }),
      },
      "/api/v1/vocab/delete": {
        post: op(V, {
          summary: "Xoá nhiều từ",
          body: idsBody(),
          example: { ids: [EXAMPLE_ID] },
          data: obj({ removed: int }),
        }),
      },
      "/api/v1/vocab/status": {
        post: op(V, {
          summary: "Đổi trạng thái nhiều từ",
          body: idsBody({ status: { enum: [...STATUS] } }),
          example: { ids: [EXAMPLE_ID], status: "learned" },
          data: obj({ updated: int }),
        }),
      },
      "/api/v1/vocab/add-tags": {
        post: op(V, {
          summary: "Gắn thêm tag cho nhiều từ",
          body: idsBody({ tags: { type: "array", items: js(tagNameSchema), maxItems: 20 } }),
          example: { ids: [EXAMPLE_ID], tags: ["HSK2"] },
          data: obj({ updated: int }),
        }),
      },
      "/api/v1/vocab/shares": {
        post: op(V, {
          summary: "Chia sẻ từ cho người khác qua email",
          body: idsBody({ emails: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 50 } }),
          example: { ids: [EXAMPLE_ID], emails: ["ban@example.com"] },
          data: { type: "object", description: "Kết quả từng email (`results[]` có `message`)" },
        }),
      },
      "/api/v1/vocab/shares/sent": {
        get: op(V, { summary: "Lời mời đã gửi", data: { type: "array", items: { type: "object" } } }),
      },
      "/api/v1/vocab/shares/received": {
        get: op(V, { summary: "Lời mời nhận được", data: { type: "array", items: { type: "object" } } }),
      },
      "/api/v1/vocab/shares/{id}/accept": {
        post: op(V, {
          summary: "Chấp nhận lời mời (chép từ vào kho của mình)",
          params: [pathId("id lời mời")],
          body: obj(
            {
              keepTags: { type: "boolean", default: true },
              extraTags: { type: "array", items: js(tagNameSchema), maxItems: 20 },
            },
            [],
          ),
          example: { keepTags: true, extraTags: [] },
          data: obj({ added: int, skipped: int, total: int }),
          errors: [404],
        }),
      },
      "/api/v1/vocab/shares/{id}/reject": {
        post: op(V, {
          summary: "Từ chối lời mời",
          params: [pathId("id lời mời")],
          data: obj({ rejected: { const: true } }),
          errors: [404],
        }),
      },

      "/api/v1/review/pool": {
        get: op(R, {
          summary: "Số từ có thể ôn theo tag",
          params: [q("tags", { type: "string" }, "Các tag cách nhau bằng dấu phẩy; bỏ trống = mọi từ")],
          data: obj({ count: int }),
        }),
      },
      "/api/v1/review/due-count": {
        get: op(R, { summary: "Số thẻ đến hạn", data: obj({ count: int }) }),
      },
      "/api/v1/review/last-config": {
        get: op(R, { summary: "Thiết lập ôn tự chọn gần nhất (hoặc null)", data: { type: ["object", "null"] } }),
      },
      "/api/v1/review/sessions": {
        post: op(R, {
          summary: "Tạo bài ôn (bỏ bài đang dở nếu có)",
          description:
            "`mode`: `meaning` (cho chữ Hán + pinyin, đoán nghĩa) · `hanzi` (cho nghĩa + pinyin, viết chữ Hán) · " +
            "`pinyin` (cho chữ Hán + nghĩa, viết pinyin) · `mixed`.",
          body: {
            oneOf: [
              {
                title: "Ôn tự chọn",
                ...js(customConfigSchema.extend({ kind: z.literal("custom") })),
              },
              { title: "Ôn thẻ đến hạn", ...js(dueConfigSchema.extend({ kind: z.literal("due") })) },
            ],
          },
          example: { kind: "custom", count: 10, mode: "meaning", tags: ["HSK1"] },
          status: 201,
          data: ref("ReviewSession"),
          errors: [409],
        }),
      },
      "/api/v1/review/sessions/active": {
        get: op(R, { summary: "Bài đang làm (hoặc null)", data: { oneOf: [ref("ReviewSession"), { type: "null" }] } }),
        delete: op(R, { summary: "Bỏ bài đang làm", data: obj({ abandoned: { const: true } }) }),
      },
      "/api/v1/review/sessions/last-result": {
        get: op(R, {
          summary: "Kết quả bài đã nộp gần nhất (hoặc null)",
          data: {
            oneOf: [
              {
                allOf: [ref("ReviewSession"), obj({ wrongVocabIds: { type: "array", items: { type: "string" } } })],
              },
              { type: "null" },
            ],
          },
        }),
      },
      "/api/v1/review/sessions/{id}/answer": {
        post: op(R, {
          summary: "Trả lời một câu",
          params: [pathId("id phiên")],
          body: obj({
            index: { type: "integer", minimum: 0, maximum: 499 },
            answer: { type: "string", maxLength: 200 },
          }),
          example: { index: 0, answer: "anh ấy" },
          data: ref("ReviewSession"),
          errors: [404],
        }),
      },
      "/api/v1/review/sessions/{id}/rate": {
        post: op(R, {
          summary: "Đánh giá câu đúng (chỉ bài đến hạn): 2 Khó · 3 Được · 4 Dễ",
          params: [pathId("id phiên")],
          body: obj({ index: { type: "integer", minimum: 0, maximum: 499 }, rating: { enum: [2, 3, 4] } }),
          example: { index: 0, rating: 3 },
          data: ref("ReviewSession"),
          errors: [404],
        }),
      },
      "/api/v1/review/sessions/{id}/move": {
        post: op(R, {
          summary: "Chuyển tới câu (không vượt quá câu chưa làm đầu tiên)",
          params: [pathId("id phiên")],
          body: obj({ index: { type: "integer", minimum: 0, maximum: 499 } }),
          example: { index: 1 },
          data: obj({ index: int }),
          errors: [404],
        }),
      },
      "/api/v1/review/sessions/{id}/complete": {
        post: op(R, {
          summary: "Nộp bài (phải làm hết)",
          params: [pathId("id phiên")],
          data: ref("ReviewSession"),
          errors: [404],
        }),
      },

      "/api/v1/listening/exercises": {
        get: op(L, {
          summary: "Bài làm của tôi (tìm, lọc thẻ, sắp xếp, phân trang)",
          params: [
            q("q", { type: "string" }, "Tìm theo tiêu đề, bài chép, đáp án, ghi chú, thẻ"),
            q("tag", { type: "string" }),
            q("sort", { enum: ["newest", "oldest"] }),
            q("page", { type: "integer", minimum: 1 }),
            q("pageSize", { type: "integer", minimum: 1, maximum: 100, default: 20 }),
          ],
          data: obj({
            items: { type: "array", items: ref("ListeningExerciseSummary") },
            total: int,
            page: int,
            pageCount: int,
            pageSize: int,
            tags: { type: "array", items: obj({ id: { type: "string" }, name: { type: "string" }, count: int }) },
          }),
        }),
        post: op(L, {
          summary: "Lưu bài làm (server so sánh + chấm điểm)",
          body: ref("ListeningExerciseInput"),
          example: listeningExample,
          status: 201,
          data: ref("ListeningExercise"),
        }),
      },
      "/api/v1/listening/exercises/{id}": {
        get: op(L, {
          summary: "Xem một bài làm",
          params: [pathId("id bài làm")],
          data: ref("ListeningExercise"),
          errors: [404],
        }),
        put: op(L, {
          summary: "Sửa bài làm (toàn bộ; đáp án / bài chép đổi → chấm lại)",
          params: [pathId("id bài làm")],
          body: ref("ListeningExerciseInput"),
          example: { ...listeningExample, userAnswer: "你好，我是小雨。" },
          data: ref("ListeningExercise"),
          errors: [404],
        }),
        delete: op(L, {
          summary: "Xoá bài làm (không xoá từ vựng đã lưu)",
          params: [pathId("id bài làm")],
          data: obj({ deleted: { const: true } }),
          errors: [404],
        }),
      },
      "/api/v1/listening/tags": {
        get: op(L, {
          summary: "Thẻ của bài làm và số bài",
          data: { type: "array", items: obj({ id: { type: "string" }, name: { type: "string" }, count: int }) },
        }),
      },
      "/api/v1/admin/stats": {
        get: op(AD, {
          summary: "Số liệu tổng: số người dùng, admin, bị khoá, mới / hoạt động 7 ngày, tổng nội dung",
          data: obj({
            totalUsers: int,
            admins: int,
            disabled: int,
            newUsers7d: int,
            activeUsers7d: int,
            content: obj({ vocab: int, sentences: int, grammar: int, listening: int }),
          }),
          errors: [403],
        }),
      },
      "/api/v1/admin/users": {
        get: op(AD, {
          summary: "Danh sách người dùng (tìm theo tên / email, 20 người / trang)",
          params: [q("q", { type: "string" }), q("page", { type: "integer", minimum: 1 })],
          data: obj({
            items: {
              type: "array",
              items: obj({
                id: { type: "string", format: "uuid" },
                name: { type: "string" },
                email: { type: "string" },
                role: { enum: ["user", "admin"] },
                disabledAt: { type: ["string", "null"], format: "date-time" },
                createdAt: { type: "string", format: "date-time" },
                lastLoginAt: { type: ["string", "null"], format: "date-time" },
                vocabCount: int,
              }),
            },
            total: int,
            page: int,
            pageCount: int,
            pageSize: int,
          }),
          errors: [403],
        }),
      },
      "/api/v1/admin/users/{id}": {
        get: op(AD, {
          summary: "Thông tin một người dùng + số lượng nội dung",
          params: [pathId("id người dùng")],
          data: obj({
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string" },
            emailVerified: { type: "boolean" },
            role: { enum: ["user", "admin"] },
            locale: { type: ["string", "null"] },
            disabledAt: { type: ["string", "null"], format: "date-time" },
            createdAt: { type: "string", format: "date-time" },
            lastLoginAt: { type: ["string", "null"], format: "date-time" },
            counts: obj({ vocab: int, sentences: int, grammar: int, listening: int }),
          }),
          errors: [403, 404],
        }),
      },
      "/api/v1/me": {
        get: op(A, {
          summary: "Hồ sơ của tôi",
          data: obj({
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string" },
            role: { enum: ["user", "admin"] },
            locale: { enum: ["vi", "en"] },
          }),
        }),
        put: op(A, {
          summary: "Đổi tên",
          body: obj({ name: { type: "string", maxLength: 60 } }),
          example: { name: "Nguyễn Văn An" },
          data: obj({ name: { type: "string" } }),
        }),
        delete: op(A, {
          summary: "Xoá tài khoản và toàn bộ dữ liệu (cần mật khẩu, không hoàn tác được)",
          body: obj({ password: { type: "string" } }),
          example: { password: "••••••••" },
          data: obj({ deleted: { const: true } }),
        }),
      },
      "/api/v1/me/password": {
        post: op(A, {
          summary: "Đổi mật khẩu (thiết bị khác bị đăng xuất)",
          body: obj({ current: { type: "string" }, password: { type: "string", minLength: 8 } }),
          example: { current: "mat-khau-cu", password: "mat-khau-moi-123" },
          data: obj({ changed: { const: true } }),
        }),
      },
      "/api/v1/me/export": {
        get: op(A, { summary: "Xuất toàn bộ dữ liệu học tập (JSON, như file Xuất dữ liệu)", data: { type: "object" } }),
      },
      "/api/v1/me/import": {
        post: op(A, {
          summary: "Nhập dữ liệu đã xuất (gộp, không ghi đè; tối đa 30MB) → báo cáo thêm / bỏ qua",
          body: { type: "object", description: 'Nội dung file đã xuất (`format: "lingyu-export"`)' },
          data: { type: "object" },
        }),
      },
      "/api/v1/home": {
        get: op(H, {
          summary: "Số liệu Trang chủ",
          data: obj({
            vocab: obj({ total: int, learned: int }),
            sentences: obj({ total: int, learned: int }),
            grammar: int,
            newToday: int,
            reviewsToday: int,
            dueCount: int,
            activeReview: { type: ["object", "null"] },
            lessons: obj({ done: int, total: int, percent: int }),
            unreadNotifications: int,
          }),
        }),
      },

      "/api/v1/grammar": {
        get: op(G, {
          summary: "Ngữ pháp của tôi (tìm, lọc thẻ, sắp xếp, chỉ đã lưu)",
          params: [
            q("q", { type: "string" }, "Tìm trong tiêu đề, nghĩa, cấu trúc, ghi chú, ví dụ, thẻ (không dấu được)"),
            q("tag", { type: "string", format: "uuid" }, "id thẻ"),
            q("sort", { enum: ["updated", "newest", "oldest", "az", "za"] }),
            q("view", { enum: ["all", "saved"] }),
          ],
          data: obj({ items: { type: "array", items: ref("Grammar") }, total: int, totalAll: int, savedCount: int }),
        }),
        post: op(G, {
          summary: "Thêm ngữ pháp",
          body: js(grammarInputSchema),
          example: {
            title: "Câu hỏi với 吗",
            meaning: "Thêm 吗 cuối câu trần thuật để thành câu hỏi có / không.",
            structure: "Câu trần thuật + 吗？\nPhủ định: 不 + động từ + 吗？",
            notes: "Không dùng 吗 với câu đã có từ để hỏi.",
            personalNote: "",
            examples: [{ chinese: "你好吗？", pinyin: "Nǐ hǎo ma?", vietnamese: "Bạn khỏe không?" }],
            tags: ["HSK1"],
          },
          status: 201,
          data: ref("Grammar"),
        }),
      },
      "/api/v1/grammar/{id}": {
        get: op(G, {
          summary:
            "Xem ngữ pháp: chủ sở hữu → đầy đủ; người nhận có lời mời đang chờ → bản xem trước; người khác → 404",
          params: [pathId("id ngữ pháp"), q("share", { type: "string", format: "uuid" }, "id lời mời (xem trước)")],
          data: obj({
            mode: { enum: ["owner", "preview"] },
            grammar: ref("Grammar"),
            share: { type: ["object", "null"] },
          }),
          errors: [404],
        }),
        put: op(G, {
          summary: "Sửa ngữ pháp (toàn bộ)",
          params: [pathId("id ngữ pháp")],
          body: js(grammarInputSchema),
          data: ref("Grammar"),
          errors: [404],
        }),
        delete: op(G, {
          summary: "Xoá ngữ pháp",
          params: [pathId("id ngữ pháp")],
          data: obj({ deleted: { const: true } }),
          errors: [404],
        }),
      },
      "/api/v1/grammar/{id}/note": {
        put: op(G, {
          summary: "Ghi chú cá nhân (riêng tư, không chia sẻ; rỗng = xoá)",
          params: [pathId("id ngữ pháp")],
          body: obj({ content: { type: "string", maxLength: 2000 } }),
          example: { content: "Nhớ: 吗 chỉ dùng cho câu hỏi có / không." },
          data: obj({ personalNote: { type: "string" } }),
          errors: [404],
        }),
      },
      "/api/v1/grammar/{id}/bookmark": {
        put: op(G, {
          summary: "Lưu / bỏ lưu",
          params: [pathId("id ngữ pháp")],
          body: obj({ saved: { type: "boolean" } }),
          example: { saved: true },
          data: obj({ saved: { type: "boolean" } }),
          errors: [404],
        }),
      },
      "/api/v1/grammar/{id}/shares": {
        get: op(G, {
          summary: "Đã chia sẻ ngữ pháp này cho ai (trạng thái)",
          params: [pathId("id ngữ pháp")],
          data: { type: "array" },
          errors: [404],
        }),
        post: op(G, {
          summary: "Chia sẻ cho người khác qua email → kết quả từng email",
          params: [pathId("id ngữ pháp")],
          body: obj({ emails: { type: "array", items: { type: "string", format: "email" }, maxItems: 50 } }),
          example: { emails: ["ban@example.com"] },
          data: obj({ results: { type: "array" }, sent: int }),
          errors: [404],
        }),
      },
      "/api/v1/grammar/tags": {
        get: op(G, {
          summary: "Thẻ ngữ pháp và số bài",
          data: { type: "array", items: obj({ id: { type: "string" }, name: { type: "string" }, count: int }) },
        }),
        post: op(G, {
          summary: "Tạo thẻ (trùng tên → 409)",
          body: obj({ name: js(grammarTagName) }),
          example: { name: "HSK2" },
          status: 201,
          data: obj({ id: { type: "string" }, name: { type: "string" } }),
          errors: [409],
        }),
      },
      "/api/v1/grammar/tags/{id}": {
        put: op(G, {
          summary: "Đổi tên thẻ",
          params: [pathId("id thẻ")],
          body: obj({ name: js(grammarTagName) }),
          example: { name: "HSK 2" },
          data: obj({ id: { type: "string" }, name: { type: "string" } }),
          errors: [404, 409],
        }),
        delete: op(G, {
          summary: "Xoá thẻ (ngữ pháp giữ nguyên)",
          params: [pathId("id thẻ")],
          data: obj({ deleted: { const: true } }),
          errors: [404],
        }),
      },
      "/api/v1/grammar/shares/received": {
        get: op(G, { summary: "Lời mời chia sẻ ngữ pháp đang chờ tôi trả lời", data: { type: "array" } }),
      },
      "/api/v1/grammar/shares/{id}/tags": {
        get: op(G, {
          summary: "Thẻ của người gửi (để chọn giữ khi chấp nhận)",
          params: [pathId("id lời mời")],
          data: { type: "array", items: { type: "string" } },
        }),
      },
      "/api/v1/grammar/shares/{id}/accept": {
        post: op(G, {
          summary: "Chấp nhận: tạo bản riêng trong thư viện của mình (không chép ghi chú cá nhân của người gửi)",
          params: [pathId("id lời mời")],
          body: obj(
            { keepTags: { type: "boolean", default: true }, extraTags: { type: "array", items: js(grammarTagName) } },
            [],
          ),
          example: { keepTags: true, extraTags: ["Được chia sẻ"] },
          data: obj({ id: { type: "string", format: "uuid" }, title: { type: "string" } }),
          errors: [404, 409],
        }),
      },
      "/api/v1/grammar/shares/{id}/reject": {
        post: op(G, {
          summary: "Từ chối lời mời",
          params: [pathId("id lời mời")],
          data: obj({ rejected: { const: true } }),
          errors: [404, 409],
        }),
      },
      "/api/v1/grammar/sample": {
        post: op(G, { summary: "Thêm bộ ngữ pháp mẫu", data: obj({ added: int }) }),
      },

      "/api/v1/sentences": {
        get: op(S, {
          summary: "Kho câu của tôi (tìm, lọc tag / Yêu thích, phân trang)",
          params: [
            q("q", { type: "string" }, "Tìm trong câu tiếng Trung, pinyin, nghĩa (không dấu được), tag"),
            q("tag", { type: "string" }, "Tên tag, hoặc `__fav` = Yêu thích"),
            q("page", { type: "integer", minimum: 1 }),
            q("pageSize", { type: "integer", minimum: 1, maximum: 100, default: 20 }),
          ],
          data: obj({
            items: { type: "array", items: ref("Sentence") },
            total: int,
            totalAll: int,
            favCount: int,
            page: int,
            pageCount: int,
            pageSize: int,
            tags: { type: "array" },
          }),
        }),
        post: op(S, {
          summary: "Thêm câu",
          body: js(sentenceInputSchema),
          example: {
            chinese: "我爱你。",
            pinyin: "Wǒ ài nǐ.",
            vietnamese: "Tôi yêu bạn.",
            note: "",
            tags: ["Tình cảm"],
          },
          status: 201,
          data: ref("Sentence"),
        }),
      },
      "/api/v1/sentences/{id}": {
        get: op(S, { summary: "Một câu", params: [pathId("id câu")], data: ref("Sentence"), errors: [404] }),
        put: op(S, {
          summary: "Sửa câu",
          params: [pathId("id câu")],
          body: js(sentenceInputSchema),
          data: ref("Sentence"),
          errors: [404],
        }),
        delete: op(S, {
          summary: "Xoá câu",
          params: [pathId("id câu")],
          data: obj({ deleted: { const: true } }),
          errors: [404],
        }),
      },
      "/api/v1/sentences/{id}/favorite": {
        post: op(S, {
          summary: "Bật / tắt Yêu thích",
          params: [pathId("id câu")],
          data: obj({ isFavorite: { type: "boolean" } }),
          errors: [404],
        }),
      },
      "/api/v1/sentences/tags": {
        get: op(S, {
          summary: "Tag và số câu",
          data: { type: "array", items: obj({ id: { type: "string" }, name: { type: "string" }, count: int }) },
        }),
      },
      "/api/v1/sentences/delete": {
        post: op(S, {
          summary: "Xoá nhiều câu",
          body: obj({ ids: { type: "array", items: { type: "string", format: "uuid" }, maxItems: 500 } }),
          example: { ids: [EXAMPLE_ID] },
          data: obj({ removed: int }),
        }),
      },
      "/api/v1/sentences/status": {
        post: op(S, {
          summary: "Đổi trạng thái nhiều câu",
          body: obj({
            ids: { type: "array", items: { type: "string", format: "uuid" }, maxItems: 500 },
            status: { enum: ["learned", "review"] },
          }),
          example: { ids: [EXAMPLE_ID], status: "learned" },
          data: obj({ updated: int }),
        }),
      },
      "/api/v1/sentences/sample": {
        post: op(S, { summary: "Thêm bộ câu mẫu", data: obj({ added: int }) }),
      },
      "/api/v1/sentences/review/pool": {
        get: op(S, {
          summary: "Số câu có thể ôn theo tag",
          params: [q("tags", { type: "string" }, "Tên tag, cách nhau bằng dấu phẩy; bỏ trống = mọi câu")],
          data: obj({ count: int }),
        }),
      },
      "/api/v1/sentences/review/last-config": {
        get: op(S, { summary: "Thiết lập ôn gần nhất (hoặc null)", data: { type: ["object", "null"] } }),
      },
      "/api/v1/sentences/review/sessions": {
        post: op(S, {
          summary: "Tạo bài ôn dịch câu (bỏ bài đang dở). Không có câu phù hợp → 409",
          body: js(sentenceConfigSchema),
          example: { direction: "vi-zh", count: 10, tags: [], showPinyin: false, showHint: true },
          status: 201,
          data: ref("SentenceSession"),
          errors: [409],
        }),
      },
      "/api/v1/sentences/review/sessions/active": {
        get: op(S, { summary: "Bài đang làm (hoặc null)", data: ref("SentenceSession") }),
        delete: op(S, { summary: "Bỏ bài đang làm", data: obj({ abandoned: { const: true } }) }),
      },
      "/api/v1/sentences/review/sessions/last-result": {
        get: op(S, { summary: "Kết quả bài đã nộp gần nhất (hoặc null), có `wrongIds`", data: ref("SentenceSession") }),
      },
      ...Object.fromEntries(
        (
          [
            [
              "answer",
              "Trả lời một câu → phiên đã chấm",
              { index: int, answer: { type: "string", maxLength: 400 } },
              { index: 0, answer: "我爱你。" },
            ],
            ["skip", "Bỏ qua một câu", { index: int }, { index: 0 }],
            ["override", "Máy chấm sai nhưng bạn dịch đúng → tính là đúng", { index: int }, { index: 0 }],
            ["hint", "Xem gợi ý chữ Hán (chiều Việt → Trung)", { index: int }, { index: 0 }],
            [
              "remember",
              "Sau khi trả lời: nhớ → “Đã thuộc”, chưa nhớ → “Cần ôn”",
              { index: int, remembered: { type: "boolean" } },
              { index: 0, remembered: true },
            ],
            ["move", "Chuyển tới câu (không vượt quá câu chưa làm đầu tiên) → { index }", { index: int }, { index: 1 }],
          ] as const
        ).map(([name, summary, props, example]) => [
          `/api/v1/sentences/review/sessions/{id}/${name}`,
          {
            post: op(S, {
              summary,
              params: [pathId("id phiên")],
              body: obj(props as Record<string, Schema>),
              example,
              data: name === "move" ? obj({ index: int }) : ref("SentenceSession"),
              errors: [404],
            }),
          },
        ]),
      ),
      "/api/v1/sentences/review/sessions/{id}/complete": {
        post: op(S, {
          summary: "Nộp bài (phải làm hết, nếu chưa → 400) → kết quả",
          params: [pathId("id phiên")],
          data: ref("SentenceSession"),
          errors: [404],
        }),
      },

      "/api/v1/radicals": {
        get: op(RD, {
          summary: "214 bộ thủ (tìm theo số, chữ, tên, pinyin, nghĩa) kèm `known`",
          params: [q("q", { type: "string" })],
          data: obj({ items: { type: "array", items: ref("Radical") }, total: int, knownCount: int }),
        }),
      },
      "/api/v1/radicals/{num}": {
        get: op(RD, {
          summary: "Một bộ thủ + chữ ví dụ",
          params: [{ name: "num", in: "path", required: true, schema: { type: "integer", minimum: 1, maximum: 214 } }],
          data: ref("Radical"),
          errors: [404],
        }),
      },
      "/api/v1/radicals/{num}/known": {
        put: op(RD, {
          summary: "Đánh dấu đã thuộc / bỏ đánh dấu",
          params: [{ name: "num", in: "path", required: true, schema: { type: "integer", minimum: 1, maximum: 214 } }],
          body: obj({ known: { type: "boolean" } }),
          example: { known: true },
          data: obj({ known: { type: "boolean" } }),
          errors: [404],
        }),
      },

      "/api/v1/lessons": {
        get: op(LS, {
          summary: "Danh sách bài học + tiến độ của tôi",
          data: obj({ done: int, total: int, percent: int, lessons: { type: "array" } }),
        }),
      },
      "/api/v1/lessons/{id}": {
        get: op(LS, {
          summary: "Nội dung một bài học (phần, câu hỏi, âm thanh) + tiến độ từng phần",
          params: [{ name: "id", in: "path", required: true, schema: { type: "string" }, description: "vd `bai1`" }],
          data: { type: "object" },
          errors: [404],
        }),
      },
      "/api/v1/lessons/{id}/sections/{section}": {
        post: op(LS, {
          summary: "Nộp một phần: chỉ số đáp án đã chọn cho từng câu; server tự chấm → { score, total }",
          params: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "section", in: "path", required: true, schema: { type: "string" } },
          ],
          body: obj({ answers: { type: "array", items: { type: ["integer", "null"], minimum: 0, maximum: 3 } } }),
          example: { answers: [0, 2, 1, null] },
          data: obj({ score: int, total: int }),
          errors: [404],
        }),
      },

      "/api/v1/notifications": {
        get: op(N, {
          summary: "20 thông báo mới nhất, số chưa đọc, id lời mời còn chờ",
          data: obj({
            items: { type: "array" },
            unread: int,
            pendingGrammar: { type: "array", items: { type: "string" } },
            pendingVocab: { type: "array" },
          }),
        }),
      },
      "/api/v1/notifications/read": {
        post: op(N, {
          summary: "Đánh dấu đã đọc (bỏ trống `ids` = tất cả) → số còn chưa đọc",
          body: obj({ ids: { type: "array", items: { type: "string", format: "uuid" }, maxItems: 100 } }, []),
          example: {},
          data: obj({ unread: int }),
        }),
      },

      "/api/v1/progress": {
        get: op(PG, {
          summary:
            "Tổng quan: tổng thời gian học, bài học, từ vựng, ngữ pháp, kỹ năng (%), chuỗi ngày học, mục tiêu, hôm nay",
          data: { type: "object" },
        }),
      },
      "/api/v1/progress/daily": {
        get: op(PG, {
          summary: "Số phút học mỗi ngày",
          params: [q("days", { enum: [7, 30, 90], default: 7 })],
          data: { type: "array", items: obj({ day: { type: "string", format: "date" }, minutes: int }) },
        }),
      },
      "/api/v1/progress/history": {
        get: op(PG, {
          summary: "Lịch sử học tập (mới nhất trước)",
          params: [
            q("kind", { enum: [...ACTIVITY_KINDS] }),
            q("days", { type: "integer", minimum: 1, maximum: 365, default: 7 }),
            q("limit", { type: "integer", minimum: 1, maximum: 500, default: 100 }),
          ],
          data: { type: "array", items: { type: "object" } },
        }),
      },
      "/api/v1/progress/vocab": {
        get: op(PG, {
          summary: "Tiến độ từ vựng theo cấp HSK (HSK 3.1) và theo thẻ",
          data: obj({ hsk: { type: "array" }, tags: { type: "array" } }),
        }),
      },
      "/api/v1/progress/grammar": {
        get: op(PG, {
          summary: "Tiến độ ngữ pháp theo cấp HSK (thẻ “HSK n”) và theo thẻ",
          data: obj({ hsk: { type: "array" }, tags: { type: "array" } }),
        }),
      },
      "/api/v1/progress/goals": {
        get: op(PG, {
          summary: "Mục tiêu học tập",
          data: obj({ minutes_day: int, lessons_week: int, vocab_month: int }),
        }),
        put: op(PG, {
          summary: "Đổi mục tiêu",
          body: js(goalsSchema),
          example: { minutes_day: 30, lessons_week: 2, vocab_month: 50 },
          data: obj({ minutes_day: int, lessons_week: int, vocab_month: int }),
        }),
      },
      "/api/v1/progress/ping": {
        post: op(PG, {
          summary: "Nhịp “đang học” (~mỗi phút khi app mở và có thao tác) → cộng thời gian học hôm nay",
          data: obj({ day: { type: "string", format: "date" }, seconds: int }),
        }),
      },
      "/api/v1/progress/activity": {
        post: op(PG, {
          summary: "Ghi hoạt động tự luyện chấm trên máy (hiện có: pronunciation)",
          body: js(clientActivitySchema),
          example: { kind: "pronunciation", title: "Nghe & Chọn đáp án", correct: 8, total: 10 },
          status: 201,
          data: obj({ recorded: { const: true } }),
        }),
      },
      "/api/v1/search": {
        get: op(SE, {
          summary: "Tìm kiếm chung (mỗi loại tối đa 5 kết quả)",
          params: [q("q", { type: "string", maxLength: 100 })],
          data: obj({
            vocab: { type: "array" },
            grammar: { type: "array" },
            sentences: { type: "array" },
            lessons: { type: "array" },
            radicals: { type: "array" },
            total: int,
          }),
        }),
      },

      "/api/v1/pronunciation": {
        get: op(P, {
          summary: "Nội dung bài học: thanh mẫu, vận mẫu, thanh điệu, quy tắc biến điệu (chữ có sẵn vi / en)",
          data: obj({
            initials: obj({ groups: { type: "array" }, items: { type: "array" } }),
            finals: obj({ groups: { type: "array" }, items: { type: "array" } }),
            tones: obj({ items: { type: "array" }, sets: { type: "array" }, tips: { type: "array" } }),
            sandhi: obj({ rules: { type: "array" }, tips: { type: "array" } }),
          }),
        }),
      },
      "/api/v1/pronunciation/practice": {
        get: op(P, {
          summary: "Tạo bài tự luyện (có kèm đáp án để chấm trên máy)",
          params: [
            { ...q("mode", { enum: [...PRACTICE_MODES] }), required: true },
            q("count", { type: "integer", minimum: 1, maximum: 20, default: 10 }),
          ],
          data: obj({
            mode: { enum: [...PRACTICE_MODES] },
            questions: { type: "array", items: ref("PracticeQuestion") },
          }),
          errors: [400],
        }),
      },
      "/api/v1/pronunciation/notes": {
        get: op(P, {
          summary: "Ghi chú phát âm của tôi (mới sửa trước)",
          data: { type: "array", items: ref("PronunciationNote") },
        }),
        post: op(P, {
          summary:
            "Tạo ghi chú tự do (201), hoặc lưu ghi chú của một mục qua `topic` (200; nội dung rỗng = xoá → data null)",
          description:
            "`topic`: `initial:b`, `final:ang`, `tone:3`, `sandhi:third-two`, `sandhi:third-two:0` (ví dụ thứ 1), `sandhi:general`.",
          body: js(noteInputSchema),
          example: { title: "Phân biệt z / zh", content: "早 zǎo – 找 zhǎo: zh cong lưỡi." },
          status: 201,
          data: ref("PronunciationNote"),
        }),
      },
      "/api/v1/pronunciation/notes/{id}": {
        get: op(P, {
          summary: "Xem một ghi chú",
          params: [pathId("id ghi chú")],
          data: ref("PronunciationNote"),
          errors: [404],
        }),
        put: op(P, {
          summary: "Sửa ghi chú",
          params: [pathId("id ghi chú")],
          body: js(noteUpdateSchema),
          example: { content: "Nhớ bật hơi với p, t, k." },
          data: ref("PronunciationNote"),
          errors: [404],
        }),
        delete: op(P, {
          summary: "Xoá ghi chú",
          params: [pathId("id ghi chú")],
          data: obj({ deleted: { const: true } }),
          errors: [404],
        }),
      },
      "/api/v1/listening/compare": {
        post: op(L, {
          summary: "So sánh bài chép với đáp án (không lưu)",
          body: js(compareInputSchema),
          example: { referenceAnswer: "你好，我是小雨。", userAnswer: "你好，我叫小雨。" },
          data: ref("Comparison"),
        }),
      },
    }),
  };
}

/** operationId ổn định từ method + đường dẫn, vd `post_vocab_id_favorite` (để sinh code client). */
function withOperationIds<T extends Record<string, Record<string, object>>>(paths: T): T {
  for (const [url, ops] of Object.entries(paths))
    for (const [method, o] of Object.entries(ops)) {
      const name = url
        .replace(/^\/api\/(v1\/)?/, "")
        .replace(/[{}]/g, "")
        .replace(/[^\w]+/g, "_");
      Object.assign(o, { operationId: `${method}_${name}` });
    }
  return paths;
}
