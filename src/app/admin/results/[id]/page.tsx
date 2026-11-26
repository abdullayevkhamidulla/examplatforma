import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, MinusCircle, ShieldAlert, XCircle } from "lucide-react";
import { readDb } from "@/lib/db";
import { finishedAt, formatDate, formatDuration, formatPhone, isFinished, scoreAttempt, VIOLATION_LABELS } from "@/lib/exam";
import { PrintButton } from "@/components/ui";
import { GradePicker, MarkButtons } from "./grade-buttons";

export default async function StudentResult({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = readDb();
  const st = db.students.find((s) => s.id === id);
  if (!st) notFound();
  const a = db.attempts.find((x) => x.studentId === id);
  const score = a ? scoreAttempt(db, a) : null;
  const done = a ? isFinished(a) : false;

  // Topshirganlar orasida oldingi / keyingi o'quvchiga o'tish
  const finished = db.students
    .filter((s) => db.attempts.some((x) => x.studentId === s.id && isFinished(x)))
    .sort((x, y) => x.lastName.localeCompare(y.lastName));
  const pos = finished.findIndex((s) => s.id === id);
  const prev = pos > 0 ? finished[pos - 1] : null;
  const next = pos >= 0 && pos < finished.length - 1 ? finished[pos + 1] : null;

  return (
    <>
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/results" className="btn-ghost -ml-2.5"><ArrowLeft className="size-4" /> Natijalar</Link>
        <div className="flex items-center gap-2">
          {prev && <Link href={`/admin/results/${prev.id}`} className="btn-secondary" title={`${prev.lastName} ${prev.firstName}`}><ChevronLeft className="size-4" /> Oldingi</Link>}
          {next && <Link href={`/admin/results/${next.id}`} className="btn-secondary" title={`${next.lastName} ${next.firstName}`}>Keyingi <ChevronRight className="size-4" /></Link>}
          {a && <PrintButton />}
        </div>
      </div>

      <div className="card mt-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold">{st.lastName} {st.firstName}</h1>
            <p className="mt-1 text-sm text-slate-500">{formatPhone(st.phone)} · login: {st.login}</p>
            {a && (
              <p className="mt-1 text-sm text-slate-500">
                Boshlagan: {formatDate(a.startedAt)}
                {done && <> · Sarflangan vaqt: {formatDuration(finishedAt(a) - a.startedAt)}</>}
                {!done && <span className="badge ml-2 bg-amber-50 text-amber-700">Hozir yechmoqda</span>}
              </p>
            )}
          </div>
          {score && (
            <div className="flex items-center gap-6">
              <Stat value={score.correct} label="To'g'ri" cls="text-emerald-600" />
              <Stat value={score.wrong} label="Noto'g'ri" cls="text-rose-600" />
              <Stat value={score.unchecked} label="Tekshirilmagan" cls="text-amber-500" />
              <Stat value={`${score.answered}/${score.total}`} label="Javob yozgan" cls="text-slate-700" />
            </div>
          )}
        </div>

        {a && score && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 p-4">
            <div>
              <p className="font-semibold">Yakuniy baho</p>
              <p className="text-sm text-slate-500">
                {score.unchecked > 0
                  ? `Yana ${score.unchecked} ta javob tekshirilmagan`
                  : `Barcha javoblar tekshirildi · ${score.correct}/${score.total} to'g'ri (${score.percent}%)`}
              </p>
            </div>
            <GradePicker studentId={st.id} grade={a.grade} />
          </div>
        )}
      </div>

      {a?.violations?.length ? (
        <div className="card mt-6 border-rose-200 bg-rose-50/60 p-6">
          <h2 className="flex items-center gap-2 font-semibold text-rose-700">
            <ShieldAlert className="size-5" /> Qoidabuzarliklar: {a.violations.length} ta
          </h2>
          <ul className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2">
            {a.violations.map((v, i) => (
              <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                <span className="text-rose-800">{VIOLATION_LABELS[v.type] ?? v.type}</span>
                <span className="shrink-0 font-mono text-xs text-slate-500">
                  {new Date(v.at).toLocaleTimeString("uz-UZ")} · {formatDuration(v.at - a.startedAt)} da
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : a ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-emerald-700"><CheckCircle2 className="size-4" /> Qoidabuzarlik qayd etilmagan</p>
      ) : null}

      {!a ? (
        <p className="card mt-6 p-10 text-center text-slate-400">Bu o'quvchi hali imtihonni boshlamagan</p>
      ) : (
        <div className="mt-6 space-y-4">
          {a.questionIds.map((qid, n) => {
            const q = db.questions.find((x) => x.id === qid);
            if (!q) return null;
            const mine = a.answers[qid]?.trim();
            const mark = a.marks?.[qid];
            return (
              <div
                key={qid}
                className={`card break-inside-avoid border-l-4 p-6 ${
                  mark === true ? "border-l-emerald-500" : mark === false ? "border-l-rose-500" : "border-l-amber-400"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {mark === true ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                    ) : mark === false ? (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
                    ) : (
                      <CircleDashed className="mt-0.5 size-5 shrink-0 text-amber-500" />
                    )}
                    <p className="font-medium">{n + 1}. {q.text}</p>
                  </div>
                  <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{q.topic}</span>
                </div>
                {q.code && <pre className="code-block mt-3">{q.code}</pre>}

                <div className={`mt-4 rounded-xl border px-4 py-3 ${mine ? "border-indigo-100 bg-indigo-50/50" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-xs font-medium text-slate-500">O'quvchi javobi</p>
                  {mine ? (
                    <p className="mt-1 whitespace-pre-wrap break-words font-mono text-base text-slate-900">{mine}</p>
                  ) : (
                    <p className="mt-1 flex items-center gap-1.5 italic text-slate-400"><MinusCircle className="size-4" /> javob yozilmagan</p>
                  )}
                </div>

                <div className="no-print mt-4 flex justify-end">
                  <MarkButtons studentId={st.id} questionId={qid} mark={mark} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function Stat({ value, label, cls }: { value: number | string; label: string; cls: string }) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
