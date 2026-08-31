"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const EVENT_NAME = "pokemon-team-member-open";

export function PokemonSlotButton({ memberId, children }: { memberId: number; children: ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: memberId }))} className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
      {children}
    </button>
  );
}

export function PokemonDetailPanel({ memberId, name, children }: { memberId: number; name: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function handleOpen(event: Event) {
      if ((event as CustomEvent<number>).detail !== memberId) return;
      setOpen(true);
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
    }
    window.addEventListener(EVENT_NAME, handleOpen);
    return () => window.removeEventListener(EVENT_NAME, handleOpen);
  }, [memberId]);

  return (
    <details ref={panelRef} open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="rounded-xl border border-white/[0.07] bg-slate-950/45">
      <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-3 text-sm font-medium text-slate-200 hover:text-white">
        <span>{name} current details</span><span className="text-xs text-slate-500">Open ▾</span>
      </summary>
      {children}
    </details>
  );
}
