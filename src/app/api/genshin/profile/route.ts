import { NextResponse } from "next/server";
import { getGenshinProfile } from "@/integrations/genshin/enka";

export async function GET(request: Request) {
  const uid = new URL(request.url).searchParams.get("uid") ?? "";
  try { return NextResponse.json(await getGenshinProfile(uid)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Genshin profile lookup failed." }, { status: 400 }); }
}
