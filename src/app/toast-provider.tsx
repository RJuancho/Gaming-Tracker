"use client";

import { useEffect, useState } from "react";

export const TOAST_EVENT = "gaming-tracker:toast";

export type ToastDetail = {
  id: number;
  status: "success" | "error";
  action: "create" | "edit" | "replace" | "delete";
  message: string;
};

const successStyles: Record<ToastDetail["action"], string> = {
  create: "border-emerald-300/25 bg-emerald-950/95 text-emerald-100",
  edit: "border-cyan-300/25 bg-cyan-950/95 text-cyan-100",
  replace: "border-violet-300/25 bg-violet-950/95 text-violet-100",
  delete: "border-rose-300/25 bg-rose-950/95 text-rose-100",
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastDetail[]>([]);

  useEffect(() => {
    const timeouts = new Set<ReturnType<typeof setTimeout>>();

    function removeToast(id: number) {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }

    function showToast(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;

      setToasts((current) => [...current.filter((toast) => toast.id !== detail.id), detail]);
      const timeout = setTimeout(() => {
        removeToast(detail.id);
        timeouts.delete(timeout);
      }, 4_500);
      timeouts.add(timeout);
    }

    window.addEventListener(TOAST_EVENT, showToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, showToast);
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-end gap-2 sm:left-auto sm:w-full sm:max-w-sm"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.status === "error" ? "alert" : "status"}
          className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl shadow-black/40 backdrop-blur ${
            toast.status === "error"
              ? "border-rose-300/25 bg-rose-950/95 text-rose-100"
              : successStyles[toast.action]
          }`}
        >
          <span aria-hidden="true" className="mt-0.5 font-bold">
            {toast.status === "error" ? "!" : "✓"}
          </span>
          <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() =>
              setToasts((current) =>
                current.filter((candidate) => candidate.id !== toast.id),
              )
            }
            className="-mr-1 grid size-6 shrink-0 place-items-center rounded-md text-lg opacity-60 transition hover:bg-white/10 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
