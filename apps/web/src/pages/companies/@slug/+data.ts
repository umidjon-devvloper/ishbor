import { render } from "vike/abort";
import { ApiError, fetchCompanyDetail, fetchSimilarCompanies } from "../../../lib/api.js";
import { COMPANY_NOT_FOUND } from "../../../lib/companies/detail.js";
import { SIMILAR_COMPANIES_LIMIT, type CompanyDetailData } from "../../../lib/companies/useCompanyDetail.js";

/**
 * Kompaniya + o'xshashlar parallel. Topilmasa — haqiqiy 404 (`_error`
 * kompaniyaga xos holatni chizadi). API xatosi sahifani yiqitmaydi:
 * `company: null` qaytadi va sahifa "Qayta urinish" holatini ko'rsatadi.
 */
export async function data(pageContext: { routeParams: { slug: string } }): Promise<CompanyDetailData> {
  const { slug } = pageContext.routeParams;
  const [detail, similar] = await Promise.all([
    fetchCompanyDetail(slug).then(
      (company) => ({ company, failed: false }),
      (error: unknown) => {
        if (error instanceof ApiError) return { company: null, failed: true };
        throw error;
      }
    ),
    fetchSimilarCompanies(slug, SIMILAR_COMPANIES_LIMIT),
  ]);
  if (!detail.failed && !detail.company) throw render(404, COMPANY_NOT_FOUND);
  return { slug, company: detail.company, similar: detail.company ? similar : [] };
}
