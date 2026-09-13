import { fetchCompanyPage, fetchFeaturedCompanies, type CompanyPage } from "../../lib/api.js";
import { PAGE_SIZE, parseCompanyQuery, queryKey, toSearchParams } from "../../lib/companies/query.js";

/**
 * Birinchi sahifa serverda olinadi (SEO va tez birinchi ko'rinish), keyingilari
 * brauzerda cursor bilan. Filtr o'zgarganda Vike shu hookni qayta chaqiradi.
 *
 * - `saved=1` — token faqat brauzerda, shuning uchun bu holatda ro'yxat
 *   brauzerda olinadi (`first: null`).
 * - Server xatosida ham `first: null` — brauzer bir marta qayta urinadi,
 *   bo'lmasa xato holati ko'rsatiladi.
 * - "Top kompaniyalar" filtrga bog'liq emas: sahifa ichidagi navigatsiyada
 *   qayta so'ralmaydi (sahifa oldingisini saqlaydi).
 */
export async function data(pageContext: { urlParsed: { search: Record<string, string> }; isClientSideNavigation?: boolean }) {
  const query = parseCompanyQuery(pageContext.urlParsed.search);
  const [first, featured] = await Promise.all([
    query.saved
      ? Promise.resolve(null)
      : fetchCompanyPage(toSearchParams(query), { limit: PAGE_SIZE }).catch((): CompanyPage | null => null),
    pageContext.isClientSideNavigation ? Promise.resolve(null) : fetchFeaturedCompanies(),
  ]);
  return { key: queryKey(query), first, featured };
}
