import { Medal, Trophy } from "lucide-react";
import { formatDuration, gradeStyle } from "@/lib/exam";

export type RatingRow = {
  rank: number;
  id: string;
  name: string;
  grade: number;
  correct: number;
  total: number;
  time: number;
};

const MEDAL = ["text-amber-500", "text-slate-400", "text-orange-600"];

export default function RatingTable({ rows, highlight }: { rows: RatingRow[]; highlight?: string }) {
  if (!rows.length) {
    return <p className="py-10 text-center text-sm text-slate-400">Hali hech kim baholanmagan</p>;
  }
  return (
    <ol className="divide-y divide-slate-100">
      {rows.map((r) => (
        <li
          key={r.id}
          className={`flex items-center gap-4 px-4 py-3 ${r.id === highlight ? "rounded-xl bg-indigo-50 ring-1 ring-indigo-200" : ""}`}
        >
          <span className="grid w-8 shrink-0 place-items-center">
            {r.rank <= 3 ? (
              r.rank === 1 ? <Trophy className={`size-6 ${MEDAL[0]}`} /> : <Medal className={`size-6 ${MEDAL[r.rank - 1]}`} />
            ) : (
              <span className="font-semibold text-slate-400">{r.rank}</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate font-medium ${r.id === highlight ? "text-indigo-700" : ""}`}>
              {r.name} {r.id === highlight && <span className="text-xs font-normal">(siz)</span>}
            </p>
            <p className="text-xs text-slate-400">
              {r.correct}/{r.total} to'g'ri · {formatDuration(r.time)}
            </p>
          </div>
          <span className={`grid size-10 shrink-0 place-items-center rounded-xl text-lg font-bold ${gradeStyle(r.grade)}`}>{r.grade}</span>
        </li>
      ))}
    </ol>
  );
}
