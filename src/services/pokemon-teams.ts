import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";

import { database } from "@/db/client";
import { pokemonTeamMembers, pokemonTeams } from "@/db/schema";
import {
  getChampionsPokemon,
  getCurrentChampionsMeta,
} from "@/integrations/pokemon/champions/provider";

export const createStarterTeamSchema = z.object({
  name: z.string().trim().min(1).max(80),
  format: z.enum(["Singles", "Doubles"]),
  playstyle: z.enum(["bulky", "balanced", "carry"]).optional(),
  pokemonId: z.string().trim().min(1).max(40).optional(),
});

export type StarterTeamInput = z.infer<typeof createStarterTeamSchema>;

export const updateTeamSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1).max(80),
  format: z.enum(["Singles", "Doubles"]),
  notes: z.string().trim().max(500),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

export const deleteTeamSchema = z.object({
  teamId: z.coerce.number().int().positive(),
});

export type DeleteTeamInput = z.infer<typeof deleteTeamSchema>;

export const addTeamMemberSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  pokemonId: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toLowerCase().replaceAll(/[^a-z0-9]/g, "")),
  role: z.string().trim().min(1).max(60),
});

export type AddTeamMemberInput = z.infer<typeof addTeamMemberSchema>;

export const updatePokemonBuildSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
  heldItem: z.string().trim().min(1).max(100),
  ability: z.string().trim().min(1).max(100),
  nature: z.string().trim().min(1).max(100),
  moves: z.array(z.string().trim().min(1).max(100)).min(1).max(4),
  statAllocationRank: z.coerce.number().int().positive(),
});

export const changeTeamMemberSchema = z.object({
  teamId: z.coerce.number().int().positive(),
  memberId: z.coerce.number().int().positive(),
  pokemonId: z.string().trim().min(1).max(40).transform((value) => value.toLowerCase().replaceAll(/[^a-z0-9]/g, "")),
  role: z.string().trim().min(1).max(60),
});

export type ChangeTeamMemberInput = z.infer<typeof changeTeamMemberSchema>;

export type UpdatePokemonBuildInput = z.infer<
  typeof updatePokemonBuildSchema
>;

const roleByPlaystyle: Record<"bulky" | "balanced" | "carry", string> = {
  bulky: "Bulky support",
  balanced: "Flexible anchor",
  carry: "Setup carry",
};

export async function createSnorlaxStarterTeam(input: StarterTeamInput) {
  const values = createStarterTeamSchema.parse(input);
  const starterPokemon = values.pokemonId
    ? await getChampionsPokemon(values.pokemonId, values.format)
    : null;

  return database.transaction(async (transaction) => {
    const [team] = await transaction
      .insert(pokemonTeams)
      .values({
        name: values.name,
        format: values.format,
        notes: starterPokemon
          ? `Started with ${starterPokemon.name}.`
          : "Blank team ready for your first Pokémon.",
      })
      .returning({ id: pokemonTeams.id });

    if (starterPokemon) {
      await transaction.insert(pokemonTeamMembers).values({
        teamId: team.id,
        slot: 1,
        pokemonId: starterPokemon.showdownId,
        displayName: starterPokemon.name,
        role: values.playstyle ? roleByPlaystyle[values.playstyle] : "Flexible role",
        notes: "Build choices have not been selected yet.",
      });
    }

    return team.id;
  });
}

export async function updatePokemonTeam(input: UpdateTeamInput) {
  const values = updateTeamSchema.parse(input);

  await database.transaction(async (transaction) => {
    const [existingTeam] = await transaction
      .select({ format: pokemonTeams.format })
      .from(pokemonTeams)
      .where(eq(pokemonTeams.id, values.teamId))
      .limit(1);

    if (!existingTeam) {
      throw new Error("That saved team no longer exists.");
    }

    await transaction
      .update(pokemonTeams)
      .set({
        name: values.name,
        format: values.format,
        notes: values.notes,
        updatedAt: new Date(),
      })
      .where(eq(pokemonTeams.id, values.teamId));

    if (existingTeam.format !== values.format) {
      await transaction
        .update(pokemonTeamMembers)
        .set({
          heldItem: null,
          ability: null,
          nature: null,
          moves: [],
          hpPoints: 0,
          attackPoints: 0,
          defensePoints: 0,
          specialAttackPoints: 0,
          specialDefensePoints: 0,
          speedPoints: 0,
        })
        .where(eq(pokemonTeamMembers.teamId, values.teamId));
    }
  });
}

export async function deletePokemonTeam(input: DeleteTeamInput) {
  const values = deleteTeamSchema.parse(input);
  const deletedTeams = await database
    .delete(pokemonTeams)
    .where(eq(pokemonTeams.id, values.teamId))
    .returning({ id: pokemonTeams.id });

  if (deletedTeams.length === 0) {
    throw new Error("That saved team no longer exists.");
  }
}

export async function addPokemonTeamMember(input: AddTeamMemberInput) {
  const values = addTeamMemberSchema.parse(input);
  const [team] = await database
    .select({ id: pokemonTeams.id, format: pokemonTeams.format })
    .from(pokemonTeams)
    .where(eq(pokemonTeams.id, values.teamId))
    .limit(1);

  if (!team) {
    throw new Error("That saved team no longer exists.");
  }

  const currentMembers = await database
    .select({ slot: pokemonTeamMembers.slot, pokemonId: pokemonTeamMembers.pokemonId })
    .from(pokemonTeamMembers)
    .where(eq(pokemonTeamMembers.teamId, team.id))
    .orderBy(asc(pokemonTeamMembers.slot));

  if (currentMembers.length >= 6) {
    throw new Error("This team already has six Pokémon.");
  }

  if (currentMembers.some((member) => member.pokemonId === values.pokemonId)) {
    throw new Error("That Pokémon is already on this team.");
  }

  const pokemon = await getChampionsPokemon(
    values.pokemonId,
    team.format === "Singles" ? "Singles" : "Doubles",
  );
  const usedSlots = new Set(currentMembers.map((member) => member.slot));
  const nextSlot = [1, 2, 3, 4, 5, 6].find((slot) => !usedSlots.has(slot));

  if (!nextSlot) {
    throw new Error("This team has no open slot.");
  }

  await database.insert(pokemonTeamMembers).values({
    teamId: team.id,
    slot: nextSlot,
    pokemonId: pokemon.showdownId,
    displayName: pokemon.name,
    role: values.role,
    notes: "Build choices have not been selected yet.",
  });
}

export async function changePokemonTeamMember(input: ChangeTeamMemberInput) {
  const values = changeTeamMemberSchema.parse(input);
  const [member] = await database
    .select({ id: pokemonTeamMembers.id, teamId: pokemonTeamMembers.teamId, pokemonId: pokemonTeamMembers.pokemonId, format: pokemonTeams.format })
    .from(pokemonTeamMembers)
    .innerJoin(pokemonTeams, eq(pokemonTeams.id, pokemonTeamMembers.teamId))
    .where(and(eq(pokemonTeamMembers.id, values.memberId), eq(pokemonTeamMembers.teamId, values.teamId)))
    .limit(1);

  if (!member) throw new Error("That team member no longer exists.");
  if (member.pokemonId !== values.pokemonId) {
    const duplicate = await database
      .select({ id: pokemonTeamMembers.id })
      .from(pokemonTeamMembers)
      .where(and(eq(pokemonTeamMembers.teamId, values.teamId), eq(pokemonTeamMembers.pokemonId, values.pokemonId)))
      .limit(1);
    if (duplicate.length > 0) throw new Error("That Pokémon is already on this team.");
  }

  const pokemon = await getChampionsPokemon(values.pokemonId, member.format === "Singles" ? "Singles" : "Doubles");
  await database.update(pokemonTeamMembers).set({
    pokemonId: pokemon.showdownId,
    displayName: pokemon.name,
    role: values.role,
    heldItem: null,
    ability: null,
    nature: null,
    moves: [],
    hpPoints: 0,
    attackPoints: 0,
    defensePoints: 0,
    specialAttackPoints: 0,
    specialDefensePoints: 0,
    speedPoints: 0,
  }).where(and(eq(pokemonTeamMembers.id, values.memberId), eq(pokemonTeamMembers.teamId, values.teamId)));
}

export async function updatePokemonBuild(input: UpdatePokemonBuildInput) {
  const values = updatePokemonBuildSchema.parse(input);
  const [member] = await database
    .select({
      id: pokemonTeamMembers.id,
      pokemonId: pokemonTeamMembers.pokemonId,
      format: pokemonTeams.format,
    })
    .from(pokemonTeamMembers)
    .innerJoin(pokemonTeams, eq(pokemonTeams.id, pokemonTeamMembers.teamId))
    .where(
      and(
        eq(pokemonTeamMembers.id, values.memberId),
        eq(pokemonTeamMembers.teamId, values.teamId),
      ),
    )
    .limit(1);

  if (!member) {
    throw new Error("That team member no longer exists.");
  }

  const meta = await getCurrentChampionsMeta(
    member.pokemonId,
    member.format === "Singles" ? "Singles" : "Doubles",
  );
  const namedChoices = (category: "held_item" | "ability" | "stat_alignment" | "move") =>
    meta.rankings
      .filter((ranking) => ranking.category === category && ranking.name)
      .map((ranking) => ranking.name as string);

  if (!namedChoices("held_item").includes(values.heldItem)) {
    throw new Error("Select a held item from the current suggestions.");
  }

  if (!namedChoices("ability").includes(values.ability)) {
    throw new Error("Select an ability from the current suggestions.");
  }

  if (!namedChoices("stat_alignment").includes(values.nature)) {
    throw new Error("Select a nature from the current suggestions.");
  }

  const validMoves = namedChoices("move");
  if (
    new Set(values.moves).size !== values.moves.length ||
    values.moves.some((move) => !validMoves.includes(move))
  ) {
    throw new Error("Choose up to four different moves from the suggestions.");
  }

  const allocation = meta.rankings.find(
    (ranking) =>
      ranking.category === "stat_points" &&
      ranking.rank === values.statAllocationRank &&
      ranking.statAllocation,
  )?.statAllocation;

  if (!allocation) {
    throw new Error("Select a stat allocation from the current suggestions.");
  }

  await database
    .update(pokemonTeamMembers)
    .set({
      heldItem: values.heldItem,
      ability: values.ability,
      nature: values.nature,
      moves: values.moves,
      hpPoints: allocation.hp,
      attackPoints: allocation.attack,
      defensePoints: allocation.defense,
      specialAttackPoints: allocation.sp_attack,
      specialDefensePoints: allocation.sp_defense,
      speedPoints: allocation.speed,
    })
    .where(eq(pokemonTeamMembers.id, member.id));
}

export async function listPokemonTeams() {
  const rows = await database
    .select({
      id: pokemonTeams.id,
      name: pokemonTeams.name,
      format: pokemonTeams.format,
      notes: pokemonTeams.notes,
      memberId: pokemonTeamMembers.id,
      memberSlot: pokemonTeamMembers.slot,
      pokemonId: pokemonTeamMembers.pokemonId,
      pokemonName: pokemonTeamMembers.displayName,
      role: pokemonTeamMembers.role,
      heldItem: pokemonTeamMembers.heldItem,
      ability: pokemonTeamMembers.ability,
      nature: pokemonTeamMembers.nature,
      moves: pokemonTeamMembers.moves,
      hpPoints: pokemonTeamMembers.hpPoints,
      attackPoints: pokemonTeamMembers.attackPoints,
      defensePoints: pokemonTeamMembers.defensePoints,
      specialAttackPoints: pokemonTeamMembers.specialAttackPoints,
      specialDefensePoints: pokemonTeamMembers.specialDefensePoints,
      speedPoints: pokemonTeamMembers.speedPoints,
    })
    .from(pokemonTeams)
    .leftJoin(
      pokemonTeamMembers,
      eq(pokemonTeamMembers.teamId, pokemonTeams.id),
    )
    .orderBy(asc(pokemonTeams.id), asc(pokemonTeamMembers.slot));

  const teams = new Map<
    number,
    {
      id: number;
      name: string;
      format: string;
      notes: string;
      members: Array<{
        id: number;
        slot: number;
        pokemonId: string;
        name: string;
        role: string;
        heldItem: string | null;
        ability: string | null;
        nature: string | null;
        moves: string[];
        statAllocation: {
          hp: number;
          attack: number;
          defense: number;
          spAttack: number;
          spDefense: number;
          speed: number;
        };
      }>;
    }
  >();

  for (const row of rows) {
    const team = teams.get(row.id) ?? {
      id: row.id,
      name: row.name,
      format: row.format,
      notes: row.notes,
      members: [],
    };

    if (
      row.memberId !== null &&
      row.memberSlot !== null &&
      row.pokemonId !== null &&
      row.pokemonName !== null &&
      row.role !== null
    ) {
      team.members.push({
        id: row.memberId,
        slot: row.memberSlot,
        pokemonId: row.pokemonId,
        name: row.pokemonName,
        role: row.role,
        heldItem: row.heldItem,
        ability: row.ability,
        nature: row.nature,
        moves: row.moves ?? [],
        statAllocation: {
          hp: row.hpPoints ?? 0,
          attack: row.attackPoints ?? 0,
          defense: row.defensePoints ?? 0,
          spAttack: row.specialAttackPoints ?? 0,
          spDefense: row.specialDefensePoints ?? 0,
          speed: row.speedPoints ?? 0,
        },
      });
    }

    teams.set(row.id, team);
  }

  return [...teams.values()];
}
