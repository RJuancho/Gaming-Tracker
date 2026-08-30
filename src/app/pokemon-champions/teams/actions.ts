"use server";

import { redirect } from "next/navigation";

import {
  addPokemonTeamMember,
  addTeamMemberSchema,
  createSnorlaxStarterTeam,
  createStarterTeamSchema,
  deletePokemonTeam,
  deleteTeamSchema,
  updatePokemonTeam,
  updatePokemonBuild,
  updatePokemonBuildSchema,
  updateTeamSchema,
} from "@/services/pokemon-teams";

export async function createSnorlaxTeam(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Team editing requires authentication before deployment.");
  }

  const input = createStarterTeamSchema.parse({
    name: formData.get("name"),
    format: formData.get("format"),
    playstyle: formData.get("playstyle"),
  });

  await createSnorlaxStarterTeam(input);
  redirect("/pokemon-champions/teams");
}

export async function addTeamMember(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Team editing requires authentication before deployment.");
  }

  const input = addTeamMemberSchema.safeParse({
    teamId: formData.get("teamId"),
    pokemonId: formData.get("pokemonId"),
    role: formData.get("role"),
  });

  let errorMessage: string | null = null;

  if (!input.success) {
    errorMessage = "Enter a Pokémon name and a role.";
  } else {
    try {
      await addPokemonTeamMember(input.data);
    } catch (error) {
      errorMessage =
        error instanceof Error
          ? error.message
          : "The Pokémon could not be added.";
    }
  }

  const query = errorMessage
    ? `?error=${encodeURIComponent(errorMessage)}`
    : "?saved=member";
  redirect(`/pokemon-champions/teams${query}`);
}

export async function editTeam(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Team editing requires authentication before deployment.");
  }

  const input = updateTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    format: formData.get("format"),
    notes: formData.get("notes"),
  });
  let errorMessage: string | null = null;

  if (!input.success) {
    errorMessage = "Enter a valid team name, format, and notes.";
  } else {
    try {
      await updatePokemonTeam(input.data);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "The team could not be updated.";
    }
  }

  const query = errorMessage
    ? `?error=${encodeURIComponent(errorMessage)}`
    : "?saved=team";
  redirect(`/pokemon-champions/teams${query}`);
}

export async function deleteTeam(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Team editing requires authentication before deployment.");
  }

  const input = deleteTeamSchema.safeParse({
    teamId: formData.get("teamId"),
  });
  let errorMessage: string | null = null;

  if (!input.success) {
    errorMessage = "That team could not be identified.";
  } else {
    try {
      await deletePokemonTeam(input.data);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "The team could not be deleted.";
    }
  }

  const query = errorMessage
    ? `?error=${encodeURIComponent(errorMessage)}`
    : "?saved=deleted";
  redirect(`/pokemon-champions/teams${query}`);
}

export async function savePokemonBuild(formData: FormData) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Team editing requires authentication before deployment.");
  }

  const input = updatePokemonBuildSchema.safeParse({
    teamId: formData.get("teamId"),
    memberId: formData.get("memberId"),
    heldItem: formData.get("heldItem"),
    ability: formData.get("ability"),
    nature: formData.get("nature"),
    moves: formData.getAll("moves"),
    statAllocationRank: formData.get("statAllocationRank"),
  });
  let errorMessage: string | null = null;

  if (!input.success) {
    errorMessage = "Choose an item, ability, nature, moves, and stat allocation.";
  } else {
    try {
      await updatePokemonBuild(input.data);
    } catch (error) {
      errorMessage =
        error instanceof Error ? error.message : "The build was not saved.";
    }
  }

  const query = errorMessage
    ? `?error=${encodeURIComponent(errorMessage)}`
    : "?saved=build";
  redirect(`/pokemon-champions/teams${query}`);
}

