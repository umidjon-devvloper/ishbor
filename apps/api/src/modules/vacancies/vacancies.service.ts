import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { uniqueSlug } from "../../common/slug.js";
import { bumpDataVersion, keyedCache } from "../../common/cache.js";
import { apostropheVariants, searchKey, tokenize } from "../../common/search-text.js";
import type { Prisma } from "@prisma/client";
import {
  indexVacancy,
  removeVacancyFromIndex,
  searchVacancyIds,
} from "../search/search.service.js";

export type VacancySort = "relevance" | "date" | "salary_desc" | "salary_asc" | "popular";

export interface VacancyListQuery {
  text?: string;
  categorySlug?: string;
  /** Hudud slug'i yoki vergul bilan bir nechtasi (`tashkent,samarqand`). */
  area?: string;
  /** Tajriba (enum) — bitta yoki vergul bilan bir nechta. */
  experience?: string;
  /** Bandlik turi (enum) — bitta yoki vergul bilan bir nechta. */
  employment?: string;
  salary?: number;
  salaryTo?: number;
  /** Kompaniya slug'lari (vergul bilan). */
  company?: string;
  /** Faqat tasdiqlangan ish beruvchilar. */
  verified?: boolean;
  /** Faqat premium vakansiyalar. */
  premium?: boolean;
  /** Faqat shu vaqtdan keyin chop etilganlar (obuna xabarnomalari uchun, URL'dan kelmaydi). */
  publishedAfter?: Date;
  /** Faqat shu vaqtgacha (shu jumladan) chop etilganlar — obuna aylanishining yuqori chegarasi, URL'dan kelmaydi (audit PHASE 6, V6). */
  publishedBefore?: Date;
  sort?: VacancySort;
  page?: number;
  pageSize?: number;
}

/**
 * Ochiq javoblardagi kompaniya kartasi — faqat ko'rsatiladigan maydonlar. Ilgari `company: true`
 * egasining ID'si, STIR, yuridik nom va tarif maydonlarini mehmonga ham qaytarardi (audit ISSUE-032).
 */
export const PUBLIC_COMPANY_CARD_SELECT = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  isVerified: true,
  industry: true,
} as const satisfies Prisma.CompanySelect;

/** Kompaniya va vakansiya sahifasidagi ochiq profil (ichki maydonlarsiz). */
export const PUBLIC_COMPANY_SELECT = {
  ...PUBLIC_COMPANY_CARD_SELECT,
  description: true,
  website: true,
  employeeCount: true,
  foundedYear: true,
  images: true,
  regionId: true,
  createdAt: true,
  region: { select: { id: true, name: true, slug: true } },
} as const satisfies Prisma.CompanySelect;

/**
 * Ro'yxat kartasi (qidiruv, bosh sahifa, o'xshashlar, kompaniya sahifasi). To'liq tavsif va shartlar
 * faqat detail sahifada; talablar kartadagi ko'nikma belgilarini ajratish uchun qoldirilgan (audit ISSUE-048).
 */
export const VACANCY_CARD_SELECT = {
  id: true,
  companyId: true,
  title: true,
  slug: true,
  requirements: true,
  categoryId: true,
  regionId: true,
  employmentType: true,
  scheduleType: true,
  workplaceType: true,
  experienceRequired: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  salaryType: true,
  isSalaryHidden: true,
  applyWithoutResume: true,
  status: true,
  isUrgent: true,
  isPremium: true,
  publishedAt: true,
  expiresAt: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
  company: { select: PUBLIC_COMPANY_CARD_SELECT },
  region: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
} as const satisfies Prisma.VacancySelect;

/**
 * Ochiq vakansiya sahifasi — aniq maydonlar ro'yxati (audit R3, gap4-3).
 *
 * Ilgari `include` ishlatilardi, ya'ni Vacancy'ning BARCHA maydonlari mehmonga ham chiqardi:
 * jumladan ichki moderator izohi `rejectionReason` va `adminArchivedAt`. Endi ro'yxat aniq,
 * shuning uchun kelajakda qo'shiladigan ichki maydon ham avtomatik ochilmaydi.
 */
export const VACANCY_DETAIL_SELECT = {
  id: true,
  companyId: true,
  title: true,
  slug: true,
  description: true,
  requirements: true,
  conditions: true,
  categoryId: true,
  regionId: true,
  address: true,
  latitude: true,
  longitude: true,
  images: true,
  employmentType: true,
  scheduleType: true,
  workplaceType: true,
  experienceRequired: true,
  salaryMin: true,
  salaryMax: true,
  currency: true,
  salaryType: true,
  isSalaryHidden: true,
  applyWithoutResume: true,
  contactEmail: true,
  contactTelegram: true,
  contactPhone: true,
  status: true,
  isUrgent: true,
  isPremium: true,
  publishedAt: true,
  expiresAt: true,
  viewsCount: true,
  createdAt: true,
  updatedAt: true,
  company: {
    select: {
      ...PUBLIC_COMPANY_SELECT,
      // "Kompaniyaning boshqa vakansiyalari" havolasi uchun
      _count: { select: { vacancies: { where: { status: "active" as const } } } },
    },
  },
  region: { select: { id: true, name: true, slug: true } },
  category: { select: { id: true, name: true, slug: true } },
} as const satisfies Prisma.VacancySelect;

/**
 * Yashirilgan maosh raqamlari ochiq javobga chiqmaydi — faqat frontend yashirishiga tayanilmaydi
 * (audit ISSUE-033). Ish beruvchining o'z endpointlarida raqamlar qoladi (tahrirlash formasi).
 */
export function withPublicSalary<T extends { isSalaryHidden: boolean; salaryMin: number | null; salaryMax: number | null }>(
  vacancy: T
): T {
  return vacancy.isSalaryHidden ? { ...vacancy, salaryMin: null, salaryMax: null } : vacancy;
}

export const EXPERIENCE_VALUES = ["none", "one_to_three", "three_to_six", "six_plus"] as const;
export const EMPLOYMENT_VALUES = ["full_time", "part_time", "remote", "shift"] as const;

/**
 * "a, b,a" → ["a", "b"]. `allowed` berilsa noma'lum qiymatlar tashlanadi
 * (ilgari noto'g'ri enum Prisma xatosiga — 500 ga olib kelardi).
 */
export function splitList(value: string | undefined, allowed?: readonly string[]): string[] {
  if (!value) return [];
  const list = [...new Set(value.split(",").map((s) => s.trim()).filter(Boolean))].slice(0, 50);
  return allowed ? list.filter((v) => allowed.includes(v)) : list;
}

/**
 * Bandlik filtri. "Masofaviy" — ish joylashuvi masofaviy bo'lgan e'lonlarni ham oladi
 * (yangi e'lonlarda masofaviylik `workplaceType`da, eskilarida `employmentType = remote`).
 */
function employmentWhere(employment: string[]): Prisma.VacancyWhereInput {
  const byType: Prisma.VacancyWhereInput = { employmentType: { in: employment as never } };
  return employment.includes("remote") ? { OR: [byType, { workplaceType: "remote" }] } : byType;
}

/** Facet hisoblashda "o'z" filtri chetlab o'tiladigan o'lchovlar. */
type FilterDimension = "area" | "experience" | "employment" | "company" | "category";

/**
 * Qidiruv so'zlari — umumiy `tokenize` (audit R3, D-080 / gap1-6): so'z chetidagi
 * tinish belgilari tozalanadi (`dasturchi,` topiladi), takrorlar tashlanadi,
 * 2+ belgili ko'pi bilan 8 ta so'z qoladi. MongoDB drayveri, ID oldindan hisobi
 * va facets bir xil ro'yxatni ko'radi.
 */
function searchTerms(text: string): string[] {
  return tokenize(text);
}

/** Prisma uchun "ichida bor" (katta-kichik harf farqsiz). */
const like = (value: string) => ({ contains: value, mode: "insensitive" as const });

/**
 * Nom bo'yicha moslik — tutuq belgisining har bir varianti bilan (audit R3, D-080 / gap1-1):
 * `ko'chmas`, `koʻchmas` va `ko’chmas` bir xil natija beradi. Prisma MongoDB'da `contains`
 * qiymatini o'zi ekranlaydi, shuning uchun regex o'rniga variantlar OR bilan beriladi
 * (ko'pi bilan 7 ta; tutuq belgisi bo'lmagan so'zda bitta shart).
 */
function nameMatches(term: string): { OR: { name: { contains: string; mode: "insensitive" } }[] } {
  return { OR: apostropheVariants(term).map((variant) => ({ name: like(variant) })) };
}

/** Filtr slug'lari va matn so'zlariga mos ID'lar — so'rov boshida bir marta hisoblanadi. */
interface ResolvedFilterIds {
  /** `area` berilgan bo'lsa — mos hudud ID'lari (hech biri topilmasa bo'sh — natija yo'q). */
  regionIds: string[] | null;
  /** `categorySlug` berilgan bo'lsa — kategoriya ID'si (topilmasa bo'sh). */
  categoryIds: string[] | null;
  /** `company` slug'lari berilgan bo'lsa — mos kompaniya ID'lari. */
  companySlugIds: string[] | null;
  /** `verified` bo'lsa — tasdiqlangan kompaniyalar ID'lari. */
  verifiedCompanyIds: string[] | null;
  /** Matn so'zi → nomi shu so'zni o'z ichiga olgan kompaniya / kategoriya ID'lari. */
  companyIdsByTerm: Map<string, string[]>;
  categoryIdsByTerm: Map<string, string[]>;
}

const idsOfRows = (rows: { id: string }[]) => rows.map((row) => row.id);

/**
 * Relation filter (`region: { slug }`, `company: { name }`, `category: { name }`) MongoDB'da har bir
 * vakansiya uchun `$lookup` bajaradi: 20k e'londa hudud filtri va matn qidiruvi soniyalar olardi
 * (audit PHASE 5.3 sintetik benchmark). Endi slug va nomlar kichik kataloglardan (hudud, kategoriya,
 * kompaniya) oldindan ID'ga aylantiriladi va vakansiya indekslangan `regionId / categoryId / companyId`
 * bo'yicha filtrlanadi. Natija semantikasi o'zgarmaydi (e2e filtr va facets tekshiruvlari).
 */
async function resolveFilterIds(query: VacancyListQuery, text?: string): Promise<ResolvedFilterIds> {
  const areas = splitList(query.area);
  const companies = splitList(query.company);
  const [regionIds, categoryIds, companySlugIds, verifiedCompanyIds, termMatches] = await Promise.all([
    areas.length ? prisma.region.findMany({ where: { slug: { in: areas } }, select: { id: true } }).then(idsOfRows) : null,
    query.categorySlug
      ? prisma.vacancyCategory.findMany({ where: { slug: query.categorySlug }, select: { id: true } }).then(idsOfRows)
      : null,
    companies.length ? prisma.company.findMany({ where: { slug: { in: companies } }, select: { id: true } }).then(idsOfRows) : null,
    query.verified ? prisma.company.findMany({ where: { isVerified: true }, select: { id: true } }).then(idsOfRows) : null,
    Promise.all(
      searchTerms(text ?? "").map(async (term) => {
        const [companyRows, categoryRows] = await Promise.all([
          prisma.company.findMany({ where: nameMatches(term), select: { id: true } }),
          prisma.vacancyCategory.findMany({ where: nameMatches(term), select: { id: true } }),
        ]);
        return { term, companyIds: idsOfRows(companyRows), categoryIds: idsOfRows(categoryRows) };
      })
    ),
  ]);
  return {
    regionIds,
    categoryIds,
    companySlugIds,
    verifiedCompanyIds,
    companyIdsByTerm: new Map(termMatches.map((m) => [m.term, m.companyIds])),
    categoryIdsByTerm: new Map(termMatches.map((m) => [m.term, m.categoryIds])),
  };
}

/** Filtrlar (matndan tashqari) — ikkala drayverda ham bir xil qo'llanadi. */
function buildFilters(query: VacancyListQuery, resolved: ResolvedFilterIds, except?: FilterDimension): Prisma.VacancyWhereInput {
  const experience = except === "experience" ? [] : splitList(query.experience, EXPERIENCE_VALUES);
  const employment = except === "employment" ? [] : splitList(query.employment, EMPLOYMENT_VALUES);
  // Kompaniya: slug filtri (o'z o'lchovi facet'ida chetlab o'tiladi) va "faqat tasdiqlanganlar" (doim) kesishmasi
  let companyIds: string[] | null = except === "company" ? null : resolved.companySlugIds;
  if (resolved.verifiedCompanyIds) {
    const verified = new Set(resolved.verifiedCompanyIds);
    companyIds = companyIds ? companyIds.filter((id) => verified.has(id)) : resolved.verifiedCompanyIds;
  }
  return {
    status: "active",
    ...(except !== "category" && resolved.categoryIds ? { categoryId: { in: resolved.categoryIds } } : {}),
    ...(except !== "area" && resolved.regionIds ? { regionId: { in: resolved.regionIds } } : {}),
    ...(experience.length ? { experienceRequired: { in: experience as never } } : {}),
    ...(employment.length ? employmentWhere(employment) : {}),
    ...(companyIds ? { companyId: { in: companyIds } } : {}),
    ...(query.premium ? { isPremium: true } : {}),
    // Chop etilgan vaqt oralig'i (publishedAfter; publishedBefore] — obuna aylanishi uchun (audit PHASE 6, V6)
    ...(query.publishedAfter || query.publishedBefore
      ? {
          publishedAt: {
            ...(query.publishedAfter ? { gt: query.publishedAfter } : {}),
            ...(query.publishedBefore ? { lte: query.publishedBefore } : {}),
          },
        }
      : {}),
    // Maosh filtri: vakansiyaning boshlang'ich oyligi (salaryMin) berilgan
    // oraliqda bo'lishi kerak. Masalan [9mln, 10mln] uchun 8mln'dan
    // boshlanadigan vakansiya chiqmaydi. Yashirilgan maosh filtrga tushmaydi —
    // aks holda yashirin raqam filtr natijalari orqali aniqlanardi.
    ...(query.salary || query.salaryTo
      ? {
          NOT: { isSalaryHidden: true },
          salaryMin: {
            ...(query.salary ? { gte: query.salary } : {}),
            ...(query.salaryTo ? { lte: query.salaryTo } : {}),
          },
        }
      : {}),
  };
}

/**
 * MongoDB matn qidiruvi: so'rov so'zlarga bo'linadi va HAR BIR so'z
 * sarlavha / tavsif / talablar / kompaniya nomi / kategoriya nomidan birida
 * uchrashi shart (AND). Bu "frontend dasturchi toshkent" kabi ko'p so'zli
 * so'rovlarni to'g'ri toraytiradi — oddiy `contains` esa hech narsa topmasdi.
 */
function textFilter(text: string, resolved: ResolvedFilterIds): Prisma.VacancyWhereInput {
  const terms = searchTerms(text);
  if (terms.length === 0) return {};

  return {
    AND: terms.map((term) => {
      // Kompaniya va soha nomi — oldindan topilgan ID'lar (relation filter $lookup'siz)
      const companyIds = resolved.companyIdsByTerm.get(term) ?? [];
      const categoryIds = resolved.categoryIdsByTerm.get(term) ?? [];
      const byRelation: Prisma.VacancyWhereInput[] = [
        ...(companyIds.length ? [{ companyId: { in: companyIds } }] : []),
        ...(categoryIds.length ? [{ categoryId: { in: categoryIds } }] : []),
      ];
      // Tutuq belgisi variantlari (audit R3, D-080): har bir maydon uchun variantlar OR bilan
      const variants = apostropheVariants(term);
      const inFields = (fields: readonly ("title" | "description" | "requirements")[]): Prisma.VacancyWhereInput[] =>
        fields.flatMap((field) => variants.map((variant) => ({ [field]: like(variant) }) as Prisma.VacancyWhereInput));
      return {
        // Qisqa so'zlar (HR, QA, 1C) tavsif ichida boshqa so'z bo'lagi sifatida
        // ham uchraydi ("sHaHRi") — ular faqat sarlavha, kompaniya va sohadan qidiriladi.
        // So'z chegarasi bo'yicha qidirish (audit R3, gap1-2) Prisma `contains` bilan
        // mumkin emas: u qiymatni ekranlaydi, regex esa faqat `aggregateRaw` da ishlaydi.
        OR:
          term.length < 4
            ? [...inFields(["title"]), ...byRelation]
            : [...inFields(["title", "description", "requirements"]), ...byRelation],
      };
    }),
  };
}

/**
 * Kesh kaliti: `where` ga ta'sir qiladigan hamma narsa (sahifa, o'lcham va saralash kirmaydi).
 * Matn tokenlarga keltiriladi, ya'ni `React ` va `react` bitta kalit (ikkalasi ham bir xil
 * katta-kichik harf farqsiz so'rov). Jami son va facets keshlari shu kalitda (audit R3,
 * db-perf-4 / db-perf-5 / scale-10k-4).
 */
function filterKey(query: VacancyListQuery): string {
  return JSON.stringify([
    searchTerms(query.text?.trim() ?? "").map(searchKey),
    query.categorySlug ?? "",
    splitList(query.area),
    splitList(query.experience, EXPERIENCE_VALUES),
    splitList(query.employment, EMPLOYMENT_VALUES),
    query.salary ?? 0,
    query.salaryTo ?? 0,
    splitList(query.company),
    query.verified ? 1 : 0,
    query.premium ? 1 : 0,
    query.publishedAfter?.getTime() ?? 0,
    query.publishedBefore?.getTime() ?? 0,
  ]);
}

/**
 * Ro'yxatning jami soni (audit R3, db-perf-4): ilgari har sahifa va har saralashda alohida
 * `count` skan bo'lardi — endi bir xil filtr uchun 60 s keshlanadi. Vakansiya yoki kompaniya
 * yozilganda kesh darhol yangilanadi, shuning uchun yangi e'lon sondan tushib qolmaydi.
 */
const listTotalCache = keyedCache<number>(60_000, 300, ["vacancies", "companies"]);

// Oxirida `id` — sana bir xil bo'lganda sahifalar orasida takror/tushib qolish bo'lmasin
const DATE_ORDER: Prisma.VacancyOrderByWithRelationInput[] = [
  { isPremium: "desc" },
  { publishedAt: "desc" },
  { id: "desc" },
];

const SORT_ORDERS: Record<"relevance" | "date" | "popular", Prisma.VacancyOrderByWithRelationInput[]> = {
  // "Eng dolzarb": premium e'lonlar oldin, keyin yangilari
  relevance: DATE_ORDER,
  // "Yangi qo'shilgan": faqat sana — premium yuqoriga ko'tarilmaydi
  date: [{ publishedAt: "desc" }, { id: "desc" }],
  // "Mashhurligi bo'yicha": ko'rishlar soni
  popular: [{ viewsCount: "desc" }, { publishedAt: "desc" }, { id: "desc" }],
};

/**
 * Maosh bo'yicha saralash — ikki bo'lakda.
 *
 * MongoDB `nulls: "last"` ni qo'llab-quvvatlamaydi (bu SQL imkoniyati) va
 * o'sish tartibida `null` larni BIRINCHI qo'yadi — ya'ni "maosh bo'yicha
 * saralash" ro'yxatining boshiga maoshi ko'rsatilmagan e'lonlar chiqib qolardi.
 * Shuning uchun avval maoshi ko'rsatilganlar (maosh bo'yicha), keyin
 * ko'rsatilmaganlar (sana bo'yicha) beriladi. Sahifalash ikkala bo'lak ustidan
 * uzluksiz ishlaydi, `total` esa o'zgarmaydi.
 *
 * "Ko'rsatilmagan" — `null`, umuman yozilmagan maydon (Mongo'da `null` filtri unga mos
 * kelmaydi — `isSet: false` kerak) yoki yashirilgan maosh (yashirin raqam tartib orqali
 * ochilmasin). Ilgari yozilmagan maoshli e'lonlar ikkala bo'lakdan ham tushib qolardi.
 */
async function listBySalary(
  where: Prisma.VacancyWhereInput,
  direction: "asc" | "desc",
  skip: number,
  take: number
) {
  const priced: Prisma.VacancyWhereInput = {
    AND: [where, { NOT: { isSalaryHidden: true } }, { salaryMin: { not: null } }],
  };
  const unpriced: Prisma.VacancyWhereInput = {
    AND: [where, { OR: [{ isSalaryHidden: true }, { salaryMin: null }, { salaryMin: { isSet: false } }] }],
  };

  const pricedCount = await prisma.vacancy.count({ where: priced });

  const head =
    skip < pricedCount
      ? await prisma.vacancy.findMany({
          where: priced,
          select: VACANCY_CARD_SELECT,
          orderBy: [{ isPremium: "desc" }, { salaryMin: direction }, { id: "desc" }],
          skip,
          take,
        })
      : [];

  if (head.length >= take) return head;

  const tail = await prisma.vacancy.findMany({
    where: unpriced,
    select: VACANCY_CARD_SELECT,
    orderBy: DATE_ORDER,
    skip: Math.max(0, skip - pricedCount),
    take: take - head.length,
  });

  return [...head, ...tail];
}

export async function listVacancies(query: VacancyListQuery) {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 50);
  const skip = (page - 1) * pageSize;
  const text = query.text?.trim();

  // 1-yo'l: Meilisearch (yoqilgan bo'lsa va matn qidiruvi bo'lsa). Indeksda
  // kompaniya/tasdiq/premium maydonlari yo'q — bunday filtrlar MongoDB'da.
  const engineCanFilter =
    !query.company && !query.verified && !query.premium && !query.publishedAfter && !query.publishedBefore;
  if (text && engineCanFilter && (query.sort ?? "relevance") === "relevance") {
    const engine = await searchVacancyIds({
      text,
      categorySlug: query.categorySlug,
      // Noma'lum enum qiymatlari ikkala drayverda ham bir xil tashlanadi: ilgari Meili
      // yo'lida ular 0 natijali filtrga aylanardi (audit R3, gap1-10)
      areas: splitList(query.area),
      experience: splitList(query.experience, EXPERIENCE_VALUES),
      employment: splitList(query.employment, EMPLOYMENT_VALUES),
      salary: query.salary,
      salaryTo: query.salaryTo,
      page,
      limit: pageSize,
    });

    if (engine) {
      const rows = await prisma.vacancy.findMany({
        // Indeks kechiksa yoki sinxronlash xato bersa ham yopilgan/qoralama e'lon qaytmasin (audit ISSUE-061)
        where: { id: { in: engine.ids }, status: "active" },
        select: VACANCY_CARD_SELECT,
      });
      // Meili relevantlik tartibini saqlaymiz (findMany tartibni kafolatlamaydi)
      const byId = new Map(rows.map((r) => [r.id, r]));
      const items = engine.ids.flatMap((id) => {
        const row = byId.get(id);
        return row ? [withPublicSalary(row)] : [];
      });
      // Drayverlar farqi (audit R3, gap1-3, gap1-4): Meili so'z va xato yozilishga bardoshli,
      // MongoDB esa har so'zni substring sifatida qidiradi — shuning uchun bir xil so'rovda
      // natijalar to'plami farq qilishi mumkin. `total` endi Meili'ning ANIQ `totalHits` soni
      // (ilgari `estimatedTotalHits` edi), lekin indeks kechikkan bo'lsa quyidagi `status:
      // active` filtri ayrim qatorlarni olib tashlashi mumkin — bunda sahifada `total` dan
      // kamroq karta ko'rinadi.
      return {
        items,
        total: engine.total,
        page,
        pageSize,
        pageCount: Math.ceil(engine.total / pageSize),
        engine: "meilisearch" as const,
      };
    }
  }

  // 2-yo'l: MongoDB. Slug va nomlar oldindan ID'larga aylantiriladi (relation filter $lookup'siz)
  const resolved = await resolveFilterIds(query, text);
  const filters = buildFilters(query, resolved);
  const where: Prisma.VacancyWhereInput = text
    ? { AND: [filters, textFilter(text, resolved)] }
    : filters;

  const salarySort =
    query.sort === "salary_desc" ? "desc" : query.sort === "salary_asc" ? "asc" : null;
  const order = SORT_ORDERS[query.sort === "date" || query.sort === "popular" ? query.sort : "relevance"];

  const [rows, total] = await Promise.all([
    salarySort
      ? listBySalary(where, salarySort, skip, pageSize)
      : prisma.vacancy.findMany({
          where,
          select: VACANCY_CARD_SELECT,
          orderBy: order,
          skip,
          take: pageSize,
        }),
    listTotalCache(filterKey(query), () => prisma.vacancy.count({ where })),
  ]);

  return {
    items: rows.map(withPublicSalary),
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    engine: "mongodb" as const,
  };
}

/**
 * Filtr paneli uchun sonlar ("Toshkent (38)"). Har bir o'lchov o'z filtrini
 * chetlab hisoblanadi: hudud tanlansa ham boshqa hududlar soni ko'rinib turadi
 * va ular qo'shilganda nima bo'lishi oldindan ma'lum bo'ladi. Matn filtri
 * MongoDB qidiruvi bilan bir xil.
 */
async function computeFacets(query: VacancyListQuery) {
  const text = query.text?.trim();
  const resolved = await resolveFilterIds(query, text);
  const where = (except?: FilterDimension): Prisma.VacancyWhereInput => {
    const filters = buildFilters(query, resolved, except);
    return text ? { AND: [filters, textFilter(text, resolved)] } : filters;
  };

  const [byRegion, byEmployment, remoteCount, byExperience, byCompany, byCategory, total] = await Promise.all([
    prisma.vacancy.groupBy({ by: ["regionId"], where: where("area"), _count: { _all: true } }),
    prisma.vacancy.groupBy({ by: ["employmentType"], where: where("employment"), _count: { _all: true } }),
    // "Masofaviy" soni filtr bilan bir xil: bandlik turi yoki ish joylashuvi masofaviy
    prisma.vacancy.count({ where: { AND: [where("employment"), employmentWhere(["remote"])] } }),
    prisma.vacancy.groupBy({ by: ["experienceRequired"], where: where("experience"), _count: { _all: true } }),
    prisma.vacancy.groupBy({ by: ["companyId"], where: where("company"), _count: { _all: true } }),
    prisma.vacancy.groupBy({ by: ["categoryId"], where: where("category"), _count: { _all: true } }),
    prisma.vacancy.count({ where: where() }),
  ]);

  const idsOf = (rows: { [key: string]: unknown }[], key: string) =>
    rows.map((r) => r[key]).filter((v): v is string => typeof v === "string");

  // Kompaniyalar o'lchovi javobda 100 tagacha ko'rsatiladi, lekin ilgari MOS KELGAN BARCHA
  // kompaniya hujjati o'qilib, keyin kesilardi (audit R3, db-perf-5). Endi avval soni bo'yicha
  // eng yuqori 200 tasi ajratiladi va faqat shular o'qiladi; yakuniy tartib (son, keyin nom)
  // o'zgarmaydi — faqat 100-o'rin atrofida soni TENG bo'lgan kompaniyalar orasidan qaysi biri
  // tushishi farq qilishi mumkin.
  const FACET_COMPANY_LOOKUP = 200;
  const topCompanies = [...byCompany]
    .sort((a: (typeof byCompany)[number], b: (typeof byCompany)[number]) => b._count._all - a._count._all)
    .slice(0, FACET_COMPANY_LOOKUP);

  const [regions, companies, categories] = await Promise.all([
    prisma.region.findMany({ where: { id: { in: idsOf(byRegion, "regionId") } }, select: { id: true, slug: true, name: true } }),
    prisma.company.findMany({
      where: { id: { in: idsOf(topCompanies, "companyId") } },
      select: { id: true, slug: true, name: true, isVerified: true },
    }),
    prisma.vacancyCategory.findMany({
      where: { id: { in: idsOf(byCategory, "categoryId") } },
      select: { id: true, slug: true, name: true },
    }),
  ]);

  const byCount = <T extends { count: number; name: string }>(a: T, b: T) => b.count - a.count || a.name.localeCompare(b.name);
  const regionById = new Map(regions.map((r: (typeof regions)[number]) => [r.id, r]));
  const companyById = new Map(companies.map((c: (typeof companies)[number]) => [c.id, c]));
  const categoryById = new Map(categories.map((c: (typeof categories)[number]) => [c.id, c]));

  return {
    total,
    regions: byRegion
      .flatMap((row: (typeof byRegion)[number]) => {
        const region = row.regionId ? regionById.get(row.regionId) : undefined;
        return region ? [{ slug: region.slug, name: region.name, count: row._count._all }] : [];
      })
      .sort(byCount),
    employment: EMPLOYMENT_VALUES.map((value) => ({
      value,
      count: value === "remote" ? remoteCount : byEmployment.find((r: (typeof byEmployment)[number]) => r.employmentType === value)?._count._all ?? 0,
    })),
    experience: EXPERIENCE_VALUES.map((value) => ({
      value,
      count: byExperience.find((r: (typeof byExperience)[number]) => r.experienceRequired === value)?._count._all ?? 0,
    })),
    companies: topCompanies
      .flatMap((row: (typeof byCompany)[number]) => {
        const company = companyById.get(row.companyId);
        return company
          ? [{ slug: company.slug, name: company.name, isVerified: company.isVerified, count: row._count._all }]
          : [];
      })
      .sort(byCount)
      .slice(0, 100),
    categories: byCategory
      .flatMap((row: (typeof byCategory)[number]) => {
        const category = row.categoryId ? categoryById.get(row.categoryId) : undefined;
        return category ? [{ slug: category.slug, name: category.name, count: row._count._all }] : [];
      })
      .sort(byCount),
  };
}

/**
 * Facets keshi (audit R3, db-perf-5 / scale-10k-4). Ilgari FAQAT filtrsiz so'rov keshlanardi:
 * foydalanuvchi har filtr yoki matnni o'zgartirganda 7 ta agregatsiya (biri butun faol to'plam
 * bo'yicha) bazaga tushardi. Endi filtrli so'rovlar ham kalit bo'yicha 60 s keshlanadi
 * (eng ko'pi 200 ta kalit, eng eskisi chiqariladi). Vakansiya yoki kompaniya yozilganda
 * (`bumpDataVersion`) kesh darhol yangilanadi — yangi e'lon jami songa shu zahoti qo'shiladi
 * (audit PHASE 6, U29). Cache-Control o'zgarmaydi.
 */
const facetsCache = keyedCache<Awaited<ReturnType<typeof computeFacets>>>(60_000, 200, ["vacancies", "companies"]);

export async function vacancyFacets(query: VacancyListQuery) {
  return facetsCache(filterKey(query), () => computeFacets(query));
}

/**
 * Kompaniyaning tasdiqlangan sharhlari bo'yicha reyting va son — bazada agregatsiya. Shakl va yuvarlash
 * ochiq kompaniya sahifasidagi `reviewSummary` bilan bir xil (companies.routes.ts).
 */
export async function companyReviewSummary(companyId: string): Promise<{ rating: number | null; count: number }> {
  const summary = await prisma.companyReview.aggregate({
    where: { companyId, status: "approved" },
    _avg: { rating: true },
    _count: { _all: true },
  });
  return {
    rating: summary._avg.rating === null ? null : Math.round(summary._avg.rating * 10) / 10,
    count: summary._count._all,
  };
}

/**
 * Vakansiya sahifasi keshi (audit: perf-detail-1).
 *
 * Bu — saytdagi eng ko'p ochiladigan sahifa. Har ochilishda ikkita so'rov ketardi:
 * e'lonning o'zi va kompaniya sharhlari agregatsiyasi. Javob foydalanuvchiga BOG'LIQ
 * EMAS (shaxsiy ma'lumot yo'q), shuning uchun uni qisqa muddatga keshlash mumkin:
 * mashhur e'londa yuzlab ochilish bitta o'qishga aylanadi.
 *
 * Kesh e'lon, kompaniya yoki sharh o'zgarganda darhol eskiradi (`bumpDataVersion`),
 * shuning uchun tahrir sahifada kechikmaydi. Ko'rishlar soni esa buferdan yozilgani
 * uchun baribir kechikadi (VIEW_FLUSH_MS) — kesh buni sezilarli o'zgartirmaydi.
 */
const detailCache = keyedCache<Awaited<ReturnType<typeof loadVacancyDetail>>>(30_000, 500, [
  "vacancies",
  "companies",
  "reviews",
]);

export async function getVacancyBySlug(slug: string) {
  return detailCache(slug, () => loadVacancyDetail(slug));
}

async function loadVacancyDetail(slug: string) {
  const vacancy = await prisma.vacancy.findUnique({
    where: { slug },
    select: VACANCY_DETAIL_SELECT,
  });
  if (!vacancy || vacancy.status !== "active") throw Errors.notFound("Vakansiya topilmadi");

  // Ko'rishlar hisoblagichi BU YERDA oshmaydi (audit: views-1). Ilgari har bir so'rov bazaga
  // alohida `$inc` yozardi: bitta odam sahifani qayta ochsa ham, bot kirsa ham sanalardi va
  // javob keshlab bo'lmaydigan yon ta'sirga ega edi. Endi ko'rishni brauzer alohida yuboradi
  // (`POST /api/vacancies/:slug/view` → `common/views.ts`), takrori filtrlanadi va bufer orqali
  // yoziladi. Shu sababli bu yo'l endi TOZA o'qish.

  // Ilgari har ochilishda kompaniyaning BARCHA tasdiqlangan sharhlari o'qilardi (cheklanmagan) — endi faqat
  // agregatsiya; javobda `company.reviews` o'rniga `company.reviewSummary` (audit PHASE 6, U17)
  const reviewSummary = await companyReviewSummary(vacancy.companyId);

  return withPublicSalary({ ...vacancy, company: { ...vacancy.company, reviewSummary } });
}

/**
 * O'xshash e'lonlar keshi (audit R3, scale-10k-11): vakansiya sahifasining har SSR'ida
 * so'raladi. Kalit — slug va so'ralgan son; vakansiya yozilganda (`bumpDataVersion`) kesh
 * darhol yangilanadi, ya'ni yopilgan e'lon ro'yxatda qolib ketmaydi.
 *
 * Bo'limlar `vacancies` VA `companies`: kartada kompaniya nomi, logotipi va tasdiq
 * belgisi bor (`VACANCY_CARD_SELECT`), shuning uchun kompaniya tahriri ham keshni
 * yangilashi kerak — chaqiruvchilar bo'limli `bumpDataVersion` ga o'tganda ham
 * eski nom 5 daqiqa qolib ketmasin (audit R3, db-perf-6).
 */
const similarCache = keyedCache<Awaited<ReturnType<typeof loadSimilarVacancies>>>(5 * 60_000, 200, [
  "vacancies",
  "companies",
]);

/**
 * "O'xshash vakansiyalar": shu sohadagi faol e'lonlar — hududi va tajribasi
 * mos kelganlari oldinda. Soha bo'lmasa yoki kam bo'lsa, shu kompaniyaning
 * boshqa vakansiyalari bilan to'ldiriladi. Vakansiyaning o'zi chiqmaydi.
 * Mos e'lon bo'lmasa bo'sh ro'yxat — sahifa blokni yashiradi.
 */
export async function similarVacancies(slug: string, limit = 4) {
  const take = Math.min(Math.max(Math.trunc(limit) || 4, 1), 10);
  return similarCache(`${slug}:${take}`, () => loadSimilarVacancies(slug, take));
}

/**
 * Soha bo'yicha nomzod to'plami: `@@index([categoryId, status, publishedAt, id])` saralashni
 * ham qamrab oladi, shuning uchun 40 ta hujjat o'qiladi — ilgari sohadagi barcha e'lonlar
 * xotirada saralanardi (audit R3, scale-10k-11).
 */
async function loadSimilarVacancies(slug: string, take: number) {
  const base = await prisma.vacancy.findUnique({
    where: { slug },
    select: { id: true, status: true, categoryId: true, regionId: true, companyId: true, experienceRequired: true },
  });
  if (!base || base.status !== "active") throw Errors.notFound("Vakansiya topilmadi");

  const pool = base.categoryId
    ? await prisma.vacancy.findMany({
        where: { status: "active", id: { not: base.id }, categoryId: base.categoryId },
        select: VACANCY_CARD_SELECT,
        orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
        take: 40,
      })
    : [];
  const score = (v: (typeof pool)[number]) =>
    (v.regionId === base.regionId ? 2 : 0) + (v.experienceRequired === base.experienceRequired ? 1 : 0);
  // Barqaror saralash: ball teng bo'lsa — yangiroq e'lon oldinda (pool tartibi)
  let items = pool
    .map((v, i) => ({ v, s: score(v), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, take)
    .map((x) => x.v);

  if (items.length < take) {
    const more = await prisma.vacancy.findMany({
      where: { status: "active", id: { notIn: [base.id, ...items.map((v) => v.id)] }, companyId: base.companyId },
      select: VACANCY_CARD_SELECT,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: take - items.length,
    });
    items = [...items, ...more];
  }
  return { items: items.map(withPublicSalary) };
}

export interface CreateVacancyInput {
  companyId: string;
  title: string;
  description: string;
  requirements?: string;
  conditions?: string;
  categoryId?: string;
  /** Masofaviy ishda bo'sh bo'lishi mumkin. */
  regionId?: string | null;
  workplaceType?: string;
  employmentType: string;
  scheduleType?: string | null;
  experienceRequired?: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
  isSalaryHidden?: boolean;
  applyWithoutResume?: boolean;
  /** "draft" — qoralama: e'lon qilinmaydi, qidiruv indeksiga tushmaydi. Standart — darhol faol. */
  status?: "active" | "draft";
  contactEmail?: string;
  contactTelegram?: string;
  contactPhone?: string;
}

export async function createVacancy(input: CreateVacancyInput) {
  const status = input.status ?? "active";
  const vacancy = await prisma.vacancy.create({
    data: {
      companyId: input.companyId,
      title: input.title,
      slug: uniqueSlug(input.title, "vakansiya"),
      description: input.description,
      requirements: input.requirements,
      conditions: input.conditions,
      categoryId: input.categoryId,
      regionId: input.regionId ?? undefined,
      workplaceType: input.workplaceType as never,
      employmentType: input.employmentType as never,
      scheduleType: (input.scheduleType ?? undefined) as never,
      experienceRequired: (input.experienceRequired as never) ?? "none",
      // Aniq `null` yoziladi (maydon tushib qolmaydi) — maosh bo'yicha saralash va filtr bir xil ko'radi
      salaryMin: input.salaryMin ?? null,
      salaryMax: input.salaryMax ?? null,
      isSalaryHidden: input.isSalaryHidden ?? false,
      applyWithoutResume: input.applyWithoutResume ?? false,
      contactEmail: input.contactEmail || null,
      contactTelegram: input.contactTelegram || null,
      contactPhone: input.contactPhone || null,
      status,
      publishedAt: status === "active" ? new Date() : null,
    },
  });

  // Qidiruv indeksi va obuna signallari — faqat e'lon qilinganda, javobni kutdirmasdan fonda
  if (status === "active") {
    void indexVacancy(vacancy.id);
    // Faqat vakansiya keshlari (audit R3, db-perf-6 / scale-10k-5): sharh va kompaniya
    // keshlari o'z bo'limlariga tegishli
    bumpDataVersion("vacancies");
  }
  return vacancy;
}

/** Holat o'zgarganda indeksni sinxron ushlab turadi. */
export async function syncVacancyIndex(vacancyId: string, status: string): Promise<void> {
  if (status === "active") await indexVacancy(vacancyId);
  else await removeVacancyFromIndex(vacancyId);
}
