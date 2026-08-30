import Image from "next/image";
import Link from "next/link";

import {
  addFruitToWatchlist,
  removeFruitFromWatchlist,
} from "@/app/blox-fruits/actions";
import { isDiscordWebhookConfigured } from "@/integrations/discord/webhook";
import {
  getNextNormalStockRotation,
  getNormalStock,
  STOCK_SOURCE_PAGE,
  type NormalStock,
  type NormalStockItem,
} from "@/integrations/blox-fruits/normal-stock";
import { listWatchedFruits } from "@/services/blox-fruits-watchlist";

export const dynamic = "force-dynamic";

export default async function BloxFruitsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const [watchlist, query, stockResult] = await Promise.all([
    listWatchedFruits(),
    searchParams,
    getNormalStock()
      .then((stock) => ({ stock, error: null }))
      .catch((error: unknown) => ({
        stock: null,
        error: error instanceof Error ? error.message : "Stock lookup failed.",
      })),
  ]);
  const discordConfigured = isDiscordWebhookConfigured();
  const watchedNames = new Set(
    watchlist.map((entry) => entry.fruitName.toLowerCase()),
  );
  const matchedFruits =
    stockResult.stock?.items.filter((item) =>
      watchedNames.has(item.name.toLowerCase()),
    ) ?? [];
  const nextRotation = getNextNormalStockRotation();

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-5xl px-6 py-10 sm:px-10">
        <Link href="/" className="text-sm text-slate-400 hover:text-white">
          ← Gaming Tracker
        </Link>

        <header className="mt-12 border-b border-white/10 pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-orange-300">
            Notification service
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
            Blox Fruits stock watch
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-400">
            Watch selected fruits in the normal dealer&apos;s four-hour rotation.
            Community data is freshness-checked before it can be treated as
            alert-worthy stock.
          </p>
        </header>

        {query.error ? (
          <p className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
            {query.error}
          </p>
        ) : null}
        {query.saved ? (
          <p className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            Watchlist updated.
          </p>
        ) : null}

        <section className="grid gap-4 py-8 sm:grid-cols-3">
          <StatusCard label="Watched fruits" value={watchlist.length} />
          <StatusCard label="Dealer" value="Normal · 4 hours" />
          <StatusCard
            label="Discord"
            value={discordConfigured ? "Configured" : "Needs webhook"}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-orange-300">
                Alert watchlist
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Selected fruits
              </h2>
            </div>
            <form action={addFruitToWatchlist} className="flex gap-2">
              <input
                name="fruitName"
                placeholder="Add a fruit"
                required
                maxLength={40}
                className="min-w-0 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-orange-300/40"
              />
              <button className="rounded-xl border border-orange-300/25 bg-orange-300/10 px-4 py-2.5 text-sm font-medium text-orange-100 hover:bg-orange-300/15">
                Add
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {watchlist.map((entry) => (
              <form key={entry.id} action={removeFruitFromWatchlist}>
                <input type="hidden" name="id" value={entry.id} />
                <button
                  className="group flex items-center gap-2 rounded-xl border border-orange-300/20 bg-orange-300/[0.08] px-3 py-2 text-sm text-orange-100 hover:border-rose-300/30 hover:bg-rose-300/10 hover:text-rose-100"
                  title={`Remove ${entry.fruitName}`}
                >
                  {entry.fruitName}
                  <span className="text-orange-300/50 group-hover:text-rose-200">×</span>
                </button>
              </form>
            ))}
            {watchlist.length === 0 ? (
              <p className="text-sm text-slate-500">No fruits are being watched.</p>
            ) : null}
          </div>
        </section>

        <StockPanel
          stock={stockResult.stock}
          error={stockResult.error}
          matchedFruits={matchedFruits}
          nextRotation={nextRotation}
        />
      </div>
    </main>
  );
}

function StockPanel({
  stock,
  error,
  matchedFruits,
  nextRotation,
}: {
  stock: NormalStock | null;
  error: string | null;
  matchedFruits: NormalStockItem[];
  nextRotation: Date;
}) {
  if (!stock) {
    return (
      <section className="mt-6 rounded-2xl border border-rose-300/20 bg-rose-300/[0.06] p-5 text-sm leading-6 text-slate-400">
        <p className="font-medium text-rose-100">Stock provider unavailable</p>
        <p className="mt-2">
          {error ?? "The community feed could not be read."} No stock alert
          will be sent from unavailable data.
        </p>
      </section>
    );
  }

  const isCurrent = stock.freshness === "current";
  const matchedNames = new Set(
    matchedFruits.map((fruit) => fruit.name.toLowerCase()),
  );

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
      <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-orange-300">
              Last known normal stock
            </p>
            <span
              className={`rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                isCurrent
                  ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
                  : "border-amber-300/25 bg-amber-300/10 text-amber-200"
              }`}
            >
              {isCurrent ? "Current" : "Outdated"}
            </span>
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Dealer inventory
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Observed {formatPhilippineTime(stock.observedAt)} · Next scheduled
            rotation {formatPhilippineTime(nextRotation)}
          </p>
        </div>
        <a
          href={STOCK_SOURCE_PAGE}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-orange-200 hover:text-white"
        >
          View community source ↗
        </a>
      </div>

      {!isCurrent ? (
        <div className="border-b border-amber-300/15 bg-amber-300/[0.06] px-5 py-3 text-sm leading-6 text-amber-100/85 sm:px-6">
          The provider labels this snapshot as {stock.providerStatus}. It is
          shown for transparency only and is blocked from notifications.
        </div>
      ) : matchedFruits.length > 0 ? (
        <div className="border-b border-emerald-300/15 bg-emerald-300/[0.06] px-5 py-3 text-sm text-emerald-100 sm:px-6">
          Watchlist match: {matchedFruits.map((fruit) => fruit.name).join(", ")}
        </div>
      ) : (
        <div className="border-b border-white/10 px-5 py-3 text-sm text-slate-400 sm:px-6">
          None of your watched fruits are in this rotation.
        </div>
      )}

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        {stock.items.map((fruit) => (
          <article
            key={fruit.slug}
            className={`flex items-center gap-4 rounded-2xl border p-4 ${
              matchedNames.has(fruit.name.toLowerCase())
                ? "border-orange-300/30 bg-orange-300/[0.08]"
                : "border-white/10 bg-slate-950/60"
            }`}
          >
            <div className="grid size-16 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] p-1.5">
              <Image
                src={fruit.image}
                alt={`${fruit.name} fruit`}
                width={56}
                height={56}
                unoptimized
                className="size-14 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-white">{fruit.name}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {fruit.rarity} · {fruit.type}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-300">
                {formatBeli(fruit.price)} Beli
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-4 text-xs leading-5 text-slate-500 sm:px-6">
        Community source: {stock.sourceLabel}. This is not an official Roblox or
        Blox Fruits API. In-game dealer data remains authoritative.
      </div>
    </section>
  );
}

function formatBeli(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPhilippineTime(date: Date) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

function StatusCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

