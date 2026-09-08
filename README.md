# ISH BOR! — ish qidirish platformasi

O'zbekiston uchun ish izlovchi ↔ ish beruvchi platformasi. hh.uz tahlili asosida
loyihalangan (to'liq loyihalash hujjati: [`tizim-arxitekturasi.md`](./tizim-arxitekturasi.md)).

Uch tilda ishlaydi (o'zbek / rus / ingliz), sahifalar server tomonda render
qilinadi (SSR) — shuning uchun har bir vakansiya, kompaniya va maosh sahifasi
Google va Telegram preview botlari uchun tayyor meta-teglar bilan keladi.

---

## Tarkib

| Papka | Nima |
|---|---|
| `apps/api` | Node.js + Fastify + Prisma + MongoDB. Barcha biznes-mantiq va API. |
| `apps/web` | Vite + Vike (SSR) + React 18 + TypeScript + Tailwind. Sayt. |
| `DEPLOY.md` | Vercel + Railway + MongoDB Atlas ga chiqarish qo'llanmasi. |
| `tizim-arxitekturasi.md` | Kodlashdan oldingi to'liq loyihalash hujjati. |
| `docker-compose.yml` | Mahalliy MongoDB (replica set) va (ixtiyoriy) Meilisearch. |
| `scripts/` | Playwright bilan qo'lda tekshirish skriptlari. |

---

## Tezkor boshlash

### 1. Baza

Loyiha **MongoDB** da ishlaydi. Prisma tranzaksiyalari **replica set** talab
qiladi, shuning uchun oddiy bitta `mongod` yetmaydi. Ikki yo'l bor:

**A) MongoDB Atlas (eng oson, Docker kerak emas).**
[cloud.mongodb.com](https://cloud.mongodb.com) da bepul M0 klaster oching va
ulanish satrini `.env` ga qo'ying. Dev uchun ham shu yetarli.

**B) Docker bilan mahalliy.**

```bash
docker compose up -d
docker compose exec mongo mongosh --eval "rs.initiate()"   # bir marta
```

Ulanish satri:
`mongodb://localhost:27017/ishbor?replicaSet=rs0&directConnection=true`

### 2. Backend

```bash
cd apps/api
cp .env.example .env      # ichidagi izohlarni o'qing
npm install               # postinstall o'zi `prisma generate` qiladi
npm run prisma:push       # kolleksiya va indekslarni yaratadi
npm run prisma:seed       # namunaviy ma'lumot (ixtiyoriy)
npm run dev
```

API `http://localhost:3000` da ko'tariladi.
Tekshirish: `GET /health` → `{"ok":true,"db":"up"}`.

### 3. Frontend

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

Sayt `http://localhost:5173` da ochiladi.

> Ildizdan turib ham boshqarish mumkin: `npm run install:all`, `npm run dev:api`,
> `npm run dev:web`, `npm run build`, `npm run typecheck`, `npm run db:push`.

### 4. Admin hisobi

`apps/api/.env` ga qo'ying:

```
ADMIN_EMAIL="siz@example.uz"
ADMIN_PASSWORD="kamida-8-belgi"
```

Server keyingi ko'tarilishida shu hisobni **admin** roli bilan yaratadi (yoki
mavjud foydalanuvchini adminga ko'taradi). Parol hech qachon qayta yozilmaydi.
Admin panel: `/admin`.

---

## Nima ishlaydi

### Ish izlovchi
- Ro'yxatdan o'tish / kirish: email+parol, **Telegram orqali**, **Google orqali**
- Vakansiya qidiruvi: matn, kasb, hudud, tajriba, bandlik turi, maosh oralig'i
- Saralash: mosligi / yangiligi / maosh bo'yicha
- **Saqlangan vakansiyalar** (yurakcha) — `/favorites`
- **Qidiruv obunalari**: so'rovni saqlab qo'yasiz, mos vakansiya chiqsa xabar keladi — `/alerts`
- **Bildirishnomalar**: sayt ichida, Telegram, brauzer push, email — `/notifications`
- Saytda to'ldiriladigan rezyume (tajriba, ta'lim, ko'nikmalar) + PDF yuklash
- Ariza yuborish, holatini kuzatish
- Ish beruvchi bilan real-time chat, o'zaro 5 yulduzli baho
- Kompaniyaga sharh qoldirish (faqat ariza yuborganlar)
- **Maosh statistikasi** — kasb va hudud kesimida mediana/o'rtacha, taqsimot — `/salaries`

### Ish beruvchi
- Kompaniya profili, logotip, hudud, soha
- Vakansiya joylash, **tahrirlash**, arxivlash, o'chirish
- Kelgan arizalar: holat o'zgartirish (ko'rildi / taklif / rad / qabul) + sabab
- Nomzodlar bazasidan qidiruv (Standart va Premium tariflarda)
- **Tariflar va to'lov**: Payme / Click orqali yoki admin tasdig'i bilan — `/pricing`
- Faol vakansiya limiti tarif bo'yicha avtomatik nazorat qilinadi

### Admin
- `/admin` — ko'rsatkichlar, 14 kunlik dinamika (ro'yxatdan o'tish / arizalar)
- `/admin/users` — qidiruv, bloklash, rol berish
- `/admin/vacancies` — moderatsiya: tasdiqlash, rad etish (sabab bilan), arxivlash, premium
- `/admin/companies` — tasdiqlangan ish beruvchi belgisi
- `/admin/reviews` — sharhlar moderatsiyasi
- `/admin/payments` — to'lovlar, qo'lda tasdiqlash
- Xizmat amallari: qidiruv indeksini qayta qurish, obunalarni tekshirish, ommaviy xabar

### SEO
- Har sahifada unikal `<title>`, `description`, canonical, OG teglar, uch tilli `hreflang`
- Vakansiya sahifalarida JSON-LD (`JobPosting`)
- `robots.txt` — shaxsiy bo'limlar (profil, xabarlar, saqlanganlar, obunalar, admin) uch tilda taqiqlangan
- `sitemap.xml` → `sitemap-static.xml` (kasb va hudud kesimidagi maosh sahifalari bilan), `sitemap-vacancy.xml`, `sitemap-employer.xml`
- Ijtimoiy tarmoq uchun har bir vakansiyaga **dinamik OG rasm**: `/api/og/vacancy/:slug`

---

## Ixtiyoriy xizmatlar

Loyiha ularsiz ham to'liq ishlaydi. `.env` da kalit paydo bo'lishi bilan
tegishli funksiya o'z-o'zidan yoqiladi.

| Xizmat | `.env` kaliti | Yo'q bo'lsa nima bo'ladi |
|---|---|---|
| Telegram bot | `TELEGRAM_BOT_TOKEN` | Telegram orqali kirish, telefon tasdiqlash va Telegram xabarnomalari o'chiq |
| Google kirish | `GOOGLE_CLIENT_ID` | Google tugmasi ko'rinmaydi |
| Email | `SMTP_HOST` va h.k. | Xatlar yuborilmaydi, konsolga yoziladi |
| Brauzer push | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Push o'chiq (`npm run push:keys` bilan kalit yaratiladi) |
| Meilisearch | `MEILI_HOST` | Qidiruv MongoDB orqali ishlaydi |
| Payme / Click | `PAYME_*`, `CLICK_*` | To'lov "qo'lda tasdiqlash" rejimida: yozuv yaratiladi, admin tasdiqlaydi |

### Qidiruv haqida

Qidiruv ikki drayverli:

1. **MongoDB** (default) — qo'shimcha xizmat kerak emas. So'rov so'zlarga
   bo'linadi va har bir so'z sarlavha / tavsif / talablar / kompaniya nomi /
   kategoriya ichida uchrashi talab qilinadi (AND mantiq).
2. **Meilisearch** (`MEILI_HOST` berilsa) — xato yozilishga chidamli
   ("dasturchu" → "dasturchi"), tezroq, relevantlik bo'yicha saralaydi.

Meilisearch ko'tarilmasa yoki so'rov paytida xato bersa, kod jimgina MongoDB
drayveriga tushadi — sayt hech qachon "qidiruv ishlamayapti" holatiga tushmaydi.
Qaysi drayver ishlayotganini `/admin` sahifasida ko'rish mumkin.

### Bildirishnomalar haqida

Barcha bildirishnomalar bitta nuqtadan o'tadi (`notify()` xizmati) va
foydalanuvchining sozlamasiga qarab kanallarga tarqaladi:

- **Saytda** — bazaga yoziladi, sayt ochiq bo'lsa WebSocket orqali darrov keladi
- **Telegram** — bot bog'langan bo'lsa
- **Brauzer push** — obuna bo'lgan bo'lsa
- **Email** — SMTP sozlangan bo'lsa

Foydalanuvchi har bir hodisa turi uchun har bir kanalni alohida yoqib/o'chira
oladi: `/notifications` → «Sozlamalar».

---

## Deploy: Vercel + Railway + MongoDB Atlas

Bosqichma-bosqich qo'llanma — [`DEPLOY.md`](./DEPLOY.md). Qisqacha:

| Qism | Qayerda | Root Directory | Sozlama fayli |
|---|---|---|---|
| Sayt (SSR) | Vercel | `apps/web` | `apps/web/vercel.json` |
| API | Railway | `apps/api` | `apps/api/railway.json` |
| Baza | MongoDB Atlas (M0) | — | — |

Ikkala sozlama fayli repozitoriyda tayyor — dashboard'da faqat Root Directory
va muhit o'zgaruvchilarini kiritish qoladi.

Eng ko'p unutiladigan ikki narsa:

- Railway'da **`NODE_ENV=production`** — seans cookie'si aynan shunda
  `SameSite=None; Secure` bo'ladi. Sayt va API har xil domenda bo'lgani uchun
  busiz foydalanuvchi har sahifa yangilanishida tizimdan chiqib ketadi.
- Railway'da **`WEB_ORIGIN`** — Vercel bergan domen. CORS shundan ochiladi.

---

## O'z serveringizda ishga tushirish

Ikkita jarayon: API va sayt.

```bash
npm run build                  # ikkala ilova

# 1) API
cd apps/api && npm start                                   # :3000  (prestart o'zi `db push` qiladi)

# 2) Sayt
cd apps/web && npm start                                   # :3001
```

`apps/web/server/index.mjs` — saytning production serveri (Fastify + Vike SSR).
U uchta ishni bajaradi:

- **siqish** — brotli/gzip (SSR HTML ~25 KB dan ~6 KB ga tushadi);
- **kesh** — `/assets/**` bir yil `immutable` (nomida kontent hash'i bor),
  `sw.js` keshlanmaydi, qolgan statik fayllar bir hafta;
- **HTML uchun `no-cache`** (`no-store` EMAS) — brauzer sahifani saqlaydi,
  «orqaga» tugmasi bfcache'dan darrov ochadi.

Portni `PORT` bilan o'zgartirasiz: `PORT=8080 npm start`.

> `npm run preview` (`vike preview`) faqat build'ni tez ko'zdan kechirish uchun —
> Vike o'zi «prod'da ishlatmang» deb ogohlantiradi: u siqmaydi va HTML'ga
> `no-store` qo'yib bfcache'ni o'chiradi.

Reverse-proxy (nginx/caddy) ortiga qo'ysangiz, HTTPS va `WEB_ORIGIN` ni
haqiqiy domenga moslang — `apps/api` CORS va CSP shundan oladi.

---

## Foydali buyruqlar

```bash
# Tiplarni tekshirish (ikkala ilova)
npm run typecheck

# Production build
npm run build

# Sxema o'zgartirilgandan keyin bazaga qo'llash (MongoDB'da migratsiya yo'q)
npm run db:push

# Bazani brauzerda ko'rish
npm run db:studio

# Brauzer push uchun VAPID kalitlari
npm run push:keys

# Obuna xabarnomalarini bir marta tekshirish (cron uchun)
npm run alerts:run

# Deploydan oldingi uchdan-uchgacha tekshiruv (alohida TEST bazasi kerak)
npm run build
E2E_DATABASE_URL="mongodb+srv://.../ishbor_test" npm run test:e2e

# Shrift fayllarini @fontsource-variable dan public/fonts ga yangilash
npm --prefix apps/web run fonts:sync

# Logo o'lchamlarini public/logo.png dan qayta chiqarish (sharp kerak)
cd apps/web && npm i -D sharp && node scripts/build-logos.mjs
```

---

## Texnologiyalar

**Backend:** Node.js 20+, Fastify 4, Prisma 5, MongoDB 6+, Zod, argon2, JWT
(access + httpOnly refresh cookie), `@fastify/websocket`, satori + resvg (OG
rasmlar), nodemailer, web-push, meilisearch.

**Frontend:** Vite 5, Vike (SSR), React 18, TypeScript 5, Tailwind CSS 3,
self-hosted variable shriftlar (Inter / Space Grotesk / JetBrains Mono).

**Xavfsizlik:** helmet (CSP, HSTS, COOP), CORS, rate-limit (login/register uchun
qattiqroq chegara), telefon tasdig'i talab qilinadigan amallar (ariza, vakansiya,
xabar, sharh), admin bloklagan hisob seans ocha olmaydi.
