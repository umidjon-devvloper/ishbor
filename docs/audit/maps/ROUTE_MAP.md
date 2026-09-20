# ROUTE MAP — apps/web (Vike filesystem routing)

> **PHASE 1 snapshot (tuzatishlardan oldingi holat).** Joriy holat: `docs/audit/ISSUES.md`, `docs/audit/DECISIONS.md` va `docs/audit/FINAL_AUDIT.md`. Round 3 dan keyin bu faylda tasvirlangan bir qancha yo'l va qoidalar o'zgargan (Telegram login olib tashlandi, nomzodlar bazasida 402 yo'q, rezyume fayllari avtorizatsiyali endpointda).

Audit sanasi: 2026-09-14. Manba: `apps/web/src/pages/**` (43 ta marshrut katalogi), `components/Header.tsx`, `components/Footer.tsx`, `components/AdminShell.tsx`, `lib/api.ts`, `lib/apiExtra.ts`, `lib/*/api.ts`, `lib/admin/*.ts`. Barcha qator raqamlari o'qilgan kodga tayanadi.

## 0. Umumiy mexanizmlar

| Mexanizm | Fayl | Izoh |
|---|---|---|
| Til prefikslari `/ru`, `/en` | `pages/+onBeforeRoute.ts:6-18`, `lib/i18n/config.ts:26-41` | `extractLocale` prefiksni kesib `urlLogical` beradi — **alohida marshrut emas**, quyidagi har bir yo'l `/ru/...` va `/en/...` ko'rinishida ham ishlaydi. `uz` prefikssiz (`DEFAULT_LOCALE`). |
| Umumiy `<head>` | `pages/+config.ts:6-14`, `components/HeadDefault.tsx:32-59` | hreflang alternates + x-default har sahifada (`useHead`, `lib/i18n/head.ts:13-29`). `canonical = SITE_ORIGIN + localizeHref(pathname)` — **query string canonical'ga kirmaydi** (`head.ts:25`). |
| Rol guard (client) | `lib/useRoleGuard.ts:12-40` | `useRequireRole(role, wrongRoleRedirect)`: mehmon → `/login`, boshqa rol → `wrongRoleRedirect`. `useRedirectRole(blockedRole, to)`: faqat shu rol chiqarib yuboriladi. Ikkalasi `useEffect` — SSR'da ishlamaydi, faqat brauzerda. |
| Admin qobig'i | `components/AdminShell.tsx:18-120` | `allow="admin"` (default) yoki `allow="staff"` (`isStaffRole`). Mehmon/ruxsatsiz → "access denied" bloki (redirect yo'q, `:66-88`); staff (admin emas) `/admin`'ga kirsa → `/admin/articles` (`:37-41`). |
| Xato sahifasi | `pages/_error/+Page.tsx`, `_error/+Head.tsx` | `abortReason` bo'yicha vakansiya/kompaniya/maqola 404 holati; barchasi `noindex`. |
| Vike meros | `pages/articles/index/+data.ts:11-12` (izoh) | `admin/+Head.tsx`, `admin/+title.ts` → barcha `admin/**` sahifalarga meros bo'ladi (o'z `+Head` bo'lmaganlarga). |

## 1. Marshrut matritsasi

Kategoriya: PUBLIC / AUTH (har qanday tizimga kirgan) / CANDIDATE / EMPLOYER / ADMIN / LEGACY / 404.
"Canonical?" ustuni `+Head.tsx`dagi `<Seo canonical>` / `noindex` holatini bildiradi.

| # | Route | Category | Role guard | Purpose | API dependencies (+data → server; qolgani brauzer) | Canonical? | Redirect? | Potential issue |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` (`index/`) | PUBLIC | `useRedirectRole("employer","/employer/candidates")` (`index/+Page.tsx:37`) | Bosh sahifa: statistika, kategoriyalar, so'nggi vakansiyalar, kompaniyalar | +data (`index/+data.ts:4-8`): `GET /api/stats`, `GET /api/vacancies` (default sahifa, keyin `.slice(0,6)`), `GET /api/companies` (`.slice(0,4)`). Brauzer: `useFavorites` → `GET /api/favorites/ids`, `POST/DELETE /api/favorites/:id` | canonical, indeks | — | Ish beruvchi login'dan keyin `/` → `/employer/candidates` ikkilangan redirect (login `/`ga yuboradi, `login/+Page.tsx:32`). `fetchVacancies()`/`fetchCompanies()` default sahifani to'liq olib keyin kesadi (`+data.ts:11-12`) — ortiqcha yuklama. |
| 2 | `/vacancies` | PUBLIC | `useRedirectRole("employer","/employer/candidates")` (`vacancies/+Page.tsx:46`) | Vakansiya qidiruvi, filtr, sahifalash | +data (`vacancies/+data.ts:13-19`): `GET /api/vacancies?…`, `GET /api/vacancies/facets?…`. Brauzer: `useVacancyResults` (o'sha ikkisi), `useFavorites`, `SaveSearchButton` → `POST /api/saved-searches` | canonical (query'siz), `?q=`da noindex YO'Q (`vacancies/+Head.tsx:31`) | — | `?q=…&page=…` sahifalari indekslanadi, canonical `/vacancies`ga ishora qiladi; sarlavha `q`ga qarab o'zgaradi (`+Head.tsx:12-13`). Xato: `page: null` → error state (to'g'ri). |
| 3 | `/vacancies/@slug` | PUBLIC | — | Vakansiya sahifasi | +data (`vacancies/@slug/+data.ts:11-24`): `GET /api/vacancies/:slug`, `GET /api/vacancies/:slug/similar?limit`; topilmasa `render(404, VACANCY_NOT_FOUND)`; ApiError → `vacancy:null` (retry holati). Brauzer: `useApplication` → `POST /api/vacancies/:id/apply`, `GET /api/applications`, `GET /api/resume`; `useFavorites`; `CompanyReviewsPanel` → `fetchCompany` = `GET /api/companies/:slug` (to'liq detail, `lib/api.ts:422-433`); `ReportDialog` → `POST /api/support` | canonical + JSON-LD; xato holatida noindex (`+Head.tsx:34-36`) | — | Sharhlar paneli uchun kompaniyaning to'liq sahifasi (vakansiyalar ro'yxati bilan) qayta so'raladi — "minimal response" prinsipiga zid. |
| 4 | `/companies` | PUBLIC | `useRedirectRole("employer","/employer/candidates")` (`companies/+Page.tsx:53`) | Kompaniyalar katalogi (`?saved=1` — saqlanganlar) | +data (`companies/+data.ts:15-24`): `GET /api/companies?…` (`saved=1`da null — brauzerda), `GET /api/companies` (featured). Brauzer: `CompanyResults` → `GET /api/companies` (cursor), `useSavedCompanies` → `GET /api/favorites/companies/ids`, `POST/DELETE /api/favorites/companies/:id` | canonical (query'siz), indeks | — | `?saved=1` mehmon uchun ma'nosiz, lekin sahifa ochiladi (guard yo'q, `+data.ts:18-20`) — holat tekshirilishi kerak. |
| 5 | `/companies/@slug` | PUBLIC | — | Kompaniya sahifasi (`?tab=vacancies|reviews`, `lib/companies/useCompanyTab.ts:11-39`) | +data (`companies/@slug/+data.ts:11-24`): `GET /api/companies/:slug`, `GET /api/companies/:slug/similar`; 404 → `COMPANY_NOT_FOUND`. Brauzer: `CompanyReviews` → `POST /api/companies/:slug/reviews`, `DELETE /api/reviews/:id`; `CompanyActions` → `POST /api/conversations/start`; `useSavedCompanies` | canonical (qo'lda `<link rel=canonical>`, `+Head.tsx:61`) + JSON-LD; xato → noindex (`:24`) | — | — |
| 6 | `/salaries` | PUBLIC | — | Maosh statistikasi (`?category=&region=`) | +data (`salaries/+data.ts:15-24`): `GET /api/stats/salary?…`, `GET /api/categories`, `GET /api/regions` (client nav'da katalog qayta so'ralmaydi). Brauzer: `useSalaryStats` (o'sha) | canonical (query'siz), indeks | — | Sitemap `/salaries?category=…`, `?region=…` URL'larini beradi (`apps/api/src/modules/seo/seo.routes.ts:92-93`), lekin canonical query'ni tashlab `/salaries`ga ishora qiladi (`lib/i18n/head.ts:25`) — sitemap va canonical bir-biriga zid. |
| 7 | `/articles` (`articles/index/`) | PUBLIC | — | Maqolalar ro'yxati (`?q=&category=&page=`) | +data (`articles/index/+data.ts:14-18`): `GET /api/articles?…` (`page:null` — xato). Brauzer: `useArticleList` (o'sha) | canonical; `?q` bo'lsa noindex (`articles/index/+Head.tsx:28`) | — | — (to'g'ri namuna) |
| 8 | `/articles/@slug` | PUBLIC | — | Maqola sahifasi | +data (`articles/@slug/+data.ts:13-28`): `GET /api/articles/:slug`; eski slug → 301 `/articles/:newSlug`; yo'q → `render(404, ARTICLE_NOT_FOUND)`; ApiError → `article:null`. Brauzer: `ArticleFeedback` → `POST /api/articles/:slug/feedback` | canonical, `og:type=article`, JSON-LD; xato → noindex (`+Head.tsx:28`) | 301 (slug o'zgargan bo'lsa) | — |
| 9 | `/support` | PUBLIC | — | Yordam markazi (FAQ lug'atda, maqola qidiruvi) | Brauzer (`lib/support/hooks.ts`): `GET /api/support/contacts`, `GET /api/articles?…` | canonical, indeks | — | — |
| 10 | `/contact` | PUBLIC | — | Aloqa formasi | +data (`contact/+data.ts:8-10`): `GET /api/support/contacts` (xato → null, brauzer qayta so'raydi). Brauzer: `ContactForm` → `POST /api/support` | canonical, indeks | — | — |
| 11 | `/employer` | PUBLIC (landing) | `useRedirectRole("employer","/profile")` (`employer/+Page.tsx:13`) | Ish beruvchilar uchun marketing sahifa (CTA → `/signup?role=employer`) | API yo'q (raqamlar hardcode: `CountUp value={3204}`, `48000`, `:48,54`) | canonical, indeks | — | "Ish beruvchi uyi" mos kelmaydi: bu yerda `/profile`, Header'da `homeHref="/employer/candidates"` (`Header.tsx:70`). Statistika (3204+, 48000+) statik — "to'qima ma'lumot yo'q" qoidasiga zid (confidence: high, kodda literal). |
| 12 | `/login` | AUTH (mehmon) | guard yo'q (tizimga kirgan ham ochadi) | Kirish | `POST /api/auth/login` (`login/+Page.tsx:30`), `SocialLogin` → `POST /api/auth/google`, `/api/auth/telegram/start`, `/api/auth/telegram/poll` | canonical + noindex | Muvaffaqiyatdan keyin har doim `/` (`login/+Page.tsx:32`) | `next`/return-to yo'q: himoyalangan sahifadan `/login`ga tushgan foydalanuvchi qaytmaydi (`useRoleGuard.ts:18`, `messages/+Page.tsx:18`, `notifications/+Page.tsx:17`, `profile/+Page.tsx:31`). |
| 13 | `/signup` | AUTH (mehmon) | guard yo'q | Ro'yxatdan o'tish (`?role=employer`, `signup/+Page.tsx:24`) | `POST /api/auth/register` (`:3,44`), Google | canonical + noindex | Tugagach employer → `/employer`, seeker → `/profile` (`:34`) | Employer `/employer`ga yuboriladi, u yerda `useRedirectRole` uni `/profile`ga qaytaradi (`employer/+Page.tsx:13`) — ikkilangan redirect. |
| 14 | `/profile` | AUTH (seeker/employer/admin) | inline: `guest` → `/login` (`profile/+Page.tsx:30-34`); rol bo'yicha `EmployerProfile` / `SeekerHub` (`:37-38`) | Karyera markazi (`?tab=overview|personal|resume|experience|education|skills|applications|saved|telegram|settings&step=`) yoki ish beruvchi kompaniya profili | Seeker: `useProfileCore` → `GET/PUT /api/profile`, `GET/PUT /api/resume`, `GET /api/regions`; `GET /api/applications`, `GET /api/favorites`; `ResumeFile` → `POST/DELETE /api/profile/resume`; `TelegramConnect` → `GET /api/telegram/status`, `POST /api/telegram/link`; `SavedJobs` → `DELETE /api/favorites/:id`; `AccountSettings`. Employer: `GET /api/employer/company`, `PUT /api/employer/company`, `POST/DELETE /api/employer/company/logo` | canonical + noindex | — | `admin` roli seeker hub'ini ko'radi (`:37-38` faqat employer ajratilgan). `?tab=applications` legacy — "ko'chdi" bloki (`:155-157`). |
| 15 | `/applications` | CANDIDATE | `useRequireRole("job_seeker","/employer/applications")` (`applications/+Page.tsx:19`) | Nomzod arizalari | `GET /api/applications` (`fetchMyApplications`, xatoda ApiError → error state), `useProfileCompletion` → `GET /api/profile`, `GET /api/resume` | canonical + noindex | — | Admin → `/employer/applications` → (employer emas) → `/` zanjiri. |
| 16 | `/favorites` | CANDIDATE | `useRequireRole("job_seeker","/employer/candidates")` (`favorites/+Page.tsx:19`) | Saqlangan vakansiyalar | `GET /api/favorites` (`lib/favorites/api.ts:10-13`), `POST/DELETE /api/favorites/:id`, profile completion | canonical + noindex | — | Admin uchun redirect zanjiri (`/employer/candidates` → `/`). |
| 17 | `/alerts` | CANDIDATE | `useRequireRole("job_seeker","/employer/candidates")` (`alerts/+Page.tsx:13`) | Saqlangan qidiruvlar / e-mail alert | `GET /api/saved-searches` (fallback `[]`, `apiExtra.ts:203-205`), `PATCH/DELETE /api/saved-searches/:id` | canonical + noindex | — | `fetchSavedSearches` xatoda `[]` qaytaradi — **xato "bo'sh holat" bo'lib ko'rinadi** (EMPTY ≠ ERROR buzilgan). Header'da havola yo'q, faqat sidebar'lardan (`ApplicationsSidebar.tsx:33`, `FavoritesSidebar.tsx:116`). |
| 18 | `/notifications` | AUTH | inline: `guest` → `/login` (`notifications/+Page.tsx:16-18`) | Bildirishnomalar markazi (`?tab=settings`, `?unread=&type=&page=`, `lib/notifications/query.ts:5-44`) | `GET /api/notifications?limit=` (`lib/notifications/api.ts:22`), `POST /api/notifications/:id/read`, `POST /api/notifications/read-all`, `DELETE /api/notifications/:id`, `GET/PUT /api/notifications/preferences`, push: `GET /api/push/public-key`, `POST /api/push/subscribe|unsubscribe` | canonical + noindex | — | — |
| 19 | `/messages` | AUTH | inline: `guest` → `/login` (`messages/+Page.tsx:17-19`) | Chat (`?c=<conversationId>`) | `GET /api/conversations`, `GET /api/conversations/:id/messages` (`lib/messages/api.ts`), `GET/POST /api/conversations/:id/rating`, `GET /api/users/:id/summary`, WS `GET /ws/chat?token=` (`lib/useChatSocket.ts:35`) | noindex, canonical YO'Q (`messages/+Head.tsx:7`) | — | Boshqa akkaunt sahifalaridan farqli canonical berilmagan (kichik nomuvofiqlik). |
| 20 | `/employer/vacancies` | EMPLOYER | `useRequireRole("employer","/")` (`employer/vacancies/+Page.tsx:9`) | Ish beruvchi vakansiyalari (`?page=&notice=`) | `GET /api/employer/vacancies` (`lib/employer/vacancies/api.ts:26`), `GET /api/employer/company` (`:38`), `PATCH /api/vacancies/:id/status`, `DELETE /api/vacancies/:id` (`lib/api.ts:760-777`) | noindex (`employer/vacancies/+Head.tsx:11`) | — | — |
| 21 | `/employer/vacancies/new` | EMPLOYER | `useRequireRole("employer","/")` (`new/+Page.tsx:10`) | Yangi vakansiya formasi | `VacancyFormView` → `GET /api/categories`, `GET /api/regions`, `GET /api/employer/company`; `VacancyForm` → `POST /api/vacancies` (`lib/api.ts:748-758`) | noindex | Saqlangach `/employer/vacancies?notice=` (`VacancyForm.tsx:221`) | — |
| 22 | `/employer/vacancies/@id/edit` | EMPLOYER | `useRequireRole("employer","/")` (`edit/+Page.tsx:13`) | Vakansiyani tahrirlash | Yuqoridagilar + `GET /api/employer/vacancies` (yozuvni topish, `lib/employer/vacancies/api.ts:25-26`), `PUT /api/vacancies/:id` (`lib/api.ts:732-746`) | noindex | — | Bitta vakansiya uchun butun ro'yxat so'raladi (`fetchEmployerVacancyRecords`) — bounded query prinsipi (limit yo'q). |
| 23 | `/employer/applications` | EMPLOYER | `useRequireRole("employer","/")` (`employer/applications/+Page.tsx:9`) | Murojaatlar (`?vacancy=&application=&page=`) | `GET /api/employer/applications` (`lib/employer/applications/api.ts:12`), `PATCH /api/applications/:id/status` (`:29`), `POST /api/conversations/start` | noindex | — | — |
| 24 | `/employer/candidates` | EMPLOYER | `useRequireRole("employer","/")` (`employer/candidates/+Page.tsx:21`) | Nomzodlar bazasi (qidiruv) | `GET /api/candidates?q=` (`lib/api.ts:779-781`, `authGet` fallback `{items:[]}`), `POST /api/conversations/start` → `/messages?c=` | noindex | — | `fetchCandidates` xatoda `[]` → **xato bo'sh ro'yxat bo'lib ko'rinadi** (`+Page.tsx:30-34`, error state yo'q). |
| 25 | `/admin` | ADMIN | `AdminShell` (admin; staff → `/admin/articles`) | Admin ko'rsatkichlari, reindex, alert run, broadcast | `GET /api/admin/overview` (fallback `null`, `apiExtra.ts:320-321`), `POST /api/admin/search/reindex`, `POST /api/admin/alerts/run`, `POST /api/admin/broadcast` | canonical + noindex | — | `if (!data)` → skeleton (`admin/+Page.tsx:60-68`); API xatosida `null` qaytgani uchun **cheksiz skeleton, xato ko'rsatilmaydi**. |
| 26 | `/admin/users` | ADMIN | `AdminShell` | Foydalanuvchilar (`?q=&role=&page=`) | `GET /api/admin/users?…` (fallback bo'sh sahifa, `apiExtra.ts:324-328`), `PATCH /api/admin/users/:id/block`, `PATCH /api/admin/users/:id/role` | canonical + noindex | — | Ro'yxat fallback `emptyPage()` — xato bo'sh jadval bo'lib ko'rinadi (`get()` semantikasi, `apiExtra.ts:43-47`). |
| 27 | `/admin/vacancies` | ADMIN | `AdminShell` | Moderatsiya | `GET /api/admin/vacancies?…`, `PATCH /api/admin/vacancies/:id/moderate` | canonical + noindex | — | Yuqoridagi fallback muammosi. |
| 28 | `/admin/companies` | ADMIN | `AdminShell` | Kompaniyalar, verify | `GET /api/admin/companies?…`, `PATCH /api/admin/companies/:id/verify` | canonical + noindex | — | Yuqoridagi fallback muammosi. |
| 29 | `/admin/reviews` | ADMIN | `AdminShell` | Sharhlar moderatsiyasi | `GET /api/admin/reviews?…`, `PATCH /api/admin/reviews/:id`, `DELETE /api/admin/reviews/:id` | canonical + noindex | — | Yuqoridagi fallback muammosi. |
| 30 | `/admin/payments` | ADMIN (LEGACY-billing) | `AdminShell` | To'lovlarni tasdiqlash | `GET /api/admin/payments?…`, `POST /api/admin/payments/:id/confirm` | canonical + noindex | — | Product rule 1: platforma bepul — bu bo'lim va `AdminShell` nav'idagi "payments" havolasi (`AdminShell.tsx:50`) izolyatsiyalangan eski billing. Tasdiqlashda backend `url:"/pricing"` bildirishnoma yaratadi (`apps/api/src/modules/admin/admin.routes.ts:483`). |
| 31 | `/admin/articles` | ADMIN (staff) | `AdminShell allow="staff"` (`admin/articles/+Page.tsx:8`) | Maqolalar ro'yxati (staff) | `GET /api/admin/articles?…`, `POST /api/admin/articles/:id/<transition>`, `DELETE /api/admin/articles/:id` (`lib/admin/articles.ts:74-108`) | O'z `+Head` yo'q → `admin/+Head.tsx` meros (noindex, canonical to'g'ri yo'l) | — | `<title>` `admin/+title.ts`dan meros — barcha maqola sahifalari bir xil sarlavha. |
| 32 | `/admin/articles/new` | ADMIN (staff) | `AdminShell allow="staff"` | Yangi maqola | `POST /api/admin/articles`, `GET /api/admin/articles/authors`, `POST /api/admin/articles/cover` | meros (noindex) | Saqlangach `/admin/articles/:id/edit` (`AdminArticleEditor.tsx:220`) | — |
| 33 | `/admin/articles/@id/edit` | ADMIN (staff) | `AdminShell allow="staff"` (`edit/+Page.tsx:22`) | Tahrirlash | `GET /api/admin/articles/:id`, `PUT /api/admin/articles/:id`, transitions, cover | meros (noindex) | — | — |
| 34 | `/admin/articles/@id/preview` | ADMIN (staff) | `AdminShell allow="staff"` (`preview/+Page.tsx:36`) | Qoralama preview | `GET /api/admin/articles/:id` | meros (noindex) | — | — |
| 35 | `/admin/team` | ADMIN | `AdminShell` (`admin/team/+Page.tsx:8`) | Kontent jamoasi, takliflar | `GET /api/admin/team`, `POST /api/admin/team/invites`, `DELETE /api/admin/team/invites/:id`, `PATCH /api/admin/team/:id` (`lib/admin/team.ts:31-54`) | meros (noindex) | — | — |
| 36 | `/admin/invite` | PUBLIC (token orqali) | guard YO'Q, `AdminShell` ishlatilmaydi (`admin/invite/+Page.tsx:5-7`) | Staff taklifini qabul qilish (`?token=`) | `GET /api/staff-invites/:token`, `POST /api/staff-invites/:token/accept` (`lib/admin/team.ts:56-67`) | meros (noindex) | — | Mehmon sahifasi `/admin` prefiksi ostida — robots `Disallow: /admin` uni ham yopadi (maqsadga mos), lekin nomlash chalg'ituvchi. |
| 37 | `/pricing` | LEGACY | `+guard.ts` (har doim redirect) | Tariflar (o'chirilgan) | +data `GET /api/plans` va sahifa (`fetchSubscription`, `fetchMyPayments`, `startCheckout`) — **guard avval ishlagani uchun hech qachon bajarilmaydi** | canonical (o'lik) | **302** → `/employer` (`pricing/+guard.ts:11`) | `+Page.tsx` (310 qator) va `+data.ts` o'lik kod, bundle'da qoladi. Backend hali ham `url:"/pricing"` bildirishnoma yaratadi (`admin.routes.ts:483`, `billing.routes.ts:155`); frontend adapter uni `employer`ga map qiladi (`lib/notifications/adapter.ts:80`). |
| 38 | `/article` | LEGACY | `+guard.ts` | Eski ro'yxat manzili | — | — | **301** → `/articles` + query (`article/+guard.ts:13`) | — |
| 39 | `/article/@slug` | LEGACY | `+guard.ts` | Eski maqola manzili | — | — | **301** → `/articles/:slug` (`article/@slug/+guard.ts:10`) | — |
| 40 | `/vacancy/@slug` | LEGACY | `+guard.ts` | Eski vakansiya manzili | — | — | **301** → `/vacancies/:slug` (`vacancy/@slug/+guard.ts:14`) | — |
| 41 | `/search/vacancy` | LEGACY | `+guard.ts` | Eski qidiruv (`?text=&area=`) | — | — | **301** → `/vacancies?q=&region=` (`search/vacancy/+guard.ts:13-15`) | — |
| 42 | `/employer/@slug` | LEGACY | `+guard.ts` | Eski ochiq kompaniya profili | — | — | **301** → `/companies/:slug` (`employer/@slug/+guard.ts:15`) | Statik `/employer/vacancies|candidates|applications` ustun turadi (Vike statik > dinamik), lekin `/employer/<istalgan>` — masalan `/employer/settings` — 404 o'rniga `/companies/settings` (404) ga 301 beradi. |
| 43 | `_error` | 404/500 | — | Xato sahifasi; `abortReason` bo'yicha vakansiya/kompaniya/maqola holati | — | noindex (`_error/+Head.tsx:14-20`) | — | 500 holatida ham `noindex` va `is404` orqali farqlanadi — to'g'ri. |

Eslatma: har bir marshrut `/ru/...` va `/en/...` prefiksi bilan ham mavjud (0-bo'lim).

## 2. Ichki havola auditi

Manba: `grep` bo'yicha `l("/...")`, `href: "/..."`, `localizeHref(...)`, `window.location.assign/replace(l(...))` — `components/**`, `pages/**`, `lib/**`.

### 2.1 Header (`components/Header.tsx`)
| Havola | Qator | Marshrut mavjud? |
|---|---|---|
| `/employer/vacancies`, `/employer/candidates`, `/employer/applications`, `/messages` (employer nav) | 53-56 | Ha |
| `/vacancies`, `/companies`, `/salaries`, `/articles`, `/messages` (seeker) | 59-64 | Ha |
| `/admin` (admin) / `/admin/articles` (staff) | 48, 66 | Ha |
| `homeHref`: employer → `/employer/candidates`, boshqalar → `/` | 70 | Ha |
| Akkaunt menyusi: `/profile`, `/applications`, `/favorites`, `/notifications`, `/profile?tab=settings` | 92-97 | Ha (`tab=settings` `lib/profile/tabs.ts:15`da bor) |
| `/employer`, `/login`, `/signup` (mehmon) | 243-255, 340-347 | Ha |

### 2.2 Footer (`components/Footer.tsx`)
| Havola | Qator | Holat |
|---|---|---|
| `/vacancies`, `/profile`, `/salaries`, `/articles` | 58-61 | Ha |
| `/employer` (ikki marta: `employersPost`, `employersBase`) | 67-68 | Mavjud, lekin **ikki yorliq bitta manzilga** |
| `/companies`, `/contact`, `/support` | 74-76 | Ha |
| Compact footer: `/vacancies`, `/employer`, `/companies`, `/support`, `/contact`, `/` | 126-137 | Ha |
| Til almashtirgich `localizeHref(pathname, loc) + search` | 169 | Ha |

### 2.3 AdminShell (`components/AdminShell.tsx:43-53`)
`/admin`, `/admin/users`, `/admin/vacancies`, `/admin/companies`, `/admin/reviews`, `/admin/payments`, `/admin/articles`, `/admin/team` — barchasi mavjud. `/admin/payments` — legacy billing (rule 1).

### 2.4 Sahifa va komponentlardagi boshqa havolalar
| Havola shakli | Manba (misol) | Mavjud? | Izoh |
|---|---|---|---|
| `/vacancies/${slug}`, `/companies/${slug}`, `/articles/${slug}` | `VacancyCard.tsx:32,88`, `CompanyCard.tsx:33`, `ArticleCard.tsx:41` va yana ~40 joy | Ha | — |
| `/vacancies?category=`, `?company=`, `?q=` | `CategoryCard.tsx:28`, `CompanyAbout.tsx:97`, `FavoriteVacancyCard.tsx:54` | Ha | `lib/vacancies/query.ts` parse qiladi |
| `/articles?q=`, `/articles?category=interview` | `ArticleTags.tsx:25`, `ApplicationsSidebar.tsx:30` | Ha | `interview` ∈ `ARTICLE_CATEGORIES` (`lib/articles/categories.ts:2`) |
| `/companies/${slug}?tab=reviews` | `CompanyReviewsPanel.tsx:114` | Ha | `useCompanyTab.ts:15` — sharh yo'q bo'lsa "overview"ga tushadi |
| `/profile?tab=resume`, `?tab=personal`, `?tab=settings` | `ApplicationDetail.tsx:138`, `ApplicationsSidebar.tsx:31-32`, `AccountSettings`, `VacancyDetailView.tsx:50` | Ha | `PROFILE_TABS` (`lib/profile/tabs.ts:5-16`) |
| `/notifications?tab=settings` | `NotificationsSidebar.tsx:132`, `AccountSettings.tsx:80` | Ha | `lib/notifications/query.ts:33` |
| `/messages?c=${id}` | `CompanyActions.tsx:47`, `EmployerApplicationsView.tsx:182`, `employer/candidates/+Page.tsx:50` | Ha | `useMessagesQuery` |
| `/alerts` | `ApplicationsSidebar.tsx:33`, `FavoritesSidebar.tsx:116` | Ha | Header/Footer'da yo'q — faqat sidebar orqali |
| `/employer/vacancies/${id}/edit`, `/employer/vacancies/new`, `/employer/applications?vacancy=` | `VacancyRow.tsx:50,134`, `ApplicationSidebar.tsx:155` | Ha | — |
| `/admin/articles/${id}/edit|preview`, `/admin/articles/new` | `AdminArticleActions.tsx:29-31`, `AdminArticleEditor.tsx:220` | Ha | — |
| `/signup?role=employer` | `employer/+Page.tsx:36` | Ha | `signup/+Page.tsx:24` o'qiydi |
| `/login` (guard redirectlari) | `useRoleGuard.ts:18`, `messages/+Page.tsx:18`, `notifications/+Page.tsx:17`, `profile/+Page.tsx:32`, `pricing/+Page.tsx:48` | Ha | return-to yo'q |
| Raw `href="/vacancies"`, `href="/companies"` (`Section` prop) | `index/+Page.tsx:196-220` | Ha | Komponent ichida `l(href)` qo'llanadi (`:279-282`) — til prefiksi saqlanadi |

### 2.5 Backend tomonidan yaratiladigan frontend havolalar (bildirishnoma `url`)
| URL | Manba | Mavjud? |
|---|---|---|
| `/employer/vacancies` | `apps/api/src/modules/admin/admin.routes.ts:290` | Ha |
| `/profile` | `admin.routes.ts:359` | Ha |
| `/pricing` | `admin.routes.ts:483`, `billing.routes.ts:155` | **Legacy** — 302 → `/employer`; adapter `targetOf` → `employer` (`lib/notifications/adapter.ts:80`) |
| `/messages`, `/employer/applications` | `applications.routes.ts:267,74` | Ha |
| `/vacancies?…` (alert) | `alerts.service.ts:87` | Ha |
| Sitemap: `/vacancies/:slug`, `/companies/:slug`, `/articles/:slug`, statik ro'yxat | `seo.routes.ts:75-135` | Ha (legacy `/vacancy/`, `/article/` ishlatilmaydi — to'g'ri) |
| robots `Disallow`: `/dashboard`, `/account` | `seo.routes.ts:29,31` | **Mavjud emas** (zararsiz, eskirgan) |

### 2.6 Xulosa
Kodda **mavjud bo'lmagan marshrutga ishora qiluvchi ichki havola topilmadi**. Eskirgan yo'llar (`/pricing`, robots'dagi `/dashboard`, `/account`) faqat backend va SEO konfiguratsiyasida qolgan.

## 3. Potentsial muammolar ro'yxati

Prioritet: P1 — foydalanuvchi oqimi/holat buzilishi; P2 — nomuvofiqlik/SEO; P3 — tozalash.

| # | Prior. | Muammo | Dalil | Confidence |
|---|---|---|---|---|
| 1 | P1 | **EMPTY ≠ ERROR buzilgan (fallback-bo'sh)**: `fetchCandidates` (`{items:[]}`), `fetchSavedSearches` (`[]`), admin ro'yxatlari (`emptyPage()`), `fetchAdminOverview` (`null` → cheksiz skeleton). API 5xx/401 bo'lsa sahifa "hech narsa yo'q" yoki skeleton ko'rsatadi. | `lib/api.ts:715-719, 779-781`; `lib/apiExtra.ts:43-47, 203-205, 320-328`; `pages/employer/candidates/+Page.tsx:30-34`; `pages/alerts/+Page.tsx`; `pages/admin/+Page.tsx:60-68` | high |
| 2 | P1 | **Login return-to yo'q**: himoyalangan sahifadan `/login`ga tushgan foydalanuvchi kirgach `/`ga ketadi; employer esa yana `/employer/candidates`ga (ikkilangan redirect). | `lib/useRoleGuard.ts:18`; `pages/login/+Page.tsx:32`; `pages/index/+Page.tsx:37` | high |
| 3 | P2 | **Signup employer ikkilangan redirect**: `/employer` → `useRedirectRole` → `/profile`. | `pages/signup/+Page.tsx:34`; `pages/employer/+Page.tsx:13` | high |
| 4 | P2 | **Admin roli uchun redirect zanjiri**: `/favorites`, `/alerts` → `/employer/candidates` → (employer emas) `/`; `/applications` → `/employer/applications` → `/`. `wrongRoleRedirect` faqat employer'ni nazarda tutadi. | `pages/favorites/+Page.tsx:19`; `pages/alerts/+Page.tsx:13`; `pages/applications/+Page.tsx:19`; `pages/employer/*/+Page.tsx` (`useRequireRole("employer","/")`) | high |
| 5 | P2 | **`/profile` admin uchun seeker hub**: faqat `employer` ajratilgan, admin nomzod karyera markazini ko'radi. | `pages/profile/+Page.tsx:37-38` | high |
| 6 | P2 | **Rol guard nomuvofiq**: `/messages`, `/notifications`, `/profile` inline `useEffect` bilan, boshqalari `useRequireRole` bilan; hammasi client-only (SSR'da skeleton). Backend authoritative bo'lgani uchun xavfsizlik muammosi emas, lekin bir xillashtirish kerak. | `pages/messages/+Page.tsx:17-19`; `pages/notifications/+Page.tsx:16-18`; `pages/profile/+Page.tsx:30-34`; `lib/useRoleGuard.ts` | high |
| 7 | P2 | **SEO: sitemap vs canonical zid** — sitemap `/salaries?category=…`, `?region=…` beradi, canonical query'ni tashlab `/salaries`ga ishora qiladi. `/vacancies?q=`da noindex yo'q (maqolalarda bor). | `apps/api/src/modules/seo/seo.routes.ts:92-93`; `lib/i18n/head.ts:25`; `pages/vacancies/+Head.tsx:31` vs `pages/articles/index/+Head.tsx:28` | high |
| 8 | P2 | **`/employer` landing'da statik raqamlar** (`3204+`, `48000+`) — "to'qima ma'lumot yo'q" qoidasiga zid; `/api/stats` mavjud. | `pages/employer/+Page.tsx:48,54`; `lib/api.ts:498-499` | high |
| 9 | P2 | **Employer "uy" sahifasi nomuvofiq**: `/employer` → `/profile`, Header logo → `/employer/candidates`. | `pages/employer/+Page.tsx:13`; `components/Header.tsx:70` | high |
| 10 | P2 | **Legacy billing izlari**: `/pricing` 302, lekin `+Page.tsx`/`+data.ts` o'lik kod; `/admin/payments` va nav havolasi; backend `url:"/pricing"` bildirishnomalari. Rule 1 bo'yicha izolyatsiya "qolishi mumkin", lekin nav'da ko'rinishi user-facing. | `pages/pricing/*`; `components/AdminShell.tsx:50`; `apps/api/src/modules/admin/admin.routes.ts:483`; `billing.routes.ts:155`; `lib/notifications/adapter.ts:80` | high |
| 11 | P2 | **`/employer/@slug` catch-all**: `/employer/<notanist>` 404 o'rniga `/companies/<notanist>`ga 301 (keyin 404). Statik employer panellari ustun turadi, lekin yangi `/employer/...` sahifa qo'shilsa nomi legacy redirect bilan to'qnashishi mumkin. | `pages/employer/@slug/+guard.ts:12-16` | medium |
| 12 | P2 | **Ortiqcha so'rovlar** (minimal response / bounded query): vakansiya sahifasida sharhlar uchun to'liq `GET /api/companies/:slug`; tahrirlashda bitta vakansiya uchun butun `GET /api/employer/vacancies`; bosh sahifada default sahifa olib `slice`. | `components/vacancies/detail/CompanyReviewsPanel.tsx:4` + `lib/api.ts:422-433`; `lib/employer/vacancies/api.ts:25-26`; `pages/index/+data.ts:4-12` | high |
| 13 | P3 | **Admin sub-sahifalarida `<title>` meros**: `admin/articles/*`, `admin/team`, `admin/invite` o'z `+title.ts`/`+Head.tsx`ga ega emas — hammasi `metaExtra.admin.title`. | `pages/admin/+title.ts`; `pages/admin/articles/**` (fayl yo'q) | high |
| 14 | P3 | `/messages` `+Head` canonical bermaydi (boshqa akkaunt sahifalari beradi). | `pages/messages/+Head.tsx:7` | high |
| 15 | P3 | Footer'da ikki yorliq bitta `/employer`ga. | `components/Footer.tsx:67-68` | high |
| 16 | P3 | `/login`, `/signup` tizimga kirgan foydalanuvchi uchun guard yo'q (qayta kirish mumkin). | `pages/login/+Page.tsx`, `pages/signup/+Page.tsx` (guard chaqiruvi yo'q) | high |
| 17 | P3 | robots.txt eskirgan `Disallow: /dashboard`, `/account` (marshrut mavjud emas). | `apps/api/src/modules/seo/seo.routes.ts:29,31` | high |
| 18 | P3 | `/companies?saved=1` mehmon uchun ochiq (guard yo'q), `first:null` bilan brauzerda tokensiz so'rov holati tekshirilishi kerak. | `pages/companies/+data.ts:18-20`; `pages/companies/+Page.tsx:53-54` | low |
| 19 | P3 | `/admin/invite` — mehmon sahifasi `/admin` prefiksi ostida; `AdminShell`siz, nomlash chalg'ituvchi (funksional muammo yo'q). | `pages/admin/invite/+Page.tsx:5-7` | high |
