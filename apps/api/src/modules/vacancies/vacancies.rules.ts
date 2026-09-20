import { prisma } from "../../common/prisma.js";
import { AppError } from "../../common/errors.js";

export const WORKPLACE_VALUES = ["office", "hybrid", "remote"] as const;
export type WorkplaceValue = (typeof WORKPLACE_VALUES)[number];

/** Zod xatosi bilan bir xil ko'rinish: `maydon: xabar` (frontend maydonni aniqlay oladi). */
const invalid = (field: string, message: string) => new AppError(400, "VALIDATION_ERROR", `${field}: ${message}`);

export interface VacancyPlacement {
  categoryId?: string | null;
  regionId?: string | null;
  workplaceType?: string | null;
}

/** Ish joylashuviga oid maydonlar — so'rov tanasidan yoki bazadagi yozuvdan. */
export interface WorkplaceFields {
  workplaceType?: string | null;
  employmentType?: string | null;
}

/**
 * Yakuniy ish joylashuvi: yuborilgan qiymat → bazadagi qiymat → eski e'londa (maydon yo'q) yakuniy bandlik
 * turi "remote" bo'lsa masofaviy. PUT va PATCH /status bir xil qoidani ishlatadi: ilgari PUT'da fallback
 * yo'q edi va eski masofaviy e'lonni qisman tahrirlash 400 `workplaceType` berardi (audit PHASE 6, U18).
 */
export function effectiveWorkplaceType(body: WorkplaceFields, stored: WorkplaceFields): string | null {
  const employmentType = body.employmentType ?? stored.employmentType ?? null;
  return body.workplaceType ?? stored.workplaceType ?? (employmentType === "remote" ? "remote" : null);
}

/**
 * Vakansiya joylashuvi qoidasi — yaratishda ham, tahrirlashda ham YAKUNIY qiymatlar bo'yicha:
 * - kategoriya majburiy;
 * - ish joylashuvi (ofisda / gibrid / masofaviy) majburiy;
 * - hudud majburiy, masofaviy ishda — ixtiyoriy.
 * Kategoriya va hudud bazada borligi ham tekshiriladi (mavjud bo'lmagan ID saqlanmasin).
 */
export async function assertVacancyPlacement(p: VacancyPlacement): Promise<void> {
  if (!p.categoryId) throw invalid("categoryId", "Kategoriyani tanlang");
  if (!p.workplaceType) throw invalid("workplaceType", "Ish joylashuvini tanlang");
  if (p.workplaceType !== "remote" && !p.regionId) throw invalid("regionId", "Hududni tanlang");

  const [category, region] = await Promise.all([
    prisma.vacancyCategory.findUnique({ where: { id: p.categoryId }, select: { id: true } }),
    p.regionId ? prisma.region.findUnique({ where: { id: p.regionId }, select: { id: true } }) : Promise.resolve(null),
  ]);
  if (!category) throw invalid("categoryId", "Kategoriya topilmadi");
  if (p.regionId && !region) throw invalid("regionId", "Hudud topilmadi");
}
