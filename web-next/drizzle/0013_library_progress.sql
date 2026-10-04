CREATE TABLE "library_favorite" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"item_id" text NOT NULL,
	"key" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_favorite_user_id_kind_item_id_key_pk" PRIMARY KEY("user_id","kind","item_id","key")
);
--> statement-breakpoint
CREATE TABLE "library_learned" (
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"item_id" text NOT NULL,
	"key" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "library_learned_user_id_kind_item_id_key_pk" PRIMARY KEY("user_id","kind","item_id","key")
);
--> statement-breakpoint
ALTER TABLE "library_favorite" ADD CONSTRAINT "library_favorite_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "library_learned" ADD CONSTRAINT "library_learned_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;