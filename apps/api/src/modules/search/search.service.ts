import { Meilisearch, type Index } from "meilisearch";
import { prisma } from "../../common/prisma.js";
import { env, features } from "../../common/env.js";

/**
 * Vakansiya qidiruvi — ikki drayverli.
 *
 *  1. **Meilisearch** (MEILI_HOST .env'da bo'lsa): xato yozilishga chidamli
 *     ("dasturchu" -> "dasturchi"), so'z shakllariga bardoshli, tez.
 *  2. **PostgreSQL** (default): qo'shimcha xizmatsiz ishlaydi. So'rov so'zlarga
 *     bo'linadi va har bir so'z sarlavha / tavsif / kompaniya nomi / kategoriya
 *     ichida uchrashi talab qilinadi (AND mantiq).
 *
 * Meilisearch ko'tarilmagan bo'lsa yoki so'rov paytida xato bersa — kod jimgina
 * PostgreSQL drayveriga tushadi, sayt hech qachon "qidiruv ishlamayapti" holatiga
 * tushmaydi.
 */

const INDEX_UID = env.MEILI_INDEX;

let client: Meilisearch | null = null;
let indexReady = false;
/** Meili qulab tushsa qayta-qayta urinmaslik uchun bayroq. */
let meiliBroken = false;

function getClient(): Meilisearch | null {
  if (!features.meilisearch || meiliBroken) return null;
  if (!client) {
    client = new Meilisearch({
      host: env.MEILI_HOST,
      ...(env.MEILI_API_KEY ? { apiKey: env.MEILI_API_KEY } : {}),
    });
  }
  return client;
}

export function isSearchEngineEnabled(): boolean {
  return getClient() !== null;
}

async function getIndex(): Promise<Index | null> {
  const c = getClient();
  if (!c) return null;
  try {
    if (!indexReady) {
      await c.createIndex(INDEX_UID, { primaryKey: "id" }).catch(() => undefined);
      const created = c.index(INDEX_UID);
      await created.updateSettings({
        searchableAttributes: ["title", "companyName", "categoryName", "description", "requirements"],
        filterableAttributes: [
          "status",
          "categorySlug",
          "regionSlug",
          "employmentType",
          "experienceRequired",
          "salaryMin",
        ],
        sortableAttributes: ["publishedAt", "salaryMin", "isPremium"],
        // Sarlavhadagi moslik tavsifdagidan muhimroq
        rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness"],
      });
      indexReady = true;
    }
    return c.index(INDEX_UID);
  } catch (e) {
    console.warn("[search] Meilisearch indeksini tayyorlab bo'lmadi:", (e as Error).message);
    meiliBroken = true;
    return null;
  }
}

interface VacancyDoc {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string;
  companyName: string;
  companySlug: string;
  categoryName: string;
  categorySlug: string;
  regionName: string;
  regionSlug: string;
  employmentType: string;
  experienceRequired: string;
  salaryMin: number;
  salaryMax: number;
  isPremium: boolean;
  status: string;
  publishedAt: number;
}

interface IndexableVacancy {
  id: string;
  slug: string;
  title: string;
  description: string;
  requirements: string | null;
  status: string;
  employmentType: string;
  experienceRequired: string;
  salaryMin: number | null;
  salaryMax: number | null;
  isPremium: boolean;
  publishedAt: Date | null;
  company: { name: string; slug: string } | null;
  category: { name: string; slug: string } | null;
  region: { name: string; slug: string } | null;
}

function toDoc(v: IndexableVacancy): VacancyDoc {
  return {
    id: v.id,
    slug: v.slug,
    title: v.title,
    description: v.description.slice(0, 4000),
    requirements: (v.requirements ?? "").slice(0, 2000),
    companyName: v.company?.name ?? "",
    companySlug: v.company?.slug ?? "",
    categoryName: v.category?.name ?? "",
    categorySlug: v.category?.slug ?? "",
    regionName: v.region?.name ?? "",
    regionSlug: v.region?.slug ?? "",
    employmentType: v.employmentType,
    experienceRequired: v.experienceRequired,
    salaryMin: v.salaryMin ?? 0,
    salaryMax: v.salaryMax ?? 0,
    isPremium: v.isPremium,
    status: v.status,
    publishedAt: v.publishedAt ? v.publishedAt.getTime() : 0,
  };
}

const DOC_INCLUDE = {
  company: { select: { name: true, slug: true } },
  category: { select: { name: true, slug: true } },
  region: { select: { name: true, slug: true } },
} as const;

/** Bitta vakansiyani indeksga yozadi (yaratilgan/tahrirlangan paytda chaqiriladi). */
export async function indexVacancy(vacancyId: string): Promise<void> {
  const index = await getIndex();
  if (!index) return;
  try {
    const v = await prisma.vacancy.findUnique({ where: { id: vacancyId }, include: DOC_INCLUDE });
    if (!v) return;
    if (v.status !== "active") {
      await index.deleteDocument(vacancyId);
      return;
    }
    await index.addDocuments([toDoc(v as IndexableVacancy)]);
  } catch (e) {
    console.warn("[search] indekslash xatosi:", (e as Error).message);
  }
}

export async function removeVacancyFromIndex(vacancyId: string): Promise<void> {
  const index = await getIndex();
  if (!index) return;
  await index.deleteDocument(vacancyId).catch(() => undefined);
}

/** Barcha faol vakansiyalarni qaytadan indekslaydi (admin buyrug'i). */
export async function reindexAll(): Promise<{ indexed: number; engine: string }> {
  const index = await getIndex();
  if (!index) return { indexed: 0, engine: "mongodb" };

  const all = await prisma.vacancy.findMany({ where: { status: "active" }, include: DOC_INCLUDE });
  await index.deleteAllDocuments().catch(() => undefined);
  if (all.length > 0) {
    await index.addDocuments(all.map((v) => toDoc(v as IndexableVacancy)));
  }
  return { indexed: all.length, engine: "meilisearch" };
}

export interface EngineQuery {
  text: string;
  categorySlug?: string;
  area?: string;
  experience?: string;
  employment?: string;
  salary?: number;
  salaryTo?: number;
  offset: number;
  limit: number;
}

/**
 * Meilisearch orqali qidiradi. Natija — ID'lar (tartibi relevantlik bo'yicha).
 * Meili yo'q/xato bo'lsa `null` qaytadi va chaqiruvchi PostgreSQL'ga tushadi.
 */
export async function searchVacancyIds(
  query: EngineQuery
): Promise<{ ids: string[]; total: number } | null> {
  const index = await getIndex();
  if (!index) return null;

  const filters: string[] = ['status = "active"'];
  // Hudud, tajriba va bandlik — bitta qiymat yoki vergul bilan bir nechtasi
  const oneOf = (field: string, value: string | undefined) => {
    const list = (value ?? "").split(",").map((v) => v.trim()).filter(Boolean);
    if (list.length) filters.push(`${field} IN [${list.map((v) => `"${escapeFilter(v)}"`).join(", ")}]`);
  };
  if (query.categorySlug) filters.push(`categorySlug = "${escapeFilter(query.categorySlug)}"`);
  oneOf("regionSlug", query.area);
  oneOf("experienceRequired", query.experience);
  oneOf("employmentType", query.employment);
  if (query.salary) filters.push(`salaryMin >= ${Math.trunc(query.salary)}`);
  if (query.salaryTo) filters.push(`salaryMin <= ${Math.trunc(query.salaryTo)}`);

  try {
    const res = await index.search(query.text, {
      filter: filters.join(" AND "),
      offset: query.offset,
      limit: query.limit,
      sort: ["isPremium:desc"],
      attributesToRetrieve: ["id"],
    });
    return {
      ids: res.hits.map((h) => (h as { id: string }).id),
      total: res.estimatedTotalHits ?? res.hits.length,
    };
  } catch (e) {
    console.warn("[search] Meilisearch so'rov xatosi, PostgreSQL'ga o'tildi:", (e as Error).message);
    return null;
  }
}

/** Meili filtr satrida qo'shtirnoq va teskari chiziqni tozalash. */
function escapeFilter(value: string): string {
  return value.replace(/["\\]/g, "");
}

/** Server ko'tarilganda indeksni fon rejimida to'ldiradi (Meili yoqilgan bo'lsa). */
export async function warmSearchIndex(): Promise<void> {
  if (!isSearchEngineEnabled()) return;
  try {
    const result = await reindexAll();
    console.log(`[search] Meilisearch indeksi tayyor: ${result.indexed} ta vakansiya`);
  } catch (e) {
    console.warn("[search] indeksni to'ldirib bo'lmadi:", (e as Error).message);
  }
}
