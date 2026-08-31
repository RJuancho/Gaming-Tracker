export function getPokemonSpriteUrl(nationalDexNumber: number) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalDexNumber}.png`;
}

export function getPokemonItemSpriteUrl(itemId: string) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${itemId}.png`;
}

export function getShowdownSpriteUrl(pokemonId: string) {
  return `https://play.pokemonshowdown.com/sprites/gen5/${pokemonId}.png`;
}
