import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { logout } from "../actions";
import AdminNav from "./nav";
import ViolationWatcher from "./violation-watcher";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const { settings } = readDb();
  return (
    <div className="min-h-screen lg:flex">
      <aside className="no-print border-b border-slate-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center gap-3 px-5 py-4 lg:py-6">
          <div className="grid size-9 place-items-center rounded-lg bg-indigo-600 font-mono text-sm font-bold text-white">{"{ }"}</div>
          <div className="min-w-0">
            <p className="font-semibold leading-tight">Admin panel</p>
            <p className="truncate text-xs text-slate-500">{settings.title}</p>
          </div>
        </div>
        <AdminNav isOpen={settings.isOpen} />
        <form action={logout} className="px-3 pb-3 lg:p-3">
          <button className="btn-ghost w-full justify-start"><LogOut className="size-4" /> Chiqish</button>
        </form>
      </aside>
      <main className="flex-1 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</div>
      </main>
      <ViolationWatcher />
    </div>
  );
}
