CREATE TABLE "grammar_mastery" (
	"user_id" uuid NOT NULL,
	"grammar_id" uuid NOT NULL,
	"correct" integer DEFAULT 0 NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grammar_mastery_user_id_grammar_id_pk" PRIMARY KEY("user_id","grammar_id")
);
--> statement-breakpoint
CREATE TABLE "study_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"ref_id" text,
	"correct" integer,
	"total" integer,
	"duration_sec" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_day" (
	"user_id" uuid NOT NULL,
	"day" text NOT NULL,
	"seconds" integer DEFAULT 0 NOT NULL,
	"last_ping_at" timestamp with time zone,
	CONSTRAINT "study_day_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "study_goal" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"target" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_goal_user_id_kind_pk" PRIMARY KEY("user_id","kind")
);
--> statement-breakpoint
ALTER TABLE "grammar_mastery" ADD CONSTRAINT "grammar_mastery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grammar_mastery" ADD CONSTRAINT "grammar_mastery_grammar_id_grammar_id_fk" FOREIGN KEY ("grammar_id") REFERENCES "public"."grammar"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_activity" ADD CONSTRAINT "study_activity_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_day" ADD CONSTRAINT "study_day_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_goal" ADD CONSTRAINT "study_goal_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_activity_user_created_idx" ON "study_activity" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "study_activity_user_kind_ref_uq" ON "study_activity" USING btree ("user_id","kind","ref_id") WHERE "study_activity"."ref_id" is not null;