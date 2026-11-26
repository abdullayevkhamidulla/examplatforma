import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { readDb } from "@/lib/db";
import { isFinished, serverNow } from "@/lib/exam";
import ExamRunner, { type RunnerQuestion } from "./runner";

export default async function TestPage() {
  const student = await requireStudent();
  const db = readDb();
  const attempt = db.attempts.find((a) => a.studentId === student.id);
  if (!attempt) redirect("/exam");
  if (isFinished(attempt)) redirect("/exam/result");

  // To'g'ri javoblar mijozga yuborilmaydi
  const questions: RunnerQuestion[] = attempt.questionIds.flatMap((qid) => {
    const q = db.questions.find((x) => x.id === qid);
    return q ? [{ id: q.id, topic: q.topic, text: q.text, code: q.code }] : [];
  });

  return (
    <ExamRunner
      title={db.settings.title}
      studentName={`${student.firstName} ${student.lastName}`}
      questions={questions}
      initialAnswers={attempt.answers}
      deadline={attempt.deadline}
      serverNow={serverNow()}
      initialViolations={attempt.violations?.length ?? 0}
    />
  );
}
