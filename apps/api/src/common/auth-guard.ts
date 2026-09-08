import type { FastifyReply, FastifyRequest } from "fastify";
import { Errors, AppError } from "./errors.js";
import { prisma } from "./prisma.js";
import { verifyAccessToken, type AccessTokenPayload } from "./jwt.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: AccessTokenPayload;
  }
}

export async function requireAuth(req: FastifyRequest, _reply: FastifyReply) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) throw Errors.unauthorized();

  try {
    req.user = verifyAccessToken(token);
  } catch {
    throw Errors.unauthorized("Token yaroqsiz yoki muddati tugagan");
  }
}

export function requireRole(...roles: AccessTokenPayload["role"][]) {
  return async (req: FastifyRequest, _reply: FastifyReply) => {
    if (!req.user) throw Errors.unauthorized();
    if (!roles.includes(req.user.role)) throw Errors.forbidden();
  };
}

/**
 * Kalit amallar (ariza, vakansiya, xabar) uchun — telefon Telegram orqali
 * tasdiqlangan bo'lishi shart. Bu soxta arizalar va spamning oldini oladi.
 */
export async function requirePhoneVerified(req: FastifyRequest, _reply: FastifyReply) {
  if (!req.user) throw Errors.unauthorized();
  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: { isPhoneVerified: true },
  });
  if (!user?.isPhoneVerified) {
    throw new AppError(
      403,
      "PHONE_NOT_VERIFIED",
      "Bu amalni bajarish uchun avval Telegram orqali telefon raqamingizni tasdiqlang. Bu soxta arizalar va spamning oldini olish uchun kerak."
    );
  }
}
