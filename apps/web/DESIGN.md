# Dizayn tizimi — "Osmon indigo" (v3)

> 2026-08-31. Foydalanuvchi tasdiqlagan referens (havorang osmon + Toshkent
> silueti + indigo aksentlar) asosida to'liq qayta ishlangan identitet.
> Referens artefakt sifatida ham saqlangan (Claude Design canvas).

## Palitra (barchasi global.css tokenlari orqali)

| | Kunduzgi | Tungi |
|---|---|---|
| Fon (`paper`) | `#F4F8FE` havorang-oq | `#0B0F1A` to'q ko'k-ko'mir |
| Karta (`surface`) | `#FFFFFF` | `#121828` |
| Tugma (`signal`) | `#4F46E5` indigo — oq matn 6:1 | `#6366F1` — oq matn 4.9:1 |
| Gradient urg'u | `#2563EB → #7C3AED → #EC4899` | yorqinroq variantlari |
| Oltin (`gold`) | `#F59E0B` — FAQAT logo "!" va yulduzlar | `#F5B82E` |
| Maosh (`growth`) | `#047857` | `#3DCE8F` |
| Xato (`danger`) | `#BE123C` | `#F47882` |

Tungi rejimda tugmalar ham indigo (oq matn) — avvalgi davrlardagi
`.dark .bg-signal` matn-flip qoidalari OLIB TASHLANGAN.

## Tipografika

- **Display:** Plus Jakarta Sans (variable, self-hosted; latin + latin-ext,
  bazaviy kirill yo'q — ruscha sarlavhalar Inter'ga tushadi)
- **Body:** Inter · **Data/mono:** JetBrains Mono
- `npm run fonts:sync`; @fontsource CSS'ini to'g'ridan-to'g'ri import qilmang.

## Imzo-elementlar

- Header — **suzuvchi oq karta** (sticky, rounded-2xl, blur), aktiv nav —
  indigo ostki chiziq (`.nav-underline-active`).
- Bosh sahifa hero: chapda badge ("#1 platforma") + gradient `qayerda?`
  (`.text-shine`) + indigo qidiruv paneli + **rangli ikonkali kategoriya
  chiplari** (CHIP_HUES, index sahifasida); o'ngda `public/hero-cutout.webp`
  (yigit + minora + o'sish strelkasi, FONI SHAFFOF — bitta rasm ikkala
  rejimga singiydi; tungi rejimda `.dark .hero-photo` biroz xiralashtiradi;
  chekkalar mask bilan singdirilgan, lg+ da).
- Statistika kartasi: pastel ikonka + raqam + rangli chiziqcha.
- "Top kompaniyalar" lentasi — jonli data'dan (companies), /companies ga.
- Mesh fon (HeroBackdrop): indigo `orb-blue` + binafsha `orb-gold` (nom
  tarixiy) + pushti `orb-rose` blob'lar + grain; butun qatlam pastga qarab
  mask bilan fonga singiydi (`.hero-backdrop`). Tungi rejimda blob'lar ancha
  yorqin (0.34–0.5 alpha) — harakat aniq seziladi. Aurora va kichik yo'ldosh
  orb'lar 2026-09-02 da olib tashlangan: ko'zga ko'rinmasdi, faqat GPU'ga
  ortiqcha blur-qatlam yuk edi.
- Scroll-progress — ko'k→binafsha→pushti gradient chiziq.
- VacancyCard hover — chapdan indigo chiziq; karta hoverlari `border-signal/40`.

## Eslatmalar

- `hero-cutout.webp` (~150KB, alpha) faqat lg+ da ko'rinadi, `loading="lazy"` —
  LCP nomzodi baribir h1 matni. Eski `hero-right.jpg` / `hero-right-dark.jpg`
  endi ishlatilmaydi (public/ da zaxira sifatida turibdi).
- i18n: `home.heroBadge`, `home.topCompanies` uch tilda qo'shilgan
  (types.ts dagi Messages tipiga ham).
- Kontrastlar tekshirilgan: dusk 4.9/6.5:1, signal tugmalar 6/4.9:1.
