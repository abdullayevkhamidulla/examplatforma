"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, FileQuestion, LayoutDashboard, Settings, Trophy, Users } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Bosh sahifa", icon: LayoutDashboard },
  { href: "/admin/results", label: "Natijalar", icon: BarChart3 },
  { href: "/admin/rating", label: "Reyting", icon: Trophy },
  { href: "/admin/questions", label: "Savollar", icon: FileQuestion },
  { href: "/admin/students", label: "O'quvchilar", icon: Users },
  { href: "/admin/settings", label: "Sozlamalar", icon: Settings },
];

export default function AdminNav({ isOpen }: { isOpen: boolean }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:pb-0">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
      <div className="mt-auto hidden px-3 py-4 lg:block">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${isOpen ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
          <span className={`size-2 rounded-full ${isOpen ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
          Imtihon {isOpen ? "ochiq" : "yopiq"}
        </div>
      </div>
    </nav>
  );
}
