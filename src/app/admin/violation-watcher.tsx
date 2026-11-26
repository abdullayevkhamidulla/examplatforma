"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, BellOff, ShieldAlert, X } from "lucide-react";
import { alarm, unlockAudio } from "@/lib/beep";
import { VIOLATION_LABELS } from "@/lib/exam";

type Event = { type: string; at: number; studentId: string; name: string };

/** Har 4 soniyada yangi qoidabuzarliklarni tekshiradi: ovoz + xabar */
export default function ViolationWatcher() {
  const router = useRouter();
  const path = usePathname();
  const [toasts, setToasts] = useState<(Event & { key: string })[]>([]);
  const [sound, setSound] = useState(true);
  const soundRef = useRef(true);
  const since = useRef<number | null>(null);
  const pathRef = useRef(path);

  useEffect(() => {
    pathRef.current = path;
  }, [path]);

  useEffect(() => {
    const saved = localStorage.getItem("violation-sound") !== "off";
    soundRef.current = saved;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage faqat mijozda mavjud
    setSound(saved);
    window.addEventListener("pointerdown", unlockAudio);

    let stop = false;
    const tick = async () => {
      try {
        const r = await fetch(`/admin/violations?since=${since.current ?? Date.now()}`, { cache: "no-store" });
        if (!r.ok) return;
        const { now, events } = (await r.json()) as { now: number; events: Event[] };
        if (since.current === null) {
          since.current = now; // birinchi so'rov: eski hodisalarni ko'rsatmaymiz
          return;
        }
        since.current = Math.max(since.current, ...events.map((e) => e.at));
        if (events.length && !stop) {
          if (soundRef.current) alarm(1.2);
          setToasts((t) => [...t, ...events.map((e) => ({ ...e, key: `${e.studentId}-${e.at}` }))].slice(-5));
          if (/^\/admin(\/results.*)?$/.test(pathRef.current)) router.refresh();
        }
      } catch {}
    };
    tick();
    const id = setInterval(tick, 4000);
    return () => {
      stop = true;
      clearInterval(id);
      window.removeEventListener("pointerdown", unlockAudio);
    };
  }, [router]);

  const toggle = () => {
    const v = !sound;
    setSound(v);
    soundRef.current = v;
    localStorage.setItem("violation-sound", v ? "on" : "off");
    if (v) {
      unlockAudio();
      alarm(0.4);
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        className={`no-print fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold shadow-lg transition ${
          sound ? "bg-slate-900 text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"
        }`}
        title="Cheat qilinganda ovozli signal"
      >
        {sound ? <Bell className="size-4" /> : <BellOff className="size-4" />}
        Ovozli signal: {sound ? "yoqilgan" : "o'chirilgan"}
      </button>

      <div className="no-print fixed right-4 top-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.key} className="card flex items-start gap-3 border-rose-200 bg-rose-50 p-3 shadow-lg">
            <ShieldAlert className="mt-0.5 size-5 shrink-0 text-rose-600" />
            <Link href={`/admin/results/${t.studentId}`} className="min-w-0 flex-1" onClick={() => setToasts((x) => x.filter((y) => y.key !== t.key))}>
              <p className="truncate text-sm font-semibold text-rose-800">{t.name}</p>
              <p className="text-xs text-rose-700">{VIOLATION_LABELS[t.type] ?? t.type}</p>
              <p className="text-[11px] text-rose-500">{new Date(t.at).toLocaleTimeString("uz-UZ")}</p>
            </Link>
            <button onClick={() => setToasts((x) => x.filter((y) => y.key !== t.key))} className="text-rose-400 hover:text-rose-700">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
