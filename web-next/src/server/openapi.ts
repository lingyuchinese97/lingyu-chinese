import { z } from "zod";
import { idsSchema, STATUS, tagNameSchema, vocabInputSchema } from "@/features/vocabulary/schema";
import { customConfigSchema, dueConfigSchema } from "@/features/review/schema";

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
const A = "Tài khoản";

const vocabExample = {
  hanzi: "他",
  pinyin: "tā",
  meaningVi: "anh ấy",
  note: "",
  tags: ["HSK1"],
  radicals: [9],
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
