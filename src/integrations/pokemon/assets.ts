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

const formSuffixPattern =
  /^(.*)(wash|heat|frost|fan|mow|antique|phony|male|female|blade|shield|sunny|rainy|snowy|dusk|dawn|midnight|small|average|large|super|three|four|mega|archipelago|continental|elegant|garden|highplains|icy|jungle|marine|meadow|monsoon|ocean|polar|river|sandstorm|savanna|tundra|fancy|pokeball|attack|defense|speed|trash|black|white|origin|therian|incarnate|resolute|complete)$/;

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
