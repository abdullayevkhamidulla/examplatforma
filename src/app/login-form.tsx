"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { login } from "./actions";
import { Alert, SubmitButton } from "@/components/ui";

export default function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="mt-8 space-y-4">
      <div>
        <label className="label" htmlFor="login">Login</label>
        <input id="login" name="login" className="input" placeholder="masalan: akramov" autoComplete="username" autoCapitalize="none" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Parol</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            className="input pr-11"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 hover:text-slate-600"
            aria-label="Parolni ko'rsatish"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Alert state={state} />
      <SubmitButton className="btn-primary w-full py-3">
        <LogIn className="size-4" /> Kirish
      </SubmitButton>
    </form>
  );
}
