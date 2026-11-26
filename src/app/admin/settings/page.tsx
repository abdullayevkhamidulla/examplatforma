import { readDb } from "@/lib/db";
import SettingsForm from "./settings-form";

export default function SettingsPage() {
  const { settings, questions } = readDb();
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Sozlamalar</h1>
      <p className="mt-1 text-sm text-slate-500">Imtihon parametrlari va admin kirish ma'lumotlari</p>
      <SettingsForm settings={settings} totalQuestions={questions.length} />
    </div>
  );
}
