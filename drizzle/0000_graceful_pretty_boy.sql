CREATE TABLE "riot_accounts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "riot_accounts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"puuid" text NOT NULL,
	"game_name" text NOT NULL,
	"tag_line" text NOT NULL,
	"platform" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tft_rank_snapshots" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tft_rank_snapshots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"riot_account_id" bigint NOT NULL,
	"queue_type" text NOT NULL,
	"status" text NOT NULL,
	"tier" text,
	"division" text,
	"league_points" integer,
	"wins" integer,
	"losses" integer,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tft_rank_snapshots_status_check" CHECK ("tft_rank_snapshots"."status" in ('placements', 'ranked')),
	CONSTRAINT "tft_rank_snapshots_rank_fields_check" CHECK ((
        "tft_rank_snapshots"."status" = 'placements'
        and "tft_rank_snapshots"."tier" is null
        and "tft_rank_snapshots"."division" is null
        and "tft_rank_snapshots"."league_points" is null
        and "tft_rank_snapshots"."wins" is null
        and "tft_rank_snapshots"."losses" is null
      ) or (
        "tft_rank_snapshots"."status" = 'ranked'
        and "tft_rank_snapshots"."tier" is not null
        and "tft_rank_snapshots"."division" is not null
        and "tft_rank_snapshots"."league_points" is not null
        and "tft_rank_snapshots"."wins" is not null
        and "tft_rank_snapshots"."losses" is not null
      )),
	CONSTRAINT "tft_rank_snapshots_nonnegative_values_check" CHECK (coalesce("tft_rank_snapshots"."league_points", 0) >= 0
        and coalesce("tft_rank_snapshots"."wins", 0) >= 0
        and coalesce("tft_rank_snapshots"."losses", 0) >= 0)
);
--> statement-breakpoint
ALTER TABLE "tft_rank_snapshots" ADD CONSTRAINT "tft_rank_snapshots_riot_account_id_riot_accounts_id_fk" FOREIGN KEY ("riot_account_id") REFERENCES "public"."riot_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "riot_accounts_puuid_unique" ON "riot_accounts" USING btree ("puuid");--> statement-breakpoint
CREATE INDEX "tft_rank_snapshots_account_queue_captured_idx" ON "tft_rank_snapshots" USING btree ("riot_account_id","queue_type","captured_at");
