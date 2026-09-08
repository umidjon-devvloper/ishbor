import type { PageContext } from "vike/types";
import { messagesFor } from "../../../lib/i18n/messagesFor.js";

export default (pageContext: PageContext) => {
  const data = pageContext.data as { company?: { name?: string } } | undefined;
  return data?.company?.name
    ? `${data.company.name} — vakansiyalar va ma'lumot | ISH BOR!`
    : messagesFor(pageContext).meta.notFound.title;
};
