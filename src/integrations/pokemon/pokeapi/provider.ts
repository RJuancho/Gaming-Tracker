import "server-only";

import { z } from "zod";

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
  const payload = await fetchPokeApi(`/api/v2/pokemon/${id}`);
  const result = pokemonResponseSchema.parse(payload);

  return {
    nationalDexNumber: result.id,
    name: result.name,
    spriteUrl: result.sprites.front_default,
  };
}

export async function getMoveReference(moveId: string): Promise<MoveReference> {
  const id = pokemonIdSchema.parse(moveId);
  const payload = await fetchPokeApi(`/api/v2/move/${id}`);
  const result = moveResponseSchema.parse(payload);

  return { name: result.name, type: result.type.name };
}

export async function getItemReference(itemId: string): Promise<ItemReference> {
  const id = pokemonIdSchema.parse(itemId);
  const payload = await fetchPokeApi(`/api/v2/item/${id}`);
  const result = itemResponseSchema.parse(payload);

  return { name: result.name, spriteUrl: result.sprites.default };
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

