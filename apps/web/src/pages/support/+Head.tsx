import React from "react";
import { Seo } from "../../components/Seo.js";
import { JsonLd } from "../../components/JsonLd.js";
import { useHead } from "../../lib/i18n/head.js";

export default function Head() {
  const { t, canonical } = useHead();

  // Google "People also ask" bloklari uchun — savollar sahifadagi FAQ bilan bir xil
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.support.faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <Seo title={t.meta.support.title} description={t.meta.support.description} canonical={canonical} />
      <JsonLd data={faqLd} />
    </>
  );
}
