CREATE TABLE "tft_meta_compositions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tft_meta_compositions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"snapshot_id" bigint NOT NULL,
	"signature" text NOT NULL,
	"rank" integer NOT NULL,
	"games" integer NOT NULL,
	"wins" integer NOT NULL,
	"top_fours" integer NOT NULL,
	"average_placement_basis_points" integer NOT NULL,
	"units" text[] DEFAULT array[]::text[] NOT NULL,
	"traits" text[] DEFAULT array[]::text[] NOT NULL,
	CONSTRAINT "tft_meta_compositions_rank_check" CHECK ("tft_meta_compositions"."rank" > 0),
	CONSTRAINT "tft_meta_compositions_counts_check" CHECK ("tft_meta_compositions"."games" > 0 and "tft_meta_compositions"."wins" >= 0 and "tft_meta_compositions"."top_fours" >= 0 and "tft_meta_compositions"."wins" <= "tft_meta_compositions"."games" and "tft_meta_compositions"."top_fours" <= "tft_meta_compositions"."games")
);
--> statement-breakpoint
CREATE TABLE "tft_meta_snapshots" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tft_meta_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"source" text NOT NULL,
	"platform" text NOT NULL,
	"patch" text NOT NULL,
	"set_number" integer NOT NULL,
	"sampled_players" integer NOT NULL,
	"sampled_matches" integer NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tft_meta_snapshots_counts_check" CHECK ("tft_meta_snapshots"."sampled_players" >= 0 and "tft_meta_snapshots"."sampled_matches" >= 0)
);
--> statement-breakpoint
ALTER TABLE "tft_meta_compositions" ADD CONSTRAINT "tft_meta_compositions_snapshot_id_tft_meta_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."tft_meta_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tft_meta_compositions_snapshot_rank_idx" ON "tft_meta_compositions" USING btree ("snapshot_id","rank");--> statement-breakpoint
CREATE INDEX "tft_meta_snapshots_patch_captured_idx" ON "tft_meta_snapshots" USING btree ("patch","set_number","captured_at");
