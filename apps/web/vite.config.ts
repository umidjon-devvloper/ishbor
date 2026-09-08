import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vike from "vike/plugin";

// Xavfsizlik sarlavhalari — HTML hujjatni beruvchi web server uchun
// (Lighthouse Best Practices: COOP, X-Frame-Options, nosniff).
// Prod'da haqiqiy server (nginx va h.k.) shu sarlavhalarni o'zi qo'yishi kerak.
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export default defineConfig({
  plugins: [react(), vike()],
  server: {
    port: 5173,
    strictPort: true,
    headers: SECURITY_HEADERS,
  },
  preview: {
    // 3000 (API) va 5173 (dev) bilan to'qnashmasin
    port: 4173,
    strictPort: true,
    headers: SECURITY_HEADERS,
  },
  // Eslatma: bu yerda `manualChunks` bor edi va u /lib/i18n/messages* ni BITTA
  // "i18n-messages" chunk'iga yopishtirardi. Endi har til alohida modul
  // (messages.uz/ru/en.ts) va dinamik import qilinadi — bundler ularni o'zi
  // alohida chunk qiladi, faqat kerakli til tarmoqdan keladi. Qo'lda
  // guruhlash aynan shu bo'linishni buzardi, shuning uchun olib tashlandi.
});
