import Link from "next/link";
import { Printer } from "lucide-react";
import { readDb } from "@/lib/db";
import { formatPhone, isFinished } from "@/lib/exam";
import StudentsTable from "./students-table";
import { CopyButton } from "@/components/ui";

export default async function StudentsPage() {
  const db = readDb();
  const students = [...db.students]
    .sort((a, b) => a.lastName.localeCompare(b.lastName))
    .map((s) => {
      const a = db.attempts.find((x) => x.studentId === s.id);
      return { ...s, status: (!a ? "none" : isFinished(a) ? "done" : "active") as "none" | "done" | "active" };
    });
  const allCreds = students
    .map((s, i) => `${i + 1}. ${s.lastName} ${s.firstName} — login: ${s.login}  parol: ${s.password}`)
    .join("\n");

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">O'quvchilar</h1>
          <p className="mt-1 text-sm text-slate-500">
            {students.length} ta o'quvchi · Login = familiya, parol = ism + telefonning oxirgi 4 raqami
          </p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={allCreds} label="Hammasini nusxalash" />
          <Link href="/admin/students/print" className="btn-secondary"><Printer className="size-4" /> Kartochkalar</Link>
        </div>
      </div>
      <StudentsTable students={students.map((s) => ({ ...s, phoneFmt: formatPhone(s.phone) }))} />
    </>
  );
}
