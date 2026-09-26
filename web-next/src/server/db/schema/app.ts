/**
 * Bảng của app (ngoài bảng Better Auth trong ./auth.ts).
 * Tên trường, giới hạn, enum lấy theo code mock của bản cũ (web/src/services/api/*.js) — xem src/lib/limits.ts.
 * Mọi bảng có userId đều `onDelete: cascade` để xoá tài khoản sạch sẽ.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({ dataType: () => "bytea" });

const id = () => uuid("id").primaryKey().defaultRandom();
const userRef = () =>
  uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

export const vocabStatus = pgEnum("vocab_status", ["learned", "review"]);
export const shareStatus = pgEnum("share_status", ["PENDING", "ACCEPTED", "REJECTED"]);

// ---------- Ảnh (storage driver "db") ----------
export const image = pgTable(
  "image",
  {
    id: id(),
    userId: userRef(),
    mime: text("mime").notNull(),
    data: bytea("data").notNull(),
    size: integer("size").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("image_user_idx").on(t.userId)],
);

// ---------- Từ vựng ----------
export const vocab = pgTable(
  "vocab",
  {
    id: id(),
    userId: userRef(),
    hanzi: text("hanzi").notNull(),
    pinyin: text("pinyin").notNull(),
    meaningVi: text("meaning_vi").notNull(),
    /** Bản bỏ dấu để tìm kiếm (fold ở src/lib/fold.ts), tính lại mỗi lần ghi. */
    pinyinFold: text("pinyin_fold").notNull().default(""),
    meaningFold: text("meaning_fold").notNull().default(""),
    note: text("note").notNull().default(""),
    imageId: uuid("image_id").references(() => image.id, { onDelete: "set null" }),
    status: vocabStatus("status").notNull().default("review"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    radicals: integer("radicals")
      .array()
      .notNull()
      .default(sql`'{}'::integer[]`),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("vocab_user_idx").on(t.userId),
    index("vocab_user_created_idx").on(t.userId, t.createdAt),
    // Không unique theo Hán tự: một chữ có thể có nhiều nghĩa/cách đọc (vd 行 xíng/háng).
    index("vocab_user_hanzi_idx").on(t.userId, t.hanzi),
  ],
);

export const vocabTag = pgTable(
  "vocab_tag",
  { id: id(), userId: userRef(), name: text("name").notNull(), createdAt: createdAt() },
  (t) => [uniqueIndex("vocab_tag_user_name_uq").on(t.userId, sql`lower(${t.name})`)],
);

export const vocabToTag = pgTable(
  "vocab_to_tag",
  {
    vocabId: uuid("vocab_id")
      .notNull()
      .references(() => vocab.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => vocabTag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.vocabId, t.tagId] }), index("vocab_to_tag_tag_idx").on(t.tagId)],
);

// ---------- Ôn tập ngắt quãng (FSRS) ----------
export const srsCard = pgTable(
  "srs_card",
  {
    id: id(),
    userId: userRef(),
    vocabId: uuid("vocab_id")
      .notNull()
      .references(() => vocab.id, { onDelete: "cascade" }),
    due: timestamp("due", { withTimezone: true }).notNull().defaultNow(),
    stability: doublePrecision("stability").notNull().default(0),
    difficulty: doublePrecision("difficulty").notNull().default(0),
    elapsedDays: integer("elapsed_days").notNull().default(0),
    scheduledDays: integer("scheduled_days").notNull().default(0),
    learningSteps: integer("learning_steps").notNull().default(0),
    reps: integer("reps").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    /** ts-fsrs State: 0 New, 1 Learning, 2 Review, 3 Relearning */
    state: smallint("state").notNull().default(0),
    lastReview: timestamp("last_review", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("srs_card_vocab_uq").on(t.vocabId), index("srs_card_user_due_idx").on(t.userId, t.due)],
);

export const srsReviewLog = pgTable(
  "srs_review_log",
  {
    id: id(),
    userId: userRef(),
    cardId: uuid("card_id")
      .notNull()
      .references(() => srsCard.id, { onDelete: "cascade" }),
    /** ts-fsrs Rating: 1 Again, 2 Hard, 3 Good, 4 Easy */
    rating: smallint("rating").notNull(),
    state: smallint("state").notNull(),
    due: timestamp("due", { withTimezone: true }).notNull(),
    stability: doublePrecision("stability").notNull(),
    difficulty: doublePrecision("difficulty").notNull(),
    elapsedDays: integer("elapsed_days").notNull(),
    lastElapsedDays: integer("last_elapsed_days").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    learningSteps: integer("learning_steps").notNull().default(0),
    review: timestamp("review", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("srs_review_log_card_idx").on(t.cardId)],
);

// ---------- Phiên ôn tập (lưu server để resume khi refresh/đổi thiết bị) ----------
export const reviewSession = pgTable(
  "review_session",
  {
    id: id(),
    userId: userRef(),
    /** "custom" (ôn tự chọn) | "due" (ôn đến hạn FSRS) */
    kind: text("kind").notNull().default("custom"),
    config: jsonb("config").notNull(),
    /** Câu hỏi + đáp án người dùng + đúng/sai. Đáp án đúng chỉ nằm ở server. */
    questions: jsonb("questions").notNull(),
    currentIndex: integer("current_index").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    wrongCount: integer("wrong_count").notNull().default(0),
    /** "active" | "completed" | "abandoned" */
    status: text("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("review_session_user_status_idx").on(t.userId, t.status)],
);

// ---------- Ngữ pháp ----------
export const grammar = pgTable(
  "grammar",
  {
    id: id(),
    userId: userRef(),
    /** Bản được chép từ lời mời chia sẻ: id ngữ pháp gốc (không khoá ngoại — bản gốc có thể bị xoá). */
    sourceGrammarId: uuid("source_grammar_id"),
    sourceOwnerName: text("source_owner_name"),
    title: text("title").notNull(),
    meaning: text("meaning").notNull().default(""),
    structure: text("structure").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("grammar_user_updated_idx").on(t.userId, t.updatedAt)],
);

export const grammarExample = pgTable(
  "grammar_example",
  {
    id: id(),
    grammarId: uuid("grammar_id")
      .notNull()
      .references(() => grammar.id, { onDelete: "cascade" }),
    chinese: text("chinese").notNull(),
    pinyin: text("pinyin").notNull().default(""),
    vietnamese: text("vietnamese").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("grammar_example_grammar_idx").on(t.grammarId, t.sortOrder)],
);

export const grammarTag = pgTable(
  "grammar_tag",
  { id: id(), userId: userRef(), name: text("name").notNull(), createdAt: createdAt() },
  (t) => [uniqueIndex("grammar_tag_user_name_uq").on(t.userId, sql`lower(${t.name})`)],
);

export const grammarToTag = pgTable(
  "grammar_to_tag",
  {
    grammarId: uuid("grammar_id")
      .notNull()
      .references(() => grammar.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => grammarTag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.grammarId, t.tagId] }), index("grammar_to_tag_tag_idx").on(t.tagId)],
);

export const grammarBookmark = pgTable(
  "grammar_bookmark",
  {
    id: id(),
    userId: userRef(),
    grammarId: uuid("grammar_id")
      .notNull()
      .references(() => grammar.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("grammar_bookmark_uq").on(t.userId, t.grammarId)],
);

/** Ghi chú cá nhân — bảng riêng, KHÔNG BAO GIỜ được chia sẻ. */
export const grammarPersonalNote = pgTable(
  "grammar_personal_note",
  {
    userId: userRef(),
    grammarId: uuid("grammar_id")
      .notNull()
      .references(() => grammar.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.grammarId] })],
);

// ---------- Chia sẻ ----------
export const grammarShare = pgTable(
  "grammar_share",
  {
    id: id(),
    /** Null khi ngữ pháp gốc đã bị xoá (lời mời đã xử lý vẫn giữ lịch sử). */
    grammarId: uuid("grammar_id").references(() => grammar.id, { onDelete: "set null" }),
    grammarTitle: text("grammar_title").notNull(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: shareStatus("status").notNull().default("PENDING"),
    importedGrammarId: uuid("imported_grammar_id"),
    createdAt: createdAt(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    index("grammar_share_recipient_idx").on(t.recipientId, t.status),
    index("grammar_share_sender_idx").on(t.senderId),
    // Không gửi trùng lời mời đang chờ cho cùng ngữ pháp + người nhận.
    uniqueIndex("grammar_share_pending_uq")
      .on(t.grammarId, t.recipientId)
      .where(sql`${t.status} = 'PENDING'`),
  ],
);

export const vocabShare = pgTable(
  "vocab_share",
  {
    id: id(),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Bản chụp các từ lúc gửi (≤ 200 từ): [{hanzi, pinyin, meaningVi, note, tags, radicals, imageId}] */
    words: jsonb("words").notNull(),
    /** Khoá so trùng: danh sách Hán tự đã sắp xếp, nối bằng "|" */
    wordsKey: text("words_key").notNull(),
    count: integer("count").notNull(),
    status: shareStatus("status").notNull().default("PENDING"),
    added: integer("added"),
    createdAt: createdAt(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (t) => [
    index("vocab_share_recipient_idx").on(t.recipientId, t.status),
    index("vocab_share_sender_idx").on(t.senderId),
    uniqueIndex("vocab_share_pending_uq")
      .on(t.senderId, t.recipientId, t.wordsKey)
      .where(sql`${t.status} = 'PENDING'`),
  ],
);

// ---------- Thông báo ----------
export const notification = pgTable(
  "notification",
  {
    id: id(),
    userId: userRef(),
    /** grammar_share | grammar_share_accepted | grammar_share_rejected | vocab_share | vocab_share_accepted | vocab_share_rejected */
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("notification_user_created_idx").on(t.userId, t.createdAt)],
);

// ---------- Bộ thủ & Bài học ----------
export const radicalKnown = pgTable(
  "radical_known",
  { userId: userRef(), radical: smallint("radical").notNull(), createdAt: createdAt() },
  (t) => [primaryKey({ columns: [t.userId, t.radical] })],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: userRef(),
    lessonId: text("lesson_id").notNull(),
    section: text("section").notNull(),
    bestScore: integer("best_score").notNull().default(0),
    total: integer("total").notNull(),
    lastScore: integer("last_score").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId, t.section] })],
);

// ---------- Ôn dịch câu ----------
export const sentence = pgTable(
  "sentence",
  {
    id: id(),
    userId: userRef(),
    chinese: text("chinese").notNull(),
    pinyin: text("pinyin").notNull().default(""),
    vietnamese: text("vietnamese").notNull(),
    /** Bản bỏ dấu của câu tiếng Việt để tìm kiếm (fold), tính lại mỗi lần ghi. */
    vietnameseFold: text("vietnamese_fold").notNull().default(""),
    note: text("note").notNull().default(""),
    status: vocabStatus("status").notNull().default("review"),
    isFavorite: boolean("is_favorite").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("sentence_user_created_idx").on(t.userId, t.createdAt)],
);

export const sentenceTag = pgTable(
  "sentence_tag",
  { id: id(), userId: userRef(), name: text("name").notNull(), createdAt: createdAt() },
  (t) => [uniqueIndex("sentence_tag_user_name_uq").on(t.userId, sql`lower(${t.name})`)],
);

export const sentenceToTag = pgTable(
  "sentence_to_tag",
  {
    sentenceId: uuid("sentence_id")
      .notNull()
      .references(() => sentence.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => sentenceTag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.sentenceId, t.tagId] }), index("sentence_to_tag_tag_idx").on(t.tagId)],
);

/** Phiên ôn dịch câu (giống review_session): câu hỏi + đáp án người dùng; đáp án đúng chỉ nằm ở server. */
export const sentenceSession = pgTable(
  "sentence_session",
  {
    id: id(),
    userId: userRef(),
    config: jsonb("config").notNull(),
    questions: jsonb("questions").notNull(),
    currentIndex: integer("current_index").notNull().default(0),
    correctCount: integer("correct_count").notNull().default(0),
    wrongCount: integer("wrong_count").notNull().default(0),
    skippedCount: integer("skipped_count").notNull().default(0),
    /** "active" | "completed" | "abandoned" */
    status: text("status").notNull().default("active"),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("sentence_session_user_status_idx").on(t.userId, t.status)],
);

// ---------- Luyện nghe – Chép chính tả ----------
/**
 * Bài làm luyện nghe. Đáp án tham khảo do NGƯỜI DÙNG nhập (không lấy phụ đề). Kết quả so sánh + điểm luôn do server tính
 * lại từ `referenceAnswer` + `userAnswer` bằng `lib/dictation-compare` (không tin điểm client gửi).
 * `formattedUserAnswer` = định dạng người dùng tự tô (bút đỏ / bôi vàng), tách khỏi `comparisonResult`.
 */
export const listeningExercise = pgTable(
  "listening_exercise",
  {
    id: id(),
    userId: userRef(),
    title: text("title").notNull(),
    contentUrl: text("content_url").notNull().default(""),
    segmentStart: doublePrecision("segment_start"),
    segmentEnd: doublePrecision("segment_end"),
    playbackSpeed: doublePrecision("playback_speed").notNull().default(1),
    referenceAnswer: text("reference_answer").notNull(),
    referencePinyin: text("reference_pinyin").notNull().default(""),
    userAnswer: text("user_answer").notNull().default(""),
    formattedUserAnswer: jsonb("formatted_user_answer").notNull().default([]),
    comparisonResult: jsonb("comparison_result").notNull(),
    scoreCorrect: integer("score_correct").notNull().default(0),
    scoreTotal: integer("score_total").notNull().default(0),
    scorePercent: smallint("score_percent").notNull().default(0),
    notes: text("notes").notNull().default(""),
    /** Tiêu đề + ghi chú bỏ dấu để tìm không dấu, tính lại mỗi lần ghi. */
    searchFold: text("search_fold").notNull().default(""),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("listening_exercise_user_created_idx").on(t.userId, t.createdAt)],
);

export const listeningTag = pgTable(
  "listening_tag",
  { id: id(), userId: userRef(), name: text("name").notNull(), createdAt: createdAt() },
  (t) => [uniqueIndex("listening_tag_user_name_uq").on(t.userId, sql`lower(${t.name})`)],
);

export const listeningToTag = pgTable(
  "listening_to_tag",
  {
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => listeningExercise.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => listeningTag.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.exerciseId, t.tagId] }), index("listening_to_tag_tag_idx").on(t.tagId)],
);

// ---------- Phát âm & Biến điệu ----------
/**
 * Ghi chú phát âm của riêng người dùng (KHÔNG chia sẻ). `topic` = mục gắn ghi chú ("initial:b", "final:ang", "tone:3",
 * "sandhi:third-two", "sandhi:third-two:0" (một ví dụ), "sandhi:general"); mỗi mục một ghi chú. `topic` null = ghi chú tự do
 * có tiêu đề (Ghi chú của tôi).
 */
export const pronunciationNote = pgTable(
  "pronunciation_note",
  {
    id: id(),
    userId: userRef(),
    topic: text("topic"),
    title: text("title").notNull().default(""),
    content: text("content").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("pronunciation_note_user_topic_uq")
      .on(t.userId, t.topic)
      .where(sql`${t.topic} is not null`),
    index("pronunciation_note_user_updated_idx").on(t.userId, t.updatedAt),
  ],
);

// ---------- Tiến độ học tập ----------
/**
 * Nhật ký hoạt động học (Lịch sử học tập, Bài học gần đây, số liệu hôm nay). Ghi từ service khi người dùng hoàn thành
 * một việc (nộp bài ôn, nộp phần bài học, lưu bài nghe...). Hoạt động "thêm từ / thêm ngữ pháp" được gộp theo ngày
 * (`refId` = ngày) để lịch sử không bị dài.
 */
export const studyActivity = pgTable(
  "study_activity",
  {
    id: id(),
    userId: userRef(),
    kind: text("kind").notNull(),
    title: text("title").notNull().default(""),
    detail: text("detail").notNull().default(""),
    refId: text("ref_id"),
    correct: integer("correct"),
    total: integer("total"),
    durationSec: integer("duration_sec").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index("study_activity_user_created_idx").on(t.userId, t.createdAt),
    uniqueIndex("study_activity_user_kind_ref_uq")
      .on(t.userId, t.kind, t.refId)
      .where(sql`${t.refId} is not null`),
  ],
);

/** Thời gian học theo ngày (giờ Việt Nam), cộng dồn từ nhịp "đang học" của trình duyệt / app mỗi phút. */
export const studyDay = pgTable(
  "study_day",
  {
    userId: userRef(),
    day: text("day").notNull(),
    seconds: integer("seconds").notNull().default(0),
    lastPingAt: timestamp("last_ping_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

/** Mục tiêu học tập của người dùng (mỗi loại một mục tiêu). */
export const studyGoal = pgTable(
  "study_goal",
  {
    userId: userRef(),
    kind: text("kind").notNull(),
    target: integer("target").notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind] })],
);

/** Mức nắm ngữ pháp (từ bài Ôn tập ngữ pháp): số lần làm đúng / đã làm của từng ngữ pháp. */
export const grammarMastery = pgTable(
  "grammar_mastery",
  {
    userId: userRef(),
    grammarId: uuid("grammar_id")
      .notNull()
      .references(() => grammar.id, { onDelete: "cascade" }),
    correct: integer("correct").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    lastAt: timestamp("last_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.grammarId] })],
);
