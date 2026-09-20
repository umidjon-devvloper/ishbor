ISH BOR! — yakuniy audit hisoboti (2026-09-15). Barcha o'zgarishlar commit qilinmagan ishchi daraxtda. Batafsil: `ISSUES.md`, `DECISIONS.md`, `ARCHITECTURE_AUDIT.md`.

# Executive Summary

ISH BOR! (Fastify + Prisma/MongoDB API, Vike SSR web) 10 000 foydalanuvchi va katta hajmdagi ma'lumot uchun audit qilindi va mustahkamlandi. Bu yuk (concurrent) testi emas.

**Holat: yangi developmentga mana shu 3 ta masaladan keyin tayyor.**

1. **Commit va CI.** Audit va sentabr ishlari commit qilinmagan; yangi modullar untracked, HEAD'dan build yiqiladi (ISSUE-026). Commit qilib, CI'da typecheck, build, e2e va unit-check ishga tushirilsin.
2. **Parolni tiklash.** Asosiy auth bo'shlig'i (ISSUE-012). Kanal (email yoki Telegram) bo'yicha qaror kerak.
3. **Production xavfsizlik sozlamalari.** `TRUST_PROXY` hop sonini Railway'da tekshirib berish (ISSUE-011), namunaviy bo'lmagan 32+ belgili JWT sirlari (ISSUE-119), web va API ni birga deploy qilish (vakansiya detail javob shakli o'zgargan).

| Ko'rsatkich | Qiymat |
|---|---|
| Birinchi audit | 271 xom topilma → 103 noyob (P0 5, P1 21, P2 52, P3 25) |
| Ikkinchi audit | 46 xom → 43 noyob (P1 1, P2 16, P3 26) |
| Jami holat | FIXED 101, PARTIAL 21, NOT FIXED 19, WONT FIX 4, NOT REPRODUCIBLE 1 |
| API e2e | 94/94 PASS |
| Web unit-check | 3/3 PASS |
| Brauzer | regressiya 331 yuklash; xato holatlari 9/9; PHASE 6 holatlari 9/9 |
| Sintetik 10K benchmark | Matn qidiruvi p50 3 505 → 306 ms; ochiq: katta ish beruvchi arizalari ~3.5 s, nomzodlar bazasi ~2 s |

| Area | Holat | Asos |
|---|---|---|
| AUTH | WARN | Seans bekor qilish va bazadan tekshiriladigan access token ishlaydi (e2e). Parolni tiklash yo'q (ISSUE-012), email tasdiqlanmaydi (ISSUE-042), IP limiti proxy sozlamasiga bog'liq (ISSUE-011). |
| SECURITY | WARN | Barcha P0 va ikkinchi auditdagi xavfsizlik topilmalari tuzatildi va e2e bilan tasdiqlandi. Web CSP yo'q (ISSUE-078), PDF rezyume ochiq URL (ISSUE-029), access token localStorage'da (ISSUE-083). |
| DATABASE | WARN | Indekslar explain bilan tasdiqlangan, sxema o'zgarishlari additiv, demo va dev ma'lumot tegilmagan. Production'da `prestart db push` (ISSUE-028); demo e'lonlarda `workplace_type` yo'q (DI-1). |
| API | PASS | e2e 94/94: xavfsizlik, IDOR, maxfiylik, product rule'lar, validatsiya. Backend matnlari faqat o'zbekcha (ISSUE-073). |
| FRONTEND | PASS | Typecheck va build PASS; brauzer xato holati 9/9, PHASE 6 holatlari 9/9; regressiyada 5xx 0, kutilmagan konsol xatosi 0. Ochiq: rol guard'lari faqat client (ISSUE-066), detail sahifada API xatosi 200 + noindex (ISSUE-070). |
| PERFORMANCE | WARN | Matn qidiruvi va filtrlar 10 martadan ko'proq tezlashdi. Katta ish beruvchi arizalari p50 ~3.5 s (2.6 MB), nomzodlar bazasi ~2 s, cold katalog 0.75 s. |
| 10K DATA SCALE | WARN | 20 000 vakansiya, 50 000 ariza, 100 000 xabar va bildirishnomada ommaviy va nomzod oqimlari p50 350 ms dan tez. Ikki ish beruvchi endpointi sekin (yuqorida). |
| RESPONSIVE | PASS | 331 yuklash, 7 viewport: gorizontal toshish 0, 5xx 0. Mayda ochiq bandlar: ISSUE-081, ISSUE-085. |
| DARK MODE | WARN | 50 tungi yuklashning 50 tasida qo'llangan. Kontrast WCAG AA dan past tokenlar (ISSUE-076). |
| I18N | WARN | UI kalitlari uch tilda tiplangan; ru/en da o'zbekcha matn 24 yuklashda — kontent, hudud/kategoriya nomlari va backend matnlari (ISSUE-073). |
| SEO | WARN | 200 javobli sahifalarda title/h1 yo'qligi: 0/0. Ochiq: ISSUE-070, 071, 072 (qisman), 093. |
| ACCESSIBILITY | WARN | Kontrast WCAG AA dan past (ISSUE-076), reduced motion (ISSUE-077), klaviatura bandlari (ISSUE-075 qisman). Avtomatik a11y vositasi NOT RUN. |
| TESTS | WARN | API e2e 94/94, web unit-check 3/3, brauzer tekshiruvlari PASS. Brauzer skriptlari repo'da emas; ayrim fix'lar avtomatik test qilinmagan (ISSUE-109, 110, 112, 113, 130, 132). |
| PRODUCTION READINESS | FAIL | Yangi modullar commit qilinmagan: HEAD'dan build yiqiladi (ISSUE-026). Parolni tiklash yo'q (ISSUE-012). Production sozlamalari tekshirilmagan (`TRUST_PROXY`, yangi JWT sirlari). |

# Initial Audit

PHASE 2 da 15 ta yo'nalish parallel agentlar tomonidan faqat o'qish rejimida tekshirildi: auth, authz/IDOR, validation/errors, DB/performance, security surface, realtime/notifications, frontend state, monetization, routing/SEO, i18n, responsive/dark/a11y, employer, candidate/public, 10K data scale, tests/infra. 271 ta xom topilma root cause bo'yicha 103 ta noyob muammoga birlashtirildi. Eng xavflilari izolyatsiyalangan test bazasida (`ishbor_e2etest`) alohida API nusxasida qayta hosil qilindi. Demo va dev ma'lumotlarga tegilmadi.

| Severity | Xom topilmalar | Noyob muammolar |
|---|---:|---:|
| P0 | 16 | 5 |
| P1 | 52 | 21 |
| P2 | 138 | 52 |
| P3 | 65 | 25 |
| Jami | 271 | 103 |

P0 muammolar (hammasi FIXED):

- **ISSUE-001.** Ish beruvchi vakansiya arizalarini so'raganda nomzodning parol hashi, `telegramChatId` va ichki maydonlari qaytardi.
- **ISSUE-002.** SVG logo orqali API domenida stored XSS va refresh cookie orqali hisobni egallash mumkin edi.
- **ISSUE-003.** Bitta noto'g'ri WebSocket xabari butun API jarayonini yiqitardi.
- **ISSUE-004.** CORS har qanday `*.vercel.app` manziliga credentials bilan ruxsat berardi.
- **ISSUE-005.** JSON-LD ichida `</script>` escape qilinmagani uchun SSR HTML'da stored XSS bor edi.

P1 mavzulari: IDOR (boshqa nomzod rezyumesini biriktirish), product rule buzilishi (nomzodlar bazasida 402, to'qima raqamlar), maxfiylik (nomzod kontaktlari), auth (JWT sozlamalari, Telegram login phishing, brute-force, parol tiklash yo'qligi), ma'lumot yo'qotish (xato holatda rezyume va kompaniya profilini ustidan yozish, vakansiya o'chirishda arizalar cascade), frontend holati (token yangilanishida sahifalar qayta yuklanishi, API xatosi bo'sh holat bo'lib ko'rinishi), infra (untracked fayllar).

Har muammo bo'yicha fayl, root cause, impact, evidence, fix va test: `docs/audit/ISSUES.md`.

# Fixes

| Holat | Birinchi audit (103) | Ikkinchi audit (43) | Jami (146) |
|---|---:|---:|---:|
| FIXED | 62 | 39 | 101 |
| PARTIAL | 19 | 2 | 21 |
| NOT FIXED | 18 | 1 | 19 |
| WONT FIX | 3 | 1 | 4 |
| NOT REPRODUCIBLE | 1 | 0 | 1 |

PHASE 3 da barcha P0 va P1 muammolar ko'rib chiqildi. P2 dan faqat xavfsiz va cheklanganlari, P3 dan arzimaslari tuzatildi. PHASE 6 da ikkinchi audit topilmalari fayllar bo'yicha ajratilgan 8 guruhda tuzatildi va har guruh mustaqil reviewer tomonidan tekshirildi (D-037). Hech narsa commit qilinmadi; o'zgarishlar ishchi daraxtda (git status bo'yicha 153 ta yozuv: 108 o'zgartirilgan, 3 o'chirilgan, 42 untracked).

Katta o'zgarishlar:

**1. Seansni bekor qilish va bazadan tekshiriladigan access token (D-009, D-036)**
- **WHY:** Logout'dan keyin eski cookie ishlardi; roli olingan admin va bloklangan foydalanuvchi 15 daqiqa yozish amallarini bajara olardi.
- **WHAT:** `User.tokenVersion`; refresh va access token `v` ni olib yuradi; `requireAuth` har so'rovda bazadan rol, blok va versiyani o'qiydi; logout faqat joriy versiyadagi cookie bilan bekor qiladi.
- **RISK:** Har autentifikatsiyalangan so'rovga bitta indekslangan so'rov. Bitta qurilmadan chiqish barcha qurilmalardan chiqaradi.
- **TEST:** e2e `[ISSUE-041/035]`, `[ISSUE-035]`, `[PHASE6-V5]` (2 ta), `[PHASE6-U11]`, jamoa tekshiruvi.
- **RESULT:** PASS.

**2. Frontend seansi: token do'koni, fetch interceptor va hisob almashuvi himoyasi (D-023, ISSUE-105, ISSUE-131)**
- **WHY:** Token yangilanishi sahifalarni qayta yuklardi; 401 da qayta urinish yo'q edi; bir brauzerda ikkinchi hisobga kirilsa eski tab boshqa hisob nomidan yozardi.
- **WHAT:** `lib/auth/session.ts`: fondagi yangilanish React holatini o'zgartirmaydi; 401 da bitta umumiy refresh; boshqa `sub` li token olinmaydi va sahifa qayta yuklanadi; seans davri (epoch); 403 `USER_BLOCKED` da mehmon holati.
- **RISK:** Global `fetch` o'rab olingan (faqat API manzili va Bearer so'rovlari).
- **TEST:** Brauzer S1 (401 → refresh → qayta urinish), brauzer P8 ikki tab PASS; reviewer harness (29 ssenariy).
- **RESULT:** PASS

**3. Yuklash xavfsizligi (D-013, ISSUE-106)**
- **WHY:** SVG logo orqali stored XSS; turi faqat client sarlavhasidan; `;.pdf` bilan CSP chetlab o'tilardi.
- **WHAT:** `saveUpload()`: magic bytes, tasodifiy nom, eski fayl o'chiriladi; `/uploads/` javoblariga `nosniff` va haqiqiy `Content-Type` bo'yicha sandbox CSP; umumiy maqola muqovasi o'chirilmaydi.
- **RISK:** PDF rezyume URL'ni bilgan kishiga ochiq (ISSUE-029 PARTIAL).
- **TEST:** e2e `[ISSUE-002]`, `[ISSUE-029/043]`, `[PHASE6-V3]`, `[PHASE6-V4]`.
- **RESULT:** PASS.

**4. Monetizatsiya bayroq ortida (D-014)**
- **WHY:** Product rule: platforma bepul; eski billing yo'llari ochiq edi.
- **WHAT:** `BILLING_ENABLED` (sukut o'chiq), 402 tekshiruvlari olib tashlandi, havolalar `/profile`.
- **RISK:** Billing kodi va sxemasi saqlangan (ISSUE-080 PARTIAL).
- **TEST:** e2e `/api/plans` va webhook 404, faol vakansiyalar limiti yo'q.
- **RESULT:** PASS.

**5. 10K masshtab: indekslar, relation filter'siz so'rovlar, keshlar (D-018, D-033, D-034, D-035)**
- **WHY:** Relation filter har hujjatga `$lookup`; chegarasiz ro'yxatlar; indekslar yetishmasdi.
- **WHAT:** Additiv indekslar; egalik va filtrlar oldindan aniqlangan ID'lar bilan; chegaralar; `/api/stats`, maosh statistikasi, katalog va filtrsiz facets keshlari.
- **RISK:** Jarayon ichidagi kesh bir nechta API nusxasida umumiy emas; ikki og'ir endpoint ochiq qoldi.
- **TEST:** `explain_queries.mjs` (15 so'rov indeksda), `scale_bench.mjs` oldin/keyin, e2e.
- **RESULT:** Qisman — "10K User Data Scale" bo'limida.

**6. API xatosi hech qachon bo'sh holat emas (D-024 va PHASE 6)**
- **WHY:** Ko'p sahifada xato "ma'lumot yo'q" bo'lib ko'rinardi, ba'zida keyingi saqlash ma'lumotni o'chirardi.
- **WHAT:** Uloqtiradigan fetcher'lar, xato holati va haqiqiy qayta so'rov: admin, obunalar, nomzodlar, saqlanganlar, rezyume, kompaniya profili, Telegram holati, qo'ng'iroq, hududlar, header nishonlari.
- **RISK:** Ikkinchi darajali bloklar xatoda yashiriladi (ataylab).
- **TEST:** Brauzer E1–E6 va P1–P7.
- **RESULT:** Brauzer E1–E6 6/6 PASS; P1–P7 8/8 PASS.

**7. Testlar: e2e 52 → 94, web unit-check (ISSUE-063, ISSUE-120…146)**
- **WHY:** Kritik authz yo'llari va ko'p fix'lar avtomatik tasdiqlanmagan edi.
- **WHAT:** Xavfsizlik, IDOR, maxfiylik va PHASE 6 shartnomalari; eskirgan build aniqlanadi; hermetik muhit; `apps/web/scripts/unit-check.mjs`.
- **RISK:** Brauzer testlari repo'da emas (scratchpad skriptlari).
- **TEST:** e2e 94/94, unit-check 3/3.
- **RESULT:** PASS.

# Security

| Yo'nalish | Holat | Dalil |
|---|---|---|
| P0 (5 ta) | Hammasi FIXED | e2e `[ISSUE-001]`, `[ISSUE-002]`, `[ISSUE-003/040]`, `[ISSUE-004]`; `serializeJsonLd` unit-check |
| IDOR va egalik | FIXED | e2e `[IDOR]`, `[ISSUE-006]`, begona arizalar 403, `[PHASE6-V5]` roli olingan admin 403 |
| Nomzod maxfiyligi | FIXED | Kontaktlar faqat ariza yuborganga (`[ISSUE-007/008]`); suhbatlarda email yo'q (`[PHASE6-V1]`); ochiq javoblar whitelist (`[ISSUE-032/033]`) |
| JWT va seans | FIXED | HS256 qat'iy, `typ`, ≥32 belgili va namunaviy bo'lmagan sirlar; `tokenVersion` bilan darhol bekor qilish |
| CORS | FIXED | Begona `*.vercel.app` 403 (`[ISSUE-004]`); cross-site logout 403 (ISSUE-097) |
| Yuklash | FIXED | Magic bytes, SVG yo'q, sandbox CSP `Content-Type` bo'yicha |
| WebSocket | FIXED | Token bucket, 64 KB, 4401/4403/1011, logda token yo'q |
| Open redirect | FIXED | `returnTo` va bildirishnoma havolalari: `//`, backslash va boshqaruv belgilari rad etiladi |
| Brute-force | PARTIAL | Email bo'yicha 10 xato / 15 daqiqa (IP'dan qat'i nazar); IP limiti soxta `X-Forwarded-For` bilan chetlab o'tiladi, `TRUST_PROXY` hop soni berilmaguncha (ISSUE-011) |
| Parolni tiklash | NOT FIXED | Oqim yo'q (ISSUE-012, D-010) |
| Email tasdiqlash / Google birlashtirish | PARTIAL | Pre-account takeover xavfi qoladi (ISSUE-042, D-011) |
| Web CSP | NOT FIXED | Vike origin'ida CSP yo'q (ISSUE-078) |
| Access token saqlash | NOT FIXED | `localStorage` (ISSUE-083, hujjatlashtirilgan tradeoff) |
| PDF rezyume | PARTIAL | Taxmin qilib bo'lmaydigan nom, lekin autentifikatsiyasiz (ISSUE-029) |

Barcha ruxsat tekshiruvlari server tomonda. Frontend guard'lari (rol bo'yicha yo'naltirish, yashirilgan tugmalar) faqat UX sifatida baholandi va xavfsizlik dalili sifatida hisobga olinmadi.

# Database

- MongoDB replica set, Prisma 5 (`db push`, migratsiya tarixi yo'q). Audit davomidagi sxema o'zgarishlari faqat additiv: ixtiyoriy `User.tokenVersion` va indekslar (ISSUE-053). PHASE 6 da sxema o'zgarmadi.
- Qo'shilgan indekslar: `Application.createdAt`, `[vacancyId, status]`; `Vacancy [status, isPremium, publishedAt]`, `[companyId, status]`; `Notification [userId, createdAt]`; `Message [conversationId, isRead]`; `User.createdAt`.
- `explain_queries.mjs`: 15 ta asosiy so'rovning hammasi indeksdan foydalanadi (IXSCAN yoki COUNT_SCAN).
- Relation filter (`$lookup`) o'rniga indeksli ID bosqichlari: ish beruvchi resurslari, inbox summary, vakansiya filtrlari va matn qidiruvi, suhbat konteksti.
- Ma'lumotlar yaxlitligi (dev bazasi, faqat o'qish, 103 tekshiruv): DI-1 — 83 ta demo vakansiyada `workplace_type` yo'q. Kod eski yozuvlar uchun backward compatible (`employmentType=remote` fallback), demo seed o'zgartirilmadi (D-028).
- Ishlatilgan bazalar: dev `ishbor` — hech qachon yozilmadi; `ishbor_e2etest` — e2e (force-reset); `ishbor_uitest` — dev nusxasi, brauzer testlari; `ishbor_scaletest` — sintetik benchmark. Production va demo ma'lumotlarga tegilmadi.
- Xavflar: `prestart: prisma db push` har ishga tushishda sxemani sinxronlaydi (ISSUE-028, WONT FIX, D-029); jarayon ichidagi keshlar gorizontal kengaytirishda umumiy emas.

# Performance

- O'lchov usuli: alohida sintetik baza, API production build, ketma-ket so'rovlar, har endpoint uchun cold so'rov va takrorlar. Bu yuk (concurrent) testi emas; bitta lokal mongod, tarmoq kechikishi yo'q.
- Eng katta yutuqlar (p50, oldin → keyin): matn qidiruvi 3 505 → 306 ms; hudud va masofaviy filtri 1 511 → 9 ms; 500 suhbatli ish beruvchi ro'yxati 1 318 → 523 ms (p95 3 993 → 1 148 ms); takroriy katalog 695 → 1 ms; takroriy filtrsiz facets 480 → 2 ms.
- Keshlar: `/api/stats` 60 s; maosh statistikasi 5 daqiqa; kompaniyalar katalogi (kalitli) 60 s; filtrsiz facets 60 s. Vakansiya, kompaniya, logo, sharh va tasdiq yozuvida darhol bekor bo'ladi; ariza yozuvida bekor bo'lmaydi (bosh sahifadagi bugungi arizalar 60 s gacha kechikadi).
- Ochiq og'ir nuqtalar:
  - Ish beruvchi arizalari (5 000 ariza): p50 3 497 ms, javob 2.6 MB (ISSUE-045).
  - Nomzodlar bazasi (8 000 nomzod): p50 1 972 ms. Ehtimoliy sabab — `user` va `resumes` relation filterlari (`$lookup`); explain yoki profil bilan tasdiqlanmagan (lead auditor benchmark kuzatuvi, alohida ID berilmagan).
  - Birinchi (cold) katalog va facets so'rovi 0.6–0.75 s (ISSUE-049, ISSUE-048).
  - `sitemap-vacancy.xml` 20 000 vakansiyada 7.2 MB bitta fayl (ISSUE-056).

# 10K User Data Scale

Sintetik ma'lumot (`ishbor_scaletest`, D-032):

| Obyekt | Soni |
|---|---:|
| Foydalanuvchi | 10 001 (2 000 ish beruvchi, 8 000 nomzod, 1 admin) |
| Kompaniya | 2 000 |
| Vakansiya | 20 000 (14 427 faol) |
| Ariza | 50 000 |
| Bildirishnoma | 100 000 |
| Suhbat | 5 000 |
| Xabar | 100 000 |

Oldin (PHASE 5.3) va keyin (PHASE 6 optimizatsiyalari), millisekund:

| Endpoint | Status | Oldin cold | Oldin p50 | Oldin p95 | Oldin hajm | Keyin cold | Keyin p50 | Keyin p95 | Keyin hajm |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| vakansiyalar 1-sahifa (`/api/vacancies?pageSize=20`) | 200 | 109 | 50 | 109 | 23 KB | 277 | 51 | 277 | 23 KB |
| vakansiyalar 500-sahifa (`/api/vacancies?pageSize=20&page=500`) | 200 | 71 | 68 | 71 | 23 KB | 226 | 84 | 226 | 23 KB |
| vakansiyalar maosh bo'yicha (`/api/vacancies?sort=salary_desc&pageSize=20`) | 200 | 118 | 82 | 118 | 23 KB | 99 | 93 | 100 | 23 KB |
| vakansiyalar matn qidiruvi (`/api/vacancies?text=dasturchi&pageSize=20`) | 200 | 3478 | 3505 | 3645 | 23 KB | 330 | 306 | 330 | 23 KB |
| vakansiyalar filtr (hudud+masofaviy) (`/api/vacancies?area=tashkent&employment=remote&pageSize=20`) | 200 | 1511 | 1511 | 1534 | 0 KB | 23 | 9 | 23 | 0 KB |
| filtr sonlari (facets) (`/api/vacancies/facets`) | 200 | 502 | 480 | 502 | 9 KB | 602 | 2 | 602 | 9 KB |
| vakansiya detail (`/api/vacancies/vakansiya-0`) | 200 | 9 | 7 | 9 | 2 KB | 16 | 9 | 16 | 2 KB |
| kompaniyalar katalogi (`/api/companies?limit=18`) | 200 | 692 | 695 | 712 | 9 KB | 754 | 1 | 754 | 9 KB |
| kompaniyalar reyting bo'yicha (`/api/companies?sort=rating&limit=18`) | 200 | 705 | 695 | 705 | 9 KB | 767 | 1 | 767 | 9 KB |
| katta kompaniya sahifasi (`/api/companies/company-0`) | 200 | 25 | 19 | 25 | 113 KB | 24 | 21 | 24 | 113 KB |
| bosh sahifa statistikasi (`/api/stats`) | 200 | 26 | 1 | 26 | 0 KB | 90 | 2 | 90 | 0 KB |
| maosh statistikasi (`/api/stats/salary`) | 200 | 525 | 7 | 525 | 3 KB | 573 | 9 | 573 | 3 KB |
| sitemap vakansiyalar (`/sitemap-vacancy.xml`) | 200 | 228 | 228 | 236 | 7189 KB | 240 | 240 | 254 | 7189 KB |
| ish beruvchi arizalari (katta) (`/api/employer/applications`) | 200 | 3316 | 3046 | 3338 | 2609 KB | 4085 | 3497 | 4085 | 2609 KB |
| ish beruvchi vakansiyalari (500) (`/api/employer/vacancies`) | 200 | 129 | 129 | 131 | 987 KB | 177 | 180 | 247 | 987 KB |
| inbox summary (ish beruvchi) (`/api/inbox/summary`) | 200 | 325 | 117 | 328 | 0 KB | 735 | 125 | 735 | 0 KB |
| nomzodlar bazasi (`/api/candidates`) | 200 | 2041 | 1801 | 2041 | 24 KB | 1990 | 1972 | 2131 | 24 KB |
| suhbatlar (ish beruvchi, 500) (`/api/conversations`) | 200 | 3916 | 1318 | 3993 | 498 KB | 1148 | 523 | 1148 | 498 KB |
| nomzod arizalari (`/api/applications`) | 200 | 9 | 6 | 9 | 5 KB | 9 | 12 | 14 | 5 KB |
| bildirishnomalar (2000 li foydalanuvchi) (`/api/notifications?limit=30`) | 200 | 5 | 4 | 5 | 8 KB | 12 | 6 | 12 | 8 KB |
| o'qilmaganlar soni (`/api/notifications/unread-count`) | 200 | 4 | 4 | 5 | 0 KB | 8 | 6 | 8 | 0 KB |
| suhbat tarixi (5000 xabar) (`/api/conversations/6aa89c1ff4a5656900030587/messages`) | 200 | 99 | 55 | 99 | 252 KB | 68 | 45 | 68 | 252 KB |
| inbox summary (nomzod) (`/api/inbox/summary`) | 200 | 9 | 5 | 9 | 0 KB | 8 | 8 | 10 | 0 KB |
| admin overview (`/api/admin/overview`) | 200 | 96 | 96 | 101 | 1 KB | 112 | 112 | 124 | 1 KB |
| admin foydalanuvchilar 200-sahifa (`/api/admin/users?page=200`) | 200 | 15 | 14 | 15 | 7 KB | 34 | 16 | 34 | 7 KB |

Izohlar:

- "Keyin" dagi cold qiymatlar ba'zi endpointlarda oldingidan yuqori (masalan vakansiyalar 1-sahifa 109 → 277 ms). Bu server ishga tushgandan keyingi birinchi so'rovlar; p50 o'zgarmagan.
- Keshlangan endpointlarda p50 takroriy (bir xil) so'rovni ko'rsatadi; foydalanuvchi uchun birinchi so'rov cold qiymatga yaqin.
- "Hudud + masofaviy" 0 KB: sintetik generatorda Toshkentda masofaviy vakansiya yo'q; to'g'ridan-to'g'ri baza so'rovi ham 0 qaytardi, API xatosi emas.
- Xulosa: 20 000 vakansiya, 50 000 ariza va 100 000 xabar hajmida ommaviy sahifalar va nomzod oqimlari 350 ms dan tez (p50). Ikki istisno qoldi: katta ish beruvchining arizalar ro'yxati va nomzodlar bazasi.

# Candidate

| Oqim | Holat | Dalil |
|---|---|---|
| Ro'yxatdan o'tish, kirish, seans | Ishlaydi; seans yangilanishi sahifani qayta yuklamaydi; hisob almashuvi himoyalangan | e2e, brauzer S1–S3, brauzer P8 ikki tab PASS |
| Rezyume | Xato holatda ma'lumot ustidan yozilmaydi (ISSUE-017); bo'sh bo'limlar bilan saqlanadi | e2e, brauzer E5 |
| Ariza yuborish | Faqat o'z rezyumesi (ISSUE-006); parallel so'rov bitta ariza (ISSUE-086) | e2e |
| Arizalarim | Yashirin maosh `null`, faqat o'ziga ko'rinadi | e2e |
| Saqlanganlar | Faqat faol e'lon, yashirin maosh `null` | e2e `[ISSUE-034/038]`, `[PHASE6-U33]` |
| Obunalar | Xato holati (ISSUE-022); sweep dublikatsiz va xatoga chidamli (ISSUE-109, 110) | Brauzer E2; sweep NOT TESTED |
| Chat | Email oshkor qilinmaydi; real-time mustahkam | e2e `[PHASE6-V1]`, WebSocket tekshiruvlari |
| Bildirishnomalar | Havola doim bor; qo'ng'iroq xato holati | e2e, brauzer P1 PASS |
| Profil | Hududlar xatosi profil xato holatini ko'rsatadi; Telegram holati xatosida qayta urinish | brauzer P6 PASS, brauzer P2 PASS |
| Maxfiylik | Kontaktlar faqat ariza yuborilgan kompaniyaga; bloklangan va qoralama rezyumeli nomzod bazada chiqmaydi | e2e `[ISSUE-007/008]`, `[PHASE6-U33]` |

Ochiq: parolni tiklash yo'q (ISSUE-012), email tasdiqlanmaydi (ISSUE-042), PDF rezyume URL orqali ochiq (ISSUE-029), bosh sahifa kartasida ish joylashuvi yo'q (ISSUE-085).

# Employer

| Oqim | Holat | Dalil |
|---|---|---|
| Kompaniya profili | Xato holatda bo'sh forma chizilmaydi (ISSUE-018); ikkinchi kompaniya 409; sayt manzili tekshiriladi; o'zgarish katalogda darhol ko'rinadi | e2e, brauzer E6 |
| Vakansiya joylash va tahrirlash | Kategoriya, ish joylashuvi va hudud qoidalari; eski masofaviy e'lon tahrirlanadi | e2e `vakansiya joylashuvi`, `[PHASE6-U18]` |
| Vakansiya hayot sikli | Arizali e'lon o'chirilmaydi (409), rad etilgan tahrir moderatsiyaga, qayta e'lon qilishda telefon va joylashuv tekshiriladi, telefon xatosi aniq ko'rsatiladi | e2e `[ISSUE-025/024/059]`, `[PHASE6-U31]` |
| Murojaatlar | Holat no-op, izoh chat orqali; ro'yxat server chegarasida kesilsa ogohlantirish | e2e `[ISSUE-036/014/060]`, brauzer P4 PASS |
| Nomzodlar bazasi | Bepul; kontaktlar faqat arizachilarga; kompaniyasiz ish beruvchi uchun alohida holat; "Yana ko'rsatish" | e2e, `[PHASE6-U5]`, brauzer P3 PASS |
| Chat boshlash | Faqat ish qidirayotgan, ariza yuborgan yoki oldin suhbatlashgan nomzod; email yo'q | e2e `[ISSUE-039]`, `[PHASE6-V1]` |
| Kompaniya sahifasi | Vakansiyalar soni `_count` dan; sharh reytingi o'chirishdan keyin to'g'ri | brauzer P5 PASS |

Ochiq: katta ish beruvchida murojaatlar ro'yxati sekin va og'ir (ISSUE-045); vakansiya tahrirlash sahifasi butun ro'yxatni yuklaydi (ISSUE-058); `PUT` tahrirlashda telefon tasdig'i talab qilinmaydi (ISSUE-087); ariza holati uchun qat'iy holat mashinasi yo'q (D-019, qaror kerak).

# Routing

- Tuzatildi: ISSUE-094 (admin jadvalida havola faqat faol e'longa), ISSUE-074.
- Qisman (ISSUE-066): login `returnTo` faqat xavfsiz ichki yo'lni qabul qiladi (brauzer S2 va S3 PASS). Rol guard'lari hali faqat client tomonda; server tomonidagi ruxsat alohida ishlaydi, shuning uchun bu xavfsizlik emas, UX masalasi.
- Ochiq: ISSUE-095 (`/employer/@slug` har qanday noma'lum segmentni `/companies/<segment>` ga 301 qiladi).
- Brauzer tekshiruvi: 49 marshrutda 5xx yo'q; 404 faqat ataylab berilgan noma'lum manzillarda. Eski va xizmat manzillari yo'naltiriladi: `/pricing` → `/employer`, `/search/vacancy?text=react` → `/vacancies?q=react`, `/article` → `/articles`, `/vacancy/<slug>` → `/vacancies/<slug>` (mavjud bo'lmagan slug uchun 404).

# Monetization

Product rule: platforma bepul, faol vakansiya limiti yo'q, core flow monetizatsiyaga bog'lanmaydi. Billing, payment yoki premium qo'shilmadi.

| Tekshiruv | Holat | Dalil |
|---|---|---|
| Nomzodlar bazasidagi 402 tarif tekshiruvi | Olib tashlandi (ISSUE-007) | e2e "nomzodlar bazasi bepul", `[ISSUE-007/008]` |
| Faol vakansiya limiti | Yo'q | e2e "4- va 10-faol vakansiya 201, 402 yo'q" |
| Tarif, checkout va to'lov webhook yo'llari | `BILLING_ENABLED` ortida, sukut o'chiq (ISSUE-064, D-014) | e2e `/api/plans` va webhook 404 |
| `/pricing` sahifasi | `/employer` ga yo'naltiriladi; bildirishnoma havolalari `/profile` | `pages/pricing/+guard.ts`, D-014 |
| Hujjatlar | Bepul modelga moslandi (ISSUE-065) | README, DEPLOY.md, `.env.example` |
| Qoldiq kod | Billing kodi, sxema va admin to'lovlar ro'yxati saqlangan (ISSUE-080 PARTIAL) | D-014 |

`isPremium` faqat admin qo'lda qo'yadigan belgi sifatida qoldi; bu product rule'ga zid emas. Vakansiya joylash, ariza, nomzodlar bazasi va chat hech qanday tarif tekshiruvisiz ishlaydi.

# i18n

- Tillar: `uz` (prefikssiz), `/ru`, `/en`. Tarjima kalitlari `types.ts` orqali tiplangan, shuning uchun biror tilda kalit yetishmasa web typecheck yiqiladi.
- Brauzer tekshiruvi (PHASE 5.1): ru va en da 66 ta yuklash bo'ldi. UI elementlarida (h1–h3, tugma, label, nav) o'zbekcha apostrofli so'z heuristikasi 24 yuklashda ishladi. Hammasi ma'lumotlar bazasidagi kontent (vakansiya, maqola va kompaniya nomlari), hudud va kategoriya nomlari ("Farg'ona", "Qurilish, ko'chmas mulk") yoki backend bildirishnoma sarlavhasi ("Ariza holati o'zgardi").
- "undefined", "NaN", "[object Object]" matnlari: 0 ta yuklashda.
- Ochiq: ISSUE-073 (backend xato va bildirishnoma matnlari faqat o'zbekcha, zod default xabarlari inglizcha, ayrim joylarda hudud nomlari tarjimasiz), ISSUE-091 (raqam formati hamma tilda ru-RU, 404 sahifasida til almashtirish, terminologiya), ISSUE-103 (havolalarda til prefiksi).
- Ikkinchi auditda yangi UI matnlari uch tilda qo'shildi: bildirishnoma yuklanmagani, nomzodlar sahifasi (yana ko'rsatish, kompaniya profili kerak), kompaniya vakansiyalari soni, ariza ro'yxati chegarasi, qayta e'lon qilishda telefon tasdig'i.

# SEO

| Muammo | Holat | Izoh |
|---|---|---|
| ISSUE-005 JSON-LD XSS | FIXED | `serializeJsonLd()` |
| ISSUE-034 OG rasm | FIXED | Faqat faol e'lon, yashirin maosh chiqmaydi, `immutable` olib tashlandi |
| ISSUE-057 ko'rishlar hisoblagichi | FIXED | `$inc`, `updatedAt` va sitemap `lastmod` buzilmaydi |
| ISSUE-092 robots.txt | FIXED | Mavjud bo'lmagan yo'llar olib tashlandi |
| ISSUE-056 sitemap | PARTIAL | Bo'sh va bloklangan kompaniyalar chiqmaydi, tartib bor; kesh va 50k dan katta bo'laklash yo'q |
| ISSUE-072 JobPosting | PARTIAL | Valyuta va `sameAs` tuzatildi; `validThrough` yo'q |
| ISSUE-070 detail sahifada API xatosi | NOT FIXED | 200 + noindex qaytadi (D-027) |
| ISSUE-071 canonical va hreflang | NOT FIXED | Query parametrlar tashlanadi |
| ISSUE-093 `_error` meta | NOT FIXED | |
| ISSUE-103 havolalarda til prefiksi | NOT FIXED | |
| ISSUE-100 Vercel va self-hosted farqi | NOT FIXED | Deploy qarori foydalanuvchida |

Brauzer tekshiruvi (PHASE 5.1): 200 javobli 288 ta sahifa yuklanishining hammasida `<title>` va `h1` bor. Noma'lum manzillar 404 qaytaradi (43 yuklash). Eski va xizmat manzillari yo'naltiriladi: `/pricing` → `/employer`, `/search/vacancy?text=react` → `/vacancies?q=react`, `/article` → `/articles`, `/vacancy/<slug>` → `/vacancies/<slug>` (mavjud bo'lmagan slug uchun 404).

Yakuniy build'dagi brauzer regressiyasi (PHASE 6): 200 javobli 288 ta yuklashda `<title>` yo'q — 0, `h1` yo'q — 0. Ikkinchi auditda robots.txt qoidalari e2e'da haqiqiy tasdiq bilan tekshiriladi (`[PHASE6-U31]`).

# Responsive

- Matritsa (PHASE 5.1): 7 viewport (360, 390, 430, 768, 1024, 1280, 1440), 49 marshrut, 4 rol (mehmon, nomzod, ish beruvchi, admin), 331 yuklash. 21 marshrut brief'dagi 6 viewportning hammasida tekshirildi; qolganlari 390 va 1280 da.
- Gorizontal toshish: 0 yuklashda.
- Tuzatildi: ISSUE-074 (mobil menyu client-side navigatsiyadan keyin yopiladi).
- Ochiq: ISSUE-081 (100vh, tor sidebar sarlavhasi, grid qoidasi, illyustratsiyalarning tungi varianti), ISSUE-085 (bosh sahifa kartasida ish joylashuvi ko'rsatilmaydi).

Tungi rejim: 50 ta tungi yuklashning 50 tasida `dark` klassi qo'llangan. Kontrast muammosi ochiq (ISSUE-076): tungi `text-signal` 3.96:1, tungi `bg-signal` ustidagi oq matn 4.47:1.

Yakuniy build'dagi qayta tekshiruv (PHASE 6): 331 yuklash, 49 marshrut, 7 viewport (360: 21, 390: 104, 430: 21, 768: 21, 1024: 21, 1280: 122, 1440: 21), tillar (en: 33, ru: 33, uz: 265), rollar (admin: 26, employer: 58, guest: 182, seeker: 65). Gorizontal toshish: 0 yuklashda. Tungi rejim: 50 yuklashning 50 tasida qo'llangan. 21 marshrut brief'dagi 6 viewportning hammasida tekshirildi.

# Accessibility

- Qisman (ISSUE-075): qo'ng'iroq `aria-label` o'qilmaganlar soni bilan, nomzodlar qidiruvida label. Custom Select klaviatura boshqaruvi, popover'larda Esc, StarInput semantikasi va skip link qilinmadi.
- Ochiq: ISSUE-076 kontrast (kunduzgi `text-dusk/80` 3.59:1, WCAG AA talabi 4.5:1), ISSUE-077 (`prefers-reduced-motion` e'tiborsiz).
- Avtomatik a11y vositasi (masalan axe) ishlatilmadi: NOT RUN.

Ikkinchi auditda: qo'ng'iroq xatoda matn va "Qayta urinish" tugmasini ko'rsatadi (brauzer P1 PASS); admin jadvali yuklanishda `aria-busy` skelet ko'rsatadi (brauzer P7 PASS).

# Regression

Barcha natijalar yakuniy ishchi daraxtda olingan (PHASE 6 tuzatishlari va follow-up'lardan keyin).

| Tekshiruv | Natija | Izoh |
|---|---|---|
| API typecheck | PASS | `tsc --noEmit` |
| API build | PASS | `tsc -p tsconfig.json`. `npm run build` dagi `prisma generate` ishlab turgan API query engine DLL'ini qulflagani uchun EPERM berdi; PHASE 6 da sxema o'zgarmagani uchun client qayta generatsiya qilinmadi |
| Web typecheck | PASS | `tsc --noEmit` |
| Web build | PASS | `vike build` |
| API e2e | 94/94 PASS | `ishbor_e2etest`, production rejim. Bir urinish (run 2) parallel jarayon to'xtatilganda uzilib qoldi (natija bermadi); keyingi to'liq urinish 94/94 |
| Web unit-check | 3/3 PASS | `npm run test:unit` |
| Brauzer xato holatlari va seans | 9/9 PASS | E1–E6 (API xatosi bo'sh holat emas), S1 (401 → refresh → qayta urinish), S2–S3 (`returnTo`) |
| Brauzer PHASE 6 holatlari | 9/9 PASS | P1–P8 (qo'ng'iroq, Telegram, COMPANY_REQUIRED, kesilgan ro'yxat, kompaniya vakansiyalari soni, hududlar, admin filtri, ikki tab) |
| Brauzer regressiyasi | PASS | 331 yuklash, 49 marshrut, 7 viewport (360: 21, 390: 104, 430: 21, 768: 21, 1024: 21, 1280: 122, 1440: 21), tillar (en: 33, ru: 33, uz: 265), rollar (admin: 26, employer: 58, guest: 182, seeker: 65) |
| Sintetik benchmark | Bajarildi | Oldin va keyin, "10K User Data Scale" bo'limida |
| Query explain | PASS (PHASE 5) | 15 asosiy so'rov indeksda |

Brauzer regressiyasi tafsiloti:

| O'lchov | Qiymat |
|---|---|
| HTTP holatlari | 200: 288, 404: 43 |
| 5xx javob yoki tarmoq so'rovi | 0 |
| Navigatsiya xatosi | 0 |
| Gorizontal toshish | 0 |
| "undefined" / "NaN" / "[object Object]" | 0 |
| Ataylab noma'lum manzildagi 404 konsol xabari | 43 |
| Boshqa konsol xatolari | 0 |
| Tungi rejim qo'llanishi | 50/50 |
| 200 javobda title / h1 yo'q | 0 / 0 |
| ru/en da o'zbekcha matn (heuristika) | 24 yuklash (kontent va backend matnlari, ISSUE-073) |
| Brief'dagi 6 viewportning hammasida tekshirilgan marshrutlar | 21 |

NOT RUN: concurrent yuk testi (talab qilinmagan), avtomatik a11y vositasi, Meilisearch yo'li, Telegram/SMTP/push kanallari, Google orqali kirish, baza nosozligini simulyatsiya qilish (ISSUE-113, ISSUE-114 1011 yo'li).

# Second Audit

Birinchi tuzatishlardan keyin 5 yo'nalishda qayta audit o'tkazildi: API authz/security, API data/performance, web session/realtime, web UI holatlari/i18n, testlar va hujjatlar. Savol: "yangi xato qayerda bo'lishi mumkin?".

- 46 ta xom topilma, 3 tasi takror; 43 ta noyob muammo (ISSUE-104 … ISSUE-146): P1 1 ta, P2 16 ta, P3 26 ta.
- P0–P2 dan 9 tasi alohida verify agenti tomonidan rad etishga urinib tekshirildi: hammasi tasdiqlandi, 3 tasining severity'si pasaytirildi. Qolgan 37 tasidan 31 tasining kodini lead auditor fix'dan oldin o'qib tasdiqladi.

6.2 bo'yicha topilgan second-order xato turlari:

| Tur | Misollar |
|---|---|
| Permission regression | ISSUE-108: ISSUE-035 fix'i faqat admin yo'llarini qamragan edi; ISSUE-104: suhbatlarda email orqali ISSUE-008 fix'ini chetlab o'tish |
| Stale state | ISSUE-105 (boshqa hisob tokeni), ISSUE-131 (logout'dan keyin token qaytishi), ISSUE-132 (nishonlar 0 ga tushishi), ISSUE-137 (admin eski jadvali), ISSUE-134 (eski reyting) |
| API type mismatch | ISSUE-111 (`total`/`limit` tashlab yuborilgan), ISSUE-128 (detail'da barcha sharhlar), ISSUE-135 (API sahifalaydi, UI yo'q) |
| UI mismatch | ISSUE-115, 116, 117, 118 (xato yoki alohida holat umumiy xato yoki bo'sh holat bo'lib ko'rinardi) |
| Data compatibility | ISSUE-129 (eski masofaviy e'lon PUT'da 400) |
| Realtime va background | ISSUE-114 (baza xatosida WS abadiy o'chiq), ISSUE-133 (4401 aylanishi), ISSUE-109/110 (sweep dublikati va yo'qolgan oyna), ISSUE-112 (ommaviy xabar Telegram/SMTP'ni to'ldiradi) |
| Konfiguratsiya | ISSUE-119 (namunaviy sirlar production'da o'tardi), ISSUE-141 (CORS preview izohi) |
| Test va hujjat bo'shliqlari | ISSUE-120, 121, 140, 142–146 |
| Migration mismatch | Topilmadi: PHASE 6 da sxema o'zgarmadi |
| Missing translation | Yangi topilmadi; yangi UI matnlari uch tilda qo'shildi va tiplar orqali tekshirildi |
| Broken SEO | Yangi topilmadi; robots.txt tekshiruvi haqiqiy tasdiq bilan kuchaytirildi |

6.1 regressiya taqqoslash (birinchi audit muammolari, PHASE 6 dan keyin): FIXED 62, PARTIAL 19, NOT FIXED 18, WONT FIX 3, NOT REPRODUCIBLE 1. PHASE 6 da ISSUE-049 NOT FIXED dan PARTIAL ga o'tdi (kalitli kesh). Birorta FIXED muammo qayta ochilmadi; ISSUE-008 va ISSUE-035 ning qamrovi ikkinchi auditda kengaytirildi. Har muammoning test dalili `ISSUES.md` da.

Ikkinchi audit natijasi: FIXED 39, PARTIAL 2 (ISSUE-121 frontend test qamrovi, ISSUE-141 CORS preview testi), NOT FIXED 1 (ISSUE-122 Telegram login testi), WONT FIX 1 (ISSUE-127 maosh saralashi — product qarori).

Fix jarayoni (D-037): 8 fix va 8 review agenti xatosiz tugadi. Reviewerlar o'z fayllarida 5 ta qo'shimcha muammoni tuzatdi; lead auditor keyin 6 ta follow-up kiritdi.

# Remaining Issues

P1:

| ID | Holat | Nega ochiq | Nima kerak |
|---|---|---|---|
| ISSUE-012 | NOT FIXED | Parolni tiklash oqimi yo'q; email infratuzilmasi tasdiqlanmagan | Qaror: email yoki Telegram orqali tiklash |
| ISSUE-011 | PARTIAL | IP limiti soxta `X-Forwarded-For` bilan chetlab o'tiladi | Railway proxy hop sonini tekshirib `TRUST_PROXY=1` |
| ISSUE-026 | WONT FIX | Yangi modullar git'da untracked: HEAD'dan build yiqiladi | Commit (foydalanuvchi qarori) |

P2:

| ID | Holat | Qisqacha |
|---|---|---|
| ISSUE-028 | WONT FIX | `prestart: prisma db push` production'da |
| ISSUE-029 | PARTIAL | PDF rezyume autentifikatsiyasiz URL |
| ISSUE-042 | PARTIAL | Email tasdiqlash yo'q, Google birlashtirish xavfi |
| ISSUE-045 | PARTIAL | Katta ish beruvchi murojaatlari 3.5 s / 2.6 MB |
| ISSUE-046 | PARTIAL | Suhbatlar ro'yxatida cursor sahifalash yo'q |
| ISSUE-048 | PARTIAL | Regex matn qidiruvi, cold facets 0.6 s |
| ISSUE-049 | PARTIAL | Cold katalog 0.75 s, denormalizatsiya yo'q |
| ISSUE-056 | PARTIAL | Sitemap keshsiz, 7.2 MB bitta fayl |
| ISSUE-058 | PARTIAL | Vakansiya tahriri butun ro'yxatni yuklaydi |
| ISSUE-062 | PARTIAL | `ws` devDependency, lokal `.env` qoldiqlari |
| ISSUE-063 | PARTIAL | Repo'da frontend/brauzer testi yo'q |
| ISSUE-066 | PARTIAL | Rol guard'lari faqat client tomonda (UX) |
| ISSUE-069 | PARTIAL | Maqolalar API'sida SSR timeout yo'q |
| ISSUE-070 | NOT FIXED | Detail sahifada API xatosi 200 + noindex |
| ISSUE-071 | NOT FIXED | Canonical va hreflang query parametrlari |
| ISSUE-072 | PARTIAL | JobPosting `validThrough` yo'q |
| ISSUE-073 | NOT FIXED | Backend matnlari faqat o'zbekcha |
| ISSUE-075 | PARTIAL | Klaviatura, Esc, skip link |
| ISSUE-076 | NOT FIXED | Kontrast WCAG AA dan past |
| ISSUE-077 | NOT FIXED | Reduced motion |
| ISSUE-078 | NOT FIXED | Web CSP yo'q |
| ISSUE-121 | PARTIAL | Frontend unit testlari qisman |
| ISSUE-122 | NOT FIXED | Telegram login testi yo'q |

P3 (ochiq): ISSUE-080, 081, 083, 085, 087, 089, 090, 091, 093, 095, 096, 098 (WONT FIX), 099, 100, 101, 103, 127 (WONT FIX), 141.

ID berilmagan kuzatuvlar (reviewer va benchmark):

- Nomzodlar bazasi 8 000 nomzodda p50 ~2 s (ehtimoliy sabab: relation filterlar; tasdiqlanmagan).
- Obuna xabarnomasi bir oynada ko'pi bilan 20 ta vakansiyani sanaydi; qolganlari e'lon qilinmaydi (oldindan mavjud xatti-harakat).
- Nomzodlar bazasi offset sahifalash: sahifalar orasida to'plam o'zgarsa bitta nomzod o'tib ketishi mumkin.
- Kompaniya sahifasida sharhlar tabi 200 tagacha yuklangan ro'yxat sonini ko'rsatadi.
- Aloqa formasi Telegram 429 bo'lsa 30 s gacha kutishi mumkin.
- Deploy tartibi: vakansiya detail javobidan `company.reviews` olib tashlandi; web va API birga deploy qilinishi kerak.

# Product Decisions

| Qoida (source of truth) | Qayerda majburlanadi | Dalil |
|---|---|---|
| Platforma bepul, faol vakansiya limiti yo'q | API: 402 va limit yo'q; billing bayroq ortida | e2e |
| Kategoriya majburiy; ish joylashuvi majburiy; hudud office va hybrid'da majburiy, remote'da ixtiyoriy | `vacancies.rules.ts`: yaratish, tahrirlash, qayta e'lon qilish | e2e "vakansiya joylashuvi", `[ISSUE-025/024/059]` |
| Eski ma'lumot backward compatible | `workplaceType` yo'q eski e'londa `employmentType=remote` fallback; `typ` va `v` siz eski tokenlar muddati tugaguncha qabul qilinadi | Kod, e2e legacy vakansiya |
| Moderatsiya va xavfsizlik qoidalari saqlandi | Rad etilgan e'lon tahrirlansa moderatsiyaga tushadi; noqonuniy holat o'tishi 409; rad etilgan sharh tahriri moderatsiyaga | e2e |
| Ish beruvchi boshqa kompaniya resursiga kira olmaydi | Egalik tekshiruvi va indeksli ID so'rovlari | e2e `[IDOR]`, begona arizalar 403 |
| Nomzodning shaxsiy ma'lumoti ochilmaydi | Kontaktlar faqat ariza yuborgan nomzod uchun; ochiq javoblar whitelist | e2e `[ISSUE-001]`, `[ISSUE-007/008]` , `[PHASE6-V1]` (suhbatlarda email yo'q), `[PHASE6-U33]` (bloklangan va qoralama rezyumeli nomzod chiqmaydi) |

Lead auditor qarorlari: `DECISIONS.md` (D-001 … D-039). Foydalanuvchi qarori kerak bo'lgan masalalar "Remaining Issues" bo'limida va yakuniy hisobotda.

# Recommendations

**1. Keyingi modul: parolni tiklash (ISSUE-012)**
- **WHY:** Parolini unutgan foydalanuvchi faqat yordam xizmati orqali kira oladi; bu asosiy auth bo'shlig'i.
- **IMPACT:** Hisobini yo'qotgan nomzod va ish beruvchilar qaytadi; yordam xizmatiga yuk kamayadi.
- **PRIORITY:** P1.
- **EFFORT:** M (2–3 kun): tiklash tokeni, rate limit, 2 sahifa, email yoki Telegram kanali. Oldin kanal qarori kerak.

**2. Keyingi sprint texnik yaxshilanish: commit, CI va ogir ro'yxatlar**
- **WHY:** Untracked fayllar tufayli HEAD'dan build yiqiladi (ISSUE-026); testlar qo'lda ishga tushiriladi; katta ish beruvchi murojaatlari 3.5 s.
- **IMPACT:** Deploy xavfsiz va takrorlanadigan bo'ladi; regressiyalar PR bosqichida ushlanadi.
- **PRIORITY:** P1 (commit va CI), P2 (murojaatlarni server tomonida sahifalash, rezyumeni tanlanganda yuklash).
- **EFFORT:** S (commit, CI'da typecheck, build, e2e, unit-check), M (murojaatlar sahifalash).

**3. Biznes funksionallik: ariza holati mashinasi va email tasdiqlash**
- **WHY:** Mantiqsiz holat o'tishlari mumkin (D-019); email tasdiqlanmagani Google birlashtirishni xavfli qiladi (ISSUE-042).
- **IMPACT:** Nomzod uchun ishonchli jarayon; hisob egallash xavfi yopiladi.
- **PRIORITY:** P2.
- **EFFORT:** S (holat mashinasi, qoidalar qaroridan keyin), M (email tasdiqlash).

**4. Performance investitsiyasi**
- **WHY:** Cold katalog va facets 0.6–0.75 s, nomzodlar bazasi ~2 s, regex matn qidiruvi, 7.2 MB sitemap.
- **IMPACT:** Katalog, filtr va qidiruv sahifalari barqaror tez; hajm o'sganda chiziqli sekinlashuv to'xtaydi.
- **PRIORITY:** P2.
- **EFFORT:** M: kompaniya hisoblagichlarini denormalizatsiya qilish; nomzodlar so'rovini ID bosqichlariga o'tkazish; production'da Meilisearch yoqish (mavjud integratsiya); sitemap bo'laklash va kesh.

**5. Qolgan xavfsizlik ishlari**
- **WHY:** Web CSP yo'q (ISSUE-078), access token `localStorage` da (ISSUE-083), IP limiti proxy sozlamasiga bog'liq (ISSUE-011), PDF rezyume ochiq URL (ISSUE-029).
- **IMPACT:** XSS ta'siri kamayadi, brute-force va shaxsiy fayl oshkorligi yopiladi.
- **PRIORITY:** P1 (`TRUST_PROXY`), P2 (CSP, rezyume), P3 (token saqlash).
- **EFFORT:** S (`TRUST_PROXY`), M (CSP hash va deploy manzillari), M (autentifikatsiyali rezyume endpointi).

**6. Analitika va monitoring**
- **WHY:** Bildirishnoma xatolari, sekin so'rovlar va fon ishlari (obuna sweep, ommaviy xabar) faqat logda.
- **IMPACT:** Muammolar foydalanuvchi shikoyatidan oldin ko'rinadi.
- **PRIORITY:** P2.
- **EFFORT:** S–M: mavjud Fastify loglaridagi `responseTime` bo'yicha sekin so'rov ogohlantirishi, `/health` uptime tekshiruvi, sweep va broadcast natijalarini log'da hisoblash, MongoDB slow query profiler. Yangi servis qo'shishdan oldin hosting imkoniyatlari tekshirilsin.

**7. Product bo'shliqlari**
- **WHY:** RU/EN interfeysda backend matnlari o'zbekcha (ISSUE-073); kontrast va reduced motion (ISSUE-076, 077); detail sahifalarda vaqtinchalik xato indeksdan chiqaradi (ISSUE-070).
- **IMPACT:** Rus va ingliz tilli foydalanuvchilar, imkoniyati cheklangan foydalanuvchilar va SEO trafik.
- **PRIORITY:** P2.
- **EFFORT:** M (xato kodlari bo'yicha frontend tarjimasi), S (kontrast tokenlari, dizayn qaroridan keyin), M (503 va `_error` oqimi).


---

# ROUND 3 — YAKUNIY HISOBOT (2026-09-18)

Bu bo'lim Round 3 (AUTH/TELEGRAM qoidalari A–L, xavfsizlik, performance, 10K ma'lumot hajmi) natijasi. Yuqoridagi bo'limlar Round 1–2 ga tegishli va tarix sifatida saqlanadi. Har bir raqam haqiqatda ishga tushirilgan buyruq natijasi; ishga tushirilmagan narsa "ishga tushirilmadi" deb yozilgan.

## 1. Executive Summary

- Telegram endi **kirish usuli emas**: `/api/auth/telegram/start` va `/poll` olib tashlandi, bot seans bermaydi (Rule A). Telegram faqat telefon tasdig'i, parol tiklash, telefon almashtirish, zaxira telefon va hisob bog'lash uchun ishlatiladi.
- **Parolni tiklash faqat Telegram orqali** ishlaydi: bir martalik, 15 daqiqalik, bazada faqat sha256 ko'rinishida saqlanadigan deep-link payload va reset tokeni; tiklashdan keyin barcha seanslar, refresh tokenlar va ochiq WebSocket'lar bekor qilinadi (Rule B, I, J).
- Parol ham, telefon/Telegram ham yo'qolgan holat uchun **qo'lda (admin) tiklash** qo'shildi; admin parolni ham, xom tokenni ham ko'rmaydi; har qadam `SecurityEvent` jurnaliga yoziladi (Rule H, L).
- Telefon va Telegram identity **yagona**: bitta raqam va bitta Telegram hisobi faqat bitta ISH BOR! hisobiga bog'lanadi; jim ko'chirish yo'q (Rule E, F, G).
- Web'da **CSP (nonce)**, PDF rezyumelar faqat **avtorizatsiyali endpoint** orqali, `TRUST_PROXY` sukuti `1`, start paytida sxema o'zgarishi (`prisma db push`) olib tashlandi.
- 10K sintetik bazada ish beruvchi arizalari **3119 ms / 2.6 MB → 259 ms / 38 KB**, nomzodlar bazasi **1803 → 309 ms**, suhbatlar **423 → 54 ms**.
- Testlar: e2e **120/120**, yangi auth/Telegram harness **50/50**, web unit **hammasi o'tdi**, brauzer regressiyasi **331 sahifa yuklash, 0 navigatsiya xatosi**.
- Ochiq qolganlar: dastlabki auditning adversarial verify bosqichi bajarilmadi (D-081); keng matnli ariza qidiruvi ~3.1 s (D-082); production uchun operator amallari (untracked fayllarni commit qilish, bitta domen, Telegram bot tokeni).

## 2. Initial Audit

| Ko'rsatkich | Soni |
|---|---:|
| Finder yo'nalishlari | 18 + completeness critic + 5 qo'shimcha |
| Xom topilmalar | 303 (P0 0, P1 62, P2 133, P3 108) |
| Noyob muammolar (sintezdan keyin) | 230 (P1 42, P2 101, P3 87) |
| Yangi ID lar | 119 (ISSUE-147 … ISSUE-265) |
| Mavjud ID ning qayta topilishi | 111 |
| Adversarial verify | **bajarilmadi** — 185 agent hisob limiti sababli tushib qoldi (D-081) |

Barcha 230 muammo keyinchalik fix agentlari, mustaqil reviewer'lar, testlar va ikkinchi audit bilan kod ustida tekshirildi. Yakuniy holat: **FIXED 125, PARTIAL 90, WONT FIX 12, NOT FIXED 3** (tafsilot: `ISSUES.md` Round 3 bo'limi).

## 3. Security Findings

| Muammo | Oldin | Keyin | Dalil |
|---|---|---|---|
| Telegram orqali parolsiz kirish (bot seans berardi, logout-all dan omon qolardi) | P1 | FIXED | auth-check `[D-041]` 404 va callback seans bermaydi |
| Deep-link bog'lash tasdiqsiz; chat boshqa hisobdan jim ko'chirilardi | P1 | FIXED | `[D-043]` dublikat identity, `[D-044]` private chat |
| Tasdiqlangan telefon unique emas, jim qayta yoziladi | P1 | FIXED | `[D-043]` dublikat telefon, `[D-048]` almashtirish |
| Google hisobi tasdiqlanmagan parol hisobiga avtomatik birlashardi | P1 | FIXED (kod), test qilinmadi | Google ID token kerak; kod `googleLogin` da |
| Login lockout faqat email bo'yicha (DoS) | P1 | FIXED | email+IP kalit, email bo'yicha yuqori chegara |
| `TRUST_PROXY=true` — X-Forwarded-For soxtalashtiriladi | P1 | FIXED | sukut `1`, Railway manbalari DEPLOY.md da |
| `ADMIN_EMAIL` mavjud hisobni har startda admin qilardi | P1 | FIXED | e2e `[D-069]` |
| Admin arxivlagan vakansiyani ish beruvchi qayta faollashtirardi | P1 | FIXED | e2e `[D-070]` 409 VACANCY_LOCKED |
| Tasdiqlangan belgi nom/logo o'zgarganda saqlanardi | P1 | FIXED | e2e `[D-073]` |
| Rad etilgan sharhni o'chirib qayta yuborish moderatsiyani chetlab o'tardi | P1 | FIXED | e2e `[D-075]` |
| PDF rezyume ochiq `/uploads/*.pdf` bearer URL | P2 | FIXED | e2e: `/uploads/*.pdf` va `;`-variantlar 404; egasi va vakolatli ish beruvchi oladi |
| Web'da CSP yo'q (token localStorage'da) | P2 | FIXED | preview javobida `content-security-policy` nonce bilan |
| Nomzodlar bazasiga telefon tasdig'isiz ommaviy kirish | P1 | FIXED | `[D-071]` 403 PHONE_NOT_VERIFIED, kvota |
| WS xabari telefon gate'ni chetlab o'tardi | P2 | FIXED | wave 2 `realtime-2` |
| Refresh cookie third-party (Safari/Brave) | P1 | WONT FIX (kodda) | D-076: bitta domen — operator amali |
| Refresh token rotation yo'q | P2 | WONT FIX | D-079 |

**Oldingi P0 regressiyasi** (Round 1–2: parol hashi oqishi, SVG/XSS, WS crash, CORS, JSON-LD XSS, seans bekor qilish, bloklangan token, yashirin maosh, WS token logi, noto'g'ri ID 500, IDOR, rezyume oqishi) — `e2e-check.mjs` dagi tegishli tekshiruvlarning barchasi **o'tdi** (120/120).

## 4. Auth / Telegram

| Qoida | Holat | Test dalili (`scripts/auth-telegram-check.mjs`, 50/50) |
|---|---|---|
| A — Telegram login emas | PASS | login yo'llari 404; callback seans bermaydi |
| B — faqat Telegram orqali tiklash | PASS | start → bot → reset havolasi → check → reset |
| C — oddiy `/start` sayt havolasi | PASS | `[D-046]` |
| D — xavfsiz payload (tasodifiy, qisqa, bir martalik, replay himoyasi, PII siz) | PASS | yaroqsiz / eskirgan / ishlatilgan payload uchun bitta umumiy javob |
| E — asosiy telefon unique va tasdiqlangan | PASS | dublikat telefon rad etiladi |
| F — zaxira telefon tasdiqlangan, unique, tiklashda ishlaydi | PASS | zaxira identity bilan tiklash |
| G — telefon almashtirish (parol + Telegram, seanslar bekor) | PASS | `[D-048]` |
| H — qo'lda tiklash (admin) | PASS | so'rov → admin tasdig'i → davom etish → bot → yangi parol |
| I — tokenlar bir martalik, qisqa, hash, replay himoyasi, rate limit | PASS | bir martalik, muddati o'tgan, eski token bloklanadi |
| J — tiklashdan keyin barcha seanslar bekor | PASS | eski access/refresh rad etiladi |
| K — Telegram mavjud emas | PASS | 503 `TELEGRAM_UNAVAILABLE`, UI xabari |
| L — audit jurnal, sirlar logda yo'q | PASS | SecurityEvent meta'da maxfiy maydon yo'q; server logida parol/token/kod yo'q |

Tekshirilmaganlar (ochiq aytiladi): Google orqali kirish (haqiqiy Google ID token kerak), haqiqiy Telegram long-polling (test rejimida faqat update ishlovchilari), rate-limit oynalarining real vaqtdagi xatti-harakati, tiklash oqimining brauzerdagi to'liq (bot bilan) e2e sinovi.

## 5. Candidate

- Ariza: parallel ikki so'rov bitta ariza yaratadi (P2002 va MongoDB P2034 write conflict ikkalasi ham boshqariladi); boshlang'ich "sent" tarix yozuvi bitta tranzaksiyada.
- PDF rezyume faqat egasiga (`/api/resume-files/me`) va vakolatli ish beruvchiga.
- Mehmon vakansiya sahifasidan login qilsa qaytish manzili saqlanadi (wave 2).
- Bildirishnomalar joriy tilda (payload.i18n), cursor sahifalash; suhbat tarixi "eskiroq xabarlar" bilan.
- Ochiq: rezyume saqlanganda avtomatik chop etilishi va open-to-work sukuti — owner savoli.

## 6. Employer

- Arizalar ish maydoni server tomonida sahifalanadi (pageSize ≤ 50), filtrlar va holat sonlari serverda; detail alohida endpoint.
- Vakansiyalar dashboardi va tahrirlash formasi to'liq ro'yxatni yuklamaydi (slim ro'yxat + bitta e'lon endpointi).
- Admin qulfi, rad etishning majburiyligi (bir hujjat doirasida), arizasi bor e'lon o'chirilmaydi — arxivlanadi.
- Nomzodlar bazasi telefon tasdig'i va kvota bilan (bepul qoladi).

## 7. API

- Yangi endpointlar: `POST /api/auth/recovery/{start,check,reset,manual,manual/status,manual/continue}`, `POST /api/auth/phone/change`, `POST|DELETE /api/auth/phone/backup`, `GET /api/resume-files/me`, `GET /api/resume-files/application/:id`, `GET /api/employer/applications/:id`, `GET /api/employer/vacancies/:id`, admin `recovery-requests` va `users/:id/security-events`.
- O'chirilgan: `POST /api/auth/telegram/start`, `POST /api/auth/telegram/poll`.
- O'zgargan shakllar: employer applications/vacancies (sahifalangan), notifications/conversations/messages (cursor), telegram status (`backupPhone`, `available`), company reviews (`userId` o'rniga `mine`), profile (`hasResumeFile`).

## 8. Database

- Sxema faqat **additiv** (D-067): User (`backupPhone`, `backupPhoneVerifiedAt`, `backupTelegramId`, `phoneVerifiedAt`, `passwordChangedAt` + indekslar), yangi modellar `AuthChallenge`, `RecoveryRequest`, `SecurityEvent`, Vacancy `adminArchivedAt`, qo'shimcha indekslar.
- `prestart` dagi `prisma db push` olib tashlandi; sxema `npm run db:sync` bilan (D-056).
- Aniqlangan cheklov: Prisma 5.22 MongoDB konnektori bitta `groupBy` da bir nechta nullable ObjectId maydon bo'lsa **panic** beradi — kodda uchta alohida guruhlashga bo'lindi va izohlandi.
- Ochiq: "bitta egaga bitta kompaniya" va "bitta profilga bitta rezyume" kodda tekshiriladi, unique indeks yo'q (data-integrity-13, WONT FIX — mavjud ma'lumotda dublikat tekshiruvi va migratsiya kerak).

## 9. Performance

Asosiy o'zgarishlar: server tomonida sahifalash, slim ro'yxat maydonlari, relation filter ($lookup) o'rniga oldindan aniqlangan ID lar, bitta `groupBy` bilan sonlar, filtr sonlari (facets) uchun kalitli kesh, bo'lingan kesh versiyalari, sitemap uchun jarayon ichidagi kesh, suhbat/xabar/bildirishnoma cursor'lari. Yangi infratuzilma qo'shilmadi (Redis, navbat, Elasticsearch yo'q).

## 10. 10K Data Scale

Sintetik baza `ishbor_scaletest`: 10 001 foydalanuvchi, 20 000 vakansiya, 50 000 ariza, 100 000 bildirishnoma, 5 000 suhbat, 100 000 xabar. O'lchov ketma-ket (bir vaqtdagi yuk emas). BEFORE va AFTER bir xil baza va bir xil sharoitda (ikkala o'lchov ham fonda agentlar ishlayotganda) olingan. To'liq jadval 19-bo'limda.

## 11. Routing

- `/pricing` doimiy 301 → `/employer` (platforma bepul).
- `/login?recover=1|manual|status` va `?reset=<token>` — yangi sahifa yaratilmadi, mavjud login sahifasi rejimlari (D-063).
- Ochiq (P3): `/employer/@slug` noma'lum segmentni doimiy 301 bilan `/companies/<segment>` ga yuboradi (mavjud havolalarni buzmaslik uchun o'zgartirilmadi).

## 12. SEO

- API xatosida detail va ro'yxat sahifalari endi **503** (noindex), topilmasa **404**; oldin 200 + noindex yoki indekslanadigan xato sahifasi edi.
- Ro'yxat `+Head` detail sahifalarga meros bo'lib dublikat meta bermaydi.
- Canonical/hreflang ma'noli query parametrlarini saqlaydi; `validThrough` faqat `expiresAt` bo'lsa chiqadi (D-066).
- OG rasm kirill shriftlari bilan (o'rnatilgan `@fontsource` paketlaridan).
- Ochiq: tarjima qilinmagan kontent ru/en hreflang alternativ sifatida (WONT FIX, owner qarori).

## 13. I18N

- Bildirishnomalar `payload.i18n` orqali joriy tilda (uz/ru/en), eski yozuvlar saqlangan matn bilan (D-059); shablon kalitlari uch tilda bir xil (unit test).
- Ma'lum API xato kodlari tarjima qilinadi (PARTIAL: barcha server xabarlari emas).
- Ochiq: Telegram, push va email matnlari o'zbekcha (foydalanuvchi tili saqlanmaydi).
- Brauzer regressiyasidagi "ru sahifada o'zbekcha matn" topilmalari demo **kontent** (vakansiya va kompaniya nomlari), UI satrlari emas.

## 14. Accessibility

| O'lchov (axe-core 4.13, WCAG 2.1 A/AA) | Oldin | Keyin |
|---|---|---|
| Sahifa yuklashlari | 78 | 84 (yangi tiklash rejimlari qo'shildi) |
| color-contrast | 43 yuklash / **192 element**, ko'plab komponentlar | 48 yuklash / 51 element — **hammasi bitta `aria-hidden` dekorativ footer watermark** (axe'ning ma'lum false positive'i) |
| definition-list / dlitem | 5 / 3 yuklash | 0 |
| button-name | 0 | wave 1 combobox o'zgarishi 3 ta yangi xato keltirdi → **tuzatildi**, qayta skanerda 0 |

Qo'shilganlar: skip link, klaviatura bilan boshqariladigan Select/LanguageSwitcher/menyular, dialoglarda max-height va ichki scroll, `prefers-reduced-motion`, forma xatolarining e'lon qilinishi va fokus boshqaruvi. Tekshirilmagan: haqiqiy ekran o'quvchi (NVDA/VoiceOver) bilan qo'lda sinov.

## 15. Responsive / Dark

- Brauzer regressiyasi: 331 sahifa yuklash (360/390/430/768/1024/1280/1440, uz/ru/en, light/dark) — **0 navigatsiya xatosi**.
- 6 ta "overflow" topilma o'lchov skriptining xatosi bo'lib chiqdi: `documentElement.scrollWidth` ataylab qilingan `overflow-x-auto` konteynerlar (admin nav, jadval) ichini hisoblagan; `body.scrollWidth` aynan 390. Skript tuzatildi.
- Dark rejimda `--signal` va uning hover holati AA kontrastga keltirildi.

## 16. Infrastructure

- `TRUST_PROXY` sukuti `1` (Railway edge proxy bitta hop; manbalar DEPLOY.md da); deploydan keyin `request.ip` ni `X-Real-IP` bilan solishtirish ko'rsatmasi.
- SSR so'rovlari uchun `SSR_API_KEY` bilan alohida rate-limit kaliti (D-074).
- `TELEGRAM_BOT_TOKEN` production'da majburiy deb hujjatlashtirildi, yo'q bo'lsa startup ogohlantirishi (D-072).
- `docker-compose` servislari faqat `127.0.0.1` da.
- Ochiq (operator amallari): untracked fayllarni commit qilish, web va API ni bitta domen ostiga o'tkazish, `db:sync` ni deploy qadamiga qo'shish.

## 17. Fixes Applied

| Manba | Guruhlar | Natija |
|---|---|---|
| Wave 1 (14 agent: 7 implementer + 7 reviewer) | auth/Telegram, infra/fayllar, CSP/SEO/rezyume, arizalar/nomzodlar performance, a11y, testlar | 14/14 |
| Wave 2 (14 agent) | admin/moderatsiya, kompaniyalar/sharhlar, qidiruv+kesh, bildirishnoma/chat, web i18n, forma a11y, testlar | 14/14 (6 reviewer limit sababli keyinroq qayta ishga tushirildi) |
| Lead (orkestrator) | test va o'lchov natijasida topilgan xatolar | WebSocket 4403, P2034 poyga, Prisma `groupBy` panic, ariza qidiruvi (7.7 s → 1.6–1.8 s), Select `button-name`, admin jadval konteyneri, hujjatlar |

## 18. Tests

| Test | Natija | Izoh |
|---|---|---|
| `npm run build` (API: prisma generate + tsc) | PASS | |
| web `tsc --noEmit` | PASS | |
| web `vike build` | PASS | |
| `npm run test:auth` (yangi harness, `ishbor_authtest`) | **50/50** | Telegram update ishlovchilari test transport bilan |
| `npm run test:e2e` (`ishbor_e2etest`) | **120/120** | Round 2 da 94 ta edi; Round 3 shartnomalari qo'shildi |
| web `unit-check.mjs` | PASS | yangi: tiklash rejimlari, bildirishnoma shablonlari, region nomlari, fayl URL lari |
| Brauzer regressiyasi (`ui_regression.py`) | 331 yuklash, 0 navigatsiya xatosi | qolgan belgilar tahlil qilindi (15-bo'lim) |
| axe-core | 14-bo'lim | |
| 10K benchmark | 19-bo'lim | |
| Ishga tushirilmagan | — | Google login, haqiqiy Telegram polling, ekran o'quvchi, tiklash oqimining brauzerdagi bot bilan to'liq sinovi |

## 19. Before vs After Benchmarks

`ishbor_scaletest`, ketma-ket o'lchov, p50 / hajm (to'liq jadval `scratchpad/round3/bench_compare_r3.md`):

| Endpoint | Oldin p50 | Keyin p50 | Oldin hajm | Keyin hajm |
|---|---:|---:|---:|---:|
| Ish beruvchi arizalari (sukut) | 3119 ms | **259 ms** | 2609 KB | **38 KB** |
| Arizalar 100-sahifa | 3117 ms | **258 ms** | 2609 KB | 38 KB |
| Arizalar holat filtri | 3064 ms | **213 ms** | 2609 KB | 38 KB |
| Arizalar matn qidiruvi (hamma nomzodga mos so'z) | 3042 ms* | 3101 ms | 2609 KB | 38 KB |
| Ariza detail (yangi) | — | 10 ms | — | 1 KB |
| Ish beruvchi vakansiyalari (500) | 126 ms | 150 ms | 998 KB | **13 KB** |
| Nomzodlar bazasi | 1803 ms | **309 ms** | 24 KB | 24 KB |
| Nomzodlar qidiruvi (2 so'z) | 1810 ms | **306 ms** | 24 KB | 24 KB |
| Suhbatlar (500) | 423 ms | **54 ms** | 498 KB | **31 KB** |
| Suhbat tarixi (5000 xabar) | 36 ms | 22 ms | 252 KB | **13 KB** |
| Bildirishnomalar p95 | 270 ms | 27 ms | 8 KB | 9 KB |
| Filtr sonlari (facets) p95 | 554 ms | 94 ms | 9 KB | 9 KB |
| Vakansiya matn qidiruvi | 273 ms | 23 ms | 23 KB | 23 KB |
| Sitemap vakansiyalar | 229 ms | 33 ms | 7189 KB | 7189 KB |
| Kompaniyalar katalogi (cold) | 800 ms | 748 ms | 9 KB | 9 KB |

\* Oldingi endpoint `q` ni umuman qo'llamagan (klient filtrlagan), shuning uchun bu qator teng ish emas. Tor so'rovlar (bitta nomzod) alohida o'lchandi: 2830 ms → 1802 ms, ism+familiya 1757 → 1555 ms (D-082).

## 20. Second Audit

Ikkinchi audit (PHASE 6) fix'lardan keyingi kodni fix'lardan oldingi snapshot bilan solishtirdi: 10 ta o'qish-rejimidagi finder, 2 ta sintez, P0/P1 uchun adversarial verify.

| Ko'rsatkich | Soni |
|---|---:|
| Xom topilmalar | 157 |
| Noyob muammolar | 128 (P0 0, P1 7, P2 32, P3 89) |
| Round 3 o'zgarishlari keltirib chiqargan | 88 |
| P1 natijasi | 6 FIXED, 1 PARTIAL |
| P2 natijasi | 9 FIXED, 23 ochiq (sabablari ISSUES.md da) |

Tasdiqlangan P1 lar va tuzatishlar:

| Muammo | Tuzatish | Dalil |
|---|---|---|
| Parol tiklash / qo'lda tiklash / telefon almashtirishdan keyin eski `phone_change`, `telegram_link` challenge va reset tokenlari ishlab qolardi (hisobni egallash yo'li) | `revokeUserSessions` barcha ochiq challenge'larni bekor qiladi; Telegram uzilganda ham (D-083) | yangi test `[R3-2]`, auth 50/50 |
| `/api/auth/phone/*` eskirgan token bilan ketib, ~15 daqiqadan keyin 401 olardi | fetch interceptor faqat seans endpointlarini chetlab o'tadi | web tsc/build, e2e |
| Redeploy paytida Telegram 409 botni butunlay to'xtatardi (tasdiqlash va tiklash ishlamay qolardi) | 409 vaqtinchalik, oshib boruvchi kutish bilan qayta urinish | kod ko'rib chiqish; haqiqiy bot bilan sinalmadi |
| Havola bilan ochilgan, birinchi sahifada bo'lmagan suhbat tarixi yuklanmasdi | effekt ro'yxatda paydo bo'lishga bog'landi | web tsc/unit |
| D-074 yarim bajarilgan (asosiy SSR fetch'lari `x-ssr-key` yubormasdi) | barcha SSR fetch'lariga `ssrHeaders()` | kod ko'rib chiqish |
| (P2 ga tushirilgan) moderatsiyadagi e'lon yopilib qayta faollashtirilardi | yopishda qulf | kod ko'rib chiqish |
| (P2 ga tushirilgan, PARTIAL) CSP `object-src 'none'` PDF ko'ruvchini bloklashi mumkin | `object-src blob:` | haqiqiy Chrome'da tekshirilmadi |

Tuzatishlardan keyin qayta ishga tushirilgan testlar: auth **50/50**, e2e **120/120**, web unit **PASS**, API build va web tsc/build **PASS**.

## 21. Remaining Issues

Qarang: pastdagi **QOLGAN MUAMMOLAR** bo'limi.

## 22. Decisions Made

DECISIONS.md: D-040 … D-082. Asosiylari: D-040 (mahsulot qoidalari), D-041 … D-052 (AUTH DECISIONS: Telegram login yo'q, DB challenge'lar, identity yagonaligi, tiklash, zaxira telefon, telefon almashtirish, qo'lda tiklash, SecurityEvent, Telegram mavjud emas holati, rate limit), D-053 (TRUST_PROXY=1), D-055 (Google birlashtirmaydi), D-056 (db:sync), D-057 (CSP nonce), D-058 (PDF rezyume), D-059 (bildirishnoma i18n), D-061 (arizalar sahifalash), D-065 (monetizatsiya tasnifi), D-066 (vakansiya muddati), D-067 (additiv migratsiya), D-069 … D-080 (admin, moderatsiya, nomzodlar bazasi, SSR kaliti, sharhlar, cursor, qidiruv), D-081 (verify bo'shlig'i), D-082 (qidiruv chegaralari).

## 23. Product Recommendations

### 1. Telegram botni production'da majburiy servis sifatida rasmiylashtirish
- **WHY:** Telefon tasdig'i (ariza, e'lon, chat, sharh, nomzodlar bazasi) va parol tiklash faqat Telegram orqali ishlaydi; hujjatlar esa uni "ixtiyoriy" deb ko'rsatgan edi.
- **IMPACT:** Bot tokeni yo'q deploy'da yangi foydalanuvchi hech qanday asosiy amalni bajara olmaydi va parolini tiklay olmaydi.
- **PRIORITY:** P1 (operator amali).
- **EFFORT:** S — env va deploy checklist (kod tomoni Round 3 da bajarildi).

### 2. Web va API ni bitta domen ostiga olib o'tish
- **WHY:** `*.vercel.app` + `*.up.railway.app` juftligida refresh cookie third-party bo'ladi; Safari va Brave uni bloklaydi.
- **IMPACT:** Bu brauzerlarda seans 15 daqiqada tugaydi va foydalanuvchi qayta-qayta login qiladi.
- **PRIORITY:** P1.
- **EFFORT:** S — domen sozlash (`ishbor.uz` va `api.ishbor.uz`), kod o'zgarmaydi.

### 3. Nomzod ko'rinishini boshqarish (open-to-work va rezyume chop etish)
- **WHY:** Hozir har bir saqlangan rezyume avtomatik "published" bo'ladi va nomzod sukut bo'yicha barcha ish beruvchilarga ko'rinadi.
- **IMPACT:** Maxfiylik kutilmasi buziladi; ish izlovchi joriy ish beruvchisiga ko'rinib qolishi mumkin.
- **PRIORITY:** P2.
- **EFFORT:** M — profil sozlamasi, rezyume holati va nomzodlar filtri.

### 4. Vakansiya muddati va avtomatik arxiv
- **WHY:** `expiresAt` hech qachon yozilmaydi; eskirgan e'lonlar faol qoladi, JSON-LD `validThrough` esa bo'sh.
- **IMPACT:** Qidiruv sifati, statistika va SEO signali pasayadi.
- **PRIORITY:** P2.
- **EFFORT:** M — muddat maydoni, ogohlantirish bildirishnomasi va kunlik arxiv jarayoni.

### 5. Bildirishnomalar uchun saqlash muddati (retention)
- **WHY:** Har broadcast har foydalanuvchiga bitta hujjat yozadi; tozalash yo'q.
- **IMPACT:** 10 000 foydalanuvchida kolleksiya tez o'sadi va ro'yxat so'rovlari sekinlashadi.
- **PRIORITY:** P2.
- **EFFORT:** S — TTL yoki davriy tozalash + "eski bildirishnomalar o'chiriladi" matni.

### 6. Ommaviy xabar (broadcast) uchun ishonchli mexanizm
- **WHY:** Hozir jarayon xotirasida ishlaydi; deploy yoki restart yarim yo'lda uzadi, holat ko'rinmaydi.
- **IMPACT:** Foydalanuvchilarning bir qismi xabarni olmaydi, admin buni bilmaydi.
- **PRIORITY:** P3.
- **EFFORT:** M — yuborish yozuvlari (kolleksiya) va davom ettirish; navbat servisi shart emas.

### 7. Kompaniya tasdig'i uchun dalil va so'rov oqimi
- **WHY:** Tasdiq bir tugma bilan beriladi, hech qanday hujjat yoki so'rov saqlanmaydi (Round 3 da identity o'zgarsa belgi bekor qilinadi).
- **IMPACT:** Tasdiqlangan belgi ishonchi past qoladi, admin qarori hujjatlanmaydi.
- **PRIORITY:** P3.
- **EFFORT:** M.

### 8. Demo ma'lumotni yangilash
- **WHY:** Demo HR hisobida "Premium tarif faollashtirildi" bildirishnomasi va tarif yozuvlari bor; platforma esa bepul (demo ma'lumot qoidasi sababli Round 3 da tegilmadi).
- **IMPACT:** Demo ko'rsatganda mahsulot qoidasiga zid taassurot.
- **PRIORITY:** P3.
- **EFFORT:** S — seed matnini o'zgartirib qayta seed qilish (owner qarori).

### 9. Meilisearch: sozlash yoki o'chirish
- **WHY:** Meili yoqilganda natijalar, umumiy son va tartib MongoDB yo'lidan farq qiladi; obuna (alerts) boshqa semantikada ishlaydi.
- **IMPACT:** Bir xil so'rov turli sahifalarda turlicha natija beradi.
- **PRIORITY:** P2.
- **EFFORT:** S — yo yagona semantika, yo Meili'ni o'chirib qo'yish.

### 10. Repozitoriyni to'liq commit qilish
- **WHY:** `docs/` va bir nechta asosiy modul untracked; GitHub'dan deploy buzilgan HEAD'ni yig'adi.
- **IMPACT:** Deploy paytida ishlamaydigan build.
- **PRIORITY:** P0 (operator amali; audit qoidasi bo'yicha commit qilinmadi).
- **EFFORT:** S.

## 24. Questions for Owner

Qarang: pastdagi **MENING QARORIM KERAK BO'LADIGAN MASALALAR** bo'limi.

## 25. Final Health Matrix

| Soha | Holat | Asos |
|---|---|---|
| AUTH | **PASS** | A–L qoidalari 50 ta avtomatik tekshiruv bilan; Google login va haqiqiy bot polling sinalmagan (ochiq aytilgan) |
| SECURITY | **WARN** | Barcha P1 tuzatildi; ochiq: third-party refresh cookie (bitta domen kerak, D-076), refresh rotation yo'q (D-079), birinchi Telegram bog'lash parolsiz (D-084) |
| DATABASE | **WARN** | Additiv sxema va indekslar; "bitta egaga bitta kompaniya" bazada majburlanmagan (data-integrity-13) |
| API | **PASS** | e2e 120/120 |
| FRONTEND | **PASS** | tsc va build toza; 331 sahifa yuklash, 0 navigatsiya xatosi |
| PERFORMANCE | **WARN** | Asosiy yo'llar 10–60 barobar tezlashdi; keng matnli ariza qidiruvi ~3.1 s, kompaniyalar katalogi cold ~750 ms |
| 10K DATA | **WARN** | Barcha ro'yxatlar chegaralangan va sahifalangan; yuqoridagi ikki sekin yo'l qoldi |
| RESPONSIVE | **PASS** | 7 viewport, body overflow yo'q |
| DARK MODE | **PASS** | Dark tokenlar AA ga keltirildi; axe dark yuklashlarida real kontrast xatosi yo'q |
| ACCESSIBILITY | **WARN** | axe: real xato 0 (faqat dekorativ false positive); ekran o'quvchi bilan qo'lda sinov yo'q; bir nechta P2 a11y ochiq |
| I18N | **WARN** | UI va sayt ichidagi bildirishnomalar uch tilda; Telegram/push/email o'zbekcha, API xatolarining bir qismi tarjima qilinmagan |
| SEO | **WARN** | 404/503 semantikasi, canonical, dublikat meta tuzatildi; hreflang query parametrlari va tarjima qilinmagan alternativlar ochiq |
| TESTS | **WARN** | Auth/API qamrovi kuchli; yo'q: rate-limit oynalari, CSP tekshiruvlari, Google, haqiqiy bot, brauzerda tiklash oqimining to'liq sinovi |
| INFRA | **WARN** | Operator amallari: untracked fayllarni commit qilish, bitta domen, `TELEGRAM_BOT_TOKEN`, `SSR_API_KEY`, deploy'da `db:sync` |
| PRODUCTION READINESS | **WARN** | Kod darajasidagi blokerlar yopildi; operator checklist bajarilmaguncha production'ga tayyor deb bo'lmaydi. "100% ready" emas. |

## QOLGAN MUAMMOLAR

| # | Muammo | Severity | Nega qoldi | Ta'sir | Tavsiya etilgan fix | Effort | Product qarori kerakmi |
|---|---|---|---|---|---|---|---|
| 1 | Server import qiladigan modullar va `docs/` git'da untracked | P1 (operator) | Audit qoidasi: commit qilinmaydi | GitHub'dan deploy buzilgan build beradi | Barcha fayllarni ko'rib chiqib commit qilish | S | Ha (kim va qachon) |
| 2 | Refresh cookie hujjatlashtirilgan topologiyada third-party | P1 (infra) | Kod bilan emas, domen bilan hal bo'ladi (D-076) | Safari/Brave'da seans ~15 daqiqada tugaydi | `ishbor.uz` + `api.ishbor.uz` | S | Ha (domen) |
| 3 | `TELEGRAM_BOT_TOKEN` production'da majburiy | P1 (config) | Operator sozlamasi | Token bo'lmasa telefon tasdig'i va tiklash ishlamaydi (Rule K xabari chiqadi) | Token va admin chat'ni sozlash | S | Yo'q |
| 4 | Keng matnli ariza qidiruvi ~3.1 s (hamma nomzodga mos so'z) | P2 | Indekslanmaydigan regex + katta ID ro'yxati; yangi infratuzilma taqiqlangan (D-082) | Eng katta ish beruvchida sekin qidiruv | Saqlangan normallashtirilgan qidiruv maydoni + indeks yoki qidiruv dvigateli | M | Yo'q |
| 5 | Birinchi Telegram bog'lash parol so'ramaydi | P2 (security) | Google orqali yaratilgan hisoblar parolni bilmaydi (D-084) | O'g'irlangan seans telefoni tasdiqlanmagan hisobga tiklash kanalini o'rnatishi mumkin | Birinchi bog'lashdan keyin 24 soat tiklashni cheklash yoki Google'da qayta autentifikatsiya | S–M | Ha |
| 6 | Tiklash kvotalari qurbonning tiklash yo'lini vaqtincha bloklashi mumkin | P2 | Ikkinchi auditda topildi, vaqt yetmadi | Hujumchi qurbonni 15 daqiqa–1 soat tiklay olmaydigan qiladi | Raqam+IP kaliti, raqam bo'yicha yuqoriroq chegara (login-guard kabi) | S | Yo'q |
| 7 | Refresh token rotation yo'q | P2 | D-079: seans siyosati saqlandi | O'g'irlangan refresh cookie logout/tiklashgacha ishlaydi | Token oilasi + rotation + reuse detection | M | Qisman |
| 8 | "Bitta egaga bitta kompaniya", "bitta profilga bitta rezyume" bazada majburlanmagan | P2 | Mavjud ma'lumotda dublikat tekshiruvi va migratsiya kerak | Kam ehtimolli poygada dublikat yozuv | Dublikat skani → unique indeks → P2002 ni mavjud yozuvga xaritalash | M | Yo'q |
| 9 | Bildirishnomalar uchun retention yo'q | P2 | Ma'lumot o'chirish owner qarori | Kolleksiya o'sadi | TTL yoki davriy tozalash | S | Ha |
| 10 | Telegram, push va email matnlari o'zbekcha | P2 (i18n) | Foydalanuvchi tili saqlanmaydi (D-059) | RU/EN foydalanuvchi tashqi kanallarda o'zbekcha matn oladi | `User.locale` + kanal shablonlari | M | Yo'q |
| 11 | Kompaniyalar katalogi cold so'rovi ~750 ms | P2 (perf) | $lookup hisoblagichlari; kesh issiq bo'lsa 1–2 ms | Birinchi so'rov sekin | Hisoblagichlarni denormalizatsiya qilish | M | Yo'q |
| 12 | Dastlabki auditning adversarial verify bosqichi bajarilmadi | Jarayon | Hisob limiti (D-081) | Ba'zi topilmalar severity'si oshirilgan bo'lishi mumkin | Fix + reviewer + ikkinchi audit bilan qoplandi | — | Yo'q |
| 13 | CSP `object-src blob:` va PDF ko'ruvchi haqiqiy Chrome/Edge'da tekshirilmadi | P2 | Headless Chromium'da PDF ko'ruvchi yo'q | Rezyume ochilmasa ish beruvchi faylni ko'ra olmaydi | Haqiqiy brauzerda qo'lda tekshirish | S | Yo'q |
| 14 | Ekran o'quvchi (NVDA/VoiceOver) bilan qo'lda sinov qilinmadi | P2 (a11y) | Avtomatlashtirilmaydi | Yashirin a11y xatolari qolishi mumkin | Qo'lda sinov seansi | S | Yo'q |
| 15 | Ikkinchi auditning 23 ta ochiq P2 va 89 ta P3 si | P2/P3 | Vaqt va doira | Polish, UX, hujjat noaniqliklari | ISSUES.md PHASE 6 bo'limidagi tavsiyalar bo'yicha keyingi raund | M | Yo'q |

## MENING QARORIM KERAK BO'LADIGAN MASALALAR

1. **Nomzod ko'rinishi:** rezyume saqlansa avtomatik chop etilsinmi va nomzod sukut bo'yicha barcha ish beruvchilarga ko'rinsinmi? (Hozir: ha.)
2. **Vakansiya muddati:** e'lon necha kundan keyin avtomatik arxivlansin (30 / 60 / hech qachon)?
3. **Bildirishnoma retention:** eski bildirishnomalar necha kundan keyin o'chirilsin (90 kun taklif)?
4. **Billing moduli:** kod bazasidan butunlay olib tashlansinmi yoki flag bilan o'chiq holda tursinmi?
5. **Ariza holati:** qat'iy o'tishlar jadvali kerakmi (masalan "rad etilgan" dan "taklif qilingan" ga qaytish taqiqlansinmi)?
6. **Sharhlar:** avtomatik tasdiq davom etsinmi yoki barcha sharhlar moderatsiyadan o'tsinmi?
7. **Qo'lda tiklash:** admin javob berish muddati va qanday dalil talab qilinsin (pasport, ish joyi, oxirgi ariza)?
8. **Demo ma'lumot:** "Premium tarif" bildirishnomasi va to'lov yozuvlari bilan demo qayta seed qilinsinmi?
9. **Domenlar:** `ishbor.uz` + `api.ishbor.uz` sxemasi tasdiqlanadimi (cookie muammosi shu bilan yopiladi)?
10. **Git:** untracked fayllarni (docs va modullar) kim va qachon commit qiladi?
11. **Telegram bot nomi va admin chat:** production uchun yakuniy token va admin guruh tayyormi?
12. **Zaxira telefon:** bitta Telegram hisobi bilan ham asosiy, ham zaxira raqam tasdiqlanishi mumkinmi yoki har biri alohida Telegram hisobini talab qilsinmi? (Hozir: alohida talab qilinadi.)
13. **Telegram bog'lash:** birinchi bog'lashda parol so'ralsinmi (Google orqali kirganlar uchun muqobil kerak) yoki birinchi bog'lashdan keyin 24 soat parol tiklash cheklansinmi? (D-084)
