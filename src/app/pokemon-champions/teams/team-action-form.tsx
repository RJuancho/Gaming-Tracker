"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { TOAST_EVENT, type ToastDetail } from "@/app/toast-provider";

import type { TeamActionState } from "./actions";

const initialState: TeamActionState = {
  status: "idle",
  action: "edit",
  message: "",
  id: 0,
};

type TeamAction = (
  state: TeamActionState,
  formData: FormData,
) => Promise<TeamActionState>;

export function TeamActionForm({
  action,
  children,
  className,
  onSuccess,
}: {
  action: TeamAction;
  children: ReactNode;
  className?: string;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const onSuccessRef = useRef(onSuccess);
  const [state, formAction, isPending] = useActionState(action, initialState);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.status !== "success" && state.status !== "error") return;

    window.dispatchEvent(
      new CustomEvent<ToastDetail>(TOAST_EVENT, {
        detail: {
          id: state.id,
          status: state.status,
          action: state.action,
          message: state.message,
        },
      }),
    );

    if (state.status === "success") {
      onSuccessRef.current?.();
      router.refresh();
    }
  }, [router, state]);

  return (
    <form action={formAction} className={className} aria-busy={isPending}>
      {children}
    </form>
  );
}
