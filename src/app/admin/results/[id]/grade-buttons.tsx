"use client";

import { useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import { setGrade, setMark } from "../../../actions";
import { GRADES, gradeStyle } from "@/lib/exam";

/** Bitta javobni "to'g'ri" / "noto'g'ri" deb belgilash. Qayta bosilsa belgi olib tashlanadi. */
export function MarkButtons({ studentId, questionId, mark }: { studentId: string; questionId: string; mark?: boolean }) {
  const [pending, start] = useTransition();
  const set = (v: boolean) =>
    start(async () => void (await setMark(studentId, questionId, mark === v ? null : v)));

  return (
    <div className="flex items-center gap-1.5">
      {pending && <Loader2 className="size-4 animate-spin text-slate-400" />}
      <button
        type="button"
        disabled={pending}
        onClick={() => set(true)}
        className={`btn px-3.5 py-2 text-sm ${mark === true ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20" : "border border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"}`}
      >
        <Check className="size-4" /> To'g'ri
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => set(false)}
        className={`btn px-3.5 py-2 text-sm ${mark === false ? "bg-rose-600 text-white shadow-sm shadow-rose-600/20" : "border border-slate-200 text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"}`}
      >
        <X className="size-4" /> Noto'g'ri
      </button>
    </div>
  );
}

/** Yakuniy baho: 5 / 4 / 3 / 2 */
export function GradePicker({ studentId, grade }: { studentId: string; grade?: number }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      {GRADES.map((g) => (
        <button
          key={g}
          type="button"
          disabled={pending}
          onClick={() => start(async () => void (await setGrade(studentId, grade === g ? null : g)))}
          className={`grid size-12 place-items-center rounded-xl text-lg font-bold transition disabled:opacity-60 ${
            grade === g ? `${gradeStyle(g)} ring-2 ring-current ring-offset-2` : "border-2 border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600"
          }`}
        >
          {g}
        </button>
      ))}
      {pending && <Loader2 className="size-4 animate-spin text-slate-400" />}
    </div>
  );
}
