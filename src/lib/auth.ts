import crypto from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readDb } from "./db";

export type Session = { role: "admin" } | { role: "student"; id: string };

const COOKIE = "exam_session";

function sign(data: string) {
  return crypto.createHmac("sha256", readDb().secret).update(data).digest("base64url");
}

export async function setSession(s: Session) {
  const data = Buffer.from(JSON.stringify({ ...s, iat: Date.now() })).toString("base64url");
  (await cookies()).set(COOKIE, `${data}.${sign(data)}`, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
    secure: process.env.COOKIE_SECURE === "true",
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [data, sig] = raw.split(".");
  if (!data || !sig) return null;
  const expected = Buffer.from(sign(data));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const s = JSON.parse(Buffer.from(data, "base64url").toString()) as Session;
    if (s.role === "student" && !readDb().students.some((st) => st.id === s.id)) return null;
    return s;
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const s = await getSession();
  if (s?.role !== "admin") redirect("/");
}

export async function requireStudent() {
  const s = await getSession();
  if (s?.role !== "student") redirect("/");
  const student = readDb().students.find((st) => st.id === s.id);
  if (!student) redirect("/");
  return student;
}
