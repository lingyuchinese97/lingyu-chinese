CREATE TABLE "speaking_question" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"zh" text NOT NULL,
	"pinyin" text DEFAULT '' NOT NULL,
	"meaning" text DEFAULT '' NOT NULL,
	"hsk" smallint,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"starred" boolean DEFAULT false NOT NULL,
	"answer" text DEFAULT '' NOT NULL,
	"answer_pinyin" text DEFAULT '' NOT NULL,
	"answer_meaning" text DEFAULT '' NOT NULL,
	"feedback" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "speaking_question" ADD CONSTRAINT "speaking_question_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "speaking_question_user_created_idx" ON "speaking_question" USING btree ("user_id","created_at");