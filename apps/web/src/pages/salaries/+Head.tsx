import React from "react";
import { Seo } from "../../components/Seo.js";
import { useHead } from "../../lib/i18n/head.js";

// Maosh statistikasi — ochiq va indekslanadigan sahifa (SEO uchun qimmatli).
export default function Head() {
  const { t, canonical } = useHead();
  return (
    <Seo
      title={t.metaExtra.salaries.title}
      description={t.metaExtra.salaries.description}
      canonical={canonical}
    />
  );
}
