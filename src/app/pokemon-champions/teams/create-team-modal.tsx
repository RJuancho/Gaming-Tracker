"use client";

import { useEffect, useRef, useState } from "react";

import { createSnorlaxTeam } from "./actions";
import { TeamActionForm } from "./team-action-form";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/50";

export function CreateTeamModal({ initialPokemon }: { initialPokemon?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    nameInputRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        Create team
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-team-title"
            className="my-8 w-full max-w-md rounded-2xl border border-violet-300/20 bg-slate-900 p-6 shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200">
                  New team
                </p>
                <h2
                  id="create-team-title"
                  className="mt-2 text-2xl font-semibold text-white"
                >
                  {initialPokemon ? `Create a ${initialPokemon} team` : "Create a blank team"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close create team dialog"
                onClick={() => setIsOpen(false)}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-xl text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                ×
              </button>
            </div>

            <TeamActionForm
              action={createSnorlaxTeam}
              className="mt-6 space-y-5"
              onSuccess={() => setIsOpen(false)}
            >
              {initialPokemon ? <input type="hidden" name="pokemonId" value={initialPokemon} /> : null}
              <label className="block text-sm text-slate-300">
                Team name
                <input
                  ref={nameInputRef}
                  name="name"
                  required
                  maxLength={80}
                  defaultValue={initialPokemon ? `${initialPokemon} Team` : "My Pokémon Team"}
                  className={fieldClassName}
                />
              </label>

              <label className="block text-sm text-slate-300">
                Battle format
                <select
                  name="format"
                  defaultValue="Doubles"
                  className={fieldClassName}
                >
                  <option>Doubles</option>
                  <option>Singles</option>
                </select>
              </label>

              {initialPokemon ? <label className="block text-sm text-slate-300">
                Starting role
                <select
                  name="playstyle"
                  defaultValue="balanced"
                  className={fieldClassName}
                >
                  <option value="bulky">Bulky support</option>
                  <option value="balanced">Flexible anchor</option>
                  <option value="carry">Setup carry</option>
                </select>
              </label> : null}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-200"
                >
                  {initialPokemon ? `Create team with ${initialPokemon}` : "Create blank team"}
                </button>
              </div>
            </TeamActionForm>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Writes are limited to local development until this personal
              application has authentication.
            </p>
          </section>
        </div>
      ) : null}
    </>
  );
}
