import { fetchCategories, fetchRegions } from "../../lib/api.js";
import { fetchSalaryStats } from "../../lib/apiExtra.js";

/**
 * Maosh statistikasi server tomonda yuklanadi — sahifa qidiruv tizimlariga
 * tayyor raqamlar bilan boradi (bu sahifaning butun qiymati shunda).
 */
export async function data(pageContext: { urlParsed: { search: Record<string, string> } }) {
  const s = pageContext.urlParsed.search;
  const params = { categorySlug: s.categorySlug, area: s.area };

  const [stats, categories, regions] = await Promise.all([
    fetchSalaryStats(params),
    fetchCategories(),
    fetchRegions(),
  ]);

  return { stats, categories, regions, params };
}
