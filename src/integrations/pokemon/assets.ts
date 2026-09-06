export function getPokemonSpriteUrl(nationalDexNumber: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalDexNumber}.png`;
}

export function getPokemonItemSpriteUrl(itemId: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemId}.png`;
}

export function getShowdownSpriteUrl(pokemonId: string) {
  return `https://play.pokemonshowdown.com/sprites/gen5/${pokemonId}.png`;
}

export function getChampionsSpriteUrl(savedName: string) {
  return `https://championsbattledata.com/pokemon_champions_assets/pokemon/${encodeURIComponent(savedName)}.png`;
}

export function getPokemonSpriteCandidates(
  pokemonId: string,
  displayName: string,
  heldItem?: string | null,
  formMode: "auto" | "normal" = "auto",
) {
  const originalId = normalizeAssetId(pokemonId);
  const existingMegaForm = getExistingMegaForm(originalId);
  const baseId = existingMegaForm?.baseId ?? originalId;
  const baseDisplayName = existingMegaForm
    ? getBaseDisplayName(displayName, existingMegaForm.variant)
    : displayName;
  const megaForm =
    formMode === "auto"
      ? getMegaFormForHeldItem(baseId, baseDisplayName, heldItem)
      : null;
  const id =
    formMode === "normal" ? baseId : (megaForm?.pokemonId ?? originalId);
  const spriteName =
    formMode === "normal"
      ? baseDisplayName
      : (megaForm?.displayName ?? displayName);
  const displaySlug = spriteName
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");
  const hyphenatedFormSlug = getPokemonFormSlug(id);
  const showdownFormSlug = getShowdownFormSlug(id);
  const baseSpecies = id.replace(
    /(alola|galar|hisui|paldea|forme|female|male|blade|shield|wash|heat|frost|fan|mow|megax|megay|mega)$/,
    "",
  );

  return uniqueUrls([
    getChampionsSpriteUrl(spriteName),
    ...[showdownFormSlug, id, hyphenatedFormSlug, displaySlug, baseSpecies].map(
      getShowdownSpriteUrl,
    ),
    megaForm ? getChampionsSpriteUrl(baseDisplayName) : null,
    megaForm ? getShowdownSpriteUrl(baseId) : null,
  ]);
}

export function canToggleMegaSprite(
  pokemonId: string,
  displayName: string,
  heldItem?: string | null,
) {
  const originalId = normalizeAssetId(pokemonId);
  const existingMegaForm = getExistingMegaForm(originalId);
  const baseId = existingMegaForm?.baseId ?? originalId;
  const baseDisplayName = existingMegaForm
    ? getBaseDisplayName(displayName, existingMegaForm.variant)
    : displayName;

  return Boolean(getMegaFormForHeldItem(baseId, baseDisplayName, heldItem));
}

const megaStoneOwners: Record<string, string> = {
  abomasite: "abomasnow",
  aggronite: "aggron",
  altarianite: "altaria",
  ampharosite: "ampharos",
  audinite: "audino",
  blastoisinite: "blastoise",
  diancite: "diancie",
  glalitite: "glalie",
  houndoominite: "houndoom",
  lucarionite: "lucario",
  manectite: "manectric",
  sablenite: "sableye",
  salamencite: "salamence",
};

function getMegaFormForHeldItem(
  pokemonId: string,
  displayName: string,
  heldItem?: string | null,
) {
  if (!heldItem) return null;

  const itemId = normalizeAssetId(heldItem);
  const variant = itemId.endsWith("itex")
    ? "x"
    : itemId.endsWith("itey")
      ? "y"
      : "";
  const stoneId = variant ? itemId.slice(0, -1) : itemId;
  const mappedOwner = megaStoneOwners[stoneId];
  const possibleStoneIds = new Set([
    `${pokemonId}ite`,
    `${pokemonId}nite`,
    `${pokemonId}inite`,
    `${pokemonId.replace(/[aeiou]$/, "")}ite`,
    `${pokemonId.replace(/y$/, "")}ite`,
  ]);

  if (mappedOwner ? mappedOwner !== pokemonId : !possibleStoneIds.has(stoneId)) {
    return null;
  }

  const variantLabel = variant ? ` ${variant.toUpperCase()}` : "";
  return {
    pokemonId: `${pokemonId}mega${variant}`,
    displayName: `Mega ${displayName}${variantLabel}`,
  };
}

function getExistingMegaForm(pokemonId: string) {
  const match = pokemonId.match(/^(.*)mega(x|y)?$/);
  return match
    ? { baseId: match[1], variant: match[2] ?? "" }
    : null;
}

function getBaseDisplayName(displayName: string, variant: string) {
  const withoutMega = displayName
    .replace(/^mega\s+/i, "")
    .replace(/\s+mega(?:\s+[xy])?$/i, "");

  return variant
    ? withoutMega.replace(new RegExp(`\\s+${variant}$`, "i"), "")
    : withoutMega;
}

function normalizeAssetId(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

export function getPokemonItemSpriteCandidates(
  itemId: string,
  preferredUrl?: string | null,
) {
  const normalizedId = itemId
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "");

  return uniqueUrls([preferredUrl, getPokemonItemSpriteUrl(normalizedId)]);
}

function uniqueUrls(urls: Array<string | null | undefined>) {
  return [...new Set(urls.filter((url): url is string => Boolean(url)))];
}

const formSuffixPattern =
  /^(.*)(wash|heat|frost|fan|mow|antique|phony|male|female|blade|shield|sunny|rainy|snowy|dusk|dawn|midnight|small|average|large|super|three|four|megax|megay|mega|archipelago|continental|elegant|garden|highplains|icy|jungle|marine|meadow|monsoon|ocean|polar|river|sandstorm|savanna|tundra|fancy|pokeball|attack|defense|speed|trash|black|white|origin|therian|incarnate|resolute|complete)$/;

/** Return the conventional hyphenated slug for a punctuation-stripped form ID. */
export function getPokemonFormSlug(pokemonId: string) {
  const id = pokemonId.toLowerCase();
  const regionalForm = id.match(
    /^(.*)(alola|galar|hisui|paldea)(combatbreed|blazebreed|aquabreed|combat|blaze|aqua|ordinary|hero)?$/,
  );
  if (regionalForm) {
    const form = regionalForm[3]?.replace(/breed$/, "");
    return [regionalForm[1], regionalForm[2], form]
      .filter(Boolean)
      .join("-");
  }

  const match = id.match(formSuffixPattern);
  return match ? `${match[1]}-${match[2]}` : id;
}

/** Showdown keeps regional breed/pattern suffixes compact (e.g. tauros-paldeaaqua). */
export function getShowdownFormSlug(pokemonId: string) {
  const id = pokemonId.toLowerCase();
  const regionalForm = id.match(
    /^(.*)(alola|galar|hisui|paldea)(combatbreed|blazebreed|aquabreed|combat|blaze|aqua|ordinary|hero)?$/,
  );
  if (regionalForm) {
    const form = regionalForm[3]?.replace(/breed$/, "");
    return `${regionalForm[1]}-${regionalForm[2]}${form ?? ""}`;
  }

  return getPokemonFormSlug(id);
}
