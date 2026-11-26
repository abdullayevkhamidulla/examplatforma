"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { saveSettings } from "../../actions";
import { Alert, SubmitButton } from "@/components/ui";
import type { Settings } from "@/lib/types";

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-indigo-600 peer-focus-visible:ring-4 peer-focus-visible:ring-indigo-500/20" />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function SettingsForm({ settings, totalQuestions }: { settings: Settings; totalQuestions: number }) {
  const [state, action] = useActionState(saveSettings, undefined);
  return (
    <form action={action} className="mt-6 space-y-6">
      <section className="card p-6">
        <h2 className="font-semibold">Imtihon</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Imtihon nomi</label>
            <input name="title" className="input" defaultValue={settings.title} required />
          </div>
          <div>
            <label className="label">Davomiyligi (daqiqa)</label>
            <input name="durationMin" type="number" min={1} max={600} className="input" defaultValue={settings.durationMin} required />
          </div>
          <div>
            <label className="label">Har bir o'quvchiga savollar soni</label>
            <input name="questionCount" type="number" min={0} className="input" defaultValue={settings.questionCount} required />
            <p className="mt-1 text-xs text-slate-500">0 = barcha savollar ({totalQuestions} ta)</p>
          </div>
        </div>
        <div className="mt-2 divide-y divide-slate-100">
          <Toggle name="isOpen" label="Imtihon ochiq" hint="O'quvchilar imtihonni boshlay oladi" defaultChecked={settings.isOpen} />
          <Toggle name="shuffleQuestions" label="Savollarni aralashtirish" hint="Har bir o'quvchiga savollar boshqa tartibda chiqadi" defaultChecked={settings.shuffleQuestions} />
          <Toggle name="showScore" label="Bahoni o'quvchiga ko'rsatish" hint="Siz baho qo'ygandan keyin o'quvchi o'z sahifasida ko'radi" defaultChecked={settings.showScore} />
          <Toggle name="showRating" label="Reytingni o'quvchilarga ko'rsatish" hint="Baholangan o'quvchilar reytingi natija sahifasida chiqadi" defaultChecked={settings.showRating !== false} />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-semibold">Admin kirish ma'lumotlari</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Admin login</label>
            <input name="adminLogin" className="input font-mono" defaultValue={settings.adminLogin} required />
          </div>
          <div>
            <label className="label">Admin parol</label>
            <input name="adminPassword" className="input font-mono" defaultValue={settings.adminPassword} required minLength={4} />
          </div>
        </div>
      </section>

      <Alert state={state} />
      <div className="flex justify-end">
        <SubmitButton><Save className="size-4" /> Saqlash</SubmitButton>
      </div>
    </form>
  );
}
