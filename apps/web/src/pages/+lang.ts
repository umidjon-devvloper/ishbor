import type { PageContext } from "vike/types";
import { DEFAULT_LOCALE, isLocale } from "../lib/i18n/config.js";

// <html lang> ni server tomonda til bo'yicha o'rnatadi (SSR'da to'g'ri bo'lishi uchun).
export default (pageContext: PageContext): string =>
  isLocale(pageContext.locale) ? pageContext.locale : DEFAULT_LOCALE;
