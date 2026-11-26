import crypto from "crypto";
import type { DB, Question, Student } from "./types";

export const TOPICS = [
  "CSS ga kirish. Selectors va Specificity",
  "Box model, O'lchamlar va Units",
  "Textlar, Font lar, Rang va Background",
  "overflow",
  "Flexbox part-1: Container xossalari",
  "Flexbox part-2: Items xossalari",
  "Grid Layout",
];

const RAW_STUDENTS = `
Abdug'afforov Muhammad Sodiq — +(998) 90-750-05-09
Adhamov Abdulahad — +(998) 94-275-44-16
Adxamov Obidxon — +(998) 94-244-14-53
Ahmadaliyev Donyorbek — +(998) 93-946-04-54
Ahmadov Abdurahmon — +(998) 90-278-62-63
Ahmedov Muhammadzohir — +(998) 50-201-66-77
Akramov Bekzod — +(998) 93-810-55-40
Bekmirzayev Nodirbek — +(998) 50-708-19-92
Fayzullajonov Islomjon — +(998) 91-177-34-54
Hoshimjanov Abdulaziz — +(998) 93-774-11-55
Komilov Dilshodbek — +(998) 93-527-00-31
Latifhonov Abdulatif — +(998) 93-161-55-51
Luqmonjonov Asilbek — +(998) 93-780-72-71
Mahmudjanov Mirzohid — +(998) 95-158-07-84
Nurmirzayev Habibullo — +(998) 88-188-02-27
Rashidov Bostixon — +(998) 90-754-96-90
Sadriddinov Ziyovuddin — +(998) 91-052-64-94
Sotvoldiyev Shaxbozbek — +(998) 97-573-03-11
Zohidov Abubakr — +(998) 50-199-24-42
`;

/** "Abdug'afforov" -> "abdugafforov" */
export function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[''`ʻʼ‘’]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function makeCredentials(
  firstName: string,
  lastName: string,
  phone: string,
  taken: Set<string>,
) {
  let login = slug(lastName) || "user";
  if (taken.has(login)) login = `${login}.${slug(firstName).slice(0, 3)}`;
  let i = 2;
  const base = login;
  while (taken.has(login)) login = `${base}${i++}`;
  const password = `${slug(firstName.split(" ")[0])}${phone.slice(-4)}`;
  return { login, password };
}

function seedStudents(): Student[] {
  const taken = new Set<string>();
  return RAW_STUDENTS.trim()
    .split("\n")
    .map((line) => {
      const [name, phoneRaw] = line.split("—").map((s) => s.trim());
      const parts = name.split(/\s+/);
      const lastName = parts[0];
      const firstName = parts.slice(1).join(" ");
      const phone = phoneRaw.replace(/\D/g, "");
      const { login, password } = makeCredentials(firstName, lastName, phone, taken);
      taken.add(login);
      return {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        phone,
        login,
        password,
        createdAt: Date.now(),
      };
    });
}

type Q = Omit<Question, "id" | "createdAt">;
const [SEL, BOX, TEXT, OVF, FLEX1, FLEX2, GRID] = TOPICS;

export const DB_VERSION = 3;

const SEED_QUESTIONS: Q[] = [
  // Selectors va Specificity
  {
    topic: SEL,
    text: "id selector qaysi belgi bilan yoziladi?",
  },
  {
    topic: SEL,
    text: "Quyidagi selectorning specificity qiymatini yozing (id, class, element ko'rinishida)",
    code: "div.card > p:first-child",
  },
  {
    topic: SEL,
    text: "h1 dan keyin darhol keladigan bitta qo'shni p elementini tanlaydigan selectorni yozing",
  },
  // Box model
  {
    topic: BOX,
    text: "box-sizing: content-box bo'lganda elementning ekranda egallagan kengligi necha px? (margin hisobga olinmaydi)",
    code: ".box {\n  width: 200px;\n  padding: 20px;\n  border: 5px solid black;\n  margin: 10px;\n}",
  },
  {
    topic: BOX,
    text: "padding va border width ichiga kirishi uchun box-sizing ga qaysi qiymat beriladi?",
  },
  {
    topic: BOX,
    text: "Root (html) elementning font-size iga nisbatan hisoblanadigan o'lchov birligi qaysi?",
  },
  // Text, Font, Color, Background
  {
    topic: TEXT,
    text: "Matn qatorlari orasidagi masofani qaysi xossa belgilaydi?",
  },
  {
    topic: TEXT,
    text: "Matnni markazga tekislaydigan CSS qoidasini to'liq yozing (xossa: qiymat)",
  },
  {
    topic: TEXT,
    text: "Matnni qalin (bold) qilish uchun qaysi xossa ishlatiladi?",
  },
  // overflow
  {
    topic: OVF,
    text: "Sig'magan kontentni kesib, scroll ko'rsatmaslik uchun overflow ga qaysi qiymat beriladi?",
  },
  {
    topic: OVF,
    text: "Scroll faqat kontent sig'maganda paydo bo'lishi uchun overflow ga qaysi qiymat beriladi?",
  },
  // Flexbox container
  {
    topic: FLEX1,
    text: "Flex konteynerda itemlarni main axis bo'ylab markazga joylashtiradigan qoidani yozing (xossa: qiymat)",
  },
  {
    topic: FLEX1,
    text: "Itemlarni ustma-ust (vertikal) joylashtirish uchun flex-direction ga qaysi qiymat beriladi?",
  },
  {
    topic: FLEX1,
    text: "Itemlar sig'masa keyingi qatorga o'tishi uchun konteynerga qaysi qoida yoziladi? (xossa: qiymat)",
  },
  // Flexbox items
  {
    topic: FLEX2,
    text: "Flex itemning order xossasining standart (default) qiymati nechaga teng?",
  },
  {
    topic: FLEX2,
    text: "Faqat bitta flex itemni cross axis bo'ylab boshqacha joylashtirish uchun qaysi xossa ishlatiladi?",
  },
  {
    topic: FLEX2,
    text: "Flex itemning bo'sh joyni egallab o'sishini qaysi xossa belgilaydi?",
  },
  // Grid
  {
    topic: GRID,
    text: "3 ta teng kenglikdagi ustun yaratish uchun grid-template-columns ga qanday qiymat beriladi?",
  },
  {
    topic: GRID,
    text: "Quyidagi grid item nechta ustunni egallaydi? (faqat raqam yozing)",
    code: ".item {\n  grid-column: 1 / 3;\n}",
  },
  {
    topic: GRID,
    text: "Grid yoki flex itemlar orasidagi masofani qaysi xossa belgilaydi?",
  },
];

export function seedQuestions(): Question[] {
  return SEED_QUESTIONS.map((q, i) => ({ ...q, id: crypto.randomUUID(), createdAt: Date.now() + i }));
}

export function createSeed(): DB {
  return {
    version: DB_VERSION,
    secret: crypto.randomBytes(32).toString("hex"),
    settings: {
      title: "CSS bo'yicha imtihon",
      durationMin: 30,
      questionCount: 0,
      isOpen: false,
      shuffleQuestions: true,
      showScore: true,
      showRating: true,
      // Deploy qilganda ADMIN_LOGIN va ADMIN_PASSWORD muhit o'zgaruvchilarini o'rnating
      adminLogin: (process.env.ADMIN_LOGIN || "admin").toLowerCase(),
      adminPassword: process.env.ADMIN_PASSWORD || "admin123",
    },
    topics: [...TOPICS],
    students: seedStudents(),
    questions: seedQuestions(),
    attempts: [],
  };
}
