"use server";

import { redirect } from "next/navigation";

import {
  addWatchedFruit,
  removeWatchedFruit,
} from "@/services/blox-fruits-watchlist";

export async function addFruitToWatchlist(formData: FormData) {
  assertLocalEditing();

  try {
    await addWatchedFruit(formData.get("fruitName"));
  } catch {
    redirect("/blox-fruits?error=Enter%20a%20valid%20fruit%20name.");
  }

  redirect("/blox-fruits?saved=added");
}

export async function removeFruitFromWatchlist(formData: FormData) {
  assertLocalEditing();
  await removeWatchedFruit(formData.get("id"));
  redirect("/blox-fruits?saved=removed");
}

function assertLocalEditing() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Watchlist editing requires authentication before deployment.");
  }
}

