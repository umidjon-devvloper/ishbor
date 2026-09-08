import argon2 from "argon2";
import { prisma } from "./prisma.js";
import { env } from "./env.js";

/**
 * Birinchi admin hisobini yaratadi.
 *
 * `.env` da ADMIN_EMAIL va ADMIN_PASSWORD berilgan bo'lsa:
 *  - shunday email bilan foydalanuvchi bo'lmasa — admin sifatida yaratiladi;
 *  - mavjud bo'lsa va roli admin bo'lmasa — roli adminga ko'tariladi.
 *
 * Paroli hech qachon qayta yozilmaydi (server har ko'tarilganda parolni
 * tiklab yuborishi xavfsiz emas). Parolni unutgan bo'lsangiz —
 * ADMIN_PASSWORD ni o'zgartirib, avval hisobni bazadan o'chiring.
 */
export async function ensureAdminUser(log?: {
  info: (o: unknown, m?: string) => void;
  warn: (o: unknown, m?: string) => void;
}): Promise<void> {
  const email = env.ADMIN_EMAIL.trim().toLowerCase();
  if (!email) return;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "admin") {
      await prisma.user.update({ where: { id: existing.id }, data: { role: "admin" } });
      log?.info({ email }, "Mavjud foydalanuvchi admin roliga ko'tarildi");
    }
    return;
  }

  if (env.ADMIN_PASSWORD.length < 8) {
    log?.warn(
      { email },
      "ADMIN_EMAIL berilgan, lekin ADMIN_PASSWORD yo'q yoki 8 belgidan qisqa — admin yaratilmadi"
    );
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await argon2.hash(env.ADMIN_PASSWORD),
      role: "admin",
      isEmailVerified: true,
    },
  });
  log?.info({ email }, "Admin hisobi yaratildi");
}
