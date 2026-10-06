CREATE TABLE "pronunciation_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hanzi" text NOT NULL,
	"pinyin" text NOT NULL,
	"meaning" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pronunciation_item" ADD CONSTRAINT "pronunciation_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pronunciation_item_user_word_uq" ON "pronunciation_item" USING btree ("user_id","hanzi","pinyin");--> statement-breakpoint
CREATE INDEX "pronunciation_item_user_updated_idx" ON "pronunciation_item" USING btree ("user_id","updated_at");