CREATE TABLE "listening_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content_url" text DEFAULT '' NOT NULL,
	"segment_start" double precision,
	"segment_end" double precision,
	"playback_speed" double precision DEFAULT 1 NOT NULL,
	"reference_answer" text NOT NULL,
	"reference_pinyin" text DEFAULT '' NOT NULL,
	"user_answer" text DEFAULT '' NOT NULL,
	"formatted_user_answer" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"comparison_result" jsonb NOT NULL,
	"score_correct" integer DEFAULT 0 NOT NULL,
	"score_total" integer DEFAULT 0 NOT NULL,
	"score_percent" smallint DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"search_fold" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening_tag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening_to_tag" (
	"exercise_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "listening_to_tag_exercise_id_tag_id_pk" PRIMARY KEY("exercise_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "listening_exercise" ADD CONSTRAINT "listening_exercise_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_tag" ADD CONSTRAINT "listening_tag_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_to_tag" ADD CONSTRAINT "listening_to_tag_exercise_id_listening_exercise_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."listening_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listening_to_tag" ADD CONSTRAINT "listening_to_tag_tag_id_listening_tag_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."listening_tag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "listening_exercise_user_created_idx" ON "listening_exercise" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "listening_tag_user_name_uq" ON "listening_tag" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "listening_to_tag_tag_idx" ON "listening_to_tag" USING btree ("tag_id");