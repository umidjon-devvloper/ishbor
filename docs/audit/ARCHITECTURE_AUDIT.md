# ARCHITECTURE AUDIT — ISH BOR! (2026-09-14)

Audit maqsadi: platforma ~10 000 ro'yxatdan o'tgan foydalanuvchi, minglab kompaniya,
o'n minglab ariza va yuz minglab bildirishnoma/xabar bilan ishlaganda barqaror, tezkor,
xavfsiz va maintainable bo'lishi. Bu **concurrent load test emas** — arxitektura, DB,
API va frontend'ning katta hajmdagi ma'lumot bilan ishlash qobiliyati auditi.

Hujjatlar to'plami:
- `ARCHITECTURE_AUDIT.md` (shu fayl) — PHASE 0/1 discovery, arxitektura xulosalari
- `maps/ROUTE_MAP.md`, `maps/API_MAP.md`, `maps/DB_MAP.md`, `maps/DATA_INTEGRITY.md` — PHASE 1 xaritalar
- `ISSUES.md` — topilgan muammolar (ID, severity, holat)
- `DECISIONS.md` — qabul qilingan qarorlar (Decision/Context/Evidence/Choice/Alternatives/Why/Risk/Result)
- `FINAL_AUDIT.md` — yakuniy hisobot

---

## PHASE 0 — MEMORY / DOCUMENTATION DISCOVERY

### 0.1 Topilgan va o'qilgan `.md` fayllar (repo ichida 5 ta)

| Fayl | Hajm | Mazmuni | Dolzarbligi |
|---|---|---|---|
| `README.md` | 10 KB | Tezkor boshlash, funksiyalar ro'yxati, ixtiyoriy xizmatlar, deploy qisqacha, texnologiyalar | Asosan dolzarb; **lekin** "Nomzodlar bazasidan qidiruv (Standart va Premium tariflarda)", "Tariflar va to'lov — /pricing", "Faol vakansiya limiti tarif bo'yicha" bandlari **eskirgan** (product rule: platforma bepul, limit yo'q) |
| `CHANGELOG.md` | 19 KB | 0.2.0 (2026-08-25), 0.2.1 (08-26), 0.3.0 (08-29): PostgreSQL→MongoDB ko'chish, unique indekslar, IDOR fix (`/api/vacancies/:id/applications`), cookie SameSite, rate-limit trustProxy, e2e skript | Dolzarb tarix; 0.3.0 dan keyingi (sentabr) ishlar CHANGELOG'da yo'q — ular `DESIGN.md` da |
| `DEPLOY.md` | 8 KB | Vercel (web) + Railway (api) + Atlas; env ro'yxati; Volume; bitta replica cheklovi (Telegram long-polling, alerts scheduler); tekshiruv ro'yxati | Dolzarb |
| `tizim-arxitekturasi.md` | 36 KB | Kodlashdan oldingi loyihalash hujjati (hh.uz tahlili, stack, DB sxemasi, API, SEO, notification, monetizatsiya, roadmap) + 19-bo'lim "Amalga oshirilgan holat (2026-08-25)" | Tarixiy; PostgreSQL/Redis/BullMQ/Socket.io deb yozilgan — amalda MongoDB, Redis yo'q, queue yo'q, WS `@fastify/websocket`. Faylning o'zi shuni 0.3.0 eslatmasida aytadi. §14: "to'lov MVP'da yo'q, sxema qoladi; is_premium faqat admin qo'lda" — hozirgi product rule bilan mos |
| `apps/web/DESIGN.md` | 62 KB | Dizayn tizimi "Osmon indigo v3" + 2026-09-11…14 dagi HAR BIR qayta ishlangan sahifaning spetsifikatsiyasi (marshrutlar, API kontraktlari, URL holati, holatlar, responsive qoidalar, tuzoqlar) | **Eng yangi source of truth** frontend uchun. Ichida backend tuzatishlari ham yozilgan (moderatsiyani chetlab o'tish 409, 402 limit olib tashlangan, `/pricing`→`/employer`) |

Repo tashqarisidagi memory (`~/.claude/.../memory/`): dev muhit (lokal Mongo replica-set 27018/rs0, Docker yo'q, `prisma db push`), demo ma'lumotlar (`@demo.ish.top` hisoblari, `ism@email.com`, `db:demo --for`), demo qamrovi talabi (har bo'lim to'la bo'lsin, demo data o'zgartirilmasin).

`docs/` papkasi va oldingi audit hujjatlari **yo'q edi** — `docs/audit/` shu auditda yaratildi.

### 0.2 Hujjatlardan chiqarilgan amaldagi product rules

1. Platforma **bepul**; faol vakansiya limiti **yo'q** (DESIGN.md §Vakansiyalarim: "402 PLAN_LIMIT_REACHED olib tashlandi"; `billing.service.ts` da `assertCanPostVacancy` o'chirilgan; e2e "4- va 10-faol vakansiya 201").
2. `/pricing` → 302 `/employer` (`pages/pricing/+guard.ts`). Header/footer'da tariflar havolasi yo'q.
3. Vakansiya: **kategoriya majburiy**, **ish joylashuvi (`workplaceType`: office/hybrid/remote) majburiy**, **hudud** office/hybrid'da majburiy, remote'da ixtiyoriy (`vacancies.rules.ts`, yaratish va tahrirlashda yakuniy qiymatlar bo'yicha).
4. Eski yozuvlarda `workplaceType` `null` bo'lishi mumkin — frontend `employmentType === "remote"` bo'lsa masofaviy deb ko'rsatadi, aks holda ko'rsatmaydi (backward compatible).
5. Moderatsiya: ish beruvchi vakansiyani darhol `active` qiladi (moderatsiya yo'q); admin `rejected`/`archived` qila oladi; ish beruvchi faqat `active↔archived`, `draft→active` (`409` boshqa hollarda).
6. Kalit amallar (ariza, vakansiya joylash, chat boshlash, sharh) — Telegram orqali tasdiqlangan telefon talab qiladi (`requirePhoneVerified`).
7. Sharh: faqat shu kompaniyaga ariza yuborgan nomzod, darhol `approved`, admin keyin o'chira oladi.
8. Nomzod avatar menyusi tartibi, akkaunt sahifalari `noindex`, `robots.txt` da yopiq.
9. Kontent jamoasi (`content_editor`, `content_author`) faqat taklif orqali; `requireStaff` bazadan tekshiradi.
10. "Ma'lumot bor — ko'rsatiladi, yo'q — blok chiqmaydi": to'qima ma'lumot, soxta holat yo'q.
11. Sana formatlash: `lib/format.ts` `formatDate` (Asia/Tashkent) — `toLocaleDateString("uz")` taqiqlangan (SSR hydration).
12. Tailwind: `font-medium/semibold/bold/extrabold` (font-500/600 ishlamaydi).

### 0.3 Ma'lum qarorlar / oldingi tuzatishlar (hujjatlardan)

- IDOR: `GET /api/vacancies/:id/applications` egalik tekshiruvi qo'shilgan (0.3.0).
- Email normalizatsiya (lowercase), refresh cookie `SameSite=None; Secure` prod'da, `trustProxy`, healthcheck DB ping.
- MongoDB'da unique indeks `null`larni teng deb biladi → `telegramChatId` unique emas, `Payment.transactionId` majburiy.
- `Application(vacancyId, jobSeekerId)`, `CompanyReview(companyId, userId)` unique.
- Kompaniyalar katalogi: aggregation + keyset cursor; kodning o'zida "10 minglab kompaniyada denormalizatsiya keyingi qadam" deb yozilgan.
- `/api/companies` ilgari chegarasiz edi → 100 → endi cursor.
- Vakansiya ro'yxati `sort` oxirida `id` (barqaror sahifalash).

### 0.4 Ma'lum kamchiliklar (hujjatlarda ochiq yozilgan)

- Parolni tiklash oqimi **yo'q** ("Parolni unutdingizmi" → `/support`; FAQ: Telegram orqali kirish yoki `/contact`).
- Parolni almashtirish / hisobni o'chirish API'si yo'q.
- Ish beruvchi rasm (`images`) yuklay olmaydi (maydon bor, API yo'q).
- Kirish/ro'yxatdan o'tish panelidagi "12 000+ / 6 000+ / 300 000+" — marketing raqamlari (bazadan emas) — DESIGN.md ogohlantiradi.
- Bitta replica cheklovi (Telegram long-polling, alerts scheduler jarayon ichida).
- Fayllar serverning `uploads/` papkasida (S3 yo'q).
- Redis/queue yo'q — bildirishnomalar to'g'ridan-to'g'ri yuboriladi.

### 0.5 Test yo'riqnomalari

- `npm run typecheck` (api + web), `npm run build`.
- `npm run test:e2e` — `apps/api/scripts/e2e-check.mjs` (52 ta `check`): haqiqiy Mongo ustida `dist/server.js` ko'tariladi; `E2E_DATABASE_URL` nomida "test" bo'lishi shart (bazani `--force-reset` qiladi). Lokal: `mongodb://127.0.0.1:27018/ishbor_e2etest?replicaSet=rs0`.
- `scripts/test_frontend.py`, `scripts/test_hover.py` — Playwright (Python) skrinshot skriptlari (eski `/search/vacancy`, `/vacancy/:slug` manzillari bilan — **eskirgan**).
- Brauzer regressiyasi uchun avtomatlashtirilgan suite **yo'q**.

### 0.6 Dizayn tizimi qoidalari (DESIGN.md)

Palitra tokenlari (`paper/surface/signal/gold/growth/danger`, tungi variantlar), tipografika (Plus Jakarta Sans / Inter / JetBrains Mono, self-hosted), header (suzuvchi karta, `lg` dan to'liq nav), breakpointlar (mobil <768, planshet 768–1023, desktop ≥1024), `grid-cols-1` qoidasi aylanadigan jadval/qatorli gridlar uchun, `sr-only` tuzoqlari (absolute matn `overflow-x-auto` ichida sahifani kengaytiradi), holatlar (skelet / bo'sh / filtr bo'sh / xato + qayta urinish — **API xatosi hech qachon "bo'sh" deb ko'rinmasin**).

### 0.7 Hujjat ↔ kod ziddiyatlari (PHASE 0 da aniqlangan)

| # | Ziddiyat | Source of truth | Qaror |
|---|---|---|---|
| C1 | README: "Nomzodlar bazasi Standart/Premium tariflarda", "/pricing", "faol vakansiya limiti" | Product rules (bepul, limitsiz) + DESIGN.md + kod (`assertCanPostVacancy` yo'q) | README yangilanadi; `/api/candidates` dagi 402 gate kod bilan product rule'ga zid → ISSUES |
| C2 | DESIGN.md `/support` bo'limi: "FAQ faktlari: ... bepul tarifda 3 ta" | i18n `messages.*.ts` FAQ matni allaqachon "faol vakansiyalar soni cheklanmagan" | Kod/i18n to'g'ri, DESIGN.md jumlasi eskirgan — hujjat tuzatiladi |
| C3 | `tizim-arxitekturasi.md`: PostgreSQL, Redis, BullMQ, Socket.io, S3 | Kod: MongoDB, Redis yo'q, queue yo'q, `@fastify/websocket`, lokal `uploads/` | Tarixiy hujjat; §19 jadvali buni aytadi — o'zgartirilmaydi |
| C4 | `apps/api/.env` da `REDIS_URL`, `SITE_URL` qoldiq | `env.ts` ularni o'qimaydi | Zararsiz; `.env.example` to'g'ri |
| C5 | `scripts/test_frontend.py` eski manzillar (`/search/vacancy`, `/vacancy/:slug`) | Kod: 301 redirect guard'lar | Skript ishlaydi (redirect), lekin eskirgan — hisobotda qayd |

### 0.8 Dev muhit holati (audit boshlanishida)

- Node v24.15.0, npm 11.12.1, Python 3.11 + playwright 1.62 (brauzer testlari uchun mavjud).
- MongoDB: Windows xizmati 27017 (replikatsiyasiz, ishlatilmaydi) + qo'lda ishga tushirilgan `mongod --port 27018 --replSet rs0` (audit paytida ishga tushirildi).
- Git: `main`, 3 commit; ishchi daraxtda 86 ta o'zgargan/yangi fayl (sentabr redesign ishlari, commit qilinmagan). **Audit davomida commit qilinmaydi** (foydalanuvchi ko'rsatmasi).
- Dev bazadagi hajmlar: users 61, companies 42, vacancies 83, applications 45, notifications 35, messages 47, conversations 14, favorites 24, reviews 102, articles 15, payments 11, plans 3.

---

## PHASE 1 — FULL REPOSITORY DISCOVERY

Batafsil xaritalar: [`maps/ROUTE_MAP.md`](maps/ROUTE_MAP.md) (sahifalar, guard'lar, ichki havolalar), [`maps/API_MAP.md`](maps/API_MAP.md) (har endpoint: auth, rol, validatsiya, egalik tekshiruvi), [`maps/DB_MAP.md`](maps/DB_MAP.md) (entity/relation, real so'rov × indeks, chegarasiz so'rovlar, I1–I8 indeks tavsiyalari), [`maps/DATA_INTEGRITY.md`](maps/DATA_INTEGRITY.md) (dev bazasida 103 ta faqat-o'qish tekshiruvi).

### 1.1 Tuzilma (hisoblangan)

| Qatlam | Texnologiya | Hajm |
|---|---|---|
| `apps/api` | Fastify 4.29, Prisma 5.22 (MongoDB, replica set), Zod, argon2, jsonwebtoken, `@fastify/websocket` | 23 modul, 123 ta route ro'yxatdan o'tkazish (`app.get/post/put/patch/delete`), 28 Prisma modeli |
| `apps/web` | Vike 0.4 (SSR, `+data`/`+guard`/`+Head`), Vite 8, React 18, Tailwind | 43 ta `+Page.tsx` |
| i18n | `uz` (prefikssiz), `/ru`, `/en`; `lib/i18n/messages.*.ts` + `types.ts` | 3 til |
| Deploy | API — Railway, 1 nusxa (Telegram long-polling, obuna jadvali va WS jarayon ichida); web — Vercel | — |

### 1.2 Asosiy oqimlar

- **Auth:** access JWT 15 daqiqa (`localStorage`), refresh JWT 30 kun (httpOnly cookie, `path=/api/auth`, prod'da `SameSite=None; Secure`); Google (tokeninfo) va Telegram bot orqali kirish; telefon faqat Telegram orqali tasdiqlanadi (`requirePhoneVerified` — ariza, vakansiya, suhbat).
- **Rollar:** `job_seeker`, `employer`, `admin`, kontent jamoasi (`content_editor`, `content_author`). Admin/kontent yo'llari: audit boshida `admin.routes` tokendagi rolga ishonardi, `articles/team` — bazadagi rolga (`requireStaff`).
- **Bildirishnomalar:** `notify()` → in_app (baza + WS) / Telegram / push / email, foydalanuvchi sozlamasi bo'yicha.
- **Realtime:** `/ws/chat?token=` — chat xabarlari, o'qildi belgisi, bildirishnomalar.
- **Qidiruv:** MongoDB regex (sukut) yoki Meilisearch (`MEILI_HOST`).
- **Fayllar:** lokal disk yoki Railway Volume (`UPLOAD_DIR`), `/uploads/` statik.
- **Fon ishlari:** obuna sweep (`ALERTS_INTERVAL_MINUTES`), Telegram polling, Meili warm-up — hammasi API jarayoni ichida.

### 1.3 Discovery bosqichidagi asosiy kuzatuvlar (ISSUES.md ga olib borgan)

- Egalik tekshiruvi ko'p joyda bor, lekin javob `include` bilan to'liq hujjat qaytaradi (parol hashi, kompaniya ichki maydonlari, yashirin maosh).
- Noto'g'ri formatdagi ObjectId ~25 endpointda 500; WS handler'da esa butun jarayonni yiqitadi.
- Ish beruvchi resurslari relation filter (`$lookup` zanjiri) bilan, chegarasiz o'qiladi; 10k masshtabga mos indekslar yetishmaydi.
- Frontend'da "xato = bo'sh ro'yxat" naqshi (fallback bilan `get()`), token yangilanishi sahifalarni qayta yuklaydi, 401 uchun refresh+retry yo'q.
- Monetizatsiya qoldiqlari (402 nomzodlar bazasi, `/api/plans`, `/pricing` havolalari) mahsulot qoidasiga zid; UI va i18n'da qattiq yozilgan "12 000+" kabi raqamlar.
- Parolni tiklash oqimi yo'q; email tasdiqlash yo'q.
- Dev bazada DI-1: barcha 83 demo vakansiyada `workplace_type` maydoni yo'q.

---

## PHASE 5–6 — Arxitekturaga ta'sir qilgan o'zgarishlar

Batafsil qarorlar `DECISIONS.md` (D-032 … D-039), natijalar `FINAL_AUDIT.md` da.

### Seans modeli

| Qatlam | Audit oldidan | Hozir |
|---|---|---|
| Refresh token | 30 kun, server tomonda bekor qilinmasdi | `v = User.tokenVersion`; logout, bloklash va rol o'zgarishi versiyani oshiradi |
| Access token | 15 daqiqa, faqat imzo tekshirilardi | `v` ni olib yuradi; `requireAuth` har so'rovda bazadan rol, blok va versiyani o'qiydi (bitta indekslangan so'rov) |
| Logout | Faqat cookie tozalanardi | Joriy versiyadagi cookie bilan barcha seanslar bekor qilinadi, ochiq WebSocket'lar 4401 bilan yopiladi |
| Brauzer | Har yangilanishda React holati o'zgarardi | `lib/auth/session.ts`: token do'koni, 401 da bitta refresh, seans davri (epoch), boshqa hisob tokeni olinmaydi, 403 `USER_BLOCKED` da mehmon holati |

### Realtime yopish kodlari (`/ws/chat`)

| Kod | Ma'nosi | Klient xatti-harakati |
|---|---|---|
| 4401 | Token yaroqsiz, muddati tugagan yoki versiyasi eskirgan | Refresh, keyin qayta ulanish (ketma-ket ko'pi bilan 2 marta, keyin backoff) |
| 4403 | Hisob bloklangan yoki yo'q | Qayta ulanmaydi |
| 1011 | Tayyorlik tekshiruvida baza xatosi | Eksponensial backoff bilan qayta ulanish |
| 1009 | Kadr 64 KB dan katta | — |

Hisoblagichlar faqat kamida 10 s barqaror ulanishdan keyin tiklanadi: server yopish kodini ulanish o'rnatilgandan keyin yuboradi.

### Jarayon ichidagi keshlar (`common/cache.ts`)

| Kesh | TTL | Bekor bo'lishi |
|---|---|---|
| `/api/stats` (bosh sahifa) | 60 s | Ma'lumot versiyasi |
| Maosh statistikasi to'plami | 5 daqiqa | Ma'lumot versiyasi |
| Kompaniyalar katalogi (so'rov kaliti bo'yicha, ko'pi 200 kalit) | 60 s | Ma'lumot versiyasi |
| Filtrsiz vakansiya facets | 60 s | Ma'lumot versiyasi |

`bumpDataVersion()` vakansiya, kompaniya (profil, logo, ro'yxatdan o'tishda yaratish, tasdiq) va sharh yozuvlarida chaqiriladi; ariza yozuvida chaqirilmaydi. API bitta nusxada ishlaydi; gorizontal kengaytirilsa keshlar nusxalar orasida umumiy bo'lmaydi.

### So'rov strategiyasi

- Prisma MongoDB'da relation filter har hujjat uchun `$lookup` bajaradi. Katta kolleksiyalarda filtrlar oldindan aniqlangan ID'lar bilan beriladi: ish beruvchi resurslari (`ownedCompanyIds`, `ownedVacancyIds`), vakansiya filtrlari va matn qidiruvi (`resolveFilterIds`), suhbat konteksti.
- Ro'yxatlar chegaralangan (murojaatlar 2000 va `total`, vakansiya arizalari 500, suhbat tarixi 1000, saqlanganlar 500, ish beruvchi vakansiyalari 1000, nomzodlar 50 talik sahifa).
- Fon ishlari (obuna sweep, ommaviy xabar, Meilisearch reindex) keyset sahifalash (`id > lastId`) bilan.
- Ommaviy xabar tashqi kanallarni kutadi va tezlikni cheklaydi (foydalanuvchilar orasida kamida 40 ms, har foydalanuvchiga ko'pi bilan 20 s).

### Qolgan arxitektura xavflari

- Telegram long-polling, obuna jadvali, WebSocket va keshlar API jarayoni ichida: bitta nusxa talabi saqlanadi.
- `prestart: prisma db push` production'da (ISSUE-028).
- Katta ish beruvchi murojaatlari klientda filtrlanadi va to'liq rezyume bilan yuklanadi (ISSUE-045).

## ROUND 3 — PHASE 0–1: hujjatlar va subsystem xaritasi (2026-09-15)

Manba: 18 ta o'qish-rejimidagi finder agent (auth-core, telegram, authz-idor, files-xss, headers-infra, admin-staff, db-perf, scale-10k, api-errors, realtime, data-integrity, candidate-flows, employer-flows, seo, i18n, a11y-ui, monetization, docs) va 5 ta completeness-gap agent 212 ta subsystem yozuvini qaytardi; quyida ular 15 ta tizim bo'yicha jamlangan. Xom yozuvlar: `docs/audit/raw/round3-subsystem-maps.json`. Kod holati Round 3 boshidagi (fix'lardan oldingi) snapshot; bu bo'lim tuzatishdan keyingi holatni emas, boshlang'ich holatni tasvirlaydi.

### R3.0 Hujjatlar (PHASE 0)

- O'qilgan: `README.md`, `DEPLOY.md`, `CHANGELOG.md`, `tizim-arxitekturasi.md`, `apps/web/DESIGN.md`, `docs/audit/*` (ARCHITECTURE_AUDIT, DECISIONS D-001..D-039, ISSUES ISSUE-001..146, FINAL_AUDIT, maps/API_MAP, ROUTE_MAP, DB_MAP, DATA_INTEGRITY), `apps/api/.env.example`, i18n FAQ matnlari.
- Yangi yakuniy manba: Round 3 brief'idagi PRODUCT RULES va AUTH RULE A–L (D-040). Ular bilan zid bo'lgan eski yozuvlar:
  - D-007 (email bo'yicha login lockout), D-010 (parol tiklash yo'q), D-011 (Google email bo'yicha birlashtirish), D-039 (Telegram orqali kirish testi) — yangi qoidalar bilan almashtiriladi (D-041, D-045, D-052, D-055).
  - README, `.env.example`, DESIGN.md auth bo'limi va uz/ru/en FAQ — Telegram'ni kirish usuli va "ixtiyoriy servis" deb yozadi.
  - `tizim-arxitekturasi.md` 19-bo'limi, CHANGELOG va PHASE 1 xaritalari (API_MAP) tariflar, limitlar va 402 ni hozirgi holat sifatida ko'rsatadi.
- Butun `docs/` daraxti va bir nechta asosiy modul (support, team, articles admin, ownership, cache va boshqalar) git'da untracked: GitHub'dan deploy qilinsa HEAD buziladi (commit qilish owner qarori).

### R3.1 Frontend (apps/web)

- Vike 0.4.260 SSR + React 18 + Tailwind; sahifalar `src/pages/**` (43 ta route), SSR `+data.ts` faqat ochiq sahifalarda, serverda 8 s timeout (`withServerTimeout`).
- Seans: access token xotira + `localStorage`, global fetch wrapper 401 da bitta umumiy refresh; refresh cookie `SameSite=None` (API boshqa domenda).
- Xavflar: web'da CSP yo'q (token localStorage'da); Telegram login tugmasi va polling (`SocialLogin.tsx`); "Parolni unutdingizmi" `/support` ga; API xatosida detail sahifalar 200 + noindex, ro'yxatlar 200 indekslanadigan; ko'p `catch` bloklari server matnini (o'zbekcha) RU/EN da ko'rsatadi.

### R3.2 Backend (apps/api)

- Fastify 4 + Zod + Prisma 5 (MongoDB); modullar: auth, telegram, profile, resume, vacancies, applications, candidates, companies, reviews, favorites, alerts, notifications, chat, articles, team, admin, billing (flag bilan o'chiq), support, seo, og, stats, search.
- Global xato handler `{error, message}`; `requireAuth` har so'rovda role, isBlocked va tokenVersion'ni bazadan o'qiydi (D-036).
- Xavflar: `TRUST_PROXY=true` sukuti (X-Forwarded-For soxtalashtiriladi); barcha SSR so'rovlari bitta IP bucket'da; `ensureAdminUser` har startda ADMIN_EMAIL hisobini admin qiladi; multipart'da fayl bo'lmagan maydonlar limitsiz.

### R3.3 Database

- 28 model, relation emulyatsiyasi Prisma klientida; `prisma db push` har startda (`prestart`).
- Xavflar: `User.phone` va `telegramChatId` unique emas va indekssiz; tiklash tokenlari, zaxira telefon, qo'lda tiklash va xavfsizlik audit log uchun model yo'q; Vacancy saralash indekslarida `id` tiebreaker yo'q; bildirishnomalarda retention yo'q; `workplaceType` eski yozuvlarda bo'sh (75 ta faol vakansiya).

### R3.4 Auth

- Email + parol (argon2), Google GIS, Telegram orqali kirish (start/poll), refresh/logout (tokenVersion), in-memory email-lockout.
- AUTH RULE A–L bilan ziddiyatlar: Telegram kirish kanali (A); tiklash yo'q (B, I, J); oddiy `/start` sayt havolasini bermaydi (C); deep-link tokenlari xotirada, tasdiqsiz bog'lanadi (D); telefon unique emas va jimgina qayta yoziladi (E, G); zaxira telefon tasdiqlanmagan erkin matn (F); qo'lda tiklash yo'q (H); xavfsizlik audit log yo'q (L); Google tasdiqlanmagan hisobga birlashadi.

### R3.5 Employer

- Vakansiya CRUD (kategoriya, workplaceType, hudud qoidalari), murojaatlar ish maydoni, kompaniya profili, nomzodlar bazasi, chat.
- Xavflar: murojaatlar ro'yxati eng yangi 2000 ta to'liq rezyume bilan (5 000 arizada ≈3.5 s, 2.6 MB), filtr va sonlar klientda; admin arxivlagan vakansiyani ish beruvchi qayta faollashtiradi; tasdiqlangan belgi nom yoki logo o'zgarganda saqlanib qoladi; nomzodlar bazasiga telefon tasdig'isiz kirish va ommaviy yig'ish; ish beruvchi vakansiyalari 1000 ta to'liq hujjat.

### R3.6 Candidate

- Qidiruv, vakansiya detail, ariza (telefon gate), profil va rezyume wizard, PDF rezyume, sevimlilar, obunalar, xabarlar.
- Xavflar: PDF rezyume `/uploads/` da ochiq bearer URL; har rezyume saqlanganda publish va open-to-work sukut bo'yicha true (product savol); telefon gate Telegram'ga bog'liq, Telegram yo'q bo'lsa tushuntirishsiz berk; mehmon detail sahifadan login qilsa qaytish manzili yo'qoladi.

### R3.7 Public

- Bosh sahifa, vakansiyalar, kompaniyalar katalogi va sahifasi, maoshlar, maqolalar, support/contact.
- Xavflar: bloklangan egasi kompaniyasi ochiq qoladi; vakansiya detail `include` bilan `rejectionReason` ni mehmonga chiqarishi mumkin; sharh muallifining userId si ochiq; o'zbekcha apostrof variantlari qidiruvda normallashtirilmaydi.

### R3.8 Admin

- Overview, foydalanuvchilar (block, role), vakansiya moderatsiyasi, kompaniya tasdig'i, sharhlar, legacy to'lovlar, broadcast, reindex; team va invite'lar; maqolalar CMS.
- Xavflar: audit trail yo'q; qo'lda tiklash va sessiyani bekor qilish oqimi yo'q; oxirgi admin himoyasi yo'q; moderatsiya qoralamani chop etadi va joylashuv qoidalarini tekshirmaydi; to'lov tasdiqlash `BILLING_ENABLED` ga bo'ysunmaydi; admin qidiruvi relation filter bilan.

### R3.9 WebSocket

- `/ws/chat`: ulanishda token va hisob holati, 4401/4403/1011 yopish kodlari, in-memory socket reestri (bitta jarayon).
- Xavflar: WS xabar yuborishda telefon tasdig'i tekshirilmaydi (REST tekshiradi); limit ulanish bo'yicha, foydalanuvchi bo'yicha emas; nack frame yo'q; qayta ulanishda jitter yo'q.

### R3.10 Notifications

- `notify()`: sayt ichida + WS, Telegram, Web Push, email; sozlamalar matritsasi (4 tur × 4 kanal).
- Xavflar: matnlar serverda o'zbekcha saqlanadi (RU/EN da o'zbekcha); ro'yxat 100 ta bilan cheklangan va cursor yo'q; chat Telegram xabarlari sozlamaga bo'ysunmaydi; SMTP o'chiq bo'lsa email manzillar log'ga yoziladi; push obunalar seansga bog'lanmagan.

### R3.11 Files

- `saveUpload`: magic-byte tekshiruvi, SVG/HTML rad, tasodifiy nomlar; logolar, maqola muqovalari, PDF rezyumelar `@fastify/static` orqali.
- Xavflar: PDF rezyume avtorizatsiyasiz, `public` kesh, CORP cross-origin; ish beruvchi web UI rezyume PDF'ni umuman ko'rmaydi.

### R3.12 SEO

- `+Head.tsx`/Seo.tsx, canonical va hreflang, JSON-LD (JobPosting, Organization, Article), API robots va sitemap'lar (Vercel `api/seo.js` proxy), OG rasm (satori).
- Xavflar: vakansiya va kompaniya ro'yxat `+Head.tsx` detail sahifalarga meros bo'lib dublikat meta beradi; API xatosida 200; canonical barcha query parametrlarni tashlaydi; `validThrough` hech qachon yozilmaydigan `expiresAt` ga bog'liq; sitemap har so'rovda 50k qator; OG shriftlari kirillsiz; `/pricing` vaqtinchalik 302.

### R3.13 I18N

- uz (prefikssiz), /ru, /en; tiplangan lug'atlar; region va kategoriya nomlari slug bo'yicha.
- Xavflar: backend bildirishnomalari, bot matnlari, AppError va zod xabarlari faqat o'zbekcha yoki inglizcha; FAQ Telegram orqali kirishni tavsiya qiladi; slugsiz ko'rinishlarda region nomlari o'zbekcha.

### R3.14 Infrastructure

- API: Railway (Nixpacks, `prestart` db push, /health, numReplicas 1, Volume UPLOAD_DIR). Web: Vercel (`api/ssr.js`, `vercel.json` sarlavhalari) yoki self-hosted Fastify (`server/index.mjs`). Lokal: Mongo rs0 27018, ixtiyoriy Meilisearch.
- Xavflar: har startda sxema o'zgaradi (yangi unique indekslar crash-loop berishi mumkin); barcha auth holati (link/login tokenlari, lockout, rate limit, socketlar) jarayon xotirasida; hardening faqat `NODE_ENV` ga bog'liq; refresh cookie hujjatlashtirilgan topologiyada third-party (Safari/Brave); CORS preflight keshlanmaydi; API javoblari siqilmaydi.

### R3.15 Tests

- `apps/api/scripts/e2e-check.mjs` (Round 2 oxirida 94/94), `apps/web/scripts/unit-check.mjs`, Round 2 brauzer regressiya skriptlari (scratchpad, repoda versiyalanmagan), 10K sintetik benchmark (`ishbor_scaletest`).
- Bo'shliqlar: auth va Telegram oqimlari uchun avtomatik test va test harness yo'q (bot handlerlari modul ichida yopiq); axe-core a11y tekshiruvi yo'q edi (Round 3 boshlanish o'lchovi: 78 sahifa yuklashidan 43 tasida color-contrast); ma'lumot yaxlitligi skripti repoda yo'q.
