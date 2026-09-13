// ============================================================
// Deploydan oldingi tekshiruv (uchdan-uchgacha).
//
// Haqiqiy MongoDB ustida `dist/server.js` ni ko'taradi va asosiy oqimlarni
// HTTP orqali tekshiradi: ro'yxatdan o'tish, seans cookie'si, vakansiya,
// ariza, rezyume, chat, sharh, admin paneli, CORS, sitemap, OG rasm, tarif limiti.
//
// Ishlatish:
//   npm run build
//   E2E_DATABASE_URL="mongodb+srv://.../ishbor_test" npm run test:e2e
//
// DIQQAT: skript bazaga YOZADI. Shu sababli u faqat nomida "test" bo'lgan
// bazaga ruxsat beradi va har ishga tushganda uni TOZALAYDI. Asosiy
// `DATABASE_URL` ataylab ishlatilmaydi — alohida `E2E_DATABASE_URL` kerak.
// ============================================================
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setTimeout as sleep } from "node:timers/promises";

const uri = process.env.E2E_DATABASE_URL ?? "";
if (!uri) {
  console.error(
    [
      "E2E_DATABASE_URL berilmagan. Masalan:",
      '  E2E_DATABASE_URL="mongodb+srv://user:parol@cluster/ishbor_test" npm run test:e2e',
    ].join("\n")
  );
  process.exit(1);
}
const dbName = (uri.split("?")[0].split("/").pop() ?? "").toLowerCase();
if (!dbName.includes("test")) {
  console.error(
    [
      `Xavfsizlik: baza nomida "test" bo'lishi shart (hozir: "${dbName}").`,
      "Skript bazani tozalaydi, shuning uchun ishchi bazaga qaratib bo'lmaydi.",
    ].join("\n")
  );
  process.exit(1);
}

// Yo'llar shu fayldan hisoblanadi — skript qaysi papkadan chaqirilishidan qat'i nazar ishlaydi.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PRISMA_CLI = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));
const SERVER = fileURLToPath(new URL("../dist/server.js", import.meta.url));

if (!existsSync(SERVER)) {
  console.error(`${SERVER} topilmadi. Avval: npm run build`);
  process.exit(1);
}

const push = spawnSync(
  process.execPath,
  [PRISMA_CLI, "db", "push", "--skip-generate", "--force-reset"],
  { cwd: ROOT, env: { ...process.env, DATABASE_URL: uri }, encoding: "utf8" }
);
console.log("db push:", push.status === 0 ? "OK" : "XATO " + push.status);
if (push.status !== 0) {
  console.error(String(push.stdout ?? "") + String(push.stderr ?? ""));
  process.exit(1);
}

const PORT = 4711;
const env = {
  ...process.env,
  DATABASE_URL: uri,
  NODE_ENV: "production",
  PORT: String(PORT),
  WEB_ORIGIN: "https://sayt.example",
  JWT_ACCESS_SECRET: "test-secret-access",
  JWT_REFRESH_SECRET: "test-secret-refresh",
  ADMIN_EMAIL: "Admin@Ish.Top",
  ADMIN_PASSWORD: "admin-parol-123",
  TELEGRAM_BOT_TOKEN: "",
  SMTP_HOST: "",
  MEILI_HOST: "",
  UPLOAD_DIR: "",
};

const server = spawn(process.execPath, [SERVER], { cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
server.stdout.on("data", (d) => (log += d));
server.stderr.on("data", (d) => (log += d));

const BASE = `http://127.0.0.1:${PORT}`;
let up = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch(`${BASE}/health`);
    if (r.ok) { up = true; break; }
  } catch {}
  await sleep(500);
}
if (!up) {
  console.error("Server ko'tarilmadi:\n" + log);
  server.kill();
  process.exit(1);
}

let failed = 0;
async function check(name, fn) {
  try {
    await fn();
    console.log("  OK  " + name);
  } catch (e) {
    failed++;
    console.error("  XATO " + name + ": " + e.message);
  }
}
const j = async (path, init) => {
  const res = await fetch(BASE + path, init);
  const text = await res.text();
  let body = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, res };
};
const post = (path, data, token) =>
  j(path, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(data ?? {}),
  });

await check("GET /health", async () => {
  const { status, body } = await j("/health");
  if (status !== 200 || body.db !== "up") throw new Error(JSON.stringify(body));
});

// Startup bootstrap fonda ishlaydi — kataloglar TO'LIQ to'lishini kutamiz.
// Shart pastdagi tekshiruvlar bilan bir xil bo'lishi kerak: ilgari "kamida 1 ta
// hudud" kutilardi, keyin esa ">= 14" tekshirilardi — yuklangan mashinada test
// bootstrap'ning o'rtasiga tushib, tasodifan yiqilardi.
for (let i = 0; i < 60; i++) {
  const [regions, plans] = await Promise.all([j("/api/regions"), j("/api/plans")]);
  if ((regions.body?.items?.length ?? 0) >= 14 && (plans.body?.items?.length ?? 0) >= 3) break;
  await sleep(500);
}

await check("GET /api/regions (ensureCatalog)", async () => {
  const { body } = await j("/api/regions");
  if (!body.items || body.items.length < 14) throw new Error("hudud soni: " + body.items?.length);
  if (!/^[0-9a-f]{24}$/.test(body.items[0].id)) throw new Error("ID ObjectId emas: " + body.items[0].id);
});

await check("GET /api/plans (ensurePlans)", async () => {
  const { body } = await j("/api/plans");
  if (body.items?.length !== 3) throw new Error("tarif soni: " + body.items?.length);
});

let employerToken, seekerToken, adminToken;
await check("POST /api/auth/register (ish beruvchi + kompaniya)", async () => {
  const { status, body } = await post("/api/auth/register", {
    email: "HR@Test.Uz", password: "parol12345", role: "employer", companyName: "NextBrain O'zbekiston",
  });
  if (status !== 200 || !body.accessToken) throw new Error(status + " " + JSON.stringify(body));
  employerToken = body.accessToken;
});

await check("email registr sezgir emas (HR@Test.Uz -> hr@test.uz)", async () => {
  const { status, body } = await post("/api/auth/login", { email: "hr@test.uz", password: "parol12345" });
  if (status !== 200 || !body.accessToken) throw new Error(status + " " + JSON.stringify(body));
});

await check("refresh cookie SameSite=None; Secure (prod)", async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "hr@test.uz", password: "parol12345" }),
  });
  const cookie = res.headers.get("set-cookie") ?? "";
  if (!/SameSite=None/i.test(cookie) || !/Secure/i.test(cookie) || !/HttpOnly/i.test(cookie)) {
    throw new Error("cookie: " + cookie);
  }
});

await check("dublikat email -> 409", async () => {
  const { status } = await post("/api/auth/register", { email: "hr@test.uz", password: "parol12345", role: "employer" });
  if (status !== 409) throw new Error("status " + status);
});

await check("kompaniya slug (o'zbekcha nomdan)", async () => {
  const { body } = await j("/api/employer/company", { headers: { authorization: `Bearer ${employerToken}` } });
  const slug = body.company?.slug;
  if (!slug || !/^nextbrain-ozbekiston-[0-9a-f]{8}$/.test(slug)) throw new Error("slug: " + slug);
});

await check("POST /api/vacancies telefon tasdiqlanmagan -> 403", async () => {
  const { status, body } = await post("/api/vacancies", {
    title: "Frontend dasturchi", description: "Uzun tavsif matni", employmentType: "full_time",
  }, employerToken);
  if (status !== 403 || body.error !== "PHONE_NOT_VERIFIED") throw new Error(status + " " + JSON.stringify(body));
});

// Telefonni tasdiqlab qo'yamiz (Telegram botsiz test qilish uchun to'g'ridan bazadan)
const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: uri } } });
await prisma.user.updateMany({ where: {}, data: { isPhoneVerified: true } });

let vacancyId, vacancySlug;
await check("POST /api/vacancies (ObjectId validatsiyasi bilan)", async () => {
  const regions = (await j("/api/regions")).body.items;
  const cats = (await j("/api/categories")).body.items;
  const { status, body } = await post("/api/vacancies", {
    title: "Frontend dasturchi (React)", description: "Uzun tavsif matni bu yerda",
    employmentType: "full_time", regionId: regions[0].id, categoryId: cats[0].id,
    salaryMin: 15000000, salaryMax: 25000000,
  }, employerToken);
  if (status !== 201) throw new Error(status + " " + JSON.stringify(body));
  vacancyId = body.id; vacancySlug = body.slug;
  if (!/^frontend-dasturchi-react-[0-9a-f]{8}$/.test(vacancySlug)) throw new Error("slug: " + vacancySlug);
});

await check("noto'g'ri ObjectId -> 400", async () => {
  const { status, body } = await post("/api/vacancies", {
    title: "Test", description: "Uzun tavsif matni", employmentType: "full_time",
    regionId: "5f9b1a2c-0000-4000-8000-000000000000",
  }, employerToken);
  if (status !== 400 || body.error !== "VALIDATION_ERROR") throw new Error(status + " " + JSON.stringify(body));
});

await check("GET /api/vacancies (ro'yxat + qidiruv + saralash)", async () => {
  const list = (await j("/api/vacancies")).body;
  if (list.total !== 1 || list.engine !== "mongodb") throw new Error(JSON.stringify(list).slice(0, 200));
  const search = (await j("/api/vacancies?text=DASTURCHI%20react")).body;
  if (search.total !== 1) throw new Error("qidiruv topmadi: " + search.total);
  const sorted = (await j("/api/vacancies?sort=salary_asc")).body;
  if (sorted.items.length !== 1) throw new Error("saralash: " + sorted.items.length);
});

await check("vakansiyalar: ko'p qiymatli filtrlar, kompaniya, facets, yangi saralash", async () => {
  const regions = (await j("/api/regions")).body.items;
  const detail = (await j(`/api/vacancies/${vacancySlug}`)).body;
  const own = detail.region.slug;
  const other = regions.find((r) => r.slug !== own).slug;
  const total = async (qs) => (await j(`/api/vacancies?${qs}`)).body.total;

  if ((await total(`area=${other},${own}`)) !== 1) throw new Error("hudud (csv)");
  if ((await total(`area=${other}`)) !== 0) throw new Error("boshqa hudud");
  if ((await total("experience=six_plus,none")) !== 1) throw new Error("tajriba (csv)");
  if ((await total("experience=six_plus")) !== 0) throw new Error("tajriba six_plus");
  if ((await total("employment=part_time,full_time")) !== 1) throw new Error("bandlik (csv)");
  if ((await total("employment=yoq")) !== 1) throw new Error("noma'lum bandlik e'tiborsiz qolishi kerak");
  if ((await total(`company=${detail.company.slug}`)) !== 1) throw new Error("kompaniya");
  if ((await total("company=yoq-kompaniya")) !== 0) throw new Error("begona kompaniya");
  if ((await total("premium=1")) !== 0) throw new Error("premium");
  for (const sort of ["popular", "date", "relevance", "salary_desc"]) {
    const res = await j(`/api/vacancies?sort=${sort}&pageSize=10`);
    if (res.status !== 200 || res.body.items.length !== 1) throw new Error("saralash " + sort);
  }

  const facets = (await j(`/api/vacancies/facets?area=${other}`)).body;
  if (facets.total !== 0) throw new Error("facets total: " + facets.total);
  // Hudud o'lchovi o'z filtrini chetlab hisoblanadi — tanlanmagan hudud soni ham ko'rinadi
  if (facets.regions.find((r) => r.slug === own)?.count !== 1) throw new Error("facets hudud: " + JSON.stringify(facets.regions));
  if (facets.employment.find((e) => e.value === "full_time").count !== 0) throw new Error("facets bandlik hudud bilan torayishi kerak");
  const all = (await j("/api/vacancies/facets")).body;
  if (all.total !== 1 || all.companies[0]?.slug !== detail.company.slug || all.experience.find((e) => e.value === "none").count !== 1) {
    throw new Error("facets: " + JSON.stringify(all).slice(0, 300));
  }
});

await check("GET /api/vacancies/:slug (ko'rishlar +1)", async () => {
  const { status, body } = await j(`/api/vacancies/${vacancySlug}`);
  if (status !== 200 || body.slug !== vacancySlug) throw new Error(status + " " + JSON.stringify(body).slice(0, 200));
  // Detail sahifasi uchun: rasmlar (bo'sh ro'yxat), kompaniya hududi va faol vakansiyalar soni
  if (!Array.isArray(body.images) || !Array.isArray(body.company.images)) throw new Error("images maydoni yo'q");
  if (body.company._count?.vacancies !== 1) throw new Error("kompaniya _count: " + JSON.stringify(body.company._count));
});

await check("GET /api/vacancies/:slug/similar (o'zi chiqmaydi, soha bo'yicha, 404)", async () => {
  const alone = await j(`/api/vacancies/${vacancySlug}/similar`);
  if (alone.status !== 200 || alone.body.items.length !== 0) throw new Error("yagona vakansiya: " + JSON.stringify(alone.body).slice(0, 200));

  const detail = (await j(`/api/vacancies/${vacancySlug}`)).body;
  const second = await post("/api/vacancies", {
    title: "Backend dasturchi", description: "Uzun tavsif matni bu yerda",
    employmentType: "full_time", categoryId: detail.categoryId, regionId: detail.regionId,
  }, employerToken);
  if (second.status !== 201) throw new Error("ikkinchi vakansiya: " + second.status);
  const list = (await j(`/api/vacancies/${vacancySlug}/similar?limit=4`)).body.items;
  if (list.length !== 1 || list[0].slug !== second.body.slug || !list[0].company?.name) {
    throw new Error("o'xshash: " + JSON.stringify(list).slice(0, 200));
  }
  if ((await j("/api/vacancies/yoq-vakansiya/similar")).status !== 404) throw new Error("404 kutilgan");
  // Keyingi tekshiruvlar bitta vakansiyaga tayanadi — vaqtinchalik e'lonni o'chiramiz
  await j(`/api/vacancies/${second.body.id}`, { method: "DELETE", headers: { authorization: `Bearer ${employerToken}` } });
});

await check("nomzod ro'yxatdan o'tadi + ariza yuboradi", async () => {
  const reg = await post("/api/auth/register", {
    email: "seeker@test.uz", password: "parol12345", role: "job_seeker", firstName: "Aziz", lastName: "Aliyev",
  });
  seekerToken = reg.body.accessToken;
  await prisma.user.updateMany({ where: {}, data: { isPhoneVerified: true } });

  const r1 = await post(`/api/vacancies/${vacancyId}/apply`, { source: "site" }, seekerToken);
  if (r1.status !== 400) throw new Error("rezyumesiz ariza o'tib ketdi: " + r1.status + " " + JSON.stringify(r1.body));

  const resume = await j("/api/resume", {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${seekerToken}` },
    body: JSON.stringify({
      title: "Frontend dasturchi", skills: ["React", "TypeScript"],
      experience: [{ companyName: "X", position: "Dev", startDate: "2023-01", endDate: "2024-06" }],
      education: [{ institution: "TATU", startYear: 2018, endYear: 2022 }],
    }),
  });
  if (resume.status !== 200 || resume.body.resume?.skills?.length !== 2) {
    throw new Error("rezyume: " + resume.status + " " + JSON.stringify(resume.body).slice(0, 200));
  }

  const r2 = await post(`/api/vacancies/${vacancyId}/apply`, { source: "site" }, seekerToken);
  if (r2.status !== 201) throw new Error("ariza: " + r2.status + " " + JSON.stringify(r2.body));
  const r3 = await post(`/api/vacancies/${vacancyId}/apply`, { source: "site" }, seekerToken);
  if (r3.status !== 200) throw new Error("takroriy ariza: " + r3.status);
});

await check("ish beruvchi arizani ko'radi va holatini o'zgartiradi", async () => {
  const list = await j("/api/employer/applications", { headers: { authorization: `Bearer ${employerToken}` } });
  if (list.body.items?.length !== 1) throw new Error("ariza soni: " + list.body.items?.length);
  const appId = list.body.items[0].id;
  const upd = await j(`/api/applications/${appId}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${employerToken}` },
    body: JSON.stringify({ status: "invited", reason: "Suhbatga taklif qilamiz" }),
  });
  if (upd.status !== 200) throw new Error("holat: " + upd.status + " " + JSON.stringify(upd.body));
});

await check("begona vakansiya arizalari yopiq (403)", async () => {
  const other = await post("/api/auth/register", { email: "hr2@test.uz", password: "parol12345", role: "employer", companyName: "Boshqa" });
  const { status } = await j(`/api/vacancies/${vacancyId}/applications`, {
    headers: { authorization: `Bearer ${other.body.accessToken}` },
  });
  if (status !== 403) throw new Error("status " + status);
});

await check("chat: suhbat ochiladi va xabar keladi", async () => {
  const conv = await j("/api/conversations", { headers: { authorization: `Bearer ${seekerToken}` } });
  if (conv.body.items?.length !== 1) throw new Error("suhbat soni: " + conv.body.items?.length);
  const msgs = await j(`/api/conversations/${conv.body.items[0].id}/messages`, {
    headers: { authorization: `Bearer ${seekerToken}` },
  });
  if (msgs.body.items?.length !== 1) throw new Error("xabar soni: " + msgs.body.items?.length);
});

await check("bildirishnomalar yozilgan", async () => {
  await sleep(700);
  const n = await j("/api/notifications", { headers: { authorization: `Bearer ${seekerToken}` } });
  if (!n.body.items?.length) throw new Error("bildirishnoma yo'q");
});

await check("sharh: ariza yuborgan nomzod qoldira oladi (bir marta)", async () => {
  const company = (await j("/api/employer/company", { headers: { authorization: `Bearer ${employerToken}` } })).body.company;
  const r1 = await post(`/api/companies/${company.slug}/reviews`, { rating: 5, comment: "Zo'r" }, seekerToken);
  if (r1.status !== 201) throw new Error("sharh: " + r1.status + " " + JSON.stringify(r1.body));
  const r2 = await post(`/api/companies/${company.slug}/reviews`, { rating: 4 }, seekerToken);
  if (r2.status !== 200) throw new Error("takroriy sharh: " + r2.status);
});

await check("sevimlilar (upsert, dublikatsiz)", async () => {
  for (let i = 0; i < 2; i++) {
    const r = await post(`/api/favorites/${vacancyId}`, {}, seekerToken);
    if (r.status !== 201) throw new Error("status " + r.status);
  }
  const ids = await j("/api/favorites/ids", { headers: { authorization: `Bearer ${seekerToken}` } });
  if (ids.body.ids?.length !== 1) throw new Error("soni: " + ids.body.ids?.length);
});

await check("kompaniyalar katalogi: hisoblangan ko'rsatkichlar, filtr, cursor", async () => {
  const first = await j("/api/companies?limit=1");
  if (first.status !== 200 || !Array.isArray(first.body.items) || typeof first.body.total !== "number") {
    throw new Error("javob shakli: " + JSON.stringify(first.body).slice(0, 200));
  }
  const c = first.body.items[0];
  for (const key of ["id", "slug", "name", "rating", "reviewCount", "activeVacancyCount"]) {
    if (!(key in c)) throw new Error("maydon yo'q: " + key);
  }
  // Barcha sahifalarni cursor bilan aylanib chiqish — takror va tushib qolish yo'q
  const seen = new Set();
  let cursor = null;
  do {
    const page = await j(`/api/companies?limit=1&sort=newest${cursor ? `&cursor=${cursor}` : ""}`);
    if (page.status !== 200) throw new Error("sahifa: " + page.status);
    for (const item of page.body.items) {
      if (seen.has(item.id)) throw new Error("takror: " + item.slug);
      seen.add(item.id);
    }
    cursor = page.body.nextCursor;
  } while (cursor);
  if (seen.size !== first.body.total) throw new Error(`jami ${first.body.total}, aylanildi ${seen.size}`);
  const hiring = await j("/api/companies?hiring=1");
  if (hiring.body.items.some((x) => x.activeVacancyCount === 0)) throw new Error("hiring filtri");
  const bad = await j("/api/companies?cursor=buzilgan");
  if (bad.status !== 400) throw new Error("buzilgan cursor: " + bad.status);
  const guestSaved = await j("/api/companies?saved=1");
  if (guestSaved.status !== 401) throw new Error("saved=1 mehmon: " + guestSaved.status);
});

await check("kompaniyani saqlash (upsert, saved=1 filtri, o'chirish)", async () => {
  const company = (await j("/api/employer/company", { headers: { authorization: `Bearer ${employerToken}` } })).body.company;
  for (let i = 0; i < 2; i++) {
    const r = await post(`/api/favorites/companies/${company.id}`, {}, seekerToken);
    if (r.status !== 201) throw new Error("saqlash: " + r.status);
  }
  const auth = { headers: { authorization: `Bearer ${seekerToken}` } };
  const ids = await j("/api/favorites/companies/ids", auth);
  if (ids.body.ids?.length !== 1) throw new Error("ids: " + JSON.stringify(ids.body));
  const list = await j("/api/companies?saved=1", auth);
  if (list.body.total !== 1 || list.body.items[0].id !== company.id) throw new Error("saved ro'yxat: " + JSON.stringify(list.body).slice(0, 200));
  const del = await j(`/api/favorites/companies/${company.id}`, { method: "DELETE", ...auth });
  if (del.status !== 200) throw new Error("o'chirish: " + del.status);
  const after = await j("/api/companies?saved=1", auth);
  if (after.body.total !== 0) throw new Error("o'chirilgandan keyin: " + after.body.total);
});

await check("o'xshash kompaniyalar (o'zi chiqmaydi, 404) va sitemap /companies/:slug", async () => {
  const company = (await j("/api/employer/company", { headers: { authorization: `Bearer ${employerToken}` } })).body.company;
  const detail = await j(`/api/companies/${company.slug}`);
  if (detail.status !== 200 || !Array.isArray(detail.body.images)) throw new Error("detail: " + detail.status);
  const similar = await j(`/api/companies/${company.slug}/similar?limit=5`);
  if (similar.status !== 200 || !Array.isArray(similar.body.items) || similar.body.items.some((c) => c.slug === company.slug)) {
    throw new Error("similar: " + similar.status + " " + JSON.stringify(similar.body).slice(0, 200));
  }
  if ((await j("/api/companies/yoq-kompaniya/similar")).status !== 404) throw new Error("404 kutilgan");
  const sm = (await j("/sitemap-employer.xml")).body;
  if (!sm.includes(`https://sayt.example/companies/${company.slug}`) || sm.includes("/employer/")) throw new Error(sm.slice(0, 300));
});

await check("saqlangan qidiruv (Json)", async () => {
  const r = await post("/api/saved-searches", {
    name: "IT Toshkent", queryParams: { text: "dasturchi", area: "tashkent" }, frequency: "daily",
  }, seekerToken);
  if (r.status !== 201 || r.body.params?.text !== "dasturchi") throw new Error(r.status + " " + JSON.stringify(r.body));
});

await check("admin hisobi yaratilgan va panel ishlaydi", async () => {
  const login = await post("/api/auth/login", { email: "admin@ish.top", password: "admin-parol-123" });
  if (login.status !== 200) throw new Error("admin login: " + login.status + " " + JSON.stringify(login.body));
  adminToken = login.body.accessToken;
  const ov = await j("/api/admin/overview", { headers: { authorization: `Bearer ${adminToken}` } });
  if (ov.status !== 200 || ov.body.users?.total < 3) throw new Error(ov.status + " " + JSON.stringify(ov.body).slice(0, 200));
  if (ov.body.search?.engine !== "mongodb") throw new Error("engine: " + ov.body.search?.engine);
  const users = await j("/api/admin/users?text=aziz", { headers: { authorization: `Bearer ${adminToken}` } });
  if (users.body.items?.length !== 1) throw new Error("admin qidiruv: " + users.body.items?.length);
});

await check("nomzodlar bazasi bepul tarifda yopiq (402)", async () => {
  const { status, body } = await j("/api/candidates", { headers: { authorization: `Bearer ${employerToken}` } });
  if (status !== 402 || body.error !== "PLAN_FEATURE_LOCKED") throw new Error(status + " " + JSON.stringify(body));
});

await check("maosh statistikasi", async () => {
  const { status, body } = await j("/api/stats/salary");
  if (status !== 200 || body.summary?.count !== 1) throw new Error(status + " " + JSON.stringify(body).slice(0, 200));
});

await check("maosh statistikasi: kasb, matn, tajriba kesimi, bozor bazasi", async () => {
  // Yagona maoshli vakansiya: "Frontend dasturchi (React)", 15–25 mln, tajribasiz
  const role = (await j("/api/stats/salary?role=frontend-developer")).body;
  if (role.summary?.count !== 1 || role.summary.median !== 20000000) throw new Error("role: " + JSON.stringify(role.summary));
  if (role.vacancyCount < 1 || role.market?.count !== 1) throw new Error("vacancyCount/market: " + role.vacancyCount + " " + JSON.stringify(role.market));
  if (role.byExperience?.length !== 4 || role.byExperience[0].level !== "none" || role.byExperience[0].count !== 1) {
    throw new Error("byExperience: " + JSON.stringify(role.byExperience));
  }
  const hr = (await j("/api/stats/salary?role=hr")).body;
  if (hr.summary.count !== 0 || hr.vacancyCount !== 0 || hr.market.count !== 1) throw new Error("hr: " + JSON.stringify(hr.summary));
  const text = (await j("/api/stats/salary?q=react")).body;
  if (text.summary.count !== 1) throw new Error("q=react: " + text.summary.count);
  // Tajriba filtri kartalarni toraytiradi, lekin tajriba grafigi o'z filtrini chetlab hisoblanadi
  const senior = (await j("/api/stats/salary?experience=six_plus")).body;
  if (senior.summary.count !== 0 || senior.byExperience[0].count !== 1) throw new Error("experience: " + JSON.stringify(senior.byExperience));
  const bad = await j("/api/stats/salary?role=astronavt");
  if (bad.status !== 400) throw new Error("noto'g'ri kasb: " + bad.status);
});

await check("robots.txt va sitemap sayt domeniga ishora qiladi", async () => {
  const robots = (await j("/robots.txt")).body;
  if (!robots.includes("Sitemap: https://sayt.example/sitemap.xml")) throw new Error(robots.slice(0, 200));
  const sm = (await j("/sitemap-vacancy.xml")).body;
  if (!sm.includes(`https://sayt.example/vacancies/${vacancySlug}`)) throw new Error(sm.slice(0, 300));
});

await check("OG rasm chiziladi", async () => {
  const res = await fetch(`${BASE}/api/og/vacancy/${vacancySlug}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (res.status !== 200 || buf.subarray(1, 4).toString() !== "PNG") throw new Error(res.status + " " + buf.length);
});

await check("CORS: begona manzil rad etiladi, WEB_ORIGIN o'tadi", async () => {
  const bad = await fetch(`${BASE}/api/stats`, { headers: { origin: "https://yomon.example" } });
  if (bad.headers.get("access-control-allow-origin")) throw new Error("begona manzilga ruxsat berildi");
  const good = await fetch(`${BASE}/api/stats`, { headers: { origin: "https://sayt.example" } });
  if (good.headers.get("access-control-allow-origin") !== "https://sayt.example") throw new Error("WEB_ORIGIN rad etildi");
  const preview = await fetch(`${BASE}/api/stats`, { headers: { origin: "https://ishbor-git-x.vercel.app" } });
  if (preview.headers.get("access-control-allow-origin") !== "https://ishbor-git-x.vercel.app") {
    throw new Error("vercel preview rad etildi");
  }
});

await check("tarif limiti: bepul rejada 3 ta faol vakansiya", async () => {
  const regions = (await j("/api/regions")).body.items;
  for (let i = 0; i < 2; i++) {
    const r = await post("/api/vacancies", {
      title: `Vakansiya ${i}`, description: "Uzun tavsif matni", employmentType: "full_time", regionId: regions[0].id,
    }, employerToken);
    if (r.status !== 201) throw new Error(`#${i}: ` + r.status + " " + JSON.stringify(r.body));
  }
  const over = await post("/api/vakansiya-yoq".replace("/api/vakansiya-yoq", "/api/vacancies"), {
    title: "To'rtinchi", description: "Uzun tavsif matni", employmentType: "full_time",
  }, employerToken);
  if (over.status !== 402 || over.body.error !== "PLAN_LIMIT_REACHED") {
    throw new Error(over.status + " " + JSON.stringify(over.body));
  }
});

await check("rezyume bo'sh bo'limlar bilan saqlanadi (ta'lim/ko'nikmasiz)", async () => {
  // MongoDB bo'sh `createMany` ni rad etadi — ilgari bu 500 berib, rezyumeni
  // yarim yozib qo'yardi. Profil sahifasi har bo'limni alohida saqlaydi, shuning
  // uchun bo'sh bo'limli hujjat odatiy holat.
  const put = (data) =>
    j("/api/resume", {
      method: "PUT",
      headers: { "content-type": "application/json", authorization: `Bearer ${seekerToken}` },
      body: JSON.stringify(data),
    });
  const partial = await put({
    title: "Frontend dasturchi", summary: "Qisqa tavsif", skills: [], education: [],
    experience: [{ companyName: "X", position: "Dev", startDate: "2023-01", endDate: null, isCurrent: true }],
  });
  if (partial.status !== 200) throw new Error("qisman: " + partial.status + " " + JSON.stringify(partial.body).slice(0, 200));
  const back = await j("/api/resume", { headers: { authorization: `Bearer ${seekerToken}` } });
  const r = back.body.resume;
  if (r?.summary !== "Qisqa tavsif" || r.experience.length !== 1 || r.education.length !== 0 || r.skills.length !== 0) {
    throw new Error("saqlangan holat noto'g'ri: " + JSON.stringify(r).slice(0, 200));
  }
  const empty = await put({ title: "Frontend dasturchi", skills: [], experience: [], education: [] });
  if (empty.status !== 200) throw new Error("hammasi bo'sh: " + empty.status);
});

await check("nomzodning o'z arizalari (GET /api/applications) — kompaniya bilan", async () => {
  const { status, body } = await j("/api/applications", { headers: { authorization: `Bearer ${seekerToken}` } });
  if (status !== 200 || !Array.isArray(body) || body.length < 1) throw new Error(status + " " + JSON.stringify(body).slice(0, 200));
  const first = body[0];
  if (!first.status || !first.vacancy?.slug || !first.vacancy?.company?.name) {
    throw new Error("maydonlar yetishmaydi: " + JSON.stringify(first).slice(0, 200));
  }
  if (!first.vacancy.employmentType || !first.vacancy.experienceRequired || !("isVerified" in first.vacancy.company)) {
    throw new Error("vakansiya metamaydonlari yo'q: " + JSON.stringify(first.vacancy).slice(0, 200));
  }
  // Kompaniyaning ichki maydonlari nomzodga chiqmaydi
  if ("ownerUserId" in first.vacancy.company || "stir" in first.vacancy.company) {
    throw new Error("kompaniya ichki maydonlari ochiq: " + JSON.stringify(first.vacancy.company).slice(0, 200));
  }
  if (first.resume?.title !== "Frontend dasturchi") throw new Error("rezyume: " + JSON.stringify(first.resume));
  // Ish beruvchi holatni "invited" ga o'zgartirgan — tarixda haqiqiy yozuv bor
  const last = first.statusHistory?.[first.statusHistory.length - 1];
  if (first.status !== "invited" || last?.newStatus !== "invited" || !last.createdAt) {
    throw new Error("holat tarixi: " + JSON.stringify(first.statusHistory));
  }
});

await check("arizalar faqat egasiga ko'rinadi (boshqa nomzod — bo'sh, ish beruvchi — 403)", async () => {
  const other = await post("/api/auth/register", {
    email: "seeker2@test.uz", password: "parol12345", role: "job_seeker", firstName: "Boshqa", lastName: "Nomzod",
  });
  const mine = await j("/api/applications", { headers: { authorization: `Bearer ${other.body.accessToken}` } });
  if (mine.status !== 200 || !Array.isArray(mine.body) || mine.body.length !== 0) {
    throw new Error("begona arizalar ko'rindi: " + mine.status + " " + JSON.stringify(mine.body).slice(0, 200));
  }
  const employer = await j("/api/applications", { headers: { authorization: `Bearer ${employerToken}` } });
  if (employer.status !== 403) throw new Error("ish beruvchi: " + employer.status);
  const guest = await j("/api/applications");
  if (guest.status !== 401) throw new Error("mehmon: " + guest.status);
});

await check("saqlangan vakansiyalar: javob shakli va faqat egasiga (ichki maydonlarsiz)", async () => {
  const mine = await j("/api/favorites", { headers: { authorization: `Bearer ${seekerToken}` } });
  const item = mine.body.items?.[0];
  if (mine.status !== 200 || mine.body.items?.length !== 1 || item.id !== vacancyId) {
    throw new Error("ro'yxat: " + mine.status + " " + JSON.stringify(mine.body).slice(0, 200));
  }
  if (!item.favoritedAt || typeof item.isClosed !== "boolean" || !item.company?.name || !("logoUrl" in item.company)) {
    throw new Error("maydonlar: " + JSON.stringify(item).slice(0, 300));
  }
  if ("ownerUserId" in item.company || "stir" in item.company || "description" in item) {
    throw new Error("ichki maydonlar chiqdi: " + Object.keys(item.company).join(","));
  }
  const other = await post("/api/auth/login", { email: "seeker2@test.uz", password: "parol12345" });
  const theirs = await j("/api/favorites", { headers: { authorization: `Bearer ${other.body.accessToken}` } });
  if (theirs.status !== 200 || theirs.body.items?.length !== 0) throw new Error("begona saqlanganlar: " + JSON.stringify(theirs.body).slice(0, 200));
  const employer = await j("/api/favorites", { headers: { authorization: `Bearer ${employerToken}` } });
  if (employer.status !== 403) throw new Error("ish beruvchi: " + employer.status);
  const guest = await j("/api/favorites");
  if (guest.status !== 401) throw new Error("mehmon: " + guest.status);
});

await check("bildirishnomalar: faqat egasiga (begona o'qish/o'chirish — 403), tashqi havola yo'q, hammasini o'qish, o'chirish", async () => {
  const auth = { headers: { authorization: `Bearer ${seekerToken}` } };
  const list = await j("/api/notifications?limit=100", auth);
  const first = list.body.items?.[0];
  if (list.status !== 200 || !first || typeof list.body.unreadCount !== "number") {
    throw new Error("ro'yxat: " + list.status + " " + JSON.stringify(list.body).slice(0, 200));
  }
  const other = await post("/api/auth/login", { email: "seeker2@test.uz", password: "parol12345" });
  const otherAuth = { headers: { authorization: `Bearer ${other.body.accessToken}` } };
  const theirs = await j("/api/notifications?limit=100", otherAuth);
  if ((theirs.body.items ?? []).some((n) => n.id === first.id)) throw new Error("begona bildirishnoma ko'rindi");
  const readForeign = await post(`/api/notifications/${first.id}/read`, {}, other.body.accessToken);
  if (readForeign.status !== 403) throw new Error("begona o'qish: " + readForeign.status);
  const delForeign = await j(`/api/notifications/${first.id}`, { method: "DELETE", ...otherAuth });
  if (delForeign.status !== 403) throw new Error("begona o'chirish: " + delForeign.status);

  // payload.url "//host" — tashqi sayt, ro'yxatda havola bo'lmasligi kerak
  const owner = await prisma.notification.findUnique({ where: { id: first.id }, select: { userId: true } });
  const evil = await prisma.notification.create({
    data: { userId: owner.userId, type: "system", title: "Tashqi havola", body: "test", payload: { url: "//evil.example/x" } },
  });
  const withEvil = await j("/api/notifications?limit=100", auth);
  const evilItem = withEvil.body.items.find((n) => n.id === evil.id);
  if (!evilItem || evilItem.url !== null) throw new Error("tashqi havola o'tib ketdi: " + JSON.stringify(evilItem));

  const all = await post("/api/notifications/read-all", {}, seekerToken);
  const count = await j("/api/notifications/unread-count", auth);
  if (all.status !== 200 || count.body.count !== 0) throw new Error("hammasini o'qish: " + JSON.stringify(count.body));
  const del = await j(`/api/notifications/${evil.id}`, { method: "DELETE", ...auth });
  const after = await j("/api/notifications?limit=100", auth);
  if (del.status !== 200 || after.body.items.some((n) => n.id === evil.id)) throw new Error("o'chirish: " + del.status);
  const guest = await j("/api/notifications");
  if (guest.status !== 401) throw new Error("mehmon: " + guest.status);
});

await prisma.$disconnect();
server.kill("SIGTERM");
await sleep(1500);

if (failed > 0) console.error("\nServer loglari (oxirgi 30 qator):\n" + log.split("\n").slice(-30).join("\n"));
console.log(failed === 0 ? "\nHAMMASI O'TDI" : `\n${failed} TA XATO`);
process.exit(failed === 0 ? 0 : 1);
