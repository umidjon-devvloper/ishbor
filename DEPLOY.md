# Deploy qo'llanmasi

Arxitektura:

```
  Brauzer
     │
     ├──── HTML (SSR) ─────►  Vercel        apps/web   (Vike + React)
     │                            │
     │                            └── /robots.txt, /sitemap*.xml → API'ga proxy
     │
     └──── API + WebSocket ►  Railway       apps/api   (Fastify + Prisma)
                                  │
                                  └──────►  MongoDB Atlas
```

Uchta xizmat mustaqil: har biri alohida deploy bo'ladi va bir-birini faqat
manzil (URL) orqali biladi.

---

## 1. MongoDB Atlas

1. [cloud.mongodb.com](https://cloud.mongodb.com) da bepul **M0** klaster yarating.
2. **Database Access** → yangi foydalanuvchi (`readWrite` huquqi bilan).
3. **Network Access** → `0.0.0.0/0` qo'shing (Railway IP'lari o'zgaruvchan).
   Xohlasangiz keyinroq Railway'ning statik IP'si bilan toraytirasiz.
4. **Connect → Drivers → Node.js** dan ulanish satrini oling va oxiriga baza
   nomini yozing:

   ```
   mongodb+srv://user:parol@cluster0.xxxxx.mongodb.net/ishbor?retryWrites=true&w=majority
   ```

> **Nega aynan Atlas?** Prisma tranzaksiyalari (ariza holati, to'lov
> tasdiqlash, rezyume saqlash) MongoDB **replica set** talab qiladi. Atlas'da
> u sukut bo'yicha bor; bitta oddiy `mongod` da yo'q.

Parolda `@ : / ?` kabi belgilar bo'lsa ularni URL-encode qiling
(`@` → `%40`), aks holda ulanish satri buziladi.

---

## 2. Backend — Railway

### Xizmat yaratish

1. [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**.
2. Xizmat sozlamalarida **Root Directory** ni `apps/api` qilib qo'ying.
   Qolganini `apps/api/railway.json` o'zi aytadi (build, start, healthcheck).
3. **Settings → Networking → Generate Domain** — API manzilini olasiz.

### Variables

`apps/api/.env.example` dagi ro'yxat. Eng kami:

| O'zgaruvchi | Qiymat |
|---|---|
| `DATABASE_URL` | Atlas ulanish satri |
| `JWT_ACCESS_SECRET` | tasodifiy satr (≥8 belgi) |
| `JWT_REFRESH_SECRET` | boshqa tasodifiy satr |
| `NODE_ENV` | `production` |
| `WEB_ORIGIN` | Vercel domeni, masalan `https://ishbor.vercel.app` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | birinchi admin hisobi |

Kalit yaratish:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> `PORT` ni **qo'lda kiritmang** — Railway uni o'zi beradi.
>
> `NODE_ENV=production` **majburiy**: seans cookie'si aynan shu holatda
> `SameSite=None; Secure` bo'ladi. Busiz Vercel'dagi sayt Railway'dagi API'ga
> cookie yubora olmaydi va foydalanuvchi har sahifa yangilanishida
> tizimdan chiqib ketadi.

### Fayl yuklashlar uchun Volume

Railway konteynerining diski har deployda tozalanadi — kompaniya logolari va
PDF rezyumelar yo'qoladi. Buning oldini olish uchun:

1. Xizmatga **Volume** qo'shing, Mount path: `/data`.
2. `UPLOAD_DIR=/data/uploads` o'zgaruvchisini qo'shing.

### Bir nusxa (replica) cheklovi

`railway.json` da `numReplicas: 1`. Buni oshirmang: Telegram boti
long-polling'da ishlaydi (ikkita nusxa Telegram'dan 409 xatosi oladi) va obuna
xabarnomalari jadvali ham jarayon ichida yuradi (xabarlar ikki marta ketardi).
Gorizontal kengaytirish kerak bo'lsa bu ikkalasini alohida "worker" xizmatga
ajratish kerak.

### Baza indekslari

`npm start` dan oldin `prisma db push` avtomatik ishlaydi (`prestart`) —
kolleksiya va indekslar har deployda tekshiriladi. Alohida buyruq kerak emas.

### Demo ma'lumot (ixtiyoriy)

```bash
railway run npm run prisma:seed
```

---

## 3. Frontend — Vercel

1. [vercel.com](https://vercel.com) → **Add New → Project** → repozitoriyni tanlang.
2. **Root Directory**: `apps/web`.
3. Build sozlamalari `apps/web/vercel.json` da yozilgan (build buyrug'i,
   `dist/client` chiqish papkasi, SSR funksiyasi, rewrites, sarlavhalar) —
   dashboard'da qo'lda hech narsa o'zgartirish shart emas.
4. **Environment Variables**:

   | O'zgaruvchi | Qiymat |
   |---|---|
   | `VITE_API_URL` | Railway API manzili, oxirida `/` **bo'lmasin** |
   | `VITE_SITE_URL` | Saytning o'z manzili (Vercel domeni yoki o'z domeningiz) |
   | `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (ixtiyoriy) |

   `VITE_API_URL` ikki joyda kerak: build paytida (brauzer kodiga yoziladi) va
   ishlash paytida (`api/seo.js` robots/sitemap'ni API'dan oladi). Shuning
   uchun uni **Production, Preview va Development** — uchalasiga ham qo'ying.

   `VITE_SITE_URL` — canonical, `hreflang` va `og:url` shundan quriladi.
   Noto'g'ri bo'lsa har sahifa "asl nusxam boshqa saytda" deb aytadi va Google
   haqiqiy saytni indeksga olmaydi. Birinchi deploydan keyin Vercel bergan
   domenni shu yerga yozib, qayta build qiling (bu qiymat build paytida
   kodga yoziladi).

### Deploydan keyin Railway'ni yangilang

Vercel domenini olgach, Railway'da `WEB_ORIGIN` ni o'sha manzilga o'zgartiring
va xizmatni qayta ishga tushiring. Aks holda CORS saytni bloklaydi.

O'z domeningiz bo'lsa:

```
WEB_ORIGIN=https://ishbor.uz
CORS_EXTRA_ORIGINS=https://www.ishbor.uz
```

---

## 4. Tekshirish ro'yxati

### Avtomatik tekshiruv (tavsiya etiladi)

Atlas'da ikkinchi, **test** bazasini oching (masalan `ishbor_test`) va
deploydan oldin bir marta ishga tushiring:

```bash
npm run build
E2E_DATABASE_URL="mongodb+srv://user:parol@cluster/ishbor_test" npm run test:e2e
```

Skript API'ni haqiqiy MongoDB ustida ko'taradi va ~20 ta oqimni tekshiradi:
ro'yxatdan o'tish, seans cookie'sining `SameSite=None; Secure` bo'lishi,
vakansiya joylash, ariza, chat, sharh, admin paneli, CORS, sitemap, OG rasm,
tarif limiti. Baza nomida "test" bo'lmasa skript ishlashdan bosh tortadi —
u bazani tozalaydi.

### Qo'lda tekshirish

```bash
# 1. API tirikmi va bazani ko'ryaptimi
curl https://<api>.up.railway.app/health
# kutilgan: {"ok":true,"db":"up"}

# 2. Ma'lumot keladimi
curl https://<api>.up.railway.app/api/stats

# 3. robots.txt SAYT domenida ochiladimi
curl https://<sayt>.vercel.app/robots.txt

# 4. Sitemap ichidagi havolalar sayt domeniga ishora qiladimi
curl https://<sayt>.vercel.app/sitemap-vacancy.xml | head
```

Brauzerda:

- [ ] Bosh sahifa ochiladi, vakansiyalar ko'rinadi (SSR — sahifa manbasida HTML bor).
- [ ] Ro'yxatdan o'ting, chiqing, qayta kiring.
- [ ] **Sahifani yangilang — tizimda qolasizmi?** Yo'q bo'lsa: `NODE_ENV=production`
      qo'yilmagan yoki `WEB_ORIGIN` noto'g'ri.
- [ ] Ish beruvchi bo'lib kompaniya yarating va logo yuklang (Volume tekshiruvi).
- [ ] Chat oching — xabar real vaqtda keladimi (WebSocket `wss://` orqali).
- [ ] `ADMIN_EMAIL` bilan kirib `/admin` panelini oching.

---

## 5. Ko'p uchraydigan muammolar

**"Sahifani yangilaganda tizimdan chiqib ketyapman"**
Railway'da `NODE_ENV=production` yo'q. Refresh cookie `SameSite=Lax` bo'lib
qolgan va cross-site so'rovda yuborilmayapti.

**Brauzer konsolida CORS xatosi**
Railway'dagi `WEB_ORIGIN` sayt manziliga to'liq mos emas. Protokol va domen
aynan bir xil bo'lishi kerak (`https://`, `www` bor/yo'qligi ham muhim).

**`P2010` / "Transactions are not supported"**
`DATABASE_URL` replica set'siz MongoDB'ga ishora qilyapti. Atlas ishlating.

**"DATABASE_URL: MongoDB ulanish satri bo'lishi kerak"**
Eski PostgreSQL ulanish satri qolib ketgan. `mongodb://` yoki `mongodb+srv://`
bilan boshlanadigan Atlas satrini qo'ying (mahalliy `apps/api/.env` ni ham
yangilashni unutmang).

**Railway deploy `prisma db push` da yiqilyapti**
Atlas **Network Access** da `0.0.0.0/0` yo'q yoki ulanish satridagi parol
noto'g'ri/URL-encode qilinmagan.

**Vercel'da 404: NOT_FOUND**
Root Directory `apps/web` qilib qo'yilmagan — `vercel.json` topilmagan.

**Yuklangan logolar deploydan keyin yo'qolyapti**
Volume ulanmagan yoki `UPLOAD_DIR` Volume mount path'iga qo'yilmagan.

**Telegram bot 409 `Conflict: terminated by other getUpdates`**
API bir nechta nusxada ishlayapti. `numReplicas` ni 1 ga qaytaring.
