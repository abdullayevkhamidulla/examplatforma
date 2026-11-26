import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import LoginForm from "./login-form";

export default async function Home() {
  const s = await getSession();
  if (s?.role === "admin") redirect("/admin");
  if (s?.role === "student") redirect("/exam");
  const { topics, settings } = readDb();

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-white/15 font-mono text-lg font-bold backdrop-blur">
            {"{ }"}
          </div>
          <span className="text-lg font-semibold">CSS Imtihon</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl font-bold leading-tight">{settings.title}</h1>
          <p className="mt-3 max-w-md text-white/80">
            Bilimingizni sinab ko'ring. Har bir savolga javobni o'zingiz yozasiz.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {topics.map((t) => (
              <span key={t} className="rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="relative text-sm text-white/60">© {new Date().getFullYear()} CSS kursi</p>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 grid size-12 place-items-center rounded-xl bg-indigo-600 font-mono text-lg font-bold text-white">
              {"{ }"}
            </div>
            <p className="text-sm font-medium text-indigo-600">{settings.title}</p>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Tizimga kirish</h2>
          <p className="mt-1 text-sm text-slate-500">Ustoz bergan login va parolni kiriting</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
