import React from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { Seo } from "../../../components/Seo.js";
import { JsonLd } from "../../../components/JsonLd.js";
import { useHead } from "../../../lib/i18n/head.js";
import { localizeHref, SITE_ORIGIN as ORIGIN } from "../../../lib/i18n/config.js";

export default function Head() {
  const { t, canonical, locale } = useHead();
  const d = useData<Awaited<ReturnType<typeof data>>>();
  const meta = d.params.text ? t.meta.searchQuery(d.params.text) : t.meta.searchAll;

  // SSR'dagi boshlang'ich ro'yxat — Google natijalar sonini va tuzilmani ko'radi
  const listLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: d.total,
    itemListElement: d.items.slice(0, 10).map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.title,
      url: `${ORIGIN}${localizeHref(`/vacancy/${v.slug}`, locale)}`,
    })),
  };

  return (
    <>
      <Seo title={meta.title} description={meta.description} canonical={canonical} />
      <JsonLd data={listLd} />
    </>
  );
}
