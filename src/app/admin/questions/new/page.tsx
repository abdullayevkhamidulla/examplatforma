import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readDb } from "@/lib/db";
import QuestionForm from "../question-form";

export default function NewQuestion() {
  const { topics } = readDb();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/questions" className="btn-ghost -ml-2.5"><ArrowLeft className="size-4" /> Savollar</Link>
      <h1 className="mt-2 text-2xl font-bold">Yangi savol</h1>
      <QuestionForm topics={topics} />
    </div>
  );
}
