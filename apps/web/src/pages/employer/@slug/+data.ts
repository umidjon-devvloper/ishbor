import { render } from "vike/abort";
import { fetchCompany } from "../../../lib/api.js";

export async function data(pageContext: { routeParams: { slug: string } }) {
  const result = await fetchCompany(pageContext.routeParams.slug);
  if (!result) throw render(404);
  return result;
}
