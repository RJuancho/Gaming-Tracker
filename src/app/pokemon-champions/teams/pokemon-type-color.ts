export function getPokemonTypeColor(type: string) {
  const colors: Record<string, string> = {
    normal: "bg-slate-500/25 text-slate-200",
    fire: "bg-orange-500/25 text-orange-200",
    water: "bg-blue-500/25 text-blue-200",
    electric: "bg-yellow-400/25 text-yellow-100",
    grass: "bg-emerald-500/25 text-emerald-200",
    ice: "bg-cyan-400/25 text-cyan-100",
    fighting: "bg-red-500/25 text-red-200",
    poison: "bg-purple-500/25 text-purple-200",
    ground: "bg-amber-500/25 text-amber-200",
    flying: "bg-indigo-400/25 text-indigo-200",
    psychic: "bg-pink-500/25 text-pink-200",
    bug: "bg-lime-500/25 text-lime-200",
    rock: "bg-stone-500/25 text-stone-200",
    ghost: "bg-violet-500/25 text-violet-200",
    dragon: "bg-indigo-600/30 text-indigo-200",
    dark: "bg-zinc-700/60 text-zinc-200",
    steel: "bg-slate-400/25 text-slate-200",
    fairy: "bg-fuchsia-400/25 text-fuchsia-200",
  };

  return colors[type.toLowerCase()] ?? colors.normal;
}

