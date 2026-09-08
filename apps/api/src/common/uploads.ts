import fs from "node:fs";
import path from "node:path";
import { env } from "./env.js";

/**
 * Yuklangan fayllar (kompaniya logosi, PDF rezyume) papkasi.
 *
 * Railway'da konteyner fayl tizimi VAQTINCHALIK: har deployda tozalanadi.
 * Shuning uchun prodda Volume ulab, uning yo'lini `UPLOAD_DIR` ga bering
 * (masalan `/data/uploads`). Bo'sh qoldirilsa loyiha papkasidagi `uploads/`
 * ishlatiladi — dev uchun qulay, prod uchun emas.
 */
export const UPLOAD_DIR = env.UPLOAD_DIR
  ? path.resolve(env.UPLOAD_DIR)
  : path.join(process.cwd(), "uploads");

/** Papka mavjudligini ta'minlaydi (yozishdan oldin chaqiriladi). */
export function ensureUploadDir(): void {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
