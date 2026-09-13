import React from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { Seo } from "../../components/Seo.js";
import { JsonLd } from "../../components/JsonLd.js";
import { useHead } from "../../lib/i18n/head.js";
import { localizeHref, SITE_ORIGIN as ORIGIN } from "../../lib/i18n/config.js";

export default function Head() {
  const { t, canonical, locale } = useHead();
  const d = useData<Awaited<ReturnType<typeof data>>>();
  const q = new URLSearchParams(d.key).get("q") ?? "";
  const meta = q ? t.meta.searchQuery(q) : t.meta.searchAll;
  const items = d.page?.items ?? [];

  // SSR'dagi joriy sahifa — Google natijalar sonini va tuzilmani ko'radi
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: d.page?.total ?? 0,
    itemListElement: items.slice(0, 10).map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.title,
      url: `${ORIGIN}${localizeHref(`/vacancies/${v.slug}`, locale)}`,
    })),
  };

  return (
    <>
      <Seo title={meta.title} description={meta.description} canonical={canonical} />
      {items.length > 0 && <JsonLd data={listLd} />}
    </>
  );
}
