# API MAP — ISH BOR! backend (PHASE 1.2)

> **PHASE 1 snapshot (tuzatishlardan oldingi holat).** Joriy holat: `docs/audit/ISSUES.md`, `docs/audit/DECISIONS.md` va `docs/audit/FINAL_AUDIT.md`. Round 3 dan keyin bu faylda tasvirlangan bir qancha yo'l va qoidalar o'zgargan (Telegram login olib tashlandi, nomzodlar bazasida 402 yo'q, rezyume fayllari avtorizatsiyali endpointda).

Manba: `apps/api/src/server.ts`, `apps/api/src/modules/**/*.routes.ts`, `apps/api/src/common/*.ts`, `apps/api/prisma/schema.prisma`. Har bir qator o'qilgan kodga tayanadi (fayl:qator). Sana: 2026-09-14.

## 0. Umumiy qatlam

| Mavzu | Kod | Izoh |
|---|---|---|
| Rate-limit (global) | `server.ts:103` — `max: env.RATE_LIMIT_MAX` (default **600/min**, `env.ts:33`), `trustProxy: true` (`server.ts:52`) | IP bo'yicha; X-Forwarded-For ishonchli deb olinadi |
| `strictRateLimit` **10/min** | `auth.routes.ts:55-57`: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/telegram/start`, `POST /api/auth/google`; `team.routes.ts:26`: `GET /api/staff-invites/:token`, `POST /api/staff-invites/:token/accept` | `POST /api/auth/telegram/poll` va `POST /api/auth/refresh` da **yo'q** |
| Boshqa maxsus limitlar | `POST /api/articles/:slug/feedback` 20/min (`articles.routes.ts:177`); `POST /api/support` 5/min (`support.routes.ts:168`) | |
| Auth | `requireAuth` — `Authorization: Bearer <access>` (`auth-guard.ts:12-23`), JWT 15 min (`jwt.ts:10`); refresh 30 kun httpOnly cookie, `path=/api/auth`, prod `SameSite=None; Secure` (`auth.routes.ts:37-46`) | Refresh tokenni bekor qilish (revocation) yo'q — logout faqat cookie'ni o'chiradi (`auth.routes.ts:90-93`) |
| Rol guardlari | `requireRole(...)` — tokendagi rol (`auth-guard.ts:25-30`); `requireStaff(...)` — **bazadagi** rol + `isBlocked` (`auth-guard.ts:38-45`); `requirePhoneVerified` — bazadan `isPhoneVerified` (`auth-guard.ts:51-64`) | Blok tekshiruvi faqat login/refresh/telegram/google'da (`auth.service.ts:66-78`) va `requireStaff`da; `requireRole` bilan himoyalangan yo'llar bloklangandan keyin ham 15 min ochiq |
| Xato formati | `{ error: CODE, message }`; Zod → 400 `VALIDATION_ERROR`; P2002 → 409; P2025 → 404; boshqa 4xx statusCode saqlanadi; qolgani 500 (`server.ts:110-141`) | **P2023 (noto'g'ri ObjectId)** ushlanmaydi → 500 |
| Multipart | 5 MB, 1 fayl (`server.ts:104`) | |
| Static | `/uploads/*` — `UPLOAD_DIR` ochiq, autentifikatsiyasiz (`server.ts:107`) | Rezyume PDF'lar ham shu yerda (pastga qarang) |
| WebSocket | `GET /ws/chat?token=<access>` (`chat.routes.ts:71-137`) | Token URL query'da |
| CORS | `WEB_ORIGIN` + `CORS_EXTRA_ORIGINS` + dev localhost + `*.vercel.app` (`server.ts:90-101`), `credentials: true` | Har qanday `*.vercel.app` origin'ga credentials bilan ruxsat |
| Prisma ObjectId | `objectId()` / `isObjectId()` (`validation.ts:10-16`) | Ko'p `:id` paramlar tekshirilmaydi (jadvallarda belgilangan) |

Belgilar: **AUTH** — `A` = requireAuth, `–` = ochiq, `inline` = qo'lda token; **ROLE** — `R(...)` = requireRole, `S(...)` = requireStaff, `P` = requirePhoneVerified; **OID?** — `:id` ObjectId formati tekshiriladimi.

---

## 1. server.ts

| METHOD | PATH | AUTH | OUTPUT | Izoh |
|---|---|---|---|---|
| GET | `/health` | – | `{ok, db}`; 503 bo'lsa `db: "down"` | `prisma.$runCommandRaw({ping:1})` (`server.ts:146-153`) |
| GET | `/` | – | 302 → `WEB_ORIGIN` | `server.ts:156` |

## 2. auth (`auth.routes.ts`, `auth.service.ts`)

| METHOD | PATH | AUTH/ROLE | INPUT (zod) | OUTPUT | ERRORS | Izoh |
|---|---|---|---|---|---|---|
| POST | `/api/auth/register` | – (10/min) | `email` email, `password` min 8 (**max yo'q**), `role` job_seeker\|employer, `firstName`/`lastName` (**max yo'q**), `companyName` max 160 (`:12-19`) | `{accessToken}` + refresh cookie | 409 email band | Employer companyName bersa Company darhol yaratiladi (`auth.service.ts:52-58`) |
| POST | `/api/auth/login` | – (10/min) | `email`, `password` min 1 | `{accessToken}` | 401 (bir xil xabar), 403 `USER_BLOCKED` | argon2 verify (`auth.service.ts:80-88`) |
| POST | `/api/auth/refresh` | cookie | – | `{accessToken}` yoki `{accessToken:null}` (200) | hech qachon 401 emas | Yaroqsiz cookie tozalanadi (`:74-88`); bloklangan → null |
| POST | `/api/auth/logout` | – | – | `{ok:true}` | | Faqat cookie tozalanadi |
| GET | `/api/auth/me` | A | – | `{id,email,role,firstName,lastName}` (`auth.service.ts:91-108`) | 401 | Sezgir maydon yo'q |
| POST | `/api/auth/telegram/start` | – (10/min) | – | `{token, link}` | 503 `BOT_OFFLINE` | Token xotirada (Map), 5 min TTL (`telegram.service.ts:87-99`) |
| POST | `/api/auth/telegram/poll` | – (**limit yo'q**) | `token` 10..64 | `{status}` yoki `{status:"ok", accessToken}` | | Token 24 bayt tasodifiy — brute-force amalda imkonsiz |
| POST | `/api/auth/google` | – (10/min) | `credential` min 20, `role?` | `{accessToken}` | 503 `GOOGLE_OFF` | `googleLogin` (`auth.service.ts:166+`) |

## 3. vacancies (`vacancies.routes.ts`, `vacancies.service.ts`, `vacancies.rules.ts`)

| METHOD | PATH | AUTH/ROLE | OWNERSHIP | INPUT | OID? | OUTPUT | PAGINATION / SEARCH | INDEX | ERRORS |
|---|---|---|---|---|---|---|---|---|---|
| GET | `/api/vacancies` | – | – | `listQuerySchema` (`:21-35`): `text` **max yo'q**, `area` ≤500, `employment` ≤200, `company` ≤2000, `salary`, `sort` enum, `page`, `pageSize` | – | `{items, total, page, pageSize, pageCount, engine}`; **items = to'liq Vacancy + `company: true`** (`LIST_INCLUDE`, `service.ts:35`) → **Company.ownerUserId, stir, legalName, subscriptionPlanId, subscriptionExpiresAt** ochiq | page≥1, pageSize 1..50 (default 20) (`service.ts:190-191`); text → ≤6 so'z, har biri `contains/insensitive` OR title/description/requirements/company.name/category.name (`service.ts:101-126`) | `[status, publishedAt]` filtrni qoplaydi; `isPremium` birinchi sort kaliti → sort xotirada; regex qidiruv indekssiz | 400 |
| GET | `/api/vacancies/facets` | – | – | yuqoridagi sxema | – | `{total, regions, employment, experience, companies(≤100), categories}` | 6 ta groupBy + count har so'rovda (`service.ts:276-285`) | status indeksi | |
| GET | `/api/employer/vacancies` | A, R(employer, admin) | `company.ownerUserId = me` | – | – | `{items}` — to'liq Vacancy + region/category + `_count.applications` | **unbounded** (`:104-113`) | company.ownerUserId → vacancy.companyId | |
| GET | `/api/vacancies/:slug` | – | – | slug | – | to'liq Vacancy + **`company` to'liq** (ownerUserId, stir, legalName, subscription*) + company.reviews(rating) + company._count | – | slug unique; `viewsCount++` har so'rovda (`service.ts:359-362`) | 404 (status≠active ham 404) |
| GET | `/api/vacancies/:slug/similar` | – | – | `limit` 1..10 | – | `{items}` (LIST_INCLUDE — company to'liq) | pool 40 | categoryId indeksi | 404 |
| POST | `/api/vacancies` | A, R(employer, admin), **P** | `company.findFirst({ownerUserId})` — birinchi kompaniya (`:136`) | `createBodySchema` (`:41-71`): title min 3 (**max yo'q**), description min 10 (**max yo'q**), requirements/conditions (**max yo'q**), categoryId OID majburiy, regionId OID?, workplaceType majburiy, employmentType enum, salary 0..2^31, contact* cheklangan, `status` active\|draft | – | 201, to'liq Vacancy | – | – | 400 (`assertVacancyPlacement`: kategoriya/hudud bazada bor-yo'qligi ham tekshiriladi, `rules.ts:23-34`) |
| PUT | `/api/vacancies/:id` | A, R(employer, admin) (**P yo'q**) | `ownedVacancy`: `vacancy.company.ownerUserId = me` yoki admin (`:77-85`) | `createSchema.partial()` | **yo'q** → noto'g'ri id = 500 | to'liq Vacancy | – | id | 403/404 |
| PATCH | `/api/vacancies/:id/status` | A, R(employer, admin) | `ownedVacancy` | `status` active\|archived | **yo'q** | to'liq Vacancy | – | | 409 — faqat archived/draft → active, active → archived (`:209-212`); admin cheklovsiz |
| DELETE | `/api/vacancies/:id` | A, R(employer, admin) | `ownedVacancy` | – | **yo'q** | `{ok}` | | | Arizalar cascade o'chadi |

Eslatma: yaratishda `status` default **`active`** (`service.ts:435`) — **moderatsiya bosqichi yo'q** (`VacancyStatus.moderation` enumda bor, admin overview uni sanaydi, lekin unga hech narsa tushmaydi). Recruiter (`CompanyMember`) ownership'da umuman hisobga olinmaydi — faqat `ownerUserId`.

## 4. companies (`companies.routes.ts`, `companies.list.ts`)

| METHOD | PATH | AUTH/ROLE | OWNERSHIP | INPUT | OUTPUT | PAGINATION / SEARCH | INDEX | ERRORS |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/companies` | – ; `saved=1` bo'lsa **inline token** (`:54-64`) | – | `listCompaniesQuery` (`list.ts:80-99`): q/text ≤100, industry/size/work enum csv, region ≤60, rating, verified/hiring/saved flag, sort enum, limit 1..50 (default 18), cursor ≤300 | `{items, nextCursor, total}` — faqat kerakli maydonlar ($project, `list.ts:194-213`) | keyset cursor (`_sort`, `_id`); q → ≤6 so'z, `$regex` (escape qilingan) name/industry/description (`list.ts:233-239`) | `aggregateRaw` + 2 ta `$lookup` (reviews, vacancies) har so'rovda — indekssiz hisob; region_id indeksi | 400 cursor, 401 saved |
| GET | `/api/employer/company` | A, R(**employer**) (admin yo'q) | `findFirst({ownerUserId})` | – | `{company}` to'liq Company + region (o'zi uchun — ok) | | ownerUserId | |
| PUT | `/api/employer/company` | A, R(employer) | findFirst / yo'q bo'lsa **create** | `updateCompanySchema` (`:31-39`) — name ≤160, description ≤2000, website ≤200, regionId OID, industry ≤120, employeeCount ≤40, foundedYear | `{company}` | | | 400 |
| POST | `/api/employer/company/logo` | A, R(employer) | findFirst | multipart PNG/JPG/WebP/**SVG** ≤5MB (`:15-20`) | `{logoUrl}` | | | 400 |
| DELETE | `/api/employer/company/logo` | A, R(employer) | findFirst | – | `{ok}` | | | 404 |
| GET | `/api/companies/:slug` | – | – | slug | **to'liq Company** (ownerUserId, stir, legalName, subscriptionPlanId, subscriptionExpiresAt) + reviews (**unbounded**, `userId` bilan) + vacancies active (**unbounded**, to'liq) (`:175-202`) | yo'q | slug unique | 404 |
| GET | `/api/companies/:slug/similar` | – | – | limit 1..10 | `{items}` (karta maydonlari) | | | 404 |
| POST | `/api/companies` | A, R(employer) | – (**cheklov yo'q — bir employer ko'p kompaniya yaratishi mumkin**) | `createCompanySchema` (`:22-29`): name min 2 (**max yo'q**), legalName/stir/description (**max yo'q**), website url, regionId OID | 201, to'liq Company | | | |

## 5. applications (`applications.routes.ts`)

| METHOD | PATH | AUTH/ROLE | OWNERSHIP | INPUT | OID? | OUTPUT | PAGINATION | INDEX | ERRORS |
|---|---|---|---|---|---|---|---|---|---|
| POST | `/api/vacancies/:id/apply` | A, R(job_seeker), **P** | vacancy.status=active | `resumeId` OID?, `coverLetter` (**max yo'q**), `source` site\|telegram (mijoz o'zi "telegram" qo'ya oladi) (`:12-16`) | **yo'q** → 500 | 201 Application (yoki 200 mavjud) | | `@@unique([vacancyId, jobSeekerId])` | 404, 400 rezyume yo'q |
| GET | `/api/applications` | A, R(job_seeker) | `jobSeekerId = me` | – | – | Application[] + vacancy (select, kompaniya select) + resume + statusHistory (`:93-119`) — toza | **unbounded** | jobSeekerId | |
| GET | `/api/employer/applications` | A, R(employer, admin) | `vacancy.company.ownerUserId = me` | – | – | `{items}` — har ariza uchun jobSeeker **email, phone**, profil, **to'liq resume + experience/education/skills** (`:128-177`) | **unbounded** (50k ariza maqsadida og'ir) | ownerUserId → companyId → unique prefix vacancyId | |
| GET | `/api/vacancies/:id/applications` | A, R(employer, admin) | vakansiya egasi yoki admin (`:192-199`) | – | **yo'q** | `include: { resume: true, jobSeeker: { include: { jobSeekerProfile: true } } }` (`:203`) → **User to'liq: `passwordHash`, `telegramChatId`, `isBlocked`, `email`, `phone`** | **unbounded** | unique prefix vacancyId | 403/404 |
| PATCH | `/api/applications/:id/status` | A, R(employer, admin) | `application.vacancy.company.ownerUserId = me` yoki admin (`:223`) | `status` enum, `reason` ≤4000 | **yo'q** | Application | | | 403/404; sabab → chat xabari (`:243-252`), notify |

## 6. reviews (`reviews.routes.ts`)

| METHOD | PATH | AUTH/ROLE | OWNERSHIP | INPUT | OID? | OUTPUT | ERRORS |
|---|---|---|---|---|---|---|---|
| POST | `/api/companies/:slug/reviews` | A, R(job_seeker), P | shu kompaniyaga ariza yuborgan bo'lishi shart (`:26-35`) | `rating` 1..5, `comment` ≤2000 | – | `{id, rating, comment, createdAt, authorName, mine}` | 403 ariza yo'q, 404 |
| DELETE | `/api/reviews/:id` | A | `review.userId = me` yoki admin (`:81`) | – | **yo'q** | `{ok}` | 403/404 |

Sharh darhol `status: "approved"` (`:45,53`) — moderatsiyasiz; admin `/api/admin/reviews` pending filtri amalda bo'sh.

## 7. chat (`chat.routes.ts`)

| METHOD | PATH | AUTH/ROLE | OWNERSHIP | INPUT | OID? | OUTPUT | PAGINATION | INDEX | ERRORS |
|---|---|---|---|---|---|---|---|---|---|
| WS | `/ws/chat?token=` | inline JWT (`:74-80`) | `participantsOf` — employerUserId/seekerUserId (`:92-94`) | JSON `{type: read\|message, conversationId, body, clientId}` — **zod yo'q**; body ≤4000 kesiladi | **yo'q** (`String(data.conversationId)` → findUnique) | `{type:"message"\|"read"}` | | `[conversationId, createdAt]` | Xato ushlanmaydi (`ws.on("message", async…)`) |
| POST | `/api/conversations/start` | A, **P** | employer/admin → istalgan job_seeker (`candidateUserId`); job_seeker → istalgan kompaniya slug (`:146-161`) | `candidateUserId` OID?, `companySlug` (**max yo'q**) | – | `{id}` | | `@@unique([employerUserId, seekerUserId])` | 400/403/404 |
| GET | `/api/conversations` | A | ishtirokchi | – | – | `{items}` — title/subtitle, otherUserId, seeker email (title fallback), company select, vacancy konteksti (`:248-297`) | **unbounded** suhbatlar; +1 findMany applications | unique prefix employerUserId, seekerUserId indeksi | |
| GET | `/api/conversations/:id/messages` | A | ishtirokchi (`:306-309`) | – | **yo'q** | `{items: Message[], me}` | **unbounded** xabarlar (`:321-324`) | conversationId,createdAt | 403/404 |
| GET | `/api/conversations/:id/rating` | A | ishtirokchi | – | **yo'q** | `{eligible, myScore, myComment, otherAvg, otherCount}` | | peerRating unique/ratedUserId | 403/404 |
| POST | `/api/conversations/:id/rating` | A | ishtirokchi + ikkala tomon yozgan (`:61-67`) | `score` 1..5, `comment` ≤1000 | **yo'q** | `{score, comment}` | | | 403 `RATING_NOT_ELIGIBLE`, 409 `ALREADY_RATED` |
| GET | `/api/users/:id/summary` | A | oramizda suhbat bo'lishi shart (`:403-412`) | – | **yo'q** → findFirst 500 | role, name, headline, regionName, rating, isOpenToWork, resumeTitle, skills, company (select) — email faqat name fallback (`:441-462`) | | conversation indeks | 403/404 |
| GET | `/api/inbox/summary` | A | – | – | – | `{unreadMessages, newApplications}` | | | |

## 8. profile / resume / candidates / catalog

| METHOD | PATH | AUTH/ROLE | OWNERSHIP | INPUT | OUTPUT | PAGINATION / SEARCH | INDEX | ERRORS |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/profile` | A, R(job_seeker) | me | – | email, role, **phone**, isPhoneVerified, additionalPhone, ism, headline, region, isOpenToWork, resumeUrl (`profile.routes.ts:22-43`) — o'ziniki | | userId unique | |
| PATCH | `/api/profile` | A, R(job_seeker) | me | firstName/lastName ≤60, phone ≤30 (faqat tasdiqlanmagan bo'lsa), additionalPhone ≤30, headline ≤140, regionId OID, isOpenToWork (`:12-20`) | profil | | | |
| POST | `/api/profile/resume` | A, R(job_seeker) | me | multipart PDF ≤5MB | `{resumeUrl}` = `/uploads/resume-<userId>-<ts>.pdf` (`:104-113`) | | | 400 |
| DELETE | `/api/profile/resume` | A, R(job_seeker) | me | – | `{ok}` | | | Fayl diskdan **o'chirilmaydi** (`:127-130`) |
| GET | `/api/resume` | A, R(job_seeker) | me | – | resume (title, summary, salary, skills, experience, education) | | jobSeekerId | |
| PUT | `/api/resume` | A, R(job_seeker) | me | `resumeSchema` (`resume.routes.ts:156-163`): title ≤140, summary ≤3000, skills[] (**massiv uzunligi cheklanmagan**, element ≤60), experience[]/education[] (**massiv uzunligi cheklanmagan**) | resume | | | Transaction: delete + createMany |
| GET | `/api/candidates` | A, R(employer, admin) | admin bo'lmasa `assertCanSearchCandidates(company)` → **402 `PLAN_FEATURE_LOCKED`** bepul rejada (`candidates.routes.ts:301-308`, `billing.service.ts:171-179`, free plan `canSearchCandidates: false`) | **zod yo'q**: `text` (uzunlik yo'q), `region` (**ObjectId tekshirilmaydi** → 500) (`:310-318`) | `{items}` — userId, **email, phone**, ism, headline, region, isOpenToWork, rezyume to'liq, rating | `take: 50`, sahifalash yo'q; `contains/insensitive` headline/firstName/lastName/resumes.title/skills (`:319-329`) | isOpenToWork/relation filtrlarida indeks yo'q → scan | 400/402 |
| GET | `/api/regions` | – | – | – | `{items:{id,name,slug}}` | | | |
| GET | `/api/categories` | – | – | – | `{items}` | | | |

## 9. articles — ochiq (`articles.routes.ts`)

| METHOD | PATH | AUTH | INPUT | OUTPUT | PAGINATION / SEARCH | INDEX | ERRORS |
|---|---|---|---|---|---|---|---|
| GET | `/api/articles` | – | q ≤100, category enum, sort enum, page 1..10000, pageSize 1..30 (default 9), featured (`:30-38`) | karta maydonlari (`cardSelect`), categories, publishedTotal | offset; `searchText contains` (case-sensitive, normallashtirilgan) | `[status, publishedAt]`, `[status, category]` ✓ | 400 |
| GET | `/api/articles/:slug` | – | slug `isValidSlug` | maqola (author: faqat name/position/avatar) + related(4) yoki `redirectTo` | `views_count` $inc (`:51-55`) | slug unique, previousSlugs indeks ✓ | 404 (faqat published) |
| POST | `/api/articles/:slug/feedback` | – (20/min) | `helpful` boolean | `{ok}` | | | 404 |

## 10. articles — admin/CMS (`articles.admin.routes.ts`, `articles.permissions.ts`)

Barchasi `requireStaff` (bazadagi rol + blok). `staffOnly` = admin|content_editor|content_author; `editorsOnly` = admin|content_editor.

| METHOD | PATH | ROLE | OWNERSHIP | INPUT | OID? | OUTPUT | PAGINATION | ERRORS |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/admin/articles` | S(staff) | author → faqat `authorId = me` (`:233-236`) | q ≤120, status enum, page ≤10000, pageSize ≤50 | – | listItem + `permissions` + counts | offset ✓ | |
| GET | `/api/admin/articles/authors` | S(editors) | – | – | – | id, name, position, role | | |
| POST | `/api/admin/articles/cover` | S(staff) | – | PNG/JPG/WebP ≤5MB (SVG yo'q) | – | 201 `{url}` | | 400 |
| GET | `/api/admin/articles/:id` | S(staff) | `canViewArticle` (`:134-142`) | – | ✓ (`isObjectId`) | detail (+ author id/email → `authorView` faqat name) | | 403/404 |
| POST | `/api/admin/articles` | S(staff) | author → o'zi | `articleBody` (`:58-71`): title 3..160, slug ≤90, excerpt ≤300, content ≤60000, cover ≤500 regex, tags ≤20×60, authorId OID, meta*, intent | – | 201 detail | | 403 publish (author), 400 `CONTENT_TOO_SHORT`, 409 `SLUG_TAKEN` |
| PUT | `/api/admin/articles/:id` | S(staff) | `permissions.edit` | `articleBody` | ✓ | detail | | 403 |
| POST | `/api/admin/articles/:id/:action` | S(staff) | `permissions[action]` | action enum (submit/return/publish/unpublish/archive/restore), note ≤500 | ✓ | detail | | 403 |
| DELETE | `/api/admin/articles/:id` | S(staff) → faqat admin (`permissions.delete`) | | – | ✓ | `{ok}` | | 403 |

## 11. team (`team.routes.ts`)

| METHOD | PATH | ROLE | INPUT | OID? | OUTPUT | ERRORS |
|---|---|---|---|---|---|---|
| GET | `/api/admin/team` | A, S(admin) | – | – | members (id, email, role, isBlocked, name, position, articleCount), pending invites (email, role, invitedBy) | |
| POST | `/api/admin/team/invites` | A, S(admin) | email ≤160, role staff enum | – | 201 `{invite, link (token bir marta), emailSent}` | 409 `EMAIL_TAKEN` |
| DELETE | `/api/admin/team/invites/:id` | A, S(admin) | – | ✓ | `{ok}` | 404 |
| PATCH | `/api/admin/team/:id` | A, S(admin) | role, isBlocked, fullName 2..80, position ≤80 | ✓ | memberView | 400 self, 404 |
| GET | `/api/staff-invites/:token` | – (10/min) | token 20..100 (hash bilan) | – | `{email, role, expiresAt}` | 404/410 |
| POST | `/api/staff-invites/:token/accept` | – (10/min) | fullName, position, password 8..128 | – | `{accessToken, role}` + cookie | 404/410/409; claim race `updateMany` bilan yopilgan (`:236-241`) |

## 12. admin (`admin.routes.ts`) — hammasi `requireAuth + requireRole("admin")` (**tokendagi** rol; `requireStaff` emas)

| METHOD | PATH | INPUT | OID? | OUTPUT | PAGINATION / SEARCH | INDEX | Izoh |
|---|---|---|---|---|---|---|---|
| GET | `/api/admin/overview` | – | – | hisoblagichlar + 14 kunlik chart | 2 ta findMany (14 kun) | user.createdAt / application.createdAt **indekssiz** | |
| GET | `/api/admin/users` | text ≤120, page (**max yo'q**), pageSize ≤100, role enum (content rollari yo'q) | – | id, **email, phone**, role, isBlocked, isPhoneVerified, telegramLinked (bool), name, companyName, applicationCount | offset; `contains` email/phone/firstName/lastName | role indeksi; regex scan | |
| PATCH | `/api/admin/users/:id/block` | isBlocked | **yo'q** → 500 | `{id,isBlocked}` | | | Bloklashda faol vakansiyalar arxivlanadi (`:176-186`); boshqa adminni bloklash mumkin |
| PATCH | `/api/admin/users/:id/role` | role job_seeker\|employer\|admin | **yo'q** | | | | Staff (content_*) foydalanuvchini job_seeker qilib qo'yish mumkin |
| GET | `/api/admin/vacancies` | text, status enum, page/pageSize | – | qisqa proyeksiya | offset; contains title/company.name | status yo'q bo'lsa scan | |
| PATCH | `/api/admin/vacancies/:id/moderate` | status active\|rejected\|archived, reason ≤500, isPremium | **yo'q** | `{id,status,isPremium}` | | | notify + index sync |
| GET | `/api/admin/companies` | text, verified, page | – | ownerEmail, planName, subscriptionExpiresAt, hisoblar | offset | | |
| PATCH | `/api/admin/companies/:id/verify` | isVerified | **yo'q** | | | | |
| GET | `/api/admin/reviews` | status, page | – | authorName (email fallback) | offset | status ✓ | |
| PATCH | `/api/admin/reviews/:id` | status enum | **yo'q** | | | | |
| DELETE | `/api/admin/reviews/:id` | – | **yo'q** | `{ok}` | | | |
| GET | `/api/admin/payments` | status, page | – | | offset | `[companyId,status]` qisman | |
| POST | `/api/admin/payments/:transactionId/confirm` | – | – | `{ok}` | | transactionId unique | `markPaymentPaid` |
| POST | `/api/admin/search/reindex` | – | – | `{indexed, engine}` | barcha faol vakansiyalar xotiraga | | |
| POST | `/api/admin/alerts/run` | – | – | | | | |
| POST | `/api/admin/broadcast` | title 3..140, body 3..1000, role, url ≤200 (`/` bilan boshlanishi) | – | `{sent}` | **barcha** userlar ketma-ket `notify` — bitta HTTP so'rov ichida (`:510-524`) | | 10k userda so'rov timeout xavfi |

## 13. billing (`billing.routes.ts`, `billing.service.ts`)

| METHOD | PATH | AUTH/ROLE | INPUT | OUTPUT | ERRORS | Izoh |
|---|---|---|---|---|---|---|
| GET | `/api/plans` | – | – | rejalar (slug, price, limitlar, canSearchCandidates), providers | | PRODUCT RULE 1: monetizatsiya core flow emas — ochiq qolgan |
| GET | `/api/employer/subscription` | A, R(employer, admin) | – | `{subscription}` yoki `{subscription:null, message}` | | |
| GET | `/api/employer/payments` | A, R(employer, admin) | – | 50 ta oxirgi to'lov | | take 50 ✓ |
| POST | `/api/employer/subscription/checkout` | A, R(employer) | planSlug 2..40, provider enum | checkout | 400 | `pending` Payment yaratadi |
| POST | `/api/payments/:provider/callback` | – (imzo: Payme Basic / Click md5) (`billing.service.ts:301-323`) | provayder body (zod yo'q) | `{result:{state:2}, ok}` | 401/404/400 | Kalit `.env`da yo'q bo'lsa hamma webhook 401 |

## 14. notifications / push (`notifications.routes.ts`)

| METHOD | PATH | AUTH | OWNERSHIP | INPUT | OID? | OUTPUT | PAGINATION | INDEX |
|---|---|---|---|---|---|---|---|---|
| GET | `/api/notifications` | A | userId | unreadOnly, limit 1..100 (default 30) | – | id, type, title, body, url (faqat ichki `/`), isRead, createdAt | take ≤100, cursor yo'q (faqat eng yangi) | `[userId, isRead]` ✓ (createdAt sort xotirada) |
| GET | `/api/notifications/unread-count` | A | userId | – | – | `{count}` | | ✓ |
| POST | `/api/notifications/:id/read` | A | `found.userId = me` | – | **yo'q** → 500 | `{ok}` | | |
| POST | `/api/notifications/read-all` | A | userId | – | – | `{updated}` | | ✓ |
| DELETE | `/api/notifications/:id` | A | `found.userId = me` | – | **yo'q** | `{ok}` | | |
| GET | `/api/notifications/preferences` | A | userId | – | – | 16 ta (type×channel) + `available` | | unique ✓ |
| PUT | `/api/notifications/preferences` | A | userId | items ≤64, enumlar | – | `{ok}` | | |
| GET | `/api/push/public-key` | – | – | – | – | `{key}` | | |
| POST | `/api/push/subscribe` | A | endpoint unique → **boshqa userdan o'ziga o'tkazib oladi** (`:188-203`) | endpoint url ≤1000, keys | – | `{ok}` | | endpoint unique |
| POST | `/api/push/unsubscribe` | A | endpoint+userId | endpoint ≤1000 | – | `{ok}` | | |

## 15. favorites / saved companies (`favorites.routes.ts`)

| METHOD | PATH | ROLE | OWNERSHIP | OID? | OUTPUT | PAGINATION | INDEX |
|---|---|---|---|---|---|---|---|
| GET | `/api/favorites` | A, R(job_seeker) | userId | – | vakansiya kartasi (select — kompaniya ichki maydonlarsiz) + isClosed | **unbounded** | unique prefix userId ✓ |
| GET | `/api/favorites/ids` | A, R(job_seeker) | userId | – | `{ids}` | unbounded (yengil) | ✓ |
| POST | `/api/favorites/:vacancyId` | A, R(job_seeker) | – | **yo'q** → 500 | 201 | | |
| DELETE | `/api/favorites/:vacancyId` | A, R(job_seeker) | userId | **yo'q** | | | |
| GET | `/api/favorites/companies/ids` | A, R(job_seeker) | userId | – | `{ids}` | | ✓ |
| POST | `/api/favorites/companies/:companyId` | A, R(job_seeker) | – | ✓ (`companyParams`) | 201 | | |
| DELETE | `/api/favorites/companies/:companyId` | A, R(job_seeker) | userId | ✓ | | | |

Favorites'da cheklov yo'q (nomzod istalgancha vakansiya saqlashi mumkin); saved-searches'da 20 ta limit bor.

## 16. alerts / saved searches (`alerts.routes.ts`)

| METHOD | PATH | ROLE | OWNERSHIP | INPUT | OID? | OUTPUT |
|---|---|---|---|---|---|---|
| GET | `/api/saved-searches` | A, R(job_seeker) | userId | – | – | `{items}` (≤20 — limit yaratishda) |
| POST | `/api/saved-searches` | A, R(job_seeker) | userId, `MAX_PER_USER=20` (`:48,84-87`) | name ≤120, queryParams (hamma maydon cheklangan), frequency, emailAlertsEnabled | – | 201 |
| PATCH | `/api/saved-searches/:id` | A, R(job_seeker) | `found.userId = me` | name, frequency, emailAlertsEnabled | **yo'q** → 500 | `{id, ok}` |
| DELETE | `/api/saved-searches/:id` | A, R(job_seeker) | `found.userId = me` | – | **yo'q** | `{ok}` |

## 17. telegram / support (`telegram.routes.ts`, `support.routes.ts`)

| METHOD | PATH | AUTH | INPUT | OUTPUT | Izoh |
|---|---|---|---|---|---|
| GET | `/api/telegram/status` | A | – | linked (bool), phoneVerified, **phone** (o'ziniki), botUsername | `telegramChatId` qiymati chiqmaydi ✓ |
| POST | `/api/telegram/link` | A | – | `{link}` | Link token xotirada, 30 min (`telegram.service.ts:55-66`) |
| DELETE | `/api/telegram/link` | A | – | `{ok}` | `telegramChatId=null`; `isPhoneVerified` **saqlanib qoladi** |
| GET | `/api/support/contacts` | – | – | env'dan sozlangan kanallar | Cache 60s |
| POST | `/api/support` | – (5/min), ixtiyoriy inline token (`:133-143`) | name ≤120, email ≤254, subject enum, message 3..4000 (control chars tozalanadi), honeypot `website` | `{ok}` / 503 / 502 | Admin Telegram chatiga |

## 18. seo / og / stats

| METHOD | PATH | AUTH | OUTPUT | Izoh |
|---|---|---|---|---|
| GET | `/robots.txt`, `/sitemap.xml`, `/sitemap-static.xml` | – | text/xml | |
| GET | `/sitemap-vacancy.xml` | – | faol vakansiyalar, `take: 50000` (`seo.routes.ts:101-105`) | 20k vakansiyada ~20k qator xotirada, kesh yo'q |
| GET | `/sitemap-employer.xml` | – | **barcha** kompaniyalar (faol vakansiyasiz ham) `take: 50000` | |
| GET | `/sitemap-articles.xml` | – | published | ✓ |
| GET | `/api/og/vacancy/:slug` | – | PNG (Cache-Control 1 kun) | **status tekshirilmaydi** (`og.routes.ts:7-15`): draft/archived/rejected vakansiya sarlavhasi, kompaniyasi, maoshi rasm sifatida ochiladi; har so'rovda rasm renderi (CPU) |
| GET | `/api/stats` | – | `{vacancies, companies, applicationsToday}` | `application.createdAt` indekssiz |
| GET | `/api/stats/salary` | – | `salaryQuerySchema` (hamma maydon cheklangan, `salary.stats.ts:54-60`) | Har so'rovda 20 000 tagacha faol vakansiya xotiraga (`MAX_ROWS`, `:75`), kesh yo'q, ochiq endpoint |

---

## Rol matritsasi (backend bo'yicha, haqiqiy kod)

G = Guest, C = Candidate (job_seeker), E = Employer, A = Admin, CE = content_editor, CA = content_author. `own` = faqat o'ziniki; `P` = telefon tasdig'i shart.

| Resurs | VIEW | CREATE | UPDATE | DELETE |
|---|---|---|---|---|
| Vacancy (ochiq, active) | G C E A CE CA | – | – | – |
| Vacancy (o'z kompaniyasi) | E(own) A(hammasi) | E(own, P) A(P) | E(own) A | E(own) A |
| Vacancy moderatsiya/premium | A | – | A | – |
| Company (ochiq profil) | hamma | – | – | – |
| Company (employer) | E(own) | E (chegarasiz) | E(own) | – (o'chirish yo'li yo'q) |
| Company verify | A | – | A | – |
| Application | C(own) E(own vakansiya) A(hammasi) | C(P) | E(own)/A status | – (vakansiya bilan cascade) |
| Resume/Profile | C(own); E — `/api/candidates` (402 bepul rejada) / arizalar orqali; suhbatdosh — `/users/:id/summary` | C | C(own) | C (PDF url) |
| Conversation/Message | ishtirokchi | C(P) E(P) A(P) — WS orqali xabar: P **yo'q** | – | – |
| PeerRating | ishtirokchi | ishtirokchi (bir marta) | – | – |
| CompanyReview | hamma (approved) | C(P, ariza bergan) | C(own, qayta POST) A(status) | C(own) A |
| Favorite / SavedCompany / SavedSearch | C(own) | C | C(own) | C(own) |
| Notification | own (hamma rol) | tizim | own (read) | own |
| Push subscription | – | own | own | own |
| Article (published) | hamma | – | – | – |
| Article (CMS) | CA(own) CE A | CA CE A | CA(own draft) CE A | A |
| Team / invites | A | A | A | A (invite revoke) |
| Users (admin) | A | – | A (block/role) | – |
| Plans | hamma | – | – | – |
| Subscription/Payments | E(own) A(hammasi) | E (checkout) | webhook/A confirm | – |
| Telegram link | own | own | – | own |
| Stats / salary / sitemap / OG | hamma | – | – | – |

---

## Potentsial muammolar

Ustuvorlik: **[H]** yuqori, **[M]** o'rta, **[L]** past. Confidence ko'rsatilmagan bo'lsa — high (kodni o'qib tekshirilgan).

1. **[H] `passwordHash` va `telegramChatId` ish beruvchiga chiqadi.** `GET /api/vacancies/:id/applications` — `jobSeeker: { include: { jobSeekerProfile: true } }` User modelini to'liq qaytaradi (`applications.routes.ts:201-205`). Faqat vakansiya egasi ko'radi, lekin bu baribir parol xeshi va Telegram chat ID'ning oqishi (Rule 3: candidate private data).
2. **[H] Kompaniyaning ichki maydonlari ochiq API'da.** `GET /api/vacancies` (`LIST_INCLUDE: company: true`, `vacancies.service.ts:35`), `GET /api/vacancies/:slug` (`:341-356`), `GET /api/vacancies/:slug/similar`, `GET /api/companies/:slug` (`companies.routes.ts:175-202`) — `Company.ownerUserId`, `stir`, `legalName`, `subscriptionPlanId`, `subscriptionExpiresAt` mehmonga ham qaytadi. `ownerUserId` orqali employer user ID'si enumeratsiya qilinadi; STIR — shaxsiy/yuridik ma'lumot. Boshqa modullar (`/api/applications`, `/api/favorites`) select bilan to'g'ri qilingan — bu joylar unutilgan.
3. **[H] WS xabar handleri xatoni ushlamaydi → jarayon yiqilishi mumkin.** `ws.on("message", async …)` (`chat.routes.ts:83`) ichida `participantsOf(conversationId)` → `prisma.conversation.findUnique({ where: { id } })` noto'g'ri ObjectId'da Prisma P2023 tashlaydi; `try/catch` yo'q → unhandled rejection → Node 20 default'da process crash. Har qanday autentifikatsiyalangan user `{"type":"read","conversationId":"x"}` yuborib API'ni to'xtatishi mumkin. Confidence: medium (Prisma MongoDB'da malformed ObjectId uchun throw qilishi ma'lum; unhandledRejection handler kodda yo'q).
4. **[H] PRODUCT RULE 1 buzilishi — nomzodlar bazasi pullik rejaga bog'langan.** `GET /api/candidates` bepul rejada 402 `PLAN_FEATURE_LOCKED` (`candidates.routes.ts:301-308`, `billing.service.ts:171-179`, `DEFAULT_PLANS[0].canSearchCandidates: false`). Employer core flow monetizatsiyaga bog'lanmasligi kerak.
5. **[M] `:id` ObjectId tekshirilmaydigan yo'llar → 500 (`INTERNAL_ERROR`), 404 emas.** Ro'yxat: `PUT/PATCH/DELETE /api/vacancies/:id`, `POST /api/vacancies/:id/apply`, `GET /api/vacancies/:id/applications`, `PATCH /api/applications/:id/status`, `DELETE /api/reviews/:id`, `GET /api/conversations/:id/*`, `POST /api/conversations/:id/rating`, `GET /api/users/:id/summary`, `POST/DELETE /api/notifications/:id`, `POST/DELETE /api/favorites/:vacancyId`, `PATCH/DELETE /api/saved-searches/:id`, barcha `/api/admin/*/:id` (articles va team'dan tashqari), `GET /api/candidates?region=`. Error handler P2023 ni qoplamaydi (`server.ts:126-133`). Rule 4 (ERROR ≠ EMPTY) uchun 400/404 bo'lishi kerak.
6. **[M] Unbounded (sahifalanmagan) ro'yxatlar** — 50k ariza / 100k xabar maqsadida: `GET /api/employer/applications` (har ariza uchun to'liq rezyume + experience/education/skills, `applications.routes.ts:128-177`), `GET /api/vacancies/:id/applications`, `GET /api/applications`, `GET /api/employer/vacancies`, `GET /api/conversations`, `GET /api/conversations/:id/messages` (barcha xabarlar), `GET /api/favorites`, `GET /api/companies/:slug` (barcha faol vakansiyalar + barcha sharhlar). Chat va employer/applications eng xavflisi.
7. **[M] Moderatsiya amalda yo'q.** Vakansiya yaratishda status default `active` (`vacancies.service.ts:435`) — `moderation` holati hech qachon qo'yilmaydi; sharhlar darhol `approved` (`reviews.routes.ts:45,53`). Admin paneldagi "moderation"/"pending" bo'limlari doim bo'sh. Rule 3 ("moderation qoidalari saqlanadi") bilan hujjat/kod farqi.
8. **[M] Admin yo'llari `requireRole` (token) bilan.** `admin.routes.ts:19` — bloklangan yoki roli olib tashlangan admin 15 daqiqagacha to'liq admin API'ga ega. `articles.admin` va `team` `requireStaff` (baza) ishlatadi — nomuvofiqlik. Xuddi shu sabab: bloklangan oddiy user ham 15 min ishlayveradi (`requireRole` da `isBlocked` yo'q; blok faqat login/refresh'da).
9. **[M] Rezyume PDF'lar ochiq static'da.** `/uploads/resume-<userId>-<timestamp>.pdf` autentifikatsiyasiz (`server.ts:107`, `profile.routes.ts:104-113`). URL'ni bilgan har kim yuklab oladi; `DELETE /api/profile/resume` faylni diskdan o'chirmaydi (`:127-130`). Kompaniya logosi sifatida **SVG** qabul qilinadi (`companies.routes.ts:19`) — `/uploads/` dan to'g'ridan-to'g'ri ochilsa skript ishlashi mumkin (CSP `default-src 'self'` bo'lgani uchun inline skript API originida bloklanadi, lekin origin ichida XSS xavfi qoladi). Confidence: medium.
10. **[M] Employer bir nechta kompaniya yaratishi mumkin, lekin hamma joyda `findFirst`.** `POST /api/companies` cheklovsiz (`companies.routes.ts:211-221`), vakansiya/arizalar/chat/subscription esa `company.findFirst({ownerUserId})` — birinchi kompaniya (`vacancies.routes.ts:136`, `chat.routes.ts:150`, `billing.routes.ts:198`). Ikkinchi kompaniya "yetim" bo'lib qoladi; `PUT /api/employer/company` ham faqat birinchisini yangilaydi.
11. **[M] Uzunligi cheklanmagan matn maydonlari.** `register.password` (argon2 katta satrda CPU), `register.firstName/lastName`, `vacancy.title/description/requirements/conditions`, `company.name/legalName/stir/description` (create), `apply.coverLetter`, `conversations/start.companySlug`, `vacancies?text` (regex), `candidates?text`, `resume.skills/experience/education` massiv uzunligi. Bounded data prinsipiga zid.
12. **[M] Suhbat ochish har qanday nomzod bilan.** `POST /api/conversations/start` — employer istalgan `candidateUserId` bilan suhbat ochadi (ariza/aloqa talab qilinmaydi, `chat.routes.ts:146-151`), undan keyin `GET /api/users/:id/summary` orqali nomzodning rezyume sarlavhasi, ko'nikmalari, hududi ochiladi. `ownerUserId` (2-band) orqali employer ID'lari, `/api/candidates` orqali nomzod ID'lari topiladi. WS orqali xabar yuborishda `requirePhoneVerified` va rate-limit yo'q (`chat.routes.ts:107-125`) — spam kanali.
13. **[M] Push obunani "o'g'irlash".** `POST /api/push/subscribe` — `endpoint` unique bo'yicha upsert `userId`ni joriy userga almashtiradi (`notifications.routes.ts:188-203`). Boshqa userning endpoint URL'ini bilgan kishi uning push kanalini o'ziga o'tkazadi (endpoint URL sirli bo'lgani uchun xavf past). Confidence: medium.
14. **[L] `DELETE /api/telegram/link` dan keyin `isPhoneVerified` saqlanib qoladi** (`telegram.routes.ts:38-44`) — tasdiqlangan raqamsiz "tasdiqlangan" holat; `PATCH /api/profile` da telefonni o'zgartirib bo'lmaydi (`profile.routes.ts:65-67`).
15. **[L] OG rasmi status tekshirmaydi** — `GET /api/og/vacancy/:slug` draft/rejected/archived vakansiya ma'lumotini rasm qilib beradi (`og.routes.ts:7-15`); har so'rov CPU renderi, kesh faqat brauzer tomonida.
16. **[L] Og'ir ochiq hisoblar keshsiz:** `GET /api/stats/salary` — 20k vakansiya xotiraga har so'rovda (`salary.stats.ts:75`); `GET /api/vacancies/facets` — 7 ta aggregate; `GET /api/companies` — 2 ta `$lookup` har kompaniya uchun (`companies.list.ts:262-305`); sitemap'lar 50k qator. Global 600/min bilan bitta IP'dan sezilarli yuk berish mumkin.
17. **[L] Indeks yetishmovchiligi (schema.prisma):** `Application.createdAt` (stats/overview count), `User.createdAt` (overview), `JobSeekerProfile.isOpenToWork` (candidates), `Vacancy` uchun `[status, isPremium, publishedAt]` (default sort xotirada), `Vacancy.title` matn indeksi yo'q (regex scan). `VacancyCategory`/`Region` da `parentId` indeksi yo'q (kichik jadval — muhim emas).
18. **[L] `POST /api/admin/broadcast` sinxron** — 10k user uchun bitta HTTP so'rov ichida ketma-ket `notify` (`admin.routes.ts:510-524`); reverse-proxy timeout'da yarim yuborilgan holat.
19. **[L] Admin rol boshqaruvi kontent rollarini bilmaydi.** `PATCH /api/admin/users/:id/role` enum `job_seeker|employer|admin` (`admin.routes.ts:193`) — `content_editor` ni `job_seeker` qilish mumkin, teskarisi faqat `/api/admin/team/:id` orqali; `GET /api/admin/users?role=` staff'ni filtrlay olmaydi. Boshqa adminni bloklash mumkin (faqat o'zini emas).
20. **[L] Hujjat ↔ kod farqi.** `tizim-arxitekturasi.md:342-407` dagi endpointlar (`/api/me`, `/api/resumes/*`, `PATCH /api/vacancies/:id`, `/api/search/vacancies`, `/api/companies/:id/reviews`, `/api/salary-stats/:slug`, `/api/telegram/webhook`, `/api/admin/vacancies/:id/approve`) kodda yo'q — amaldagi yo'llar shu hujjatda. `search.service.ts:10,15,195,234` izohlarida "PostgreSQL" deb yozilgan — amalda MongoDB fallback.
21. **[L] `application.source` mijoz tomonidan `telegram` deb belgilanishi mumkin** (`applications.routes.ts:15`) — statistika buziladi. `refresh` token'ni bekor qilish mexanizmi yo'q (parol o'zgarishi/blok — 30 kun cookie amal qiladi, lekin `refreshSession` bazadan blokni tekshiradi, shuning uchun blok ishlaydi; parol almashtirish endpointi umuman yo'q).
22. **[L] CORS `*.vercel.app`** — har qanday Vercel preview (uchinchi shaxsniki ham) `credentials: true` bilan API'ga so'rov yubora oladi (`server.ts:90-97`). Access token localStorage'da bo'lgani uchun cookie-CSRF xavfi past, lekin `/api/auth/refresh` cookie orqali access token olish mumkin bo'ladi. Confidence: medium.
