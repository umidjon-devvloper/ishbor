import { prisma } from "../../common/prisma.js";
import { Errors } from "../../common/errors.js";
import { uniqueSlug } from "../../common/slug.js";
import type { Prisma } from "@prisma/client";
import {
  indexVacancy,
  removeVacancyFromIndex,
  searchVacancyIds,
} from "../search/search.service.js";

export type VacancySort = "relevance" | "date" | "salary_desc" | "salary_asc";

export interface VacancyListQuery {
  text?: string;
  categorySlug?: string;
  area?: string;
  experience?: string;
  employment?: string;
  salary?: number;
  salaryTo?: number;
  sort?: VacancySort;
  page?: number;
  pageSize?: number;
}

const LIST_INCLUDE = { company: true, region: true, category: true } as const;

/** Filtrlar (matndan tashqari) — ikkala drayverda ham bir xil qo'llanadi. */
function buildFilters(query: VacancyListQuery): Prisma.VacancyWhereInput {
  return {
    status: "active",
    ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
    ...(query.area ? { region: { slug: query.area } } : {}),
    ...(query.experience ? { experienceRequired: query.experience as never } : {}),
    ...(query.employment ? { employmentType: query.employment as never } : {}),
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
      OR: [
        { title: like(term) },
        { description: like(term) },
        { requirements: like(term) },
        { company: { name: like(term) } },
        { category: { name: like(term) } },
      ],
    })),
  };
}

const DATE_ORDER: Prisma.VacancyOrderByWithRelationInput[] = [
  { isPremium: "desc" },
  { publishedAt: "desc" },
];

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
          orderBy: [{ isPremium: "desc" }, { salaryMin: direction }],
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
  const pageSize = Math.min(query.pageSize ?? 20, 50);
  const skip = (page - 1) * pageSize;
  const filters = buildFilters(query);
  const text = query.text?.trim();

  // 1-yo'l: Meilisearch (yoqilgan bo'lsa va matn qidiruvi bo'lsa)
  if (text && (query.sort ?? "relevance") === "relevance") {
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

  const [items, total] = await Promise.all([
    salarySort
      ? listBySalary(where, salarySort, skip, pageSize)
      : prisma.vacancy.findMany({
          where,
          include: LIST_INCLUDE,
          orderBy: DATE_ORDER,
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

export async function getVacancyBySlug(slug: string) {
  const vacancy = await prisma.vacancy.findUnique({
    where: { slug },
    include: {
      company: {
        include: { reviews: { where: { status: "approved" }, select: { rating: true } } },
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
