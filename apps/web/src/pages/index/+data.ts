import { fetchStats, fetchVacancies, fetchCompanies } from "../../lib/api.js";

export async function data() {
  const [stats, vacancies, companies] = await Promise.all([
    fetchStats(),
    fetchVacancies(),
    fetchCompanies(),
  ]);
  return {
    stats,
    vacancies: vacancies.items.slice(0, 6),
    companies: companies.slice(0, 4),
  };
}
