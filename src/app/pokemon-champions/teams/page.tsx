import Image from "next/image";
import Link from "next/link";

import {
  getChampionsRoster,
  getCurrentChampionsMeta,
} from "@/integrations/pokemon/champions/provider";
import {
  getItemReference,
  getMoveReference,
  getPokemonReference,
} from "@/integrations/pokemon/pokeapi/provider";
import { listPokemonTeams } from "@/services/pokemon-teams";

import { changeTeamMember, savePokemonBuild } from "./actions";
import { CreateTeamModal } from "./create-team-modal";
import { PokemonRosterPicker } from "./pokemon-roster-picker";
import { getPokemonTypeColor } from "./pokemon-type-color";
import { TeamActions } from "./team-actions";
import { PokemonDetailPanel, PokemonSlotButton } from "./pokemon-detail-toggle";
import { TeamViewModal } from "./team-view-modal";

export const dynamic = "force-dynamic";

const compactFieldClassName =
  "mt-1.5 w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 py-2 text-xs text-white outline-none transition focus:border-violet-300/50";

export default async function PokemonTeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; pokemon?: string }>;
}) {
  const feedback = await searchParams;
  const [teams, doublesRoster, singlesRoster] = await Promise.all([
    listPokemonTeams(),
    getChampionsRoster("Doubles"),
    getChampionsRoster("Singles"),
  ]);
  const buildSuggestions = await getBuildSuggestions(teams);
  const buildVisuals = await getBuildVisuals(teams);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/pokemon-champions"
            className="text-sm text-slate-400 transition-colors hover:text-white"
          >
            ← Pokémon dashboard
          </Link>
          <span className="rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1 text-xs text-violet-200">
            Local editing preview
          </span>
        </div>

        <header className="mt-12 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">
            Pokémon Champions
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">
            Build around your preferences.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            Start with a roster from the dashboard and choose each Pokémon’s
            intended role. Moves, nature, ability, item, and teammates can be
            refined as your build takes shape.
          </p>
        </header>

        {feedback.error ? (
          <p className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {feedback.error}
          </p>
        ) : feedback.saved === "member" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Pokémon added to the next open team slot.
          </p>
        ) : feedback.saved === "build" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Pokémon build saved.
          </p>
        ) : feedback.saved === "team" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Team details updated.
          </p>
        ) : feedback.saved === "deleted" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Team deleted.
          </p>
        ) : null}

        <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-500">
                  PostgreSQL
                </p>
                <h2 className="mt-2 text-2xl font-semibold">Saved teams</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">
                  {teams.length} {teams.length === 1 ? "team" : "teams"}
                </span>
                <CreateTeamModal initialPokemon={feedback.pokemon} />
              </div>
            </div>

            {teams.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">
                No teams yet. Create the first one to verify the saved-team
                workflow.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {teams.map((team) => (
                  <article
                    key={team.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs text-violet-300">{team.format}</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">
                          {team.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          {team.notes}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-slate-400">
                          {team.members.length}/6 slots
                        </span>
                        <TeamActions
                          teamId={team.id}
                          name={team.name}
                          format={team.format}
                          notes={team.notes}
                          memberCount={team.members.length}
                        />
                        <TeamViewModal
                          teamName={team.name}
                          format={team.format}
                          members={team.members.map((member) => ({
                            name: member.name,
                            role: member.role,
                            heldItem: member.heldItem,
                            ability: member.ability,
                            nature: member.nature,
                            moves: member.moves,
                            statAllocation: member.statAllocation,
                            pokemonSprite: buildVisuals.get(member.id)?.pokemonSprite ?? null,
                            heldItemSprite: buildVisuals.get(member.id)?.heldItemSprite ?? null,
                            moveTypes: buildSuggestions.get(`${team.format}:${member.pokemonId}`)?.moveTypes ?? {},
                          }))}
                        />
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {Array.from({ length: 6 }, (_, index) => {
                        const member = team.members.find(
                          (candidate) => candidate.slot === index + 1,
                        );

                        return (
                          <div
                            key={index}
                            className="grid min-h-24 place-items-center rounded-xl border border-white/[0.07] bg-slate-950/50 p-2 text-center"
                          >
                            {member ? (
                              <PokemonSlotButton memberId={member.id}><div>
                                <div className="relative mx-auto w-fit">
                                  {buildVisuals.get(member.id)?.pokemonSprite ? (
                                    <Image
                                      src={buildVisuals.get(member.id)!.pokemonSprite!}
                                      alt={`${member.name} sprite`}
                                      width={52}
                                      height={52}
                                      className="size-12 object-contain [image-rendering:pixelated]"
                                      unoptimized
                                    />
                                  ) : (
                                    <span className="grid size-9 place-items-center rounded-full bg-violet-300/10 font-mono font-bold text-violet-200">
                                      {member.name.charAt(0)}
                                    </span>
                                  )}
                                  {member.heldItem &&
                                  buildVisuals.get(member.id)?.heldItemSprite ? (
                                    <span
                                      className="absolute -bottom-1.5 -right-2 grid size-7 place-items-center rounded-lg border border-amber-200/25 bg-slate-950/95 shadow-lg"
                                      title={normalizeHeldItemName(member.heldItem)}
                                    >
                                      <Image
                                        src={buildVisuals.get(member.id)!.heldItemSprite!}
                                        alt={normalizeHeldItemName(member.heldItem)}
                                        width={24}
                                        height={24}
                                        className="size-6 object-contain [image-rendering:pixelated]"
                                        unoptimized
                                      />
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-2 text-xs font-medium text-white">
                                  {member.name}
                                </p>
                                <p className="mt-1 text-[10px] text-slate-500">
                                  {member.role}
                                </p>
                                {member.heldItem &&
                                !buildVisuals.get(member.id)?.heldItemSprite ? (
                                  <p className="mt-1 text-[10px] text-amber-200/80">
                                    {normalizeHeldItemName(member.heldItem)}
                                  </p>
                                ) : null}
                              </div></PokemonSlotButton>
                            ) : (
                              <span className="text-xs text-slate-700">
                                Slot {index + 1}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <details className="group">
                      <summary className="mt-3 flex cursor-pointer list-none items-center justify-end gap-1.5 text-xs font-medium text-slate-500 transition hover:text-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 [&::-webkit-details-marker]:hidden">
                        <span className="group-open:hidden">
                          Show team details
                        </span>
                        <span className="hidden group-open:inline">
                          Minimize team
                        </span>
                        <span
                          aria-hidden="true"
                          className="text-sm transition-transform group-open:rotate-180"
                        >
                          ▾
                        </span>
                      </summary>

                      {team.members.length > 0 ? (
                        <div className="mt-3 border-t border-white/10 pt-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-200">
                          Member builds
                        </p>
                        <div className="mt-3 grid gap-3 xl:grid-cols-2">
                          {team.members.map((member) => {
                            const suggestions =
                              buildSuggestions.get(
                                `${team.format}:${member.pokemonId}`,
                              ) ?? emptyBuildSuggestions;
                            const selectedAllocationRank =
                              findSelectedAllocationRank(
                                member.statAllocation,
                                suggestions.allocations,
                              );

                            return (
                              <div key={member.id} className="space-y-2">
                              <form action={changeTeamMember} className="flex flex-wrap items-end gap-2 rounded-xl border border-violet-300/10 bg-violet-300/[0.03] p-2">
                                <input type="hidden" name="teamId" value={team.id} />
                                <input type="hidden" name="memberId" value={member.id} />
                                <input type="hidden" name="role" value={member.role} />
                                <label className="min-w-0 flex-1 text-[11px] text-slate-500">Change Pokémon<select name="pokemonId" defaultValue={member.pokemonId} className={compactFieldClassName}>{(team.format === "Singles" ? singlesRoster : doublesRoster).map((pokemon) => <option key={pokemon.pokemonId} value={pokemon.pokemonId}>{pokemon.name}</option>)}</select></label>
                                <button type="submit" className="rounded-lg border border-violet-300/20 px-3 py-2 text-xs font-medium text-violet-200 hover:bg-violet-300/10">Replace</button>
                              </form>
                              <PokemonDetailPanel memberId={member.id} name={member.name}>
                              <form
                                action={savePokemonBuild}
                                className="border-t border-white/[0.07] p-3"
                              >
                                <input
                                  type="hidden"
                                  name="teamId"
                                  value={team.id}
                                />
                                <input
                                  type="hidden"
                                  name="memberId"
                                  value={member.id}
                                />
                                <div className="flex items-center gap-2">
                                  {buildVisuals.get(member.id)
                                    ?.heldItemSprite ? (
                                    <span
                                      className="grid size-8 shrink-0 place-items-center rounded-lg border border-amber-200/15 bg-slate-900"
                                      title={member.heldItem ? normalizeHeldItemName(member.heldItem) : undefined}
                                    >
                                      <Image
                                        src={
                                          buildVisuals.get(member.id)!
                                            .heldItemSprite!
                                        }
                                        alt={member.heldItem ? normalizeHeldItemName(member.heldItem) : "Held item"}
                                        width={26}
                                        height={26}
                                        className="size-6 object-contain [image-rendering:pixelated]"
                                        unoptimized
                                      />
                                    </span>
                                  ) : null}
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium text-white">
                                      {member.name}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">
                                      {member.role} · Current {team.format} meta
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-2.5 grid gap-2 sm:grid-cols-3">
                                  <BuildSelect
                                    label="Held item"
                                    name="heldItem"
                                    value={member.heldItem}
                                    choices={suggestions.items}
                                  />
                                  <BuildSelect
                                    label="Ability"
                                    name="ability"
                                    value={member.ability}
                                    choices={suggestions.abilities}
                                  />
                                  <BuildSelect
                                    label="Nature"
                                    name="nature"
                                    value={member.nature}
                                    choices={suggestions.natures}
                                  />
                                </div>

                                <fieldset className="mt-2.5">
                                  <legend className="text-xs text-slate-400">
                                    Moves · choose 1–4
                                  </legend>
                                  <div className="mt-1.5 grid max-h-44 gap-1 overflow-y-auto pr-1">
                                    {suggestions.moves.map((move) => (
                                      <label
                                        key={move.name}
                                        className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border border-white/[0.07] px-2 py-1 text-xs text-slate-300 hover:bg-white/[0.03]"
                                      >
                                        <span className="flex min-w-0 items-center gap-2">
                                          <input
                                            type="checkbox"
                                            name="moves"
                                            value={move.name}
                                            defaultChecked={member.moves.includes(
                                              move.name,
                                            )}
                                            className="accent-violet-300"
                                          />
                                          <span className="break-words">{move.name}</span>
                                        </span>
                                        <span
                                          className={`rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase ${getPokemonTypeColor(
                                            suggestions.moveTypes[move.name] ??
                                              "normal",
                                          )}`}
                                        >
                                          {suggestions.moveTypes[move.name] ??
                                            "move"}
                                        </span>
                                        <ChoicePercentage
                                          percentage={move.percentage}
                                        />
                                      </label>
                                    ))}
                                  </div>
                                </fieldset>

                                <div className="mt-2.5 grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                                  <label className="min-w-0 text-xs text-slate-400">
                                    Stat allocation
                                    <select
                                      name="statAllocationRank"
                                      required
                                      defaultValue={selectedAllocationRank ?? ""}
                                      className={compactFieldClassName}
                                    >
                                      <option value="" disabled>
                                        Select an observed allocation
                                      </option>
                                      {suggestions.allocations.map(
                                        (allocation) => (
                                          <option
                                            key={allocation.rank}
                                            value={allocation.rank}
                                          >
                                            {formatAllocation(allocation.stats)} ·{" "}
                                            {formatChoicePercentage(
                                              allocation.percentage,
                                            )}
                                          </option>
                                        ),
                                      )}
                                    </select>
                                  </label>
                                  <button
                                    type="submit"
                                    disabled={
                                      !hasCompleteSuggestions(suggestions)
                                    }
                                    className="rounded-lg border border-violet-300/20 bg-violet-300/10 px-3 py-2 text-xs font-medium text-violet-100 transition hover:bg-violet-300/15 disabled:opacity-40"
                                  >
                                    Save build
                                  </button>
                                </div>
                              </form>
                              </PokemonDetailPanel>
                              </div>
                            );
                          })}
                        </div>
                        </div>
                      ) : null}

                      {team.members.length < 6 ? (
                        <PokemonRosterPicker
                          teamId={team.id}
                          roster={
                            team.format === "Singles"
                              ? singlesRoster
                              : doublesRoster
                          }
                          usedPokemonIds={team.members.map(
                            (member) => member.pokemonId,
                          )}
                          synergyNames={team.members.flatMap((member) => buildSuggestions.get(`${team.format}:${member.pokemonId}`)?.teammates.map((choice) => choice.name) ?? [])}
                          roleSuggestions={Object.fromEntries([...buildSuggestions.entries()].filter(([key]) => key.startsWith(`${team.format}:`)).map(([key, value]) => [key.slice(team.format.length + 1), value.natures.map((choice) => choice.name)]))}
                        />
                      ) : (
                        <p className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-500">
                          Team complete · all six slots are filled
                        </p>
                      )}
                    </details>
                  </article>
                ))}
              </div>
            )}
        </section>
      </div>
    </main>
  );
}

type Choice = { name: string; percentage: number | null };
type AllocationStats = {
  hp: number;
  attack: number;
  defense: number;
  spAttack: number;
  spDefense: number;
  speed: number;
};
type AllocationChoice = {
  rank: number;
  percentage: number | null;
  stats: AllocationStats;
};
type BuildSuggestions = {
  items: Choice[];
  abilities: Choice[];
  natures: Choice[];
  teammates: Choice[];
  moves: Choice[];
  moveTypes: Record<string, string>;
  allocations: AllocationChoice[];
};

const emptyBuildSuggestions: BuildSuggestions = {
  items: [],
  abilities: [],
  natures: [],
  teammates: [],
  moves: [],
  moveTypes: {},
  allocations: [],
};

async function getBuildSuggestions(
  teams: Awaited<ReturnType<typeof listPokemonTeams>>,
) {
  const uniqueMembers = new Map<
    string,
    { pokemonId: string; format: "Singles" | "Doubles" }
  >();

  for (const team of teams) {
    const format = team.format === "Singles" ? "Singles" : "Doubles";

    for (const member of team.members) {
      uniqueMembers.set(`${format}:${member.pokemonId}`, {
        pokemonId: member.pokemonId,
        format,
      });
    }
  }

  const entries = await Promise.all(
    [...uniqueMembers.entries()].map(async ([key, member]) => {
      try {
        const meta = await getCurrentChampionsMeta(
          member.pokemonId,
          member.format,
        );
        const choices = (
          category: "held_item" | "ability" | "stat_alignment" | "move" | "teammate",
        ) =>
          meta.rankings
            .filter((ranking) => ranking.category === category && ranking.name)
            .map((ranking) => ({
              name: ranking.name as string,
              percentage: ranking.percentage,
            }));
        const moveTypes = Object.fromEntries(
          await Promise.all(
            choices("move").map(async (move) => {
              try {
                const reference = await getMoveReference(toPokeApiSlug(move.name));
                return [move.name, reference.type] as const;
              } catch {
                return [move.name, "normal"] as const;
              }
            }),
          ),
        );
        const suggestions: BuildSuggestions = {
          items: choices("held_item"),
          abilities: choices("ability"),
          natures: choices("stat_alignment"),
          teammates: choices("teammate"),
          moves: choices("move"),
          moveTypes,
          allocations: meta.rankings
            .filter(
              (ranking) =>
                ranking.category === "stat_points" && ranking.statAllocation,
            )
            .map((ranking) => ({
              rank: ranking.rank,
              percentage: ranking.percentage,
              stats: {
                hp: ranking.statAllocation!.hp,
                attack: ranking.statAllocation!.attack,
                defense: ranking.statAllocation!.defense,
                spAttack: ranking.statAllocation!.sp_attack,
                spDefense: ranking.statAllocation!.sp_defense,
                speed: ranking.statAllocation!.speed,
              },
            })),
        };

        return [key, suggestions] as const;
      } catch {
        return [key, emptyBuildSuggestions] as const;
      }
    }),
  );

  return new Map(entries);
}

type BuildVisual = {
  pokemonSprite: string | null;
  heldItemSprite: string | null;
};

async function getBuildVisuals(
  teams: Awaited<ReturnType<typeof listPokemonTeams>>,
) {
  const entries = await Promise.all(
    teams.flatMap((team) =>
      team.members.map(async (member) => {
        let pokemonSprite: string | null = null;
        let heldItemSprite: string | null = null;

        try {
          pokemonSprite = (await getPokemonReference(member.pokemonId)).spriteUrl;
        } catch {
          // A form or provider-specific ID may not have a PokéAPI sprite.
        }

        if (member.heldItem) {
          try {
            heldItemSprite = (
              await getItemReference(toPokeApiSlug(member.heldItem))
            ).spriteUrl;
          } catch {
            // Keep the text item selection when no reference sprite exists.
          }
        }

        return [member.id, { pokemonSprite, heldItemSprite }] as const;
      }),
    ),
  );

  return new Map<number, BuildVisual>(entries);
}

function BuildSelect({
  label,
  name,
  value,
  choices,
}: {
  label: string;
  name: string;
  value: string | null;
  choices: Choice[];
}) {
  return (
    <label className="min-w-0 text-xs text-slate-400">
      {label}
      <select
        name={name}
        required
        defaultValue={value ?? ""}
        className={compactFieldClassName}
      >
        <option value="" disabled>
          Select {label.toLowerCase()}
        </option>
        {choices.map((choice) => (
          <option key={choice.name} value={choice.name}>
            {choice.name} · {formatChoicePercentage(choice.percentage)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoicePercentage({ percentage }: { percentage: number | null }) {
  return (
    <span className="font-mono text-[10px] text-slate-600">
      {formatChoicePercentage(percentage)}
    </span>
  );
}

function formatChoicePercentage(percentage: number | null) {
  return percentage === null ? "ranked" : `${percentage.toFixed(1)}%`;
}

function toPokeApiSlug(value: string) {
  return normalizeHeldItemName(value)
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("'", "")
    .replaceAll(".", "");
}

function normalizeHeldItemName(value: string) {
  return value.replace(/^tyra\s+nitarite$/i, "Tyranitarite");
}

function formatAllocation(stats: AllocationStats) {
  return [
    ["HP", stats.hp],
    ["Atk", stats.attack],
    ["Def", stats.defense],
    ["SpA", stats.spAttack],
    ["SpD", stats.spDefense],
    ["Spe", stats.speed],
  ]
    .filter(([, points]) => Number(points) > 0)
    .map(([label, points]) => `${label} ${points}`)
    .join(" / ");
}

function findSelectedAllocationRank(
  saved: AllocationStats,
  choices: AllocationChoice[],
) {
  const hasSavedPoints = Object.values(saved).some((points) => points > 0);
  if (!hasSavedPoints) return null;

  return choices.find(
    (choice) =>
      choice.stats.hp === saved.hp &&
      choice.stats.attack === saved.attack &&
      choice.stats.defense === saved.defense &&
      choice.stats.spAttack === saved.spAttack &&
      choice.stats.spDefense === saved.spDefense &&
      choice.stats.speed === saved.speed,
  )?.rank;
}

function hasCompleteSuggestions(suggestions: BuildSuggestions) {
  return (
    suggestions.items.length > 0 &&
    suggestions.abilities.length > 0 &&
    suggestions.natures.length > 0 &&
    suggestions.moves.length > 0 &&
    suggestions.allocations.length > 0
  );
}
