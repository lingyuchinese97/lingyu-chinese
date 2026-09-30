CREATE TABLE "library_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mime" text NOT NULL,
	"data" "bytea" NOT NULL,
	"size" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_word" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hanzi" text NOT NULL,
	"pinyin" text DEFAULT '' NOT NULL,
	"pos" text DEFAULT '' NOT NULL,
	"meaning_vi" text DEFAULT '' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"hsk_level" smallint,
	"topic" text DEFAULT '' NOT NULL,
	"components" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mnemonic" text DEFAULT '' NOT NULL,
	"association" text DEFAULT '' NOT NULL,
	"related" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"examples" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grammar" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_by" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library_word" ADD CONSTRAINT "library_word_image_id_library_image_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."library_image"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_word" ADD CONSTRAINT "library_word_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "library_word_hanzi_uq" ON "library_word" USING btree ("hanzi");--> statement-breakpoint
CREATE INDEX "library_word_status_hsk_idx" ON "library_word" USING btree ("status","hsk_level");