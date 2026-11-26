import { redirect } from "next/navigation";
import { CheckCircle2, Hourglass, LogOut, Trophy } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { finishedAt, formatDuration, gradeStyle, isFinished, ranking, scoreAttempt } from "@/lib/exam";
import RatingTable from "@/components/rating-table";
import AutoRefresh from "@/components/auto-refresh";
import { logout } from "../../actions";

export default async function ResultPage() {
  const student = await requireStudent();
  const db = readDb();
  const attempt = db.attempts.find((a) => a.studentId === student.id);
  if (!attempt) redirect("/exam");
  if (!isFinished(attempt)) redirect("/exam/test");
  const { settings } = db;
  const score = scoreAttempt(db, attempt);
  const graded = settings.showScore && attempt.grade;
  const rows = settings.showRating !== false ? ranking(db) : [];
  const me = rows.find((r) => r.st.id === student.id);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-10">
      <AutoRefresh seconds={20} />
      <div className="card w-full max-w-lg p-8 text-center">
        <p className="text-sm font-medium text-indigo-600">{settings.title}</p>
        <h1 className="mt-1 text-2xl font-bold">Imtihon yakunlandi!</h1>
        <p className="mt-1 text-slate-500">{student.firstName} {student.lastName}</p>

        {graded ? (
          <>
            <p className="mt-8 text-sm text-slate-500">Sizning bahoingiz</p>
            <div className={`mx-auto mt-2 grid size-28 place-items-center rounded-3xl text-6xl font-bold ${gradeStyle(attempt.grade!)}`}>
              {attempt.grade}
            </div>
            {score.unchecked === 0 && (
              <p className="mt-4 text-slate-600">{score.total} ta savoldan <b>{score.correct} tasiga</b> to'g'ri javob berdingiz</p>
            )}
          </>
        ) : (
          <div className="mt-8 flex flex-col items-center">
            <div className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-8" />
            </div>
            <p className="mt-4 font-medium">Javoblaringiz qabul qilindi</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
              <Hourglass className="size-4" /> Ustoz javoblarni tekshirib, baho qo'yadi
            </p>
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xl font-bold text-slate-800">{score.answered}/{score.total}</p>
            <p className="text-slate-500">Javob yozildi</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xl font-bold text-slate-800">{formatDuration(finishedAt(attempt) - attempt.startedAt)}</p>
            <p className="text-slate-500">Sarflangan vaqt</p>
          </div>
        </div>

        <form action={logout} className="mt-8">
          <button className="btn-secondary"><LogOut className="size-4" /> Chiqish</button>
        </form>
      </div>

      {rows.length > 0 && (
        <div className="card w-full max-w-lg p-4">
          <div className="flex items-center justify-between px-4 pb-2 pt-2">
            <h2 className="flex items-center gap-2 font-semibold"><Trophy className="size-5 text-amber-500" /> Reyting</h2>
            {me && <span className="text-sm text-slate-500">Siz <b className="text-indigo-600">{me.rank}-o'rindasiz</b></span>}
          </div>
          <RatingTable
            highlight={student.id}
            rows={rows.map((r) => ({ rank: r.rank, id: r.st.id, name: `${r.st.lastName} ${r.st.firstName}`, grade: r.grade, correct: r.correct, total: r.total, time: r.time }))}
          />
        </div>
      )}
    </div>
  );
}
