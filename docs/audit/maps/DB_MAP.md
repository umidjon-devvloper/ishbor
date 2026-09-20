# DB MAP — ISH BOR! (PHASE 1.3, 2026-09-14)

> **PHASE 1 snapshot (tuzatishlardan oldingi holat).** Joriy holat: `docs/audit/ISSUES.md`, `docs/audit/DECISIONS.md` va `docs/audit/FINAL_AUDIT.md`. Round 3 dan keyin bu faylda tasvirlangan bir qancha yo'l va qoidalar o'zgargan (Telegram login olib tashlandi, nomzodlar bazasida 402 yo'q, rezyume fayllari avtorizatsiyali endpointda).

Manba: `apps/api/prisma/schema.prisma` (provider = mongodb, Prisma 5.20) va `apps/api/src/**` dagi **barcha** `prisma.*.findMany/findFirst/findUnique/count/groupBy/aggregate/aggregateRaw/findRaw/updateMany` chaqiruvlari (244 ta, `demo-seed.ts` dan tashqari 36 fayl). Bazadagi haqiqiy indekslar `listIndexes` bilan tekshirildi (qarang `DATA_INTEGRITY.md`) — sxema bilan **to'liq mos**.

Belgilar: 📈 hajm 10k-scale'da (~10k user, ~20k vakansiya, ~50k ariza, ~100k notification/message); ⚠️ indeks bilan qoplanmagan; ♾️ unbounded (take yo'q / katta include).

---

## 1. Entity / relation xaritasi

28 model, 4 mantiqiy blok. `onDelete` ko'rsatilmagan relation'larda Prisma standarti: majburiy → `Restrict`, ixtiyoriy → `SetNull` (MongoDB'da hammasi **Prisma client emulyatsiyasi** — DB darajasida FK/cascade YO'Q; `$runCommandRaw`/tashqi vositalar orqali o'chirish orphan qoldiradi).

### 1.1 Foydalanuvchi va profil
| Model | Kolleksiya | Kalit maydonlar | Relation (onDelete) | Unique / index |
|---|---|---|---|---|
| `User` | `users` | email, phone, passwordHash, role (5 enum), isEmailVerified, isPhoneVerified, isBlocked, telegramChatId, createdAt | 18 ta teskari relation | `@unique(email)`; `@@index(telegramChatId)`, `@@index(role)` |
| `JobSeekerProfile` | `job_seeker_profiles` | userId, firstName, lastName, regionId, isOpenToWork, headline… | user (Cascade), region (SetNull) | `@unique(userId)`; `@@index(regionId)` |
| `StaffProfile` | `staff_profiles` | userId, fullName, position | user (Cascade) | `@unique(userId)` |
| `StaffInvite` | `staff_invites` | email, role, tokenHash, invitedById, expiresAt, acceptedAt, revokedAt | invitedBy (Cascade) | `@unique(tokenHash)`; `@@index(email)`, `@@index(invitedById)` |
| `PushSubscription` | `push_subscriptions` | userId, endpoint, p256dh, auth | user (Cascade) | `@unique(endpoint)`; `@@index(userId)` |

### 1.2 Rezyume
| Model | Kolleksiya | Relation (onDelete) | Index |
|---|---|---|---|
| `Resume` | `resumes` | jobSeeker→JobSeekerProfile (Cascade) | `@@index(jobSeekerId)`, `@@index(status)` |
| `ResumeExperience` / `ResumeEducation` / `ResumeSkill` | `resume_experience` / `resume_education` / `resume_skills` | resume (Cascade) | `@@index(resumeId)` |

### 1.3 Kompaniya, katalog, vakansiya, ariza
| Model | Kolleksiya | Relation (onDelete) | Unique / index |
|---|---|---|---|
| `Company` | `companies` | owner→User (**onDelete yo'q → Restrict**), region (SetNull), subscriptionPlan (SetNull) | `@unique(slug)`; `@@index(ownerUserId)`, `@@index(regionId)`, `@@index(subscriptionPlanId)` |
| `CompanyMember` | `company_members` | company (Cascade), user (Cascade) | `@@unique(companyId,userId)`; `@@index(userId)` |
| `VacancyCategory` | `vacancy_categories` | parent self (NoAction) | `@unique(slug)` |
| `Region` | `regions` | parent self (NoAction) | `@unique(slug)` |
| `Vacancy` | `vacancies` | company (Cascade), category (SetNull, **ixtiyoriy** — sxema `categoryId String?` lekin product rule "majburiy"; `vacancies.rules.ts:24,29` API darajasida tekshiradi), region (SetNull) | `@unique(slug)`; `@@index(status,publishedAt)`, `@@index(companyId)`, `@@index(categoryId)`, `@@index(regionId)` |
| `Application` | `applications` | vacancy (Cascade), jobSeeker→User (Cascade), resume (SetNull) | `@@unique(vacancyId,jobSeekerId)`; `@@index(jobSeekerId)`, `@@index(resumeId)` |
| `ApplicationStatusHistory` | `application_status_history` | application (Cascade), changedByUser (SetNull) | `@@index(applicationId)`, `@@index(changedBy)` |

### 1.4 Chat, sevimlilar, bildirishnoma, kontent, sharh, monetizatsiya
| Model | Kolleksiya | Relation (onDelete) | Unique / index |
|---|---|---|---|
| `Conversation` | `conversations` | employer→User (Cascade), seeker→User (Cascade), company (SetNull) | `@@unique(employerUserId,seekerUserId)`; `@@index(seekerUserId)`, `@@index(companyId)` |
| `Message` | `messages` | conversation (Cascade), sender (Cascade) | `@@index(conversationId,createdAt)`, `@@index(senderId)` |
| `PeerRating` | `peer_ratings` | conversation, rater, rated (Cascade) | `@@unique(conversationId,raterUserId)`; `@@index(ratedUserId)`, `@@index(raterUserId)` |
| `Favorite` | `favorites` | user, vacancy (Cascade) | `@@unique(userId,vacancyId)`; `@@index(vacancyId)` |
| `SavedCompany` | `saved_companies` | user, company (Cascade) | `@@unique(userId,companyId)`; `@@index(companyId)` |
| `SavedSearch` | `saved_searches` | user (Cascade) | `@@index(userId)` |
| `Notification` | `notifications` | user (Cascade) | `@@index(userId,isRead)` |
| `NotificationPreference` | `notification_preferences` | user (Cascade) | `@@unique(userId,notificationType,channel)` |
| `Article` | `articles` | author→User (SetNull) | `@unique(slug)`; `@@index(status,publishedAt)`, `@@index(status,category)`, `@@index(authorId)`, `@@index(previousSlugs)` |
| `CompanyReview` | `company_reviews` | company, user (Cascade) | `@@unique(companyId,userId)`; `@@index(userId)`, `@@index(status)` |
| `SubscriptionPlan` | `subscription_plans` | — | `@unique(slug)` |
| `Payment` | `payments` | company, plan (**Restrict**) | `@unique(transactionId)`; `@@index(companyId,status)`, `@@index(planId)` |

### 1.5 O'chirish yo'llari (cascade zanjirlar)
Kodda **faqat** quyidagi `delete` chaqiruvlari bor (User/Company/Conversation o'chirish yo'li YO'Q → ular orqali orphan paydo bo'lmaydi):
- `vacancies.routes.ts:233` `vacancy.delete` → emulyatsiya: Application (→ StatusHistory) + Favorite cascade; Meili indeksdan olib tashlanadi.
- `articles.admin.routes.ts:452` article.delete; `admin.routes.ts:421`, `reviews.routes.ts:82` companyReview.delete; `notifications.routes.ts:113`; `alerts.routes.ts:138` savedSearch; `favorites.routes.ts:98,140` deleteMany; `resume.routes.ts:142-144` bolalar deleteMany (tranzaksiya ichida); `push.ts:54`.

---

## 2. Real so'rovlar × indekslar

### 2.1 `vacancies` (📈 ~20k, avgObjSize ≈ 1 KB dev'da)
Indekslar: `slug`U, `(status,published_at)`, `company_id`, `category_id`, `region_id`.

| # | Joy | So'rov | Indeks holati |
|---|---|---|---|
| V1 | `vacancies.service.ts:243-250` `listVacancies` (ommaviy `/api/vacancies`) | `where {status:"active", …filtrlar, category/region/company relation filtri, salaryMin range, textFilter contains-insensitive}` `orderBy [isPremium desc, publishedAt desc, id desc]` skip/take ≤50 + `count` | `status` prefiksi ishlaydi; **sort `(isPremium, publishedAt)` indeksda yo'q** → active vakansiyalar (~15–20k × 1 KB) har so'rovda xotirada saralanadi ⚠️. `contains` regex — indekssiz, active to'plam skan. Relation filtrlar (`category.slug`, `region.slug`, `company.slug/isVerified`) → Prisma Mongo `$lookup` aggregation (confidence: medium; `articles.admin.routes.ts:412-413` izohi ham aggregation'ni tasdiqlaydi). |
| V2 | `vacancies.service.ts:139,141` sort=date/popular | `orderBy [publishedAt desc,id]` / `[viewsCount desc, publishedAt, id]` | date → `(status,published_at)` **qoplaydi** ✅; popular → xotira sort ⚠️ |
| V3 | `vacancies.service.ts:163-184` `listBySalary` | `count(priced)`, `findMany(priced, orderBy [isPremium, salaryMin, id])`, `findMany(unpriced = {salaryMin: null}, DATE_ORDER)` | `salary_min` indekssiz → xotira sort ⚠️. **Semantik xato**: Prisma Mongo'da `salaryMin: null` faqat aniq `null` ni topadi, maydon yo'q hujjatni topmaydi (dev bazada tekshirildi: `isSet:false`=0, `null`=1). `createVacancy` (`:450`) `salaryMin: input.salaryMin ?? undefined` → API orqali maoshsiz yaratilgan vakansiyada `salary_min` **umuman yozilmaydi** → maosh saralashda `tail` ularni o'tkazib yuboradi, `total` esa hisoblaydi (sahifa to'liq kelmaydi). Demo seed aniq `null` yozadi, shuning uchun dev'da ko'rinmaydi. confidence: medium-high. |
| V4 | `vacancies.service.ts:277-284` `vacancyFacets` | 5×`groupBy` + 2×`count`, har biri `where(active + filtrlar − o'z o'lchovi)` | 7 ta aggregation per request, hammasi `status` prefiksi bilan; matn bo'lsa 7× regex skan ⚠️. `/api/vacancies` bilan birga chaqiriladi → bitta ro'yxat sahifasi = **9–10 ta** active-to'plam skan. |
| V5 | `vacancies.service.ts:382-387` similar | `status, categoryId, id not` orderBy publishedAt take 40 | `category_id` yoki `(status,published_at)` — planner tanlaydi; ikkalasi ham to'liq mos emas (kichik hajm, OK) |
| V6 | `vacancies.service.ts:399-404` similar tail | `status, companyId, id notIn` | `company_id` ✅ |
| V7 | `admin.routes.ts:218-229` admin ro'yxat | `status?`, `title/company.name contains`, `orderBy createdAt desc` skip/take | `created_at` indeksi yo'q → to'liq skan + sort ⚠️ (admin) |
| V8 | `admin.routes.ts:177-184` blok | `company.ownerUserId, status:"active"` findMany + updateMany | relation filter → aggregation; `company_id` bo'yicha 2-bosqich arzonroq |
| V9 | `vacancies.routes.ts:104-118` `/api/employer/vacancies` | `company.ownerUserId` orderBy createdAt, **take yo'q**, include region+category+company+_count | ♾️ (kompaniya bo'yicha chegaralangan) |
| V10 | `seo.routes.ts:101-105` sitemap | `status:"active"` select slug,updatedAt take 50000 | `(status,published_at)` ✅; 20k×3 til XML xotirada (~10–15 MB string) ♾️ |
| V11 | `salary.stats.ts:161-172` `/api/stats/salary` (ommaviy) | `status:"active"` + category/region include, orderBy publishedAt take 20000 | indeks ✅, lekin **har so'rovda 20k hujjat + 2 relation fetch**, keshsiz; hisob JS'da ♾️📈 |
| V12 | `search.service.ts:173` reindexAll | barcha active + include | faqat admin/startup (Meili yoqilganda) ♾️ |
| V13 | `billing.service.ts:156-157` | `companyId,status[,isPremium]` count | `company_id` ✅ (izolyatsiyalangan modul) |
| V14 | `vacancies.service.ts:342-356` getVacancyBySlug | `slug` + include company{region, reviews(approved, rating), _count vacancies(active)} | `slug`U ✅; reviews `company_id` prefiksi ✅; `reviews` take yo'q (max = userlar soni) |
| V15 | `companies.routes.ts:177-199` `/api/companies/:slug` | include **barcha** approved reviews (user profil bilan, createdAt sort) + **barcha** active vacancies (region, category) | ♾️ katta kompaniyada (yuzlab vakansiya, minglab sharh) |

**Tavsiya (vacancies):**
- `@@index([status, isPremium, publishedAt])` — V1 relevance (asosiy ommaviy ro'yxat, ~20k); mavjud `(status,publishedAt)` date sort uchun qoladi.
- `@@index([status, viewsCount, publishedAt])` — V2 popular (ixtiyoriy, agar popular sort haqiqatan ishlatilsa).
- `@@index([status, salaryMin])` — V3 (yoki maosh sortni Meili'ga o'tkazish).
- `@@index([createdAt])` — V7 (admin, past ustuvorlik).
- V3 semantik: `unpriced` shartini `{ OR: [{ salaryMin: null }, { salaryMin: { isSet: false } }] }` qilish yoki `createVacancy`da `salaryMin: input.salaryMin ?? null` yozish (koddagi tuzatish, indeks emas).
- V4: facet'larni bitta `aggregateRaw` `$facet` pipeline'ga birlashtirish (7 → 1 skan) yoki qisqa TTL kesh.
- V11: natijani in-memory TTL kesh (masalan 10 daqiqa) yoki `aggregateRaw` `$group`; 20k hujjatni har so'rovda yuklamaslik.

### 2.2 `applications` (📈 ~50k, avgObjSize ≈ 195 B)
Indekslar: `(vacancy_id,job_seeker_id)`U, `job_seeker_id`, `resume_id`.

| # | Joy | So'rov | Indeks holati |
|---|---|---|---|
| A1 | `applications.routes.ts:93-119` `/api/applications` (nomzod) | `jobSeekerId` orderBy createdAt, **take yo'q**, include vacancy(select)+resume+statusHistory | `job_seeker_id` ✅; foydalanuvchi bo'yicha chegaralangan; ♾️ (past) |
| A2 | `applications.routes.ts:128-177` `/api/employer/applications` | `where { vacancy: { company: { ownerUserId } } }` — **2 darajali relation filter**, take yo'q, include: vacancy(+region,_count), statusHistory, jobSeeker(+profile+region), **resume to'liq (experience, education, skills)** | ⚠️♾️ **Eng og'ir so'rov**: relation filter aggregation'da — `applications` uchun scalar filtr yo'q, ya'ni 50k hujjat `$lookup` (vacancies→companies) bilan skan qilinadi (confidence: medium); keyin har ariza uchun 5–6 relation fetch. Faol kompaniyada javob megabaytlarga chiqadi. |
| A3 | `applications.routes.ts:201-205` `/api/vacancies/:id/applications` | `vacancyId` orderBy createdAt, take yo'q, include resume + jobSeeker(+profile) | unique indeks prefiksi `vacancy_id` ✅; sort xotirada; ♾️ (ommabop vakansiyada 1k+) |
| A4 | `chat.routes.ts:480-482` `/api/inbox/summary` (**har header yuklanishida**, employer) | `count { vacancy: { company: { ownerUserId } }, status:"sent" }` | ⚠️ A2 bilan bir xil relation filter → har sahifa ochilishida 50k skan (confidence: medium) |
| A5 | `stats.routes.ts:18` `/api/stats` (**bosh sahifa, ommaviy**) | `count { createdAt >= startOfToday }` | ⚠️ `created_at` indeksi yo'q → 50k skan har bosh sahifa yuklanishida (keshsiz) |
| A6 | `admin.routes.ts:69,81-84` overview | `count createdAt>=dayAgo`, `findMany createdAt>=since select createdAt` (14 kun) | ⚠️ skan (admin) |
| A7 | `chat.routes.ts:207-232` conversations konteksti | `jobSeekerId in [...]` + `vacancy.is.companyId in [...]` | `job_seeker_id` `$match` avval qo'llansa ✅ (Prisma pipeline tartibi — confidence: medium) |
| A8 | `reviews.routes.ts:26-29` | `jobSeekerId + vacancy.companyId` findFirst | `job_seeker_id` ✅ |
| A9 | `applications.routes.ts:52-54` dublikat tekshiruv | `vacancyId + jobSeekerId` | unique ✅ |

**Tavsiya (applications):**
- `@@index([createdAt])` — A5 (ommaviy bosh sahifa), A6.
- `@@index([vacancyId, createdAt])` — A3 (unique indeks `vacancy_id` prefiksini beradi, lekin sort'ni emas); A2/A4 uchun ham 2-bosqichli so'rovda ishlatiladi.
- A2/A4 kod darajasida: avval `company.findFirst({ownerUserId})` → `vacancy.findMany({companyId}, select id)` (indeks `company_id`) → `application.findMany({ vacancyId: { in: ids } })` (unique prefiks) + **pagination** (`take`, cursor) + rezyumeni ro'yxatda emas, detail'da yuklash. Yoki `Application` ga `companyId` denormalizatsiya + `@@index([companyId, status, createdAt])` (yangi yozuvlar uchun; eski yozuvlarga backfill kerak).

### 2.3 `notifications` (📈 ~100k) — indeks `(user_id,is_read)`
| # | Joy | So'rov | Holat |
|---|---|---|---|
| N1 | `notifications.routes.ts:61-65` | `userId [, isRead:false]` orderBy createdAt desc take ≤100 | ⚠️ `userId` prefiksi ✅, sort `created_at` indeksda yo'q → foydalanuvchining barcha bildirishnomalari xotirada saralanadi (o'rtacha 10, lekin faol employer'da minglab) |
| N2 | `:66, :85` unread count; `:101` read-all updateMany | `userId, isRead:false` | ✅ |
| N3 | `admin.routes.ts:510-524` broadcast | `user.findMany({isBlocked:false[, role]})` select id — **take yo'q** → 10k id; keyin **ketma-ket** `notify()` (har biri: prefs findMany + notification create + telegram/push/email) | ♾️📈 10k × ≥2 so'rov **HTTP request ichida** → timeout/ulanish uzilishi; qisman yuborilgan holat |
| N4 | `notifications.service.ts:48-51` prefs | `userId, notificationType, isEnabled:false` | unique `(user_id,notification_type,channel)` prefiksi ✅ |

**Tavsiya:** `@@index([userId, createdAt])` (N1) — `(userId,isRead)` unread count uchun qoladi; yoki `(userId, isRead, createdAt)` bitta indeks (unreadOnly ro'yxat + count; umumiy ro'yxat uchun prefiks `userId` + sort ishlamaydi — shuning uchun alohida `(userId, createdAt)` afzal). Broadcast: `notification.createMany` + fon vazifa; retention (masalan 90 kundan eski o'qilganlarni tozalash) — hozir yo'q.

### 2.4 `messages` (📈 ~100k) — indeks `(conversation_id,created_at)`, `sender_id`
| # | Joy | So'rov | Holat |
|---|---|---|---|
| M1 | `chat.routes.ts:321-324` `/api/conversations/:id/messages` | `conversationId` orderBy createdAt asc, **take yo'q** | indeks ✅ (sort ham); ♾️ uzun suhbat (5k xabar) to'liq yuklanadi — cursor (`createdAt < before`, take 50) kerak |
| M2 | `:195-199` groupBy unread; `:475-477` count; `:99,:311` updateMany read | `conversationId in ids, senderId not, isRead false` | `conversation_id` prefiksi ✅ |
| M3 | `:189` include `messages take 1 orderBy createdAt desc` (har conversation) | Prisma to-many include + take → suhbatlar soni bo'yicha alohida so'rovlar bo'lishi mumkin (N+1, confidence: low) | foydalanuvchi bo'yicha chegaralangan |
| M4 | `:63-64` `message.count({… take:1})` | count'da `take` — mantiqan `findFirst` yetarli | ✅ indeks |

### 2.5 `users` (📈 ~10k) — `email`U, `telegram_chat_id`, `role`
| # | Joy | So'rov | Holat |
|---|---|---|---|
| U1 | `auth-guard.ts:41`, `:53` | har himoyalangan so'rovda `findUnique(id)` (rol/blok) + telefon uchun yana bitta | `_id` ✅; so'rov boshiga +1..2 DB chaqiruv (indeks muammosi emas, arxitektura) |
| U2 | `admin.routes.ts:133-144` | `role?`, OR contains(email, phone, jobSeekerProfile.firstName/lastName), orderBy createdAt skip/take + count | ⚠️ `created_at` indeksi yo'q, relation filter aggregation (admin) |
| U3 | `admin.routes.ts:70,80` | `createdAt >= …` | ⚠️ skan (admin) |
| U4 | `team.routes.ts:102`, `articles.admin.routes.ts:227,272` | `role in STAFF` | `role` ✅ |
| U5 | `telegram.service.ts:118,227,258` findFirst; `:203` updateMany | `telegramChatId` | ✅ (unique emas — kod ta'minlaydi, `schema.prisma:169-172`) |

**Tavsiya:** `@@index([createdAt])` (U2/U3, admin — past ustuvorlik).

### 2.6 `companies` (~2–3k) — `slug`U, `owner_user_id`, `region_id`, `subscription_plan_id`
| # | Joy | So'rov | Holat |
|---|---|---|---|
| C1 | 8 joyda `company.findFirst({ ownerUserId })` (`companies.routes.ts:73,88,130,164`, `vacancies.routes.ts:136`, `chat.routes.ts:150`, `candidates.routes.ts:16`, `billing.routes.ts:56,76,108`) | `owner_user_id` ✅ | **Bir egaga bir kompaniya** taxmini — sxemada unique emas; `POST /api/companies` (`companies.routes.ts:211-220`) mavjudlikni tekshirmasdan **ikkinchi kompaniya yaratishga ruxsat beradi** → `findFirst` noaniq bo'lib qoladi (dev bazada 0 holat) |
| C2 | `companies.list.ts:317-344` `aggregateRaw` katalog | `$match` (name/industry/description regex, region_id, employee_count, is_verified, _id in saved) → **har mos kompaniya uchun** 2×`$lookup` (company_reviews `company_id` prefiksi ✅, vacancies `company_id` ✅) → `$set _sort` → `$sort` → `$limit` | Filtrsiz so'rovda barcha kompaniyalar (~3k) uchun 6k indeks lookup + xotira sort **har sahifada** (kod izohi `:20-22` buni tan oladi). 10k-scale'da chidaydi; o'sishda denormalizatsiya (`ratingAvg`, `reviewCount`, `activeVacancyCount` Company'da + indeks) kerak |
| C3 | `admin.routes.ts:310-321` | `isVerified?`, name contains, orderBy createdAt | ⚠️ skan (kichik hajm, admin) |
| C4 | `seo.routes.ts:114-117` sitemap | barcha kompaniyalar take 50000 | ♾️ kichik hajmda OK |

### 2.7 Qolganlari (hajmi kichik yoki indeks mos)
| Kolleksiya | So'rovlar | Holat |
|---|---|---|
| `conversations` | `chat.routes.ts:168-191, :403-411, :469-472` `OR[employerUserId, seekerUserId]` | unique prefiks `employer_user_id` + `seeker_user_id` ✅; `/api/conversations` take yo'q (foydalanuvchi bo'yicha chegaralangan) |
| `peer_ratings` | `chat.routes.ts:343,432` aggregate `ratedUserId`; `candidates.routes.ts:68` groupBy `ratedUserId in` | ✅ |
| `favorites` / `saved_companies` | `favorites.routes.ts:20,64,110`, `companies.list.ts:256` `userId` | unique prefiks `user_id` ✅; `/api/favorites` take yo'q (foydalanuvchi bo'yicha) |
| `saved_searches` | `alerts.routes.ts:55,84` `userId` ✅; `alerts.service.ts:102-105` `emailAlertsEnabled:true` **hammasi** + include user | ♾️ Har sweep'da (ALERTS_INTERVAL) har obuna uchun `listVacancies()` (`:134`) = findMany + **keraksiz count** (10k obuna → 20k+ og'ir so'rov, ketma-ket); `publishedAt > lastNotifiedAt` sharti so'rovga emas, JS'ga qo'yilgan (`:136-137`) |
| `job_seeker_profiles` | `candidates.routes.ts:28-63` `user.role` relation + `isOpenToWork` + `resumes some` + OR contains (headline, ism, resumes.title, resumes.skills.skillName), orderBy userId take 50 | ⚠️ 10k profil × `$lookup` (users, resumes, resume_skills) har qidiruvda; indeks yordam bermaydi (regex + relation OR). Faqat employer uchun (`assertCanSearchCandidates` — billing rejasi talab qiladi, product rule bilan **zid**: platforma bepul, lekin `candidates.routes.ts:15-22` 402 beradi) |
| `resumes` | `applications.routes.ts:43`, `resume.routes.ts:39,95` `jobSeekerId` orderBy createdAt asc | `job_seeker_id` ✅ |
| `articles` (yuzlab) | `articles.routes.ts:64,96,97,106,135,140,182`, `articles.admin.routes.ts:245,241,229` | `(status,published_at)`, `(status,category)`, `previous_slugs` ✅; `searchText contains` regex skan (kichik); popular/updatedAt sort xotirada (kichik) |
| `company_reviews` | `admin.routes.ts:376-388` status + createdAt; `reviews.routes.ts:38` companyId+userId | `status` ✅ (sort xotirada); unique ✅ |
| `payments` | `admin.routes.ts:436-446, :72-73` status; `billing.routes.ts:81` companyId | `(company_id,status)` — status-only uchun prefiks emas ⚠️ (izolyatsiyalangan modul, e'tiborsiz) |
| `staff_invites` | `team.routes.ts:103,132,161,237` PENDING (`null` + `isSet:false`) | kichik; `null`/missing semantikasi to'g'ri hal qilingan (`:44-49`) |
| `regions` / `vacancy_categories` | `catalog.routes.ts:7,17`, `seo.routes.ts:88-89`, `vacancies.rules.ts:29-30` | 15 / 6 hujjat — indeks shart emas; `parentId: { not: null }` maydon yo'q hujjatni ham chiqarib tashlaydi (dev'da tekshirildi: 15 → 14) ✅ |

---

## 3. Unbounded so'rovlar ro'yxati (take yo'q / limit yo'q / katta include)

| Ustuvorlik | Joy | Nima | Chegara | Tavsiya |
|---|---|---|---|---|
| **P1** | `applications.routes.ts:128-177` `/api/employer/applications` | take yo'q + to'liq rezyume include + 2-darajali relation filter | kompaniya arizalari (minglab) | pagination + yengil select; 2-bosqichli so'rov |
| **P1** | `admin.routes.ts:510-524` broadcast | 10k user → ketma-ket notify request ichida | barcha userlar | `createMany` + fon vazifa |
| **P1** | `alerts.service.ts:102-141` sweep | barcha obunalar × listVacancies(+count) | obunalar soni | batch, count'siz, `publishedAt > lastNotifiedAt` where'ga |
| **P2** | `salary.stats.ts:161-172` | 20 000 hujjat + relation'lar har ommaviy so'rovda | 20k cap | kesh / aggregation |
| **P2** | `chat.routes.ts:321-324` | suhbat xabarlari hammasi | suhbat | cursor pagination |
| **P2** | `companies.routes.ts:177-199` | kompaniyaning barcha sharhlari + barcha faol vakansiyalari | kompaniya | take + alohida endpoint |
| **P2** | `applications.routes.ts:201-205` | vakansiya arizalari hammasi + to'liq rezyume | vakansiya | pagination |
| **P3** | `vacancies.routes.ts:104-118`, `applications.routes.ts:93-119`, `favorites.routes.ts:20`, `chat.routes.ts:168`, `alerts.routes.ts:55` | egalik bo'yicha chegaralangan, take yo'q | foydalanuvchi | `take` (masalan 200) + "yana" |
| **P3** | `seo.routes.ts:101,114,128` | sitemap take 50000, XML xotirada | 20k | kesh (soatlik) yoki stream |
| **P3** | `search.service.ts:173` reindexAll | barcha active + include | 20k | batch 1000 (faqat Meili yoqilganda) |
| **P3** | `vacancies.service.ts:342-356` include reviews | kompaniya sharhlari (rating uchun) | userlar soni | `_count`/`aggregate` bilan almashtirish |

---

## 4. Indeks tavsiyalari — yakuniy ro'yxat (faqat real so'rovga asoslangan)

| # | Model | `@@index` | Asos (fayl:qator) | Hajm 10k-scale | Ustuvorlik |
|---|---|---|---|---|---|
| I1 | `Application` | `[createdAt]` | `stats.routes.ts:18` (ommaviy bosh sahifa), `admin.routes.ts:69,81` | 50k skan → indeks range | **Yuqori** |
| I2 | `Vacancy` | `[status, isPremium, publishedAt]` | `vacancies.service.ts:129-133,243-249` (asosiy ro'yxat, relevance) | 20k xotira sort → indeks sort | **Yuqori** |
| I3 | `Notification` | `[userId, createdAt]` | `notifications.routes.ts:61-65` | foydalanuvchi bildirishnomalari sort | O'rta |
| I4 | `Application` | `[vacancyId, createdAt]` | `applications.routes.ts:201-205`; A2/A4 2-bosqichli so'rov uchun | vakansiya arizalari sort | O'rta |
| I5 | `Vacancy` | `[status, salaryMin]` | `vacancies.service.ts:163-184` | maosh sort | O'rta |
| I6 | `Vacancy` | `[status, viewsCount, publishedAt]` | `vacancies.service.ts:141` popular | | Past |
| I7 | `Vacancy`, `User`, `Company` | `[createdAt]` | `admin.routes.ts:135,220,312` | admin ro'yxatlar | Past |
| I8 | `Company` | `@@unique([ownerUserId])` yoki kod darajasida tekshiruv | `companies.routes.ts:211-220` + 8 ta `findFirst` | integrity | O'rta (indeks emas, qoida) |

**Indeks emas, kod tuzatishlari (indeks tahlilidan kelib chiqqan):** V3 `salaryMin: null` semantikasi; A2/A4 relation filter → 2-bosqich; N3 broadcast; alerts sweep; `candidates` 402 (product rule ziddiyati); `Vacancy.categoryId` sxemada `String?` — product rule "majburiy" (yangi yozuvlar API'da tekshiriladi, sxema hujjatlashtirilmagan farq).

Eslatma: MongoDB'da `prisma db push` indekslarni yaratadi; 50k+ hujjatli kolleksiyada yangi indeks qurish sekundlar (foreground emas, 4.2+ hybrid build) — deploy'da xavfsiz.
