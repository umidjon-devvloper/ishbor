import React, { useCallback, useRef, useState } from "react";
import type { Company } from "../../../lib/types.js";
import type { CompanyDetailVM, CompanyReviewVM } from "../../../lib/companies/detail.js";
import { useT } from "../../../lib/i18n/index.js";
import { useShare } from "../../../lib/useShare.js";
import { useCompanyTab, type CompanyTab } from "../../../lib/companies/useCompanyTab.js";
import { VacancyTabs, panelId, tabId, type DetailTab } from "../../vacancies/detail/VacancyTabs.js";
import { CompanyDetailHeader } from "./CompanyDetailHeader.js";
import { CompanyOverview } from "./CompanyOverview.js";
import { CompanyPhotosGrid, CompanyPhotosSection } from "./CompanyPhotos.js";
import { CompanyVacancies } from "./CompanyVacancies.js";
import { CompanyReviews } from "./CompanyReviews.js";
import { CompanyIndustries, CompanyLocation, CompanyWebsite, SimilarCompanies } from "./CompanySidebar.js";

const TABS_ID = "company";
const PREVIEW_VACANCIES = 3;
const PREVIEW_REVIEWS = 2;

/**
 * Ochiq kompaniya profili. Layout ma'lumotga qarab o'zgaradi: tavsif, rasm,
 * sharh, sayt, hudud, soha yoki o'xshash kompaniya yo'q bo'lsa — o'sha blok
 * (va tab) yo'q; yon ustun bo'sh bo'lsa asosiy ustun butun kenglikni oladi.
 * Tab URL'da (`?tab=`), almashtirish ma'lumotni qayta yuklamaydi.
 */
export function CompanyDetailView({ company, similar }: { company: CompanyDetailVM; similar: Company[] }) {
  const t = useT();
  const d = t.companyDetail;
  const { share, notice } = useShare();
  const [reviews, setReviews] = useState<CompanyReviewVM[]>(company.reviews);
  const tabsRef = useRef<HTMLDivElement>(null);

  const available: CompanyTab[] = ["overview", "vacancies"];
  if (reviews.length > 0) available.push("reviews");
  if (company.images.length > 0) available.push("photos");
  const [tab, setTab] = useCompanyTab(available);

  const tabs: DetailTab[] = available.map((id) => ({
    id,
    label:
      id === "overview"
        ? d.tabs.overview
        : id === "vacancies"
          ? d.tabs.vacancies(company.vacancies.length)
          : id === "reviews"
            ? d.tabs.reviews(reviews.length)
            : d.tabs.photos(company.images.length),
  }));

  const openTab = useCallback(
    (next: CompanyTab) => {
      setTab(next);
      const el = tabsRef.current;
      if (el && el.getBoundingClientRect().top < 80) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setTab]
  );

  const onShare = useCallback(() => {
    void share({ title: company.name, url: `${window.location.origin}${window.location.pathname}` });
  }, [share, company.name]);

  const hasSidebar = Boolean(company.website || company.regionName || company.industries.length || similar.length);

  const panel = (id: CompanyTab, content: React.ReactNode) => (
    <div
      key={id}
      role="tabpanel"
      id={panelId(TABS_ID, id)}
      aria-labelledby={tabId(TABS_ID, id)}
      hidden={tab !== id}
      tabIndex={0}
      className="space-y-6 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-4 focus-visible:ring-offset-paper"
    >
      {tab === id ? content : null}
    </div>
  );

  return (
    <>
      <div className="mt-5">
        <CompanyDetailHeader company={company} reviews={reviews} onShare={onShare} />

        <div ref={tabsRef} className="mt-4 scroll-mt-24 rounded-3xl border border-line bg-surface shadow-card">
          <VacancyTabs tabs={tabs} active={tab} onChange={(id) => openTab(id as CompanyTab)} idPrefix={TABS_ID} label={d.tabs.label} />
        </div>

        <div className={`mt-6 grid grid-cols-1 gap-6 ${hasSidebar ? "lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]" : ""}`}>
          <div className="min-w-0">
            {panel(
              "overview",
              <>
                <CompanyOverview company={company} />
                <CompanyPhotosSection images={company.images} companyName={company.name} onShowAll={() => openTab("photos")} />
                <CompanyVacancies vacancies={company.vacancies} limit={PREVIEW_VACANCIES} onShowAll={() => openTab("vacancies")} />
                <CompanyReviews slug={company.slug} reviews={reviews} onChange={setReviews} limit={PREVIEW_REVIEWS} onShowAll={() => openTab("reviews")} />
              </>
            )}
            {panel("vacancies", <CompanyVacancies vacancies={company.vacancies} />)}
            {reviews.length > 0 && panel("reviews", <CompanyReviews slug={company.slug} reviews={reviews} onChange={setReviews} />)}
            {company.images.length > 0 && panel("photos", <CompanyPhotosGrid images={company.images} companyName={company.name} />)}
          </div>

          {hasSidebar && (
            <aside className="min-w-0 space-y-6">
              <CompanyWebsite company={company} />
              <CompanyLocation company={company} />
              <CompanyIndustries company={company} />
              <SimilarCompanies items={similar} />
            </aside>
          )}
        </div>
      </div>

      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-8 z-[70] flex justify-center px-4">
        {notice && (
          <span className="animate-pop rounded-xl bg-ink px-4 py-2.5 text-[13.5px] font-semibold text-paper shadow-pop">
            {notice === "copied" ? d.actions.copied : d.actions.copyFailed}
          </span>
        )}
      </div>
    </>
  );
}
