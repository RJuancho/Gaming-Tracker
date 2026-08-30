ALTER TABLE "tft_meta_snapshots" ADD COLUMN "sample_date" date;--> statement-breakpoint
ALTER TABLE "tft_meta_snapshots" ADD COLUMN "window_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tft_meta_snapshots" ADD COLUMN "window_end" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "tft_meta_snapshots_source_platform_date_unique" ON "tft_meta_snapshots" USING btree ("source","platform","sample_date");--> statement-breakpoint
ALTER TABLE "tft_meta_snapshots" ADD CONSTRAINT "tft_meta_snapshots_window_check" CHECK ((
        "tft_meta_snapshots"."sample_date" is null
        and "tft_meta_snapshots"."window_start" is null
        and "tft_meta_snapshots"."window_end" is null
      ) or (
        "tft_meta_snapshots"."sample_date" is not null
        and "tft_meta_snapshots"."window_start" is not null
        and "tft_meta_snapshots"."window_end" is not null
        and "tft_meta_snapshots"."window_start" < "tft_meta_snapshots"."window_end"
      ));
