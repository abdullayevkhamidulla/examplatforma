import Link from "next/link";
import { Download, Eye, RotateCcw, ShieldAlert } from "lucide-react";
import { readDb } from "@/lib/db";
import { finishedAt, formatDate, formatDuration, gradeStyle, isFinished, scoreAttempt } from "@/lib/exam";
import { resetAttempt } from "../../actions";
import { ConfirmButton } from "@/components/ui";

export default async function ResultsPage() {
  const db = readDb();
  const rows = db.students
    .map((st) => {
      const a = db.attempts.find((x) => x.studentId === st.id);
      const status = !a ? "none" : isFinished(a) ? "done" : "active";
      return { st, a, status, score: a ? scoreAttempt(db, a) : null };
    })
    .sort((x, y) => {
      const rank = { done: 0, active: 1, none: 2 } as const;
      return (
        rank[x.status as keyof typeof rank] - rank[y.status as keyof typeof rank] ||
        x.st.lastName.localeCompare(y.st.lastName)
      );
    });

  // Savollar bo'yicha statistika
  const done = db.attempts.filter((a) => isFinished(a));
  const qStats = db.questions
    .map((q) => {
      const seen = done.filter((a) => a.questionIds.includes(q.id) && a.marks?.[q.id] !== undefined);
      const ok = seen.filter((a) => a.marks?.[q.id] === true).length;
      return { q, seen: seen.length, pct: seen.length ? Math.round((ok / seen.length) * 100) : null };
    })
    .filter((x) => x.seen > 0)
    .sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Natijalar</h1>
          <p className="mt-1 text-sm text-slate-500">
            {done.length} / {db.students.length} o'quvchi topshirdi ·{" "}
            {done.filter((a) => a.grade).length} tasiga baho qo'yildi
          </p>
        </div>
        <a href="/admin/results/export" download className="btn-secondary"><Download className="size-4" /> Excel (CSV) yuklab olish</a>
      </div>

      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-5 py-3 font-medium">#</th>
              <th className="px-5 py-3 font-medium">O'quvchi</th>
              <th className="px-5 py-3 font-medium">Holat</th>
              <th className="px-5 py-3 font-medium">Tekshiruv</th>
              <th className="px-5 py-3 font-medium">Baho</th>
              <th className="px-5 py-3 font-medium" title="Qoidabuzarliklar">Cheat</th>
              <th className="px-5 py-3 font-medium">Sarflangan vaqt</th>
              <th className="px-5 py-3 font-medium">Tugatgan</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(({ st, a, status, score }, i) => {
              return (
                <tr key={st.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 text-slate-400">{i + 1}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium">{st.lastName} {st.firstName}</p>
                    <p className="text-xs text-slate-400">{st.login}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    {status === "done" && (a?.grade || score?.unchecked === 0 ? (
                      <span className="badge bg-emerald-50 text-emerald-700">Tekshirildi</span>
                    ) : (
                      <span className="badge bg-orange-50 text-orange-700">Tekshirish kerak</span>
                    ))}
                    {status === "active" && <span className="badge bg-amber-50 text-amber-700"><span className="size-1.5 animate-pulse rounded-full bg-amber-500" />Yechmoqda</span>}
                    {status === "none" && <span className="badge bg-slate-100 text-slate-500">Boshlamagan</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {status === "done" && score && (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-600">{score.correct} ✓</span>
                          <span className="font-semibold text-rose-600">{score.wrong} ✗</span>
                          <span className="text-slate-400">/ {score.total}</span>
                        </div>
                        {score.unchecked > 0 && <p className="mt-0.5 text-xs text-orange-600">{score.unchecked} ta tekshirilmagan</p>}
                      </div>
                    )}
                    {status === "active" && score && <p className="text-xs text-slate-400">{score.answered} ta javob yozdi</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    {a?.grade ? (
                      <span className={`grid size-9 place-items-center rounded-lg text-base font-bold ${gradeStyle(a.grade)}`}>{a.grade}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {a?.violations?.length ? (
                      <span className="badge bg-rose-600 text-white" title="Qoidabuzarliklar soni"><ShieldAlert className="size-3.5" />{a.violations.length}</span>
                    ) : a ? (
                      <span className="text-slate-300">0</span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{a && status === "done" ? formatDuration(finishedAt(a) - a.startedAt) : "—"}</td>
                  <td className="px-5 py-3.5 text-slate-500">{a && status === "done" ? formatDate(finishedAt(a)) : "—"}</td>
                  <td className="px-5 py-3.5">
                    {a && (
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/results/${st.id}`} className="btn-ghost text-indigo-600" title="Javoblarni ko'rish va baholash"><Eye className="size-4" /> {status === "done" ? "Tekshirish" : "Ko'rish"}</Link>
                        <ConfirmButton
                          title="Qayta topshirishga ruxsat"
                          confirm={`${st.lastName} ${st.firstName} natijasi o'chiriladi va u qayta topshira oladi. Davom etasizmi?`}
                          action={resetAttempt.bind(null, st.id)}
                        >
                          <RotateCcw className="size-4" />
                        </ConfirmButton>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {qStats.length > 0 && (
        <div className="card mt-6 p-6">
          <h2 className="font-semibold">Savollar statistikasi</h2>
          <p className="text-sm text-slate-500">Siz belgilagan javoblar bo'yicha: eng qiyin savollar yuqorida</p>
          <ul className="mt-5 space-y-3">
            {qStats.map(({ q, pct, seen }) => (
              <li key={q.id} className="grid items-center gap-2 sm:grid-cols-[1fr_220px]">
                <Link href={`/admin/questions/${q.id}`} className="truncate text-sm hover:text-indigo-600">
                  <span className="text-slate-400">{q.topic.split(":")[0].split(".")[0]} · </span>{q.text}
                </Link>
                <div className="flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${(pct ?? 0) >= 70 ? "bg-emerald-500" : (pct ?? 0) >= 40 ? "bg-amber-500" : "bg-rose-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-20 text-right text-xs text-slate-500">{pct}% · {seen} ta</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
