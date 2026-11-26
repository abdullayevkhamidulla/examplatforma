import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileQuestion, Power, Users } from "lucide-react";
import { readDb } from "@/lib/db";
import { finishedAt, formatDate, gradeStyle, isFinished, scoreAttempt } from "@/lib/exam";
import { toggleExam } from "../actions";
import { SubmitButton } from "@/components/ui";

export default async function AdminDashboard() {
  const db = readDb();
  const finished = db.attempts.filter((a) => isFinished(a));
  const active = db.attempts.filter((a) => !isFinished(a));
  const graded = finished.filter((a) => a.grade);
  const avg = graded.length ? graded.reduce((s, a) => s + (a.grade ?? 0), 0) / graded.length : 0;
  const toCheck = finished.length - graded.length;
  const recent = [...finished].sort((a, b) => finishedAt(b) - finishedAt(a)).slice(0, 6);

  const stats = [
    { label: "O'quvchilar", value: db.students.length, icon: Users, cls: "bg-indigo-50 text-indigo-600" },
    { label: "Topshirgan", value: finished.length, icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-600" },
    { label: "Hozir yechmoqda", value: active.length, icon: Clock, cls: "bg-amber-50 text-amber-600" },
    { label: "Savollar", value: db.questions.length, icon: FileQuestion, cls: "bg-violet-50 text-violet-600" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Bosh sahifa</h1>
          <p className="mt-1 text-sm text-slate-500">{db.settings.title} · {db.settings.durationMin} daqiqa</p>
        </div>
        <form action={toggleExam}>
          <SubmitButton className={db.settings.isOpen ? "btn-danger" : "btn-primary bg-emerald-600 hover:bg-emerald-700"}>
            <Power className="size-4" /> {db.settings.isOpen ? "Imtihonni yopish" : "Imtihonni ochish"}
          </SubmitButton>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className={`grid size-10 place-items-center rounded-xl ${s.cls}`}><s.icon className="size-5" /></div>
            <p className="mt-4 text-3xl font-bold">{s.value}</p>
            <p className="text-sm text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-6">
          <h2 className="font-semibold">Baholash</h2>
          <div className="mt-4 flex items-end gap-2">
            <p className="text-5xl font-bold text-indigo-600">{avg ? avg.toFixed(1) : "—"}</p>
            <p className="pb-1.5 text-sm text-slate-500">o'rtacha baho</p>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-indigo-600" style={{ width: `${finished.length ? (graded.length / finished.length) * 100 : 0}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-500">
            {graded.length} / {finished.length} ta ish baholandi
          </p>
          {toCheck > 0 && (
            <Link href="/admin/results" className="btn-primary mt-4 w-full">
              {toCheck} ta ishni tekshirish <ArrowRight className="size-4" />
            </Link>
          )}
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Oxirgi topshirganlar</h2>
            <Link href="/admin/results" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
              Barchasi <ArrowRight className="size-4" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Hali hech kim topshirmagan</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {recent.map((a) => {
                const st = db.students.find((s) => s.id === a.studentId);
                const sc = scoreAttempt(db, a);
                return (
                  <li key={a.id}>
                    <Link href={`/admin/results/${st?.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{st?.lastName} {st?.firstName}</p>
                        <p className="text-xs text-slate-400">{formatDate(finishedAt(a))}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-slate-500">{sc.answered}/{sc.total} javob</span>
                        {a.grade ? (
                          <span className={`grid size-8 place-items-center rounded-lg font-bold ${gradeStyle(a.grade)}`}>{a.grade}</span>
                        ) : (
                          <span className="badge bg-orange-50 text-orange-700">Tekshirish kerak</span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
