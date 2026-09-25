ALTER TABLE "vocab" ADD COLUMN "pinyin_fold" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "vocab" ADD COLUMN "meaning_fold" text DEFAULT '' NOT NULL;