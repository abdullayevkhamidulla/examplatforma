import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { readDb } from "@/lib/db";
import { deleteQuestion } from "../../actions";
import { ConfirmButton } from "@/components/ui";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ topic?: string }> }) {
  const { topic } = await searchParams;
  const db = readDb();
  const all = [...db.questions].sort((a, b) => a.createdAt - b.createdAt);
  const list = topic ? all.filter((q) => q.topic === topic) : all;
  const count = (t: string) => all.filter((q) => q.topic === t).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Savollar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Jami {all.length} ta savol ·{" "}
            {db.settings.questionCount > 0
              ? `har bir o'quvchiga ${Math.min(db.settings.questionCount, all.length)} tasi beriladi`
              : "barchasi beriladi"}
          </p>
        </div>
        <Link href="/admin/questions/new" className="btn-primary"><Plus className="size-4" /> Yangi savol</Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/admin/questions"
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${!topic ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
        >
          Barchasi <span className="opacity-70">{all.length}</span>
        </Link>
        {db.topics.map((t) => (
          <Link
            key={t}
            href={`/admin/questions?topic=${encodeURIComponent(t)}`}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${topic === t ? "bg-indigo-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"}`}
          >
            {t} <span className="opacity-70">{count(t)}</span>
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {list.length === 0 && <p className="card p-10 text-center text-slate-400">Bu mavzuda savol yo'q</p>}
        {list.map((q) => (
          <div key={q.id} className="card p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span className="badge bg-indigo-50 text-indigo-700">{q.topic}</span>
                <p className="mt-3 font-medium">
                  <span className="text-slate-400">{all.indexOf(q) + 1}.</span> {q.text}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Link href={`/admin/questions/${q.id}`} className="btn-ghost" title="Tahrirlash"><Pencil className="size-4" /></Link>
                <ConfirmButton title="O'chirish" confirm="Savol o'chirilsinmi?" action={deleteQuestion.bind(null, q.id)} className="btn-ghost hover:!bg-rose-50 hover:!text-rose-600">
                  <Trash2 className="size-4" />
                </ConfirmButton>
              </div>
            </div>
            {q.code && <pre className="code-block mt-3">{q.code}</pre>}
          </div>
        ))}
      </div>
    </>
  );
}
