// +title.ts kabi React bo'lmagan joylar uchun: pageContext'dan til lug'atini oladi.
import { getMessages, type Messages } from "./messages.js";

export function messagesFor(pageContext: { locale?: unknown }): Messages {
  return getMessages(pageContext.locale);
}
