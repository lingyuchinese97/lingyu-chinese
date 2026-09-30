CREATE TABLE "reading_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"passage_id" text NOT NULL,
	"answers" jsonb NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading_saved" (
	"user_id" uuid NOT NULL,
	"passage_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reading_saved_user_id_passage_id_pk" PRIMARY KEY("user_id","passage_id")
);
--> statement-breakpoint
ALTER TABLE "reading_attempt" ADD CONSTRAINT "reading_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reading_saved" ADD CONSTRAINT "reading_saved_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reading_attempt_user_created_idx" ON "reading_attempt" USING btree ("user_id","created_at");