import type { PageContext } from "vike/types";
import { messagesFor } from "../../../lib/i18n/messagesFor.js";

export default (pageContext: PageContext) => {
  const data = pageContext.data as { title?: string; companyName?: string } | undefined;
  if (!data?.title) return messagesFor(pageContext).meta.notFound.title;
  return `${data.title} — ${data.companyName ?? ""} | ISH BOR!`;
};
