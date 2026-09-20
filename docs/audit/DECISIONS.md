# DECISIONS — ISH BOR! audit (2026-09-14)

Har qaror formati: Decision / Context / Evidence / Chosen approach / Alternatives considered / Why chosen / Risk / Result.
Qarorlar xronologik. Kod o'zgarishlariga tegishli qarorlar `ISSUES.md` dagi ID'larga havola qiladi.

---

## D-001 — Audit hujjatlari `docs/audit/` da, mavjud hujjatlar qayta yozilmaydi

- **Decision:** Yangi `docs/audit/{ARCHITECTURE_AUDIT,DECISIONS,ISSUES,FINAL_AUDIT}.md` + `docs/audit/maps/*` yaratildi.
- **Context:** Repo'da `docs/` papkasi va oldingi audit hujjatlari yo'q edi; mavjud `README.md`, `CHANGELOG.md`, `DEPLOY.md`, `apps/web/DESIGN.md`, `tizim-arxitekturasi.md` o'z rollarini saqlaydi.
- **Evidence:** `find . -name "*.md"` → 5 ta fayl, `docs/` yo'q.
- **Chosen approach:** Audit hujjatlari alohida papkada; mavjud hujjatlarga faqat aniq eskirgan faktlar tuzatiladi (README monetizatsiya bandlari, DESIGN.md "bepul tarifda 3 ta").
- **Alternatives:** Hammasini README'ga qo'shish (o'qib bo'lmas darajada uzun bo'lardi); CHANGELOG'ga yozish (audit tarix emas, holat hujjati).
- **Why:** Foydalanuvchi talab qilgan struktura; duplicate system yaratilmadi.
- **Risk:** Yo'q.
- **Result:** Yaratildi.

## D-002 — Commit qilinmaydi; barcha o'zgarishlar ishchi daraxtda

- **Decision:** Audit davomida `git commit` qilinmaydi.
- **Context:** Foydalanuvchi ko'rsatmasi ("COMMIT QILMA"); ishchi daraxtda allaqachon 86 ta commit qilinmagan fayl (sentabr redesign).
- **Evidence:** `git status --short | wc -l` → 86.
- **Chosen approach:** Faqat fayllarni o'zgartirish; hisobotda o'zgargan fayllar ro'yxati beriladi.
- **Alternatives:** Alohida branch/commit — foydalanuvchi taqiqlagan.
- **Why:** Ko'rsatma.
- **Risk:** Foydalanuvchi o'zgarishlarni git diff orqali ko'rishi kerak; audit o'zgarishlari redesign o'zgarishlari bilan aralashadi — hisobotda audit tomonidan tegilgan fayllar alohida ro'yxatlanadi.
- **Result:** Amalda.

## D-003 — Empirik tekshiruvlar faqat izolyatsiyalangan test bazasida

- **Decision:** Barcha "buzuvchi" so'rovlar (SVG upload, 200 KB title, ikkinchi kompaniya, arxivlash) `ishbor_e2etest` bazasi ustidagi alohida API nusxasida (port 4712, `NODE_ENV=production`, `UPLOAD_DIR` scratchpad) bajarildi. Dev bazasi (`ishbor`, demo ma'lumotlar) va `apps/api/uploads/` tegilmadi.
- **Context:** Foydalanuvchi: "production/demo data o'zgartirma"; memory: demo ma'lumotlar foydalanuvchi uchun muhim.
- **Evidence:** `scratchpad/start-probe-api.sh` (DATABASE_URL=…/ishbor_e2etest), e2e skript ham shu bazani `--force-reset` qiladi.
- **Chosen approach:** e2e bazasi (har e2e ishga tushganda tozalanadi) + alohida port.
- **Alternatives:** Dev bazada tekshirish (demo yozuvlarni ifloslantirardi); hech qanday empirik tekshiruv (faqat kod o'qish — kamroq ishonchli).
- **Why:** Haqiqiy natijalar, xavfsiz.
- **Risk:** Test bazasi keyingi e2e ishga tushishida baribir tozalanadi — yo'q.
- **Result:** Probe natijalari `ISSUES.md` evidence'larida ("empirik: …" belgisi bilan).

## D-004 — Hujjat ↔ kod ziddiyatlarida source of truth tartibi

- **Decision:** Ziddiyatda tartib: product rules (foydalanuvchi bergan) → joriy backend/biznes mantiq → DB sxemasi → e2e testlar → joriy frontend xulqi → `apps/web/DESIGN.md` (2026-09) → `README/CHANGELOG/DEPLOY` → `tizim-arxitekturasi.md` (tarixiy).
- **Context:** README monetizatsiya bandlari (tariflar, limit, /pricing) product rule'ga zid; `tizim-arxitekturasi.md` PostgreSQL/Redis deb yozilgan.
- **Evidence:** `ARCHITECTURE_AUDIT.md` §0.7 jadvali.
- **Chosen approach:** README'dagi eskirgan bandlar tuzatiladi; DESIGN.md dagi bitta eskirgan jumla tuzatiladi; `tizim-arxitekturasi.md` tarixiy hujjat sifatida tegilmaydi (o'zida eslatma bor).
- **Alternatives:** Hujjatlarni tegmaslik (foydalanuvchi va kelajakdagi dev chalg'iydi).
- **Why:** Hujjat kod bilan mos bo'lsin, lekin tarixiy loyihalash hujjati o'z qiymatini saqlaydi.
- **Risk:** Yo'q.
- **Result:** PHASE 7 da bajariladi.

## D-005 — Kod fix'lari avtomatik audit (workflow) tugagunga qadar boshlanmaydi

- **Decision:** PHASE 2 (15 yo'nalishli parallel audit + verifikatsiya) tugamaguncha `apps/**` manba kodi o'zgartirilmaydi.
- **Context:** Verifikatsiya agentlari kodni o'qiydi; fix bilan bir vaqtda ishlasa topilmalar "rad etilgan" bo'lib chiqadi va audit natijasi buziladi.
- **Chosen approach:** Workflow davomida faqat o'qish, empirik probe (test bazasi), hujjat tayyorlash, test skriptlarini yozish.
- **Alternatives:** Darhol fix (tezroq, lekin audit natijasi ishonchsiz).
- **Why:** Aniq, takrorlanadigan initial audit → keyin fix → keyin second audit.
- **Risk:** Vaqt; qabul qilinadi.
- **Result:** Amalda.

## D-006 — CORS: `*.vercel.app` wildcard olib tashlandi, preview faqat aniq regex bilan

- **Decision:** Istalgan `*.vercel.app` origin'ga credentials bilan ruxsat berish olib tashlandi. Preview domenlar faqat operator bergan `CORS_PREVIEW_ORIGIN_REGEX` (to'liq moslik) yoki `CORS_EXTRA_ORIGINS` ro'yxati orqali. Ruxsat etilmagan origin 403 `CORS_FORBIDDEN` oladi.
- **Context:** ISSUE-004 (P0). Refresh cookie `SameSite=None` — begona Vercel sayti foydalanuvchi nomidan access token olishi mumkin edi.
- **Evidence:** Oldingi `server.ts` origin callback `/\.vercel\.app$/`; e2e `[ISSUE-004]` preflight tekshiruvi.
- **Chosen approach:** Env orqali aniq regex (bo'sh — preview yo'q); regex yaroqliligi `env.ts` superRefine'da tekshiriladi.
- **Alternatives:** Loyiha nomi bilan qattiq regex kodga yozish (har jamoa/preview nomi o'zgarsa kod o'zgaradi); CORS'ni butunlay o'chirish (dev ishlamaydi).
- **Why:** Xavfsiz sukut, deploy'da moslashuvchan.
- **Risk:** Vercel preview'lari endi API'ga ulanmaydi, operator `CORS_PREVIEW_ORIGIN_REGEX` bermaguncha (DEPLOY.md'da yozildi).
- **Result:** e2e: begona preview 403 va ACAO sarlavhasiz — PASS.

## D-007 — `TRUST_PROXY` sukuti o'zgarmadi; login uchun email bo'yicha limit qo'shildi

- **Decision:** `trustProxy` endi `TRUST_PROXY` env'dan (sukut `true` — avvalgi xatti-harakat). Qo'shimcha ravishda bitta email uchun 15 daqiqada 10 ta noto'g'ri urinishdan keyin 429 (IP'dan qat'i nazar).
- **Context:** ISSUE-011 (P1): `trustProxy: true` bilan `X-Forwarded-For` soxtalashtirilib IP limiti chetlab o'tilardi.
- **Evidence:** Probe: 12 ta turli XFF bilan login — hech biri 429 emas edi. Endi e2e `[ISSUE-011]` — 11-urinish 429.
- **Chosen approach:** Email kalitli xotiradagi hisoblagich (`login-guard.ts`, ≤50k yozuv) + konfiguratsiya qilinadigan hop soni.
- **Alternatives:** Sukutni `1` ga o'zgartirish — Railway'dagi haqiqiy proxy zanjiri tekshirilmagan, noto'g'ri qiymat hamma so'rovni bitta IP qilib saytni bloklashi mumkin; Redis limiter — taqiqlangan (keraksiz infratuzilma).
- **Why:** Tasdiqlanmagan infratuzilma faktiga tayanmasdan brute-force'ni to'xtatadi.
- **Risk:** Hujumchi boshqa odamning emailiga 10 ta noto'g'ri urinish qilib uni 15 daqiqa bloklashi mumkin (lockout DoS) — "MENING QARORIM KERAK" bo'limida. Bir nechta API nusxasida hisoblagich umumiy emas (hozir bitta nusxa).
- **Result:** e2e PASS. Tavsiya: Railway hop sonini tekshirib `TRUST_PROXY=1`.

## D-008 — JWT: HS256 qat'iy, `typ` claim, production'da ≥32 belgili va farqli sirlar

- **Decision:** `jwt.verify` faqat `HS256`; access va refresh tokenlarida `typ` ("access"/"refresh"), eski `typ`siz tokenlar qabul qilinadi. `NODE_ENV=production` da sirlar kamida 32 belgi va bir-biridan farqli bo'lmasa server ishga tushmaydi.
- **Context:** ISSUE-009 (P1).
- **Evidence:** e2e `[ISSUE-009]`: HS512 imzoli va `typ=refresh` token access sifatida — 401.
- **Chosen approach:** Minimal o'zgarish `common/jwt.ts`da; e2e va probe skriptlaridagi test sirlari 32+ belgiga yangilandi.
- **Alternatives:** RS256 (kalit boshqaruvi keraksiz murakkablik).
- **Why:** Algoritm almashtirish va token turlarini aralashtirish hujumlarini yopadi, mavjud seanslarni buzmaydi.
- **Risk:** Prod'da qisqa sir bo'lsa deploy yiqiladi — ataylab (DEPLOY.md'da yozildi).
- **Result:** API typecheck/build/e2e PASS.

## D-009 — Logout va bloklash barcha refresh tokenlarni bekor qiladi (`tokenVersion`)

- **Decision:** `User.tokenVersion Int?` (ixtiyoriy, migratsiyasiz). Refresh token `v` ni saqlaydi. Logout, admin bloklashi va rol o'zgarishi versiyani oshiradi va foydalanuvchining ochiq WebSocket ulanishlarini yopadi (4403).
- **Context:** ISSUE-041, ISSUE-035 (P2): logout'dan keyin eski cookie yangi token berardi; bloklangan foydalanuvchi 30 kun refresh qila olardi.
- **Evidence:** Probe: logout'dan keyin refresh 200 + yangi token. Endi e2e `[ISSUE-041/035]` — `accessToken: null`, WS 4403.
- **Chosen approach:** Foydalanuvchi bo'yicha bitta hisoblagich (bitta indekslangan so'rov refresh'da allaqachon bor).
- **Alternatives:** Qurilma bo'yicha refresh token jadvali (jti) — yangi kolleksiya va migratsiya, ushbu audit doirasidan tashqari.
- **Why:** Xavfsiz sukut, sxemaga faqat ixtiyoriy maydon.
- **Risk:** Bitta qurilmada chiqish BARCHA qurilmalardan chiqaradi — mahsulot savoli sifatida ro'yxatlandi.
- **Result:** e2e PASS.

## D-010 — Parolni tiklash amalga oshirilmadi (asosiy bo'shliq sifatida qayd etildi)

- **Decision:** Parolni tiklash oqimi qo'shilmadi. Login sahifasidagi "Parolni unutdingizmi?" havolasi mavjud yordam sahifasiga olib boradi (o'zgarmadi).
- **Context:** ISSUE-012 (P1). Tiklash uchun email yuborish infratuzilmasi prod'da sozlanganligi tasdiqlanmagan (`SMTP_HOST` ixtiyoriy), oqim esa yangi sahifalarni talab qiladi ("YANGI PAGE BOSHLAMA").
- **Evidence:** `mailer.ts` SMTP bo'lmasa `[mail:o'chiq]` log yozadi; auth route'larida reset endpoint yo'q.
- **Chosen approach:** Soxta email tizimi yoki soxta "yuborildi" xabari yasalmadi (foydalanuvchi ko'rsatmasi).
- **Alternatives:** Telegram orqali tiklash (bot bog'langan foydalanuvchilar uchun) — yangi mahsulot oqimi, qaror kerak.
- **Why:** Ko'rsatmalar (fake qilma, yangi sahifa boshlama).
- **Risk:** Parolini unutgan foydalanuvchi faqat yordam xizmati orqali tiklaydi. ISSUE-012 holati: NOT FIXED (qaror kutilmoqda).
- **Result:** "MENING QARORIM KERAK" bo'limida.

## D-011 — Google hisob birlashtirish saqlandi (xavf hujjatlashtirildi)

- **Decision:** Google orqali kirishda mavjud email hisobiga ulash mantiqi o'zgartirilmadi; faqat tokeninfo tekshiruviga 5 soniya timeout, `iss` tekshiruvi va ism uzunligi cheklovi qo'shildi.
- **Context:** ISSUE-042 (P2): hujumchi birovning emaili bilan parolli hisob ochib qo'ysa, keyin haqiqiy egasi Google bilan kirganda hujumchi paroli ishlashda davom etadi (pre-account takeover). Email tasdiqlash oqimi yo'q.
- **Evidence:** `auth.service.ts` Google oqimi; `isEmailVerified` hech qayerda `true` qilinmaydi.
- **Chosen approach:** Birlashtirishni o'chirish parolini unutgan foydalanuvchilarni (D-010) Google orqali kirishdan ham mahrum qilardi.
- **Alternatives:** Birlashtirishda parolni bekor qilish (mavjud foydalanuvchi parolini ogohlantirishsiz o'chiradi); email tasdiqlash (email infratuzilmasi va yangi sahifa).
- **Why:** Hozirgi foydalanuvchilarni qulflab qo'ymaslik; to'liq yechim email tasdiqlashga bog'liq.
- **Risk:** Qolgan xavf — PARTIAL.
- **Result:** "MENING QARORIM KERAK" bo'limida.

## D-012 — Nomzodlar bazasi bepul; kontaktlar faqat ariza yuborganlarga; suhbat ochish cheklandi

- **Decision:** `/api/candidates` tarif tekshiruvi (402) olib tashlandi. Email va telefon faqat shu ish beruvchi vakansiyasiga ariza yuborgan nomzodda qaytadi (admin — hammasi). Faqat chop etilgan rezyume, bloklangan hisoblar chiqmaydi, query zod bilan tekshiriladi. Ish beruvchi suhbatni faqat ish qidirayotgan (ochiq rezyumeli), o'ziga ariza yuborgan yoki oldin suhbatlashgan nomzod bilan ochadi.
- **Context:** ISSUE-007, ISSUE-008 (P1), ISSUE-039 (P2). Mahsulot qoidasi: platforma bepul; nomzodning shaxsiy ma'lumoti oshkor bo'lmasin.
- **Evidence:** Probe: 402 PLAN_FEATURE_LOCKED; e2e `[ISSUE-007/008]`, `[ISSUE-039]`.
- **Chosen approach:** Kontaktlar o'rniga platforma ichidagi chat (telefon tasdiqlangan ish beruvchi).
- **Alternatives:** Hammaga kontakt ochish (har qanday ro'yxatdan o'tgan "ish beruvchi" bazani yig'ib oladi); nomzoddan rozilik bayrog'i so'rash (yangi UI va sxema).
- **Why:** Bepul qoida va maxfiylik qoidasi bir vaqtda bajariladi.
- **Risk:** Ish beruvchi ariza yubormagan nomzodga faqat chat orqali murojaat qiladi — UI'da tushuntirish matni bor.
- **Result:** e2e PASS; frontend nomzod kartasi kontakt yo'qligini tushuntiradi.

## D-013 — Yuklash: magic bytes, SVG yo'q, tasodifiy nom, eski fayllar o'chiriladi

- **Decision:** Logo (PNG/JPG/WebP), maqola muqovasi va PDF rezyume umumiy `saveUpload()` orqali: tur fayl baytlaridan, nom `prefix + 32 hex`, 5 MB, alohida 20/min limit, multipart bo'lmagan so'rov 400. Almashtirilgan/o'chirilgan fayl diskdan o'chiriladi (faqat shu prefiksli fayllar). `/uploads/` javoblariga `nosniff` va rasm fayllariga sandbox CSP.
- **Context:** ISSUE-002 (P0), ISSUE-029, ISSUE-043 (P2).
- **Evidence:** Probe: `<script>` li SVG yuklangan va CSP `unsafe-inline` bilan berilgan. e2e `[ISSUE-002]`, `[ISSUE-029/043]`.
- **Chosen approach:** Bitta helper, mavjud fayl tuzilmasi va URL formati saqlandi.
- **Alternatives:** Rezyume PDF'larini autentifikatsiyali endpoint orqali berish (to'liq yechim, lekin frontend va ariza ko'rinishlarini o'zgartiradi).
- **Why:** Kichik va teskari qaytariladigan o'zgarish.
- **Risk:** PDF rezyume hali ham URL'ni bilgan har kimga ochiq (taxmin qilib bo'lmaydigan nom bilan) — ISSUE-029 PARTIAL. Demo va eski fayllar o'chirilmaydi.
- **Result:** e2e PASS.

## D-014 — Monetizatsiya `BILLING_ENABLED` bayrog'i ortida (sukut: o'chiq)

- **Decision:** Tariflar, checkout va to'lov webhook route'lari hamda `ensurePlans()` faqat `BILLING_ENABLED=true` bo'lsa. Bildirishnoma va qaytish havolalari `/pricing` → `/profile`. Billing kodi va sxemasi o'chirilmadi.
- **Context:** ISSUE-064 (P2), mahsulot qoidasi "billing/payment/premium qo'shma, core flow monetizatsiyaga bog'lanmasin".
- **Evidence:** e2e: `/api/plans` va webhook 404.
- **Chosen approach:** Feature flag (kod saqlanadi, kelajakda alohida modul sifatida yoqilishi mumkin).
- **Alternatives:** Billing modulini o'chirish (sxema va admin to'lov ro'yxatiga bog'liq, katta o'chirish).
- **Why:** Eng kichik teskari qaytariladigan qadam.
- **Risk:** Admin panelida eski to'lovlar ro'yxati qoladi (faqat o'qish/tasdiqlash).
- **Result:** e2e PASS.

## D-015 — Vakansiya hayot sikli: o'chirish, rad etilgan e'lon, qayta e'lon qilish

- **Decision:** (1) Arizasi bor vakansiyani ish beruvchi o'chira olmaydi — 409 `VACANCY_HAS_APPLICATIONS` (yopish mumkin; admin o'chira oladi). (2) Rad etilgan e'lonni tahrirlash uni `moderation` ga o'tkazadi. (3) `archived/draft → active` yangi e'lon bilan bir xil shartlarni tekshiradi: tasdiqlangan telefon, kategoriya, ish joylashuvi, hudud (eski `employmentType=remote` masofaviy hisoblanadi).
- **Context:** ISSUE-024, ISSUE-025 (P1), ISSUE-059, ISSUE-087.
- **Evidence:** Kod: cascade o'chirish; `PATCH` placement tekshirmasdi. e2e `[ISSUE-025/024/059]`.
- **Chosen approach:** Backend qoidalari + frontend'da aniq xato matnlari.
- **Alternatives:** Soft-delete — yangi holat va sxema o'zgarishi.
- **Why:** Nomzodlar ariza tarixini yo'qotmaydi; moderatsiyadan chiqish yo'li paydo bo'ldi.
- **Risk:** DATA_INTEGRITY DI-1: dev bazadagi barcha 83 demo vakansiyada `workplace_type` yo'q — ular yopilsa, qayta faollashtirishdan oldin tahrirlash kerak (ochiq ko'rinish o'zgarmaydi, eski ma'lumot mos).
- **Result:** e2e PASS.

## D-016 — Yashirilgan maosh ochiq javoblarda `null`, filtr va saralashda hisobga olinmaydi

- **Decision:** Ro'yxat, detail, o'xshashlar, kompaniya sahifasi, saqlanganlar, nomzod arizalari va OG rasmda `isSalaryHidden` bo'lsa raqamlar chiqmaydi. Maosh filtri yashirin maoshni tanlamaydi, maosh bo'yicha saralashda yashirin va yozilmagan maosh "maoshsiz" bo'lakka tushadi. Ish beruvchining o'z endpointlari raqamni qaytaradi.
- **Context:** ISSUE-033 (P2). Qo'shimcha topilgan xato: maydoni umuman yozilmagan (`salary_min` yo'q) e'lonlar maosh saralashida ro'yxatdan tushib qolardi (Mongo'da `null` filtri yozilmagan maydonga mos kelmaydi).
- **Evidence:** Probe: yashirin maosh JSON'da. e2e `[ISSUE-033]` ikki tekshiruv.
- **Chosen approach:** `withPublicSalary()` serializer + `isSet:false` sharti; yangi e'lonlarda `salaryMin/Max` aniq `null` yoziladi.
- **Alternatives:** Faqat frontend'da yashirish (avvalgi holat — backend himoya emas).
- **Why:** Backend haqiqati.
- **Risk:** Yo'q.
- **Result:** e2e PASS.

## D-017 — Ochiq kompaniya maydonlari whitelist; sharh `userId` saqlandi

- **Decision:** Ochiq javoblarda kompaniya faqat ko'rsatiladigan maydonlar bilan (egasi ID, STIR, yuridik nom, tarif maydonlarisiz). Kompaniya sahifasida vakansiyalar 100, sharhlar 200 bilan cheklandi, to'liq son va o'rtacha reyting `reviewSummary` va `_count`da. Sharhlardagi `userId` qoldirildi.
- **Context:** ISSUE-032, ISSUE-047 (P2). Frontend "mening sharhim" (o'chirish tugmasi) ni `userId` bo'yicha aniqlaydi.
- **Evidence:** e2e `[ISSUE-032/033]`.
- **Chosen approach:** Umumiy `PUBLIC_COMPANY_SELECT` / `VACANCY_CARD_SELECT`.
- **Alternatives:** `mine: boolean` ni server hisoblashi (ixtiyoriy token o'qish kerak — endpoint ochiq va keshlanadigan).
- **Why:** Frontend o'zgarishisiz.
- **Risk:** Sharh muallifining foydalanuvchi ID'si ochiq qoladi (maxfiy ma'lumot emas, lekin identifikator) — P3 tavsiya.
- **Result:** e2e PASS.

## D-018 — 10K masshtab: qo'shimcha indekslar, ikki bosqichli so'rovlar, chegaralar, kesh

- **Decision:** Additiv indekslar (`db push`, migratsiya emas). Ish beruvchi resurslari `ownerUserId → companyId → vacancyId` indeksli bosqichlari bilan (relation filter `$lookup` o'rniga). Chegaralar: ish beruvchi arizalari 2000 (+`total`), vakansiya arizalari 500, suhbat tarixi oxirgi 1000 xabar, saqlanganlar 500, ish beruvchi vakansiyalari 1000. `/api/stats` 60 s, maosh statistikasi 5 daqiqa jarayon ichidagi kesh (yozuvda darhol yangilanadi). Ko'rishlar `$inc` bilan (`updatedAt` o'zgarmaydi). Obuna sweep 500 talik cursor + optimistik claim + qayta kirish qulfi. Ommaviy xabar fonda 500 talik bo'laklarda. Meilisearch reindex 1000 talik bo'laklarda, `deleteAll`siz.
- **Context:** ISSUE-045..058, 061. Maqsad: ~10k foydalanuvchi, 20k vakansiya, 50k ariza, 100k bildirishnoma/xabar.
- **Evidence:** `docs/audit/maps/DB_MAP.md` I1–I8 va chegarasiz so'rovlar ro'yxati.
- **Chosen approach:** Mavjud stack ichida (Redis/queue/Elasticsearch qo'shilmadi).
- **Alternatives:** Server tomonida sahifalash va filtrlash (frontend "Murojaatlar" sahifasi client'da filtrlaydi — katta UI o'zgarishi).
- **Why:** Kichik, xavfsiz qadamlar; API bitta nusxada.
- **Risk:** Chegaradan oshgan eng eski yozuvlar ro'yxatda ko'rinmaydi (sonlar to'g'ri). Jarayon ichidagi kesh gorizontal kengaytirishda umumiy emas. Yuk testi o'tkazilmadi (talab ham emas).
- **Result:** API typecheck, build, e2e PASS.

## D-019 — Ariza holati: bir xil holat no-op; izoh chat orqali real-time

- **Decision:** Joriy holat qayta yuborilsa tarix ham, bildirishnoma ham yaratilmaydi. Izoh yagona `deliverMessage()` orqali (WS + oflayn Telegram). Bildirishnoma havolasi: izoh bo'lsa suhbat, bo'lmasa `/applications`. Qolgan o'tishlar avvalgidek ruxsat etilgan (holat mashinasi joriy qilinmadi).
- **Context:** ISSUE-036, ISSUE-060 (P2).
- **Evidence:** e2e `[ISSUE-036/014/060]`.
- **Chosen approach:** Minimal backward-compatible.
- **Alternatives:** Qat'iy holat mashinasi (masalan `accepted → viewed` taqiqi) — mahsulot qarori kerak.
- **Why:** Dublikatlarni yo'qotadi, mavjud UI oqimini buzmaydi.
- **Risk:** Mantiqsiz orqaga o'tishlar hali mumkin — "MENING QARORIM KERAK".
- **Result:** e2e PASS.

## D-020 — Sharhlar: yangi sharh darhol ko'rinadi, tahrirlangan rad etilgan sharh moderatsiyaga

- **Decision:** Hujjatlashtirilgan mahsulot qarori (oldindan moderatsiyasiz) saqlandi. Faqat `approved` bo'lmagan sharh tahrirlansa `pending` bo'ladi; javobda `status` qaytadi, UI "moderatsiyaga yuborildi" deydi.
- **Context:** ISSUE-027 (P2).
- **Evidence:** e2e `[ISSUE-027]`.
- **Chosen approach:** Admin qarorini chetlab o'tishni yopish, mahsulot qoidasini o'zgartirmaslik.
- **Alternatives:** Hamma yangi sharhlarni moderatsiyaga yuborish (mahsulot qarorini o'zgartiradi).
- **Why:** Qoida saqlanadi, bypass yopiladi.
- **Risk:** Yo'q.
- **Result:** e2e PASS.

## D-021 — `notify()` hech qachon reject qilmaydi; havola doim payload ichida

- **Decision:** Bildirishnoma xatosi log bo'ladi, chaqiruvchiga uloqtirilmaydi. `url` `safeInternalPath` dan o'tadi va berilgan `payload` bilan birlashtiriladi. Kanal promise'lari ushlanadi. `unhandledRejection` log handler qo'shildi.
- **Context:** ISSUE-013, ISSUE-014 (P1), ISSUE-054 (url).
- **Evidence:** Kod: `void notify()` + reject → Node 15+ jarayon yiqilishi mumkin edi. e2e havola va broadcast tekshiruvlari.
- **Chosen approach:** Markazlashgan try/catch.
- **Alternatives:** Har chaqiruv joyida `.catch` (unutib qo'yish oson).
- **Why:** Bitta nuqtada kafolat.
- **Risk:** Yuborilmagan bildirishnoma faqat logda ko'rinadi (qayta urinish navbati yo'q).
- **Result:** e2e PASS.

## D-022 — WebSocket mustahkamlash

- **Decision:** `maxPayload` 64 KB, har ulanishga token bucket (10 s da ~20 hodisa), noto'g'ri ID/tana e'tiborsiz, bloklangan hisob 4403 bilan uziladi, yaroqsiz/eskirgan token 4401, token muddati tugaganda ulanish yopiladi, 30 s heartbeat. Ulanish darhol ro'yxatga olinadi (xabar yetkazish kechikmaydi), blok tekshiruvi tugaguncha kiruvchi xabarlar kutadi.
- **Context:** ISSUE-003 (P0), ISSUE-040 (P2).
- **Evidence:** Probe: noto'g'ri `conversationId` jarayonni yiqitdi. e2e `[ISSUE-003/040]`.
- **Chosen approach:** `chat.routes.ts` va `realtime.ts` ichida.
- **Alternatives:** Alohida WS xizmati (taqiqlangan — keraksiz mikroservis).
- **Why:** Kichik va sinaladigan.
- **Risk:** Frontend 4401 da tokenni yangilab qayta ulanadi (D-023).
- **Result:** e2e PASS.

## D-023 — Frontend seansi: token do'koni + API fetch interceptor

- **Decision:** `lib/auth/session.ts`: fonda yangilangan token React holatini o'zgartirmaydi (kontekstdagi `accessToken` faqat kirish/chiqishda o'zgaradi). API manziliga `Authorization: Bearer` bilan ketayotgan so'rovlar eng yangi tokenni oladi; 401 bo'lsa bitta umumiy refresh va bitta qayta urinish; refresh seans yo'qligini tasdiqlasa — mehmon holati. Tarmoq/server xatosi seansni o'chirmaydi (holat "loading", qayta urinadi). Kirish/chiqish avlod hisoblagichi kechikkan javoblarni e'tiborsiz qoldiradi. WS ulanishlari har ulanishda eng yangi tokenni oladi, 4401 da refresh qiladi, 4403 da to'xtaydi; qo'ng'iroq socketi qayta ulanadi.
- **Context:** ISSUE-019, ISSUE-020 (P1), ISSUE-067 (P2).
- **Evidence:** Kod: `setInterval` har 12 daqiqada `setToken` → `[token]` bog'liq effektlar (profil, xabarlar, socket) qayta ishga tushardi; `fetchMe` tarmoq xatosida `null` → token o'chirilardi.
- **Chosen approach:** Global `fetch` faqat `API_URL` + Bearer so'rovlari uchun o'raladi (auth yo'llari tegilmaydi).
- **Alternatives:** O'nlab modullardagi har bir `fetch` chaqiruvini `apiFetch` ga ko'chirish (katta, xatoga moyil diff).
- **Why:** Eng kichik o'zgarish bilan barcha API modullarini qamraydi.
- **Risk:** Global yon ta'sir: Request obyektining tanasi bir marta o'qiladi (loyihada ishlatilmaydi). Brauzer UI regressiyasi PHASE 5 da.
- **Result:** Web typecheck/build va brauzer tekshiruvi — FINAL_AUDIT.md.

## D-024 — Frontend: API xatosi bo'sh holat bo'lib ko'rsatilmaydi

- **Decision:** Xatoni yashiradigan fetcher'lar (fallback bilan) ro'yxat sahifalari uchun uloqtiradigan variantlar bilan almashtirildi: admin (6 sahifa, AbortController + haqiqiy qayta so'rov + amal xatolari), obunalar, nomzodlar, saqlanganlar ID'lari va ro'yxati, rezyume, kompaniya profili, Telegram holati, bosh sahifa bloklari. Rezyume yuklanmasa profil xato holatini ko'rsatadi (keyingi saqlash ma'lumotni o'chirmasin).
- **Context:** ISSUE-016, 017, 018, 021, 022, 023 (P1).
- **Evidence:** Kod: `get(path, token, fallback)` xatoda bo'sh ro'yxat; `fetchResume` xatoda `null`.
- **Chosen approach:** Mavjud komponentlar (`AdminError`, `ErrorState`) va naqshlar (`AdminArticleList`, `EmployerVacanciesView`).
- **Alternatives:** Umumiy data-fetching kutubxonasi (yangi dependency — taqiqlangan).
- **Why:** Mavjud dizayn tizimi ichida.
- **Risk:** Eski fallback funksiyalar boshqa ikkinchi darajali bloklarda qoldi (masalan o'xshash kompaniyalar — blok yashiriladi, bu ataylab).
- **Result:** Web typecheck/build — FINAL_AUDIT.md.

## D-025 — To'qima raqamlar va tasdiqlanmagan da'volar olib tashlandi

- **Decision:** Kirish paneli (12 000+/6 000+/300 000+), ish beruvchi landing (3204+/48000+), kategoriya kartalari (1207, 2759, ...) qattiq raqamlari o'rniga `/api/stats` va facets'dan haqiqiy sonlar; so'rov bajarilmasa blok chizilmaydi. Statistikadagi "+" olib tashlandi. i18n (uz/ru/en): "#1 platforma", "12,000+ faol vakansiya", "minglab/тысячи/thousands", "moderatsiyadan o'tgach ko'rinadi" (aslida darhol e'lon qilinadi) matnlari haqiqatga moslandi; "bepul" — mahsulot qoidasiga mos fakt.
- **Context:** ISSUE-015 (P1). Ko'rsatma: "noaniq narsani fakt sifatida yozma", "fake data qilma".
- **Evidence:** `AuthShell.tsx:106-108`, `pages/employer/+Page.tsx:48,54`, `lib/i18n/categories.ts`.
- **Chosen approach:** Real data yoki hech narsa.
- **Alternatives:** Raqamlarni butunlay olib tashlash (dizayn balansi buziladi, real ma'lumot mavjud).
- **Why:** Haqiqiy va sinaladigan.
- **Risk:** Kichik bazada sonlar kichik ko'rinadi — bu haqiqat.
- **Result:** Web typecheck/build va vizual tekshiruv — FINAL_AUDIT.md.

## D-026 — JSON-LD `<script>` ichida HTML-xavfsiz escape

- **Decision:** `serializeJsonLd()`: `<`, `>`, `&`, U+2028, U+2029 unicode-escape.
- **Context:** ISSUE-005 (P0): vakansiya sarlavhasidagi `</script>` SSR HTML'da skriptni yopib, stored XSS berardi.
- **Evidence:** Probe: `JSON.stringify` `</script>` ni escape qilmaydi.
- **Chosen approach:** JSON ma'nosi o'zgarmaydi (Google bir xil o'qiydi).
- **Alternatives:** Kiritishni tozalash (boshqa joylarda matn buziladi).
- **Why:** Chiqishda escape — to'g'ri qatlam.
- **Risk:** Yo'q.
- **Result:** Web typecheck/build — FINAL_AUDIT.md.

## D-027 — SSR fetch timeout qo'shildi; detail sahifada 503 qilinmadi

- **Decision:** Serverda API so'rovlariga 8 s timeout (`withServerTimeout`), brauzerda o'zgarishsiz. API xatosida detail sahifalar avvalgidek 200 + noindex + "qayta urinish" holatida qoldi.
- **Context:** ISSUE-069, ISSUE-070 (P2).
- **Evidence:** `+data.ts` fayllari timeout'siz `fetch`.
- **Chosen approach:** Timeout — kichik va xavfsiz. 503 — `_error` sahifasi va Vike abort oqimini o'zgartiradi (P2 "faqat xavfsiz, cheklangan").
- **Alternatives:** `throw render(503)` (xato sahifasi dizayni va retry holatini qayta yozish kerak).
- **Why:** Doira qoidasi.
- **Risk:** ISSUE-070 NOT FIXED — vaqtinchalik nosozlik sahifani indeksdan chiqarishi mumkin (noindex).
- **Result:** Tavsiyalarda.

## D-028 — Demo seed o'zgartirilmadi va ishga tushirilmadi

- **Decision:** `demo-seed.ts` va dev bazasi (`ishbor`) tegilmadi. DI-1 (83 demo vakansiyada `workplace_type` yo'q) faqat hujjatlashtirildi.
- **Context:** Ko'rsatma "demo data o'zgartirma"; memory: demo ma'lumotlar foydalanuvchi uchun muhim.
- **Evidence:** `docs/audit/maps/DATA_INTEGRITY.md`.
- **Chosen approach:** Backward-compatible kod (eski `employmentType=remote` fallback'lari saqlandi).
- **Alternatives:** Seed yoki migratsiya skripti bilan to'ldirish — ko'rsatmaga zid.
- **Why:** Ko'rsatma.
- **Risk:** D-015 dagi qayta faollashtirish sharti demo e'lonlarga ham tegishli.
- **Result:** "MENING QARORIM KERAK" bo'limida (seed'ni yangilash).

## D-029 — `prestart: prisma db push` o'zgartirilmadi

- **Decision:** Deploy'dagi avtomatik `db push` saqlandi; yangi indekslar shu yo'l bilan qo'llanadi.
- **Context:** ISSUE-028 (P2): prod'da har ishga tushishda sxema sinxronlanadi, destruktiv o'zgarish ogohlantirishsiz o'tishi mumkin. "Keraksiz Prisma migratsiyasi qo'shma".
- **Evidence:** `apps/api/package.json` `prestart`.
- **Chosen approach:** Hujjatlashtirish; audit o'zgarishlari faqat additiv (ixtiyoriy maydon, indekslar).
- **Alternatives:** `prisma migrate` ga o'tish (MongoDB'da Prisma migrate qo'llab-quvvatlanmaydi); prestart'ni olib tashlash (deploy jarayonini o'zgartiradi).
- **Why:** Mavjud deploy oqimini buzmaslik.
- **Risk:** Katta kolleksiyada indeks yaratish ishga tushishni sekinlashtirishi mumkin.
- **Result:** Tavsiyalarda.

## D-030 — Commit qilinmagan fayllar foydalanuvchi qaroriga qoldirildi

- **Decision:** ISSUE-026 (untracked fayllar) bo'yicha hech narsa commit yoki o'chirilmadi.
- **Context:** "COMMIT QILMA".
- **Evidence:** `git status`.
- **Chosen approach:** Ro'yxatni hisobotda berish.
- **Alternatives:** Yo'q (ko'rsatma).
- **Why:** Ko'rsatma.
- **Risk:** Deploy commit qilinmagan fayllarsiz yig'ilsa build yiqilishi mumkin.
- **Result:** "MENING QARORIM KERAK" bo'limida.

## D-031 — Kechiktirilgan P2/P3 (asoslangan)

- **Decision:** Quyidagilar bu bosqichda o'zgartirilmadi: web CSP (ISSUE-078 — inline theme skripti hash'i, Google va API manzillarini deploy muhitida tekshirish kerak), kontrast tokenlari (076 — dizayn tizimi qarori), reduced motion (077 — DESIGN.md dagi brend qarori), canonical/hreflang parametrlari (071), backend xabarlarini to'liq i18n (073 — qisman: server xabari uz'da, boshqa tillarda tarjima), sitemap bo'laklash (56 — hozirgi hajmda 50k chegarasidan past), Vercel vs self-hosted (100), Playwright skriptlari (101).
- **Context:** PHASE 3 qoidasi: P2 faqat xavfsiz va cheklangan, P3 faqat arzimas.
- **Evidence:** `docs/audit/ISSUES.md`.
- **Chosen approach:** Tavsiyalar bo'limida WHY / IMPACT / PRIORITY / EFFORT bilan.
- **Alternatives:** Hammasini shu bosqichda qilish (regressiya xavfi, tekshirilmagan infratuzilma faktlari).
- **Why:** Doira qoidasi.
- **Risk:** Qolgan xavflar FINAL_AUDIT.md da ochiq ko'rsatilgan.
- **Result:** PHASE 8.

## D-032 — 10K masshtab: alohida sintetik bazada ketma-ket benchmark

- **Decision:** `ishbor_scaletest` bazasi sintetik ma'lumot bilan to'ldirildi: 10 001 foydalanuvchi, 2 000 kompaniya, 20 000 vakansiya, 50 000 ariza, 100 000 bildirishnoma, 5 000 suhbat va 100 000 xabar. API production build'i shu bazada alohida portda ko'tarilib, asosiy endpointlar ketma-ket o'lchandi.
- **Context:** Brief: 10K foydalanuvchi va katta hajmdagi ma'lumot; "TEST DATABASE / TEMP DATA bilan qil. Production/demo data o'zgarmasin". Concurrent load test talab qilinmagan.
- **Evidence:** `scale_bench.mjs` (seed | bench). Baza nomida `scaletest` bo'lmasa skript ishlamaydi. Dev (`ishbor`) va demo ma'lumotlarga tegilmadi.
- **Chosen approach:** Deterministik psevdo-tasodifiy generator, `createMany`; har endpoint uchun cold so'rov va takrorlar, p50/p95 va javob hajmi.
- **Alternatives:** Dev bazada o'lchash (demo ma'lumot o'zgaradi, taqiqlangan). k6/autocannon bilan concurrent load (brief talab qilmagan, yangi dependency).
- **Why:** Haqiqiy Prisma so'rov rejalari va payload hajmini xavfsiz, qayta takrorlanadigan tarzda ko'rsatadi.
- **Risk:** Lokal mashina: bitta mongod, tarmoq kechikishi yo'q, shuning uchun production raqamlari farq qiladi. Generator ketma-ketligi korrelyatsiyali: masalan Toshkentdagi masofaviy vakansiya 0 ta chiqdi. Bu to'g'ridan-to'g'ri baza so'rovi bilan tasdiqlandi, API xatosi emas.
- **Result:** Benchmark optimizatsiyadan oldin va keyin bir xil ma'lumotda ishga tushirildi. Oldin/keyin jadvali `FINAL_AUDIT.md` ning "10K User Data Scale" bo'limida.

## D-033 — Vakansiya filtrlari va matn qidiruvi: relation filter o'rniga oldindan aniqlangan ID'lar

- **Decision:** `region`, `category` va `company` bo'yicha relation filterlar (slug, nom, tasdiq belgisi) so'rov boshida kichik kataloglardan ID'ga aylantiriladi. Vakansiya indekslangan `regionId`, `categoryId`, `companyId` bo'yicha filtrlanadi (`resolveFilterIds`).
- **Context:** Benchmark: matn qidiruvi p50 3 505 ms, hudud va masofaviy filtri 1 511 ms. Sabab: Prisma MongoDB'da relation filter har hujjat uchun `$lookup` bajaradi.
- **Evidence:** `explain_queries.mjs` va `scale_bench.mjs` natijalari; `apps/api/src/modules/vacancies/vacancies.service.ts`.
- **Chosen approach:** Natija semantikasi saqlanadi: facets'dagi o'z o'lchovini chetlab o'tish, "faqat tasdiqlangan" va kompaniya slug kesishmasi, qisqa so'zlar qoidasi. Meilisearch yo'li tegilmaydi.
- **Alternatives:** Vakansiyaga hudud slug'i yoki kompaniya nomini nusxalash (schema o'zgarishi va sinxronlash kerak). Meilisearch'ni majburiy qilish (infratuzilma qarori; "faqat scale ko'rinishi uchun" qo'shimcha servis taqiqlangan).
- **Why:** Kichik, lokal o'zgarish; schema va migratsiya yo'q.
- **Risk:** Juda umumiy so'z ko'p kompaniya nomiga mos kelsa `companyId in [...]` ro'yxati uzayadi; 2 000 kompaniyada bu ahamiyatsiz.
- **Result:** Matn qidiruvi p50 3 505 ms dan 306 ms ga, hudud va masofaviy filtri 1 511 ms dan 9 ms ga tushdi (bir xil sintetik ma'lumot). e2e filtr va facets tekshiruvlari PASS; reviewer agent HEAD'dagi relation filterlar bilan semantik tenglikni tekshirdi.

## D-034 — Kompaniyalar katalogi: kalitli 60 soniyalik jarayon ichidagi kesh (ISSUE-049 qisman)

- **Decision:** `GET /api/companies` natijasi (`saved=1` dan tashqari) so'rov parametrlari kaliti bilan 60 soniya keshlanadi, ko'pi bilan 200 kalit. Vakansiya, kompaniya, logo, sharh yoki tasdiq o'zgarganda `bumpDataVersion()` keshni darhol bekor qiladi.
- **Context:** Har so'rov 2 000 kompaniya uchun `$lookup` agregatsiyasini bajaradi: taxminan 0.7 soniya.
- **Evidence:** Benchmark; `apps/api/src/modules/companies/companies.list.ts`.
- **Chosen approach:** Mavjud `cached()` naqshining kalitli varianti (`keyedCache`).
- **Alternatives:** Kompaniyada faol vakansiyalar soni va reytingni denormalizatsiya qilish (to'g'ri uzoq muddatli yechim, lekin ko'p yozish nuqtasini sinxronlash kerak). Redis (API bitta nusxada; taqiqlangan maqsad).
- **Why:** Birinchi sahifa va mashhur filtrlar qayta hisoblanmaydi.
- **Risk:** Birinchi (cold) so'rov tezlashmaydi. Gorizontal kengaytirishda kesh nusxalar orasida umumiy emas. Ko'rishlar soni 60 soniyagacha kechikishi mumkin.
- **Result:** Katalogning takroriy so'rovi p50 695 ms dan 1 ms ga tushdi; birinchi (cold) so'rov o'zgarmadi (taxminan 0.75 s). Filtrsiz facets uchun ham xuddi shunday kesh qo'shildi (ISSUE-138): takroriy so'rov p50 480 ms dan 2 ms ga, cold taxminan 0.6 s. Kompaniya profili, logo yangilanishi va ro'yxatdan o'tishda kompaniya yaratilganda ham kesh bekor bo'ladi. ISSUE-049 PARTIAL.

## D-035 — Suhbatlar ro'yxati va ish beruvchi arizalari: takroriy so'rovlar va og'ir include kamaytirildi

- **Decision:** Suhbatlar ro'yxatida oxirgi xabar bitta `aggregateRaw` bilan olinadi ($match, $sort, $group $first). Kontekst arizalari relation filter o'rniga vakansiya ID'lari orqali topiladi. Ish beruvchi arizalari ro'yxatida har qatordagi `_count.applications` o'rniga bitta `groupBy` ishlatiladi; javob shakli o'zgarmagan.
- **Context:** Benchmark: 500 suhbatli ish beruvchida ro'yxat p95 taxminan 4 soniya; 5 000 arizali ish beruvchida arizalar ro'yxati taxminan 3 soniya va 2.6 MB.
- **Evidence:** `scale_bench.mjs` natijalari.
- **Chosen approach:** Javob shaklini saqlagan holda so'rovlar soni va hajmi kamaytirildi.
- **Alternatives:** Suhbatda oxirgi xabarni denormalizatsiya qilish (schema o'zgarishi). Arizalarni server tomonida sahifalash (web ro'yxatni klientda filtrlaydi, katta UI o'zgarishi).
- **Why:** Minimal va backward compatible.
- **Risk:** Arizalar javobi hali ham har ariza bilan to'liq rezyumeni qaytaradi, shuning uchun hajm muammosi qisman qoladi.
- **Result:** Suhbatlar ro'yxati p50 1 318 ms dan 523 ms ga, p95 3 993 ms dan 1 148 ms ga tushdi. Ish beruvchi arizalari (5 000 ariza, 2.6 MB) yaxshilanmadi: p50 3 046 ms edi, keyin 3 497 ms. Ehtimoliy sabab (profil qilinmagan): har ariza bilan to'liq rezyume va holat tarixi yuklanadi. ISSUE-045 PARTIAL; tavsiya: server tomonida sahifalash va rezyumeni ariza tanlanganda yuklash.

## D-036 — Access token har so'rovda bazadagi holat bilan tekshiriladi (ISSUE-108)

- **Decision:** `requireAuth` JWT'dan keyin foydalanuvchini bazadan o'qiydi. Bloklangan hisob 403 `USER_BLOCKED` oladi, `tokenVersion` mos kelmasa 401 qaytadi, rol bazadan olinadi. Access token `v` (tokenVersion) ni olib yuradi; `v` siz eski tokenlar muddati tugaguncha qabul qilinadi.
- **Context:** Ikkinchi audit: ISSUE-035 fix'i faqat `/api/admin/*` ni qamragan edi. Roli olingan admin va bloklangan ish beruvchi 15 daqiqagacha yozish amallarini bajara olardi.
- **Evidence:** Verify agenti tasdiqlagan: `auth-guard.ts`, `jwt.ts`, `applications.routes.ts`.
- **Chosen approach:** Bitta markaziy guard. Natija so'rov ichida saqlanadi, `requirePhoneVerified` va `requireStaff` bazani qayta so'ramaydi.
- **Alternatives:** Faqat alohida yozish yo'llariga preHandler qo'shish (yangi yo'lda unutilishi oson). Access token muddatini qisqartirish (oyna baribir qoladi, refresh yuki oshadi).
- **Why:** Logout, bloklash va rol o'zgarishi darhol kuchga kiradi; barcha `role === "admin"` tekshiruvlari bazadagi rolga tayanadi.
- **Risk:** Har autentifikatsiyalangan so'rovga bitta indekslangan `findUnique` qo'shiladi (taxminan 1 ms).
- **Result:** e2e `[PHASE6-V5]` (2 ta) va yangilangan jamoa tekshiruvi PASS (e2e 94/94). Web 403 `USER_BLOCKED` olganda tab mehmon holatiga o'tadi; saqlangan kompaniyalar ro'yxati ham shu guard bilan himoyalandi.

## D-037 — Ikkinchi audit fix'lari: fayllar bo'yicha ajratilgan parallel guruhlar va har guruhga mustaqil reviewer

- **Decision:** Ikkinchi audit topilmalari 8 guruhga bo'lindi: API auth, chat, vakansiya va obunalar, infra va xavfsizlik, web seans, ikki web UI guruhi, testlar va hujjat. Har guruh faqat o'z fayllarini o'zgartirdi; keyin alohida reviewer agent tuzatish va regressiyani tekshirdi.
- **Context:** Ishchi daraxtda commit qilinmagan katta o'zgarishlar bor; git worktree HEAD'dan yaratiladi, shuning uchun izolyatsiya uchun ishlatib bo'lmaydi. i18n fayllari umumiy nuqta.
- **Evidence:** Workflow `phase6-second-order-fixes`.
- **Chosen approach:** Yangi i18n kalitlari lead auditor tomonidan oldindan qo'shildi; fayl egaligi qat'iy; guruhlararo interfeys (access token `v`, WebSocket yopish kodlari 4401/4403/1011) promptda shartnoma sifatida berildi. Yakuniy typecheck, build, e2e va brauzer tekshiruvlari birlashgan holatda lead auditor tomonidan bajarildi.
- **Alternatives:** Bitta agent ketma-ket (sekin). Worktree izolyatsiyasi (commit qilinmagan o'zgarishlarni ko'rmaydi).
- **Why:** Tezlik va har fix uchun mustaqil tekshiruv.
- **Risk:** Guruhlar orasidagi nomuvofiqlik; integratsiya testlari bilan tekshiriladi.
- **Result:** 16 agent (8 fix, 8 review) xatosiz tugadi. Reviewerlar 5 ta qo'shimcha muammoni o'z fayllarida tuzatdi: WebSocket backoff hisoblagichlari, Telegram so'rovi timeout'i, e2e muhitining qo'shimcha sozlamalari, Telegram ulash tugmasining tarmoq xato matni, arizalar ro'yxati "kesilgan" hisobi. Lead auditor keyin 6 ta follow-up kiritdi: ommaviy xabarda tashqi kanallarni kutish chegarasi, saqlangan kompaniyalar ro'yxatiga umumiy auth guard, 403 `USER_BLOCKED` da mehmon holati, qayta yuklash bayrog'i, kompaniya yangilanishi va ro'yxatdan o'tishda kesh bekor qilinishi, admin izohi. API va web typecheck/build PASS, e2e 94/94, web unit-check 3/3; brauzer natijalari `FINAL_AUDIT.md` da.

## D-038 — Faqat `salaryMax` yozilgan vakansiyalarning maosh saralashi o'zgartirilmadi (ISSUE-127)

- **Decision:** "X gacha" ko'rinishidagi vakansiyalar maosh saralashi va filtrida maoshsiz guruhda qoladi.
- **Context:** Maosh statistikasi ularni hisobga oladi, saralash va filtr esa `salaryMin` ga tayanadi.
- **Evidence:** `vacancies.service.ts` (`listBySalary`, maosh filtri), `salary.stats.ts`.
- **Chosen approach:** O'zgartirilmadi; product qarori sifatida "MENING QARORIM KERAK" bo'limiga.
- **Alternatives:** Saqlanadigan `salarySort = salaryMin ?? salaryMax` maydoni (schema, backfill va Meilisearch indeksi o'zgarishi).
- **Why:** Semantika product egasining qarori; backfill va schema o'zgarishi bu bosqich doirasidan tashqarida.
- **Risk:** Foydalanuvchi "X gacha" e'lonni maosh bo'yicha saralashda pastda ko'radi.
- **Result:** WONT FIX shu bosqichda.

## D-039 — Telegram orqali kirish holat mashinasi uchun avtomatik test yozilmadi (ISSUE-122)

- **Decision:** ISSUE-010 fix'i uchun (deep-link o'zi seansni tasdiqlamaydi, bot ichida aniq tasdiq tugmasi, callback boshqa chatdan kelsa rad etiladi) avtomatik test qo'shilmadi. Shu fix'ning qarori ham shu yozuvda qayd etiladi.
- **Context:** `handleLoginStart` va `handleCallbackQuery` modul ichida yopiq; e2e'da Telegram bot tokeni bo'sh. Test uchun modulni ajratish refactor talab qiladi.
- **Evidence:** `apps/api/src/modules/telegram/telegram.service.ts`.
- **Chosen approach:** PHASE 8 tavsiyasi: yuboruvchi injektsiya qilinadigan kichik modul va `node --test`.
- **Alternatives:** Hozir refactor qilish (auth oqimida regressiya xavfi).
- **Why:** Doira qoidasi.
- **Risk:** Kelajakdagi o'zgarish fishingdan himoyani sezdirmay buzishi mumkin.
- **Result:** NOT FIXED (test gap), tavsiyalarda.


---

# Round 3 (2026-09-16): AUTH/TELEGRAM, xavfsizlik, performance va 10K hardening

Owner'ning yangi yakuniy qarorlari (AUTH RULE A–L) va Round 3 brief'i asosida. Qarorlar tartibi: avval mahsulot qoidalari, keyin AUTH DECISIONS, keyin infratuzilma va boshqa qarorlar.

## D-040 — Mahsulot qoidalari: Round 3 yakuniy manbasi

- **Decision:** Platforma to'liq bepul; faol vakansiya limiti yo'q; nomzod va ish beruvchi core oqimlarida monetizatsiya yo'q; pricing, premium, obuna va billing core UX emas (keyin alohida modul). Kategoriya va `workplaceType` (office, hybrid, remote) majburiy; hudud office va hybrid'da majburiy, remote'da ixtiyoriy. Ish beruvchi boshqa kompaniya resursiga kira olmaydi; nomzodning shaxsiy ma'lumoti faqat vakolatli ish beruvchiga; moderatsiyani chetlab o'tib bo'lmaydi; draft va public ko'rinish qoidalari saqlanadi.
- **Context:** Round 3 brief'idagi "PRODUCT RULES — FINAL SOURCE".
- **Evidence:** `vacancies.rules.ts`, `BILLING_ENABLED` (D-014), `candidates.routes.ts` (D-012), vakansiya hayot sikli (D-015), e2e tekshiruvlari.
- **Chosen approach:** Qoidalar kod va testlarda majburlangan; Round 3 da ulardan chetga chiqishlar tuzatiladi.
- **Alternatives:** —
- **Why:** Owner qarori.
- **Risk:** Yo'q.
- **Result:** Round 3 audit va regressiyasida tekshiriladi.

## AUTH DECISIONS

## D-041 — Telegram kirish kanali emas: Telegram orqali kirish olib tashlanadi (Rule A)

- **Decision:** `POST /api/auth/telegram/start`, `POST /api/auth/telegram/poll`, `telegramLogin()`, botdagi `lg` tokenlar va tasdiq tugmalari hamda saytdagi "Telegram" kirish tugmasi olib tashlanadi. Asosiy kirish email va parol bilan qoladi (Google mavjud).
- **Context:** Rule A. Hozir bot orqali kirish mavjud (ISSUE-010 da tasdiq tugmasi qo'shilgan edi).
- **Evidence:** `telegram.service.ts` (`createLoginToken`, `handleLoginStart`, `handleCallbackQuery`), `auth.routes.ts` (`/api/auth/telegram/*`), `SocialLogin.tsx`.
- **Chosen approach:** To'liq olib tashlash, bayroq ortida qoldirilmaydi.
- **Alternatives:** Bayroq ortida saqlash (o'lik kod va ortiqcha hujum yuzasi).
- **Why:** Owner qarori; hujum yuzasi kamayadi.
- **Risk:** Faqat Telegram orqali kirib yurgan foydalanuvchilar endi parol bilan kiradi yoki parolni Telegram orqali tiklaydi (D-045).
- **Result:** Round 3 PHASE 3.

## D-042 — Telegram deep-link challenge'lari bazada saqlanadi (Rule D, I)

- **Decision:** Xotiradagi `linkTokens` o'rniga `AuthChallenge` kolleksiyasi. Payload: 24 bayt tasodifiy qiymat (base64url, 32 belgi), bazada faqat sha256. Muddat 15 daqiqa, bir martalik, maqsadga bog'langan: `telegram_link`, `phone_change`, `backup_phone`, `password_recovery`, `manual_recovery`. Holatlar: pending → awaiting_contact yoki verified → completed yoki cancelled.
- **Context:** Rule D va I. Hozirgi tokenlar xotirada: restartda yo'qoladi va bitta nusxaga bog'liq.
- **Evidence:** `telegram.service.ts` (`linkTokens` Map, `LINK_TTL_MS` 30 daqiqa).
- **Chosen approach:** Barcha Telegram oqimlari uchun bitta umumiy challenge modeli (dublikat tasdiqlash tizimi yaratilmaydi).
- **Alternatives:** Imzolangan payload (Telegram `start` parametri 64 belgi, bekor qilish qiyin); Redis (keraksiz infratuzilma).
- **Why:** Replay himoyasi, restartga chidamlilik, audit izi.
- **Risk:** Muddati o'tgan yozuvlar to'planadi; `expiresAt` indeksi bor, TTL indeks tavsiya qilinadi.
- **Result:** Round 3 PHASE 3.

## D-043 — Telegram identity va telefon yagonaligi (Rule E, F)

- **Decision:** Identity — Telegram user ID (`from.id`), auth oqimlari faqat private chatda. Bitta Telegram identity faqat bitta ISH BOR! hisobiga (asosiy yoki zaxira sifatida) bog'lanadi. Tasdiqlangan telefon (asosiy yoki zaxira) hisoblar orasida yagona. Jim qayta bog'lash olib tashlanadi: boshqa hisobga bog'langan identity umumiy xabar bilan rad etiladi.
- **Context:** Hozir `/start` chatni boshqa hisobdan jimgina uzib, yangi hisobga bog'laydi; telefon dublikati tekshirilmaydi.
- **Evidence:** `telegram.service.ts` (`handleStart` dagi `updateMany`, `handleContact`).
- **Chosen approach:** Tasdiqlash vaqtida kodda tekshiruv va `phone`, `backupPhone`, `backupTelegramId` indekslari. Mavjud dublikatlar o'zgartirilmaydi; data integrity hisobotida ko'rsatiladi.
- **Alternatives:** Partial unique indeks (Prisma MongoDB sxemasida yo'q); alohida identity kolleksiyasi (identity maydonlari ikki joyda saqlanardi).
- **Why:** Additiv va eski ma'lumotga mos.
- **Risk:** Bir vaqtda ikki hisobda bir xil raqamni tasdiqlash poygasi ehtimoli past; hujjatlashtirildi.
- **Result:** Round 3 PHASE 3.

## D-044 — Telefonni tasdiqlash oqimi (Rule A, E)

- **Decision:** Sayt `POST /api/telegram/link` → deep link → bot identity tekshiruvi → kontakt ulashish (`contact.user_id === from.id`) → normalizatsiya (`+<raqamlar>`, 9 xonali mahalliy raqamga 998 qo'shiladi) → yagonalik → `phone`, `isPhoneVerified`, `phoneVerifiedAt`, `telegramChatId`. Hodisalar: `telegram_linked`, `phone_verified`. Faol challenge bo'lmasa kontakt qabul qilinmaydi; tasdiqlangan boshqa raqam bo'lsa telefonni almashtirish oqimi talab qilinadi.
- **Context:** Rule A va E. Hozir bog'langan chatdan istalgan vaqtda kontakt yuborib telefonni almashtirish mumkin.
- **Evidence:** `telegram.service.ts` `handleContact`.
- **Chosen approach:** Mavjud kontakt ulashish mexanizmi saqlanadi va challenge bilan bog'lanadi.
- **Alternatives:** SMS kod (yangi infratuzilma, taqiqlangan).
- **Why:** Telegram kontakti soxtalashtirilmaydi; mavjud arxitektura qayta ishlatiladi.
- **Risk:** Telegram raqami SIM raqamidan farq qilishi mumkin — foydalanuvchi Telegram'dagi raqamni tasdiqlaydi.
- **Result:** Round 3 PHASE 3.

## D-045 — Parolni faqat Telegram orqali tiklash (Rule B, I, J)

- **Decision:** `POST /api/auth/recovery/start {phone}` har qanday to'g'ri formatdagi raqam uchun bir xil javob (`{ link, expiresAt }`) qaytaradi; hisob topilmasa "decoy" challenge yaratiladi. Bot identity'ni hisobning asosiy (`telegramChatId`) yoki zaxira (`backupTelegramId`) identity'si bilan solishtiradi; mos kelsa 32 baytli reset token yaratiladi (sha256, 15 daqiqa, bir martalik) va bot `/login?reset=<token>` havolasini yuboradi. `POST /api/auth/recovery/reset {token, password}`: yangi argon2 hash, `passwordChangedAt`, `tokenVersion + 1`, socketlar yopiladi, login xato hisoblagichi tozalanadi, foydalanuvchining boshqa ochiq tiklash challenge'lari bekor qilinadi, hodisalar `recovery_completed` va `sessions_invalidated`, asosiy Telegram chatiga xabar. API parol yoki token qaytarmaydi.
- **Context:** Rule B, I, J; ISSUE-012 (P1).
- **Evidence:** Hozir tiklash yo'q, "Parolni unutdingizmi?" `/support` ga olib boradi.
- **Chosen approach:** Mavjud bot infratuzilmasi va D-042 challenge'lari; email fallback yo'q.
- **Alternatives:** Saytda polling bilan token berish (token saytda paydo bo'ladi, Telegram'dagi tasdiqni chetlab o'tish xavfi); email (owner qarori bilan taqiqlangan).
- **Why:** Reset havolasi faqat tasdiqlangan Telegram egasiga yetadi.
- **Risk:** Telegram'ni yo'qotgan foydalanuvchi zaxira raqam yoki qo'lda tiklash orqali tiklaydi (D-049).
- **Result:** Round 3 PHASE 3.

## D-046 — Oddiy `/start` va yaroqsiz payload (Rule C, D)

- **Decision:** Payloadsiz `/start` saytga kirish havolasi (inline URL tugma) va Telegram faqat telefon tasdiqlash va parol tiklash uchun ekanligi haqida qisqa izoh yuboradi. Yaroqsiz, eskirgan, ishlatilgan yoki identity mos kelmagan payload uchun bitta umumiy javob. Payload formati DB'dan oldin regex bilan tekshiriladi. Chat bo'yicha yumshoq limit: daqiqasiga 30 update.
- **Context:** Rule C va D.
- **Evidence:** `handleStart`, `handleUpdate`.
- **Chosen approach:** Mavjud long-polling va try/catch saqlanadi; javoblar hisob mavjudligini oshkor qilmaydi.
- **Alternatives:** —
- **Why:** Enumeration va crash'dan himoya.
- **Risk:** Yo'q.
- **Result:** Round 3 PHASE 3.

## D-047 — Zaxira telefon (Rule F)

- **Decision:** `User` ga additiv maydonlar: `backupPhone`, `backupPhoneVerifiedAt`, `backupTelegramId`. Qo'shish va olib tashlash joriy parol bilan tasdiqlanadi va faqat tasdiqlangan asosiy telefon bo'lganda mumkin. Zaxira raqam boshqa Telegram identity'da bo'lishi, asosiy raqamdan farq qilishi va boshqa hisobda bo'lmasligi kerak. Qo'shilganda asosiy Telegram chatiga ogohlantirish yuboriladi; hodisalar `backup_phone_added`, `backup_phone_removed`.
- **Context:** Rule F; 3D "sxema imkon bersa".
- **Evidence:** `User` modelida zaxira raqam yo'q; `JobSeekerProfile.additionalPhone` tasdiqlanmagan aloqa raqami (boshqa maqsad).
- **Chosen approach:** Additiv ixtiyoriy maydonlar, migratsiyasiz (MongoDB), `additionalPhone` o'zgartirilmaydi.
- **Alternatives:** Alohida telefonlar kolleksiyasi (asosiy telefon ikki joyda saqlanardi).
- **Why:** Eng kichik o'zgarish, eski kod `phone` ni o'qishda davom etadi.
- **Risk:** Sessiyasi va paroli o'g'irlangan hujumchi zaxira raqam qo'sha oladi; asosiy chatga ogohlantirish yuboriladi.
- **Result:** Round 3 PHASE 3.

## D-048 — Telefon raqamini almashtirish (Rule G)

- **Decision:** `POST /api/auth/phone/change {password}` → deep link → bot identity va kontakt → yangi raqam asosiy raqamdan va o'z zaxira raqamidan farq qilishi va boshqa hisobda bo'lmasligi kerak → asosiy raqam va identity yangilanadi → `tokenVersion + 1` va socketlar yopiladi (barcha seanslar tugaydi) → hodisalar `phone_changed`, `sessions_invalidated`. Eski raqam hisobdan ajraladi.
- **Context:** Rule G; "security event".
- **Evidence:** Hozir telefonni almashtirish oqimi yo'q.
- **Chosen approach:** Joriy parol talab qilinadi; o'zgarishdan keyin barcha seanslar bekor qilinadi (logout siyosati bilan bir xil, D-054).
- **Alternatives:** Eski raqamdan ham tasdiq so'rash (raqamini yo'qotgan foydalanuvchi uchun imkonsiz); seanslarni saqlash (o'g'irlangan seans raqamni almashtirib qolaverardi).
- **Why:** Tiklash kanali o'zgarishi eng xavfli hisob hodisasi.
- **Risk:** Foydalanuvchi o'zgarishdan keyin qayta kiradi.
- **Result:** Round 3 PHASE 3.

## D-049 — Qo'lda tiklash (Rule H)

- **Decision:** Parol, telefon va Telegram yo'q foydalanuvchi `/login` sahifasida so'rov yuboradi (`email`, ism, izoh, aloqa usuli). Javob email mavjudligidan qat'i nazar bir xil va bir marta ko'rsatiladigan so'rov kodini beradi (bazada sha256). Admin mavjud `/admin/users` sahifasidagi "Tiklash so'rovlari" bo'limida so'rov va hisobning niqoblangan qisqa ma'lumotini ko'radi va tasdiqlaydi yoki rad etadi. Tasdiqlashda hisobdagi telefon va Telegram bog'lanishlari tozalanadi, `tokenVersion + 1`, so'rov 72 soat davom ettirish uchun ochiq. Foydalanuvchi kod bilan davom etadi: Telegram orqali yangi raqamni tasdiqlaydi va bot reset havolasini yuboradi. Admin parol, token yoki reset havolasini ko'rmaydi va parol o'rnata olmaydi. Har qadam `SecurityEvent`.
- **Context:** Rule H; "YANGI PAGE YARATMA".
- **Evidence:** Admin panelida foydalanuvchilar sahifasi mavjud; tiklash modeli yo'q.
- **Chosen approach:** `RecoveryRequest` modeli; UI mavjud sahifalarda.
- **Alternatives:** Admin o'zi vaqtinchalik parol berishi (Rule H taqiqlaydi); support xabarlari orqali (audit izi va holat mashinasi yo'q).
- **Why:** Admin faqat tasdiqlaydi, maxfiy qiymatlarga egalik qilmaydi.
- **Risk:** Egalikni tekshirish admin tartibiga bog'liq (tashqi kanal); tavsiyalarda tartib hujjati.
- **Result:** Round 3 PHASE 3.

## D-050 — Xavfsizlik audit log (Rule L)

- **Decision:** `SecurityEvent` kolleksiyasi: `userId`, `actorId`, `type`, `meta` (faqat maxfiy bo'lmagan: niqoblangan telefon, maqsad, so'rov ID), `createdAt`. Turlar: phone_verified, phone_changed, backup_phone_added, backup_phone_removed, telegram_linked, telegram_unlinked, recovery_started, recovery_verified, recovery_completed, sessions_invalidated, manual_recovery_requested, manual_recovery_approved, manual_recovery_rejected, user_blocked, user_unblocked, role_changed. Parol, access/refresh token, bot token, reset va challenge tokenlari hamda xabar matnlari hech qachon yozilmaydi. Admin bir foydalanuvchining oxirgi 50 hodisasini ko'radi.
- **Context:** Rule L; admin amallari (bloklash, rol) hozir log qilinmaydi.
- **Evidence:** Audit log modeli yo'q.
- **Chosen approach:** Bitta yordamchi `recordSecurityEvent()` — xato asosiy amalni to'xtatmaydi.
- **Alternatives:** Fayl logi (qidirib bo'lmaydi, maxfiy ma'lumot oqishi xavfi).
- **Why:** Tekshiriladigan, chegaralangan va maxfiy bo'lmagan iz.
- **Risk:** Kolleksiya o'sadi; saqlash muddati siyosati tavsiyalarda.
- **Result:** Round 3 PHASE 3.

## D-051 — Telegram mavjud bo'lmaganda (Rule K)

- **Decision:** `isTelegramAvailable()`: bot tokeni bor, bot username ma'lum va oxirgi muvaffaqiyatli `getUpdates` 90 soniya ichida. Aks holda Telegram oqimini boshlaydigan endpointlar 503 `TELEGRAM_UNAVAILABLE` qaytaradi, UI uch tilda "Telegram orqali tasdiqlash hozircha mavjud emas. Keyinroq qayta urinib ko'ring." deydi. Email fallback yo'q.
- **Context:** Rule K; hozir faqat username bo'lmaganda 503 `BOT_OFFLINE`.
- **Evidence:** `telegram.routes.ts`.
- **Chosen approach:** Polling holati bo'yicha aniqlash.
- **Alternatives:** Har so'rovda `getMe` (sekin, Telegram limitlari).
- **Why:** Yiqilmaydi va foydalanuvchiga aniq xabar.
- **Risk:** Qisqa uzilishda 90 soniyagacha noto'g'ri "mavjud" holati — bot javob bermasa challenge muddati tugaydi.
- **Result:** Round 3 PHASE 3.

## D-052 — Rate limit va lockout DoS (3G)

- **Decision:** Route limitlari: tiklashni boshlash 5/15 daqiqa IP, 5/soat raqam; reset 10/15 daqiqa IP; token tekshiruvi 30/15 daqiqa IP; qo'lda tiklash so'rovi 3/soat IP; so'rov holati va davom ettirish 20/15 daqiqa IP; telefon oqimlari 10/15 daqiqa IP va 5/15 daqiqa foydalanuvchi; ariza yuborish 30/10 daqiqa IP. Login lockout `email|ip` bo'yicha 10 xato/15 daqiqa va faqat email bo'yicha 50 xato/15 daqiqa.
- **Context:** 3G; D-007 dagi email lockout bitta manbadan qurbonni 15 daqiqa bloklashga imkon berardi.
- **Evidence:** `login-guard.ts`, `auth.routes.ts` `strictRateLimit`.
- **Chosen approach:** `@fastify/rate-limit` route config va jarayon ichidagi kvota yordamchisi (API bitta nusxa).
- **Alternatives:** Redis limiter (keraksiz infratuzilma).
- **Why:** Brute-force sekinlashadi, bitta manba qurbonni bloklay olmaydi.
- **Risk:** Ko'p IP'dan 50 ta xato urinish emailni vaqtincha yopadi; nusxalar ko'paysa kvotalar umumiy emas.
- **Result:** Round 3 PHASE 3.

## D-053 — `TRUST_PROXY` sukuti `1` (3H)

- **Decision:** `TRUST_PROXY` sukuti `true` dan `1` ga o'zgaradi. `.env.example` va DEPLOY.md Railway uchun `1` ni tavsiya qiladi, boshqa topologiyalar uchun hop sonini tushuntiradi. Server ishga tushganda qiymat log qilinadi.
- **Context:** 3H. `true` bilan Fastify `X-Forwarded-For` ning eng chap (mijoz yuboradigan) qiymatini oladi — soxtalashtiriladi. Railway edge proxy haqiqiy IP'ni zanjir oxiriga qo'shadi va mijoz qiymatlarini olib tashlamaydi; Railway hamjamiyati bitta hop (`1`) ni tavsiya qiladi, lekin bu rasmiy barqaror hujjatda emas.
- **Evidence:** `apps/api/railway.json` (API Railway'da, 1 nusxa); Railway Central Station muhokamalari (manbalar FINAL_AUDIT.md da).
- **Chosen approach:** Deploy topologiyasidan kelib chiqib `1`; env bilan o'zgartiriladi.
- **Alternatives:** `true` (soxtalashtiriladi), `false` (hamma bitta proxy IP'da — sayt bo'yicha lockout), `X-Real-IP` ga tayanish (platformaga bog'liq).
- **Why:** Railway va bitta reverse-proxy (nginx) topologiyasida to'g'ri.
- **Risk:** Ikki proxy (masalan Cloudflare + Railway) bo'lsa `2` kerak; deploydan keyin `request.ip` ni `X-Real-IP` bilan solishtirish tavsiya qilinadi.
- **Result:** Round 3 PHASE 3.

## D-054 — Seans siyosati saqlanadi (3I)

- **Decision:** Bitta qurilmada chiqish barcha seanslarni bekor qiladi (D-009). Qurilmalar menejeri qurilmaydi. Parolni tiklash, telefonni almashtirish va qo'lda tiklash tasdiqlanganda ham barcha seanslar bekor qilinadi.
- **Context:** 3I.
- **Evidence:** `revokeUserSessions`, `tokenVersion`.
- **Chosen approach:** Mavjud mexanizm.
- **Alternatives:** Qurilma bo'yicha refresh tokenlar (yangi model va UI, doiradan tashqari).
- **Why:** Owner qarori.
- **Risk:** Foydalanuvchi boshqa qurilmalarda ham qayta kiradi.
- **Result:** O'zgarishsiz.

## D-055 — Google birlashtirish siyosati (3J)

- **Decision:** Google orqali kirishda shu email bilan parol orqali yaratilgan (email tasdiqlanmagan) hisob bo'lsa avtomatik birlashtirilmaydi: 409 `GOOGLE_ACCOUNT_EXISTS` ("Bu email bilan hisob mavjud. Email va parol bilan kiring."). Google orqali yaratilgan hisoblar (`isEmailVerified: true`) odatdagidek kiradi.
- **Context:** 3J; ISSUE-042 (pre-account takeover).
- **Evidence:** `auth.service.ts` `googleLogin` mavjud email bo'yicha to'g'ridan-to'g'ri token beradi.
- **Chosen approach:** Xavfsiz rad etish; birlashtirish oqimi qurilmaydi.
- **Alternatives:** Email tasdiqlash (email infratuzilmasi, owner Telegram'ni tanlagan); birlashtirishda parolni bekor qilish.
- **Why:** Tasdiqlanmagan email bo'yicha hisobni egallash yopiladi.
- **Risk:** Avval parol bilan ro'yxatdan o'tib keyin Google bilan kirmoqchi bo'lgan foydalanuvchi parol bilan kiradi.
- **Result:** Round 3 PHASE 3.

## D-056 — Production DB siyosati: start'da sxema o'zgarmaydi (3L)

- **Decision:** `prestart: prisma db push` olib tashlanadi. Yangi `db:sync` skripti (`prisma db push --skip-generate`, `--accept-data-loss` siz) deploydan oldin qo'lda yoki pre-deploy qadami sifatida ishga tushiriladi. Sxema o'zgarishlari faqat additiv; destruktiv o'zgarish Prisma tomonidan rad etiladi va alohida qarorsiz qilinmaydi. Dev'dagi `predev` saqlanadi.
- **Context:** 3L; ISSUE-028 (D-029 da saqlangan edi, endi owner talab qildi).
- **Evidence:** `apps/api/package.json` `prestart`, `railway.json` `startCommand: npm run start`.
- **Chosen approach:** MongoDB uchun Prisma `migrate` yo'q, shuning uchun migratsiya workflow — aniq `db:sync` qadami va DEPLOY.md yo'riqnomasi.
- **Alternatives:** Railway `preDeployCommand` (har deployda avtomatik mutatsiya — owner qarori bilan zid).
- **Why:** Production start sxemani o'zgartirmaydi, crash-loop xavfi yo'q.
- **Risk:** Operator `db:sync` ni unutsa yangi indekslar qo'llanmaydi; Round 3 sxemasi uchun deploy qadami FINAL_AUDIT.md da.
- **Result:** Round 3 PHASE 3.

## D-057 — Web CSP: Vike nonce (3M)

- **Decision:** Web'da nonce asosidagi CSP: Vike `+csp: { nonce: true }` va `+headersResponse` bitta joyda to'liq siyosatni quradi (script-src `'self'` + nonce + Google GSI; connect-src `'self'` + API va WebSocket manzili + Google; img-src `'self' data: blob:` + API; style-src `'self' 'unsafe-inline'`; object-src `'none'`; base-uri `'self'`; form-action `'self'`; frame-ancestors `'self'`). Inline mavzu skripti nonce oladi. Dev serverda CSP qo'yilmaydi (Vite HMR inline skriptlari).
- **Context:** 3M; ISSUE-078.
- **Evidence:** `HeadDefault.tsx` (`THEME_INIT_SCRIPT`), Vike 0.4.260 `csp.js` va `headersResponse.js`.
- **Chosen approach:** Barcha serving yo'llari (vike preview, `server/index.mjs`, Vercel `api/ssr.js`) Vike `httpResponse.headers` ni ko'chiradi, shuning uchun siyosat bir joyda.
- **Alternatives:** `vercel.json` statik sarlavha va hash (per-request nonce yo'q, uch joyda takrorlanadi); inline skriptni tashqi faylga ko'chirish.
- **Why:** Bitta manba, hash'ni qo'lda yangilash kerak emas.
- **Risk:** Brauzerda tekshirilmagan tashqi manba bloklanishi mumkin — brauzer regressiyasida konsol CSP xatolari tekshiriladi.
- **Result:** Round 3 PHASE 3.

## D-058 — PDF rezyume faqat vakolatli foydalanuvchiga (3N)

- **Decision:** `/uploads/*.pdf` statik yo'l orqali berilmaydi (404). Rezyume fayli autentifikatsiyali endpointlar orqali: nomzodning o'zi va shu nomzod ariza yuborgan kompaniya egasi (hamda admin). Ish beruvchi javoblarida fayl manzili o'rniga `hasResumeFile` bayrog'i. Web faylni Bearer bilan yuklab, blob sifatida ochadi.
- **Context:** 3N; ISSUE-029 (PARTIAL).
- **Evidence:** `profile.routes.ts` (`saveUpload("resume-")`), `applications.routes.ts` (`resumeUrl` select), `ResumeFile.tsx` (`absoluteUploadUrl`).
- **Chosen approach:** Mavjud fayllar joyida qoladi; faqat kirish yo'li o'zgaradi.
- **Alternatives:** Imzolangan vaqtinchalik URL (qo'shimcha kalit boshqaruvi).
- **Why:** Nomzodning shaxsiy ma'lumoti sukut bo'yicha yopiq.
- **Risk:** Eski frontend build'i rezyume havolasini ocha olmaydi — web va API birga deploy qilinadi.
- **Result:** Round 3 PHASE 3.

## D-062 — Telegram oqimlari uchun test harness

- **Decision:** `TELEGRAM_TEST_MODE` env faqat `NODE_ENV=test` bilan ruxsat etiladi (aks holda env validatsiyasi xato beradi): Telegram mavjud hisoblanadi, bot username `ishbor_test_bot`, polling yo'q. `handleTelegramUpdate` va `setTelegramTransportForTests` (production'da xato tashlaydi) eksport qilinadi. Alohida `apps/api/scripts/auth-telegram-check.mjs` test bazasida API'ni ko'taradi va bot update'larini soxta transport bilan jarayon ichida ishga tushiradi.
- **Context:** Round 3 auth test matritsasi; ISSUE-122 (Telegram oqimi testsiz).
- **Evidence:** e2e'da `TELEGRAM_BOT_TOKEN` bo'sh — bot yo'llari hech qachon ishlamaydi.
- **Chosen approach:** Faqat transport soxta; challenge, identity, yagonalik va seans mantiqi haqiqiy kod va haqiqiy bazada.
- **Alternatives:** Haqiqiy Telegram bot (tarmoq va token talab qiladi, qayta takrorlanmaydi).
- **Why:** Haqiqiy test, soxta natija emas.
- **Risk:** Production'da test rejimi yoqilishi — env validatsiyasi va transport guard'i to'sadi.
- **Result:** Round 3 PHASE 4–5.

## D-063 — Yangi sahifa yaratilmaydi

- **Decision:** Tiklash UI `/login` ichida (`?recover=1`, `?recover=manual`, `?recover=status`, `?reset=<token>`); telefon xavfsizligi profilning mavjud Telegram bo'limida; qo'lda tiklash so'rovlari mavjud `/admin/users` sahifasidagi bo'limda.
- **Context:** "BUGUN YANGI PAGE YARATMA".
- **Evidence:** `pages/login/+Page.tsx`, `components/TelegramConnect.tsx`, `pages/admin/users/+Page.tsx`.
- **Chosen approach:** Query rejimlari va mavjud komponentlar.
- **Alternatives:** Alohida `/forgot-password`, `/admin/recovery` sahifalari (taqiqlangan).
- **Why:** Owner ko'rsatmasi.
- **Risk:** `/login` komponenti kattalashadi — rejimlar alohida komponentlarga ajratiladi.
- **Result:** Round 3 PHASE 3.

## D-059 — Bildirishnomalar i18n: payload kaliti (3O)

- **Decision:** Server yaratgan tizim bildirishnomalariga `payload.i18n = { key, params }` qo'shiladi (ariza holati o'zgardi, yangi ariza, obuna mosligi, kompaniya tasdiqlandi, vakansiya moderatsiyasi va boshqa `notify()` chaqiruvlari). Web ma'lum kalitni joriy tilda ko'rsatadi; noma'lum kalit yoki eski yozuvda saqlangan `title`/`body` ko'rsatiladi. Telegram, push va email matnlari hozircha o'zbekcha qoladi (foydalanuvchi tili saqlanmaydi). Admin ommaviy xabari tarjima qilinmaydi.
- **Context:** 3O; ISSUE-073; RU va EN interfeysda "Ariza holati o'zgardi" kabi o'zbekcha matnlar.
- **Evidence:** `notify()` chaqiruvlari: `admin.routes.ts` (4 ta), `alerts.service.ts`, `applications.routes.ts` (2 ta), `billing.routes.ts`.
- **Chosen approach:** Sxema o'zgarishisiz data-driven lokalizatsiya (`payload` Json).
- **Alternatives:** Foydalanuvchi tilini saqlab, har kanalni tarjima qilish (yangi maydon va barcha kanal matnlari).
- **Why:** Arxitektura imkon beradigan eng kichik o'zgarish.
- **Risk:** Eski bildirishnomalar o'zbekcha qoladi; tashqi kanallar tarjima qilinmaydi.
- **Result:** Round 3 PHASE 3 (wave 2).

## D-060 — Accessibility: kontrast, reduced motion, fokus, klaviatura (3P)

- **Decision:** WCAG AA dan past token juftliklari minimal yorqinlik o'zgarishi bilan tuzatiladi. `prefers-reduced-motion: reduce` bo'lsa cheksiz va katta dekorativ animatsiyalar hamda smooth scroll o'chiriladi. Interaktiv elementlarda fokus ko'rinadi. Custom Select, menyu va popover'larda klaviatura ishlaydi (strelkalar, Enter/Space, Escape va fokus qaytishi). Asosiy kontentga o'tish havolasi qo'shiladi. DESIGN.md dagi "reduced motion ataylab e'tiborsiz" qarori owner'ning Round 3 ko'rsatmasi bilan bekor qilinadi.
- **Context:** 3P; ISSUE-075, ISSUE-076, ISSUE-077.
- **Evidence:** `src/styles/global.css` (reduced motion izohi), `tailwind.config.js`, `Select.tsx`, `Header.tsx`, `LanguageSwitcher.tsx`, `NotificationBell.tsx`, `Layout.tsx`.
- **Chosen approach:** Dizayn tokenlari va mavjud komponentlar ichida; layout va matn o'zgarmaydi.
- **Alternatives:** Alohida yuqori kontrast mavzusi (yangi UI).
- **Why:** Owner ko'rsatmasi; WCAG AA.
- **Risk:** Ranglar biroz o'zgaradi; brauzer regressiyasi va axe bilan tekshiriladi.
- **Result:** Round 3 PHASE 3.

## D-061 — Ish beruvchi murojaatlari: server tomonida sahifalash (3Q)

- **Decision:** `GET /api/employer/applications` sahifalangan (pageSize ≤ 50) va filtrlangan (holat, vakansiya, qidiruv, hudud, davr, saralash) yengil ro'yxat va holatlar bo'yicha sonlarni qaytaradi. To'liq rezyume va holat tarixi `GET /api/employer/applications/:id` da. 2000 talik chegara va "kesilgan ro'yxat" ogohlantirishi olib tashlanadi. Web mavjud URL holati bilan server so'rovlariga o'tadi.
- **Context:** 3Q; ISSUE-045; benchmark: 5 000 arizada p50 taxminan 3.5 s va 2.6 MB.
- **Evidence:** `applications.routes.ts`, `EmployerApplicationsView.tsx`.
- **Chosen approach:** Indeksli ID bosqichlari, `groupBy` bilan sonlar, detail faqat tanlanganda.
- **Alternatives:** Faqat javobni yengillashtirish (chegara va klientda filtrlash qoladi).
- **Why:** Ma'lumot hajmi bilan chiziqli o'smaydigan yechim.
- **Risk:** Web ish maydonining ma'lumot oqimi o'zgaradi — brauzer va e2e bilan tekshiriladi.
- **Result:** Round 3 PHASE 3.

## D-064 — Ariza holati siyosati saqlanadi

- **Decision:** Qat'iy holat mashinasi joriy qilinmaydi. Bir xil holat no-op (D-019), qolgan o'tishlar ruxsat etilgan. Ish beruvchi faqat o'z vakansiyasining arizasini o'zgartiradi; bloklangan yoki roli olingan foydalanuvchi o'zgartira olmaydi (D-036).
- **Context:** 7A "status policy"; qat'iy qoidalar owner qarorini talab qiladi.
- **Evidence:** `applications.routes.ts` (`PATCH /api/applications/:id/status`).
- **Chosen approach:** Mavjud xatti-harakat; savol "MENING QARORIM KERAK" bo'limida.
- **Alternatives:** Qat'iy o'tishlar jadvali (product qarori kerak).
- **Why:** Yangi mahsulot qoidasini o'zboshimchalik bilan kiritmaslik.
- **Risk:** Mantiqsiz orqaga o'tishlar mumkin.
- **Result:** O'zgarishsiz.

## D-067 — Migratsiya strategiyasi

- **Decision:** Round 3 sxema o'zgarishlari faqat additiv: yangi ixtiyoriy maydonlar, yangi kolleksiyalar va indekslar. Mavjud hujjatlar backfill qilinmaydi; kod yo'q maydonlarni sukut qiymat sifatida o'qiydi. Qo'llash — `npm run db:sync` (D-056). Dev va demo bazalarga yozilmaydi; testlar nomida `test` bo'lgan alohida bazalarda.
- **Context:** 7A "migration strategy"; MongoDB uchun Prisma migrate yo'q.
- **Evidence:** `schema.prisma`, D-029, D-056.
- **Chosen approach:** Additiv sxema va aniq sinxronlash qadami.
- **Alternatives:** Backfill skriptlari (demo va production ma'lumotni o'zgartiradi).
- **Why:** Eski ma'lumot bilan mos va qaytariladigan.
- **Risk:** Yangi unique indekslar faqat yangi kolleksiyalarda (`AuthChallenge.tokenHash`, `RecoveryRequest.codeHash`), mavjud ma'lumot bilan to'qnashmaydi.
- **Result:** Round 3 PHASE 3.

## D-068 — 10K performance arxitekturasi

- **Decision:** Chegaralangan so'rovlar va javoblar, server tomonida sahifalash (maksimal limit bilan), indekslar, minimal payload, katta kolleksiyalarda relation filter o'rniga oldindan aniqlangan ID'lar, versiya bilan bekor qilinadigan jarayon ichidagi kesh, N+1 yo'q, maxfiy maydonlar chiqmaydi. Redis, navbat, Elasticsearch yoki mikroservis qo'shilmaydi.
- **Context:** Round 3 "10K DESIGN PRINCIPLES"; D-018, D-033–D-035.
- **Evidence:** `scale_bench.mjs` natijalari.
- **Chosen approach:** Mavjud stack ichida.
- **Alternatives:** Qo'shimcha infratuzilma (brief taqiqlaydi).
- **Why:** 10K ro'yxatdan o'tgan foydalanuvchi — oddiy hajm, bir vaqtdagi yuk emas.
- **Risk:** Bir nechta API nusxasida jarayon ichidagi kesh va kvotalar umumiy emas.
- **Result:** Round 3 benchmark bilan o'lchanadi.


## D-069 — `ADMIN_EMAIL` bootstrap mavjud hisobni admin qilmaydi

- **Decision:** `ensureAdminUser` faqat shu email bilan hisob umuman bo'lmasa admin yaratadi. Mavjud hisob (roli qanday bo'lishidan qat'i nazar) avtomatik admin qilinmaydi; startupda ogohlantirish log qilinadi.
- **Context:** Round 3 audit (auth-core-5, headers-infra-3, admin-staff-3): hujumchi `ADMIN_EMAIL` bilan ro'yxatdan o'tsa, keyingi restartda admin bo'lardi.
- **Evidence:** `apps/api/src/common/ensure-admin.ts` (har startda rolni admin'ga o'zgartiradi).
- **Chosen approach:** Promote qilmaslik; kerak bo'lsa admin rolini mavjud admin panel orqali beradi.
- **Alternatives:** Faqat `isEmailVerified` bo'lsa promote (email tasdiqlash yo'q).
- **Why:** Privilege escalation yopiladi.
- **Risk:** Operator ADMIN_EMAIL'ni avval oddiy ro'yxatdan o'tkazgan bo'lsa, admin rolini qo'lda beradi.
- **Result:** Round 3 PHASE 3.

## D-070 — Admin moderatsiya qulfi va admin o'chirish qoidalari

- **Decision:** `Vacancy.adminArchivedAt` (additiv): admin arxivlasa, rad etsa yoki bloklash/rol o'zgarishi sababli arxivlansa o'rnatiladi; ish beruvchi bunday e'lonni qayta faollashtira olmaydi (409 `VACANCY_LOCKED`), admin faollashtirsa tozalanadi. Admin tasdiqlashda ham kategoriya, ish joylashuvi va hudud qoidalari tekshiriladi, qoralama e'lon admin tomonidan chop etilmaydi. Arizasi bor e'lonni admin ham o'chirmaydi — arxivlaydi.
- **Context:** Round 3 audit (authz-idor-4, employer-flows-1, data-integrity-3, admin-staff-6, data-integrity-9).
- **Evidence:** `vacancies.routes.ts` (owner archived → active), `admin.routes.ts` moderatsiya.
- **Chosen approach:** Kim yopganini saqlaydigan bitta ixtiyoriy maydon.
- **Alternatives:** Yangi holat qiymati (`admin_archived`) — barcha holat filtrlarini o'zgartiradi.
- **Why:** Moderatsiyani chetlab o'tish yopiladi, mavjud holatlar saqlanadi.
- **Risk:** Mavjud admin arxivlagan e'lonlarda maydon yo'q (ilgari farqlanmagan) — ular uchun cheklov qo'llanmaydi.
- **Result:** Round 3 PHASE 3.

## D-071 — Nomzodlar bazasi: telefon tasdig'i va kvota

- **Decision:** `GET /api/candidates` telefoni tasdiqlangan ish beruvchi (yoki admin) uchun; foydalanuvchi bo'yicha kvota (soatiga 300 so'rov). Kontakt qoidalari (D-012) va javob shakli o'zgarmaydi.
- **Context:** Round 3 audit (authz-idor-6, candidate-flows-9, employer-flows-7): istalgan ish beruvchi hisobi barcha ochiq nomzodlar ismi va rezyumesini yig'ib olishi mumkin edi.
- **Evidence:** `candidates.routes.ts` — faqat rol va kompaniya tekshiriladi.
- **Chosen approach:** Mavjud telefon gate va kvota yordamchisi.
- **Alternatives:** Nomzodlarni sukut bo'yicha yashirish (`isOpenToWork` false) — product qarori, "MENING QARORIM KERAK" da.
- **Why:** Ommaviy yig'ish qiyinlashadi, bepul qoida saqlanadi.
- **Risk:** Telegram ishlamasa yangi ish beruvchi nomzodlar bazasiga kira olmaydi (Rule K xabari).
- **Result:** Round 3 PHASE 3.

## D-072 — Telegram production'da majburiy servis

- **Decision:** Telefon tasdig'i (ariza, vakansiya, chat, nomzodlar bazasi) va parol tiklash Telegram'ga bog'liq, shuning uchun `TELEGRAM_BOT_TOKEN` production'da majburiy konfiguratsiya deb hujjatlashtiriladi; token yo'q bo'lsa server ishga tushadi, lekin startupda ogohlantirish yoziladi va UI Rule K xabarini ko'rsatadi.
- **Context:** Round 3 audit (telegram-8, docs-3, candidate-flows-10).
- **Evidence:** README "ixtiyoriy servislar" jadvali, `auth-guard.ts` `requirePhoneVerified`.
- **Chosen approach:** Crash emas, ogohlantirish va aniq UI holati.
- **Alternatives:** Token bo'lmasa telefon gate'ni o'chirish (spam himoyasi yo'qoladi); token bo'lmasa server ishga tushmasligi (butun sayt ishlamaydi).
- **Why:** Rule K: xizmat yo'q bo'lsa yiqilmaslik.
- **Risk:** Noto'g'ri sozlangan production'da yangi foydalanuvchilar kalit amallarni bajara olmaydi.
- **Result:** Round 3 PHASE 3.

## D-073 — Kompaniya tasdiq belgisi identity o'zgarganda bekor bo'ladi

- **Decision:** Tasdiqlangan kompaniyaning nomi, sayti yoki logosi o'zgarsa `isVerified` false bo'ladi va egasiga bildirishnoma yuboriladi; admin qayta tasdiqlaydi.
- **Context:** Round 3 audit (authz-idor-5, employer-flows-2): tasdiqlangan belgi bilan brendni almashtirish mumkin edi.
- **Evidence:** `companies.routes.ts` (PUT va logo yo'llari `isVerified` ga tegmaydi).
- **Chosen approach:** Identity maydonlari o'zgarganda belgini tushirish.
- **Alternatives:** Tasdiqlangan snapshot saqlash (yangi model).
- **Why:** Impersonatsiya yopiladi.
- **Risk:** Kichik tahrir (masalan nomdagi harf) ham qayta tasdiq talab qiladi.
- **Result:** Round 3 PHASE 3.

## D-074 — SSR so'rovlari uchun alohida rate-limit kaliti

- **Decision:** Web server (Vercel/self-hosted) SSR paytida API'ga `x-ssr-key` sarlavhasini (`SSR_API_KEY` env) yuboradi; API bu kalit to'g'ri bo'lsa so'rovni umumiy IP bucket'iga emas, alohida yuqori limitli bucket'ga yozadi. Kalit brauzerga hech qachon yetmaydi.
- **Context:** Round 3 audit (scale-10k-1, headers-infra-11): barcha SSR so'rovlari bitta Vercel egress IP'dan keladi va 600/min limitga uriladi.
- **Evidence:** `server.ts` rate-limit (`req.ip` kaliti), `lib/api.ts` SSR fetch'lari.
- **Chosen approach:** Server-to-server sir bilan ajratish.
- **Alternatives:** Limitni oshirish (hujumchiga ham ochiladi); Vercel IP allowList (o'zgaruvchan).
- **Why:** Crawl va trafik 429 bermaydi, brauzer limitlari saqlanadi.
- **Risk:** Kalit oshkor bo'lsa limit chetlab o'tiladi — faqat server env'da, 32+ belgi.
- **Result:** Round 3 PHASE 3.

## D-075 — Sharhlar: moderatsiyani chetlab o'tish va maxfiylik

- **Decision:** Muallif faqat tasdiqlangan (ko'rinib turgan) sharhini o'chiradi; rad etilgan yoki kutilayotgan sharhni faqat admin o'chiradi (qayta yuborish yangilash yo'li orqali `pending` ga tushadi). Ochiq kompaniya sahifasida sharh muallifining `userId` si qaytarilmaydi; `mine` bayrog'i ixtiyoriy token bo'yicha serverda hisoblanadi.
- **Context:** Round 3 audit (2-1, employer-flows-8); D-017, D-020.
- **Evidence:** `reviews.routes.ts` DELETE, `companies.routes.ts` sharhlar select.
- **Chosen approach:** Minimal qoidalar, UI oqimi saqlanadi.
- **Alternatives:** Soft-delete tarixi (yangi maydonlar).
- **Why:** Rad etilgan sharhni o'chirib qayta joylash yopiladi; ariza bergan nomzod identifikatori ochilmaydi.
- **Risk:** Muallif rad etilgan sharhini o'zi o'chira olmaydi.
- **Result:** Round 3 PHASE 3.

## D-076 — Third-party refresh cookie: deploy talabi

- **Decision:** Kod o'zgartirilmaydi. Production'da web va API bitta sayt (masalan `ishbor.uz` va `api.ishbor.uz`) ostida bo'lishi talab sifatida DEPLOY.md ga yoziladi; `*.vercel.app` + `*.up.railway.app` juftligida Safari/Brave refresh cookie'ni bloklab, seans 15 daqiqada tugashi mumkin.
- **Context:** Round 3 audit (auth-core-8, headers-infra-5).
- **Evidence:** `auth.routes.ts` (`SameSite=None` cookie), DEPLOY.md domenlari.
- **Chosen approach:** Infratuzilma darajasidagi yechim (custom domen).
- **Alternatives:** API'ni web origin orqali proxy qilish (Vercel `/api` funksiyalari bilan to'qnashadi); tokenni to'liq localStorage'ga o'tkazish (XSS xavfi oshadi).
- **Why:** To'g'ri yechim domen darajasida; kodda xavfsizlikni pasaytirmaslik.
- **Risk:** Custom domen sozlanmaguncha Safari foydalanuvchilarida seans muammosi — ochiq risk, owner qarori.
- **Result:** Hujjatlashtirildi.

## D-077 — Adminlar: oxirgi admin himoyasi va rol o'zgarishi ma'lumotlari

- **Decision:** Oxirgi faol adminni bloklash yoki rolini tushirish mumkin emas (409). Ish beruvchi roli boshqa rolga o'zgarsa uning faol vakansiyalari bloklashdagi kabi arxivlanadi (`adminArchivedAt` bilan). Bloklangan egasi kompaniyasi ochiq katalog, kompaniya sahifasi va o'xshashlarda ko'rinmaydi. Taklif qilgan admin bloklansa yoki roli olinsa, uning kutilayotgan staff takliflari bekor bo'ladi.
- **Context:** Round 3 audit (auth-core-10, admin-staff-5, data-integrity-6, data-integrity-7, employer-flows-5, 4-1, 1-8, 2-3).
- **Evidence:** `admin.routes.ts`, `team.routes.ts`, `companies.routes.ts`, `companies.list.ts`.
- **Chosen approach:** Mavjud yo'llarda cheklovlar.
- **Alternatives:** Re-authentication (step-up) — alohida UI.
- **Why:** Admin qulflanib qolmaydi, bloklangan hisob ma'lumoti ochiq qolmaydi.
- **Risk:** Yo'q.
- **Result:** Round 3 PHASE 3.

## D-078 — Bildirishnomalar, xabarlar va suhbatlar uchun cursor sahifalash

- **Decision:** `GET /api/notifications` va `GET /api/conversations/:id/messages` cursor bilan (eski sukut javob shakli saqlanadi); web "yana yuklash" va "eskiroq xabarlar" bilan. WebSocket xabarlari ham telefon tasdig'ini talab qiladi; chat Telegram ogohlantirishlari bildirishnoma sozlamalariga bo'ysunadi.
- **Context:** Round 3 audit (db-perf-10, db-perf-11, scale-10k-9, scale-10k-15, candidate-flows-16, realtime-2, realtime-4, 2-6).
- **Evidence:** `notifications.routes.ts` (100 ta chegara), `chat.routes.ts` (1000 ta xabar, WS gate yo'q).
- **Chosen approach:** Mavjud endpointlarga ixtiyoriy cursor parametrlari.
- **Alternatives:** Retention/TTL indeks (ma'lumot o'chiradi — owner qarori).
- **Why:** Eski ma'lumot yo'qolmaydi va chegaralangan so'rovlar.
- **Risk:** Web xabarlar ro'yxati ma'lumot oqimi o'zgaradi — brauzer tekshiruvi.
- **Result:** Round 3 PHASE 3.

## D-079 — Refresh token rotation joriy qilinmaydi

- **Decision:** Refresh tokenlar stateless qoladi (rotation va reuse detection yo'q); himoya — `tokenVersion` bilan barcha seanslarni bekor qilish (logout, bloklash, rol, parol tiklash, telefon almashtirish). Eski `typ`/`v` siz tokenlar muddati tugaguncha qabul qilinadi.
- **Context:** Round 3 audit (auth-core-11, auth-core-12); D-054.
- **Evidence:** `jwt.ts`, `auth.service.ts`.
- **Chosen approach:** Mavjud model.
- **Alternatives:** Token oilasi kolleksiyasi va rotation (yangi model va har refreshda yozuv).
- **Why:** Owner seans siyosati (D-054); deployda barcha foydalanuvchilarni chiqarib yubormaslik.
- **Risk:** O'g'irlangan refresh cookie foydalanuvchi logout yoki parol tiklaguncha ishlaydi — ochiq risk.
- **Result:** Hujjatlashtirildi.

## D-080 — Qidiruv: o'zbekcha apostrof variantlari va tokenlash

- **Decision:** Vakansiya, kompaniya, nomzod va admin qidiruvida apostrof variantlari (`'`, `ʻ`, `ʼ`, `‘`, `’`, `` ` ``) bir xil hisoblanadi (so'rovdagi har variant uchun muqobillar OR bilan yoki regex sinfi bilan); tinish belgilari tokenlardan olib tashlanadi; nomzod va admin qidiruvi ko'p so'zni har maydon bo'yicha tekshiradi.
- **Context:** Round 3 audit (1-1, 1-2, 1-6, 1-9).
- **Evidence:** `vacancies.service.ts` `searchTerms`, `candidates.routes.ts`, `companies.list.ts`.
- **Chosen approach:** So'rov tomonida normalizatsiya (saqlangan ma'lumot o'zgarmaydi).
- **Alternatives:** Saqlangan matnni normalizatsiya qilish (backfill, demo ma'lumot o'zgaradi); Meilisearch sinonimlari (faqat Meili yo'lida).
- **Why:** Ma'lumotga tegmasdan qidiruv to'liqligi oshadi.
- **Risk:** OR variantlari so'rovni biroz og'irlashtiradi — benchmark bilan o'lchanadi.
- **Result:** Round 3 PHASE 3.

## D-065 — Monetizatsiya qoldiqlari tasnifi (3K)

- **Decision:** Qoldiqlar uch toifaga ajratiladi. (a) Asosiy oqimlar (vakansiya joylash, arizalar, nomzodlar bazasi, chat) — toza: 402, tarif limiti yoki obuna tekshiruvi yo'q; o'zgarmaydi. (b) Kod darajasida o'chiq, lekin foydalanuvchiga ko'rinadigan qoldiqlar tozalanadi: admin to'lov tasdiqlash endpointi va admin panelidagi tushum/tarif ko'rinishlari `BILLING_ENABLED` ga bo'ysunadi; ommaviy "Premium" yorlig'i neytral nomga ("Tavsiya etiladi" / "Рекомендуем" / "Featured") o'zgaradi, API parametri moslik uchun saqlanadi; `/pricing` doimiy (301) yo'naltirish. (c) Saqlanadigan meros: billing moduli va sxemasi (flag bilan o'chiq, qayta yoqish xavfsiz emasligi hujjatlashtiriladi), `/pricing` sahifa fayllari (o'lik kod, o'chirish owner qarori), demo seed'dagi to'lov yozuvlari va "Premium tarif" bildirishnomasi (demo ma'lumot qoidasi — o'zgartirilmaydi, owner'ga savol).
- **Context:** 3K "pricing cleanup classification"; monetization-1..9, seo-14; D-014.
- **Evidence:** `admin.routes.ts` (payments confirm flag'siz), `VacancyFilters.tsx` (Premium filtri), `pricing/+guard.ts` (302), `demo-seed.ts` (billing ma'lumoti).
- **Chosen approach:** Foydalanuvchi va admin ko'radigan joylarni tozalash; meros kod va demo ma'lumotga tegmaslik.
- **Alternatives:** Billing modulini va pricing fayllarini butunlay o'chirish (katta diff, owner o'zgarishlarini o'chirish xavfi); demo seed'ni o'zgartirib qayta seed qilish (demo ma'lumot qoidasi taqiqlaydi).
- **Why:** "Pricing/billing is not core UX" qoidasi bajariladi, doira kengaymaydi.
- **Risk:** Demo HR hisobida eski "Premium tarif" bildirishnomasi owner qayta seed qilguncha qoladi.
- **Result:** Round 3 PHASE 3 (wave 2) va PHASE 7 hujjatlari.

## D-066 — Vakansiya muddati (`expiresAt`) va `validThrough`

- **Decision:** Avtomatik muddat yoki arxivlash joriy qilinmaydi. JobPosting JSON-LD `validThrough` faqat `expiresAt` mavjud bo'lsa chiqariladi; sana o'ylab topilmaydi.
- **Context:** seo-5, employer-flows-11: `expiresAt` hech qachon yozilmaydi.
- **Evidence:** `vacancies.service.ts`, `vacancies/@slug/+Head.tsx`.
- **Chosen approach:** Mavjud ma'lumotga mos SEO; muddat siyosati owner savoli.
- **Alternatives:** 30/60 kunlik avtomatik arxiv (product qarori, bildirishnoma va qayta faollashtirish oqimi kerak).
- **Why:** Mahsulot qoidasini o'zboshimchalik bilan kiritmaslik.
- **Risk:** Eskirgan e'lonlar faol qoladi va statistika/qidiruvni buzadi.
- **Result:** "MENING QARORIM KERAK" bo'limida savol.

## D-081 — Dastlabki auditda adversarial verify bosqichi bajarilmadi

- **Decision:** Round 3 dastlabki auditidagi 230 ta noyob muammo UNVERIFIED holatida qayd etiladi. Qayta to'liq verify ishga tushirilmaydi; uning o'rniga (1) PHASE 3 da har bir muammo fix agenti va mustaqil reviewer tomonidan kod ustida tekshiriladi va holati (FIXED / PARTIAL / NOT FIXED / NOT REPRODUCIBLE / WONT FIX) dalil bilan yoziladi, (2) PHASE 6 dagi ikkinchi to'liq audit kodni mustaqil qayta ko'rib chiqadi, (3) tuzatilmagan yoki "takrorlanmadi" deb belgilangan muammolar yakuniy hisobotda ochiq ro'yxatda qoladi.
- **Context:** Dastlabki audit workflow'ida 213 ta agentdan 185 tasi hisob limiti (spend limit) sababli ishlamadi; barcha `verify:*` agentlari shu sababdan tushib qoldi (finder va sintez bosqichlari to'liq tugagan).
- **Evidence:** Workflow xulosasi: `agents_done 28, agents_error 185`; journal `wf_c45e1987-a32/journal.jsonl`.
- **Chosen approach:** Cheklangan byudjetni tuzatish, test va ikkinchi auditga sarflash.
- **Alternatives:** Verify'ni qayta ishga tushirish (taxminan 185 agent) — tuzatish va testlarga byudjet qolmasligi mumkin edi.
- **Why:** Har bir muammo baribir tuzatish paytida kodda tekshiriladi; soxta "tasdiqlangan" yorlig'i qo'yilmaydi.
- **Risk:** Ba'zi topilmalar noto'g'ri yoki severity'si oshirilgan bo'lishi mumkin; shuning uchun ISSUES.md da ochiq "UNVERIFIED" deb yozilgan.
- **Result:** ISSUES.md Round 3 bo'limida hujjatlashtirildi.

## D-082 — Ish beruvchi arizalari qidiruvining chegaralari (o'lchangan)

- **Decision:** Matn qidiruvi (ism, familiya, lavozim sarlavhasi, email, rezyume sarlavhasi, ko'nikma, vakansiya nomi) chegaralangan global so'rov bilan bajariladi va natija shu ish beruvchining arizachilari bilan xotirada kesishtiriladi. Xat matni (`coverLetter`) bo'yicha qidiruv faqat qolgan maydonlarda hech narsa topilmaganda, bir marta va chegaralangan holda (5000) ishlaydi.
- **Context:** 10K sintetik bazada (500 vakansiya, 6123 ariza, 5450 nomzod) o'lchandi: katta `$in` ro'yxati (5450 ID) bilan birga ishlatilgan regex bitta so'rovda 3253 ms; xuddi shu regex `$in` siz 52 ms. `coverLetter` regex skani ro'yxat va sonlar so'rovlarida ikki marta bajarilib, har biri ~1.5 s edi.
- **Evidence:** `scratchpad/round3/search_probe.mjs` o'lchovlari: tor qidiruv (bitta nomzod) 2830 ms → 1802 ms, ism+familiya 1757 ms → 1555 ms, qidiruvsiz sahifa 285 ms.
- **Chosen approach:** Global chegaralangan moslik + xotirada kesishma; `coverLetter` — zaxira yo'l.
- **Alternatives:** MongoDB matn indeksi yoki arizalarni Meilisearch'ga indekslash (brief yangi infratuzilmani taqiqlaydi); ID ro'yxatini kesish (natijani noto'g'ri qiladi).
- **Why:** Indekssiz regexni katta ID ro'yxati bilan birlashtirish MongoDB'da eng qimmat kombinatsiya; o'lchov shuni ko'rsatdi.
- **Risk:** Faqat xat matnida uchraydigan so'z bo'yicha qidiruv boshqa maydonlarda moslik bo'lsa topilmaydi (hujjatlashtirilgan semantika). Barcha arizachilarga mos keladigan keng so'rov (masalan "seeker") hali ~3.9 s — ochiq P2 sifatida yozildi.
- **Result:** Round 3 PHASE 3/5.

## D-083 — Seanslarni bekor qilish barcha ochiq Telegram challenge'larini ham bekor qiladi (ikkinchi audit)

- **Decision:** `revokeUserSessions` (logout, bloklash, rol o'zgarishi, parol tiklash, qo'lda tiklash tasdig'i, telefon almashtirish) foydalanuvchining barcha ochiq `AuthChallenge` yozuvlarini (pending, awaiting_contact, verified — ya'ni berilgan reset tokenlari ham) bekor qiladi. Telegram bog'lanishi uzilganda ham shunday.
- **Context:** Ikkinchi audit (backend-1, CONFIRMED P1): tiklashdan oldin ochilgan `phone_change` / `telegram_link` challenge'i yoki eski identity'ga berilgan reset tokeni tiklash, admin tasdig'i yoki telefon almashtirishdan keyin ham 15 daqiqagacha ishlab, tiklash kanalini hujumchiga qaytarishi mumkin edi (Rule J buzilishi).
- **Evidence:** `recovery.routes.ts` avval faqat `password_recovery` va `manual_recovery` challenge'larini bekor qilardi; admin approve va `applyPhoneChange` umuman bekor qilmasdi.
- **Chosen approach:** Bekor qilish barcha sezgir oqimlar allaqachon chaqiradigan yagona funksiyada.
- **Alternatives:** Har challenge'ga `tokenVersion` snapshot yozib, bot tomonida solishtirish (sxema o'zgarishi va har yo'lda tekshiruv).
- **Why:** Bitta joy — unutish imkoni yo'q; logout-all semantikasiga (D-054) mos.
- **Risk:** Logout qilgan foydalanuvchi boshlagan Telegram bog'lash jarayonini qaytadan boshlaydi.
- **Result:** Tuzatildi; regressiya testi `auth-telegram-check.mjs` `[R3-2]` (50/50).

## D-084 — Ikkinchi auditning boshqa tuzatishlari va ochiq qarorlar

- **Decision:** (1) Telegram `getUpdates` 409 vaqtinchalik xato sifatida oshib boruvchi kutish bilan qayta uriniladi, 401 fatal qoladi; (2) web CSP `object-src` `'none'` dan `blob:` ga — vakolatli PDF rezyume blob URL da ochiladi va CSP ni meros qiladi; (3) ish beruvchi rad etilgan yoki moderatsiyadagi e'lonni yopsa ham qulf qo'yiladi; (4) web fetch interceptor faqat seans endpointlarini chetlab o'tadi; (5) SSR fetch'larining hammasi `x-ssr-key` yuboradi; (6) `TELEGRAM_UNAVAILABLE` ham telefon gate xatosi sifatida ko'rsatiladi (Rule K); (7) `/uploads/*.pdf` bloki absolute-form so'rovda ham ishlaydi; (8) `Application @@index([vacancyId, createdAt])`.
- **Ochiq qoldirilgan (mahsulot qarori kerak):** birinchi Telegram bog'lashda parol so'ralmaydi (backend-5): parolni majburiy qilish Google orqali yaratilgan, parolini bilmaydigan hisoblarni telefon tasdig'isiz qoldiradi. Tavsiya — birinchi bog'lashdan keyingi 24 soat ichida shu kanal orqali parol tiklashni cheklash.
- **Context:** PHASE 6 ikkinchi audit: 128 noyob muammo (P1 7, P2 32, P3 89).
- **Result:** P1: 6 FIXED, 1 PARTIAL (CSP/PDF — headless brauzerda tekshirib bo'lmaydi). P2: 9 FIXED, 23 ochiq (ISSUES.md PHASE 6 bo'limida sabablari bilan).
