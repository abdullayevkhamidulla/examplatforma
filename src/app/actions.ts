"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireAdmin, requireStudent, setSession } from "@/lib/auth";
import { readDb, updateDb } from "@/lib/db";
import { GRACE_MS, isFinished } from "@/lib/exam";
import { makeCredentials } from "@/lib/seed";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ───────────── Auth ───────────── */

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  // Apostrof va bo'sh joylar e'tiborga olinmaydi: "Abdug'afforov" = "abdugafforov"
  const loginVal = str(fd, "login").toLowerCase().replace(/[\s'`ʻʼ‘’]/g, "");
  const password = str(fd, "password");
  if (!loginVal || !password) return { error: "Login va parolni kiriting" };

  const db = readDb();
  if (loginVal === db.settings.adminLogin.toLowerCase() && password === db.settings.adminPassword) {
    await setSession({ role: "admin" });
    redirect("/admin");
  }
  // O'quvchi parolida katta-kichik harf farqlanmaydi (telefonda bosh harf avtomatik katta bo'lib qolishi mumkin)
  const st = db.students.find(
    (s) => s.login.toLowerCase() === loginVal && s.password.toLowerCase() === password.toLowerCase(),
  );
  if (!st) return { error: "Login yoki parol noto'g'ri" };
  await setSession({ role: "student", id: st.id });
  redirect("/exam");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

/* ───────────── O'quvchi: imtihon ───────────── */

export async function startExam() {
  const student = await requireStudent();
  const res = updateDb((db) => {
    if (db.attempts.some((a) => a.studentId === student.id)) return "exists";
    if (!db.settings.isOpen) return "closed";
    let pool = [...db.questions].sort((a, b) => a.createdAt - b.createdAt);
    if (!pool.length) return "empty";
    if (db.settings.shuffleQuestions) pool = shuffle(pool);
    const n = db.settings.questionCount;
    if (n > 0) pool = pool.slice(0, n);
    const now = Date.now();
    db.attempts.push({
      id: crypto.randomUUID(),
      studentId: student.id,
      startedAt: now,
      deadline: now + db.settings.durationMin * 60_000,
      questionIds: pool.map((q) => q.id),
      answers: {},
    });
    return "ok";
  });
  if (res === "closed" || res === "empty") redirect("/exam");
  redirect("/exam/test");
}

export async function saveAnswer(questionId: string, answer: string) {
  const student = await requireStudent();
  return updateDb((db) => {
    const a = db.attempts.find((x) => x.studentId === student.id);
    if (!a || isFinished(a)) return { ok: false, reason: "finished" as const };
    if (!a.questionIds.includes(questionId)) return { ok: false, reason: "invalid" as const };
    if (typeof answer !== "string") return { ok: false, reason: "invalid" as const };
    const text = answer.slice(0, 1000);
    if (text.trim()) a.answers[questionId] = text;
    else delete a.answers[questionId];
    return { ok: true as const };
  });
}

/** Imtihon paytidagi qoidabuzarlikni qayd etish */
export async function reportViolation(type: string) {
  const student = await requireStudent();
  const allowed = ["tab", "resize", "devtools", "paste", "copy"] as const;
  const t = allowed.find((x) => x === type);
  if (!t) return 0;
  return updateDb((db) => {
    const a = db.attempts.find((x) => x.studentId === student.id);
    if (!a || isFinished(a)) return 0;
    a.violations ??= [];
    if (a.violations.length < 500) a.violations.push({ type: t, at: Date.now() });
    return a.violations.length;
  });
}

export async function finishExam() {
  const student = await requireStudent();
  updateDb((db) => {
    const a = db.attempts.find((x) => x.studentId === student.id);
    if (a && !a.finishedAt) a.finishedAt = Math.min(Date.now(), a.deadline + GRACE_MS);
  });
  revalidatePath("/admin", "layout");
  redirect("/exam/result");
}

/* ───────────── Admin: o'quvchilar ───────────── */

export async function saveStudent(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id");
  const lastName = str(fd, "lastName");
  const firstName = str(fd, "firstName");
  const phone = str(fd, "phone").replace(/\D/g, "");
  let login = str(fd, "login").toLowerCase();
  let password = str(fd, "password");
  if (!lastName || !firstName) return { error: "Ism va familiyani kiriting" };
  if (phone.length < 9) return { error: "Telefon raqam noto'g'ri" };
  const fullPhone = phone.length === 9 ? `998${phone}` : phone;

  const err = updateDb((db) => {
    const taken = new Set(db.students.filter((s) => s.id !== id).map((s) => s.login.toLowerCase()));
    taken.add(db.settings.adminLogin.toLowerCase());
    if (!login || !password) {
      const gen = makeCredentials(firstName, lastName, fullPhone, taken);
      login ||= gen.login;
      password ||= gen.password;
    }
    if (taken.has(login)) return "Bu login band";
    if (id) {
      const st = db.students.find((s) => s.id === id);
      if (!st) return "O'quvchi topilmadi";
      Object.assign(st, { firstName, lastName, phone: fullPhone, login, password });
    } else {
      db.students.push({
        id: crypto.randomUUID(),
        firstName,
        lastName,
        phone: fullPhone,
        login,
        password,
        createdAt: Date.now(),
      });
    }
    return null;
  });
  if (err) return { error: err };
  revalidatePath("/admin", "layout");
  return { ok: id ? "Saqlandi" : "O'quvchi qo'shildi" };
}

export async function deleteStudent(id: string) {
  await requireAdmin();
  updateDb((db) => {
    db.students = db.students.filter((s) => s.id !== id);
    db.attempts = db.attempts.filter((a) => a.studentId !== id);
  });
  revalidatePath("/admin", "layout");
}

export async function resetAttempt(studentId: string) {
  await requireAdmin();
  updateDb((db) => {
    db.attempts = db.attempts.filter((a) => a.studentId !== studentId);
  });
  revalidatePath("/admin", "layout");
}

/** Admin javobni belgilaydi: true = to'g'ri, false = noto'g'ri, null = belgini olib tashlash */
export async function setMark(studentId: string, questionId: string, value: boolean | null) {
  await requireAdmin();
  updateDb((db) => {
    const a = db.attempts.find((x) => x.studentId === studentId);
    if (!a || !a.questionIds.includes(questionId)) return;
    a.marks ??= {};
    if (value === null) delete a.marks[questionId];
    else a.marks[questionId] = value;
  });
  revalidatePath("/", "layout");
}

/** Yakuniy baho (2–5), null = olib tashlash */
export async function setGrade(studentId: string, grade: number | null) {
  await requireAdmin();
  if (grade !== null && ![2, 3, 4, 5].includes(grade)) return;
  updateDb((db) => {
    const a = db.attempts.find((x) => x.studentId === studentId);
    if (!a) return;
    if (grade === null) delete a.grade;
    else a.grade = grade;
  });
  revalidatePath("/", "layout");
}

/* ───────────── Admin: savollar ───────────── */

export async function saveQuestion(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id");
  const topic = str(fd, "topic");
  const text = str(fd, "text");
  const code = String(fd.get("code") ?? "").replace(/\s+$/, "");
  if (!topic) return { error: "Mavzuni tanlang" };
  if (!text) return { error: "Savol matnini kiriting" };

  updateDb((db) => {
    if (!db.topics.includes(topic)) db.topics.push(topic);
    const data = { topic, text, code: code || undefined };
    if (id) {
      const q = db.questions.find((x) => x.id === id);
      if (q) Object.assign(q, data);
    } else {
      db.questions.push({ id: crypto.randomUUID(), createdAt: Date.now(), ...data });
    }
  });
  revalidatePath("/admin", "layout");
  redirect("/admin/questions");
}

export async function deleteQuestion(id: string) {
  await requireAdmin();
  updateDb((db) => {
    db.questions = db.questions.filter((q) => q.id !== id);
  });
  revalidatePath("/admin", "layout");
}

/* ───────────── Admin: sozlamalar ───────────── */

export async function toggleExam() {
  await requireAdmin();
  updateDb((db) => {
    db.settings.isOpen = !db.settings.isOpen;
  });
  revalidatePath("/", "layout");
}

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const title = str(fd, "title");
  const durationMin = Number(fd.get("durationMin"));
  const questionCount = Number(fd.get("questionCount"));
  const adminLogin = str(fd, "adminLogin").toLowerCase();
  const adminPassword = str(fd, "adminPassword");
  if (!title) return { error: "Imtihon nomini kiriting" };
  if (!Number.isInteger(durationMin) || durationMin < 1 || durationMin > 600)
    return { error: "Davomiylik 1–600 daqiqa oralig'ida bo'lsin" };
  if (!Number.isInteger(questionCount) || questionCount < 0) return { error: "Savollar soni noto'g'ri" };
  if (!adminLogin || adminPassword.length < 4) return { error: "Admin login va parol (kamida 4 belgi) kerak" };

  const err = updateDb((db) => {
    if (db.students.some((s) => s.login.toLowerCase() === adminLogin))
      return "Bu login o'quvchiga tegishli";
    db.settings = {
      ...db.settings,
      title,
      durationMin,
      questionCount,
      isOpen: fd.get("isOpen") === "on",
      shuffleQuestions: fd.get("shuffleQuestions") === "on",
      showScore: fd.get("showScore") === "on",
      showRating: fd.get("showRating") === "on",
      adminLogin,
      adminPassword,
    };
    return null;
  });
  if (err) return { error: err };
  revalidatePath("/", "layout");
  return { ok: "Sozlamalar saqlandi" };
}
