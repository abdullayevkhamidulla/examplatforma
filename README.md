# CSS Imtihon platformasi

Next.js 16 asosidagi yopiq test platformasi: admin panel + o'quvchi paneli.

## Ishga tushirish

```bash
npm install
npm run dev          # http://localhost:3000
# yoki production:
npm run build && npm start
```

Bir tarmoqdagi (Wi‑Fi) o'quvchilar `http://<kompyuter-IP>:3000` orqali kiradi.

## Kirish

- **Admin:** login `Richboy`, parol `Richboy321` (Sozlamalar sahifasida o'zgartirish mumkin)
- **O'quvchilar:** login = familiya (kichik harfda, apostrofsiz), parol = ism + telefonning oxirgi 4 raqami
  - masalan: Akramov Bekzod, +998 93 810-55-40 → `akramov` / `bekzod5540`
  - To'liq ro'yxat: Admin → O'quvchilar (nusxalash yoki chop etish uchun kartochkalar)

## Ma'lumotlar

Hammasi `data/db.json` faylida saqlanadi (birinchi ishga tushganda 19 o'quvchi va 20 savol bilan yaratiladi).
Faylni o'chirsangiz, hammasi boshlang'ich holatga qaytadi. Boshqa joyga saqlash: `DB_PATH=/yo'l/db.json`.
HTTPS orqali ishlatsangiz `COOKIE_SECURE=true` qo'ying.

> Eslatma: fayl bazasi doimiy diskka ega serverda ishlaydi (o'z kompyuteringiz, VPS). Vercel kabi serverless hostingda ma'lumotlar saqlanmaydi.
