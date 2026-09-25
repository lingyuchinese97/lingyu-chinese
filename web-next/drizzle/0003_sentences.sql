CREATE TABLE "sentence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chinese" text NOT NULL,
	"pinyin" text DEFAULT '' NOT NULL,
	"vietnamese" text NOT NULL,
	"vietnamese_fold" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"status" "vocab_status" DEFAULT 'review' NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentence_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"config" jsonb NOT NULL,
	"questions" jsonb NOT NULL,
	"current_index" integer DEFAULT 0 NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"wrong_count" integer DEFAULT 0 NOT NULL,
	"skipped_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sentence_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sentence_to_tag" (
	"sentence_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "sentence_to_tag_sentence_id_tag_id_pk" PRIMARY KEY("sentence_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "sentence" ADD CONSTRAINT "sentence_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentence_session" ADD CONSTRAINT "sentence_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentence_tag" ADD CONSTRAINT "sentence_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentence_to_tag" ADD CONSTRAINT "sentence_to_tag_sentence_id_sentence_id_fk" FOREIGN KEY ("sentence_id") REFERENCES "public"."sentence"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sentence_to_tag" ADD CONSTRAINT "sentence_to_tag_tag_id_sentence_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."sentence_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sentence_user_created_idx" ON "sentence" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sentence_session_user_status_idx" ON "sentence_session" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "sentence_tag_user_name_uq" ON "sentence_tag" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "sentence_to_tag_tag_idx" ON "sentence_to_tag" USING btree ("tag_id");