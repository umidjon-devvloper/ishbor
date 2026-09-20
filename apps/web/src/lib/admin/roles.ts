/**
 * Jamoa rollari (UI tomoni). Haqiqiy tekshiruv serverda — bu yerda faqat qaysi
 * bo'lim va tugma chizilishi hal qilinadi.
 *
 *   admin           — SUPER_ADMIN: butun panel, jamoa, maqolani o'chirish
 *   content_editor  — maqolalar: tahrirlash, ko'rib chiqish, chop etish
 *   content_author  — o'z qoralamalari, ko'rib chiqishga yuborish
 */
export const STAFF_ROLES = ["admin", "content_editor", "content_author"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return typeof role === "string" && (STAFF_ROLES as readonly string[]).includes(role);
}

export function isEditorRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "content_editor";
}
