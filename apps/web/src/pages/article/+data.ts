import { fetchArticles } from "../../lib/api.js";

export async function data() {
  const articles = await fetchArticles();
  return { articles };
}
