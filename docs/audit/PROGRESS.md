# ROUND 3 — PROGRESS (recovery checkpoint)

Oxirgi yangilanish: 2026-09-17. Bu fayl qisqa holat nuqtasi; tafsilotlar ISSUES.md / DECISIONS.md / FINAL_AUDIT.md da.

## Tugagan fazalar

- **PHASE 0–1 (hujjatlar + repo xaritasi):** DONE. ARCHITECTURE_AUDIT.md ga "ROUND 3 — PHASE 0–1" bo'limi qo'shildi; xom xarita `docs/audit/raw/round3-subsystem-maps.json`.
- **PHASE 2 (to'liq audit):** DONE (verify bosqichisiz). 18 finder + completeness critic + 5 qo'shimcha finder → **303 xom topilma → 230 noyob muammo** (P1 42, P2 101, P3 87). ISSUES.md: **ISSUE-147 … ISSUE-265** (119 yangi ID, 111 tasi mavjud ID'larning qayta topilishi).
  - Adversarial verify (185 agent) hisob limiti sababli ishlamadi → barcha muammolar **UNVERIFIED** (D-081). To'g'riligi fix + reviewer + PHASE 6 orqali tekshiriladi.
- **Qarorlar:** DECISIONS.md D-040 … D-081 yozildi (AUTH qoidalari, monetizatsiya tasnifi, migratsiya, 10K arxitekturasi, verify bo'shlig'i).
- **Benchmark (BEFORE):** `ishbor_scaletest` (10 001 user / 20 000 vakansiya) da o'lchandi; natija `scratchpad/round3/scale-bench-before-round3.json`. Asosiy raqamlar: ish beruvchi arizalari **3.0–3.1 s p50, 2.6 MB**; nomzodlar bazasi **1.8 s p50**; suhbatlar **423 ms / 498 KB**.

## Hozir bajarilayotgan

- **PHASE 3 wave 1** (workflow `wf_bc168140-a3d`, kompyuter o'chgandan keyin resume qilindi):
  - Tugagan (cached): `impl` — api-auth-telegram, api-infra-files, web-auth-ui, web-csp-seo-resume, perf-applications-candidates, web-a11y; `review` — api-infra-files, web-a11y.
  - Kutilmoqda: `impl:tests` va 4 ta reviewer (api-auth-telegram, web-auth-ui, web-csp-seo-resume, perf-applications-candidates).

## Keyingi qadamlar (tartib bilan)

1. Wave 1 reviewer natijalari → `wave1_summary.md`, needsOutside/deviation ro'yxati.
2. Build: `prisma generate` + `tsc` (api va web). Server 3000/4173 to'xtatilgan bo'lishi kerak (prisma DLL qulfi).
3. Maqsadli testlar: `npm run test:auth` (yangi `scripts/auth-telegram-check.mjs`, baza `ishbor_authtest`), so'ng `npm run test:e2e`.
4. **PHASE 3 wave 2** (`wave2.workflow.js` tayyor): admin/moderatsiya yaxlitligi, kompaniyalar/sharhlar, qidiruv+kesh, bildirishnoma/chat sahifalash, web bildirishnoma i18n, forma a11y, testlar.
5. To'liq regressiya: e2e, web unit, brauzer (ui_regression / ui_error_states / ui_phase6_states), axe (`ui_axe.py`), 7 viewport, uz/ru/en.
6. Benchmark AFTER + `round3/bench_compare_r3.py`.
7. **PHASE 6:** ikkinchi to'liq audit (`audit2.workflow.js`, baseline snapshot bilan diff).
8. **PHASE 7–8:** FINAL_AUDIT.md, README/DEPLOY/DESIGN, health matritsa, yakuniy hisobot.

## Muhim eslatmalar

- Commit qilinmaydi; demo/dev bazaga yozilmaydi (`ishbor`), testlar faqat `*test` bazalarda.
- Baseline snapshot (fix'lardan oldingi kod): `scratchpad/round3/baseline/` — ikkinchi audit diff uchun.
- Lokal Mongo rs0 27018 da qo'lda ishga tushiriladi (reboot'dan keyin qayta yoqildi).
- Round 2 e2e natijasi (94/94) fix'lardan oldingi holatga tegishli — Round 3 dan keyin qayta ishga tushirilishi shart.

## Holat yangilanishi — 2026-09-17 (wave 1 tugadi)

- **PHASE 3 wave 1: DONE** (14/14 agent, xatosiz). Xulosa: `scratchpad/round3/wave1_summary.md`, holatlar `wave1_items.json`.
- **Build: PASS** — `apps/api`: prisma generate + tsc toza; `apps/web`: tsc --noEmit exit 0.
- **Maqsadli test: PASS** — `npm run test:auth` (yangi `scripts/auth-telegram-check.mjs`, baza `ishbor_authtest`): **49/49 o'tdi** (deep-link replay/expiry, tiklash, telefon almashtirish, zaxira telefon, dublikat identity, qo'lda tiklash, seans bekor qilish, SecurityEvent, loglarda sir yo'q, Telegram mavjud emas holati).
- **e2e (wave 1 dan keyin): 101 OK / 3 XATO** — log: `scratchpad/round3/e2e_after_wave1.log`:
  1. `[D-069] ensure-admin` — wave 2 (api-admin-moderation) bajarmoqda.
  2. `[ISSUE-041/035]` bloklashda WebSocket 4403 o'rniga 4401 bilan yopildi — **tuzatildi** (`auth.service.ts`: `revokeUserSessions` endi sukut 4403 bilan yopadi).
  3. `[ISSUE-086]` parallel ariza: P2002 dan keyin mavjud ariza topilmasa 409 qaytmoqda — **wave 2 tugagach tuzatiladi** (`applications.routes.ts` hozir wave 2 guruhida).
- **PHASE 3 wave 2: RUNNING** (`wf_06581ed7-107`): admin/moderatsiya, kompaniyalar/sharhlar, qidiruv+kesh, bildirishnoma/chat sahifalash, web bildirishnoma i18n, forma a11y, testlar.

### Wave 2 dan keyingi navbat

1. ISSUE-086 poyga tuzatmasi + qayta build.
2. To'liq regressiya: `test:auth`, `test:e2e`, web unit, brauzer (ui_regression / ui_error_states / ui_phase6_states), axe, 7 viewport, uz/ru/en.
3. Benchmark AFTER + `bench_compare_r3.py` (BEFORE tayyor).
4. PHASE 6 ikkinchi audit (`audit2.workflow.js`).
5. PHASE 7–8: FINAL_AUDIT.md, README/DEPLOY/DESIGN, health matritsa, yakuniy hisobot.

## Holat yangilanishi — 2026-09-18 (wave 2 tugadi, testlar yashil)

- **PHASE 3 wave 2: DONE** (14/14 agent; 6 reviewer spend limit sababli keyinroq qayta ishga tushirildi). Xulosa: `scratchpad/round3/wave2_summary.md`.
- **Lead tomonidan tuzatilgan 4 ta regressiya/xato (o'lchov va test bilan):**
  1. `ISSUE-086` parallel ariza — sabab P2002 emas, MongoDB **P2034 write conflict** edi; endi ikkala kod ham qayta urinib mavjud arizani qaytaradi.
  2. `GET /api/employer/vacancies` 500 — Prisma 5.22 MongoDB konnektori bitta `groupBy` da bir nechta nullable ObjectId maydonda **panic** beradi; uchta alohida guruhlashga bo'lindi.
  3. Bloklashda WebSocket 4401 bilan yopilardi — `revokeUserSessions` endi 4403 bilan yopadi.
  4. D-059 test eski bildirishnomani topib qolardi — tekshiruv aniqlashtirildi.
- **Testlar (haqiqatda ishga tushirilgan):** `test:e2e` **120/120**, `test:auth` **49/49**, web unit **hammasi o'tdi**, API build + web tsc toza.
- **10K benchmark (BEFORE → AFTER, bir xil baza va shart-sharoit):** ish beruvchi arizalari **3119 ms / 2609 KB → 287 ms / 38 KB**; 100-sahifa **3117 → 280 ms**; nomzodlar bazasi **1803 → 401 ms**; suhbatlar **423 ms / 498 KB → 71 ms / 31 KB**; ish beruvchi vakansiyalari **998 KB → 13 KB**; facets p95 **554 → 87 ms**.
- **Qidiruv (D-082):** profil qilindi va tuzatildi — tor qidiruv 2830 → 1555–1802 ms; barcha arizachilarga mos keladigan keng so'rov hali ~3.9 s (ochiq P2).
- **CSP tekshirildi:** preview serverda `content-security-policy` nonce bilan chiqmoqda.

### Ayni damda ishlamoqda
- Brauzer regressiyasi (331 sahifa yuklash, `ui_regression.py`).
- PHASE 6 ikkinchi to'liq audit (`wf_4c7b58a6-75f`).

### Qolgan ishlar
1. axe (a11y) qayta o'lchovi va brauzer natijalarini tahlil qilish.
2. Yakuniy AFTER benchmark (kod tinchigach) va `bench_compare_r3.py`.
3. Ikkinchi audit natijalari bo'yicha tuzatish va ISSUES.md yangilash.
4. FINAL_AUDIT.md, health matritsa, yakuniy hisobot.

## YAKUNIY HOLAT — 2026-09-19 (Round 3 tugadi)

**Oxirgi tugagan faza:** PHASE 8 (yakuniy hisobot). **Joriy faza:** yo'q — Round 3 yopildi.

| Faza | Holat |
|---|---|
| 0–1 Hujjatlar va xarita | DONE |
| 2 To'liq audit | DONE (verify bosqichisiz, D-081) |
| 3 Fix (wave 1 + wave 2 + lead tuzatishlari) | DONE |
| 4 Maqsadli testlar | DONE — auth 50/50 |
| 5 To'liq regressiya | DONE — e2e 120/120, web unit, tsc/build, brauzer 331 yuklash, axe, 10K benchmark |
| 6 Ikkinchi audit + tuzatish | DONE — 128 muammo; P1: 6 FIXED + 1 PARTIAL; P2: 9 FIXED, 23 ochiq |
| 7 Hujjatlar | DONE — ISSUES, DECISIONS (D-040…D-084), ARCHITECTURE_AUDIT, FINAL_AUDIT, CHANGELOG, README, DEPLOY, tizim-arxitekturasi, xarita bannerlari |
| 8 Health matritsa + hisobot | DONE — FINAL_AUDIT.md "ROUND 3 — YAKUNIY HISOBOT" |

**Qolgan ishlar (owner / keyingi raund):** untracked fayllarni commit qilish; bitta domen; `TELEGRAM_BOT_TOKEN` va `SSR_API_KEY`; deploy'da `db:sync`; keng ariza qidiruvi (~3.1 s); birinchi Telegram bog'lash siyosati (D-084); tiklash kvotasi DoS; ikkinchi auditning 23 ochiq P2 si. To'liq ro'yxat: FINAL_AUDIT.md "QOLGAN MUAMMOLAR".

**Test bazalari:** `ishbor_authtest` va `ishbor_e2etest` o'chirildi (skriptlar o'zi qayta yaratadi). `ishbor_uitest` (brauzer testlari uchun demo nusxasi) va `ishbor_scaletest` (10K sintetik benchmark bazasi) qayta ishlatish uchun saqlandi. Demo/dev baza `ishbor` o'zgartirilmadi (61 foydalanuvchi, 83 vakansiya — Round 3 dan oldingi bilan bir xil).
