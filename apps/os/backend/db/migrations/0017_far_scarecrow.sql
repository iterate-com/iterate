ALTER TABLE "organization" ADD COLUMN "has_onboarded" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- Set all organizations that have an estate with a connected repo to onboarded
UPDATE organization SET has_onboarded = TRUE WHERE id in (SELECT DISTINCT organization_id FROM estate WHERE connected_repo_id IS NOT NULL);