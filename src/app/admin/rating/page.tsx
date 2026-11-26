import { readDb } from "@/lib/db";
import { isFinished, ranking } from "@/lib/exam";
import RatingTable from "@/components/rating-table";
import { PrintButton } from "@/components/ui";

export default function RatingPage() {
  const db = readDb();
  const rows = ranking(db);
  const finished = db.attempts.filter((a) => isFinished(a)).length;
  return (
    <>
      <div className="no-print flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reyting</h1>
          <p className="mt-1 text-sm text-slate-500">
            {rows.length} / {finished} ta ish baholangan · tartib: baho, to'g'ri javoblar soni, sarflangan vaqt
          </p>
        </div>
        <PrintButton />
      </div>
      <div className="card mx-auto mt-6 max-w-2xl p-4">
        <h2 className="mb-2 hidden px-4 pt-2 text-xl font-bold print:block">{db.settings.title} — reyting</h2>
        <RatingTable
          rows={rows.map((r) => ({ rank: r.rank, id: r.st.id, name: `${r.st.lastName} ${r.st.firstName}`, grade: r.grade, correct: r.correct, total: r.total, time: r.time }))}
        />
      </div>
    </>
  );
}
