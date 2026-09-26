CREATE TABLE "pronunciation_note" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic" text,
	"title" text DEFAULT '' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pronunciation_note" ADD CONSTRAINT "pronunciation_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pronunciation_note_user_topic_uq" ON "pronunciation_note" USING btree ("user_id","topic") WHERE "pronunciation_note"."topic" is not null;--> statement-breakpoint
CREATE INDEX "pronunciation_note_user_updated_idx" ON "pronunciation_note" USING btree ("user_id","updated_at");