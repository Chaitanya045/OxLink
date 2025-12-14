CREATE TABLE "url_clicks" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "url_clicks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"url_id" integer NOT NULL,
	"clicked_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text,
	"short_code" text NOT NULL,
	"referrer" text,
	"country" varchar(2),
	"region" varchar(50),
	"city" varchar(50),
	"device_type" varchar(20),
	"os" varchar(50),
	"browser" varchar(50),
	"is_bot" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "url_clicks" ADD CONSTRAINT "url_clicks_url_id_urls_id_fk" FOREIGN KEY ("url_id") REFERENCES "public"."urls"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "url_clicks" ADD CONSTRAINT "url_clicks_short_code_urls_short_code_fk" FOREIGN KEY ("short_code") REFERENCES "public"."urls"("short_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "url_clicks_url_id_idx" ON "url_clicks" USING btree ("url_id");--> statement-breakpoint
CREATE INDEX "url_clicks_clicked_at_idx" ON "url_clicks" USING btree ("clicked_at");--> statement-breakpoint
CREATE INDEX "url_clicks_short_code_idx" ON "url_clicks" USING btree ("short_code");