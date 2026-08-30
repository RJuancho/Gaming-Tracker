import { NextResponse } from "next/server";

import { syncCurrentTftMeta } from "@/services/tft-meta";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Meta sync requires an authenticated job in production." },
      { status: 403 },
    );
  }

  try {
    const result = await syncCurrentTftMeta();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "TFT meta sync failed." },
      { status: 502 },
    );
  }
}

