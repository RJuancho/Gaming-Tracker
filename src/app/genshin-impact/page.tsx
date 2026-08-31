import Link from "next/link";

import { GenshinWishTracker } from "./wish-tracker";
import { GenshinProfileViewer } from "./profile-viewer";

export default function GenshinImpactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← Gaming Tracker</Link>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-200">Personal dashboard</span>
        </div>
        <header className="mt-12 max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-300">Genshin Impact</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-white sm:text-5xl">Track wishes. Tune builds.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-400">Keep a lightweight wish ledger locally and jump to Akasha for character builds, percentile rankings, and leaderboard context.</p>
        </header>
        <div className="mt-10"><GenshinWishTracker /></div>
        <GenshinProfileViewer />
        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <a href="https://akasha.cv/" target="_blank" rel="noreferrer" className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-6 transition hover:border-amber-300/40"><p className="font-mono text-xs uppercase tracking-[0.18em] text-amber-300">Akasha</p><h2 className="mt-2 text-xl font-semibold text-white">Character builds and rankings</h2><p className="mt-2 text-sm leading-6 text-slate-400">Use your UID above to open your profile, then inspect individual character builds and leaderboard placement on Akasha.</p></a>
          <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-6"><p className="font-mono text-xs uppercase tracking-[0.18em] text-slate-500">Data ownership</p><h2 className="mt-2 text-xl font-semibold text-white">Bring your own account data</h2><p className="mt-2 text-sm leading-6 text-slate-400">Wish totals are stored only in this browser. This tracker does not request your HoYoverse password or claim affiliation with HoYoverse.</p></article>
        </section>
      </div>
    </main>
  );
}
