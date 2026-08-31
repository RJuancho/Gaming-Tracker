export function getPokemonSpriteUrl(nationalDexNumber: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalDexNumber}.png`;
}

export function getPokemonItemSpriteUrl(itemId: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemId}.png`;
}

export function getShowdownSpriteUrl(pokemonId: string) {
  return `https://play.pokemonshowdown.com/sprites/gen5/${pokemonId}.png`;
}

const formSuffixPattern =
  /^(.*)(wash|heat|frost|fan|mow|antique|phony|male|female|blade|shield|sunny|rainy|snowy|dusk|dawn|midnight|small|average|large|super|attack|defense|speed|trash|black|white|origin|therian|incarnate|resolute|complete)$/;

/** Return the conventional hyphenated slug for a punctuation-stripped form ID. */
export function getPokemonFormSlug(pokemonId: string) {
  const match = pokemonId.toLowerCase().match(formSuffixPattern);
  return match ? `${match[1]}-${match[2]}` : pokemonId.toLowerCase();
}
