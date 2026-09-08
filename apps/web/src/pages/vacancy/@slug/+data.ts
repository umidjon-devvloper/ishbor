import { render } from "vike/abort";
import { fetchVacancy } from "../../../lib/api.js";

export async function data(pageContext: { routeParams: { slug: string } }) {
  const vacancy = await fetchVacancy(pageContext.routeParams.slug);
  if (!vacancy) throw render(404);
  return vacancy;
}
