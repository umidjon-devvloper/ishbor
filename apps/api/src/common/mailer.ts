import nodemailer, { type Transporter } from "nodemailer";
import { env, features } from "./env.js";

/**
 * Email yuborish qatlami.
 *
 * SMTP sozlanmagan bo'lsa (SMTP_HOST bo'sh) — xat yuborilmaydi, faqat konsolga
 * yoziladi. Shunday qilib dev muhitda hech narsa sindirmaydi va prodda
 * .env to'ldirilishi bilan o'zi ishlab ketadi.
 */

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!features.email) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {}),
    });
  }
  return transporter;
}

export interface MailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/** Xatni yuboradi. Xatolik yuzaga kelsa faqat log — chaqiruvchi oqim buzilmaydi. */
export async function sendMail(input: MailInput): Promise<boolean> {
  const tx = getTransporter();
  if (!tx) {
    console.log(`[mail:o'chiq] ${input.to} — ${input.subject}`);
    return false;
  }
  try {
    await tx.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? stripHtml(input.html),
    });
    return true;
  } catch (e) {
    console.warn("[mail] yuborilmadi:", (e as Error).message);
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Sayt brendiga mos oddiy HTML shablon. Email mijozlari (Gmail, Outlook)
 * tashqi CSS'ni tashlab yuboradi — shuning uchun barcha uslub inline.
 */
export function renderEmail(options: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  footerNote?: string;
}): string {
  const { title, body, ctaLabel, ctaHref, footerNote } = options;
  const cta =
    ctaLabel && ctaHref
      ? `<tr><td style="padding:24px 32px 0">
           <a href="${esc(ctaHref)}" style="display:inline-block;background:#1f6feb;color:#ffffff;
              text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:15px">
             ${esc(ctaLabel)}
           </a>
         </td></tr>`
      : "";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e6e8eb">
        <tr><td style="padding:28px 32px 0">
          <div style="font-size:20px;font-weight:700;letter-spacing:-.02em;color:#0d1117">
            ISH <span style="color:#1f6feb">BOR</span><span style="color:#d9a441">!</span>
          </div>
        </td></tr>
        <tr><td style="padding:20px 32px 0">
          <h1 style="margin:0;font-size:19px;line-height:1.35;color:#0d1117">${esc(title)}</h1>
        </td></tr>
        <tr><td style="padding:12px 32px 0;font-size:15px;line-height:1.6;color:#3d444d">${body}</td></tr>
        ${cta}
        <tr><td style="padding:28px 32px 24px">
          <hr style="border:none;border-top:1px solid #e6e8eb;margin:0 0 14px">
          <p style="margin:0;font-size:12px;line-height:1.5;color:#8b949e">
            ${esc(footerNote ?? "Bu xat ISH BOR! saytidagi sozlamalaringiz bo'yicha yuborildi.")}
            <br>Xabarnomalarni profil sahifasidan o'chirishingiz mumkin.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export { esc as escapeHtml };
