import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { uniqueSlug } from "../../common/slug.js";
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
  sort?: VacancySort;
  page?: number;
  pageSize?: number;
}

const LIST_INCLUDE = { company: true, region: true, category: true } as const;

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

/** Facet hisoblashda "o'z" filtri chetlab o'tiladigan o'lchovlar. */
type FilterDimension = "area" | "experience" | "employment" | "company" | "category";

/** Filtrlar (matndan tashqari) — ikkala drayverda ham bir xil qo'llanadi. */
function buildFilters(query: VacancyListQuery, except?: FilterDimension): Prisma.VacancyWhereInput {
  const areas = except === "area" ? [] : splitList(query.area);
  const experience = except === "experience" ? [] : splitList(query.experience, EXPERIENCE_VALUES);
  const employment = except === "employment" ? [] : splitList(query.employment, EMPLOYMENT_VALUES);
  const companies = except === "company" ? [] : splitList(query.company);
  const category = except === "category" ? undefined : query.categorySlug;
  const company: Prisma.CompanyWhereInput = {
    ...(companies.length ? { slug: { in: companies } } : {}),
    ...(query.verified ? { isVerified: true } : {}),
  };
  return {
    status: "active",
    ...(category ? { category: { slug: category } } : {}),
    ...(areas.length ? { region: { slug: { in: areas } } } : {}),
    ...(experience.length ? { experienceRequired: { in: experience as never } } : {}),
    ...(employment.length ? { employmentType: { in: employment as never } } : {}),
    ...(Object.keys(company).length ? { company } : {}),
    ...(query.premium ? { isPremium: true } : {}),
    // Maosh filtri: vakansiyaning boshlang'ich oyligi (salaryMin) berilgan
    // oraliqda bo'lishi kerak. Masalan [9mln, 10mln] uchun 8mln'dan
    // boshlanadigan vakansiya chiqmaydi.
    ...(query.salary || query.salaryTo
      ? {
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
function textFilter(text: string): Prisma.VacancyWhereInput {
  const terms = text
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .slice(0, 6);
  if (terms.length === 0) return {};

  const like = (v: string) => ({ contains: v, mode: "insensitive" as const });
  return {
    AND: terms.map((term) => ({
      // Qisqa so'zlar (HR, QA, 1C) tavsif ichida boshqa so'z bo'lagi sifatida
      // ham uchraydi ("sHaHRi") — ular faqat sarlavha, kompaniya va sohadan qidiriladi
      OR:
        term.length < 4
          ? [{ title: like(term) }, { company: { name: like(term) } }, { category: { name: like(term) } }]
          : [
              { title: like(term) },
              { description: like(term) },
              { requirements: like(term) },
              { company: { name: like(term) } },
              { category: { name: like(term) } },
            ],
    })),
  };
}

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
 */
async function listBySalary(
  where: Prisma.VacancyWhereInput,
  direction: "asc" | "desc",
  skip: number,
  take: number
) {
  const priced: Prisma.VacancyWhereInput = { AND: [where, { salaryMin: { not: null } }] };
  const unpriced: Prisma.VacancyWhereInput = { AND: [where, { salaryMin: null }] };

  const pricedCount = await prisma.vacancy.count({ where: priced });

  const head =
    skip < pricedCount
      ? await prisma.vacancy.findMany({
          where: priced,
          include: LIST_INCLUDE,
          orderBy: [{ isPremium: "desc" }, { salaryMin: direction }, { id: "desc" }],
          skip,
          take,
        })
      : [];

  if (head.length >= take) return head;

  const tail = await prisma.vacancy.findMany({
    where: unpriced,
    include: LIST_INCLUDE,
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
  const filters = buildFilters(query);
  const text = query.text?.trim();

  // 1-yo'l: Meilisearch (yoqilgan bo'lsa va matn qidiruvi bo'lsa). Indeksda
  // kompaniya/tasdiq/premium maydonlari yo'q — bunday filtrlar MongoDB'da.
  const engineCanFilter = !query.company && !query.verified && !query.premium;
  if (text && engineCanFilter && (query.sort ?? "relevance") === "relevance") {
    const engine = await searchVacancyIds({
      text,
      categorySlug: query.categorySlug,
      area: query.area,
      experience: query.experience,
      employment: query.employment,
      salary: query.salary,
      salaryTo: query.salaryTo,
      offset: skip,
      limit: pageSize,
    });

    if (engine) {
      const rows = await prisma.vacancy.findMany({
        where: { id: { in: engine.ids } },
        include: LIST_INCLUDE,
      });
      // Meili relevantlik tartibini saqlaymiz (findMany tartibni kafolatlamaydi)
      const byId = new Map(rows.map((r: (typeof rows)[number]) => [r.id, r]));
      const items = engine.ids.map((id) => byId.get(id)).filter(Boolean);
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

  // 2-yo'l: MongoDB
  const where: Prisma.VacancyWhereInput = text
    ? { AND: [filters, textFilter(text)] }
    : filters;

  const salarySort =
    query.sort === "salary_desc" ? "desc" : query.sort === "salary_asc" ? "asc" : null;
  const order = SORT_ORDERS[query.sort === "date" || query.sort === "popular" ? query.sort : "relevance"];

  const [items, total] = await Promise.all([
    salarySort
      ? listBySalary(where, salarySort, skip, pageSize)
      : prisma.vacancy.findMany({
          where,
          include: LIST_INCLUDE,
          orderBy: order,
          skip,
          take: pageSize,
        }),
    prisma.vacancy.count({ where }),
  ]);

  return {
    items,
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
export async function vacancyFacets(query: VacancyListQuery) {
  const text = query.text?.trim();
  const where = (except?: FilterDimension): Prisma.VacancyWhereInput => {
    const filters = buildFilters(query, except);
    return text ? { AND: [filters, textFilter(text)] } : filters;
  };

  const [byRegion, byEmployment, byExperience, byCompany, byCategory, total] = await Promise.all([
    prisma.vacancy.groupBy({ by: ["regionId"], where: where("area"), _count: { _all: true } }),
    prisma.vacancy.groupBy({ by: ["employmentType"], where: where("employment"), _count: { _all: true } }),
    prisma.vacancy.groupBy({ by: ["experienceRequired"], where: where("experience"), _count: { _all: true } }),
    prisma.vacancy.groupBy({ by: ["companyId"], where: where("company"), _count: { _all: true } }),
    prisma.vacancy.groupBy({ by: ["categoryId"], where: where("category"), _count: { _all: true } }),
    prisma.vacancy.count({ where: where() }),
  ]);

  const idsOf = (rows: { [key: string]: unknown }[], key: string) =>
    rows.map((r) => r[key]).filter((v): v is string => typeof v === "string");

  const [regions, companies, categories] = await Promise.all([
    prisma.region.findMany({ where: { id: { in: idsOf(byRegion, "regionId") } }, select: { id: true, slug: true, name: true } }),
    prisma.company.findMany({
      where: { id: { in: idsOf(byCompany, "companyId") } },
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
      count: byEmployment.find((r: (typeof byEmployment)[number]) => r.employmentType === value)?._count._all ?? 0,
    })),
    experience: EXPERIENCE_VALUES.map((value) => ({
      value,
      count: byExperience.find((r: (typeof byExperience)[number]) => r.experienceRequired === value)?._count._all ?? 0,
    })),
    companies: byCompany
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

export async function getVacancyBySlug(slug: string) {
  const vacancy = await prisma.vacancy.findUnique({
    where: { slug },
    include: {
      company: {
        include: {
          region: true,
          reviews: { where: { status: "approved" }, select: { rating: true } },
          // "Kompaniyaning boshqa vakansiyalari" havolasi uchun
          _count: { select: { vacancies: { where: { status: "active" } } } },
        },
      },
      region: true,
      category: true,
    },
  });
  if (!vacancy || vacancy.status !== "active") throw Errors.notFound("Vakansiya topilmadi");

  await prisma.vacancy.update({
    where: { id: vacancy.id },
    data: { viewsCount: { increment: 1 } },
  });

  return vacancy;
}

/**
 * "O'xshash vakansiyalar": shu sohadagi faol e'lonlar — hududi va tajribasi
 * mos kelganlari oldinda. Soha bo'lmasa yoki kam bo'lsa, shu kompaniyaning
 * boshqa vakansiyalari bilan to'ldiriladi. Vakansiyaning o'zi chiqmaydi.
 * Mos e'lon bo'lmasa bo'sh ro'yxat — sahifa blokni yashiradi.
 */
export async function similarVacancies(slug: string, limit = 4) {
  const take = Math.min(Math.max(Math.trunc(limit) || 4, 1), 10);
  const base = await prisma.vacancy.findUnique({
    where: { slug },
    select: { id: true, status: true, categoryId: true, regionId: true, companyId: true, experienceRequired: true },
  });
  if (!base || base.status !== "active") throw Errors.notFound("Vakansiya topilmadi");

  const pool = base.categoryId
    ? await prisma.vacancy.findMany({
        where: { status: "active", id: { not: base.id }, categoryId: base.categoryId },
        include: LIST_INCLUDE,
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
      include: LIST_INCLUDE,
      orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
      take: take - items.length,
    });
    items = [...items, ...more];
  }
  return { items };
}

export interface CreateVacancyInput {
  companyId: string;
  title: string;
  description: string;
  requirements?: string;
  conditions?: string;
  categoryId?: string;
  regionId?: string;
  employmentType: string;
  scheduleType?: string;
  experienceRequired?: string;
  salaryMin?: number;
  salaryMax?: number;
  applyWithoutResume?: boolean;
  contactEmail?: string;
  contactTelegram?: string;
  contactPhone?: string;
}

export async function createVacancy(input: CreateVacancyInput) {
  const vacancy = await prisma.vacancy.create({
    data: {
      companyId: input.companyId,
      title: input.title,
      slug: uniqueSlug(input.title, "vakansiya"),
      description: input.description,
      requirements: input.requirements,
      conditions: input.conditions,
      categoryId: input.categoryId,
      regionId: input.regionId,
      employmentType: input.employmentType as never,
      scheduleType: input.scheduleType as never,
      experienceRequired: (input.experienceRequired as never) ?? "none",
      salaryMin: input.salaryMin,
      salaryMax: input.salaryMax,
      applyWithoutResume: input.applyWithoutResume ?? false,
      contactEmail: input.contactEmail || null,
      contactTelegram: input.contactTelegram || null,
      contactPhone: input.contactPhone || null,
      status: "active",
      publishedAt: new Date(),
    },
  });

  // Qidiruv indeksi va obuna signallari — javobni kutdirmasdan fonda
  void indexVacancy(vacancy.id);
  return vacancy;
}

/** Holat o'zgarganda indeksni sinxron ushlab turadi. */
export async function syncVacancyIndex(vacancyId: string, status: string): Promise<void> {
  if (status === "active") await indexVacancy(vacancyId);
  else await removeVacancyFromIndex(vacancyId);
}
