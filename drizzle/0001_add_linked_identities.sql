CREATE TABLE IF NOT EXISTS "linked_identities" (
	"identity_id" text PRIMARY KEY NOT NULL,
	"canonical_user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "linked_identities" ADD CONSTRAINT "linked_identities_canonical_user_id_users_id_fk" FOREIGN KEY ("canonical_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
