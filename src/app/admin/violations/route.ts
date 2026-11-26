import { getSession } from "@/lib/auth";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Admin panel uchun: berilgan vaqtdan keyingi qoidabuzarliklar */
export async function GET(req: Request) {
  const s = await getSession();
  if (s?.role !== "admin") return Response.json({ error: "Unauthorized" }, { status: 401 });
  const since = Number(new URL(req.url).searchParams.get("since")) || 0;
  const db = readDb();
  const events = db.attempts
    .flatMap((a) => {
      const st = db.students.find((x) => x.id === a.studentId);
      return (a.violations ?? [])
        .filter((v) => v.at > since)
        .map((v) => ({ ...v, studentId: a.studentId, name: st ? `${st.lastName} ${st.firstName}` : "?" }));
    })
    .sort((x, y) => x.at - y.at);
  return Response.json({ now: Date.now(), events });
}
