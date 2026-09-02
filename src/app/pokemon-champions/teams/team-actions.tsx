"use client";

import { useEffect, useRef, useState } from "react";

import { deleteTeam, editTeam } from "./actions";
import { TeamActionForm } from "./team-action-form";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/50";

type OpenDialog = "edit" | "delete" | null;

export function TeamActions({
  teamId,
  name,
  format,
  notes,
  memberCount,
}: {
  teamId: number;
  name: string;
  format: string;
  notes: string;
  memberCount: number;
}) {
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!openDialog) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const trigger = lastTriggerRef.current;
    document.body.style.overflow = "hidden";

    if (openDialog === "edit") {
      nameInputRef.current?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenDialog(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [openDialog]);

  function open(dialog: Exclude<OpenDialog, null>, trigger: HTMLButtonElement) {
    lastTriggerRef.current = trigger;
    setOpenDialog(dialog);
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => open("edit", event.currentTarget)}
          className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:border-violet-300/25 hover:text-violet-200"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={(event) => open("delete", event.currentTarget)}
          className="rounded-lg border border-rose-300/15 px-2.5 py-1 text-xs text-rose-300/70 transition hover:border-rose-300/30 hover:bg-rose-300/[0.06] hover:text-rose-200"
        >
          Delete
        </button>
      </div>

      {openDialog ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setOpenDialog(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${openDialog}-team-title-${teamId}`}
            className="my-8 w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                    openDialog === "delete"
                      ? "text-rose-300"
                      : "text-violet-200"
                  }`}
                >
                  {openDialog === "delete" ? "Permanent action" : "Team details"}
                </p>
                <h2
                  id={`${openDialog}-team-title-${teamId}`}
                  className="mt-2 text-2xl font-semibold text-white"
                >
                  {openDialog === "delete" ? "Delete this team?" : "Edit team"}
                </h2>
              </div>
              <button
                type="button"
                aria-label={`Close ${openDialog} team dialog`}
                onClick={() => setOpenDialog(null)}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-xl text-slate-400 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
              >
                ×
              </button>
            </div>

            {openDialog === "edit" ? (
              <TeamActionForm
                action={editTeam}
                className="mt-6 space-y-5"
                onSuccess={() => setOpenDialog(null)}
              >
                <input type="hidden" name="teamId" value={teamId} />
                <label className="block text-sm text-slate-300">
                  Team name
                  <input
                    ref={nameInputRef}
                    name="name"
                    required
                    maxLength={80}
                    defaultValue={name}
                    className={fieldClassName}
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Battle format
                  <select
                    name="format"
                    defaultValue={format}
                    className={fieldClassName}
                  >
                    <option>Doubles</option>
                    <option>Singles</option>
                  </select>
                </label>

                <label className="block text-sm text-slate-300">
                  Notes
                  <textarea
                    name="notes"
                    maxLength={500}
                    rows={3}
                    defaultValue={notes}
                    className={`${fieldClassName} resize-y`}
                  />
                </label>

                <p className="rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2.5 text-xs leading-5 text-amber-100/70">
                  Changing the battle format preserves the roster but clears
                  saved member builds so they can be rebuilt from the correct
                  format data.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenDialog(null)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-violet-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-violet-200"
                  >
                    Save changes
                  </button>
                </div>
              </TeamActionForm>
            ) : (
              <TeamActionForm
                action={deleteTeam}
                className="mt-6"
                onSuccess={() => setOpenDialog(null)}
              >
                <input type="hidden" name="teamId" value={teamId} />
                <p className="text-sm leading-6 text-slate-300">
                  <span className="font-semibold text-white">{name}</span> and
                  its {memberCount} {memberCount === 1 ? "member" : "members"}
                  {" "}will be permanently deleted.
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This cannot be undone.
                </p>
                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setOpenDialog(null)}
                    className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-rose-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-rose-300"
                  >
                    Delete team
                  </button>
                </div>
              </TeamActionForm>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
