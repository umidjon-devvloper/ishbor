import React from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { useHead } from "../../../lib/i18n/head.js";
import { localizeHref, SITE_ORIGIN as ORIGIN } from "../../../lib/i18n/config.js";
import { JsonLd } from "../../../components/JsonLd.js";

export default function Head() {
  const { company } = useData<Awaited<ReturnType<typeof data>>>();
  const { canonical, locale, t } = useHead();
  const description = (company.description || company.name).slice(0, 155);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.search.breadcrumbHome, item: `${ORIGIN}${localizeHref("/", locale)}` },
      { "@type": "ListItem", position: 2, name: t.companies.breadcrumb, item: `${ORIGIN}${localizeHref("/companies", locale)}` },
      { "@type": "ListItem", position: 3, name: company.name, item: canonical },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Organization",
    name: company.name,
    description: company.description || company.name,
    address: {
      "@type": "PostalAddress",
      addressLocality: company.regionName ?? "O'zbekiston",
      addressCountry: "UZ",
    },
    ...(company.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: company.rating,
            reviewCount: company.reviewCount,
          },
        }
      : {}),
  };

  return (
    <>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={company.name} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />
    </>
  );
}
