"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { saveQuestion } from "../../actions";
import { Alert, SubmitButton } from "@/components/ui";
import type { Question } from "@/lib/types";

export default function QuestionForm({ topics, question }: { topics: string[]; question?: Question }) {
  const [state, action] = useActionState(saveQuestion, undefined);
  const [newTopic, setNewTopic] = useState(false);

  return (
    <form action={action} className="card mt-6 space-y-6 p-6 sm:p-8">
      {question && <input type="hidden" name="id" value={question.id} />}

      <div>
        <div className="flex items-center justify-between">
          <label className="label">Mavzu</label>
          <button type="button" className="mb-1.5 text-xs font-medium text-indigo-600 hover:underline" onClick={() => setNewTopic((v) => !v)}>
            {newTopic ? "Ro'yxatdan tanlash" : "+ Yangi mavzu"}
          </button>
        </div>
        {newTopic ? (
          <input name="topic" className="input" placeholder="Yangi mavzu nomi" required />
        ) : (
          <select name="topic" className="input" defaultValue={question?.topic ?? topics[0]} required>
            {topics.map((t) => <option key={t}>{t}</option>)}
          </select>
        )}
      </div>

      <div>
        <label className="label">Savol matni</label>
        <textarea name="text" rows={3} className="input" defaultValue={question?.text} placeholder="Masalan: Matn qatorlari orasidagi masofani qaysi xossa belgilaydi?" required />
      </div>

      <div>
        <label className="label">Kod (ixtiyoriy)</label>
        <textarea
          name="code"
          rows={4}
          className="input !bg-slate-900 font-mono !text-slate-100 placeholder:!text-slate-500"
          defaultValue={question?.code}
          placeholder={".box {\n  display: flex;\n}"}
          spellCheck={false}
        />
      </div>

      <Alert state={state} />
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
        <Link href="/admin/questions" className="btn-secondary">Bekor qilish</Link>
        <SubmitButton><Save className="size-4" /> Saqlash</SubmitButton>
      </div>
    </form>
  );
}
