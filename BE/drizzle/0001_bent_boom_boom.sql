DROP INDEX "teams_name_lower_unique";--> statement-breakpoint
DROP INDEX "tickets_team_status_idx";--> statement-breakpoint
ALTER TABLE "epics" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "teams" ADD COLUMN "created_by" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "epics" ADD CONSTRAINT "epics_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "epics_created_by_idx" ON "epics" USING btree ("created_by");--> statement-breakpoint
CREATE UNIQUE INDEX "teams_owner_name_lower_unique" ON "teams" USING btree ("created_by",lower("name"));--> statement-breakpoint
CREATE INDEX "teams_created_by_idx" ON "teams" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "tickets_owner_team_status_idx" ON "tickets" USING btree ("created_by","team_id","status");