import type { PageContext } from "vike/types";
import { messagesFor } from "../../../lib/i18n/messagesFor.js";

export default (pageContext: PageContext) => {
  const t = messagesFor(pageContext);
  const data = pageContext.data as { params?: { text?: string } } | undefined;
  const text = data?.params?.text;
  return text ? t.meta.searchQuery(text).title : t.meta.searchAll.title;
};
