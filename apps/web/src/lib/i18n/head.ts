// +Head fayllari LocaleProvider'dan tashqarida render bo'ladi, shuning uchun
// til to'g'ridan-to'g'ri pageContext'dan olinadi (onBeforeRoute to'ldirgan).
import { usePageContext } from "vike-react/usePageContext";
import { getMessages, type Messages } from "./messages.js";
import { DEFAULT_LOCALE, LOCALES, SITE_ORIGIN, localizeHref, type Locale } from "./config.js";
import { pageLocale } from "./pageLocale.js";

export interface HrefAlternate {
  locale: Locale;
  href: string;
}

export function useHead(): {
  t: Messages;
  locale: Locale;
  canonical: string;
  alternates: HrefAlternate[];
  xDefault: string;
} {
  const pc = usePageContext();
  const { locale, pathname: logical } = pageLocale(pc);
  return {
    t: getMessages(locale),
    locale,
    canonical: `${SITE_ORIGIN}${localizeHref(logical, locale)}`,
    alternates: LOCALES.map((l) => ({ locale: l, href: `${SITE_ORIGIN}${localizeHref(logical, l)}` })),
    xDefault: `${SITE_ORIGIN}${localizeHref(logical, DEFAULT_LOCALE)}`,
  };
}
