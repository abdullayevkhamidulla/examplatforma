import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Clock, ListChecks, Lock, LogOut, PlayCircle, Trophy } from "lucide-react";
import { requireStudent } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { isFinished } from "@/lib/exam";
import { logout, startExam } from "../actions";
import { SubmitButton } from "@/components/ui";

export default async function ExamHome() {
  const student = await requireStudent();
  const db = readDb();
  const { settings } = db;
  const attempt = db.attempts.find((a) => a.studentId === student.id);
  if (attempt && !isFinished(attempt)) redirect("/exam/test");

  const total = settings.questionCount > 0 ? Math.min(settings.questionCount, db.questions.length) : db.questions.length;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-indigo-600 font-mono text-sm font-bold text-white">{"{ }"}</div>
            <span className="font-semibold">CSS Imtihon</span>
          </div>
          <form action={logout}>
            <button className="btn-ghost"><LogOut className="size-4" /> Chiqish</button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-sm font-medium text-indigo-600">Assalomu alaykum,</p>
        <h1 className="mt-1 text-3xl font-bold">{student.firstName} {student.lastName}</h1>

        <div className="card mt-8 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-8 py-7 text-white">
            <h2 className="text-xl font-bold">{settings.title}</h2>
            <div className="mt-4 flex flex-wrap gap-6 text-sm text-white/90">
              <span className="flex items-center gap-2"><ListChecks className="size-4" /> {total} ta savol</span>
              <span className="flex items-center gap-2"><Clock className="size-4" /> {settings.durationMin} daqiqa</span>
              <span className="flex items-center gap-2"><BookOpen className="size-4" /> {db.topics.length} ta mavzu</span>
            </div>
          </div>

          <div className="p-8">
            {attempt ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Trophy className="size-8" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Siz imtihonni topshirib bo'lgansiz</h3>
                <Link href="/exam/result" className="btn-primary mt-5">Natijani ko'rish</Link>
              </div>
            ) : settings.isOpen && total === 0 ? (
              <p className="py-6 text-center text-slate-500">Hali savollar qo'shilmagan. Ustozingizga murojaat qiling.</p>
            ) : !settings.isOpen ? (
              <div className="flex flex-col items-center py-6 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-amber-100 text-amber-600">
                  <Lock className="size-8" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">Imtihon hali ochilmagan</h3>
                <p className="mt-1 text-sm text-slate-500">Ustoz imtihonni boshlaganda sahifani yangilang.</p>
              </div>
            ) : (
              <>
                <h3 className="font-semibold">Qoidalar</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>• Har bir savolga javobni o'zingiz yozasiz (variantlar yo'q).</li>
                  <li>• Javoblaringiz avtomatik saqlanadi, savollar orasida bemalol o'tishingiz mumkin.</li>
                  <li>• Vaqt tugaganda imtihon avtomatik yakunlanadi.</li>
                  <li>• Imtihonni faqat <b>bir marta</b> topshirish mumkin.</li>
                  <li className="font-medium text-rose-600">• Boshqa tab/oynaga o'tish, ekran o'lchamini o'zgartirish, nusxa olish yoki joylashtirish taqiqlanadi — har biri ovozli signal bilan ustozga yuboriladi.</li>
                </ul>
                <form action={startExam} className="mt-8">
                  <SubmitButton className="btn-primary w-full py-3.5 text-base sm:w-auto sm:px-8">
                    <PlayCircle className="size-5" /> Imtihonni boshlash
                  </SubmitButton>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
