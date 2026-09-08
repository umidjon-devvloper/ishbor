import { fetchCompanies } from "../../lib/api.js";

export async function data() {
  const companies = await fetchCompanies();
  return { companies };
}
