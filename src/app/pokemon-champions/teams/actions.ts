"use server";

import {
  addPokemonTeamMember,
  addTeamMemberSchema,
  changePokemonTeamMember,
  changeTeamMemberSchema,
  createSnorlaxStarterTeam,
  createStarterTeamSchema,
  deletePokemonTeam,
  deleteTeamSchema,
  updatePokemonTeam,
  updatePokemonBuild,
  updatePokemonBuildSchema,
  updateTeamSchema,
} from "@/services/pokemon-teams";

export type TeamActionState = {
  status: "idle" | "success" | "error";
  action: "create" | "edit" | "replace" | "delete";
  message: string;
  id: number;
};

function feedback(
  status: "success" | "error",
  action: TeamActionState["action"],
  message: string,
): TeamActionState {
  return { status, action, message, id: Date.now() };
}

export async function createSnorlaxTeam(
  _state: TeamActionState,
  formData: FormData,
) {
  const input = createStarterTeamSchema.safeParse({
    name: formData.get("name"),
    format: formData.get("format"),
    playstyle: formData.get("playstyle") || undefined,
    pokemonId: formData.get("pokemonId") || undefined,
  });

  if (!input.success) {
    return feedback("error", "create", "Enter a valid team name and battle format.");
  }

  try {
    await createSnorlaxStarterTeam(input.data);
    return feedback("success", "create", "Team created.");
  } catch (error) {
    return feedback(
      "error",
      "create",
      error instanceof Error ? error.message : "The team could not be created.",
    );
  }
}

export async function addTeamMember(
  _state: TeamActionState,
  formData: FormData,
) {
  const input = addTeamMemberSchema.safeParse({
    teamId: formData.get("teamId"),
    pokemonId: formData.get("pokemonId"),
    role: formData.get("role"),
  });

  if (!input.success) {
    return feedback("error", "create", "Choose a Pokémon and an intended role.");
  }

  try {
    await addPokemonTeamMember(input.data);
    return feedback("success", "create", "Pokémon added to the next open team slot.");
  } catch (error) {
    return feedback(
      "error",
      "create",
      error instanceof Error ? error.message : "The Pokémon could not be added.",
    );
  }
}

export async function editTeam(
  _state: TeamActionState,
  formData: FormData,
) {
  const input = updateTeamSchema.safeParse({
    teamId: formData.get("teamId"),
    name: formData.get("name"),
    format: formData.get("format"),
    notes: formData.get("notes"),
  });
  if (!input.success) {
    return feedback("error", "edit", "Enter a valid team name, format, and notes.");
  }

  try {
    await updatePokemonTeam(input.data);
    return feedback("success", "edit", "Team details updated.");
  } catch (error) {
    return feedback(
      "error",
      "edit",
      error instanceof Error ? error.message : "The team could not be updated.",
    );
  }
}

export async function changeTeamMember(
  _state: TeamActionState,
  formData: FormData,
) {
  const input = changeTeamMemberSchema.safeParse({
    teamId: formData.get("teamId"),
    memberId: formData.get("memberId"),
    pokemonId: formData.get("pokemonId"),
    role: formData.get("role"),
  });
  if (!input.success) {
    return feedback("error", "replace", "Choose a valid Pokémon and role.");
  }

  try {
    await changePokemonTeamMember(input.data);
    return feedback("success", "replace", "Team member replaced.");
  } catch (error) {
    return feedback(
      "error",
      "replace",
      error instanceof Error
        ? error.message
        : "The Pokémon could not be changed.",
    );
  }
}

export async function deleteTeam(
  _state: TeamActionState,
  formData: FormData,
) {
  const input = deleteTeamSchema.safeParse({
    teamId: formData.get("teamId"),
  });
  if (!input.success) {
    return feedback("error", "delete", "That team could not be identified.");
  }

  try {
    await deletePokemonTeam(input.data);
    return feedback("success", "delete", "Team deleted.");
  } catch (error) {
    return feedback(
      "error",
      "delete",
      error instanceof Error ? error.message : "The team could not be deleted.",
    );
  }
}

export async function savePokemonBuild(
  _state: TeamActionState,
  formData: FormData,
) {
  const input = updatePokemonBuildSchema.safeParse({
    teamId: formData.get("teamId"),
    memberId: formData.get("memberId"),
    heldItem: formData.get("heldItem"),
    ability: formData.get("ability"),
    nature: formData.get("nature"),
    moves: formData.getAll("moves"),
    statAllocationRank: formData.get("statAllocationRank"),
  });
  if (!input.success) {
    return feedback(
      "error",
      "edit",
      "Choose an item, ability, nature, moves, and stat allocation.",
    );
  }

  try {
    await updatePokemonBuild(input.data);
    return feedback("success", "edit", "Pokémon build saved.");
  } catch (error) {
    return feedback(
      "error",
      "edit",
      error instanceof Error ? error.message : "The build was not saved.",
    );
  }
}
