CREATE TABLE "blox_fruits_watchlist" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blox_fruits_watchlist_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"fruit_name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blox_fruits_watchlist_fruit_name_unique" ON "blox_fruits_watchlist" USING btree ("fruit_name");--> statement-breakpoint
INSERT INTO "blox_fruits_watchlist" ("fruit_name") VALUES
	('Tiger'),
	('Control'),
	('Yeti');

