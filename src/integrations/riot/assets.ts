import "server-only";

import { z } from "zod";

import type { TftTrait, TftUnit } from "./tft";

const DATA_DRAGON_URL = "https://ddragon.leagueoflegends.com";
const COMMUNITY_DRAGON_URL = "https://raw.communitydragon.org/latest";
const COMMUNITY_DRAGON_TFT_CATALOG = `${COMMUNITY_DRAGON_URL}/cdragon/tft/en_us.json`;

const versionsSchema = z.array(z.string().min(1));
const catalogSchema = z.object({
  data: z.record(
    z.string(),
    z.object({ image: z.object({ full: z.string() }) }),
  ),
});
const communitySetCatalogSchema = z.object({
  sets: z.record(
    z.string(),
    z.object({
      champions: z.array(
        z.object({
          apiName: z.string(),
          name: z.string().nullable(),
          cost: z.number(),
          traits: z.array(z.string()),
        }),
      ),
    }),
  ),
});

export type TftAssetImages = {
  units: Record<string, string | null>;
  items: Record<string, string | null>;
  traits: Record<string, string | null>;
  unitCosts: Record<string, number | null>;
  unitNames: Record<string, string | null>;
};

export async function getTftAssetImages(
  units: TftUnit[],
  traits: TftTrait[],
  setNumber?: number,
): Promise<TftAssetImages> {
  const version = await getLatestDataDragonVersion();
  const [champions, items, traitCatalog, communitySetCatalog] =
    await Promise.all([
      fetchCatalog(version, "tft-champion"),
      fetchCatalog(version, "tft-item"),
      fetchCatalog(version, "tft-trait"),
      fetchCommunitySetCatalog().catch((error: unknown) => {
        console.warn(
          "CommunityDragon TFT roster unavailable:",
          error instanceof Error ? error.message : "Unknown error",
        );
        return {};
      }),
    ]);
  const shopUnits = getShopUnitCatalog(communitySetCatalog, setNumber);

  return {
    units: Object.fromEntries(
      units.map((unit) => [
        unit.character_id,
        resolveAsset(champions, unit.character_id, version, "tft-champion"),
      ]),
    ),
    items: Object.fromEntries(
      units
        .flatMap((unit) => unit.itemNames)
        .map((item) => [
          item,
          resolveAsset(items, item, version, "tft-item"),
        ]),
    ),
    traits: Object.fromEntries(
      traits.map((trait) => [
        trait.name,
        resolveAsset(traitCatalog, trait.name, version, "tft-trait"),
      ]),
    ),
    unitCosts: Object.fromEntries(
      units.map((unit) => [
        unit.character_id,
        shopUnits.get(unit.character_id)?.cost ?? null,
      ]),
    ),
    unitNames: Object.fromEntries(
      units.map((unit) => [
        unit.character_id,
        shopUnits.get(unit.character_id)?.name ?? null,
      ]),
    ),
  };
}

async function fetchCommunitySetCatalog() {
  const response = await fetch(COMMUNITY_DRAGON_TFT_CATALOG, {
    next: { revalidate: 86_400 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("CommunityDragon TFT roster request failed.");
  }

  return communitySetCatalogSchema.parse(await response.json()).sets;
}

function getShopUnitCatalog(
  sets: z.infer<typeof communitySetCatalogSchema>["sets"],
  setNumber?: number,
) {
  const set = setNumber === undefined ? null : sets[String(setNumber)];
  const shopUnits = (set?.champions ?? []).filter(
    (unit) =>
      Number.isInteger(unit.cost) &&
      unit.cost >= 1 &&
      unit.cost <= 5 &&
      unit.name !== null &&
      unit.traits.length > 0,
  );

  return new Map(shopUnits.map((unit) => [unit.apiName, unit]));
}

async function getLatestDataDragonVersion() {
  const response = await fetch(`${DATA_DRAGON_URL}/api/versions.json`, {
    next: { revalidate: 86_400 },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Unable to resolve the latest Riot static-data version.");
  }

  return versionsSchema.parse(await response.json())[0];
}

async function fetchCatalog(version: string, catalog: string) {
  const response = await fetch(
    `${DATA_DRAGON_URL}/cdn/${version}/data/en_US/${catalog}.json`,
    {
      next: { revalidate: 86_400 },
      headers: { Accept: "application/json" },
    },
  );

  if (!response.ok) {
    throw new Error(`Riot static-data request failed for ${catalog}.`);
  }

  return catalogSchema.parse(await response.json()).data;
}

function resolveAsset(
  catalog: Record<string, { image: { full: string } }>,
  identifier: string,
  version: string,
  catalogName: string,
) {
  const neutralAsset = resolveNeutralAsset(identifier);
  if (neutralAsset) {
    return neutralAsset;
  }

  const entry = Object.entries(catalog).find(
    ([key]) => key === identifier || key.endsWith(`/${identifier}`),
  )?.[1];

  return entry
    ? `${DATA_DRAGON_URL}/cdn/${version}/img/${catalogName}/${encodeURIComponent(entry.image.full)}`
    : null;
}

function resolveNeutralAsset(identifier: string) {
  const neutralAssets: Record<string, string> = {
    DA_18_Krug: `${COMMUNITY_DRAGON_URL}/game/assets/characters/tft18_krug/skins/base/images/t_18_krug_teamplannersplash.png`,
    DA_18_Sentry: `${COMMUNITY_DRAGON_URL}/game/assets/characters/tft18_sentry/skins/base/images/t_18_sentry_teamplannersplash.png`,
    DA_18_Sentinel: `${COMMUNITY_DRAGON_URL}/game/assets/characters/tft18_sentinel/skins/base/images/t_18_sentinel_teamplannersplash.png`,
    DA_Krug18: `${COMMUNITY_DRAGON_URL}/game/assets/characters/tft18_krug/skins/base/images/t_18_krug_teamplannersplash.png`,
    DA_Sentry18: `${COMMUNITY_DRAGON_URL}/game/assets/characters/tft18_sentry/skins/base/images/t_18_sentry_teamplannersplash.png`,
    DA_Sentinel18: `${COMMUNITY_DRAGON_URL}/game/assets/characters/tft18_sentinel/skins/base/images/t_18_sentinel_teamplannersplash.png`,
  };

  return neutralAssets[identifier] ?? null;
}

