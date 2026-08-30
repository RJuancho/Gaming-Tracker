"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SyncState =
  | { status: "idle" }
  | { status: "syncing" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function SyncTftMetaButton({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<SyncState>({ status: "idle" });

  async function syncMeta() {
    setState({ status: "syncing" });

    try {
      const response = await fetch("/api/tft/meta/sync", { method: "POST" });
      const payload: unknown = await response.json();

      if (!response.ok) {
        throw new Error(readError(payload));
      }

      const result = readSyncResult(payload);
      setState({
        status: "success",
        message: result
          ? `Snapshot #${result.snapshotId} saved for ${result.sampleDate} (${result.sampledMatches} matches).`
          : "Meta snapshot saved.",
      });
      router.refresh();
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Meta sync failed.",
      });
    }
  }

  const isSyncing = state.status === "syncing";

  return (
    <div className="flex min-w-48 flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={syncMeta}
        disabled={!enabled || isSyncing}
        className="inline-flex min-w-32 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-500"
      >
        {isSyncing ? "Syncing…" : "Sync daily meta"}
      </button>
      <p
        aria-live="polite"
        className={`text-xs ${
          state.status === "error"
            ? "text-rose-300"
            : state.status === "success"
              ? "text-emerald-300"
              : "text-slate-500"
        }`}
      >
        {!enabled
            ? "Authentication required in production."
          : state.status === "idle" || state.status === "syncing"
            ? "Refreshes and saves the last completed PHT day."
            : state.message}
      </p>
    </div>
  );
}

function readError(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Meta sync failed.";
}

function readSyncResult(payload: unknown) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "snapshotId" in payload &&
    typeof payload.snapshotId === "number" &&
    "sampleDate" in payload &&
    typeof payload.sampleDate === "string" &&
    "sampledMatches" in payload &&
    typeof payload.sampledMatches === "number"
  ) {
    return {
      snapshotId: payload.snapshotId,
      sampleDate: payload.sampleDate,
      sampledMatches: payload.sampledMatches,
    };
  }
  return null;
}

