# DATA INTEGRITY — dev bazasi (PHASE 1.3, 2026-09-14)

> **PHASE 1 snapshot (tuzatishlardan oldingi holat).** Joriy holat: `docs/audit/ISSUES.md`, `docs/audit/DECISIONS.md` va `docs/audit/FINAL_AUDIT.md`. Round 3 dan keyin bu faylda tasvirlangan bir qancha yo'l va qoidalar o'zgargan (Telegram login olib tashlandi, nomzodlar bazasida 402 yo'q, rezyume fayllari avtorizatsiyali endpointda).

**Baza:** `mongodb://127.0.0.1:27018/ishbor?replicaSet=rs0` (`apps/api/.env` → `DATABASE_URL`), lokal dev (demo seed ma'lumotlari).
**Skript:** `C:/Users/hikma/AppData/Local/Temp/claude/c--Users-hikma-OneDrive-Desktop-ish-top/5df97c7b-0617-48b3-a7d2-720b3ebbf181/scratchpad/data_integrity.mjs` (repo tashqarisida; `cd apps/api && node <skript>`; `@prisma/client` `createRequire(apps/api/package.json)` orqali).
**Rejim:** FAQAT O'QISH — `findRaw`, `count`, `groupBy`, `$runCommandRaw({listIndexes})`, `$runCommandRaw({collStats})`. **Hech narsa o'chirilmadi, o'zgartirilmadi, yozilmadi.** Ishlash vaqti ≈150 ms.

## Xulosa

103 ta tekshiruv: **1 ta muammo**, qolgani OK.

| # | Topilma | Soni | Jiddiylik | Manba |
|---|---|---|---|---|
| DI-1 | `vacancies.workplace_type` **barcha 83 vakansiyada maydon umuman yo'q** (`$exists:false` = 83, shundan 75 `active`) | 83/83 | O'rta (dev/demo); prod'da eski yozuvlar uchun ham kutiladi | Demo seed `apps/api/src/prisma/demo-seed.ts:1689-1712` `workplaceType` yozmaydi (grep: fayl ichida so'z umuman yo'q); `seed.ts` ham. Product rule: yangi/tahrirlangan e'lonlarda majburiy, eski yozuvlar backward-compatible. |

DI-1 oqibatlari (kodga asoslangan):
- Frontend fallback (`employmentType === "remote"` → masofaviy) va API filtri (`vacancies.service.ts:54-57` `OR [employmentType in, workplaceType:"remote"]`) — ro'yxat/qidiruv buzilmaydi.
- **Tahrirlash:** `PUT /api/vacancies/:id` (`vacancies.routes.ts:154-158`) `workplaceType: body.workplaceType ?? vacancy.workplaceType` → null → `assertVacancyPlacement` (`vacancies.rules.ts:25`) `400 workplaceType: Ish joylashuvini tanlang`. Ya'ni eski vakansiyada faqat sarlavhani o'zgartirish ham, agar klient `workplaceType` yubormasa, 400 beradi. Frontend forma har doim yuborsa — muammo yo'q (frontend agenti tekshirsin).
- Demo qamrovi qoidasi (memory: "har bo'lim demo hisoblarda to'la bo'lsin") buzilgan: demo seed yangi majburiy maydonni kiritmagan.

Tekshirilgan, muammo topilmagan: barcha orphan referenslar (application/notification/message/conversation/favorite/savedCompany/resume/vacancy/statusHistory/company.owner/peerRating/companyMember/review/payment/article/staff/push/savedSearch/prefs), enum qiymatlari (24 maydon, `$nin` + majburiy maydon `$exists:false`), null/bo'sh va duplicate slug (5 kolleksiya, lowercase), duplicate email (lowercase) va lowercase bo'lmagan email, telegramChatId dublikati, bir employer'da bir nechta company, profili yo'q job_seeker, rol nomuvofiqliklari (company egasi, ariza beruvchi, suhbat tomonlari, maqola muallifi), biznes qoidalar (active+publishedAt null, office/hybrid+regionId null, salaryMin>salaryMax, employment remote vs workplace, rating/score 1..5, published article+publishedAt null).

## Kod darajasidagi integrity risklari (bazada hozir ko'rinmaydi, lekin kod ruxsat beradi)

| # | Risk | Dalil | Tavsiya |
|---|---|---|---|
| DI-R1 | Bir employer bir nechta company yarata oladi → 8 ta `company.findFirst({ownerUserId})` noaniq bo'ladi (vakansiya, chat, billing, nomzodlar boshqa kompaniyaga tushishi mumkin) | `companies.routes.ts:211-220` `POST /api/companies` mavjudlikni tekshirmaydi; `Company.ownerUserId` unique emas (`schema.prisma:301,333`) | POST'da `findFirst` tekshiruvi + 409, yoki `@@unique([ownerUserId])` (agar "bir ega — bir kompaniya" qat'iy qoida bo'lsa) |
| DI-R2 | Prisma Mongo'da `field: null` faqat **aniq null** ni topadi, maydon yo'q hujjatni topmaydi (dev'da tasdiqlandi: `salaryMin:null`=1, `isSet:false`=0, `$exists:false`=0; `parentId:{not:null}` esa maydon yo'qni ham chiqarib tashlaydi — 15→14 ✅). `createVacancy` `salaryMin: input.salaryMin ?? undefined` (`vacancies.service.ts:450`) → API orqali maoshsiz yaratilgan vakansiyada `salary_min` **yoziLMAydi** → `listBySalary` `unpriced = {salaryMin: null}` (`vacancies.service.ts:161`) ularni topmaydi: maosh saralashda yo'qoladi, `total` esa hisoblaydi | dev bazada demo seed aniq `null` yozgani uchun (demo-seed.ts:1702-1703) ko'rinmaydi; confidence: medium-high | `salaryMin: input.salaryMin ?? null` yoki `OR [{salaryMin:null},{salaryMin:{isSet:false}}]` (team.routes.ts:44-49 dagi PENDING kabi) |
| DI-R3 | Referens butunligi faqat Prisma client emulyatsiyasi (MongoDB'da FK yo'q). `$runCommandRaw`/`findRaw`/tashqi vositalar (`mongosh`, Compass) orqali o'chirish orphan qoldiradi. Hozir kodda User/Company/Conversation o'chirish yo'li yo'q — demak app orqali orphan paydo bo'lmaydi | `schema.prisma` relation'lar; `articles.routes.ts:53`, `articles.backfill.ts:70` faqat `update` ishlatadi ✅ | Ushbu skriptni CI/cron'da davriy ishga tushirish (read-only) |
| DI-R4 | `Vacancy.categoryId` sxemada ixtiyoriy (`String?`, `schema.prisma:398`), product rule "majburiy". Bazada 0 null ✅, lekin sxema hujjat sifatida ruleni aks ettirmaydi | `vacancies.rules.ts:24` API tekshiradi | Sxema izohiga qoida yozish; barcha yozuvlar to'ldirilgach `String` qilish (db push) |
| DI-R5 | `users.email` unique indeks case-sensitive; kod `normalizeEmail` qiladi (auth, team). Bazada lowercase bo'lmagan email 0 ✅ | `auth.service.ts:81`, `team.routes.ts:126` | O'zgarishsiz; skript tekshiruvi saqlansin |
| DI-R6 | `notification_preferences` = 0, `push_subscriptions` = 0 hujjat — demo qamrovida bu bo'limlar bo'sh (xato emas; sozlamalar UI "yozuv yo'q = yoqilgan" mantiqida ishlaydi) | `notifications.routes.ts:123-148` | Demo seed'ga bir nechta o'chirilgan kanal qo'shish (qamrov) |

## Kolleksiya hajmi va indekslar (haqiqiy holat)

`collStats` (dev): vacancies avgObjSize 1034 B, applications 195 B, messages 203 B, notifications 265 B. 10k-scale prognoz: vacancies ≈ 20 MB, applications ≈ 10 MB, messages+notifications ≈ 45 MB — hammasi RAM'ga sig'adi; muammo hajm emas, **skan va sort** (qarang `DB_MAP.md` §2–4).

Bazadagi indekslar `schema.prisma` bilan **to'liq mos** (28 kolleksiya, quyida). `vacancies.status` bo'yicha taqsimot: active 75, moderation 3, archived 2, rejected 2, draft 1.

## Kolleksiya hajmi
| Model | Hujjat soni |
|---|---:|
| user | 61 |
| jobSeekerProfile | 14 |
| resume | 14 |
| resumeExperience | 18 |
| resumeEducation | 13 |
| resumeSkill | 73 |
| company | 42 |
| companyMember | 42 |
| vacancyCategory | 6 |
| region | 15 |
| vacancy | 83 |
| application | 45 |
| applicationStatusHistory | 93 |
| conversation | 14 |
| peerRating | 10 |
| message | 47 |
| favorite | 24 |
| savedCompany | 12 |
| savedSearch | 9 |
| notification | 35 |
| notificationPreference | 0 |
| article | 15 |
| staffProfile | 4 |
| staffInvite | 2 |
| companyReview | 102 |
| subscriptionPlan | 3 |
| payment | 11 |
| pushSubscription | 0 |

## Indekslar (bazadagi haqiqiy holat, listIndexes)
| Collection | Indekslar |
|---|---|
| users | `{"_id":1}`<br>`{"email":1} UNIQUE`<br>`{"telegram_chat_id":1}`<br>`{"role":1}` |
| job_seeker_profiles | `{"_id":1}`<br>`{"user_id":1} UNIQUE`<br>`{"region_id":1}` |
| resumes | `{"_id":1}`<br>`{"job_seeker_id":1}`<br>`{"status":1}` |
| resume_experience | `{"_id":1}`<br>`{"resume_id":1}` |
| resume_education | `{"_id":1}`<br>`{"resume_id":1}` |
| resume_skills | `{"_id":1}`<br>`{"resume_id":1}` |
| companies | `{"_id":1}`<br>`{"slug":1} UNIQUE`<br>`{"owner_user_id":1}`<br>`{"region_id":1}`<br>`{"subscription_plan_id":1}` |
| company_members | `{"_id":1}`<br>`{"user_id":1}`<br>`{"company_id":1,"user_id":1} UNIQUE` |
| vacancy_categories | `{"_id":1}`<br>`{"slug":1} UNIQUE` |
| regions | `{"_id":1}`<br>`{"slug":1} UNIQUE` |
| vacancies | `{"_id":1}`<br>`{"slug":1} UNIQUE`<br>`{"status":1,"published_at":1}`<br>`{"company_id":1}`<br>`{"category_id":1}`<br>`{"region_id":1}` |
| applications | `{"_id":1}`<br>`{"job_seeker_id":1}`<br>`{"resume_id":1}`<br>`{"vacancy_id":1,"job_seeker_id":1} UNIQUE` |
| application_status_history | `{"_id":1}`<br>`{"application_id":1}`<br>`{"changed_by":1}` |
| conversations | `{"_id":1}`<br>`{"seeker_user_id":1}`<br>`{"company_id":1}`<br>`{"employer_user_id":1,"seeker_user_id":1} UNIQUE` |
| peer_ratings | `{"_id":1}`<br>`{"rated_user_id":1}`<br>`{"rater_user_id":1}`<br>`{"conversation_id":1,"rater_user_id":1} UNIQUE` |
| messages | `{"_id":1}`<br>`{"conversation_id":1,"created_at":1}`<br>`{"sender_id":1}` |
| favorites | `{"_id":1}`<br>`{"vacancy_id":1}`<br>`{"user_id":1,"vacancy_id":1} UNIQUE` |
| saved_companies | `{"_id":1}`<br>`{"company_id":1}`<br>`{"user_id":1,"company_id":1} UNIQUE` |
| saved_searches | `{"_id":1}`<br>`{"user_id":1}` |
| notifications | `{"_id":1}`<br>`{"user_id":1,"is_read":1}` |
| notification_preferences | `{"_id":1}`<br>`{"user_id":1,"notification_type":1,"channel":1} UNIQUE` |
| articles | `{"_id":1}`<br>`{"slug":1} UNIQUE`<br>`{"author_id":1}`<br>`{"status":1,"published_at":1}`<br>`{"status":1,"category":1}`<br>`{"previous_slugs":1}` |
| staff_profiles | `{"_id":1}`<br>`{"user_id":1} UNIQUE` |
| staff_invites | `{"_id":1}`<br>`{"token_hash":1} UNIQUE`<br>`{"email":1}`<br>`{"invited_by_id":1}` |
| company_reviews | `{"_id":1}`<br>`{"user_id":1}`<br>`{"status":1}`<br>`{"company_id":1,"user_id":1} UNIQUE` |
| subscription_plans | `{"_id":1}`<br>`{"slug":1} UNIQUE` |
| payments | `{"_id":1}`<br>`{"transaction_id":1} UNIQUE`<br>`{"company_id":1,"status":1}`<br>`{"plan_id":1}` |
| push_subscriptions | `{"_id":1}`<br>`{"endpoint":1} UNIQUE`<br>`{"user_id":1}` |

## Referens butunligi va biznes qoidalar
| Guruh | Tekshiruv | Soni | Holat | Namuna (≤5) | Izoh |
|---|---|---:|---|---|---|
| profile | jobSeekerProfile.userId → users yo'q | 0 | OK | — |  |
| profile | jobSeekerProfile.regionId → regions yo'q (null emas) | 0 | OK | — |  |
| profile | job_seeker user'lar profili YO'Q | 0 | OK | — |  |
| profile | Profil bor, lekin user roli job_seeker EMAS | 0 | OK | — |  |
| profile | Bitta user'ga bir nechta jobSeekerProfile | 0 | OK | — |  |
| resume | resume.jobSeekerId → job_seeker_profiles yo'q | 0 | OK | — |  |
| resume | resume_experience.resumeId → resumes yo'q | 0 | OK | — |  |
| resume | resume_education.resumeId → resumes yo'q | 0 | OK | — |  |
| resume | resume_skills.resumeId → resumes yo'q | 0 | OK | — |  |
| company | company.ownerUserId → users yo'q | 0 | OK | — |  |
| company | company.regionId → regions yo'q (null emas) | 0 | OK | — |  |
| company | company.subscriptionPlanId → plans yo'q (null emas) | 0 | OK | — |  |
| company | company egasi roli employer EMAS | 0 | OK | — |  |
| company | Bir employer'da BIR NECHTA company (findFirst noaniq) | 0 | OK | — |  |
| company | employer roli bor, company YO'Q (info) | 0 | OK | — | xato emas — profil hali to'ldirilmagan |
| company | company_members.companyId → companies yo'q | 0 | OK | — |  |
| company | company_members.userId → users yo'q | 0 | OK | — |  |
| vacancy | vacancy.companyId → companies yo'q | 0 | OK | — |  |
| vacancy | vacancy.categoryId → categories yo'q (null emas) | 0 | OK | — |  |
| vacancy | vacancy.regionId → regions yo'q (null emas) | 0 | OK | — |  |
| vacancy | vacancy.categoryId NULL/yo'q (qoida: majburiy) | 0 | OK | — |  |
| vacancy | vacancy.workplaceType NULL/yo'q (eski yozuv) | 83 | MUAMMO | 6aa7106109929ad6fe18d104 [active], 6aa7106109929ad6fe18d105 [active], 6aa7106109929ad6fe18d106 [active], 6aa7106209929ad6fe18d107 [active], 6aa7106209929ad6fe18d108 [active] |  |
| vacancy | workplaceType office/hybrid, lekin regionId NULL (qoida buzilgan) | 0 | OK | — |  |
| vacancy | status=active, publishedAt NULL | 0 | OK | — |  |
| vacancy | salaryMin > salaryMax | 0 | OK | — |  |
| vacancy | employmentType=remote, workplaceType≠remote (nomuvofiq) | 0 | OK | — |  |
| application | application.vacancyId → vacancies yo'q | 0 | OK | — |  |
| application | application.jobSeekerId → users yo'q | 0 | OK | — |  |
| application | application.resumeId → resumes yo'q (null emas) | 0 | OK | — |  |
| application | application.jobSeekerId roli job_seeker EMAS | 0 | OK | — |  |
| application | Duplicate (vacancyId, jobSeekerId) | 0 | OK | — |  |
| application | status_history.applicationId → applications yo'q | 0 | OK | — |  |
| application | status_history.changedBy → users yo'q (null emas) | 0 | OK | — |  |
| chat | conversation.employerUserId → users yo'q | 0 | OK | — |  |
| chat | conversation.seekerUserId → users yo'q | 0 | OK | — |  |
| chat | conversation.companyId → companies yo'q (null emas) | 0 | OK | — |  |
| chat | conversation.seeker roli job_seeker EMAS | 0 | OK | — |  |
| chat | conversation.employer roli employer/admin EMAS | 0 | OK | — |  |
| chat | message.conversationId → conversations yo'q | 0 | OK | — |  |
| chat | message.senderId → users yo'q | 0 | OK | — |  |
| chat | message.senderId suhbat ishtirokchisi EMAS | 0 | OK | — |  |
| chat | peer_ratings.conversationId → conversations yo'q | 0 | OK | — |  |
| chat | peer_ratings.rater/rated → users yo'q | 0 | OK | — |  |
| chat | peer_ratings.score 1..5 dan tashqari | 0 | OK | — |  |
| favorite | favorite.vacancyId → vacancies yo'q | 0 | OK | — |  |
| favorite | favorite.userId → users yo'q | 0 | OK | — |  |
| favorite | saved_companies.companyId → companies yo'q | 0 | OK | — |  |
| favorite | saved_companies.userId → users yo'q | 0 | OK | — |  |
| favorite | saved_searches.userId → users yo'q | 0 | OK | — |  |
| notification | notification.userId → users yo'q | 0 | OK | — |  |
| notification | notification_preferences.userId → users yo'q | 0 | OK | — |  |
| notification | push_subscriptions.userId → users yo'q | 0 | OK | — |  |
| review | company_reviews.companyId → companies yo'q | 0 | OK | — |  |
| review | company_reviews.userId → users yo'q | 0 | OK | — |  |
| review | company_reviews.rating 1..5 dan tashqari | 0 | OK | — |  |
| billing | payments.companyId → companies yo'q | 0 | OK | — |  |
| billing | payments.planId → plans yo'q | 0 | OK | — |  |
| article | articles.authorId → users yo'q (null emas) | 0 | OK | — |  |
| article | articles.authorId roli staff EMAS | 0 | OK | — |  |
| article | status=published, publishedAt NULL | 0 | OK | — |  |
| staff | staff_profiles.userId → users yo'q | 0 | OK | — |  |
| staff | staff_invites.invitedById → users yo'q | 0 | OK | — |  |
| catalog | vacancy_categories.parentId → yo'q (null emas) | 0 | OK | — |  |
| catalog | regions.parentId → yo'q (null emas) | 0 | OK | — |  |
| slug | vacancy.slug null/bo'sh | 0 | OK | — |  |
| slug | vacancy.slug duplicate (lowercase) | 0 | OK | — |  |
| slug | company.slug null/bo'sh | 0 | OK | — |  |
| slug | company.slug duplicate (lowercase) | 0 | OK | — |  |
| slug | article.slug null/bo'sh | 0 | OK | — |  |
| slug | article.slug duplicate (lowercase) | 0 | OK | — |  |
| slug | vacancyCategory.slug null/bo'sh | 0 | OK | — |  |
| slug | vacancyCategory.slug duplicate (lowercase) | 0 | OK | — |  |
| slug | region.slug null/bo'sh | 0 | OK | — |  |
| slug | region.slug duplicate (lowercase) | 0 | OK | — |  |
| user | users.email duplicate (lowercase) | 0 | OK | — |  |
| user | users.email lowercase EMAS (info) | 0 | OK | — | unique indeks case-sensitive; kod normalizeEmail qiladi |
| user | users.email null/bo'sh | 0 | OK | — |  |
| user | users.telegramChatId duplicate (kod bilan ta'minlanadi, indeks unique emas) | 0 | OK | — |  |
| slug | subscription_plans.slug null/bo'sh | 0 | OK | — |  |

## Enum qiymatlari (findRaw $nin)
| Model | Maydon | Noto'g'ri qiymat | Maydon umuman yo'q | Namuna |
|---|---|---:|---:|---|
| user | role | 0 | 0 | — |
| vacancy | status | 0 | 0 | — |
| vacancy | employment_type | 0 | 0 | — |
| vacancy | schedule_type | 0 | 0 | — |
| vacancy | workplace_type | 0 | 0 | — |
| vacancy | experience_required | 0 | 0 | — |
| vacancy | salary_type | 0 | 0 | — |
| application | status | 0 | 0 | — |
| application | source | 0 | 0 | — |
| applicationStatusHistory | new_status | 0 | 0 | — |
| applicationStatusHistory | old_status | 0 | 0 | — |
| resume | status | 0 | 0 | — |
| notification | type | 0 | 0 | — |
| notificationPreference | notification_type | 0 | 0 | — |
| notificationPreference | channel | 0 | 0 | — |
| companyReview | status | 0 | 0 | — |
| article | status | 0 | 0 | — |
| article | category | 0 | 0 | — |
| payment | status | 0 | 0 | — |
| payment | provider | 0 | 0 | — |
| savedSearch | frequency | 0 | 0 | — |
| companyMember | role | 0 | 0 | — |
| staffInvite | role | 0 | 0 | — |
| resume | employment_types[] | 0 | 0 | — |

_Skript 150 ms ishladi; faqat findRaw/count/listIndexes; hech narsa yozilmadi._


---
_2026-09-14. Skript faqat o'qidi; bazada hech narsa o'chirilmadi va o'zgartirilmadi. Qayta ishga tushirish: `cd apps/api && node <scratchpad>/data_integrity.mjs`._
