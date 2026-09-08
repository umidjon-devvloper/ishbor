// ============================================================
// Deploydan oldingi tekshiruv (uchdan-uchgacha).
//
// Haqiqiy MongoDB ustida `dist/server.js` ni ko'taradi va asosiy oqimlarni
// HTTP orqali tekshiradi: ro'yxatdan o'tish, seans cookie'si, vakansiya,
// ariza, chat, sharh, admin paneli, CORS, sitemap, OG rasm, tarif limiti.
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

// Startup bootstrap fonda ishlaydi — kataloglar to'lishini kutamiz
for (let i = 0; i < 40; i++) {
  const { body } = await j("/api/regions");
  if (body?.items?.length > 0) break;
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

await check("GET /api/vacancies/:slug (ko'rishlar +1)", async () => {
  const { status, body } = await j(`/api/vacancies/${vacancySlug}`);
  if (status !== 200 || body.slug !== vacancySlug) throw new Error(status + " " + JSON.stringify(body).slice(0, 200));
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

await check("robots.txt va sitemap sayt domeniga ishora qiladi", async () => {
  const robots = (await j("/robots.txt")).body;
  if (!robots.includes("Sitemap: https://sayt.example/sitemap.xml")) throw new Error(robots.slice(0, 200));
  const sm = (await j("/sitemap-vacancy.xml")).body;
  if (!sm.includes(`https://sayt.example/vacancy/${vacancySlug}`)) throw new Error(sm.slice(0, 300));
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

await prisma.$disconnect();
server.kill("SIGTERM");
await sleep(1500);

if (failed > 0) console.error("\nServer loglari (oxirgi 30 qator):\n" + log.split("\n").slice(-30).join("\n"));
console.log(failed === 0 ? "\nHAMMASI O'TDI" : `\n${failed} TA XATO`);
process.exit(failed === 0 ? 0 : 1);
