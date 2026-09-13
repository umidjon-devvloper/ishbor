import type { PageContext } from "vike/types";
import { messagesFor } from "../../lib/i18n/messagesFor.js";
import { VACANCY_NOT_FOUND } from "../../lib/vacancies/detail.js";
import { COMPANY_NOT_FOUND } from "../../lib/companies/detail.js";

export default (pageContext: PageContext) => {
  const t = messagesFor(pageContext);
  const reason = (pageContext as { abortReason?: unknown }).abortReason;
  if (reason === VACANCY_NOT_FOUND) return `${t.vacancyDetail.states.notFoundTitle} | ISH BOR!`;
  if (reason === COMPANY_NOT_FOUND) return `${t.companyDetail.states.notFoundTitle} | ISH BOR!`;
  return t.meta.notFound.title;
};
