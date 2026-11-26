export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string; // faqat raqamlar: 998907500509
  login: string;
  password: string;
  createdAt: number;
};

export type Question = {
  id: string;
  topic: string;
  text: string;
  code?: string;
  createdAt: number;
};

export type Settings = {
  title: string;
  durationMin: number;
  questionCount: number; // 0 = barcha savollar
  isOpen: boolean;
  shuffleQuestions: boolean;
  showScore: boolean;
  showRating?: boolean; // baholangandan keyin reytingni o'quvchilarga ko'rsatish (default: true)
  adminLogin: string;
  adminPassword: string;
};

export type Attempt = {
  id: string;
  studentId: string;
  startedAt: number;
  deadline: number;
  finishedAt?: number;
  questionIds: string[];
  answers: Record<string, string>; // qid -> o'quvchi yozgan javob
  marks?: Record<string, boolean>; // qid -> admin belgisi: true = to'g'ri, false = noto'g'ri
  grade?: number; // admin qo'ygan yakuniy baho (2–5)
  violations?: Violation[]; // imtihon paytidagi qoidabuzarliklar
};

export type ViolationType = "tab" | "resize" | "devtools" | "paste" | "copy";
export type Violation = { type: ViolationType; at: number };

export type DB = {
  version: number;
  secret: string;
  settings: Settings;
  topics: string[];
  students: Student[];
  questions: Question[];
  attempts: Attempt[];
};
