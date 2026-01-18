-- Drop foreign key constraint first (it depends on the unique constraint)
-- Since short_code is no longer unique, we remove the FK constraint
-- Clicks are tracked by shortCode which can now have multiple versions
ALTER TABLE "url_clicks" DROP CONSTRAINT IF EXISTS "url_clicks_short_code_urls_short_code_fk";--> statement-breakpoint
-- Drop the unique constraint (CASCADE will handle any remaining dependencies)
ALTER TABLE "urls" DROP CONSTRAINT IF EXISTS "urls_short_code_unique" CASCADE;--> statement-breakpoint
DROP INDEX IF EXISTS "short_code_idx";--> statement-breakpoint
-- Add new columns
ALTER TABLE "urls" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "urls" ADD COLUMN "is_latest" boolean DEFAULT true NOT NULL;--> statement-breakpoint
-- Create new unique index on (short_code, version)
CREATE UNIQUE INDEX "short_code_version_idx" ON "urls" USING btree ("short_code","version");