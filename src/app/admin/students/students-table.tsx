"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, Save, Search, Trash2, X } from "lucide-react";
import { deleteStudent, saveStudent } from "../../actions";
import { Alert, ConfirmButton, CopyButton, SubmitButton } from "@/components/ui";
import type { Student } from "@/lib/types";

type Row = Student & { phoneFmt: string; status: "none" | "done" | "active" };

export default function StudentsTable({ students }: { students: Row[] }) {
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);
  const [showPw, setShowPw] = useState(true);
  const term = q.toLowerCase();
  const list = students.filter((s) =>
    `${s.lastName} ${s.firstName} ${s.login} ${s.phone}`.toLowerCase().includes(term),
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Qidirish..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} className="size-4 accent-indigo-600" />
          Parollarni ko'rsatish
        </label>
        <button className="btn-primary ml-auto" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> O'quvchi qo'shish
        </button>
      </div>

      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">Familiya Ism</th>
              <th className="px-5 py-3 font-medium">Telefon</th>
              <th className="px-5 py-3 font-medium">Login</th>
              <th className="px-5 py-3 font-medium">Parol</th>
              <th className="px-5 py-3 font-medium">Holat</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((s, i) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3 text-slate-400">{i + 1}</td>
                <td className="px-5 py-3 font-medium">{s.lastName} {s.firstName}</td>
                <td className="whitespace-nowrap px-5 py-3 text-slate-500">{s.phoneFmt}</td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1">
                    <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[13px]">{s.login}</code>
                    <CopyButton text={s.login} />
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className="flex items-center gap-1">
                    <code className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[13px]">{showPw ? s.password : "••••••"}</code>
                    <CopyButton text={s.password} />
                  </span>
                </td>
                <td className="px-5 py-3">
                  {s.status === "done" && <span className="badge bg-emerald-50 text-emerald-700">Topshirdi</span>}
                  {s.status === "active" && <span className="badge bg-amber-50 text-amber-700">Yechmoqda</span>}
                  {s.status === "none" && <span className="badge bg-slate-100 text-slate-500">Boshlamagan</span>}
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="btn-ghost" title="Tahrirlash" onClick={() => setEditing(s)}><Pencil className="size-4" /></button>
                    <ConfirmButton
                      title="O'chirish"
                      confirm={`${s.lastName} ${s.firstName} va uning natijalari o'chirilsinmi?`}
                      action={deleteStudent.bind(null, s.id)}
                      className="btn-ghost hover:!bg-rose-50 hover:!text-rose-600"
                    >
                      <Trash2 className="size-4" />
                    </ConfirmButton>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Topilmadi</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <StudentModal key={editing === "new" ? "new" : editing.id} student={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function StudentModal({ student, onClose }: { student?: Row; onClose: () => void }) {
  const [state, action] = useActionState(saveStudent, undefined);
  useEffect(() => {
    if (state?.ok) onClose();
  }, [state, onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <form action={action} className="card w-full max-w-lg p-6" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{student ? "O'quvchini tahrirlash" : "Yangi o'quvchi"}</h3>
          <button type="button" className="btn-ghost" onClick={onClose}><X className="size-4" /></button>
        </div>
        {student && <input type="hidden" name="id" value={student.id} />}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Familiya</label>
            <input name="lastName" className="input" defaultValue={student?.lastName} required />
          </div>
          <div>
            <label className="label">Ism</label>
            <input name="firstName" className="input" defaultValue={student?.firstName} required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Telefon</label>
            <input name="phone" className="input" defaultValue={student?.phoneFmt} placeholder="+998 90 123-45-67" required />
          </div>
          <div>
            <label className="label">Login</label>
            <input name="login" className="input font-mono" defaultValue={student?.login} placeholder="avtomatik" />
          </div>
          <div>
            <label className="label">Parol</label>
            <input name="password" className="input font-mono" defaultValue={student?.password} placeholder="avtomatik" />
          </div>
        </div>
        {!student && <p className="mt-3 text-xs text-slate-500">Login va parolni bo'sh qoldirsangiz, ism-familiya va telefondan avtomatik yaratiladi.</p>}
        <div className="mt-4"><Alert state={state?.error ? state : undefined} /></div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Bekor qilish</button>
          <SubmitButton><Save className="size-4" /> Saqlash</SubmitButton>
        </div>
      </form>
    </div>
  );
}
