// Lug'at TIPLARI va umumiy yordamchilar.
//
// Matnlarning o'zi til bo'yicha alohida fayllarda: messages.uz.ts / .ru.ts / .en.ts.
// Sabab: uchala til bitta modulda bo'lganda brauzer har bir tashrifchiga
// UCHALA tilni yuklab olardi (~88 KB / 26 KB gzip). Endi faqat kerakligi keladi.
export interface BaseMessages {
  // Har sahifa uchun SEO (unikal title/description)
  meta: {
    home: { title: string; description: string };
    searchAll: { title: string; description: string };
    searchQuery: (q: string) => { title: string; description: string };
    companies: { title: string; description: string };
    employer: { title: string; description: string };
    articles: { title: string; description: string };
    login: { title: string; description: string };
    signup: { title: string; description: string };
    support: { title: string; description: string };
    contact: { title: string; description: string };
    pricing: { title: string; description: string };
    profile: { title: string; description: string };
    employerVacancies: { title: string; description: string };
    employerApplications: { title: string; description: string };
    employerCandidates: { title: string; description: string };
    messages: { title: string; description: string };
    notFound: { title: string; description: string };
  };

  nav: {
    vacancies: string;
    companies: string;
    articles: string;
    forEmployers: string;
    login: string;
    signup: string;
    logout: string;
    profile: string;
    menu: string;
    myVacancies: string;
    applications: string;
    candidates: string;
    messages: string;
    companyProfile: string;
  };

  candidatesPage: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    empty: string;
    emptyHint: string;
    selectHint: string;
    message: string;
    resultsCount: (n: number) => string;
  };

  ui: {
    theme: { toLight: string; toDark: string };
    language: string;
    loading: string;
    openMenu: string;
    closeMenu: string;
  };

  home: {
    heroBadge: string;
    topCompanies: string;
    heroTitle1: string;
    heroTitle2: string;
    heroSubtitle: string;
    searchPlaceholder: string;
    searchButton: string;
    statVacancies: string;
    statCompanies: string;
    statApplicationsToday: string;
    careerPath: { student: string; intern: string; specialist: string; lead: string };
    categoriesTitle: string;
    viewAll: string;
    latestTitle: string;
    employerCtaTitle: string;
    employerCtaDesc: string;
    employerCtaButton: string;
  };

  search: {
    breadcrumbHome: string;
    breadcrumbVacancies: string;
    titleAll: string;
    titleQuery: (q: string) => string;
    found: (n: number) => string;
    clear: string;
    salaryChip: (v: string) => string;
    emptyTitle: string;
    emptyDesc: string;
    emptyCta: string;
  };

  filters: {
    experience: string;
    jobType: string;
    salary: string;
    from: string;
    to: string;
    apply: string;
    experienceOptions: { none: string; oneToThree: string; threeToSix: string; sixPlus: string };
    scheduleOptions: { full: string; part: string; remote: string; shift: string };
  };

  vacancyCard: { premium: string; urgent: string };

  vacancy: {
    posted: string;
    contactsTitle: string;
    descriptionTitle: string;
    requirementsTitle: string;
    conditionsTitle: string;
    apply: string;
    applying: string;
    applyNote: string;
    viewAllVacancies: string;
    reviewLabel: (rating: string, count: number) => string;
    loginToApply: string;
    applied: string;
    applyError: string;
    employerCannotApply: string;
  };

  company: {
    verified: string;
    reviews: (n: number) => string;
    metaIndustry: string;
    metaRegion: string;
    metaEmployees: string;
    metaFounded: string;
    activeVacancies: (n: number) => string;
    noVacancies: string;
  };

  companies: {
    breadcrumb: string;
    title: string;
    subtitle: (n: number) => string;
    searchPlaceholder: string;
    empty: string;
  };

  telegram: {
    title: string;
    subtitle: string;
    linked: string;
    notLinked: string;
    phoneVerified: string;
    phoneNotVerified: string;
    connect: string;
    connecting: string;
    hint: string;
    refresh: string;
    gateTitle: string;
    gateMessage: string;
    gateAction: string;
  };

  reviews: {
    title: string;
    count: (n: number) => string;
    noReviews: string;
    writeReview: string;
    editReview: string;
    yourRating: string;
    commentPlaceholder: string;
    submit: string;
    submitting: string;
    saved: string;
    loginToReview: string;
    delete: string;
    deleteConfirm: string;
    ratingRequired: string;
  };

  employerLanding: {
    heroTitle1: string;
    heroHighlight: string;
    heroTitle2: string;
    heroSubtitle: string;
    heroCta: string;
    statCompanies: string;
    statResumes: string;
    benefits: { title: string; desc: string }[];
    bottomTitle: string;
    bottomDesc: string;
    bottomCta: string;
  };

  articles: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    readMinutes: (n: number) => string;
    comingSoon: string;
  };

  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    submitting: string;
    noAccount: string;
    signupLink: string;
    connError: string;
    orDivider: string;
    withTelegram: string;
    tgWaiting: string;
    tgNotLinked: string;
    tgExpired: string;
  };

  signup: {
    title: string;
    subtitle: string;
    roleSeeker: string;
    roleEmployer: string;
    firstName: string;
    lastName: string;
    companyName: string;
    companyNamePlaceholder: string;
    email: string;
    password: string;
    passwordHint: string;
    submit: string;
    submitting: string;
    haveAccount: string;
    loginLink: string;
    connError: string;
  };

  error: {
    title404: string;
    title500: string;
    desc404: string;
    desc500: string;
    backHome: string;
    viewVacancies: string;
  };

  footer: {
    tagline: string;
    seekersTitle: string;
    seekersVacancies: string;
    seekersResume: string;
    seekersSalary: string;
    seekersArticles: string;
    employersTitle: string;
    employersPost: string;
    employersBase: string;
    employersPricing: string;
    companyTitle: string;
    companyCompanies: string;
    companyContact: string;
    companySupport: string;
    rights: (year: number) => string;
  };

  support: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    faqTitle: string;
    faq: { q: string; a: string }[];
    stillTitle: string;
    stillDesc: string;
    contactButton: string;
  };

  contact: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    messagePlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    channelsTitle: string;
  };

  pricing: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    perMonth: string;
    popular: string;
    choose: string;
    plans: { name: string; price: string; features: string[] }[];
  };

  profile: {
    title: string;
    subtitle: string;
    personalSection: string;
    firstName: string;
    lastName: string;
    phone: string;
    phonePlaceholder: string;
    headline: string;
    headlinePlaceholder: string;
    region: string;
    regionPlaceholder: string;
    email: string;
    emailHint: string;
    openToWork: string;
    openToWorkHint: string;
    save: string;
    saving: string;
    saved: string;
    phoneInvalid: string;
    phoneVerified: string;
    phoneVerifyHint: string;
    additionalPhone: string;
    additionalPhonePlaceholder: string;
    resumeSection: string;
    resumeHint: string;
    upload: string;
    uploading: string;
    view: string;
    replace: string;
    remove: string;
    onlyPdf: string;
    uploadError: string;
    noResume: string;
  };

  resume: {
    sectionTitle: string;
    sectionHint: string;
    jobTitle: string;
    jobTitlePlaceholder: string;
    summary: string;
    summaryPlaceholder: string;
    desiredSalary: string;
    skills: string;
    skillsPlaceholder: string;
    experience: string;
    addExperience: string;
    position: string;
    companyName: string;
    startDate: string;
    endDate: string;
    current: string;
    descriptionLabel: string;
    education: string;
    addEducation: string;
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
    remove: string;
    save: string;
    saving: string;
    saved: string;
    emptyExperience: string;
    emptyEducation: string;
  };

  employerProfile: {
    title: string;
    subtitle: string;
    createHint: string;
    name: string;
    namePlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    website: string;
    region: string;
    regionPlaceholder: string;
    industry: string;
    industryPlaceholder: string;
    employeeCount: string;
    foundedYear: string;
    save: string;
    saving: string;
    saved: string;
    view: string;
    logo: string;
    logoHint: string;
    logoUpload: string;
    logoUploading: string;
    logoRemove: string;
    logoSaveFirst: string;
  };

  empVacancies: {
    title: string;
    subtitle: string;
    newButton: string;
    empty: string;
    applicationsCount: (n: number) => string;
    statusActive: string;
    statusArchived: string;
    close: string;
    reopen: string;
    delete: string;
    deleteConfirm: string;
    viewApplications: string;
    formTitle: string;
    fTitle: string;
    fTitlePlaceholder: string;
    fDescription: string;
    fDescriptionPlaceholder: string;
    fRequirements: string;
    fRequirementsPlaceholder: string;
    fConditions: string;
    fConditionsPlaceholder: string;
    fCategory: string;
    fRegion: string;
    fEmployment: string;
    fExperience: string;
    fSalaryMin: string;
    fSalaryMax: string;
    fContactPhone: string;
    fContacts: string;
    fContactsHint: string;
    fContactPhonePlaceholder: string;
    fApplyWithoutResume: string;
    select: string;
    submit: string;
    submitting: string;
    cancel: string;
    needCompanyTitle: string;
    needCompanyDesc: string;
    needCompanyButton: string;
  };

  empApplications: {
    title: string;
    subtitle: string;
    empty: string;
    forVacancy: string;
    viewResume: string;
    hideResume: string;
    noResume: string;
    chat: string;
    desiredSalary: string;
    resumeSummary: string;
    resumeSkills: string;
    resumeExperience: string;
    resumeEducation: string;
    statusLabel: Record<string, string>;
    actionViewed: string;
    actionInvite: string;
    actionReject: string;
    actionAccept: string;
    selectApplicant: string;
    applicantProfile: string;
    contactInfo: string;
    openToWork: string;
    regionLabel: string;
    appliedAt: string;
    newCount: (n: number) => string;
    reasonOptional: string;
    reasonHint: string;
    reasonPlaceholder: string;
    confirm: string;
    cancel: string;
    back: string;
  };

  chat: {
    title: string;
    conversations: string;
    empty: string;
    emptyHint: string;
    selectConversation: string;
    placeholder: string;
    send: string;
    noMessages: string;
    vacancyLabel: string;
    rate: string;
    rateTitle: string;
    rateLocked: string;
    rateOnce: string;
    rateCommentPlaceholder: string;
    rateSubmit: string;
    rateSaving: string;
    rateSaved: string;
    ratingOf: (avg: string, count: number) => string;
    partnerInfo: string;
    openToWorkYes: string;
  };

  enums: {
    employment: Record<"full_time" | "part_time" | "remote" | "shift", string>;
    experience: Record<"none" | "one_to_three" | "three_to_six" | "six_plus", string>;
  };

  fmt: {
    salaryHidden: string;
    currency: string;
    salaryFrom: (v: string) => string;
    salaryTo: (v: string) => string;
    salaryRange: (min: string, max: string) => string;
    today: string;
    yesterday: string;
    daysAgo: (n: number) => string;
    vacanciesCount: (n: number) => string;
  };
}

export interface ExtraMessages {
  metaExtra: {
    favorites: { title: string; description: string };
    notifications: { title: string; description: string };
    alerts: { title: string; description: string };
    salaries: { title: string; description: string };
    admin: { title: string; description: string };
  };

  navExtra: {
    favorites: string;
    notifications: string;
    alerts: string;
    salaries: string;
    admin: string;
  };

  favorites: {
    title: string;
    subtitle: string;
    empty: string;
    emptyHint: string;
    browse: string;
    closed: string;
    remove: string;
    add: string;
    count: (n: number) => string;
  };

  notifications: {
    title: string;
    subtitle: string;
    empty: string;
    emptyHint: string;
    markAllRead: string;
    allRead: string;
    unreadOnly: string;
    showAll: string;
    delete: string;
    viewAll: string;
    settings: string;
    settingsTitle: string;
    settingsHint: string;
    channelUnavailable: string;
    saved: string;
    save: string;
    types: {
      new_application: string;
      application_status_changed: string;
      new_vacancy_match: string;
      system: string;
    };
    channels: { in_app: string; email: string; push: string; telegram: string };
    push: {
      title: string;
      hint: string;
      enable: string;
      disable: string;
      enabled: string;
      blocked: string;
      unsupported: string;
      notConfigured: string;
    };
  };

  alerts: {
    title: string;
    subtitle: string;
    empty: string;
    emptyHint: string;
    saveCurrent: string;
    dialogTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    frequencyLabel: string;
    instant: string;
    daily: string;
    create: string;
    cancel: string;
    created: string;
    delete: string;
    deleted: string;
    active: string;
    paused: string;
    pause: string;
    resume: string;
    lastChecked: string;
    never: string;
    loginRequired: string;
  };

  salaries: {
    breadcrumb: string;
    title: string;
    subtitle: string;
    noData: string;
    noDataHint: string;
    basedOn: (n: number) => string;
    median: string;
    average: string;
    range: string;
    middleRange: string;
    medianHint: string;
    averageHint: string;
    middleRangeHint: string;
    distribution: string;
    distributionHint: string;
    byCategory: string;
    byRegion: string;
    allCategories: string;
    allRegions: string;
    vacancyCount: string;
    columnName: string;
    columnMedian: string;
    columnAverage: string;
    columnCount: string;
  };

  pricingExtra: {
    currentPlan: string;
    activeUntil: string;
    unlimited: string;
    usage: (used: number, max: number) => string;
    activate: string;
    current: string;
    free: string;
    perMonthShort: string;
    payWith: string;
    payme: string;
    click: string;
    manualNotice: string;
    checkoutError: string;
    loginToBuy: string;
    employersOnly: string;
    paymentsTitle: string;
    noPayments: string;
    statusPending: string;
    statusPaid: string;
    statusFailed: string;
    statusRefunded: string;
    featureCandidates: string;
    featureVacancies: (n: number) => string;
    featureFeatured: (n: number) => string;
  };

  admin: {
    title: string;
    nav: {
      overview: string;
      users: string;
      vacancies: string;
      companies: string;
      reviews: string;
      payments: string;
    };
    overview: {
      users: string;
      seekers: string;
      employers: string;
      blocked: string;
      newThisWeek: string;
      companies: string;
      verified: string;
      activeVacancies: string;
      onModeration: string;
      applications: string;
      today: string;
      pendingReviews: string;
      revenue: string;
      searchEngine: string;
      chartTitle: string;
      chartUsers: string;
      chartApplications: string;
      actions: string;
      reindex: string;
      reindexDone: (n: number) => string;
      runAlerts: string;
      alertsDone: (n: number) => string;
      broadcast: string;
      broadcastTitle: string;
      broadcastBody: string;
      broadcastAudience: string;
      audienceAll: string;
      audienceSeekers: string;
      audienceEmployers: string;
      send: string;
      broadcastSent: (n: number) => string;
    };
    users: {
      searchPlaceholder: string;
      role: string;
      allRoles: string;
      block: string;
      unblock: string;
      blocked: string;
      makeAdmin: string;
      makeEmployer: string;
      makeSeeker: string;
      applications: string;
      registered: string;
      telegram: string;
      phoneVerified: string;
      empty: string;
    };
    vacancies: {
      searchPlaceholder: string;
      status: string;
      allStatuses: string;
      approve: string;
      reject: string;
      archive: string;
      rejectReason: string;
      makePremium: string;
      removePremium: string;
      views: string;
      applications: string;
      empty: string;
    };
    companies: {
      searchPlaceholder: string;
      verify: string;
      unverify: string;
      verified: string;
      owner: string;
      plan: string;
      vacancies: string;
      reviews: string;
      empty: string;
    };
    reviews: {
      status: string;
      approve: string;
      reject: string;
      delete: string;
      author: string;
      company: string;
      empty: string;
    };
    payments: {
      status: string;
      confirm: string;
      confirmed: string;
      transaction: string;
      company: string;
      plan: string;
      amount: string;
      provider: string;
      empty: string;
    };
    common: {
      total: (n: number) => string;
      page: (a: number, b: number) => string;
      prev: string;
      next: string;
      confirmAction: string;
      done: string;
      failed: string;
      accessDenied: string;
    };
  };

  sortLabels: {
    label: string;
    relevance: string;
    date: string;
    salaryDesc: string;
    salaryAsc: string;
  };

  empVacanciesExtra: {
    edit: string;
    editTitle: string;
    saveChanges: string;
    planUsage: (used: number, max: number, plan: string) => string;
    limitReached: string;
    upgrade: string;
  };
}

/**
 * To'liq lug'at = asosiy bo'limlar + yangi bo'limlar.
 * Ikkisi ham `useT()` orqali bir xil ishlatiladi: `t.nav.vacancies`, `t.favorites.title`.
 */
export type Messages = BaseMessages & ExtraMessages;

/* Til fayllari uchun umumiy yordamchilar — bir nusxada, har tilda takrorlanmasin. */

/** Raqamlarni bo'sh joy bilan guruhlaydi (1 207). */
export const grp = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

/** Rus tilida son shaklini to'g'ri tanlaydi: 1 вакансия / 2 вакансии / 5 вакансий. */
export function ruPlural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
