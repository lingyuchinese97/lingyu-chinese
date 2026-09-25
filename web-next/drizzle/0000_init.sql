CREATE TYPE "public"."share_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."vocab_status" AS ENUM('learned', 'review');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"disabled_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_grammar_id" uuid,
	"source_owner_name" text,
	"title" text NOT NULL,
	"meaning" text DEFAULT '' NOT NULL,
	"structure" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_bookmark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"grammar_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_example" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grammar_id" uuid NOT NULL,
	"chinese" text NOT NULL,
	"pinyin" text DEFAULT '' NOT NULL,
	"vietnamese" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_personal_note" (
	"user_id" uuid NOT NULL,
	"grammar_id" uuid NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grammar_personal_note_user_id_grammar_id_pk" PRIMARY KEY("user_id","grammar_id")
);
--> statement-breakpoint
CREATE TABLE "grammar_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grammar_id" uuid,
	"grammar_title" text NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"status" "share_status" DEFAULT 'PENDING' NOT NULL,
	"imported_grammar_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"accepted_at" timestamp with time zone,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "grammar_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar_to_tag" (
	"grammar_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "grammar_to_tag_grammar_id_tag_id_pk" PRIMARY KEY("grammar_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lesson_progress" (
	"user_id" uuid NOT NULL,
	"lesson_id" text NOT NULL,
	"section" text NOT NULL,
	"best_score" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"last_score" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lesson_progress_user_id_lesson_id_section_pk" PRIMARY KEY("user_id","lesson_id","section")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "radical_known" (
	"user_id" uuid NOT NULL,
	"radical" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "radical_known_user_id_radical_pk" PRIMARY KEY("user_id","radical")
);
--> statement-breakpoint
CREATE TABLE "review_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text DEFAULT 'custom' NOT NULL,
	"config" jsonb NOT NULL,
	"questions" jsonb NOT NULL,
	"current_index" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"wrong_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "srs_card" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"vocab_id" uuid NOT NULL,
	"due" timestamp with time zone DEFAULT now() NOT NULL,
	"stability" double precision DEFAULT 0 NOT NULL,
	"difficulty" double precision DEFAULT 0 NOT NULL,
	"elapsed_days" integer DEFAULT 0 NOT NULL,
	"scheduled_days" integer DEFAULT 0 NOT NULL,
	"learning_steps" integer DEFAULT 0 NOT NULL,
	"reps" integer DEFAULT 0 NOT NULL,
	"lapses" integer DEFAULT 0 NOT NULL,
	"state" smallint DEFAULT 0 NOT NULL,
	"last_review" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "srs_review_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"rating" smallint NOT NULL,
	"state" smallint NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"stability" double precision NOT NULL,
	"difficulty" double precision NOT NULL,
	"elapsed_days" integer NOT NULL,
	"last_elapsed_days" integer NOT NULL,
	"scheduled_days" integer NOT NULL,
	"learning_steps" integer DEFAULT 0 NOT NULL,
	"review" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocab" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hanzi" text NOT NULL,
	"pinyin" text NOT NULL,
	"meaning_vi" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"image_id" uuid,
	"status" "vocab_status" DEFAULT 'review' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"radicals" integer[] DEFAULT '{}'::integer[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocab_share" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"words" jsonb NOT NULL,
	"words_key" text NOT NULL,
	"count" integer NOT NULL,
	"status" "share_status" DEFAULT 'PENDING' NOT NULL,
	"added" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vocab_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocab_to_tag" (
	"vocab_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "vocab_to_tag_vocab_id_tag_id_pk" PRIMARY KEY("vocab_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar" ADD CONSTRAINT "grammar_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_bookmark" ADD CONSTRAINT "grammar_bookmark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_bookmark" ADD CONSTRAINT "grammar_bookmark_grammar_id_grammar_id_fk" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_example" ADD CONSTRAINT "grammar_example_grammar_id_grammar_id_fk" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_personal_note" ADD CONSTRAINT "grammar_personal_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_personal_note" ADD CONSTRAINT "grammar_personal_note_grammar_id_grammar_id_fk" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_share" ADD CONSTRAINT "grammar_share_grammar_id_grammar_id_fk" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_share" ADD CONSTRAINT "grammar_share_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_share" ADD CONSTRAINT "grammar_share_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_tag" ADD CONSTRAINT "grammar_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_to_tag" ADD CONSTRAINT "grammar_to_tag_grammar_id_grammar_id_fk" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_to_tag" ADD CONSTRAINT "grammar_to_tag_tag_id_grammar_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."grammar_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "image" ADD CONSTRAINT "image_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "radical_known" ADD CONSTRAINT "radical_known_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_session" ADD CONSTRAINT "review_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_card" ADD CONSTRAINT "srs_card_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_card" ADD CONSTRAINT "srs_card_vocab_id_vocab_id_fk" FOREIGN KEY ("vocab_id") REFERENCES "public"."vocab"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_review_log" ADD CONSTRAINT "srs_review_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "srs_review_log" ADD CONSTRAINT "srs_review_log_card_id_srs_card_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."srs_card"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab" ADD CONSTRAINT "vocab_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab" ADD CONSTRAINT "vocab_image_id_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."image"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_share" ADD CONSTRAINT "vocab_share_sender_id_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_share" ADD CONSTRAINT "vocab_share_recipient_id_user_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_tag" ADD CONSTRAINT "vocab_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_to_tag" ADD CONSTRAINT "vocab_to_tag_vocab_id_vocab_id_fk" FOREIGN KEY ("vocab_id") REFERENCES "public"."vocab"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vocab_to_tag" ADD CONSTRAINT "vocab_to_tag_tag_id_vocab_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."vocab_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "grammar_user_updated_idx" ON "grammar" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_bookmark_uq" ON "grammar_bookmark" USING btree ("user_id","grammar_id");--> statement-breakpoint
CREATE INDEX "grammar_example_grammar_idx" ON "grammar_example" USING btree ("grammar_id","sort_order");--> statement-breakpoint
CREATE INDEX "grammar_share_recipient_idx" ON "grammar_share" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "grammar_share_sender_idx" ON "grammar_share" USING btree ("sender_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_share_pending_uq" ON "grammar_share" USING btree ("grammar_id","recipient_id") WHERE "grammar_share"."status" = 'PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX "grammar_tag_user_name_uq" ON "grammar_tag" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "grammar_to_tag_tag_idx" ON "grammar_to_tag" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "image_user_idx" ON "image" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notification_user_created_idx" ON "notification" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "review_session_user_status_idx" ON "review_session" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "srs_card_vocab_uq" ON "srs_card" USING btree ("vocab_id");--> statement-breakpoint
CREATE INDEX "srs_card_user_due_idx" ON "srs_card" USING btree ("user_id","due");--> statement-breakpoint
CREATE INDEX "srs_review_log_card_idx" ON "srs_review_log" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "vocab_user_idx" ON "vocab" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vocab_user_created_idx" ON "vocab" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "vocab_user_hanzi_idx" ON "vocab" USING btree ("user_id","hanzi");--> statement-breakpoint
CREATE INDEX "vocab_share_recipient_idx" ON "vocab_share" USING btree ("recipient_id","status");--> statement-breakpoint
CREATE INDEX "vocab_share_sender_idx" ON "vocab_share" USING btree ("sender_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vocab_share_pending_uq" ON "vocab_share" USING btree ("sender_id","recipient_id","words_key") WHERE "vocab_share"."status" = 'PENDING';--> statement-breakpoint
CREATE UNIQUE INDEX "vocab_tag_user_name_uq" ON "vocab_tag" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "vocab_to_tag_tag_idx" ON "vocab_to_tag" USING btree ("tag_id");