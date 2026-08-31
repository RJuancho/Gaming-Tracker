import PokemonPreviewPage from "../../pokemon-preview-page";

export const dynamic = "force-dynamic";

export default async function PokemonProfile({
  params,
}: {
  params: Promise<{ pokemonId: string }>;
}) {
  const { pokemonId } = await params;
  return <PokemonPreviewPage pokemonId={pokemonId} />;
}
