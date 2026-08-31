import "server-only";

const ENKA_API_URL = "https://enka.network/api";

export type GenshinCharacterBuild = {
  avatarId: number;
  name: string | null;
  iconUrl: string | null;
  level: number | null;
  constellation: number | null;
  friendship: number | null;
  stats: Record<string, number>;
  equipment: Array<{ itemId: number; type: string; level: number | null; refinement: number | null }>;
};

export type GenshinProfile = {
  nickname: string | null;
  level: number | null;
  worldLevel: number | null;
  characters: GenshinCharacterBuild[];
};

export async function getGenshinProfile(uid: string): Promise<GenshinProfile> {
  if (!/^\d{9}$/.test(uid)) throw new Error("Enter a valid nine-digit Genshin UID.");
  const response = await fetch(`${ENKA_API_URL}/uid/${uid}/`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Gaming-Tracker/0.1 (open-source personal project)",
    },
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
  const characters = avatars.map(toCharacter).filter((character): character is GenshinCharacterBuild => character !== null);
  const metadata = await getCharacterMetadata(characters.map((character) => character.avatarId));
  return { nickname: stringValue(player?.nickname), level: numberValue(player?.level), worldLevel: numberValue(player?.worldLevel), characters: characters.map((character) => ({ ...character, ...metadata.get(character.avatarId) })) };
}

function toCharacter(value: unknown): GenshinCharacterBuild | null {
  const record = asRecord(value);
  const avatarId = numberValue(record?.avatarId);
  if (!avatarId) return null;
  const equipment = Array.isArray(record?.equipList) ? record.equipList.map((item) => { const entry = asRecord(item); const itemId = numberValue(entry?.itemId); if (!itemId) return null; const weapon = asRecord(entry?.weapon); const reliquary = asRecord(entry?.reliquary); return { itemId, type: weapon ? "Weapon" : reliquary ? "Artifact" : "Equipment", level: numberValue(weapon?.level) ?? numberValue(reliquary?.level), refinement: numberValue(weapon?.refinement) }; }).filter((item): item is GenshinCharacterBuild["equipment"][number] => item !== null) : [];
  const fightPropMap = asRecord(record?.fightPropMap) ?? {};
  const stats = Object.fromEntries(Object.entries(fightPropMap).filter(([, value]) => typeof value === "number").map(([key, value]) => [key, value as number])) as Record<string, number>;
  return { avatarId, name: null, iconUrl: null, level: numberValue(record?.level), constellation: numberValue(record?.talentId), friendship: numberValue(record?.fetterLevel), stats, equipment };
}

async function getCharacterMetadata(ids: number[]) {
  const result = new Map<number, { name: string | null; iconUrl: string | null }>();
  try {
    const [charactersResponse, localizationResponse] = await Promise.all([
      fetch("https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json", { next: { revalidate: 86_400 } }),
      fetch("https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/loc.json", { next: { revalidate: 86_400 } }),
    ]);
    if (!charactersResponse.ok || !localizationResponse.ok) return result;
    const characters = (await charactersResponse.json()) as Record<string, unknown>;
    const localization = (await localizationResponse.json()) as Record<string, unknown>;
    for (const id of ids) {
      const entry = asRecord(characters[String(id)]);
      const hash = entry?.NameTextMapHash;
      const localized = hash === undefined ? null : localization[String(hash)];
      const name = typeof localized === "string" ? localized : asRecord(localized)?.en;
      const icon = findIcon(entry);
      result.set(id, { name: typeof name === "string" ? name : null, iconUrl: icon ? `https://enka.network/ui/${icon}.png` : null });
    }
  } catch {
    // Character metadata is an enhancement; profile builds remain usable if it is unavailable.
  }
  return result;
}

function findIcon(value: Record<string, unknown> | null): string | null {
  if (!value) return null;
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === "string" && key.toLowerCase().includes("icon") && entry.startsWith("UI_")) return entry;
    if (entry && typeof entry === "object" && !Array.isArray(entry)) { const found = findIcon(entry as Record<string, unknown>); if (found) return found; }
  }
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function numberValue(value: unknown): number | null { return typeof value === "number" ? value : null; }
function stringValue(value: unknown): string | null { return typeof value === "string" ? value : null; }
