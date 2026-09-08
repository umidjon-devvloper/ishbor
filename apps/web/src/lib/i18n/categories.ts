import type { Locale } from "./config.js";

// Bosh sahifadagi mashhur kategoriyalar (slug + taxminiy son). Nomi tarjima qilinadi.
export const CATEGORIES: { slug: string; count: number }[] = [
  { slug: "it", count: 1207 },
  { slug: "savdo", count: 2759 },
  { slug: "marketing", count: 2149 },
  { slug: "moliya", count: 932 },
  { slug: "qurilish", count: 729 },
  { slug: "turizm", count: 832 },
];

export const CATEGORY_NAMES: Record<Locale, Record<string, string>> = {
  uz: {
    it: "Axborot texnologiyalari",
    savdo: "Savdo, mijozlarga xizmat",
    marketing: "Marketing, reklama",
    moliya: "Moliya, buxgalteriya",
    qurilish: "Qurilish, ko'chmas mulk",
    turizm: "Turizm, mehmonxonalar",
  },
  ru: {
    it: "Информационные технологии",
    savdo: "Продажи, обслуживание клиентов",
    marketing: "Маркетинг, реклама",
    moliya: "Финансы, бухгалтерия",
    qurilish: "Строительство, недвижимость",
    turizm: "Туризм, гостиницы",
  },
  en: {
    it: "Information technology",
    savdo: "Sales, customer service",
    marketing: "Marketing, advertising",
    moliya: "Finance, accounting",
    qurilish: "Construction, real estate",
    turizm: "Tourism, hospitality",
  },
};
