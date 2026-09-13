import { fetchVacancyFacets, fetchVacancyPage } from "../../lib/api.js";
import { parseVacancyQuery, queryKey, toApiParams, toFacetParams } from "../../lib/vacancies/query.js";
import type { VacancyFacets, VacancyPage } from "../../lib/types.js";

/**
 * Ro'yxat va filtr sonlari server tomonda — sahifa qidiruv tizimlariga tayyor
 * natijalar bilan boradi. Filtr/sahifa o'zgarganda Vike shu hookni qayta
 * chaqiradi (sahifa qayta yuklanmaydi, oraliq navigatsiyalar chizilmaydi).
 *
 * `page: null` — server javob bermadi (xato holati, brauzer qayta urinadi);
 * bo'sh natija esa `page.items.length === 0`.
 */
export async function data(pageContext: { urlParsed: { search: Record<string, string> } }) {
  const query = parseVacancyQuery(pageContext.urlParsed.search);
  const [page, facets] = await Promise.all([
    fetchVacancyPage(toApiParams(query)).catch((): VacancyPage | null => null),
    fetchVacancyFacets(toFacetParams(query)).catch((): VacancyFacets | null => null),
  ]);
  return { key: queryKey(query), page, facets };
}
