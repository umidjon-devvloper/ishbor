import React from "react";
import { usePageContext } from "vike-react/usePageContext";
import { Seo } from "../../components/Seo.js";
import { useHead } from "../../lib/i18n/head.js";
import { VACANCY_NOT_FOUND } from "../../lib/vacancies/detail.js";
import { COMPANY_NOT_FOUND } from "../../lib/companies/detail.js";

export default function Head() {
  const { t } = useHead();
  const pageContext = usePageContext();
  const reason = (pageContext as { abortReason?: unknown }).abortReason;
  if (reason === VACANCY_NOT_FOUND) {
    const s = t.vacancyDetail.states;
    return <Seo title={s.notFoundTitle} description={s.notFoundText} noindex />;
  }
  if (reason === COMPANY_NOT_FOUND) {
    const s = t.companyDetail.states;
    return <Seo title={s.notFoundTitle} description={s.notFoundText} noindex />;
  }
  return <Seo title={t.meta.notFound.title} description={t.meta.notFound.description} noindex />;
}
