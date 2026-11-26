"use client";

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Brauzer ovozga ruxsat berishi uchun birinchi bosish/klavishda chaqiriladi */
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

/** Baland ogohlantiruvchi signal (sirena) */
export function alarm(duration = 1.6) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  const now = c.currentTime;
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.5, now + 0.03);
  gain.gain.setValueAtTime(0.5, now + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  gain.connect(c.destination);
  const osc = c.createOscillator();
  osc.type = "square";
  // 880 Hz va 660 Hz almashinib turadi
  for (let t = 0; t < duration; t += 0.2) {
    osc.frequency.setValueAtTime(Math.round(t / 0.2) % 2 ? 660 : 880, now + t);
  }
  osc.connect(gain);
  osc.start(now);
  osc.stop(now + duration);
}
