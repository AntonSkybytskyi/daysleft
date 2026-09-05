CREATE TABLE IF NOT EXISTS "tracked_destinations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"destination_ref" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tracked_destinations" ADD CONSTRAINT "tracked_destinations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tracked_destinations_user_created" ON "tracked_destinations" USING btree ("user_id","created_at","id");
