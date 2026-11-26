import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { finishedAt, formatDate, formatDuration, formatPhone, isFinished, scoreAttempt } from "@/lib/exam";

const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export async function GET() {
  const s = await getSession();
  if (s?.role !== "admin") return new Response("Unauthorized", { status: 401 });
  const db = readDb();
  const header = ["Familiya", "Ism", "Telefon", "Login", "Holat", "Javob yozgan", "To'g'ri", "Noto'g'ri", "Jami savol", "Baho", "Vaqt", "Tugatgan"];
  const lines = db.students
    .slice()
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((st) => {
      const a = db.attempts.find((x) => x.studentId === st.id);
      const sc = a ? scoreAttempt(db, a) : null;
      const done = a && isFinished(a);
      return [
        st.lastName,
        st.firstName,
        formatPhone(st.phone),
        st.login,
        !a ? "Boshlamagan" : done ? "Topshirdi" : "Yechmoqda",
        sc?.answered ?? "",
        sc?.correct ?? "",
        sc?.wrong ?? "",
        sc?.total ?? "",
        a?.grade ?? "",
        a && done ? formatDuration(finishedAt(a) - a.startedAt) : "",
        a && done ? formatDate(finishedAt(a)) : "",
      ];
    });
  const csv = "﻿" + [header, ...lines].map((r) => r.map(esc).join(";")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="natijalar.csv"`,
    },
  });
}
