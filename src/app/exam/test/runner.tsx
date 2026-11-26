"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronLeft, ChevronRight, Clock, CornerDownLeft, Flag, Loader2, Send, ShieldAlert } from "lucide-react";
import { finishExam, reportViolation, saveAnswer } from "../../actions";
import { alarm, unlockAudio } from "@/lib/beep";

export type RunnerQuestion = {
  id: string;
  topic: string;
  text: string;
  code?: string;
};

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** `kod` ko'rinishidagi matnni ajratib ko'rsatadi */
function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/g).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[0.9em] text-indigo-700">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function ExamRunner({
  title,
  studentName,
  questions,
  initialAnswers,
  deadline,
  serverNow,
  initialViolations,
}: {
  title: string;
  studentName: string;
  questions: RunnerQuestion[];
  initialAnswers: Record<string, string>;
  deadline: number;
  serverNow: number;
  initialViolations: number;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(0);
  const [failed, setFailed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [finishing, startFinish] = useTransition();
  const [skew] = useState(() => serverNow - Date.now());
  const [left, setLeft] = useState(() => deadline - serverNow);
  const finishedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Saqlanishi kutilayotgan javoblar (debounce)
  const pending = useRef(new Map<string, { value: string; timer: ReturnType<typeof setTimeout> }>());
  const saved = useRef<Record<string, string>>({ ...initialAnswers });
  const [violations, setViolations] = useState(initialViolations);
  const [warnOpen, setWarnOpen] = useState(false);
  const warnedRef = useRef(initialViolations > 0);

  const push = useCallback(
    async (qid: string, value: string) => {
      if ((saved.current[qid] ?? "") === value) return;
      setSaving((n) => n + 1);
      try {
        const res = await saveAnswer(qid, value);
        if (res.ok) saved.current[qid] = value;
        else if (res.reason === "finished") router.replace("/exam/result");
        setFailed(!res.ok);
      } catch {
        setFailed(true);
      } finally {
        setSaving((n) => n - 1);
      }
    },
    [router],
  );

  const flush = useCallback(async () => {
    const jobs = [...pending.current.entries()].map(([qid, { value, timer }]) => {
      clearTimeout(timer);
      return push(qid, value);
    });
    pending.current.clear();
    await Promise.all(jobs);
  }, [push]);

  const onType = (qid: string, value: string) => {
    if (finishedRef.current) return;
    setAnswers((a) => ({ ...a, [qid]: value }));
    const prev = pending.current.get(qid);
    if (prev) clearTimeout(prev.timer);
    const timer = setTimeout(() => {
      pending.current.delete(qid);
      push(qid, value);
    }, 700);
    pending.current.set(qid, { value, timer });
  };

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    startFinish(async () => {
      await flush();
      await finishExam();
    });
  }, [flush]);

  useEffect(() => {
    const t = setInterval(() => {
      const l = deadline - (Date.now() + skew);
      setLeft(l);
      if (l <= 0) finish();
    }, 500);
    return () => clearInterval(t);
  }, [deadline, skew, finish]);

  const go = (i: number) => {
    flush();
    setIdx(Math.max(0, Math.min(i, questions.length - 1)));
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, [idx]);

  /* ───── Cheatga qarshi himoya ───── */
  useEffect(() => {
    let last = 0;
    let missedAlarm = false;
    let width = window.innerWidth;

    const report = (type: "tab" | "resize" | "devtools" | "paste" | "copy") => {
      if (finishedRef.current) return;
      const now = Date.now();
      if (now - last < 2500) return; // bitta harakat bir necha hodisa chiqarmasin
      last = now;
      setViolations((n) => n + 1);
      if (document.hidden) missedAlarm = true;
      alarm();
      if (!warnedRef.current) {
        warnedRef.current = true;
        setWarnOpen(true);
      }
      reportViolation(type).catch(() => {});
    };

    const onVisibility = () => {
      if (document.hidden) report("tab");
      else if (missedAlarm) {
        missedAlarm = false;
        alarm();
      }
    };
    const onBlur = () => report("tab");
    const onResize = () => {
      if (Math.abs(window.innerWidth - width) > 40) {
        width = window.innerWidth;
        report("resize");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      unlockAudio();
      const k = e.key.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      const devtools =
        k === "f12" ||
        (mod && e.shiftKey && ["i", "j", "c", "k"].includes(k)) ||
        (e.metaKey && e.altKey && ["i", "j", "c", "u"].includes(k)) ||
        (mod && k === "u");
      if (devtools) {
        e.preventDefault();
        report("devtools");
        return;
      }
      if (mod && k === "v") {
        e.preventDefault();
        report("paste");
      } else if (mod && ["c", "x"].includes(k)) {
        e.preventDefault();
        report("copy");
      } else if (mod && ["a", "s", "p"].includes(k)) {
        e.preventDefault();
      }
    };
    const onPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      report("paste");
    };
    const onCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      report("copy");
    };
    const prevent = (e: Event) => e.preventDefault();
    const onSelectStart = (e: Event) => {
      if (!(e.target instanceof HTMLInputElement)) e.preventDefault();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("pointerdown", unlockAudio);
    document.addEventListener("paste", onPaste, true);
    document.addEventListener("copy", onCopy, true);
    document.addEventListener("cut", onCopy, true);
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("drop", prevent);
    document.addEventListener("selectstart", onSelectStart);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("paste", onPaste, true);
      document.removeEventListener("copy", onCopy, true);
      document.removeEventListener("cut", onCopy, true);
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("drop", prevent);
      document.removeEventListener("selectstart", onSelectStart);
    };
  }, []);

  const q = questions[idx];
  if (!q)
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="card max-w-sm p-8">
          <p className="font-semibold">Savollar topilmadi</p>
          <p className="mt-1 text-sm text-slate-500">Ustozingizga murojaat qiling.</p>
          <button className="btn-primary mt-5" onClick={finish}>Yakunlash</button>
        </div>
      </div>
    );
  const isAnswered = (id: string) => !!answers[id]?.trim();
  const answeredCount = questions.filter((x) => isAnswered(x.id)).length;
  const low = left < 60_000;
  const progress = (answeredCount / questions.length) * 100;
  const isLast = idx === questions.length - 1;

  return (
    <div className="min-h-screen select-none [-webkit-touch-callout:none]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <p className="truncate font-semibold">{title}</p>
            <p className="truncate text-xs text-slate-500">{studentName}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 sm:inline">
              {saving > 0 ? (
                <span className="flex items-center gap-1"><Loader2 className="size-3 animate-spin" /> Saqlanmoqda</span>
              ) : failed ? (
                <span className="text-rose-500">Saqlanmadi — internetni tekshiring</span>
              ) : (
                "Saqlandi ✓"
              )}
            </span>
            {violations > 0 && (
              <span className="flex items-center gap-1 rounded-xl bg-rose-600 px-2.5 py-2 text-xs font-bold text-white" title="Qayd etilgan qoidabuzarliklar">
                <ShieldAlert className="size-4" /> {violations}
              </span>
            )}
            <div
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-lg font-bold tabular-nums ${
                low ? "animate-pulse bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-800"
              }`}
            >
              <Clock className="size-4" /> {fmt(left)}
            </div>
          </div>
        </div>
        <div className="h-1 bg-slate-100">
          <div className="h-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_300px]">
        <section className="card p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <span className="badge bg-indigo-50 text-indigo-700">Savol {idx + 1} / {questions.length}</span>
            <span className="truncate text-xs text-slate-400">{q.topic}</span>
          </div>
          <h2 className="mt-5 text-lg font-semibold leading-relaxed sm:text-xl">
            <RichText text={q.text} />
          </h2>
          {q.code && <pre className="code-block mt-4">{q.code}</pre>}

          <div className="mt-8">
            <label htmlFor="answer" className="label">Javobingiz</label>
            <div className="relative">
              <input
                id="answer"
                ref={inputRef}
                key={q.id}
                value={answers[q.id] ?? ""}
                onChange={(e) => onType(q.id, e.target.value)}
                onBlur={flush}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (isLast) setConfirmOpen(true);
                    else go(idx + 1);
                  }
                }}
                maxLength={1000}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Javobni shu yerga yozing..."
                className="w-full select-text rounded-xl border-2 border-slate-200 bg-white px-4 py-4 pr-12 font-mono text-base text-slate-900 outline-none transition placeholder:font-sans placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
              <CornerDownLeft className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-slate-300" />
            </div>
            <p className="mt-2 text-xs text-slate-400">Enter — keyingi savol. Javob avtomatik saqlanadi.</p>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <button className="btn-secondary" disabled={idx === 0} onClick={() => go(idx - 1)}>
              <ChevronLeft className="size-4" /> Oldingi
            </button>
            {!isLast ? (
              <button className="btn-primary" onClick={() => go(idx + 1)}>
                Keyingi <ChevronRight className="size-4" />
              </button>
            ) : (
              <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmOpen(true)}>
                <Flag className="size-4" /> Yakunlash
              </button>
            )}
          </div>
        </section>

        <aside className="card h-fit p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Savollar</h3>
            <span className="text-sm text-slate-500">{answeredCount}/{questions.length}</span>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2">
            {questions.map((x, i) => (
              <button
                key={x.id}
                onClick={() => go(i)}
                className={`aspect-square rounded-lg text-sm font-semibold transition ${
                  i === idx ? "ring-2 ring-indigo-600 ring-offset-2" : ""
                } ${isAnswered(x.id) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-indigo-600" /> Javob yozilgan</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded bg-slate-200" /> Javobsiz</span>
          </div>
          <button className="btn-primary mt-5 w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setConfirmOpen(true)}>
            <Send className="size-4" /> Imtihonni yakunlash
          </button>
        </aside>
      </main>

      {warnOpen && !finishing && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-rose-950/70 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md border-rose-200 p-6 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-rose-100 text-rose-600">
              <ShieldAlert className="size-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-rose-700">Ogohlantirish!</h3>
            <p className="mt-2 text-sm text-slate-600">
              Imtihon paytida boshqa tab yoki oynaga o'tish, ekran o'lchamini o'zgartirish, nusxa olish va inspect ochish taqiqlangan.
            </p>
            <p className="mt-2 text-sm font-semibold text-rose-700">
              Bu holat ustozingizga yuborildi. Keyingi har bir qoidabuzarlik ham qayd etiladi.
            </p>
            <button className="btn-danger mt-6 w-full" onClick={() => setWarnOpen(false)}>Tushundim</button>
          </div>
        </div>
      )}

      {(confirmOpen || finishing) && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6">
            {finishing ? (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="size-8 animate-spin text-indigo-600" />
                <p className="mt-3 font-medium">Javoblar yuborilmoqda...</p>
              </div>
            ) : (
              <>
                <div className="grid size-12 place-items-center rounded-full bg-amber-100 text-amber-600">
                  <AlertTriangle className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Imtihonni yakunlaysizmi?</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {questions.length - answeredCount > 0 ? (
                    <>Siz <b className="text-rose-600">{questions.length - answeredCount} ta</b> savolga javob yozmadingiz. </>
                  ) : (
                    <>Barcha savollarga javob yozdingiz. </>
                  )}
                  Yakunlagandan keyin javoblarni o'zgartirib bo'lmaydi.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                  <button className="btn-secondary" onClick={() => setConfirmOpen(false)}>Qaytish</button>
                  <button className="btn-primary bg-emerald-600 hover:bg-emerald-700" onClick={finish}>
                    Ha, yakunlash
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
