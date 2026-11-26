import type { Attempt, DB } from "./types";

/** Vaqt tugaganidan keyin 15 soniya kutiladi (tarmoq kechikishi uchun). */
export const GRACE_MS = 15_000;

export function isFinished(a: Attempt, now = Date.now()) {
  return !!a.finishedAt || now > a.deadline + GRACE_MS;
}

export function finishedAt(a: Attempt) {
  return a.finishedAt ?? a.deadline;
}

/** Admin belgilari bo'yicha hisob. Belgilanmagan javoblar "tekshirilmagan" hisoblanadi. */
export function scoreAttempt(db: DB, a: Attempt) {
  let correct = 0;
  let wrong = 0;
  let total = 0;
  let answered = 0;
  for (const qid of a.questionIds) {
    if (!db.questions.some((x) => x.id === qid)) continue; // o'chirilgan savol hisobga olinmaydi
    total++;
    if (a.answers[qid]?.trim()) answered++;
    const m = a.marks?.[qid];
    if (m === true) correct++;
    else if (m === false) wrong++;
  }
  const checked = correct + wrong;
  return {
    correct,
    wrong,
    checked,
    total,
    answered,
    unchecked: total - checked,
    percent: total ? Math.round((correct / total) * 100) : 0,
  };
}

export function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("998")) {
    return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)}-${d.slice(8, 10)}-${d.slice(10)}`;
  }
  return d ? `+${d}` : "";
}

export function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m} daq ${String(s % 60).padStart(2, "0")} s`;
}

export function formatDate(ts: number) {
  return new Date(ts).toLocaleString("uz-UZ", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const GRADES = [5, 4, 3, 2] as const;

export function gradeStyle(g: number) {
  return (
    { 5: "bg-emerald-100 text-emerald-700", 4: "bg-sky-100 text-sky-700", 3: "bg-amber-100 text-amber-700", 2: "bg-rose-100 text-rose-700" }[g] ??
    "bg-slate-100 text-slate-500"
  );
}

export const serverNow = () => Date.now();

export const VIOLATION_LABELS: Record<string, string> = {
  tab: "Boshqa tab yoki oynaga o'tdi",
  resize: "Ekran o'lchamini o'zgartirdi",
  devtools: "Inspect (DevTools) ochishga urindi",
  paste: "Matn joylashtirishga (paste) urindi",
  copy: "Nusxa olishga urindi",
};

/** Baholangan ishlar reytingi: baho ↓, to'g'ri javoblar ↓, sarflangan vaqt ↑ */
export function ranking(db: DB) {
  return db.attempts
    .filter((a) => a.grade && isFinished(a))
    .map((a) => {
      const st = db.students.find((s) => s.id === a.studentId);
      const sc = scoreAttempt(db, a);
      return { a, st, correct: sc.correct, total: sc.total, grade: a.grade!, time: finishedAt(a) - a.startedAt };
    })
    .filter((r) => r.st)
    .sort((x, y) => y.grade - x.grade || y.correct - x.correct || x.time - y.time)
    .map((r, i) => ({ ...r, st: r.st!, rank: i + 1 }));
}
