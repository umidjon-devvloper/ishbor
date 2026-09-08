// Frontend ma'lumot tiplari (backend DTO'lari shu shaklga moslanadi).

export type EmploymentType = "full_time" | "part_time" | "remote" | "shift";
export type ExperienceLevel = "none" | "one_to_three" | "three_to_six" | "six_plus";

export interface Vacancy {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  companySlug: string;
  regionName: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  isSalaryHidden: boolean;
  employmentType: EmploymentType;
  experienceRequired: ExperienceLevel;
  isPremium: boolean;
  isUrgent: boolean;
  publishedAt: string | null;
}

export interface VacancyDetail extends Vacancy {
  description: string;
  requirements: string[];
  conditions: string[];
  applyWithoutResume: boolean;
  contactEmail: string | null;
  contactTelegram: string | null;
  contactPhone: string | null;
  companyRating: number;
  companyReviewCount: number;
  companyLogoUrl: string | null;
}

export interface Company {
  slug: string;
  name: string;
  description: string;
  logoUrl: string | null;
  regionName: string | null;
  industry: string | null;
  employeeCount: string | null;
  foundedYear: number | null;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  activeVacancyCount: number;
}

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  readMinutes: number;
}

export interface CompanyReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
  userId?: string;
  mine?: boolean;
}

export interface Stats {
  vacancies: number;
  companies: number;
  applicationsToday: number;
}

export type UserRole = "job_seeker" | "employer" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
}

export interface Region {
  id: string;
  name: string;
  slug: string;
}

export interface Profile {
  email: string;
  role: UserRole;
  phone: string | null;
  isPhoneVerified: boolean;
  additionalPhone: string | null;
  firstName: string;
  lastName: string;
  headline: string | null;
  regionId: string | null;
  regionName: string | null;
  isOpenToWork: boolean;
  resumeUrl: string | null;
}

export interface ProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  additionalPhone?: string | null;
  headline?: string | null;
  regionId?: string | null;
  isOpenToWork?: boolean;
}

export interface ResumeExperienceItem {
  companyName: string;
  position: string;
  startDate: string; // YYYY-MM
  endDate: string | null;
  isCurrent: boolean;
  description: string | null;
}

export interface ResumeEducationItem {
  institution: string;
  degree: string | null;
  field: string | null;
  startYear: number;
  endYear: number | null;
}

export interface ResumeData {
  title: string;
  summary: string | null;
  desiredSalary: number | null;
  skills: string[];
  experience: ResumeExperienceItem[];
  education: ResumeEducationItem[];
}

export type ResumeInput = ResumeData;

export interface MyCompany {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  logoUrl: string | null;
  regionId: string | null;
  region?: Region | null;
  industry: string | null;
  employeeCount: string | null;
  foundedYear: number | null;
  isVerified: boolean;
}

export interface MyCompanyInput {
  name: string;
  description?: string | null;
  website?: string | null;
  regionId?: string | null;
  industry?: string | null;
  employeeCount?: string | null;
  foundedYear?: number | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type ApplicationStatus = "sent" | "viewed" | "invited" | "rejected" | "accepted";

export interface EmployerVacancy {
  id: string;
  slug: string;
  title: string;
  status: string;
  employmentType: EmploymentType;
  experienceRequired: ExperienceLevel;
  salaryMin: number | null;
  salaryMax: number | null;
  isSalaryHidden?: boolean;
  region?: { name: string } | null;
  _count: { applications: number };
  // Tahrirlash formasi shu maydonlarni to'ldiradi (API to'liq yozuvni qaytaradi)
  description?: string;
  requirements?: string | null;
  conditions?: string | null;
  categoryId?: string | null;
  regionId?: string | null;
  applyWithoutResume?: boolean;
  contactEmail?: string | null;
  contactTelegram?: string | null;
  contactPhone?: string | null;
}

export interface VacancyCreateInput {
  title: string;
  description: string;
  requirements?: string;
  conditions?: string;
  categoryId?: string;
  regionId?: string;
  employmentType: EmploymentType;
  experienceRequired?: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  applyWithoutResume?: boolean;
  contactEmail?: string;
  contactTelegram?: string;
  contactPhone?: string;
}

export interface ApplicantResume {
  title: string;
  summary: string | null;
  desiredSalary: number | null;
  skills: { skillName: string }[];
  experience: {
    companyName: string;
    position: string;
    startDate: string;
    endDate: string | null;
    isCurrent: boolean;
    description: string | null;
  }[];
  education: {
    institution: string;
    degree: string | null;
    field: string | null;
    startYear: number;
    endYear: number | null;
  }[];
}

export interface EmployerApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  jobSeekerId: string;
  vacancy: { id: string; title: string; slug: string };
  jobSeeker: {
    email: string;
    phone: string | null;
    jobSeekerProfile: {
      firstName: string;
      lastName: string;
      headline: string | null;
      isOpenToWork?: boolean;
      avatarUrl?: string | null;
      region?: { name: string } | null;
    } | null;
  };
  resume: ApplicantResume | null;
}

export interface Conversation {
  id: string;
  title: string;
  subtitle: string | null;
  companySlug: string | null;
  otherUserId: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
}

/** Suhbat bo'yicha o'zaro baho holati. */
export interface ConversationRating {
  eligible: boolean;
  myScore: number | null;
  myComment: string | null;
  otherAvg: number | null;
  otherCount: number;
}

/** Suhbatdoshning qisqa profili (chat'dagi modal uchun). */
export interface UserSummary {
  role: UserRole;
  name: string;
  headline: string | null;
  regionName: string | null;
  ratingAvg: number | null;
  ratingCount: number;
  isOpenToWork: boolean | null;
  resumeTitle: string | null;
  skills: string[];
  company: {
    name: string;
    slug: string;
    logoUrl: string | null;
    industry: string | null;
    description: string | null;
  } | null;
}

export interface InboxSummary {
  unreadMessages: number;
  newApplications: number;
}

export interface TelegramStatus {
  linked: boolean;
  phoneVerified: boolean;
  phone: string | null;
  botUsername: string | null;
}

export interface Candidate {
  userId: string;
  email: string;
  phone: string | null;
  firstName: string;
  lastName: string;
  headline: string | null;
  regionName: string | null;
  isOpenToWork: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  resume: ApplicantResume | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

// ---------------------------------------------------------
// Sevimlilar, bildirishnomalar, obunalar, tariflar, admin
// ---------------------------------------------------------

/** Sevimlilar sahifasidagi karta — oddiy vakansiya + yopilgan holati. */
export interface FavoriteVacancy extends Vacancy {
  favoritedAt: string;
  isClosed: boolean;
}

export type NotificationType =
  | "new_application"
  | "application_status_changed"
  | "new_vacancy_match"
  | "system";

export type NotificationChannel = "in_app" | "email" | "push" | "telegram";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  url: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationList {
  items: AppNotification[];
  unreadCount: number;
}

export interface NotificationPref {
  notificationType: NotificationType;
  channel: NotificationChannel;
  isEnabled: boolean;
  /** Kanal serverda umuman sozlanmagan bo'lsa false (UI uni o'chiq ko'rsatadi). */
  available: boolean;
}

export interface SavedSearchParams {
  text?: string;
  categorySlug?: string;
  area?: string;
  experience?: string;
  employment?: string;
  salary?: number;
  salaryTo?: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  params: SavedSearchParams;
  url: string;
  frequency: "instant" | "daily";
  emailAlertsEnabled: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
}

export interface SubscriptionPlan {
  slug: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  maxActiveVacancies: number;
  maxFeaturedVacancies: number;
  canSearchCandidates: boolean;
  features: string[];
}

export interface PlanList {
  items: SubscriptionPlan[];
  providers: { payme: boolean; click: boolean };
}

export interface SubscriptionState {
  slug: string;
  name: string;
  price: number;
  maxActiveVacancies: number;
  maxFeaturedVacancies: number;
  canSearchCandidates: boolean;
  expiresAt: string | null;
  expired: boolean;
  activeVacancies: number;
  featuredVacancies: number;
  canPostMore: boolean;
}

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface PaymentRecord {
  id: string;
  transactionId: string | null;
  planName: string;
  amount: number;
  status: PaymentStatus;
  provider: "payme" | "click";
  paidAt: string | null;
  createdAt: string;
}

export interface CheckoutResult {
  paymentId: string;
  transactionId: string;
  amount: number;
  provider: "payme" | "click";
  checkoutUrl: string;
  manual: boolean;
}

// --- Maosh statistikasi ---

export interface SalarySummary {
  count: number;
  currency: string;
  min: number;
  max: number;
  average: number;
  median: number;
  p25: number;
  p75: number;
}

export interface SalaryBucket {
  label: string;
  from: number;
  to: number | null;
  count: number;
}

export interface SalaryGroup {
  name: string;
  slug: string;
  count: number;
  median: number;
  average: number;
}

export interface SalaryStats {
  summary: SalarySummary;
  distribution: SalaryBucket[];
  byCategory: SalaryGroup[];
  byRegion: SalaryGroup[];
}

// --- Admin ---

export interface AdminOverview {
  users: { total: number; seekers: number; employers: number; blocked: number; newThisWeek: number };
  companies: { total: number; verified: number };
  vacancies: { active: number; moderation: number };
  applications: { total: number; today: number };
  reviews: { pending: number };
  payments: { paid: number; revenue: number };
  search: { engine: string };
  chart: { date: string; users: number; applications: number }[];
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface AdminUser {
  id: string;
  email: string;
  phone: string | null;
  role: UserRole;
  isBlocked: boolean;
  isPhoneVerified: boolean;
  telegramLinked: boolean;
  name: string | null;
  companyName: string | null;
  applicationCount: number;
  createdAt: string;
}

export interface AdminVacancy {
  id: string;
  slug: string;
  title: string;
  status: "draft" | "moderation" | "active" | "archived" | "rejected";
  companyName: string;
  companySlug: string;
  regionName: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  isPremium: boolean;
  viewsCount: number;
  applicationCount: number;
  rejectionReason: string | null;
  createdAt: string;
}

export interface AdminCompany {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  isVerified: boolean;
  planName: string | null;
  subscriptionExpiresAt: string | null;
  vacancyCount: number;
  reviewCount: number;
  createdAt: string;
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "rejected";
  companyName: string;
  companySlug: string;
  authorName: string;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  transactionId: string | null;
  companyName: string;
  planName: string;
  amount: number;
  status: PaymentStatus;
  provider: "payme" | "click";
  paidAt: string | null;
  createdAt: string;
}
