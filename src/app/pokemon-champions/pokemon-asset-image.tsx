"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import {
  getPokemonItemSpriteCandidates,
  getPokemonSpriteCandidates,
} from "@/integrations/pokemon/assets";

type AssetImageProps = {
  sources: string[];
  alt: string;
  width: number;
  height: number;
  className: string;
  sizes?: string;
  priority?: boolean;
  fallbackLabel?: string;
};

export function PokemonAssetImage({
  sources,
  alt,
  width,
  height,
  className,
  sizes,
  priority = false,
  fallbackLabel = "◇",
}: AssetImageProps) {
  const sourceKey = sources.join("\n");
  const candidates = useMemo(
    () => sourceKey.split("\n").filter(Boolean),
    [sourceKey],
  );
  const [attempt, setAttempt] = useState({ sourceKey, index: 0 });
  const sourceIndex = attempt.sourceKey === sourceKey ? attempt.index : 0;

  const source = candidates[sourceIndex];
  if (!source) {
    return (
      <span
        role="img"
        aria-label={`${alt} unavailable`}
        className={`${className} grid place-items-center border border-white/10 bg-white/[0.04] font-mono text-slate-600`}
      >
        {fallbackLabel}
      </span>
    );
  }

  return (
    <Image
      src={source}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      decoding="async"
      className={className}
      onError={() => setAttempt({ sourceKey, index: sourceIndex + 1 })}
    />
  );
}

export function PokemonSpriteImage({
  pokemonId,
  name,
  heldItem,
  formMode = "auto",
  ...imageProps
}: Omit<AssetImageProps, "sources" | "alt"> & {
  pokemonId: string;
  name: string;
  heldItem?: string | null;
  formMode?: "auto" | "normal";
}) {
  return (
    <PokemonAssetImage
      {...imageProps}
      sources={getPokemonSpriteCandidates(pokemonId, name, heldItem, formMode)}
      alt={`${name} sprite`}
      fallbackLabel={name.charAt(0).toUpperCase()}
    />
  );
}

export function PokemonItemImage({
  itemId,
  name,
  preferredUrl,
  ...imageProps
}: Omit<AssetImageProps, "sources" | "alt"> & {
  itemId: string;
  name: string;
  preferredUrl?: string | null;
}) {
  return (
    <PokemonAssetImage
      {...imageProps}
      sources={getPokemonItemSpriteCandidates(itemId, preferredUrl)}
      alt={`${name} held item`}
    />
  );
}
