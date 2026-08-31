import "server-only";

import { z } from "zod";

import { getPokemonItemSpriteUrl, getPokemonSpriteUrl } from "@/integrations/pokemon/assets";

const POKEAPI_URL = "https://pokeapi.co";
const pokemonIdSchema = z.string().regex(/^[a-z0-9-]+$/);

const pokemonResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  sprites: z.object({
    front_default: z.url().nullable(),
  }),
});

const moveResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  type: z.object({ name: z.string() }),
});

const itemResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  sprites: z.object({
    default: z.url().nullable(),
  }),
});

export type PokemonReference = {
  nationalDexNumber: number;
  name: string;
  spriteUrl: string | null;
};

export type MoveReference = {
  name: string;
  type: string;
};

export type ItemReference = {
  name: string;
  spriteUrl: string | null;
};

export async function getPokemonReference(
  pokemonId: string,
): Promise<PokemonReference> {
  const id = pokemonIdSchema.parse(pokemonId);
  const apiId = getPokeApiPokemonId(id);

  let payload: unknown;

  try {
    payload = await fetchPokeApi(`/api/v2/pokemon/${apiId}`);
  } catch (error) {
    // Try the canonical species only after the preferred gendered form slug.
    // This keeps form-specific lookups intact while handling mirrors that do
    // not expose Basculegion's gendered records.
    if (apiId === "basculegion-male" || apiId === "basculegion-female") {
      try {
        payload = await fetchPokeApi("/api/v2/pokemon/basculegion");
        const canonical = pokemonResponseSchema.parse(payload);
        return {
          nationalDexNumber: canonical.id,
          name: apiId,
          spriteUrl: canonical.sprites.front_default ?? getPokemonSpriteUrl(978),
        };
      } catch {
        return {
          nationalDexNumber: 978,
          name: apiId,
          spriteUrl: getPokemonSpriteUrl(978),
        };
      }
    }

    // Aegislash’s form records are not consistently available from every
    // PokéAPI mirror. The canonical sprite and Dex number are stable, so the
    // profile can still render when that upstream record is unavailable.
    if (apiId === "aegislash" || apiId === "basculegion" || apiId.startsWith("basculegion-") || /-(alola|galar|hisui|paldea)$/.test(apiId)) {
      const canonicalId = apiId.replace(/-(alola|galar|hisui|paldea)$/, "");
      return {
        nationalDexNumber: canonicalId === "basculegion" ? 978 : canonicalId === "aegislash" ? 681 : 0,
        name: canonicalId,
        spriteUrl: canonicalId === "basculegion" ? getPokemonSpriteUrl(978) : canonicalId === "aegislash" ? getPokemonSpriteUrl(681) : null,
      };
    }

    throw error;
  }
  const result = pokemonResponseSchema.parse(payload);

  return {
    nationalDexNumber: result.id,
    name: result.name,
    spriteUrl: result.sprites.front_default,
  };
}

// Pokémon Champions uses Showdown-style form identifiers for some roster
// entries, while PokéAPI indexes those entries under the canonical species.
// Keep the roster ID intact everywhere else and only normalize at this API
// boundary.
function getPokeApiPokemonId(id: string) {
  const aliases: Record<string, string> = {
    aegislashblade: "aegislash",
    aegislashshield: "aegislash",
    aegislashbladeforme: "aegislash",
    aegislashshieldforme: "aegislash",
    basculegionmale: "basculegion-male",
    basculegionfemale: "basculegion-female",
    basculegionm: "basculegion-male",
    basculegionf: "basculegion-female",
    baculegionmale: "basculegion-male",
    baculegionfemale: "basculegion-female",
    baculegionm: "basculegion-male",
    baculegionf: "basculegion-female",
  };

  if (aliases[id]) {
    return aliases[id];
  }

  // Be defensive about future Showdown suffixes (for example, a localized
  // or punctuation-stripped Shield Forme identifier).
  if (id.startsWith("aegislash")) {
    return "aegislash";
  }

  // Be tolerant of roster data that drops a letter from the species name or
  // uses a short gender suffix (e.g. `baculegionm`).
  if (id.startsWith("basculegion") || id.startsWith("baculegion")) {
    if (id.endsWith("female") || id.endsWith("f")) {
      return "basculegion-female";
    }
    if (id.endsWith("male") || id.endsWith("m")) {
      return "basculegion-male";
    }
    return "basculegion";
  }

  const regionalMatch = id.match(/^(.*)(alola|galar|hisui|paldea)$/);
  if (regionalMatch) {
    return `${regionalMatch[1]}-${regionalMatch[2]}`;
  }

  return id;
}

export async function getMoveReference(moveId: string): Promise<MoveReference> {
  const id = pokemonIdSchema.parse(moveId);
  const payload = await fetchPokeApi(`/api/v2/move/${id}`);
  const result = moveResponseSchema.parse(payload);

  return { name: result.name, type: result.type.name };
}

export async function getItemReference(itemId: string): Promise<ItemReference> {
  const id = pokemonIdSchema.parse(itemId);
  try {
    const payload = await fetchPokeApi(`/api/v2/item/${id}`);
    const result = itemResponseSchema.parse(payload);

    return {
      name: result.name,
      spriteUrl:
        result.sprites.default ??
        getPokemonItemSpriteUrl(id),
    };
  } catch (error) {
    // Keep known item selections visual even when an upstream item record is
    // temporarily missing or has a provider-specific slug.
    if (id === "tyranitarite") {
      return {
        name: id,
        spriteUrl:
          getPokemonItemSpriteUrl("tyranitarite"),
      };
    }

    throw error;
  }
}

async function fetchPokeApi(pathname: string): Promise<unknown> {
  const url = new URL(pathname, POKEAPI_URL);
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`PokéAPI request failed with status ${response.status}.`);
  }

  return response.json();
}
