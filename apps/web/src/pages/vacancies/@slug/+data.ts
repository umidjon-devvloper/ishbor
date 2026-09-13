import { render } from "vike/abort";
import { ApiError, fetchSimilarVacancies, fetchVacancyDetail } from "../../../lib/api.js";
import { VACANCY_NOT_FOUND } from "../../../lib/vacancies/detail.js";
import { SIMILAR_LIMIT, type VacancyDetailData } from "../../../lib/vacancies/useVacancyDetail.js";

/**
 * Vakansiya + o'xshashlar parallel. Topilmasa — haqiqiy 404 (`_error` sahifasi
 * vakansiyaga xos holatni chizadi). API xatosi sahifani yiqitmaydi:
 * `vacancy: null` qaytadi va sahifa "Qayta urinish" holatini ko'rsatadi.
 */
export async function data(pageContext: { routeParams: { slug: string } }): Promise<VacancyDetailData> {
  const { slug } = pageContext.routeParams;
  const [detail, similar] = await Promise.all([
    fetchVacancyDetail(slug).then(
      (vacancy) => ({ vacancy, failed: false }),
      (error: unknown) => {
        if (error instanceof ApiError) return { vacancy: null, failed: true };
        throw error;
      }
    ),
    fetchSimilarVacancies(slug, SIMILAR_LIMIT),
  ]);
  if (!detail.failed && !detail.vacancy) throw render(404, VACANCY_NOT_FOUND);
  return { slug, vacancy: detail.vacancy, similar: detail.vacancy ? similar : [] };
}
