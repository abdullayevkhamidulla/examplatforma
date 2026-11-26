import fs from "fs";
import path from "path";
import { createSeed, DB_VERSION, seedQuestions } from "./seed";
import type { DB } from "./types";

const DB_PATH = process.env.DB_PATH || path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "db.json");

function save(db: DB) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const tmp = `${DB_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

/** Har safar fayldan o'qiladi — ma'lumot kichik, keshlash muammolari bo'lmaydi. */
export function readDb(): DB {
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeed();
    save(seed);
    return seed;
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, "utf8")) as DB;
  const version = db.version ?? 1;
  if (version < DB_VERSION) {
    if (version < 2) {
      // v1 (variantli test) -> yozma javob: o'quvchilar va sozlamalar saqlanadi
      db.questions = seedQuestions();
      db.attempts = [];
    }
    // v3: to'g'ri javoblar saqlanmaydi, baholashni faqat admin qiladi
    for (const q of db.questions) delete (q as { answers?: unknown }).answers;
    for (const a of db.attempts) {
      const old = a as { overrides?: Record<string, boolean> };
      if (old.overrides) a.marks = { ...old.overrides, ...a.marks };
      delete old.overrides;
    }
    const st = db.settings as { shuffleOptions?: boolean; showAnswers?: boolean };
    delete st.shuffleOptions;
    delete st.showAnswers;
    db.version = DB_VERSION;
    save(db);
  }
  return db;
}

/** Sinxron o'qish-o'zgartirish-yozish: bitta jarayonda poyga holati bo'lmaydi. */
export function updateDb<T>(fn: (db: DB) => T): T {
  const db = readDb();
  const result = fn(db);
  save(db);
  return result;
}
