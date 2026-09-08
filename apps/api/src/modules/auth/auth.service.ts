import crypto from "node:crypto";
import argon2 from "argon2";
import { prisma } from "../../common/prisma.js";
import { Errors, AppError } from "../../common/errors.js";
import { env } from "../../common/env.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../common/jwt.js";
import { uniqueSlug } from "../../common/slug.js";

interface RegisterInput {
  email: string;
  password: string;
  role: "job_seeker" | "employer";
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

/**
 * Email har doim kichik harfda saqlanadi va taqqoslanadi. Aks holda
 * "Ali@mail.uz" bilan ro'yxatdan o'tgan odam "ali@mail.uz" bilan kira olmasdi
 * va bir xil pochtaga ikkita hisob ochilib ketardi.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(input: RegisterInput) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw Errors.conflict("Bu email bilan foydalanuvchi allaqachon mavjud");

  const passwordHash = await argon2.hash(input.password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: input.role,
      ...(input.role === "job_seeker"
        ? {
            jobSeekerProfile: {
              create: {
                firstName: input.firstName ?? "",
                lastName: input.lastName ?? "",
              },
            },
          }
        : {}),
    },
  });

  // Ish beruvchi ro'yxatdan o'tishda kompaniya nomini kiritsa — kompaniya darrov yaratiladi
  if (user.role === "employer" && input.companyName?.trim()) {
    const name = input.companyName.trim();
    await prisma.company.create({
      data: { ownerUserId: user.id, name, slug: uniqueSlug(name, "kompaniya") },
    });
  }

  return issueTokens(user.id, user.role);
}

/**
 * Admin bloklagan hisob seans ocha olmaydi. Tekshiruv seans berish nuqtalarida
 * turadi (login / refresh / Telegram / Google) — har bir so'rovda emas, aks holda
 * har bir API chaqiruvi ortiqcha DB o'qishiga aylanardi. Access token qisqa
 * muddatli bo'lgani uchun blok amalda bir necha daqiqada kuchga kiradi.
 */
function assertNotBlocked(user: { isBlocked: boolean }) {
  if (user.isBlocked) {
    throw new AppError(
      403,
      "USER_BLOCKED",
      "Hisobingiz vaqtincha bloklangan. Sabab va tiklash uchun qo'llab-quvvatlash xizmatiga murojaat qiling."
    );
  }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
  if (!user) throw Errors.unauthorized("Email yoki parol noto'g'ri");

  const valid = await argon2.verify(user.passwordHash, password);
  if (!valid) throw Errors.unauthorized("Email yoki parol noto'g'ri");
  assertNotBlocked(user);

  return issueTokens(user.id, user.role);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { jobSeekerProfile: { select: { firstName: true, lastName: true } } },
  });
  if (!user) throw Errors.unauthorized();
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.jobSeekerProfile?.firstName ?? null,
    lastName: user.jobSeekerProfile?.lastName ?? null,
  };
}

export async function refreshSession(refreshToken: string) {
  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Errors.unauthorized("Refresh token yaroqsiz");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw Errors.unauthorized();
  assertNotBlocked(user);

  return issueTokens(user.id, user.role);
}

function issueTokens(userId: string, role: "job_seeker" | "employer" | "admin") {
  return {
    accessToken: signAccessToken({ sub: userId, role }),
    refreshToken: signRefreshToken({ sub: userId }),
  };
}

/** Telegram bot orqali tasdiqlangan foydalanuvchiga seans ochish. */
export async function telegramLogin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Errors.unauthorized();
  assertNotBlocked(user);
  return issueTokens(user.id, user.role);
}

interface GoogleTokenInfo {
  aud?: string;
  email?: string;
  email_verified?: string;
  given_name?: string;
  family_name?: string;
  exp?: string;
}

/**
 * Google ID token'ni Google'ning o'zida tekshiramiz (tokeninfo) — qo'shimcha
 * kutubxonasiz. aud bizning CLIENT_ID'ga mos va email tasdiqlangan bo'lishi shart.
 */
async function verifyGoogleCredential(credential: string): Promise<GoogleTokenInfo> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );
  if (!res.ok) throw Errors.unauthorized("Google token yaroqsiz");
  const info = (await res.json()) as GoogleTokenInfo;
  if (info.aud !== env.GOOGLE_CLIENT_ID) throw Errors.unauthorized("Google token boshqa ilovaga tegishli");
  if (info.email_verified !== "true" || !info.email) {
    throw Errors.unauthorized("Google email tasdiqlanmagan");
  }
  return info;
}

export async function googleLogin(credential: string, role?: "job_seeker" | "employer") {
  const info = await verifyGoogleCredential(credential);
  const email = normalizeEmail(info.email!);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    assertNotBlocked(existing);
    return issueTokens(existing.id, existing.role);
  }

  // Hisob yo'q: rol berilmagan bo'lsa (login sahifasi) — ro'yxatdan o'tishga yo'naltiramiz
  if (!role) {
    throw new AppError(404, "NEED_SIGNUP", "Bu Google hisobi bilan foydalanuvchi topilmadi. Avval ro'yxatdan o'ting.");
  }

  // Google foydalanuvchisida parol yo'q — tasodifiy hash saqlanadi
  // (parol bilan kira olmaydi; xohlasa keyin tiklash orqali o'rnatadi).
  const passwordHash = await argon2.hash(crypto.randomBytes(32).toString("hex"));
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      isEmailVerified: true,
      ...(role === "job_seeker"
        ? {
            jobSeekerProfile: {
              create: {
                firstName: info.given_name ?? "",
                lastName: info.family_name ?? "",
              },
            },
          }
        : {}),
    },
  });
  return issueTokens(user.id, user.role);
}
