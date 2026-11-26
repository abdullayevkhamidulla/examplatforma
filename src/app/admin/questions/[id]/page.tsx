import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { readDb } from "@/lib/db";
import QuestionForm from "../question-form";

export default async function EditQuestion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { topics, questions } = readDb();
  const q = questions.find((x) => x.id === id);
  if (!q) notFound();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/questions" className="btn-ghost -ml-2.5"><ArrowLeft className="size-4" /> Savollar</Link>
      <h1 className="mt-2 text-2xl font-bold">Savolni tahrirlash</h1>
      <p className="mt-1 text-sm text-slate-500">To'g'ri javobni o'zgartirsangiz, natijalar avtomatik qayta hisoblanadi.</p>
      <QuestionForm topics={topics} question={q} />
    </div>
  );
}
