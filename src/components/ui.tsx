"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Copy, Loader2, Printer } from "lucide-react";

export function SubmitButton({
  children,
  className = "btn-primary",
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

/** Tasdiqlash oynasi bilan server action chaqiruvchi tugma */
export function ConfirmButton({
  action,
  confirm,
  children,
  className = "btn-ghost",
  title,
}: {
  action: () => Promise<unknown>;
  confirm: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      className={className}
      onClick={() => {
        if (window.confirm(confirm)) start(async () => void (await action()));
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={label ? "btn-secondary" : "btn-ghost !p-1.5"}
      title="Nusxa olish"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {label}
    </button>
  );
}

export function Alert({ state }: { state?: { error?: string; ok?: string } }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <div
      className={`rounded-xl px-4 py-3 text-sm font-medium ${
        state.error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {state.error ?? state.ok}
    </div>
  );
}

export function PrintButton({ label = "Chop etish" }: { label?: string }) {
  return (
    <button type="button" className="btn-secondary" onClick={() => window.print()}>
      <Printer className="size-4" /> {label}
    </button>
  );
}
