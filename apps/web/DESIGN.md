# Dizayn tizimi — "Osmon indigo" (v3)

> 2026-08-31. Foydalanuvchi tasdiqlagan referens (havorang osmon + Toshkent
> silueti + indigo aksentlar) asosida to'liq qayta ishlangan identitet.
> Referens artefakt sifatida ham saqlangan (Claude Design canvas).

## Palitra (barchasi global.css tokenlari orqali)

| | Kunduzgi | Tungi |
|---|---|---|
| Fon (`paper`) | `#F4F8FE` havorang-oq | `#0B0F1A` to'q ko'k-ko'mir |
| Karta (`surface`) | `#FFFFFF` | `#121828` |
| Tugma (`signal`) | `#4F46E5` indigo — oq matn 6:1 | `#6366F1` — oq matn 4.9:1 |
| Gradient urg'u | `#2563EB → #7C3AED → #EC4899` | yorqinroq variantlari |
| Oltin (`gold`) | `#F59E0B` — FAQAT logo "!" va yulduzlar | `#F5B82E` |
| Maosh (`growth`) | `#047857` | `#3DCE8F` |
| Xato (`danger`) | `#BE123C` | `#F47882` |

Tungi rejimda tugmalar ham indigo (oq matn) — avvalgi davrlardagi
`.dark .bg-signal` matn-flip qoidalari OLIB TASHLANGAN.

## Tipografika

- **Display:** Plus Jakarta Sans (variable, self-hosted; latin + latin-ext,
  bazaviy kirill yo'q — ruscha sarlavhalar Inter'ga tushadi)
- **Body:** Inter · **Data/mono:** JetBrains Mono
- `npm run fonts:sync`; @fontsource CSS'ini to'g'ridan-to'g'ri import qilmang.

## Imzo-elementlar

- Header — **suzuvchi oq karta** (sticky, rounded-2xl, blur), aktiv nav —
  indigo ostki chiziq (`.nav-underline-active`).
- Bosh sahifa hero: chapda badge ("#1 platforma") + gradient `qayerda?`
  (`.text-shine`) + indigo qidiruv paneli + **rangli ikonkali kategoriya
  chiplari** (CHIP_HUES, index sahifasida); o'ngda `public/hero-cutout.webp`
  (yigit + minora + o'sish strelkasi, FONI SHAFFOF — bitta rasm ikkala
  rejimga singiydi; tungi rejimda `.dark .hero-photo` biroz xiralashtiradi;
  chekkalar mask bilan singdirilgan, lg+ da).
- Statistika kartasi: pastel ikonka + raqam + rangli chiziqcha.
- "Top kompaniyalar" lentasi — jonli data'dan (companies), /companies ga.
- Mesh fon (HeroBackdrop): indigo `orb-blue` + binafsha `orb-gold` (nom
  tarixiy) + pushti `orb-rose` blob'lar + grain; butun qatlam pastga qarab
  mask bilan fonga singiydi (`.hero-backdrop`). Tungi rejimda blob'lar ancha
  yorqin (0.34–0.5 alpha) — harakat aniq seziladi. Aurora va kichik yo'ldosh
  orb'lar 2026-09-02 da olib tashlangan: ko'zga ko'rinmasdi, faqat GPU'ga
  ortiqcha blur-qatlam yuk edi.
- Scroll-progress — ko'k→binafsha→pushti gradient chiziq.
- VacancyCard hover — chapdan indigo chiziq; karta hoverlari `border-signal/40`.

## Eslatmalar

- `hero-cutout.webp` (~150KB, alpha) faqat lg+ da ko'rinadi, `loading="lazy"` —
  LCP nomzodi baribir h1 matni. Eski `hero-right.jpg` / `hero-right-dark.jpg`
  o'chirilgan.
- i18n: `home.heroBadge`, `home.topCompanies` uch tilda qo'shilgan
  (types.ts dagi Messages tipiga ham).
- Kontrastlar tekshirilgan: dusk 4.9/6.5:1, signal tugmalar 6/4.9:1.

## Kirish / ro'yxatdan o'tish (2026-09-11)

Ikkala sahifa bitta qobiqda: `AuthShell` — chapda oq forma kartasi, o'ngda
brend paneli (faqat `lg+`, dekorativ). Umumiy forma qismlari `AuthForm.tsx` da:

- `AuthTabs` — Kirish / Ro'yxatdan o'tish. Bular ikkita alohida sahifa
  bo'lgani uchun tab'lar `<a>` havolasi (SSR'da ham to'g'ri ishlaydi,
  brauzerning "orqaga" tugmasi kutilgandek).
- `AuthField` / `PasswordField` — chapida ikonka, 48px balandlik; parol
  maydonida ko'rsatish/yashirish tugmasi (`aria-label` uch tilda).
- Ijtimoiy kirish (`SocialLogin`): Google, Apple va Telegram BITTA qatorda
  (`sm:grid-cols-3`) — ustma-ust uch tugma kartani ~55px uzaytirardi. Yorliq
  qisqa (provayder nomi), to'liq ma'no `aria-label` da. Mobilda (`<640px`)
  Telegram pastga, to'liq enga o'tadi — aks holda yorliq kesilardi.
  `VITE_GOOGLE_CLIENT_ID` berilganda Google o'rniga haqiqiy GIS tugmasi
  chiziladi; berilmasa (va Apple har doim) tugma bosilganda "hozircha
  ulanmagan" izohi chiqadi — jim turgan tugmadan yaxshiroq.
- `auth-desk.webp` — panelning FONI: `absolute inset-0 h-full w-full
  object-cover object-bottom`. Matn uning ustiga yoziladi. `h-full` MUHIM:
  `bottom-0` bilan langarlanganda karta balandligi oshsa foto pastga tushib,
  panel tepasida bo'sh joy qolardi. `object-bottom` — kesish kerak bo'lsa
  osmon qismidan bo'ladi, ish stoli sahnasi saqlanadi.
- `.auth-scrim` — foto ustidagi parda: chapdan panel foniga o'tadi (matn
  zonasi), pastda esa deyarli to'liq qoplaydi. Pastki qism ataylab kuchli:
  fotodagi kubok/telefon yorug' va busiz "300 000+" tungi rejimda
  3:1 kontrast berardi (o'lchangan).
- O'lchangan kontrast (foto ustida, alpha hisobga olingan): eng past 4.56:1,
  ko'pchiligi 7-14:1 — AA dan o'tadi. Eslatma: Tailwind'da `/72` kabi
  nostandart alpha ISHLAMAYDI — sinf jimgina tushib qoladi.
- Balandlik: kirish ~592px, ro'yxatdan o'tish ~692px. Foto tabiiy balandligi
  (~601px) kartaga yaqin bo'lgani uchun panelni deyarli butunlay qoplaydi —
  referens dizayndagi ko'rinish shundan chiqadi.
- Mobil (`<640px`): panel yashiriladi; tab, rol kartasi va ijtimoiy tugma
  yorliqlari kichrayadi (`text-[13px]`, `whitespace-nowrap`) — aks holda
  "Ro'yxatdan o'tish" va "Xodim qidiraman" ikki qatorga sinardi. Telegram
  tugmasi mobilda alohida qatorga, to'liq enga o'tadi.

**Diqqat:** paneldagi 12 000+ / 6 000+ / 300 000+ raqamlari — marketing
qiymatlari (referens dizayndan), bazadan olinmaydi. Ishga tushirishdan oldin
haqiqiy raqamlarga moslang yoki olib tashlang.

## Profil markazi — `/profile` (2026-09-11)

Uzun forma sahifasi o'rniga nomzodning karyera dashboard'i. Katta hero rasm
ataylab YO'Q: bu mahsulot sahifasi, marketing emas — faqat avatar (bosh
harflar), kompaniya bosh harf-avatarlari, chiziqli ikonkalar va sarlavhadagi
juda yengil indigo dog'.

**Tuzilish:** global header -> `ProfileHeader` (avatar, ism, sarlavha, hudud,
holat, to'liqlik chizig'i) -> `ProfileNav` (lg+ yon panel, pastda gorizontal
tab qatori) -> bo'lim kontenti -> ixcham footer.

**Bo'limlar URL'da:** `/profile?tab=resume&step=3`. Almashtirish Vike
`navigate()` orqali — sahifa qayta yuklanmaydi, orqaga tugmasi ishlaydi,
havolani ulashsa bo'ladi. Standart bo'lim — `overview` (dashboard), forma emas.

**Komponentlar** (`components/profile/`): `ui.tsx` (Card, Field, Button,
SaveStatus, Empty/ErrorState, StatusBadge, ProgressRing/Bar, TabLink),
`ProfileOverview`, `ProfileCompletion`, `ApplicationList`, `SavedJobs`,
`PersonalInfo`, `ResumeWizard` (6 bosqich), `ProfessionalInfo`,
`ExperienceList`, `EducationList`, `SkillsEditor`, `ResumeFile`,
`ResumePreview`, `AccountSettings`. `TelegramConnect` uch variantli:
`card` (ish beruvchi), `panel`, `compact`.

**Ma'lumot** (`lib/profile/`): `useProfileCore` — profil/rezyume/hududlar.
`PUT /api/resume` butun hujjatni almashtiradi, shuning uchun bo'limlar
saqlashi NAVBATGA qo'yiladi va har biri eng so'nggi holat ustiga qo'llanadi —
tajriba va ko'nikmalar alohida saqlansa ham bir-birini o'chirmaydi.
`computeCompletion` — 8 ta teng vaznli band, faqat real ma'lumotdan.

**Qarorlar:**
- Ko'nikmalar avto-saqlanadi (700ms kechikish); bo'limdan chiqilganda
  kutilayotgan saqlash darhol yuboriladi.
- Tajriba/ta'lim: kartochka + bitta ochiq tahrirlovchi, validatsiya
  (majburiy maydonlar, sana/yil tartibi), o'chirishdan oldin tasdiq.
- Parolni almashtirish va hisobni o'chirish uchun API yo'q — soxta tugma
  emas, yordam markaziga yo'naltirish.
- Tab qatori grid'da `grid-cols-1` SHART: aks holda aylanadigan qatorning
  min-content kengligi ustunni ~1370px ga cho'zib, mobilda toshish beradi.
- Og'irliklar `font-semibold/bold/extrabold` — loyihadagi `font-600/700/800`
  Tailwind'da mavjud emas va hech narsa qilmaydi (global muammo, pastga qarang).

**Global UI tuzatishlari (2026-09-12):**
- Og'irliklar: loyihada `font-500/600/700/800` ishlatilgan edi — bunday
  Tailwind utility yo'q, hammasi 400 bo'lib chiqardi. 40 faylda 210 ta joy
  `font-medium/semibold/bold/extrabold` ga almashtirildi. Yangi kodda faqat
  shu nomlar ishlatilsin (shriftlar variable, 100–900 — haqiqiy og'irlik chiziladi).
- Header breakpointlari: mobil < 768, planshet 768–1023, desktop >= 1024.
  To'liq navigatsiya, user menyu va mehmon tugmalari faqat `lg` dan; undan
  pastda hamburger + ochiladigan panel. Ilgari `md` da ulanib, 768–1023
  oralig'ida header viewportdan toshardi.
- Tor ekran toshishlari: bosh sahifa bo'lim sarlavhasi (`min-w-0 sm:shrink-0`),
  `/salaries` grid (`grid-cols-1`), ish beruvchi vakansiyalar (sarlavhada
  `min-w-0`, amal tugmalari `flex-wrap`). Qoida: ichida aylanadigan jadval yoki
  qator bor grid'ga doim `grid-cols-1` bering.
- Sanalar: `toLocaleDateString("uz")` ISHLATMANG — Chrome'da o'zbekcha oy
  nomlari yo'q ("2026 M09 07"), Node esa "07-sen, 2026" beradi va SSR sahifada
  hydration xatosi chiqadi. `lib/format.ts` dagi `formatDate(iso, locale)`
  (Asia/Tashkent vaqti, o'zbekcha oylar qo'lda) dan foydalaning.

## Mening arizalarim — `/applications` (2026-09-12)

Nomzodning akkaunt bo'limi — arizalarni kuzatish paneli (oddiy jadval emas).
Asosiy navigatsiyada **yo'q**: faqat avatar menyusida.

**Navigatsiya:**
- Nomzod avatar menyusi qat'iy tartibda: Profil · Mening arizalarim · Saqlanganlar ·
  Bildirishnomalar · Xabarlar · Sozlamalar (`/profile?tab=settings`) | Chiqish.
  Menyu tepasida ism va email. Faol sahifa `aria-current`; akkaunt sahifasida
  avatar tugmasi belgilanadi. Mobil menyuda ham shu ro'yxat.
- "Obunalar" (`/alerts`) menyudan chiqdi — arizalar sahifasidagi
  "Yangi vakansiyalarni kuzating" maslahati orqali ochiladi.
- Profil markazidagi "Arizalar" bo'limi `/applications` ga olib boradi;
  eski `/profile?tab=applications` havolasi yo'naltiriladi.
- Ish beruvchi → `/employer/applications`, mehmon → `/login` (mavjud `useRequireRole`).

**Ma'lumot** — mavjud `GET /api/applications` (faqat token egasining arizalari).
Endpoint kengaytirildi, yangisi yaratilmadi: vakansiyaning maosh/hudud/bandlik/
tajriba maydonlari, kompaniyadan faqat nom/slug/logo/tasdiq (STIR va egasi ID'si
endi nomzodga chiqmaydi), rezyume nomi va `ApplicationStatusHistory`.
Backend paginatsiya/saralash bermaydi — qidiruv, filtr, saralash va sahifalash
(5 / 10 / 20 tadan, standart 10) shu ro'yxat ustida (`lib/applications/query.ts`).

**Joylashuv** (referens, 2026-09-13 yangilanishi): ikki ustun — asosiy ustunda
sarlavha (breadcrumb, h1, izoh; md+ da o'ngda kichik dekorativ illyustratsiya
`applications-cards.webp`, berilgan `card.png` dan shaffof qilib tayyorlangan) →
statistika → tablar + filtrlar → kartalar → sahifalash; o'ng panel (lg+, 300/320px)
sahifa tepasidan boshlanadi: "Faol bo'ling!" → umumiy statistika → maslahatlar →
"Yordam kerakmi?". Panel sticky emas (ekrandan baland). Telefonda panel ro'yxatdan keyin.

**Holatlar** — backend enum'i: `sent` Yuborilgan (ko'k), `viewed` Ko'rib chiqilmoqda
(amber), `invited` Suhbat (binafsha), `accepted` Qabul qilingan (yashil), `rejected`
Rad etilgan (qizil). Rang har doim ikonka + matn bilan; tungi rejimda matn ochroq.

**URL holati:** `?status=&q=&date=7d|30d|90d&sort=oldest|status&page=&size=5|20&id=`.
`history.pushState` (Vike qayta render qilmaydi, ro'yxat qayta so'ralmaydi);
qidiruv matnining birinchi harfi — yangi yozuv, keyingilari almashtiradi.
`pending/reviewing/interview` kabi umumiy nomlar enum'ga moslanadi.

**"Faol bo'ling!"** (`ProfileCompletionPrompt`): foiz — `/profile` sahifasidagi
`computeCompletion` ning o'zi (8 ta teng band; parallel formula yo'q), ma'lumot —
`GET /api/profile` + `GET /api/resume` (bir martadan). Qat'iy qoida: **100% bo'lsa
komponent `null`** — karta ham, bo'sh joy ham yo'q, panel statistikadan boshlanadi.
Foiz aniqlanguncha skelet; profil yuklanmasa karta chizilmaydi (0% deb taxmin
qilinmaydi) va maslahatlarga "Profilingizni to'liq to'ldiring" qo'shiladi.
Daraja matni: 0–49% "Profilingizni to'ldiring", 50–79% "…yanada yaxshilang",
80–99% "Profilingiz deyarli tayyor". CTA → `/profile`.

**Bloklar:**
| Blok | Manba | Yo'q bo'lsa |
|---|---|---|
| Statistika kartalari | holatlar soni + ulushi (%) | faqat soni > 0 holatlar; 5 holat bo'lsa oxirgi 2 tasi "Yana 2 ta holat" kartasida. Karta bosilsa — shu holat filtri (`aria-pressed`) |
| Tablar (sonlari bilan) | qidiruv + sana filtri qo'llangan ro'yxat | — |
| Filtrlar | qidiruv (debounce 300ms) + holat/sana/saralash | xl da bitta qator, torroqda qidiruv alohida |
| Kartadagi hudud/maosh/bandlik/tajriba | vakansiya maydonlari | o'sha qator; hammasi yo'q — ro'yxat yo'q |
| Logo | `company.logoUrl` (lazy) | bosh harflar |
| Holat ustuni (xl) | holat + nisbiy vaqt | torroqda kompaniya ostida |
| Keyingi qadam satri | faqat holat enum'i (5 ta aniq matn) | suhbat sanasi / ish beruvchi izohi to'qilmaydi |
| Asosiy tugma | `sent`/`viewed` — "Vakansiyani ko'rish"; `invited`/`accepted`/`rejected` — "Batafsil ko'rish" (tafsilot) | yopilgan vakansiya — "Arizani ko'rish" |
| Tafsilot: rezyume, qo'shimcha xat | `resume`, `coverLetter` | bo'lim yo'q |
| Tafsilot: tarix | `createdAt` + holat tarixi | kelajak bosqichlar chizilmaydi; tarixda yo'q joriy holat — sanasiz |
| Umumiy statistika | ro'yxatdan hisob (taqsimot, ko'rib chiqilgan %) | arizalar yo'q — blok yo'q |
| Maslahatlar | suhbat bor → tayyorgarlik (`/article`); rezyume to'liq emas → "to'ldiring", aks holda "yangilang"; obunalar | — |
| Sahifalash | "N ta arizadan a–b" + raqamlar + "Sahifadagi" | ≤ 5 natija — panel yo'q; 1 sahifa — raqamlar yo'q |

Ish beruvchining javob matni alohida saqlanmaydi (sabab chatga yuboriladi) — tafsilotda
"«Xabarlar» bo'limiga keladi" izohi va havola.

**Holatlar:** skelet (asosiy ustun + panel, to'r bir xil), "Menda hali ariza yo'q" +
vakansiyalar ("Barchasi 0" kartasi va ixcham panel bilan), filtr natijasi bo'sh —
"Filtrlarni tozalash" (alohida), API xatosi — "Qayta urinish" (haqiqiy so'rov).
Sahifa `noindex`, `robots.txt` da yopiq. Footer — ixcham.

## Bildirishnomalar markazi — `/notifications` (2026-09-13)

Akkaunt bo'limi (barcha kirgan rollar; mehmon → `/login`). Asosiy navigatsiyada **yo'q**,
avatar menyusida "Bildirishnomalar". Joylashuv boshqa akkaunt sahifalari bilan bir xil:
sarlavha (md+ da `notifications-bell.webp` — berilgan `bell.png` dan shaffof) → tablar
("Bildirishnomalar [o'qilmagan]" / "Sozlamalar") → amallar paneli → kartalar → sahifalash;
o'ng panel: statistika → kategoriyalar → sozlamalar kartasi → maslahat → yordam.

**Ma'lumot** — mavjud endpointlar: `GET /api/notifications?limit=100` (backend chegarasi,
sahifalash yo'q — oxirgi 100 tasi, filtr/sahifalash brauzerda), o'qildi, hammasi o'qildi,
o'chirish, `GET/PUT …/preferences`. O'qilmaganlar soni — serverdagi aniq son. Adapter
`mapNotificationToViewModel` (`lib/notifications/adapter.ts`).

**Kategoriyalar** faqat backend `NotificationType` dan: `application_status_changed` → Ariza
holati, `new_vacancy_match` → Yangi vakansiyalar, `system` → Tizim xabarlari,
`new_application` → Yangi arizalar (ish beruvchi). "Kompaniya yangiliklari" turi backend'da
yo'q — o'ylab topilmagan. Noma'lum tur — "Boshqa", kategoriya belgisisiz.

**Havola** — `payload.url`, faqat ichki yo'l: "//host" va "/\host" rad (backend va frontend).
Tugma matni yo'ldan (`/applications` → "Arizalarni ko'rish", `/vacancies/:slug` → "Vakansiyani
ko'rish", `/companies/:slug`, `/profile`, `/article`, …). Nomzodga `/employer`, `/admin`
havolasi ko'rsatilmaydi. O'qilmagan bildirishnoma havolasi bosilsa — avval o'qildi (≤1.2s kutiladi).

**URL holati:** `?tab=settings` (profil sozlamalaridagi havola bilan mos), `?unread=true`,
`?type=application|vacancy|system|applicant|other`, `?page=`, `?size=`.

**Amallar** optimistik, xato bo'lsa aynan o'sha o'zgarish qaytadi va xabar chiqadi; muvaffaqiyatdan
keyin header qo'ng'irog'i yangilanadi (`lib/notifications/events.ts`); qo'ng'iroq WebSocket orqali
olgan yangi bildirishnoma sahifa ro'yxatiga ham qo'shiladi.

**Sozlamalar:** rolga tegishli turlar × kanallar (Saytda / Telegram / Brauzer / Email) —
`role="switch"`, har biri darhol saqlanadi (faqat o'sha juftlik PUT), xato — qaytariladi.
Serverda sozlanmagan kanal o'chiq va bosilmaydi. Brauzer push — mavjud `usePush`.

**O'qilmagan kartasi:** och indigo fon + chegara + nuqta + qalin sarlavha, ekran o'quvchiga
"O'qilmagan:" matni. Holatlar: skelet, "Bildirishnomalar yo'q" (nomzodga "Vakansiyalarni ko'rish"),
filtr bo'sh — "Filtrlarni tozalash", API xatosi — "Qayta urinish". Footer — ixcham.

## Saqlangan vakansiyalar — `/favorites` (2026-09-13)

Nomzodning akkaunt bo'limi — saqlanganlar paneli (qidiruv + filtr + boshqarish).
Asosiy navigatsiyada **yo'q**, faqat avatar menyusida ("Saqlanganlar").
Joylashuv `/applications` bilan bir xil: asosiy ustunda sarlavha (md+ da o'ngda
kichik dekorativ `favorites-folder.webp` — berilgan `rasm.png` dan shaffof qilib
tayyorlangan) → tablar + filtrlar → kartalar → sahifalash; o'ng panel tepadan:
statistika → tezkor filtrlar → maslahatlar → "Yordam kerakmi?".

**Ma'lumot** — mavjud `GET /api/favorites` (faqat token egasining yozuvlari,
`favoritedAt`, `isClosed`). Javobdagi vakansiya maydonlari aniq tanlandi: kompaniyadan
faqat nom/slug/logo/tasdiq (egasi ID'si va STIR endi chiqmaydi), hudud va kategoriya
nomi/slug'i. Frontendda `mapFavoriteToViewModel` (`lib/favorites/adapter.ts`) bo'sh
qator/`null`/noma'lum enum'ni `null` ga keltiradi. Backend butun ro'yxatni beradi —
qidiruv, filtr, saralash va sahifalash shu to'liq ro'yxat ustida (`lib/favorites/query.ts`,
umumiy qism `lib/list.ts`). Saqlash/olib tashlash — mavjud `POST/DELETE /api/favorites/:id`.

**URL holati:** `?type=remote|full_time|part_time|shift&q=&region=<slug>&sort=oldest|salary|published&page=&size=5|20`
(`useHistoryQuery` — pushState, ro'yxat qayta so'ralmaydi; orqaga/oldinga ishlaydi).

**Bloklar:**
| Blok | Manba | Yo'q bo'lsa |
|---|---|---|
| Ish turi tablari (ikonka + son) | `employmentType` enum'i | faqat saqlanganlarda bor turlar |
| Joylashuv tanlovi | saqlanganlar orasidagi hududlar | — |
| Saralash | saqlangan sana, maosh (`max ?? min`), `publishedAt` | maoshi/sanasi yo'qlar oxirida |
| Kartadagi maosh (yashil, yirik) | `salaryMin/Max` | yashirilgan yoki kiritilmagan — qator yo'q |
| Hudud / tajriba / ish turi | vakansiya maydonlari | o'sha qator yo'q |
| "N kun oldin saqlangan" | `favoritedAt` | sana ko'rsatilmaydi |
| Logo | `company.logoUrl` (lazy) | brend gradientli bosh harflar (`CompanyLogo`) |
| Yopilgan vakansiya | `isClosed` | "Vakansiya yopilgan" belgisi, havola o'rniga "O'xshashlarini topish" (`/vacancies?q=`) |
| Statistika | jami, ochiq/yopilgan | yopilgan yo'q — faqat jami + izoh |
| Tezkor filtrlar | ish turlari soni | 2 tadan kam tur — blok yo'q |
| Maslahatlar | obunalar; rezyume to'liq emas → "to'ldiring", aks holda "yangilang"; profil < 100% → "Profilingizni to'liq to'ldiring" | profil 100% yoki foiz noma'lum — profil maslahati yo'q |

**Olib tashlash** optimistik: karta darhol yo'qoladi, fokus xabarga o'tadi
("«…» olib tashlandi. Qaytarish"); server rad etsa karta qaytadi va xato ko'rsatiladi.
"Qaytarish" oldingi so'rov tugashini kutib qayta saqlaydi (saqlangan vaqt yangilanadi).

**Holatlar:** skelet (asosiy ustun + panel), "Saqlangan vakansiyalar yo'q" + vakansiyalar,
filtr natijasi bo'sh — "Filtrlarni tozalash", API xatosi — "Qayta urinish" (haqiqiy so'rov;
eski `get` fallback'i xatoni bo'sh ro'yxatga aylantirardi — shu sahifa uchun uloqtiruvchi
`fetchSavedVacancies`). Footer — ixcham. Sahifa `noindex`.

Umumiy komponentlar (arizalar bilan): `ListPagination`, `ActionsMenu`,
`dashboard/SidebarCards` (`TipsCard`, `HelpCard`), `useProfileCompletion` (`lib/profile`).
Ro'yxatdagi kartada ⋮ menyu ochiq bo'lsa karta `has-[…aria-expanded=true]:z-30` bilan qo'shni
kartalar ustiga chiqadi — aks holda menyuning pastki bandlari keyingi kartaning tugmalari ostida qoladi.

## Kompaniyalar katalogi — `/companies` (2026-09-12)

Ish beruvchilarni topish sahifasi (listing, marketing emas — odam rasmi yo'q).
Tuzilish: hero (breadcrumb, sarlavha, qidiruv; lg+ da brend banneri) →
tezkor filtrlar → Top kompaniyalar lentasi → yon panel filtrlari + kartalar
to'ri → cheksiz yuklash → ustunli, so'z-belgisiz footer.

**Hero banneri** (`CompaniesHero`, referens: foydalanuvchi bergan "Kuchli
jamoalar…" dizayni):
- Tuzilish: chapda sarlavha, tavsif va sariq chiziq; o'ngda
  `public/companies-building.webp`; pastda dumaloq strelka. Butun karta
  `/vacancies` ga havola.
- Rasm `Downloads/companies.png` dan olingan: shaffof fonli kesma, bo'sh chap
  qismi qirqilgan, 640×530, 76 KB. Yorug' va tungi fonda halo'siz turadi.
- Matn rasmga yopishtirilmagan: uch tilda tarjima qilinadi, tungi rejimda ham o'qiladi.
- Banner kengligi 420px (lg) / 520px (xl). Rasm balandligi 90%, o'ng-pastga
  yopishgan. Matn va bino bir-biriga tegmaydi (o'lchangan). Tor bannerda
  (1024–1279) tavsif yashiriladi, aks holda binoga chiqib ketardi.

**Holat — faqat URL'da** (`lib/companies/query.ts`):
`?q=&industry=it,finance&region=tashkent&size=11-50&rating=4.5&work=remote&verified=1&hiring=1&saved=1&sort=rating`.
Standart qiymatlar yozilmaydi. Tezkor filtrlar, yon panel, chiplar va
qidiruv bitta holatni o'zgartiradi. `useCompanyQuery` Vike `navigate()` bilan
o'tadi: refresh, orqaga/oldinga va ulashish ishlaydi. Qidiruvda
`overwriteLastHistoryEntry` ishlatiladi, ya'ni har harf tarixga yozilmaydi.

**Ma'lumot:**
- `GET /api/companies` — `{ items, nextCursor, total }` (`apps/api/src/modules/companies/companies.list.ts`).
- Reyting, sharhlar va faol vakansiyalar MongoDB aggregation'da hisoblanadi.
- Sahifalash keyset cursor bilan: `(saralash kaliti, _id)`, offset emas.
- Birinchi 18 ta `+data` da serverdan, qolgani IntersectionObserver bilan
  (600px oldinroq) keladi.
- Bir vaqtda faqat bitta so'rov ketadi. Filtr o'zgarsa ro'yxat `key` bilan
  yangidan tug'iladi va eski so'rov abort qilinadi.

**Filtr ma'nolari (to'qima emas, mavjud ma'lumotdan):**
- Soha — erkin matn, kalit so'z guruhlari (`INDUSTRY_PATTERNS`). Bitta
  kompaniya bir nechta guruhga tushishi mumkin.
- Hajm — ish beruvchi formasidagi oraliqlar (1–10 … 500+). 1–50/51–200 kabi
  oraliqlar bazadagi qiymatlarga to'g'ri kelmaydi.
- Ish turi — kompaniyaning faol vakansiyalaridan: `remote` va joyida
  ishlanadigan. "Gibrid" uchun ma'lumot yo'q, shuning uchun filtri ham yo'q.
- Mashhurlik — tasdiqlanganlar oldin, so'ng faol vakansiyalar ko'rilishi,
  25 × sharhlar va 10 × vakansiyalar.

**Saqlash:** `SavedCompany` modeli.
- API: `POST/DELETE /api/favorites/companies/:id` va `GET .../ids`.
- Ro'yxat `saved=1` bilan olinadi. Token faqat brauzerda bo'lgani uchun bu
  holatda SSR ro'yxatni olmaydi.
- Mehmon yurakchani bosganda kirish sahifasiga yo'naltiriladi.

**Responsive:**
- ≥1024: yopishqoq yon panel, o'zgarish darhol qo'llanadi.
- <1024: "Filtrlar" tugmasi. Telefonda pastdan panel, planshetda o'ngdan
  drawer chiqadi. U qoralama bilan ishlaydi: "Natijalarni ko'rsatish"
  bosilgandagina URL o'zgaradi. Fokus panel ichida qamaladi, Esc yopadi.
- Kartalar to'ri: 1 → sm:2 → xl:3 ustun. Ro'yxat ko'rinishi localStorage'da
  eslab qolinadi.

**Tuzoq:** `overflow-x-auto` lenta ichidagi `sr-only` (absolute) matnlar
lenta `relative` bo'lmasa qirqimdan chiqib, BUTUN sahifani gorizontal
kengaytiradi (1440px da scrollWidth 2481 bo'lgan). Aylanadigan lentaga doim
`relative` bering.

**Header (1024–1279):** tor desktop oralig'ida oraliqlar qisqartirilgan va
matnlar `whitespace-nowrap`. Ilgari mehmon uchun "ISH BOR!", "Ish beruvchi
uchun" va "Ro'yxatdan o'tish" ikki qatorga sinardi. Shunda ham nav o'ng
tugmalar ustiga ~65px chiqib turardi (o'lchangan), shuning uchun bu oraliqda:
- mehmonga "Ish beruvchi uchun" havolasi ko'rsatilmaydi (xl+ da bor; footer
  va ro'yxatdan o'tish orqali ham ochiladi);
- kirgan foydalanuvchida faqat avatar, ism xl+ da.

**Demo ma'lumot:** `npm run db:demo` — 42 kompaniya, 80 vakansiya, 13 nomzod,
arizalar, chat, sharh, to'lov, maqola (`apps/api/src/prisma/demo-seed.ts`).
Kirish: `seeker@demo.ish.top` / `hr@demo.ish.top`, parol `password123`.
`npm run db:demo -- --reset` faqat `@demo.ish.top` hisoblariga bog'liq
yozuvlarni o'chiradi.

## Maosh statistikasi — `/salaries` (2026-09-12)

Maosh tahlili sahifasi: ma'lumot + grafiklar + karyera qarori. Referens —
foydalanuvchi bergan yorug' va tungi maketlar. Tuzilish: hero (breadcrumb,
sarlavha, qidiruv qatori; xl+ da bozor soni, lg+ da "To'g'ri maosh" banneri) →
ommabop kasblar → tanlangan kasb → 3 ta ko'rsatkich → taqsimot + tajriba
grafiklari → kasb va hudud jadvallari → muhim ma'lumotlar → vakansiyalar CTA →
so'z-belgisiz footer.

**Banner rasmi:** `public/salaries-growth.webp` — `Downloads/grafik.png` dan.
- Qayta chizilmagan: xira chet (alpha < 24) tozalangan, bo'sh joy kesilgan,
  520×433, 27 KB, shaffof.
- Matn tepada, rasm pastki o'ng burchakda. Matn qatorlari rasm qutisiga
  tegmaydi (1024/1280/1440 da o'lchanadi).
- 1024–1279 da tavsif yashiriladi.

**Holat — faqat URL'da** (`lib/salaries/query.ts`):
`?role=frontend-developer | ?q=matn` + `&category=it&region=tashkent&experience=junior|middle|senior|lead`.
- Eski manzillar ham o'qiladi (`?categorySlug=&area=&experience=one_to_three`).
  Sitemap yangi nomlarga o'tkazilgan.
- Umumiy mexanizm `lib/useUrlQuery.ts` (`/companies` ham shunda): Vike
  `navigate()`, optimistik holat, eskirgan navigatsiya chizilmaydi.
- Matn qidiruvi: 400ms debounce, `overwriteLastHistoryEntry`. Matn ommabop
  kasb nomiga to'liq mos kelsa (masalan "Buxgalter", "HR"), o'sha kasb tanlanadi.
- Kasb tugmasi yoki kategoriya qatori bosilsa, bir-biriga zid bo'lgani uchun
  qolgan tanlov (kasb/matn/kategoriya) tozalanadi. Hudud va tajriba saqlanadi.
- Yuklanish: 180ms dan qisqa javobda eski raqamlar xiralashadi, uzoqroqda
  skelet chiqadi.

**Ma'lumot:** `GET /api/stats/salary?role=&q=&categorySlug=&area=&experience=`
(`apps/api/src/modules/stats/salary.stats.ts`). Mavjud maydonlar saqlangan,
yangilari qo'shilgan:
- `byExperience` — har doim 4 daraja;
- `vacancyCount` — maoshi yashirinlari ham;
- `market` — filtrsiz butun bozor.

Hisoblash qoidalari:
- Faqat faol, maoshi ochiq, so'mdagi vakansiyalar. Vakil qiymat — oraliq o'rtasi.
- Bitta so'rov, qolgani xotirada. Shu sabab raqamlar bir-biriga mos keladi.
- Kasb — sarlavhadagi kalit so'zlar (lotin/kirill/ingliz, so'z boshidan;
  `hr`, `smm` kabi qisqalari butun so'z). Erkin matn — har so'z sarlavhada yoki
  kategoriya nomida bo'lishi shart.
- Jadvallar va tajriba grafigi **o'z filtrini chetlab** hisoblanadi. Hudud
  tanlansa hududlar jadvali bitta qatorga qisqarmaydi, tanlangani ajratiladi.
  Bo'sh natijada ham boshqa hududni tanlash mumkin.

**Ko'rsatkichlar (to'qima emas):**
- Delta `±N%` — faqat filtr tanlanganda, butun bozorga nisbatan.
- Oraliq kartasida eng past–eng yuqori shkala, 25–75% va mediana belgisi.
- "Muhim ma'lumotlar" matnlari raqamlardan chiqariladi: eng past va eng
  yuqori tajriba darajasi; kamida 2 vakansiyali eng yuqori va eng past hudud
  yoki soha. Ma'lumot kam bo'lsa halol zaxira matn chiqadi.
- Hero'dagi son — `market.count` (real, "100 000+" emas).

**Harakatga o'tish** (vakansiya qidiruvi faqat matn bilan ishlaydi, har so'z
mos kelishi kerak):
- "Shu sohadagi vakansiyalar": `/vacancies?q=<kalit so'z>&region=&experience=&category=`.
  Kalit so'z kasbning eng aniq bitta so'zi, masalan `frontend`.
- CTA ham shu, ustiga asosiy oraliq qo'shiladi: `&salaryFrom=p25&salaryTo=p75`.
- "Saqlash" — mavjud saqlangan qidiruv (obuna) mexanizmi, shu parametrlar
  bilan. Mehmon kirishga yo'naltiriladi, ish beruvchiga tugma ko'rinmaydi.

**Grafiklar** (kutubxonasiz):
- Taqsimot — HTML ustunlar, "chiroyli" o'q (22 → 0/10/20/30). Mediana tushgan
  oraliq yorqinroq.
- Tajriba — yumshoq ustunlar + SVG chiziq (`preserveAspectRatio=none`,
  `vector-effect: non-scaling-stroke`). Yorliq va nuqtalar HTML'da, shu bois
  matn cho'zilmaydi.
- Ikkalasida ekran o'quvchi uchun yashirin jadval bor.

**Tuzoq:** `sr-only` ni `<table>` ga emas, o'ramaga bering. Jadval 1px ga
siqilmaydi va sahifani gorizontal kengaytiradi (390px da scrollWidth 406 bo'lgan).

**Responsive:**
- Qidiruv: telefonda maydon + 2 select + tugma ustma-ust; sm da 3 ustunli
  qator; lg+ da bitta qator.
- Select'lar oddiy `<select>`: klaviatura va telefon tanlagichi o'z-o'zidan ishlaydi.
- Kasb tugmalari gorizontal aylanadi, tanlangani ko'rinadigan joyga suriladi.
- Ko'rsatkichlar 1 → sm:2 → lg:3 ustun; grafiklar va jadvallar lg:2 ustun.
- Telefonda jadvalda "O'rtacha" ustuni yashiriladi (#, nom, mediana, soni qoladi).

## Vakansiyalar — `/vacancies` (2026-09-12)

Ish qidirish sahifasi: qidiruv → filtr → ro'yxat → maosh → saqlash → detail.
Referens — foydalanuvchi bergan yorug' va tungi maketlar. Bosh sahifa ham,
katalog ham emas — asosiy elementlar qidiruv, filtr va ro'yxat.

**Marshrutlar:**
- `/vacancies` — ro'yxat. `/vacancies/:slug` — detail: eski `pages/vacancy/@slug`
  fayllari shu yerga ko'chirildi.
- Eski `/search/vacancy` va `/vacancy/:slug` endi faqat `+guard.ts` (301 redirect).
  Til prefiksi saqlanadi, eski parametr nomlari yangilariga aylantiriladi
  (`text→q`, `area→region`, `employment→workType`, `salary→salaryFrom`,
  `experience=one_to_three→middle`).
- Yangi manzilga o'tkazilganlar: header/footer, bosh sahifa qidiruvi va
  SearchAction, sitemap, xabarnoma havolalari (`paramsToUrl`, email).

**Rasm:** `public/vacancies-briefcase.webp` — `Downloads/case.png` dan.
- Qayta chizilmagan: xira chet (alpha < 40) tozalangan, bo'sh joy kesilgan,
  560×385, 32 KB, shaffof.
- Banner lg+ da: matn chapda, portfel o'ngda. Matn qatorlari rasm qutisiga
  tegmaydi (testda o'lchanadi).

**Holat — faqat URL'da** (`lib/vacancies/query.ts`):
`?q=&region=a,b&workType=full-time,remote&experience=junior,middle&category=&company=a,b&salaryFrom=&salaryTo=&verified=1&premium=1&sort=salary|newest|popular&size=10|20|50&page=2`.
- Standart qiymatlar yozilmaydi.
- Qidiruv, filtr, saralash yoki sahifa hajmi o'zgarsa `page` 1 ga qaytadi.
  Chegaradan tashqari sahifa (`?page=99`) oxirgisiga almashtiriladi.
- Mexanizm — `lib/useUrlQuery.ts` (/companies, /salaries bilan umumiy).
- Xato holatida brauzer bir marta o'zi qayta so'raydi
  (`useVacancyResults`, /salaries dagi naqsh).

**Ma'lumot** (mavjud kontrakt saqlangan, faqat qo'shimchalar):
- `GET /api/vacancies`:
  - `area`, `experience`, `employment` endi vergul bilan bir nechta;
  - yangi `company`, `verified`, `premium` va `sort=popular` (ko'rishlar);
  - noma'lum enum qiymat e'tiborsiz qoladi (ilgari 500 edi);
  - `sort=date` endi faqat sana bo'yicha, premium ko'tarilmaydi;
  - tartib oxirida `id` — bir xil sanada sahifalar orasida takror bo'lmaydi.
- `GET /api/vacancies/facets` — hudud, bandlik, tajriba, kompaniya va soha
  sonlari. Har guruh o'z filtrini chetlab hisoblanadi: hudud tanlansa ham
  boshqa hududlar soni ko'rinadi.
- Matn qidiruvi: 4 harfdan qisqa so'zlar (HR, QA, 1C) faqat sarlavha, kompaniya
  va sohadan izlanadi. Aks holda tavsifdagi "sHaHRi" ham HR bo'lib chiqardi.
- Sahifalash — backend'dagi mavjud `page`/`pageSize`, cursor emas. Raqamlar
  haqiqiy havolalar (yangi tabda ochiladi), oddiy bosishda sahifa yuklanmaydi.
  Standart 10 ta.

**Kartadagi ma'lumotlar (to'qima emas):**
- Ko'nikma teglari: vakansiyada alohida maydon yo'q, shuning uchun talablar
  matnidan ma'lum ko'nikmalar lug'ati bo'yicha ajratiladi
  (`lib/vacancies/skills.ts`). Topilmasa teg chiqmaydi.
- Uchinchi meta — ish jadvali (`scheduleType`), bo'lsa. "Ofisda/Gibrid" maydoni
  bazada yo'q, shuning uchun ko'rsatilmaydi.
- Badge'lar: Premium (`isPremium`), Tezkor (`isUrgent`). Referensdagi "TOP" uchun
  alohida maydon yo'q.
- Logo bo'lmasa — nomdan barqaror gradientli bosh harflar (`CompanyLogo`).
- Butun karta detail'ga olib boradi; kompaniya nomi va saqlash tugmasi alohida bosiladi.

**Saqlash va obuna:**
- Bookmark — mavjud sevimlilar (`useFavorites`: optimistik, xatoda qaytadi).
  Mehmon bosganda kirish sahifasi ochiladi.
- "Obuna bo'lish" — mavjud `SaveSearchButton`. Obuna parametrlari endi vergulli
  ro'yxatlar, kompaniya, tasdiq va premiumni ham saqlaydi.

**Ommabop qidiruvlar** — /salaries dagi kasblar. Tugma kasbning eng aniq kalit
so'zini qidiradi, chunki matn qidiruvi har so'zni talab qiladi.

**Responsive:**
- ≥1024: yopishqoq yon panel. Ekrandan baland bo'lsa ichida aylanadi, pastida
  xiralashish bor.
- <1024: "Filtrlar" tugmasi va drawer (qoralama, "Natijalarni ko'rsatish").
- Telefonda maosh sarlavha ostida, qidiruv select'larida ikonka yashiriladi.

## Kompaniya profili — `/companies/:slug` (2026-09-12)

Ochiq profil (mehmon va nomzod uchun). Referens — yorug' va tungi maketlar.
Qoida vakansiya sahifasidagi bilan bir xil: **ma'lumot bor — ko'rsatiladi,
yo'q — blok (va tab) umuman chiqmaydi**, bo'sh karta va to'qima ma'lumot yo'q.

**Marshrutlar:**
- `/companies/:slug` — ochiq profil. Ilgari shu sahifa `/employer/:slug` da edi.
- `/employer/:slug` endi faqat `+guard.ts` (301 → `/companies/:slug`, til
  prefiksi va `?tab=` saqlanadi). Ish beruvchi boshqaruvi — statik
  `/employer/vacancies`, `/employer/candidates`, `/employer/applications`;
  ular bu yo'ldan ustun, o'zgarmagan.
- Yangilangan havolalar: katalog kartasi, "Top kompaniyalar", bosh sahifa,
  xabarlar, admin, ish beruvchi formasi ("profilni ko'rish"), vakansiya
  sahifasi va karta, `sitemap-employer.xml`.
- Profilda tahrirlash, vakansiya yaratish yoki dashboard tugmalari yo'q.

**Ma'lumot** — `lib/companies/detail.ts` (`mapCompanyToViewModel`):
- `GET /api/companies/:slug` (kompaniya, tasdiqlangan sharhlar, faol vakansiyalar)
  va yangi `GET /api/companies/:slug/similar` — katalogdagi soha guruhlari
  (`INDUSTRY_PATTERNS`), soha aniqlanmasa shu hudud; hisob va tartib katalog bilan bir xil.
- Reyting va 5→1 taqsimot sharhlar ro'yxatidan hisoblanadi — sharh yozilsa yoki
  o'chirilsa sarlavha, tab va xulosa birdan yangilanadi.
- Soha erkin matn: `·`, `,`, `/` bo'yicha chiplarga bo'linadi.

**Bloklar:**
| Blok | Manba | Yo'q bo'lsa |
|---|---|---|
| Reyting qatori, "Sharhlar (N)" tabi | tasdiqlangan sharhlar | qator va tab yo'q |
| Soha, hudud, xodimlar, yil | kompaniya maydonlari | o'sha element yo'q |
| "Kompaniya haqida" | tavsif (uzun bo'lsa "Ko'proq o'qish") | faqat ko'rsatkichlar |
| Ko'rsatkichlar (1–4 karta) | xodimlar, yil, soha, mamlakat (hudud bo'lsa) | karta soni kamayadi |
| Galereya, "Rasmlar (N)" tabi | `company.images` | blok va tab yo'q |
| Faol vakansiyalar | faol vakansiyalar (`/vacancies` kartasi) | "Faol vakansiyalar hozircha yo'q." + boshqa vakansiyalar |
| "Xodimlar nima deydi?" | sharhlar | "Hali sharhlar yo'q." |
| Veb-sayt / Manzil / Sohalar / O'xshashlar | sayt, hudud, soha, `/similar` | karta yo'q; hammasi yo'q — yon ustun yo'q |

Muqova rasmi, ijtimoiy tarmoq havolalari, aniq manzil va xarita bazada yo'q —
chizilmaydi (Manzil kartasi faqat hudud).

**Tablar:** `?tab=vacancies|reviews|photos`. Almashtirish `history.pushState` bilan:
Vike foydalanuvchi qo'ygan yozuvda sahifani qayta so'ramaydi, orqaga/oldinga
`popstate` bilan tabni tiklaydi. Faol bo'lmagan tab paneli bo'sh — kontent takrorlanmaydi.

**Amallar:**
- "Kuzatish" — mavjud saqlangan kompaniyalar (`useSavedCompanies`). Yangi
  vakansiya haqida bildirishnoma hozircha yo'q — faqat ro'yxatga qo'shadi.
  Mehmon → kirish, ish beruvchi → tugma yo'q.
- "Ulashish" — tizim oynasi yoki nusxalash.
- "Xabar yozish" — nomzodga mavjud suhbat ochish (telefon tasdig'i bilan).
- Sharh yozish/o'chirish — mavjud API; backend faqat shu kompaniyaga ariza
  yuborgan nomzodga ruxsat beradi, rad etilsa izoh ko'rsatiladi.

**Holatlar:** 404 — `render(404, "company-not-found")` → `_error` "Kompaniya topilmadi".
API xatosi — jim qayta so'rash, so'ng "Qayta urinish" (skelet), sahifa indekslanmaydi.
Footer — ro'yxat sahifalaridagi kabi zich.

## Vakansiya sahifasi — `/vacancies/:slug` (2026-09-12)

Referens — yorug' va tungi detail maketlari. Asosiy qoida: **ma'lumot bor —
ko'rsatiladi, yo'q — blok umuman chiqmaydi**. Bo'sh karta, "—", to'qima holat
yoki standart imtiyozlar yo'q; qolgan bloklar joyni egallaydi.

**Ma'lumot qatlami** — `lib/vacancies/detail.ts`:
- `mapVacancyToViewModel()` backend javobini toza modelga aylantiradi:
  bo'sh satr → `null`, noto'g'ri enum → `null`, rasm ro'yxati faqat http(s)/`/uploads`.
  Komponentlar faqat shu modelni biladi.
- Matn xavfsiz: HTML teglar olib tashlanadi, React matn sifatida chiqaradi
  (`dangerouslySetInnerHTML` yo'q). `parseRichText` bo'sh qatorni paragraf,
  `- `/`1.` ni ro'yxat, `:` bilan tugagan qisqa qatorni kichik sarlavha qiladi.
- Maosh yashirilgan yoki kiritilmagan bo'lsa `salary: null` — sahifada ham, JSON-LD'da ham yo'q.

**Backend (faqat qo'shimchalar):**
- `Vacancy.images`, `Company.images` (`String[]`, standart `[]`). Hozircha ish
  beruvchi rasm yuklay olmaydi — maydon bo'sh, galereya chiqmaydi.
- `GET /api/vacancies/:slug` javobiga `company.region` va `company._count.vacancies` (faol) qo'shildi.
- `GET /api/vacancies/:slug/similar?limit=4` — shu soha (hudud va tajriba mosi
  oldinda), kam bo'lsa shu kompaniyaning boshqa vakansiyalari. Ko'rishlar soniga ta'sir qilmaydi.

**Bloklar va manbalar:**
| Blok | Manba | Yo'q bo'lsa |
|---|---|---|
| Maosh, tajriba, bandlik, jadval, manzil | vakansiya maydonlari | o'sha element yo'q |
| Ko'nikmalar | talablar matnidan lug'at (`skills.ts`, ro'yxat kartasi bilan bir xil) | qator yo'q |
| Galereya | `vacancy.images` | blok yo'q |
| Talablar / Ish sharoitlari | `requirements` / `conditions` qatorlari | bo'lim yo'q |
| "Kompaniya" tabi | tavsif yoki kamida bitta fakt | tab yo'q |
| "Sharhlar (N)" tabi | tasdiqlangan sharhlar soni; ro'yxat tab ochilganda yuklanadi | tab yo'q |
| Kompaniya rasmlari | `company.images` | blok yo'q |
| O'xshash vakansiyalar | `/similar` | blok yo'q |

Referensdagi "Ofisda", "Asosiy vazifalar" va "Qo'shimcha afzalliklar" maydonlari,
savol-javob va iqtibos bazada yo'q — ko'rsatilmaydi. Tavsifda "Vazifalar:" va
ro'yxat yozilsa, u tavsif ichida sarlavha va ro'yxat bo'lib chiqadi.

**Galereya:** 1 → keng rasm; 2 → ikki ustun; 3 → katta + 2; 4+ → katta
(strelkalar, "1 / N") + 3 kichik ("+N") + "Barcha rasmlar (N)". Yuklanmagan
rasm ro'yxatdan chiqariladi — layout qolgan songa moslashadi. Lightbox: ←/→, Esc, fokus ichida.

**Ariza** (`useApplication`) — mavjud API'lar:
- mehmon → "Kirish va ariza yuborish";
- nomzod → ism + asosiy rezyume nomi; rezyume shart bo'lib to'ldirilmagan
  bo'lsa → "Rezyumeni to'ldirish";
- yuborilgan → backend'dagi haqiqiy holat (`GET /api/applications`; takroriy
  POST ham mavjud arizani qaytaradi);
- ish beruvchi/admin → izoh. Telefon tasdiqlanmagan → `PhoneGateNotice`.
Referensdagi "Tayyor" belgisi uchun ma'lumot yo'q — chiqmaydi.

**Yopishqoq CTA:** ariza kartasi ekrandan chiqsa (`useAnyInView`) — desktop'da
yon ustun pastida ixcham karta, <1024 da pastda qotirilgan panel
(`body.has-sticky-cta` footer uchun joy qo'shadi).

**Saqlash / ulashish / shikoyat:**
- Saqlash — `useFavorites`; mehmon bosganda kirish sahifasi ochiladi.
- Ulashish — Web Share API, bo'lmasa havola nusxalanadi (toast). Telegram,
  Facebook, LinkedIn, X havolalari.
- "Noto'g'ri ma'lumot?" — alohida API yo'q, xabar mavjud `POST /api/support`
  (admin Telegram) orqali: sabab, vakansiya, havola. Xizmat sozlanmagan bo'lsa
  (503) yordam markazi havolasi chiqadi.

**Holatlar:** 404 — haqiqiy HTTP 404, `render(404, "vacancy-not-found")` →
`_error` "Vakansiya topilmadi". API xatosi — sahifa yiqilmaydi: brauzer bir
marta jim qayta so'raydi, "Qayta urinish" skelet bilan yuklaydi (indekslanmaydi).

**Responsive:** ≥1024 — ikki ustun (340/372px yon ustun). 768–1023 — bitta ustun,
kompaniya va o'xshashlar yonma-yon. Telefon: sarlavha → ariza kartasi → galereya →
tavsif → kompaniya → o'xshashlar. Footer — ro'yxat sahifasidagi kabi zich.
