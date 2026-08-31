import "server-only";

const ENKA_API_URL = "https://enka.network/api";
const ENKA_STORE_URL = "https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store";

export type GenshinDisplayStat = { key: string; label: string; value: string };
export type GenshinArtifact = {
  itemId: number;
  name: string | null;
  setName: string | null;
  iconUrl: string | null;
  slot: string;
  level: number | null;
  mainStat: GenshinDisplayStat | null;
  substats: GenshinDisplayStat[];
};
export type GenshinWeapon = {
  itemId: number;
  name: string | null;
  iconUrl: string | null;
  level: number | null;
  refinement: number | null;
  stats: GenshinDisplayStat[];
};
export type GenshinCharacterBuild = {
  avatarId: number;
  name: string | null;
  iconUrl: string | null;
  level: number | null;
  constellation: number;
  friendship: number | null;
  keyStats: GenshinDisplayStat[];
  detailedStats: GenshinDisplayStat[];
  artifacts: GenshinArtifact[];
  weapon: GenshinWeapon | null;
};
export type GenshinProfile = {
  nickname: string | null;
  level: number | null;
  worldLevel: number | null;
  characters: GenshinCharacterBuild[];
};

type RawEquipment = {
  itemId: number;
  kind: "artifact" | "weapon" | "other";
  nameHash: unknown;
  setNameHash: unknown;
  iconUrl: string | null;
  slot: string;
  level: number | null;
  refinement: number | null;
  mainStat: GenshinDisplayStat | null;
  substats: GenshinDisplayStat[];
  weaponStats: GenshinDisplayStat[];
};
type RawCharacter = Omit<GenshinCharacterBuild, "name" | "iconUrl" | "artifacts" | "weapon"> & { equipment: RawEquipment[] };

const characterStatMap: Record<string, { label: string; percentage?: boolean; primary?: boolean }> = {
  "1": { label: "Base HP" },
  "4": { label: "Base ATK" },
  "7": { label: "Base DEF" },
  "20": { label: "Crit Rate", percentage: true, primary: true },
  "22": { label: "Crit DMG", percentage: true, primary: true },
  "23": { label: "Energy Recharge", percentage: true, primary: true },
  "26": { label: "Healing Bonus", percentage: true, primary: true },
  "28": { label: "Elemental Mastery", primary: true },
  "30": { label: "Physical DMG Bonus", percentage: true, primary: true },
  "40": { label: "Pyro DMG Bonus", percentage: true, primary: true },
  "41": { label: "Electro DMG Bonus", percentage: true, primary: true },
  "42": { label: "Hydro DMG Bonus", percentage: true, primary: true },
  "43": { label: "Dendro DMG Bonus", percentage: true, primary: true },
  "44": { label: "Anemo DMG Bonus", percentage: true, primary: true },
  "45": { label: "Geo DMG Bonus", percentage: true, primary: true },
  "46": { label: "Cryo DMG Bonus", percentage: true, primary: true },
  "81": { label: "Shield Strength", percentage: true },
  "2000": { label: "Max HP", primary: true },
  "2001": { label: "ATK", primary: true },
  "2002": { label: "DEF", primary: true },
};
const primaryOrder = ["2000", "2001", "2002", "28", "20", "22", "23", "30", "40", "41", "42", "43", "44", "45", "46", "26"];
const equipmentStatMap: Record<string, { label: string; percentage?: boolean }> = {
  FIGHT_PROP_HP: { label: "HP" },
  FIGHT_PROP_HP_PERCENT: { label: "HP%", percentage: true },
  FIGHT_PROP_ATTACK: { label: "ATK" },
  FIGHT_PROP_ATTACK_PERCENT: { label: "ATK%", percentage: true },
  FIGHT_PROP_DEFENSE: { label: "DEF" },
  FIGHT_PROP_DEFENSE_PERCENT: { label: "DEF%", percentage: true },
  FIGHT_PROP_CRITICAL: { label: "Crit Rate", percentage: true },
  FIGHT_PROP_CRITICAL_HURT: { label: "Crit DMG", percentage: true },
  FIGHT_PROP_CHARGE_EFFICIENCY: { label: "Energy Recharge", percentage: true },
  FIGHT_PROP_ELEMENT_MASTERY: { label: "Elemental Mastery" },
  FIGHT_PROP_HEAL_ADD: { label: "Healing Bonus", percentage: true },
  FIGHT_PROP_PHYSICAL_ADD_HURT: { label: "Physical DMG Bonus", percentage: true },
  FIGHT_PROP_FIRE_ADD_HURT: { label: "Pyro DMG Bonus", percentage: true },
  FIGHT_PROP_ELEC_ADD_HURT: { label: "Electro DMG Bonus", percentage: true },
  FIGHT_PROP_WATER_ADD_HURT: { label: "Hydro DMG Bonus", percentage: true },
  FIGHT_PROP_GRASS_ADD_HURT: { label: "Dendro DMG Bonus", percentage: true },
  FIGHT_PROP_WIND_ADD_HURT: { label: "Anemo DMG Bonus", percentage: true },
  FIGHT_PROP_ROCK_ADD_HURT: { label: "Geo DMG Bonus", percentage: true },
  FIGHT_PROP_ICE_ADD_HURT: { label: "Cryo DMG Bonus", percentage: true },
};
const slotMap: Record<string, string> = {
  EQUIP_BRACER: "Flower of Life",
  EQUIP_NECKLACE: "Plume of Death",
  EQUIP_SHOES: "Sands of Eon",
  EQUIP_RING: "Goblet of Eonothem",
  EQUIP_DRESS: "Circlet of Logos",
};

export async function getGenshinProfile(uid: string): Promise<GenshinProfile> {
  if (!/^\d{9}$/.test(uid)) throw new Error("Enter a valid nine-digit Genshin UID.");
  const response = await fetch(`${ENKA_API_URL}/uid/${uid}/`, {
    headers: { Accept: "application/json", "User-Agent": "Gaming-Tracker/0.1 (open-source personal project)" },
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error("No public Genshin showcase was found for that UID.");
    if (response.status === 429) throw new Error("Enka.Network is rate-limiting requests. Try again shortly.");
    if (response.status === 403) throw new Error("Enka.Network refused this request. Please try again later or use the Akasha profile link.");
    throw new Error(`Genshin profile request failed with status ${response.status}.`);
  }
  const payload = (await response.json()) as Record<string, unknown>;
  const player = asRecord(payload.playerInfo);
  const avatars = Array.isArray(payload.avatarInfoList) ? payload.avatarInfoList : [];
  const characters = avatars.map(toCharacter).filter(isPresent);
  const metadata = await getMetadata(characters);
  return {
    nickname: stringValue(player?.nickname),
    level: numberValue(player?.level),
    worldLevel: numberValue(player?.worldLevel),
    characters: characters.map((character) => normalizeCharacter(character, metadata)),
  };
}

function toCharacter(value: unknown): RawCharacter | null {
  const record = asRecord(value);
  const avatarId = numberValue(record?.avatarId);
  if (!avatarId) return null;
  const propMap = asRecord(record?.propMap);
  const levelProp = asRecord(propMap?.["4001"]);
  const level = numberLike(levelProp?.val) ?? numberLike(levelProp?.ival) ?? numberValue(record?.level);
  const talents = Array.isArray(record?.talentIdList) ? record.talentIdList : [];
  const fetterInfo = asRecord(record?.fetterInfo);
  const equipment = Array.isArray(record?.equipList) ? record.equipList.map(parseEquipment).filter(isPresent) : [];
  const { keyStats, detailedStats } = normalizeCharacterStats(asRecord(record?.fightPropMap) ?? {});
  return {
    avatarId,
    level,
    constellation: talents.length,
    friendship: numberValue(fetterInfo?.expLevel) ?? numberValue(record?.fetterLevel),
    keyStats,
    detailedStats,
    equipment,
  };
}

function parseEquipment(value: unknown): RawEquipment | null {
  const entry = asRecord(value);
  const itemId = numberValue(entry?.itemId);
  if (!itemId) return null;
  const weapon = asRecord(entry?.weapon);
  const artifact = asRecord(entry?.reliquary);
  const flat = asRecord(entry?.flat);
  const artifactLevel = numberValue(artifact?.level);
  const affixes = asRecord(weapon?.affixMap);
  const affix = affixes ? Object.values(affixes).map(numberValue).find((item) => item !== null) : null;
  return {
    itemId,
    kind: weapon ? "weapon" : artifact ? "artifact" : "other",
    nameHash: flat?.nameTextHashMap,
    setNameHash: flat?.setNameTextHashMap,
    iconUrl: stringValue(flat?.icon) ? `https://enka.network/ui/${stringValue(flat?.icon)}.png` : null,
    slot: slotMap[stringValue(flat?.equipType) ?? ""] ?? "Artifact",
    level: numberValue(weapon?.level) ?? (artifactLevel === null ? null : Math.max(0, artifactLevel - 1)),
    refinement: affix === null || affix === undefined ? numberValue(weapon?.refinement) : affix + 1,
    mainStat: normalizeEquipmentStat(asRecord(flat?.reliquaryMainstat), "mainPropId"),
    substats: Array.isArray(flat?.reliquarySubstats) ? flat.reliquarySubstats.map((stat) => normalizeEquipmentStat(asRecord(stat), "appendPropId")).filter(isPresent) : [],
    weaponStats: Array.isArray(flat?.weaponStats) ? flat.weaponStats.map((stat) => normalizeEquipmentStat(asRecord(stat), "appendPropId")).filter(isPresent) : [],
  };
}

function normalizeCharacterStats(raw: Record<string, unknown>) {
  const mapped = Object.entries(raw).map(([key, rawValue]) => {
    const definition = characterStatMap[key];
    const value = numberValue(rawValue);
    if (!definition || value === null || value === 0) return null;
    return { key, label: definition.label, value: definition.percentage ? `${(value * 100).toFixed(1)}%` : Math.round(value).toLocaleString("en-US"), primary: Boolean(definition.primary) };
  }).filter(isPresent);
  return {
    keyStats: mapped.filter((stat) => stat.primary).sort((a, b) => primaryOrder.indexOf(a.key) - primaryOrder.indexOf(b.key)).map((stat) => ({ key: stat.key, label: stat.label, value: stat.value })),
    detailedStats: mapped.filter((stat) => !stat.primary).map((stat) => ({ key: stat.key, label: stat.label, value: stat.value })),
  };
}

function normalizeEquipmentStat(stat: Record<string, unknown> | null, keyField: "mainPropId" | "appendPropId"): GenshinDisplayStat | null {
  if (!stat) return null;
  const key = stringValue(stat[keyField]) ?? (keyField === "appendPropId" ? stringValue(stat.appendPropID) : null);
  const rawValue = numberValue(stat.statValue) ?? numberValue(stat.propValue);
  const definition = key ? equipmentStatMap[key] : undefined;
  if (!key || rawValue === null || !definition) return null;
  const value = Number.isInteger(rawValue) ? rawValue.toLocaleString("en-US") : rawValue.toFixed(1);
  return { key, label: definition.label, value: definition.percentage ? `${value}%` : value };
}

type Metadata = {
  characters: Map<number, { name: string | null; iconUrl: string | null }>;
  equipment: Map<number, { name: string | null; setName: string | null }>;
};

async function getMetadata(characters: RawCharacter[]): Promise<Metadata> {
  const result: Metadata = { characters: new Map(), equipment: new Map() };

  try {
    const localizationResponse = await fetch(`${ENKA_STORE_URL}/loc.json`, {
      next: { revalidate: 86_400 },
    });
    if (localizationResponse.ok) {
      const localization =
        (await localizationResponse.json()) as Record<string, unknown>;
      for (const character of characters) {
        for (const item of character.equipment) {
          result.equipment.set(item.itemId, {
            name: resolveLocalization(localization, item.nameHash),
            setName: resolveLocalization(localization, item.setNameHash),
          });
        }
      }

      let charactersResponse = await fetch(
        `${ENKA_STORE_URL}/characters.json`,
        { next: { revalidate: 86_400 } },
      );
      if (!charactersResponse.ok) {
        charactersResponse = await fetch(
          `${ENKA_STORE_URL}/gi/characters.json`,
          { next: { revalidate: 86_400 } },
        );
      }
      if (charactersResponse.ok) {
        const store =
          (await charactersResponse.json()) as Record<string, unknown>;
        for (const character of characters) {
          const entry = asRecord(store[String(character.avatarId)]);
          const icon = findIcon(entry);
          result.characters.set(character.avatarId, {
            name: resolveLocalization(localization, entry?.NameTextMapHash),
            iconUrl: icon ? `https://enka.network/ui/${icon}.png` : null,
          });
        }
      }
    }
  } catch {
    // Metadata fallback is handled below.
  }

  applyRecentCharacterFallbacks(characters, result.characters);
  return result;
}

function normalizeCharacter(character: RawCharacter, metadata: Metadata): GenshinCharacterBuild {
  const characterMetadata = metadata.characters.get(character.avatarId);
  const weapon = character.equipment.find((item) => item.kind === "weapon");
  return {
    avatarId: character.avatarId,
    name: characterMetadata?.name ?? null,
    iconUrl: characterMetadata?.iconUrl ?? null,
    level: character.level,
    constellation: character.constellation,
    friendship: character.friendship,
    keyStats: character.keyStats,
    detailedStats: character.detailedStats,
    artifacts: character.equipment.filter((item) => item.kind === "artifact").map((item) => ({
      itemId: item.itemId,
      name: metadata.equipment.get(item.itemId)?.name ?? null,
      setName: metadata.equipment.get(item.itemId)?.setName ?? null,
      iconUrl: item.iconUrl,
      slot: item.slot,
      level: item.level,
      mainStat: item.mainStat,
      substats: item.substats,
    })),
    weapon: weapon ? {
      itemId: weapon.itemId,
      name: metadata.equipment.get(weapon.itemId)?.name ?? null,
      iconUrl: weapon.iconUrl,
      level: weapon.level,
      refinement: weapon.refinement,
      stats: weapon.weaponStats,
    } : null,
  };
}

function resolveLocalization(localization: Record<string, unknown>, hash: unknown) {
  if (hash === undefined || hash === null) return null;
  const key = String(hash);
  const direct = localization[key];
  if (typeof direct === "string") return direct;
  const english = asRecord(localization.en)?.[key];
  return typeof english === "string" ? english : null;
}

function applyRecentCharacterFallbacks(characters: RawCharacter[], result: Metadata["characters"]) {
  const known: Record<number, { name: string; iconUrl: string }> = {
    10000125: { name: "Columbina", iconUrl: "https://enka.network/ui/UI_AvatarIcon_Columbina_Card.png" },
    10000126: { name: "Zibai", iconUrl: "https://enka.network/ui/UI_AvatarIcon_Zibai_Card.png" },
    10000130: { name: "Linnea", iconUrl: "https://enka.network/ui/UI_AvatarIcon_Linnea_Card.png" },
    10000133: { name: "Sandrone", iconUrl: "https://enka.network/ui/UI_AvatarIcon_MarionetteNew_Card.png" },
  };
  for (const character of characters) {
    const fallback = known[character.avatarId];
    if (!fallback) continue;
    const current = result.get(character.avatarId);
    result.set(character.avatarId, { name: current?.name ?? fallback.name, iconUrl: current?.iconUrl ?? fallback.iconUrl });
  }
}

function findIcon(value: Record<string, unknown> | null): string | null {
  if (!value) return null;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && key.toLowerCase().includes("icon") && entry.startsWith("UI_")) return entry;
    const nested = asRecord(entry);
    if (nested) { const found = findIcon(nested); if (found) return found; }
  }
  return null;
}
function asRecord(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function numberValue(value: unknown): number | null { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function numberLike(value: unknown): number | null { if (typeof value === "number") return value; if (typeof value === "string" && value.trim()) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; } return null; }
function stringValue(value: unknown): string | null { return typeof value === "string" ? value : null; }
function isPresent<T>(value: T | null | undefined): value is T { return value !== null && value !== undefined; }
