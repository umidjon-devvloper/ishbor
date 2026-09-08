import { fetchVacancies, type VacancyQuery } from "../../../lib/api.js";

const SORTS = ["relevance", "date", "salary_desc", "salary_asc"] as const;

function parseSort(value: string | undefined): VacancyQuery["sort"] {
  return SORTS.includes(value as (typeof SORTS)[number])
    ? (value as VacancyQuery["sort"])
    : undefined;
}

export async function data(pageContext: { urlParsed: { search: Record<string, string> } }) {
  const s = pageContext.urlParsed.search;
  // `sort` ham o'qiladi: sahifa uni URL'ga yozadi, demak ulashilgan yoki
  // xatcho'pga olingan havola ochilganda ham o'sha tartibda ko'rinishi kerak.
  const params: VacancyQuery = {
    text: s.text,
    categorySlug: s.categorySlug,
    area: s.area,
    experience: s.experience,
    employment: s.employment,
    salary: s.salary,
    salaryTo: s.salaryTo,
    sort: parseSort(s.sort),
  };
  const { items, total } = await fetchVacancies(params);
  return { items, total, params };
}
