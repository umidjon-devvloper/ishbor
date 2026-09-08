import React from "react";
import { useData } from "vike-react/useData";
import type { data } from "./+data.js";
import { useHead } from "../../../lib/i18n/head.js";
import { localizeHref, SITE_ORIGIN as ORIGIN } from "../../../lib/i18n/config.js";
import { API_URL } from "../../../lib/api.js";
import { JsonLd } from "../../../components/JsonLd.js";

const EMPLOYMENT_SCHEMA: Record<string, string> = {
  full_time: "FULL_TIME",
  part_time: "PART_TIME",
  remote: "FULL_TIME",
  shift: "OTHER",
};

export default function Head() {
  const vacancy = useData<Awaited<ReturnType<typeof data>>>();
  const { canonical, locale, t } = useHead();
  const description = (vacancy.description || vacancy.title).slice(0, 155);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.search.breadcrumbHome, item: `${ORIGIN}${localizeHref("/", locale)}` },
      { "@type": "ListItem", position: 2, name: t.search.breadcrumbVacancies, item: `${ORIGIN}${localizeHref("/search/vacancy", locale)}` },
      { "@type": "ListItem", position: 3, name: vacancy.title, item: canonical },
    ],
  };

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: vacancy.title,
    description: vacancy.description || vacancy.title,
    datePosted: vacancy.publishedAt ?? new Date().toISOString(),
    employmentType: EMPLOYMENT_SCHEMA[vacancy.employmentType] ?? "OTHER",
    hiringOrganization: { "@type": "Organization", name: vacancy.companyName },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: vacancy.regionName ?? "O'zbekiston",
        addressCountry: "UZ",
      },
    },
    ...(vacancy.salaryMin || vacancy.salaryMax
      ? {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "UZS",
            value: {
              "@type": "QuantitativeValue",
              minValue: vacancy.salaryMin,
              maxValue: vacancy.salaryMax,
              unitText: "MONTH",
            },
          },
        }
      : {}),
  };

  return (
    <>
      {/*
        og:image — har bir vakansiya uchun dinamik rasm (backend /api/og/vacancy/:slug).
        Manzil `VITE_API_URL` dan olinadi: ilgari bu yerda backend domeni qattiq
        yozilgan edi va boshqa manzilga deploy qilinsa Telegram/Facebook
        preview'lari bo'sh chiqardi. Bu botlar tashqi internetdan kirgani uchun
        localhost'da preview baribar ko'rinmaydi — bu kutilgan holat.
      */}
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={`${vacancy.title} — ${vacancy.companyName}`} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${API_URL}/api/og/vacancy/${vacancy.slug}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbLd} />
    </>
  );
}
