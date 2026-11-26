import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readDb } from "@/lib/db";
import { PrintButton } from "@/components/ui";

export default function PrintCards() {
  const db = readDb();
  const students = [...db.students].sort((a, b) => a.lastName.localeCompare(b.lastName));
  return (
    <>
      <div className="no-print flex items-center justify-between">
        <Link href="/admin/students" className="btn-ghost -ml-2.5"><ArrowLeft className="size-4" /> O'quvchilar</Link>
        <PrintButton />
      </div>
      <p className="no-print mt-2 text-sm text-slate-500">Chop eting va qaychi bilan kesib, har bir o'quvchiga tarqating.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 print:mt-0 print:gap-2 lg:grid-cols-3">
        {students.map((s) => (
          <div key={s.id} className="break-inside-avoid rounded-xl border-2 border-dashed border-slate-300 bg-white p-4">
            <p className="text-xs font-medium text-indigo-600">{db.settings.title}</p>
            <p className="mt-1 font-semibold">{s.lastName} {s.firstName}</p>
            <div className="mt-3 space-y-1 font-mono text-sm">
              <p><span className="text-slate-400">Login: </span><b>{s.login}</b></p>
              <p><span className="text-slate-400">Parol: </span><b>{s.password}</b></p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
