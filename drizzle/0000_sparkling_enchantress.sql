CREATE TABLE "urls" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "urls_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"short_code" varchar(10) NOT NULL,
	"original_url" text NOT NULL,
	"custom_alias" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expiry_date" timestamp,
	CONSTRAINT "urls_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "short_code_idx" ON "urls" USING btree ("short_code");