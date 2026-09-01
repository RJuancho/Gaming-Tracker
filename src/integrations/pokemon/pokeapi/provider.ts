import "server-only";

import { z } from "zod";

import { getPokemonFormSlug, getPokemonItemSpriteUrl, getPokemonSpriteUrl } from "@/integrations/pokemon/assets";

const POKEAPI_URL = "https://pokeapi.co";
const LEGENDS_ZA_ROSTER_URL =
  "https://raw.githubusercontent.com/TheFauxDreamer/PokeZACatchCalc/main/pokemon-legends-za-data.json";
const pokemonIdSchema = z.string().regex(/^[a-z0-9-]+$/);

const pokemonResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  sprites: z.object({
    front_default: z.url().nullable(),
  }),
  species: z.object({ name: z.string() }),
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

const encounterResponseSchema = z.array(
  z.object({
    version_details: z.array(
      z.object({
        version: z.object({ name: z.string() }),
        encounter_details: z.array(
          z.object({ method: z.object({ name: z.string() }) }),
        ),
      }),
    ),
  }),
);

const pokedexResponseSchema = z.object({
  pokemon_entries: z.array(
    z.object({
      entry_number: z.number().int().positive(),
      pokemon_species: z.object({ name: z.string() }),
    }),
  ),
});

const legendsZaRosterSchema = z.array(
  z.object({
    slug: z.string(),
    data: z.object({
      obtainability: z.string(),
      speciesGame: z.object({
        game: z.object({ slug: z.string() }),
      }),
    }),
  }),
);

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

export type PokemonGameAvailability = {
  gameId: string;
  gameName: string;
  methods: string[];
};

export type PokemonAvailability = {
  games: PokemonGameAvailability[];
  sourceNote: string;
};

const gameNames: Record<string, string> = {
  red: "Pokémon Red",
  blue: "Pokémon Blue",
  yellow: "Pokémon Yellow",
  gold: "Pokémon Gold",
  silver: "Pokémon Silver",
  crystal: "Pokémon Crystal",
  ruby: "Pokémon Ruby",
  sapphire: "Pokémon Sapphire",
  emerald: "Pokémon Emerald",
  firered: "Pokémon FireRed",
  leafgreen: "Pokémon LeafGreen",
  diamond: "Pokémon Diamond",
  pearl: "Pokémon Pearl",
  platinum: "Pokémon Platinum",
  heartgold: "Pokémon HeartGold",
  soulsilver: "Pokémon SoulSilver",
  black: "Pokémon Black",
  white: "Pokémon White",
  "black-2": "Pokémon Black 2",
  "white-2": "Pokémon White 2",
  x: "Pokémon X",
  y: "Pokémon Y",
  "omega-ruby": "Pokémon Omega Ruby",
  "alpha-sapphire": "Pokémon Alpha Sapphire",
  sun: "Pokémon Sun",
  moon: "Pokémon Moon",
  "ultra-sun": "Pokémon Ultra Sun",
  "ultra-moon": "Pokémon Ultra Moon",
  sword: "Pokémon Sword",
  shield: "Pokémon Shield",
  "brilliant-diamond": "Pokémon Brilliant Diamond",
  "shining-pearl": "Pokémon Shining Pearl",
  "legends-arceus": "Pokémon Legends: Arceus",
  scarlet: "Pokémon Scarlet",
  violet: "Pokémon Violet",
  "legends-z-a": "Pokémon Legends: Z-A",
};

const scarletVioletPokedexes = [
  { id: "paldea", label: "Paldea Pokédex", release: "base game" },
  { id: "kitakami", label: "Kitakami Pokédex", release: "The Teal Mask" },
  { id: "blueberry", label: "Blueberry Pokédex", release: "The Indigo Disk" },
] as const;

const supplementalAvailability: Record<
  string,
  Array<{ gameId: string; methods: string[] }>
> = {
  gengar: [
    { gameId: "scarlet", methods: ["Wild encounter or Tera Raid"] },
    { gameId: "violet", methods: ["Wild encounter or Tera Raid"] },
  ],
  sneasler: [
    {
      gameId: "legends-arceus",
      methods: ["Evolve Hisuian Sneasel during the day with a Razor Claw"],
    },
  ],
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

  const formSlug = getPokemonFormSlug(id);
  if (formSlug !== id) {
    return formSlug;
  }

  return id;
}

export async function getPokemonAvailability(
  pokemonId: string,
): Promise<PokemonAvailability> {
  const id = pokemonIdSchema.parse(pokemonId);
  const apiId = getPokeApiPokemonId(id);
  const games = new Map<string, Set<string>>();

  const [pokemonResult, encountersResult, ...modernResults] =
    await Promise.allSettled([
      fetchPokeApi(`/api/v2/pokemon/${apiId}`),
      fetchPokeApi(`/api/v2/pokemon/${apiId}/encounters`),
      ...scarletVioletPokedexes.map((pokedex) =>
        fetchPokeApi(`/api/v2/pokedex/${pokedex.id}`),
      ),
      fetchExternalJson(LEGENDS_ZA_ROSTER_URL),
    ]);

  if (encountersResult.status === "fulfilled") {
    const encounters = encounterResponseSchema.parse(encountersResult.value);
    for (const encounter of encounters) {
      for (const version of encounter.version_details) {
        if (!gameNames[version.version.name]) continue;
        const methods = games.get(version.version.name) ?? new Set<string>();
        for (const detail of version.encounter_details) {
          methods.add(formatEncounterMethod(detail.method.name));
        }
        games.set(version.version.name, methods);
      }
    }
  }

  const speciesId =
    pokemonResult.status === "fulfilled"
      ? (pokemonResponseSchema.safeParse(pokemonResult.value).data?.species.name ??
        getFallbackSpeciesId(apiId))
      : getFallbackSpeciesId(apiId);

  scarletVioletPokedexes.forEach((pokedex, index) => {
    const result = modernResults[index];
    if (!result || result.status !== "fulfilled") return;

    const parsedPokedex = pokedexResponseSchema.safeParse(result.value);
    if (!parsedPokedex.success) return;

    const entry = parsedPokedex.data.pokemon_entries.find(
      (candidate) => candidate.pokemon_species.name === speciesId,
    );
    if (!entry) return;

    const method = `${pokedex.label} #${entry.entry_number} (${pokedex.release}; exact acquisition differs by version)`;
    addAvailabilityMethod(games, "scarlet", method);
    addAvailabilityMethod(games, "violet", method);
  });

  const legendsZaResult = modernResults[scarletVioletPokedexes.length];
  if (legendsZaResult?.status === "fulfilled") {
    const parsedRoster = legendsZaRosterSchema.safeParse(legendsZaResult.value);
    const matchingRecords = parsedRoster.success
      ? parsedRoster.data.filter(
          (record) =>
            record.slug === speciesId &&
            record.data.speciesGame.game.slug === "legends-z-a",
        )
      : [];
    for (const record of matchingRecords) {
      addAvailabilityMethod(
        games,
        "legends-z-a",
        formatLegendsZaObtainability(record.data.obtainability),
      );
    }
  }

  for (const entry of getSupplementalAvailability(id, apiId)) {
    const methods = games.get(entry.gameId) ?? new Set<string>();
    entry.methods.forEach((method) => methods.add(method));
    games.set(entry.gameId, methods);
  }

  return {
    games: [...games.entries()]
      .map(([gameId, methods]) => ({
        gameId,
        gameName: gameNames[gameId] ?? formatSlug(gameId),
        methods: [...methods],
      }))
      .sort(
        (left, right) =>
          Object.keys(gameNames).indexOf(right.gameId) -
          Object.keys(gameNames).indexOf(left.gameId),
      ),
    sourceNote:
      "Direct encounters and Scarlet/Violet regional Pokédex entries come from PokéAPI. Legends: Z-A availability uses an attributed community roster. A Pokédex listing does not guarantee the same acquisition method in both versions.",
  };
}

function addAvailabilityMethod(
  games: Map<string, Set<string>>,
  gameId: string,
  method: string,
) {
  const methods = games.get(gameId) ?? new Set<string>();
  methods.add(method);
  games.set(gameId, methods);
}

function getFallbackSpeciesId(apiId: string) {
  return apiId
    .replace(/-(alola|galar|hisui|paldea)(-(combat|blaze|aqua))?$/, "")
    .replace(/-(male|female|blade|shield|wash|heat|frost|fan|mow|mega)$/, "");
}

function formatLegendsZaObtainability(value: string) {
  const labels: Record<string, string> = {
    catch: "Obtainable in-game (community roster)",
    transfer: "Transfer via Pokémon HOME (community roster)",
    evolve: "Obtain through evolution (community roster)",
  };
  return labels[value] ?? "Available in-game (community roster)";
}

function getSupplementalAvailability(id: string, apiId: string) {
  const entries = [...(supplementalAvailability[id] ?? []), ...(supplementalAvailability[apiId] ?? [])];
  if (id.includes("hisui") || apiId.includes("hisui")) {
    entries.push({ gameId: "legends-arceus", methods: ["Obtain in the Hisui region"] });
  }
  if (id.includes("paldea") || apiId.includes("paldea")) {
    entries.push(
      { gameId: "scarlet", methods: ["Obtain in the Paldea region"] },
      { gameId: "violet", methods: ["Obtain in the Paldea region"] },
    );
  }
  return entries;
}

function formatEncounterMethod(value: string) {
  const labels: Record<string, string> = {
    walk: "Wild encounter",
    "surf-old": "Surfing encounter",
    "old-rod": "Fishing with Old Rod",
    "good-rod": "Fishing with Good Rod",
    "super-rod": "Fishing with Super Rod",
    "rock-smash": "Rock Smash encounter",
    "headbutt-low": "Headbutt encounter",
    "headbutt-normal": "Headbutt encounter",
    "headbutt-high": "Headbutt encounter",
  };
  return labels[value] ?? formatSlug(value);
}

function formatSlug(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

async function fetchExternalJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    throw new Error(`Pokémon availability source failed with status ${response.status}.`);
  }

  return response.json();
}
