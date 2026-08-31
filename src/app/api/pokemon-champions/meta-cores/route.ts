import { NextResponse } from "next/server";
import { z } from "zod";

import { getPopularChampionsCores } from "@/integrations/pokemon/champions/provider";

const formatSchema = z.enum(["Doubles", "Singles"]).catch("Doubles");

export async function GET(request: Request) {
  const format = formatSchema.parse(new URL(request.url).searchParams.get("format"));
  try {
    const pokemon = new URL(request.url).searchParams.get("pokemon") ?? undefined;
    const cores = await getPopularChampionsCores(format, pokemon);
    return NextResponse.json({ format, cores }, { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "Current meta core data is temporarily unavailable." }, { status: 502 });
  }
}
