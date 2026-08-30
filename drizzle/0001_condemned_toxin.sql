CREATE TABLE "pokemon_team_members" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pokemon_team_members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"team_id" bigint NOT NULL,
	"slot" integer NOT NULL,
	"pokemon_id" text NOT NULL,
	"display_name" text NOT NULL,
	"role" text NOT NULL,
	"ability" text,
	"held_item" text,
	"nature" text,
	"moves" text[] DEFAULT array[]::text[] NOT NULL,
	"hp_points" integer DEFAULT 0 NOT NULL,
	"attack_points" integer DEFAULT 0 NOT NULL,
	"defense_points" integer DEFAULT 0 NOT NULL,
	"special_attack_points" integer DEFAULT 0 NOT NULL,
	"special_defense_points" integer DEFAULT 0 NOT NULL,
	"speed_points" integer DEFAULT 0 NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	CONSTRAINT "pokemon_team_members_slot_check" CHECK ("pokemon_team_members"."slot" between 1 and 6),
	CONSTRAINT "pokemon_team_members_moves_check" CHECK (cardinality("pokemon_team_members"."moves") <= 4),
	CONSTRAINT "pokemon_team_members_nonnegative_points_check" CHECK ("pokemon_team_members"."hp_points" >= 0
        and "pokemon_team_members"."attack_points" >= 0
        and "pokemon_team_members"."defense_points" >= 0
        and "pokemon_team_members"."special_attack_points" >= 0
        and "pokemon_team_members"."special_defense_points" >= 0
        and "pokemon_team_members"."speed_points" >= 0)
);
--> statement-breakpoint
CREATE TABLE "pokemon_teams" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pokemon_teams_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"format" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pokemon_teams_format_check" CHECK ("pokemon_teams"."format" in ('Singles', 'Doubles'))
);
--> statement-breakpoint
ALTER TABLE "pokemon_team_members" ADD CONSTRAINT "pokemon_team_members_team_id_pokemon_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."pokemon_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pokemon_team_members_team_slot_unique" ON "pokemon_team_members" USING btree ("team_id","slot");
